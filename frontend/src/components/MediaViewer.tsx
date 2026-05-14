import { useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

export interface MediaItem {
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
}

export interface MediaResult {
  content_type: string;
  items: MediaItem[];
  linkedin_url: string | null;
}

// Type → icon mapping used by the "View media" button label. Kept here so
// both PostCard (Dashboard) and the Accounts post rows share the exact
// same affordance when a post has attached media.
export const MEDIA_TYPE_ICONS: Record<string, string> = {
  text_image: '📝🖼️',
  text_carousel: '📝📎',
  text_video: '📝🎥',
  text_document: '📝📄',
  image: '🖼️',
  carousel: '📎',
  video: '🎥',
  document: '📄',
};

// Content types that have NO media — used by callers to decide whether
// to render the button at all. Keep poll/article in here because we
// don't have a viewer for those formats.
export const NO_MEDIA_TYPES = new Set(['text', 'poll', 'article']);

/**
 * MediaViewer — inline expandable image/video/document/carousel viewer.
 *
 * Lazy: doesn't fetch /api/posts/post/:id/media until the user clicks
 * "View media". Carousel posts get dot navigation. Documents render as
 * "Open ↗" links since they're PDFs hosted on LinkedIn's CDN that the
 * browser can't preview inline reliably. If LinkedIn rotates the CDN
 * URLs (which it does after ~2-4 weeks for some accounts), the viewer
 * falls back to a "view on LinkedIn ↗" link instead of a broken image.
 */
export default function MediaViewer({
  postId,
  contentType,
  linkedinUrl,
}: {
  postId: string;
  contentType: string;
  linkedinUrl: string | null;
}) {
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
    const icon = MEDIA_TYPE_ICONS[contentType] || '🖼️';
    return (
      <button
        onClick={load}
        className="text-[11px] text-text-muted hover:text-accent border border-border hover:border-accent/40 px-2.5 py-1 rounded-lg transition-colors"
      >
        {icon} Show media
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
