import { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import PostCard from '../components/PostCard';
import { SkeletonCard } from '../components/Skeleton';

interface PostExplanation {
  summary: string;
  narrative_mechanism: string;
  hook_tension: string;
  virality_driver: { driver: string; label: string; explanation: string };
  comment_driver: string;
  abstract_template: string;
}

interface NarrativeRhythm {
  hook_zone: { lines: number; avg_words_per_line: number; style: string };
  body: { style: string; has_list: boolean; has_tension_relief: boolean; mini_hooks: number };
  closing: { style: string; cta_type: string | null };
  sentence_rhythm: { short_long_alternation: number; avg_line_length: number };
  scroll_stops: number;
  scroll_stop_types: string[];
}

interface Archetype {
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
}

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
    post_structure?: string;
    text_tone?: string;
    post_url: string | null;
    creator_name: string;
    creator_image: string | null;
    ai_explanation?: PostExplanation;
    narrative_rhythm?: NarrativeRhythm;
  }[];
  patterns: {
    total_outliers: number;
    content_type_distribution: Record<string, number>;
    hook_type_distribution: Record<string, number>;
    structure_distribution: Record<string, number>;
    tone_comparison: {
      tone: string;
      outlier_count: number;
      outlier_avg_ratio: number;
      outlier_avg_engagement: number;
      outlier_pct: number;
      normal_count: number;
      normal_avg_ratio: number;
      normal_avg_engagement: number;
      normal_pct: number;
    }[];
    tone_interpretation: string;
    neutral_outlier_pct: number;
    avg_word_count: number;
    cta_rate: number;
    common_traits: string[];
    frequency_correlation: { postsPerWeek: number; avgEngagement: number }[];
    archetypes?: Archetype[];
    text_patterns: {
      opening_patterns: { pattern: string; count: number; pct: number; examples: string[] }[];
      closing_patterns: { pattern: string; count: number; pct: number; examples: string[] }[];
      recurring_phrases: { phrase: string; count: number; outlier_pct: number; normal_pct: number; overindex: number }[];
      semantic_categories?: { category: string; label: string; outlier_density: number; normal_density: number; diff_pct: number }[];
      formatting_style: {
        avg_sentence_length: { outlier: number; normal: number };
        avg_line_breaks: { outlier: number; normal: number };
        avg_word_count: { outlier: number; normal: number };
        emoji_rate: { outlier: number; normal: number };
        hashtag_rate: { outlier: number; normal: number };
        question_rate: { outlier: number; normal: number };
      } | null;
      writing_analysis: string;
    };
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
  pattern_interrupt: 'Pattern Interrupt', belief_breaker: 'Belief Breaker',
  curiosity_gap: 'Curiosity Gap', data_shock: 'Data Shock', hot_take: 'Hot Take',
  personal_confession: 'Personal Confession', story_opener: 'Story Opener',
  hypothetical_question: 'Hypothetical Q', why_question: 'Why Question',
  how_question: 'How Question', direct_question: 'Direct Question',
  open_question: 'Open Question', rhetorical_question: 'Rhetorical Q',
  list_promise: 'List Promise', prediction: 'Prediction',
  how_to_framework: 'How-To', bold_claim: 'Bold Claim',
  common_mistake: 'Common Mistake', direct_callout: 'Direct Callout',
  announcement: 'Announcement', social_proof_opener: 'Social Proof',
  analogy: 'Analogy', contrarian_take: 'Contrarian', relatable_moment: 'Relatable',
  motivational: 'Motivational', observation: 'Observation', challenge: 'Challenge',
  other: 'Other',
};

const structLabels: Record<string, string> = {
  hook_list_cta: 'Hook>List>CTA', hook_story_lesson_cta: 'Hook>Story>Lesson>CTA',
  problem_agitate_solve: 'Problem>Agitate>Solve', contrarian_proof_reframe: 'Contrarian>Proof>Reframe',
  confession_insight_takeaway: 'Confession>Insight>Takeaway', list_framework: 'List/Framework',
  problem_solution: 'Problem>Solution', story_lesson: 'Story>Lesson',
  before_after: 'Before/After', step_by_step: 'Step-by-Step',
  myth_busting: 'Myth Busting', question_answer: 'Question>Answer',
  observation_insight: 'Observation>Insight', prediction_vision: 'Prediction',
  motivational_manifesto: 'Motivational', authority_framework: 'Authority>Framework',
  comparison: 'Comparison', short_punchy: 'Short&Punchy',
  long_form_essay: 'Long-form', narrative_arc: 'Narrative Arc',
  content_with_cta: 'Content+CTA', data_driven: 'Data-Driven', other: 'Other',
};

