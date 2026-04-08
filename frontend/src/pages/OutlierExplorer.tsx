import { useApi } from '../hooks/useApi';
import PostCard from '../components/PostCard';
import { SkeletonCard } from '../components/Skeleton';

interface CrossCreatorData {
  top_outliers: {
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
    hook_text: string | null;
    post_url: string | null;
    creator_name: string;
    creator_image: string | null;
  }[];
  patterns: {
    total_outliers: number;
    content_type_distribution: Record<string, number>;
    avg_word_count: number;
    cta_rate: number;
  };
}

export default function OutlierExplorer() {
  const { data, loading, error } = useApi<CrossCreatorData>('/api/analysis/cross-creators');

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
                  .sort((a, b) => b[1] - a[1])[0]?.[0] || '—'}
              </p>
            </div>
          </div>

          {/* Top outliers grid */}
          {data.top_outliers.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <p className="text-4xl mb-4">🔍</p>
              <p>No outliers found yet. Add some creators from the Dashboard first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.top_outliers.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
