import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { PostModel } from '../models/post';
import { CreatorModel } from '../models/creator';
import { getCrossCreatorPatterns } from '../services/patterns';
import { CreatorProfileModel } from '../models/creatorProfile';

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

async function buildProfileContext(): Promise<string> {
  const profile = await CreatorProfileModel.get();
  if (!profile) return '';

  const lines: string[] = [];
  lines.push('\n\n=== USER PROFILE (who is writing the post) ===');
  if (profile.name) lines.push(`Name: ${profile.name}`);
  if (profile.headline) lines.push(`Headline: ${profile.headline}`);
  if (profile.followers_count) lines.push(`Followers: ${profile.followers_count}`);
  if (profile.company) lines.push(`Company: ${profile.company}`);
  if (profile.product) lines.push(`Product: ${profile.product}`);
  if (profile.positioning) lines.push(`Positioning / What they want to stand for: ${profile.positioning}`);
  if (profile.tone_style) lines.push(`Tone & style preference: ${profile.tone_style}`);

  if (profile.my_posts && profile.my_posts.length > 0) {
    lines.push('');
    lines.push(`--- Top ${Math.min(profile.my_posts.length, 10)} posts by this user (for voice/style reference) ---`);
    for (const p of profile.my_posts.slice(0, 10)) {
      lines.push(`\n[${p.likes_count} likes, ${p.comments_count} comments, ${p.reposts_count} reposts]`);
      lines.push(p.content_text.substring(0, 600));
      lines.push('---');
    }
  }

  lines.push('');
  lines.push('CRITICAL: When writing posts for this user, match their voice and style based on their top posts above. Incorporate their company, product, and positioning naturally. Use the viral patterns from the analysis data but adapt them to THIS user\'s authentic voice — not generic.');
  return lines.join('\n');
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

IMPORTANT: Keep posts authentic and natural. Don't over-optimize — the best outliers feel genuine, not formulaic.`;

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

    const client = new Anthropic({ apiKey });
    const analysisContext = await getAnalysisContext();
    const profileContext = await buildProfileContext();

    const systemPrompt = `${SYSTEM_PROMPT}\n\nHere is the real analysis data from the LinkedIn posts database:\n\n${analysisContext}${profileContext}`;

    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await client.messages.stream({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
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

// ---- Pillar-based outlier sampling ----
// Classifies an outlier text into its dominant pillar so the /improve prompt
// can show real examples grouped by pillar (curiosity / fear / desire) instead
// of defaulting to repetitive formulas like "Comenta 'GUÍA' abajo".
function classifyPillar(text: string): 'curiosity' | 'fear' | 'desire' | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  const curiosity =
    (/\b(secret|secreto|nobody knows|nadie sabe|the real|la verdadera|what they don'?t|lo que no|here'?s why|aquí está|the reason|la razón|plot twist|behind the scenes|detrás de|insider|la verdad sobre|the truth about|unpopular|hot take|overrated|sobrevalorado)\b/i.test(lower) ? 1 : 0) +
    (/\bnot\s+\w+[^.\n]{0,60}\bbut\s+|\bno es\s+\w+[^.\n]{0,60}\bsino\s+/i.test(text) ? 1 : 0) +
    (/\b(nadie|nobody|no one|stop|deja de|forget|olvida|wrong|lie|mentira|actually|en realidad)\b/i.test(lower) ? 1 : 0);
  const fear =
    (/\b(before|antes|missed|perdido|too late|tarde|only|solo|last chance|última)\b/i.test(lower) ? 1 : 0) +
    (/\b(dead|muerto|killed|mató|obsolet|dying|replaced|reemplazado)\b/i.test(lower) ? 1 : 0) +
    (/\b(everyone|todos|everybody)\b[^.\n]{0,60}\b(uses?|usan|doing|haciendo|adopted|adoptar|tienen|migrating)\b/i.test(lower) ? 1 : 0) +
    (/\b(left behind|quedarse (fuera|atrás)|fall behind|get replaced|perderás|big mistake|grave error)\b/i.test(lower) ? 1 : 0);
  const desire =
    (/(\$\s?\d|\b\d+\s?k\b|\d+\s?€|revenue|ingresos|profit|beneficio|\bmrr\b|\barr\b|ventas|\bsales\b)/i.test(lower) ? 1 : 0) +
    (/\b(i\s+(built|tested|ran|tried|made|shipped|spent|earned|created|launched|scaled|grew)|yo\s+(he|construí|probé|hice|gané|creé|lancé|escalé))\b/i.test(lower) ? 1 : 0) +
    (/\b(in\s+\d+|en\s+\d+|saves?\b|ahorra|saved|ahorré|quick|rápido|instant|60\s?(seconds?|segundos?))\b/i.test(lower) ? 1 : 0) +
    (/\b(framework|playbook|blueprint|system|sistema|stack|método|method|formula|fórmula)\b/i.test(lower) ? 1 : 0);
  const scores: [string, number][] = [['curiosity', curiosity], ['fear', fear], ['desire', desire]];
  scores.sort((a, b) => b[1] - a[1]);
  if (scores[0][1] === 0 || scores[0][1] === scores[1][1]) return null;
  return scores[0][0] as 'curiosity' | 'fear' | 'desire';
}

async function buildPillarExamples(targetPillar: 'curiosity' | 'fear' | 'desire' | null): Promise<string> {
  try {
    const creators = await CreatorModel.findAll();
    let allPosts: any[] = [];
    for (const c of creators) {
      const posts = await PostModel.findByCreator(c.id, { limit: 2000 });
      allPosts = allPosts.concat(posts);
    }
    const outliers = allPosts
      .filter((p) => p.is_outlier && p.content_text && p.content_text.length > 60)
      .sort((a, b) => (b.outlier_ratio || 0) - (a.outlier_ratio || 0));

    const byPillar: Record<string, any[]> = { curiosity: [], fear: [], desire: [] };
    for (const p of outliers) {
      const pillar = classifyPillar(p.content_text || '');
      if (pillar) byPillar[pillar].push(p);
    }

    const lines: string[] = [];
    lines.push('\n\n=== REAL OUTLIER EXAMPLES FROM THE DATABASE (grouped by pillar) ===');
    lines.push('Use these as inspiration for HOOKS, CTAs, and language variety. Do NOT copy verbatim — extract the mechanism.\n');

    const order: ('curiosity' | 'fear' | 'desire')[] = targetPillar
      ? [targetPillar, ...(['curiosity', 'fear', 'desire'] as const).filter((p) => p !== targetPillar)]
      : ['curiosity', 'fear', 'desire'];

    for (const pillar of order) {
      const samples = byPillar[pillar].slice(0, pillar === targetPillar ? 8 : 3);
      if (samples.length === 0) continue;
      lines.push(`--- ${pillar.toUpperCase()} outliers ---`);
      for (const p of samples) {
        const hook = (p.hook_text || p.content_text || '').substring(0, 140).replace(/\n/g, ' ');
        const closing = (p.content_text || '').trim().split('\n').filter(Boolean).slice(-2).join(' | ').substring(0, 140);
        lines.push(`  [${(p.outlier_ratio || 0).toFixed(1)}x] Hook: "${hook}"`);
        if (closing && closing !== hook) lines.push(`         Closing: "${closing}"`);
      }
      lines.push('');
    }
    return lines.join('\n');
  } catch (err) {
    console.error('[buildPillarExamples] error:', err);
    return '';
  }
}

// POST /api/chat/improve — single iteration: rewrites post + generates self-critique
// Body: { messages: [{role, content}][], pillar?: 'curiosity'|'fear'|'desire', pillarIntensity?: number }
// Response: { text: string, critique: string, raw: string }
router.post('/improve', async (req: Request, res: Response) => {
  try {
    const { messages, pillar, pillarIntensity } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured.' });
    }

    const targetPillar: 'curiosity' | 'fear' | 'desire' | null =
      pillar === 'curiosity' || pillar === 'fear' || pillar === 'desire' ? pillar : null;

    const client = new Anthropic({ apiKey });
    const profileContext = await buildProfileContext();
    const pillarExamples = await buildPillarExamples(targetPillar);

    const PILLAR_DIRECTIVE = targetPillar
      ? `
=== PILLAR FOCUS — NON-NEGOTIABLE ===
This post targets ONE psychological pillar: **${targetPillar.toUpperCase()}** (current intensity: ${typeof pillarIntensity === 'number' ? Math.round(pillarIntensity * 100) : '?'}%).

A viral post maxes out ONE pillar — it does NOT tick boxes across all three. Your job is to INTENSIFY ${targetPillar}, not add fear/desire/curiosity triggers unrelated to it.

${targetPillar === 'curiosity' ? `CURIOSITY levers you can deploy (pick 2–3, not all):
- Curiosity gap: "la razón real es…", "lo que nadie te cuenta sobre X", "the real reason"
- Reversal: "No es sobre X, sino Y" / "Not about X, but Y"
- Contrarian: "Nadie te habla de…", "Stop doing X", "La verdad sobre Y"
- Insider: "Behind the scenes de cómo…", "lo que no te cuentan"
- Open loop: hook ends with ":" "..." "👇" that promises resolution later` : ''}
${targetPillar === 'fear' ? `FEAR / FOMO levers (pick 2–3):
- Obsolescence: "X ha muerto", "Y is dead", "es obsoleto"
- Bandwagon: "Todos están migrando a…", "Everyone is already using…"
- Left-behind: "No te quedes fuera", "don't get replaced"
- Stakes: "Te va a costar X", "the mistake that costs founders $Y"
- Urgency: "antes de que sea tarde", "right now", "esta semana"` : ''}
${targetPillar === 'desire' ? `DESIRE levers (pick 2–3):
- Money proof: "$20K MRR", "12k€ en ventas", concrete numbers
- Personal proof: "Lo construí en un weekend", "I tested this for 30 days"
- Speed: "en 30 minutos", "ahorra 10 horas/semana"
- Named system: "mi playbook", "the 3-step framework"
- Numbered method: "5 formas de…", "the 3 steps to…"` : ''}

Do NOT add triggers from the other two pillars — they dilute the message.
`
      : `
=== NO DOMINANT PILLAR YET ===
The post doesn't fire any pillar clearly. Pick the ONE most aligned with the post's message (curiosity / fear / desire) and commit to it. Do NOT spread across all three.
`;

    const ANTI_FORMULA_RULES = `
=== AVOID DEFAULTING TO THESE FORMULAS ===
Variety matters. Do NOT default to these overused templates — they're burned out from being applied to every post:
- "Comenta 'GUÍA' abajo y te la mando" / "Comment 'YES' below and I'll send it" — see lead-magnet exception below
- "Nadie te dice esto, pero…" as an opener (unless it's genuinely central to the post)
- "Aquí está la razón:" / "Here's why:" as the only hook ending
- "Me ha costado X años aprender esto"
- "Este es el error más grande que…"

LEAD-MAGNET EXCEPTION: the "Comenta 'X' abajo y te lo mando" CTA is a legitimately strong outlier format WHEN the post is genuinely offering a concrete resource (PDF, guide, template, video, dataset, framework doc) the reader actually wants. In that case, use it — that's its job. The rule is: don't slap it on every post; do use it when the post is actually a resource giveaway.

Instead of leaning on burned formulas, draw CTAs and hooks from the real outlier examples below. Rotate techniques across iterations — if you used a curiosity gap last time, try a reversal or insider frame this time.

CTA variety options (pick ONE that fits the post's tone, not a formula):
- A real opinion-forcing question tied to the topic
- An invitation to share a specific experience ("¿Cuál ha sido tu caso?")
- A short provocation that takes a side
- A direct "Disagree?" / "Change my mind"
- A conditional — "If you're doing X, try Y this week and tell me how it went"
- The "Comenta 'X' y te lo mando" CTA — only when the post is actually offering a resource
- No explicit CTA at all (some outliers close with a strong claim, not a question)
`;

    // Reference for the structural (craft) checks only — emotional triggers live in the pillar layer
    const CHECKLIST_REFERENCE = `
=== STRUCTURAL (CRAFT) CHECKLIST — regex-based scoring ===
Only the HOOK, STRUCTURE, FORMAT, CTA and TOPIC categories are scored as craft.
The EMOTIONAL side (curiosity / fear / desire triggers) is measured by the PILLAR layer above — do NOT treat pillar triggers as generic checkboxes.

── HOOK (30%) ─────────────────────────────────────────────────────────
hook-numeric: a concrete number in the first line (3x, 47%, $20K, 10 horas, 5 días).
hook-short: first line ≤ 18 words.
hook-tension: first line ends with ":", "—", "...", "👇" or "👉" — an open loop.
hook-first-line-length: first line between 20 and 140 characters.
hook-specificity: hook names a specific tool / industry / proper noun (Claude, HubSpot, SDR, SaaS…).

── STRUCTURE (25%) ────────────────────────────────────────────────────
struct-numbered: at least 3 lines starting with "1.", "2.", "3." (or similar).
struct-data: at least 2 metrics in the body (47%, $12K, 3x, 200€).
struct-length: 80–400 words total.
struct-open-loop: body contains "el resultado", "pero luego", "then", "what happened" before the payoff.
struct-no-dense: every paragraph ≤ 3 lines (add blank lines).

── FORMAT (18%) ───────────────────────────────────────────────────────
fmt-no-links: NO "http://" or "https://" in the post body.
fmt-spacing: at least one blank line between paragraphs. List items in the same sequence (numbered, bulleted, arrows) are NOT paragraphs — they go in a single tight block with NO blank line between items. The blank line wraps the list as a whole, not its rows.
fmt-list-block: any sequence of 2+ numbered items (1. 2. 3.), bullets (- • ✅ ❌) or arrows (→ ↳ ▶ 👉 👇) MUST be a contiguous block (one item per line, no blank lines between items). A list that puts a blank line between every item FAILS this check and gets a deduction.
fmt-emoji-markers: at least one visual anchor (→ ↳ ▶ 👉 👇 ✅ ❌ 🔥 💡 • or "- " bullet).
fmt-coherent: ≤ 2 ALL-CAPS words of 5+ chars AND ≤ 8 emojis total.
fmt-scannable: 2+ short lines (≤ 40 chars) to break rhythm.

── CTA (15%) ──────────────────────────────────────────────────────────
cta-at-end: last 200 chars contain one of: comment, follow, share, save, qué opinas, tu opinión, let me know, dime, agree, disagree.
cta-question: the post ends with "?".
cta-no-link-cta: NO "click", "haz clic", "link in bio", "check out", "visit".
cta-natural: the "Comenta 'X' abajo y te la mando" / "Comment 'X' below and I'll send it" CTA is only allowed when the post is actually offering a concrete resource (PDF, guide, template, dataset, video). In that lead-magnet context it counts as natural and is NOT penalized. On any other post (opinion, story, framework recap with no deliverable) the formula reads as filler and IS penalized.

── TOPIC FIT (12%) ────────────────────────────────────────────────────
topic-sector: on-niche keywords (ai, llm, agent, sdr, outbound, sales, ventas, b2b, saas, growth…).
topic-tools: names a specific tool (Claude, GPT, Clay, Apollo, HubSpot, n8n, Make…).
topic-fresh: reference to something recent (just, this week, esta semana, current year).
topic-hashtags: 0–3 hashtags max.
=== END CHECKLIST ===`;

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const currentYear = today.getUTCFullYear();

    const system = `You are a LinkedIn post optimizer. Your role is STRUCTURAL + PILLAR improvement — you are NOT a ghostwriter.

TODAY'S DATE: ${todayStr}. The current year is ${currentYear}. If you introduce or keep a year reference, it must be ${currentYear} — never drop the author into an earlier year as if it were now.

WHAT YOU DO: take the author's existing post and sharpen the hook, tighten the spacing, intensify the ONE psychological pillar that the post is already firing, and swap weak CTAs for natural ones — without changing the topic, core idea, specific examples, or data points.

WHAT YOU NEVER DO:
- Change the topic or main message
- Introduce new ideas, stories, arguments, or examples not already in the post
- Remove or replace specific data, results, or anecdotes the author mentions
- Translate proper nouns, brand names, company names, city names, or industry terms (Silicon Valley, Claude, HubSpot, SDR, outbound stay as-is)
- Change the language (Spanish stays Spanish, English stays English)
- Try to hit EVERY checklist item — a post that fires ONE pillar at 80%+ beats a post that softly hits all three
- Use markdown formatting inside the post: no **bold**, no *italic*, no \`code\`, no # headers. LinkedIn renders none of that — asterisks show up literally. Express emphasis with line breaks, 1–2 ALL-CAPS words, or punctuation.
- Criticise, mock, or speak negatively about any other company, brand or competitor by name. If the original post does this, soften it: keep the lesson but reframe the named company in a positive or neutral-respectful light. Reposts are the highest-leverage LinkedIn metric and a criticised company won't repost — the trade is not worth it. If a contrast is needed, swap the named brand for a generic pattern ("most CRMs", "the average outbound playbook").

AUDIENCE CONTEXT:
- Neety's ICP is medium/large INDUSTRIAL companies that export and B2B SERVICE companies. When you have latitude on examples, framing or pain points, default to those segments. Do not change a post's topic to fit them — only nudge framing where it's already flexible.

LIST FORMATTING (must-fix when present):
- When the post contains a sequence of numbered items (1. 2. 3.), bullets (- • ✅ ❌) or arrows (→ ↳ ▶ 👉 👇), the items MUST be a contiguous block — one item per line, no blank lines between items. The blank line goes before and after the whole list, never inside it. If the original post has a blank line between every list item, COLLAPSE it: that's a near-zero-cost rewrite that materially improves rhythm and matches how outliers format their lists.

CREATOR LEARNINGS (from 2 weeks of real publishing on this account — bias your scoring AND your edits towards this):
- Top performers (e.g. 20x outliers) had: insight + hidden-system + contrarian framing — they showed how something actually works behind the scenes and broke a commonly held belief in the first 1–3 lines, mixing concrete data with narrative. When the original post is already doing this, intensify it. When it isn't, surface the hidden-system angle if the raw material allows.
- Acceptable but weaker: pure provocation + universal-problem framing. It drives comments but a lower repost rate. Don't downgrade a post FROM the "insight + hidden-system" register TO this register.
- Underperformers we need to avoid producing: generic posts that anyone in the niche could publish, AI-news recaps without the author's own framing, opinions with no proof (no number, no specific anecdote), and personal posts (birthday/gratitude/milestone) without a sharp lesson.
- The win/lose test: a post WINS when it (a) explains how a system actually works AND (b) breaks a commonly held belief. A post LOSES when swapping the author name wouldn't change the content's credibility — it then reads as ghostwritten and gets no reposts.

Think of it as a film editor, not a screenwriter: you cut, reorder, sharpen, and pace — but the scenes (ideas) stay the same.

${PILLAR_DIRECTIVE}

${ANTI_FORMULA_RULES}

${CHECKLIST_REFERENCE}

${pillarExamples}

RESPONSE FORMAT — always use exactly this structure (no other text):
CRITIQUE: [2-4 sentences: (1) which pillar you intensified and how, (2) which structural checks you fixed, (3) what technique you chose from the outlier examples and WHY it fits this post, (4) what still needs work]
---
[The improved post — same ideas, sharper execution, ONE pillar maxed]

Additional rules:
- A rewrite that fixes 1 failing craft check but breaks 2 passing ones is a NET LOSS — do not do it
- NEVER add pillar triggers for a pillar other than the dominant one — that dilutes the post
- NEVER recycle the same CTA formula across iterations — rotate: question, provocation, conditional, no-CTA
- If you used a specific technique last iteration, try a DIFFERENT one from the outlier examples
- Read your previous CRITIQUE and build on it, don't repeat${profileContext}`;

    const result = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      system,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
    });

    const block = result.content[0];
    const raw = block && block.type === 'text' ? block.text.trim() : '';

    // Parse CRITIQUE / --- / POST split
    const sepIdx = raw.indexOf('\n---\n');
    let critique = '';
    let postText = raw;

    if (sepIdx !== -1) {
      const beforeSep = raw.slice(0, sepIdx).trim();
      postText = raw.slice(sepIdx + 5).trim();
      // Extract critique value (after "CRITIQUE:" prefix if present)
      critique = beforeSep.replace(/^CRITIQUE:\s*/i, '').trim();
    }

    // Strip markdown fences or surrounding quotes from post text
    postText = postText.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
    if ((postText.startsWith('"') && postText.endsWith('"')) ||
        (postText.startsWith('\u201C') && postText.endsWith('\u201D'))) {
      postText = postText.slice(1, -1).trim();
    }
    // LinkedIn doesn't render markdown — defend at the boundary in case the
    // model slips **bold** / *italic* / `code` past the prompt rules.
    postText = postText
      .replace(/\*\*([^*\n]+?)\*\*/g, '$1')
      .replace(/(^|[\s(])\*([^*\n]+?)\*(?=[\s).,!?]|$)/g, '$1$2')
      .replace(/`([^`\n]+?)`/g, '$1');

    res.json({ text: postText, critique, raw });
  } catch (err: any) {
    console.error('[IMPROVE ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
