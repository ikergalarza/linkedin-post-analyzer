import { useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

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

interface MediaItem {
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
}

interface MediaResult {
  content_type: string;
  items: MediaItem[];
  linkedin_url: string | null;
}

function getLinkedInUrl(post: PostData): string | null {
  if (post.post_url) return post.post_url;
  if (post.linkedin_post_id) return `https://www.linkedin.com/feed/update/${post.linkedin_post_id}/`;
  return null;
}

function ratioBadge(ratio: number) {
  if (ratio >= 10) return (
    <span className="bg-diamond/20 text-diamond px-2 py-0.5 rounded text-xs font-bold shadow-[0_0_8px_rgba(103,232,249,0.3)]">{ratio}x</span>
  );
  if (ratio >= 3) return (
    <span className="bg-accent/20 text-accent px-2 py-0.5 rounded text-xs font-bold">{ratio}x</span>
  );
  return <span className="bg-bg-hover text-text-muted px-2 py-0.5 rounded text-xs">{ratio}x</span>;
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; hasMedia: boolean }> = {
  text:            { icon: '📝', label: 'Text',            color: 'text-text-muted bg-bg-hover',          hasMedia: false },
  text_image:      { icon: '📝🖼️', label: 'Text + Photo',    color: 'text-blue-400 bg-blue-400/10',          hasMedia: true  },
  text_carousel:   { icon: '📝📎', label: 'Text + Carousel', color: 'text-purple-400 bg-purple-400/10',      hasMedia: true  },
  text_video:      { icon: '📝🎥', label: 'Text + Video',    color: 'text-red-400 bg-red-400/10',            hasMedia: true  },
  text_document:   { icon: '📝📄', label: 'Text + Doc',      color: 'text-amber-400 bg-amber-400/10',        hasMedia: true  },
  image:           { icon: '🖼️', label: 'Photo only',       color: 'text-blue-300 bg-blue-300/10',          hasMedia: true  },
  carousel:        { icon: '📎', label: 'Carousel only',    color: 'text-purple-300 bg-purple-300/10',      hasMedia: true  },
  video:           { icon: '🎥', label: 'Video only',       color: 'text-red-300 bg-red-300/10',            hasMedia: true  },
  document:        { icon: '📄', label: 'Doc only',         color: 'text-amber-300 bg-amber-300/10',        hasMedia: true  },
  poll:            { icon: '📊', label: 'Poll',             color: 'text-green-400 bg-green-400/10',        hasMedia: false },
  article:         { icon: '📰', label: 'Article',          color: 'text-cyan-400 bg-cyan-400/10',          hasMedia: false },
};

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] || { icon: '?', label: type, color: 'text-text-muted bg-bg-hover', hasMedia: false };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

function MediaViewer({ postId, contentType, linkedinUrl }: { postId: string; contentType: string; linkedinUrl: string | null }) {
  const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [media, setMedia] = useState<MediaResult | null>(null);
  const [active, setActive] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const load = async () => {
    setState('loading');
    try {
      const res = await fetch(`${BASE}/api/posts/post/${postId}/media`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data: MediaResult = await res.json();
      setMedia(data);
      setState(data.items.length > 0 ? 'loaded' : 'error');
    } catch {
      setState('error');
    }
  };

  if (state === 'idle') {
    const icon = TYPE_CONFIG[contentType]?.icon || '🖼️';
    return (
      <button
        onClick={load}
        className="text-[11px] text-text-muted hover:text-accent border border-border hover:border-accent/40 px-2.5 py-1 rounded-lg transition-colors"
      >
        {icon} View media
      </button>
    );
  }

  if (state === 'loading') {
    return <span className="text-[11px] text-text-muted animate-pulse">Loading…</span>;
  }

  if (state === 'error' || !media || media.items.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-text-muted">No saved media</span>
        {linkedinUrl && (
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent hover:text-accent-light">
            — view on LinkedIn ↗
          </a>
        )}
        <button onClick={() => setState('idle')} className="text-[10px] text-text-muted hover:text-text-secondary ml-1">✕</button>
      </div>
    );
  }

  const item = media.items[active];

  return (
    <div className="mt-3 space-y-2">
      {/* Media render */}
      {item.type === 'video' ? (
        <video
          src={item.url}
          controls
          poster={item.thumbnail}
          className="w-full max-h-72 rounded-lg object-contain bg-black"
          onError={() => setImgError((e) => ({ ...e, [active]: true }))}
        >
          Your browser does not support video.
        </video>
      ) : item.type === 'image' && !imgError[active] ? (
        <img
          src={item.url}
          alt={`Media ${active + 1}`}
          className="w-full max-h-72 rounded-lg object-contain bg-bg-primary"
          onError={() => setImgError((e) => ({ ...e, [active]: true }))}
        />
      ) : item.type === 'document' ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 bg-bg-primary rounded-lg text-xs text-accent hover:text-accent-light border border-border"
        >
          📄 Open document ↗
        </a>
      ) : (
        <div className="text-[11px] text-text-muted">
          Media URL expired.{' '}
          {linkedinUrl && (
            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light">
              View on LinkedIn ↗
            </a>
          )}
        </div>
      )}

      {/* Carousel navigation */}
      {media.items.length > 1 && (
        <div className="flex items-center gap-1">
          {media.items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === active ? 'bg-accent' : 'bg-border hover:bg-text-muted'}`}
            />
          ))}
          <span className="text-[10px] text-text-muted ml-1">{active + 1}/{media.items.length}</span>
        </div>
      )}

      <button onClick={() => setState('idle')} className="text-[10px] text-text-muted hover:text-text-secondary">
        Hide
      </button>
    </div>
  );
}

const PREVIEW_CHARS = 280;

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTrunc = text.length > PREVIEW_CHARS;
  return (
    <div className="mb-3">
      <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
        {expanded || !needsTrunc ? text : text.slice(0, PREVIEW_CHARS) + '…'}
      </p>
      {needsTrunc && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-accent hover:text-accent-light mt-1"
        >
          {expanded ? 'Show less ↑' : 'Show more ↓'}
        </button>
      )}
    </div>
  );
}

export default function PostCard({ post }: Props) {
  const linkedinUrl = getLinkedInUrl(post);

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

      <ExpandableText text={post.content_text || 'No content'} />

      <div className="flex items-center justify-between text-xs text-text-muted">
        <div className="flex gap-3">
          <span>{post.likes_count} likes</span>
          <span>{post.comments_count} comments</span>
          <span>{post.reposts_count} reposts</span>
        </div>
        <div className="flex items-center gap-2">
          <TypeBadge type={post.content_type} />
          {post.outlier_ratio > 0 && ratioBadge(post.outlier_ratio)}
        </div>
      </div>

      {/* Media viewer — always available (content_type can be misclassified if Unipile missed the attachment) */}
      <div className="mt-3">
        <MediaViewer postId={post.id} contentType={post.content_type} linkedinUrl={linkedinUrl} />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <span className="text-xs text-text-muted">
          {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
        </span>
        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:text-accent-light"
          >
            Ver en LinkedIn ↗
          </a>
        )}
      </div>
    </div>
  );
}
