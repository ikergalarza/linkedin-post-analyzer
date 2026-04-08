import { Post } from '../models/post';

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

  return {
    total_outliers: outliers.length,
    content_type_distribution: typeCounts,
    hook_type_distribution: hookTypeCounts,
    structure_distribution: structureCounts,
    avg_word_count: Math.round(avgWords),
    cta_rate: Math.round(ctaRate * 100),
    common_traits: commonTraits,
    frequency_correlation: frequencyCorrelation,
  };
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

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
