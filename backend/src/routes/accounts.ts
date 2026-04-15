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

    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Resolve target creator scope
    let scopeCondition = 'p.creator_id IN (SELECT id FROM creators WHERE is_managed = TRUE)';
    const params: any[] = [sinceIso];
    if (creatorId) {
      scopeCondition = 'p.creator_id = $2';
      params.push(creatorId);
    }

    // Totals
    const totalsQ = await pool.query(
      `SELECT
        COUNT(*)::int AS total_posts,
        COUNT(*) FILTER (WHERE p.is_outlier = TRUE)::int AS total_outliers,
        COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement,
        COALESCE(ROUND(MAX(p.engagement_score))::int, 0) AS max_engagement,
        COALESCE(SUM(p.likes_count)::int, 0) AS total_likes,
        COALESCE(SUM(p.comments_count)::int, 0) AS total_comments,
        COALESCE(SUM(p.reposts_count)::int, 0) AS total_reposts
       FROM posts p
       WHERE p.published_at >= $1 AND ${scopeCondition}`,
      params
    );

    // Weekly timeseries: avg engagement, post count, outlier count
    const weeklyQ = await pool.query(
      `SELECT
        DATE_TRUNC('week', p.published_at) AS week,
        COUNT(*)::int AS posts,
        COUNT(*) FILTER (WHERE p.is_outlier = TRUE)::int AS outliers,
        COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement,
        COALESCE(MAX(p.engagement_score)::int, 0) AS max_engagement
       FROM posts p
       WHERE p.published_at >= $1 AND ${scopeCondition}
       GROUP BY week
       ORDER BY week ASC`,
      params
    );

    // Content type mix with avg engagement per type
    const formatQ = await pool.query(
      `SELECT
        p.content_type,
        COUNT(*)::int AS count,
        COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement,
        COUNT(*) FILTER (WHERE p.is_outlier = TRUE)::int AS outliers
       FROM posts p
       WHERE p.published_at >= $1 AND ${scopeCondition}
       GROUP BY p.content_type
       ORDER BY count DESC`,
      params
    );

    // Top posts
    const topPostsQ = await pool.query(
      `SELECT
        p.id, p.content_text, p.content_type, p.published_at,
        p.likes_count, p.comments_count, p.reposts_count,
        p.engagement_score, p.outlier_ratio, p.is_outlier,
        p.post_url, p.hook_text,
        c.name AS creator_name, c.profile_image_url AS creator_image
       FROM posts p
       JOIN creators c ON c.id = p.creator_id
       WHERE p.published_at >= $1 AND ${scopeCondition}
       ORDER BY p.engagement_score DESC
       LIMIT 10`,
      params
    );

    // Hook type distribution (best-performing)
    const hookQ = await pool.query(
      `SELECT
        p.hook_type,
        COUNT(*)::int AS count,
        COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement
       FROM posts p
       WHERE p.published_at >= $1 AND ${scopeCondition} AND p.hook_type IS NOT NULL
       GROUP BY p.hook_type
       ORDER BY avg_engagement DESC`,
      params
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
        [sinceIso]
      );
      perAccount = perAccountQ.rows;
    }

    res.json({
      days,
      creator_id: creatorId,
      totals: totalsQ.rows[0],
      weekly: weeklyQ.rows,
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
