import { Router, Request, Response } from 'express';
import pool from '../db';
import { unipileService, LINKEDIN_REACTION_TYPES, LinkedinReactionType } from '../services/unipile';
import { enrichPost } from '../services/engagement';
import { PostModel } from '../models/post';
import { CreatorModel } from '../models/creator';
import { maybeTick, capturePostSnapshot } from '../services/postMonitor';
import { generateComments, generateSupportiveComments } from '../services/commentGenerator';
import { CommenterProfileModel } from '../models/commenterProfile';
import { sendToGoogleChat, detectOwner } from '../services/googleChat';
import { captureAccountSnapshots } from '../services/accountSnapshots';
import { extractViewerTimestamps } from '../utils/wvmp';
import { generateReply } from '../services/replyGenerator';
import { runFollowerSync, getFollowerSyncProgress } from '../services/followerSync';

const router = Router();

// Parse the date range from a request that supports both styles:
//   - new style: ?start_date=2026-04-01&end_date=2026-05-25 (inclusive on both ends)
//   - legacy:    ?days=30                                  (last N days, ending today)
// Returns { startDate, endDate } as YYYY-MM-DD strings + a derived
// `days` for endpoints that still want a single-number version (delta
// comparison vs previous period in /analytics). Both bounds are clamped
// to a sane max of 730 days to keep queries cheap.
function parseDateRange(req: Request): { startDate: string; endDate: string; days: number } {
  const startDateRaw = typeof req.query.start_date === 'string' ? req.query.start_date.trim() : '';
  const endDateRaw = typeof req.query.end_date === 'string' ? req.query.end_date.trim() : '';
  const ISO = /^\d{4}-\d{2}-\d{2}$/;

  if (ISO.test(startDateRaw) && ISO.test(endDateRaw)) {
    const start = new Date(`${startDateRaw}T00:00:00.000Z`);
    const end = new Date(`${endDateRaw}T00:00:00.000Z`);
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const clamped = Math.min(diffDays, 730);
    return { startDate: startDateRaw, endDate: endDateRaw, days: clamped };
  }

  const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 730);
  const today = new Date();
  const start = new Date(today.getTime() - (days - 1) * 86400000);
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return { startDate: fmt(start), endDate: fmt(today), days };
}

