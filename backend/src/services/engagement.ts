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

// Character count
export function countChars(text: string | null): number {
  if (!text) return 0;
  return text.length;
}

// Line breaks and spacing analysis
export function countLineBreaks(text: string | null): number {
  if (!text) return 0;
  return (text.match(/\n/g) || []).length;
}

export function hasAggressiveSpacing(text: string | null): boolean {
  if (!text) return false;
  // Aggressive spacing = multiple consecutive blank lines or very short lines with frequent breaks
  const doubleBreaks = (text.match(/\n\s*\n/g) || []).length;
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return false;
  // If >40% of the post is line breaks relative to content lines, it's aggressive
  return doubleBreaks >= 3 || (countLineBreaks(text) / lines.length) > 1.5;
}

// Hook type classification — expanded to minimize "other"
export function classifyHook(text: string | null): string {
  if (!text) return 'other';
  const hook = text.split(/\r?\n/)[0].trim();
  const h = hook.toLowerCase();

  // Question — any hook ending or containing ?
  if (/\?/.test(h)) return 'question';

  // List/framework — "X things/ways/tips" or starts with number + noun
  if (/^\d+\s+\w/i.test(h)) return 'list';

  // Data/statistic — percentages, numbers with context, studies
  if (/^\d|%|\bstat\b|\bdata\b|\bstudy\b|\bestudio\b|\bdato\b|\bresearch\b|\bsurvey\b|\baccording\b|\bsegún\b|\bresult\b/i.test(h)) return 'statistic';

  // Controversy / unpopular opinion
  if (/unpopular opinion|hot take|controversial|impopular|polémic|nobody talks|nadie habla|disagree|i don['']t care what|me da igual|harsh truth|verdad incómoda|i['']ll say it|lo digo/i.test(h)) return 'controversy';

  // Bold statement / provocative assertion
  if (/^(stop|never|always|don['']t|no one|the truth|la verdad|forget|you['']re wrong|estás equivocado|enough|basta|quit|wake up|despierta|this is broken|the problem with|el problema de)/i.test(h)) return 'bold_statement';

  // Prediction / future-oriented
  if (/^(in \d+ years|en \d+ años|the future|el futuro|by 20\d\d|will (become|replace|die|disappear)|prediction|predic|mark my words|va a (cambiar|desaparecer|morir))/i.test(h)) return 'prediction';

  // Confession / vulnerability
  if (/^(i failed|i lost|i was wrong|i quit|i got fired|me equivoqué|fracasé|perdí|me despidieron|truth is|la verdad es|i['']m scared|i almost|confession|confesión|i['']ll be honest|my biggest mistake|mi mayor error)/i.test(h)) return 'confession';

  // How-to / educational
  if (/^(how to|how i|cómo|here['']?s how|the guide|a guide|tutorial|step[- ]by[- ]step|paso a paso|the framework|the system|el sistema|the method|el método|the playbook|learn to|aprende a)/i.test(h)) return 'how_to';

  // POV
  if (/^pov[\s:]/i.test(h) || /^point of view/i.test(h)) return 'pov';

  // Storytelling — personal narratives, temporal markers
  if (/^(i |yo |cuando |when |last (year|month|week)|el (año|mes) pasado|hace \d|one day|un día|yesterday|ayer|the day|2 years ago|this morning|esta mañana|back in|en 20\d\d|it was|era )/i.test(h)) return 'storytelling';

  // Social proof / authority
  if (/^(i['']ve (helped|worked|built|coached|trained|sold|generated|managed)|after \d+|helped \d+|tras \d+|he ayudado|he trabajado|llevo \d+|\d+ (years|años|clients|clientes|companies|empresas))/i.test(h)) return 'social_proof';

  // Challenge / dare
  if (/^(i challenge|i dare|try this|prueba esto|do this for|haz esto|take the|el reto|the challenge|30[- ]day|7[- ]day)/i.test(h)) return 'challenge';

  // Announcement / news
  if (/^(announcing|just launched|big news|exciting|i['']m thrilled|we just|acabamos de|anuncio|gran noticia|new:|nuevo:|just released|breaking|update:|launching)/i.test(h)) return 'announcement';

  // Analogy / metaphor
  if (/^(\w+ (is|are|es) (like|the new|como|el nuevo))|^(imagine|imagina|think of|piensa en)|( is the new | es el nuevo )/i.test(h)) return 'analogy';

  // Contrarian / myth-busting
  if (/^(myth:|mito:|wrong[.!]|lies|mentiras|overrated|sobrevalorado|you don['']t need|no necesitas|forget everything|olvida todo|everything you know about|todo lo que sabes de)/i.test(h)) return 'contrarian';

  // Relatable / humor
  if (/^(me:|yo:|that feeling|esa sensación|when you|cuando tu|nobody:|nadie:|pov:|we all|todos|real talk|raise your hand|levanta la mano)/i.test(h)) return 'relatable';

  // Curiosity gap — things that make you want to read more
  if (/secret|nobody knows|no one told|nadie te dijo|most people|la mayoría|this is why|por esto|what nobody|lo que nadie|the real reason|la verdadera razón|what I wish|you won['']t believe|here['']s what|esto es lo que/i.test(h)) return 'curiosity';

  // Motivational / inspirational
  if (/^(you can|tú puedes|believe|cree en|don['']t give up|no te rindas|keep going|sigue|it['']s possible|es posible|you deserve|mereces|your time|tu momento|dream|sueña|greatness)/i.test(h)) return 'motivational';

  // Observation / insight — "I noticed", "Here's the thing"
  if (/^(i noticed|i realized|here['']s the thing|here['']s what|the thing about|something i|lo que noté|me di cuenta|hay algo que|the best .* i['']ve seen)/i.test(h)) return 'observation';

  // Direct address — "You" focused hooks
  if (/^(you |your |if you|si tú|si tu|dear |querido)/i.test(h)) return 'direct_address';

  return 'other';
}

