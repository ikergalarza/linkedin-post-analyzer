import { Router, Request, Response } from 'express';
import { NetworkCreatorModel } from '../models/networkCreator';
import { NetworkPostModel } from '../models/networkPost';
import { NetworkCommentModel } from '../models/networkComment';
import { CommenterProfileModel } from '../models/commenterProfile';
import { unipileService } from '../services/unipile';
import { generateComments } from '../services/commentGenerator';
import { normalizeLinkedInUrl, isValidLinkedInUrl } from '../utils/linkedin';
import { extractHook } from '../services/engagement';

const router = Router();

function paramId(req: Request): string {
  return req.params.id as string;
}

// ─── Commenter Profile ───

router.get('/profile', async (_req: Request, res: Response) => {
  try {
    const profile = await CommenterProfileModel.get();
    res.json(profile || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', async (req: Request, res: Response) => {
  try {
    const profile = await CommenterProfileModel.upsert(req.body);
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Network Creators ───

router.post('/creators', async (req: Request, res: Response) => {
  try {
    const { linkedin_url, tier } = req.body;
    if (!linkedin_url) {
      return res.status(400).json({ error: 'linkedin_url is required' });
    }

    const normalized = normalizeLinkedInUrl(linkedin_url);
    if (!isValidLinkedInUrl(normalized)) {
      return res.status(400).json({ error: 'Invalid LinkedIn URL' });
    }

    const existing = await NetworkCreatorModel.findByUrl(normalized);
    if (existing) {
      return res.status(409).json({ error: 'Creator already in your network', creator: existing });
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

    const creator = await NetworkCreatorModel.create({
      linkedin_url: normalized,
      linkedin_id: profileData.linkedin_id,
      name: profileData.name,
      headline: profileData.headline,
      followers_count: profileData.followers_count,
      profile_image_url: profileData.profile_image_url,
      tier: tier ?? 2,
    });

    // Background fetch of recent posts
    fetchNetworkCreatorPosts(creator.id, profileData.linkedin_id)
      .catch((err) => console.error(`Network post fetch failed for ${creator.id}:`, err));

    res.status(201).json(creator);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/creators', async (_req: Request, res: Response) => {
  try {
    const creators = await NetworkCreatorModel.findAll();
    res.json(creators);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/creators/:id', async (req: Request, res: Response) => {
  try {
    const creator = await NetworkCreatorModel.findById(paramId(req));
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    const updated = await NetworkCreatorModel.update(paramId(req), req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/creators/:id', async (req: Request, res: Response) => {
  try {
    const creator = await NetworkCreatorModel.findById(paramId(req));
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    await NetworkCreatorModel.delete(paramId(req));
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Weekly Feed ───

function getWeekBounds(offset: number = 0): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getUTCDay();
  // Monday = 1, Sunday = 0 → shift so Monday is start
  const diffToMonday = day === 0 ? 6 : day - 1;

  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diffToMonday + offset * 7);
  monday.setUTCHours(0, 0, 0, 0);

  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(monday.getUTCDate() + 7);

  return { start: monday, end: nextMonday };
}

router.get('/feed', async (req: Request, res: Response) => {
  try {
    const weekOffset = parseInt(req.query.week_offset as string) || 0;
    const { start, end } = getWeekBounds(weekOffset);

    const posts = await NetworkPostModel.findWeekly(start, end);

    // Load comments for all posts in one query
    const postIds = posts.map((p) => p.id);
    const comments = await NetworkCommentModel.findByPosts(postIds);

    // Group comments by post
    const commentsByPost: Record<string, typeof comments> = {};
    for (const c of comments) {
      if (!commentsByPost[c.network_post_id]) commentsByPost[c.network_post_id] = [];
      commentsByPost[c.network_post_id].push(c);
    }

    const enrichedPosts = posts.map((p) => ({
      ...p,
      comments: commentsByPost[p.id] || [],
    }));

    res.json({
      posts: enrichedPosts,
      week_start: start.toISOString(),
      week_end: end.toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory progress tracker for the weekly refresh. Personal-tool scale, single instance.
const refreshProgress = {
  running: false,
  current: 0,
  total: 0,
  currentName: '' as string | null,
  startedAt: null as number | null,
  lastFinishedAt: null as number | null,
};

router.get('/feed/refresh-progress', (_req: Request, res: Response) => {
  res.json(refreshProgress);
});

router.post('/feed/refresh', async (_req: Request, res: Response) => {
  try {
    const creators = await NetworkCreatorModel.findAll();
    let totalNew = 0;
    let refreshed = 0;

    refreshProgress.running = true;
    refreshProgress.current = 0;
    refreshProgress.total = creators.length;
    refreshProgress.currentName = null;
    refreshProgress.startedAt = Date.now();

    for (const creator of creators) {
      if (!creator.linkedin_id) {
        refreshProgress.current++;
        continue;
      }
      refreshProgress.currentName = creator.name || 'Unknown';
      try {
        const count = await fetchNetworkCreatorPosts(creator.id, creator.linkedin_id);
        totalNew += count;
        refreshed++;
        // 1s delay between creators to avoid rate limiting
        if (refreshed < creators.length) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (err: any) {
        console.error(`Failed to refresh network creator ${creator.id}:`, err.message);
      } finally {
        refreshProgress.current++;
      }
    }

    refreshProgress.running = false;
    refreshProgress.lastFinishedAt = Date.now();
    refreshProgress.currentName = null;

    res.json({ refreshed, total_new_posts: totalNew });
  } catch (err: any) {
    refreshProgress.running = false;
    refreshProgress.currentName = null;
    res.status(500).json({ error: err.message });
  }
});

// ─── Post Actions ───

router.patch('/posts/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending', 'commented', 'skipped'].includes(status)) {
      return res.status(400).json({ error: 'status must be pending, commented, or skipped' });
    }
    const post = await NetworkPostModel.updateStatus(paramId(req), status);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/posts/:id/generate-comments', async (req: Request, res: Response) => {
  try {
    console.log('[COMMENT GEN] Step 1: Getting profile...');
    const profile = await CommenterProfileModel.get();
    if (!profile) {
      return res.status(400).json({ error: 'Please configure your commenter profile first' });
    }
    console.log('[COMMENT GEN] Step 2: Profile found, getting post...');

    const post = await NetworkPostModel.findByIdWithCreator(paramId(req));
    if (!post) return res.status(404).json({ error: 'Post not found' });
    console.log('[COMMENT GEN] Step 3: Post found, calling AI...', { postId: post.id, contentLen: post.content_text?.length });

    const generated = await generateComments({
      postContent: post.content_text || '',
      creatorName: post.creator_name,
      creatorHeadline: post.creator_headline || null,
      profile: {
        headline: profile.headline,
        voice_style: profile.voice_style,
        worldview: profile.worldview,
        signature_moves: profile.signature_moves,
        avoid: profile.avoid,
        // legacy fallbacks
        tone: profile.tone,
        expertise: profile.expertise,
      },
    });
    console.log('[COMMENT GEN] Step 4: AI response received, saving...');

    // Delete existing comments for regeneration
    await NetworkCommentModel.deleteByPost(post.id);

    // Insert 5 new comments (3 contrarian flavors + reframe + supportive)
    const comments = await NetworkCommentModel.bulkInsert([
      { network_post_id: post.id, angle: 'contrarian_reflective' as const, comment_text: generated.contrarian_reflective },
      { network_post_id: post.id, angle: 'contrarian_direct' as const, comment_text: generated.contrarian_direct },
      { network_post_id: post.id, angle: 'contrarian_data' as const, comment_text: generated.contrarian_data },
      { network_post_id: post.id, angle: 'reframe' as const, comment_text: generated.reframe },
      { network_post_id: post.id, angle: 'supportive' as const, comment_text: generated.supportive },
    ]);
    console.log('[COMMENT GEN] Step 5: Done, returning comments');

    res.json(comments);
  } catch (err: any) {
    console.error('[COMMENT GEN ERROR]', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

router.post('/comments/:id/select', async (req: Request, res: Response) => {
  try {
    await NetworkCommentModel.markSelected(paramId(req));
    res.json({ message: 'Selected' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Background fetch helper ───

async function fetchNetworkCreatorPosts(creatorId: string, linkedinId: string): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 14); // Last 2 weeks

  const rawPosts = await unipileService.getPosts(linkedinId, since);

  // Filter out reposts
  const originalPosts = rawPosts.filter((raw: any) => {
    if (raw.type === 'repost' || raw.type === 'RESHARE' || raw.type === 'reshare') return false;
    if (raw.is_repost || raw.is_reshare) return false;
    if (raw.reshared_post || raw.original_post) return false;
    return true;
  });

  if (originalPosts.length === 0) return 0;

  const posts = originalPosts.map((raw: any) => {
    const normalized = unipileService.normalizePost(raw, creatorId);
    return {
      network_creator_id: creatorId,
      linkedin_post_id: normalized.linkedin_post_id,
      content_text: normalized.content_text,
      hook_text: extractHook(normalized.content_text),
      published_at: normalized.published_at,
      likes_count: normalized.likes_count,
      comments_count: normalized.comments_count,
      reposts_count: normalized.reposts_count,
      post_url: normalized.post_url,
    };
  });

  await NetworkPostModel.bulkUpsert(posts);
  await NetworkCreatorModel.update(creatorId, { last_fetched_at: new Date() } as any);

  console.log(`Fetched ${posts.length} network posts for creator ${creatorId}`);
  return posts.length;
}

export default router;
