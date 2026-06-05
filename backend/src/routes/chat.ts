import { Router, Request, Response } from 'express';
import { trackedStream } from '../services/claudeClient';
import { PostModel } from '../models/post';
import { CreatorModel } from '../models/creator';
import { getCrossCreatorPatterns } from '../services/patterns';
import { CreatorProfileModel } from '../models/creatorProfile';
import { CommenterProfileModel } from '../models/commenterProfile';
import pool from '../db';
import { ensureSingleLineHook } from '../utils/sanitizeText';
import {
  BRAND_RULES,
  CREATOR_LEARNINGS,
  POSITIONING_PRINCIPLES,
  NEETY_MECHANICS,
  HOOK_LAW,
  HOOK_QUALITY,
  IMAGE_PRINCIPLES,
  MEME_VISUAL_SYSTEM,
  VIDEO_SCRIPT,
  SHORT_FORM_VIDEO_PLAYBOOK,
  VIDEO_SYSTEM_PROMPT,
  REMIX_PRINCIPLES,
  RECENT_DIAGNOSIS,
  isVideoRequest,
} from '../services/postPrompt';

// Set of content_type values that correspond to "video on LinkedIn".
// Used to filter the analysis + profile context when the user asks for
// a video — everything outside this set (text-only, text+image,
// carousel, document, poll, article) is intentionally excluded so the
// model is never shown text-post patterns while drafting a video.
const VIDEO_CONTENT_TYPES = new Set(['video', 'text_video']);
function isVideoContentType(t: any): boolean {
  return typeof t === 'string' && VIDEO_CONTENT_TYPES.has(t);
}

const router = Router();

// Cache the analysis context (recompute every 10 min)
let cachedContext: string | null = null;
let cachedAt = 0;
const CACHE_TTL = 10 * 60 * 1000;

async function getAnalysisContext(): Promise<string> {
  if (cachedContext && Date.now() - cachedAt < CACHE_TTL) return cachedContext;

  const creators = await CreatorModel.findAll();
  let allPosts: any[] = [];
  const creatorTimezones: Record<string, string> = {};
  for (const c of creators) {
    creatorTimezones[c.id] = c.timezone || 'UTC';
    const posts = await PostModel.findByCreator(c.id, { limit: 10000 });
    allPosts = allPosts.concat(posts);
  }

  const patterns = getCrossCreatorPatterns(allPosts, creatorTimezones);
  const outliers = allPosts.filter((p) => p.is_outlier);

  // Build a rich context string
  const lines: string[] = [];
  lines.push(`=== LINKEDIN OUTLIER ANALYSIS DATA ===`);
  lines.push(`Total posts analyzed: ${allPosts.length} across ${creators.length} creators`);
  lines.push(`Total outliers (3x+ avg engagement): ${outliers.length}`);
  lines.push('');

  // Content type distribution
  lines.push('--- Content Type Distribution (outliers) ---');
  for (const [type, count] of Object.entries(patterns.content_type_distribution)) {
    const pct = Math.round((count as number / outliers.length) * 100);
    lines.push(`  ${type}: ${count} (${pct}%)`);
  }
  lines.push('');

  // Hook type distribution
  lines.push('--- Hook Types in Outliers ---');
  const hookEntries = Object.entries(patterns.hook_type_distribution).sort((a, b) => (b[1] as number) - (a[1] as number));
  for (const [type, count] of hookEntries) {
    const pct = Math.round((count as number / outliers.length) * 100);
    lines.push(`  ${type}: ${count} (${pct}%)`);
  }
  lines.push('');

  // Structure distribution
  lines.push('--- Post Structure in Outliers ---');
  const structEntries = Object.entries(patterns.structure_distribution).sort((a, b) => (b[1] as number) - (a[1] as number));
  for (const [type, count] of structEntries) {
    const pct = Math.round((count as number / outliers.length) * 100);
    lines.push(`  ${type}: ${count} (${pct}%)`);
  }
  lines.push('');

  // Tone comparison
  lines.push('--- Tone Analysis (outliers vs normal) ---');
  for (const t of patterns.tone_comparison.slice(0, 8)) {
    lines.push(`  ${t.tone}: ${t.outlier_avg_ratio}x avg ratio | ${t.outlier_pct}% of outliers vs ${t.normal_pct}% normal`);
  }
  lines.push('');

  // Archetypes
  if (patterns.archetypes && patterns.archetypes.length > 0) {
    lines.push('--- Top Viral Archetypes (hook × structure × tone) ---');
    for (const a of patterns.archetypes.slice(0, 10)) {
      lines.push(`  ${a.label}: ${a.avg_outlier_ratio}x ratio, ${a.count} posts`);
      if (a.example_hooks.length > 0) {
        lines.push(`    Example hook: "${a.example_hooks[0]}"`);
      }
    }
    lines.push('');
  }

  // Text patterns
  if (patterns.text_patterns) {
    const tp = patterns.text_patterns;
    if (tp.opening_patterns.length > 0) {
      lines.push('--- Opening Patterns in Outliers ---');
      for (const p of tp.opening_patterns.slice(0, 6)) {
        lines.push(`  ${p.pattern}: ${p.pct}% | Example: "${p.examples[0] || ''}"`);
      }
      lines.push('');
    }
    if (tp.closing_patterns.length > 0) {
      lines.push('--- Closing Patterns in Outliers ---');
      for (const p of tp.closing_patterns.slice(0, 6)) {
        lines.push(`  ${p.pattern}: ${p.pct}% | Example: "${p.examples[0] || ''}"`);
      }
      lines.push('');
    }
    if (tp.semantic_categories && tp.semantic_categories.length > 0) {
      lines.push('--- Language Patterns (outlier vs normal density per 100 words) ---');
      for (const c of tp.semantic_categories) {
        lines.push(`  ${c.label}: outlier ${c.outlier_density}/100w vs normal ${c.normal_density}/100w (${c.diff_pct > 0 ? '+' : ''}${c.diff_pct}%)`);
      }
      lines.push('');
    }
    if (tp.writing_analysis) {
      lines.push('--- Writing Style Analysis ---');
      lines.push(tp.writing_analysis);
      lines.push('');
    }
  }

  // Timing
  if (patterns.outlier_timing) {
    lines.push('--- Best Days for Outliers (creator local time) ---');
    for (const d of patterns.outlier_timing.best_days.slice(0, 5)) {
      lines.push(`  ${d.day_name}: ${d.outlier_rate}% outlier rate (${d.outliers}/${d.total_posts})`);
    }
    lines.push('--- Best Hours for Outliers (creator local time) ---');
    for (const h of patterns.outlier_timing.best_hours.slice(0, 8)) {
      lines.push(`  ${h.hour_label}: ${h.outlier_rate}% outlier rate, ${h.avg_outlier_ratio}x avg ratio`);
    }
    lines.push('');
  }

  // Common traits
  if (patterns.common_traits.length > 0) {
    lines.push('--- Common Traits of Top Outliers ---');
    for (const t of patterns.common_traits) {
      lines.push(`  - ${t}`);
    }
    lines.push('');
  }

  // Top 20 outlier hooks for inspiration
  const topOutliers = outliers
    .sort((a, b) => b.outlier_ratio - a.outlier_ratio)
    .slice(0, 20);
  lines.push('--- Top 20 Outlier Hooks (by ratio) ---');
  for (const p of topOutliers) {
    lines.push(`  [${p.outlier_ratio}x | ${p.hook_type} | ${p.post_structure} | ${p.text_tone}] "${(p.hook_text || '').substring(0, 100)}"`);
  }
  lines.push('');

  // A few full outlier texts for style reference
  const topFull = outliers
    .sort((a, b) => b.outlier_ratio - a.outlier_ratio)
    .slice(0, 5)
    .filter((p) => p.content_text && p.content_text.length > 50);
  if (topFull.length > 0) {
    lines.push('--- Full Text of Top 5 Outliers (for style/rhythm reference) ---');
    for (const p of topFull) {
      lines.push(`\n[${p.outlier_ratio}x ratio | Hook: ${p.hook_type} | Structure: ${p.post_structure} | Tone: ${p.text_tone}]`);
      lines.push(p.content_text!.substring(0, 800));
      lines.push('---');
    }
  }

  cachedContext = lines.join('\n');
  cachedAt = Date.now();
  return cachedContext;
}

