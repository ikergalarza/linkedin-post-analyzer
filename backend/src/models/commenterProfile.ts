import pool from '../db';

export interface CommenterProfile {
  id: string;
  headline: string | null;
  niche: string | null;
  expertise: string | null;
  tone: 'direct' | 'provocative' | 'empathetic' | 'technical';
  objectives: string | null;
  topics: string[];
  created_at: Date;
  updated_at: Date;
}

export const CommenterProfileModel = {
  async get(): Promise<CommenterProfile | null> {
    const { rows } = await pool.query('SELECT * FROM commenter_profile LIMIT 1');
    return rows[0] || null;
  },

  async upsert(data: Partial<CommenterProfile>): Promise<CommenterProfile> {
    const existing = await this.get();

    if (existing) {
      const { rows } = await pool.query(
        `UPDATE commenter_profile SET
          headline = $1, niche = $2, expertise = $3, tone = $4,
          objectives = $5, topics = $6, updated_at = NOW()
         WHERE id = $7 RETURNING *`,
        [
          data.headline ?? existing.headline,
          data.niche ?? existing.niche,
          data.expertise ?? existing.expertise,
          data.tone ?? existing.tone,
          data.objectives ?? existing.objectives,
          data.topics ?? existing.topics,
          existing.id,
        ]
      );
      return rows[0];
    }

    const { rows } = await pool.query(
      `INSERT INTO commenter_profile (headline, niche, expertise, tone, objectives, topics)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.headline || null,
        data.niche || null,
        data.expertise || null,
        data.tone || 'direct',
        data.objectives || null,
        data.topics || [],
      ]
    );
    return rows[0];
  },
};
