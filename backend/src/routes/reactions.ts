import { Router, Request, Response } from 'express';
import pool from '../db';
import { runReactionMixBackfill, getBackfillProgress } from '../services/reactionMixBackfill';

const router = Router();

// POST /api/reactions/backfill/start?limit=N
// Kicks off the reaction-mix backfill in the background and returns
// immediately. The UI polls /status to track progress. Limit is optional —
// omit to backfill every outlier without a mix.
router.post('/backfill/start', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit as string)) : null;
    const result = await runReactionMixBackfill({ limit });
    res.json(result);
  } catch (err: any) {
    console.error('[reactions/backfill/start]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reactions/backfill/status
// Returns live progress (running/processed/failed/total + current post +
// last error) plus an across-the-board summary the page can use to render
// "M of N outliers have a mix" without a second roundtrip.
router.get('/backfill/status', async (_req: Request, res: Response) => {
  try {
    const progress = getBackfillProgress();
    // "with_mix" must only count VALID mixes — a row whose mix is the broken
    // all-UNKNOWN shape (from the pre-`value`-fix backfill) still needs
    // re-processing, so it counts as pending, not done. Otherwise the UI
    // button reads "completo" and disables, blocking the re-run that
    // actually fixes the data.
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE is_outlier = TRUE)::int AS outliers_total,
         COUNT(*) FILTER (
           WHERE is_outlier = TRUE
             AND reaction_mix IS NOT NULL
             AND NOT (reaction_mix ? 'UNKNOWN')
             AND NOT (reaction_mix ? '_error')
         )::int AS outliers_with_mix,
         COUNT(*) FILTER (WHERE is_outlier = TRUE AND reaction_mix ? '_error')::int AS outliers_permanently_failed,
         COUNT(*) FILTER (WHERE is_outlier = TRUE AND reaction_mix ? 'UNKNOWN')::int AS outliers_unknown
       FROM posts
       WHERE linkedin_post_id <> 'DEMO_LIVE_POST'`
    );
    res.json({ progress, summary: rows[0] });
  } catch (err: any) {
    console.error('[reactions/backfill/status]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
