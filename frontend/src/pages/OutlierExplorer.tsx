import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import PostCard from '../components/PostCard';
import { SkeletonCard } from '../components/Skeleton';

interface CrossCreatorData {
  top_outliers: {
    id: string;
    linkedin_post_id?: string | null;
    content_text: string | null;
    content_type: string;
    published_at: string | null;
    likes_count: number;
    comments_count: number;
    reposts_count: number;
    engagement_score: number;
    outlier_ratio: number;
    is_outlier: boolean;
    hook_text: string | null;
    hook_type?: string;
    post_url: string | null;
    creator_name: string;
    creator_image: string | null;
  }[];
  patterns: {
    total_outliers: number;
    content_type_distribution: Record<string, number>;
    hook_type_distribution: Record<string, number>;
    structure_distribution: Record<string, number>;
    tone_distribution: Record<string, number>;
    tone_breakdown: { tone: string; count: number; avg_engagement: number }[];
    avg_word_count: number;
    cta_rate: number;
    common_traits: string[];
    frequency_correlation: { postsPerWeek: number; avgEngagement: number }[];
  };
}

interface Creator {
  id: string;
  name: string | null;
  profile_image_url: string | null;
}

interface CompareData {
  id: string;
  name: string;
  profile_image_url: string | null;
  followers_count: number;
  total_posts: number;
  total_outliers: number;
  outlier_rate: number;
  avg_engagement: number;
  median_engagement: number;
  engagement_rate: number;
  posts_per_week: number;
  avg_comment_like_ratio: number;
  avg_share_like_ratio: number;
  hook_type_distribution: Record<string, number>;
}

const hookLabels: Record<string, string> = {
  question: 'Question', statistic: 'Data/Stat', controversy: 'Controversy',
  pov: 'POV', storytelling: 'Storytelling', list: 'List',
  bold_statement: 'Bold Statement', curiosity: 'Curiosity', prediction: 'Prediction',
  confession: 'Confession', how_to: 'How-to', social_proof: 'Social Proof',
  challenge: 'Challenge', announcement: 'Announcement', analogy: 'Analogy',
  contrarian: 'Contrarian', relatable: 'Relatable', motivational: 'Motivational',
  observation: 'Observation', direct_address: 'Direct Address', other: 'Other',
};

const structLabels: Record<string, string> = {
  list: 'List', problem_solution: 'Problem>Solution', story_lesson: 'Story>Lesson',
  short_punchy: 'Short&Punchy', long_form: 'Long-form', other: 'Other',
};

const toneLabels: Record<string, { label: string; emoji: string; desc: string }> = {
  urgency: { label: 'Urgency', emoji: '🔥', desc: 'Time pressure, scarcity, "act now"' },
  authority: { label: 'Authority', emoji: '👑', desc: 'Expertise, credentials, proven results' },
  social_proof: { label: 'Social Proof', emoji: '👥', desc: 'Others validate, trending, "everyone"' },
  fomo: { label: 'FOMO', emoji: '😰', desc: 'Fear of missing out, competitors ahead' },
  aspirational: { label: 'Aspirational', emoji: '🚀', desc: 'Dreams, transformation, next level' },
  empathy: { label: 'Empathy', emoji: '🤝', desc: 'Understanding pain, "been there"' },
  provocative: { label: 'Provocative', emoji: '💣', desc: 'Strong opinions, divisive, "wake up"' },
  educational: { label: 'Educational', emoji: '📚', desc: 'Teaching, explaining, frameworks' },
  vulnerable: { label: 'Vulnerable', emoji: '💔', desc: 'Failure, fear, personal weakness' },
  humorous: { label: 'Humorous', emoji: '😂', desc: 'Jokes, irony, self-deprecation' },
  neutral: { label: 'Neutral', emoji: '📄', desc: 'Balanced, informational' },
};

const toneColors: Record<string, string> = {
  urgency: '#f87171', authority: '#fbbf24', social_proof: '#a78bfa',
  fomo: '#fb923c', aspirational: '#34d399', empathy: '#38bdf8',
  provocative: '#e8935a', educational: '#6366f1', vulnerable: '#f472b6',
  humorous: '#22d3ee', neutral: '#4b5563',
};

const BASE = import.meta.env.VITE_API_URL || '';

