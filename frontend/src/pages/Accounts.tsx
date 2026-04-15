import { useState, useMemo } from 'react';
import { useApi, apiPatch } from '../hooks/useApi';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';

interface ManagedAccount {
  id: string;
  name: string | null;
  headline: string | null;
  profile_image_url: string | null;
  followers_count: number;
  location: string | null;
  last_scraped_at: string | null;
  is_managed: boolean;
  total_posts: number;
  total_outliers: number;
  avg_engagement: number;
  max_engagement: number;
  last_post_at: string | null;
}

interface Candidate {
  id: string;
  name: string | null;
  headline: string | null;
  profile_image_url: string | null;
  followers_count: number;
  is_managed: boolean;
}

interface WeeklyRow {
  week: string;
  posts: number;
  outliers: number;
  avg_engagement: number;
  max_engagement: number;
}

interface FormatRow {
  content_type: string;
  count: number;
  avg_engagement: number;
  outliers: number;
}

interface HookRow {
  hook_type: string;
  count: number;
  avg_engagement: number;
}

interface TopPost {
  id: string;
  content_text: string | null;
  content_type: string;
  published_at: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  engagement_score: number;
  outlier_ratio: number;
  is_outlier: boolean;
  post_url: string | null;
  hook_text: string | null;
  creator_name: string | null;
  creator_image: string | null;
}

interface PerAccountRow {
  id: string;
  name: string | null;
  profile_image_url: string | null;
  posts: number;
  outliers: number;
  avg_engagement: number;
}

interface Analytics {
  days: number;
  creator_id: string | null;
  totals: {
    total_posts: number;
    total_outliers: number;
    avg_engagement: number;
    max_engagement: number;
    total_likes: number;
    total_comments: number;
    total_reposts: number;
  };
  weekly: WeeklyRow[];
  format_mix: FormatRow[];
  top_posts: TopPost[];
  hook_types: HookRow[];
  per_account: PerAccountRow[];
}

const FORMAT_LABELS: Record<string, string> = {
  text_only: 'Text',
  image: 'Image',
  carousel: 'Carousel',
  video: 'Video',
  poll: 'Poll',
  article: 'Article',
  document: 'Document',
};

const FORMAT_COLORS: Record<string, string> = {
  text_only: '#e8935a',
  image: '#6366f1',
  carousel: '#34d399',
  video: '#f87171',
  poll: '#a78bfa',
  article: '#fbbf24',
  document: '#38bdf8',
};

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#222639',
  border: '1px solid #2e3348',
  borderRadius: '8px',
  color: '#e8eaf0',
  fontSize: '12px',
};

