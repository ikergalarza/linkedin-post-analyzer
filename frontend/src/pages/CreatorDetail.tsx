import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SkeletonChart } from '../components/Skeleton';
import EngagementChart from '../components/EngagementChart';
import ContentTypeBreakdown from '../components/ContentTypeBreakdown';
import ConsistencyHeatmap from '../components/ConsistencyHeatmap';
import PatternInsights from '../components/PatternInsights';
import OutlierTable from '../components/OutlierTable';
import HookTypeChart from '../components/HookTypeChart';
import StructureChart from '../components/StructureChart';

const BASE = import.meta.env.VITE_API_URL || '';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const text = await res.text();
  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try { msg = JSON.parse(text).error || msg; } catch {}
    throw new Error(msg);
  }
  return JSON.parse(text);
}

interface Creator {
  id: string;
  name: string | null;
  headline: string | null;
  profile_image_url: string | null;
  followers_count: number;
  linkedin_url: string;
}

interface Stats {
  total_posts: number;
  total_outliers: number;
  avg_engagement: number;
  median_engagement: number;
  stddev_engagement: number;
  outlier_rate: number;
  posts_per_week: number;
  best_day: string | null;
  engagement_rate: number;
  avg_comment_like_ratio: number;
  avg_share_like_ratio: number;
  content_type_distribution: { content_type: string; count: string }[];
  outlier_content_type_distribution: { content_type: string; count: string }[];
  hook_type_breakdown: { type: string; count: number; avg_engagement: number }[];
  structure_breakdown: { structure: string; count: number; avg_engagement: number }[];
}

interface AllData {
  creator: Creator;
  stats: Stats;
  timeline: { published_at: string; engagement_score: number; is_outlier: boolean; content_type: string; hook_text: string | null; hook_type?: string; outlier_ratio?: number }[];
  patterns: { type: string; title: string; value: string; detail: string }[];
  outlierPosts: any[];
  allPosts: any[];
}

export default function CreatorDetail() {
  const { id } = useParams();
  const [data, setData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const creator = await fetchJson<Creator>(`/api/creators/${id}`);
        if (cancelled) return;

        const [stats, timeline, patterns, outlierRes, allRes] = await Promise.all([
          fetchJson<Stats>(`/api/creators/${id}/stats`),
          fetchJson<any[]>(`/api/creators/${id}/timeline`),
          fetchJson<any[]>(`/api/creators/${id}/patterns`),
          fetchJson<{ posts: any[] }>(`/api/creators/${id}/posts?outliers_only=true&limit=100`),
          fetchJson<{ posts: any[] }>(`/api/creators/${id}/posts?limit=100&sort=engagement_desc`),
        ]);

        if (cancelled) return;
        setData({ creator, stats, timeline, patterns, outlierPosts: outlierRes.posts, allPosts: allRes.posts });
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`${BASE}/api/creators/${id}/refresh`, { method: 'POST' });
    } catch {}
    setRefreshing(false);
  };

  const handleExport = () => {
    window.open(`${BASE}/api/creators/${id}/export`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Creator not found.</p>
        {error && <p className="text-danger text-sm mt-2">{error}</p>}
      </div>
    );
  }

  const { creator, stats, timeline, patterns, outlierPosts, allPosts } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-bg-card rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex items-center gap-4 flex-1">
          {creator.profile_image_url ? (
            <img src={creator.profile_image_url} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-2xl">
              {(creator.name || '?')[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{creator.name || 'Unknown'}</h1>
            <p className="text-text-secondary text-sm">{creator.headline || '--'}</p>
            <p className="text-text-muted text-xs mt-1">
              {creator.followers_count > 0 ? `${creator.followers_count.toLocaleString()} followers` : 'Followers unknown'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Avg Engagement', value: stats.avg_engagement.toLocaleString() },
          { label: 'Median', value: stats.median_engagement.toLocaleString() },
          { label: 'Total Posts', value: stats.total_posts },
          { label: 'Outliers', value: stats.total_outliers, accent: true },
          { label: 'Posts/Week', value: stats.posts_per_week },
          { label: 'Outlier Rate', value: `${stats.outlier_rate}%`, accent: true },
          { label: 'Eng. Rate', value: stats.engagement_rate > 0 ? `${stats.engagement_rate}%` : 'N/A', accent: stats.engagement_rate > 0 },
          { label: 'Comment/Like', value: stats.avg_comment_like_ratio > 0 ? `${Math.round(stats.avg_comment_like_ratio * 100)}%` : 'N/A' },
        ].map((kpi, i) => (
          <div key={i} className="bg-bg-card rounded-lg p-4 text-center">
            <p className="text-text-muted text-xs mb-1">{kpi.label}</p>
            <p className={`text-xl font-bold ${kpi.accent ? 'text-accent' : 'text-text-primary'}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <EngagementChart data={timeline} avgEngagement={stats.avg_engagement} />
      )}

      {/* Hook Type + Structure Breakdown */}
      {stats.hook_type_breakdown && stats.hook_type_breakdown.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HookTypeChart data={stats.hook_type_breakdown} />
          <StructureChart data={stats.structure_breakdown || []} />
        </div>
      )}

      {/* Content Type + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentTypeBreakdown
          all={stats.content_type_distribution}
          outliers={stats.outlier_content_type_distribution}
        />
        {timeline.length > 0 && <ConsistencyHeatmap data={timeline} />}
      </div>

      {/* Patterns */}
      {patterns.length > 0 && <PatternInsights patterns={patterns} />}

      {/* Outlier posts table */}
      {outlierPosts.length > 0 && (
        <OutlierTable posts={outlierPosts} title="Outlier Posts" />
      )}

      {/* All posts table */}
      {allPosts.length > 0 && (
        <OutlierTable posts={allPosts} title="All Posts" />
      )}
    </div>
  );
}
