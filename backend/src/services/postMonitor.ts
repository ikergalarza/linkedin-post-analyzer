import pool from '../db';
import { unipileService } from './unipile';
import { enrichPost } from './engagement';
import { PostModel } from '../models/post';

// Phase-based snapshot cadence for LinkedIn posts.
// The algorithm distributes posts in waves, so we sample densely in the golden hour
// (decisive for distribution) and taper off as the curve flattens. ~35 snapshots/post/week.
//
//   Phase           Window         Cadence   Snapshots   Why
//   golden          0 – 1h         15 min    ~4          Decides distribution
//   first_wave      1 – 6h         30 min    ~10         Slope still steep
//   consolidation   6 – 24h        2h        ~9          Bulk of reach accumulates
//   long_tail       24 – 72h       6h        ~8          85–90% of final data
//   tail            72h – 7d       24h       ~4          Trickle, freeze final metrics
//   closed          > 7d           —         0           Done
//
// The worker ticks every 15 min (golden-hour resolution) and lets each post decide
// whether enough time has passed since its last snapshot.

const TICK_MS = 15 * 60 * 1000;
const MONITOR_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
// Tolerance so scheduling jitter doesn't push a snapshot one full tick forward
const DUE_TOLERANCE_MS = 30 * 1000;

function requiredIntervalMs(ageMs: number): number | null {
  if (ageMs < 1 * HOUR_MS) return 15 * 60 * 1000;
  if (ageMs < 6 * HOUR_MS) return 30 * 60 * 1000;
  if (ageMs < 24 * HOUR_MS) return 2 * HOUR_MS;
  if (ageMs < 72 * HOUR_MS) return 6 * HOUR_MS;
  if (ageMs < 7 * 24 * HOUR_MS) return 24 * HOUR_MS;
  return null;
}

async function tick() {
  try {
    // All managed-account posts within the 7-day window; we'll filter per-post by
    // phase cadence in JS so each post only gets hit at its own required interval.
    const { rows: candidates } = await pool.query(
      `SELECT p.id, p.linkedin_post_id, p.published_at,
              c.id AS creator_id, c.linkedin_id, c.unipile_account_id,
              (SELECT MAX(s.captured_at) FROM post_snapshots s WHERE s.post_id = p.id) AS last_snapshot_at
       FROM posts p
       JOIN creators c ON c.id = p.creator_id
       WHERE c.is_managed = TRUE
         AND c.unipile_account_id IS NOT NULL
         AND p.published_at IS NOT NULL
         AND p.published_at > NOW() - INTERVAL '7 days'`
    );

    const now = Date.now();
    const targets = candidates.filter((c) => {
      const age = now - new Date(c.published_at).getTime();
      const interval = requiredIntervalMs(age);
      if (interval === null) return false;
      if (!c.last_snapshot_at) return true;
      const sinceLast = now - new Date(c.last_snapshot_at).getTime();
      return sinceLast >= interval - DUE_TOLERANCE_MS;
    });

    if (targets.length === 0) return;

    console.log(`[postMonitor] ticking — ${targets.length}/${candidates.length} post(s) due for snapshot`);

    // Group by creator so we only hit Unipile once per account
    const byCreator = new Map<string, typeof targets>();
    for (const t of targets) {
      const list = byCreator.get(t.creator_id) || [];
      list.push(t);
      byCreator.set(t.creator_id, list);
    }

    for (const [creatorId, posts] of byCreator.entries()) {
      const first = posts[0];
      if (!first.linkedin_id || !first.unipile_account_id) continue;

      try {
        // Fetch recent posts with the creator's own account so impressions come through
        const since = new Date(Date.now() - MONITOR_WINDOW_MS - 60 * 60 * 1000);
        const raws = await unipileService.getPosts(first.linkedin_id, since, first.unipile_account_id);

        const byLinkedInId = new Map<string, any>();
        for (const r of raws) {
          const id = r.social_id || r.id;
          if (id) byLinkedInId.set(String(id), r);
        }

        for (const target of posts) {
          const raw = target.linkedin_post_id ? byLinkedInId.get(String(target.linkedin_post_id)) : null;
          if (!raw) continue;

          const normalized = unipileService.normalizePost(raw, creatorId);
          const enriched = enrichPost(normalized);

          // Persist the snapshot
          await pool.query(
            `INSERT INTO post_snapshots (post_id, impressions_count, likes_count, comments_count, reposts_count)
             VALUES ($1, $2, $3, $4, $5)`,
            [target.id, normalized.impressions_count, normalized.likes_count, normalized.comments_count, normalized.reposts_count]
          );

          // Also update the live post row so the UI sees the latest numbers
          await PostModel.bulkUpsert([{ ...normalized, ...enriched }]);
        }
      } catch (err: any) {
        console.error(`[postMonitor] creator ${creatorId} failed:`, err?.message);
      }
    }
  } catch (err: any) {
    console.error('[postMonitor] tick failed:', err?.message);
  }
}

export function startPostMonitor() {
  console.log(`[postMonitor] starting — tick every ${TICK_MS / 60000} min, window ${MONITOR_WINDOW_MS / 3600000}h, phase-based cadence`);
  // First run after 1 minute so the server has time to settle post-deploy
  setTimeout(tick, 60 * 1000);
  setInterval(tick, TICK_MS);
}
