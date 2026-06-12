import { Router, Request, Response } from 'express';
import { PostModel } from '../models/post';
import { CreatorModel } from '../models/creator';
import { unipileService } from '../services/unipile';
import pool from '../db';

function paramId(req: Request): string {
  return req.params.id as string;
}

const router = Router();

// GET /api/creators/:id/posts
router.get('/:id/posts', async (req: Request, res: Response) => {
  try {
    const creator = await CreatorModel.findById(paramId(req));
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    const filters = {
      outliers_only: req.query.outliers_only === 'true',
      content_type: req.query.content_type as string | undefined,
      sort: req.query.sort as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };

    const posts = await PostModel.findByCreator(paramId(req), filters);
    const total = await PostModel.countByCreator(paramId(req));

    res.json({ posts, total, limit: filters.limit, offset: filters.offset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/posts/:id/media — extract media URLs from raw_data on demand
router.get('/post/:id/media', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, content_type, post_url, linkedin_post_id, raw_data FROM posts WHERE id = $1',
      [req.params.id as string]
    );
    const post = rows[0];
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const raw = post.raw_data || {};
    const contentType: string = post.content_type || 'text';

    interface MediaItem {
      type: 'image' | 'video' | 'document';
      url: string;
      thumbnail?: string;
      width?: number;
      height?: number;
    }

    const items: MediaItem[] = [];

    // Extract from attachments (Unipile primary field)
    if (Array.isArray(raw.attachments)) {
      for (const a of raw.attachments) {
        const t = (a.type || '').toLowerCase();
        const url = a.url || a.download_url || a.media_url || null;
        if (!url) continue;
        if (t.includes('video')) {
          items.push({ type: 'video', url, thumbnail: a.thumbnail_url || a.preview_url || undefined });
        } else if (t.includes('document') || t.includes('pdf')) {
          items.push({ type: 'document', url });
        } else if (t.includes('image') || t.includes('photo') || t.includes('picture')) {
          items.push({ type: 'image', url, width: a.width, height: a.height });
        } else if (url) {
          items.push({ type: 'image', url });
        }
      }
    }

    // Fallback: raw.images array
    if (items.length === 0 && Array.isArray(raw.images)) {
      for (const img of raw.images) {
        const url = typeof img === 'string' ? img : (img.url || img.download_url || img.media_url);
        if (url) items.push({ type: 'image', url, width: img.width, height: img.height });
      }
    }

    // Fallback: raw.media array
    if (items.length === 0 && Array.isArray(raw.media)) {
      for (const m of raw.media) {
        const url = m.url || m.download_url || m.media_url;
        if (!url) continue;
        const t = (m.type || m.media_type || '').toLowerCase();
        if (t.includes('video')) items.push({ type: 'video', url, thumbnail: m.thumbnail_url });
        else items.push({ type: 'image', url });
      }
    }

    // Fallback: raw.video object
    if (items.length === 0 && raw.video) {
      const url = raw.video.url || raw.video.download_url || raw.video.stream_url;
      if (url) items.push({ type: 'video', url, thumbnail: raw.video.thumbnail_url || raw.video.preview_url });
    }

    // Fallback: single image fields
    if (items.length === 0) {
      const singleUrl = raw.image_url || raw.image || raw.thumbnail_url || raw.thumbnail;
      if (singleUrl) items.push({ type: 'image', url: singleUrl });
    }

    const linkedinUrl = post.post_url ||
      (post.linkedin_post_id ? `https://www.linkedin.com/feed/update/${post.linkedin_post_id}/` : null);

    res.json({ content_type: contentType, items, linkedin_url: linkedinUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/posts/post/:id/refresh-media — re-fetch this single post from
// Unipile to refresh its media URLs (LinkedIn CDN URLs are time-signed and
// expire after ~weeks-month). Updates posts.raw_data so the next GET to
// /media extracts fresh, working URLs.
//
// Account resolution:
//   1. The post's creator's own unipile_account_id (managed creators)
//   2. UNIPILE_SCRAPER_ACCOUNT_ID env (fallback for discovered creators we
//      scrape to learn from but don't manage)
router.post('/post/:id/refresh-media', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.linkedin_post_id, p.creator_id,
              c.linkedin_id, c.unipile_account_id
         FROM posts p
         JOIN creators c ON c.id = p.creator_id
        WHERE p.id = $1
        LIMIT 1`,
      [req.params.id as string]
    );
    const post = rows[0];
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!post.linkedin_id) return res.status(400).json({ error: 'Creator has no linkedin_id' });
    if (!post.linkedin_post_id) return res.status(400).json({ error: 'Post has no linkedin_post_id' });

    const accountId = post.unipile_account_id || process.env.UNIPILE_SCRAPER_ACCOUNT_ID;
    if (!accountId) {
      return res.status(400).json({
        error: 'No Unipile account available (creator has no unipile_account_id and UNIPILE_SCRAPER_ACCOUNT_ID is not set)',
      });
    }

    // Pull the creator's recent posts and find ours by linkedin_post_id. Same
    // pattern capturePostSnapshot uses; we just persist raw_data instead of
    // engagement counters because that's what /media reads.
    const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1y, generous
    const raws = await unipileService.getPosts(post.linkedin_id, since, accountId);
    const fresh = raws.find((r: any) => String(r.social_id || r.id) === String(post.linkedin_post_id));
    if (!fresh) {
      return res.status(404).json({
        error: 'Post not in current feed (may be older than 1y or deleted)',
      });
    }

    await pool.query(
      `UPDATE posts SET raw_data = $1::jsonb WHERE id = $2`,
      [JSON.stringify(fresh), post.id]
    );
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[posts/refresh-media]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
