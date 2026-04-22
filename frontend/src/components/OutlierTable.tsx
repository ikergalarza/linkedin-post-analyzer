import { useMemo, useState } from 'react';

const BASE = import.meta.env.VITE_API_URL || '';

interface MediaItem {
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnail?: string;
}
interface MediaResult {
  content_type: string;
  items: MediaItem[];
  linkedin_url: string | null;
}

function MediaViewer({ postId, contentType }: { postId: string; contentType: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [media, setMedia] = useState<MediaResult | null>(null);
  const [active, setActive] = useState(0);
  const [imgErr, setImgErr] = useState<Record<number, boolean>>({});

  const load = async () => {
    setState('loading');
    try {
      const res = await fetch(`${BASE}/api/posts/post/${postId}/media`);
      if (!res.ok) throw new Error();
      const data: MediaResult = await res.json();
      setMedia(data);
      setState(data.items.length > 0 ? 'loaded' : 'error');
    } catch {
      setState('error');
    }
  };

  const typeIcon: Record<string, string> = { image: '🖼️', carousel: '📎', video: '🎥', document: '📄' };

  if (state === 'idle') return (
    <button onClick={load} className="text-[11px] text-accent hover:text-accent-light border border-accent/30 px-2.5 py-1 rounded-lg transition-colors">
      {typeIcon[contentType] || '🖼️'} Ver creatividad
    </button>
  );
  if (state === 'loading') return <span className="text-[11px] text-text-muted animate-pulse">Cargando…</span>;
  if (state === 'error' || !media || media.items.length === 0) return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-text-muted">URL expirada</span>
      {media?.linkedin_url && (
        <a href={media.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent">ver en LinkedIn ↗</a>
      )}
    </div>
  );

  const item = media.items[active];
  return (
    <div className="space-y-2 mt-2">
      {item.type === 'video' ? (
        <video src={item.url} controls poster={item.thumbnail} className="max-h-64 rounded-lg object-contain bg-black" onError={() => setImgErr(e => ({ ...e, [active]: true }))} />
      ) : item.type === 'image' && !imgErr[active] ? (
        <img src={item.url} alt="" className="max-h-64 rounded-lg object-contain bg-bg-primary" onError={() => setImgErr(e => ({ ...e, [active]: true }))} />
      ) : item.type === 'document' ? (
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent border border-border px-3 py-2 rounded-lg block w-fit">📄 Abrir documento ↗</a>
      ) : (
        <span className="text-[11px] text-text-muted">URL expirada</span>
      )}
      {media.items.length > 1 && (
        <div className="flex gap-1 items-center">
          {media.items.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className={`w-2 h-2 rounded-full ${i === active ? 'bg-accent' : 'bg-border'}`} />
          ))}
          <span className="text-[10px] text-text-muted ml-1">{active + 1}/{media.items.length}</span>
        </div>
      )}
      <button onClick={() => setState('idle')} className="text-[10px] text-text-muted hover:text-text-secondary">Ocultar</button>
    </div>
  );
}

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
  hook_type?: string;
  post_structure?: string;
  comment_like_ratio?: number;
  share_like_ratio?: number;
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

const hookLabels: Record<string, string> = {
  pattern_interrupt: 'Pattern Int.', belief_breaker: 'Belief Break',
  curiosity_gap: 'Curiosity Gap', data_shock: 'Data Shock', hot_take: 'Hot Take',
  personal_confession: 'Confession', story_opener: 'Story',
  hypothetical_question: 'Hypothetical', why_question: 'Why Q',
  how_question: 'How Q', direct_question: 'Direct Q',
  open_question: 'Open Q', rhetorical_question: 'Rhetorical Q',
  list_promise: 'List Promise', prediction: 'Prediction',
  how_to_framework: 'How-To', bold_claim: 'Bold Claim',
  common_mistake: 'Mistake', direct_callout: 'Callout',
  announcement: 'Announce', social_proof_opener: 'Social Proof',
  analogy: 'Analogy', contrarian_take: 'Contrarian', relatable_moment: 'Relatable',
  motivational: 'Motivational', observation: 'Observation', challenge: 'Challenge',
  other: '--',
};

const structLabels: Record<string, string> = {
  hook_list_cta: 'Hook>List>CTA', hook_story_lesson_cta: 'Story>Lesson>CTA',
  problem_agitate_solve: 'PAS', contrarian_proof_reframe: 'Contrarian>Reframe',
  confession_insight_takeaway: 'Confess>Insight', list_framework: 'List',
  problem_solution: 'Prob>Sol', story_lesson: 'Story>Lesson',
  before_after: 'Before/After', step_by_step: 'Step-by-Step',
  myth_busting: 'Myth Bust', question_answer: 'Q&A',
  observation_insight: 'Observation', prediction_vision: 'Prediction',
  motivational_manifesto: 'Motivational', authority_framework: 'Authority',
  comparison: 'Compare', short_punchy: 'Short',
  long_form_essay: 'Long', narrative_arc: 'Narrative',
  content_with_cta: 'Content+CTA', data_driven: 'Data', other: '--',
};

