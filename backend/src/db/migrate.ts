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

  -- v3: text psychology/tone analysis
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS text_tone TEXT DEFAULT 'neutral';

  -- v4: creator location & timezone
  ALTER TABLE creators ADD COLUMN IF NOT EXISTS location TEXT;
  ALTER TABLE creators ADD COLUMN IF NOT EXISTS timezone TEXT;
  ALTER TABLE creators ADD COLUMN IF NOT EXISTS utc_offset FLOAT;

  -- v5: Strategic Network module
  CREATE TABLE IF NOT EXISTS commenter_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    headline TEXT,
    niche TEXT,
    expertise TEXT,
    tone TEXT DEFAULT 'direct' CHECK (tone IN ('direct','provocative','empathetic','technical')),
    objectives TEXT,
    topics TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS network_creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    linkedin_url TEXT UNIQUE NOT NULL,
    linkedin_id TEXT,
    name TEXT,
    headline TEXT,
    followers_count INTEGER DEFAULT 0,
    profile_image_url TEXT,
    tier INTEGER NOT NULL DEFAULT 2 CHECK (tier IN (1,2,3)),
    last_fetched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS network_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network_creator_id UUID NOT NULL REFERENCES network_creators(id) ON DELETE CASCADE,
    linkedin_post_id TEXT UNIQUE,
    content_text TEXT,
    hook_text TEXT,
    published_at TIMESTAMPTZ,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    post_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','commented','skipped')),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_network_posts_creator ON network_posts(network_creator_id);
  CREATE INDEX IF NOT EXISTS idx_network_posts_published ON network_posts(published_at);
  CREATE INDEX IF NOT EXISTS idx_network_posts_status ON network_posts(status);

  CREATE TABLE IF NOT EXISTS network_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network_post_id UUID NOT NULL REFERENCES network_posts(id) ON DELETE CASCADE,
    angle TEXT NOT NULL CHECK (angle IN ('personal_experience','provocative_question','plot_twist')),
    comment_text TEXT NOT NULL,
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_network_comments_post ON network_comments(network_post_id);

  -- v6: Creator profile for Post Creator (single-row)
  CREATE TABLE IF NOT EXISTS creator_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    linkedin_url TEXT,
    linkedin_id TEXT,
    name TEXT,
    headline TEXT,
    profile_image_url TEXT,
    followers_count INTEGER DEFAULT 0,
    company TEXT,
    product TEXT,
    positioning TEXT,
    tone_style TEXT,
    my_posts JSONB DEFAULT '[]',
    last_fetched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- v7: Commenter profile voice redesign
  ALTER TABLE commenter_profile ADD COLUMN IF NOT EXISTS voice_style TEXT;
  ALTER TABLE commenter_profile ADD COLUMN IF NOT EXISTS worldview TEXT;
  ALTER TABLE commenter_profile ADD COLUMN IF NOT EXISTS signature_moves TEXT;
  ALTER TABLE commenter_profile ADD COLUMN IF NOT EXISTS avoid TEXT;

  -- v8: Creator Discovery module
  CREATE TABLE IF NOT EXISTS discovered_creators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    linkedin_url TEXT UNIQUE NOT NULL,
    linkedin_id TEXT,
    name TEXT,
    headline TEXT,
    followers_count INTEGER DEFAULT 0,
    profile_image_url TEXT,
    location TEXT,
    search_query TEXT,
    niche_tags TEXT[] DEFAULT '{}',
    avg_engagement FLOAT DEFAULT 0,
    max_engagement FLOAT DEFAULT 0,
    outlier_count INTEGER DEFAULT 0,
    outlier_ratio_avg FLOAT DEFAULT 0,
    total_posts_sampled INTEGER DEFAULT 0,
    virality_score FLOAT DEFAULT 0,
    followers_prev INTEGER,
    followers_prev_at TIMESTAMPTZ,
    enriched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_disc_query ON discovered_creators(search_query);
  CREATE INDEX IF NOT EXISTS idx_disc_virality ON discovered_creators(virality_score DESC);
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
