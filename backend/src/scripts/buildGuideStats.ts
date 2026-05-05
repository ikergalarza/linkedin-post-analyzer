/**
 * One-shot script that pulls every aggregate the LinkedIn guide can use,
 * grouped under one JSON object. Run once to enrich the guide markdown
 * with real numbers from your own corpus instead of generic B2B defaults.
 *
 * Run:
 *   cd backend && npx tsx src/scripts/buildGuideStats.ts > guide-stats.json
 *
 * Or pipe to stdout and copy the JSON manually:
 *   cd backend && npx tsx src/scripts/buildGuideStats.ts
 *
 * The script connects to the same DATABASE_URL Express uses. Set the env
 * var (or have a .env file in /backend) before running.
 */
import 'dotenv/config';
import pool from '../db';

interface GuideStats {
  generatedAt: string;
  corpus: {
    creators: number;
    posts: number;
    outliers: number;
    outlierShare: number;
    avgRatioOutliers: number | null;
    maxRatio: number | null;
  };
  topHooks: Array<{ hook_type: string; count: number; avg_ratio: number; max_ratio: number }>;
  topStructures: Array<{ post_structure: string; count: number; avg_ratio: number; max_ratio: number }>;
  topArchetypes: Array<{
    hook_type: string;
    post_structure: string;
    count: number;
    avg_ratio: number;
    max_ratio: number;
  }>;
  bestDayOfWeek: Array<{ dow: number; label: string; outliers: number; avg_ratio: number }>;
  bestHourOfDay: Array<{ hour: number; outliers: number; avg_ratio: number }>;
  topTopics: Array<{ topic: string; outliers: number; avg_ratio: number }>;
  topCreators: Array<{
    name: string;
    followers: number;
    outliers: number;
    avg_ratio: number;
    max_ratio: number;
  }>;
  contentTypeMix: Array<{ content_type: string; outliers: number; share: number }>;
  topToneAmongOutliers: Array<{ text_tone: string; count: number; share: number }>;
  hookLengthBuckets: Array<{ bucket: string; count: number; avg_ratio: number }>;
  postLengthBuckets: Array<{ bucket: string; count: number; avg_ratio: number }>;
}

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

