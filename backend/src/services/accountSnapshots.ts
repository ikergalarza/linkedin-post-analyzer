import pool from '../db';
import { unipileService } from './unipile';
import { CreatorModel } from '../models/creator';

// Captures today's follower + profile-view snapshots for a single managed
// creator. Idempotent: re-running on the same calendar day overwrites the
// existing row (unique constraint on creator_id + captured_on). Returns the
// resolved providerId so callers can chain into a post scrape without
// re-fetching the profile.
//
// Lives in a dedicated service (rather than in routes/accounts.ts) so both
// the HTTP handlers AND the background ticker in postMonitor can call it
// without pulling in a circular import between routes ↔ services.
export async function captureAccountSnapshots(creatorId: string): Promise<{
  ok: boolean;
  providerId: string | null;
  followers: number | null;
  views: number | null;
  pages: number | null;
  pagingTotal: number | null;
}> {
  const creator = await CreatorModel.findById(creatorId);
  if (!creator) {
    return { ok: false, providerId: null, followers: null, views: null, pages: null, pagingTotal: null };
  }
  const accountIdOverride = (creator as any).unipile_account_id as string | null;
  if (!accountIdOverride) {
    return {
      ok: false,
      providerId: creator.linkedin_id ?? null,
      followers: null,
      views: null,
      pages: null,
      pagingTotal: null,
    };
  }

  let providerId = creator.linkedin_id;
  let latestFollowers: number | null = null;
  try {
    const rawProfile = await unipileService.getProfile(creator.linkedin_url, accountIdOverride);
    const normalized = unipileService.normalizeProfile(rawProfile, creator.linkedin_url);
    if (!providerId && normalized.linkedin_id) providerId = normalized.linkedin_id;
    if (typeof normalized.followers_count === 'number' && normalized.followers_count >= 0) {
      latestFollowers = normalized.followers_count;
    }
    const updates: Record<string, any> = {};
    if (!creator.linkedin_id && normalized.linkedin_id) updates.linkedin_id = normalized.linkedin_id;
    if (latestFollowers != null) updates.followers_count = latestFollowers;
    if (Object.keys(updates).length > 0) {
      await CreatorModel.update(creator.id, updates as any);
    }
  } catch (err) {
    console.warn(
      '[accountSnapshots] profile fetch failed, continuing with cached data:',
      (err as Error).message
    );
  }
  if (latestFollowers == null && typeof creator.followers_count === 'number') {
    latestFollowers = creator.followers_count;
  }

  if (latestFollowers != null) {
    await pool.query(
      `INSERT INTO creator_follower_snapshots (creator_id, captured_on, captured_at, followers_count)
         VALUES ($1, CURRENT_DATE, NOW(), $2)
       ON CONFLICT (creator_id, captured_on) DO UPDATE
         SET followers_count = EXCLUDED.followers_count,
             captured_at = NOW()`,
      [creator.id, latestFollowers]
    );
  }

  let viewsCount: number | null = null;
  let pages: number | null = null;
  let pagingTotal: number | null = null;
  try {
    const wvmp = await unipileService.getProfileViewers(accountIdOverride);
    if (wvmp) {
      viewsCount = wvmp.count;
      pages = wvmp.pages;
      pagingTotal = wvmp.pagingTotal;
      await pool.query(
        `INSERT INTO creator_profile_view_snapshots
           (creator_id, captured_on, captured_at, views_count, raw_response)
         VALUES ($1, CURRENT_DATE, NOW(), $2, $3::jsonb)
         ON CONFLICT (creator_id, captured_on) DO UPDATE
           SET views_count = EXCLUDED.views_count,
               raw_response = EXCLUDED.raw_response,
               captured_at = NOW()`,
        [creator.id, wvmp.count, JSON.stringify(wvmp.raw)]
      );
    }
  } catch (err) {
    console.warn('[accountSnapshots] profile-view snapshot failed:', (err as Error).message);
  }

  return {
    ok: true,
    providerId: providerId ?? null,
    followers: latestFollowers,
    views: viewsCount,
    pages,
    pagingTotal,
  };
}
