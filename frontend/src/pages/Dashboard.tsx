import { useState, useMemo } from 'react';
import { useApi, apiDelete } from '../hooks/useApi';
import CreatorForm from '../components/CreatorForm';
import { SkeletonCard } from '../components/Skeleton';
import { Link } from 'react-router-dom';

const BASE = import.meta.env.VITE_API_URL || '';

interface Creator {
  id: string;
  name: string | null;
  headline: string | null;
  profile_image_url: string | null;
  followers_count: number;
  last_scraped_at: string | null;
  total_posts: number;
  total_outliers: number;
  avg_engagement: number;
}

type SortKey = 'name' | 'total_posts' | 'total_outliers' | 'avg_engagement' | 'followers_count' | 'last_scraped_at';

export default function Dashboard() {
  const { data: creators, loading, error, refetch } = useApi<Creator[]>('/api/creators');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('avg_engagement');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('');

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!creators) return;
    if (selectedIds.size === creators.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(creators.map((c) => c.id)));
    }
  };

  const handleBatchRefresh = async () => {
    setRefreshing(true);
    setRefreshStatus('Refreshing...');
    try {
      const ids = selectedIds.size > 0 ? Array.from(selectedIds) : null;
      const res = await fetch(`${BASE}/api/creators/refresh-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      setRefreshStatus(`Done: ${data.refreshed}/${data.total} refreshed`);
      refetch();
      setTimeout(() => setRefreshStatus(null), 4000);
    } catch (err: any) {
      setRefreshStatus(`Error: ${err.message}`);
    }
    setRefreshing(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Delete this creator and all their data?')) return;
    try {
      await apiDelete(`/api/creators/${id}`);
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    if (!creators) return [];
    let filtered = creators;
    if (filter) {
      const q = filter.toLowerCase();
      filtered = creators.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.headline || '').toLowerCase().includes(q)
      );
    }
    return [...filtered].sort((a, b) => {
      let av: any, bv: any;
      if (sortBy === 'name') {
        av = (a.name || '').toLowerCase();
        bv = (b.name || '').toLowerCase();
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      if (sortBy === 'last_scraped_at') {
        av = a.last_scraped_at ? new Date(a.last_scraped_at).getTime() : 0;
        bv = b.last_scraped_at ? new Date(b.last_scraped_at).getTime() : 0;
      } else {
        av = (a as any)[sortBy] || 0;
        bv = (b as any)[sortBy] || 0;
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [creators, sortBy, sortDir, filter]);

  const sortIcon = (key: SortKey) => {
    if (sortBy !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-text-secondary">Add a LinkedIn creator to analyze their outlier content.</p>
      </div>

      <CreatorForm onCreated={refetch} />

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger text-sm">{error}</div>
      )}

      {loading && !creators && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {creators && creators.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-4">📊</p>
          <p>No creators analyzed yet. Add a LinkedIn URL above to get started.</p>
        </div>
      )}

      {creators && creators.length > 0 && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="text"
              placeholder="Search by name or headline..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent w-full sm:w-64"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-text-muted text-xs">Sort:</span>
              {([
                ['avg_engagement', 'Engagement'],
                ['total_outliers', 'Outliers'],
                ['total_posts', 'Posts'],
                ['followers_count', 'Followers'],
                ['name', 'Name'],
                ['last_scraped_at', 'Last Updated'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    sortBy === key
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-bg-secondary text-text-muted border border-border hover:border-accent/30'
                  }`}
                >
                  {label}{sortIcon(key)}
                </button>
              ))}
            </div>
          </div>

          {/* Batch actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              {selectedIds.size === creators.length ? 'Deselect all' : 'Select all'}
            </button>
            <button
              onClick={handleBatchRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-accent text-bg-primary rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-accent-light transition-colors"
            >
              {refreshing
                ? 'Refreshing...'
                : selectedIds.size > 0
                  ? `Refresh ${selectedIds.size} selected`
                  : 'Refresh All'}
            </button>
            {refreshStatus && (
              <span className="text-xs text-text-muted">{refreshStatus}</span>
            )}
          </div>

          {/* Creator grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sorted.map((creator) => (
              <div key={creator.id} className="relative">
                {/* Checkbox */}
                <label
                  className="absolute top-4 left-4 z-10 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(creator.id)}
                    onChange={() => toggleSelect(creator.id)}
                    className="w-4 h-4 rounded border-border accent-accent cursor-pointer"
                  />
                </label>
                <Link
                  to={`/creator/${creator.id}`}
                  className="block bg-bg-card rounded-xl p-6 pl-12 border border-border hover:border-accent/30 cursor-pointer transition-all hover:shadow-lg hover:shadow-accent/5 group no-underline text-inherit"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {creator.profile_image_url ? (
                      <img src={creator.profile_image_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-lg">
                        {(creator.name || '?')[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                        {creator.name || 'Unknown'}
                      </h3>
                      <p className="text-text-secondary text-sm truncate">{creator.headline || '--'}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(creator.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all text-sm px-2 py-1"
                      title="Delete creator"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-bg-secondary rounded-lg p-2">
                      <p className="text-text-muted text-[10px]">Posts</p>
                      <p className="text-text-primary font-bold">{creator.total_posts}</p>
                    </div>
                    <div className="bg-bg-secondary rounded-lg p-2">
                      <p className="text-text-muted text-[10px]">Outliers</p>
                      <p className="text-accent font-bold">{creator.total_outliers}</p>
                    </div>
                    <div className="bg-bg-secondary rounded-lg p-2">
                      <p className="text-text-muted text-[10px]">Avg Eng.</p>
                      <p className="text-text-primary font-bold">{creator.avg_engagement.toLocaleString()}</p>
                    </div>
                    <div className="bg-bg-secondary rounded-lg p-2">
                      <p className="text-text-muted text-[10px]">Followers</p>
                      <p className="text-text-primary font-bold">
                        {creator.followers_count > 0 ? (creator.followers_count >= 1000 ? `${Math.round(creator.followers_count / 1000)}K` : creator.followers_count) : '--'}
                      </p>
                    </div>
                  </div>

                  {creator.last_scraped_at && (
                    <p className="text-text-muted text-xs mt-3">
                      Updated: {new Date(creator.last_scraped_at).toLocaleDateString()}
                    </p>
                  )}
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
