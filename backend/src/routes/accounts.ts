import { Router, Request, Response } from 'express';
import pool from '../db';
import { unipileService } from '../services/unipile';
import { enrichPost, recalculateOutliers } from '../services/engagement';
import { PostModel } from '../models/post';
import { CreatorModel } from '../models/creator';
import { forceLiveCapture, maybeTick } from '../services/postMonitor';
import { generateComments } from '../services/commentGenerator';
import { CommenterProfileModel } from '../models/commenterProfile';
import { sendToGoogleChat, detectOwner } from '../services/googleChat';
import { captureAccountSnapshots } from '../services/accountSnapshots';

const router = Router();

// Re-fetch posts for a single managed creator using their Unipile account_id, upsert into DB,
// and refresh outlier ratios. Returns counts so callers can report progress.
async function scrapeCreatorPosts(creatorId: string): Promise<{ scraped: number; with_impressions: number }> {
  const creator = await CreatorModel.findById(creatorId);
  if (!creator) return { scraped: 0, with_impressions: 0 };
  const accountIdOverride = (creator as any).unipile_account_id as string | null;
  if (!accountIdOverride) return { scraped: 0, with_impressions: 0 };

  const snap = await captureAccountSnapshots(creatorId);
  const providerId = snap.providerId;

  if (!providerId) return { scraped: 0, with_impressions: 0 };

  const rawPosts = await unipileService.getPosts(providerId, undefined, accountIdOverride);
  const originalPosts = rawPosts.filter((raw: any) => {
    if (raw.type === 'repost' || raw.type === 'RESHARE' || raw.type === 'reshare') return false;
    if (raw.is_repost || raw.is_reshare) return false;
    if (raw.reshared_post || raw.original_post) return false;
    return true;
  });
  if (originalPosts.length === 0) {
    await CreatorModel.update(creator.id, { last_scraped_at: new Date() } as any);
    return { scraped: 0, with_impressions: 0 };
  }

  let posts = originalPosts.map((raw) => {
    const normalized = unipileService.normalizePost(raw, creator.id);
    const enriched = enrichPost(normalized);
    return { ...normalized, ...enriched };
  });
  const withOutliers = recalculateOutliers(posts);
  posts = withOutliers.map((o, i) => ({
    ...posts[i],
    outlier_ratio: o.outlier_ratio,
    is_outlier: o.is_outlier,
  }));

  await PostModel.bulkUpsert(posts);
  await CreatorModel.update(creator.id, { last_scraped_at: new Date() } as any);

  const withImpressions = posts.filter((p: any) => p.impressions_count != null).length;
  return { scraped: posts.length, with_impressions: withImpressions };
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
// If creator_id is omitted, sums followers across all managed accounts per day.
router.get('/follower-history', async (req: Request, res: Response) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 90, 365);
    const creatorId = (req.query.creator_id as string) || null;

    const { rows } = creatorId
      ? await pool.query(
          `SELECT captured_on::text AS day, followers_count::int AS followers
             FROM creator_follower_snapshots
            WHERE creator_id = $1
              AND captured_on >= CURRENT_DATE - ($2 || ' days')::interval
            ORDER BY captured_on ASC`,
          [creatorId, days]
        )
      : await pool.query(
          `SELECT s.captured_on::text AS day, SUM(s.followers_count)::int AS followers
             FROM creator_follower_snapshots s
             JOIN creators c ON c.id = s.creator_id
            WHERE c.is_managed = TRUE
              AND s.captured_on >= CURRENT_DATE - ($1 || ' days')::interval
            GROUP BY s.captured_on
            ORDER BY s.captured_on ASC`,
          [days]
        );
    res.json({ points: rows });
  } catch (err: any) {
    console.error('[accounts/follower-history]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts/profile-view-history?creator_id=xxx&days=90
// If creator_id is omitted, sums viewers across all managed accounts per day.
// Same shape as /follower-history so the frontend can reuse the chart logic.
router.get('/profile-view-history', async (req: Request, res: Response) => {
  try {
    const days = Math.min(parseInt(req.query.days as string) || 90, 365);
    const creatorId = (req.query.creator_id as string) || null;

    const { rows } = creatorId
      ? await pool.query(
          `SELECT captured_on::text AS day, views_count::int AS views
             FROM creator_profile_view_snapshots
            WHERE creator_id = $1
              AND captured_on >= CURRENT_DATE - ($2 || ' days')::interval
            ORDER BY captured_on ASC`,
          [creatorId, days]
        )
      : await pool.query(
          `SELECT s.captured_on::text AS day, SUM(s.views_count)::int AS views
             FROM creator_profile_view_snapshots s
             JOIN creators c ON c.id = s.creator_id
            WHERE c.is_managed = TRUE
              AND s.captured_on >= CURRENT_DATE - ($1 || ' days')::interval
            GROUP BY s.captured_on
            ORDER BY s.captured_on ASC`,
          [days]
        );
    res.json({ points: rows });
  } catch (err: any) {
    console.error('[accounts/profile-view-history]', err);
    res.status(500).json({ error: err.message });
  }
});

// Walks a WVMP raw_response and pulls every viewer's viewedAt timestamp.
// LinkedIn's Voyager schema rotates field names, so we try several known
// candidates and accept either ms or seconds. Returns ms-epoch numbers,
// filtered to the last 365 days to ignore garbage values.
function extractViewerTimestamps(rawResponse: any): number[] {
  const elements: any[] =
    rawResponse?.data?.data?.premiumDashAnalyticsObjectByAnalyticsEntity?.elements ??
    rawResponse?.data?.premiumDashAnalyticsObjectByAnalyticsEntity?.elements ??
    rawResponse?.premiumDashAnalyticsObjectByAnalyticsEntity?.elements ??
    [];
  if (!Array.isArray(elements)) return [];

  const out: number[] = [];
  const now = Date.now();
  const yearAgo = now - 365 * 86400_000;

  for (const el of elements) {
    if (!el || typeof el !== 'object') continue;
    // Try the common field names. Walk shallowly through nested objects too —
    // sometimes the timestamp is buried under "actionContext" or similar.
    const candidates: unknown[] = [
      el.viewedAt,
      el.viewerActorViewedAt,
      el.time,
      el.actionAt,
      el.viewedAtMs,
      el.timestamp,
      el?.actionContext?.actionAt,
      el?.actionContext?.viewedAt,
      el?.viewerInfo?.viewedAt,
    ];
    let pickedMs: number | null = null;
    for (const c of candidates) {
      if (typeof c !== 'number' || !Number.isFinite(c) || c <= 0) continue;
      // > 1e12 → already ms; otherwise treat as seconds.
      const ms = c > 1e12 ? c : c * 1000;
      if (ms >= yearAgo && ms <= now + 86400_000) {
        pickedMs = ms;
        break;
      }
    }
    if (pickedMs !== null) out.push(pickedMs);
  }
  return out;
}

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
          live = {
            count: wvmp.count,
            pages: wvmp.pages,
            paging_total: wvmp.pagingTotal,
            timestamps_extracted: liveTimestamps.length,
            sample_recent_viewers: liveTimestamps.slice(0, 5).map((ms) => new Date(ms).toISOString()),
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
    const days = Math.min(parseInt(req.query.days as string) || 90, 365);
    const creatorId = (req.query.creator_id as string) || null;

    const currentStartIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const previousStartIso = new Date(Date.now() - 2 * days * 24 * 60 * 60 * 1000).toISOString();

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
    const currentTotals = totalsSql('p.published_at >= $1', [currentStartIso]);
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
    const dailyScope = scope(2);
    const dailyQ = await pool.query(
      `WITH day_series AS (
        SELECT generate_series($1::date, CURRENT_DATE, '1 day'::interval)::date AS day
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
        WHERE p.published_at >= $1 AND ${dailyScope.sql}
        GROUP BY (p.published_at)::date
      ),
      top_per_day AS (
        SELECT DISTINCT ON ((p.published_at)::date)
          (p.published_at)::date AS day,
          p.id AS top_post_id,
          COALESCE(p.content_text, p.hook_text) AS top_post_preview,
          p.post_url AS top_post_url,
          p.outlier_ratio AS top_post_outlier_ratio,
          p.is_outlier AS top_post_is_outlier
        FROM posts p
        WHERE p.published_at >= $1 AND ${dailyScope.sql}
        ORDER BY (p.published_at)::date, p.engagement_score DESC
      ),
      filled AS (
        SELECT
          ds.day,
          COALESCE(dr.posts, 0) AS posts,
          COALESCE(dr.outliers, 0) AS outliers,
          COALESCE(dr.total_engagement, 0) AS total_engagement,
          COALESCE(dr.avg_engagement, 0) AS avg_engagement,
          COALESCE(dr.total_impressions, 0) AS total_impressions,
          tpd.top_post_id,
          tpd.top_post_preview,
          tpd.top_post_url,
          tpd.top_post_outlier_ratio,
          tpd.top_post_is_outlier
        FROM day_series ds
        LEFT JOIN daily_raw dr ON dr.day = ds.day
        LEFT JOIN top_per_day tpd ON tpd.day = ds.day
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
        top_post_id,
        top_post_preview,
        top_post_url,
        top_post_outlier_ratio,
        top_post_is_outlier
      FROM filled
      ORDER BY day ASC`,
      [currentStartIso, ...dailyScope.params]
    );

    // Content type mix with avg engagement per type
    const formatScope = scope(2);
    const formatQ = await pool.query(
      `SELECT
        p.content_type,
        COUNT(*)::int AS count,
        COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement,
        COUNT(*) FILTER (WHERE p.is_outlier = TRUE)::int AS outliers
       FROM posts p
       WHERE p.published_at >= $1 AND ${formatScope.sql}
       GROUP BY p.content_type
       ORDER BY count DESC`,
      [currentStartIso, ...formatScope.params]
    );

    // Top posts
    const topScope = scope(2);
    const topPostsQ = await pool.query(
      `SELECT
        p.id, p.content_text, p.content_type, p.published_at,
        p.likes_count, p.comments_count, p.reposts_count, p.impressions_count,
        p.engagement_score, p.outlier_ratio, p.is_outlier,
        p.post_url, p.hook_text,
        c.name AS creator_name, c.profile_image_url AS creator_image
       FROM posts p
       JOIN creators c ON c.id = p.creator_id
       WHERE p.published_at >= $1 AND ${topScope.sql}
       ORDER BY p.engagement_score DESC
       LIMIT 10`,
      [currentStartIso, ...topScope.params]
    );

    // Hook type distribution
    const hookScope = scope(2);
    const hookQ = await pool.query(
      `SELECT
        p.hook_type,
        COUNT(*)::int AS count,
        COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement
       FROM posts p
       WHERE p.published_at >= $1 AND ${hookScope.sql} AND p.hook_type IS NOT NULL
       GROUP BY p.hook_type
       ORDER BY avg_engagement DESC`,
      [currentStartIso, ...hookScope.params]
    );

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
         LEFT JOIN posts p ON p.creator_id = c.id AND p.published_at >= $1 AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
         WHERE c.is_managed = TRUE
         GROUP BY c.id
         ORDER BY avg_engagement DESC`,
        [currentStartIso]
      );
      perAccount = perAccountQ.rows;
    }

    res.json({
      days,
      creator_id: creatorId,
      totals: totalsQ.rows[0],
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
    const params: any[] = [];
    let creatorFilter = '';
    if (creatorId) {
      params.push(creatorId);
      creatorFilter = `AND c.id = $${params.length}`;
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
       WHERE p.published_at > NOW() - INTERVAL '7 days'
          OR p.snapshot_count > 0
       ORDER BY p.published_at DESC
       LIMIT 50`,
      params
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/live-refresh — manually refresh every managed account.
// scrapeCreatorPosts internally upserts today's follower + WVMP profile-view
// snapshot via captureAccountSnapshots before pulling posts, so the Refresh
// button is the single trigger that updates everything.
router.post('/live-refresh', async (_req: Request, res: Response) => {
  try {
    const { rows: managed } = await pool.query(
      `SELECT id FROM creators WHERE is_managed = TRUE AND unipile_account_id IS NOT NULL`
    );
    let newPosts = 0;
    let viewSnapshots = 0;
    for (const { id } of managed) {
      try {
        const { scraped } = await scrapeCreatorPosts(id);
        newPosts += scraped;
        viewSnapshots++;
      } catch (err: any) {
        console.error(`[accounts/live-refresh] scrape failed for ${id}:`, err?.message);
      }
    }
    const capture = await forceLiveCapture();
    res.json({
      ...capture,
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

// ─── Google Chat: notify group about a just-published post ─────────────────

const ANGLE_LABELS: Record<string, string> = {
  reinforce: 'Reinforce',
  contrarian_data: 'Contrarian · data',
  contrarian_premise: 'Contrarian · premise',
  contrarian_survivorship: 'Contrarian · survivorship',
  reframe: 'Reframe',
  add_missing: 'Add missing',
  steal_phrase: 'Steal phrase',
  warm_supportive: 'Warm & supportive',
  better_question: 'Better question',
};

// GET /api/accounts/posts/:postId/google-chat-preview
// Returns owner detection, post info, and generated comments using the
// opposite-owner voice (or the requested profile_name override).
router.get('/posts/:postId/google-chat-preview', async (req: Request, res: Response) => {
  try {
    const postId = req.params.postId;
    const profileOverride = typeof req.query.profile_name === 'string' ? req.query.profile_name : null;

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

    const ownerInfo = detectOwner(post.creator_name);
    const voiceName = profileOverride || ownerInfo.suggestedVoice;

    const profile = await CommenterProfileModel.getByName(voiceName);
    if (!profile) {
      return res.status(400).json({
        error: `No se encontró el perfil de voz "${voiceName}". Configúralo en Network → Profiles.`,
      });
    }

    const rawComments = await generateComments({
      postContent: post.content_text || '',
      creatorName: post.creator_name,
      creatorHeadline: post.creator_headline || null,
      profile: {
        headline: profile.headline,
        voice_style: profile.voice_style,
        worldview: profile.worldview,
        signature_moves: profile.signature_moves,
        avoid: profile.avoid,
        tone: profile.tone,
        expertise: profile.expertise,
      },
    });

    // Defensive cap per comment. The system prompt asks for ≤ 280 chars but
    // the model occasionally overshoots. Keeping each comment ≤ 300 chars
    // means 9 × 300 + structural overhead (~250) stays comfortably under
    // Google Chat's 4096-char message limit (we cap UX at 3800 to leave room).
    const PER_COMMENT_CAP = 300;
    const truncate = (s: string) => {
      const t = (s || '').trim();
      if (t.length <= PER_COMMENT_CAP) return t;
      // Try to break on a sentence/word boundary near the cap
      const slice = t.slice(0, PER_COMMENT_CAP - 1);
      const lastBreak = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('? '), slice.lastIndexOf('! '), slice.lastIndexOf('\n'));
      const cutAt = lastBreak > PER_COMMENT_CAP * 0.6 ? lastBreak + 1 : slice.lastIndexOf(' ');
      return (cutAt > PER_COMMENT_CAP * 0.5 ? t.slice(0, cutAt) : slice).trimEnd() + '…';
    };
    const comments = Object.fromEntries(
      Object.entries(rawComments).map(([k, v]) => [k, truncate(String(v || ''))])
    ) as unknown as typeof rawComments;

    res.json({
      post: {
        id: post.id,
        url: post.post_url,
        hook: post.hook_text,
        content: post.content_text,
        creator_name: post.creator_name,
      },
      owner: ownerInfo.owner,
      voice_used: voiceName,
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

// Expose angle labels so the frontend can render nice headings without duplicating the dict.
router.get('/google-chat/angle-labels', (_req: Request, res: Response) => {
  res.json(ANGLE_LABELS);
});

export default router;