const viralityDriverColors: Record<string, string> = {
  social_currency: '#fbbf24', controversy: '#f87171', identity: '#a78bfa',
  belonging: '#38bdf8', utility: '#34d399', emotion: '#f472b6', aspiration: '#22d3ee',
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
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const contentTypes = useMemo(() => {
    if (!data) return [];
    const types = new Set(data.top_outliers.map((p) => p.content_type));
    return ['all', ...Array.from(types).sort()];
  }, [data]);

  const filteredOutliers = useMemo(() => {
    if (!data) return [];
    if (contentTypeFilter === 'all') return data.top_outliers;
    return data.top_outliers.filter((p) => p.content_type === contentTypeFilter);
  }, [data, contentTypeFilter]);

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

          {/* AI Text Pattern Analysis */}
          {data.patterns.text_patterns && (
            <div className="bg-bg-card rounded-xl p-6 border border-accent/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🧠</span>
                <h3 className="text-lg font-semibold">Text Pattern Analysis</h3>
              </div>
              <p className="text-text-muted text-xs mb-5">Patterns found in the actual text of outlier posts vs normal posts.</p>

              {/* Writing analysis summary */}
              {data.patterns.text_patterns.writing_analysis && (
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-5">
                  <div className="space-y-2">
                    {data.patterns.text_patterns.writing_analysis.split('\n\n').map((p, i) => (
                      <p key={i} className="text-sm text-text-secondary leading-relaxed">{p}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Opening patterns */}
                {data.patterns.text_patterns.opening_patterns.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-text-secondary mb-3">How Outliers Open</h4>
                    <div className="space-y-2">
                      {data.patterns.text_patterns.opening_patterns.slice(0, 6).map((p) => (
                        <div key={p.pattern} className="bg-bg-secondary rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-text-primary">{p.pattern}</span>
                            <span className="text-xs text-accent font-bold">{p.pct}%</span>
                          </div>
                          <div className="w-full bg-bg-primary rounded-full h-1.5 mb-2">
                            <div className="bg-accent h-full rounded-full" style={{ width: `${p.pct}%` }} />
                          </div>
                          {p.examples[0] && (
                            <p className="text-[10px] text-text-muted italic truncate">"{p.examples[0]}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Closing patterns */}
                {data.patterns.text_patterns.closing_patterns.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-text-secondary mb-3">How Outliers Close</h4>
                    <div className="space-y-2">
                      {data.patterns.text_patterns.closing_patterns.slice(0, 6).map((p) => (
                        <div key={p.pattern} className="bg-bg-secondary rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-text-primary">{p.pattern}</span>
                            <span className="text-xs text-success font-bold">{p.pct}%</span>
                          </div>
                          <div className="w-full bg-bg-primary rounded-full h-1.5 mb-2">
                            <div className="bg-success h-full rounded-full" style={{ width: `${p.pct}%` }} />
                          </div>
                          {p.examples[0] && (
                            <p className="text-[10px] text-text-muted italic truncate">"{p.examples[0]}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recurring phrases + Semantic categories */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {data.patterns.text_patterns.recurring_phrases.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-text-secondary mb-3">Recurring Phrases in Outliers</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.patterns.text_patterns.recurring_phrases.map((p) => (
                        <span
                          key={p.phrase}
                          className="px-2.5 py-1 rounded-lg text-xs border"
                          style={{
                            borderColor: p.overindex > 2 ? '#e8935a' : '#374151',
                            color: p.overindex > 2 ? '#e8935a' : '#9ca3af',
                            backgroundColor: p.overindex > 2 ? '#e8935a15' : '#37415115',
                          }}
                          title={`${p.outlier_pct}% of outliers vs ${p.normal_pct}% normal (${p.overindex}x overindex)`}
                        >
                          "{p.phrase}" ({p.count}x)
                          {p.overindex > 2 && <span className="ml-1 font-bold">{p.overindex}x</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {data.patterns.text_patterns.semantic_categories && data.patterns.text_patterns.semantic_categories.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-text-secondary mb-3">Language Patterns: Outliers vs Normal</h4>
                    <div className="space-y-2">
                      {data.patterns.text_patterns.semantic_categories.map((c) => {
                        const isHigher = c.diff_pct > 0;
                        return (
                          <div key={c.category} className="bg-bg-secondary rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-text-primary">{c.label}</span>
                              <span className={`text-xs font-bold ${isHigher ? 'text-success' : c.diff_pct < -10 ? 'text-danger' : 'text-text-muted'}`}>
                                {isHigher ? '+' : ''}{c.diff_pct}%
                              </span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <div className="flex-1">
                                <div className="flex gap-1 items-center text-[10px] text-text-muted">
                                  <span className="text-accent">Outlier: {c.outlier_density}/100w</span>
                                  <span className="text-text-muted ml-2">Normal: {c.normal_density}/100w</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Writing style comparison */}
              {data.patterns.text_patterns.formatting_style && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-text-secondary mb-3">Writing Style: Outliers vs Normal</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {[
                      { label: 'Words/post', o: data.patterns.text_patterns.formatting_style.avg_word_count.outlier, n: data.patterns.text_patterns.formatting_style.avg_word_count.normal },
                      { label: 'Words/sentence', o: data.patterns.text_patterns.formatting_style.avg_sentence_length.outlier, n: data.patterns.text_patterns.formatting_style.avg_sentence_length.normal },
                      { label: 'Line breaks', o: data.patterns.text_patterns.formatting_style.avg_line_breaks.outlier, n: data.patterns.text_patterns.formatting_style.avg_line_breaks.normal },
                      { label: 'Use emojis', o: data.patterns.text_patterns.formatting_style.emoji_rate.outlier, n: data.patterns.text_patterns.formatting_style.emoji_rate.normal, suffix: '%' },
                      { label: 'Use hashtags', o: data.patterns.text_patterns.formatting_style.hashtag_rate.outlier, n: data.patterns.text_patterns.formatting_style.hashtag_rate.normal, suffix: '%' },
                      { label: 'Have questions', o: data.patterns.text_patterns.formatting_style.question_rate.outlier, n: data.patterns.text_patterns.formatting_style.question_rate.normal, suffix: '%' },
                    ].map((stat) => {
                      const diff = stat.n > 0 ? ((stat.o - stat.n) / stat.n) : 0;
                      const isHigher = stat.o > stat.n;
                      return (
                        <div key={stat.label} className="bg-bg-secondary rounded-lg p-3 text-center">
                          <p className="text-text-muted text-[10px] mb-1">{stat.label}</p>
                          <p className={`text-lg font-bold ${isHigher ? 'text-accent' : 'text-text-primary'}`}>
                            {stat.o}{stat.suffix || ''}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            vs {stat.n}{stat.suffix || ''} normal
                          </p>
                          {Math.abs(diff) > 0.1 && (
                            <p className={`text-[10px] font-bold ${isHigher ? 'text-success' : 'text-danger'}`}>
                              {isHigher ? '+' : ''}{Math.round(diff * 100)}%
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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

          {/* Text Psychology / Tone Analysis — Outliers vs Normal comparison */}
          {data.patterns.tone_comparison && data.patterns.tone_comparison.length > 0 && (
            <div className="bg-bg-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-1">Text Psychology: Outliers vs Normal</h3>
              <p className="text-text-muted text-xs mb-4">
                Comparing psychological triggers between outlier posts and regular posts. Sorted by outlier engagement.
              </p>

              {/* Interpretation box */}
              {data.patterns.tone_interpretation && (
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mb-5">
                  <p className="text-sm text-text-secondary leading-relaxed">{data.patterns.tone_interpretation}</p>
                </div>
              )}

              {/* Neutral stat */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-text-muted text-xs">Neutral tone in outliers:</span>
                <span className={`text-sm font-bold ${data.patterns.neutral_outlier_pct > 50 ? 'text-text-muted' : 'text-accent'}`}>
                  {data.patterns.neutral_outlier_pct}%
                </span>
                <span className="text-text-muted text-[10px]">
                  {data.patterns.neutral_outlier_pct > 50
                    ? '(content value matters more than emotional triggers)'
                    : '(emotional triggers drive performance)'}
                </span>
              </div>

              {/* Comparative cards — sorted by outlier ratio */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.patterns.tone_comparison.map((t) => {
                  const info = toneLabels[t.tone] || { label: t.tone, emoji: '', desc: '' };
                  const color = toneColors[t.tone] || '#4b5563';
                  const maxRatio = Math.max(...data.patterns.tone_comparison.map((x) => x.outlier_avg_ratio || 0), 1);
                  const diff = t.outlier_pct - t.normal_pct;
                  return (
                    <div key={t.tone} className="bg-bg-secondary rounded-lg p-4 border border-border/50 hover:border-border transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{info.emoji}</span>
                        <span className="font-semibold text-text-primary">{info.label}</span>
                        {diff !== 0 && (
                          <span className={`ml-auto text-[10px] font-bold ${diff > 0 ? 'text-success' : 'text-danger'}`}>
                            {diff > 0 ? '+' : ''}{diff}pp in outliers
                          </span>
                        )}
                      </div>

                      {/* Ratio bar (primary) */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-bg-primary rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, ((t.outlier_avg_ratio || 0) / maxRatio) * 100)}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-text-primary">{t.outlier_avg_ratio || 0}x</span>
                      </div>

                      {/* Engagement as secondary */}
                      <p className="text-[10px] text-text-muted mb-2">
                        {t.outlier_avg_engagement.toLocaleString()} avg eng
                      </p>

                      {/* Outlier vs Normal comparison */}
                      <div className="flex gap-4 text-[10px] mb-1">
                        <div>
                          <span className="text-accent">Outliers: </span>
                          <span className="text-text-secondary">{t.outlier_count} posts ({t.outlier_pct}%)</span>
                        </div>
                        <div>
                          <span className="text-text-muted">Normal: </span>
                          <span className="text-text-secondary">{t.normal_count} posts ({t.normal_pct}%)</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-text-muted">{info.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Viral Archetypes — cross hook×structure×tone recipes */}
          {data.patterns.archetypes && data.patterns.archetypes.length > 0 && (
            <div className="bg-bg-card rounded-xl p-6 border border-accent/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🧬</span>
                <h3 className="text-lg font-semibold">Viral Archetypes</h3>
              </div>
              <p className="text-text-muted text-xs mb-5">
                Cross-variable recipes: combinations of hook type + structure + tone that produce the highest engagement.
              </p>
              <div className="space-y-3">
                {data.patterns.archetypes.slice(0, 10).map((a, i) => (
                  <div key={a.archetype} className="bg-bg-secondary rounded-lg p-4 border border-border/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="text-xs text-accent font-bold mr-2">#{i + 1}</span>
                        <span className="text-sm font-semibold text-text-primary">{a.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-accent">{a.avg_outlier_ratio}x</span>
                        <span className="text-[10px] text-text-muted ml-1">avg ratio</span>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary mb-2">{a.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-text-muted">
                      <span>{a.count} posts</span>
                      <span>{a.avg_engagement.toLocaleString()} avg eng</span>
                    </div>
                    {a.example_hooks.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {a.example_hooks.map((h, j) => (
                          <p key={j} className="text-[10px] text-text-muted italic truncate">"{h}"</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
              {/* Header + filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h2 className="text-xl font-bold">
                  All Outliers
                  <span className="text-text-muted text-sm font-normal ml-2">
                    ({filteredOutliers.length}{contentTypeFilter !== 'all' ? ` of ${data.top_outliers.length}` : ''})
                  </span>
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-text-muted text-xs">Filter:</span>
                  {contentTypes.map((type) => {
                    const typeLabel: Record<string, string> = {
                      all: 'All', text_only: 'Text', image: 'Image',
                      carousel: 'Carousel', video: 'Video', poll: 'Poll',
                      article: 'Article', document: 'Document',
                    };
                    const count = type === 'all'
                      ? data.top_outliers.length
                      : data.top_outliers.filter((p) => p.content_type === type).length;
                    return (
                      <button
                        key={type}
                        onClick={() => setContentTypeFilter(type)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          contentTypeFilter === type
                            ? 'bg-accent/20 text-accent border border-accent/30'
                            : 'bg-bg-secondary text-text-muted border border-border hover:border-accent/30'
                        }`}
                      >
                        {typeLabel[type] || type} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Outlier cards with deep analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOutliers.map((post) => (
                  <div key={post.id} className="flex flex-col">
                    <PostCard post={post} />
                    {/* Deep analysis panel */}
                    {post.ai_explanation && (
                      <div className="bg-bg-card border-x border-b border-border rounded-b-xl -mt-3 pt-4 px-5 pb-4">
                        <button
                          onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                          className="text-[11px] text-accent hover:text-accent-light transition-colors flex items-center gap-1 w-full"
                        >
                          <span>🧠</span>
                          <span>{expandedPost === post.id ? 'Hide analysis' : 'Why did this work?'}</span>
                          {post.ai_explanation.virality_driver && (
                            <span
                              className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold"
                              style={{
                                backgroundColor: (viralityDriverColors[post.ai_explanation.virality_driver.driver] || '#4b5563') + '20',
                                color: viralityDriverColors[post.ai_explanation.virality_driver.driver] || '#4b5563',
                              }}
                            >
                              {post.ai_explanation.virality_driver.label}
                            </span>
                          )}
                        </button>
                        {expandedPost === post.id && (
                          <div className="mt-3 space-y-3">
                            {/* Summary */}
                            <p className="text-xs text-text-secondary leading-relaxed">
                              {post.ai_explanation.summary}
                            </p>

                            {/* Narrative mechanism */}
                            <div className="bg-bg-secondary rounded-lg p-3">
                              <p className="text-[10px] text-text-muted font-semibold mb-1">Narrative Mechanism</p>
                              <p className="text-xs text-text-secondary">{post.ai_explanation.narrative_mechanism}</p>
                            </div>

                            {/* Hook tension */}
                            <div className="bg-bg-secondary rounded-lg p-3">
                              <p className="text-[10px] text-text-muted font-semibold mb-1">Hook Tension</p>
                              <p className="text-xs text-text-secondary">{post.ai_explanation.hook_tension}</p>
                            </div>

                            {/* Virality driver */}
                            <div className="bg-bg-secondary rounded-lg p-3">
                              <p className="text-[10px] text-text-muted font-semibold mb-1">
                                Virality Driver:
                                <span
                                  className="ml-1 px-1.5 py-0.5 rounded font-bold"
                                  style={{
                                    backgroundColor: (viralityDriverColors[post.ai_explanation.virality_driver.driver] || '#4b5563') + '20',
                                    color: viralityDriverColors[post.ai_explanation.virality_driver.driver] || '#4b5563',
                                  }}
                                >
                                  {post.ai_explanation.virality_driver.label}
                                </span>
                              </p>
                              <p className="text-xs text-text-secondary mt-1">{post.ai_explanation.virality_driver.explanation}</p>
                            </div>

                            {/* Comment driver */}
                            <div className="bg-bg-secondary rounded-lg p-3">
                              <p className="text-[10px] text-text-muted font-semibold mb-1">Why People Comment</p>
                              <p className="text-xs text-text-secondary">{post.ai_explanation.comment_driver}</p>
                            </div>

                            {/* Abstract template */}
                            <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
                              <p className="text-[10px] text-accent font-semibold mb-1">Replicable Template</p>
                              <p className="text-xs text-text-secondary font-mono">{post.ai_explanation.abstract_template}</p>
                            </div>

                            {/* Narrative rhythm */}
                            {post.narrative_rhythm && (
                              <div className="bg-bg-secondary rounded-lg p-3">
                                <p className="text-[10px] text-text-muted font-semibold mb-2">Narrative Rhythm</p>
                                <div className="grid grid-cols-3 gap-2 text-[10px]">
                                  <div>
                                    <span className="text-text-muted">Hook: </span>
                                    <span className="text-text-secondary">{post.narrative_rhythm.hook_zone.style.replace(/_/g, ' ')}</span>
                                  </div>
                                  <div>
                                    <span className="text-text-muted">Body: </span>
                                    <span className="text-text-secondary">{post.narrative_rhythm.body.style.replace(/_/g, ' ')}</span>
                                  </div>
                                  <div>
                                    <span className="text-text-muted">Close: </span>
                                    <span className="text-text-secondary">{post.narrative_rhythm.closing.style.replace(/_/g, ' ')}</span>
                                  </div>
                                </div>
                                <div className="flex gap-3 mt-2 text-[10px] text-text-muted">
                                  <span>Scroll stops: {post.narrative_rhythm.scroll_stops}</span>
                                  <span>Rhythm variation: {post.narrative_rhythm.sentence_rhythm.short_long_alternation}%</span>
                                  {post.narrative_rhythm.body.mini_hooks > 0 && <span>Mini-hooks: {post.narrative_rhythm.body.mini_hooks}</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
