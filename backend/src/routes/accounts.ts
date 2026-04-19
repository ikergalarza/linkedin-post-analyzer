import { Router, Request, Response } from 'express';
import pool from '../db';
import { unipileService } from '../services/unipile';
import { enrichPost, recalculateOutliers } from '../services/engagement';
import { PostModel } from '../models/post';
import { CreatorModel } from '../models/creator';

const router = Router();

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

// POST /api/accounts/:id/scrape — re-scrape posts using this account's unipile_account_id
// so impressions come through (LinkedIn only returns impressions for the authenticated account).
router.post('/:id/scrape', async (req: Request, res: Response) => {
  try {
    const creator = await CreatorModel.findById(req.params.id as string);
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    const accountIdOverride = (creator as any).unipile_account_id as string | null;
    if (!accountIdOverride) {
      return res.status(400).json({ error: 'Set a Unipile account ID for this creator first' });
    }

    // Re-fetch profile with this account so we can refresh linkedin_id if needed
    let providerId = creator.linkedin_id;
    if (!providerId) {
      const rawProfile = await unipileService.getProfile(creator.linkedin_url, accountIdOverride);
      const normalized = unipileService.normalizeProfile(rawProfile, creator.linkedin_url);
      providerId = normalized.linkedin_id;
      if (providerId) {
        await CreatorModel.update(creator.id, { linkedin_id: providerId } as any);
      }
    }
    if (!providerId) return res.status(422).json({ error: 'Could not resolve LinkedIn provider ID' });

    const rawPosts = await unipileService.getPosts(providerId, undefined, accountIdOverride);

    const originalPosts = rawPosts.filter((raw: any) => {
      if (raw.type === 'repost' || raw.type === 'RESHARE' || raw.type === 'reshare') return false;
      if (raw.is_repost || raw.is_reshare) return false;
      if (raw.reshared_post || raw.original_post) return false;
      return true;
    });

    if (originalPosts.length === 0) {
      await CreatorModel.update(creator.id, { last_scraped_at: new Date() } as any);
      return res.json({ scraped: 0, with_impressions: 0 });
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
    res.json({ scraped: posts.length, with_impressions: withImpressions });
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
    // window function smooths the line so it's not all spikes.
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
      filled AS (
        SELECT
          ds.day,
          COALESCE(dr.posts, 0) AS posts,
          COALESCE(dr.outliers, 0) AS outliers,
          COALESCE(dr.total_engagement, 0) AS total_engagement,
          COALESCE(dr.avg_engagement, 0) AS avg_engagement,
          COALESCE(dr.total_impressions, 0) AS total_impressions
        FROM day_series ds
        LEFT JOIN daily_raw dr ON dr.day = ds.day
      )
      SELECT
        day::text AS day,
        posts,
        outliers,
        total_engagement,
        avg_engagement,
        total_impressions::bigint AS total_impressions,
        SUM(total_engagement) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)::int AS rolling_sum_7d,
        SUM(total_impressions) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)::bigint AS rolling_impressions_7d
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
       ) VALUES ($1, 'DEMO_LIVE_POST', $2, 'text_only', $3, $4, $5, $6, $7, $8, $9, TRUE, $10, 'es')
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
// impressions/engagement growth during its first 6h.
router.get('/posts/:id/snapshots', async (req: Request, res: Response) => {
  try {
    const postQ = await pool.query(
      `SELECT p.id, p.content_text, p.hook_text, p.published_at,
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

    res.json({ post: postQ.rows[0], snapshots: snapsQ.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
