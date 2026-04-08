import pool from '../db';

export interface Creator {
  id: string;
  linkedin_url: string;
  linkedin_id: string | null;
  name: string | null;
  headline: string | null;
  followers_count: number;
  connections_count: number;
  profile_image_url: string | null;
  last_scraped_at: Date | null;
  created_at: Date;
}

export const CreatorModel = {
  async findAll(): Promise<Creator[]> {
    const { rows } = await pool.query(
      'SELECT * FROM creators ORDER BY created_at DESC'
    );
    return rows;
  },

  async findById(id: string): Promise<Creator | null> {
    const { rows } = await pool.query('SELECT * FROM creators WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findByUrl(url: string): Promise<Creator | null> {
    const { rows } = await pool.query('SELECT * FROM creators WHERE linkedin_url = $1', [url]);
    return rows[0] || null;
  },

  async create(data: Partial<Creator>): Promise<Creator> {
    const { rows } = await pool.query(
      `INSERT INTO creators (linkedin_url, linkedin_id, name, headline, followers_count, connections_count, profile_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.linkedin_url,
        data.linkedin_id || null,
        data.name || null,
        data.headline || null,
        data.followers_count || 0,
        data.connections_count || 0,
        data.profile_image_url || null,
      ]
    );
    return rows[0];
  },

  async update(id: string, data: Partial<Creator>): Promise<Creator> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE creators SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0];
  },

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM creators WHERE id = $1', [id]);
  },
};
