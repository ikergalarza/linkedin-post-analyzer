import pool from '../db';

export interface DiscoveredCreator {
  id: string;
  linkedin_url: string;
  linkedin_id: string | null;
  name: string | null;
  headline: string | null;
  followers_count: number;
  profile_image_url: string | null;
  location: string | null;
  search_query: string | null;
  niche_tags: string[];
  avg_engagement: number;
  max_engagement: number;
  outlier_count: number;
  outlier_ratio_avg: number;
  total_posts_sampled: number;
  virality_score: number;
  followers_prev: number | null;
  followers_prev_at: string | null;
  enriched_at: string | null;
  created_at: string;
}

export interface DiscoveredCreatorInput {
  linkedin_url: string;
  linkedin_id?: string | null;
  name?: string | null;
  headline?: string | null;
  followers_count?: number;
  profile_image_url?: string | null;
  location?: string | null;
  search_query?: string | null;
  niche_tags?: string[];
  avg_engagement?: number;
  max_engagement?: number;
  outlier_count?: number;
  outlier_ratio_avg?: number;
  total_posts_sampled?: number;
  virality_score?: number;
  followers_prev?: number | null;
  followers_prev_at?: Date | null;
  enriched_at?: Date | null;
}

export const DiscoveredCreatorModel = {
  async findAll(opts: { query?: string; tag?: string; sortBy?: string } = {}): Promise<DiscoveredCreator[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (opts.query) {
      conditions.push(`search_query = $${idx++}`);
      values.push(opts.query);
    }
    if (opts.tag) {
      conditions.push(`$${idx++} = ANY(niche_tags)`);
      values.push(opts.tag);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const validSort: Record<string, string> = {
      virality_score: 'virality_score DESC',
      avg_engagement: 'avg_engagement DESC',
      followers_count: 'followers_count DESC',
      outlier_count: 'outlier_count DESC',
      created_at: 'created_at DESC',
    };
    const order = validSort[opts.sortBy || ''] || 'virality_score DESC';

    const { rows } = await pool.query(
      `SELECT * FROM discovered_creators ${where} ORDER BY ${order}`,
      values
    );
    return rows;
  },

  async findById(id: string): Promise<DiscoveredCreator | null> {
    const { rows } = await pool.query('SELECT * FROM discovered_creators WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findByUrl(url: string): Promise<DiscoveredCreator | null> {
    const { rows } = await pool.query('SELECT * FROM discovered_creators WHERE linkedin_url = $1', [url]);
    return rows[0] || null;
  },

  async upsert(data: DiscoveredCreatorInput): Promise<DiscoveredCreator> {
    const { rows } = await pool.query(
      `INSERT INTO discovered_creators (
        linkedin_url, linkedin_id, name, headline, followers_count, profile_image_url, location,
        search_query, niche_tags, avg_engagement, max_engagement, outlier_count, outlier_ratio_avg,
        total_posts_sampled, virality_score, followers_prev, followers_prev_at, enriched_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (linkedin_url) DO UPDATE SET
        linkedin_id = EXCLUDED.linkedin_id,
        name = EXCLUDED.name,
        headline = EXCLUDED.headline,
        followers_count = EXCLUDED.followers_count,
        profile_image_url = EXCLUDED.profile_image_url,
        location = EXCLUDED.location,
        search_query = COALESCE(EXCLUDED.search_query, discovered_creators.search_query),
        niche_tags = EXCLUDED.niche_tags,
        avg_engagement = EXCLUDED.avg_engagement,
        max_engagement = EXCLUDED.max_engagement,
        outlier_count = EXCLUDED.outlier_count,
        outlier_ratio_avg = EXCLUDED.outlier_ratio_avg,
        total_posts_sampled = EXCLUDED.total_posts_sampled,
        virality_score = EXCLUDED.virality_score,
        followers_prev = CASE
          WHEN discovered_creators.followers_prev_at IS NULL
            OR NOW() - discovered_creators.followers_prev_at > INTERVAL '7 days'
          THEN discovered_creators.followers_count
          ELSE discovered_creators.followers_prev
        END,
        followers_prev_at = CASE
          WHEN discovered_creators.followers_prev_at IS NULL
            OR NOW() - discovered_creators.followers_prev_at > INTERVAL '7 days'
          THEN NOW()
          ELSE discovered_creators.followers_prev_at
        END,
        enriched_at = EXCLUDED.enriched_at
      RETURNING *`,
      [
        data.linkedin_url,
        data.linkedin_id ?? null,
        data.name ?? null,
        data.headline ?? null,
        data.followers_count ?? 0,
        data.profile_image_url ?? null,
        data.location ?? null,
        data.search_query ?? null,
        data.niche_tags ?? [],
        data.avg_engagement ?? 0,
        data.max_engagement ?? 0,
        data.outlier_count ?? 0,
        data.outlier_ratio_avg ?? 0,
        data.total_posts_sampled ?? 0,
        data.virality_score ?? 0,
        data.followers_prev ?? null,
        data.followers_prev_at ?? null,
        data.enriched_at ?? null,
      ]
    );
    return rows[0];
  },

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM discovered_creators WHERE id = $1', [id]);
  },

  async allNicheTags(): Promise<string[]> {
    const { rows } = await pool.query(
      `SELECT DISTINCT unnest(niche_tags) as tag FROM discovered_creators ORDER BY tag`
    );
    return rows.map((r: any) => r.tag);
  },
};
