import Anthropic from '@anthropic-ai/sdk';
import { trackedCreate } from './claudeClient';
import { stripLoneSurrogates } from '../utils/sanitizeText';

export interface CommentGenerationInput {
  postContent: string;
  creatorName: string | null;
  creatorHeadline: string | null;
  profile: {
    headline: string | null;
    voice_style: string | null;
    worldview: string | null;
    signature_moves: string | null;
    avoid: string | null;
    // legacy fallbacks
    tone?: string;
    expertise?: string | null;
  };
}

export interface GeneratedComments {
  reinforce: string;
  contrarian_data: string;
  contrarian_premise: string;
  contrarian_survivorship: string;
  reframe: string;
  add_missing: string;
  steal_phrase: string;
  warm_supportive: string;
  better_question: string;
}

const COMMENT_KEYS = [
  'reinforce', 'contrarian_data', 'contrarian_premise', 'contrarian_survivorship',
  'reframe', 'add_missing', 'steal_phrase', 'warm_supportive', 'better_question',
] as const;

const SYSTEM_PROMPT = `You are writing LinkedIn comments AS a specific person, in their voice. You are NOT a generic AI assistant generating "good comments" — you are impersonating a real commenter whose voice profile is provided.

═══ TWO NON-NEGOTIABLE RULES ═══

RULE 1 — LANGUAGE MATCHING (CRITICAL):
Write every comment in the EXACT SAME LANGUAGE as the post content.
- Spanish post → Spanish comment (NO English words mixed in)
- English post → English comment
- French post → French comment
- If the post is in Spanish, do NOT translate to English. Do NOT write "Hey, great insight" in a Spanish thread.
- Match the register too: if the post is informal Spanish ("tío", "vale"), your comment should feel natural in that register.

RULE 2 — VOICE PROFILE IS LAW:
The commenter voice profile below is not a suggestion. It is HARD CONSTRAINTS.
- If the profile says the voice is "direct, no filler, skeptical" → every comment must feel direct, skeptical, zero filler.
- If the profile lists signature moves (e.g., "cite a specific number", "end with a sharp question") → use those moves.
- If the profile lists things to avoid (e.g., "never use corporate jargon", "no emojis") → NEVER violate those.
- If the worldview is "growth comes from friction, not frameworks" → your comments must reflect that lens.
- Before writing each comment, silently check: would this specific person actually write this sentence? If not, rewrite.

═══ THE 9 COMMENT TYPES ═══

"reinforce" — Reinforce the key point
  - Validate the post's main idea with your own experience or a nuance that makes it stronger
  - You don't contradict — you amplify. Add a layer the author didn't mention.
  - Tone: confident agreement, personal, concrete
  - End with a sharp insight that extends the original point

"contrarian_data" — Challenge the data
  - Question a specific metric or number from the post: correlation vs. causation, small sample, missing context
  - Cite a real-feeling counter-figure or benchmark (e.g. "In 120+ outbound campaigns I've run, this tactic converted under 2%")
  - Tone: analytical, skeptical, numbers-first
  - End by asking the creator for THEIR data, not their opinion

"contrarian_premise" — Challenge the premise
  - Go to the root. Question whether the category, model, or mental framework the author proposes is real or well-constructed
  - Don't argue the conclusion — argue the foundation it sits on
  - Tone: intellectual, sharp, no filler
  - End with a question that makes the reader reconsider the whole frame

"contrarian_survivorship" — Survivorship bias
  - The case in the post is the exception, not the rule
  - Works especially well on "inspirational story" posts — point out all the people who did the same thing and failed
  - Tone: respectful but firm, grounded in probability
  - End with "how many tried X and didn't get that outcome?"

"reframe" — Reframe the debate
  - Accept the point but move the conversation to a different angle (from product to distribution, from technique to ICP, from conditions to hiring)
  - You're not disagreeing — you're saying "the interesting question is actually over here"
  - Tone: intellectually playful, slightly provocative
  - End with an open question that redirects the debate

"add_missing" — Add a missing point
  - "I agree, but I'd add a 5th." Respect the post's structure and extend it.
  - Works great on posts with lists, frameworks, or numbered points
  - Tone: collaborative, additive, like a co-author
  - Your addition should feel like it obviously belongs in the original post

"steal_phrase" — Steal a phrase
  - Pick a specific phrase from the post and use it as the anchor for your comment
  - Works because the author feels heard — you're engaging with their exact words
  - Tone: conversational, specific, grounded in the text
  - Build your whole comment around that one stolen phrase

"warm_supportive" — Warm & supportive
  - For posts where contrarian doesn't fit (good news, events, culture initiatives, milestones)
  - Short, genuine, no hollow praise. Never "Great post!" or "Totalmente de acuerdo"
  - Tone: warm but not sycophantic — like a friend who's genuinely happy for you
  - 2-3 lines max. Say something specific about WHY it matters, not just that it's great.

"better_question" — Ask a better question
  - Instead of stating an opinion, ask something uncomfortable but legitimate
  - The question should generate a thread without direct confrontation
  - Tone: curious, slightly provocative, genuinely interested in the answer
  - One killer question > three mediocre observations

═══ GENERAL RULES ═══
- HARD LENGTH LIMIT: each comment MUST be ≤ 280 characters (downstream system constraint — anything longer gets truncated).
- 3–4 lines maximum per comment. No essays. Tight beats verbose.
- NEVER hollow openers: "Great post!", "Love this", "So true!", "Thanks for sharing", "Totalmente de acuerdo", "Muy buen punto"
- NEVER self-promote ("follow me", "check my profile")
- Reference something SPECIFIC from the post — a number, a phrase, a claim — to prove you read it
- Each comment must feel like a DIFFERENT angle. If two comments sound similar, you failed.
- The contrarian types MUST sound noticeably different in tone. "contrarian_data" is numbers-driven, "contrarian_premise" is philosophical, "contrarian_survivorship" is statistical/probabilistic.

Return ONLY a JSON object with keys: ${COMMENT_KEYS.map(k => `"${k}"`).join(', ')}. No markdown fences, no explanation.`;

