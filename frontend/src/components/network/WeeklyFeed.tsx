import { useState, useEffect, useCallback, useRef } from 'react';
import { apiPost } from '../../hooks/useApi';
import NetworkPostCard, { CommenterChoice, CustomCommenter } from './NetworkPostCard';

const BASE = import.meta.env.VITE_API_URL || '';

interface NetworkComment {
  id: string;
  angle: string;
  comment_text: string;
  is_selected: boolean;
}

interface FeedPost {
  id: string;
  content_text: string | null;
  hook_text: string | null;
  published_at: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  post_url: string | null;
  status: 'pending' | 'commented' | 'skipped';
  creator_name: string | null;
  creator_tier: number;
  creator_image: string | null;
  creator_headline: string | null;
  comments: NetworkComment[];
}

interface FeedData {
  posts: FeedPost[];
  week_start: string;
  week_end: string;
}

function formatWeekRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  e.setDate(e.getDate() - 1); // end is exclusive, show last day
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${s.toLocaleDateString('en-US', opts)} — ${e.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

const PROFILE_CHOICES: Array<'Iker' | 'Unai' | 'Custom'> = ['Iker', 'Unai', 'Custom'];
const EMPTY_CUSTOM: CustomCommenter = { headline: '', voice_style: '', worldview: '' };

function readStoredMode(): 'Iker' | 'Unai' | 'Custom' {
  try {
    const raw = localStorage.getItem('network.commenter_mode');
    if (raw === 'Iker' || raw === 'Unai' || raw === 'Custom') return raw;
  } catch {}
  return 'Iker';
}

function readStoredCustom(): CustomCommenter {
  try {
    const raw = localStorage.getItem('network.commenter_custom');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        headline: parsed.headline || '',
        voice_style: parsed.voice_style || '',
        worldview: parsed.worldview || '',
      };
    }
  } catch {}
  return { ...EMPTY_CUSTOM };
}

