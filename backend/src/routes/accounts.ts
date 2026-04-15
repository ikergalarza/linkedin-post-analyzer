import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// GET /api/accounts — list all creators flagged as managed accounts, with summary stats
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        c.id, c.name, c.headline, c.profile_image_url, c.followers_count,
        c.location, c.last_scraped_at, c.is_managed,
        COUNT(p.id)::int AS total_posts,
        COUNT(p.id) FILTER (WHERE p.is_outlier = TRUE)::int AS total_outliers,
        COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement,
        COALESCE(MAX(p.engagement_score)::int, 0) AS max_engagement,
        MAX(p.published_at) AS last_post_at
       FROM creators c
       LEFT JOIN posts p ON p.creator_id = c.id
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

// PATCH /api/accounts/:id — toggle is_managed
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { is_managed } = req.body;
    if (typeof is_managed !== 'boolean') {
      return res.status(400).json({ error: 'is_managed (boolean) required' });
    }
    const { rows } = await pool.query(
      `UPDATE creators SET is_managed = $1 WHERE id = $2 RETURNING id, is_managed`,
      [is_managed, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Creator not found' });
    res.json(rows[0]);
  } catch (err: any) {
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
    const scope = (nextIdx: number) => {
      if (creatorId) return { sql: `p.creator_id = $${nextIdx}`, params: [creatorId] };
      return { sql: `p.creator_id IN (SELECT id FROM creators WHERE is_managed = TRUE)`, params: [] };
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
          COALESCE(SUM(p.reposts_count)::int, 0) AS total_reposts
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
          COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement
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
          COALESCE(dr.avg_engagement, 0) AS avg_engagement
        FROM day_series ds
        LEFT JOIN daily_raw dr ON dr.day = ds.day
      )
      SELECT
        day::text AS day,
        posts,
        outliers,
        total_engagement,
        avg_engagement,
        SUM(total_engagement) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)::int AS rolling_sum_7d
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
        p.likes_count, p.comments_count, p.reposts_count,
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
          COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement
         FROM creators c
         LEFT JOIN posts p ON p.creator_id = c.id AND p.published_at >= $1
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

export default router;