function detectLanguageHint(text: string): string {
  if (!text || text.trim().length < 10) return 'the same language as the post (detect from content)';
  const sample = text.toLowerCase().slice(0, 600);

  const scores: Record<string, number> = { Spanish: 0, English: 0, French: 0, Portuguese: 0, Italian: 0, German: 0 };

  const es = /\b(que|para|pero|con|una|los|las|más|está|esto|cómo|porque|cuando|también|hacer|tiene|muy|año|años|hola|gracias|aquí|así)\b/g;
  const en = /\b(the|and|that|this|with|from|have|your|what|when|which|about|would|there|their|these|through|because|people|still)\b/g;
  const fr = /\b(que|pour|avec|dans|cette|nous|vous|être|sont|mais|leur|tout|plus|comme|parce|sans|aussi|faire)\b/g;
  const pt = /\b(que|para|não|com|uma|dos|mais|está|isso|como|porque|quando|também|fazer|muito|ano|anos|olá|obrigado|aqui)\b/g;
  const it = /\b(che|per|con|una|del|più|però|sono|come|quando|anche|fare|molto|anno|anni|ciao|grazie|così)\b/g;
  const de = /\b(und|der|die|das|ist|nicht|ein|eine|mit|auch|sind|aber|noch|sich|wird|haben|werden)\b/g;

  scores.Spanish = (sample.match(es) || []).length;
  scores.English = (sample.match(en) || []).length;
  scores.French = (sample.match(fr) || []).length;
  scores.Portuguese = (sample.match(pt) || []).length;
  scores.Italian = (sample.match(it) || []).length;
  scores.German = (sample.match(de) || []).length;

  if (/[ñ¿¡]/.test(sample)) scores.Spanish += 3;
  if (/ç/.test(sample) && !/ñ/.test(sample)) scores.French += 2;
  if (/ã|õ/.test(sample)) scores.Portuguese += 3;
  if (/ß|ü|ö|ä/.test(sample)) scores.German += 2;

  let best: string = 'the same language as the post';
  let bestScore = 2;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = lang;
    }
  }
  return best;
}

