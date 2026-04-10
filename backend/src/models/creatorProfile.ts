import pool from '../db';

export interface MyPost {
  content_text: string;
  hook_text: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  published_at: string | null;
  post_url: string | null;
  engagement_score: number;
}

export interface CreatorProfile {
  id: string;
  linkedin_url: string | null;
  linkedin_id: string | null;
  name: string | null;
  headline: string | null;
  profile_image_url: string | null;
  followers_count: number;
  company: string | null;
  product: string | null;
  positioning: string | null;
  tone_style: string | null;
  my_posts: MyPost[];
  last_fetched_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const CreatorProfileModel = {
  async get(): Promise<CreatorProfile | null> {
    const { rows } = await pool.query('SELECT * FROM creator_profile LIMIT 1');
    return rows[0] || null;
  },

  async upsert(data: Partial<CreatorProfile>): Promise<CreatorProfile> {
    const existing = await this.get();

    if (existing) {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;
      for (const [key, value] of Object.entries(data)) {
        if (key === 'id' || key === 'created_at' || key === 'updated_at') continue;
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
      if (fields.length === 0) return existing;
      fields.push(`updated_at = NOW()`);
      values.push(existing.id);

      const { rows } = await pool.query(
        `UPDATE creator_profile SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return rows[0];
    }

    const { rows } = await pool.query(
      `INSERT INTO creator_profile (
        linkedin_url, linkedin_id, name, headline, profile_image_url, followers_count,
        company, product, positioning, tone_style, my_posts, last_fetched_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        data.linkedin_url || null,
        data.linkedin_id || null,
        data.name || null,
        data.headline || null,
        data.profile_image_url || null,
        data.followers_count || 0,
        data.company || null,
        data.product || null,
        data.positioning || null,
        data.tone_style || null,
        JSON.stringify(data.my_posts || []),
        data.last_fetched_at || null,
      ]
    );
    return rows[0];
  },
};