// Video-mode analogue of getAnalysisContext: pulls ALL posts but keeps
// only those with content_type in VIDEO_CONTENT_TYPES, then summarises
// the same way (outlier counts, top hooks, full text samples). Avoids
// the cross-creator pattern engine for now — text-post archetypes
// don't describe videos, and the small text+video sample wouldn't
// produce stable hook_type × post_structure distributions anyway. Has
// its own 10-min cache so the two modes don't trample each other.
let cachedVideoContext: string | null = null;
let cachedVideoAt = 0;
async function getVideoAnalysisContext(): Promise<string> {
  if (cachedVideoContext && Date.now() - cachedVideoAt < CACHE_TTL) return cachedVideoContext;

  const creators = await CreatorModel.findAll();
  let allPosts: any[] = [];
  for (const c of creators) {
    const posts = await PostModel.findByCreator(c.id, { limit: 10000 });
    allPosts = allPosts.concat(posts);
  }
  const videoPosts = allPosts.filter((p) => isVideoContentType(p.content_type));
  const videoOutliers = videoPosts.filter((p) => p.is_outlier);

  const lines: string[] = [];
  lines.push(`=== LINKEDIN TEXT+VIDEO POSTS DATA (the ONLY relevant subset for a video request) ===`);
  lines.push(`Total text+video posts on managed accounts: ${videoPosts.length} (across ${creators.length} creators)`);
  lines.push(`Outliers among those (3x+ avg engagement): ${videoOutliers.length}`);
  lines.push('');

  if (videoPosts.length === 0) {
    lines.push('NOTE: no text+video posts have been scraped from this account yet. Lean on VIDEO_SCRIPT MODE and SHORT_FORM_VIDEO_PLAYBOOK below as the source of truth; do not invent account-specific data.');
    cachedVideoContext = lines.join('\n');
    cachedVideoAt = Date.now();
    return cachedVideoContext;
  }

  // Outlier hooks (text+video only)
  const topVideoOutliers = videoOutliers
    .sort((a, b) => (b.outlier_ratio || 0) - (a.outlier_ratio || 0))
    .slice(0, 10);
  if (topVideoOutliers.length > 0) {
    lines.push('--- Top Text+Video Outlier Hooks (the user\'s own — by ratio) ---');
    for (const p of topVideoOutliers) {
      const ratio = (+(p.outlier_ratio || 0)).toFixed(1);
      lines.push(`  [${ratio}x] "${(p.hook_text || '').substring(0, 140)}"`);
    }
    lines.push('');
  }

  // A few full captions for style reference (text+video only)
  const topFullVideo = videoOutliers
    .sort((a, b) => (b.outlier_ratio || 0) - (a.outlier_ratio || 0))
    .slice(0, 3)
    .filter((p) => p.content_text && p.content_text.length > 50);
  if (topFullVideo.length > 0) {
    lines.push('--- Full Captions of the User\'s Top Text+Video Outliers (style/rhythm reference for the caption piece) ---');
    for (const p of topFullVideo) {
      const ratio = (+(p.outlier_ratio || 0)).toFixed(1);
      lines.push(`\n[${ratio}x ratio]`);
      lines.push((p.content_text as string).substring(0, 600));
      lines.push('---');
    }
  }

  cachedVideoContext = lines.join('\n');
  cachedVideoAt = Date.now();
  return cachedVideoContext;
}

// Hard ceiling on a single post body before we even consider truncation —
// LinkedIn's text limit is ~3000 chars, articles can go higher, but in
// practice every text-post Iker/Unai have published fits comfortably
// under this. Set generously so the *normal* case is "show the post
// whole" with no head/tail tricks. Only an absurdly long outlier post
// (>8000 chars) would ever fall back to a truncated view, and that
// fallback now preserves head AND tail because losing the closing
// makes the model confabulate CTAs.
const MAX_POST_BODY_CHARS = 8000;

function preparePostBody(text: string): string {
  if (!text) return text;
  if (text.length <= MAX_POST_BODY_CHARS) return text; // common path: post whole, untouched.
  const head = text.slice(0, 5500).trimEnd();
  const tail = text.slice(-2000).trimStart();
  return `${head}\n\n…[truncated middle — original is ${text.length} chars; the closing IS shown after the divider]…\n\n${tail}`;
}

async function buildProfileContext(): Promise<string> {
  const profile = await CreatorProfileModel.get();

  const lines: string[] = [];
  lines.push('\n\n=== USER PROFILE (who is writing the post) ===');
  if (profile) {
    if (profile.name) lines.push(`Name: ${profile.name}`);
    if (profile.headline) lines.push(`Headline: ${profile.headline}`);
    if (profile.followers_count) lines.push(`Followers: ${profile.followers_count}`);
    if (profile.company) lines.push(`Company: ${profile.company}`);
    if (profile.product) lines.push(`Product: ${profile.product}`);
    if (profile.positioning) lines.push(`Positioning / What they want to stand for: ${profile.positioning}`);
    if (profile.tone_style) lines.push(`Tone & style preference: ${profile.tone_style}`);
  }

  // LIVE pull of the user's top managed-account posts from the posts table
  // (not the stale `my_posts` JSONB on creator_profile, which is a manual
  // snapshot from when the user set up their profile and doesn't reflect
  // anything published since). We want the model to reason about what's
  // *actually* working right now, including the outliers from the last few
  // weeks of publishing.
  try {
    const { rows: myTop } = await pool.query(
      `SELECT p.content_text, p.hook_text, p.likes_count, p.comments_count,
              p.reposts_count, p.impressions_count, p.engagement_score,
              p.outlier_ratio, p.is_outlier, p.published_at,
              p.hook_type, p.post_structure,
              c.name AS creator_name
         FROM posts p
         JOIN creators c ON c.id = p.creator_id
        WHERE c.is_managed = TRUE
          AND p.content_text IS NOT NULL
          AND LENGTH(TRIM(p.content_text)) > 50
          AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
        ORDER BY p.outlier_ratio DESC NULLS LAST, p.engagement_score DESC
        LIMIT 8`
    );
    if (myTop.length > 0) {
      lines.push('');
      lines.push(`--- TOP POSTS BY THIS USER (LIVE from DB — sorted by outlier ratio; ALWAYS up to date with the latest scrape, including the past week) ---`);
      lines.push(`Use this list as the source of truth when the user asks "what's working for me", "what are my best posts", "what should I write more of". The static profile.my_posts field is intentionally NOT used — it was a manual one-time load and may be months out of date.`);
      lines.push(`Each post is included with its FULL body — hook, mid-section, closing, CTA, everything. No truncation in the normal case. You can analyse the closer, the rhythm of the cuts, the placement of details, anything you need without guessing.`);
      for (const p of myTop) {
        const ratio = p.outlier_ratio ? `${(+p.outlier_ratio).toFixed(1)}x` : '—';
        const imp = p.impressions_count ? ` · ${p.impressions_count} imp` : '';
        const date = p.published_at ? new Date(p.published_at).toISOString().slice(0, 10) : '?';
        const arche = (p.hook_type && p.hook_type !== 'other' && p.post_structure && p.post_structure !== 'other')
          ? ` · ${p.hook_type} + ${p.post_structure}`
          : '';
        const fullText = (p.content_text as string) || '';
        const body = preparePostBody(fullText);
        lines.push(`\n[${date} · ${p.creator_name} · ${ratio} ratio · ${p.likes_count}❤ ${p.comments_count}💬 ${p.reposts_count}🔁${imp}${arche}]`);
        lines.push(body);
        lines.push('---');
      }
    }
  } catch (err) {
    console.warn('[buildProfileContext] live top-posts query failed:', (err as Error).message);
  }

  // RECENT TIMELINE — chronological feed of the last 6 weeks, INCLUDING
  // flops. The top-posts block above shows only the hits, which biases
  // diagnosis ("everything works for me"). This block surfaces what
  // actually got published when, in order, with the engagement /
  // outlier-ratio markers — so when the user says "why has my reach
  // dropped lately" or "give me a critical read", the model has the
  // full activity, not just the survivor-bias highlights.
  try {
    const sinceIso = new Date(Date.now() - 42 * 86400000).toISOString();
    const { rows: timeline } = await pool.query(
      `SELECT p.content_text, p.hook_text, p.likes_count, p.comments_count,
              p.reposts_count, p.impressions_count, p.engagement_score,
              p.outlier_ratio, p.is_outlier, p.published_at, p.content_type,
              c.name AS creator_name
         FROM posts p
         JOIN creators c ON c.id = p.creator_id
        WHERE c.is_managed = TRUE
          AND p.content_text IS NOT NULL
          AND LENGTH(TRIM(p.content_text)) > 30
          AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
          AND p.published_at >= $1
        ORDER BY p.published_at DESC
        LIMIT 35`,
      [sinceIso]
    );
    if (timeline.length > 0) {
      lines.push('');
      lines.push('--- RECENT TIMELINE (chronological — last 6 weeks, EVERY post including the flops) ---');
      lines.push('Diagnostic feed: not filtered by outlier status. Read this when asked about cadence, trends, or "what changed lately" — flops are as informative as hits. Every post body is shown WHOLE here too — same rule as TOP POSTS, no truncation in the normal case. If you need to quote a specific line or the CTA of a specific post, read it directly from this block.');
      for (const p of timeline) {
        const ratio = p.outlier_ratio != null ? `${(+p.outlier_ratio).toFixed(2)}x` : '—';
        const flopMarker = p.outlier_ratio != null && Number(p.outlier_ratio) < 0.7 ? ' [flop]' : '';
        const outlierMarker = p.is_outlier ? ' [OUTLIER]' : '';
        const date = p.published_at ? new Date(p.published_at).toISOString().slice(0, 10) : '?';
        const imp = p.impressions_count ? ` · ${p.impressions_count} imp` : '';
        const fullText = (p.content_text as string) || '';
        const body = preparePostBody(fullText);
        lines.push(`\n[${date} · ${p.creator_name} · ${p.content_type || 'text'} · ${ratio}${outlierMarker}${flopMarker} · ${p.engagement_score} eng${imp}]`);
        lines.push(body);
      }
    }
  } catch (err) {
    console.warn('[buildProfileContext] recent timeline query failed:', (err as Error).message);
  }

  lines.push('');
  lines.push('CRITICAL: When writing posts for this user, match their voice and style based on their top posts above (which are LIVE from the database — never refer to a previous version of their post history). Incorporate their company, product, and positioning naturally. Use the viral patterns from the analysis data but adapt them to THIS user\'s authentic voice — not generic. When diagnosing performance, lean on the RECENT TIMELINE block (which includes flops) instead of cherry-picking from TOP POSTS.');
  lines.push('NO-CONFABULATION RULE — applies when ANALYSING a specific past post (the user asks about its CTA, hook, closing, structure, archetype, what worked, etc.): every post body in TOP POSTS and RECENT TIMELINE is shown WHOLE in the normal case. So when the user asks about a specific element of a specific post, read it directly from those blocks and QUOTE the actual line. Do NOT paraphrase the CTA from the archetype, do NOT invent a closing because it "fits" the rhythm, do NOT describe a CTA the post doesn\'t have. If — exceptionally — a post body shows the "[truncated middle]" divider (only happens past 8000 chars, very rare) and the detail the user asks about lives in the cut middle, say so explicitly and ask: "ese trozo lo recorté del contexto, ¿me lo pegas?". Confabulating details on real published posts erodes trust in every diagnosis afterwards.');
  return lines.join('\n');
}

