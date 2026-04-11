import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Uses Claude to assign 2-4 concise topic tags to a LinkedIn creator
 * based on their headline and a sample of their post texts.
 * Returns consistent, short labels suitable for filtering (e.g. "B2B Sales", "SaaS", "AI/Tech").
 */
export async function tagCreatorNiche(headline: string, postTexts: string[]): Promise<string[]> {
  const samplePosts = postTexts.slice(0, 5).map((t, i) => `Post ${i + 1}: ${t.slice(0, 200)}`).join('\n\n');

  const prompt = `You are classifying a LinkedIn creator's content niche.

Headline: "${headline || 'Not provided'}"

Sample posts:
${samplePosts || 'No posts available'}

Return a JSON array of 2-4 short topic tags that best describe this creator's niche.
Rules:
- Each tag must be 2-3 words maximum (e.g. "B2B Sales", "SaaS Growth", "AI/Tech", "Personal Brand", "Leadership", "Cold Outreach", "Marketing", "Entrepreneurship", "Career Advice", "Content Creation", "Venture Capital", "Product Management")
- Use consistent, reusable labels (not one-off descriptions)
- Return ONLY the JSON array, nothing else

Example output: ["B2B Sales", "Cold Outreach", "SaaS"]`;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 128,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
      return parsed.slice(0, 4);
    }
    return [];
  } catch (err) {
    console.error('[nicheTagging] Error:', err);
    return [];
  }
}