interface Props {
  posts: Post[];
  title?: string;
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; hasMedia: boolean }> = {
  text:            { icon: '📝', label: 'Text',            color: 'text-text-muted bg-bg-hover',      hasMedia: false },
  text_image:      { icon: '📝🖼️', label: 'Text + Photo',    color: 'text-blue-400 bg-blue-400/10',     hasMedia: true  },
  text_carousel:   { icon: '📝📎', label: 'Text + Carousel', color: 'text-purple-400 bg-purple-400/10', hasMedia: true  },
  text_video:      { icon: '📝🎥', label: 'Text + Video',    color: 'text-red-400 bg-red-400/10',       hasMedia: true  },
  text_document:   { icon: '📝📄', label: 'Text + Doc',      color: 'text-amber-400 bg-amber-400/10',   hasMedia: true  },
  image:           { icon: '🖼️', label: 'Photo only',       color: 'text-blue-300 bg-blue-300/10',     hasMedia: true  },
  carousel:        { icon: '📎', label: 'Carousel only',    color: 'text-purple-300 bg-purple-300/10', hasMedia: true  },
  video:           { icon: '🎥', label: 'Video only',       color: 'text-red-300 bg-red-300/10',       hasMedia: true  },
  document:        { icon: '📄', label: 'Doc only',         color: 'text-amber-300 bg-amber-300/10',   hasMedia: true  },
  poll:            { icon: '📊', label: 'Poll',             color: 'text-green-400 bg-green-400/10',   hasMedia: false },
  article:         { icon: '📰', label: 'Article',          color: 'text-cyan-400 bg-cyan-400/10',     hasMedia: false },
};

const PREVIEW_CHARS = 300;

function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTrunc = text.length > PREVIEW_CHARS;
  return (
    <div>
      <p className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed">
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

export default function OutlierTable({ posts, title = 'Outlier Posts' }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const typeCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts) {
      const t = p.content_type || 'text';
      map.set(t, (map.get(t) || 0) + 1);
    }
    return map;
  }, [posts]);

  const filterOptions = useMemo(
    () => ['all', ...Array.from(typeCounts.keys()).sort()],
    [typeCounts]
  );

  const filteredPosts = useMemo(
    () => (typeFilter === 'all' ? posts : posts.filter((p) => (p.content_type || 'text') === typeFilter)),
    [posts, typeFilter]
  );

  return (
    <div className="bg-bg-card rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <h3 className="text-lg font-semibold">
          {title}
          <span className="text-text-muted text-sm font-normal ml-2">
            ({filteredPosts.length}{typeFilter !== 'all' ? ` of ${posts.length}` : ''})
          </span>
        </h3>
        {filterOptions.length > 2 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-text-muted text-xs">Type:</span>
            {filterOptions.map((type) => {
              const cfg = type === 'all'
                ? { icon: '', label: 'All' }
                : TYPE_CONFIG[type] || { icon: '?', label: type };
              const count = type === 'all' ? posts.length : (typeCounts.get(type) || 0);
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    typeFilter === type
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-bg-secondary text-text-muted border border-border hover:border-accent/30'
                  }`}
                >
                  {cfg.icon && <span className="mr-1">{cfg.icon}</span>}
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>
      {filteredPosts.length === 0 ? (
        <p className="text-text-muted">No posts to display.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary text-left border-b border-border">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Hook</th>
                <th className="pb-3 font-medium">Hook Type</th>
                <th className="pb-3 font-medium">Structure</th>
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
              {filteredPosts.map((post) => (
                <>
                  <tr
                    key={post.id}
                    className="border-b border-border/50 hover:bg-bg-hover cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                  >
                    <td className="py-3 whitespace-nowrap text-text-secondary">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
                    </td>
                    <td className="py-3 max-w-[250px] truncate" title={post.hook_text || ''}>
                      {post.hook_text || '--'}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span className="text-xs text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded">
                        {hookLabels[post.hook_type || ''] || post.hook_type || '--'}
                      </span>
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span className="text-xs text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded">
                        {structLabels[post.post_structure || ''] || post.post_structure || '--'}
                      </span>
                    </td>
                    <td className="py-3">
                      {(() => {
                        const cfg = TYPE_CONFIG[post.content_type] || { icon: '?', label: post.content_type, color: 'text-text-muted bg-bg-hover', hasMedia: false };
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
                            <span>{cfg.icon}</span>
                            <span className="hidden sm:inline">{cfg.label}</span>
                          </span>
                        );
                      })()}
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
                      <td colSpan={11} className="bg-bg-secondary p-4">
                        <div className="flex gap-4 mb-3 text-xs text-text-muted">
                          {post.comment_like_ratio != null && post.comment_like_ratio > 0 && (
                            <span>Comment/Like: {Math.round(post.comment_like_ratio * 100)}%</span>
                          )}
                          {post.share_like_ratio != null && post.share_like_ratio > 0 && (
                            <span>Share/Like: {Math.round(post.share_like_ratio * 100)}%</span>
                          )}
                        </div>
                        <ExpandableText text={post.content_text || 'No content available'} />
                        {TYPE_CONFIG[post.content_type]?.hasMedia && (
                          <div className="mt-3">
                            <MediaViewer postId={post.id} contentType={post.content_type} />
                          </div>
                        )}
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