// Pull the first image URL out of a post's stored raw_data, MIRRORING
// /api/posts/post/:id/media exactly. The previous version had a subtle
// divergence: it only returned the URL when the attachment's `type`
// matched a hard whitelist (image|photo|picture|''), so any attachment
// whose `type` didn't match — Unipile's exact string varies across
// post versions and the field can also be empty — got silently
// discarded. The endpoint, by contrast, has an `else if (url)`
// fallback that accepts any non-video / non-document attachment as an
// image. That explains the reported symptom: recent posts whose
// attachments showed up as e.g. `type: "img"` / `type: "shared_image"`
// stopped extracting here, the inventory tagged them "CDN URL
// expired or not extractable", and the model concluded the visuals
// weren't loaded. Aligned the order-of-conditions to match the
// endpoint byte-for-byte.
function extractFirstImageUrl(raw: any): string | null {
  if (raw && Array.isArray(raw.attachments)) {
    for (const a of raw.attachments) {
      const t = String(a?.type || '').toLowerCase();
      const url = a?.url || a?.download_url || a?.media_url || null;
      if (!url) continue;
      if (t.includes('video')) continue;
      if (t.includes('document') || t.includes('pdf')) continue;
      // Everything else with a URL is treated as an image — same fallback
      // the /media endpoint uses. Covers known type strings (image, photo,
      // picture) AND any future / undocumented variants.
      return url;
    }
  }
  if (raw && Array.isArray(raw.images)) {
    for (const img of raw.images) {
      const url = typeof img === 'string' ? img : (img?.url || img?.download_url || img?.media_url);
      if (url) return url;
    }
  }
  if (raw && Array.isArray(raw.media)) {
    for (const m of raw.media) {
      const t = String(m?.type || m?.media_type || '').toLowerCase();
      const url = m?.url || m?.download_url || m?.media_url;
      if (url && !t.includes('video')) return url;
    }
  }
  return raw?.image_url || raw?.image || raw?.thumbnail_url || raw?.thumbnail || null;
}

// Build the visual reference block: a content-block array with the
// user's recent meme / text+image / carousel posts as real images that
// the model can SEE, plus an INVENTORY of every such post in the
// window (whether or not its CDN URL still loads) so the model never
// silently forgets a post had an image.
//
// Why the inventory matters: LinkedIn CDN URLs are temporary and rotate
// after a few weeks. Without the inventory, an old post whose URL has
// expired falls out of the context entirely, and when the user asks
// "what about my meme from May 13?" the model can't see the image AND
// has no signal the post even existed as an image post — so it
// confabulates ("you don't have a meme that day") instead of saying
// "the CDN URL has expired but the post exists". The inventory closes
// that gap: the model always knows which posts had images, and the
// attached image blocks give it visuals for the ones still loadable.
const VISUAL_CONTENT_TYPES = ['text_image', 'image', 'text_carousel', 'carousel'];
const MAX_IMAGES = 20;
const IMAGES_LOOKBACK_DAYS = 56;

async function buildAccountImageBlocks(): Promise<any[]> {
  try {
    const sinceIso = new Date(Date.now() - IMAGES_LOOKBACK_DAYS * 86400000).toISOString();
    const { rows } = await pool.query(
      `SELECT p.id, p.linkedin_post_id, p.content_text, p.hook_text, p.published_at,
              p.content_type, p.outlier_ratio, p.is_outlier,
              p.likes_count, p.comments_count, p.reposts_count, p.impressions_count,
              p.raw_data, p.post_url,
              c.name AS creator_name
         FROM posts p
         JOIN creators c ON c.id = p.creator_id
        WHERE c.is_managed = TRUE
          AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
          AND p.content_type = ANY($1::text[])
          AND p.published_at >= $2
        ORDER BY p.published_at DESC
        LIMIT 60`,
      [VISUAL_CONTENT_TYPES, sinceIso]
    );

    if (rows.length === 0) return [];

    // First pass: build the INVENTORY of every visual post in the
    // window. Every row gets a line — even ones whose CDN URL has
    // expired or whose raw_data we couldn't extract — so the model
    // always knows the post existed and was image-bearing.
    const inventoryLines: string[] = [];
    const imageTargets: Array<{ post: any; url: string }> = [];
    for (const post of rows) {
      const url = post.raw_data ? extractFirstImageUrl(post.raw_data) : null;
      const hasLoadableUrl = !!(url && /^https?:\/\//i.test(url));
      // Diagnostic: if a post is supposedly an image post but we couldn't
      // pull any URL out of raw_data, log it so a Unipile schema change
      // surfaces in Railway logs instead of as model confabulation.
      if (!hasLoadableUrl && post.raw_data) {
        const attTypes = Array.isArray(post.raw_data.attachments)
          ? post.raw_data.attachments.map((a: any) => String(a?.type ?? 'undef')).join(',')
          : 'no-attachments';
        const topKeys = Object.keys(post.raw_data).slice(0, 8).join(',');
        console.warn(
          `[buildAccountImageBlocks] no image URL for post ${post.linkedin_post_id} (${post.content_type}, ${post.published_at}) — att types: [${attTypes}] · top raw_data keys: [${topKeys}]`
        );
      }
      if (hasLoadableUrl && imageTargets.length < MAX_IMAGES) {
        imageTargets.push({ post, url: url as string });
      }
      const date = post.published_at
        ? new Date(post.published_at).toISOString().slice(0, 10)
        : '?';
      const ratio = post.outlier_ratio != null
        ? `${(+post.outlier_ratio).toFixed(2)}x`
        : '—';
      const outlierMarker = post.is_outlier ? ' [OUTLIER]' : '';
      const hook = (post.hook_text || post.content_text || '')
        .toString()
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200);
      const stats = [
        post.likes_count != null ? `${post.likes_count}❤` : null,
        post.comments_count != null ? `${post.comments_count}💬` : null,
        post.reposts_count != null ? `${post.reposts_count}🔁` : null,
        post.impressions_count != null ? `${post.impressions_count}👁` : null,
      ].filter(Boolean).join(' ');
      const loaded = hasLoadableUrl
        ? (imageTargets.length <= MAX_IMAGES ? '🖼️ image attached below' : '🖼️ image exists, not attached (over the visual-attach cap)')
        : '🖼️ image exists, CDN URL expired or not extractable';
      inventoryLines.push(
        `- [${date} · ${post.creator_name} · ${post.content_type} · ${ratio}${outlierMarker}] ${stats} — ${loaded}\n  hook: "${hook}"`
      );
    }

    const blocks: any[] = [];
    blocks.push({
      type: 'text',
      text: `═══ ACCOUNTS — VISUAL POSTS INVENTORY (last ${IMAGES_LOOKBACK_DAYS} days, newest first) ═══
The list below is EVERY post you've published in this window with content_type ∈ {text_image, image, text_carousel, carousel}. EVERY row in this list IS an image post by definition — the underlying LinkedIn post has an image attached, no exception. The flag at the end tells you whether the actual image file is attached below in this message:
  - "🖼️ image attached below" → you can SEE the image in the message after the inventory.
  - "🖼️ image exists, CDN URL expired or not extractable" → the post still has an image on LinkedIn, but LinkedIn's CDN URL has rotated (it does this after a few weeks) or our scrape couldn't extract a clean URL. You do NOT see the visual, but the post IS an image post. DO NOT tell the user the post has no image — say the visual isn't loadable right now and reason from the hook/metadata.
  - "🖼️ image exists, not attached (over the visual-attach cap)" → we capped visual attachments at ${MAX_IMAGES} per turn to keep tokens reasonable. The image exists on LinkedIn; you just don't see it here.

Inventory (${rows.length} posts):
${inventoryLines.join('\n')}

The actual image files for ${imageTargets.length} of these posts follow. Each is preceded by a header line identifying which post it belongs to, in the same order as the inventory above (oldest of the loadable ones first → newest visual just before the chat starts isn't guaranteed; treat the header text as the source of truth for which post each image is).`,
    });

    for (const { post, url } of imageTargets) {
      const date = post.published_at
        ? new Date(post.published_at).toISOString().slice(0, 10)
        : '?';
      const ratio = post.outlier_ratio != null
        ? `${(+post.outlier_ratio).toFixed(2)}x`
        : '—';
      const hook = (post.hook_text || post.content_text || '')
        .toString()
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 140);
      blocks.push({
        type: 'text',
        text: `\n[${date} · ${post.creator_name} · ${ratio} · ${post.content_type}] ${hook}`,
      });
      blocks.push({
        type: 'image',
        source: { type: 'url', url },
      });
    }

    return blocks;
  } catch (err) {
    console.warn('[buildAccountImageBlocks] failed:', (err as Error).message);
    return [];
  }
}

