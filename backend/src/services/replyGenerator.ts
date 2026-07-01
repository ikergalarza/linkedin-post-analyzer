import { trackedCreate } from './claudeClient';
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

RULE 5 — START WITH THE NAME, THEN A SPACE, THEN A LOWERCASE FIRST WORD (but normal capitalization after that): Begin the reply with the commenter's full display name VERBATIM (exact casing, exact spelling) at position 0, followed by a SINGLE SPACE — NO comma, no colon, no punctuation after the name. The FIRST word after the name is lowercase (close/casual). Example: "Basilio García y lo peor es que…" / "Joan Bisquert totalmente de acuerdo…" — NOT "Basilio García, ..." and NOT "Basilio García. Lo peor…". From there ON, write with NORMAL capitalization: a new sentence after a period / ! / ? starts with a CAPITAL letter, as in any text. ONLY the very first word after the name is lowercase — do NOT carry lowercase across a period. Wrong: "exacto eso es. y lo que más caro…". Right: "exacto eso es. Y lo que más caro…". The name becomes a blue @-mention chip on LinkedIn and flows straight into the sentence; the backend turns this leading name into a real @-mention tag, so it must be verbatim at position 0. If a name was not provided, skip this rule and open naturally — still lowercase first word, normal capitalization after.

RULE 6 — NO META: Don't reference that this is LinkedIn. Don't talk about "the algorithm".

RULE 7 — OUTPUT: ONE reply. Plain text. No markdown, no quotes wrapping the whole thing, no preamble like "Here's the reply:". Just the reply.

RULE 8 — NEVER USE THE LONG DASH: do NOT use "—" (em dash) or "–" (en dash) anywhere. It's a top tell that a reply was written by AI. Use a comma, a period, or a connector ("y", "pero", "así que") instead. Plain everyday punctuation only.

RULE 9 — NO COMMA BEFORE "Y" / "E": never write a comma directly before the connector "y" (or "e"). "recursos limitados, y la demanda sube" → "recursos limitados y la demanda sube". The comma-before-"y" reads formal/AI; real people drop it. (Comma before "pero" is fine and natural — this rule is only about "y"/"e".)

RULE 10 — VARIETY (don't ban, just don't default): openers like "exacto", "totalmente", "justo", "tal cual", "cierto", "lo curioso es que", "buen punto", "me encanta que", "claro" are perfectly natural and FINE TO USE sometimes — the problem is using one of them on EVERY reply, which is what reads as canned/AI. So don't make any single opener your reflex; aim for genuine variety across replies. Sometimes one of those is exactly right — use it. Other times open a different way entirely. Vary the OPENING MOVE based on what the comment actually says — rotate among: (a) agree + add a specific angle they did NOT mention; (b) build on their point with a concrete example or number; (c) gently push back / add a nuance; (d) answer their question or curiosity directly; (e) a short punchy reaction line, then one line that expands it; (f) pick up a specific word or phrase THEY used and run with it; (g) a tiny relevant anecdote or behind-the-scenes detail. The first words should feel written for THIS specific comment, not pasted from the same template every time.

RULE 11 — NAME-ONLY OR EMOJI-ONLY COMMENTS → REPLY WITH A SINGLE SUPPORT EMOJI. If the comment is ONLY a person's name (someone tagging a colleague, e.g. "@Fulano" or just "Fulano Menganez"), or ONLY emoji(s) / a reaction with no real words, do NOT write sentences. Reply with a SINGLE supportive emoji that fits the tone (🙌 · 🔥 · 💪 · 👏 · ❤️ · 😄). No name lead, no words at all — just the emoji. This OVERRIDES rules 3, 4, 5 and 10 for these cases.

RULE 12 — NATURAL VOWEL ELONGATION (this is what makes a reply sound human, not AI). Stretch a vowel in ONE or TWO words per reply by repeating a vowel — both mid-word and word-final. "muuuy buena" reads better than "muy buena"; "ciertooo" better than "cierto"; also "totaaal", "buenííísimo", "graciaas", "síííí". Put the stretch where the emphasis naturally lands (agreement, praise, emphasis). ONE or TWO stretches per reply is human; stretching every word is try-hard — keep it subtle. Do this on most replies; it's a core part of the natural voice.

