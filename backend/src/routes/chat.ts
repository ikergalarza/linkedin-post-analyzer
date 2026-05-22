import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { PostModel } from '../models/post';
import { CreatorModel } from '../models/creator';
import { getCrossCreatorPatterns } from '../services/patterns';
import { CreatorProfileModel } from '../models/creatorProfile';
import { CommenterProfileModel } from '../models/commenterProfile';
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
        LIMIT 12`
    );
    if (myTop.length > 0) {
      lines.push('');
      lines.push(`--- TOP POSTS BY THIS USER (LIVE from DB — sorted by outlier ratio; ALWAYS up to date with the latest scrape, including the past week) ---`);
      lines.push(`Use this list as the source of truth when the user asks "what's working for me", "what are my best posts", "what should I write more of". The static profile.my_posts field is intentionally NOT used — it was a manual one-time load and may be months out of date.`);
      for (const p of myTop) {
        const ratio = p.outlier_ratio ? `${(+p.outlier_ratio).toFixed(1)}x` : '—';
        const imp = p.impressions_count ? ` · ${p.impressions_count} imp` : '';
        const date = p.published_at ? new Date(p.published_at).toISOString().slice(0, 10) : '?';
        const arche = (p.hook_type && p.hook_type !== 'other' && p.post_structure && p.post_structure !== 'other')
          ? ` · ${p.hook_type} + ${p.post_structure}`
          : '';
        lines.push(`\n[${date} · ${p.creator_name} · ${ratio} ratio · ${p.likes_count}❤ ${p.comments_count}💬 ${p.reposts_count}🔁${imp}${arche}]`);
        lines.push((p.content_text as string).slice(0, 600));
        lines.push('---');
      }
    }
  } catch (err) {
    console.warn('[buildProfileContext] live top-posts query failed:', (err as Error).message);
  }

  lines.push('');
  lines.push('CRITICAL: When writing posts for this user, match their voice and style based on their top posts above (which are LIVE from the database — never refer to a previous version of their post history). Incorporate their company, product, and positioning naturally. Use the viral patterns from the analysis data but adapt them to THIS user\'s authentic voice — not generic.');
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

1. NO EXPLICIT COMMENT-BAIT. LinkedIn's classifier now penalises explicit "Comment 'X' below and I'll DM you" / "Comenta 'GUÍA' y te lo paso" / "Drop 'YES'" — reach gets capped before comments can amplify. For lead-magnet posts the ask MUST be implicit: a human reader understands they need to comment to receive the resource, but the algorithm can't auto-flag it. Use phrasings like "Si esto te resuena, dímelo abajo y te lo paso", "Lo tengo en un doc — escríbeme aquí y te llega", "Levanto la mano abajo si lo quieres". NEVER write the explicit "Comenta X" / "Drop YES" patterns.

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

7. EXACTLY ONE CTA at the end — pick a single closer: an opinion-forcing question, OR an IMPLICIT lead-magnet ask (rule #1; never the literal "Comenta 'X'"), OR no CTA at all (a strong claim can close). NEVER stack closers (no question + lead-magnet, no two questions). One closer, sharp.

8. HOOK MUST ANCHOR TO OUR SECTOR IN THE FIRST LINE — and our sector is B2B SALES (with AI as a tool we happen to use, NOT our category). The audience is salespeople, SDRs, AEs, sales leaders and B2B founders — not AI engineers or generic productivity readers. Any ONE of these anchors in the first line is enough: ventas / sales / B2B / SDR / AE / outbound / outreach / cold email / prospecting / pipeline / SaaS / CRM / GTM / lead gen / closing / discovery / demo / cuota / cliente — OR a specific tool we live in (Claude, GPT, Clay, Apollo, HubSpot, Salesforce, n8n, Make, Zapier, etc.). AI / IA / agente / LLM is welcome but NOT required: a hook that only says "ventas" or "B2B" is already on-brand. The failure mode goes the other way — a generic personal-development hook ("Hace 5 años pensaba que…", "El otro día me di cuenta…") that anyone in any industry could publish, dissolving our positioning. Sector anchor lives in the FIRST line, not buried in paragraph 3.

9. BURNED OPENERS / CLOSERS — never reuse these verbatim (paraphrase or change angle): "Nadie te dice esto, pero…", "Lo que nadie te cuenta…", "Me ha costado X años aprender que…", "Este es el error más grande que…", "El problema eres tú", "Y nadie te lo dice" stacked at the end of a list, "Si has llegado hasta aquí, déjame un comentario" or any explicit lead-magnet bait, "Spoiler: …" / "Plot twist: …" as a closer. They signal low-effort the moment a reader sees them.

10. LINKS INSIDE THE BODY OF THE POST ARE FINE — verified on our own account with posts crossing 100K impressions that carry a body link. The old LinkedIn folklore "never put the link in the post, drop it in the first comment" no longer applies in 2026: a body link does NOT suppress reach. This matters for lead-magnet design: instead of forcing implicit comment-bait (rule #1) you can simply place a direct link to the resource / article / landing page / product in the body. Both options remain valid — choose deliberately: an implicit comment-gated ask accrues comments which the algo rewards (best when you need the comment-spike for amplification); a direct body link is friction-free and gets clicks immediately but loses that comment signal. Never recommend "ponlo en el primer comentario" as a constraint; it's outdated.

11. HOOK NUMBER DENSITY — at most ONE numerical metric in the hook. Zero or one is the sweet spot; TWO OR MORE figures in the first line is a hard NO. Verified on this account's top 8 viral hooks (ratios 3.6x–15.6x): 50% have zero numbers, 50% have exactly one, 0% have two or more. Multiple stats stacked at the open glaze the eye and kill the open loop — numbers belong in the BODY, where they accumulate and prove the claim. The hook shapes that actually work on this account:
   (a) ONE METRIC + COUNTERINTUITIVE CLAIM + 👇 — "Cataluña exporta más que Portugal entera. Y casi nadie lo cuenta porque se trabaja en silencio desde hace 80 años 👇" · "El 93% de los equipos B2B prioriza leads a ojo. El jueves enseño cómo dejar de hacerlo 👇"
   (b) NO METRICS, BOLD CLAIM + REFRAME — "El cold calling no ha muerto. Lo hemos enterrado en vida 👇" · "🚨 ÚLTIMA HORA: Claude acaba de matar el cold outbound como lo conocemos 👇"
   (c) NO METRICS, PERSONAL FRAME + OPEN LOOP — "Le tiré las llaves de mi LinkedIn a Claude y nunca había generado tantos leads B2B 👇"
   Recurring structure: [single claim OR single metric] + [tension or reframe] + [👇]. A punchy/physical verb (matar, enterrar, perder, reventar, tirar, destrozar, quemar…) lives in at least one of the two parts. If the draft hook has 2+ figures, move all but the single most impactful one to the body — or drop them all and lead with the claim.`;

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
    const voiceContext = await buildVoiceContext(messages);

    const systemPrompt = `${SYSTEM_PROMPT}\n\nHere is the real analysis data from the LinkedIn posts database:\n\n${analysisContext}${profileContext}${voiceContext}`;

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


export default router;