function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function fmtWeek(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncate(s: string | null, n: number): string {
  if (!s) return '—';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default function Accounts() {
  const [selectedCreator, setSelectedCreator] = useState<string>('all');
  const [days, setDays] = useState(90);
  const [managerOpen, setManagerOpen] = useState(false);

  const { data: accounts, refetch: refetchAccounts } = useApi<ManagedAccount[]>('/api/accounts');
  const { data: candidates, refetch: refetchCandidates } = useApi<Candidate[]>('/api/accounts/candidates');

  const analyticsPath = `/api/accounts/analytics?days=${days}${selectedCreator !== 'all' ? `&creator_id=${selectedCreator}` : ''}`;
  const { data: analytics, loading: loadingAnalytics } = useApi<Analytics>(analyticsPath);

  const toggleManaged = async (id: string, is_managed: boolean) => {
    try {
      await apiPatch(`/api/accounts/${id}`, { is_managed });
      refetchAccounts();
      refetchCandidates();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const hasAccounts = (accounts?.length || 0) > 0;

  const weeklyChartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.weekly.map((w) => ({
      week: fmtWeek(w.week),
      avg: w.avg_engagement,
      max: w.max_engagement,
      posts: w.posts,
      outliers: w.outliers,
    }));
  }, [analytics]);

  const formatChartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.format_mix.map((f) => ({
      ...f,
      label: FORMAT_LABELS[f.content_type] || f.content_type,
      color: FORMAT_COLORS[f.content_type] || '#6b7280',
    }));
  }, [analytics]);

  const outlierRate = analytics && analytics.totals.total_posts > 0
    ? Math.round((analytics.totals.total_outliers / analytics.totals.total_posts) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2">Accounts BI</h1>
          <p className="text-text-secondary">Track the performance of the LinkedIn accounts you manage.</p>
        </div>
        <button
          onClick={() => setManagerOpen((v) => !v)}
          className="px-4 py-2 bg-bg-card border border-border text-text-secondary text-sm rounded-lg hover:border-accent/40 hover:text-text-primary transition-colors"
        >
          ⚙️ Manage accounts ({candidates?.filter((c) => c.is_managed).length || 0})
        </button>
      </div>

      {/* Account manager panel */}
      {(managerOpen || !hasAccounts) && candidates && (
        <div className="bg-bg-card border border-border rounded-xl p-5 space-y-3">
          <div>
            <h3 className="font-semibold text-text-primary">Select your company accounts</h3>
            <p className="text-xs text-text-muted">
              Tick the creators you're managing. Only managed accounts show up in the BI charts.
            </p>
          </div>
          {candidates.length === 0 ? (
            <p className="text-sm text-text-muted py-4">No creators yet. Add some from the Dashboard first.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {candidates.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                    c.is_managed
                      ? 'border-accent/40 bg-accent/5'
                      : 'border-border hover:border-accent/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={c.is_managed}
                    onChange={(e) => toggleManaged(c.id, e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-accent cursor-pointer"
                  />
                  {c.profile_image_url ? (
                    <img src={c.profile_image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-bg-primary flex items-center justify-center text-text-muted text-xs">
                      {(c.name || '?')[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">{c.name || 'Unknown'}</div>
                    <div className="text-xs text-text-muted truncate">{c.headline || '—'}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {hasAccounts && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Account:</span>
            <select
              value={selectedCreator}
              onChange={(e) => setSelectedCreator(e.target.value)}
              className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="all">All managed accounts</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>{a.name || 'Unknown'}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-text-muted mr-1">Range:</span>
            {[30, 90, 180, 365].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  days === d
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'bg-bg-secondary text-text-muted border border-border hover:border-accent/30'
                }`}
              >
                {d === 365 ? '1y' : `${d}d`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasAccounts && (
        <div className="text-center py-16 text-text-muted border border-dashed border-border rounded-xl">
          <p className="text-4xl mb-4">📈</p>
          <p className="mb-1">No accounts selected yet.</p>
          <p className="text-xs">Use "Manage accounts" above to pick the creators you're managing.</p>
        </div>
      )}

      {/* Analytics */}
      {hasAccounts && analytics && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Total posts</div>
              <div className="text-2xl font-bold text-text-primary mt-1">{analytics.totals.total_posts}</div>
              <div className="text-[10px] text-text-muted mt-0.5">in last {days}d</div>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Avg engagement</div>
              <div className="text-2xl font-bold text-accent mt-1">{fmtNum(analytics.totals.avg_engagement)}</div>
              <div className="text-[10px] text-text-muted mt-0.5">per post</div>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Outliers</div>
              <div className="text-2xl font-bold text-green-400 mt-1">
                {analytics.totals.total_outliers}
                <span className="text-sm text-text-muted ml-1 font-normal">({outlierRate}%)</span>
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">hit rate</div>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Best post</div>
              <div className="text-2xl font-bold text-text-primary mt-1">{fmtNum(analytics.totals.max_engagement)}</div>
              <div className="text-[10px] text-text-muted mt-0.5">peak engagement</div>
            </div>
          </div>

          {/* Engagement totals breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Likes</div>
              <div className="text-lg font-semibold text-text-primary">{fmtNum(analytics.totals.total_likes)}</div>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Comments</div>
              <div className="text-lg font-semibold text-text-primary">{fmtNum(analytics.totals.total_comments)}</div>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Reposts</div>
              <div className="text-lg font-semibold text-text-primary">{fmtNum(analytics.totals.total_reposts)}</div>
            </div>
          </div>

          {/* Engagement trend */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Engagement trend</h3>
              <p className="text-xs text-text-muted">Weekly average engagement score</p>
            </div>
            {weeklyChartData.length === 0 ? (
              <p className="text-center text-text-muted text-sm py-12">No posts in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={weeklyChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3348" />
                  <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#2e3348' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#2e3348' }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="avg" name="Avg engagement" stroke="#e8935a" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="max" name="Max engagement" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Post volume + outliers */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Post volume & outliers</h3>
              <p className="text-xs text-text-muted">How many posts per week and how many crossed the outlier bar</p>
            </div>
            {weeklyChartData.length === 0 ? (
              <p className="text-center text-text-muted text-sm py-12">No posts in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3348" />
                  <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#2e3348' }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#2e3348' }} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: 'rgba(232,147,90,0.05)' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="posts" name="Posts" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outliers" name="Outliers" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Format mix */}
          {formatChartData.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Content format mix</h3>
                <p className="text-xs text-text-muted">Distribution and avg engagement per format</p>
              </div>
              <ResponsiveContainer width="100%" height={Math.max(180, formatChartData.length * 48)}>
                <BarChart data={formatChartData} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={{ stroke: '#2e3348' }}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(232,147,90,0.05)' }}
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(_v: any, _n: any, entry: any) => {
                      const row = entry?.payload;
                      return [
                        `${row.count} posts · avg ${fmtNum(row.avg_engagement)} · ${row.outliers} outliers`,
                        row.label,
                      ];
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} label={{ position: 'right', fill: '#9ca3af', fontSize: 11 }}>
                    {formatChartData.map((r) => (
                      <Cell key={r.content_type} fill={r.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Hook types */}
          {analytics.hook_types.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Best-performing hooks</h3>
                <p className="text-xs text-text-muted">Avg engagement by hook type</p>
              </div>
              <ResponsiveContainer width="100%" height={Math.max(180, analytics.hook_types.length * 40)}>
                <BarChart data={analytics.hook_types} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="hook_type"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    axisLine={{ stroke: '#2e3348' }}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(232,147,90,0.05)' }}
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(_v: any, _n: any, entry: any) => {
                      const row = entry?.payload;
                      return [`avg ${fmtNum(row.avg_engagement)} · ${row.count} posts`, row.hook_type];
                    }}
                  />
                  <Bar dataKey="avg_engagement" fill="#e8935a" radius={[0, 6, 6, 0]} label={{ position: 'right', fill: '#9ca3af', fontSize: 11, formatter: (v: any) => fmtNum(v) }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Per-account comparison */}
          {!selectedCreator || selectedCreator === 'all' ? (
            analytics.per_account.length > 0 && (
              <div className="bg-bg-card border border-border rounded-xl p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Per-account breakdown</h3>
                  <p className="text-xs text-text-muted">Compare accounts side by side</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-text-muted text-xs border-b border-border">
                        <th className="py-2 pr-3">Account</th>
                        <th className="py-2 px-3 text-right">Posts</th>
                        <th className="py-2 px-3 text-right">Outliers</th>
                        <th className="py-2 px-3 text-right">Hit rate</th>
                        <th className="py-2 pl-3 text-right">Avg engagement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.per_account.map((a) => {
                        const rate = a.posts > 0 ? Math.round((a.outliers / a.posts) * 100) : 0;
                        return (
                          <tr key={a.id} className="border-b border-border/50 hover:bg-bg-hover transition-colors">
                            <td className="py-2 pr-3">
                              <div className="flex items-center gap-2">
                                {a.profile_image_url ? (
                                  <img src={a.profile_image_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-bg-primary flex items-center justify-center text-text-muted text-xs">
                                    {(a.name || '?')[0]}
                                  </div>
                                )}
                                <span className="text-text-primary">{a.name || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right text-text-primary">{a.posts}</td>
                            <td className="py-2 px-3 text-right text-green-400">{a.outliers}</td>
                            <td className="py-2 px-3 text-right text-text-secondary">{rate}%</td>
                            <td className="py-2 pl-3 text-right text-accent font-semibold">{fmtNum(a.avg_engagement)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : null}

          {/* Top posts */}
          {analytics.top_posts.length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Top posts</h3>
                <p className="text-xs text-text-muted">Highest-engagement posts in this range</p>
              </div>
              <div className="space-y-2">
                {analytics.top_posts.map((p) => (
                  <div key={p.id} className="flex items-start gap-3 p-3 bg-bg-primary rounded-lg border border-border/50">
                    {p.creator_image ? (
                      <img src={p.creator_image} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted text-xs flex-shrink-0">
                        {(p.creator_name || '?')[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                        <span className="text-text-secondary font-medium">{p.creator_name}</span>
                        <span>·</span>
                        <span>{p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}</span>
                        <span>·</span>
                        <span>{FORMAT_LABELS[p.content_type] || p.content_type}</span>
                        {p.is_outlier && (
                          <span className="px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 text-[10px] font-medium">
                            {p.outlier_ratio?.toFixed(1)}x
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-primary line-clamp-2">{truncate(p.hook_text || p.content_text, 180)}</p>
                      <div className="flex items-center gap-4 text-xs text-text-muted mt-1.5">
                        <span>{fmtNum(p.likes_count)} likes</span>
                        <span>{fmtNum(p.comments_count)} comments</span>
                        <span>{fmtNum(p.reposts_count)} reposts</span>
                        <span className="text-accent font-medium ml-auto">{fmtNum(p.engagement_score)} eng</span>
                        {p.post_url && (
                          <a href={p.post_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light">
                            View →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {loadingAnalytics && hasAccounts && (
        <p className="text-center text-text-muted text-sm py-4">Loading analytics…</p>
      )}
    </div>
  );
}
