import pool from '../db';
import { unipileService } from './unipile';
import { enrichPost } from './engagement';
import { PostModel } from '../models/post';

// Capture a snapshot of every monitored post's impressions/engagement every 15 min
// during the first 6h after publication. In-process setInterval — runs inside the
// Node server, so it pauses during deploys (user accepted that trade-off).

const TICK_MS = 15 * 60 * 1000; // 15 minutes
const MONITOR_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

async function tick() {
  try {
    // Posts within the 6h window, from managed creators that have a unipile_account_id set.
    const { rows: targets } = await pool.query(
      `SELECT p.id, p.linkedin_post_id, p.published_at,
              c.id AS creator_id, c.linkedin_id, c.unipile_account_id
       FROM posts p
       JOIN creators c ON c.id = p.creator_id
       WHERE c.is_managed = TRUE
         AND c.unipile_account_id IS NOT NULL
         AND p.published_at IS NOT NULL
         AND p.published_at > NOW() - INTERVAL '6 hours'`
    );

    if (targets.length === 0) return;

    console.log(`[postMonitor] ticking — ${targets.length} post(s) in window`);

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
        const since = new Date(Date.now() - MONITOR_WINDOW_MS - 30 * 60 * 1000);
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
  console.log(`[postMonitor] starting — tick every ${TICK_MS / 1000}s, window ${MONITOR_WINDOW_MS / 3600000}h`);
  // First run after 1 minute so the server has time to settle post-deploy
  setTimeout(tick, 60 * 1000);
  setInterval(tick, TICK_MS);
}