// Video-mode analogue of buildProfileContext: same profile header, but
// the LIVE top-posts query is restricted to text+video content types so
// the model only sees the user's video work when drafting a video.
async function buildVideoProfileContext(): Promise<string> {
  const profile = await CreatorProfileModel.get();

  const lines: string[] = [];
  lines.push('\n\n=== USER PROFILE (who is publishing the video) ===');
  if (profile) {
    if (profile.name) lines.push(`Name: ${profile.name}`);
    if (profile.headline) lines.push(`Headline: ${profile.headline}`);
    if (profile.followers_count) lines.push(`Followers: ${profile.followers_count}`);
    if (profile.company) lines.push(`Company: ${profile.company}`);
    if (profile.product) lines.push(`Product: ${profile.product}`);
    if (profile.positioning) lines.push(`Positioning / What they want to stand for: ${profile.positioning}`);
    if (profile.tone_style) lines.push(`Tone & style preference: ${profile.tone_style}`);
  }

  try {
    const { rows: myVideoTop } = await pool.query(
      `SELECT p.content_text, p.hook_text, p.likes_count, p.comments_count,
              p.reposts_count, p.impressions_count, p.engagement_score,
              p.outlier_ratio, p.is_outlier, p.published_at, p.content_type,
              c.name AS creator_name
         FROM posts p
         JOIN creators c ON c.id = p.creator_id
        WHERE c.is_managed = TRUE
          AND p.content_text IS NOT NULL
          AND LENGTH(TRIM(p.content_text)) > 50
          AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
          AND p.content_type = ANY($1::text[])
        ORDER BY p.outlier_ratio DESC NULLS LAST, p.engagement_score DESC
        LIMIT 8`,
      [Array.from(VIDEO_CONTENT_TYPES)]
    );
    if (myVideoTop.length > 0) {
      lines.push('');
      lines.push(`--- TOP TEXT+VIDEO POSTS BY THIS USER (LIVE from DB — text+video only, sorted by outlier ratio) ---`);
      lines.push(`Use these as the only account-specific reference for what's working for the user in VIDEO format. Text-only / text+image posts are deliberately excluded — their patterns don't transfer to a video script.`);
      for (const p of myVideoTop) {
        const ratio = p.outlier_ratio ? `${(+p.outlier_ratio).toFixed(1)}x` : '—';
        const imp = p.impressions_count ? ` · ${p.impressions_count} imp` : '';
        const date = p.published_at ? new Date(p.published_at).toISOString().slice(0, 10) : '?';
        lines.push(`\n[${date} · ${p.creator_name} · ${ratio} ratio · ${p.likes_count}❤ ${p.comments_count}💬 ${p.reposts_count}🔁${imp} · ${p.content_type}]`);
        lines.push((p.content_text as string).slice(0, 500));
        lines.push('---');
      }
    } else {
      lines.push('');
      lines.push('NOTE: no text+video posts published yet by this user. Base the script on VIDEO_SCRIPT MODE and SHORT_FORM_VIDEO_PLAYBOOK below — do NOT pull patterns from this user\'s text-only or text+image history.');
    }
  } catch (err) {
    console.warn('[buildVideoProfileContext] live top-video-posts query failed:', (err as Error).message);
  }

  return lines.join('\n');
}

// If the latest user message says it's a post FOR "Iker" or "Unai",
// load that person's voice profile from Network (commenter_profile) and
// return a voice block. Accent/case-insensitive, word-boundary so it
// doesn't fire on substrings. If both names appear, the later mention
// wins (it's usually the actual subject). Empty string = no persona.
async function buildVoiceContext(messages: any[]): Promise<string> {
  const lastUser = [...(messages || [])].reverse().find((m) => m?.role === 'user');
  // Once images are attached, content becomes an array of blocks
  // ([{type:'text',text:'…'},{type:'image',source:…}]). Pull the text out
  // of those blocks so the Iker/Unai voice trigger still fires.
  const raw =
    typeof lastUser?.content === 'string'
      ? lastUser.content
      : Array.isArray(lastUser?.content)
        ? lastUser.content
            .filter((b: any) => b?.type === 'text' && typeof b.text === 'string')
            .map((b: any) => b.text)
            .join(' ')
        : '';
  if (!raw) return '';
  const s = raw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const iAt = (() => { const m = s.match(/\biker\b/); return m ? m.index! : -1; })();
  const uAt = (() => { const m = s.match(/\bunai\b/); return m ? m.index! : -1; })();
  if (iAt < 0 && uAt < 0) return '';
  const name = uAt > iAt ? 'Unai' : 'Iker';

  try {
    const p = await CommenterProfileModel.getByName(name);
    if (!p) return '';
    const v: string[] = [];
    if (p.headline) v.push(`Identity: ${p.headline}`);
    if (p.voice_style) v.push(`Writing style (match exactly): ${p.voice_style}`);
    if (p.worldview) v.push(`Worldview / lens: ${p.worldview}`);
    if (p.signature_moves) v.push(`Signature moves: ${p.signature_moves}`);
    if (p.avoid) v.push(`Never do: ${p.avoid}`);
    if (v.length === 0) return '';
    return `\n\n═══ WRITE THIS POST IN ${name.toUpperCase()}'S VOICE (from Network → My Profile) ═══
${v.join('\n')}

PRECEDENCE — READ CAREFULLY: The voice profile above only controls HOW the post is written (tone, phrasing, rhythm, vocabulary). It does NOT decide WHAT the post is. The hook type, post structure, archetype, angle and the virality tag MUST still come from the real outlier data above — viral data ALWAYS takes priority. If ${name}'s natural style would weaken a proven viral pattern, keep the pattern and bend the wording toward ${name}, not the other way around. Voice is the paint; the data is the blueprint.`;
  } catch (err) {
    console.warn('[buildVoiceContext] failed:', (err as Error).message);
    return '';
  }
}

