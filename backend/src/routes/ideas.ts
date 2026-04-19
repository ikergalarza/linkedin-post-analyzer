import { Router, Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { PostIdeaModel } from '../models/postIdea';
import pool from '../db';

const router = Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function paramId(req: Request): string {
  return req.params.id as string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Human-readable labels for hook/structure archetypes
const HOOK_LABELS: Record<string, string> = {
  pattern_interrupt: 'Ruptura de patrón', belief_breaker: 'Rompe creencias',
  curiosity_gap: 'Intriga', data_shock: 'Dato impactante', hot_take: 'Opinión polémica',
  personal_confession: 'Confesión personal', story_opener: 'Apertura narrativa',
  hypothetical_question: 'Pregunta hipotética', why_question: 'Pregunta "por qué"',
  how_question: 'Pregunta "cómo"', direct_question: 'Pregunta directa',
  bold_claim: 'Afirmación audaz', common_mistake: 'Error frecuente',
  direct_callout: 'Llamada directa', list_promise: 'Promesa de lista',
  contrarian_take: 'Contrarian', relatable_moment: 'Momento relatable',
  motivational: 'Motivacional', observation: 'Observación', other: 'Otro',
};
const STRUCT_LABELS: Record<string, string> = {
  hook_list_cta: 'Hook → Lista → CTA', hook_story_lesson_cta: 'Historia → Lección → CTA',
  problem_agitate_solve: 'Problema → Agitación → Solución',
  contrarian_proof_reframe: 'Contrarian → Prueba → Reencuadre',
  confession_insight_takeaway: 'Confesión → Insight → Conclusión',
  list_framework: 'Framework en lista', problem_solution: 'Problema → Solución',
  story_lesson: 'Historia → Lección', before_after: 'Antes / Después',
  step_by_step: 'Paso a paso', myth_busting: 'Desmontando mitos',
  short_punchy: 'Corto e impactante', long_form_essay: 'Ensayo largo',
  data_driven: 'Basado en datos', other: 'Otro',
};

interface ArchetypeRaw {
  hook_type: string;
  post_structure: string;
  avg_ratio: number;
  example_hook: string | null;
  example_text: string | null;
}

async function getArchetypePool(): Promise<ArchetypeRaw[]> {
  const { rows } = await pool.query(`
    SELECT
      p.hook_type,
      p.post_structure,
      AVG(p.outlier_ratio)::float AS avg_ratio,
      (ARRAY_AGG(p.hook_text ORDER BY p.outlier_ratio DESC))[1] AS example_hook,
      (ARRAY_AGG(p.content_text ORDER BY p.outlier_ratio DESC))[1] AS example_text
    FROM posts p
    WHERE p.is_outlier = TRUE
      AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
      AND p.hook_type IS NOT NULL AND p.hook_type != 'other'
      AND p.post_structure IS NOT NULL AND p.post_structure != 'other'
    GROUP BY p.hook_type, p.post_structure
    HAVING COUNT(*) >= 2
    ORDER BY avg_ratio DESC
    LIMIT 18
  `);
  return rows;
}

// Ask Claude to pick 3 archetypes from the pool that best fit THIS raw idea.
// Accepts a list of archetype_keys already tried so reloads return different picks.
async function selectArchetypesForIdea(
  rawIdea: string,
  archetypePool: ArchetypeRaw[],
  exclude: string[]
): Promise<ArchetypeRaw[]> {
  const excludeSet = new Set(exclude);
  const candidates = archetypePool.filter(
    (a) => !excludeSet.has(`${a.hook_type}__${a.post_structure}`)
  );
  if (candidates.length === 0) return archetypePool.slice(0, 3); // pool exhausted → reset

  const list = candidates
    .map((a, i) => {
      const hook = HOOK_LABELS[a.hook_type] || a.hook_type;
      const struct = STRUCT_LABELS[a.post_structure] || a.post_structure;
      return `${i + 1}. ${hook} + ${struct} (${a.avg_ratio.toFixed(1)}x avg ratio)`;
    })
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `You're picking viral LinkedIn archetypes for a specific raw idea.

RAW IDEA:
"""
${rawIdea}
"""

AVAILABLE ARCHETYPES (hook + structure pairings, sorted by past virality):
${list}

Pick exactly 3 archetypes from the list that fit THIS specific idea best — based on the topic, tone, and what would naturally surface its punchline.

CRITICAL:
- The 3 must be MEANINGFULLY DIFFERENT from each other (different angles, not three flavors of the same shape).
- Favor archetypes that match the *content* of the idea, not just the highest ratio. A data-shock idea wants a data-shock hook; a personal anecdote wants a confession or story opener.
- Return ONLY a JSON array of 3 numbers (1-indexed positions from the list). Example: [3, 7, 12]
- No markdown, no explanation, just the JSON array.`,
    }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1) return candidates.slice(0, 3);

  let picks: number[];
  try {
    picks = JSON.parse(cleaned.slice(startIdx, endIdx + 1));
    if (!Array.isArray(picks)) throw new Error('not array');
  } catch {
    return candidates.slice(0, 3);
  }

  const selected: ArchetypeRaw[] = [];
  const seen = new Set<number>();
  for (const p of picks) {
    const idx = Number(p) - 1;
    if (Number.isInteger(idx) && idx >= 0 && idx < candidates.length && !seen.has(idx)) {
      selected.push(candidates[idx]);
      seen.add(idx);
    }
    if (selected.length >= 3) break;
  }
  // Pad with remaining candidates if Claude returned fewer than 3
  for (const c of candidates) {
    if (selected.length >= 3) break;
    const key = `${c.hook_type}__${c.post_structure}`;
    if (!selected.some((s) => `${s.hook_type}__${s.post_structure}` === key)) selected.push(c);
  }
  return selected.slice(0, 3);
}