export default function WeeklyFeed() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [feed, setFeed] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState<{ current: number; total: number; currentName: string | null } | null>(null);
  const progressPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'commented' | 'skipped'>('pending');
  const [commenterMode, setCommenterMode] = useState<'Iker' | 'Unai' | 'Custom'>(readStoredMode);
  const [customCommenter, setCustomCommenter] = useState<CustomCommenter>(readStoredCustom);

  useEffect(() => {
    try { localStorage.setItem('network.commenter_mode', commenterMode); } catch {}
  }, [commenterMode]);

  useEffect(() => {
    try { localStorage.setItem('network.commenter_custom', JSON.stringify(customCommenter)); } catch {}
  }, [customCommenter]);

  const commenterChoice: CommenterChoice = commenterMode === 'Custom'
    ? { mode: 'Custom', custom: customCommenter }
    : { mode: commenterMode };

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/network/feed?week_offset=${weekOffset}`);
      const data = await res.json();
      setFeed(data);
    } catch (err) {
      console.error('Feed fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const pollProgress = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/network/feed/refresh-progress`);
      const p = await res.json();
      if (p && typeof p.current === 'number' && typeof p.total === 'number') {
        setRefreshProgress({ current: p.current, total: p.total, currentName: p.currentName || null });
      }
    } catch {}
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshProgress({ current: 0, total: 0, currentName: null });
    // Start polling progress every 800ms
    if (progressPollRef.current) clearInterval(progressPollRef.current);
    progressPollRef.current = setInterval(pollProgress, 800);
    pollProgress();
    try {
      await apiPost('/api/network/feed/refresh', {});
      await fetchFeed();
    } catch (err: any) {
      console.error('Refresh failed:', err);
    } finally {
      if (progressPollRef.current) {
        clearInterval(progressPollRef.current);
        progressPollRef.current = null;
      }
      setRefreshing(false);
      setRefreshProgress(null);
    }
  };

  useEffect(() => {
    return () => {
      if (progressPollRef.current) clearInterval(progressPollRef.current);
    };
  }, []);

  const filteredPosts = feed?.posts.filter((p) => filter === 'all' || p.status === filter) || [];

  const statusCounts = {
    all: feed?.posts.length || 0,
    pending: feed?.posts.filter((p) => p.status === 'pending').length || 0,
    commented: feed?.posts.filter((p) => p.status === 'commented').length || 0,
    skipped: feed?.posts.filter((p) => p.status === 'skipped').length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="px-3 py-1.5 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors text-sm"
          >
            Prev
          </button>
          <span className="text-sm font-medium text-text-primary min-w-[200px] text-center">
            {feed ? formatWeekRange(feed.week_start, feed.week_end) : '...'}
          </span>
          <button
            onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}
            disabled={weekOffset >= 0}
            className="px-3 py-1.5 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors text-sm disabled:opacity-30"
          >
            Next
          </button>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-lg text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Posts'}
        </button>
      </div>

      {/* Refresh progress bar */}
      {refreshing && refreshProgress && (
        <div className="bg-bg-card border border-border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">
              {refreshProgress.total > 0
                ? `Fetching creator ${Math.min(refreshProgress.current + (refreshProgress.current < refreshProgress.total ? 1 : 0), refreshProgress.total)} of ${refreshProgress.total}`
                : 'Starting…'}
              {refreshProgress.currentName && (
                <span className="text-accent ml-2">· {refreshProgress.currentName}</span>
              )}
            </span>
            <span className="text-text-muted font-mono">
              {refreshProgress.total > 0
                ? `${Math.round((refreshProgress.current / refreshProgress.total) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
              style={{
                width: refreshProgress.total > 0
                  ? `${(refreshProgress.current / refreshProgress.total) * 100}%`
                  : '4%',
              }}
            />
          </div>
        </div>
      )}

      {/* Commenter selector */}
      <div className="bg-bg-card border border-border rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-muted font-medium">Commenting as:</span>
          {PROFILE_CHOICES.map((name) => (
            <button
              key={name}
              onClick={() => setCommenterMode(name)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                commenterMode === name
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-border text-text-muted hover:border-accent/30'
              }`}
            >
              {name}
            </button>
          ))}
          <span className="text-[11px] text-text-muted ml-2">
            {commenterMode === 'Custom'
              ? 'Ad-hoc voice — not saved to any profile'
              : `Using saved "${commenterMode}" profile`}
          </span>
        </div>

        {commenterMode === 'Custom' && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Who you are</label>
              <input
                type="text"
                value={customCommenter.headline}
                onChange={(e) => setCustomCommenter((c) => ({ ...c, headline: e.target.value }))}
                placeholder="e.g. Head of Sales @Acme"
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Your writing style</label>
              <textarea
                value={customCommenter.voice_style}
                onChange={(e) => setCustomCommenter((c) => ({ ...c, voice_style: e.target.value }))}
                rows={2}
                placeholder="e.g. Direct. Short sentences. Data over opinions. No filler."
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-xs resize-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Your angle on the topic</label>
              <textarea
                value={customCommenter.worldview}
                onChange={(e) => setCustomCommenter((c) => ({ ...c, worldview: e.target.value }))}
                rows={2}
                placeholder="e.g. Most hiring advice ignores the onboarding cost. I think tenure beats talent."
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 text-xs resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['pending', 'all', 'commented', 'skipped'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors capitalize ${
              filter === f
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {f} ({statusCounts[f]})
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="text-center py-12 text-text-muted text-sm">Loading feed...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 text-text-muted text-sm">
          {feed?.posts.length === 0
            ? 'No posts this week. Add creators and click "Refresh Posts" to fetch their latest content.'
            : `No ${filter} posts this week.`}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <NetworkPostCard key={post.id} post={post} onUpdate={fetchFeed} commenter={commenterChoice} />
          ))}
        </div>
      )}
    </div>
  );
}
