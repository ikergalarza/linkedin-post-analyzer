import { useState } from 'react';
import { apiPost, apiPatch } from '../../hooks/useApi';

interface NetworkComment {
  id: string;
  angle: string;
  comment_text: string;
  is_selected: boolean;
}

interface NetworkPostData {
  id: string;
  content_text: string | null;
  hook_text: string | null;
  published_at: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  post_url: string | null;
  content_type: string;
  media_urls: string[];
  status: 'pending' | 'commented' | 'skipped';
  creator_name: string | null;
  creator_tier: number;
  creator_image: string | null;
  creator_headline: string | null;
  comments: NetworkComment[];
}

const TIER_COLORS: Record<number, string> = {
  1: 'bg-green-500/20 text-green-400',
  2: 'bg-yellow-500/20 text-yellow-400',
  3: 'bg-gray-500/20 text-gray-400',
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400' },
  commented: { bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-400' },
  skipped: { bg: 'bg-gray-500/10 border-gray-500/30', text: 'text-gray-400' },
};

const ANGLE_META: Record<string, { emoji: string; label: string }> = {
  reinforce: { emoji: '💪', label: 'Reinforce key point' },
  contrarian_data: { emoji: '📊', label: 'Challenge the data' },
  contrarian_premise: { emoji: '🧱', label: 'Challenge the premise' },
  contrarian_survivorship: { emoji: '🎲', label: 'Survivorship bias' },
  reframe: { emoji: '🔄', label: 'Reframe the debate' },
  add_missing: { emoji: '➕', label: 'Add a missing point' },
  steal_phrase: { emoji: '🎯', label: 'Steal a phrase' },
  warm_supportive: { emoji: '🤝', label: 'Warm & supportive' },
  better_question: { emoji: '❓', label: 'Ask a better question' },
  // legacy
  contrarian_reflective: { emoji: '🪞', label: 'Contrarian · reflective' },
  contrarian_direct: { emoji: '⚡', label: 'Contrarian · direct' },
  supportive: { emoji: '🤝', label: 'Supportive' },
  personal_experience: { emoji: '🪞', label: 'Personal experience' },
  provocative_question: { emoji: '❓', label: 'Provocative question' },
  plot_twist: { emoji: '🔄', label: 'Plot twist' },
};

function angleMeta(angle: string): { emoji: string; label: string } {
  return ANGLE_META[angle] || { emoji: '💬', label: angle.replace(/_/g, ' ') };
}

interface Props {
  post: NetworkPostData;
  onUpdate: () => void;
}

export default function NetworkPostCard({ post, onUpdate }: Props) {
  const [generating, setGenerating] = useState(false);
  const [showComments, setShowComments] = useState(post.comments.length > 0);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const TEXT_LIMIT = 300;
  const isLong = (post.content_text?.length ?? 0) > TEXT_LIMIT;

  const handleStatusChange = async (status: string) => {
    try {
      await apiPatch(`/api/network/posts/${post.id}/status`, { status });
      onUpdate();
    } catch (err: any) {
      console.error('Status update failed:', err);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      await apiPost(`/api/network/posts/${post.id}/generate-comments`, {});
      setShowComments(true);
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string, commentId: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(commentId);
    setTimeout(() => setCopied(null), 2000);
    // Mark as selected
    try {
      await apiPost(`/api/network/comments/${commentId}/select`, {});
    } catch {}
  };

  const statusStyle = STATUS_STYLES[post.status] || STATUS_STYLES.pending;
  const timeAgo = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Header: Creator + Tier + Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {post.creator_image ? (
            <img src={post.creator_image} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-bg-primary flex items-center justify-center text-text-muted text-sm">
              {(post.creator_name || '?')[0]}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">{post.creator_name || 'Unknown'}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TIER_COLORS[post.creator_tier]}`}>
                T{post.creator_tier}
              </span>
            </div>
            <p className="text-[11px] text-text-muted">{timeAgo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded border ${statusStyle.bg} ${statusStyle.text} capitalize`}>
            {post.status}
          </span>
        </div>
      </div>

      {/* Post content */}
      <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
        {post.content_text
          ? expanded || !isLong
            ? post.content_text
            : post.content_text.substring(0, TEXT_LIMIT) + '...'
          : '(No text content)'}
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-1 text-accent hover:text-accent-light text-xs font-medium"
          >
            {expanded ? 'Show less' : 'See more'}
          </button>
        )}
      </div>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`flex gap-2 overflow-x-auto ${post.media_urls.length === 1 ? '' : 'pb-1'}`}>
          {post.media_urls.map((url, i) => (
            url.match(/\.(mp4|webm|mov)/i) ? (
              <video key={i} src={url} controls className="max-h-56 rounded-lg border border-border" />
            ) : (
              <img key={i} src={url} alt="" className="max-h-56 rounded-lg border border-border object-cover" />
            )
          ))}
        </div>
      )}

      {/* Content type badge */}
      {post.content_type && post.content_type !== 'text_only' && (
        <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-bg-primary text-text-muted border border-border capitalize">
          {post.content_type.replace('_', ' ')}
        </span>
      )}

      {/* Metrics */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span>{post.likes_count.toLocaleString()} likes</span>
        <span>{post.comments_count.toLocaleString()} comments</span>
        <span>{post.reposts_count.toLocaleString()} reposts</span>
        {post.post_url && (
          <a
            href={post.post_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-light transition-colors ml-auto"
          >
            View on LinkedIn
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-3 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          {generating ? 'Generating...' : post.comments.length > 0 ? 'Regenerate' : 'Generate Comments'}
        </button>

        {post.status !== 'commented' && (
          <button
            onClick={() => handleStatusChange('commented')}
            className="px-3 py-1.5 text-green-400 border border-green-500/20 rounded-lg text-xs hover:bg-green-500/10 transition-colors"
          >
            Mark Commented
          </button>
        )}
        {post.status !== 'skipped' && (
          <button
            onClick={() => handleStatusChange('skipped')}
            className="px-3 py-1.5 text-text-muted border border-border rounded-lg text-xs hover:bg-bg-primary transition-colors"
          >
            Skip
          </button>
        )}
        {post.status !== 'pending' && (
          <button
            onClick={() => handleStatusChange('pending')}
            className="px-3 py-1.5 text-blue-400 border border-blue-500/20 rounded-lg text-xs hover:bg-blue-500/10 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-danger text-xs">{error}</p>
      )}

      {/* Generated comments */}
      {showComments && post.comments.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <p className="text-xs text-text-muted font-medium">Generated Comments:</p>
          {post.comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg border ${
                comment.is_selected ? 'border-accent/30 bg-accent/5' : 'border-border bg-bg-primary'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm leading-none">{angleMeta(comment.angle).emoji}</span>
                  <span className="text-[10px] font-medium text-accent uppercase tracking-wide">
                    {angleMeta(comment.angle).label}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(comment.comment_text, comment.id)}
                  className="text-[10px] text-text-muted hover:text-accent transition-colors"
                >
                  {copied === comment.id ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-line leading-relaxed">
                {comment.comment_text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
