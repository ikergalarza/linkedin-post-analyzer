import { useState } from 'react';

interface Post {
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
  post_url: string | null;
}

function getLinkedInUrl(post: Post): string | null {
  if (post.post_url) return post.post_url;
  if (post.linkedin_post_id) return `https://www.linkedin.com/feed/update/${post.linkedin_post_id}/`;
  return null;
}

function ratioBadge(ratio: number) {
  if (ratio >= 10) {
    return (
      <span className="bg-diamond/20 text-diamond px-2 py-0.5 rounded text-xs font-bold shadow-[0_0_8px_rgba(103,232,249,0.3)]">
        {ratio}x
      </span>
    );
  }
  if (ratio >= 3) {
    return (
      <span className="bg-accent/20 text-accent px-2 py-0.5 rounded text-xs font-bold">
        {ratio}x
      </span>
    );
  }
  return (
    <span className="bg-bg-hover text-text-muted px-2 py-0.5 rounded text-xs">
      {ratio}x
    </span>
  );
}

interface Props {
  posts: Post[];
  title?: string;
  showCreator?: boolean;
  creatorName?: string;
}

const typeIcons: Record<string, string> = {
  text_only: '📝',
  image: '🖼️',
  carousel: '🎠',
  video: '🎬',
  poll: '📊',
  article: '📰',
  document: '📄',
};

export default function OutlierTable({ posts, title = 'Outlier Posts', showCreator }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="bg-bg-card rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {posts.length === 0 ? (
        <p className="text-text-muted">No posts to display.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary text-left border-b border-border">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Hook</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium text-right">Likes</th>
                <th className="pb-3 font-medium text-right">Comments</th>
                <th className="pb-3 font-medium text-right">Reposts</th>
                <th className="pb-3 font-medium text-right">Score</th>
                <th className="pb-3 font-medium text-right">Ratio</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <>
                  <tr
                    key={post.id}
                    className="border-b border-border/50 hover:bg-bg-hover cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                  >
                    <td className="py-3 whitespace-nowrap text-text-secondary">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3 max-w-[300px] truncate" title={post.hook_text || ''}>
                      {post.hook_text || '—'}
                    </td>
                    <td className="py-3">
                      <span title={post.content_type}>{typeIcons[post.content_type] || '❓'}</span>
                    </td>
                    <td className="py-3 text-right tabular-nums">{post.likes_count.toLocaleString()}</td>
                    <td className="py-3 text-right tabular-nums">{post.comments_count.toLocaleString()}</td>
                    <td className="py-3 text-right tabular-nums">{post.reposts_count.toLocaleString()}</td>
                    <td className="py-3 text-right tabular-nums font-medium text-accent">{post.engagement_score.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      {post.outlier_ratio > 0 && ratioBadge(post.outlier_ratio)}
                    </td>
                    <td className="py-3 text-right">
                      {getLinkedInUrl(post) && (
                        <a
                          href={getLinkedInUrl(post)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent-light text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                  {expandedId === post.id && (
                    <tr key={`${post.id}-expanded`}>
                      <td colSpan={9} className="bg-bg-secondary p-4">
                        <p className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed">
                          {post.content_text || 'No content available'}
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