// Fetch only NEW posts for a managed creator and seed an initial snapshot
// from the data we already pulled, INSIDE this function — no second
// getPosts round-trip, no capturePostSnapshot follow-up call.
//
// The Refresh button in the Accounts UI uses this. Its only job is to
// surface a post the user just published. Continuous tracking of
// existing posts is handled by the postMonitor tick (every 15 min, with
// per-age cadence inside the 7-day window), so this function deliberately
// skips:
//   - forceLiveCapture / re-snapshotting historical posts
//   - capturePostSnapshot (would re-fetch getPosts and rebuild outlier_ratio
//     for every post in the creator — pure waste on a refresh click)
//   - recalculateOutliers (also handled by the tick; one new post barely
//     moves the average and the tick will pick it up within minutes)
//
// Total Unipile calls per click: 1 getProfile + 1 getProfileViewers (the
// account snapshot — followers + WVMP) + 1 getPosts (incremental, stops
// at the first known id). With one new post, that's still ~3 HTTP calls
// instead of the 5 the old path made.
async function scrapeCreatorPosts(creatorId: string): Promise<{ scraped: number; snapshots_seeded: number }> {
  const t0 = Date.now();
  const creator = await CreatorModel.findById(creatorId);
  if (!creator) return { scraped: 0, snapshots_seeded: 0 };
  const accountIdOverride = (creator as any).unipile_account_id as string | null;
  if (!accountIdOverride) return { scraped: 0, snapshots_seeded: 0 };

  // skipViewers: the WVMP profile-views fetch pages LinkedIn up to 20x and
  // is the single biggest cost of a refresh (20-40s/account). The button is
  // for surfacing a new post, so we only need a fast follower snapshot here;
  // WVMP stays owned by the 6h tick + the profile-views refresh button.
  const snapStart = Date.now();
  const snap = await captureAccountSnapshots(creatorId, { skipViewers: true });
  console.log(`[scrapeCreatorPosts] ${creator.name}: account snapshot (followers, no WVMP) ${Date.now() - snapStart}ms`);
  const providerId = snap.providerId;

  if (!providerId) return { scraped: 0, snapshots_seeded: 0 };

  const { rows: knownRows } = await pool.query(
    `SELECT linkedin_post_id FROM posts
      WHERE creator_id = $1 AND linkedin_post_id IS NOT NULL`,
    [creatorId]
  );
  const knownIds = new Set<string>(knownRows.map((r: any) => String(r.linkedin_post_id)));

  const postsStart = Date.now();
  const rawPosts = await unipileService.getPosts(providerId, undefined, accountIdOverride, knownIds);
  console.log(`[scrapeCreatorPosts] ${creator.name}: getPosts (incremental) ${Date.now() - postsStart}ms, ${rawPosts.length} raw`);
  const originalPosts = rawPosts.filter((raw: any) => {
    if (raw.type === 'repost' || raw.type === 'RESHARE' || raw.type === 'reshare') return false;
    if (raw.is_repost || raw.is_reshare) return false;
    if (raw.reshared_post || raw.original_post) return false;
    return true;
  });
  if (originalPosts.length === 0) {
    await CreatorModel.update(creator.id, { last_scraped_at: new Date() } as any);
    return { scraped: 0, snapshots_seeded: 0 };
  }

  const posts = originalPosts.map((raw) => {
    const normalized = unipileService.normalizePost(raw, creator.id);
    const enriched = enrichPost(normalized);
    return { ...normalized, ...enriched };
  });

  await PostModel.bulkUpsert(posts);
  await CreatorModel.update(creator.id, { last_scraped_at: new Date() } as any);

  // Seed the first snapshot for each newly-discovered post from the data
  // we just downloaded — INSERT only, no extra Unipile calls. Lookup the
  // DB id by linkedin_post_id in one query, then build values inline.
  const newLinkedinIds = posts.map((p: any) => p.linkedin_post_id).filter(Boolean);
  let seededCount = 0;
  if (newLinkedinIds.length > 0) {
    const { rows: idRows } = await pool.query(
      `SELECT id, linkedin_post_id
         FROM posts
        WHERE creator_id = $1 AND linkedin_post_id = ANY($2::text[])`,
      [creatorId, newLinkedinIds]
    );
    const idByLinkedinId = new Map<string, string>();
    for (const r of idRows) idByLinkedinId.set(String(r.linkedin_post_id), String(r.id));

    for (const p of posts as any[]) {
      const internalId = idByLinkedinId.get(String(p.linkedin_post_id));
      if (!internalId) continue;
      try {
        await pool.query(
          `INSERT INTO post_snapshots (post_id, impressions_count, likes_count, comments_count, reposts_count)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            internalId,
            p.impressions_count ?? null,
            p.likes_count ?? 0,
            p.comments_count ?? 0,
            p.reposts_count ?? 0,
          ]
        );
        seededCount++;
      } catch (err: any) {
        console.error(`[scrapeCreatorPosts] seed snapshot failed for ${internalId}:`, err?.message);
      }
    }
  }

  console.log(`[scrapeCreatorPosts] ${creator.name}: TOTAL ${Date.now() - t0}ms (${posts.length} new posts, ${seededCount} snapshots seeded)`);
  return { scraped: posts.length, snapshots_seeded: seededCount };
}

// GET /api/accounts — list all creators flagged as managed accounts, with summary stats
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        c.id, c.name, c.headline, c.profile_image_url, c.followers_count,
        c.location, c.last_scraped_at, c.is_managed, c.unipile_account_id, c.linkedin_id,
        COUNT(p.id)::int AS total_posts,
        COUNT(p.id) FILTER (WHERE p.is_outlier = TRUE)::int AS total_outliers,
        COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement,
        COALESCE(MAX(p.engagement_score)::int, 0) AS max_engagement,
        MAX(p.published_at) AS last_post_at
       FROM creators c
       LEFT JOIN posts p ON p.creator_id = c.id AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
       WHERE c.is_managed = TRUE
       GROUP BY c.id
       ORDER BY avg_engagement DESC`
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/candidates — all creators with is_managed flag, for the manager panel
router.get('/candidates', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, headline, profile_image_url, followers_count, is_managed
       FROM creators
       ORDER BY is_managed DESC, name ASC`
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/accounts/:id — toggle is_managed and/or set unipile_account_id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { is_managed, unipile_account_id } = req.body;
    const sets: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (typeof is_managed === 'boolean') {
      sets.push(`is_managed = $${idx++}`);
      values.push(is_managed);
    }
    if (unipile_account_id !== undefined) {
      const trimmed = typeof unipile_account_id === 'string' ? unipile_account_id.trim() : null;
      sets.push(`unipile_account_id = $${idx++}`);
      values.push(trimmed || null);
    }
    if (sets.length === 0) {
      return res.status(400).json({ error: 'Provide is_managed or unipile_account_id' });
    }

    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE creators SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, is_managed, unipile_account_id`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/follower-history?creator_id=xxx&days=90
//
// Returns one point per captured day with BOTH the cumulative total
// (`followers`) and the net new followers that day (`gained`). The chart
// plots `gained` — "followers won per day" is far more actionable than a
// slowly-rising cumulative line.
//
// `gained` is computed per creator with a window LAG over that creator's
// own snapshot history (so a gap of N days lumps the growth on the next
// captured day rather than corrupting other creators), THEN summed across
// creators for the combined view. Deltas are derived over ALL history and
// only filtered to the window afterwards, so the first in-window day still
// gets a correct delta against the snapshot just before the window.
router.get('/follower-history', async (req: Request, res: Response) => {
  try {
    const creatorId = (req.query.creator_id as string) || null;
    const range = parseDateRange(req);

    const params: any[] = [];
    let creatorFilter = 'c.is_managed = TRUE';
    if (creatorId) {
      params.push(creatorId);
      creatorFilter = `s.creator_id = $${params.length}`;
    }

    // deltas: per-creator gained = followers_count - prior snapshot's count.
    // windowed: keep only the requested range. combined: sum per day.
    params.push(range.startDate, range.endDate);
    const startIdx = params.length - 1;
    const endIdx = params.length;
    const { rows } = await pool.query(
      `WITH deltas AS (
         SELECT
           s.creator_id,
           s.captured_on,
           s.followers_count,
           s.followers_count - LAG(s.followers_count) OVER (
             PARTITION BY s.creator_id ORDER BY s.captured_on ASC
           ) AS gained
         FROM creator_follower_snapshots s
         JOIN creators c ON c.id = s.creator_id
        WHERE ${creatorFilter}
       )
       SELECT
         captured_on::text AS day,
         SUM(followers_count)::int AS followers,
         COALESCE(SUM(gained), 0)::int AS gained
       FROM deltas
       WHERE captured_on >= $${startIdx}::date AND captured_on <= $${endIdx}::date
       GROUP BY captured_on
       ORDER BY captured_on ASC`,
      params
    );
    res.json({ points: rows });
  } catch (err: any) {
    console.error('[accounts/follower-history]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/follower-monthly?creator_id=xxx&months=12
//
// Net new followers per calendar month. For each creator we take the LAST
// snapshot in each month (its end-of-month total) and diff against the
// previous month's end-of-month total — that's the followers genuinely
// won that month. Combined view sums each creator's monthly gain so a
// gap in one account never distorts the other.
//
// Data is preserved indefinitely in creator_follower_snapshots (we never
// delete rows), so this stays reconstructable even if LinkedIn changes
// what it surfaces.
router.get('/follower-monthly', async (req: Request, res: Response) => {
  try {
    const creatorId = (req.query.creator_id as string) || null;
    const range = parseDateRange(req);

    const params: any[] = [];
    let creatorFilter = 'c.is_managed = TRUE';
    if (creatorId) {
      params.push(creatorId);
      creatorFilter = `s.creator_id = $${params.length}`;
    }

    // For each (creator, month) take BOTH the first and last snapshot of
    // the month. A month's gain = its end total − the previous month's end
    // total. For the very FIRST tracked month there is no previous month,
    // so we fall back to that month's own first snapshot — i.e. "followers
    // gained during the portion of the month we actually tracked". This
    // makes April show up (its tracked half) instead of being dropped for
    // lacking a prior month to diff against.
    params.push(range.startDate, range.endDate);
    const startIdx = params.length - 1;
    const endIdx = params.length;
    const { rows } = await pool.query(
      `WITH month_bounds AS (
         SELECT
           s.creator_id,
           date_trunc('month', s.captured_on) AS month,
           (ARRAY_AGG(s.followers_count ORDER BY s.captured_on ASC))[1]  AS first_count,
           (ARRAY_AGG(s.followers_count ORDER BY s.captured_on DESC))[1] AS last_count
         FROM creator_follower_snapshots s
         JOIN creators c ON c.id = s.creator_id
        WHERE ${creatorFilter}
        GROUP BY s.creator_id, date_trunc('month', s.captured_on)
       ),
       month_delta AS (
         SELECT
           creator_id,
           month,
           last_count - COALESCE(
             LAG(last_count) OVER (PARTITION BY creator_id ORDER BY month ASC),
             first_count
           ) AS gained
         FROM month_bounds
       )
       SELECT
         to_char(month, 'YYYY-MM') AS month,
         COALESCE(SUM(gained), 0)::int AS gained
       FROM month_delta
       WHERE month >= date_trunc('month', $${startIdx}::date)
         AND month <= date_trunc('month', $${endIdx}::date)
       GROUP BY month
       ORDER BY month ASC`,
      params
    );
    res.json({ points: rows });
  } catch (err: any) {
    console.error('[accounts/follower-monthly]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/impressions-monthly?creator_id=xxx&months=12
//
// Total impressions of posts PUBLISHED in each calendar month. LinkedIn
// doesn't expose a standalone monthly-impressions metric, and post
// snapshots only cover the first 7 days of a post's life, so the only
// faithful aggregate we can build is "lifetime impressions of content
// published that month" — i.e. all of a post's impressions are credited
// to its publish month. Impressions only flow for the authenticated
// (managed) accounts' own posts, which is exactly this scope.
router.get('/impressions-monthly', async (req: Request, res: Response) => {
  try {
    const creatorId = (req.query.creator_id as string) || null;
    const range = parseDateRange(req);

    const params: any[] = [];
    let scopeSql = `p.creator_id IN (SELECT id FROM creators WHERE is_managed = TRUE)`;
    if (creatorId) {
      params.push(creatorId);
      scopeSql = `p.creator_id = $${params.length}`;
    }

    params.push(range.startDate, range.endDate);
    const startIdx = params.length - 1;
    const endIdx = params.length;
    const { rows } = await pool.query(
      `SELECT
         to_char(date_trunc('month', p.published_at), 'YYYY-MM') AS month,
         COALESCE(SUM(p.impressions_count), 0)::bigint AS impressions,
         COUNT(*)::int AS posts
       FROM posts p
       WHERE ${scopeSql}
         AND p.published_at IS NOT NULL
         AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
         AND p.published_at >= date_trunc('month', $${startIdx}::date)
         AND p.published_at < date_trunc('month', $${endIdx}::date) + interval '1 month'
       GROUP BY date_trunc('month', p.published_at)
       ORDER BY date_trunc('month', p.published_at) ASC`,
      params
    );
    res.json({ points: rows.map((r) => ({ ...r, impressions: Number(r.impressions) })) });
  } catch (err: any) {
    console.error('[accounts/impressions-monthly]', err);
    res.status(500).json({ error: err.message });
  }
});

// /api/accounts/wvmp-capture-now — runs captureAccountSnapshots() for every
// managed account RIGHT NOW and returns whether each insert succeeded. Use
// this to backfill today's snapshot without waiting for the daily scrape,
// AND to surface insert errors that the previous silent-warn version was
// swallowing. Hit it once per deploy fix to verify the row landed.
//
// Accepts both GET and POST so it can be triggered from the browser address
// bar (debug-only endpoint, no user-facing side effect beyond an idempotent
// upsert into the snapshot table).
const wvmpCaptureNow = async (_req: Request, res: Response) => {
  try {
    const { rows: managed } = await pool.query(
      `SELECT id, name FROM creators WHERE is_managed = TRUE AND unipile_account_id IS NOT NULL ORDER BY name ASC`
    );
    const results = [];
    for (const row of managed) {
      try {
        const r = await captureAccountSnapshots(row.id);
        // Verify the row actually landed by re-reading it.
        const stored = await pool.query(
          `SELECT views_count, captured_at
             FROM creator_profile_view_snapshots
            WHERE creator_id = $1 AND captured_on = CURRENT_DATE`,
          [row.id]
        );
        results.push({
          creator_id: row.id,
          creator_name: row.name,
          live_views: r.views,
          pages_walked: r.pages,
          views_error: r.viewsError,
          stored_today: stored.rows[0] || null,
        });
      } catch (err: any) {
        results.push({
          creator_id: row.id,
          creator_name: row.name,
          fatal_error: err.message,
        });
      }
    }
    res.json({ count: results.length, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
router.get('/wvmp-capture-now', wvmpCaptureNow);
router.post('/wvmp-capture-now', wvmpCaptureNow);

// GET /api/accounts/wvmp-debug-all — runs the live WVMP fetch for EVERY
// managed account and returns one debug record per account. Saves the user
// from looking up UUIDs by hand. Same shape as /:id/wvmp-debug per entry.
router.get('/wvmp-debug-all', async (_req: Request, res: Response) => {
  try {
    const { rows: managed } = await pool.query(
      `SELECT id, name, unipile_account_id
         FROM creators
        WHERE is_managed = TRUE
          AND unipile_account_id IS NOT NULL
        ORDER BY name ASC`
    );

    const buildShape = (raw: any) => ({
      top_keys: raw && typeof raw === 'object' ? Object.keys(raw).slice(0, 10) : [],
      data_keys: raw?.data && typeof raw.data === 'object' ? Object.keys(raw.data).slice(0, 10) : [],
      data_data_keys: raw?.data?.data && typeof raw.data.data === 'object' ? Object.keys(raw.data.data).slice(0, 10) : [],
      paging_total: raw?.data?.data?.premiumDashAnalyticsObjectByAnalyticsEntity?.paging?.total
        ?? raw?.data?.premiumDashAnalyticsObjectByAnalyticsEntity?.paging?.total
        ?? raw?.premiumDashAnalyticsObjectByAnalyticsEntity?.paging?.total
        ?? null,
      first_element_keys: (() => {
        const root =
          raw?.data?.data?.premiumDashAnalyticsObjectByAnalyticsEntity ??
          raw?.data?.premiumDashAnalyticsObjectByAnalyticsEntity ??
          raw?.premiumDashAnalyticsObjectByAnalyticsEntity ??
          null;
        const els = Array.isArray(root?.elements) ? root.elements : [];
        return els.length > 0 && typeof els[0] === 'object' ? Object.keys(els[0]).slice(0, 15) : [];
      })(),
    });

    const results = [];
    for (const row of managed) {
      const wvmp = await unipileService.getProfileViewers(row.unipile_account_id);
      const lastStored = await pool.query(
        `SELECT captured_on::text AS day, views_count
           FROM creator_profile_view_snapshots
          WHERE creator_id = $1
          ORDER BY captured_on DESC
          LIMIT 5`,
        [row.id]
      );
      results.push({
        creator_id: row.id,
        creator_name: row.name,
        unipile_account_id: row.unipile_account_id,
        live_wvmp: wvmp == null ? null : {
          parsed_count: wvmp.count,
          pages_walked: wvmp.pages,
          voyager_paging_total: wvmp.pagingTotal,
        },
        response_shape: wvmp == null ? null : buildShape(wvmp.raw),
        last_stored_snapshots: lastStored.rows,
        hint: wvmp == null
          ? 'Unipile passthrough returned an error or no body — check server logs for the [Unipile WVMP] line.'
          : wvmp.count === 0
            ? 'Live call succeeded but returned zero viewer elements. Either the queryId hash rotated, the connected LinkedIn account is rate-limited, or the response shape changed.'
            : 'WVMP is returning data. If the chart is still empty, check that the daily scrape is running and inserting snapshots.',
      });
    }

    res.json({ count: results.length, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/:id/wvmp-debug — runs the live WVMP fetch for one creator
// and dumps everything we get back so we can see why profile-view tracking
// returns nothing for an account. Surfaces the parsed count, page count,
// paging.total Voyager reports, the response keys at each candidate path,
// and the latest stored snapshot. Hit it with the creator UUID:
//   GET /api/accounts/<uuid>/wvmp-debug
router.get('/:id/wvmp-debug', async (req: Request, res: Response) => {
  try {
    const creator = await CreatorModel.findById(req.params.id as string);
    if (!creator) return res.status(404).json({ error: 'Creator not found' });
    const accountIdOverride = (creator as any).unipile_account_id as string | null;
    if (!accountIdOverride) {
      return res.status(400).json({ error: 'Creator has no unipile_account_id set' });
    }

    const wvmp = await unipileService.getProfileViewers(accountIdOverride);
    const lastStored = await pool.query(
      `SELECT captured_on::text AS day, views_count
         FROM creator_profile_view_snapshots
        WHERE creator_id = $1
        ORDER BY captured_on DESC
        LIMIT 5`,
      [creator.id]
    );

    // Map the response shape so we can see at a glance which path Voyager
    // took without dumping the entire payload to the wire.
    const raw = wvmp?.raw;
    const shape = {
      top_keys: raw && typeof raw === 'object' ? Object.keys(raw).slice(0, 10) : [],
      data_keys: raw?.data && typeof raw.data === 'object' ? Object.keys(raw.data).slice(0, 10) : [],
      data_data_keys: raw?.data?.data && typeof raw.data.data === 'object' ? Object.keys(raw.data.data).slice(0, 10) : [],
      paging_total: raw?.data?.data?.premiumDashAnalyticsObjectByAnalyticsEntity?.paging?.total
        ?? raw?.data?.premiumDashAnalyticsObjectByAnalyticsEntity?.paging?.total
        ?? raw?.premiumDashAnalyticsObjectByAnalyticsEntity?.paging?.total
        ?? null,
      first_element_keys: (() => {
        const root =
          raw?.data?.data?.premiumDashAnalyticsObjectByAnalyticsEntity ??
          raw?.data?.premiumDashAnalyticsObjectByAnalyticsEntity ??
          raw?.premiumDashAnalyticsObjectByAnalyticsEntity ??
          null;
        const els = Array.isArray(root?.elements) ? root.elements : [];
        return els.length > 0 && typeof els[0] === 'object' ? Object.keys(els[0]).slice(0, 15) : [];
      })(),
    };

    res.json({
      creator_id: creator.id,
      creator_name: creator.name,
      unipile_account_id: accountIdOverride,
      // null = the API call itself failed (logged to server console).
      // Anything else = we got a response back; check parsed_count + shape
      // to see whether it's actually carrying viewer data or a paywall.
      live_wvmp: wvmp == null ? null : {
        parsed_count: wvmp.count,
        pages_walked: wvmp.pages,
        voyager_paging_total: wvmp.pagingTotal,
      },
      response_shape: wvmp == null ? null : shape,
      last_stored_snapshots: lastStored.rows,
      hint: wvmp == null
        ? 'Unipile passthrough returned an error or no body — check server logs for the [Unipile WVMP] line. Most common: queryId hash rotated or the connected account has zero Premium access.'
        : wvmp.count === 0
          ? 'Live call succeeded but returned zero viewer elements. This is the LinkedIn-free-tier signature (WVMP is gated behind Premium / Sales Navigator). Confirm the account has Premium or Sales Nav active; without it LinkedIn does not return real WVMP data through any client.'
          : 'WVMP is returning data. If the chart is still empty, check that the daily scrape is running and inserting into creator_profile_view_snapshots.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper — for the scoped creator(s), compute per-day viewer counts by
// taking MAX across all snapshots that captured that day.
//
// Rationale: LinkedIn's WVMP feed is a rolling window. If we used only
// the latest snapshot, viewers that fell off LinkedIn's trailing edge
// since the prior capture would disappear from our chart too. By taking
// MAX over every snapshot's bucket for each (creator, day), we keep the
// highest count we ever recorded for that day — so older days stay
// truthful even as LinkedIn rotates viewers out of its feed.
//
// Returns a Map<dayKey, totalViewers> where total = sum across creators
// of MAX-per-snapshot for that creator/day.
async function buildDailyViewerBuckets(
  creatorId: string | null,
  days: number
): Promise<Map<string, number>> {
  const params: any[] = [];
  let creatorFilter = 'c.is_managed = TRUE';
  if (creatorId) {
    params.push(creatorId);
    creatorFilter = `s.creator_id = $${params.length}`;
  }
  // Pull every snapshot (across history). We need ALL of them, not just
  // those captured within `days`, because a snapshot captured weeks ago
  // may still be the only record of a viewer event whose day-bucket falls
  // inside the requested window (the snapshot captured the rolling window
  // around that day, including its events).
  const { rows: snapshots } = await pool.query(
    `SELECT s.creator_id, s.viewer_timestamps
       FROM creator_profile_view_snapshots s
       JOIN creators c ON c.id = s.creator_id
      WHERE ${creatorFilter}
        AND s.viewer_timestamps IS NOT NULL
        AND array_length(s.viewer_timestamps, 1) > 0`,
    params
  );

  const now = Date.now();
  const windowStart = now - days * 86400_000;
  const dayKey = (ms: number) => {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  };

  // perCreatorDay = creator_id → (dayKey → MAX count seen across that
  // creator's snapshots). MAX, not sum: the same viewer captured today
  // and again tomorrow would otherwise be counted twice.
  const perCreatorDay = new Map<string, Map<string, number>>();
  for (const snap of snapshots) {
    const ts: number[] | null = snap.viewer_timestamps;
    if (!Array.isArray(ts)) continue;
    const snapBucket = new Map<string, number>();
    for (const raw of ts) {
      const ms = typeof raw === 'string' ? Number(raw) : raw;
      if (!Number.isFinite(ms) || ms < windowStart || ms > now + 86400_000) continue;
      const key = dayKey(ms);
      snapBucket.set(key, (snapBucket.get(key) || 0) + 1);
    }
    let creatorMap = perCreatorDay.get(snap.creator_id);
    if (!creatorMap) {
      creatorMap = new Map<string, number>();
      perCreatorDay.set(snap.creator_id, creatorMap);
    }
    for (const [k, v] of snapBucket) {
      const prev = creatorMap.get(k) || 0;
      if (v > prev) creatorMap.set(k, v);
    }
  }

  // Combine across creators — sum per day. A human who viewed both
  // managed profiles on the same day counts twice (it IS two views).
  const combined = new Map<string, number>();
  for (const creatorMap of perCreatorDay.values()) {
    for (const [k, v] of creatorMap) {
      combined.set(k, (combined.get(k) || 0) + v);
    }
  }
  return combined;
}

// GET /api/accounts/profile-view-history?creator_id=xxx&days=90
//
// "New profile viewers per day" — bucketed from the per-viewer viewedAt
// timestamps stored on each WVMP snapshot. Counts daily traffic in a way
// that survives LinkedIn rotating viewers out of its rolling feed: we
// MAX across all stored snapshots per (creator, day) instead of trusting
// only the latest capture. See buildDailyViewerBuckets for the details.
router.get('/profile-view-history', async (req: Request, res: Response) => {
  try {
    const creatorId = (req.query.creator_id as string) || null;
    const range = parseDateRange(req);

    // buildDailyViewerBuckets only needs a "look-back window in days"
    // (the underlying snapshots store raw viewer timestamps and we bucket
    // them client-side). When end_date < today we still pass enough
    // days to cover from startDate up to today, then filter the iteration
    // window below so only requested days are returned.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const startDay = new Date(`${range.startDate}T00:00:00.000Z`);
    const endDay = new Date(`${range.endDate}T00:00:00.000Z`);
    const daysFromTodayBack = Math.max(
      1,
      Math.round((today.getTime() - startDay.getTime()) / 86400000) + 1
    );
    const dayBuckets = await buildDailyViewerBuckets(creatorId, daysFromTodayBack);

    const out: { day: string; views: number }[] = [];
    for (let d = new Date(startDay); d.getTime() <= endDay.getTime(); d.setUTCDate(d.getUTCDate() + 1)) {
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      out.push({ day: key, views: dayBuckets.get(key) || 0 });
    }

    res.json({ points: out });
  } catch (err: any) {
    console.error('[accounts/profile-view-history]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/profile-views/debug
// Per managed creator: live-fetches WVMP (paginated) and reports how many
// viewers Unipile actually returns vs. what's stored, with a sample of viewer
// timestamps. Use this to confirm that both accounts are returning fresh data
// when the chart looks frozen.
router.get('/profile-views/debug', async (_req: Request, res: Response) => {
  try {
    const { rows: managed } = await pool.query(
      `SELECT id, name, unipile_account_id, linkedin_url
         FROM creators
        WHERE is_managed = TRUE
        ORDER BY name`
    );

    const out: any[] = [];
    for (const c of managed) {
      const latestQ = await pool.query(
        `SELECT captured_on::text AS captured_on, captured_at, views_count, raw_response
           FROM creator_profile_view_snapshots
          WHERE creator_id = $1
          ORDER BY captured_at DESC
          LIMIT 1`,
        [c.id]
      );
      const latest = latestQ.rows[0] ?? null;
      const storedTimestamps = latest?.raw_response
        ? extractViewerTimestamps(latest.raw_response)
        : [];

      let live: any = null;
      if (c.unipile_account_id) {
        const wvmp = await unipileService.getProfileViewers(c.unipile_account_id);
        if (wvmp) {
          const liveTimestamps = extractViewerTimestamps(wvmp.raw);
          liveTimestamps.sort((a, b) => b - a); // newest first
          // First element of the feed, raw — lets us see which fields the
          // current LinkedIn schema actually carries the timestamp under
          // when the extractor returns zero matches.
          const firstEl: any =
            wvmp.raw?.data?.data?.premiumDashAnalyticsObjectByAnalyticsEntity?.elements?.[0] ??
            wvmp.raw?.data?.premiumDashAnalyticsObjectByAnalyticsEntity?.elements?.[0] ??
            wvmp.raw?.premiumDashAnalyticsObjectByAnalyticsEntity?.elements?.[0] ??
            null;
          live = {
            count: wvmp.count,
            pages: wvmp.pages,
            paging_total: wvmp.pagingTotal,
            timestamps_extracted: liveTimestamps.length,
            sample_recent_viewers: liveTimestamps.slice(0, 5).map((ms) => new Date(ms).toISOString()),
            first_element_keys: firstEl && typeof firstEl === 'object' ? Object.keys(firstEl) : null,
            first_element_sample: firstEl,
          };
        }
      }

      out.push({
        creator_id: c.id,
        name: c.name,
        has_unipile_account_id: !!c.unipile_account_id,
        unipile_account_id_preview: c.unipile_account_id
          ? `${String(c.unipile_account_id).slice(0, 6)}…${String(c.unipile_account_id).slice(-4)}`
          : null,
        latest_snapshot: latest
          ? {
              captured_on: latest.captured_on,
              captured_at: latest.captured_at,
              views_count: latest.views_count,
              timestamps_in_raw: storedTimestamps.length,
            }
          : null,
        live,
      });
    }

    res.json({ creators: out });
  } catch (err: any) {
    console.error('[accounts/profile-views/debug]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/profile-views/refresh
// Forces a fresh follower + WVMP snapshot for every managed creator with a
// Unipile account_id, ignoring whether today's snapshot already exists
// (the upsert overwrites the row). Used by the daily ticker, and also wired
// into the UI button so the chart can be refreshed on demand without doing
// a full post re-scrape.
router.post('/profile-views/refresh', async (_req: Request, res: Response) => {
  try {
    const { rows: managed } = await pool.query(
      `SELECT id FROM creators WHERE is_managed = TRUE AND unipile_account_id IS NOT NULL`
    );
    const results: any[] = [];
    for (const { id } of managed) {
      try {
        const r = await captureAccountSnapshots(id);
        results.push({ creator_id: id, ...r });
      } catch (err: any) {
        results.push({ creator_id: id, ok: false, error: err?.message });
      }
    }
    res.json({ refreshed: results.length, results });
  } catch (err: any) {
    console.error('[accounts/profile-views/refresh]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/profile-views/refresh
// Forces a fresh follower + WVMP snapshot for every managed creator with a
// Unipile account_id, ignoring whether today's snapshot already exists
// (the upsert overwrites the row). Used by the daily ticker, and also wired
// into the UI button so the chart can be refreshed on demand without doing
// a full post re-scrape.
router.post('/profile-views/refresh', async (_req: Request, res: Response) => {
  try {
    const { rows: managed } = await pool.query(
      `SELECT id FROM creators WHERE is_managed = TRUE AND unipile_account_id IS NOT NULL`
    );
    const results: any[] = [];
    for (const { id } of managed) {
      try {
        const r = await captureAccountSnapshots(id);
        results.push({ creator_id: id, ...r });
      } catch (err: any) {
        results.push({ creator_id: id, ok: false, error: err?.message });
      }
    }
    res.json({ refreshed: results.length, results });
  } catch (err: any) {
    console.error('[accounts/profile-views/refresh]', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accounts/posts/:id/snapshots/zero-impressions
//
// Cleanup for "bogus zero" snapshots. A snapshot is bogus when:
//   - impressions_count is NULL or 0, AND
//   - there exists an EARLIER snapshot for the same post with impressions > 0.
//
// Engagement (likes/comments/reposts) staying flat or growing across those
// rows is the giveaway that Unipile returned a partial/glitched payload
// while we were polling. Rows like that drag the impressions line back to
// zero and ruin the chart.
//
// The earlier "after last_real only" rule missed interior zeros — i.e. a
// bad snapshot surrounded by good ones on either side. The new logic
// catches both trailing AND interior cases, while still preserving the
// legitimate `impressions=0` at the very start of a post's life (no prior
// real snapshot exists at that point, so the rule doesn't fire).
//
// Idempotent — running twice is safe (the second run finds nothing).
router.delete('/posts/:id/snapshots/zero-impressions', async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;
    const { rows: anchor } = await pool.query(
      `SELECT MIN(captured_at) AS first_real
         FROM post_snapshots
        WHERE post_id = $1
          AND impressions_count IS NOT NULL
          AND impressions_count > 0`,
      [postId]
    );
    const firstReal = anchor[0]?.first_real;
    if (!firstReal) {
      return res.json({ deleted: 0, reason: 'no real impressions snapshot found — nothing to clean up against' });
    }
    const { rowCount } = await pool.query(
      `DELETE FROM post_snapshots
        WHERE post_id = $1
          AND captured_at > $2
          AND (impressions_count IS NULL OR impressions_count = 0)`,
      [postId, firstReal]
    );
    res.json({ deleted: rowCount ?? 0, anchor_first_real: firstReal });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/posts/:id/refresh — force a single-post snapshot now.
// Mirrors the bulk live-refresh button but scoped to one post, so the user
// can pull fresh numbers for just the post they're staring at without
// waiting on every monitored creator. Idempotent: re-hitting it captures
// another snapshot row, which is fine — those are the time-series points.
router.post('/posts/:id/refresh', async (req: Request, res: Response) => {
  try {
    const result = await capturePostSnapshot(req.params.id as string);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/:id/scrape — re-scrape posts using this account's unipile_account_id
// so impressions come through (LinkedIn only returns impressions for the authenticated account).
router.post('/:id/scrape', async (req: Request, res: Response) => {
  try {
    const creator = await CreatorModel.findById(req.params.id as string);
    if (!creator) return res.status(404).json({ error: 'Creator not found' });
    if (!(creator as any).unipile_account_id) {
      return res.status(400).json({ error: 'Set a Unipile account ID for this creator first' });
    }
    const result = await scrapeCreatorPosts(creator.id);
    res.json(result);
  } catch (err: any) {
    console.error('[accounts/scrape]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/analytics?creator_id=xxx&days=90
// If creator_id is omitted, aggregates across all managed accounts.
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const creatorId = (req.query.creator_id as string) || null;
    const range = parseDateRange(req);
    const days = range.days;

    const currentStartIso = `${range.startDate}T00:00:00.000Z`;
    const currentEndIso = `${range.endDate}T23:59:59.999Z`;
    // Previous period of equal length, ending right before the current
    // period starts. Used for the deltas in KPI cards.
    const previousStartIso = new Date(
      new Date(currentStartIso).getTime() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    // Build scope: either a specific creator or all managed accounts.
    // Queries use <SCOPE> as a placeholder so each query can append its own params.
    // Demo posts are always excluded so analytics reflect real activity only.
    const scope = (nextIdx: number) => {
      const demoFilter = `p.linkedin_post_id <> 'DEMO_LIVE_POST'`;
      if (creatorId) return { sql: `p.creator_id = $${nextIdx} AND ${demoFilter}`, params: [creatorId] };
      return { sql: `p.creator_id IN (SELECT id FROM creators WHERE is_managed = TRUE) AND ${demoFilter}`, params: [] };
    };

    const totalsSql = (dateCondition: string, baseParams: any[]) => {
      const s = scope(baseParams.length + 1);
      return {
        sql: `SELECT
          COUNT(*)::int AS total_posts,
          COUNT(*) FILTER (WHERE p.is_outlier = TRUE)::int AS total_outliers,
          COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement,
          COALESCE(ROUND(MAX(p.engagement_score))::int, 0) AS max_engagement,
          COALESCE(SUM(p.likes_count)::int, 0) AS total_likes,
          COALESCE(SUM(p.comments_count)::int, 0) AS total_comments,
          COALESCE(SUM(p.reposts_count)::int, 0) AS total_reposts,
          COALESCE(SUM(p.impressions_count), 0)::bigint AS total_impressions,
          COUNT(*) FILTER (WHERE p.impressions_count IS NOT NULL)::int AS posts_with_impressions,
          COALESCE(ROUND(AVG(p.impressions_count) FILTER (WHERE p.impressions_count IS NOT NULL))::int, 0) AS avg_impressions
         FROM posts p
         WHERE ${dateCondition} AND ${s.sql}`,
        params: [...baseParams, ...s.params],
      };
    };

    // Current-period totals
    const currentTotals = totalsSql('p.published_at >= $1 AND p.published_at <= $2', [currentStartIso, currentEndIso]);
    const totalsQ = await pool.query(currentTotals.sql, currentTotals.params);

    // Previous-period totals (same length immediately before current)
    const prevTotals = totalsSql('p.published_at >= $1 AND p.published_at < $2', [previousStartIso, currentStartIso]);
    const prevTotalsQ = await pool.query(prevTotals.sql, prevTotals.params);

    const deltaPct = (curr: number, prev: number): number | null => {
      if (!prev || prev === 0) return null;
      return +(((curr - prev) / prev) * 100).toFixed(1);
    };

    const buildComparison = (curr: any, prev: any) => ({
      avg_engagement: { current: curr.avg_engagement, previous: prev.avg_engagement, delta_pct: deltaPct(curr.avg_engagement, prev.avg_engagement) },
      total_posts: { current: curr.total_posts, previous: prev.total_posts, delta_pct: deltaPct(curr.total_posts, prev.total_posts) },
      total_outliers: { current: curr.total_outliers, previous: prev.total_outliers, delta_pct: deltaPct(curr.total_outliers, prev.total_outliers) },
      total_likes: { current: curr.total_likes, previous: prev.total_likes, delta_pct: deltaPct(curr.total_likes, prev.total_likes) },
      total_comments: { current: curr.total_comments, previous: prev.total_comments, delta_pct: deltaPct(curr.total_comments, prev.total_comments) },
      total_reposts: { current: curr.total_reposts, previous: prev.total_reposts, delta_pct: deltaPct(curr.total_reposts, prev.total_reposts) },
      total_impressions: { current: Number(curr.total_impressions), previous: Number(prev.total_impressions), delta_pct: deltaPct(Number(curr.total_impressions), Number(prev.total_impressions)) },
      avg_impressions: { current: curr.avg_impressions, previous: prev.avg_impressions, delta_pct: deltaPct(curr.avg_impressions, prev.avg_impressions) },
    });

    // Gap-filled daily series with 7-day rolling sum of total engagement.
    // generate_series builds every day in range, LEFT JOIN fills zeros,
    // window function smooths the line so it's not all spikes. The top
    // post per day is carried through so the chart tooltip can show a
    // preview + link for days with publications.
    // First two params are the inclusive [start, end] of the requested
    // window; scope params follow.
    const dailyScope = scope(3);
    const dailyQ = await pool.query(
      `WITH day_series AS (
        SELECT generate_series($1::date, $2::date, '1 day'::interval)::date AS day
      ),
      daily_raw AS (
        SELECT
          (p.published_at)::date AS day,
          COUNT(*)::int AS posts,
          COUNT(*) FILTER (WHERE p.is_outlier = TRUE)::int AS outliers,
          COALESCE(ROUND(SUM(p.engagement_score))::int, 0) AS total_engagement,
          COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement,
          COALESCE(SUM(p.impressions_count), 0)::bigint AS total_impressions
        FROM posts p
        WHERE p.published_at >= $1 AND p.published_at <= $2 AND ${dailyScope.sql}
        GROUP BY (p.published_at)::date
      ),
      day_post_arrays AS (
        -- All posts published on each day, agg'd as a JSON array so the
        -- chart can render ONE pencil per post (grouped by creator)
        -- instead of a single "top post" badge that hid same-day
        -- publications from the other managed account.
        SELECT
          (p.published_at)::date AS day,
          json_agg(
            json_build_object(
              'id', p.id,
              'preview', COALESCE(p.content_text, p.hook_text),
              'url', p.post_url,
              'outlier_ratio', p.outlier_ratio,
              'is_outlier', p.is_outlier,
              'creator_id', p.creator_id,
              'creator_name', c.name
            ) ORDER BY p.engagement_score DESC
          ) AS day_posts
        FROM posts p
        JOIN creators c ON c.id = p.creator_id
        WHERE p.published_at >= $1 AND p.published_at <= $2 AND ${dailyScope.sql}
        GROUP BY (p.published_at)::date
      ),
      filled AS (
        SELECT
          ds.day,
          COALESCE(dr.posts, 0) AS posts,
          COALESCE(dr.outliers, 0) AS outliers,
          COALESCE(dr.total_engagement, 0) AS total_engagement,
          COALESCE(dr.avg_engagement, 0) AS avg_engagement,
          COALESCE(dr.total_impressions, 0) AS total_impressions,
          dpa.day_posts
        FROM day_series ds
        LEFT JOIN daily_raw dr ON dr.day = ds.day
        LEFT JOIN day_post_arrays dpa ON dpa.day = ds.day
      )
      SELECT
        day::text AS day,
        posts,
        outliers,
        total_engagement,
        avg_engagement,
        total_impressions::bigint AS total_impressions,
        SUM(total_engagement) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)::int AS rolling_sum_7d,
        SUM(total_impressions) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)::bigint AS rolling_impressions_7d,
        SUM(posts) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)::int AS active_posts_7d,
        COALESCE(day_posts, '[]'::json) AS day_posts
      FROM filled
      ORDER BY day ASC`,
      [currentStartIso, currentEndIso, ...dailyScope.params]
    );

    // Content type mix with avg engagement per type
    const formatScope = scope(3);
    const formatQ = await pool.query(
      `SELECT
        p.content_type,
        COUNT(*)::int AS count,
        COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement,
        COUNT(*) FILTER (WHERE p.is_outlier = TRUE)::int AS outliers
       FROM posts p
       WHERE p.published_at >= $1 AND p.published_at <= $2 AND ${formatScope.sql}
       GROUP BY p.content_type
       ORDER BY count DESC`,
      [currentStartIso, currentEndIso, ...formatScope.params]
    );

    // Top posts — sorted by outlier_ratio DESC (the multiplier vs. each
    // creator's own baseline), engagement_score as a tiebreaker for posts
    // without a ratio yet. The frontend paginates this list with a
    // "ver más" button, so we serve a generous LIMIT instead of the
    // previous 10 — keeps the payload bounded but lets the user dig
    // beyond the very top of the ranking when the range is wide.
    const topScope = scope(3);
    const topPostsQ = await pool.query(
      `SELECT
        p.id, p.content_text, p.content_type, p.published_at,
        p.likes_count, p.comments_count, p.reposts_count, p.impressions_count,
        p.engagement_score, p.outlier_ratio, p.is_outlier,
        p.post_url, p.hook_text,
        c.name AS creator_name, c.profile_image_url AS creator_image
       FROM posts p
       JOIN creators c ON c.id = p.creator_id
       WHERE p.published_at >= $1 AND p.published_at <= $2 AND ${topScope.sql}
       ORDER BY p.outlier_ratio DESC NULLS LAST, p.engagement_score DESC
       LIMIT 50`,
      [currentStartIso, currentEndIso, ...topScope.params]
    );

    // Hook type distribution
    const hookScope = scope(3);
    const hookQ = await pool.query(
      `SELECT
        p.hook_type,
        COUNT(*)::int AS count,
        COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement
       FROM posts p
       WHERE p.published_at >= $1 AND p.published_at <= $2 AND ${hookScope.sql} AND p.hook_type IS NOT NULL
       GROUP BY p.hook_type
       ORDER BY avg_engagement DESC`,
      [currentStartIso, currentEndIso, ...hookScope.params]
    );

    // Account-level deltas across the same date range. We track followers
    // and profile views as daily snapshots in dedicated tables — for the
    // KPI cards we just want last - first per creator, summed when scope
    // is 'all'. Window functions over the snapshot rows give us the first
    // and last value for each creator without N+1 subqueries.
    const buildSnapshotDelta = async (table: string, valueCol: string): Promise<number> => {
      const params: any[] = [range.startDate, range.endDate];
      let creatorFilter = '';
      if (creatorId) {
        params.push(creatorId);
        creatorFilter = `AND s.creator_id = $${params.length}`;
      }
      const { rows } = await pool.query(
        `SELECT
           COALESCE(SUM(last_v - first_v), 0)::int AS gained
         FROM (
           SELECT DISTINCT
             s.creator_id,
             FIRST_VALUE(s.${valueCol}) OVER (PARTITION BY s.creator_id ORDER BY s.captured_on ASC) AS first_v,
             FIRST_VALUE(s.${valueCol}) OVER (PARTITION BY s.creator_id ORDER BY s.captured_on DESC) AS last_v
           FROM ${table} s
           JOIN creators c ON c.id = s.creator_id
           WHERE c.is_managed = TRUE
             AND s.captured_on >= $1::date
             AND s.captured_on <= $2::date
             ${creatorFilter}
         ) sub`,
        params
      );
      return Number(rows[0]?.gained || 0);
    };
    const followersGained = await buildSnapshotDelta('creator_follower_snapshots', 'followers_count');

    // Profile-views KPI used to be `last - first` of the rolling-feed size,
    // which is misleading. Now we share the bucketing logic with the chart
    // (buildDailyViewerBuckets) so KPI and chart agree by construction —
    // both MAX across snapshots per (creator, day) and sum the resulting
    // per-day counts within the selected window. buildDailyViewerBuckets
    // still takes a single look-back days arg, so we pass enough days to
    // reach back to range.startDate, then filter the resulting bucket map
    // to the requested window before summing.
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);
    const startUtc = new Date(`${range.startDate}T00:00:00.000Z`);
    const endUtc = new Date(`${range.endDate}T00:00:00.000Z`);
    const buckLookback = Math.max(1, Math.round((todayUtc.getTime() - startUtc.getTime()) / 86400000) + 1);
    const dailyBuckets = await buildDailyViewerBuckets(creatorId, buckLookback);
    let profileViewsGained = 0;
    for (const [key, v] of dailyBuckets.entries()) {
      const d = new Date(`${key}T00:00:00.000Z`).getTime();
      if (d >= startUtc.getTime() && d <= endUtc.getTime()) profileViewsGained += v;
    }

    // Posts/week cadence — always actionable. Uses the same scope filter.
    // `days` is a sanitised integer from the route handler so it's safe to
    // interpolate directly. The previous version passed it as a positional
    // param, which collided with scope()'s $2 placeholder for creator_id and
    // crashed the whole /analytics endpoint with "invalid uuid syntax"
    // whenever a specific creator was selected — that's why every chart
    // looked combined: the request 500'd silently and useApi kept rendering
    // the last successful (all-managed) response.
    const cadenceScope = scope(3);
    const cadenceQ = await pool.query(
      `SELECT COUNT(*)::float / GREATEST(${days} / 7.0, 1) AS posts_per_week
       FROM posts p
       WHERE p.published_at >= $1 AND p.published_at <= $2 AND ${cadenceScope.sql}`,
      [currentStartIso, currentEndIso, ...cadenceScope.params]
    );
    const postsPerWeek = Number(cadenceQ.rows[0]?.posts_per_week || 0);

    // Per-account breakdown (only when aggregating across all managed)
    let perAccount: any[] = [];
    if (!creatorId) {
      const perAccountQ = await pool.query(
        `SELECT
          c.id, c.name, c.profile_image_url,
          COUNT(p.id)::int AS posts,
          COUNT(p.id) FILTER (WHERE p.is_outlier = TRUE)::int AS outliers,
          COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement,
          COALESCE(ROUND(MAX(p.outlier_ratio)::numeric, 1)::float, 0) AS max_virality,
          COALESCE(ROUND(AVG(p.outlier_ratio)::numeric, 2)::float, 0) AS avg_virality,
          COALESCE(SUM(p.impressions_count), 0)::bigint AS total_impressions,
          COALESCE(ROUND(AVG(p.impressions_count) FILTER (WHERE p.impressions_count IS NOT NULL))::int, 0) AS avg_impressions
         FROM creators c
         LEFT JOIN posts p ON p.creator_id = c.id
           AND p.published_at >= $1 AND p.published_at <= $2
           AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
         WHERE c.is_managed = TRUE
         GROUP BY c.id
         ORDER BY avg_engagement DESC`,
        [currentStartIso, currentEndIso]
      );
      perAccount = perAccountQ.rows;
    }

    res.json({
      days,
      start_date: range.startDate,
      end_date: range.endDate,
      creator_id: creatorId,
      totals: {
        ...totalsQ.rows[0],
        followers_gained: followersGained,
        profile_views_gained: profileViewsGained,
        posts_per_week: +postsPerWeek.toFixed(1),
      },
      comparison: buildComparison(totalsQ.rows[0], prevTotalsQ.rows[0]),
      daily: dailyQ.rows,
      format_mix: formatQ.rows,
      top_posts: topPostsQ.rows,
      hook_types: hookQ.rows,
      per_account: perAccount,
    });
  } catch (err: any) {
    console.error('[accounts/analytics]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/live-posts?creator_id=... — monitored posts from managed accounts.
// Includes posts from the last 7 days plus any older post that still has snapshots.
// Pass creator_id to scope to a single account; omit for all managed accounts.
router.get('/live-posts', async (req: Request, res: Response) => {
  try {
    // Opportunistic tick: the UI polls this every 2 min while the Accounts page is open,
    // which keeps snapshot cadence alive even if Railway recycles the background setInterval.
    maybeTick();
    const creatorId = (req.query.creator_id as string) || null;
    // Optional date range — when provided (passed by the Accounts page so
    // the same top-of-page date filter affects both analytics AND the live
    // posts list), we use a STRICT published_at filter and drop the
    // "snapshot_count > 0" fallback. Without it, the default 7-day window
    // OR posts with snapshots stays in place (backward compat for any
    // caller that hits this endpoint without dates).
    const startDate = (req.query.start_date as string) || null;
    const endDate = (req.query.end_date as string) || null;
    const params: any[] = [];
    let creatorFilter = '';
    if (creatorId) {
      params.push(creatorId);
      creatorFilter = `AND c.id = $${params.length}`;
    }
    let dateFilter: string;
    if (startDate && endDate) {
      params.push(`${startDate} 00:00:00`);
      const startIdx = params.length;
      params.push(`${endDate} 23:59:59`);
      const endIdx = params.length;
      dateFilter = `p.published_at >= $${startIdx} AND p.published_at <= $${endIdx}`;
    } else {
      dateFilter = `(p.published_at > NOW() - INTERVAL '7 days' OR p.snapshot_count > 0)`;
    }
    const { rows } = await pool.query(
      `WITH candidate_posts AS (
         SELECT p.*,
                (SELECT COUNT(*)::int FROM post_snapshots s WHERE s.post_id = p.id) AS snapshot_count,
                (SELECT MAX(s.captured_at) FROM post_snapshots s WHERE s.post_id = p.id) AS last_snapshot_at
         FROM posts p
         JOIN creators c ON c.id = p.creator_id
         WHERE c.is_managed = TRUE
           AND c.unipile_account_id IS NOT NULL
           AND p.published_at IS NOT NULL
           ${creatorFilter}
       )
       SELECT
         p.id, p.content_text, p.hook_text, p.content_type, p.published_at,
         p.likes_count, p.comments_count, p.reposts_count, p.impressions_count,
         p.engagement_score, p.outlier_ratio, p.is_outlier, p.post_url,
         c.id AS creator_id, c.name AS creator_name, c.profile_image_url AS creator_image,
         p.snapshot_count,
         p.last_snapshot_at,
         (NOW() - p.published_at < INTERVAL '6 hours') AS is_live,
         CASE
           WHEN NOW() - p.published_at < INTERVAL '1 hour'  THEN 'golden'
           WHEN NOW() - p.published_at < INTERVAL '6 hours' THEN 'first_wave'
           WHEN NOW() - p.published_at < INTERVAL '24 hours' THEN 'consolidation'
           WHEN NOW() - p.published_at < INTERVAL '72 hours' THEN 'long_tail'
           WHEN NOW() - p.published_at < INTERVAL '7 days'  THEN 'tail'
           ELSE 'closed'
         END AS phase
       FROM candidate_posts p
       JOIN creators c ON c.id = p.creator_id
       WHERE ${dateFilter}
       ORDER BY p.published_at DESC
       LIMIT 50`,
      params
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/live-refresh — "fetch latest" for managed accounts.
//
// Pulls only NEW posts (incremental via getPosts knownIds) and creates the
// first snapshot for each one. Does NOT re-snapshot existing posts — the
// 15-min postMonitor tick handles that with a smarter cadence (more
// frequently in the golden hour, less so after 24h), so manually refreshing
// every post on every click would just spam Unipile.
//
// Speed: each account does a fast follower snapshot + incremental getPosts
// ONLY. The slow WVMP profile-views fetch (up to 20 paginated LinkedIn
// calls = 20-40s/account) is skipped here — it's owned by the 6h tick and
// the dedicated profile-views refresh button. Accounts are processed in
// PARALLEL so Iker + Unai don't run back to back.
//
// Accepts an optional `creator_id` in the body so the UI can scope the
// refresh to the currently-selected creator instead of every managed account.
router.post('/live-refresh', async (req: Request, res: Response) => {
  try {
    const t0 = Date.now();
    const creatorId = typeof req.body?.creator_id === 'string' ? req.body.creator_id : null;
    const { rows: managed } = creatorId
      ? await pool.query(
          `SELECT id FROM creators
            WHERE id = $1
              AND is_managed = TRUE
              AND unipile_account_id IS NOT NULL`,
          [creatorId]
        )
      : await pool.query(
          `SELECT id FROM creators WHERE is_managed = TRUE AND unipile_account_id IS NOT NULL`
        );

    // Process accounts in parallel — each one is independent (its own
    // Unipile account_id), so there's no reason Iker should wait on Unai.
    const settled = await Promise.allSettled(
      managed.map(({ id }) => scrapeCreatorPosts(id))
    );
    let newPosts = 0;
    let viewSnapshots = 0;
    let captured = 0;
    settled.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        newPosts += r.value.scraped;
        viewSnapshots++;
        captured += r.value.snapshots_seeded;
      } else {
        console.error(`[accounts/live-refresh] scrape failed for ${managed[i].id}:`, r.reason?.message);
      }
    });
    console.log(`[accounts/live-refresh] TOTAL ${Date.now() - t0}ms across ${managed.length} account(s), ${newPosts} new posts`);
    res.json({
      captured,
      candidates: newPosts,
      scraped: newPosts,
      accounts: managed.length,
      view_snapshots: viewSnapshots,
    });
  } catch (err: any) {
    console.error('[accounts/live-refresh]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/demo-seed — insert a demo post + realistic snapshots so the user
// can see what the Live Posts panel looks like without waiting for fresh content.
// Idempotent: re-running replaces the previous demo. Demo post is tagged
// linkedin_post_id = 'DEMO_LIVE_POST'.
router.post('/demo-seed', async (_req: Request, res: Response) => {
  try {
    const creatorQ = await pool.query(
      `SELECT id, name FROM creators WHERE is_managed = TRUE ORDER BY created_at LIMIT 1`
    );
    if (creatorQ.rows.length === 0) {
      return res.status(400).json({ error: 'Need at least one managed creator first' });
    }
    const creator = creatorQ.rows[0];

    // Clean up any previous demo (CASCADE drops snapshots)
    await pool.query(`DELETE FROM posts WHERE linkedin_post_id = 'DEMO_LIVE_POST'`);

    // Publish 4 days ago so the panel shows the full lifecycle across phases
    const publishedAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const finalImpressions = 42000;
    const finalLikes = 980;
    const finalComments = 72;
    const finalReposts = 45;
    const engagement = finalLikes + finalComments * 2 + finalReposts * 3;

    const postInsert = await pool.query(
      `INSERT INTO posts (
         creator_id, linkedin_post_id, content_text, content_type, published_at,
         likes_count, comments_count, reposts_count, impressions_count,
         engagement_score, outlier_ratio, is_outlier, hook_text, language
       ) VALUES ($1, 'DEMO_LIVE_POST', $2, 'text', $3, $4, $5, $6, $7, $8, $9, TRUE, $10, 'es')
       RETURNING id`,
      [
        creator.id,
        'DEMO · Nadie habla del pueblo de 7.000 habitantes que exporta más que países enteros. En 60 segundos te explico por qué 👇',
        publishedAt,
        finalLikes, finalComments, finalReposts, finalImpressions,
        engagement,
        2.3,
        'DEMO · Nadie habla del pueblo de 7.000 habitantes que exporta más que países enteros.',
      ]
    );
    const postId = postInsert.rows[0].id;

    // S-curve: dense in golden hour, steep in first wave, flattening through long tail
    // Fractions chosen to match the LinkedIn distribution curve (~10% at 1h, ~40% at 6h,
    // ~70% at 24h, ~85–90% at 72h, ~98% at 7d).
    const curve: [number, number][] = [
      [10, 0.015], [25, 0.035], [40, 0.060], [55, 0.090],  // golden hour (4 snaps)
      [85, 0.14], [115, 0.19], [145, 0.24], [180, 0.29],
      [215, 0.33], [250, 0.37], [290, 0.40], [330, 0.43],
      [360, 0.45],                                          // 1–6h (9 snaps)
      [480, 0.52], [600, 0.57], [720, 0.61], [900, 0.66],
      [1080, 0.70], [1260, 0.73], [1440, 0.76],             // 6–24h (7 snaps)
      [1800, 0.80], [2160, 0.83], [2880, 0.87], [3600, 0.90],
      [4320, 0.92],                                          // 24–72h (5 snaps)
      [5760, 0.96],                                          // 4d
    ];

    for (const [mins, frac] of curve) {
      const capturedAt = new Date(publishedAt.getTime() + mins * 60 * 1000);
      await pool.query(
        `INSERT INTO post_snapshots (post_id, captured_at, impressions_count, likes_count, comments_count, reposts_count)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          postId,
          capturedAt,
          Math.round(finalImpressions * frac),
          Math.round(finalLikes * frac),
          Math.round(finalComments * frac),
          Math.round(finalReposts * frac),
        ]
      );
    }

    res.json({ post_id: postId, snapshots: curve.length });
  } catch (err: any) {
    console.error('[accounts/demo-seed]', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/accounts/demo-seed — remove the demo post
router.delete('/demo-seed', async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(`DELETE FROM posts WHERE linkedin_post_id = 'DEMO_LIVE_POST'`);
    res.json({ deleted: r.rowCount || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/posts/:id/snapshots — time-series for a single post's
// impressions/engagement growth during its first 7 days, plus the creator's
// "typical" band (p25–p75 across their other posts at the same age).
//
// The typical curve lets the UI overlay a YouTube-Studio-style gray band so
// the user can tell at a glance whether a specific post is over- or under-
// performing relative to the account's baseline at any given age.
router.get('/posts/:id/snapshots', async (req: Request, res: Response) => {
  try {
    const postQ = await pool.query(
      `SELECT p.id, p.creator_id, p.content_text, p.hook_text, p.published_at,
              p.likes_count, p.comments_count, p.reposts_count, p.impressions_count,
              p.post_url, c.name AS creator_name, c.profile_image_url AS creator_image
       FROM posts p JOIN creators c ON c.id = p.creator_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (postQ.rows.length === 0) return res.status(404).json({ error: 'Post not found' });

    const snapsQ = await pool.query(
      `SELECT captured_at, impressions_count, likes_count, comments_count, reposts_count
       FROM post_snapshots
       WHERE post_id = $1
       ORDER BY captured_at ASC`,
      [req.params.id]
    );

    // Typical curve: for each age bucket, compute p25/p50/p75 of impressions
    // and engagement across the creator's *other* posts at the same age.
    // Buckets mirror the monitor cadence (15m in golden hour, then 30m, 2h,
    // 6h, 24h) so we don't over-resolve the band where captures are sparse.
    // HAVING sample_count >= 2 — kept as low as PERCENTILE_CONT can produce
    // meaningful values. We had this at 3 before, which silently nuked the
    // typical band for any creator with a small monitored-post pool (e.g.
    // newer managed accounts where most age buckets only had 1–2 samples).
    // Two samples give a min–max range that's still informative; below that
    // the band would just be a flat line so we drop those buckets.
    const typicalQ = await pool.query(
      `WITH target AS (
         SELECT creator_id FROM posts WHERE id = $1
       ),
       other_posts AS (
         SELECT p.id, p.published_at
         FROM posts p, target t
         WHERE p.creator_id = t.creator_id
           AND p.id <> $1
           AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
           AND p.published_at IS NOT NULL
       ),
       other_snapshots AS (
         SELECT
           op.id AS post_id,
           EXTRACT(EPOCH FROM (s.captured_at - op.published_at)) / 60.0 AS age_min,
           COALESCE(s.impressions_count, 0)::int AS impressions,
           (s.likes_count + 2 * s.comments_count + 3 * s.reposts_count)::int AS engagement
         FROM other_posts op
         JOIN post_snapshots s ON s.post_id = op.id
         WHERE s.captured_at >= op.published_at
           AND s.captured_at <= op.published_at + INTERVAL '7 days'
       ),
       bucketed AS (
         SELECT
           -- Label each bucket by its MIDPOINT (not upper bound) so the
           -- typical band plots where the bucket's data "actually sits"
           -- rather than at the end of its age range. A snapshot at age 5m
           -- falls in bucket [0,15) → midpoint 7, so the gray band visually
           -- aligns with the blue snapshot point at x=5 instead of x=15.
           CASE
             WHEN age_min < 60   THEN (FLOOR(age_min / 15) * 15 + 7)::int     -- [0,60)   buckets width 15
             WHEN age_min < 360  THEN (FLOOR(age_min / 30) * 30 + 15)::int    -- [60,360) buckets width 30
             WHEN age_min < 1440 THEN (FLOOR(age_min / 120) * 120 + 60)::int  -- [6h,24h) width 120
             WHEN age_min < 4320 THEN (FLOOR(age_min / 360) * 360 + 180)::int -- [24h,72h) width 360
             ELSE (FLOOR(age_min / 1440) * 1440 + 720)::int                   -- [72h,…)  width 1440
           END AS bucket_min,
           impressions,
           engagement
         FROM other_snapshots
       )
       SELECT
         bucket_min AS "ageMin",
         COUNT(*)::int AS "sampleCount",
         ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY impressions))::int AS "p25Imp",
         ROUND(PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY impressions))::int AS "p50Imp",
         ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY impressions))::int AS "p75Imp",
         ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY engagement))::int AS "p25Eng",
         ROUND(PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY engagement))::int AS "p50Eng",
         ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY engagement))::int AS "p75Eng"
       FROM bucketed
       GROUP BY bucket_min
       HAVING COUNT(*) >= 2
       ORDER BY bucket_min ASC`,
      [req.params.id]
    );

    res.json({
      post: postQ.rows[0],
      snapshots: snapsQ.rows,
      typical: typicalQ.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Google Chat: notify teammates about a just-published post ─────────────
//
// Internal team flow: when one of us posts, we ping the group chat so
// colleagues can quickly drop a supportive comment from their own profile.
// Past iteration generated 9 different angles (some contrarian) — teammates
// found the message too long and shied away from the edgier takes, so the
// engagement on managed-account posts dropped. This trimmed flow ships only
// reinforce + warm_supportive lines, 3-5 of them (varied daily to avoid
// fatigue), all in the post's language.

// GET /api/accounts/posts/:postId/google-chat-preview
// Returns owner detection (just for the message header label) + post info +
// 3-5 supportive comments. There is NO voice/profile selection: this button
// exists only to feed our internal support network with safe, warm
// copy-paste comments — it never speaks "as Iker" or "as Unai". Dropping
// the profile lookup also makes it load noticeably faster.
router.get('/posts/:postId/google-chat-preview', async (req: Request, res: Response) => {
  try {
    const postId = req.params.postId;

    const { rows } = await pool.query(
      `SELECT p.id, p.content_text, p.post_url, p.hook_text,
              c.name AS creator_name, c.headline AS creator_headline
       FROM posts p
       JOIN creators c ON c.id = p.creator_id
       WHERE p.id = $1`,
      [postId]
    );
    const post = rows[0];
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Owner is still detected — but only to label the header
    // ("NUEVO POST IKER/UNAI"), not to pick a commenter voice.
    const ownerInfo = detectOwner(post.creator_name);

    // Randomise the count between 3 and 5 so daily messages don't feel like
    // a template. Variety reduces fatigue on the receiving side without
    // changing the underlying intent.
    const targetCount = 3 + Math.floor(Math.random() * 3);
    const rawComments = await generateSupportiveComments(
      {
        postContent: post.content_text || '',
        creatorName: post.creator_name,
        creatorHeadline: post.creator_headline || null,
        // Neutral voice on purpose — these are network-support comments any
        // teammate can paste, not a specific person's voice.
        profile: {
          headline: null,
          voice_style: null,
          worldview: null,
          signature_moves: null,
          avoid: null,
        },
      },
      targetCount
    );

    // Defensive cap per comment: prompt asks for ≤ 180 chars but models
    // overshoot occasionally. 200 chars × 5 comments + header stays well
    // under Google Chat's 4096-char per-message ceiling, so the FE never
    // has to split a single-message-per-post send into chunks.
    const PER_COMMENT_CAP = 200;
    const truncate = (s: string) => {
      const t = (s || '').trim();
      if (t.length <= PER_COMMENT_CAP) return t;
      const slice = t.slice(0, PER_COMMENT_CAP - 1);
      const lastBreak = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('? '), slice.lastIndexOf('! '), slice.lastIndexOf('\n'));
      const cutAt = lastBreak > PER_COMMENT_CAP * 0.6 ? lastBreak + 1 : slice.lastIndexOf(' ');
      return (cutAt > PER_COMMENT_CAP * 0.5 ? t.slice(0, cutAt) : slice).trimEnd() + '…';
    };
    const comments = rawComments.map(truncate);

    res.json({
      post: {
        id: post.id,
        url: post.post_url,
        hook: post.hook_text,
        content: post.content_text,
        creator_name: post.creator_name,
      },
      owner: ownerInfo.owner,
      comments,
      webhook_configured: !!process.env.GOOGLE_CHAT_WEBHOOK_URL,
    });
  } catch (err: any) {
    console.error('[google-chat-preview] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/posts/:postId/send-to-google-chat
// Body: { message: string } OR { messages: string[] } — already-composed text.
// Array form lets the frontend split a long message into several sequential
// chat messages when the total exceeds Google Chat's 4096-char per-message
// limit (we enforce 3800 to keep a safety margin).
router.post('/posts/:postId/send-to-google-chat', async (req: Request, res: Response) => {
  try {
    const webhook = process.env.GOOGLE_CHAT_WEBHOOK_URL;
    if (!webhook) {
      return res.status(400).json({ error: 'GOOGLE_CHAT_WEBHOOK_URL no está configurado en el backend.' });
    }

    // Normalise to an array so the rest of the handler is uniform.
    const body = req.body || {};
    let messages: string[];
    if (Array.isArray(body.messages)) {
      messages = body.messages.map((m: unknown) => (typeof m === 'string' ? m.trim() : '')).filter(Boolean);
    } else if (typeof body.message === 'string') {
      messages = [body.message.trim()].filter(Boolean);
    } else {
      messages = [];
    }

    if (messages.length === 0) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (messages.length > 5) {
      return res.status(400).json({ error: 'no se permiten más de 5 mensajes en una tanda' });
    }
    for (const m of messages) {
      if (m.length > 3800) {
        return res.status(400).json({ error: `un mensaje supera 3800 chars (${m.length}). Edita o usa el split.` });
      }
    }

    // Send sequentially. If one fails midway, return what succeeded so the
    // user knows partial state rather than a generic 500.
    let sent = 0;
    for (const m of messages) {
      await sendToGoogleChat(webhook, m);
      sent++;
    }

    res.json({ ok: true, sent, total: messages.length });
  } catch (err: any) {
    console.error('[send-to-google-chat] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ───────────────────────────── Replies sub-tab ─────────────────────────────
//
// Lets the user pick one of their managed-account posts and reply (in their
// own voice — Iker as Iker, Unai as Unai) to comments they haven't answered
// yet. Three endpoints:
//   GET  /posts/:postId/comments                 → list comments + grouped replies + unanswered flag
//   POST /posts/:postId/comments/:cid/generate   → AI draft reply in author's voice
//   POST /posts/:postId/comments/:cid/reply      → send the reply via Unipile
//
// Comments are NOT cached — every GET hits Unipile live. If volume becomes a
// problem we can add a creator_post_comments table; until then, freshness >
// caching complexity.

// Map a creator's stored name to the commenter_profile voice entry. The two
// managed accounts share their first name with the commenter_profile rows
// seeded in migrations ("Iker", "Unai"), so a substring match is enough and
// resilient to the post-creator's full name including surnames.
function voiceProfileNameForCreator(creatorName: string | null | undefined): 'Iker' | 'Unai' | null {
  const n = (creatorName || '').toLowerCase();
  if (n.includes('iker')) return 'Iker';
  if (n.includes('unai')) return 'Unai';
  return null;
}

// Group a flat Unipile comment list into top-level + replies, mark threads
// where the post author already replied so the UI can collapse those.
interface ThreadedComment {
  id: string;
  text: string;
  date: string | null;
  author: {
    name: string | null;
    headline: string | null;
    profile_picture_url: string | null;
    public_identifier: string | null;
    // LinkedIn member provider_id (ACoXXX form). Used as the profile_id
    // when building an @-mention in the reply — Unipile's mentions array
    // expects this exact form. Sourced from comment.author.id; may be null
    // for anonymised or company actors.
    profile_id: string | null;
  };
  replies: ThreadedComment[];
  // True iff at least one reply in this thread is from the post author
  // (matched by public_identifier === creator.linkedin_id). Set on top-level
  // comments only — nested replies are siblings of each other inside the
  // same thread.
  answered_by_author?: boolean;
}

function shapeComment(c: any): ThreadedComment {
  // Unipile's LinkedIn comment schema (confirmed against a live response,
  // 2026-06):
  //   c.author          → STRING display name (e.g. "Mario Carrillo")
  //   c.author_details  → { id, headline, profile_url, profile_picture_url,
  //                         is_company, network_distance }
  //   c.text, c.date    → body and ISO timestamp
  //   c.post_id, c.post_urn
  //   c.reply_counter, c.reaction_counter
  // Replies are returned in the same flat list with a parent_comment_id
  // pointing at their top-level. We still keep the older nested-author
  // and flat-name fallbacks below so older / company-actor payloads
  // don't regress to "Anónimo".
  const details: any = c.author_details || {};

  // Some payloads still nest the author block — fall back to it for older
  // surfaces or replies that haven't converged on the new shape.
  const sub: any =
    (typeof c.author === 'object' && c.author) ||
    c.actor ||
    c.commenter ||
    c.from ||
    c.user ||
    c.member ||
    c.poster ||
    c.profile ||
    c.entity ||
    c.attributes?.actor ||
    c.attributes?.commenter ||
    {};

  const fullName =
    (typeof c.author === 'string' && c.author.trim()) ||
    details.name ||
    details.full_name ||
    sub.name ||
    sub.full_name ||
    sub.display_name ||
    [sub.first_name, sub.last_name].filter(Boolean).join(' ').trim() ||
    c.actor_name ||
    c.commenter_name ||
    c.author_name ||
    null;

  const picture =
    details.profile_picture_url ||
    details.profile_image_url ||
    details.picture_url ||
    sub.profile_picture_url ||
    sub.profile_image_url ||
    sub.picture_url ||
    sub.image_url ||
    sub.avatar_url ||
    c.profile_picture_url ||
    null;

  const headline =
    details.headline ||
    details.occupation ||
    sub.headline ||
    sub.occupation ||
    sub.title ||
    sub.subtitle ||
    null;

  // Provider id from author_details.id (confirmed ACoXXX form, no prefix).
  // Falls through to legacy nested/flat shapes. The .replace strips
  // urn:li:<type>: prefixes so the value matches creator.linkedin_id
  // (stored bare) for the answered-by-author comparison downstream.
  const rawProfileId = String(
    details.id ||
      details.provider_id ||
      details.member_id ||
      sub.id ||
      sub.provider_id ||
      sub.profile_id ||
      sub.member_id ||
      sub.urn ||
      c.author_id ||
      c.profile_id ||
      ''
  );
  const profileId = rawProfileId
    ? rawProfileId.replace(/^urn:li:[a-z_]+:/, '')
    : null;

  // Public identifier — derive from profile_url's /in/<slug> path when the
  // payload only ships the URL (the confirmed shape does), otherwise fall
  // back to nested public_identifier / username / handle.
  let publicIdentifier: string | null = sub.public_identifier || sub.username || sub.handle || sub.slug || null;
  if (!publicIdentifier && typeof details.profile_url === 'string') {
    const m = details.profile_url.match(/linkedin\.com\/in\/([^/?#]+)/);
    if (m) publicIdentifier = m[1];
  }

  return {
    id: String(c.id || c.social_id || c.comment_id_str || ''),
    text: String(c.text || c.body || c.content || c.message || ''),
    date:
      c.date ||
      c.created_at ||
      c.parsed_datetime ||
      c.posted_at ||
      c.timestamp ||
      c.createdAt ||
      null,
    author: {
      name: fullName,
      headline,
      profile_picture_url: picture,
      public_identifier: publicIdentifier,
      profile_id: profileId,
    },
    replies: [],
  };
}

router.get('/posts/:postId/comments', async (req: Request, res: Response) => {
  try {
    const postId = req.params.postId as string;
    const postQ = await pool.query(
      `SELECT p.id, p.linkedin_post_id, p.content_text, p.creator_id,
              c.name AS creator_name, c.linkedin_id AS creator_linkedin_id,
              c.unipile_account_id
         FROM posts p
         JOIN creators c ON c.id = p.creator_id
        WHERE p.id = $1`,
      [postId]
    );
    if (postQ.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    const post = postQ.rows[0];
    if (!post.linkedin_post_id) return res.status(400).json({ error: 'Post has no LinkedIn id' });
    if (!post.unipile_account_id) return res.status(400).json({ error: 'Creator has no Unipile account_id' });

    const raw = await unipileService.getPostComments(post.linkedin_post_id, post.unipile_account_id);

    // Diagnostic: dump the full first comment shape on every request — we
    // keep hitting "Anónimo" because Unipile rotates author field names
    // and the only way to lock down the right path is to see the actual
    // payload. Heavy logging but the response is small and this only fires
    // on user-initiated thread opens.
    if (raw.length > 0) {
      const sample = raw[0];
      const json = JSON.stringify(sample).slice(0, 2000);
      console.log(`[comments/raw-sample] post=${postId} | ${json}`);
    }

    // Two-pass grouping: collect top-levels first, then attach inline
    // replies by parent_comment_id (in case Unipile ever returns them
    // mixed in the same list — which currently it does NOT, but keeping
    // the safety net is cheap).
    const byId = new Map<string, ThreadedComment>();
    const topLevel: ThreadedComment[] = [];
    const rawById = new Map<string, any>();
    for (const c of raw) {
      const id = String(c.id || c.social_id || '');
      if (!id) continue;
      rawById.set(id, c);
      const parentId = c.parent_comment_id || c.comment_id || null;
      if (!parentId) {
        const t = shapeComment(c);
        byId.set(id, t);
        topLevel.push(t);
      }
    }
    for (const c of raw) {
      const parentId = c.parent_comment_id || c.comment_id || null;
      if (!parentId) continue;
      const parent = byId.get(String(parentId));
      if (parent) parent.replies.push(shapeComment(c));
    }

    // Unipile's /comments endpoint returns only top-level by default —
    // each comment with reply_counter > 0 needs a follow-up fetch with
    // ?comment_id=<parent>. Without these, "answered by author" looks
    // unanswered even when the author already replied. Parallel fetch
    // bounded by a small concurrency cap so we don't blow Unipile's rate
    // limit on posts with dozens of threads.
    const CONCURRENCY = 6;
    const queue = topLevel.filter((t) => {
      const r = rawById.get(t.id);
      return r && Number(r.reply_counter) > 0 && t.replies.length === 0;
    });
    for (let i = 0; i < queue.length; i += CONCURRENCY) {
      const batch = queue.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (t) => {
          try {
            const replyRaw = await unipileService.getPostComments(
              post.linkedin_post_id,
              post.unipile_account_id,
              { parentCommentId: t.id }
            );
            t.replies = replyRaw.map(shapeComment);
          } catch (err: any) {
            console.warn(`[comments] reply fetch failed for ${t.id}:`, err?.message);
          }
        })
      );
    }

    // Sort: replies oldest-first inside each thread (chronological feels
    // natural in a thread view); top-levels newest-first because that's
    // what the user wants to triage.
    const tsOf = (d: string | null) => (d ? new Date(d).getTime() : 0);
    for (const t of topLevel) t.replies.sort((a, b) => tsOf(a.date) - tsOf(b.date));
    topLevel.sort((a, b) => tsOf(b.date) - tsOf(a.date));

    // Strip Voyager URN prefixes off the post author's linkedin_id so it
    // matches what shapeComment normalised on the comment side (both end
    // up as bare provider_id ACoXXX). Without this, threads where the
    // author replied still showed as unanswered.
    const authorLinkedInId: string | null = post.creator_linkedin_id
      ? String(post.creator_linkedin_id).replace(/^urn:li:[a-z_]+:/, '')
      : null;
    for (const t of topLevel) {
      // Author may have replied directly (top-level author === author) — skip
      // their own top-level comments as "answered" so they don't appear as
      // pending. Most threads we care about: someone-else top-level + has
      // (or hasn't) an author reply underneath.
      if (authorLinkedInId && t.author.profile_id === authorLinkedInId) {
        t.answered_by_author = true;
        continue;
      }
      t.answered_by_author = authorLinkedInId
        ? t.replies.some((r) => r.author.profile_id === authorLinkedInId)
        : false;
    }

    // If none of the threads have an author name, surface the raw first
    // comment in the response so we can read it from the browser and fix
    // the shape mapping without round-tripping to Railway logs. Also
    // available unconditionally via ?debug=1.
    const noNamesParsed = topLevel.length > 0 && topLevel.every((t) => !t.author.name);
    const response: any = {
      post: {
        id: post.id,
        content_text: post.content_text,
        creator_name: post.creator_name,
      },
      threads: topLevel,
      total_threads: topLevel.length,
      unanswered_threads: topLevel.filter((t) => !t.answered_by_author).length,
    };
    if (raw.length > 0 && (req.query.debug === '1' || noNamesParsed)) {
      response._debug_sample = raw[0];
    }
    res.json(response);
  } catch (err: any) {
    console.error('[accounts/comments]', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts/:postId/comments/:commentId/generate', async (req: Request, res: Response) => {
  try {
    const postId = req.params.postId as string;
    const commentId = req.params.commentId as string;
    const { comment_text, commenter_name, commenter_headline, commenter_profile_id } = req.body || {};
    if (!comment_text) return res.status(400).json({ error: 'comment_text required' });

    const postQ = await pool.query(
      `SELECT p.content_text, c.name AS creator_name
         FROM posts p
         JOIN creators c ON c.id = p.creator_id
        WHERE p.id = $1`,
      [postId]
    );
    if (postQ.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    const post = postQ.rows[0];

    const voiceName = voiceProfileNameForCreator(post.creator_name);
    if (!voiceName) {
      return res
        .status(400)
        .json({ error: `No voice profile mapped for creator "${post.creator_name}"` });
    }
    const profile = await CommenterProfileModel.getByName(voiceName);
    if (!profile) {
      return res
        .status(400)
        .json({ error: `commenter_profile entry for "${voiceName}" is missing — seed it first` });
    }

    const reply = await generateReply({
      postContent: post.content_text || '',
      commentText: String(comment_text),
      commenterName: commenter_name || null,
      commenterHeadline: commenter_headline || null,
      authorName: voiceName,
      authorVoice: {
        voice_style: profile.voice_style,
        worldview: profile.worldview,
        signature_moves: profile.signature_moves,
        avoid: profile.avoid,
      },
    });

    // Echo the commenter identity back so the frontend can pass it to /reply
    // unchanged. profile_id is the LinkedIn member provider_id (ACoXXX form)
    // Unipile uses to render an @-mention chip — same value we get back in
    // comment.author.id when we fetched the thread.
    res.json({
      reply,
      voice: voiceName,
      comment_id: commentId,
      mention: commenter_name && commenter_profile_id
        ? { name: String(commenter_name), profile_id: String(commenter_profile_id) }
        : null,
    });
  } catch (err: any) {
    console.error('[accounts/comments/generate]', err);
    res.status(500).json({ error: err.message });
  }
});

// If the reply text starts with the commenter's display name (case-insensitive
// exact prefix match), convert that prefix into a templated mention so
// Unipile renders it as a real LinkedIn @-tag. Returns the (possibly
// rewritten) text and the mentions array to send. We deliberately match
// only at position 0 — the AI is instructed to put the name there, and any
// mid-sentence occurrence the user typed is left alone (probably not a tag
// they intended).
function buildMentionedReply(
  text: string,
  mention: { name: string; profile_id: string } | null
): { text: string; mentions: { name: string; profile_id: string }[] | undefined } {
  if (!mention || !mention.name || !mention.profile_id) {
    return { text, mentions: undefined };
  }
  const name = mention.name;
  const prefix = text.slice(0, name.length);
  if (prefix.toLowerCase() !== name.toLowerCase()) {
    return { text, mentions: undefined };
  }
  const rewritten = `{{0}}${text.slice(name.length)}`;
  return { text: rewritten, mentions: [{ name, profile_id: mention.profile_id }] };
}

router.post('/posts/:postId/comments/:commentId/reply', async (req: Request, res: Response) => {
  try {
    const postId = req.params.postId as string;
    const commentId = req.params.commentId as string;
    const { text, mention } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'text required' });
    }

    const postQ = await pool.query(
      `SELECT p.linkedin_post_id, c.unipile_account_id
         FROM posts p
         JOIN creators c ON c.id = p.creator_id
        WHERE p.id = $1`,
      [postId]
    );
    if (postQ.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    const post = postQ.rows[0];
    if (!post.linkedin_post_id) return res.status(400).json({ error: 'Post has no LinkedIn id' });
    if (!post.unipile_account_id) return res.status(400).json({ error: 'Creator has no Unipile account_id' });

    const { text: finalText, mentions } = buildMentionedReply(
      text.trim(),
      mention && typeof mention === 'object' && mention.name && mention.profile_id
        ? { name: String(mention.name), profile_id: String(mention.profile_id) }
        : null
    );

    const created = await unipileService.replyToComment(
      post.linkedin_post_id,
      commentId,
      finalText,
      mentions,
      post.unipile_account_id
    );
    res.json({ ok: true, mentioned: !!mentions, created });
  } catch (err: any) {
    console.error('[accounts/comments/reply]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /posts/:postId/comments/:commentId/react — send a LinkedIn reaction
// (like / celebrate / support / love / insightful / funny) to a specific
// comment on one of our posts, via Unipile. The commentId in the route is
// the comment's LinkedIn social id, which is what Unipile's reaction
// endpoint takes as post_id (LinkedIn addresses posts and comments the
// same way).
router.post('/posts/:postId/comments/:commentId/react', async (req: Request, res: Response) => {
  try {
    const postId = req.params.postId as string;
    const commentId = req.params.commentId as string;
    const reactionType = String(req.body?.reaction_type || '').toLowerCase();
    if (!LINKEDIN_REACTION_TYPES.includes(reactionType as LinkedinReactionType)) {
      return res.status(400).json({
        error: `reaction_type must be one of: ${LINKEDIN_REACTION_TYPES.join(', ')}`,
      });
    }

    const postQ = await pool.query(
      `SELECT c.unipile_account_id
         FROM posts p
         JOIN creators c ON c.id = p.creator_id
        WHERE p.id = $1`,
      [postId]
    );
    if (postQ.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    const post = postQ.rows[0];
    if (!post.unipile_account_id) return res.status(400).json({ error: 'Creator has no Unipile account_id' });

    const result = await unipileService.addReaction(
      commentId,
      reactionType as LinkedinReactionType,
      post.unipile_account_id
    );
    res.json({ ok: true, reaction_type: reactionType, result });
  } catch (err: any) {
    console.error('[accounts/comments/react]', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────── Organic followers (Phase 1) ────────────────────────
//
// POST /api/accounts/followers/sync?creator_id=xxx  — run sync now (one creator
//   or all managed). First run per creator is a full baseline; later runs are
//   incremental diffs that classify each NEW follower as pure_follow (organic)
//   or connection.
// GET  /api/accounts/followers/sync-status          — progress + per-creator state
// GET  /api/accounts/followers/organic-history?creator_id=&days=  — daily series.

router.post('/followers/sync', async (req: Request, res: Response) => {
  try {
    const creatorId = (req.query.creator_id as string) || null;
    const result = await runFollowerSync(creatorId);
    res.json(result);
  } catch (err: any) {
    console.error('[accounts/followers/sync]', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/followers/sync-status', async (_req: Request, res: Response) => {
  try {
    // In-memory progress (current run) + DB facts (what's actually been
    // captured per creator across runs / restarts). The in-memory side
    // resets every time the server restarts, so the DB summary is what
    // tells you whether the baseline ever actually ran.
    const progress = getFollowerSyncProgress();
    const { rows: creators } = await pool.query(
      `SELECT c.id, c.name, c.unipile_account_id IS NOT NULL AS has_account_id,
              COALESCE(s.baseline_done, FALSE) AS baseline_done,
              s.baseline_count,
              s.last_synced_at,
              s.last_new_count,
              (SELECT COUNT(*)::int FROM creator_followers f
                WHERE f.creator_id = c.id) AS followers_in_db,
              (SELECT COUNT(*)::int FROM creator_followers f
                WHERE f.creator_id = c.id AND f.is_baseline = FALSE) AS new_since_baseline
         FROM creators c
         LEFT JOIN creator_follower_sync_state s ON s.creator_id = c.id
        WHERE c.is_managed = TRUE
        ORDER BY c.name`
    );
    res.json({ progress, creators });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/followers/organic-history', async (req: Request, res: Response) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 90, 365);
    const creatorId = (req.query.creator_id as string) || null;

    // Group new followers (is_baseline = FALSE) by the day we detected them,
    // split into pure_follow (organic) vs connection. Baseline rows excluded.
    const { rows } = creatorId
      ? await pool.query(
          `SELECT first_seen_on::text AS day,
                  COUNT(*) FILTER (WHERE classification = 'pure_follow')::int AS organic,
                  COUNT(*) FILTER (WHERE classification = 'connection')::int  AS connection,
                  COUNT(*)::int AS total
             FROM creator_followers
            WHERE creator_id = $1
              AND is_baseline = FALSE
              AND first_seen_on >= CURRENT_DATE - ($2 || ' days')::interval
            GROUP BY first_seen_on
            ORDER BY first_seen_on ASC`,
          [creatorId, days]
        )
      : await pool.query(
          `SELECT f.first_seen_on::text AS day,
                  COUNT(*) FILTER (WHERE f.classification = 'pure_follow')::int AS organic,
                  COUNT(*) FILTER (WHERE f.classification = 'connection')::int  AS connection,
                  COUNT(*)::int AS total
             FROM creator_followers f
             JOIN creators c ON c.id = f.creator_id
            WHERE c.is_managed = TRUE
              AND f.is_baseline = FALSE
              AND f.first_seen_on >= CURRENT_DATE - ($1 || ' days')::interval
            GROUP BY f.first_seen_on
            ORDER BY f.first_seen_on ASC`,
          [days]
        );
    res.json({ points: rows });
  } catch (err: any) {
    console.error('[accounts/followers/organic-history]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