// Text psychology / tone analysis
export function classifyTone(text: string | null): string {
  if (!text) return 'neutral';
  const lower = text.toLowerCase();

  // Score each tone dimension
  const scores: Record<string, number> = {
    urgency: 0,
    authority: 0,
    social_proof: 0,
    fomo: 0,
    aspirational: 0,
    empathy: 0,
    provocative: 0,
    educational: 0,
    vulnerable: 0,
    humorous: 0,
  };

  // Urgency — time pressure, scarcity
  const urgencyWords = /\b(now|ahora|today|hoy|immediately|ya|hurry|don['']t wait|no esperes|before it['']s too late|antes de que|asap|right now|stop scrolling|para de|deadline|last chance|última oportunidad|limited|limitado|urgent|urgente)\b/gi;
  scores.urgency = (lower.match(urgencyWords) || []).length;

  // Authority — expertise signals, credentials
  const authorityWords = /\b(years of experience|años de experiencia|expert|experto|proven|probado|data shows|los datos|research|investigación|study|estudio|according to|según|framework|sistema|method|método|i['']ve (built|led|managed|created|helped|coached|trained)|he (construido|liderado|creado|ayudado)|certified|certificado)\b/gi;
  scores.authority = (lower.match(authorityWords) || []).length;

  // Social proof — others validate
  const socialProofWords = /\b(everyone|todos|thousands|miles|clients|clientes|companies|empresas|people are|la gente|trending|viral|sold out|agotado|most (successful|popular)|top performers|best sellers|testimonial|case study)\b/gi;
  scores.social_proof = (lower.match(socialProofWords) || []).length;

  // FOMO — fear of missing out
  const fomoWords = /\b(miss out|te lo pierdes|left behind|quedarse atrás|while you|mientras tú|competitors|competencia|falling behind|everyone else|los demás|don['']t miss|no te pierdas|the ones who|los que no|if you['']re not|si no estás|still not|todavía no|already|ya lo)\b/gi;
  scores.fomo = (lower.match(fomoWords) || []).length;

  // Aspirational — dreams, potential, transformation
  const aspirationalWords = /\b(dream|sueño|freedom|libertad|transform|transforma|level up|next level|siguiente nivel|6[- ]figure|7[- ]figure|millonario|wealthy|success|éxito|achieve|lograr|unlock|desbloquea|scale|escala|growth|crecimiento|massive|incredible|increíble|life[- ]changing|que te cambia la vida|potential|potencial)\b/gi;
  scores.aspirational = (lower.match(aspirationalWords) || []).length;

  // Empathy — understanding pain, connection
  const empathyWords = /\b(i understand|entiendo|i know how|sé cómo se siente|been there|he estado ahí|it['']s okay|está bien|struggle|lucha|not alone|no estás solo|hard|difícil|tough|duro|we['']ve all|todos hemos|i feel you|te entiendo|normal|pain|dolor|burnout|overwhelm|agotamiento)\b/gi;
  scores.empathy = (lower.match(empathyWords) || []).length;

  // Provocative — strong opinions, divisive
  const provocativeWords = /\b(wrong|mal|lie|mentira|bs|bullshit|stop|para|toxic|tóxico|overrated|sobrevalorado|nobody|nadie|truth bomb|harsh|duro|brutal|wake up|despierta|unpopular|hot take|fight me|controversial|disagree|hate|odio|tired of|harto de|sick of|enough|basta)\b/gi;
  scores.provocative = (lower.match(provocativeWords) || []).length;

  // Educational — teaching, explaining
  const educationalWords = /\b(here['']s (how|why|what)|esto es|learn|aprende|teach|enseño|tip|consejo|step|paso|guide|guía|example|ejemplo|lesson|lección|explained|explicado|breakdown|desglose|the key|la clave|the difference|la diferencia|understand|entender|know|saber|instead|en vez de|try|prueba|use|usa|avoid|evita)\b/gi;
  scores.educational = (lower.match(educationalWords) || []).length;

  // Vulnerable — personal weakness, failure, emotion
  const vulnerableWords = /\b(failed|fracasé|cried|lloré|scared|miedo|ashamed|vergüenza|lost|perdí|broke|roto|depressed|deprimido|anxiety|ansiedad|imposter|impostor|doubt|duda|fired|despidieron|rejected|rechazado|honest|honesto|vulnerable|admit|admito|confession|confesión|mistake|error|insecure|inseguro)\b/gi;
  scores.vulnerable = (lower.match(vulnerableWords) || []).length;

  // Humorous — jokes, irony, self-deprecation
  const humorousWords = /\b(lol|jaja|haha|😂|🤣|plot twist|spoiler|irony|ironía|joke|chiste|funny|gracioso|literally me|yo literal|😅|ngl|real talk|no cap|bruh)\b/gi;
  scores.humorous = (lower.match(humorousWords) || []).length;

  // Pick the dominant tone
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return 'neutral';
  return sorted[0][0];
}

