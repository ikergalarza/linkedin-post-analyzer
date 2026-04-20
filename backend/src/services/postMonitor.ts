import pool from '../db';
import { unipileService } from './unipile';
import { calculateEngagement, calculateAverageEngagement, calculateOutlierRatio, isOutlier } from './engagement';

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

// In-flight guard + last-run timestamp so opportunistic ticks from HTTP requests
// don't pile up or double-fire alongside the background setInterval.
let tickInFlight = false;
let lastTickAt = 0;

function requiredIntervalMs(ageMs: number): number | null {
  if (ageMs < 1 * HOUR_MS) return 15 * 60 * 1000;
  if (ageMs < 6 * HOUR_MS) return 30 * 60 * 1000;
  if (ageMs < 24 * HOUR_MS) return 2 * HOUR_MS;
  if (ageMs < 72 * HOUR_MS) return 6 * HOUR_MS;
  if (ageMs < 7 * 24 * HOUR_MS) return 24 * HOUR_MS;
  return null;
}

// force=true ignores per-phase cadence (used by the manual Refresh button in the UI).
async function tick(force = false): Promise<{ captured: number; candidates: number }> {
  if (tickInFlight) return { captured: 0, candidates: 0 };
  tickInFlight = true;
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
         AND p.published_at > NOW() - INTERVAL '7 days'
         AND p.linkedin_post_id <> 'DEMO_LIVE_POST'`
    );

    const now = Date.now();
    const targets = candidates.filter((c) => {
      const age = now - new Date(c.published_at).getTime();
      const interval = requiredIntervalMs(age);
      if (interval === null) return false;
      if (force) return true;
      if (!c.last_snapshot_at) return true;
      const sinceLast = now - new Date(c.last_snapshot_at).getTime();
      return sinceLast >= interval - DUE_TOLERANCE_MS;
    });

    if (targets.length === 0) return { captured: 0, candidates: candidates.length };

    console.log(`[postMonitor] ${force ? 'forced ' : ''}ticking — ${targets.length}/${candidates.length} post(s) due for snapshot`);

    // Group by creator so we only hit Unipile once per account
    const byCreator = new Map<string, typeof targets>();
    for (const t of targets) {
      const list = byCreator.get(t.creator_id) || [];
      list.push(t);
      byCreator.set(t.creator_id, list);
    }

    const touchedCreators = new Set<string>();

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
          const engagement = calculateEngagement(normalized);

          // Persist the snapshot
          await pool.query(
            `INSERT INTO post_snapshots (post_id, impressions_count, likes_count, comments_count, reposts_count)
             VALUES ($1, $2, $3, $4, $5)`,
            [target.id, normalized.impressions_count, normalized.likes_count, normalized.comments_count, normalized.reposts_count]
          );

          // Only touch the live counters. outlier_ratio/is_outlier are recomputed
          // per-creator below once all posts are in so the multipliers don't drift to 0.
          await pool.query(
            `UPDATE posts SET
               likes_count = $2,
               comments_count = $3,
               reposts_count = $4,
               impressions_count = $5,
               engagement_score = $6
             WHERE id = $1`,
            [target.id, normalized.likes_count, normalized.comments_count, normalized.reposts_count, normalized.impressions_count, engagement]
          );

          touchedCreators.add(creatorId);
        }
      } catch (err: any) {
        console.error(`[postMonitor] creator ${creatorId} failed:`, err?.message);
      }
    }

    // Recalculate outlier ratios for every creator whose posts got new numbers.
    // The average has shifted, so all their posts' multipliers need a refresh.
    for (const creatorId of touchedCreators) {
      try {
        const { rows: allPosts } = await pool.query(
          `SELECT id, engagement_score FROM posts WHERE creator_id = $1 AND linkedin_post_id <> 'DEMO_LIVE_POST'`,
          [creatorId]
        );
        if (allPosts.length === 0) continue;
        const avg = calculateAverageEngagement(allPosts.map((p) => ({ engagement_score: Number(p.engagement_score) || 0 })));
        for (const p of allPosts) {
          const ratio = calculateOutlierRatio(Number(p.engagement_score) || 0, avg);
          await pool.query(
            `UPDATE posts SET outlier_ratio = $1, is_outlier = $2 WHERE id = $3`,
            [Math.round(ratio * 100) / 100, isOutlier(ratio), p.id]
          );
        }
      } catch (err: any) {
        console.error(`[postMonitor] recalc outliers for ${creatorId} failed:`, err?.message);
      }
    }
    return { captured: targets.length, candidates: candidates.length };
  } catch (err: any) {
    console.error('[postMonitor] tick failed:', err?.message);
    return { captured: 0, candidates: 0 };
  } finally {
    tickInFlight = false;
    lastTickAt = Date.now();
  }
}

// Public hook for the Refresh button — forces a capture for every tracked post right now.
export async function forceLiveCapture(): Promise<{ captured: number; candidates: number }> {
  return tick(true);
}

// Opportunistic tick triggered by HTTP requests (GET /live-posts polls every 2 min from the UI).
// Makes snapshot capture resilient to Railway recycling the Node process or setInterval drift:
// any time a user has the Accounts page open, ticks stay on cadence even if the background
// interval misses a firing. Fire-and-forget; never blocks the response.
export function maybeTick(): void {
  if (tickInFlight) return;
  if (Date.now() - lastTickAt < TICK_MS) return;
  tick().catch((err) => console.error('[postMonitor] opportunistic tick failed:', err?.message));
}

// One-shot: recompute outlier_ratio/is_outlier for every managed creator's posts.
// Heals historical rows that got zeroed out before the tick logic was fixed.
async function backfillOutliers() {
  try {
    const { rows: creators } = await pool.query(
      `SELECT id FROM creators WHERE is_managed = TRUE`
    );
    for (const { id: creatorId } of creators) {
      const { rows: allPosts } = await pool.query(
        `SELECT id, engagement_score FROM posts WHERE creator_id = $1`,
        [creatorId]
      );
      if (allPosts.length === 0) continue;
      const avg = calculateAverageEngagement(allPosts.map((p) => ({ engagement_score: Number(p.engagement_score) || 0 })));
      for (const p of allPosts) {
        const ratio = calculateOutlierRatio(Number(p.engagement_score) || 0, avg);
        await pool.query(
          `UPDATE posts SET outlier_ratio = $1, is_outlier = $2 WHERE id = $3`,
          [Math.round(ratio * 100) / 100, isOutlier(ratio), p.id]
        );
      }
    }
    console.log(`[postMonitor] outlier backfill complete for ${creators.length} managed creator(s)`);
  } catch (err: any) {
    console.error('[postMonitor] backfill failed:', err?.message);
  }
}

export function startPostMonitor() {
  console.log(`[postMonitor] starting — tick every ${TICK_MS / 60000} min, window ${MONITOR_WINDOW_MS / 3600000}h, phase-based cadence`);
  // One-shot heal for any posts whose outlier_ratio got zeroed by the pre-fix monitor
  setTimeout(backfillOutliers, 10 * 1000);
  // First run after 1 minute so the server has time to settle post-deploy
  setTimeout(tick, 60 * 1000);
  setInterval(tick, TICK_MS);
}
