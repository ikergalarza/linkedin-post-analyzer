import { Router, Request, Response } from 'express';
import { CreatorModel } from '../models/creator';
import { PostModel } from '../models/post';
import { unipileService } from '../services/unipile';
import { enrichPost, recalculateOutliers } from '../services/engagement';
import { normalizeLinkedInUrl, isValidLinkedInUrl } from '../utils/linkedin';

function paramId(req: Request): string {
  return paramId(req) as string;
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

    // Fetch profile from Unipile
    let profileData;
    try {
      const rawProfile = await unipileService.getProfile(normalized);
      profileData = unipileService.normalizeProfile(rawProfile, normalized);
    } catch (err: any) {
      console.error('Unipile profile fetch failed:', err.message);
      // Create with minimal data
      profileData = { linkedin_url: normalized, linkedin_id: null, name: null, headline: null, followers_count: 0, connections_count: 0, profile_image_url: null };
    }

    const creator = await CreatorModel.create(profileData);

    // Scrape posts in background
    scrapeCreatorPosts(creator.id, profileData.linkedin_id || unipileService.extractLinkedInIdentifier(normalized))
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
  try {
    const creator = await CreatorModel.findById(paramId(req) as string);
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    const stats = await PostModel.getStats(creator.id);
    res.json({ ...creator, stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/creators/:id/refresh — Re-scrape posts
router.post('/:id/refresh', async (req: Request, res: Response) => {
  try {
    const creator = await CreatorModel.findById(paramId(req));
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    const identifier = creator.linkedin_id || unipileService.extractLinkedInIdentifier(creator.linkedin_url);
    scrapeCreatorPosts(creator.id, identifier)
      .catch((err) => console.error(`Refresh failed for ${creator.id}:`, err));

    res.json({ message: 'Refresh started' });
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

// Background scraping function
async function scrapeCreatorPosts(creatorId: string, linkedinIdentifier: string) {
  console.log(`Scraping posts for creator ${creatorId}...`);

  const rawPosts = await unipileService.getPosts(linkedinIdentifier);
  console.log(`Fetched ${rawPosts.length} posts from Unipile`);

  if (rawPosts.length === 0) return;

  // Normalize and enrich posts
  let posts = rawPosts.map((raw) => {
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
