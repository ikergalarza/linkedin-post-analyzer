import pool from '../db';

export interface NetworkPost {
  id: string;
  network_creator_id: string;
  linkedin_post_id: string | null;
  content_text: string | null;
  hook_text: string | null;
  published_at: Date | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  post_url: string | null;
  status: 'pending' | 'commented' | 'skipped';
  created_at: Date;
}

export interface NetworkPostWithCreator extends NetworkPost {
  creator_name: string | null;
  creator_tier: number;
  creator_image: string | null;
  creator_headline: string | null;
}

export const NetworkPostModel = {
  async findWeekly(weekStart: Date, weekEnd: Date): Promise<NetworkPostWithCreator[]> {
    const { rows } = await pool.query(
      `SELECT np.*,
              nc.name as creator_name,
              nc.tier as creator_tier,
              nc.profile_image_url as creator_image,
              nc.headline as creator_headline
       FROM network_posts np
       JOIN network_creators nc ON np.network_creator_id = nc.id
       WHERE np.published_at >= $1 AND np.published_at < $2
       ORDER BY np.published_at DESC`,
      [weekStart, weekEnd]
    );
    return rows;
  },

  async findByIdWithCreator(id: string): Promise<NetworkPostWithCreator | null> {
    const { rows } = await pool.query(
      `SELECT np.*,
              nc.name as creator_name,
              nc.tier as creator_tier,
              nc.profile_image_url as creator_image,
              nc.headline as creator_headline
       FROM network_posts np
       JOIN network_creators nc ON np.network_creator_id = nc.id
       WHERE np.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async bulkUpsert(posts: Partial<NetworkPost>[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const post of posts) {
        await client.query(
          `INSERT INTO network_posts (
            network_creator_id, linkedin_post_id, content_text, hook_text,
            published_at, likes_count, comments_count, reposts_count, post_url
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (linkedin_post_id) DO UPDATE SET
            likes_count = EXCLUDED.likes_count,
            comments_count = EXCLUDED.comments_count,
            reposts_count = EXCLUDED.reposts_count`,
          [
            post.network_creator_id,
            post.linkedin_post_id,
            post.content_text,
            post.hook_text,
            post.published_at,
            post.likes_count || 0,
            post.comments_count || 0,
            post.reposts_count || 0,
            post.post_url,
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

  async updateStatus(id: string, status: string): Promise<NetworkPost> {
    const { rows } = await pool.query(
      `UPDATE network_posts SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return rows[0];
  },
};
