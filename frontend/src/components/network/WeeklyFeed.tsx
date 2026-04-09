import { useState, useEffect, useCallback } from 'react';
import { apiPost } from '../../hooks/useApi';
import NetworkPostCard from './NetworkPostCard';

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

export default function WeeklyFeed() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [feed, setFeed] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'commented' | 'skipped'>('all');

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await apiPost('/api/network/feed/refresh', {});
      await fetchFeed();
    } catch (err: any) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

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

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['all', 'pending', 'commented', 'skipped'] as const).map((f) => (
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
            <NetworkPostCard key={post.id} post={post} onUpdate={fetchFeed} />
          ))}
        </div>
      )}
    </div>
  );
}