export default function OutlierExplorer() {
  const { data, loading, error } = useApi<CrossCreatorData>('/api/analysis/cross-creators');
  const { data: creators } = useApi<Creator[]>('/api/creators');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<CompareData[] | null>(null);
  const [comparing, setComparing] = useState(false);

  const toggleCreator = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) return;
    setComparing(true);
    try {
      const res = await fetch(`${BASE}/api/analysis/compare?ids=${selectedIds.join(',')}`);
      const json = await res.json();
      setCompareData(json);
    } catch {}
    setComparing(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Outlier Explorer</h1>
        <p className="text-text-secondary">Top performing content across all analyzed creators.</p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger text-sm">{error}</div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {data && (
        <>
          {/* Global patterns summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-bg-card rounded-lg p-4 text-center">
              <p className="text-text-muted text-xs mb-1">Total Outliers</p>
              <p className="text-2xl font-bold text-accent">{data.patterns.total_outliers}</p>
            </div>
            <div className="bg-bg-card rounded-lg p-4 text-center">
              <p className="text-text-muted text-xs mb-1">Avg Word Count</p>
              <p className="text-2xl font-bold text-text-primary">{data.patterns.avg_word_count}</p>
            </div>
            <div className="bg-bg-card rounded-lg p-4 text-center">
              <p className="text-text-muted text-xs mb-1">CTA Usage</p>
              <p className="text-2xl font-bold text-text-primary">{data.patterns.cta_rate}%</p>
            </div>
            <div className="bg-bg-card rounded-lg p-4 text-center">
              <p className="text-text-muted text-xs mb-1">Top Type</p>
              <p className="text-2xl font-bold text-text-primary">
                {Object.entries(data.patterns.content_type_distribution)
                  .sort((a, b) => b[1] - a[1])[0]?.[0] || '--'}
              </p>
            </div>
          </div>

          {/* Common traits of top outliers */}
          {data.patterns.common_traits && data.patterns.common_traits.length > 0 && (
            <div className="bg-bg-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">What Top Outliers Have in Common</h3>
              <div className="flex flex-wrap gap-3">
                {data.patterns.common_traits.map((trait, i) => (
                  <span key={i} className="bg-accent/10 text-accent border border-accent/20 px-3 py-1.5 rounded-lg text-sm">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hook type & Structure distribution across outliers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.patterns.hook_type_distribution && (
              <div className="bg-bg-card rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-3 text-text-secondary">Hook Types in Outliers</h3>
                <div className="space-y-2">
                  {Object.entries(data.patterns.hook_type_distribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const total = Object.values(data.patterns.hook_type_distribution).reduce((s, v) => s + v, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <span className="text-xs text-text-secondary w-24 truncate">{hookLabels[type] || type}</span>
                          <div className="flex-1 bg-bg-secondary rounded-full h-4 overflow-hidden">
                            <div className="bg-accent h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-text-muted w-16 text-right">{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            {data.patterns.structure_distribution && (
              <div className="bg-bg-card rounded-xl p-6">
                <h3 className="text-sm font-semibold mb-3 text-text-secondary">Post Structure in Outliers</h3>
                <div className="space-y-2">
                  {Object.entries(data.patterns.structure_distribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([structure, count]) => {
                      const total = Object.values(data.patterns.structure_distribution).reduce((s, v) => s + v, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={structure} className="flex items-center gap-3">
                          <span className="text-xs text-text-secondary w-28 truncate">{structLabels[structure] || structure}</span>
                          <div className="flex-1 bg-bg-secondary rounded-full h-4 overflow-hidden">
                            <div className="bg-success h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-text-muted w-16 text-right">{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Text Psychology / Tone Analysis */}
          {data.patterns.tone_breakdown && data.patterns.tone_breakdown.length > 0 && (
            <div className="bg-bg-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-1">Text Psychology of Outliers</h3>
              <p className="text-text-muted text-xs mb-4">What psychological triggers are the top posts using? Ranked by avg engagement.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.patterns.tone_breakdown.map((t) => {
                  const info = toneLabels[t.tone] || { label: t.tone, emoji: '📄', desc: '' };
                  const color = toneColors[t.tone] || '#4b5563';
                  return (
                    <div key={t.tone} className="bg-bg-secondary rounded-lg p-4 border border-border/50 hover:border-border transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{info.emoji}</span>
                        <span className="font-semibold text-text-primary">{info.label}</span>
                        <span className="ml-auto text-xs text-text-muted">{t.count} posts</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-bg-primary rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (t.avg_engagement / Math.max(...data.patterns.tone_breakdown.map(x => x.avg_engagement))) * 100)}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-text-primary">{t.avg_engagement.toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-text-muted">{info.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tone distribution in outliers */}
          {data.patterns.tone_distribution && Object.keys(data.patterns.tone_distribution).length > 0 && (
            <div className="bg-bg-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-3 text-text-secondary">Dominant Tone in Outlier Posts</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.patterns.tone_distribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([tone, count]) => {
                    const info = toneLabels[tone] || { label: tone, emoji: '📄', desc: '' };
                    const total = Object.values(data.patterns.tone_distribution).reduce((s, v) => s + v, 0);
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <span
                        key={tone}
                        className="px-3 py-1.5 rounded-lg text-sm border"
                        style={{ borderColor: toneColors[tone] || '#4b5563', color: toneColors[tone] || '#9ca3af', backgroundColor: `${toneColors[tone] || '#4b5563'}15` }}
                      >
                        {info.emoji} {info.label} {pct}%
                      </span>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Frequency vs Engagement */}
          {data.patterns.frequency_correlation && data.patterns.frequency_correlation.length >= 2 && (
            <div className="bg-bg-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">Posting Frequency vs Avg Engagement</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {data.patterns.frequency_correlation
                  .sort((a, b) => b.avgEngagement - a.avgEngagement)
                  .map((c, i) => (
                    <div key={i} className="bg-bg-secondary rounded-lg p-3 text-center">
                      <p className="text-text-muted text-xs">{c.postsPerWeek} posts/week</p>
                      <p className="text-text-primary font-bold text-lg">{c.avgEngagement.toLocaleString()} avg eng</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Creator Comparison */}
          {creators && creators.length >= 2 && (
            <div className="bg-bg-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">Compare Creators</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {creators.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggleCreator(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      selectedIds.includes(c.id)
                        ? 'bg-accent/20 border-accent text-accent'
                        : 'bg-bg-secondary border-border text-text-secondary hover:border-accent/50'
                    }`}
                  >
                    {c.name || 'Unknown'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCompare}
                disabled={selectedIds.length < 2 || comparing}
                className="px-4 py-2 bg-accent text-bg-primary rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-accent-light transition-colors"
              >
                {comparing ? 'Loading...' : `Compare ${selectedIds.length} creators`}
              </button>

              {compareData && compareData.length >= 2 && (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-secondary text-left border-b border-border">
                        <th className="pb-3 font-medium">Metric</th>
                        {compareData.map((c) => (
                          <th key={c.id} className="pb-3 font-medium text-center">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Followers', key: 'followers_count', fmt: (v: number) => v > 0 ? v.toLocaleString() : 'N/A' },
                        { label: 'Total Posts', key: 'total_posts' },
                        { label: 'Outliers', key: 'total_outliers', accent: true },
                        { label: 'Outlier Rate', key: 'outlier_rate', suffix: '%', accent: true },
                        { label: 'Avg Engagement', key: 'avg_engagement', fmt: (v: number) => v.toLocaleString() },
                        { label: 'Median Engagement', key: 'median_engagement', fmt: (v: number) => v.toLocaleString() },
                        { label: 'Eng. Rate', key: 'engagement_rate', suffix: '%' },
                        { label: 'Posts/Week', key: 'posts_per_week' },
                        { label: 'Comment/Like', key: 'avg_comment_like_ratio', fmt: (v: number) => `${Math.round(v * 100)}%` },
                        { label: 'Share/Like', key: 'avg_share_like_ratio', fmt: (v: number) => `${Math.round(v * 100)}%` },
                      ].map((row) => {
                        const values = compareData.map((c) => (c as any)[row.key] as number);
                        const max = Math.max(...values);
                        return (
                          <tr key={row.key} className="border-b border-border/30">
                            <td className="py-2.5 text-text-secondary">{row.label}</td>
                            {compareData.map((c, i) => {
                              const val = values[i];
                              const isMax = val === max && max > 0;
                              const display = row.fmt ? row.fmt(val) : `${val}${row.suffix || ''}`;
                              return (
                                <td key={c.id} className={`py-2.5 text-center font-medium ${isMax ? (row.accent ? 'text-accent' : 'text-success') : 'text-text-primary'}`}>
                                  {display}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Top outliers grid */}
          {data.top_outliers.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <p className="text-4xl mb-4">&#x1f50d;</p>
              <p>No outliers found yet. Add some creators from the Dashboard first.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold">Top Outliers Across All Creators</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.top_outliers.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
