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

  // 3. Hashtag usage
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

  // 4. CTA usage
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

  // 5. Best day of week
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

  // 6. Emoji usage
  const outlierEmojiRate = outliers.filter((p) => p.has_emoji).length / outliers.length;
  insights.push({
    type: 'emoji',
    title: 'Emoji usage in outliers',
    value: `${Math.round(outlierEmojiRate * 100)}% use emojis`,
    detail: `${Math.round(outlierEmojiRate * 100)}% of outlier posts contain emojis.`,
  });

  // 7. Top hooks
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

  return {
    total_outliers: outliers.length,
    content_type_distribution: typeCounts,
    avg_word_count: Math.round(avgWords),
    cta_rate: Math.round(ctaRate * 100),
  };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
