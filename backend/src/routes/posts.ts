import { Router, Request, Response } from 'express';
import { PostModel } from '../models/post';
import { CreatorModel } from '../models/creator';

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

export default router;
