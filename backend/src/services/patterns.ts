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

  // Generate global AI analysis
  const globalAnalysis = generateGlobalAnalysis(
    outliers, nonOutliers, typeCounts, hookTypeCounts, structureCounts,
    toneComparison, neutralOutlierPct, avgWords, ctaRate, commonTraits,
  );

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
    global_analysis: globalAnalysis,
  };
}

function generateGlobalAnalysis(
  outliers: Post[],
  nonOutliers: Post[],
  typeCounts: Record<string, number>,
  hookTypeCounts: Record<string, number>,
  structureCounts: Record<string, number>,
  toneComparison: { tone: string; outlier_count: number; outlier_avg_engagement: number; outlier_pct: number; normal_pct: number }[],
  neutralPct: number,
  avgWords: number,
  ctaRate: number,
  commonTraits: string[],
): string {
  if (outliers.length < 3) return 'Not enough outlier data to generate a meaningful analysis.';

  const sections: string[] = [];

  // 1. Content format analysis
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const topFormat = typeEntries[0];
  if (topFormat) {
    const pct = Math.round((topFormat[1] / outliers.length) * 100);
    const normalTypeCounts: Record<string, number> = {};
    for (const p of nonOutliers) normalTypeCounts[p.content_type] = (normalTypeCounts[p.content_type] || 0) + 1;
    const normalPct = nonOutliers.length > 0 ? Math.round(((normalTypeCounts[topFormat[0]] || 0) / nonOutliers.length) * 100) : 0;

    if (pct > normalPct + 10) {
      sections.push(`Content format matters: ${pct}% of outliers are "${topFormat[0]}" vs ${normalPct}% in normal posts. This format clearly resonates more with the audience.`);
    } else if (typeEntries.length > 1) {
      sections.push(`Outliers come from diverse formats: ${typeEntries.slice(0, 3).map(([t, c]) => `${t} (${Math.round((c / outliers.length) * 100)}%)`).join(', ')}. No single format dominates.`);
    }
  }

  // 2. Hook strategy
  const hookEntries = Object.entries(hookTypeCounts).filter(([k]) => k !== 'other').sort((a, b) => b[1] - a[1]);
  if (hookEntries.length >= 2) {
    const top2 = hookEntries.slice(0, 2);
    const top2Pct = Math.round(((top2[0][1] + top2[1][1]) / outliers.length) * 100);
    sections.push(`Hook strategy: the top 2 hook types ("${formatHookType(top2[0][0])}" and "${formatHookType(top2[1][0])}") account for ${top2Pct}% of outliers. ${top2Pct > 50 ? 'There\'s a clear winning formula here.' : 'Successful hooks are diverse — variety works.'}`);
  }

  // 3. Structure insight
  const structEntries = Object.entries(structureCounts).filter(([k]) => k !== 'other').sort((a, b) => b[1] - a[1]);
  if (structEntries.length >= 1) {
    const topStruct = structEntries[0];
    const pct = Math.round((topStruct[1] / outliers.length) * 100);
    if (pct >= 30) {
      sections.push(`Structure: "${formatStructure(topStruct[0])}" is the dominant structure in ${pct}% of outliers.`);
    }
  }

  // 4. Length insight
  const avgWordsNormal = nonOutliers.length > 0 ? nonOutliers.reduce((s, p) => s + p.word_count, 0) / nonOutliers.length : 0;
  const lengthDiff = avgWordsNormal > 0 ? Math.round(((avgWords - avgWordsNormal) / avgWordsNormal) * 100) : 0;
  if (Math.abs(lengthDiff) > 15) {
    sections.push(`Post length: outliers average ${Math.round(avgWords)} words (${lengthDiff > 0 ? `${lengthDiff}% longer` : `${Math.abs(lengthDiff)}% shorter`} than normal posts). ${lengthDiff > 0 ? 'Longer, more in-depth content tends to go viral.' : 'Short, punchy content outperforms.'}`);
  }

  // 5. Emotional triggers
  const emotionalTones = toneComparison.filter((t) => t.outlier_pct > t.normal_pct + 3);
  if (emotionalTones.length > 0 && neutralPct < 70) {
    sections.push(`Emotional triggers: ${emotionalTones.map((t) => `"${formatToneLabel(t.tone)}" (+${t.outlier_pct - t.normal_pct}pp vs normal)`).join(', ')} are overrepresented in outliers. Leveraging these tones increases the chance of going viral.`);
  } else if (neutralPct >= 70) {
    sections.push(`Interestingly, ${neutralPct}% of outliers use a neutral tone — going viral here is about delivering high-value content rather than emotional manipulation.`);
  }

  // 6. CTA & engagement pattern
  if (ctaRate > 0.4) {
    sections.push(`Call-to-action: ${Math.round(ctaRate * 100)}% of outliers include a CTA, suggesting that explicitly asking for engagement works.`);
  } else if (ctaRate < 0.15) {
    sections.push(`Surprisingly, only ${Math.round(ctaRate * 100)}% of outliers include a CTA — the content itself drives engagement without needing to ask for it.`);
  }

  // 7. Engagement quality
  const avgCommentRatioOutlier = outliers.length > 0
    ? outliers.reduce((s, p) => s + (p.comment_like_ratio || 0), 0) / outliers.length : 0;
  const avgCommentRatioNormal = nonOutliers.length > 0
    ? nonOutliers.reduce((s, p) => s + (p.comment_like_ratio || 0), 0) / nonOutliers.length : 0;
  if (avgCommentRatioOutlier > avgCommentRatioNormal * 1.3 && avgCommentRatioOutlier > 0.05) {
    sections.push(`Outliers generate ${Math.round(avgCommentRatioOutlier * 100)}% comment-to-like ratio vs ${Math.round(avgCommentRatioNormal * 100)}% for normal posts — viral content sparks conversations, not just passive likes.`);
  }

  if (sections.length === 0) {
    return 'The outlier patterns are diverse — no single dominant strategy emerges. Experiment across different formats, hooks, and tones.';
  }

  return sections.join('\n\n');
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

  return reasons.slice(0, 4).join('. ') + '.';
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