async function getOutlierContext(): Promise<string> {
  const { rows: outliers } = await pool.query(`
    SELECT p.content_text, p.hook_text, p.hook_type, p.post_structure, p.text_tone,
           p.outlier_ratio, p.likes_count, p.comments_count, p.reposts_count
    FROM posts p
    WHERE p.is_outlier = TRUE AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
      AND p.content_text IS NOT NULL AND LENGTH(p.content_text) > 50
    ORDER BY p.outlier_ratio DESC
    LIMIT 8
  `);

  if (outliers.length === 0) return '';

  const lines: string[] = ['=== TOP OUTLIER POSTS (real viral examples for style reference) ==='];
  for (const p of outliers) {
    lines.push(`\n[${p.outlier_ratio}x ratio | Hook: ${p.hook_type} | Structure: ${p.post_structure} | Tone: ${p.text_tone}]`);
    lines.push(`"${(p.content_text || '').substring(0, 500)}${(p.content_text || '').length > 500 ? '…' : ''}"`);
  }
  return lines.join('\n');
}

async function generateVariant(
  rawContent: string,
  sourceType: string,
  archetype: ArchetypeRaw,
  outlierContext: string
): Promise<string> {
  const hookLabel = HOOK_LABELS[archetype.hook_type] || archetype.hook_type;
  const structLabel = STRUCT_LABELS[archetype.post_structure] || archetype.post_structure;

  const exampleSection = archetype.example_text
    ? `\nEXAMPLE of this archetype performing well (${archetype.avg_ratio.toFixed(1)}x avg ratio):\nHook: "${archetype.example_hook || ''}"\n---\n${archetype.example_text.substring(0, 500)}\n---`
    : '';

  const system = `You are a LinkedIn post writer. Write a complete LinkedIn post based on a raw idea, using a SPECIFIC viral archetype.

ARCHETYPE TO USE:
- Hook type: ${hookLabel} (${archetype.hook_type})
- Post structure: ${structLabel} (${archetype.post_structure})
- This archetype achieves ${archetype.avg_ratio.toFixed(1)}x average engagement in real data
${exampleSection}

RULES:
- Write in the same language as the raw idea
- Keep the EXACT core idea, examples, numbers, and quotes — do NOT change the substance
- Apply the hook type strictly: the first line must follow the "${hookLabel}" pattern
- Apply the post structure strictly: the post must follow the "${structLabel}" framework
- Short paragraphs (max 2-3 lines), blank line between them
- Personal, concrete, conversational — not corporate
- 150-400 words
- End with a question or CTA
- NEVER use: "I'm excited to share", "In today's world", "Game changer", "Leverage", "Synergy"
- 2-3 relevant hashtags at the end

${outlierContext ? `\nVIRAL REFERENCE POSTS:\n${outlierContext}` : ''}

Respond with ONLY the post text — no preamble, no explanation.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Raw idea: "${rawContent}"\nSource: ${sourceType}\n\nWrite the post using the ${hookLabel} hook and ${structLabel} structure:`,
    }],
    system,
  });

  return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// GET /api/ideas
