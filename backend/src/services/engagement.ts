import { Post } from '../models/post';

export function calculateEngagement(post: { likes_count: number; comments_count: number; reposts_count: number }): number {
  return post.likes_count + post.comments_count * 2 + post.reposts_count * 3;
}

export function calculateAverageEngagement(posts: { engagement_score: number }[]): number {
  if (posts.length === 0) return 0;
  const total = posts.reduce((sum, p) => sum + p.engagement_score, 0);
  return total / posts.length;
}

export function calculateOutlierRatio(postEngagement: number, avgEngagement: number): number {
  return avgEngagement > 0 ? postEngagement / avgEngagement : 0;
}

export function isOutlier(ratio: number): boolean {
  return ratio >= 3.0;
}

// Extract hook (first line)
export function extractHook(text: string | null): string | null {
  if (!text) return null;
  const firstLine = text.split(/\r?\n/)[0].trim();
  return firstLine.substring(0, 300);
}

// Count words
export function countWords(text: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Extract hashtags
export function extractHashtags(text: string | null): string[] {
  if (!text) return [];
  const matches = text.match(/#[\w\u00C0-\u024F]+/g);
  return matches || [];
}

// Detect emojis
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/u;

export function hasEmoji(text: string | null): boolean {
  if (!text) return false;
  return emojiRegex.test(text);
}

// Detect CTA
const ctaPatterns = [
  /\bcomenta\b/i, /\bcomparte\b/i, /\bqu[eé] opinas\b/i,
  /\blink en (los )?comentarios\b/i, /\bs[ií]gueme\b/i,
  /\bguarda este post\b/i, /\bcomparte si\b/i,
  /\bcomment\b/i, /\bshare\b/i, /\bwhat do you think\b/i,
  /\bfollow me\b/i, /\blink in (the )?comments?\b/i,
  /\bsave this\b/i, /\brepost\b/i, /\bagree\?\b/i,
  /\blet me know\b/i, /\bwhat['']?s your\b/i,
  /\bdrop a\b/i, /\btag someone\b/i,
];

export function hasCTA(text: string | null): boolean {
  if (!text) return false;
  return ctaPatterns.some((p) => p.test(text));
}

// Simple language detection (heuristic — franc is ESM-only, so we use a simple approach)
const spanishWords = ['que', 'los', 'las', 'del', 'por', 'una', 'con', 'para', 'como', 'más', 'pero', 'este', 'esta', 'cuando', 'también', 'puede', 'todos', 'así', 'nos', 'entre'];
const englishWords = ['the', 'and', 'that', 'have', 'for', 'are', 'with', 'this', 'from', 'your', 'will', 'been', 'they', 'would', 'about', 'could', 'which', 'their', 'than', 'other'];
const frenchWords = ['les', 'des', 'que', 'une', 'pour', 'dans', 'qui', 'est', 'sur', 'avec', 'pas', 'plus', 'par', 'tout', 'mais', 'sont', 'nous', 'comme', 'cette', 'vous'];

export function detectLanguage(text: string | null): string {
  if (!text) return 'unknown';
  const words = text.toLowerCase().split(/\s+/);
  const counts = { es: 0, en: 0, fr: 0 };

  for (const w of words) {
    if (spanishWords.includes(w)) counts.es++;
    if (englishWords.includes(w)) counts.en++;
    if (frenchWords.includes(w)) counts.fr++;
  }

  const max = Math.max(counts.es, counts.en, counts.fr);
  if (max === 0) return 'unknown';
  if (counts.en === max) return 'en';
  if (counts.es === max) return 'es';
  return 'fr';
}

// Enrich a normalized post with computed metadata
export function enrichPost(post: {
  content_text: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
}) {
  const text = post.content_text;
  const hashtags = extractHashtags(text);
  const engagement = calculateEngagement(post);

  return {
    engagement_score: engagement,
    hook_text: extractHook(text),
    word_count: countWords(text),
    has_hashtags: hashtags.length > 0,
    hashtags,
    has_emoji: hasEmoji(text),
    has_call_to_action: hasCTA(text),
    language: detectLanguage(text),
  };
}

// Recalculate outlier status for all posts of a creator
export function recalculateOutliers(posts: { engagement_score: number }[]) {
  const avg = calculateAverageEngagement(posts);
  return posts.map((p) => {
    const ratio = calculateOutlierRatio(p.engagement_score, avg);
    return {
      ...p,
      outlier_ratio: Math.round(ratio * 100) / 100,
      is_outlier: isOutlier(ratio),
    };
  });
}
