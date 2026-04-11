import pool from '../db';

export interface CommenterProfile {
  id: string;
  headline: string | null;
  // legacy fields kept for DB compat
  niche: string | null;
  expertise: string | null;
  tone: string;
  objectives: string | null;
  topics: string[];
  // v7: voice-focused fields
  voice_style: string | null;
  worldview: string | null;
  signature_moves: string | null;
  avoid: string | null;
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
          headline = $1,
          voice_style = $2,
          worldview = $3,
          signature_moves = $4,
          avoid = $5,
          updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [
          data.headline ?? existing.headline,
          data.voice_style ?? existing.voice_style,
          data.worldview ?? existing.worldview,
          data.signature_moves ?? existing.signature_moves,
          data.avoid ?? existing.avoid,
          existing.id,
        ]
      );
      return rows[0];
    }

    const { rows } = await pool.query(
      `INSERT INTO commenter_profile (headline, voice_style, worldview, signature_moves, avoid)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        data.headline || null,
        data.voice_style || null,
        data.worldview || null,
        data.signature_moves || null,
        data.avoid || null,
      ]
    );
    return rows[0];
  },
};
