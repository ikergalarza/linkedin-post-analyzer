import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { PostModel } from '../models/post';
import { CreatorModel } from '../models/creator';
import { getCrossCreatorPatterns } from '../services/patterns';
import { CreatorProfileModel } from '../models/creatorProfile';
import pool from '../db';
import { ensureSingleLineHook } from '../utils/sanitizeText';

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
    const { messages, pillar, pillarIntensity, leadMagnet, currentArchetype, targetArchetype } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured.' });
    }

    const targetPillar: 'curiosity' | 'fear' | 'desire' | null =
      pillar === 'curiosity' || pillar === 'fear' || pillar === 'desire' ? pillar : null;
    // Explicit user signal that this post IS a lead magnet — overrides
    // the model's heuristic, which sometimes mis-classifies and strips
    // the "Comenta X y te lo mando" ask. When true, the lead-magnet CTA
    // becomes a hard requirement of the rewrite.
    const isLeadMagnet: boolean = leadMagnet === true;

    const client = new Anthropic({ apiKey });
    const profileContext = await buildProfileContext();
    const pillarExamples = await buildPillarExamples(targetPillar);

    // Archetype leaderboard — same data the Post Creator uses to pick which
    // (hook_type, post_structure) pairs to write into. We pass the top 8 so
    // the rewriter knows which combinations are actually hitting outlier
    // territory in our data and can bias its rewrite toward them rather than
    // formatting heuristics.
    let archetypeBlock = '';
    try {
      const { rows: archetypes } = await pool.query(`
        SELECT
          p.hook_type,
          p.post_structure,
          AVG(p.outlier_ratio)::float AS avg_ratio,
          COUNT(*)::int AS sample_count
        FROM posts p
        WHERE p.is_outlier = TRUE
          AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
          AND p.hook_type IS NOT NULL AND p.hook_type != 'other'
          AND p.post_structure IS NOT NULL AND p.post_structure != 'other'
        GROUP BY p.hook_type, p.post_structure
        HAVING COUNT(*) >= 2
        ORDER BY avg_ratio DESC
        LIMIT 8
      `);
      if (archetypes.length > 0) {
        archetypeBlock = `\n\nARCHETYPE LEADERBOARD (top performers in OUR data — bias your rewrite toward one of these (hook_type, post_structure) combinations when the original's content allows it):
${archetypes.map((a: any, i: number) => `${i + 1}. ${a.hook_type} + ${a.post_structure} → ${(+a.avg_ratio).toFixed(1)}x avg outlier ratio (${a.sample_count} samples)`).join('\n')}

When you score and rewrite the post, treat these archetypes as the gravity well. A post that lands in the top 3 is structurally aligned with what works for this account; a post whose hook_type/post_structure pair isn't in this list (especially "other" or any combo not above) is fighting the data and should be nudged toward one of these — provided the original idea genuinely supports it.`;
      }
    } catch (err) {
      console.warn('[improve] archetype leaderboard query failed, continuing without it:', (err as Error).message);
    }

    // Specific archetype targeting — same level of grounding the Post Creator
    // gets. The frontend classifies the current draft and picks a target
    // archetype (intensify if already top-3, else closest stronger combo).
    // We embed both + a real example post so the rewriter has a concrete
    // model to imitate, not just a leaderboard.
    let archetypeTargetingBlock = '';
    if (currentArchetype || targetArchetype) {
      const lines: string[] = ['\n\nARCHETYPE TARGETING (use this as the structural compass for the rewrite):'];
      if (currentArchetype) {
        const ratioStr = currentArchetype.avg_ratio != null ? ` · ${(+currentArchetype.avg_ratio).toFixed(1)}x avg` : ' · not in leaderboard';
        lines.push(`- Current archetype: ${currentArchetype.hook_type} + ${currentArchetype.post_structure}${ratioStr}`);
      }
      if (targetArchetype) {
        lines.push(`- Target archetype: ${targetArchetype.hook_type} + ${targetArchetype.post_structure} · ${(+targetArchetype.avg_ratio).toFixed(1)}x avg`);
        if (targetArchetype.example_hook) {
          lines.push(`  - Example hook in this archetype: "${String(targetArchetype.example_hook).slice(0, 200)}"`);
        }
        if (targetArchetype.example_text) {
          lines.push(`  - Example post in this archetype (use as structural model — DO NOT copy content):\n---\n${String(targetArchetype.example_text).slice(0, 600)}\n---`);
        }
        if (currentArchetype && targetArchetype.hook_type === currentArchetype.hook_type && targetArchetype.post_structure === currentArchetype.post_structure) {
          lines.push(`- The post is already in the target archetype — INTENSIFY it (sharper hook in this style, tighter structure beats), do NOT switch shape.`);
        } else {
          lines.push(`- Move the post toward the target archetype: open with a "${targetArchetype.hook_type}" hook and follow the "${targetArchetype.post_structure}" structure pattern. Match the rhythm of the example, not its content.`);
        }
      }
      archetypeTargetingBlock = lines.join('\n');
    }

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

