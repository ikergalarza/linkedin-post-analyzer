import Anthropic from '@anthropic-ai/sdk';

export interface CommentGenerationInput {
  postContent: string;
  creatorName: string | null;
  creatorHeadline: string | null;
  profile: {
    headline: string | null;
    niche: string | null;
    expertise: string | null;
    tone: string;
    objectives: string | null;
    topics: string[];
  };
}

export interface GeneratedComments {
  personal_experience: string;
  provocative_question: string;
  plot_twist: string;
}

const SYSTEM_PROMPT = `You are an expert LinkedIn commenter. Your goal is to write comments that make the commenter VISIBLE and MEMORABLE in the conversations of influential creators.

RULES FOR OUTSTANDING COMMENTS:
1. 3-5 lines maximum — long enough to add value, short enough to be read
2. NEVER generic ("Great post!", "Love this!", "So true!", "Thanks for sharing!")
3. Must add genuine value: a unique perspective, a real experience, or a provocative question
4. Should make people want to click on the commenter's profile
5. Use the commenter's expertise to create a unique angle that nobody else would have
6. Match the tone preference but adapt naturally to the post's context
7. Write in the SAME LANGUAGE as the post content
8. Feel authentic and human — not AI-generated or formulaic

COMMENT STRATEGY PATTERNS THAT WORK:
- Share a brief, specific personal experience that validates OR contrasts the post's point
- Ask a question that makes the creator WANT to respond (not a basic question, a thought-provoking one)
- Offer a "plot twist" perspective that reframes the post's idea in an unexpected way
- Reference a specific detail from the post to show you actually read it
- End with something that invites further conversation

Return your response as a JSON object with exactly these 3 keys:
- "personal_experience": A comment sharing a relevant personal experience or case study
- "provocative_question": A comment with a thought-provoking question that challenges or extends the idea
- "plot_twist": A comment offering an unexpected perspective or contrarian take`;

export async function generateComments(input: CommentGenerationInput): Promise<GeneratedComments> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey });

  const profileContext = [
    input.profile.headline && `Headline: ${input.profile.headline}`,
    input.profile.niche && `Niche: ${input.profile.niche}`,
    input.profile.expertise && `Expertise: ${input.profile.expertise}`,
    `Tone preference: ${input.profile.tone}`,
    input.profile.objectives && `Objectives: ${input.profile.objectives}`,
    input.profile.topics.length > 0 && `Topics they dominate: ${input.profile.topics.join(', ')}`,
  ].filter(Boolean).join('\n');

  const userMessage = `COMMENTER PROFILE:
${profileContext}

POST BY: ${input.creatorName || 'Unknown'}${input.creatorHeadline ? ` (${input.creatorHeadline})` : ''}

POST CONTENT:
${input.postContent}

Generate 3 comment variants. Return ONLY the JSON object, no markdown wrapping.`;

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

  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const parsed = JSON.parse(cleaned) as GeneratedComments;

  if (!parsed.personal_experience || !parsed.provocative_question || !parsed.plot_twist) {
    throw new Error('Invalid response format from AI');
  }

  return parsed;
}
