import pool from '../db';

export interface Post {
  id: string;
  creator_id: string;
  linkedin_post_id: string | null;
  content_text: string | null;
  content_type: string;
  published_at: Date | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  impressions_count: number | null;
  engagement_score: number;
  outlier_ratio: number;
  is_outlier: boolean;
  hook_text: string | null;
  word_count: number;
  has_hashtags: boolean;
  hashtags: string[];
  has_emoji: boolean;
  has_call_to_action: boolean;
  language: string | null;
  post_url: string | null;
  raw_data: any;
  created_at: Date;
}

export interface PostFilters {
  outliers_only?: boolean;
  content_type?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

export const PostModel = {
  async findByCreator(creatorId: string, filters: PostFilters = {}): Promise<Post[]> {
    const conditions = ['creator_id = $1'];
    const values: any[] = [creatorId];
    let idx = 2;

    if (filters.outliers_only) {
      conditions.push('is_outlier = TRUE');
    }
    if (filters.content_type) {
      conditions.push(`content_type = $${idx}`);
      values.push(filters.content_type);
      idx++;
    }

    let orderBy = 'published_at DESC';
    if (filters.sort === 'engagement_desc') orderBy = 'engagement_score DESC';
    else if (filters.sort === 'engagement_asc') orderBy = 'engagement_score ASC';
    else if (filters.sort === 'date_asc') orderBy = 'published_at ASC';
    else if (filters.sort === 'outlier_ratio_desc') orderBy = 'outlier_ratio DESC';

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const { rows } = await pool.query(
      `SELECT id, creator_id, linkedin_post_id, content_text, content_type,
              published_at, likes_count, comments_count, reposts_count,
              impressions_count, engagement_score, outlier_ratio, is_outlier,
              hook_text, word_count, has_hashtags, hashtags, has_emoji,
              has_call_to_action, language, post_url, created_at
       FROM posts WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderBy} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );
    return rows;
  },

  async countByCreator(creatorId: string): Promise<number> {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM posts WHERE creator_id = $1',
      [creatorId]
    );
    return parseInt(rows[0].count, 10);
  },

  async bulkUpsert(posts: Partial<Post>[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const post of posts) {
        await client.query(
          `INSERT INTO posts (
            creator_id, linkedin_post_id, content_text, content_type,
            published_at, likes_count, comments_count, reposts_count,
            impressions_count, engagement_score, outlier_ratio, is_outlier,
            hook_text, word_count, has_hashtags, hashtags, has_emoji,
            has_call_to_action, language, post_url, raw_data
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
          ON CONFLICT (linkedin_post_id) DO UPDATE SET
            likes_count = EXCLUDED.likes_count,
            comments_count = EXCLUDED.comments_count,
            reposts_count = EXCLUDED.reposts_count,
            impressions_count = EXCLUDED.impressions_count,
            engagement_score = EXCLUDED.engagement_score,
            outlier_ratio = EXCLUDED.outlier_ratio,
            is_outlier = EXCLUDED.is_outlier,
            raw_data = EXCLUDED.raw_data`,
          [
            post.creator_id, post.linkedin_post_id, post.content_text, post.content_type,
            post.published_at, post.likes_count || 0, post.comments_count || 0, post.reposts_count || 0,
            post.impressions_count, post.engagement_score || 0, post.outlier_ratio || 0, post.is_outlier || false,
            post.hook_text, post.word_count || 0, post.has_hashtags || false, post.hashtags || [],
            post.has_emoji || false, post.has_call_to_action || false, post.language, post.post_url,
            post.raw_data ? JSON.stringify(post.raw_data) : null,
          ]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async deleteByCreator(creatorId: string): Promise<void> {
    await pool.query('DELETE FROM posts WHERE creator_id = $1', [creatorId]);
  },

  async getStats(creatorId: string) {
    const { rows } = await pool.query(
      `SELECT
        COUNT(*) as total_posts,
        COUNT(*) FILTER (WHERE is_outlier = TRUE) as total_outliers,
        AVG(engagement_score) as avg_engagement,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY engagement_score) as median_engagement,
        STDDEV(engagement_score) as stddev_engagement,
        MIN(published_at) as first_post_date,
        MAX(published_at) as last_post_date
      FROM posts WHERE creator_id = $1`,
      [creatorId]
    );
    return rows[0];
  },

  async getContentTypeDistribution(creatorId: string, outliersOnly = false) {
    const condition = outliersOnly ? 'AND is_outlier = TRUE' : '';
    const { rows } = await pool.query(
      `SELECT content_type, COUNT(*) as count
       FROM posts WHERE creator_id = $1 ${condition}
       GROUP BY content_type ORDER BY count DESC`,
      [creatorId]
    );
    return rows;
  },

  async getTimeline(creatorId: string) {
    const { rows } = await pool.query(
      `SELECT published_at, engagement_score, is_outlier, content_type, hook_text
       FROM posts WHERE creator_id = $1 AND published_at IS NOT NULL
       ORDER BY published_at ASC`,
      [creatorId]
    );
    return rows;
  },

  async getTopOutliersGlobal(limit = 20) {
    const { rows } = await pool.query(
      `SELECT p.id, p.creator_id, p.content_text, p.content_type,
              p.published_at, p.likes_count, p.comments_count, p.reposts_count,
              p.engagement_score, p.outlier_ratio, p.is_outlier,
              p.hook_text, p.post_url,
              c.name as creator_name, c.profile_image_url as creator_image
       FROM posts p JOIN creators c ON p.creator_id = c.id
       WHERE p.is_outlier = TRUE
       ORDER BY p.outlier_ratio DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  },
};
