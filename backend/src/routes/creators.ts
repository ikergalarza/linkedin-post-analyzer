import { Router, Request, Response } from 'express';
import { CreatorModel } from '../models/creator';
import { PostModel } from '../models/post';
import { unipileService } from '../services/unipile';
import { enrichPost, recalculateOutliers } from '../services/engagement';
import { normalizeLinkedInUrl, isValidLinkedInUrl } from '../utils/linkedin';
import { estimateTimezone } from '../utils/timezone';
import pool from '../db';

function paramId(req: Request): string {
  return req.params.id as string;
}

const router = Router();

// POST /api/creators — Add a creator and scrape their posts
router.post('/', async (req: Request, res: Response) => {
  try {
    const { linkedin_url } = req.body;
    if (!linkedin_url) {
      return res.status(400).json({ error: 'linkedin_url is required' });
    }

    const normalized = normalizeLinkedInUrl(linkedin_url);
    if (!isValidLinkedInUrl(normalized)) {
      return res.status(400).json({ error: 'Invalid LinkedIn URL' });
    }

    // Check if already exists
    const existing = await CreatorModel.findByUrl(normalized);
    if (existing) {
      return res.status(409).json({ error: 'Creator already exists', creator: existing });
    }

    // Step 1: Fetch profile from Unipile to get the provider_id (internal ID)
    let profileData;
    let rawProfile;
    try {
      rawProfile = await unipileService.getProfile(normalized);
      profileData = unipileService.normalizeProfile(rawProfile, normalized);
      console.log(`Profile resolved: name=${profileData.name}, linkedin_id=${profileData.linkedin_id}`);
    } catch (err: any) {
      console.error('Unipile profile fetch failed:', err.message);
      return res.status(422).json({ error: `Could not fetch LinkedIn profile: ${err.message}` });
    }

    if (!profileData.linkedin_id) {
      console.error('No provider_id found in profile response. Raw keys:', rawProfile ? Object.keys(rawProfile) : 'none');
      return res.status(422).json({ error: 'Could not resolve LinkedIn internal ID from profile. Check Unipile account connection.' });
    }

    const creator = await CreatorModel.create(profileData);

    // Step 2: Scrape posts using the provider_id (NOT the public username)
    scrapeCreatorPosts(creator.id, profileData.linkedin_id)
      .catch((err) => console.error(`Post scraping failed for ${creator.id}:`, err));

    res.status(201).json(creator);
  } catch (err: any) {
    console.error('Create creator error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/creators — List all creators
router.get('/', async (_req: Request, res: Response) => {
  try {
    const creators = await CreatorModel.findAll();

    // Attach post counts
    const enriched = await Promise.all(
      creators.map(async (c) => {
        const stats = await PostModel.getStats(c.id);
        return {
          ...c,
          total_posts: parseInt(stats.total_posts, 10) || 0,
          total_outliers: parseInt(stats.total_outliers, 10) || 0,
          avg_engagement: stats.avg_engagement ? Math.round(parseFloat(stats.avg_engagement)) : 0,
        };
      })
    );

    res.json(enriched);
  } catch (err: any) {
    console.error('List creators error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/creators/:id — Get creator detail
router.get('/:id', async (req: Request, res: Response) => {
  const reqId = paramId(req);
  console.log(`[GET /:id] START id=${reqId}`);
  try {
    console.log(`[GET /:id] Step 1: querying creator...`);
    const { rows } = await pool.query(
      'SELECT id, linkedin_url, linkedin_id, name, headline, followers_count, connections_count, profile_image_url, location, timezone, utc_offset, last_scraped_at, created_at FROM creators WHERE id = $1',
      [reqId]
    );
    console.log(`[GET /:id] Step 2: got ${rows.length} rows`);

    if (rows.length === 0) {
      console.log(`[GET /:id] Not found`);
      return res.status(404).json({ error: 'Creator not found' });
    }

    const creator = rows[0];
    console.log(`[GET /:id] Step 3: creator name=${creator.name}`);

    console.log(`[GET /:id] Step 4: querying stats...`);
    const statsResult = await pool.query(
      `SELECT COUNT(*)::int as total_posts,
              COUNT(*) FILTER (WHERE is_outlier = TRUE)::int as total_outliers,
              COALESCE(AVG(engagement_score), 0)::float as avg_engagement,
              COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY engagement_score), 0)::float as median_engagement,
              COALESCE(STDDEV(engagement_score), 0)::float as stddev_engagement
       FROM posts WHERE creator_id = $1`,
      [reqId]
    );
    const stats = statsResult.rows[0];
    console.log(`[GET /:id] Step 5: stats=`, stats);

    const response = {
      id: creator.id,
      linkedin_url: creator.linkedin_url,
      linkedin_id: creator.linkedin_id,
      name: creator.name,
      headline: creator.headline,
      followers_count: creator.followers_count,
      connections_count: creator.connections_count,
      profile_image_url: creator.profile_image_url,
      location: creator.location,
      timezone: creator.timezone,
      utc_offset: creator.utc_offset,
      last_scraped_at: creator.last_scraped_at,
      created_at: creator.created_at,
      stats: {
        total_posts: Number(stats.total_posts) || 0,
        total_outliers: Number(stats.total_outliers) || 0,
        avg_engagement: Number(stats.avg_engagement) || 0,
        median_engagement: Number(stats.median_engagement) || 0,
        stddev_engagement: Number(stats.stddev_engagement) || 0,
      },
    };

    console.log(`[GET /:id] Step 6: sending response...`);
    res.json(response);
    console.log(`[GET /:id] Step 7: DONE`);
  } catch (err: any) {
    console.error(`[GET /:id] ERROR:`, err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/creators/refresh-batch — Re-scrape multiple creators
router.post('/refresh-batch', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body; // array of creator IDs, or empty/null for all
    let creators: NonNullable<Awaited<ReturnType<typeof CreatorModel.findById>>>[];
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const found = await Promise.all(ids.map((id: string) => CreatorModel.findById(id)));
      creators = found.filter((c): c is NonNullable<typeof c> => c != null);
    } else {
      creators = await CreatorModel.findAll();
    }

    const results: { id: string; name: string | null; status: string }[] = [];
    for (const creator of creators) {
      if (!creator.linkedin_id) {
        results.push({ id: creator.id, name: creator.name, status: 'skipped: no linkedin_id' });
        continue;
      }
      try {
        await scrapeCreatorPosts(creator.id, creator.linkedin_id);
        results.push({ id: creator.id, name: creator.name, status: 'ok' });
      } catch (err: any) {
        results.push({ id: creator.id, name: creator.name, status: `error: ${err.message}` });
      }
    }

    res.json({ refreshed: results.filter(r => r.status === 'ok').length, total: creators.length, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/creators/:id/refresh — Re-scrape posts
router.post('/:id/refresh', async (req: Request, res: Response) => {
  try {
    const creator = await CreatorModel.findById(paramId(req));
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    if (!creator.linkedin_id) {
      return res.status(422).json({ error: 'No LinkedIn internal ID stored. Delete and re-add this creator.' });
    }

    // Always try to update profile data (location, timezone, followers, etc.)
    try {
      const rawProfile = await unipileService.getProfile(creator.linkedin_url);
      const profileData = unipileService.normalizeProfile(rawProfile, creator.linkedin_url);
      const updateFields: any = {};
      if (profileData.location) updateFields.location = profileData.location;
      if (profileData.timezone) updateFields.timezone = profileData.timezone;
      if (profileData.utc_offset != null) updateFields.utc_offset = profileData.utc_offset;
      if (profileData.followers_count > 0) updateFields.followers_count = profileData.followers_count;
      if (profileData.name) updateFields.name = profileData.name;
      if (profileData.headline) updateFields.headline = profileData.headline;
      if (profileData.profile_image_url) updateFields.profile_image_url = profileData.profile_image_url;
      if (Object.keys(updateFields).length > 0) {
        await CreatorModel.update(creator.id, updateFields);
        console.log(`[Refresh] Updated profile fields: ${Object.keys(updateFields).join(', ')}`);
      }
    } catch (err: any) {
      console.log(`Could not refresh profile data: ${err.message}`);
    }

    await scrapeCreatorPosts(creator.id, creator.linkedin_id);
    res.json({ message: 'Refresh complete' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/creators/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const creator = await CreatorModel.findById(paramId(req));
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    await CreatorModel.delete(paramId(req));
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/creators/reclassify — scan raw_data of text_only posts and fix content_type
router.post('/reclassify', async (_req: Request, res: Response) => {
  try {
    // Fetch all posts (not just text_only — re-check everything)
    const { rows: posts } = await pool.query(
      `SELECT id, content_type, raw_data FROM posts WHERE raw_data IS NOT NULL`
    );

    let updated = 0;
    const errors: string[] = [];

    for (const post of posts) {
      try {
        const raw = post.raw_data || {};
        const detected = detectContentTypeFromRaw(raw);
        if (detected !== post.content_type) {
          await pool.query('UPDATE posts SET content_type = $1 WHERE id = $2', [detected, post.id]);
          updated++;
        }
      } catch (e: any) {
        errors.push(`${post.id}: ${e.message}`);
      }
    }

    res.json({ total: posts.length, updated, errors: errors.slice(0, 10) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Standalone content type detector that works on raw_data objects
function detectContentTypeFromRaw(raw: any): string {
  if (raw.poll) return 'poll';
  if (raw.article) return 'article';

  if (Array.isArray(raw.attachments) && raw.attachments.length > 0) {
    const types = raw.attachments.map((a: any) => (a.type || '').toLowerCase());
    if (types.some((t: string) => t.includes('video'))) return 'video';
    if (types.some((t: string) => t.includes('document') || t.includes('pdf'))) return 'document';
    const imageCount = types.filter((t: string) => t.includes('image') || t.includes('photo') || t.includes('picture')).length;
    if (raw.attachments.length > 1) return imageCount > 1 ? 'carousel' : 'carousel';
    if (imageCount >= 1) return 'image';
    // attachment exists but type unknown — check for url
    if (raw.attachments.some((a: any) => a.url || a.download_url)) return 'image';
  }

  if (raw.video) return 'video';
  if (Array.isArray(raw.documents) && raw.documents.length > 0) return 'document';
  if (Array.isArray(raw.images)) {
    if (raw.images.length > 1) return 'carousel';
    if (raw.images.length === 1) return 'image';
  }
  if (Array.isArray(raw.media)) {
    if (raw.media.length > 1) return 'carousel';
    if (raw.media.length === 1) {
      const m = raw.media[0];
      const t = (m.type || m.media_type || '').toLowerCase();
      if (t.includes('video')) return 'video';
      if (t.includes('document')) return 'document';
      return 'image';
    }
  }

  // Only specific top-level image fields that Unipile uses for post media
  if (raw.image_url) return 'image';
  if (raw.image && typeof raw.image === 'string' && raw.image.startsWith('http')) return 'image';

  return 'text_only';
}

// Background scraping function
async function scrapeCreatorPosts(creatorId: string, linkedinIdentifier: string) {
  console.log(`Scraping posts for creator ${creatorId}...`);

  const rawPosts = await unipileService.getPosts(linkedinIdentifier);
  console.log(`Fetched ${rawPosts.length} posts from Unipile`);

  if (rawPosts.length === 0) return;

  // Filter out reposts — only keep original content
  const originalPosts = rawPosts.filter((raw) => {
    if (raw.type === 'repost' || raw.type === 'RESHARE' || raw.type === 'reshare') return false;
    if (raw.is_repost || raw.is_reshare) return false;
    if (raw.reshared_post || raw.original_post) return false;
    return true;
  });
  console.log(`Filtered to ${originalPosts.length} original posts (removed ${rawPosts.length - originalPosts.length} reposts)`);

  if (originalPosts.length === 0) return;

  // Normalize and enrich posts
  let posts = originalPosts.map((raw) => {
    const normalized = unipileService.normalizePost(raw, creatorId);
    const enriched = enrichPost(normalized);
    return { ...normalized, ...enriched };
  });

  // Calculate outliers
  const withOutliers = recalculateOutliers(posts);
  posts = withOutliers.map((o, i) => ({
    ...posts[i],
    outlier_ratio: o.outlier_ratio,
    is_outlier: o.is_outlier,
  }));

  // Save to DB
  await PostModel.bulkUpsert(posts);

  // Update creator's last_scraped_at
  await CreatorModel.update(creatorId, { last_scraped_at: new Date() } as any);

  console.log(`Saved ${posts.length} posts for creator ${creatorId}`);
}

export default router;
