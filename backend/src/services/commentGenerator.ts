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
  contrarian: string;
  experience_proof: string;
  reframe: string;
}

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

═══ THE 3 COMMENT TYPES ═══

"contrarian" — Challenge or complicate the post's main claim
  - Partial or full disagreement, backed by a specific reason
  - Intellectually bold, not rude
  - End with a question that forces the creator to defend or reconsider

"experience_proof" — Share a personal result that enriches or complicates the post
  - Concrete, specific experience (number, timeframe, outcome)
  - Validates with a twist OR challenges the premise
  - Feels like insider knowledge, not a general anecdote
  - Ends with something that invites others to share theirs

"reframe" — Flip the premise entirely
  - Argue that the framing itself is wrong
  - Offer an alternative lens
  - Ends with an open question that invites debate

═══ GENERAL RULES ═══
- 3–5 lines maximum per comment. No essays.
- NEVER hollow openers: "Great post!", "Love this", "So true!", "Thanks for sharing", "Totalmente de acuerdo", "Muy buen punto"
- NEVER self-promote ("follow me", "check my profile")
- Reference something SPECIFIC from the post — a number, a phrase, a claim — to prove you read it
- Each comment must feel like a DIFFERENT angle, not three rephrasings of the same idea

Return ONLY a JSON object with keys: "contrarian", "experience_proof", "reframe". No markdown fences, no explanation.`;

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
Write 3 comments AS the person described in the voice profile above, reacting to this post.

CRITICAL REMINDERS:
1. Write all 3 comments in ${detectedLang}. Do NOT switch languages mid-comment. Do NOT use English if the post is not in English.
2. Every sentence must sound like it came from the person in the voice profile — not a generic commentator.
3. If you can't tell the voice profile apart from a generic "smart LinkedIn commenter", you're doing it wrong. Re-read the profile and try again.

Return ONLY the JSON object with keys "contrarian", "experience_proof", "reframe". No markdown fences.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned) as GeneratedComments;

  if (!parsed.contrarian || !parsed.experience_proof || !parsed.reframe) {
    throw new Error('Invalid response format from AI');
  }

  return parsed;
}