RULE 13 — ALWAYS THANK WHEN THEY PRAISE US (never skip it). If the comment is mainly praise / flattery ("gran post", "me encanta", "brutal", "qué bueno", "de los mejores", "crack", "top", etc.), the reply MUST include a thanks — and NEVER a flat "gracias". Use a warm, elongated variant: "graciasss", "graciaas", "graciaaas", "muchas graciaaas", "gracias por valorarlo", "graciaas por el cariño", "se agradeceee". This is non-negotiable when the comment is basically a compliment — we too often skip the thanks and it reads cold. You can add a short line after the thanks, but the thanks comes first.`;

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

  // Surfaced as a separate, hard instruction so it doesn't get diluted by
  // the post/voice context above. Keeps RULE 5 (mention prefix) front and
  // centre right before the model writes.
  const mentionInstruction = input.commenterName
    ? `MENTION PREFIX (required): Begin your reply with exactly "${input.commenterName} " — the name verbatim (same casing and spelling) followed by a SINGLE SPACE and NO comma, then continue in lowercase. The backend converts that leading name into a LinkedIn @-mention tag, so any deviation breaks the tag. And never use a "—"/"–" dash anywhere in the reply.`
    : `MENTION PREFIX: Skip — no commenter name available, open naturally (lowercase first word, no "—" dash).`;

  // Per-call variety nudge: pick a random opening MOVE so replies don't
  // converge on the same shape across comments (RULE 10). Framed as a
  // preference, not a mandate, so it never forces an awkward fit.
  const OPENING_MOVES = [
    'agree, then add a specific angle they did NOT mention',
    'build on their point with a concrete example or number',
    'gently push back or add a nuance they are missing',
    'answer their question / curiosity directly and plainly',
    'open with a short punchy reaction line, then one line that expands it',
    'pick up a specific word or phrase THEY used and run with it',
    'drop a tiny relevant anecdote or behind-the-scenes detail',
  ];
  const move = OPENING_MOVES[Math.floor(Math.random() * OPENING_MOVES.length)];
  const varietyNudge = `VARIETY NUDGE for THIS reply: lean toward this move IF it fits the comment naturally (don't force it): ${move}. The point is variety across replies (RULE 10) — a common opener like "exacto/totalmente" is fine now and then, just not as the default every time.`;

  return `You are ${input.authorName}. Reply to a comment on your own post.

${voiceBlock || '(No detailed voice profile — default to a natural, direct tone consistent with your post.)'}

═══ YOUR POST ═══
${input.postContent}

═══ THE COMMENT YOU ARE REPLYING TO ═══
${commenterLine}
"${input.commentText}"

${mentionInstruction}

${varietyNudge}

Write the reply now. Plain text, 1–3 short sentences, in the same language as the post/comment.`;
}

export async function generateReply(input: ReplyGenerationInput): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set');
  }
  const message = await trackedCreate('reply_generator', {
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildPrompt(input) }],
  });
  const block = message.content.find((b) => b.type === 'text') as { type: 'text'; text: string } | undefined;
  let text = stripLoneSurrogates(block?.text ?? '').trim();
  if (!text) throw new Error('Empty reply from model');
  // Drop wrapping quotes if the model added them despite the system rule.
  text = text.replace(/^["“”']+|["“”']+$/g, '').trim();
  // Defensive cleanups so a model slip never reaches LinkedIn (RULE 5/8/9):
  // 1. Replace any em/en dash with a comma — it's the AI tell we ban.
  text = text.replace(/\s*[—–]\s*/g, ', ').replace(/,\s*,/g, ',');
  // 1b. Drop a comma placed directly before "y"/"e" (AI tell, RULE 9).
  //     Runs AFTER the dash→comma step so a "word — y algo" rewrite
  //     ("word, y algo") also gets cleaned to "word y algo".
  text = text.replace(/,\s*\b([ye])\b/gi, ' $1');
  // 1c. Capitalize the first letter of a new sentence (after . ! ?) —
  //     the model is told to open lowercase (RULE 5) but sometimes carries
  //     that lowercase across a period ("eso es. y lo que…" → "eso es. Y
  //     lo que…"). Only touches letters AFTER sentence punctuation, so the
  //     intentional lowercase opening word is preserved. \p{Ll} + /u keeps
  //     accented letters working (á→Á).
  text = text.replace(/([.!?])(\s+)(\p{Ll})/gu, (_m, p, sp, ch) => `${p}${sp}${ch.toUpperCase()}`);
  // 2. Strip a stray comma right after the leading mention name so the
  //    reply reads "Name y…" not "Name, y…" (the backend keeps whatever
  //    follows the name verbatim, so the comma must be gone here).
  if (input.commenterName) {
    const n = input.commenterName;
    if (text.slice(0, n.length).toLowerCase() === n.toLowerCase()) {
      const rest = text.slice(n.length).replace(/^\s*,\s*/, ' ');
      text = (n + rest).trim();
    }
  }
  return text.trim();
}