export async function generateComments(input: CommentGenerationInput): Promise<GeneratedComments> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const voiceLines: string[] = [];
  if (input.profile.headline) voiceLines.push(`IDENTITY: ${input.profile.headline}`);
  if (input.profile.voice_style) voiceLines.push(`WRITING STYLE (must match exactly): ${input.profile.voice_style}`);
  else if (input.profile.tone) voiceLines.push(`TONE: ${input.profile.tone}`);
  if (input.profile.worldview) voiceLines.push(`WORLDVIEW / LENS (filter every take through this): ${input.profile.worldview}`);
  else if (input.profile.expertise) voiceLines.push(`EXPERTISE: ${input.profile.expertise}`);
  if (input.profile.signature_moves) voiceLines.push(`SIGNATURE MOVES (use these): ${input.profile.signature_moves}`);
  if (input.profile.avoid) voiceLines.push(`FORBIDDEN — NEVER DO THIS: ${input.profile.avoid}`);

  const profileContext = voiceLines.length > 0
    ? `═══ COMMENTER VOICE PROFILE — THESE ARE HARD CONSTRAINTS ═══\n${voiceLines.join('\n')}\n═══════════════════════════════════════════════════════════`
    : '═══ COMMENTER VOICE PROFILE ═══\nNo profile configured — use a neutral, intellectually bold voice.';

  // Sanitise the post content before forwarding it to Claude. LinkedIn
  // scrapes can contain orphan UTF-16 surrogates which produce invalid JSON
  // bodies and the Anthropic API rejects them with a 400. Real emojis stay
  // intact — only orphan halves are stripped.
  const safePostContent = stripLoneSurrogates(input.postContent || '');
  const detectedLang = detectLanguageHint(safePostContent);

  const userMessage = `${profileContext}

═══ POST TO COMMENT ON ═══
AUTHOR: ${input.creatorName || 'Unknown'}${input.creatorHeadline ? ` — ${input.creatorHeadline}` : ''}
DETECTED POST LANGUAGE: ${detectedLang}

POST CONTENT:
${safePostContent}
═════════════════════════

TASK:
Write 9 comments AS the person described in the voice profile above, reacting to this post.

CRITICAL REMINDERS:
1. Write all 9 comments in ${detectedLang}. Do NOT switch languages mid-comment. Do NOT use English if the post is not in English.
2. Every sentence must sound like it came from the person in the voice profile — not a generic commentator.
3. If you can't tell the voice profile apart from a generic "smart LinkedIn commenter", you're doing it wrong. Re-read the profile and try again.

Return ONLY the JSON object with keys: ${COMMENT_KEYS.map(k => `"${k}"`).join(', ')}. No markdown fences.`;

  const response = await trackedCreate('comment_generator_9angles', {
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned) as GeneratedComments;

  for (const key of COMMENT_KEYS) {
    if (!parsed[key]) throw new Error(`Missing comment type: ${key}`);
  }

  return parsed;
}

/**
 * Generates N short supportive comments (warm or reinforce-style) in the
 * post's language. Used by the Accounts → Google Chat flow, where the
 * goal is to give teammates copy-pasteable cheerleader lines that won't
 * damage their professional image. Short by design: real teammates won't
 * read paragraphs and won't post anything risky.
 *
 * Compared to generateComments (9 angles for the Network feature):
 * - Only "reinforce" + "warm_supportive" registers — never contrarian.
 * - 2 lines max per comment (≤180 chars enforced downstream).
 * - N is FIXED at 5 (Iker, 2026-07-29): the team grew, so there are enough
 *   people to place five, and rotating 3-5 just left teammates without a line.
 *
 * The prompt below carries the rules from docs/skills/brand-voice.md §3 and
 * §7 (the comment/reply voice). The old one produced generic filler AND broke
 * our own punctuation rules — the 2026-07-29 batch shipped an em dash, which
 * §3 forbids outright. The single biggest fix: each of these five is posted by
 * a DIFFERENT human, so they must not read like five outputs of one template.
 */