const SYSTEM_PROMPT = `You are a LinkedIn viral content strategist and copywriter. You have access to real data from analyzing thousands of LinkedIn posts across multiple creators, identifying which posts became "outliers" (3x+ their creator's average engagement).

Your job is to help the user create LinkedIn posts that have the highest chance of going viral, based on the real patterns you've observed in the data.

Key principles from the data:
- The outlier RATIO (how much a post overperforms vs its creator's average) is the key metric, not raw engagement
- You know which hook types, structures, tones, and combinations produce the highest outlier ratios
- You understand narrative mechanisms (open loops, belief breaks, curiosity stacking, etc.)
- You know the virality drivers (social currency, controversy, identity, utility, emotion, belonging)
- You have real examples of hooks and full posts that went viral

When helping the user:
1. ALWAYS base your advice on the actual data provided, not generic marketing advice
2. When writing posts, use the hook types, structures, and tones that the data shows work best
3. Reference specific patterns and ratios from the data to justify your choices
4. Write in the language the user writes to you (Spanish, English, etc.)
5. Be specific and actionable — give them ready-to-post content, not vague tips
6. When the user gives you a topic, write 2-3 post variations using different high-performing archetypes
7. For each post you write, explain which pattern/archetype you're using and why

VIRALITY TAG (REQUIRED on every post option you produce — ideas, full posts, or hooks):
Immediately BEFORE each option, on its own line, output a tag in EXACTLY this format:
  🔥 ~{ratio}x vs. media · {archetype label} (n={count} outliers reales)
Where {ratio} and {count} come ONLY from the "Top Viral Archetypes" data block provided to you, for the archetype you actually wrote that option with.
- The number is the real average outlier ratio of that archetype in the user's own data — a multiplier vs. their average, NOT a percentage. Never convert it to a %.
- NEVER invent or estimate a ratio. If the archetype you used is NOT listed in the "Top Viral Archetypes" data, write the tag as: 🔥 arquetipo sin histórico suficiente en tus datos — and do not put a number.
- Pick genuinely different archetypes across the 2-3 options so the user can compare; if two options would share the same archetype, switch one.
- When the user asks only for hooks, still tag each hook the same way with the archetype it belongs to.

IMPORTANT: Keep posts authentic and natural. Don't over-optimize — the best outliers feel genuine, not formulaic.

═══ NON-NEGOTIABLE RULES (2026 reality, learned from this account) ═══

1. LEAD-MAGNET CTA — USE THE EXPLICIT "Comenta X + Y" FORMULA (UPDATED — this reverses our earlier implicit-only stance). We A/B'd this on the real account: we switched lead-magnet closers from explicit "Comenta 'X' + emoji" to implicit asks ("Si lo quieres, 'psicólogo' + tu sector aquí abajo") because we suspected LinkedIn was throttling explicit comment-bait (some posts did get their impressions braked a few hours in). But the implicit version COLLAPSED our comment count — people just stopped commenting. The comments are worth more than the impression risk, so for lead magnets we go back to the explicit formula:
   COMENTA [X] + [Y]
   - X = a word tied to THIS post's resource (e.g. "GUÍA", "PLANTILLA", "CHECKLIST", "SISTEMA").
   - Y = something the reader barely has to think about. Best: their sector or department (ideally tied to our world — "tu sector", "tu stack de ventas", "tu CRM"). Fallback when nothing on-topic fits: an obvious life detail ("tu color favorito", "tu día favorito"). The low mental effort of Y is the point — it removes the friction that was killing comment volume.
   Examples: "Comenta 'SISTEMA' + tu sector aquí abajo y te lo paso." / "Comenta 'GUÍA' + tu color favorito y te llega." / "Comenta 'PLANTILLA' + el CRM que usas y te la envío."
   This explicit "Comenta X + Y" pattern is now the DEFAULT for lead-magnet posts. The old implicit phrasings ("dímelo abajo", "levanto la mano") are deprecated — they tanked comments. (Rules #7 and the body-link option in #10 still apply as alternatives when the post isn't a lead magnet.)

2. POSITIVE-ONLY MENTIONS OF OTHER COMPANIES, SOFTWARE OR PEOPLE. Never criticise, mock or attack any other product, tool, brand, person or company by name. If you need a counter-example, use a generic category ("most CRMs", "the average outbound playbook") instead of naming names. Reposts are LinkedIn's highest-leverage metric and named-and-criticised companies never repost.

3. ATTACK THE PROBLEM, NEVER THE READER. Confront the situation, the system, the market — never the reader directly ("tú haces X mal", "you don't get it", "you're doing this wrong"). Second-person criticism triggers defensive rejection and kills engagement. Frame the wound as something happening TO people in the reader's role ("most SDRs are losing X", "the typical outbound process is broken"), not as a personal failing the reader is committing. They should nod at the diagnosis, never feel attacked.

4. NEVER USE MARKDOWN INSIDE A POST. No **bold**, no *italic*, no \`code\`, no # headers. LinkedIn renders none of this in 2026 — **word** literally shows up with the asterisks in the feed. Use line breaks, ALL-CAPS on 1–2 words max, or punctuation for emphasis instead.

5. WHEN PROPOSING AN IMAGE FOR A POST, USE NEETY'S BRAND SYSTEM EXPLICITLY:
   - Palette (only these three): Dark Blue #0c202e (background), Persian Orange #ee9363 (accent/highlight), Alabastro #f9f3ef (light surface).
   - Typography: "Bricolage Grotesque" for titles (bold/display); "Switzer" for body/supporting text. Never propose other fonts.
   - ORANGE WORD RULE: if the image carries title text, the SINGLE most important word of that text MUST be coloured in Persian Orange (#ee9363); the rest stays Alabastro on Dark Blue. Pick that word deliberately — it's the scroll-stop.
   - Every image suggestion must explicitly state which hex goes where, which font is used for which text, and which exact word is in Persian Orange. Don't leave it implicit.

6. ONE PILLAR ONLY — push it to the extreme. Every post commits to a single dominant psychological pillar (curiosity / fear / desire) and uses ONLY that pillar's levers. Trace amounts of the others are fine; actively triggering all three dilutes the message. Pillar-specific levers (don't mix):
   - CURIOSITY: information gap + "nobody talks about it" / insider framing, reversal ("everyone says X — actually Y"), open loop punctuation at the cut ("…", ":", "👇"), withheld key detail until the body.
   - FEAR: obsolescence ("X is dead / dying"), replacement risk ("an agent doing this for €5"), bandwagon-against ("everyone is moving to X and you're not"), concrete stakes ("you're losing N% of pipeline to this").
   - DESIRE: cash figures ($, €, MRR, ARR), speed ("in 60 seconds", "in 7 days"), a system/framework/playbook promise, status / top-1% framing, before→after with a concrete outcome.
   If the hook borrows a different pillar's lever set, rewrite — pillar mix is the #1 dilution.

7. EXACTLY ONE CTA at the end — pick a single closer: an opinion-forcing question, OR a lead-magnet ask using the explicit "Comenta X + Y" formula (rule #1), OR a direct body link (rule #10), OR no CTA at all (a strong claim can close). NEVER stack closers (no question + lead-magnet, no two questions). One closer, sharp.

8. HOOK MUST ANCHOR TO OUR SECTOR IN THE FIRST LINE — and our sector is B2B SALES (with AI as a tool we happen to use, NOT our category). The audience is salespeople, SDRs, AEs, sales leaders and B2B founders — not AI engineers or generic productivity readers. Any ONE of these anchors in the first line is enough: ventas / sales / B2B / SDR / AE / outbound / outreach / cold email / prospecting / pipeline / SaaS / CRM / GTM / lead gen / closing / discovery / demo / cuota / cliente — OR a specific tool we live in (Claude, GPT, Clay, Apollo, HubSpot, Salesforce, n8n, Make, Zapier, etc.). AI / IA / agente / LLM is welcome but NOT required: a hook that only says "ventas" or "B2B" is already on-brand. The failure mode goes the other way — a generic personal-development hook ("Hace 5 años pensaba que…", "El otro día me di cuenta…") that anyone in any industry could publish, dissolving our positioning. Sector anchor lives in the FIRST line, not buried in paragraph 3.

   DEFAULT ANCHOR WORD WHEN IN DOUBT = "ventas" (with close cousins "vender" and "cerrar clientes"). Rules #8 and #12 sit on the same axis with two opposing forces — #8 wants the hook anchored narrowly enough that it can't be from any industry; #12 wants the claim universal enough that the entire commercial B2B audience parses it on a 2-second read. The optimum on that axis is "ventas":
     · It IS 100% sector anchor — already listed above. A hook that only says "ventas" or "vender" is already on-brand. Nothing else is needed to satisfy #8.
     · It is the LOWEST-friction sector word in the language. From a 22-year-old SDR to a 55-year-old director comercial to a non-commercial founder considering moving into sales — all parse it in 2 seconds, zero translation cost. That's exactly what #12 is asking for.

   HEURISTIC FOR PICKING THE ANCHOR WORD:
     · DEFAULT → "ventas" / "vender" / "cerrar clientes". Anchors AND maximises reach simultaneously. The safe bet for max reach.
     · LEVEL UP to something more specific ("prospectar", "reuniones", "agenda", "clientes industriales", "el deal", "la cuota") ONLY when that word adds a CONCRETE IMAGE or hits a real WOUND without losing universality. "Cerrar clientes" is the intermediate step — adds the desired outcome (image) without losing reach.
     · DOWNGRADE niche-tactical anchors to the BODY. The following words DO anchor in sector but NARROW the audience and should NOT live in the hook unless the post is explicitly aimed at that technical role: "pipeline", "outbound", "cadencia", "reply rate", "touchpoints", "SDR / AE" as a term, "cold email", "discovery", "GTM", "ICP". A director general or non-commercial founder has to stop and process them → audience shrinks. Send them to the BODY, where they accumulate and prove the claim; in the hook, "ventas".

   ONE-LINE RULE OF THUMB: in the hook, when in doubt between a niche sector word and "ventas" → "ventas" wins. It's the only word that anchors 100% AND costs nobody in the commercial B2B world any mental effort.

9. BURNED OPENERS / CLOSERS — never reuse these verbatim (paraphrase or change angle): "Nadie te dice esto, pero…", "Lo que nadie te cuenta…", "Me ha costado X años aprender que…", "Este es el error más grande que…", "El problema eres tú", "Y nadie te lo dice" stacked at the end of a list, "Si has llegado hasta aquí, déjame un comentario" or any explicit lead-magnet bait, "Spoiler: …" / "Plot twist: …" as a closer. They signal low-effort the moment a reader sees them.

10. LINKS INSIDE THE BODY OF THE POST ARE FINE — verified on our own account with posts crossing 100K impressions that carry a body link. The old LinkedIn folklore "never put the link in the post, drop it in the first comment" no longer applies in 2026: a body link does NOT suppress reach. This matters for lead-magnet design: instead of forcing implicit comment-bait (rule #1) you can simply place a direct link to the resource / article / landing page / product in the body. Both options remain valid — choose deliberately: an implicit comment-gated ask accrues comments which the algo rewards (best when you need the comment-spike for amplification); a direct body link is friction-free and gets clicks immediately but loses that comment signal. Never recommend "ponlo en el primer comentario" as a constraint; it's outdated.

11. HOOK NUMBER DENSITY — at most ONE numerical metric in the hook. Zero or one is the sweet spot; TWO OR MORE figures in the first line is a hard NO. Verified on this account's top 8 viral hooks (ratios 3.6x–15.6x): 50% have zero numbers, 50% have exactly one, 0% have two or more. Multiple stats stacked at the open glaze the eye and kill the open loop — numbers belong in the BODY, where they accumulate and prove the claim. The hook shapes that actually work on this account:
   (a) ONE METRIC + COUNTERINTUITIVE CLAIM + 👇 — "Cataluña exporta más que Portugal entera. Y casi nadie lo cuenta porque se trabaja en silencio desde hace 80 años 👇" · "El 93% de los equipos B2B prioriza leads a ojo. El jueves enseño cómo dejar de hacerlo 👇"
   (b) NO METRICS, BOLD CLAIM + REFRAME — "El cold calling no ha muerto. Lo hemos enterrado en vida 👇" · "🚨 ÚLTIMA HORA: Claude acaba de matar el cold outbound como lo conocemos 👇"
   (c) NO METRICS, PERSONAL FRAME + OPEN LOOP — "Le tiré las llaves de mi LinkedIn a Claude y nunca había generado tantos leads B2B 👇"
   Recurring structure: [single claim OR single metric] + [tension or reframe] + [👇]. A punchy/physical verb (matar, enterrar, perder, reventar, tirar, destrozar, quemar…) lives in at least one of the two parts. If the draft hook has 2+ figures, move all but the single most impactful one to the body — or drop them all and lead with the claim.

12. HOOK CLAIM MUST BE UNIVERSAL WITHIN THE SECTOR. Rule #8 (sector anchor) places the hook inside the B2B-sales world; this rule decides who inside that world stops scrolling. The CLAIM itself — the shock, the tension, the reframe — must land for ANYONE near commercial B2B: SDRs and AEs, sales managers / heads of sales, RevOps, B2B founders, marketing-sales hybrids, even curious onlookers thinking about moving into B2B sales. The failure mode is a hook that only a technical SDR specialist would parse on first read ("cadence step 3 reply rate dropped after the LinkedIn cooldown") — that's a 1% audience hook. Aim instead for ICP truths that resonate across roles: "replacement by an agent", "the CRM you don't trust", "the deal you knew was dead from the discovery call", "cuota imposible", "el cliente que se fue a la competencia por 200€", "vender B2B en 2026 sin IA es jugar con cartas marcadas". Quick test before committing the hook: would a sales manager scroll-stop on this? Would a B2B founder? If only the deep-tactical-SDR persona would catch it, broaden the wording while keeping the sector anchor.

   AXIS WITH #8 — the sector-anchor word in the hook is the FIRST lever of universality. Default to "ventas" / "vender" / "cerrar clientes" over niche-tactical terms ("pipeline", "outbound", "SDR", "cold email", "GTM", "ICP", "discovery") when in doubt — see the anchor-word heuristic in #8. The most universally-understood sector word is also the broadest sector claim; the two rules pull in the same direction once the right anchor word is chosen.

13. HOOK → BODY TRANSITION. The line(s) immediately after the hook are make-or-break: the user has just clicked "ver más" and the loop opened by the hook needs a partial discharge RIGHT NOW. NEVER open the body with credential / authority preambles: "Llevamos meses…", "Después de X años/semanas/conversaciones…", "Tras analizar…", "He hablado con N equipos…", "En los últimos X meses he visto que…", "We've spent the last X months…", etc. NEVER open with explainer-announcers either: "La realidad es que…", "Lo cierto es que…", "Déjame explicarte…", "Te cuento…", "Here's the thing…", "Let me tell you…". They announce authority instead of demonstrating it AND ask the reader for patience exactly when their patience is at zero. The body must FIRE on line 2: a short partial-discharge of the open loop (5–12 words), a hard data point, a scene/dialogue, or a list — never a windup. Authority is proved by the content of the post, never asserted in line 2. Validated pattern from a 5.2x outlier on this account:
   Hook:  El cold calling no ha muerto. Lo hemos enterrado en vida 👇
   Body opens with:
     Manager: "¿Le has llamado?"
     SDR: le mandé un email.
   → Zero credentials. Straight to the scene. The hook's open loop gets its partial pay-off in two dialogue lines, and the rest of the post unpacks the cause. Use this as the template: hook → 5–12-word discharge / scene / data / list → development. If your draft body opens with any of the banned preambles above, DELETE the preamble and start with the line right after it.

14. ENUMERATION & PARALLEL-PHRASE FORMAT — each item on its own line, NEVER stacked into one paragraph with periods. On LinkedIn the visual rhythm matters as much as the content: long paragraphs send the reader scrolling past; short lines with single line breaks create the sense of forward motion and weight that punchlines need to land. When you have 2+ phrases that meet ANY of the following, each one goes on its own line, separated by a single line break (\\n), NEVER pasted together inside a paragraph with period-space:
   (a) Repeated parallel structure ("No es X. No es Y. No es Z." / "Cada uno X. Cada uno Y." / "Antes hacía X. Ahora hago Y.").
   (b) Enumeration of items (negations, affirmations, traits, steps).
   (c) Data + shock-consequence where the consequence IS the punchline ("9 de cada 10 startups mueren antes del año 5. Y casi ninguna muere por el producto.").
   (d) Setup + dart where the second sentence is the kill-line ("No la tiene imposible. Solo se juega más años de los necesarios.").

   ❌ WRONG (glued in one paragraph or with an unnecessary blank line — heavy paragraph, the punchlines get diluted):
     "No es la inversión. No es el espacio. No son los mentores."
     "9 de cada 10 startups mueren antes del año 5. Y casi ninguna muere por el producto."

   ✅ RIGHT (each line breathes, each punchline lands):
     No es la inversión.
     No es el espacio.
     No son los mentores.

     Cada uno entró con una idea a medio cocer.
     Cada uno está saliendo con clientes pagando y una tesis que funciona.

   SINGLE EXCEPTION — INTENTIONAL STACCATO BLOCK: when you have 3–5 SHORT items (1–3 words each) that work as a visual flag-block / rhythmic close to a section, they DO go pasted on a single line:
     ✅ "Industrial. SaaS B2B. Servicios profesionales. Logística."
     ✅ "Curiosidad. Deseo. Miedo."
     ✅ "Rápido. Barato. Bueno."
   The test: if each item is a SENTENCE (subject + verb) → own line. If each item is a bare NOUN or ADJECTIVE → staccato pasted.

   PRE-DELIVERY CHECK — MANDATORY ON EVERY ITERATION (not only the first): before returning any post to the user, re-read each block of 2+ consecutive sentences and ask "are these parallel or enumerative?". If yes → line breaks. If in doubt → line breaks (the bias is always towards MORE breathing, never less). When the user asks for changes on a later iteration, do NOT assume the format from the previous turn was right — re-audit the whole post for this rule again.

15. MANDATORY SELF-VALIDATION PASS — RUN BEFORE EVERY RESPONSE THAT CONTAINS A POST DRAFT (post / idea / hook / image concept / video script).
The data and rules in this prompt are NOT decorative. Before sending ANY draft, silently run a validation pass against this full stack:
   • Rules #1–#14 above (comment-bait, positive mentions, attack-the-problem, no markdown, brand-image colours, one pillar, one CTA, sector anchor, burned openers, body links OK, hook number density, universal claim, hook→body transition, enumeration line breaks)
   • HOOK_LAW (single-block hook, ≤210 chars, no \\n\\n inside)
   • HOOK_QUALITY (paint picture / hit wound / one pillar maxed)
   • NEETY_MECHANICS (3 mechanics + WHAT BREAKS POSTS + BURNED OPENERS + CHOOSING MATRIX)
   • RECENT_DIAGNOSIS (regional-map underdog criteria + Madrid 0.55x precedent, meme 4-point filter with progressive bodily change, vibe-prospecting fatigue 7–10 days, lead-magnet pause until end of May, retired patterns)
   • IMAGE_PRINCIPLES + MEME_VISUAL_SYSTEM when proposing visuals
   • The USER PROFILE block + RECENT TIMELINE (including FLOPS) below — does the draft echo a pattern that already flopped on this account?
   • The pre-loaded image reference turn — does the proposed visual concept reuse a layout that already failed, or duplicate a recent winner with no twist?

Two outcomes from the pass:

A) SILENT FIX (clear violation that's trivial to correct): markdown inside the post, banned preamble on line 2, 2+ figures in the hook, parallel phrases pasted with periods, generic personal-development opener, fonts other than Bricolage/Switzer on a meme image, baseless virality tag, etc. → fix it INSIDE your reasoning before the user sees the draft. No need to mention these.

B) SIGNIFICANT RISK (the draft will probably underperform even after fixes): meme passes only 2/4 of the four-point filter, regional map on a banned region (Madrid / Barcelona / generic capital), lead-magnet inside the fatigue window, vibe-prospecting too soon after the last one, archetype matched a recent flop pattern, hook claim only readable by a deep-tactical-SDR persona, etc. → CALL IT OUT BEFORE or alongside the draft, in the same response: "Antes de entregártelo: este post va a ir regular porque [razón concreta y datos: 'Madrid ya falló a 0.55x', 'es el 4º lead-magnet en 10 días — vamos a fatiga', 'el meme solo pasa 2/4 puntos: le falta cambio corporal en la imagen', etc.]. ¿Lo retocamos o pruebo otra mecánica?" Then either deliver with the explicit warning, or redirect to a stronger angle.

DO NOT wait for the user to ask "is this going to work?" — that question is YOUR job to answer before they ask it, on every iteration. The whole point of loading the diagnostic data + outlier history + image reference into this prompt is for you to USE it proactively, not only when explicitly told to critique. Treat the validation pass as part of the response, not as something extra.

If the user explicitly says "no me valides, dame lo que sea" / "no me critiques" / similar → skip the SIGNIFICANT-RISK warning and deliver as requested. NEVER skip the silent-fix pass (those are non-negotiable mechanical rules, not opinions).

PARTIAL-EDIT TRAP — READ THIS CAREFULLY, IT'S THE #1 WAY VALIDATION GETS SKIPPED:
When the user scopes a request to a piece of the post — "no toques el hook, mejora el cuerpo", "solo cambia el cierre", "edición conservadora, mantén lo demás", "deja el body, repítele al hook" — DO NOT interpret that as permission to skip validation on the untouched parts. The validation pass STILL runs on the WHOLE post on every iteration. "Don't touch X" is NOT the same as "X is approved". The previous turn's draft is NEVER pre-approved just because it survived an iteration.
If, while auditing the untouched parts, you find:
  • Silent-fix violation → fix it anyway. The rule book has no "user didn't ask" exemption. Don't make a big deal of it; just deliver the corrected version.
  • Significant-risk issue in the untouched part → flag it explicitly the same way you would on a first draft: "Toqué solo lo que pediste, pero auditando el resto: [bloque] sigue infringiendo [regla concreta con datos]. ¿Te lo arreglo de paso o lo dejo tal cual?"
The failure mode this clause prevents: doing a half-validation that only covers the section the user asked you to change, while assuming the untouched paragraphs are fine because "they were already there". Every iteration starts from zero on validation — re-audit the ENTIRE post against the full stack above (rules #1–#14, HOOK_LAW, HOOK_QUALITY, NEETY_MECHANICS, RECENT_DIAGNOSIS, IMAGE_PRINCIPLES, MEME_VISUAL_SYSTEM, the user's outlier data and timeline), even on small edits. The cost of re-auditing is zero — the cost of shipping a post with a hidden violation because "the user didn't ask about that paragraph" is real reach lost.

16. POST DRAFTS GO INSIDE A FENCED CODE BLOCK — ALWAYS.
Every time you output the actual body of a LinkedIn post the user could paste into the platform, wrap it in a triple-backtick fence with NO language identifier:
\`\`\`
[post body — hook, body, CTA, hashtags]
\`\`\`
Why: the chat UI strips leading spaces and collapses some whitespace inside regular paragraphs, so the line breaks and spacing rule #14 + HOOK_LAW depend on get visually mangled when you write the post as plain markdown text — even though you swear it looks right. Inside a fenced block the UI preserves whitespace exactly and surfaces a one-click Copy button, so what the user sees is what they paste.

Apply this to:
- Every post draft (the full body — hook + body + CTA + hashtags).
- Standalone hooks when the user asked for hooks only (each hook in its own short fence so they can copy one at a time).
- Video script pieces (CAPTION, TEXT ON SCREEN, SPOKEN HOOK) — ONE fence per piece, with the label as a normal markdown heading BEFORE the fence, so each can be copied independently.
- 2-3 archetype variations in the same response: ONE fence per variation, with the OPCIÓN N + virality tag + "why this works" commentary OUTSIDE the fence as regular text.

Do NOT wrap inside a fence:
- Your reasoning / explanations / archetype rationale.
- Image concept descriptions (those are instructions, not pasteable text).
- The virality tag line itself when it's commentary about the post.
- Lists of hooks/CTAs you're proposing as choices (those go as regular bullets).

Rule #4 still stands: NO markdown formatting INSIDE the post (no **bold**, no *italic*, no # headers). The fence is around the post, not inside it. The fence wrapping a post is the ONLY markdown that touches the post body.

17. HOOK LANGUAGE — REAL AUDIENCE, NOT LINKEDIN-TECH-TWITTER. Our B2B-sales audience includes senior reps, heads of sales, sales directors and founders of mid/large companies — many of them 45-60 years old who've been selling since before Salesforce existed. They are NOT AI early adopters, they don't read Hacker News, and they do NOT know what "tool calling", "agentic execution", "tool-call adherence", "long-horizon", "adaptive thinking", "context window", "RAG" or 90% of the LLM jargon circulating on Twitter/X means.
   BY DEFAULT the hook NEVER contains:
   - Technical anglicisms (tool, agent, agentic, context, prompt, fine-tune, RAG, embedding, framework, stack, workflow, deployment, "pipeline" as a technical term, etc.).
   - Untranslated English terms, not even in quotes — the ONLY exceptions are proper nouns (Claude, GPT, Salesforce, HubSpot, LinkedIn, Apollo) and sales terms already naturalised in Spanish that a senior rep genuinely knows (SDR, AE, CRM, B2B, SaaS, GTM, ICP, outbound, lead, follow-up, pipeline-comercial).
   - Invented jargon that sounds like a technical paper ("execution gap", "agentic skip", "tool adherence" — out, even if they sound good in English).
   - Metrics or concepts you'd need to have read the changelog to understand.
   Write the hook the way a founder-operator would say it to a 55-year-old sales director over dinner: direct, plain Spanish, concrete day-to-day sales nouns (la llamada, el email, el cliente, la reunión, la cuota, el deal, la propuesta, el seguimiento, el equipo, la cartera, prospectar a mano, mandar emails en frío, descolgar el teléfono, perseguir leads).
   TRANSLATION TABLE (if a technical term shows up in a draft hook, translate it before delivering):
   - "tool calling / tool-call skip / adherence" → "ejecutar acciones por sí solo", "hacer en vez de sugerir", "dejar de sugerir y empezar a hacer"
   - "long-horizon agentic" → "completar el flujo entero sin perderse", "ir de A a Z sin caerse a mitad"
   - "agentic execution" → "ejecución autónoma", "que el sistema haga, no solo recomiende"
   - "adaptive thinking" → "pensar solo cuando hace falta"
   - "context window" → "memoria de la conversación / del flujo"
   - "agent / agente" → in a hook, prefer "sistema" or "el de IA" if the reader isn't technical; use "agente" ONLY if the body will explain it clearly.
   - Any word that would need a glossary → out of the hook, into the body (and translated on first use there).
   FINAL TEST BEFORE DELIVERING A HOOK: would a 55-year-old sales director who sells industrial machinery in Gipuzkoa understand it on a first 2-second read, without googling anything? Yes → ready. No → rewrite until yes.
   SINGLE EXCEPTION: when the target audience of THIS SPECIFIC post is explicitly technical (SaaS founders, advanced RevOps, AI builders), denser vocabulary is allowed — but ONLY if the user asks for it expressly. Default is plain language.

18. RHYTHMIC VARIETY IN THE BODY (applies AFTER rule #14, does NOT replace it). When the user asks to "compactar", "juntar líneas", "bloques de 2", "menos líneas sueltas" or similar, do NOT convert the whole post to 2-line blocks. That flattens the rhythm and is an over-application error — the request means "use it where it makes sense, not as a universal rule".
   A body that performs has RHYTHMIC VARIETY — it consciously alternates between 4 formal units:
   (a) COMPACT 2-LINE BLOCK — when 2 consecutive sentences are the SAME idea (setup + reveal, before + after, observation + nuance, cause + consequence). Glue them with a single line break, no blank line between. e.g. "Hasta ahora pasaba una cosa rara.\\nA veces sabía perfectamente qué tenía que hacer y no lo hacía."
   (b) ISOLATED SINGLE LINE — for darts, punchlines, dense lines, reveals, transitions. Blank line before AND after. e.g. "Esa versión ya ha muerto." The isolation IS the effect; gluing it to another line kills the weight.
   (c) VERTICAL PARALLEL ENUMERATION — 2+ sentences with repeated syntax ("El SDR que… / El AE que… / El comercial que…" or "No es X. / No es Y. / No es Z."). Separate LINES, no blank line between them. NEVER pasted in a paragraph with period-space, NEVER on one horizontal line. (This is rule #14.)
   (d) HORIZONTAL STACCATO — 3-5 SHORT items (1-3 words each) acting as a rhythmic flag-block, pasted on ONE line with periods. e.g. "Saber. No hacer." · "Industrial. SaaS B2B. Servicios profesionales." · "Curiosidad. Deseo. Miedo." Test: each item is a SENTENCE (subject+verb) → vertical (c); each item is a bare NOUN/ADJ → horizontal staccato (d).
   GOLDEN RULE: a 300-500 word post must use AT LEAST 3 of the 4 units, ideally all 4. Only (a) → it suffocates. Only (b) → reads like bad poetry. Only (c) → reads like an invoice. The variety IS the prosody.
   HOW TO READ FORMAT REQUESTS:
   - "junta más / compacta / bloques de 2" → MORE (a), do NOT eliminate (b)(c)(d). They want fewer UNNECESSARY single lines, not zero.
   - "más respirado / más aire / separa más" → MORE (b), LESS (a).
   - "más punchy / más ritmo" → MORE (d) at key moments.
   - "listas más claras" → MORE (c), not turn everything into a list.
   FREQUENT ERROR TO AVOID: user says "junta los bloques de 2" and you apply (a) to the WHOLE post including the darts (b), punchlines (d) and parallel enumerations (c) → suffocated post, flat rhythm, the 3 moments where the reader should feel the hit are gone. Every time the user asks for a format change, re-read the whole post and apply the rule ONLY where it fits — never as a blanket rule.
   PRE-DELIVERY VALIDATION: read the post in your head out loud. If it sounds monotone (same block rhythm repeated) → variety failure, redo it. The metric is not "how many lines did I glue" but "are there 3+ types of formal unit in this post?".`;