router.get('/', async (_req: Request, res: Response) => {
  try {
    const ideas = await PostIdeaModel.findAll();
    res.json(ideas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ideas
router.post('/', async (req: Request, res: Response) => {
  try {
    const { raw_content, source_type, tags } = req.body;
    if (!raw_content?.trim()) return res.status(400).json({ error: 'raw_content is required' });

    const idea = await PostIdeaModel.create({ raw_content: raw_content.trim(), source_type, tags });
    res.status(201).json(idea);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/ideas/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const idea = await PostIdeaModel.update(paramId(req), req.body);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    res.json(idea);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/ideas/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await PostIdeaModel.delete(paramId(req));
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Generate post from idea ───────────────────────────────────────────────────

// POST /api/ideas/:id/generate
// Generates 3 post variants, one per top viral archetype from real outlier data.
// Returns { variants: ArchetypeVariant[] }. User selects one, then auto-improve runs.
router.post('/:id/generate', async (req: Request, res: Response) => {
  const id = paramId(req);
  try {
    const idea = await PostIdeaModel.findById(id);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });

    await PostIdeaModel.update(id, { status: 'generating' });

    // Optional list of archetype_keys already tried — for the "reload archetypes" UX
    const exclude: string[] = Array.isArray(req.body?.exclude) ? req.body.exclude : [];

    // Pull a wide pool of high-performing archetypes
    const archetypePool = await getArchetypePool();

    // Fallback if not enough outlier data
    if (archetypePool.length === 0) {
      archetypePool.push(
        { hook_type: 'personal_confession', post_structure: 'confession_insight_takeaway', avg_ratio: 3, example_hook: null, example_text: null },
        { hook_type: 'data_shock', post_structure: 'problem_agitate_solve', avg_ratio: 3, example_hook: null, example_text: null },
        { hook_type: 'contrarian_take', post_structure: 'contrarian_proof_reframe', avg_ratio: 3, example_hook: null, example_text: null },
      );
    }

    // Let Claude pick the 3 archetypes that fit THIS idea best, skipping ones already shown
    let archetypes: ArchetypeRaw[];
    try {
      archetypes = await selectArchetypesForIdea(idea.raw_content, archetypePool, exclude);
    } catch (selErr: any) {
      console.error('[Ideas generate] Selector failed, falling back to top-3:', selErr.message);
      archetypes = archetypePool.slice(0, 3);
    }

    if (archetypes.length === 0) {
      archetypes = archetypePool.slice(0, 3);
    }

    const outlierContext = await getOutlierContext();

    // Generate all 3 variants in parallel
    const results = await Promise.allSettled(
      archetypes.slice(0, 3).map((arch) => generateVariant(idea.raw_content, idea.source_type, arch, outlierContext))
    );

    const sanitizeText = (t: string) =>
      t.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();

    const variants = archetypes.slice(0, 3).map((arch, i) => ({
      archetype_key: `${arch.hook_type}__${arch.post_structure}`,
      archetype_label: `${HOOK_LABELS[arch.hook_type] || arch.hook_type}`,
      archetype_desc: `${STRUCT_LABELS[arch.post_structure] || arch.post_structure} · ${arch.avg_ratio.toFixed(1)}x ratio en outliers`,
      hook_type: arch.hook_type,
      post_structure: arch.post_structure,
      avg_ratio: arch.avg_ratio,
      text: results[i].status === 'fulfilled' ? sanitizeText((results[i] as PromiseFulfilledResult<string>).value) : '',
    })).filter((v) => v.text.length > 0);

    if (variants.length === 0) {
      await PostIdeaModel.update(id, { status: 'draft' });
      return res.status(500).json({ error: 'AI returned empty responses for all variants' });
    }

    // Save variants using explicit ::jsonb cast to avoid pg serialization issues
    const variantsJson = JSON.stringify(variants);
    try {
      await pool.query(
        `UPDATE post_ideas SET generated_variants = $1::jsonb, status = 'ready', updated_at = NOW() WHERE id = $2`,
        [variantsJson, id]
      );
    } catch (dbErr: any) {
      console.error('[Ideas generate] DB save failed:', dbErr.message);
      console.error('[Ideas generate] JSON payload (first 1000 chars):', variantsJson.substring(0, 1000));
      throw dbErr;
    }

    res.json({ variants });
  } catch (err: any) {
    console.error('[Ideas generate] Error:', err.message, err.stack);
    await PostIdeaModel.update(id, { status: 'draft' }).catch(() => {});
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ideas/:id/save-post — save the final improved post + score
router.post('/:id/save-post', async (req: Request, res: Response) => {
  try {
    const { generated_post, generation_score } = req.body;
    const idea = await PostIdeaModel.update(paramId(req), {
      generated_post,
      generation_score: typeof generation_score === 'number' ? generation_score : null,
      status: 'ready',
    });
    res.json(idea);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Inspiration: browse & steal outlier posts ──────────────────────────────

// GET /api/ideas/inspiration — Return all outlier posts with creator info
router.get('/inspiration', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.content_text, p.hook_text, p.hook_type, p.post_structure,
             p.text_tone, p.content_type, p.outlier_ratio, p.engagement_score,
             p.likes_count, p.comments_count, p.reposts_count,
             p.published_at, p.post_url, p.topic,
             c.name AS creator_name, c.headline AS creator_headline,
             c.profile_image_url AS creator_image, c.followers_count AS creator_followers
      FROM posts p
      JOIN creators c ON c.id = p.creator_id
      WHERE p.is_outlier = TRUE
        AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
        AND p.content_text IS NOT NULL
        AND LENGTH(p.content_text) > 80
      ORDER BY p.outlier_ratio DESC
    `);

    res.json({ outliers: rows, total: rows.length });
  } catch (err: any) {
    console.error('[Inspiration] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ideas/inspiration/classify — AI-classify outlier posts by topic (one-time)
router.post('/inspiration/classify', async (_req: Request, res: Response) => {
  try {
    const { rows: unclassified } = await pool.query(`
      SELECT p.id, p.content_text, p.hook_text
      FROM posts p
      WHERE p.is_outlier = TRUE
        AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
        AND p.content_text IS NOT NULL
        AND LENGTH(p.content_text) > 80
        AND (p.topic IS NULL OR p.topic = '')
      ORDER BY p.outlier_ratio DESC
    `);

    if (unclassified.length === 0) {
      return res.json({ classified: 0, message: 'All outliers already classified' });
    }

    const cleanText = (t: string) =>
      (t || '').replace(/[\x00-\x1F\x7F]/g, ' ').replace(/"/g, "'").replace(/\s+/g, ' ').trim().substring(0, 250);

    const BATCH_SIZE = 30;
    let totalClassified = 0;

    for (let start = 0; start < unclassified.length; start += BATCH_SIZE) {
      const batch = unclassified.slice(start, start + BATCH_SIZE);

      const postsList = batch.map((p: any, i: number) =>
        `${i + 1}. [ID:${p.id}] ${cleanText(p.content_text)}`
      ).join('\n\n');

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `Classify each LinkedIn post below into a short topic label (2-4 words max).

Use CONSISTENT labels across posts — group similar themes under the SAME label.
Good labels: "Sales Tactics", "Cold Outreach", "Hiring & Culture", "Founder Lessons", "AI & Automation", "Personal Growth", "Productivity", "Leadership", "Storytelling", "Marketing Strategy"

Posts:
${postsList}

Return a JSON object mapping post number to topic label. Example:
{"1": "Sales Tactics", "2": "Founder Lessons", "3": "Cold Outreach"}

Return ONLY the JSON object. No markdown, no explanation.`,
        }],
      });

      const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
      if (!rawText) continue;

      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const startIdx = cleaned.indexOf('{');
      const endIdx = cleaned.lastIndexOf('}');
      if (startIdx === -1 || endIdx === -1) continue;

      let mapping: Record<string, string>;
      try {
        mapping = JSON.parse(cleaned.slice(startIdx, endIdx + 1));
      } catch {
        console.error('[Classify] JSON parse error for batch starting at', start);
        continue;
      }

      for (const [numStr, topic] of Object.entries(mapping)) {
        const idx = parseInt(numStr, 10) - 1;
        if (idx < 0 || idx >= batch.length || !topic) continue;
        const postId = batch[idx].id;
        await pool.query('UPDATE posts SET topic = $1 WHERE id = $2', [topic.trim(), postId]);
        totalClassified++;
      }
    }

    res.json({ classified: totalClassified, total: unclassified.length });
  } catch (err: any) {
    console.error('[Classify] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
