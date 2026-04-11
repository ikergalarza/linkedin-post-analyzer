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

async function getOutlierContext(): Promise<string> {
  const { rows: outliers } = await pool.query(`
    SELECT p.content_text, p.hook_text, p.hook_type, p.post_structure, p.text_tone,
           p.outlier_ratio, p.likes_count, p.comments_count, p.reposts_count,
           c.name as creator_name
    FROM posts p
    JOIN creators c ON c.id = p.creator_id
    WHERE p.is_outlier = TRUE AND p.content_text IS NOT NULL AND LENGTH(p.content_text) > 50
    ORDER BY p.outlier_ratio DESC
    LIMIT 12
  `);

  if (outliers.length === 0) return '';

  const lines: string[] = ['=== TOP OUTLIER POSTS (real viral examples) ==='];
  for (const p of outliers) {
    lines.push(`\n[${p.outlier_ratio}x ratio | Hook: ${p.hook_type} | Structure: ${p.post_structure} | Tone: ${p.text_tone}]`);
    lines.push(`Engagement: ${p.likes_count} likes, ${p.comments_count} comments, ${p.reposts_count} reposts`);
    lines.push(`"${(p.content_text || '').substring(0, 600)}${(p.content_text || '').length > 600 ? '…' : ''}"`);
  }
  return lines.join('\n');
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
// Generates an initial LinkedIn post draft from the raw idea + outlier context.
// The frontend then runs the auto-improve loop via /api/chat/improve.
router.post('/:id/generate', async (req: Request, res: Response) => {
  const id = paramId(req);
  try {
    const idea = await PostIdeaModel.findById(id);
    if (!idea) return res.status(404).json({ error: 'Idea not found' });

    // Mark as generating
    await PostIdeaModel.update(id, { status: 'generating' });

    const outlierContext = await getOutlierContext();

    const system = `You are a LinkedIn post writer. Your task is to write a complete, high-quality LinkedIn post based on a raw idea captured by the creator.

The creator captured this idea in the moment — it could be a voice note, a quote from a book, a thought during a demo, or any raw observation. Your job is to turn it into a polished, viral-ready LinkedIn post.

RULES:
- Write in the same language as the raw idea (Spanish if the idea is in Spanish, English if in English)
- Keep the EXACT same core idea, specific examples, and any numbers or quotes mentioned — do NOT change the substance
- Use a powerful, specific hook on the first line (no "I", no generic opener)
- Structure: Hook → Story/Tension → Insight → Takeaway or CTA
- Short paragraphs, max 2-3 lines each, blank line between paragraphs
- Use line breaks aggressively for readability
- The post should feel personal, concrete, and conversational — not corporate
- Aim for 150-400 words
- End with a question or CTA that invites engagement
- NEVER use: "Great post", "I'm excited to share", "In today's world", "Game changer", "Leverage", "Synergy"
- Add 2-3 relevant hashtags at the end

${outlierContext ? `\nHere are the top viral posts from this creator's analysis for style reference:\n\n${outlierContext}` : ''}

Respond with ONLY the post text — no preamble, no explanation, just the post.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Raw idea captured:\n\n"${idea.raw_content}"\n\nSource type: ${idea.source_type}\n\nWrite the LinkedIn post:`,
        },
      ],
      system,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    if (!text) {
      await PostIdeaModel.update(id, { status: 'draft' });
      return res.status(500).json({ error: 'AI returned empty response' });
    }

    // Save the initial draft (score will be updated by frontend after auto-improve)
    await PostIdeaModel.update(id, { generated_post: text, status: 'ready' });

    res.json({ text });
  } catch (err: any) {
    console.error('[Ideas generate] Error:', err.message);
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

// ─── Inspiration from outliers ────────────────────────────────────────────────

// POST /api/ideas/inspiration — Extract post ideas from outlier clusters
router.post('/inspiration', async (req: Request, res: Response) => {
  try {
    const { rows: outliers } = await pool.query(`
      SELECT p.content_text, p.hook_text, p.hook_type, p.post_structure, p.text_tone,
             p.outlier_ratio, p.likes_count, p.comments_count
      FROM posts p
      WHERE p.is_outlier = TRUE AND p.content_text IS NOT NULL AND LENGTH(p.content_text) > 80
      ORDER BY p.outlier_ratio DESC
      LIMIT 30
    `);

    if (outliers.length < 3) {
      return res.status(422).json({ error: 'Not enough outlier posts yet. Add and analyze more creators first.' });
    }

    const postsSummary = outliers.map((p: any, i: number) =>
      `[Post ${i + 1} | ${p.outlier_ratio}x | ${p.hook_type} | ${p.post_structure}]\n"${(p.content_text || '').substring(0, 400)}"`
    ).join('\n\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Analyze these ${outliers.length} top-performing LinkedIn posts (viral outliers) and extract content ideas for a creator.

${postsSummary}

Your task:
1. Group these posts into 4-6 thematic clusters (e.g. "Mistakes & Lessons", "Cold Outreach Tactics", "Mindset Shifts", etc.)
2. For each cluster, generate 4-5 concrete, actionable post ideas that a creator could write from their OWN experience — inspired by the theme and angle of these viral posts
3. Each idea should be a clear hook/angle, not a generic topic

Return a JSON array with this exact structure:
[
  {
    "cluster": "Cluster name (2-4 words)",
    "theme": "One sentence describing the underlying theme that makes these posts viral",
    "ideas": [
      {
        "angle": "The specific hook or angle for the post (1 punchy sentence)",
        "prompt": "A brief description of what the creator could write about (2-3 sentences)"
      }
    ]
  }
]

Return ONLY the JSON array, no other text.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';

    // Extract JSON even if wrapped in markdown code blocks
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI returned invalid response' });
    }

    const clusters = JSON.parse(jsonMatch[0]);
    res.json({ clusters, outliers_analyzed: outliers.length });
  } catch (err: any) {
    console.error('[Ideas inspiration] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
