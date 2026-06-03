import Anthropic from '@anthropic-ai/sdk';
import { stripLoneSurrogates } from '../utils/sanitizeText';

// Generates a single reply that the post author writes back to a commenter.
// Distinct from commentGenerator (which produces 9 angles for someone OTHER
// than the author): this one impersonates the AUTHOR replying on their own
// post, so the voice profile is the author's own commenter_profile entry
// (Iker → 'Iker', Unai → 'Unai').
//
// Output is a single string (no JSON envelope) because the UI shows ONE
// editable draft, not a menu of variants. Same language-matching guardrail
// as commentGenerator — Spanish post + Spanish comment → Spanish reply.

export interface ReplyGenerationInput {
  postContent: string;
  commentText: string;
  commenterName: string | null;
  commenterHeadline: string | null;
  authorName: string;
  authorVoice: {
    voice_style: string | null;
    worldview: string | null;
    signature_moves: string | null;
    avoid: string | null;
  };
}

const SYSTEM_PROMPT = `You are the AUTHOR of a LinkedIn post, writing a short reply to someone who commented on it. You are NOT a generic AI — you are impersonating the real author, whose voice profile is given below as hard constraints.

═══ NON-NEGOTIABLES ═══

RULE 1 — LANGUAGE: Write the reply in the EXACT SAME LANGUAGE as the post and the comment. Spanish post + Spanish comment → Spanish reply. Do NOT translate. Match register (formal/informal, "tú" vs "usted", etc.) to the original.

RULE 2 — VOICE: The voice_style / worldview / signature_moves below are how you actually write. The "avoid" list is words/patterns you would never use. Both are law.

RULE 3 — LENGTH: 1–3 short sentences. A reply, not an essay. If a single tight line works, ship it.

RULE 4 — TONE: You're the host, not a salesman. Acknowledge the commenter, engage with their actual point (agree, build on it, gently push back, or ask a sharpening question). NO generic "Thanks for sharing!" / "Great point!" filler. NO emoji unless your signature_moves explicitly include them.

RULE 5 — NO META: Don't reference that this is LinkedIn. Don't talk about "the algorithm". Don't open with the commenter's name as a vocative ("Marcos: ...") unless your voice does that habitually.

RULE 6 — OUTPUT: ONE reply. Plain text. No markdown, no quotes wrapping the whole thing, no preamble like "Here's the reply:". Just the reply.`;

function buildPrompt(input: ReplyGenerationInput): string {
  const v = input.authorVoice;
  const voiceBlock = [
    v.voice_style ? `VOICE STYLE: ${v.voice_style}` : null,
    v.worldview ? `WORLDVIEW: ${v.worldview}` : null,
    v.signature_moves ? `SIGNATURE MOVES: ${v.signature_moves}` : null,
    v.avoid ? `AVOID: ${v.avoid}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const commenterLine = input.commenterName
    ? `Commenter: ${input.commenterName}${input.commenterHeadline ? ` (${input.commenterHeadline})` : ''}`
    : 'Commenter: unknown';

  return `You are ${input.authorName}. Reply to a comment on your own post.

${voiceBlock || '(No detailed voice profile — default to a natural, direct tone consistent with your post.)'}

═══ YOUR POST ═══
${input.postContent}

═══ THE COMMENT YOU ARE REPLYING TO ═══
${commenterLine}
"${input.commentText}"

Write the reply now. Plain text, 1–3 short sentences, in the same language as the post/comment.`;
}

export async function generateReply(input: ReplyGenerationInput): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildPrompt(input) }],
  });
  const block = message.content.find((b) => b.type === 'text') as { type: 'text'; text: string } | undefined;
  const text = stripLoneSurrogates(block?.text ?? '').trim();
  if (!text) throw new Error('Empty reply from model');
  // Drop wrapping quotes if the model added them despite the system rule.
  return text.replace(/^["“”']+|["“”']+$/g, '').trim();
}
