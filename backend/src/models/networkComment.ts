import pool from '../db';

export interface NetworkComment {
  id: string;
  network_post_id: string;
  angle: 'contrarian_reflective' | 'contrarian_direct' | 'contrarian_data' | 'reframe' | 'supportive' | 'personal_experience' | 'provocative_question' | 'plot_twist';
  comment_text: string;
  is_selected: boolean;
  created_at: Date;
}

export const NetworkCommentModel = {
  async findByPost(postId: string): Promise<NetworkComment[]> {
    const { rows } = await pool.query(
      'SELECT * FROM network_comments WHERE network_post_id = $1 ORDER BY created_at ASC',
      [postId]
    );
    return rows;
  },

  async findByPosts(postIds: string[]): Promise<NetworkComment[]> {
    if (postIds.length === 0) return [];
    const { rows } = await pool.query(
      'SELECT * FROM network_comments WHERE network_post_id = ANY($1) ORDER BY created_at ASC',
      [postIds]
    );
    return rows;
  },

  async bulkInsert(comments: Partial<NetworkComment>[]): Promise<NetworkComment[]> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const results: NetworkComment[] = [];
      for (const c of comments) {
        const { rows } = await client.query(
          `INSERT INTO network_comments (network_post_id, angle, comment_text)
           VALUES ($1, $2, $3) RETURNING *`,
          [c.network_post_id, c.angle, c.comment_text]
        );
        results.push(rows[0]);
      }
      await client.query('COMMIT');
      return results;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async deleteByPost(postId: string): Promise<void> {
    await pool.query('DELETE FROM network_comments WHERE network_post_id = $1', [postId]);
  },

  async markSelected(id: string): Promise<void> {
    // First get the post_id for this comment
    const { rows } = await pool.query('SELECT network_post_id FROM network_comments WHERE id = $1', [id]);
    if (!rows[0]) return;
    // Unselect all siblings, then select this one
    await pool.query(
      'UPDATE network_comments SET is_selected = FALSE WHERE network_post_id = $1',
      [rows[0].network_post_id]
    );
    await pool.query(
      'UPDATE network_comments SET is_selected = TRUE WHERE id = $1',
      [id]
    );
  },
};
