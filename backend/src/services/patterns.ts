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

  // Los patrones se sacan de `top_del_creador`, NO de `is_outlier`.
  //
  // Con is_outlier esta funcion cortaba en seco (`if (outliers.length === 0)
  // return []`) en las cuentas ultraconsistentes, que son justo las que mas
  // hay que estudiar: Adam Grant tiene max/media = 2,75x contra un umbral de
  // 3,00x, o sea CERO outliers por construccion, y el Explorer no sacaba ni un
  // patron de la cuenta mas viral de LinkedIn. Le pasaba a 4 de 142 cuentas.
  //
  // `top_del_creador` es relativo a la forma de cada cuenta, asi que siempre
  // devuelve algo mientras la cuenta tenga posts: 0 creadores vacios sobre los
  // 145 de la BD con >=10 posts.
  //
  // Fallback a is_outlier solo para no romper si llega un post viejo sin
  // recalcular todavia (la columna es NOT NULL DEFAULT FALSE).
  let outliers = allPosts.filter((p) => p.top_del_creador);
  if (outliers.length === 0) outliers = allPosts.filter((p) => p.is_outlier);
  const marcados = new Set(outliers.map((p) => p.id));
  const nonOutliers = allPosts.filter((p) => !marcados.has(p.id));

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

  // 3. Hook type analysis — ranked by avg outlier ratio (not raw engagement)
  const hookTypeCounts: Record<string, { count: number; totalRatio: number; totalEngagement: number }> = {};
  for (const p of allPosts) {
    const ht = p.hook_type || 'other';
    if (!hookTypeCounts[ht]) hookTypeCounts[ht] = { count: 0, totalRatio: 0, totalEngagement: 0 };
    hookTypeCounts[ht].count++;
    hookTypeCounts[ht].totalRatio += p.outlier_ratio;
    hookTypeCounts[ht].totalEngagement += p.engagement_score;
  }
  const hookTypeEntries = Object.entries(hookTypeCounts)
    .filter(([k]) => k !== 'other')
    .map(([type, data]) => ({
      type,
      avgRatio: data.count > 0 ? Math.round((data.totalRatio / data.count) * 100) / 100 : 0,
      avgEng: data.count > 0 ? data.totalEngagement / data.count : 0,
      count: data.count,
    }))
    .sort((a, b) => b.avgRatio - a.avgRatio);

  if (hookTypeEntries.length > 0) {
    const best = hookTypeEntries[0];
    const worst = hookTypeEntries[hookTypeEntries.length - 1];
    insights.push({
      type: 'hook_type',
      title: 'Best performing hook type',
      value: formatHookType(best.type),
      detail: `"${formatHookType(best.type)}" hooks average ${best.avgRatio}x ratio (${worst.avgRatio > 0 ? Math.round(best.avgRatio / worst.avgRatio * 10) / 10 : ''}x more than "${formatHookType(worst.type)}") across ${best.count} posts.`,
    });
  }

  // 4. Post structure analysis — ranked by avg outlier ratio
  const structureCounts: Record<string, { count: number; totalRatio: number; totalEngagement: number }> = {};
  for (const p of allPosts) {
    const ps = p.post_structure || 'other';
    if (!structureCounts[ps]) structureCounts[ps] = { count: 0, totalRatio: 0, totalEngagement: 0 };
    structureCounts[ps].count++;
    structureCounts[ps].totalRatio += p.outlier_ratio;
    structureCounts[ps].totalEngagement += p.engagement_score;
  }
  const structEntries = Object.entries(structureCounts)
    .filter(([k]) => k !== 'other')
    .map(([structure, data]) => ({
      structure,
      avgRatio: data.count > 0 ? Math.round((data.totalRatio / data.count) * 100) / 100 : 0,
      avgEng: data.count > 0 ? data.totalEngagement / data.count : 0,
      count: data.count,
    }))
    .sort((a, b) => b.avgRatio - a.avgRatio);

  if (structEntries.length > 0) {
    const best = structEntries[0];
    insights.push({
      type: 'post_structure',
      title: 'Best performing structure',
      value: formatStructure(best.structure),
      detail: `"${formatStructure(best.structure)}" posts average ${best.avgRatio}x ratio (${best.count} posts).`,
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

export function getCrossCreatorPatterns(allPosts: Post[], creatorTimezones: Record<string, string> = {}) {
  // Union de las dos señales, no solo `is_outlier`. En una lista MEZCLADA de
  // creadores, `is_outlier` esta sesgado hacia las cuentas de cola pesada y
  // excluye por completo a las ultraconsistentes: los 2.278 outliers de la
  // competencia solo tenian 6 posts de imagen-sola (0,26%) porque las tres
  // cuentas que viven de ese formato (Adam Grant, Alex y Leila Hormozi) casi no
  // aparecian. Con la union, esa distribucion deja de mentir.
  const outliers = allPosts.filter((p) => p.is_outlier || p.top_del_creador);
  const marcados = new Set(outliers.map((p) => p.id));
  const nonOutliers = allPosts.filter((p) => !marcados.has(p.id));

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

  // Best days and hours for outliers (cross-creator, converted to each creator's local time).
  // Uses IANA timezone (e.g. "Europe/Madrid") so DST is handled correctly — otherwise every
  // summer/spring post gets shifted an hour early.
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStats: Record<number, { total: number; outliers: number; totalRatio: number }> = {};
  const hourStats: Record<number, { total: number; outliers: number; totalRatio: number }> = {};
  const weekdayToNum: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const formatters = new Map<string, Intl.DateTimeFormat>();
  const getFormatter = (tz: string) => {
    let f = formatters.get(tz);
    if (!f) {
      try {
        f = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          weekday: 'short',
          hour: '2-digit',
          hourCycle: 'h23',
        });
      } catch {
        f = new Intl.DateTimeFormat('en-US', { weekday: 'short', hour: '2-digit', hourCycle: 'h23' });
      }
      formatters.set(tz, f);
    }
    return f;
  };
  for (const p of allPosts) {
    if (!p.published_at) continue;
    const d = new Date(p.published_at);
    const tz = creatorTimezones[p.creator_id] || 'UTC';
    const parts = getFormatter(tz).formatToParts(d);
    const weekdayPart = parts.find((x) => x.type === 'weekday')?.value;
    const hourPart = parts.find((x) => x.type === 'hour')?.value;
    if (!weekdayPart || !hourPart) continue;
    const day = weekdayToNum[weekdayPart];
    const hour = parseInt(hourPart, 10) % 24;
    if (day === undefined || isNaN(hour)) continue;
    if (!dayStats[day]) dayStats[day] = { total: 0, outliers: 0, totalRatio: 0 };
    dayStats[day].total++;
    if (p.is_outlier) { dayStats[day].outliers++; dayStats[day].totalRatio += p.outlier_ratio; }
    if (!hourStats[hour]) hourStats[hour] = { total: 0, outliers: 0, totalRatio: 0 };
    hourStats[hour].total++;
    if (p.is_outlier) { hourStats[hour].outliers++; hourStats[hour].totalRatio += p.outlier_ratio; }
  }

  const bestDays = Object.entries(dayStats)
    .map(([day, s]) => ({
      day: parseInt(day),
      day_name: dayNames[parseInt(day)],
      total_posts: s.total,
      outliers: s.outliers,
      outlier_rate: s.total > 0 ? Math.round((s.outliers / s.total) * 100) : 0,
      avg_outlier_ratio: s.outliers > 0 ? Math.round((s.totalRatio / s.outliers) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.outlier_rate - a.outlier_rate);

  // Avoid small-bucket variance noise: hours with only a handful of posts can hit a
  // spurious "10% outlier rate" from 1 lucky post. Require a meaningful sample —
  // at least 30 posts AND at least 20% of the busiest hour. Rare-hour posts
  // (e.g. 02:00) are legitimately rare, so they shouldn't dominate the ranking.
  const hourTotals = Object.values(hourStats).map((s) => s.total);
  const maxHourTotal = hourTotals.length > 0 ? Math.max(...hourTotals) : 0;
  const minHourSample = Math.max(30, Math.round(maxHourTotal * 0.2));
  const bestHours = Object.entries(hourStats)
    .filter(([, s]) => s.total >= minHourSample)
    .map(([hour, s]) => ({
      hour: parseInt(hour),
      hour_label: `${parseInt(hour).toString().padStart(2, '0')}:00`,
      total_posts: s.total,
      outliers: s.outliers,
      outlier_rate: s.total > 0 ? Math.round((s.outliers / s.total) * 100) : 0,
      avg_outlier_ratio: s.outliers > 0 ? Math.round((s.totalRatio / s.outliers) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.outlier_rate - a.outlier_rate);

  const outlierTiming = { best_days: bestDays, best_hours: bestHours };

  // Tone analysis — compute dynamically to avoid stale DB values
  // Classify each post's tone live
  const getTone = (p: Post) => {
    const live = classifyTone(p.content_text);
    return live !== 'neutral' ? live : (p.text_tone || 'neutral');
  };

  // Outlier tones
  const outlierTones: Record<string, { count: number; totalEng: number; totalRatio: number }> = {};
  for (const p of outliers) {
    const tone = getTone(p);
    if (!outlierTones[tone]) outlierTones[tone] = { count: 0, totalEng: 0, totalRatio: 0 };
    outlierTones[tone].count++;
    outlierTones[tone].totalEng += p.engagement_score;
    outlierTones[tone].totalRatio += p.outlier_ratio;
  }

  // Normal post tones (for comparison)
  const normalTones: Record<string, { count: number; totalEng: number; totalRatio: number }> = {};
  for (const p of nonOutliers) {
    const tone = getTone(p);
    if (!normalTones[tone]) normalTones[tone] = { count: 0, totalEng: 0, totalRatio: 0 };
    normalTones[tone].count++;
    normalTones[tone].totalEng += p.engagement_score;
    normalTones[tone].totalRatio += p.outlier_ratio;
  }

  // Build comparative breakdown — sorted by avg outlier ratio (not raw engagement)
  const allToneKeys = new Set([...Object.keys(outlierTones), ...Object.keys(normalTones)]);
  const toneComparison = [...allToneKeys]
    .filter((k) => k !== 'neutral')
    .map((tone) => {
      const o = outlierTones[tone] || { count: 0, totalEng: 0, totalRatio: 0 };
      const n = normalTones[tone] || { count: 0, totalEng: 0, totalRatio: 0 };
      return {
        tone,
        outlier_count: o.count,
        outlier_avg_ratio: o.count > 0 ? Math.round((o.totalRatio / o.count) * 100) / 100 : 0,
        outlier_avg_engagement: o.count > 0 ? Math.round(o.totalEng / o.count) : 0,
        outlier_pct: outliers.length > 0 ? Math.round((o.count / outliers.length) * 100) : 0,
        normal_count: n.count,
        normal_avg_ratio: n.count > 0 ? Math.round((n.totalRatio / n.count) * 100) / 100 : 0,
        normal_avg_engagement: n.count > 0 ? Math.round(n.totalEng / n.count) : 0,
        normal_pct: nonOutliers.length > 0 ? Math.round((n.count / nonOutliers.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.outlier_avg_ratio - a.outlier_avg_ratio);

  // Neutral stats
  const neutralOutlierPct = outliers.length > 0
    ? Math.round(((outlierTones['neutral']?.count || 0) / outliers.length) * 100)
    : 0;

  // Generate interpretation
  const interpretation = generateToneInterpretation(toneComparison, outliers.length, nonOutliers.length, neutralOutlierPct);

  // Analyze actual text patterns in outlier content
  const textPatterns = analyzeTextPatterns(outliers, nonOutliers);

  // Detect cross-variable archetypes
  const archetypes = detectArchetypes(allPosts);

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
    outlier_timing: outlierTiming,
    text_patterns: textPatterns,
    archetypes,
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

  // ---- 4. Semantic word categories (not literal words) ----
  const semanticCategories = analyzeSemanticPatterns(texts, normalTexts);

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

  // Semantic categories
  const topCategories = semanticCategories.filter((c) => c.outlier_density > c.normal_density * 1.2).slice(0, 5);
  if (topCategories.length > 0) {
    analysisLines.push(`Language patterns stronger in outliers: ${topCategories.map((c) => `${c.label} (${c.outlier_density}x vs ${c.normal_density}x in normal)`).join(', ')}.`);
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
    semantic_categories: semanticCategories,
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
 * Detect the virality driver for a post — why people feel compelled to engage/share.
 */
export function detectViralityDriver(post: {
  content_text?: string | null;
  comment_like_ratio?: number;
  share_like_ratio?: number;
  hook_type?: string;
  text_tone?: string;
}): { driver: string; label: string; explanation: string } {
  const text = (post.content_text || '').toLowerCase();
  const clr = post.comment_like_ratio || 0;
  const slr = post.share_like_ratio || 0;

  // Social currency: makes the sharer look smart/informed
  if (/framework|system|hack|secret|insider|strategy|method|playbook|guide|tutorial|step.by.step/i.test(text) && slr > 0.05) {
    return { driver: 'social_currency', label: 'Social Currency', explanation: 'People share this to look smart or well-informed — it makes them a source of valuable knowledge' };
  }

  // Controversy: triggers debate
  if (clr > 0.12 || /unpopular|controversial|hot take|fight me|disagree|wrong|lie|myth|stop doing|overrated/i.test(text)) {
    return { driver: 'controversy', label: 'Controversy', explanation: 'This triggers strong agree/disagree reactions — people comment to defend their position or validate their view' };
  }

  // Identity: people see themselves in it
  if (/^(if you|you['']re a|to every|dear |para |si eres|who else|raise your hand|that feeling when|when you)/i.test(text) ||
      /we['']ve all|todos hemos|relatable|me too|same|been there|i feel this/i.test(text)) {
    return { driver: 'identity', label: 'Identity', explanation: 'People engage because they see themselves in this post — it validates who they are or aspire to be' };
  }

  // Belonging: community, shared experience
  if (/community|tribe|movement|together|we |nosotros|join|support|you['']re not alone|no estás sol/i.test(text) || clr > 0.08) {
    return { driver: 'belonging', label: 'Belonging', explanation: 'This creates a sense of shared experience or community — people engage to feel part of something bigger' };
  }

  // Utility: genuinely useful, people save/share for reference
  if (/how to|step|tip|tool|resource|template|checklist|guide|save this|bookmark|here['']?s (how|what|the)/i.test(text) && slr > 0.03) {
    return { driver: 'utility', label: 'Utility', explanation: 'Pure practical value — people save and share this as a reference they\'ll come back to' };
  }

  // Emotion: vulnerability, inspiration, empathy
  if (/failed|lost|quit|cried|struggled|vulnerable|honest|scared|confession|ashamed/i.test(text) || post.text_tone === 'vulnerable' || post.text_tone === 'empathy') {
    return { driver: 'emotion', label: 'Emotion', explanation: 'Raw emotional authenticity — people engage because it makes them feel something real' };
  }

  // Aspiration: people share what they want to become
  if (/success|freedom|dream|transform|next level|6.figure|millonari|wealth|achieve|unlock/i.test(text) || post.text_tone === 'aspirational') {
    return { driver: 'aspiration', label: 'Aspiration', explanation: 'People share this because it represents who they want to become — aspirational content gets broad distribution' };
  }

  // Default: social currency (most common driver on LinkedIn)
  return { driver: 'social_currency', label: 'Social Currency', explanation: 'Shareable knowledge — people distribute this to build their own authority by association' };
}

/**
 * Analyze why people specifically comment on a post.
 */
function analyzeCommentDriver(post: {
  content_text?: string | null;
  comment_like_ratio?: number;
  has_call_to_action?: boolean;
}): string {
  const text = (post.content_text || '').toLowerCase();
  const clr = post.comment_like_ratio || 0;
  const lastLines = text.split('\n').filter((l) => l.trim()).slice(-3).join(' ');

  if (/agree|disagree|what do you think|thoughts\?|hot take|controversial|unpopular/i.test(text)) return 'debate — the post takes a stance that forces people to weigh in';
  if (/\?$/.test(lastLines) || /what['']?s your|tell me|share your/i.test(lastLines)) return 'direct question — the CTA explicitly asks for input';
  if (/who else|raise your hand|same|been there|relatable|tag someone/i.test(text)) return 'shared experience — people comment to say "me too" and validate their own journey';
  if (/failed|lost|vulnerable|confession|honest|scared/i.test(text)) return 'empathy — vulnerability triggers supportive responses and personal stories in return';
  if (/resource|tool|link|send|dm|comment .*(get|receive|access)/i.test(text)) return 'resource request — people comment to get access to something valuable';
  if (clr > 0.15) return 'high-friction topic — this subject inherently generates strong opinions';
  if (post.has_call_to_action) return 'explicit CTA — the post directly asks for engagement';
  return 'organic engagement — the content naturally invites conversation';
}

/**
 * Generate an abstract replicable template from a post.
 */
function generateAbstractTemplate(post: {
  hook_type?: string;
  post_structure?: string;
  text_tone?: string;
  content_text?: string | null;
}): string {
  const text = post.content_text || '';
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  const hookLabel = formatHookType(post.hook_type || 'other');
  const structLabel = formatStructure(post.post_structure || 'other');

  // Analyze the actual structure zones
  const zones: string[] = [];

  // Hook zone (first 1-3 lines)
  if (lines.length >= 1) {
    const firstLine = lines[0].trim();
    if (/\?/.test(firstLine)) zones.push('[Hook: Question that challenges assumption]');
    else if (/^\d/.test(firstLine)) zones.push('[Hook: Data point that shocks]');
    else if (/^(i |yo )/i.test(firstLine)) zones.push('[Hook: Personal story entry point]');
    else if (/^(stop|don['']t|never|no )/i.test(firstLine.toLowerCase())) zones.push('[Hook: Pattern interrupt / prohibition]');
    else zones.push(`[Hook: ${hookLabel}]`);
  }

  // Body zone
  const bodyLines = lines.slice(1, -1);
  const listItems = bodyLines.filter((l) => /^\s*(\d+[\.\)]\s|[-•]\s|→|✅|❌|▸|🔹)/.test(l));
  if (listItems.length >= 3) {
    zones.push(`[Body: ${listItems.length}-item list with value points]`);
  } else if (bodyLines.length > 5 && /then|but|so |después|pero|así que/i.test(bodyLines.join(' '))) {
    zones.push('[Body: Narrative arc with tension → resolution]');
  } else if (bodyLines.length > 3) {
    zones.push('[Body: Supporting argument / evidence]');
  }

  // Closing zone
  if (lines.length >= 2) {
    const last = lines[lines.length - 1].trim().toLowerCase();
    if (/\?/.test(last)) zones.push('[Close: Open question for comments]');
    else if (/follow|like|share|save|repost|👇|⬇/i.test(last)) zones.push('[Close: Explicit engagement CTA]');
    else if (/lesson|takeaway|remember|key/i.test(last)) zones.push('[Close: Key takeaway / lesson]');
    else zones.push('[Close: Final statement / punchline]');
  }

  return `${hookLabel} + ${structLabel}: ${zones.join(' → ')}`;
}

/**
 * Analyze the narrative mechanism — how the post creates and maintains tension.
 */
function analyzeNarrativeMechanism(text: string): string {
  const lower = text.toLowerCase();
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  // Open loop: creates a question that MUST be answered
  if (/here['']?s (what|why|how)|this is what|let me explain|te explico|lo que pasó|what happened/i.test(lower) && lines.length > 5) {
    return 'Open loop — the hook creates a question that forces the reader to keep scrolling for the answer';
  }

  // Common enemy: us vs. them
  if (/they |them |those |the (people|ones|companies|gurus|experts) who|los que|la gente que|toxic|broken system|old way/i.test(lower)) {
    return 'Common enemy — creates an "us vs. them" dynamic that builds tribal identity and comment solidarity';
  }

  // Belief break: shatters an assumption then rebuilds
  if (/myth|lie|wrong|actually|truth is|in reality|en realidad|la verdad|most people think|everyone believes/i.test(lower)) {
    return 'Belief break — shatters a widely-held assumption, creating cognitive dissonance that demands resolution';
  }

  // Contrast/comparison: before/after, old/new
  if (/before|after|old|new|used to|now i|antes|después|vs\.?|versus|instead of/i.test(lower)) {
    return 'Contrast mechanism — juxtaposes two states (before/after, wrong/right) to make the insight feel concrete';
  }

  // Vulnerability escalation: progressively deeper confession
  if (/failed|lost|quit|cried|scared|ashamed|confession|honest|vulnerable/i.test(lower) && lines.length > 4) {
    return 'Vulnerability escalation — progressively deeper personal disclosure that builds emotional investment';
  }

  // Authority proof: establishes credibility then delivers framework
  if (/\d+ (years|clients|companies|projects|años)|i['']ve (helped|built|coached|worked)|expert|proven/i.test(lower)) {
    return 'Authority proof — establishes credibility first, making the subsequent advice feel trustworthy and actionable';
  }

  // Curiosity stacking: multiple open loops
  if (/(but (that['']s not|wait|here['']s)|and (here['']s|that['']s)|the (best|worst) part|pero (eso no|espera)|y (aquí|eso))/i.test(lower)) {
    return 'Curiosity stacking — layers multiple open loops and mini-cliffhangers to maintain scroll momentum';
  }

  // Pattern/rhythm: repetitive structure for memorability
  const shortLines = lines.filter((l) => l.trim().length < 40 && l.trim().length > 5);
  if (shortLines.length / lines.length > 0.6 && lines.length > 5) {
    return 'Rhythmic pattern — short, punchy lines create a reading cadence that\'s easy to consume and memorize';
  }

  return 'Direct value delivery — straightforward content structure that prioritizes clarity over narrative tension';
}

/**
 * Generate a per-post deep explanation of why an outlier post worked.
 * Analyzes: narrative mechanism, hook tension, virality driver, comment driver, abstract template.
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
}): {
  summary: string;
  narrative_mechanism: string;
  hook_tension: string;
  virality_driver: { driver: string; label: string; explanation: string };
  comment_driver: string;
  abstract_template: string;
} {
  const text = post.content_text || '';

  // 1. Narrative mechanism
  const narrativeMechanism = analyzeNarrativeMechanism(text);

  // 2. Hook tension analysis
  const hookTensionMap: Record<string, string> = {
    pattern_interrupt: 'Identity threat — tells the reader they\'re doing something wrong, creating urgency to read more',
    belief_breaker: 'Cognitive dissonance — contradicts a belief the reader holds, forcing them to resolve the conflict',
    curiosity_gap: 'Information gap — creates an open loop that the brain needs to close',
    data_shock: 'Pattern break — a surprising number violates expectations and demands explanation',
    hot_take: 'Social risk — the author takes a public stance, triggering agree/disagree impulses',
    personal_confession: 'Vulnerability tension — raw honesty creates empathetic investment',
    story_opener: 'Narrative pull — temporal markers ("When I...") activate the storytelling brain',
    hypothetical_question: 'Imagination activation — forces the reader to simulate a scenario',
    why_question: 'Causal curiosity — "why" triggers the need to understand root causes',
    how_question: 'Practical curiosity — promises actionable knowledge',
    direct_question: 'Direct engagement — asks the reader personally, hard to scroll past',
    open_question: 'Knowledge gap — broad question creates desire to know the answer',
    rhetorical_question: 'Implied answer — the reader fills in the answer, creating buy-in',
    list_promise: 'Value commitment — a number promises specific, bounded, scannable value',
    prediction: 'Future anxiety — predictions create urgency about being prepared',
    how_to_framework: 'Utility promise — signals immediately applicable knowledge',
    bold_claim: 'Authority challenge — a strong statement demands the reader evaluate it',
    common_mistake: 'Fear of failure — nobody wants to be making a known mistake',
    direct_callout: 'Targeting — speaks directly to a specific audience, creating relevance',
    announcement: 'Novelty — news creates time-sensitive relevance',
    social_proof_opener: 'Credibility anchor — results/numbers establish authority before the content',
    analogy: 'Reframing — connecting familiar concepts in new ways creates an "aha" moment',
    contrarian_take: 'Status quo challenge — going against consensus triggers curiosity about the reasoning',
    relatable_moment: 'Mirror effect — seeing yourself in content creates instant emotional connection',
    motivational: 'Aspirational pull — activates the gap between current and desired self',
    observation: 'Articulation effect — putting unnamed feelings into words creates powerful resonance',
    challenge: 'Action tension — dares the reader, creating a commitment impulse',
  };
  const hookTension = hookTensionMap[post.hook_type || ''] || 'Attention capture — the opening line stops the scroll through direct value or intrigue';

  // 3. Virality driver
  const viralityDriver = detectViralityDriver(post);

  // 4. Comment driver
  const commentDriver = analyzeCommentDriver(post);

  // 5. Abstract template
  const abstractTemplate = generateAbstractTemplate(post);

  // 6. Summary — a concise narrative paragraph
  const summaryParts: string[] = [];

  // Performance context
  if (post.outlier_ratio >= 10) summaryParts.push(`Exceptional ${post.outlier_ratio}x performance.`);
  else if (post.outlier_ratio >= 5) summaryParts.push(`Strong viral hit at ${post.outlier_ratio}x average.`);
  else summaryParts.push(`Solid outlier at ${post.outlier_ratio}x average.`);

  // Why it worked (the mechanism)
  summaryParts.push(narrativeMechanism.split(' — ')[1] || narrativeMechanism);

  // What drove engagement
  if ((post.comment_like_ratio || 0) > 0.12) {
    summaryParts.push(`High debate factor (${Math.round((post.comment_like_ratio || 0) * 100)}% comment/like ratio) — ${commentDriver.split(' — ')[0]}.`);
  }
  if ((post.share_like_ratio || 0) > 0.08) {
    summaryParts.push(`Strong share rate — driven by ${viralityDriver.label.toLowerCase()}.`);
  }

  return {
    summary: summaryParts.join(' '),
    narrative_mechanism: narrativeMechanism,
    hook_tension: hookTension,
    virality_driver: viralityDriver,
    comment_driver: commentDriver,
    abstract_template: abstractTemplate,
  };
}

function formatHookType(type: string): string {
  const labels: Record<string, string> = {
    pattern_interrupt: 'Pattern Interrupt',
    belief_breaker: 'Belief Breaker',
    curiosity_gap: 'Curiosity Gap',
    data_shock: 'Data Shock',
    hot_take: 'Hot Take',
    personal_confession: 'Personal Confession',
    story_opener: 'Story Opener',
    hypothetical_question: 'Hypothetical Question',
    why_question: 'Why Question',
    how_question: 'How Question',
    direct_question: 'Direct Question',
    open_question: 'Open Question',
    rhetorical_question: 'Rhetorical Question',
    list_promise: 'List Promise',
    prediction: 'Prediction',
    how_to_framework: 'How-To / Framework',
    bold_claim: 'Bold Claim',
    common_mistake: 'Common Mistake',
    direct_callout: 'Direct Callout',
    announcement: 'Announcement',
    social_proof_opener: 'Social Proof',
    analogy: 'Analogy',
    contrarian_take: 'Contrarian Take',
    relatable_moment: 'Relatable Moment',
    motivational: 'Motivational',
    observation: 'Observation',
    challenge: 'Challenge',
    other: 'Other',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStructure(structure: string): string {
  const labels: Record<string, string> = {
    hook_list_cta: 'Hook → List → CTA',
    hook_story_lesson_cta: 'Hook → Story → Lesson → CTA',
    problem_agitate_solve: 'Problem → Agitate → Solve',
    contrarian_proof_reframe: 'Contrarian → Proof → Reframe',
    confession_insight_takeaway: 'Confession → Insight → Takeaway',
    list_framework: 'List / Framework',
    problem_solution: 'Problem → Solution',
    story_lesson: 'Story → Lesson',
    before_after: 'Before / After',
    step_by_step: 'Step-by-Step',
    myth_busting: 'Myth Busting',
    question_answer: 'Question → Answer',
    observation_insight: 'Observation → Insight',
    prediction_vision: 'Prediction / Vision',
    motivational_manifesto: 'Motivational Manifesto',
    authority_framework: 'Authority → Framework',
    comparison: 'Comparison / Versus',
    short_punchy: 'Short & Punchy',
    long_form_essay: 'Long-form Essay',
    narrative_arc: 'Narrative Arc',
    content_with_cta: 'Content + CTA',
    data_driven: 'Data-Driven',
    other: 'Other',
  };
  return labels[structure] || structure.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function generateToneInterpretation(
  toneComparison: { tone: string; outlier_count: number; outlier_avg_ratio: number; outlier_avg_engagement: number; outlier_pct: number; normal_count: number; normal_avg_ratio: number; normal_avg_engagement: number; normal_pct: number }[],
  totalOutliers: number,
  totalNormal: number,
  neutralOutlierPct: number,
): string {
  const lines: string[] = [];

  // Top performing tones by outlier ratio (primary metric)
  const topByRatio = toneComparison.filter((t) => t.outlier_count >= 2).slice(0, 3);
  if (topByRatio.length > 0) {
    const names = topByRatio.map((t) => `${formatToneLabel(t.tone)} (${t.outlier_avg_ratio}x avg ratio)`);
    lines.push(`The tones with highest outlier ratio are: ${names.join(', ')}.`);
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

  // Best vs worst tone ratio
  if (topByRatio.length > 0 && topByRatio[0].outlier_avg_ratio > 0) {
    const best = topByRatio[0];
    const worst = toneComparison.filter((t) => t.outlier_count >= 2).slice(-1)[0];
    if (worst && worst.outlier_avg_ratio > 0) {
      const diff = Math.round((best.outlier_avg_ratio / worst.outlier_avg_ratio) * 10) / 10;
      if (diff > 1.3) {
        lines.push(`"${formatToneLabel(best.tone)}" posts achieve ${diff}x higher outlier ratio than "${formatToneLabel(worst.tone)}" posts.`);
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

// ---- Semantic pattern categories ----
const SEMANTIC_CATEGORIES: { category: string; label: string; patterns: RegExp[] }[] = [
  {
    category: 'action_verbs', label: 'Action Verbs',
    patterns: [/\b(stop|start|build|create|launch|ship|scale|grow|transform|break|change|fix|solve|master|unlock|discover|learn|try|test|apply|implement|execute|deliver)\b/gi,
               /\b(para|empieza|construye|crea|lanza|escala|crece|transforma|rompe|cambia|arregla|resuelve|domina|desbloquea|descubre|aprende|prueba|aplica|implementa)\b/gi],
  },
  {
    category: 'urgency_words', label: 'Urgency / Scarcity',
    patterns: [/\b(now|today|immediately|asap|urgent|critical|deadline|hurry|fast|quick|before|don't wait|limited|running out|last chance|right now)\b/gi,
               /\b(ahora|hoy|inmediatamente|urgente|crítico|rápido|antes de|no esperes|limitado|última oportunidad|ya)\b/gi],
  },
  {
    category: 'exclusivity_words', label: 'Exclusivity / Insider',
    patterns: [/\b(secret|insider|hidden|unknown|nobody tells|few people|exclusive|rare|elite|top \d+%|most people don't|what they don't|behind the scenes)\b/gi,
               /\b(secreto|oculto|desconocido|nadie te dice|pocos|exclusivo|raro|élite|la mayoría no|lo que no te)\b/gi],
  },
  {
    category: 'contrast_words', label: 'Contrast / Tension',
    patterns: [/\b(but|however|instead|yet|although|while|versus|vs|unlike|opposite|not|never|wrong|right|before|after|old|new|myth|truth|reality)\b/gi,
               /\b(pero|sin embargo|en vez de|aunque|mientras|versus|opuesto|no|nunca|mal|bien|antes|después|viejo|nuevo|mito|verdad|realidad)\b/gi],
  },
  {
    category: 'emotional_amplifiers', label: 'Emotional Amplifiers',
    patterns: [/\b(incredible|amazing|insane|mind-blowing|game-changer|life-changing|powerful|massive|brutal|shocking|devastating|terrifying|extraordinary|absurd|ridiculous)\b/gi,
               /\b(increíble|alucinante|brutal|impactante|poderoso|masivo|devastador|extraordinario|absurdo|ridículo|impresionante|bestial)\b/gi],
  },
  {
    category: 'authority_markers', label: 'Authority / Proof',
    patterns: [/\b(proven|research|study|data|evidence|science|expert|certified|\d+ years|\d+ clients|\d+ companies|results|roi|revenue)\b/gi,
               /\b(probado|investigación|estudio|datos|evidencia|ciencia|experto|certificado|\d+ años|\d+ clientes|resultados|ingresos)\b/gi],
  },
  {
    category: 'vulnerability_markers', label: 'Vulnerability / Honesty',
    patterns: [/\b(failed|lost|scared|ashamed|honest|truth is|confession|mistake|wrong|struggled|broke|cried|quit|fired|rejected|doubt|imposter)\b/gi,
               /\b(fracasé|perdí|miedo|vergüenza|honesto|la verdad|confesión|error|equivoqué|luché|arruinado|lloré|renuncié|despidieron|rechazado|duda|impostor)\b/gi],
  },
  {
    category: 'second_person', label: 'Direct "You" Address',
    patterns: [/\b(you|your|you're|you've|you'll|yourself)\b/gi,
               /\b(tú|tu|ustedes|te|ti|contigo)\b/gi],
  },
];

function analyzeSemanticPatterns(outlierTexts: string[], normalTexts: string[]): {
  category: string; label: string; outlier_density: number; normal_density: number; diff_pct: number;
}[] {
  return SEMANTIC_CATEGORIES.map(({ category, label, patterns }) => {
    const outlierCount = countPatternMatches(outlierTexts, patterns);
    const normalCount = countPatternMatches(normalTexts, patterns);
    const outlierWords = outlierTexts.reduce((s, t) => s + t.split(/\s+/).length, 0);
    const normalWords = normalTexts.reduce((s, t) => s + t.split(/\s+/).length, 0);
    // Density = matches per 100 words
    const outlierDensity = outlierWords > 0 ? Math.round((outlierCount / outlierWords) * 1000) / 10 : 0;
    const normalDensity = normalWords > 0 ? Math.round((normalCount / normalWords) * 1000) / 10 : 0;
    const diffPct = normalDensity > 0 ? Math.round(((outlierDensity - normalDensity) / normalDensity) * 100) : 0;
    return { category, label, outlier_density: outlierDensity, normal_density: normalDensity, diff_pct: diffPct };
  }).sort((a, b) => b.diff_pct - a.diff_pct);
}

function countPatternMatches(texts: string[], patterns: RegExp[]): number {
  let total = 0;
  for (const text of texts) {
    for (const pattern of patterns) {
      const matches = text.match(new RegExp(pattern.source, pattern.flags));
      if (matches) total += matches.length;
    }
  }
  return total;
}

// ---- Archetype detection ----
export function detectArchetypes(allPosts: Post[]): {
  archetype: string;
  label: string;
  description: string;
  hook_type: string;
  structure: string;
  tone: string;
  count: number;
  avg_engagement: number;
  avg_outlier_ratio: number;
  example_hooks: string[];
}[] {
  // Group posts by hook×structure×tone combo
  const combos: Record<string, { posts: Post[]; totalEng: number; totalRatio: number }> = {};
  for (const p of allPosts) {
    const hook = p.hook_type || 'other';
    const struct = p.post_structure || 'other';
    const tone = classifyTone(p.content_text) || p.text_tone || 'neutral';
    if (hook === 'other' || struct === 'other') continue; // Skip unclassified
    const key = `${hook}|${struct}|${tone}`;
    if (!combos[key]) combos[key] = { posts: [], totalEng: 0, totalRatio: 0 };
    combos[key].posts.push(p);
    combos[key].totalEng += p.engagement_score;
    combos[key].totalRatio += p.outlier_ratio;
  }

  // Filter combos that appear at least 2 times
  return Object.entries(combos)
    .filter(([, data]) => data.posts.length >= 2)
    .map(([key, data]) => {
      const [hook, structure, tone] = key.split('|');
      const avgEng = Math.round(data.totalEng / data.posts.length);
      const avgRatio = Math.round((data.totalRatio / data.posts.length) * 100) / 100;
      const exampleHooks = data.posts
        .filter((p) => p.hook_text)
        .sort((a, b) => b.outlier_ratio - a.outlier_ratio)
        .slice(0, 3)
        .map((p) => p.hook_text!.substring(0, 80));

      // Generate archetype name
      const archetypeName = `${formatHookType(hook)} + ${formatStructure(structure)} + ${formatToneLabel(tone)}`;

      return {
        archetype: key,
        label: archetypeName,
        description: `When a "${formatHookType(hook)}" hook is combined with "${formatStructure(structure)}" structure and "${formatToneLabel(tone)}" tone, posts average ${avgRatio}x ratio (${avgEng.toLocaleString()} eng).`,
        hook_type: hook,
        structure,
        tone,
        count: data.posts.length,
        avg_engagement: avgEng,
        avg_outlier_ratio: avgRatio,
        example_hooks: exampleHooks,
      };
    })
    .sort((a, b) => b.avg_outlier_ratio - a.avg_outlier_ratio)
    .slice(0, 15);
}

// ---- Narrative rhythm analysis ----
export function analyzeNarrativeRhythm(post: { content_text?: string | null }): {
  hook_zone: { lines: number; avg_words_per_line: number; style: string };
  body: { style: string; has_list: boolean; has_tension_relief: boolean; mini_hooks: number };
  closing: { style: string; cta_type: string | null };
  sentence_rhythm: { short_long_alternation: number; avg_line_length: number };
  scroll_stops: number;
  scroll_stop_types: string[];
} {
  const text = post.content_text || '';
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  // Hook zone (first 3 content lines)
  const hookLines = lines.slice(0, Math.min(3, lines.length));
  const hookWordsPerLine = hookLines.length > 0
    ? Math.round(hookLines.reduce((s, l) => s + l.trim().split(/\s+/).length, 0) / hookLines.length)
    : 0;
  let hookStyle = 'standard';
  if (hookWordsPerLine <= 5) hookStyle = 'punchy_short';
  else if (hookWordsPerLine >= 15) hookStyle = 'dense_narrative';
  else if (hookLines.length >= 2 && /\?/.test(hookLines[0])) hookStyle = 'question_lead';

  // Body analysis
  const bodyLines = lines.slice(3, Math.max(3, lines.length - 2));
  const hasListInBody = bodyLines.some((l) => /^\s*(\d+[\.\)]\s|[-•]\s|→|✅|❌|▸|🔹)/.test(l));
  const bodyText = bodyLines.join(' ').toLowerCase();
  const hasTensionRelief = /but |however|yet |aunque|pero |sin embargo/i.test(bodyText) &&
    /so |therefore|because|result|solution|por eso|así que|la solución/i.test(bodyText);

  // Mini-hooks: lines that restart attention mid-post
  const miniHooks = bodyLines.filter((l) => {
    const lt = l.trim().toLowerCase();
    return /^(but |here['']?s|the (real|best|worst|key)|wait|and here|pero |aquí|lo (mejor|peor|clave))/i.test(lt) ||
      (lt.endsWith('?') && lt.length < 60) || /^(→|👉|🔥|💡|⚡|🚀)/.test(lt);
  }).length;

  let bodyStyle = 'prose';
  if (hasListInBody) bodyStyle = 'list_driven';
  else if (hasTensionRelief) bodyStyle = 'tension_relief';
  else if (miniHooks >= 2) bodyStyle = 'mini_hook_chain';
  else if (bodyLines.length > 8) bodyStyle = 'long_narrative';

  // Closing analysis
  const closingLines = lines.slice(Math.max(0, lines.length - 2));
  const lastLine = (closingLines[closingLines.length - 1] || '').trim().toLowerCase();
  let closingStyle = 'statement';
  let ctaType: string | null = null;
  if (/\?$/.test(lastLine)) { closingStyle = 'question'; ctaType = 'engagement_question'; }
  else if (/follow|like|share|save|repost|👇|⬇|comment/i.test(lastLine)) { closingStyle = 'explicit_cta'; ctaType = 'explicit_action'; }
  else if (/agree|disagree|thoughts|what do you|qué opinas/i.test(lastLine)) { closingStyle = 'opinion_ask'; ctaType = 'opinion_request'; }
  else if (/lesson|takeaway|remember|bottom line|key|moral/i.test(lastLine)) closingStyle = 'takeaway';
  else if (lastLine.length < 25) closingStyle = 'punchline';

  // Sentence rhythm — measure short-long alternation
  const lineLengths = lines.map((l) => l.trim().split(/\s+/).length);
  let alternations = 0;
  for (let i = 1; i < lineLengths.length; i++) {
    const prev = lineLengths[i - 1];
    const curr = lineLengths[i];
    if ((prev <= 5 && curr >= 10) || (prev >= 10 && curr <= 5)) alternations++;
  }
  const alternationRate = lineLengths.length > 1 ? Math.round((alternations / (lineLengths.length - 1)) * 100) : 0;
  const avgLineLen = lineLengths.length > 0 ? Math.round(lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length) : 0;

  // Scroll stops — elements that re-grab attention
  const scrollStopTypes: string[] = [];
  let scrollStops = 0;
  const blankLineCount = text.split('\n').filter((l) => l.trim().length === 0).length;
  if (blankLineCount >= 3) { scrollStops += Math.min(blankLineCount, 5); scrollStopTypes.push('white_space_breaks'); }
  if (miniHooks > 0) { scrollStops += miniHooks; scrollStopTypes.push('mini_hooks'); }
  const emojiLines = lines.filter((l) => /[\u{1F600}-\u{1FAFF}]/u.test(l));
  if (emojiLines.length >= 2) { scrollStops += 1; scrollStopTypes.push('emoji_markers'); }
  const listItemCount = lines.filter((l) => /^\s*(\d+[\.\)]\s|[-•]\s|→|✅|❌|▸|🔹)/.test(l)).length;
  if (listItemCount >= 3) { scrollStops += 1; scrollStopTypes.push('list_structure'); }
  if (alternationRate > 30) { scrollStops += 1; scrollStopTypes.push('rhythm_variation'); }

  return {
    hook_zone: { lines: hookLines.length, avg_words_per_line: hookWordsPerLine, style: hookStyle },
    body: { style: bodyStyle, has_list: hasListInBody, has_tension_relief: hasTensionRelief, mini_hooks: miniHooks },
    closing: { style: closingStyle, cta_type: ctaType },
    sentence_rhythm: { short_long_alternation: alternationRate, avg_line_length: avgLineLen },
    scroll_stops: scrollStops,
    scroll_stop_types: scrollStopTypes,
  };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
