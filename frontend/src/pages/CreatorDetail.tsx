import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi, apiPost } from '../hooks/useApi';
import { SkeletonChart } from '../components/Skeleton';
import EngagementChart from '../components/EngagementChart';
import ContentTypeBreakdown from '../components/ContentTypeBreakdown';
import ConsistencyHeatmap from '../components/ConsistencyHeatmap';
import PatternInsights from '../components/PatternInsights';
import OutlierTable from '../components/OutlierTable';

interface Creator {
  id: string;
  name: string | null;
  headline: string | null;
  profile_image_url: string | null;
  followers_count: number;
  linkedin_url: string;
  stats: {
    total_posts: string;
    total_outliers: string;
    avg_engagement: string;
    median_engagement: string;
  };
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
  content_type_distribution: { content_type: string; count: string }[];
  outlier_content_type_distribution: { content_type: string; count: string }[];
}

interface TimelinePoint {
  published_at: string;
  engagement_score: number;
  is_outlier: boolean;
  content_type: string;
  hook_text: string | null;
}

interface Pattern {
  type: string;
  title: string;
  value: string;
  detail: string;
}

interface PostsResponse {
  posts: any[];
  total: number;
}

export default function CreatorDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: creator, loading: creatorLoading } = useApi<Creator>(`/api/creators/${id}`);
  const { data: stats, loading: statsLoading } = useApi<Stats>(`/api/creators/${id}/stats`);
  const { data: timeline, loading: timelineLoading } = useApi<TimelinePoint[]>(`/api/creators/${id}/timeline`);
  const { data: patterns } = useApi<Pattern[]>(`/api/creators/${id}/patterns`);
  const { data: outlierPosts } = useApi<PostsResponse>(`/api/creators/${id}/posts?outliers_only=true&limit=100`);
  const { data: allPosts } = useApi<PostsResponse>(`/api/creators/${id}/posts?limit=100&sort=engagement_desc`);

  const [refreshing, setRefreshing] = useState(false);
  const [postFilter, setPostFilter] = useState('');
  const [postSort, setPostSort] = useState('engagement_desc');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await apiPost(`/api/creators/${id}/refresh`, {});
    } catch {
      // ignore
    }
    setRefreshing(false);
  };

  if (creatorLoading) {
    return (
      <div className="space-y-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    );
  }

  if (!creator) {
    return <div className="text-text-muted text-center py-16">Creator not found.</div>;
  }

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
            <p className="text-text-secondary text-sm">{creator.headline || '—'}</p>
            <p className="text-text-muted text-xs mt-1">
              {creator.followers_count.toLocaleString()} followers
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Avg Engagement', value: stats.avg_engagement.toLocaleString() },
            { label: 'Median', value: stats.median_engagement.toLocaleString() },
            { label: 'Total Posts', value: stats.total_posts },
            { label: 'Outliers', value: stats.total_outliers, accent: true },
            { label: 'Posts/Week', value: stats.posts_per_week },
            { label: 'Outlier Rate', value: `${stats.outlier_rate}%`, accent: true },
          ].map((kpi, i) => (
            <div key={i} className="bg-bg-card rounded-lg p-4 text-center">
              <p className="text-text-muted text-xs mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.accent ? 'text-accent' : 'text-text-primary'}`}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {timelineLoading ? (
        <SkeletonChart />
      ) : timeline && stats ? (
        <EngagementChart data={timeline} avgEngagement={stats.avg_engagement} />
      ) : null}

      {/* Content Type + Heatmap side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats && (
          <ContentTypeBreakdown
            all={stats.content_type_distribution}
            outliers={stats.outlier_content_type_distribution}
          />
        )}
        {timeline && <ConsistencyHeatmap data={timeline} />}
      </div>

      {/* Patterns */}
      {patterns && <PatternInsights patterns={patterns} />}

      {/* Outlier posts table */}
      {outlierPosts && (
        <OutlierTable posts={outlierPosts.posts} title="Outlier Posts" />
      )}

      {/* All posts table */}
      {allPosts && (
        <div className="bg-bg-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">All Posts</h3>
            <div className="flex gap-2">
              <select
                value={postFilter}
                onChange={(e) => setPostFilter(e.target.value)}
                className="bg-bg-secondary border border-border rounded px-3 py-1.5 text-sm text-text-secondary"
              >
                <option value="">All types</option>
                <option value="text_only">Text</option>
                <option value="image">Image</option>
                <option value="carousel">Carousel</option>
                <option value="video">Video</option>
                <option value="poll">Poll</option>
                <option value="article">Article</option>
                <option value="document">Document</option>
              </select>
              <select
                value={postSort}
                onChange={(e) => setPostSort(e.target.value)}
                className="bg-bg-secondary border border-border rounded px-3 py-1.5 text-sm text-text-secondary"
              >
                <option value="engagement_desc">Engagement (high)</option>
                <option value="engagement_asc">Engagement (low)</option>
                <option value="date_desc">Newest</option>
                <option value="date_asc">Oldest</option>
                <option value="outlier_ratio_desc">Outlier ratio</option>
              </select>
            </div>
          </div>
          <AllPostsFiltered creatorId={id!} filter={postFilter} sort={postSort} />
        </div>
      )}
    </div>
  );
}

function AllPostsFiltered({ creatorId, filter, sort }: { creatorId: string; filter: string; sort: string }) {
  const params = new URLSearchParams({ limit: '100', sort });
  if (filter) params.set('content_type', filter);

  const { data, loading } = useApi<{ posts: any[] }>(`/api/creators/${creatorId}/posts?${params.toString()}`);

  if (loading) return <div className="text-text-muted text-sm py-4">Loading...</div>;
  if (!data || data.posts.length === 0) return <div className="text-text-muted text-sm py-4">No posts found.</div>;

  return <OutlierTable posts={data.posts} title="" />;
}