async function buildStats(): Promise<GuideStats> {
  // ─── 1. Corpus summary ────────────────────────────────────────────────
  const corpus = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM creators) AS creators,
      (SELECT COUNT(*)::int FROM posts WHERE linkedin_post_id <> 'DEMO_LIVE_POST') AS posts,
      (SELECT COUNT(*)::int FROM posts WHERE is_outlier = TRUE AND linkedin_post_id <> 'DEMO_LIVE_POST') AS outliers,
      (SELECT AVG(outlier_ratio)::float FROM posts WHERE is_outlier = TRUE) AS avg_ratio_outliers,
      (SELECT MAX(outlier_ratio)::float FROM posts WHERE is_outlier = TRUE) AS max_ratio
  `);
  const c = corpus.rows[0];
  const corpusOut = {
    creators: c.creators,
    posts: c.posts,
    outliers: c.outliers,
    outlierShare: c.posts > 0 ? c.outliers / c.posts : 0,
    avgRatioOutliers: c.avg_ratio_outliers,
    maxRatio: c.max_ratio,
  };

  // ─── 2. Top hooks ─────────────────────────────────────────────────────
  const topHooks = (
    await pool.query(`
      SELECT hook_type,
             COUNT(*)::int AS count,
             AVG(outlier_ratio)::float AS avg_ratio,
             MAX(outlier_ratio)::float AS max_ratio
        FROM posts
       WHERE is_outlier = TRUE
         AND linkedin_post_id <> 'DEMO_LIVE_POST'
         AND hook_type IS NOT NULL AND hook_type <> 'other'
    GROUP BY hook_type
      HAVING COUNT(*) >= 3
    ORDER BY avg_ratio DESC
       LIMIT 10
    `)
  ).rows;

  // ─── 3. Top structures ────────────────────────────────────────────────
  const topStructures = (
    await pool.query(`
      SELECT post_structure,
             COUNT(*)::int AS count,
             AVG(outlier_ratio)::float AS avg_ratio,
             MAX(outlier_ratio)::float AS max_ratio
        FROM posts
       WHERE is_outlier = TRUE
         AND linkedin_post_id <> 'DEMO_LIVE_POST'
         AND post_structure IS NOT NULL AND post_structure <> 'other'
    GROUP BY post_structure
      HAVING COUNT(*) >= 3
    ORDER BY avg_ratio DESC
       LIMIT 10
    `)
  ).rows;

  // ─── 4. Top hook+structure archetypes ─────────────────────────────────
  const topArchetypes = (
    await pool.query(`
      SELECT hook_type,
             post_structure,
             COUNT(*)::int AS count,
             AVG(outlier_ratio)::float AS avg_ratio,
             MAX(outlier_ratio)::float AS max_ratio
        FROM posts
       WHERE is_outlier = TRUE
         AND linkedin_post_id <> 'DEMO_LIVE_POST'
         AND hook_type IS NOT NULL AND hook_type <> 'other'
         AND post_structure IS NOT NULL AND post_structure <> 'other'
    GROUP BY hook_type, post_structure
      HAVING COUNT(*) >= 2
    ORDER BY avg_ratio DESC
       LIMIT 15
    `)
  ).rows;

  // ─── 5. Best day of week ──────────────────────────────────────────────
  const bestDay = (
    await pool.query(`
      SELECT EXTRACT(DOW FROM published_at)::int AS dow,
             COUNT(*)::int AS outliers,
             AVG(outlier_ratio)::float AS avg_ratio
        FROM posts
       WHERE is_outlier = TRUE
         AND linkedin_post_id <> 'DEMO_LIVE_POST'
         AND published_at IS NOT NULL
    GROUP BY EXTRACT(DOW FROM published_at)
    ORDER BY avg_ratio DESC
    `)
  ).rows.map((r: any) => ({
    dow: r.dow,
    label: DAY_LABELS[r.dow] || `dow ${r.dow}`,
    outliers: r.outliers,
    avg_ratio: r.avg_ratio,
  }));

  // ─── 6. Best hour of day (UTC; user can shift to local) ──────────────
  const bestHour = (
    await pool.query(`
      SELECT EXTRACT(HOUR FROM published_at)::int AS hour,
             COUNT(*)::int AS outliers,
             AVG(outlier_ratio)::float AS avg_ratio
        FROM posts
       WHERE is_outlier = TRUE
         AND linkedin_post_id <> 'DEMO_LIVE_POST'
         AND published_at IS NOT NULL
    GROUP BY EXTRACT(HOUR FROM published_at)
    ORDER BY avg_ratio DESC
       LIMIT 24
    `)
  ).rows;

  // ─── 7. Top topics among outliers ─────────────────────────────────────
  const topTopics = (
    await pool.query(`
      SELECT topic,
             COUNT(*)::int AS outliers,
             AVG(outlier_ratio)::float AS avg_ratio
        FROM posts
       WHERE is_outlier = TRUE
         AND linkedin_post_id <> 'DEMO_LIVE_POST'
         AND topic IS NOT NULL AND topic <> ''
    GROUP BY topic
    ORDER BY outliers DESC, avg_ratio DESC
       LIMIT 15
    `)
  ).rows;

  // ─── 8. Top creators ──────────────────────────────────────────────────
  const topCreators = (
    await pool.query(`
      SELECT c.name,
             COALESCE(c.followers_count, 0)::int AS followers,
             COUNT(p.id)::int AS outliers,
             AVG(p.outlier_ratio)::float AS avg_ratio,
             MAX(p.outlier_ratio)::float AS max_ratio
        FROM creators c
        JOIN posts p ON p.creator_id = c.id
       WHERE p.is_outlier = TRUE
         AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
    GROUP BY c.id
      HAVING COUNT(p.id) >= 2
    ORDER BY avg_ratio DESC
       LIMIT 20
    `)
  ).rows;

  // ─── 9. Content-type mix among outliers ───────────────────────────────
  const contentMix = (
    await pool.query(`
      SELECT COALESCE(content_type, 'text') AS content_type,
             COUNT(*)::int AS outliers
        FROM posts
       WHERE is_outlier = TRUE
         AND linkedin_post_id <> 'DEMO_LIVE_POST'
    GROUP BY content_type
    ORDER BY outliers DESC
    `)
  ).rows;
  const contentTotal = contentMix.reduce((s: number, r: any) => s + r.outliers, 0);
  const contentTypeMix = contentMix.map((r: any) => ({
    content_type: r.content_type,
    outliers: r.outliers,
    share: contentTotal > 0 ? r.outliers / contentTotal : 0,
  }));

  // ─── 10. Tone among outliers ──────────────────────────────────────────
  const toneRows = (
    await pool.query(`
      SELECT COALESCE(text_tone, 'neutral') AS text_tone,
             COUNT(*)::int AS count
        FROM posts
       WHERE is_outlier = TRUE
         AND linkedin_post_id <> 'DEMO_LIVE_POST'
    GROUP BY text_tone
    ORDER BY count DESC
       LIMIT 10
    `)
  ).rows;
  const toneTotal = toneRows.reduce((s: number, r: any) => s + r.count, 0);
  const topToneAmongOutliers = toneRows.map((r: any) => ({
    text_tone: r.text_tone,
    count: r.count,
    share: toneTotal > 0 ? r.count / toneTotal : 0,
  }));

  // ─── 11. Hook length buckets ──────────────────────────────────────────
  const hookLengthBuckets = (
    await pool.query(`
      SELECT CASE
               WHEN LENGTH(hook_text) <= 60  THEN '0-60'
               WHEN LENGTH(hook_text) <= 100 THEN '60-100'
               WHEN LENGTH(hook_text) <= 140 THEN '100-140'
               WHEN LENGTH(hook_text) <= 200 THEN '140-200'
               ELSE '200+'
             END AS bucket,
             COUNT(*)::int AS count,
             AVG(outlier_ratio)::float AS avg_ratio
        FROM posts
       WHERE is_outlier = TRUE
         AND linkedin_post_id <> 'DEMO_LIVE_POST'
         AND hook_text IS NOT NULL AND LENGTH(hook_text) > 0
    GROUP BY bucket
    ORDER BY avg_ratio DESC
    `)
  ).rows;

  // ─── 12. Post length buckets ──────────────────────────────────────────
  const postLengthBuckets = (
    await pool.query(`
      SELECT CASE
               WHEN word_count IS NULL THEN 'unknown'
               WHEN word_count <= 80  THEN '0-80'
               WHEN word_count <= 200 THEN '80-200'
               WHEN word_count <= 400 THEN '200-400'
               WHEN word_count <= 700 THEN '400-700'
               ELSE '700+'
             END AS bucket,
             COUNT(*)::int AS count,
             AVG(outlier_ratio)::float AS avg_ratio
        FROM posts
       WHERE is_outlier = TRUE
         AND linkedin_post_id <> 'DEMO_LIVE_POST'
    GROUP BY bucket
    ORDER BY avg_ratio DESC
    `)
  ).rows;

  return {
    generatedAt: new Date().toISOString(),
    corpus: corpusOut,
    topHooks,
    topStructures,
    topArchetypes,
    bestDayOfWeek: bestDay,
    bestHourOfDay: bestHour,
    topTopics,
    topCreators,
    contentTypeMix,
    topToneAmongOutliers,
    hookLengthBuckets,
    postLengthBuckets,
  };
}

(async () => {
  try {
    const stats = await buildStats();
    process.stdout.write(JSON.stringify(stats, null, 2) + '\n');
  } catch (err: any) {
    process.stderr.write(`[buildGuideStats] ${err.message}\n${err.stack}\n`);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
