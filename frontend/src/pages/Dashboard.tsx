import { useApi, apiDelete } from '../hooks/useApi';
import CreatorForm from '../components/CreatorForm';
import { SkeletonCard } from '../components/Skeleton';
import { Link } from 'react-router-dom';

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

export default function Dashboard() {
  const { data: creators, loading, error, refetch } = useApi<Creator[]>('/api/creators');

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this creator and all their data?')) return;
    try {
      await apiDelete(`/api/creators/${id}`);
      refetch();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-text-secondary">Add a LinkedIn creator to analyze their outlier content.</p>
      </div>

      <CreatorForm onCreated={refetch} />

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger text-sm">
          {error}
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {creators.map((creator) => (
            <Link
              key={creator.id}
              to={`/creator/${creator.id}`}
              className="block bg-bg-card rounded-xl p-6 border border-border hover:border-accent/30 cursor-pointer transition-all hover:shadow-lg hover:shadow-accent/5 group no-underline text-inherit"
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
                  <p className="text-text-secondary text-sm truncate">{creator.headline || '—'}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(creator.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all text-sm px-2 py-1"
                  title="Delete creator"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-bg-secondary rounded-lg p-3">
                  <p className="text-text-muted text-xs">Posts</p>
                  <p className="text-text-primary font-bold text-lg">{creator.total_posts}</p>
                </div>
                <div className="bg-bg-secondary rounded-lg p-3">
                  <p className="text-text-muted text-xs">Outliers</p>
                  <p className="text-accent font-bold text-lg">{creator.total_outliers}</p>
                </div>
                <div className="bg-bg-secondary rounded-lg p-3">
                  <p className="text-text-muted text-xs">Avg Eng.</p>
                  <p className="text-text-primary font-bold text-lg">{creator.avg_engagement.toLocaleString()}</p>
                </div>
              </div>

              {creator.last_scraped_at && (
                <p className="text-text-muted text-xs mt-3">
                  Last updated: {new Date(creator.last_scraped_at).toLocaleDateString()}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
