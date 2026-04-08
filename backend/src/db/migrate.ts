import pool from './index';

const migration = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  CREATE TABLE IF NOT EXISTS creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    linkedin_url TEXT UNIQUE NOT NULL,
    linkedin_id TEXT,
    name TEXT,
    headline TEXT,
    followers_count INTEGER DEFAULT 0,
    connections_count INTEGER DEFAULT 0,
    profile_image_url TEXT,
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    linkedin_post_id TEXT UNIQUE,
    content_text TEXT,
    content_type TEXT DEFAULT 'text_only'
      CHECK (content_type IN ('text_only','image','carousel','video','poll','article','document')),
    published_at TIMESTAMP WITH TIME ZONE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    impressions_count INTEGER,
    engagement_score FLOAT DEFAULT 0,
    outlier_ratio FLOAT DEFAULT 0,
    is_outlier BOOLEAN DEFAULT FALSE,
    hook_text TEXT,
    word_count INTEGER DEFAULT 0,
    has_hashtags BOOLEAN DEFAULT FALSE,
    hashtags TEXT[] DEFAULT '{}',
    has_emoji BOOLEAN DEFAULT FALSE,
    has_call_to_action BOOLEAN DEFAULT FALSE,
    language TEXT,
    post_url TEXT,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON posts(creator_id);
  CREATE INDEX IF NOT EXISTS idx_posts_is_outlier ON posts(is_outlier);
  CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
  CREATE INDEX IF NOT EXISTS idx_posts_content_type ON posts(content_type);

  -- v2: text structure & engagement ratio fields
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS char_count INTEGER DEFAULT 0;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS line_break_count INTEGER DEFAULT 0;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS has_aggressive_spacing BOOLEAN DEFAULT FALSE;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS hook_type TEXT DEFAULT 'other';
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_structure TEXT DEFAULT 'other';
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS comment_like_ratio FLOAT DEFAULT 0;
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS share_like_ratio FLOAT DEFAULT 0;
`;

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(migration);
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Allow running directly: npx tsx src/db/migrate.ts
if (require.main === module) {
  runMigrations().then(() => pool.end());
}
