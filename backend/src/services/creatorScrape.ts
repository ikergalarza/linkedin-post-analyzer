import pool from '../db';
import { CreatorModel } from '../models/creator';
import { PostModel } from '../models/post';
import { unipileService } from './unipile';
import { enrichPost } from './engagement';
import { recalcCreatorOutliers } from './outliers';

/**
 * Re-escanea los posts de UN creador y recalcula sus outliers.
 *
 * Vivia dentro de routes/creators.ts como funcion privada. Se saca aqui sin
 * cambiarle el comportamiento porque el job de refresco automatico
 * (services/outlierRefresh.ts) necesita exactamente lo mismo, y duplicar el
 * scraping era garantizar que las dos copias divergieran.
 */
export async function scrapeCreatorPosts(
  creatorId: string,
  linkedinIdentifier: string
): Promise<{ nuevos: number }> {
  console.log(`Scraping posts for creator ${creatorId}...`);

  // INCREMENTAL: if we already have posts for this creator, pass their ids
  // so pagination stops at the first one we already stored (LinkedIn is
  // newest-first). The very first scrape has none → full history; every
  // refresh after that only pulls genuinely new posts. This is what makes
  // a 120-creator refresh-all go from ~40 min to ~1-2 min without losing
  // any history (it's already persisted from the first pass).
  const { rows: knownRows } = await pool.query(
    `SELECT linkedin_post_id FROM posts
      WHERE creator_id = $1 AND linkedin_post_id IS NOT NULL`,
    [creatorId]
  );
  const knownIds = new Set<string>(knownRows.map((r: any) => r.linkedin_post_id));

  const rawPosts = await unipileService.getPosts(
    linkedinIdentifier,
    undefined,
    undefined,
    knownIds
  );
  console.log(`Fetched ${rawPosts.length} ${knownIds.size > 0 ? 'new ' : ''}posts from Unipile`);

  // Filter out reposts — only keep original content
  const originalPosts = rawPosts.filter((raw: any) => {
    if (raw.type === 'repost' || raw.type === 'RESHARE' || raw.type === 'reshare') return false;
    if (raw.is_repost || raw.is_reshare) return false;
    if (raw.reshared_post || raw.original_post) return false;
    return true;
  });
  console.log(
    `Filtered to ${originalPosts.length} original posts (removed ${rawPosts.length - originalPosts.length} reposts)`
  );

  // Normalize, enrich and upsert any NEW posts (may be none on an
  // incremental refresh — that's the fast path).
  const posts = originalPosts.map((raw: any) => {
    const normalized = unipileService.normalizePost(raw, creatorId);
    const enriched = enrichPost(normalized);
    return { ...normalized, ...enriched };
  });
  if (posts.length > 0) {
    await PostModel.bulkUpsert(posts);
  }

  // Always recompute outlier flags over the creator's FULL stored set —
  // not just this batch. An incremental batch has a meaningless local
  // average, so the scoring must run against every post the creator has.
  // recalcCreatorOutliers picks the method by account type and, desde v34,
  // emite los eventos de entrada/salida de outlier que alimentan el digest.
  await recalcCreatorOutliers(creatorId);

  await CreatorModel.update(creatorId, { last_scraped_at: new Date() } as any);

  console.log(`Saved ${posts.length} posts for creator ${creatorId}`);
  return { nuevos: posts.length };
}
