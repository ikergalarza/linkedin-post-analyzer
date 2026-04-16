import Anthropic from '@anthropic-ai/sdk';

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
- 3–5 lines maximum per comment. No essays.
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

  const client = new Anthropic({ apiKey });

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

  const detectedLang = detectLanguageHint(input.postContent);

  const userMessage = `${profileContext}

═══ POST TO COMMENT ON ═══
AUTHOR: ${input.creatorName || 'Unknown'}${input.creatorHeadline ? ` — ${input.creatorHeadline}` : ''}
DETECTED POST LANGUAGE: ${detectedLang}

POST CONTENT:
${input.postContent}
═════════════════════════

TASK:
Write 9 comments AS the person described in the voice profile above, reacting to this post.

CRITICAL REMINDERS:
1. Write all 9 comments in ${detectedLang}. Do NOT switch languages mid-comment. Do NOT use English if the post is not in English.
2. Every sentence must sound like it came from the person in the voice profile — not a generic commentator.
3. If you can't tell the voice profile apart from a generic "smart LinkedIn commenter", you're doing it wrong. Re-read the profile and try again.

Return ONLY the JSON object with keys: ${COMMENT_KEYS.map(k => `"${k}"`).join(', ')}. No markdown fences.`;

  const response = await client.messages.create({
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
