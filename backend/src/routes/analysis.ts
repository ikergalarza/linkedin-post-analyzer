import { Router, Request, Response } from 'express';
import { PostModel } from '../models/post';
import { CreatorModel } from '../models/creator';
import { detectPatterns, getCrossCreatorPatterns } from '../services/patterns';

function paramId(req: Request): string {
  return req.params.id as string;
}

const router = Router();

// GET /api/creators/:id/stats
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const creator = await CreatorModel.findById(paramId(req));
    if (!creator) return res.status(404).json({ error: 'Creator not found' });

    const stats = await PostModel.getStats(paramId(req));
    const contentDist = await PostModel.getContentTypeDistribution(paramId(req));
    const outlierContentDist = await PostModel.getContentTypeDistribution(paramId(req), true);

    // Calculate posting frequency
    const totalPosts = parseInt(stats.total_posts, 10) || 0;
    let postsPerWeek = 0;
    if (stats.first_post_date && stats.last_post_date && totalPosts > 0) {
      const weeks = Math.max(1,
        (new Date(stats.last_post_date).getTime() - new Date(stats.first_post_date).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
      );
      postsPerWeek = Math.round((totalPosts / weeks) * 10) / 10;
    }

    // Best day of week
    const allPosts = await PostModel.findByCreator(paramId(req), { limit: 10000 });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts: Record<number, { count: number; totalEngagement: number }> = {};
    for (const p of allPosts) {
      if (p.published_at) {
        const day = new Date(p.published_at).getDay();
        if (!dayCounts[day]) dayCounts[day] = { count: 0, totalEngagement: 0 };
        dayCounts[day].count++;
        dayCounts[day].totalEngagement += p.engagement_score;
      }
    }
    const bestDay = Object.entries(dayCounts)
      .sort((a, b) => b[1].totalEngagement / b[1].count - a[1].totalEngagement / a[1].count)[0];

    res.json({
      total_posts: totalPosts,
      total_outliers: parseInt(stats.total_outliers, 10) || 0,
      avg_engagement: stats.avg_engagement ? Math.round(parseFloat(stats.avg_engagement)) : 0,
      median_engagement: stats.median_engagement ? Math.round(parseFloat(stats.median_engagement)) : 0,
      stddev_engagement: stats.stddev_engagement ? Math.round(parseFloat(stats.stddev_engagement)) : 0,
      outlier_rate: totalPosts > 0
        ? Math.round((parseInt(stats.total_outliers, 10) / totalPosts) * 100)
        : 0,
      posts_per_week: postsPerWeek,
      best_day: bestDay ? dayNames[parseInt(bestDay[0])] : null,
      content_type_distribution: contentDist,
      outlier_content_type_distribution: outlierContentDist,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/creators/:id/timeline
router.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const timeline = await PostModel.getTimeline(paramId(req));
    res.json(timeline);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/creators/:id/patterns
router.get('/:id/patterns', async (req: Request, res: Response) => {
  try {
    const allPosts = await PostModel.findByCreator(paramId(req), { limit: 10000 });
    const patterns = detectPatterns(allPosts);
    res.json(patterns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analysis/cross-creators
router.get('/cross-creators', async (_req: Request, res: Response) => {
  try {
    const topOutliers = await PostModel.getTopOutliersGlobal(20);

    // Get all posts for cross-creator patterns
    const creators = await CreatorModel.findAll();
    let allPosts: any[] = [];
    for (const c of creators) {
      const posts = await PostModel.findByCreator(c.id, { limit: 10000 });
      allPosts = allPosts.concat(posts);
    }

    const patterns = getCrossCreatorPatterns(allPosts);

    res.json({ top_outliers: topOutliers, patterns });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