// Post structure pattern detection
export function classifyStructure(text: string | null): string {
  if (!text) return 'other';
  const lower = text.toLowerCase();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const lineCount = lines.length;

  // Check for list structure (numbered or bulleted items)
  const listLines = lines.filter((l) => /^\s*(\d+[\.\)]\s|[-•]\s|→|✅|❌|▸)/.test(l));
  if (listLines.length >= 3 && listLines.length / lineCount > 0.4) return 'list';

  // Problem → Solution → CTA
  const hasProblem = /problem|issue|struggle|challenge|mistake|error|problema|reto|difícil|wrong/i.test(lower);
  const hasSolution = /solution|instead|here['']?s how|así es como|the fix|try this|do this|la solución/i.test(lower);
  if (hasProblem && hasSolution) return 'problem_solution';

  // Story → Lesson
  const hasStory = /^(i |yo |cuando |when |last |one day|un día)/i.test(lines[0]?.trim() || '');
  const hasLesson = /lesson|takeaway|moraleja|aprendí|learned|the point|lo que aprendí/i.test(lower);
  if (hasStory || (lineCount > 5 && hasLesson)) return 'story_lesson';

  // Short and punchy (under 50 words, few lines)
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 50 && lineCount <= 5) return 'short_punchy';

  // Thread/long-form
  if (wordCount > 300) return 'long_form';

  return 'other';
}

// Engagement ratios
export function commentLikeRatio(comments: number, likes: number): number {
  if (likes === 0) return 0;
  return Math.round((comments / likes) * 1000) / 1000;
}

export function shareLikeRatio(reposts: number, likes: number): number {
  if (likes === 0) return 0;
  return Math.round((reposts / likes) * 1000) / 1000;
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
    char_count: countChars(text),
    line_break_count: countLineBreaks(text),
    has_aggressive_spacing: hasAggressiveSpacing(text),
    hook_type: classifyHook(text),
    post_structure: classifyStructure(text),
    has_hashtags: hashtags.length > 0,
    hashtags,
    has_emoji: hasEmoji(text),
    has_call_to_action: hasCTA(text),
    language: detectLanguage(text),
    comment_like_ratio: commentLikeRatio(post.comments_count, post.likes_count),
    share_like_ratio: shareLikeRatio(post.reposts_count, post.likes_count),
    text_tone: classifyTone(post.content_text),
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
