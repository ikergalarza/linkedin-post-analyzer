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

const SYSTEM_PROMPT = `You are an expert LinkedIn comment strategist. Your job is to write comments that:
1. Make the commenter VISIBLE and MEMORABLE in the conversation
2. Spark genuine debate — the creator and other readers should feel compelled to respond
3. Sound completely human and authentic to the commenter's voice
4. Add real intellectual value, not hollow validation

THE 3 COMMENT TYPES YOU MUST PRODUCE:

"contrarian" — Challenge or complicate the post's main claim
  - Take a position that partially or fully disagrees, backed by a specific reason
  - DO NOT be rude, be intellectually bold
  - End with a question or statement that forces the creator to defend or reconsider
  - Example structure: "[Acknowledge their point] but in my experience [specific counter]. [Provoking question]?"

"experience_proof" — Share a personal result that enriches or complicates the post
  - A concrete, specific experience (number, timeframe, outcome) that either validates with a twist OR challenges the premise
  - Must feel like insider knowledge, not a general anecdote
  - End with something that invites others to share theirs
  - Example structure: "[Specific result I got doing X]. The part [creator] doesn't mention is [Y]. Anyone else seeing this?"

"reframe" — Flip the premise entirely
  - Don't argue the point — argue that the entire framing is wrong
  - Offer an alternative lens that makes people think "wait, that's a better way to see this"
  - End with an open question that invites debate
  - Example structure: "Interesting take but I'd flip the question: instead of [their frame], what if the real issue is [new frame]? [Open question]?"

RULES:
- 3–5 lines maximum per comment. No essays.
- NEVER: "Great post!", "Love this", "So true!", "Thanks for sharing", or any hollow opener
- NEVER self-promote explicitly ("follow me", "check my profile")
- Reference something SPECIFIC from the post — a number, a phrase, a claim — to show you read it
- Write in the SAME LANGUAGE as the post
- Adapt to the commenter's voice profile but never at the cost of sounding generic

Return ONLY a JSON object with keys: "contrarian", "experience_proof", "reframe". No markdown fences.`;

export async function generateComments(input: CommentGenerationInput): Promise<GeneratedComments> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey });

  const voiceLines: string[] = [];
  if (input.profile.headline) voiceLines.push(`Who they are: ${input.profile.headline}`);
  if (input.profile.voice_style) voiceLines.push(`Their writing style: ${input.profile.voice_style}`);
  else if (input.profile.tone) voiceLines.push(`Tone preference: ${input.profile.tone}`);
  if (input.profile.worldview) voiceLines.push(`Their worldview / lens: ${input.profile.worldview}`);
  else if (input.profile.expertise) voiceLines.push(`Expertise: ${input.profile.expertise}`);
  if (input.profile.signature_moves) voiceLines.push(`Their signature commenting moves: ${input.profile.signature_moves}`);
  if (input.profile.avoid) voiceLines.push(`What they never do: ${input.profile.avoid}`);

  const profileContext = voiceLines.length > 0
    ? `COMMENTER VOICE PROFILE:\n${voiceLines.join('\n')}`
    : 'COMMENTER VOICE PROFILE: No profile configured — use a neutral, intellectually bold voice.';

  const userMessage = `${profileContext}

POST BY: ${input.creatorName || 'Unknown'}${input.creatorHeadline ? ` — ${input.creatorHeadline}` : ''}

POST CONTENT:
${input.postContent}

Generate 3 comment variants that spark debate. Return ONLY the JSON object, no markdown.`;

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
