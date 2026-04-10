import { Router, Request, Response } from 'express';
import { CreatorProfileModel, MyPost } from '../models/creatorProfile';
import { unipileService } from '../services/unipile';
import { normalizeLinkedInUrl, isValidLinkedInUrl } from '../utils/linkedin';
import { extractHook, calculateEngagement } from '../services/engagement';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const profile = await CreatorProfileModel.get();
    res.json(profile || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/post-creator/profile — update text fields only
router.put('/', async (req: Request, res: Response) => {
  try {
    const { company, product, positioning, tone_style } = req.body;
    const profile = await CreatorProfileModel.upsert({
      company,
      product,
      positioning,
      tone_style,
    });
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/post-creator/profile/link — link a LinkedIn URL, fetch profile + posts
router.post('/link', async (req: Request, res: Response) => {
  try {
    const { linkedin_url } = req.body;
    if (!linkedin_url) return res.status(400).json({ error: 'linkedin_url is required' });

    const normalized = normalizeLinkedInUrl(linkedin_url);
    if (!isValidLinkedInUrl(normalized)) {
      return res.status(400).json({ error: 'Invalid LinkedIn URL' });
    }

    let profileData;
    try {
      const rawProfile = await unipileService.getProfile(normalized);
      profileData = unipileService.normalizeProfile(rawProfile, normalized);
    } catch (err: any) {
      return res.status(422).json({ error: `Could not fetch LinkedIn profile: ${err.message}` });
    }

    if (!profileData.linkedin_id) {
      return res.status(422).json({ error: 'Could not resolve LinkedIn internal ID' });
    }

    // Fetch posts
    const myPosts = await fetchMyPosts(profileData.linkedin_id);

    const profile = await CreatorProfileModel.upsert({
      linkedin_url: normalized,
      linkedin_id: profileData.linkedin_id,
      name: profileData.name,
      headline: profileData.headline,
      profile_image_url: profileData.profile_image_url,
      followers_count: profileData.followers_count,
      my_posts: myPosts,
      last_fetched_at: new Date(),
    });

    res.json(profile);
  } catch (err: any) {
    console.error('[PROFILE LINK ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/post-creator/profile/refresh — re-fetch posts
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    const profile = await CreatorProfileModel.get();
    if (!profile || !profile.linkedin_id) {
      return res.status(400).json({ error: 'No LinkedIn profile linked yet' });
    }

    const myPosts = await fetchMyPosts(profile.linkedin_id);
    const updated = await CreatorProfileModel.upsert({
      my_posts: myPosts,
      last_fetched_at: new Date(),
    });

    res.json(updated);
  } catch (err: any) {
    console.error('[PROFILE REFRESH ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Fetch recent posts from Unipile, return top 20 by engagement
async function fetchMyPosts(linkedinId: string): Promise<MyPost[]> {
  const rawPosts = await unipileService.getPosts(linkedinId);

  const originalPosts = rawPosts.filter((raw: any) => {
    if (raw.type === 'repost' || raw.type === 'RESHARE' || raw.type === 'reshare') return false;
    if (raw.is_repost || raw.is_reshare) return false;
    if (raw.reshared_post || raw.original_post) return false;
    return true;
  });

  const normalized = originalPosts.map((raw: any) => {
    const n = unipileService.normalizePost(raw, '');
    const engagement = calculateEngagement({
      likes_count: n.likes_count || 0,
      comments_count: n.comments_count || 0,
      reposts_count: n.reposts_count || 0,
    } as any);
    return {
      content_text: n.content_text || '',
      hook_text: extractHook(n.content_text),
      likes_count: n.likes_count || 0,
      comments_count: n.comments_count || 0,
      reposts_count: n.reposts_count || 0,
      published_at: n.published_at ? new Date(n.published_at as any).toISOString() : null,
      post_url: n.post_url,
      engagement_score: engagement,
    } as MyPost;
  });

  // Sort by engagement and keep top 20
  normalized.sort((a, b) => b.engagement_score - a.engagement_score);
  return normalized.slice(0, 20);
}

export default router;