── HOOK (top axis — 35% of the BLENDED overall, split between these regex checks and hook_type data fit) ─────────────────────────────────────────────────────────
hook-numeric: a concrete number in the first line (3x, 47%, $20K, 10 horas, 5 días).
hook-short: first line ≤ 18 words.
hook-tension: first line ends with ":", "—", "...", "👇" or "👉" — an open loop.
hook-first-line-length: first line between 20 and 140 characters.
hook-single-line: the hook (everything before the first newline) is ONE physical line — no \\n inside it. A hook split into 2-3 lines will get cut at LinkedIn's "see more" boundary mid-thought.
hook-sector-anchor: the first line references our niche — AI / IA / SDR / outbound / sales / ventas / B2B / SaaS / agent / LLM / pipeline / prospecting / GTM, OR a specific tool (Claude, Clay, Apollo, HubSpot, n8n…). Generic personal-development hooks that any creator in any industry could publish FAIL — they dissolve our positioning.
hook-no-hedging: the hook contains NO hedge words ("quizás", "tal vez", "creo que", "puede que", "un poco", "algo", "bastante", "casi", "más o menos", "maybe", "I think", "kind of", "sort of"). Hedges soften the punch and signal weak conviction; punchy/extreme language wins ("tiré las llaves" > "di las llaves", "rampa de la muerte" > "rampa gigante").

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
cta-single: the closing must contain EXACTLY ONE CTA. A post that stacks two (e.g. a lead-magnet ask AND a final question, or two separate questions both demanding a reply) FAILS this check — multiple closers dilute the call to action and reduce reply rate.

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

HOOK FORMATTING LAW (read this BEFORE editing the first line — it is the single most important rule):

WHY THIS MATTERS:
LinkedIn cuts the post in the feed after roughly 210 characters or the first 2–3 visible lines, with "...ver más" / "...see more". That cut is the ONLY moment you have to earn the click. The 90% mistake is a DOUBLE LINE BREAK right after the first sentence of the hook — the feed then shows only that first sentence as a closed factoid, the reader scrolls past, and the rest of the hook never reaches them.

CONCRETE EXAMPLE (Cataluña — real 7.7x outlier on this account):
  WRONG:
    Cataluña exporta más que Portugal entera.
    [blank line]
    Y casi nadie lo cuenta porque se trabaja en silencio desde hace 80 años 👇
  RIGHT (both sentences in the same block, separated by ". " not by \\n):
    Cataluña exporta más que Portugal entera. Y casi nadie lo cuenta porque se trabaja en silencio desde hace 80 años 👇

THE RULE:
- The hook is ONE block. Can be one sentence or two — but both go in the SAME paragraph (no \\n\\n between them, no \\n inside) and the total must fit in ≤ 210 characters.
- Two short sentences are separated by ". " (period + space), NEVER by \\n or \\n\\n.
- Two-part hook structure that lands: declarative shock first, then a bridge that opens curiosity ("Y casi nadie lo cuenta…", "Pero el motivo real…", "Y aquí está lo que nadie te cuenta…").
- The first \\n\\n in the entire post goes AFTER the hook block. After that, line breaks are fine — use them to give rhythm to the body.

EDITOR-SPECIFIC: if the original post already has the hook split across two lines with a blank between them, your top-priority edit (regardless of anything else) is to COLLAPSE THAT into one block — even if the rest of the post is fine. Hook formatting wins over every other check.