export async function generateSupportiveComments(
  input: CommentGenerationInput,
  count: number
): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  const n = Math.max(3, Math.min(5, Math.round(count)));

  const voiceLines: string[] = [];
  if (input.profile.headline) voiceLines.push(`IDENTITY: ${input.profile.headline}`);
  if (input.profile.voice_style) voiceLines.push(`WRITING STYLE: ${input.profile.voice_style}`);
  if (input.profile.worldview) voiceLines.push(`WORLDVIEW: ${input.profile.worldview}`);
  if (input.profile.signature_moves) voiceLines.push(`SIGNATURE MOVES: ${input.profile.signature_moves}`);
  if (input.profile.avoid) voiceLines.push(`AVOID: ${input.profile.avoid}`);

  const profileContext = voiceLines.length > 0
    ? `COMMENTER VOICE PROFILE:\n${voiceLines.join('\n')}`
    : 'COMMENTER VOICE PROFILE: neutral, warm, professional.';

  const safePostContent = stripLoneSurrogates(input.postContent || '');
  const detectedLang = detectLanguageHint(safePostContent);

  const system = `You write short, warm LinkedIn comments AS the person described in the voice profile.

═══ NON-NEGOTIABLE RULES ═══

LANGUAGE: every comment in ${detectedLang}. Never switch languages. Never mix English into a Spanish thread.

REGISTER: every comment is SUPPORTIVE — either "reinforce" (extend the post's idea with one extra layer) or "warm_supportive" (genuinely happy for the author). NEVER contrarian, NEVER skeptical, NEVER provocative. These are colleagues backing each other up — they will not risk their professional image with edgy takes.

LENGTH: MAX 2 lines, ≤ 180 characters each. Tight beats verbose. One sharp sentence is better than three filler ones. And vary the length across the ${n}: if they are all the same size they read as one template.

★ FIVE DIFFERENT PEOPLE WILL POST THESE. This is the rule everything else hangs off. Each comment is pasted by a DIFFERENT human being into the same thread, under their own name and face. If a reader scrolls the comments and feels they were all written by the same hand, the whole thing backfires and looks coordinated. So vary the register, the length, the opening move and the level of formality between them. One can be almost telegraphic. Another can be a small personal aside.

★ PUNCTUATION OF A REAL PERSON (this is non-negotiable, our brand voice forbids it):
- NEVER an em dash or en dash. No "—", no "–". Use a full stop, a comma or a colon. This rule has been broken before and it is the single clearest tell of AI writing.
- NEVER a comma directly before "y" or "e". A comma before "pero" is fine.
- No markdown of any kind. No bold, no bullets, no numbered lists.
- Do not open with an emoji. At most ONE emoji, in at most one of the ${n}, and only if it lands naturally.

★ SOUND HUMAN, NOT POLISHED. In ONE or at most TWO of the ${n}, stretch a vowel on the word carrying the emphasis, the way people actually type: "muuuy", "totaaal", "buenííísimo", "ciertooo", "graciaas". Doing it in all of them is try-hard and worse than not doing it at all.

NO HOLLOW OPENERS: never "Great post!", "Love this", "Totalmente de acuerdo", "Qué bueno", "Muy buen punto", "Gran post", "Me encanta", "Brutal". Reference something SPECIFIC from the post (a number, a phrase, a claim) so it's clear you actually read it.

★ NEVER OUT YOURSELVES. These people work at the same company as the author. Do not write anything only an insider would know, do not say "el equipo", "en casa", "nosotros" or anything that reveals coordination, and never speak on the company's behalf. Each one is a normal contact reacting to a post.

★ NO NUMBERS OR FACTS THAT ARE NOT IN THE POST. Never invent a figure, a client, a company or a personal story with specifics that could be checked. If a comment needs a personal angle, keep it unfalsifiable ("me ha pasado algo parecido") rather than inventing a case.

VARIETY: each comment must come from a genuinely different angle. If two sound similar, rewrite. Mix:
- One that reinforces the main point with a concrete personal angle
- One that picks up a specific phrase or number FROM the post and quotes it back
- One that is warm and human ("me ha pasado lo mismo", "esto resuena")
- One that adds ONE layer the post did not cover, without contradicting it
- One short and punchy, a single line reaction
Never repeat the same angle, and do not let two comments latch onto the same word of the post.

Return ONLY a JSON object: { "comments": ["...", "...", ...] } with exactly ${n} strings. No markdown fences, no explanation.`;

  const userMessage = `${profileContext}

POST AUTHOR: ${input.creatorName || 'Unknown'}${input.creatorHeadline ? ` — ${input.creatorHeadline}` : ''}
POST LANGUAGE: ${detectedLang}

POST CONTENT:
${safePostContent}

TASK: Write exactly ${n} supportive comments (mix of reinforce + warm), each ≤ 180 chars, each ≤ 2 lines, all in ${detectedLang}. No risky takes — these go to colleagues who don't want to dent their professional image.

Return JSON only: { "comments": ["...", "..."] }`;

  const response = await trackedCreate('comment_generator_supportive', {
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned) as { comments: unknown };
  if (!Array.isArray(parsed.comments)) throw new Error('Supportive generator returned no comments array');

  const out = parsed.comments
    .filter((c): c is string => typeof c === 'string')
    .map((c) => c.trim())
    .filter(Boolean);
  if (out.length === 0) throw new Error('Supportive generator returned an empty list');
  return out.slice(0, n);
}
