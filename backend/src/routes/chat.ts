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
      model: 'claude-sonnet-4-6',
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

// POST /api/chat/improve — single iteration: rewrites post + generates self-critique
// Body: { messages: [{role, content}][] }
// Response: { text: string, critique: string, raw: string }
router.post('/improve', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured.' });
    }

    const client = new Anthropic({ apiKey });
    const profileContext = await buildProfileContext();

    // Each check: what the scorer regex looks for, EXACTLY what text to write to pass it
    const CHECKLIST_REFERENCE = `
=== OUTLIER CHECKLIST — exact scoring rules ===
The scorer uses regex patterns. A check only passes if the post contains the EXACT words/characters listed.
Writing similar-but-different text (e.g. "incorrecto" instead of "wrong") will NOT pass the check.

── HOOK (25%) ─────────────────────────────────────────────────────────
hook-numeric [weight 18%]
  Scorer looks for: a number (\d+) followed by %, k, m, x, €, $, h, hr, min, days, años, meses, or a standalone integer — IN THE FIRST LINE
  To pass: write in the first line one of → "3x", "47%", "$20K", "10 horas", "en 5 días", "200 clientes"
  Common fail: "muchos", "varios", "gran" → NO number → fails

hook-contrarian [weight 18%]
  Scorer looks for IN THE FIRST LINE: nobody | no one | nadie | stop | deja de | forget | olvida | wrong | mal | lie | mentira | truth | verdad | actually | en realidad | dead | muerto | killed | mató | obsolet
  To pass: use ONE of those exact words in the hook line, e.g. "nadie te habla de esto", "stop making this mistake", "wrong approach"
  Common fail: "incorrecto", "equivocado", "anticuado" → not in the list → fails

hook-curiosity-gap [weight 15%]
  Scorer looks for IN THE FIRST LINE: secret | secreto | nobody knows | nadie sabe | the real | la verdadera | what they don | lo que no | here's why | aquí está | the reason | la razón
  To pass: write "aquí está la razón", "here's why", "lo que no te dicen", "the real problem"
  Common fail: "te cuento algo" → not in the list → fails

hook-not-x-but-y [weight 12%]
  Scorer looks for: "not <word(s)> ... but" (English) OR "no es <word(s)> ... sino" (Spanish) — in the hook
  To pass (ES): "No es sobre velocidad, sino sobre claridad" / "No es un problema de tools, sino de sistema"
  To pass (EN): "Not about speed, but about clarity" / "Not the tool, but the process"
  Common fail: "no es X. Es Y" → no "sino" → fails

hook-short [weight 15%]
  Scorer looks for: first line has ≤ 18 words
  To pass: count every word in the first line; cut until ≤ 18 words

hook-speed-claim [weight 12%]
  Scorer looks for: in \d+ | en \d+ | 60 seconds | segundos | minutes | minutos | hours | horas | saves | ahorra | quick | rápido | instant | instantáneo
  To pass: write "en 30 minutos", "saves 10 hours/week", "en 60 segundos", "ahorra 3 horas al día"

hook-tension [weight 10%]
  Scorer looks for: hook line ENDS WITH ":" or "—" or "..." or 👇 or 👉 — OR contains "this is why | por eso | here is how | aquí está"
  To pass: simplest fix → end the first line with a colon ":" or "👇"
  Example: "Nadie te habla de esto en outbound:"

── STRUCTURE (20%) ────────────────────────────────────────────────────
struct-numbered [weight 20%]
  Scorer looks for: ≥ 3 lines that start with a digit + "." or ")"
  To pass: add "1. …\n2. …\n3. …" anywhere in the body (at minimum 3 items)

struct-data [weight 20%]
  Scorer looks for: ≥ 2 occurrences of number+% | number+k | number+m | number+x | number+€ | $+number — in the body
  To pass: include at least two of: "47%", "$12K", "3x", "200€" — in the body (not only the hook)

struct-length [weight 20%]
  Scorer looks for: 80 ≤ word count ≤ 400
  To pass: count all words; expand if < 80, trim if > 400

struct-open-loop [weight 15%]
  Scorer looks for: here's what | esto es lo que | the result | el resultado | what happened | lo que pasó | then | entonces | but then | pero luego
  To pass: write "El resultado fue…" or "Pero luego…" or "Then I realized…" — before you deliver the payoff

struct-no-dense [weight 15%]
  Scorer looks for: every paragraph (text between \n\n) has ≤ 3 lines inside
  To pass: insert a blank line after every 2–3 lines of continuous text

struct-framework [weight 10%]
  Scorer looks for: step \d | paso \d | before | después | antes | after | phase | fase | stage | framework | playbook
  To pass: write "Paso 1", "Step 1", "before → after", "el framework", "playbook"

── EMOTION (18%) ──────────────────────────────────────────────────────
emo-fomo [weight 22%]
  Scorer looks for: before | antes | missed | perdido | too late | tarde | only | solo | last chance | última | everyone | todos
  To pass: write "before everyone else", "antes de que sea tarde", "todos lo están usando ya", "solo este mes"

emo-greed [weight 20%]
  Scorer looks for: $\d | \d+k | \d+€ | revenue | ingresos | profit | beneficio | mrr | arr | deals | clients | clientes | sales | ventas
  To pass: mention "$5K", "12k€", "revenue", "clientes", "ventas" — any of these

emo-controversy [weight 18%]
  Scorer looks for: unpopular | controvers | hot take | hot-take | polémic | disagree | en desacuerdo | wrong | mal | overrated | sobrevalorado
  To pass: write "Unpopular opinion:" or "hot take:" or "overrated" or "en desacuerdo con"
  Note: "wrong" and "mal" also pass hook-contrarian — use them in the hook to pass both

emo-insider [weight 20%]
  Scorer looks for: behind the scenes | detrás | insider | what they don | lo que no te cuentan | the truth about | la verdad sobre
  To pass: write "lo que no te cuentan", "behind the scenes", "la verdad sobre esto"

emo-personal-proof [weight 20%]
  Scorer looks for: I built | I tested | I ran | I tried | I made | I shipped | I spent | I lost | I earned | yo he | construí | probé | hice | gané | perdí
  To pass: use one of these exact verbs — "I tested this for 30 days", "lo probé durante 3 semanas", "yo lo construí"
  Common fail: "lo he visto funcionar" → "visto" not in list → fails

── FORMAT (15%) ───────────────────────────────────────────────────────
fmt-no-links [weight 30%]
  Scorer looks for: absence of "http://" or "https://"
  To pass: remove all URLs from the post body

fmt-spacing [weight 25%]
  Scorer looks for: at least one \n\n (blank line) in the post
  To pass: add an empty line between at least two paragraphs

fmt-emoji-markers [weight 20%]
  Scorer looks for: → or ↳ or ▶ or 👉 or 👇 or ✅ or ❌ or 🔥 or 💡 or • or · or ▪ or a line starting with "- " or "* "
  To pass: add at least one "→" before a list item, or "👇" at the end of the hook

fmt-first-line-hook [weight 15%]
  Scorer looks for: first line between 20 and 140 characters
  To pass: count chars in line 1; if < 20 expand, if > 140 cut at a natural break

fmt-coherent [weight 10%]
  Scorer looks for: ≤ 2 words of 5+ consecutive capitals AND ≤ 8 emojis total
  To pass: remove extra ALL-CAPS words and trim emojis to 8 max

── CTA (12%) ──────────────────────────────────────────────────────────
cta-comment-gate [weight 30%]
  Scorer looks for: ("comment" OR "comenta" OR "reply" OR "responde" OR "drop" OR "deja") + within 40 chars + ("below" OR "abajo" OR "get" OR "receive" OR "recibe" OR "send" OR "envío" OR "dm")
  To pass: write "Comenta 'GUÍA' abajo y te la mando" or "Comment 'YES' below and I'll send it"

cta-at-end [weight 25%]
  Scorer looks for in the LAST 200 chars: comment | follow | share | save | what do you | qué opinas | your thoughts | tu opinión | let me know | dime
  To pass: put "¿Qué opinas tú?" or "Let me know in the comments" as the last line

cta-question [weight 25%]
  Scorer looks for: post ends with "?" (up to 2 trailing newlines allowed)
  To pass: make the very last non-empty line a question ending in "?"

cta-no-link-cta [weight 20%]
  Scorer looks for ABSENCE of: click | haz clic | link in bio | enlace en bio | check out | visit
  To pass: remove any of those phrases

── TOPIC FIT (10%) ────────────────────────────────────────────────────
topic-sector [weight 35%]
  Scorer looks for: ai | ia | llm | agent | sdr | outbound | lead gen | prospecting | revenue | sales | ventas | marketing | growth | startup | b2b | saas
  To pass: include at least one of those words (case-insensitive)

topic-tools [weight 25%]
  Scorer looks for: claude | gpt | openai | anthropic | clay | apollo | hubspot | salesforce | linkedin | notion | zapier | n8n | make
  To pass: name at least one specific tool verbatim

topic-fresh [weight 25%]
  Scorer looks for: just | acabo | yesterday | ayer | this week | esta semana | new | nuevo | launched | lanzó | released | 2025 | 2026
  To pass: write "acabo de", "esta semana", "just tested", "2025"

topic-hashtags [weight 15%]
  Scorer looks for: count of #word ≤ 3
  To pass: if > 3 hashtags, remove the extras
=== END CHECKLIST ===`;

    const system = `You are a LinkedIn post optimizer. Your role is STRUCTURAL improvement only — you are NOT a ghostwriter.

WHAT YOU DO: take the author's existing post and improve its formatting, hook sharpness, paragraph spacing, CTA placement, and virality mechanics — without changing the topic, the core idea, the specific examples, the data points, or the narrative.

WHAT YOU NEVER DO:
- Change the topic or main message
- Introduce new ideas, stories, arguments, or examples not already in the post
- Remove or replace specific data, results, or anecdotes the author mentions
- Translate proper nouns, brand names, company names, city names, or industry terms ("Silicon Valley", "Claude", "HubSpot", "SDR", "outbound" stay as-is)
- Change the language (Spanish stays Spanish, English stays English)

Think of it as a film editor, not a screenwriter: you cut, reorder, sharpen, and pace — but the scenes (ideas) stay the same.

${CHECKLIST_REFERENCE}

RESPONSE FORMAT — always use exactly this structure (no other text):
CRITIQUE: [2-4 sentences: which specific checks you addressed, what technique you used for each, and what you predict still needs work]
---
[The structurally improved post — same ideas, better execution]

Additional rules:
- A rewrite that fixes 1 failing check but breaks 2 passing checks is a NET LOSS — do not do it
- For each failing check, apply the exact technique described in the checklist reference above
- If a failing check persisted from a previous iteration, try a DIFFERENT technique from the ones you already attempted
- Read your previous CRITIQUE and build on it${profileContext}`;

    const result = await client.messages.create({
      model: 'claude-sonnet-4-6',
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

    res.json({ text: postText, critique, raw });
  } catch (err: any) {
    console.error('[IMPROVE ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