HOOK IS THE HIGHEST-LEVERAGE LINE — DON'T BREAK IT:
- LinkedIn shows only the first ~210 characters above the "see more" cut. Everything past that line is invisible until the reader clicks. If the hook doesn't earn that click, the body never gets read no matter how good it is.
- The score weights this directly: HOOK is 35% of the overall (split between regex craft and how the post's hook_type performs in our outlier data) — heavier than pillar (25%), archetype fit (20%), or body craft (20%). A weaker hook with a stronger body will score WORSE.
- Therefore: only REPLACE the original hook if the new one is unambiguously better — sharper belief-break, stronger curiosity gap, more specific number, less corporate. If you're not sure, KEEP THE ORIGINAL HOOK and only sharpen its rhythm (tighten wording, drop filler, fix punctuation).
- A rewrite that swaps a 7/10 hook for a 6/10 hook destroys the post even if the body went from 6 → 9. Hook regressions are the single most expensive mistake you can make here.
- When the post's classified hook_type isn't a strong outlier pattern (e.g. classified as 'other', or a hook_type that doesn't appear in the leaderboard above), the highest-leverage fix is rewriting the FIRST LINE to match a top hook_type from the leaderboard — that single change can move the score more than fixing the entire body.

HOOK SECTOR ANCHOR (non-negotiable):
- Our niche is B2B sales + AI. The hook MUST reference at least one of: AI / IA / agente / agent / LLM / SDR / outbound / outreach / cold email / prospecting / pipeline / ventas / sales / B2B / SaaS / CRM / GTM / lead gen / closing / discovery / demo, OR a specific tool (Claude, GPT, Clay, Apollo, HubSpot, Salesforce, n8n, Make, Zapier, etc.). A generic personal-development hook ("Hace 5 años pensaba que…") FAILS — it could be ghost-written for any creator in any industry.
- If the original post's hook is generic, REWRITE IT to bring the sector anchor into the first line. The body of the post almost always already references the niche; the fix is to surface that into the hook.

HOOK MUST BE A SINGLE LINE:
- The hook is whatever sits BEFORE the first newline in the post. It must be one continuous line (no soft or hard line breaks inside) and ≤ 140 characters. LinkedIn cuts the feed preview at ~210 chars and visually breaks at \\n; a hook split across multiple lines gets truncated mid-thought and the open loop never reaches the reader. If the original post's hook spans 2-3 lines, COLLAPSE it into one line during the rewrite.

HOOK MUST USE PUNCHY / EXTREME LANGUAGE:
- Whenever the meaning isn't lost, replace neutral words with vivid, physical, or hyperbolic alternatives. Stronger verbs ("tiré las llaves" > "le di las llaves", "destrocé la cuota" > "superé la cuota", "reventé el pipeline" > "llené el pipeline"). Hyperbolic concrete adjectives ("rampa de la muerte" > "rampa gigante", "el error más caro de mi carrera" > "un error grande", "el 80% se está extinguiendo" > "muchos fallan"). Cinematic, not corporate.
- NEVER use hedge words in the hook: "quizás", "tal vez", "creo que", "puede que", "un poco", "algo", "bastante", "casi", "más o menos", "I think", "maybe", "kind of", "sort of". They soften the punch and signal weak conviction. Strip them; commit.
- This rule applies STRICTLY to the hook (first line). The body can use softer language for nuance.

ONE CTA ONLY:
- The post must end with EXACTLY ONE closer: a question, OR a "Comenta 'X' y te lo mando" lead-magnet ask (only when there's a real deliverable), OR no explicit CTA (a strong claim can close). NEVER both. If the original post stacks two (e.g. lead-magnet ask + final question), pick the stronger one and remove the other.
${
  isLeadMagnet
    ? `
LEAD-MAGNET MODE — USER HAS EXPLICITLY MARKED THIS POST AS A LEAD MAGNET:
- The post IS offering a concrete deliverable (PDF, guide, template, dataset, video, framework doc, checklist, file). This is a HARD signal — do not second-guess it.
- The post MUST end with a "Comenta 'X' y te lo mando" / "Escribe 'Y' abajo y te paso Z" CTA. This is the ONLY allowed closer. Do not replace it with a question, provocation, or no-CTA close.
- If the original post already has the lead-magnet ask, KEEP IT verbatim or only sharpen its trigger word for clarity. Do not rewrite it into something softer.
- If the original lacks the ask, ADD ONE — pick a short trigger word in the post's language ("GUÍA", "PLANTILLA", "PDF", "SÍ", "YES", "DAME" — whatever fits the deliverable) and write the ask in 1–2 lines.
- The trigger word should be SPECIFIC to what's offered, not generic. "Comenta 'PLANTILLA' y te paso el doc de outbound de 200 emails" beats "Comenta 'YES' y te lo mando".
- Keep the ask BRIEF — 1–2 lines max. Do NOT pad it with explanation; the body should already justify why the resource is valuable.
`
    : ''
}

SINGLE PILLAR — push it to the max:
- Every post commits to ONE dominant pillar (curiosity / fear / desire) and amplifies it. Light traces of the others are fine, but never actively trigger all three — that dilutes the message. Use the pillar selection logic below to identify the dominant pillar, then maximise it.

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

NEETY VIRAL MECHANICS (proven on this account — 1 month of data on Iker + Unai's founder posts):

THREE MECHANICS that have produced 2x+ outliers on this account. When the post you're rewriting is clearly one of them, sharpen toward the proven shape. When it isn't but the topic naturally fits one, you may nudge — never force-fit a mechanic on a misfit topic.

1. COMMENT-GATED LEAD MAGNET — CTA "comenta '<keyword>' y te mando el <recurso>"
   - Real outliers on this account: 7.3x · 5.0x · 2.9x · 2.5x (300–625 comments/post)
   - The CTA inflates comments → LinkedIn algorithm reads "high engagement" → amplifies reach.
   - Required: a SPECIFIC, valuable lead magnet (doc / framework / dataset / video — not a generic PDF).
   - Frequency cap: 1 every 7–10 posts. Comment-bait gets penalised if overused.
   - If the original post already has a strong lead-magnet ask and a real deliverable, KEEP it. If it has the ask but the deliverable feels generic, do NOT invent a fake one — surface the genericness in the critique and propose toning down to a question CTA instead.

2. INTERACTIVE MAP + REGIONAL IDENTITY (top performer 15.9x · 7.7x · 2.5x)
   - Hook formula A: "Nadie habla de [zona pequeña] que [logro económico shock]. En 60 segundos te explico por qué 👇"
   - Hook formula B: "[Zona] exporta más que [referente conocido]. Y casi nadie lo cuenta porque [razón] 👇"
   - The map IS the engagement tool. Activates identity + social currency + belonging simultaneously.
   - If the original post is regional / industrial in nature and has the data points for a map but the hook reads flat, sharpen the hook toward formula A or B above. Keep the map.
   - Regions still to mine: Euskadi (industrial), La Rioja (vino + tech), Galicia (conserveras / textil), Asturias (siderurgia), Murcia (agritech), Navarra (automoción + energía), Valencia (cerámica).

3. PUNCHY SHORT + MEME IMAGE
   - Real outlier on this account: 3.7x with 130K impressions (highest reach of the month — "Subir en ventas siempre pasa factura.")
   - 1–3 short lines + meme image. The image carries ~80% of the message; text only activates it. Drives REPOSTS (not comments).
   - If the original post is meme-friendly (one painful B2B truth, one image), shorten the text to 1–3 lines and let the meme work. Do NOT add a CTA or filler. If the post is genuinely meme-friendly but currently a wall of text, the highest-leverage edit is to STRIP IT BACK.

WHAT BREAKS POSTS on this account (avoid reproducing these failure modes in the rewrite):
- Listicles with no viral mechanic ("6 IAs que uso para cerrar más reuniones" → 0.3x)
- Talking to the wrong audience (agencies vs medium/large B2B exporters and B2B services) → 0.3x
- Burnt templates ("y nadie te lo dice", "el problema eres tú") without a fresh mechanic → 0.3x
- Strong hook + no mechanic attached (no lead magnet, no map, no meme) → 0.3–0.4x
- Founder-centric milestones without a replicable lesson ("12 meses en Lanzadera", "cumplo 27") → 0.7–0.9x
- Cryptic one-liners with no B2B context → 0.5x
- If the original post matches one of these failure patterns, the highest-leverage rewrite is to attach it to one of the three mechanics above (when feasible) or strip out the failure-mode element rather than polishing the surface.

REMIX (when the post is clearly a re-take on an outlier idea — apply ONLY in that case, never force-fit):
- If the original post is leaning on a known outlier hook template (e.g. "If I had to start over…", "1-star vs 5-star", "Before / after", "Don't do X, do Y", "I tried X for Y days", "What I'd do differently today", "Top 1% method"), sharpen toward that template and bring it firmly into our B2B sales + AI niche. Surface elements (industry / role / tool names / numbers) should read as ours: SDR, outbound, prospecting, AI agent, CRM, GTM, Clay, HubSpot, etc.
- Keep the emotional core of the outlier (curiosity / transformation / contrast / aspiration / concrete result) intact while you swap the surface. Diluting the emotion makes the remix flop even with a good hook.
- If the post is clearly a copy of an outlier (same examples, same numbers, same industry references) rewrite the surface to ours — the rewriter is allowed to swap "restaurant" → "B2B sales team", "10K/month" → "30 meetings/month", etc., as long as the post's actual idea / data points are preserved. If the original IS already in our niche, leave the surface alone and just sharpen rhythm/hook.

POSITIONING PRINCIPLES (research-backed from top B2B AI / sales founders — apply ONLY where the original post's material already supports the move; never force-fit):
- Position by CONTRAST: if the post is making a "we do X very well" claim, sharpen it to "most do A, we do X because B" — but only if the contrast is implicit in the original.
- Client numbers beat self-praise. If the post mentions a vague benefit but the original raw text has a concrete client metric somewhere, surface that number into the visible body or hook.
- Frame, not feature. If the post defaults to a feature description and the underlying argument has a market frame ("operativa vs. operacional", "agentic vs. tool", "signal vs. cold volume", "ejecución vs. gestión"), lead with that frame.
- Authority stack — when the original already has two of [internal data, contrarian opinion, own market frame], nudge it to feature all three; don't invent the missing leg.
- Sell without selling — if the original mentions the product/company in the hook, demote it to a single mention near the end. The body documents the failure / framework / story.

CREATOR LEARNINGS (from 2 weeks of real publishing on this account — bias your scoring AND your edits towards this):
- Top performers (e.g. 20x outliers) had: insight + hidden-system + contrarian framing — they showed how something actually works behind the scenes and broke a commonly held belief in the first 1–3 lines, mixing concrete data with narrative. When the original post is already doing this, intensify it. When it isn't, surface the hidden-system angle if the raw material allows.
- Acceptable but weaker: pure provocation + universal-problem framing. It drives comments but a lower repost rate. Don't downgrade a post FROM the "insight + hidden-system" register TO this register.
- Underperformers we need to avoid producing: generic posts that anyone in the niche could publish, AI-news recaps without the author's own framing, opinions with no proof (no number, no specific anecdote), and personal posts (birthday/gratitude/milestone) without a sharp lesson.
- The win/lose test: a post WINS when it (a) explains how a system actually works AND (b) breaks a commonly held belief. A post LOSES when swapping the author name wouldn't change the content's credibility — it then reads as ghostwritten and gets no reposts.

Think of it as a film editor, not a screenwriter: you cut, reorder, sharpen, and pace — but the scenes (ideas) stay the same.

${PILLAR_DIRECTIVE}

${ANTI_FORMULA_RULES}

${CHECKLIST_REFERENCE}

${pillarExamples}${archetypeBlock}${archetypeTargetingBlock}

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
    // Collapse any \n inside the hook section — LinkedIn cuts the preview at
    // the first \n, so a hook split across short sentences gets truncated.
    // Hardcoded boundary defence: even if the model violates the prompt rule
    // and emits a multi-line hook, we merge it back into one physical line.
    postText = ensureSingleLineHook(postText);

    res.json({ text: postText, critique, raw });
  } catch (err: any) {
    console.error('[IMPROVE ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
