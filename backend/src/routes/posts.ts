import { Router, Request, Response } from 'express';
import { PostModel } from '../models/post';
import { CreatorModel } from '../models/creator';
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

export default router;
