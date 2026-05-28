import pool from '../db';
import { MIN_OUTLIER_ENGAGEMENT } from './engagement';

// Minimum number of posts WITH impressions a managed creator needs before
// we factor reach in. Below this the per-creator average impressions is too
// noisy, so we fall back to the absolute-engagement method.
const MIN_POSTS_WITH_IMPRESSIONS = 3;

// Recompute outlier_ratio + is_outlier for EVERY post of one creator,
// choosing the method by account type — the single source of truth for
// outlier scoring. Replaces the duplicated inline loops/SQL that used to
// live in postMonitor and creators.
//
//   MANAGED accounts (Iker / Unai — connected via Unipile, so impressions
//   are real): HYBRID method. We compute TWO ratios and take the GREATER:
//     · engagement ratio = post eng ÷ creator's avg eng
//     · reach ratio      = post impressions ÷ creator's avg impressions
//   outlier_ratio = max(engagement ratio, reach ratio). A post is an
//   outlier when it stood out on EITHER axis (>=3x) and cleared the
//   absolute engagement floor. This makes impressions count IN FAVOUR of
//   a post (a record-reach post like the 168K cold-calling meme scores
//   high via the reach ratio) instead of against it. We deliberately do
//   NOT divide engagement by impressions — engagement RATE drops as reach
//   grows (viral posts hit a colder audience), so dividing would punish
//   exactly the posts that travelled.
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

  let useHybrid = false;
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
    useHybrid = (rows[0]?.n || 0) >= MIN_POSTS_WITH_IMPRESSIONS;
  }

  if (useHybrid) {
    // HYBRID method. outlier_ratio = GREATEST(engagement ratio, reach
    // ratio). avg_eng over all posts; avg_imp over posts that have
    // impressions. A post with no impressions still gets scored on its
    // engagement ratio (reach side contributes 0). Set-based single
    // UPDATE so it stays cheap even on a full-history recompute.
    await pool.query(
      `WITH stats AS (
         SELECT
           AVG(engagement_score)::float AS avg_eng,
           AVG(impressions_count) FILTER (
             WHERE impressions_count IS NOT NULL AND impressions_count > 0
           )::float AS avg_imp
           FROM posts
          WHERE creator_id = $1 AND linkedin_post_id <> 'DEMO_LIVE_POST'
       )
       UPDATE posts p SET
         outlier_ratio = GREATEST(
           CASE WHEN s.avg_eng > 0
             THEN COALESCE(round((p.engagement_score / s.avg_eng)::numeric, 2), 0)
             ELSE 0 END,
           CASE WHEN p.impressions_count IS NOT NULL AND p.impressions_count > 0 AND s.avg_imp > 0
             THEN COALESCE(round((p.impressions_count::float / s.avg_imp)::numeric, 2), 0)
             ELSE 0 END
         ),
         is_outlier = (
           p.engagement_score >= $2
           AND GREATEST(
             CASE WHEN s.avg_eng > 0 THEN p.engagement_score::float / s.avg_eng ELSE 0 END,
             CASE WHEN p.impressions_count IS NOT NULL AND p.impressions_count > 0 AND s.avg_imp > 0
               THEN p.impressions_count::float / s.avg_imp ELSE 0 END
           ) >= 3.0
         )
       FROM stats s
       WHERE p.creator_id = $1 AND p.linkedin_post_id <> 'DEMO_LIVE_POST'`,
      [creatorId, MIN_OUTLIER_ENGAGEMENT]
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
