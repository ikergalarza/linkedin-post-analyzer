import pool from '../db';
import { unipileService } from './unipile';

// Backfill posts.reaction_mix for outliers. Uses a dedicated Unipile account
// (env UNIPILE_SCRAPER_ACCOUNT_ID) so the load doesn't ride on Iker/Unai's
// real LinkedIn sessions — a restriction on a burner account is recoverable;
// on the brand accounts it's not.
//
// Resumable by construction: the picker selects rows WHERE reaction_mix IS
// NULL, so a crashed run just resumes where it left off on the next start.
// Idempotent on writes (UPDATE … WHERE id = $1).

const SCRAPER_ACCOUNT_ID = process.env.UNIPILE_SCRAPER_ACCOUNT_ID || '';

interface BackfillProgress {
  running: boolean;
  started_at: string | null;
  processed: number;
  failed: number;
  total: number;
  current_post_id: string | null;
  last_error: string | null;
}

// In-memory progress so the status endpoint stays cheap (no extra DB read
// just to check). Cleared between server restarts — that's fine, the
// totals can be recomputed by querying the table.
const state: BackfillProgress = {
  running: false,
  started_at: null,
  processed: 0,
  failed: 0,
  total: 0,
  current_post_id: null,
  last_error: null,
};

export function getBackfillProgress(): BackfillProgress {
  return { ...state };
}

interface RunOpts {
  // How many posts to process this run. Default null = all unbackfilled
  // outliers. The UI lets the user pick a cap so they can test on 50 first.
  limit?: number | null;
  // Parallel fetches. 3 is gentle; LinkedIn isn't published but the wisdom
  // is to stay under ~5 sustained req/s. With 3 concurrent and ~2s avg
  // latency we sit at ~1.5 req/s which clears 1400 posts in ~15 minutes
  // comfortably and leaves headroom for retries.
  concurrency?: number;
  // Min ms between starting batches. Keeps the rate steady even if Unipile
  // responses come back fast.
  pauseMs?: number;
}

export async function runReactionMixBackfill(opts: RunOpts = {}): Promise<{ started: boolean; reason?: string }> {
  if (state.running) return { started: false, reason: 'already running' };
  if (!SCRAPER_ACCOUNT_ID) return { started: false, reason: 'UNIPILE_SCRAPER_ACCOUNT_ID not set' };

  const concurrency = Math.max(1, Math.min(5, opts.concurrency ?? 3));
  const pauseMs = Math.max(0, opts.pauseMs ?? 250);
  const limit = opts.limit ?? null;

  // Snapshot the queue once — new outliers landing mid-run get picked up
  // on the next invocation, not this one.
  const params: any[] = [];
  let limitSql = '';
  if (limit != null) {
    params.push(limit);
    limitSql = `LIMIT $${params.length}`;
  }
  const { rows: targets } = await pool.query(
    `SELECT id, linkedin_post_id
       FROM posts
      WHERE is_outlier = TRUE
        AND reaction_mix IS NULL
        AND linkedin_post_id IS NOT NULL
        AND linkedin_post_id <> 'DEMO_LIVE_POST'
      ORDER BY published_at DESC NULLS LAST
      ${limitSql}`,
    params
  );

  if (targets.length === 0) return { started: false, reason: 'nothing to backfill' };

  // Mark running and kick the worker off without awaiting — the HTTP
  // handler returns immediately and the UI polls /status.
  state.running = true;
  state.started_at = new Date().toISOString();
  state.processed = 0;
  state.failed = 0;
  state.total = targets.length;
  state.current_post_id = null;
  state.last_error = null;

  void (async () => {
    try {
      for (let i = 0; i < targets.length; i += concurrency) {
        const batch = targets.slice(i, i + concurrency);
        await Promise.all(
          batch.map(async (t: any) => {
            state.current_post_id = t.id;
            try {
              const { counts, sampled } = await unipileService.getPostReactions(
                t.linkedin_post_id,
                SCRAPER_ACCOUNT_ID
              );
              const total = Object.values(counts).reduce((s, n) => s + n, 0);
              const mix = { ...counts, total, sampled };
              await pool.query(
                `UPDATE posts SET reaction_mix = $1::jsonb WHERE id = $2`,
                [JSON.stringify(mix), t.id]
              );
              state.processed++;
            } catch (err: any) {
              state.failed++;
              state.last_error = `${t.id}: ${err?.message}`.slice(0, 300);
              console.warn(`[reactionMixBackfill] ${t.id} failed:`, err?.message);
            }
          })
        );
        if (pauseMs > 0 && i + concurrency < targets.length) {
          await new Promise((r) => setTimeout(r, pauseMs));
        }
      }
    } finally {
      state.running = false;
      state.current_post_id = null;
      console.log(
        `[reactionMixBackfill] done — processed=${state.processed} failed=${state.failed} total=${state.total}`
      );
    }
  })();

  return { started: true };
}
