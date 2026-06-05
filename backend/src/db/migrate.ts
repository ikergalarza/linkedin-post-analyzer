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
    content_type TEXT DEFAULT 'text'
      CHECK (content_type IN (
        'text','text_image','text_carousel','text_video','text_document',
        'image','carousel','video','document','poll','article'
      )),
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

  -- v9: Post Ideas directory
  CREATE TABLE IF NOT EXISTS post_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_content TEXT NOT NULL,
    source_type TEXT DEFAULT 'manual' CHECK (source_type IN ('manual','book_quote','demo_moment','observation','meeting')),
    tags TEXT[] DEFAULT '{}',
    generated_post TEXT,
    generation_score INTEGER,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','generating','ready')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_post_ideas_status ON post_ideas(status);
  CREATE INDEX IF NOT EXISTS idx_post_ideas_created ON post_ideas(created_at DESC);

  -- v10: Store 3 archetype variants before user selects one
  ALTER TABLE post_ideas ADD COLUMN IF NOT EXISTS generated_variants JSONB;

  -- v11: Topic classification for outlier inspiration browsing
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS topic TEXT;
  CREATE INDEX IF NOT EXISTS idx_posts_topic ON posts(topic);

  -- v12: Network comment angles redesigned (3 contrarians + reframe)
  ALTER TABLE network_comments DROP CONSTRAINT IF EXISTS network_comments_angle_check;

  -- v14: 9 comment types (reinforce, 3 contrarian, reframe, add_missing, steal_phrase, warm_supportive, better_question)
  ALTER TABLE network_comments ADD CONSTRAINT network_comments_angle_check
    CHECK (angle IN (
      'reinforce','contrarian_data','contrarian_premise','contrarian_survivorship',
      'reframe','add_missing','steal_phrase','warm_supportive','better_question',
      'contrarian_reflective','contrarian_direct','supportive',
      'personal_experience','provocative_question','plot_twist'
    ));

  -- v15: Media URLs + content type for network posts (view creative without leaving app)
  ALTER TABLE network_posts ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text';
  ALTER TABLE network_posts ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';

  -- v13: Managed accounts flag for the BI dashboard
  ALTER TABLE creators ADD COLUMN IF NOT EXISTS is_managed BOOLEAN DEFAULT FALSE;
  CREATE INDEX IF NOT EXISTS idx_creators_is_managed ON creators(is_managed);

  -- v16: Per-creator Unipile account ID override — lets each managed account
  -- be scraped with its own authenticated Unipile account so impressions come through.
  ALTER TABLE creators ADD COLUMN IF NOT EXISTS unipile_account_id TEXT;

  -- v17: Post snapshots — time-series rows captured every 15 min during the
  -- first 6 hours after publication, so we can plot the impressions/engagement curve.
  CREATE TABLE IF NOT EXISTS post_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    impressions_count INTEGER,
    likes_count INTEGER,
    comments_count INTEGER,
    reposts_count INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_snapshots_post ON post_snapshots(post_id, captured_at);

  -- v19: Multiple named commenter profiles — Iker + Unai by default, plus room
  -- for more. The old singleton becomes 'Iker'; 'Unai' is seeded blank so it can
  -- be edited from the Profile tab. A profile selector above the Network feed
  -- lets the user pick which voice generates the comments.
  ALTER TABLE commenter_profile ADD COLUMN IF NOT EXISTS name TEXT;
  UPDATE commenter_profile SET name = 'Iker' WHERE name IS NULL;
  INSERT INTO commenter_profile (name)
    SELECT 'Iker'
    WHERE NOT EXISTS (SELECT 1 FROM commenter_profile WHERE LOWER(name) = 'iker');
  INSERT INTO commenter_profile (name)
    SELECT 'Unai'
    WHERE NOT EXISTS (SELECT 1 FROM commenter_profile WHERE LOWER(name) = 'unai');
  CREATE UNIQUE INDEX IF NOT EXISTS uniq_commenter_profile_name ON commenter_profile (LOWER(name));

  -- v18: Content-type taxonomy split — posts that mix text with media now get
  -- dedicated combined categories (text_image, text_carousel, text_video,
  -- text_document) so the plain 'text' bucket contains text-only posts. Also
  -- renames text_only → text for clarity. Migration is idempotent: existing
  -- rows are remapped based on presence of content_text.
  DO $mig18$
  BEGIN
    -- posts: drop old CHECK if present
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'posts' AND constraint_name = 'posts_content_type_check'
    ) THEN
      ALTER TABLE posts DROP CONSTRAINT posts_content_type_check;
    END IF;

    -- Remap existing posts rows
    UPDATE posts SET content_type =
      CASE
        WHEN content_type = 'text_only' THEN 'text'
        WHEN content_type = 'image' AND content_text IS NOT NULL AND LENGTH(TRIM(content_text)) > 0 THEN 'text_image'
        WHEN content_type = 'carousel' AND content_text IS NOT NULL AND LENGTH(TRIM(content_text)) > 0 THEN 'text_carousel'
        WHEN content_type = 'video' AND content_text IS NOT NULL AND LENGTH(TRIM(content_text)) > 0 THEN 'text_video'
        WHEN content_type = 'document' AND content_text IS NOT NULL AND LENGTH(TRIM(content_text)) > 0 THEN 'text_document'
        ELSE content_type
      END
    WHERE content_type IN ('text_only','image','carousel','video','document');

    -- Add new CHECK on posts
    ALTER TABLE posts ADD CONSTRAINT posts_content_type_check
      CHECK (content_type IN (
        'text','text_image','text_carousel','text_video','text_document',
        'image','carousel','video','document','poll','article'
      ));
    ALTER TABLE posts ALTER COLUMN content_type SET DEFAULT 'text';

    -- network_posts: same treatment
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'network_posts' AND constraint_name = 'network_posts_content_type_check'
    ) THEN
      ALTER TABLE network_posts DROP CONSTRAINT network_posts_content_type_check;
    END IF;

    UPDATE network_posts SET content_type =
      CASE
        WHEN content_type = 'text_only' THEN 'text'
        WHEN content_type = 'image' AND content_text IS NOT NULL AND LENGTH(TRIM(content_text)) > 0 THEN 'text_image'
        WHEN content_type = 'carousel' AND content_text IS NOT NULL AND LENGTH(TRIM(content_text)) > 0 THEN 'text_carousel'
        WHEN content_type = 'video' AND content_text IS NOT NULL AND LENGTH(TRIM(content_text)) > 0 THEN 'text_video'
        WHEN content_type = 'document' AND content_text IS NOT NULL AND LENGTH(TRIM(content_text)) > 0 THEN 'text_document'
        ELSE content_type
      END
    WHERE content_type IN ('text_only','image','carousel','video','document');

    ALTER TABLE network_posts ALTER COLUMN content_type SET DEFAULT 'text';
  END $mig18$;

  -- v20: Follower growth snapshots — one row per creator per day, upserted on
  -- every scrape. Lets us plot how an account's followers evolve alongside
  -- their engagement curve. Keeping one row per day keeps storage trivial
  -- (a few hundred rows/creator/year) and gives plenty of resolution for
  -- growth curves — LinkedIn follower deltas aren't interesting sub-daily.
  CREATE TABLE IF NOT EXISTS creator_follower_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    captured_on DATE NOT NULL DEFAULT CURRENT_DATE,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    followers_count INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uniq_follower_snapshot_day
    ON creator_follower_snapshots (creator_id, captured_on);
  CREATE INDEX IF NOT EXISTS idx_follower_snapshots_creator
    ON creator_follower_snapshots (creator_id, captured_on);

  -- Seed one snapshot per managed creator with today's count, so the chart
  -- has a starting point. Safe to re-run: the unique index kicks in.
  INSERT INTO creator_follower_snapshots (creator_id, captured_on, followers_count)
    SELECT id, CURRENT_DATE, COALESCE(followers_count, 0)
      FROM creators
     WHERE is_managed = TRUE
  ON CONFLICT (creator_id, captured_on) DO NOTHING;

  -- v17: Allow 'generated' source_type for AI-brainstormed ideas (Inspiration → Generate).
  -- The original CREATE TABLE at v9 only listed 5 source types; CREATE TABLE IF NOT EXISTS
  -- skips re-applying the constraint, so we explicitly drop & recreate it here.
  ALTER TABLE post_ideas DROP CONSTRAINT IF EXISTS post_ideas_source_type_check;
  ALTER TABLE post_ideas ADD CONSTRAINT post_ideas_source_type_check
    CHECK (source_type IN ('manual','book_quote','demo_moment','observation','meeting','generated'));

  -- v21: Profile-view snapshots — daily count of recent profile viewers per
  -- managed creator. Mirrors creator_follower_snapshots (1 row per creator
  -- per day, unique on (creator_id, captured_on), upserted during scrape).
  -- Source is LinkedIn's WVMP ("Who Viewed My Profile") feed proxied via
  -- Unipile's raw-data passthrough — premium accounts return ~90 days of
  -- viewers; free accounts only see a teaser so the metric is only useful
  -- on Premium/Sales-Nav.
  CREATE TABLE IF NOT EXISTS creator_profile_view_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
    captured_on DATE NOT NULL DEFAULT CURRENT_DATE,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Number of viewers visible in this snapshot (Premium = ~90-day window)
    views_count INTEGER NOT NULL,
    -- Full WVMP response so we can later mine individual viewers without
    -- needing to re-fetch. JSONB so we can index into it if needed.
    raw_response JSONB
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uniq_profile_view_snapshot_day
    ON creator_profile_view_snapshots (creator_id, captured_on);
  CREATE INDEX IF NOT EXISTS idx_profile_view_snapshots_creator
    ON creator_profile_view_snapshots (creator_id, captured_on);

  -- v22: One-shot cleanup. The 2026-05-05/06 snapshots were captured before
  -- the WVMP pagination fix and only saw LinkedIn's default first page
  -- (~22 elements aggregated across both managed creators), so the chart
  -- showed a flat 22→22 line with 0% deltas. Wiping them lets the curve
  -- restart from real paginated counts on the next snapshot tick.
  -- Idempotent: if these rows are already gone (re-runs / fresh installs),
  -- the DELETE is a no-op.
  DELETE FROM creator_profile_view_snapshots
    WHERE captured_on IN (DATE '2026-05-05', DATE '2026-05-06');

  -- v23: Per-viewer timestamps for the WVMP feed.
  --
  -- Before this change, views_count = "viewers currently visible in the WVMP
  -- feed" (a rolling ~90-day window). Plotting that daily produced flat
  -- stretches on consecutive captures because the feed itself rarely moves
  -- by much from one day to the next, and the cumulative number never lined
  -- up with LinkedIn's "viewers in last 28 days" headline (which also
  -- includes anonymous viewers we can't fetch element-by-element).
  --
  -- viewer_timestamps stores the ms-epoch viewedAt for every viewer in the
  -- feed. We bucket by day at read time to compute true "new viewers per
  -- day" — matching what LinkedIn's UI shows. A single capture backfills
  -- ~90 days of bucket data because each WVMP response carries the full
  -- rolling history. Compact (8 bytes × ≤1000 viewers per capture ≤ 8 KB)
  -- so we can keep it inline without the raw_response blow-up.
  ALTER TABLE creator_profile_view_snapshots
    ADD COLUMN IF NOT EXISTS viewer_timestamps BIGINT[];

  -- v24: Backfill Iker's April follower history from LinkedIn's own
  -- exported analytics. We only began snapshotting on 2026-04-24
  -- (7617 followers), but the first post went viral on 2026-04-14.
  -- LinkedIn Creator Analytics → Followers export gives the real
  -- "new followers per day"; anchored on our measured 2026-04-24=7617
  -- (which matches LinkedIn's 2026-05-18 total of 8314 exactly), we
  -- reconstruct the end-of-day cumulative total for every missing day.
  -- These are NOT estimates — they are LinkedIn's exported numbers
  -- arithmetic'd back from a verified anchor, so the curve stays 100%
  -- real and splices into the measured series with no discontinuity.
  --
  -- ON CONFLICT DO NOTHING: never overwrites a measured snapshot
  -- (2026-04-24 onward already exists). Guarded so it only runs if
  -- Iker's creator row is present. Safe to re-run.
  INSERT INTO creator_follower_snapshots (creator_id, captured_on, followers_count)
  SELECT v.creator_id::uuid, v.captured_on::date, v.followers_count
  FROM (VALUES
    ('3d545376-057c-48db-8b45-c5c5510110bb', '2026-04-12', 7053),
    ('3d545376-057c-48db-8b45-c5c5510110bb', '2026-04-13', 7073),
    ('3d545376-057c-48db-8b45-c5c5510110bb', '2026-04-14', 7288),
    ('3d545376-057c-48db-8b45-c5c5510110bb', '2026-04-15', 7389),
    ('3d545376-057c-48db-8b45-c5c5510110bb', '2026-04-16', 7454),
    ('3d545376-057c-48db-8b45-c5c5510110bb', '2026-04-17', 7487),
    ('3d545376-057c-48db-8b45-c5c5510110bb', '2026-04-18', 7504),
    ('3d545376-057c-48db-8b45-c5c5510110bb', '2026-04-19', 7515),
    ('3d545376-057c-48db-8b45-c5c5510110bb', '2026-04-20', 7533),
    ('3d545376-057c-48db-8b45-c5c5510110bb', '2026-04-21', 7572),
    ('3d545376-057c-48db-8b45-c5c5510110bb', '2026-04-22', 7594),
    ('3d545376-057c-48db-8b45-c5c5510110bb', '2026-04-23', 7606)
  ) AS v(creator_id, captured_on, followers_count)
  WHERE EXISTS (SELECT 1 FROM creators c WHERE c.id = v.creator_id::uuid)
  ON CONFLICT (creator_id, captured_on) DO NOTHING;

  -- v23: Claude API usage log. One row per messages.create / messages.stream
  -- call. The wrapper in services/claudeClient.ts inserts here so the Usage
  -- page can show where the Anthropic spend actually goes. cost_usd is
  -- computed at insert time from the per-model pricing table — the values
  -- don't change retroactively if Anthropic adjusts pricing, but the raw
  -- token counts are preserved so we can recompute if needed.
  CREATE TABLE IF NOT EXISTS claude_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    -- High-level label for which feature triggered the call, e.g.
    -- "post_creator_chat", "reply_generator", "ideas_variant".
    feature TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    -- Cache hits cost 10% of normal input; cache writes cost 25% more.
    -- Tracked separately so the UI can show effective cache savings.
    cache_read_tokens INTEGER NOT NULL DEFAULT 0,
    cache_write_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_claude_usage_created ON claude_usage_logs (created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_claude_usage_feature ON claude_usage_logs (feature, created_at DESC);
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
