import pool from '../db';

export interface CommenterProfile {
  id: string;
  name: string;
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

const DEFAULT_NAME = 'Iker';

export const CommenterProfileModel = {
  async listAll(): Promise<CommenterProfile[]> {
    const { rows } = await pool.query(
      'SELECT * FROM commenter_profile ORDER BY LOWER(name) ASC'
    );
    return rows;
  },

  async getByName(name: string): Promise<CommenterProfile | null> {
    const { rows } = await pool.query(
      'SELECT * FROM commenter_profile WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [name]
    );
    return rows[0] || null;
  },

  // Legacy singleton accessor — returns the default profile (Iker).
  async get(): Promise<CommenterProfile | null> {
    return this.getByName(DEFAULT_NAME);
  },

  async upsertByName(name: string, data: Partial<CommenterProfile>): Promise<CommenterProfile> {
    const existing = await this.getByName(name);

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
      `INSERT INTO commenter_profile (name, headline, voice_style, worldview, signature_moves, avoid)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        name,
        data.headline || null,
        data.voice_style || null,
        data.worldview || null,
        data.signature_moves || null,
        data.avoid || null,
      ]
    );
    return rows[0];
  },

  // Legacy singleton upsert — writes to the default profile (Iker).
  async upsert(data: Partial<CommenterProfile>): Promise<CommenterProfile> {
    return this.upsertByName(DEFAULT_NAME, data);
  },
};
