import pool from '../db';

export interface ArchetypeVariant {
  archetype_key: string;
  archetype_label: string;
  archetype_desc: string;
  hook_type: string;
  post_structure: string;
  avg_ratio: number;
  text: string;
}

export type PipelineStatus = 'proposed' | 'in_progress' | 'scheduled' | 'published';

export interface PostIdea {
  id: string;
  raw_content: string;
  source_type: 'manual' | 'book_quote' | 'demo_moment' | 'observation' | 'meeting' | 'generated';
  tags: string[];
  generated_post: string | null;
  generation_score: number | null;
  generated_variants: ArchetypeVariant[] | null;
  status: 'draft' | 'generating' | 'ready';
  pipeline_status: PipelineStatus;
  source_outlier_post_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostIdeaInput {
  raw_content: string;
  source_type?: PostIdea['source_type'];
  tags?: string[];
  pipeline_status?: PipelineStatus;
  source_outlier_post_id?: string | null;
}

export const PostIdeaModel = {
  async findAll(): Promise<PostIdea[]> {
    const { rows } = await pool.query(
      'SELECT * FROM post_ideas ORDER BY created_at DESC'
    );
    return rows;
  },

  async findById(id: string): Promise<PostIdea | null> {
    const { rows } = await pool.query('SELECT * FROM post_ideas WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create(data: PostIdeaInput): Promise<PostIdea> {
    const { rows } = await pool.query(
      `INSERT INTO post_ideas
         (raw_content, source_type, tags, pipeline_status, source_outlier_post_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        data.raw_content,
        data.source_type || 'manual',
        data.tags || [],
        data.pipeline_status || 'proposed',
        data.source_outlier_post_id || null,
      ]
    );
    return rows[0];
  },

  async update(
    id: string,
    data: Partial<
      Pick<
        PostIdea,
        | 'raw_content'
        | 'source_type'
        | 'tags'
        | 'generated_post'
        | 'generation_score'
        | 'generated_variants'
        | 'status'
        | 'pipeline_status'
        | 'source_outlier_post_id'
      >
    >
  ): Promise<PostIdea> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE post_ideas SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0];
  },

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM post_ideas WHERE id = $1', [id]);
  },
};
