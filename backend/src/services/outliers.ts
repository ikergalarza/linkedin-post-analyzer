import pool from '../db';
import { MIN_OUTLIER_ENGAGEMENT } from './engagement';

// Min impressions a post must clear to qualify as an outlier under the
// engagement-RATE method (managed accounts only). Without this floor, a
// low-reach post with a fluke-high engagement rate (e.g. 300 eng on 2K
// impressions = 15%) would be flagged as a huge outlier — but it never
// actually travelled. The floor keeps "outlier" meaning "engaged well AND
// reached a real audience". Tunable: raise toward 10K for a stricter pool.
export const MIN_OUTLIER_IMPRESSIONS = 5000;

// Minimum number of posts WITH impressions a managed creator needs before
// we trust the rate method. Below this the per-creator average rate is too
// noisy, so we fall back to the absolute-engagement method.
const MIN_POSTS_WITH_IMPRESSIONS = 3;

// Recompute outlier_ratio + is_outlier for EVERY post of one creator,
// choosing the method by account type — the single source of truth for
// outlier scoring. Replaces the duplicated inline loops/SQL that used to
// live in postMonitor and creators.
//
//   MANAGED accounts (Iker / Unai — connected via Unipile, so impressions
//   are real): engagement RATE method. ratio = (post eng/impressions) ÷
//   (creator's average eng/impressions). A post is an outlier when it
//   engaged ≥3x better than the creator's typical rate AND cleared the
//   impressions floor AND cleared the absolute engagement floor. This
//   decouples "the post genuinely engaged the people who saw it" from
//   "LinkedIn simply distributed it to more people".
//
//   EVERYONE ELSE (discovered profiles on the Dashboard — no impressions):
//   absolute engagement method, unchanged. ratio = post eng ÷ creator avg
//   eng.
//
// Managed accounts that don't yet have enough posts with impressions fall
// back to the absolute method until the data catches up.
export async function recalcCreatorOutliers(creatorId: string): Promise<void> {
  const { rows: creatorRows } = await pool.query(
    `SELECT is_managed FROM creators WHERE id = $1 LIMIT 1`,
    [creatorId]
  );
  const isManaged = creatorRows[0]?.is_managed === true;

  let useRate = false;
  if (isManaged) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS n
         FROM posts
        WHERE creator_id = $1
          AND linkedin_post_id <> 'DEMO_LIVE_POST'
          AND impressions_count IS NOT NULL
          AND impressions_count > 0`,
      [creatorId]
    );
    useRate = (rows[0]?.n || 0) >= MIN_POSTS_WITH_IMPRESSIONS;
  }

  if (useRate) {
    // Engagement-RATE method. avg_rate = AVG(eng/impressions) over the
    // creator's posts that have impressions. Posts without impressions
    // get ratio 0 / not-outlier (they can't be scored on rate). Set-based
    // single UPDATE so it stays cheap even on a full-history recompute.
    await pool.query(
      `WITH stats AS (
         SELECT AVG(engagement_score::float / NULLIF(impressions_count, 0)) AS avg_rate
           FROM posts
          WHERE creator_id = $1
            AND linkedin_post_id <> 'DEMO_LIVE_POST'
            AND impressions_count IS NOT NULL
            AND impressions_count > 0
       )
       UPDATE posts p SET
         outlier_ratio = CASE
           WHEN p.impressions_count IS NULL OR p.impressions_count = 0 OR s.avg_rate IS NULL OR s.avg_rate = 0 THEN 0
           ELSE COALESCE(round((((p.engagement_score::float / NULLIF(p.impressions_count, 0)) / s.avg_rate))::numeric, 2), 0)
         END,
         is_outlier = (
           s.avg_rate IS NOT NULL AND s.avg_rate > 0
           AND p.impressions_count IS NOT NULL
           AND p.impressions_count >= $2
           AND (p.engagement_score::float / NULLIF(p.impressions_count, 0)) >= s.avg_rate * 3
           AND p.engagement_score >= $3
         )
       FROM stats s
       WHERE p.creator_id = $1 AND p.linkedin_post_id <> 'DEMO_LIVE_POST'`,
      [creatorId, MIN_OUTLIER_IMPRESSIONS, MIN_OUTLIER_ENGAGEMENT]
    );
  } else {
    // Absolute-engagement method (Dashboard / discovered profiles, or a
    // managed account without enough impressions data yet). Unchanged from
    // the original behaviour.
    await pool.query(
      `UPDATE posts p SET
         outlier_ratio = COALESCE(round((p.engagement_score / NULLIF(a.avg, 0))::numeric, 2), 0),
         is_outlier = (a.avg > 0 AND p.engagement_score >= a.avg * 3 AND p.engagement_score >= $2)
       FROM (
         SELECT AVG(engagement_score)::float AS avg
           FROM posts
          WHERE creator_id = $1 AND linkedin_post_id <> 'DEMO_LIVE_POST'
       ) a
       WHERE p.creator_id = $1 AND p.linkedin_post_id <> 'DEMO_LIVE_POST'`,
      [creatorId, MIN_OUTLIER_ENGAGEMENT]
    );
  }
}
