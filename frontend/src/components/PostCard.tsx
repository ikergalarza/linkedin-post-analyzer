interface PostData {
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
  creator_name?: string;
  creator_image?: string;
}

interface Props {
  post: PostData;
}

function getLinkedInUrl(post: PostData): string | null {
  if (post.post_url) return post.post_url;
  if (post.linkedin_post_id) return `https://www.linkedin.com/feed/update/${post.linkedin_post_id}/`;
  return null;
}

const typeLabels: Record<string, string> = {
  text_only: 'Text',
  image: 'Image',
  carousel: 'Carousel',
  video: 'Video',
  poll: 'Poll',
  article: 'Article',
  document: 'Document',
};

export default function PostCard({ post }: Props) {
  return (
    <div className="bg-bg-card rounded-xl p-5 border border-border hover:border-accent/30 transition-colors">
      {post.creator_name && (
        <div className="flex items-center gap-2 mb-3">
          {post.creator_image ? (
            <img src={post.creator_image} alt="" className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-accent/30 flex items-center justify-center text-xs text-accent font-bold">
              {post.creator_name[0]}
            </div>
          )}
          <span className="text-sm text-text-secondary">{post.creator_name}</span>
        </div>
      )}

      <p className="text-text-primary text-sm mb-3 line-clamp-4 leading-relaxed">
        {post.content_text || 'No content'}
      </p>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <div className="flex gap-3">
          <span>{post.likes_count} likes</span>
          <span>{post.comments_count} comments</span>
          <span>{post.reposts_count} reposts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-bg-hover px-2 py-0.5 rounded text-text-secondary">
            {typeLabels[post.content_type] || post.content_type}
          </span>
          {post.is_outlier && (
            <span className="bg-accent/20 text-accent px-2 py-0.5 rounded font-bold">
              {post.outlier_ratio}x
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <span className="text-xs text-text-muted">
          {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
        </span>
        {getLinkedInUrl(post) && (
          <a
            href={getLinkedInUrl(post)!}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:text-accent-light"
          >
            View on LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}
