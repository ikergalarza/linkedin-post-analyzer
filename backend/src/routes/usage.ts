import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// GET /api/usage/summary?days=30
// Single endpoint that backs the Usage page. Returns the aggregate spend
// in the window plus three breakdowns the chart consumes directly:
//   - by feature (cards + table)
//   - by model (model-mix donut)
//   - by day  (line chart)
// Window is capped at 365 days to bound the table scan; default 30.
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const days = Math.max(1, Math.min(365, parseInt(req.query.days as string) || 30));
    const sinceIso = new Date(Date.now() - days * 86400_000).toISOString();

    const [totals, byFeature, byModel, byDay] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int            AS calls,
           COALESCE(SUM(input_tokens),0)::bigint        AS input_tokens,
           COALESCE(SUM(output_tokens),0)::bigint       AS output_tokens,
           COALESCE(SUM(cache_read_tokens),0)::bigint   AS cache_read_tokens,
           COALESCE(SUM(cache_write_tokens),0)::bigint  AS cache_write_tokens,
           COALESCE(SUM(cost_usd),0)::numeric(10,4)     AS cost_usd
         FROM claude_usage_logs WHERE created_at >= $1`,
        [sinceIso]
      ),
      pool.query(
        `SELECT
           feature,
           COUNT(*)::int                                AS calls,
           COALESCE(SUM(input_tokens),0)::bigint        AS input_tokens,
           COALESCE(SUM(output_tokens),0)::bigint       AS output_tokens,
           COALESCE(SUM(cache_read_tokens),0)::bigint   AS cache_read_tokens,
           COALESCE(SUM(cache_write_tokens),0)::bigint  AS cache_write_tokens,
           COALESCE(SUM(cost_usd),0)::numeric(10,4)     AS cost_usd
         FROM claude_usage_logs
         WHERE created_at >= $1
         GROUP BY feature
         ORDER BY cost_usd DESC`,
        [sinceIso]
      ),
      pool.query(
        `SELECT
           model,
           COUNT(*)::int                                AS calls,
           COALESCE(SUM(input_tokens),0)::bigint        AS input_tokens,
           COALESCE(SUM(output_tokens),0)::bigint       AS output_tokens,
           COALESCE(SUM(cost_usd),0)::numeric(10,4)     AS cost_usd
         FROM claude_usage_logs
         WHERE created_at >= $1
         GROUP BY model
         ORDER BY cost_usd DESC`,
        [sinceIso]
      ),
      pool.query(
        `SELECT
           DATE_TRUNC('day', created_at)::date::text AS day,
           COUNT(*)::int                            AS calls,
           COALESCE(SUM(cost_usd),0)::numeric(10,4) AS cost_usd
         FROM claude_usage_logs
         WHERE created_at >= $1
         GROUP BY 1
         ORDER BY 1 ASC`,
        [sinceIso]
      ),
    ]);

    res.json({
      window_days: days,
      totals: totals.rows[0],
      by_feature: byFeature.rows,
      by_model: byModel.rows,
      by_day: byDay.rows,
    });
  } catch (err: any) {
    console.error('[usage/summary]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
