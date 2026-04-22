import { useState, useMemo, useEffect } from 'react';
import { useApi, apiPatch, apiPost, apiDelete } from '../hooks/useApi';
import {
  Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ComposedChart, Area, ReferenceLine,
} from 'recharts';
import AccountsEngagementChart from '../components/AccountsEngagementChart';

interface ManagedAccount {
  id: string;
  name: string | null;
  headline: string | null;
  profile_image_url: string | null;
  followers_count: number;
  location: string | null;
  last_scraped_at: string | null;
  is_managed: boolean;
  unipile_account_id: string | null;
  linkedin_id: string | null;
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

interface DailyRow {
  day: string;
  posts: number;
  outliers: number;
  total_engagement: number;
  avg_engagement: number;
  total_impressions: number;
  rolling_sum_7d: number;
  rolling_impressions_7d: number;
  active_posts_7d: number;
  top_post_id: string | null;
  top_post_preview: string | null;
  top_post_url: string | null;
  top_post_outlier_ratio: number | null;
  top_post_is_outlier: boolean | null;
}

interface CompareMetric {
  current: number;
  previous: number;
  delta_pct: number | null;
}

interface Comparison {
  avg_engagement: CompareMetric;
  total_posts: CompareMetric;
  total_outliers: CompareMetric;
  total_likes: CompareMetric;
  total_comments: CompareMetric;
  total_reposts: CompareMetric;
  total_impressions: CompareMetric;
  avg_impressions: CompareMetric;
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
  impressions_count: number | null;
  engagement_score: number;
  outlier_ratio: number;
  is_outlier: boolean;
  post_url: string | null;
  hook_text: string | null;
  creator_name: string | null;
  creator_image: string | null;
}

interface LivePost {
  id: string;
  content_text: string | null;
  hook_text: string | null;
  content_type: string;
  published_at: string;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  impressions_count: number | null;
  engagement_score: number;
  outlier_ratio: number | null;
  is_outlier: boolean;
  post_url: string | null;
  creator_id: string;
  creator_name: string | null;
  creator_image: string | null;
  snapshot_count: number;
  last_snapshot_at: string | null;
  is_live: boolean;
  phase: 'golden' | 'first_wave' | 'consolidation' | 'long_tail' | 'tail' | 'closed';
}

const PHASE_META: Record<LivePost['phase'], { label: string; bg: string; text: string; window: string; cadence: string; blurb: string }> = {
  golden:        { label: '🔥 Golden hour',   bg: 'bg-red-500/15',    text: 'text-red-400',    window: '0 – 1h',   cadence: 'every 15 min', blurb: 'Primera muestra: si engancha, LinkedIn amplía distribución. Ventana que decide si el post prende.' },
  first_wave:    { label: '🌊 1st wave',      bg: 'bg-orange-500/15', text: 'text-orange-400', window: '1 – 6h',   cadence: 'every 30 min', blurb: 'Segunda oleada. Aquí se ve con claridad si va a ser normal, bueno o viral.' },
  consolidation: { label: '📈 Consolidation', bg: 'bg-yellow-500/15', text: 'text-yellow-400', window: '6 – 24h',  cadence: 'every 2h',     blurb: 'Se acumula el grueso del alcance. A las 24h suele haber el 60–70% de las impresiones totales.' },
  long_tail:     { label: '📉 Long tail',     bg: 'bg-sky-500/15',    text: 'text-sky-400',    window: '24 – 72h', cadence: 'every 6h',     blurb: 'Long tail fuerte. A 72h ya tienes el 85–90% de las impresiones finales.' },
  tail:          { label: '🐢 Tail',          bg: 'bg-purple-500/15', text: 'text-purple-400', window: '3 – 7d',   cadence: 'every 24h',    blurb: 'Cola residual, sobre todo comentarios y algún reshare.' },
  closed:        { label: '✅ Closed',        bg: 'bg-bg-secondary',  text: 'text-text-muted', window: '> 7d',     cadence: 'stopped',      blurb: 'Prácticamente muerto salvo virales/evergreen que siguen trayendo impresiones semanas (raro).' },
};

const PHASE_ORDER: LivePost['phase'][] = ['golden', 'first_wave', 'consolidation', 'long_tail', 'tail', 'closed'];

const ZOOM_PRESETS: { label: string; maxMin: number | null }[] = [
  { label: '1h',  maxMin: 60 },
  { label: '6h',  maxMin: 360 },
  { label: '24h', maxMin: 1440 },
  { label: '72h', maxMin: 4320 },
  { label: 'All', maxMin: null },
];

interface Snapshot {
  captured_at: string;
  impressions_count: number | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
}

interface TypicalBucket {
  ageMin: number;
  sampleCount: number;
  p25Imp: number;
  p50Imp: number;
  p75Imp: number;
  p25Eng: number;
  p50Eng: number;
  p75Eng: number;
}

interface SnapshotsResponse {
  post: LivePost;
  snapshots: Snapshot[];
  typical: TypicalBucket[];
}

interface PerAccountRow {
  id: string;
  name: string | null;
  profile_image_url: string | null;
  posts: number;
  outliers: number;
  avg_engagement: number;
  max_virality: number;
  avg_virality: number;
  total_impressions: number;
  avg_impressions: number;
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
    total_impressions: number;
    posts_with_impressions: number;
    avg_impressions: number;
  };
  comparison: Comparison;
  daily: DailyRow[];
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

function fmtDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtFullDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(s: string | null, n: number): string {
  if (!s) return '—';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function Delta({ pct }: { pct: number | null }) {
  if (pct === null || !isFinite(pct)) return null;
  const rounded = Math.round(pct);
  if (rounded === 0) {
    return <span className="text-[10px] font-medium text-text-muted">0%</span>;
  }
  const up = rounded > 0;
  return (
    <span className={`text-[10px] font-medium ${up ? 'text-green-400' : 'text-red-400'}`}>
      {up ? '▲' : '▼'} {Math.abs(rounded)}%
    </span>
  );
}

export default function Accounts() {
  const [selectedCreator, setSelectedCreator] = useState<string>('all');
  const [days, setDays] = useState(90);
  const [managerOpen, setManagerOpen] = useState(false);
  const [unipileEdits, setUnipileEdits] = useState<Record<string, string>>({});
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [scrapeResult, setScrapeResult] = useState<Record<string, string>>({});
  const [legendOpen, setLegendOpen] = useState(false);
  const [liveRefreshing, setLiveRefreshing] = useState(false);
  const [liveRefreshMsg, setLiveRefreshMsg] = useState<string | null>(null);

  const { data: accounts, refetch: refetchAccounts } = useApi<ManagedAccount[]>('/api/accounts');
  const { data: candidates, refetch: refetchCandidates } = useApi<Candidate[]>('/api/accounts/candidates');
  const livePostsPath = `/api/accounts/live-posts${selectedCreator !== 'all' ? `?creator_id=${selectedCreator}` : ''}`;
  const { data: livePosts, refetch: refetchLive } = useApi<LivePost[]>(livePostsPath);

  // Auto-refresh live posts every 2 minutes so new snapshots appear without a page reload
  useEffect(() => {
    const timer = setInterval(() => refetchLive(), 2 * 60 * 1000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const saveUnipileId = async (id: string) => {
    const value = unipileEdits[id] ?? '';
    try {
      await apiPatch(`/api/accounts/${id}`, { unipile_account_id: value });
      setScrapeResult((r) => ({ ...r, [id]: '✓ Saved' }));
      setTimeout(() => setScrapeResult((r) => ({ ...r, [id]: '' })), 2000);
      refetchAccounts();
    } catch (err: any) {
      setScrapeResult((r) => ({ ...r, [id]: `✗ ${err.message}` }));
    }
  };

  const scrapeAccount = async (id: string) => {
    setScrapingId(id);
    setScrapeResult((r) => ({ ...r, [id]: 'Scraping...' }));
    try {
      const res = await apiPost<{ scraped: number; with_impressions: number }>(
        `/api/accounts/${id}/scrape`,
        {}
      );
      setScrapeResult((r) => ({
        ...r,
        [id]: `✓ ${res.scraped} posts · ${res.with_impressions} with impressions`,
      }));
      refetchAccounts();
    } catch (err: any) {
      setScrapeResult((r) => ({ ...r, [id]: `✗ ${err.message}` }));
    } finally {
      setScrapingId(null);
    }
  };

  const hasAccounts = (accounts?.length || 0) > 0;

  const dailyChartData = useMemo(() => {
    if (!analytics) return [];
    return analytics.daily.map((d) => ({
      day: d.day,
      label: fmtDay(d.day),
      rolling: d.rolling_sum_7d,
      raw: d.total_engagement,
      posts: d.posts,
      outliers: d.outliers,
      rollingImpressions: Number(d.rolling_impressions_7d || 0),
      rawImpressions: Number(d.total_impressions || 0),
      activePosts: d.active_posts_7d || 0,
      topPostId: d.top_post_id,
      topPostPreview: d.top_post_preview,
      topPostUrl: d.top_post_url,
      topPostOutlierRatio: d.top_post_outlier_ratio,
      topPostIsOutlier: d.top_post_is_outlier,
    }));
  }, [analytics]);

  // Show ~8 ticks on the x-axis regardless of range length.
  const xTickInterval = Math.max(0, Math.floor(dailyChartData.length / 8) - 1);

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

          {/* Unipile account ID per managed account — needed to scrape impressions */}
          {hasAccounts && (
            <div className="pt-4 mt-4 border-t border-border space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">Unipile account IDs</h4>
                <p className="text-xs text-text-muted">
                  LinkedIn only returns impressions for posts fetched through the account's own Unipile session.
                  Paste each managed account's Unipile <code className="text-accent">account_id</code> below and hit Scrape.
                </p>
              </div>
              <div className="space-y-2">
                {accounts?.map((a) => {
                  const current = unipileEdits[a.id] ?? a.unipile_account_id ?? '';
                  const dirty = current !== (a.unipile_account_id ?? '');
                  const msg = scrapeResult[a.id];
                  return (
                    <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-bg-primary">
                      {a.profile_image_url ? (
                        <img src={a.profile_image_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted text-xs flex-shrink-0">
                          {(a.name || '?')[0]}
                        </div>
                      )}
                      <div className="text-sm text-text-primary w-40 truncate">{a.name || 'Unknown'}</div>
                      <input
                        type="text"
                        value={current}
                        placeholder="Unipile account_id"
                        onChange={(e) => setUnipileEdits((prev) => ({ ...prev, [a.id]: e.target.value }))}
                        className="flex-1 bg-bg-card border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent font-mono"
                      />
                      <button
                        disabled={!dirty}
                        onClick={() => saveUnipileId(a.id)}
                        className="px-2 py-1 text-xs border border-border rounded text-text-secondary hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Save
                      </button>
                      <button
                        disabled={!a.unipile_account_id || scrapingId === a.id}
                        onClick={() => scrapeAccount(a.id)}
                        className="px-2 py-1 text-xs border border-accent/30 bg-accent/10 rounded text-accent hover:bg-accent/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        {scrapingId === a.id ? '…' : 'Scrape'}
                      </button>
                      {msg && <span className="text-[11px] text-text-muted whitespace-nowrap">{msg}</span>}
                    </div>
                  );
                })}
                {!accounts?.length && (
                  <p className="text-xs text-text-muted">Tick some accounts above to configure their Unipile IDs.</p>
                )}
              </div>
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

      {/* Live posts — monitored growth curve. The backend snapshot worker runs every 15 min
          and captures posts published < 6h ago from managed accounts that have a unipile_account_id. */}
      {hasAccounts && (
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {(() => {
                  // "Monitoring" = any tracked post still within the 7d window (any non-closed phase).
                  // Shows a red breathing dot + outward ripple so it feels like a live heartbeat.
                  const monitoring = livePosts?.some((p) => p.phase !== 'closed');
                  return (
                    <span className="relative flex items-center justify-center h-3 w-3">
                      {monitoring && (
                        <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-500 opacity-60 animate-ping" />
                      )}
                      <span
                        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                          monitoring
                            ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.9)]'
                            : 'bg-text-muted'
                        }`}
                      />
                    </span>
                  );
                })()}
                Live posts
              </h3>
              <p className="text-xs text-text-muted">
                Phase-based tracking for 7 days. Only managed accounts with a Unipile account_id configured are tracked.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLegendOpen((v) => !v)}
                className="text-xs text-text-muted hover:text-accent transition-colors"
                title="Cómo LinkedIn distribuye un post en el tiempo"
              >
                {legendOpen ? '▾' : '▸'} How phases work
              </button>
              {livePosts?.some((p) => p.content_text?.startsWith('DEMO ·')) ? (
                <button
                  onClick={async () => {
                    try {
                      await apiDelete('/api/accounts/demo-seed');
                      refetchLive();
                    } catch (err: any) {
                      alert(err.message);
                    }
                  }}
                  className="text-xs text-text-muted hover:text-red-400 transition-colors"
                >
                  ✕ Remove demo
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await apiPost('/api/accounts/demo-seed', {});
                      refetchLive();
                    } catch (err: any) {
                      alert(err.message);
                    }
                  }}
                  className="text-xs text-accent hover:text-accent-light transition-colors"
                >
                  + Load demo data
                </button>
              )}
              <button
                onClick={async () => {
                  setLiveRefreshing(true);
                  setLiveRefreshMsg(null);
                  try {
                    const res = await apiPost<{ captured: number; candidates: number; scraped: number; accounts: number }>(
                      '/api/accounts/live-refresh',
                      {}
                    );
                    setLiveRefreshMsg(`✓ ${res.scraped} posts scraped · ${res.captured} snapshots`);
                    refetchLive();
                    setTimeout(() => setLiveRefreshMsg(null), 5000);
                  } catch (err: any) {
                    setLiveRefreshMsg(`✗ ${err.message}`);
                  } finally {
                    setLiveRefreshing(false);
                  }
                }}
                disabled={liveRefreshing}
                className="text-xs text-text-muted hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Scrape new posts from every managed account and force-capture snapshots for tracked ones"
              >
                {liveRefreshing ? '↻ Scraping…' : '↻ Refresh'}
              </button>
              {liveRefreshMsg && (
                <span className="text-[11px] text-text-muted whitespace-nowrap">{liveRefreshMsg}</span>
              )}
            </div>
          </div>
          {legendOpen && (
            <div className="mb-4 p-4 rounded-lg border border-border bg-bg-primary">
              <p className="text-xs text-text-muted mb-3">
                El algoritmo de LinkedIn distribuye por <span className="text-text-secondary font-medium">oleadas</span>, no linealmente.
                Cada fase tiene su cadencia de captura para samplear denso al principio y tapering al final.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PHASE_ORDER.map((phase) => {
                  const meta = PHASE_META[phase];
                  return (
                    <div key={phase} className="flex items-start gap-2 p-2 rounded border border-border/50 bg-bg-card">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-text-secondary font-medium">
                          {meta.window} <span className="text-text-muted font-normal">· {meta.cadence}</span>
                        </div>
                        <p className="text-[11px] text-text-muted leading-snug mt-0.5">{meta.blurb}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!livePosts ? (
            <p className="text-xs text-text-muted py-6 text-center">Loading…</p>
          ) : livePosts.length === 0 ? (
            <div className="text-center py-8 text-text-muted border border-dashed border-border rounded-lg">
              <p className="text-sm mb-1">No monitored posts yet.</p>
              <p className="text-xs">
                Publish a post from a managed account with its Unipile account_id set, and it'll appear here within 15 min.
                {accounts?.some((a) => !a.unipile_account_id) && (
                  <> You still have managed accounts without a Unipile ID configured — open "Manage accounts" to set them.</>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {livePosts.map((p) => (
                <LivePostRow
                  key={p.id}
                  post={p}
                  onRemoveDemo={
                    p.content_text?.startsWith('DEMO ·')
                      ? async () => {
                          try {
                            await apiDelete('/api/accounts/demo-seed');
                            refetchLive();
                          } catch (err: any) {
                            alert(err.message);
                          }
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics */}
      {hasAccounts && analytics && (
        <>
          {/* KPI cards with period-over-period delta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Total posts</div>
              <div className="flex items-baseline gap-2 mt-1">
                <div className="text-2xl font-bold text-text-primary">{analytics.totals.total_posts}</div>
                <Delta pct={analytics.comparison.total_posts.delta_pct} />
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">vs previous {days}d</div>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Avg engagement</div>
              <div className="flex items-baseline gap-2 mt-1">
                <div className="text-2xl font-bold text-accent">{fmtNum(analytics.totals.avg_engagement)}</div>
                <Delta pct={analytics.comparison.avg_engagement.delta_pct} />
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">per post</div>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Outliers</div>
              <div className="flex items-baseline gap-2 mt-1">
                <div className="text-2xl font-bold text-green-400">
                  {analytics.totals.total_outliers}
                  <span className="text-sm text-text-muted ml-1 font-normal">({outlierRate}%)</span>
                </div>
                <Delta pct={analytics.comparison.total_outliers.delta_pct} />
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">hit rate</div>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Best post</div>
              <div className="text-2xl font-bold text-text-primary mt-1">{fmtNum(analytics.totals.max_engagement)}</div>
              <div className="text-[10px] text-text-muted mt-0.5">peak engagement</div>
            </div>
          </div>

          {/* Impressions — only shown when we have any, since LinkedIn only reports it on the authenticated account's own posts */}
          {analytics.totals.total_impressions > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-card border border-accent/30 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wide text-text-muted flex items-center gap-1.5">
                  <span>👁️</span>
                  <span>Total impressions</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <div className="text-2xl font-bold text-accent">{fmtNum(analytics.totals.total_impressions)}</div>
                  <Delta pct={analytics.comparison.total_impressions.delta_pct} />
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">
                  across {analytics.totals.posts_with_impressions} post{analytics.totals.posts_with_impressions === 1 ? '' : 's'} with data
                </div>
              </div>
              <div className="bg-bg-card border border-accent/30 rounded-xl p-4">
                <div className="text-[10px] uppercase tracking-wide text-text-muted flex items-center gap-1.5">
                  <span>📏</span>
                  <span>Avg impressions</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <div className="text-2xl font-bold text-accent">{fmtNum(analytics.totals.avg_impressions)}</div>
                  <Delta pct={analytics.comparison.avg_impressions.delta_pct} />
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">per post with data</div>
              </div>
            </div>
          )}

          {/* Engagement totals breakdown with deltas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg-card border border-border rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wide text-text-muted text-center">Likes</div>
              <div className="flex items-baseline justify-center gap-2 mt-0.5">
                <div className="text-lg font-semibold text-text-primary">{fmtNum(analytics.totals.total_likes)}</div>
                <Delta pct={analytics.comparison.total_likes.delta_pct} />
              </div>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wide text-text-muted text-center">Comments</div>
              <div className="flex items-baseline justify-center gap-2 mt-0.5">
                <div className="text-lg font-semibold text-text-primary">{fmtNum(analytics.totals.total_comments)}</div>
                <Delta pct={analytics.comparison.total_comments.delta_pct} />
              </div>
            </div>
            <div className="bg-bg-card border border-border rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wide text-text-muted text-center">Reposts</div>
              <div className="flex items-baseline justify-center gap-2 mt-0.5">
                <div className="text-lg font-semibold text-text-primary">{fmtNum(analytics.totals.total_reposts)}</div>
                <Delta pct={analytics.comparison.total_reposts.delta_pct} />
              </div>
            </div>
          </div>

          {/* Daily engagement trend — smoothed line with publication markers */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <div className="mb-2 flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-lg font-semibold">Engagement over time</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent border border-bg-primary" />
                    <span>post</span>
                  </span>
                  <span className="ml-2 inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 border border-bg-primary" />
                    <span>outlier</span>
                  </span>
                  {analytics.totals.total_impressions > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <span className="w-4 h-[2px] bg-sky-400" />
                      <span>impressions (right axis)</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-[11px] text-text-muted mb-3 space-y-0.5">
              <p>
                <span className="text-text-secondary font-medium">Engagement</span>: likes + comments×2 + reposts×3.
                For each day D, we show the 7-day rolling sum — every post published in the previous 7 days
                contributes, so the curve reflects how much of the account's content is still actively gathering
                reach in LinkedIn's distribution window.
              </p>
              <p className="text-text-muted/80 italic">
                Because this account is connected via Unipile, the numbers come from real snapshots (hourly captures
                for each post's first 7 days), not scrape-time totals. Hover any day to see the top post and whether
                it beat the creator's average.
              </p>
            </div>
            {dailyChartData.length === 0 ? (
              <p className="text-center text-text-muted text-sm py-12">No posts in this range.</p>
            ) : (
              <AccountsEngagementChart
                data={dailyChartData}
                hasImpressions={analytics.totals.total_impressions > 0}
                xTickInterval={xTickInterval}
              />
            )}
          </div>

          {/* Daily post volume bar — every day gets a slot so publication cadence is visible */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Publication cadence</h3>
              <p className="text-xs text-text-muted">Posts published each day · green bars crossed the outlier bar</p>
            </div>
            {dailyChartData.length === 0 ? (
              <p className="text-center text-text-muted text-sm py-12">No posts in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e3348" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    axisLine={{ stroke: '#2e3348' }}
                    interval={xTickInterval}
                  />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#2e3348' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    cursor={{ fill: 'rgba(232,147,90,0.05)' }}
                    formatter={(_v: any, _n: any, entry: any) => {
                      const p = entry?.payload;
                      if (!p) return ['', ''];
                      return [`${p.posts} post(s), ${p.outliers} outlier(s)`, fmtFullDay(p.day)];
                    }}
                    labelFormatter={() => ''}
                  />
                  <Bar dataKey="posts" radius={[3, 3, 0, 0]}>
                    {dailyChartData.map((d, i) => (
                      <Cell key={i} fill={d.outliers > 0 ? '#34d399' : '#6366f1'} />
                    ))}
                  </Bar>
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
                        <th className="py-2 px-3 text-right">Avg eng</th>
                        <th className="py-2 px-3 text-right" title="Average engagement / creator average">Avg ×</th>
                        <th className="py-2 px-3 text-right" title="Best single post's multiplier">Peak ×</th>
                        <th className="py-2 px-3 text-right">Impressions</th>
                        <th className="py-2 pl-3 text-right">Avg impressions</th>
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
                            <td className="py-2 px-3 text-right text-accent font-semibold">{fmtNum(a.avg_engagement)}</td>
                            <td className="py-2 px-3 text-right text-text-secondary">{a.avg_virality ? `${a.avg_virality.toFixed(2)}x` : '—'}</td>
                            <td className="py-2 px-3 text-right text-green-400 font-medium">{a.max_virality ? `${a.max_virality.toFixed(1)}x` : '—'}</td>
                            <td className="py-2 px-3 text-right text-text-secondary">{a.total_impressions ? fmtNum(Number(a.total_impressions)) : '—'}</td>
                            <td className="py-2 pl-3 text-right text-text-secondary">{a.avg_impressions ? fmtNum(a.avg_impressions) : '—'}</td>
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
                  <TopPostRow key={p.id} post={p} />
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

function minutesSince(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / 60000);
}

function fmtAge(iso: string): string {
  const m = minutesSince(iso);
  if (m < 60) return `${m}m ago`;
  const h = m / 60;
  if (h < 24) return `${h.toFixed(1)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// Shared snapshot chart — works for any post with captured data (live or historical).
// Fetches `/api/accounts/posts/:id/snapshots` lazily; auto-refreshes every 2 min while live.
function SnapshotCurve({ postId, publishedAt, autoRefresh }: { postId: string; publishedAt: string; autoRefresh?: boolean }) {
  const [zoomMax, setZoomMax] = useState<number | null>(null);
  const { data, loading, refetch } = useApi<SnapshotsResponse>(`/api/accounts/posts/${postId}/snapshots`);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => refetch(), 2 * 60 * 1000);
    return () => clearInterval(timer);
  }, [autoRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge this post's snapshots with the creator's typical percentile curve.
  // To avoid the visual problem where the gray band sits at the bucket edge
  // while the blue/orange snapshot points sit at their own exact ages (so
  // the two series appear offset along the x-axis), we LINEARLY INTERPOLATE
  // the typical percentiles at every snapshot's ageMin. Each snapshot row
  // therefore carries both its own metrics AND the typical values beneath
  // it, guaranteeing the band sits directly under the curve.
  //
  // We also keep any typical buckets past the latest snapshot so the band
  // can extend into the future when another post has been monitored longer
  // than this one, and we anchor the band at (0, 0, 0) so it starts at
  // publish time rather than at the first bucket midpoint.
  const curveDataAll = useMemo(() => {
    if (!data) return [];
    const publishedMs = new Date(publishedAt).getTime();
    const typicalSorted = (data.typical || []).slice().sort((a, b) => a.ageMin - b.ageMin);

    // Origin anchor: at publish time, a post has 0 impressions — so the
    // typical percentiles are all 0 there. Prepend only if the first bucket
    // starts past origin (it always does with midpoint labeling).
    const typicalAnchored = typicalSorted.length > 0 && typicalSorted[0].ageMin > 0
      ? [
          {
            ageMin: 0,
            sampleCount: typicalSorted[0].sampleCount,
            p25Imp: 0, p50Imp: 0, p75Imp: 0,
            p25Eng: 0, p50Eng: 0, p75Eng: 0,
          },
          ...typicalSorted,
        ]
      : typicalSorted;

    const typicalAt = (age: number) => {
      if (typicalAnchored.length === 0) {
        return { range: null as [number, number] | null, median: null as number | null, sampleCount: null as number | null };
      }
      if (age < typicalAnchored[0].ageMin || age > typicalAnchored[typicalAnchored.length - 1].ageMin) {
        return { range: null, median: null, sampleCount: null };
      }
      let lo = typicalAnchored[0];
      let hi = typicalAnchored[typicalAnchored.length - 1];
      for (let i = 0; i < typicalAnchored.length - 1; i++) {
        if (typicalAnchored[i].ageMin <= age && age <= typicalAnchored[i + 1].ageMin) {
          lo = typicalAnchored[i];
          hi = typicalAnchored[i + 1];
          break;
        }
      }
      if (lo.ageMin === hi.ageMin) {
        return {
          range: [lo.p25Imp, lo.p75Imp] as [number, number],
          median: lo.p50Imp,
          sampleCount: lo.sampleCount,
        };
      }
      const t = (age - lo.ageMin) / (hi.ageMin - lo.ageMin);
      return {
        range: [
          Math.round(lo.p25Imp + (hi.p25Imp - lo.p25Imp) * t),
          Math.round(lo.p75Imp + (hi.p75Imp - lo.p75Imp) * t),
        ] as [number, number],
        median: Math.round(lo.p50Imp + (hi.p50Imp - lo.p50Imp) * t),
        sampleCount: Math.max(lo.sampleCount, hi.sampleCount),
      };
    };

    const mine = data.snapshots.map((s) => {
      const ageMin = Math.max(0, Math.round((new Date(s.captured_at).getTime() - publishedMs) / 60000));
      const t = typicalAt(ageMin);
      return {
        ageMin,
        label: ageMin < 60 ? `${ageMin}m` : `${(ageMin / 60).toFixed(1)}h`,
        impressions: s.impressions_count ?? 0,
        likes: s.likes_count,
        comments: s.comments_count,
        reposts: s.reposts_count,
        typicalImpRange: t.range,
        typicalImpMedian: t.median,
        typicalSampleCount: t.sampleCount,
      };
    });

    // Typical-only rows for ages past the latest snapshot, so the band can
    // continue into the future where another post has been observed longer.
    const maxSnapshotAge = mine.length > 0 ? Math.max(...mine.map((m) => m.ageMin)) : 0;
    const typicalBeyond = typicalAnchored
      .filter((t) => t.ageMin > maxSnapshotAge)
      .map((t) => ({
        ageMin: t.ageMin,
        label: t.ageMin < 60 ? `${t.ageMin}m` : `${(t.ageMin / 60).toFixed(1)}h`,
        impressions: null as number | null,
        likes: null as number | null,
        comments: null as number | null,
        reposts: null as number | null,
        typicalImpRange: [t.p25Imp, t.p75Imp] as [number, number],
        typicalImpMedian: t.p50Imp,
        typicalSampleCount: t.sampleCount,
      }));

    return [...mine, ...typicalBeyond].sort((a, b) => a.ageMin - b.ageMin);
  }, [data, publishedAt]);

  const curveData = useMemo(
    () => (zoomMax === null ? curveDataAll : curveDataAll.filter((d) => d.ageMin <= zoomMax)),
    [curveDataAll, zoomMax]
  );
  const hasSnapshots = (data?.snapshots?.length || 0) > 0;
  const hasTypical = (data?.typical?.length || 0) > 0;
  const maxAgeMin = hasSnapshots
    ? Math.max(0, ...data!.snapshots.map((s) => Math.round((new Date(s.captured_at).getTime() - new Date(publishedAt).getTime()) / 60000)))
    : 0;

  if (loading && !data) {
    return <p className="text-xs text-text-muted py-6 text-center">Loading snapshots…</p>;
  }
  if (!hasSnapshots) {
    return (
      <p className="text-xs text-text-muted py-6 text-center">
        No snapshot data for this post. Only posts monitored during their first 7 days have captures.
      </p>
    );
  }

  const snapshotCount = data?.snapshots.length || 0;
  const snapshotsInView = curveData.filter((d) => d.impressions != null).length;

  return (
    <>
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        <span className="text-[10px] text-text-muted mr-1">Zoom:</span>
        {ZOOM_PRESETS.map((z) => {
          const dimmed = z.maxMin !== null && z.maxMin > maxAgeMin;
          const active = zoomMax === z.maxMin;
          return (
            <button
              key={z.label}
              onClick={() => setZoomMax(z.maxMin)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                active
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-bg-secondary text-text-muted border border-border hover:border-accent/30'
              } ${dimmed ? 'opacity-40' : ''}`}
            >
              {z.label}
            </button>
          );
        })}
        <span className="text-[10px] text-text-muted ml-2">
          {snapshotsInView} of {snapshotCount} snapshot{snapshotCount === 1 ? '' : 's'}
        </span>
        {hasTypical && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="inline-block w-3 h-2 rounded-sm bg-slate-500/30 border border-slate-500/50" />
            <span>typical impressions p25–p75 for this account</span>
          </span>
        )}
      </div>
      {snapshotsInView === 0 ? (
        <p className="text-xs text-text-muted py-6 text-center">No snapshots in this window.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={curveData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id={`liveImp-${postId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2e3348" />
            <XAxis
              dataKey="ageMin"
              type="number"
              domain={[0, 'dataMax']}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={{ stroke: '#2e3348' }}
              tickFormatter={(v) => (v < 60 ? `${v}m` : `${(v / 60).toFixed(0)}h`)}
            />
            <YAxis yAxisId="left" tick={{ fill: '#7dd3fc', fontSize: 11 }} axisLine={{ stroke: '#2e3348' }} tickFormatter={(v) => fmtNum(Number(v))} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#e8935a', fontSize: 11 }} axisLine={{ stroke: '#2e3348' }} tickFormatter={(v) => fmtNum(Number(v))} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              content={({ active, payload }: any) => {
                if (!active || !payload || payload.length === 0) return null;
                const p = payload[0].payload;
                const isSnapshot = p.impressions != null;
                const isTypical = p.typicalImpMedian != null;
                return (
                  <div style={CHART_TOOLTIP_STYLE} className="p-2">
                    <div className="text-text-secondary text-[11px] mb-1">+{p.label} since publish</div>
                    {isSnapshot && (
                      <>
                        <div className="text-sky-400 text-xs">👁️ {fmtNum(p.impressions)} impressions</div>
                        <div className="text-accent text-xs mt-0.5">
                          {p.likes} likes · {p.comments} comments · {p.reposts} reposts
                        </div>
                      </>
                    )}
                    {isTypical && (
                      <div className="text-slate-400 text-[11px] mt-1 pt-1 border-t border-slate-500/30">
                        Typical at this age (n={p.typicalSampleCount}):
                        <br />
                        👁️ {fmtNum(p.typicalImpRange[0])}–{fmtNum(p.typicalImpRange[1])}
                        <span className="text-slate-500"> (median {fmtNum(p.typicalImpMedian)})</span>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            {[
              { x: 60, label: '1h' },
              { x: 6 * 60, label: '6h' },
              { x: 24 * 60, label: '24h' },
              { x: 72 * 60, label: '72h' },
            ]
              .filter((ref) => (zoomMax === null ? true : ref.x <= zoomMax))
              .map((ref) => (
                <ReferenceLine
                  key={ref.x}
                  yAxisId="left"
                  x={ref.x}
                  stroke="#4b5563"
                  strokeDasharray="2 2"
                  label={{ value: ref.label, fill: '#6b7280', fontSize: 10, position: 'top' }}
                />
              ))}
            {/* Typical impressions band (p25–p75) rendered first so it sits
                behind this post's blue area. `connectNulls` lets the band
                span the sparser bucket points. */}
            {hasTypical && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="typicalImpRange"
                stroke="none"
                fill="#64748b"
                fillOpacity={0.22}
                connectNulls
                activeDot={false}
                isAnimationActive={false}
              />
            )}
            {hasTypical && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="typicalImpMedian"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                connectNulls
                activeDot={false}
                isAnimationActive={false}
              />
            )}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="impressions"
              stroke="#38bdf8"
              strokeWidth={2}
              fill={`url(#liveImp-${postId})`}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="likes"
              stroke="#e8935a"
              strokeWidth={2}
              dot={{ r: 3, fill: '#e8935a' }}
              connectNulls
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </>
  );
}

function LivePostRow({ post, onRemoveDemo }: { post: LivePost; onRemoveDemo?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-lg border ${post.is_live ? 'border-red-500/20 bg-red-500/5' : 'border-border bg-bg-primary'}`}>
      <div className="flex items-start gap-3 p-3">
        {post.creator_image ? (
          <img src={post.creator_image} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted text-xs flex-shrink-0">
            {(post.creator_name || '?')[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1 flex-wrap">
            <span className="text-text-secondary font-medium">{post.creator_name}</span>
            <span>·</span>
            <span>{fmtAge(post.published_at)}</span>
            {(() => {
              const meta = PHASE_META[post.phase] || PHASE_META.closed;
              return (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.bg} ${meta.text}`}>
                  {meta.label}
                </span>
              );
            })()}
            {post.outlier_ratio != null && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  post.is_outlier
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-bg-secondary border border-border text-text-muted'
                }`}
                title="Engagement relative to this creator's average"
              >
                {post.outlier_ratio.toFixed(1)}x
              </span>
            )}
            <span
              className="px-1.5 py-0.5 rounded bg-bg-secondary border border-border text-text-muted text-[10px]"
              title={post.last_snapshot_at ? `Last capture ${fmtAge(post.last_snapshot_at)}` : 'No captures yet'}
            >
              {post.snapshot_count} snap{post.snapshot_count === 1 ? '' : 's'}
              {post.last_snapshot_at && post.snapshot_count > 0 && (
                <span className="ml-1 opacity-60">· {fmtAge(post.last_snapshot_at)}</span>
              )}
            </span>
          </div>
          <p className="text-sm text-text-primary line-clamp-2">{truncate(post.hook_text || post.content_text, 180)}</p>
          <div className="flex items-center gap-4 text-xs text-text-muted mt-1.5 flex-wrap">
            <span>{fmtNum(post.likes_count)} likes</span>
            <span>{fmtNum(post.comments_count)} comments</span>
            <span>{fmtNum(post.reposts_count)} reposts</span>
            {post.impressions_count != null && (
              <span className="text-accent">👁️ {fmtNum(post.impressions_count)}</span>
            )}
            <span className="text-accent font-medium">{fmtNum(post.engagement_score)} eng</span>
            <button
              onClick={() => setOpen((v) => !v)}
              className="ml-auto text-accent hover:text-accent-light"
            >
              {open ? 'Hide curve' : 'Show curve'}
            </button>
            {post.post_url && (
              <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light">
                View →
              </a>
            )}
            {onRemoveDemo && (
              <button
                onClick={() => {
                  if (confirm('Remove the demo post from live tracking?')) onRemoveDemo();
                }}
                className="text-red-400/70 hover:text-red-400 transition-colors"
                title="Remove demo post"
              >
                ✕ Remove
              </button>
            )}
          </div>
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3">
          <SnapshotCurve postId={post.id} publishedAt={post.published_at} autoRefresh={post.is_live} />
        </div>
      )}
    </div>
  );
}

// Top Posts row — mirrors the LivePostRow layout but for historical posts in the
// analytics list. The "Show curve" button pulls archived snapshots for any post
// that was previously tracked by the monitor, so the data stays consultable after
// the 7-day live window closes.
function TopPostRow({ post }: { post: TopPost }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border/50 bg-bg-primary">
      <div className="flex items-start gap-3 p-3">
        {post.creator_image ? (
          <img src={post.creator_image} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted text-xs flex-shrink-0">
            {(post.creator_name || '?')[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1 flex-wrap">
            <span className="text-text-secondary font-medium">{post.creator_name}</span>
            <span>·</span>
            <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}</span>
            <span>·</span>
            <span>{FORMAT_LABELS[post.content_type] || post.content_type}</span>
            {post.outlier_ratio != null && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  post.is_outlier
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-bg-secondary text-text-muted border border-border'
                }`}
                title="Engagement relative to this creator's average"
              >
                {post.outlier_ratio.toFixed(1)}x
              </span>
            )}
          </div>
          <p className="text-sm text-text-primary line-clamp-2">{truncate(post.hook_text || post.content_text, 180)}</p>
          <div className="flex items-center gap-4 text-xs text-text-muted mt-1.5 flex-wrap">
            <span>{fmtNum(post.likes_count)} likes</span>
            <span>{fmtNum(post.comments_count)} comments</span>
            <span>{fmtNum(post.reposts_count)} reposts</span>
            {post.impressions_count != null && (
              <span className="text-accent/80">👁️ {fmtNum(post.impressions_count)}</span>
            )}
            <span className="text-accent font-medium ml-auto">{fmtNum(post.engagement_score)} eng</span>
            {post.published_at && (
              <button
                onClick={() => setOpen((v) => !v)}
                className="text-accent hover:text-accent-light"
              >
                {open ? 'Hide curve' : 'Show curve'}
              </button>
            )}
            {post.post_url && (
              <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light">
                View →
              </a>
            )}
          </div>
        </div>
      </div>
      {open && post.published_at && (
        <div className="px-3 pb-3">
          <SnapshotCurve postId={post.id} publishedAt={post.published_at} />
        </div>
      )}
    </div>
  );
}