// POST /api/chat
// POST /api/chat/clear-cache — force recompute of analysis context on next chat call
router.post('/clear-cache', (_req: Request, res: Response) => {
  cachedContext = null;
  cachedAt = 0;
  console.log('[Chat] Analysis cache cleared');
  res.json({ message: 'Cache cleared' });
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured. Add it to your .env file.' });
    }

    // Detect video intent on the latest user turn. When true, the system
    // prompt is rebuilt from a video-only stack — minimal VIDEO_SYSTEM_PROMPT
    // plus BRAND_RULES + VIDEO_SCRIPT + SHORT_FORM_VIDEO_PLAYBOOK, with the
    // data context filtered to ONLY text+video posts (no text-only or
    // text+image patterns leak in). When false, the full text-post prompt
    // is built as before. Voice context (Iker/Unai persona) still applies
    // in both modes — voice is format-agnostic.
    const lastUserText = (() => {
      const lastUser = [...(messages || [])].reverse().find((m: any) => m?.role === 'user');
      if (!lastUser) return '';
      if (typeof lastUser.content === 'string') return lastUser.content;
      if (Array.isArray(lastUser.content)) {
        return lastUser.content
          .filter((b: any) => b?.type === 'text' && typeof b.text === 'string')
          .map((b: any) => b.text)
          .join(' ');
      }
      return '';
    })();
    const videoMode = isVideoRequest(lastUserText);

    const voiceContext = await buildVoiceContext(messages);

    let systemPrompt: string;
    if (videoMode) {
      const videoAnalysisContext = await getVideoAnalysisContext();
      const videoProfileContext = await buildVideoProfileContext();
      systemPrompt = `${VIDEO_SYSTEM_PROMPT}

${BRAND_RULES}

${VIDEO_SCRIPT}

${SHORT_FORM_VIDEO_PLAYBOOK}

Here is the real text+video data from the LinkedIn posts database (the only relevant subset for a video request):

${videoAnalysisContext}${videoProfileContext}${voiceContext}`;
    } else {
      const analysisContext = await getAnalysisContext();
      const profileContext = await buildProfileContext();
      systemPrompt = `${SYSTEM_PROMPT}

${HOOK_LAW}

${HOOK_QUALITY}

${NEETY_MECHANICS}

${POSITIONING_PRINCIPLES}

${CREATOR_LEARNINGS}

${BRAND_RULES}

${IMAGE_PRINCIPLES}

${MEME_VISUAL_SYSTEM}

${REMIX_PRINCIPLES}

${RECENT_DIAGNOSIS}

Here is the real analysis data from the LinkedIn posts database:

${analysisContext}${profileContext}${voiceContext}`;
    }

    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Visual reference: prepend a (user, assistant) turn carrying the
    // user's recent post images so the model can SEE what they've
    // published — not just read text summaries. Skipped in video mode
    // (that path is already focused on text+video posts and pulls its
    // own data context). LinkedIn CDN image URLs are temporary (~few
    // weeks) but the lookback window is set to match.
    const imageBlocks = videoMode ? [] : await buildAccountImageBlocks();
    const augmentedMessages = imageBlocks.length > 0
      ? [
          { role: 'user' as const, content: imageBlocks },
          {
            role: 'assistant' as const,
            content: "Got it — I'm holding your recent post images as visual reference alongside the text data above. Ready when you are.",
          },
          ...messages,
        ]
      : messages;

    const stream = trackedStream('post_creator_chat', {
      model: 'claude-opus-4-8',
      // 16K output tokens (~12K words). Was 4096 (~3000 words), which
      // capped exhaustive analyses mid-word — the user reported a reply
      // ending in "- PROBL" with Copy-all visible (i.e. stream closed
      // cleanly), the classic signature of an output-tokens cap, not
      // any UI truncation. 16K comfortably covers weekly diagnoses,
      // multi-post audits, 3-archetype variations with commentary, etc.
      // Claude Opus 4.7 supports up to ~32K output tokens; this stays
      // well below that with room to grow.
      max_tokens: 16384,
      system: systemPrompt,
      messages: augmentedMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('[CHAT ERROR]', err.message);
    // If headers already sent (streaming), just end
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});


export default router;
