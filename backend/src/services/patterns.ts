import { Post } from '../models/post';
import { classifyTone } from './engagement';

interface PatternInsight {
  type: string;
  title: string;
  value: string;
  detail: string;
}

export function detectPatterns(allPosts: Post[]): PatternInsight[] {
  const insights: PatternInsight[] = [];
  const outliers = allPosts.filter((p) => p.is_outlier);
  const nonOutliers = allPosts.filter((p) => !p.is_outlier);

  if (outliers.length === 0) return insights;

  // 1. Most common content type in outliers
  const typeCounts: Record<string, number> = {};
  for (const p of outliers) {
    typeCounts[p.content_type] = (typeCounts[p.content_type] || 0) + 1;
  }
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  if (topType) {
    const pct = Math.round((topType[1] / outliers.length) * 100);
    insights.push({
      type: 'content_type',
      title: 'Dominant content type in outliers',
      value: `${pct}% ${topType[0]}`,
      detail: `${topType[1]} out of ${outliers.length} outlier posts are ${topType[0]} content.`,
    });
  }

  // 2. Word count comparison
  const avgWordsOutlier = avg(outliers.map((p) => p.word_count));
  const avgWordsNormal = avg(nonOutliers.map((p) => p.word_count));
  if (avgWordsNormal > 0) {
    const diff = Math.round(((avgWordsOutlier - avgWordsNormal) / avgWordsNormal) * 100);
    const direction = diff > 0 ? 'more' : 'fewer';
    insights.push({
      type: 'word_count',
      title: 'Outlier length vs average',
      value: `${Math.abs(diff)}% ${direction} words`,
      detail: `Outliers average ${Math.round(avgWordsOutlier)} words vs ${Math.round(avgWordsNormal)} for regular posts.`,
    });
  }

  // 3. Hook type analysis
  const hookTypeCounts: Record<string, { count: number; totalEngagement: number }> = {};
  for (const p of allPosts) {
    const ht = p.hook_type || 'other';
    if (!hookTypeCounts[ht]) hookTypeCounts[ht] = { count: 0, totalEngagement: 0 };
    hookTypeCounts[ht].count++;
    hookTypeCounts[ht].totalEngagement += p.engagement_score;
  }
  const hookTypeEntries = Object.entries(hookTypeCounts)
    .filter(([k]) => k !== 'other')
    .map(([type, data]) => ({
      type,
      avgEng: data.count > 0 ? data.totalEngagement / data.count : 0,
      count: data.count,
    }))
    .sort((a, b) => b.avgEng - a.avgEng);

  if (hookTypeEntries.length > 0) {
    const best = hookTypeEntries[0];
    const worst = hookTypeEntries[hookTypeEntries.length - 1];
    const ratio = worst.avgEng > 0 ? Math.round(best.avgEng / worst.avgEng * 10) / 10 : 0;
    insights.push({
      type: 'hook_type',
      title: 'Best performing hook type',
      value: formatHookType(best.type),
      detail: ratio > 0
        ? `"${formatHookType(best.type)}" hooks average ${Math.round(best.avgEng)} engagement (${ratio}x more than "${formatHookType(worst.type)}").`
        : `"${formatHookType(best.type)}" hooks average ${Math.round(best.avgEng)} engagement across ${best.count} posts.`,
    });
  }

  // 4. Post structure analysis
  const structureCounts: Record<string, { count: number; totalEngagement: number }> = {};
  for (const p of allPosts) {
    const ps = p.post_structure || 'other';
    if (!structureCounts[ps]) structureCounts[ps] = { count: 0, totalEngagement: 0 };
    structureCounts[ps].count++;
    structureCounts[ps].totalEngagement += p.engagement_score;
  }
  const structEntries = Object.entries(structureCounts)
    .filter(([k]) => k !== 'other')
    .map(([structure, data]) => ({
      structure,
      avgEng: data.count > 0 ? data.totalEngagement / data.count : 0,
      count: data.count,
    }))
    .sort((a, b) => b.avgEng - a.avgEng);

  if (structEntries.length > 0) {
    const best = structEntries[0];
    insights.push({
      type: 'post_structure',
      title: 'Best performing structure',
      value: formatStructure(best.structure),
      detail: `"${formatStructure(best.structure)}" posts average ${Math.round(best.avgEng)} engagement (${best.count} posts).`,
    });
  }

  // 5. Aggressive spacing impact
  const spacingPosts = allPosts.filter((p) => p.has_aggressive_spacing);
  const noSpacingPosts = allPosts.filter((p) => !p.has_aggressive_spacing);
  if (spacingPosts.length >= 3 && noSpacingPosts.length >= 3) {
    const avgSpacing = avg(spacingPosts.map((p) => p.engagement_score));
    const avgNoSpacing = avg(noSpacingPosts.map((p) => p.engagement_score));
    const diff = avgNoSpacing > 0 ? Math.round(((avgSpacing - avgNoSpacing) / avgNoSpacing) * 100) : 0;
    if (Math.abs(diff) > 10) {
      insights.push({
        type: 'spacing',
        title: 'Aggressive line spacing impact',
        value: `${diff > 0 ? '+' : ''}${diff}% engagement`,
        detail: `Posts with aggressive spacing average ${Math.round(avgSpacing)} vs ${Math.round(avgNoSpacing)} without.`,
      });
    }
  }

  // 6. Comment-to-like ratio (debate indicator)
  const highDebate = allPosts
    .filter((p) => p.comment_like_ratio > 0.1 && p.likes_count > 0)
    .sort((a, b) => b.comment_like_ratio - a.comment_like_ratio);
  const lowDebate = allPosts
    .filter((p) => p.comment_like_ratio <= 0.1 && p.comment_like_ratio >= 0 && p.likes_count > 0);
  if (highDebate.length >= 2 && lowDebate.length >= 2) {
    const avgHighDebate = avg(highDebate.map((p) => p.engagement_score));
    const avgLowDebate = avg(lowDebate.map((p) => p.engagement_score));
    insights.push({
      type: 'debate',
      title: 'High-debate posts performance',
      value: `${highDebate.length} debate-driven posts`,
      detail: `Posts with high comment/like ratio (>10%) average ${Math.round(avgHighDebate)} eng vs ${Math.round(avgLowDebate)} for low-debate.`,
    });
  }

  // 7. Hashtag usage
  const outlierHashtagRate = outliers.filter((p) => p.has_hashtags).length / outliers.length;
  const normalHashtagRate = nonOutliers.length > 0
    ? nonOutliers.filter((p) => p.has_hashtags).length / nonOutliers.length
    : 0;
  insights.push({
    type: 'hashtags',
    title: 'Hashtag usage in outliers',
    value: `${Math.round(outlierHashtagRate * 100)}% use hashtags`,
    detail: `Outliers: ${Math.round(outlierHashtagRate * 100)}% vs Regular: ${Math.round(normalHashtagRate * 100)}%.`,
  });

  // 8. CTA usage
  const outlierCTARate = outliers.filter((p) => p.has_call_to_action).length / outliers.length;
  const normalCTARate = nonOutliers.length > 0
    ? nonOutliers.filter((p) => p.has_call_to_action).length / nonOutliers.length
    : 0;
  insights.push({
    type: 'cta',
    title: 'Call-to-action in outliers',
    value: `${Math.round(outlierCTARate * 100)}% include CTA`,
    detail: `Outliers: ${Math.round(outlierCTARate * 100)}% vs Regular: ${Math.round(normalCTARate * 100)}%.`,
  });

  // 9. Best day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts: Record<number, number> = {};
  for (const p of outliers) {
    if (p.published_at) {
      const day = new Date(p.published_at).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  }
  const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  if (topDay) {
    insights.push({
      type: 'best_day',
      title: 'Best day for outliers',
      value: dayNames[parseInt(topDay[0])],
      detail: `${topDay[1]} outlier posts were published on ${dayNames[parseInt(topDay[0])]}.`,
    });
  }

  // 10. Emoji usage
  const outlierEmojiRate = outliers.filter((p) => p.has_emoji).length / outliers.length;
  insights.push({
    type: 'emoji',
    title: 'Emoji usage in outliers',
    value: `${Math.round(outlierEmojiRate * 100)}% use emojis`,
    detail: `${Math.round(outlierEmojiRate * 100)}% of outlier posts contain emojis.`,
  });

  // 11. Top hooks
  const hooks = outliers
    .filter((p) => p.hook_text)
    .map((p) => p.hook_text!)
    .slice(0, 5);
  if (hooks.length > 0) {
    insights.push({
      type: 'hooks',
      title: 'Top hooks from outliers',
      value: `${hooks.length} hooks`,
      detail: hooks.join(' | '),
    });
  }

  return insights;
}

export function getCrossCreatorPatterns(allPosts: Post[]) {
  const outliers = allPosts.filter((p) => p.is_outlier);
  const nonOutliers = allPosts.filter((p) => !p.is_outlier);

  // Content type distribution across all outliers
  const typeCounts: Record<string, number> = {};
  for (const p of outliers) {
    typeCounts[p.content_type] = (typeCounts[p.content_type] || 0) + 1;
  }

  // Average word count
  const avgWords = avg(outliers.map((p) => p.word_count));

  // CTA rate
  const ctaRate = outliers.length > 0
    ? outliers.filter((p) => p.has_call_to_action).length / outliers.length
    : 0;

  // Hook type distribution across outliers
  const hookTypeCounts: Record<string, number> = {};
  for (const p of outliers) {
    const ht = p.hook_type || 'other';
    hookTypeCounts[ht] = (hookTypeCounts[ht] || 0) + 1;
  }

  // Structure distribution across outliers
  const structureCounts: Record<string, number> = {};
  for (const p of outliers) {
    const ps = p.post_structure || 'other';
    structureCounts[ps] = (structureCounts[ps] || 0) + 1;
  }

  // Common traits of top outliers
  const topOutliers = outliers
    .sort((a, b) => b.outlier_ratio - a.outlier_ratio)
    .slice(0, Math.min(10, outliers.length));

  const commonTraits: string[] = [];
  if (topOutliers.length >= 3) {
    // Most common hook type
    const topHookTypes: Record<string, number> = {};
    for (const p of topOutliers) {
      const ht = p.hook_type || 'other';
      topHookTypes[ht] = (topHookTypes[ht] || 0) + 1;
    }
    const dominantHook = Object.entries(topHookTypes).sort((a, b) => b[1] - a[1])[0];
    if (dominantHook && dominantHook[1] / topOutliers.length >= 0.3) {
      commonTraits.push(`${Math.round(dominantHook[1] / topOutliers.length * 100)}% use "${formatHookType(dominantHook[0])}" hooks`);
    }

    // Most common structure
    const topStructures: Record<string, number> = {};
    for (const p of topOutliers) {
      const ps = p.post_structure || 'other';
      topStructures[ps] = (topStructures[ps] || 0) + 1;
    }
    const dominantStruct = Object.entries(topStructures).sort((a, b) => b[1] - a[1])[0];
    if (dominantStruct && dominantStruct[1] / topOutliers.length >= 0.3) {
      commonTraits.push(`${Math.round(dominantStruct[1] / topOutliers.length * 100)}% follow "${formatStructure(dominantStruct[0])}" structure`);
    }

    // Average length
    const avgLen = avg(topOutliers.map((p) => p.word_count));
    commonTraits.push(`Average ${Math.round(avgLen)} words`);

    // Best day
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const topDays: Record<number, number> = {};
    for (const p of topOutliers) {
      if (p.published_at) {
        const day = new Date(p.published_at).getDay();
        topDays[day] = (topDays[day] || 0) + 1;
      }
    }
    const bestDay = Object.entries(topDays).sort((a, b) => b[1] - a[1])[0];
    if (bestDay && bestDay[1] / topOutliers.length >= 0.25) {
      commonTraits.push(`${Math.round(bestDay[1] / topOutliers.length * 100)}% published on ${dayNames[parseInt(bestDay[0])]}`);
    }
  }

  // Frequency vs engagement by creator
  const creatorStats: Record<string, { posts: number; totalEngagement: number; firstDate?: Date; lastDate?: Date }> = {};
  for (const p of allPosts) {
    if (!creatorStats[p.creator_id]) {
      creatorStats[p.creator_id] = { posts: 0, totalEngagement: 0 };
    }
    creatorStats[p.creator_id].posts++;
    creatorStats[p.creator_id].totalEngagement += p.engagement_score;
    if (p.published_at) {
      const d = new Date(p.published_at);
      if (!creatorStats[p.creator_id].firstDate || d < creatorStats[p.creator_id].firstDate!) {
        creatorStats[p.creator_id].firstDate = d;
      }
      if (!creatorStats[p.creator_id].lastDate || d > creatorStats[p.creator_id].lastDate!) {
        creatorStats[p.creator_id].lastDate = d;
      }
    }
  }

  const frequencyCorrelation = Object.values(creatorStats)
    .filter((s) => s.firstDate && s.lastDate && s.posts >= 5)
    .map((s) => {
      const weeks = Math.max(1, (s.lastDate!.getTime() - s.firstDate!.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return {
        postsPerWeek: Math.round((s.posts / weeks) * 10) / 10,
        avgEngagement: Math.round(s.totalEngagement / s.posts),
      };
    });

  // Tone analysis — compute dynamically to avoid stale DB values
  // Classify each post's tone live
  const getTone = (p: Post) => {
    const live = classifyTone(p.content_text);
    return live !== 'neutral' ? live : (p.text_tone || 'neutral');
  };

  // Outlier tones
  const outlierTones: Record<string, { count: number; totalEng: number }> = {};
  for (const p of outliers) {
    const tone = getTone(p);
    if (!outlierTones[tone]) outlierTones[tone] = { count: 0, totalEng: 0 };
    outlierTones[tone].count++;
    outlierTones[tone].totalEng += p.engagement_score;
  }

  // Normal post tones (for comparison)
  const normalTones: Record<string, { count: number; totalEng: number }> = {};
  for (const p of nonOutliers) {
    const tone = getTone(p);
    if (!normalTones[tone]) normalTones[tone] = { count: 0, totalEng: 0 };
    normalTones[tone].count++;
    normalTones[tone].totalEng += p.engagement_score;
  }

  // Build comparative breakdown
  const allToneKeys = new Set([...Object.keys(outlierTones), ...Object.keys(normalTones)]);
  const toneComparison = [...allToneKeys]
    .filter((k) => k !== 'neutral')
    .map((tone) => {
      const o = outlierTones[tone] || { count: 0, totalEng: 0 };
      const n = normalTones[tone] || { count: 0, totalEng: 0 };
      return {
        tone,
        outlier_count: o.count,
        outlier_avg_engagement: o.count > 0 ? Math.round(o.totalEng / o.count) : 0,
        outlier_pct: outliers.length > 0 ? Math.round((o.count / outliers.length) * 100) : 0,
        normal_count: n.count,
        normal_avg_engagement: n.count > 0 ? Math.round(n.totalEng / n.count) : 0,
        normal_pct: nonOutliers.length > 0 ? Math.round((n.count / nonOutliers.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.outlier_avg_engagement - a.outlier_avg_engagement);

  // Neutral stats
  const neutralOutlierPct = outliers.length > 0
    ? Math.round(((outlierTones['neutral']?.count || 0) / outliers.length) * 100)
    : 0;

  // Generate interpretation
  const interpretation = generateToneInterpretation(toneComparison, outliers.length, nonOutliers.length, neutralOutlierPct);

  // Analyze actual text patterns in outlier content
  const textPatterns = analyzeTextPatterns(outliers, nonOutliers);

  return {
    total_outliers: outliers.length,
    content_type_distribution: typeCounts,
    hook_type_distribution: hookTypeCounts,
    structure_distribution: structureCounts,
    tone_comparison: toneComparison,
    tone_interpretation: interpretation,
    neutral_outlier_pct: neutralOutlierPct,
    avg_word_count: Math.round(avgWords),
    cta_rate: Math.round(ctaRate * 100),
    common_traits: commonTraits,
    frequency_correlation: frequencyCorrelation,
    text_patterns: textPatterns,
  };
}

// Stopwords to exclude from keyword analysis (EN + ES)
const STOPWORDS = new Set([
  // English
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','shall','should','may','might','must','can','could',
  'i','me','my','we','us','our','you','your','he','him','his','she','her','it','its',
  'they','them','their','this','that','these','those','what','which','who','whom',
  'and','but','or','nor','not','no','so','if','then','than','too','very','just',
  'about','above','after','again','all','also','am','any','as','at','back','because',
  'before','between','both','by','come','day','de','down','each','even','every',
  'first','for','from','get','go','got','here','how','in','into','know','like',
  'make','many','more','most','much','new','now','of','on','one','only','or','other',
  'out','over','own','people','per','really','right','said','same','say','see','some',
  'still','take','tell','there','thing','think','time','to','two','up','use','want',
  'way','well','when','where','why','with','work','year','don\'t','didn\'t','won\'t',
  'isn\'t','aren\'t','wasn\'t','weren\'t','doesn\'t','it\'s','i\'m','you\'re','they\'re',
  'we\'re','i\'ve','you\'ve','we\'ve','they\'ve','i\'ll','you\'ll','he\'ll','she\'ll',
  'that\'s','let','ve','re','ll','s','t','m','d',
  // Spanish
  'el','la','los','las','un','una','unos','unas','de','del','al','en','con','por',
  'para','es','son','fue','ser','estar','que','se','no','si','lo','le','su','sus',
  'me','te','nos','mi','tu','yo','ya','más','muy','como','pero','sin','sobre',
  'entre','hasta','desde','donde','cuando','todo','esta','este','ese','eso','aquí',
  'hay','tiene','hacer','puede','cada','porque','también','bien','o','ni','e','y',
  'era','han','he','ha','hemos','tiene','hay','va','algo','nada','otro','otra',
  'otros','muchos','poco','tan','después','antes','solo','mucho',
]);

function analyzeTextPatterns(outliers: Post[], nonOutliers: Post[]) {
  const texts = outliers.map((p) => p.content_text || '').filter((t) => t.length > 10);
  const normalTexts = nonOutliers.map((p) => p.content_text || '').filter((t) => t.length > 10);

  if (texts.length < 3) {
    return {
      opening_patterns: [],
      closing_patterns: [],
      recurring_phrases: [],
      power_words: [],
      formatting_style: null,
      writing_analysis: 'Not enough outlier text data for analysis.',
    };
  }

  // ---- 1. Opening line patterns ----
  const openingLines = texts.map((t) => {
    const firstLine = t.split('\n').find((l) => l.trim().length > 0) || '';
    return firstLine.trim();
  }).filter((l) => l.length > 5);

  // Classify openings by pattern
  const openingPatterns: Record<string, { count: number; examples: string[] }> = {};
  for (const line of openingLines) {
    const pattern = classifyOpeningPattern(line);
    if (!openingPatterns[pattern]) openingPatterns[pattern] = { count: 0, examples: [] };
    openingPatterns[pattern].count++;
    if (openingPatterns[pattern].examples.length < 3) {
      openingPatterns[pattern].examples.push(line.substring(0, 80) + (line.length > 80 ? '...' : ''));
    }
  }

  // ---- 2. Closing line patterns ----
  const closingLines = texts.map((t) => {
    const lines = t.split('\n').filter((l) => l.trim().length > 0);
    return (lines[lines.length - 1] || '').trim();
  }).filter((l) => l.length > 3);

  const closingPatterns: Record<string, { count: number; examples: string[] }> = {};
  for (const line of closingLines) {
    const pattern = classifyClosingPattern(line);
    if (!closingPatterns[pattern]) closingPatterns[pattern] = { count: 0, examples: [] };
    closingPatterns[pattern].count++;
    if (closingPatterns[pattern].examples.length < 3) {
      closingPatterns[pattern].examples.push(line.substring(0, 80) + (line.length > 80 ? '...' : ''));
    }
  }

  // ---- 3. Recurring 2-3 word phrases (ngrams) ----
  const outlierNgrams = extractNgrams(texts);
  const normalNgrams = extractNgrams(normalTexts);

  // Find phrases that appear more in outliers than normal
  const recurringPhrases = Object.entries(outlierNgrams)
    .filter(([phrase, count]) => count >= 3)
    .map(([phrase, count]) => {
      const normalCount = normalNgrams[phrase] || 0;
      const outlierRate = count / texts.length;
      const normalRate = normalTexts.length > 0 ? normalCount / normalTexts.length : 0;
      return { phrase, count, outlier_pct: Math.round(outlierRate * 100), normal_pct: Math.round(normalRate * 100), overindex: normalRate > 0 ? Math.round((outlierRate / normalRate) * 10) / 10 : 99 };
    })
    .sort((a, b) => b.overindex - a.overindex)
    .slice(0, 15);

  // ---- 4. Power words (high-impact single words) ----
  const outlierWords = extractWordFrequency(texts);
  const normalWords = extractWordFrequency(normalTexts);

  const powerWords = Object.entries(outlierWords)
    .filter(([word, count]) => count >= 4 && word.length >= 4)
    .map(([word, count]) => {
      const normalCount = normalWords[word] || 0;
      const outlierRate = count / texts.length;
      const normalRate = normalTexts.length > 0 ? normalCount / normalTexts.length : 0;
      return { word, count, outlier_pct: Math.round(outlierRate * 100), normal_pct: Math.round(normalRate * 100), overindex: normalRate > 0 ? Math.round((outlierRate / normalRate) * 10) / 10 : 99 };
    })
    .filter((w) => w.overindex > 1.2 || w.outlier_pct >= 20)
    .sort((a, b) => b.overindex - a.overindex)
    .slice(0, 20);

  // ---- 5. Formatting / writing style ----
  const avgSentenceLen = texts.map((t) => {
    const sentences = t.split(/[.!?]+/).filter((s) => s.trim().length > 3);
    return sentences.length > 0 ? t.split(/\s+/).length / sentences.length : 0;
  });
  const avgSentenceLenOutlier = avg(avgSentenceLen);

  const normalAvgSentenceLen = normalTexts.map((t) => {
    const sentences = t.split(/[.!?]+/).filter((s) => s.trim().length > 3);
    return sentences.length > 0 ? t.split(/\s+/).length / sentences.length : 0;
  });
  const avgSentenceLenNormal = avg(normalAvgSentenceLen);

  const avgLineBreaksOutlier = avg(outliers.map((p) => p.line_break_count || 0));
  const avgLineBreaksNormal = avg(nonOutliers.map((p) => p.line_break_count || 0));

  const avgWordCountOutlier = avg(outliers.map((p) => p.word_count));
  const avgWordCountNormal = avg(nonOutliers.map((p) => p.word_count));

  const emojiRateOutlier = outliers.filter((p) => p.has_emoji).length / Math.max(1, outliers.length);
  const emojiRateNormal = nonOutliers.filter((p) => p.has_emoji).length / Math.max(1, nonOutliers.length);

  const hashtagRateOutlier = outliers.filter((p) => p.has_hashtags).length / Math.max(1, outliers.length);
  const hashtagRateNormal = nonOutliers.filter((p) => p.has_hashtags).length / Math.max(1, nonOutliers.length);

  const questionRateOutlier = texts.filter((t) => t.includes('?')).length / Math.max(1, texts.length);
  const questionRateNormal = normalTexts.filter((t) => t.includes('?')).length / Math.max(1, normalTexts.length);

  const formattingStyle = {
    avg_sentence_length: { outlier: Math.round(avgSentenceLenOutlier * 10) / 10, normal: Math.round(avgSentenceLenNormal * 10) / 10 },
    avg_line_breaks: { outlier: Math.round(avgLineBreaksOutlier * 10) / 10, normal: Math.round(avgLineBreaksNormal * 10) / 10 },
    avg_word_count: { outlier: Math.round(avgWordCountOutlier), normal: Math.round(avgWordCountNormal) },
    emoji_rate: { outlier: Math.round(emojiRateOutlier * 100), normal: Math.round(emojiRateNormal * 100) },
    hashtag_rate: { outlier: Math.round(hashtagRateOutlier * 100), normal: Math.round(hashtagRateNormal * 100) },
    question_rate: { outlier: Math.round(questionRateOutlier * 100), normal: Math.round(questionRateNormal * 100) },
  };

  // ---- 6. Synthesize text-based analysis ----
  const analysisLines: string[] = [];

  // Opening analysis
  const topOpening = Object.entries(openingPatterns).sort((a, b) => b[1].count - a[1].count);
  if (topOpening.length > 0) {
    const top = topOpening[0];
    const topPct = Math.round((top[1].count / texts.length) * 100);
    analysisLines.push(`Opening pattern: ${topPct}% of outliers open with a "${top[0]}". Examples: "${top[1].examples[0]}"`);
    if (topOpening.length >= 2) {
      const second = topOpening[1];
      analysisLines[analysisLines.length - 1] += `. Second most common: "${second[0]}" (${Math.round((second[1].count / texts.length) * 100)}%).`;
    }
  }

  // Closing analysis
  const topClosing = Object.entries(closingPatterns).sort((a, b) => b[1].count - a[1].count);
  if (topClosing.length > 0) {
    const top = topClosing[0];
    const topPct = Math.round((top[1].count / texts.length) * 100);
    analysisLines.push(`Closing pattern: ${topPct}% of outliers close with a "${top[0]}". Example: "${top[1].examples[0]}"`);
  }

  // Recurring phrases
  const overindexedPhrases = recurringPhrases.filter((p) => p.overindex > 1.5).slice(0, 5);
  if (overindexedPhrases.length > 0) {
    analysisLines.push(`Key phrases that appear more in outliers: ${overindexedPhrases.map((p) => `"${p.phrase}" (${p.outlier_pct}% of outliers vs ${p.normal_pct}% normal)`).join(', ')}.`);
  }

  // Power words
  const topPowerWords = powerWords.filter((w) => w.overindex > 1.5).slice(0, 8);
  if (topPowerWords.length > 0) {
    analysisLines.push(`Power words overrepresented in outliers: ${topPowerWords.map((w) => `"${w.word}" (${w.overindex}x more frequent)`).join(', ')}.`);
  }

  // Writing style diff
  if (Math.abs(avgSentenceLenOutlier - avgSentenceLenNormal) > 2) {
    const shorter = avgSentenceLenOutlier < avgSentenceLenNormal;
    analysisLines.push(`Sentence style: outliers use ${shorter ? 'shorter' : 'longer'} sentences (avg ${Math.round(avgSentenceLenOutlier)} words/sentence vs ${Math.round(avgSentenceLenNormal)} in normal posts). ${shorter ? 'Punchy, broken-up writing gets more engagement.' : 'Deeper, more developed sentences resonate.'}`);
  }

  if (avgLineBreaksOutlier > avgLineBreaksNormal * 1.3) {
    analysisLines.push(`Formatting: outliers use ${Math.round((avgLineBreaksOutlier / Math.max(1, avgLineBreaksNormal) - 1) * 100)}% more line breaks — white space and visual rhythm matter.`);
  }

  const wordDiff = avgWordCountNormal > 0 ? Math.round(((avgWordCountOutlier - avgWordCountNormal) / avgWordCountNormal) * 100) : 0;
  if (Math.abs(wordDiff) > 15) {
    analysisLines.push(`Post length: outliers average ${Math.round(avgWordCountOutlier)} words (${wordDiff > 0 ? `${wordDiff}% longer` : `${Math.abs(wordDiff)}% shorter`} than normal). ${wordDiff > 0 ? 'In-depth content performs best.' : 'Concise content wins.'}`);
  }

  if (Math.abs(questionRateOutlier - questionRateNormal) > 10) {
    analysisLines.push(`Questions: ${Math.round(questionRateOutlier * 100)}% of outliers contain questions vs ${Math.round(questionRateNormal * 100)}% in normal posts — ${questionRateOutlier > questionRateNormal ? 'asking questions drives engagement.' : 'statements outperform questions.'}`);
  }

  return {
    opening_patterns: topOpening.map(([pattern, data]) => ({
      pattern,
      count: data.count,
      pct: Math.round((data.count / texts.length) * 100),
      examples: data.examples,
    })),
    closing_patterns: topClosing.map(([pattern, data]) => ({
      pattern,
      count: data.count,
      pct: Math.round((data.count / texts.length) * 100),
      examples: data.examples,
    })),
    recurring_phrases: recurringPhrases,
    power_words: powerWords,
    formatting_style: formattingStyle,
    writing_analysis: analysisLines.join('\n\n'),
  };
}

function classifyOpeningPattern(line: string): string {
  const l = line.toLowerCase().trim();
  if (l.endsWith('?') || l.includes('?')) return 'Question';
  if (/^\d|^[0-9]/.test(l)) return 'Number/Stat';
  if (/^(i |i\'m |i\'ve |i was |i had |i used |i remember|i quit|i lost|i failed|i got)/i.test(l)) return 'Personal "I" statement';
  if (/^(you |you\'re |you\'ve |your )/i.test(l)) return 'Direct "You" address';
  if (/^(stop |don\'t |never |no one |nobody |forget |quit |avoid )/i.test(l)) return 'Negative/Prohibition';
  if (/^(here|here\'s|here are|these|this is how|this is why|this is what)/i.test(l)) return 'Direct reveal ("Here is...")';
  if (/^(the |a |an )?(truth|problem|reality|secret|reason|thing|mistake|myth)/i.test(l)) return 'Truth/Revelation opener';
  if (/^(most |everyone |nobody |people |they |99%|90%|80%)/i.test(l)) return '"Most people..." generalization';
  if (/^(if |when |imagine |picture |what if)/i.test(l)) return 'Hypothetical/Conditional';
  if (/^(how |why |what |where |who )/i.test(l)) return 'Question word';
  if (/^(un |una |el |la |no |si |yo |tu |es |lo )/i.test(l)) return 'Spanish opener';
  if (l.length < 30) return 'Short punchy statement';
  return 'Declarative statement';
}

function classifyClosingPattern(line: string): string {
  const l = line.toLowerCase().trim();
  if (l.endsWith('?')) return 'Ends with question (CTA)';
  if (/follow|like|comment|share|repost|save|subscribe|tag|dm/i.test(l)) return 'Explicit CTA (follow/like/share)';
  if (/agree|disagree|thoughts|opinion|what do you/i.test(l)) return 'Opinion request';
  if (/👇|⬇|below|comment below|drop/i.test(l)) return 'Comment CTA (👇)';
  if (/#\w+/.test(l)) return 'Hashtag line';
  if (/💡|🔥|🚀|✅|❤|🙏|🎯|💪|👊/i.test(l)) return 'Emoji emphasis';
  if (/ps:|p\.s\.|ps\./i.test(l)) return 'P.S. postscript';
  if (l.length < 25) return 'Short closing statement';
  if (/remember|don\'t forget|lesson|takeaway|bottom line|key|moral/i.test(l)) return 'Lesson/Takeaway';
  return 'Statement ending';
}

function extractNgrams(texts: string[]): Record<string, number> {
  const ngrams: Record<string, number> = {};
  for (const text of texts) {
    const words = text.toLowerCase().replace(/[^\w\sáéíóúñü']/g, '').split(/\s+/).filter((w) => w.length >= 2 && !STOPWORDS.has(w));
    // Bigrams
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (words[i].length >= 3 || words[i + 1].length >= 3) {
        ngrams[bigram] = (ngrams[bigram] || 0) + 1;
      }
    }
    // Trigrams
    for (let i = 0; i < words.length - 2; i++) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      ngrams[trigram] = (ngrams[trigram] || 0) + 1;
    }
  }
  return ngrams;
}

function extractWordFrequency(texts: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const text of texts) {
    const words = text.toLowerCase().replace(/[^\w\sáéíóúñü']/g, '').split(/\s+/).filter((w) => w.length >= 3 && !STOPWORDS.has(w));
    const seen = new Set<string>(); // Count once per post
    for (const w of words) {
      if (!seen.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
        seen.add(w);
      }
    }
  }
  return freq;
}

/**
 * Generate a per-post explanation of why an outlier post worked.
 * Called for each post in the top outliers list.
 */
export function generatePostExplanation(post: {
  content_type: string;
  hook_type?: string;
  post_structure?: string;
  text_tone?: string;
  word_count?: number;
  has_emoji?: boolean;
  has_hashtags?: boolean;
  has_call_to_action?: boolean;
  comment_like_ratio?: number;
  share_like_ratio?: number;
  outlier_ratio: number;
  engagement_score: number;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  content_text?: string | null;
}): string {
  const reasons: string[] = [];

  // Ratio context
  if (post.outlier_ratio >= 10) {
    reasons.push(`Extraordinary performance at ${post.outlier_ratio}x the creator's average`);
  } else if (post.outlier_ratio >= 5) {
    reasons.push(`Strong viral performance at ${post.outlier_ratio}x the creator's average`);
  } else {
    reasons.push(`Solid outlier at ${post.outlier_ratio}x the creator's average`);
  }

  // Content format
  const formatInsights: Record<string, string> = {
    carousel: 'Carousels drive high saves & shares — the swipe format keeps people engaged',
    video: 'Video content gets priority in the LinkedIn algorithm and higher watch-time engagement',
    image: 'Visual content stops the scroll — images increase engagement vs text-only',
    document: 'Document/PDF posts get high engagement as they provide downloadable value',
    poll: 'Polls drive massive engagement through low-friction interaction',
    text_only: 'Pure text post — the writing alone carried this without visual support',
  };
  if (formatInsights[post.content_type]) {
    reasons.push(formatInsights[post.content_type]);
  }

  // Hook type
  if (post.hook_type && post.hook_type !== 'other') {
    const hookInsights: Record<string, string> = {
      question: 'Opens with a question — triggers curiosity and invites comments',
      statistic: 'Leads with data — establishes credibility immediately',
      controversy: 'Controversial opener — polarizing content drives debate and shares',
      storytelling: 'Storytelling hook — personal narratives create emotional connection',
      bold_statement: 'Bold claim upfront — grabs attention by being direct',
      curiosity: 'Curiosity gap — makes people need to read more',
      confession: 'Vulnerability in the opening — people connect with authenticity',
      contrarian: 'Goes against the grain — contrarian views spark strong reactions',
      social_proof: 'Social proof opener — numbers and results build instant trust',
      how_to: 'Practical "how-to" — promises actionable value immediately',
      list: 'List/framework format — clear structure promises organized value',
      pov: 'Strong POV — takes a definitive stance that resonates',
      prediction: 'Prediction — forward-looking content gets attention',
      challenge: 'Challenge-based — provokes the reader to take action',
      relatable: 'Relatable situation — people share content that mirrors their experience',
      motivational: 'Motivational tone — aspirational content gets shared widely',
      observation: 'Keen observation — insightful take on something everyone notices but doesn\'t articulate',
      analogy: 'Analogy — makes complex ideas accessible through comparison',
      announcement: 'News/announcement — novelty captures attention',
      direct_address: 'Directly speaks to the reader — creates personal connection',
    };
    if (hookInsights[post.hook_type]) {
      reasons.push(hookInsights[post.hook_type]);
    }
  }

  // Comment ratio = debate
  if ((post.comment_like_ratio || 0) > 0.15) {
    reasons.push(`High debate factor (${Math.round((post.comment_like_ratio || 0) * 100)}% comment/like ratio) — this sparked real conversation`);
  }

  // Share ratio = viral spread
  if ((post.share_like_ratio || 0) > 0.1) {
    reasons.push(`High share rate (${Math.round((post.share_like_ratio || 0) * 100)}% share/like ratio) — people wanted others to see this`);
  }

  // Tone
  if (post.text_tone && post.text_tone !== 'neutral') {
    const toneInsights: Record<string, string> = {
      provocative: 'Provocative tone triggers emotional reactions and debate',
      vulnerable: 'Vulnerability creates deep emotional connection and empathy',
      aspirational: 'Aspirational tone — people share content that represents who they want to be',
      urgency: 'Urgency tone — creates FOMO and immediate action',
      humorous: 'Humor makes content memorable and highly shareable',
      empathy: 'Empathetic tone — people feel understood and engage to share their own experience',
      authority: 'Authority tone — expert positioning builds trust and credibility',
      educational: 'Educational value — people save and share content that teaches them something',
    };
    if (toneInsights[post.text_tone]) {
      reasons.push(toneInsights[post.text_tone]);
    }
  }

  // Length factor
  if ((post.word_count || 0) > 200) {
    reasons.push('Long-form depth — detailed content shows expertise and gets saved');
  } else if ((post.word_count || 0) < 50 && (post.word_count || 0) > 0) {
    reasons.push('Short and punchy — concise delivery that\'s easy to consume and share');
  }

  // Text-level analysis
  const text = post.content_text || '';
  if (text.length > 20) {
    const lineCount = text.split('\n').filter((l) => l.trim()).length;
    if (lineCount > 10) reasons.push('High-density formatting with many short lines — easy to scan and read');

    const questionCount = (text.match(/\?/g) || []).length;
    if (questionCount >= 3) reasons.push(`Uses ${questionCount} questions — keeps the reader engaged and thinking`);

    const listItems = (text.match(/^[\s]*[-•→✅🔹\d+\.]/gm) || []).length;
    if (listItems >= 3) reasons.push(`List-based format with ${listItems} items — structured, scannable content`);

    if (/\n\n/.test(text) && lineCount > 5) reasons.push('Uses aggressive spacing between ideas — improves readability on mobile');
  }

  return reasons.slice(0, 5).join('. ') + '.';
}

function formatHookType(type: string): string {
  const labels: Record<string, string> = {
    question: 'Question',
    statistic: 'Data/Statistic',
    controversy: 'Controversy',
    pov: 'POV',
    storytelling: 'Storytelling',
    list: 'List/Framework',
    bold_statement: 'Bold Statement',
    curiosity: 'Curiosity Gap',
    prediction: 'Prediction',
    confession: 'Confession',
    how_to: 'How-to',
    social_proof: 'Social Proof',
    challenge: 'Challenge',
    announcement: 'Announcement',
    analogy: 'Analogy',
    contrarian: 'Contrarian',
    relatable: 'Relatable',
    motivational: 'Motivational',
    observation: 'Observation',
    direct_address: 'Direct Address',
    other: 'Other',
  };
  return labels[type] || type;
}

function formatStructure(structure: string): string {
  const labels: Record<string, string> = {
    list: 'List/Framework',
    problem_solution: 'Problem > Solution',
    story_lesson: 'Story > Lesson',
    short_punchy: 'Short & Punchy',
    long_form: 'Long-form',
    other: 'Other',
  };
  return labels[structure] || structure;
}

function generateToneInterpretation(
  toneComparison: { tone: string; outlier_count: number; outlier_avg_engagement: number; outlier_pct: number; normal_count: number; normal_avg_engagement: number; normal_pct: number }[],
  totalOutliers: number,
  totalNormal: number,
  neutralOutlierPct: number,
): string {
  const lines: string[] = [];

  // Top performing tones by engagement
  const topByEng = toneComparison.filter((t) => t.outlier_count >= 2).slice(0, 3);
  if (topByEng.length > 0) {
    const names = topByEng.map((t) => `${formatToneLabel(t.tone)} (${t.outlier_avg_engagement.toLocaleString()} avg)`);
    lines.push(`The tones with highest engagement in outliers are: ${names.join(', ')}.`);
  }

  // Tones that are more prevalent in outliers vs normal
  const outlierSkewed = toneComparison.filter((t) => t.outlier_pct > t.normal_pct + 5 && t.outlier_count >= 2);
  if (outlierSkewed.length > 0) {
    const skewedNames = outlierSkewed.map((t) => `${formatToneLabel(t.tone)} (${t.outlier_pct}% in outliers vs ${t.normal_pct}% in normal)`);
    lines.push(`Tones more common in outliers: ${skewedNames.join(', ')}.`);
  }

  // Tones that perform better in normal posts (surprising)
  const normalSkewed = toneComparison.filter((t) => t.normal_pct > t.outlier_pct + 5 && t.normal_count >= 2);
  if (normalSkewed.length > 0) {
    const names = normalSkewed.map((t) => formatToneLabel(t.tone));
    lines.push(`Tones more common in regular posts: ${names.join(', ')} — these don't drive outlier performance.`);
  }

  // Neutral commentary
  if (neutralOutlierPct > 50) {
    lines.push(`${neutralOutlierPct}% of outliers have neutral tone — this means the content succeeds through value/topic rather than emotional triggers.`);
  } else if (neutralOutlierPct < 30) {
    lines.push(`Only ${neutralOutlierPct}% of outliers are neutral — emotional/psychological triggers play a strong role in viral performance.`);
  }

  // Best engagement tone
  if (topByEng.length > 0 && topByEng[0].outlier_avg_engagement > 0) {
    const best = topByEng[0];
    const worst = toneComparison.filter((t) => t.outlier_count >= 2).slice(-1)[0];
    if (worst && worst.outlier_avg_engagement > 0) {
      const ratio = Math.round(best.outlier_avg_engagement / worst.outlier_avg_engagement * 10) / 10;
      if (ratio > 1.5) {
        lines.push(`"${formatToneLabel(best.tone)}" posts get ${ratio}x more engagement than "${formatToneLabel(worst.tone)}" posts.`);
      }
    }
  }

  if (lines.length === 0) {
    lines.push('Not enough data to generate meaningful tone insights. Add more creators and refresh data.');
  }

  return lines.join(' ');
}

function formatToneLabel(tone: string): string {
  const labels: Record<string, string> = {
    urgency: 'Urgency', authority: 'Authority', social_proof: 'Social Proof',
    fomo: 'FOMO', aspirational: 'Aspirational', empathy: 'Empathy',
    provocative: 'Provocative', educational: 'Educational', vulnerable: 'Vulnerable',
    humorous: 'Humorous', neutral: 'Neutral',
  };
  return labels[tone] || tone;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
