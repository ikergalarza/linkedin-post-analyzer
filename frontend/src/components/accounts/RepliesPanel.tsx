import { useEffect, useMemo, useState } from 'react';
import { useApi, apiPost } from '../../hooks/useApi';

// RepliesPanel — the "Comentarios" sub-tab. Pick one of the managed posts
// (newest first), see its unanswered top-level comments, generate a draft
// reply in the author's own voice (Iker or Unai based on who posted), edit
// it, send it via Unipile. Drafts are local state — they vanish on tab
// switch by design (so the user can't accidentally re-send stale text).

interface ManagedAccount {
  id: string;
  name: string | null;
  profile_image_url?: string | null;
}

interface LivePost {
  id: string;
  content_text: string;
  hook_text?: string | null;
  published_at: string;
  comments_count: number;
  creator_id: string;
  creator_name: string | null;
  creator_image?: string | null;
  post_url?: string | null;
}

interface CommentAuthor {
  name: string | null;
  headline: string | null;
  profile_picture_url: string | null;
  public_identifier: string | null;
}

interface Thread {
  id: string;
  text: string;
  date: string | null;
  author: CommentAuthor;
  replies: Thread[];
  answered_by_author?: boolean;
}

interface CommentsResponse {
  post: { id: string; content_text: string; creator_name: string | null };
  threads: Thread[];
  total_threads: number;
  unanswered_threads: number;
}

interface Props {
  accounts: ManagedAccount[];
  selectedCreator: string; // 'all' or creator id — shared with the BI tab
  onSelectCreator: (id: string) => void;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtRelative(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  if (!Number.isFinite(d)) return '';
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const day = Math.floor(h / 24);
  if (day < 30) return `${day}d`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}

function Avatar({ src, name, size = 32 }: { src: string | null | undefined; name: string | null; size?: number }) {
  const initial = (name || '?')[0]?.toUpperCase() || '?';
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="rounded-full object-cover border border-border"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-bg-primary border border-border text-text-muted flex items-center justify-center text-xs"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}

export default function RepliesPanel({ accounts, selectedCreator, onSelectCreator }: Props) {
  const [activePostId, setActivePostId] = useState<string | null>(null);

  // Posts list — reuses /live-posts since it already filters to managed
  // creators with a Unipile id. That endpoint returns last 7 days + any
  // older post with snapshots, which is what we want for triage anyway.
  const postsPath = `/api/accounts/live-posts${selectedCreator !== 'all' ? `?creator_id=${selectedCreator}` : ''}`;
  const { data: postsRaw, loading: postsLoading } = useApi<LivePost[]>(postsPath);
  const posts = useMemo(() => {
    if (!postsRaw) return [];
    return [...postsRaw].sort(
      (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
  }, [postsRaw]);

  // Clear the open post whenever the user changes the account filter — the
  // post they had selected may not even be in the new list.
  useEffect(() => {
    setActivePostId(null);
  }, [selectedCreator]);

  const activePost = posts.find((p) => p.id === activePostId) || null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-4">
      {/* LEFT — post list */}
      <div className="bg-bg-card border border-border rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Cuenta:</span>
          <select
            value={selectedCreator}
            onChange={(e) => onSelectCreator(e.target.value)}
            className="flex-1 bg-bg-primary border border-border rounded-md px-2 py-1 text-xs"
          >
            <option value="all">Todas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name || 'Unknown'}</option>
            ))}
          </select>
        </div>
        <div className="text-[10px] uppercase tracking-wide text-text-muted px-1">
          Publicaciones (más recientes primero)
        </div>
        {postsLoading ? (
          <p className="text-xs text-text-muted text-center py-6">Cargando…</p>
        ) : posts.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-6">No hay publicaciones.</p>
        ) : (
          <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
            {posts.map((p) => {
              const isActive = p.id === activePostId;
              const headline = (p.hook_text || p.content_text || '').slice(0, 110);
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePostId(p.id)}
                  className={`w-full text-left p-2 rounded-md border transition-colors ${
                    isActive
                      ? 'border-accent/60 bg-accent/10'
                      : 'border-transparent hover:border-border hover:bg-bg-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar src={p.creator_image} name={p.creator_name} size={20} />
                    <span className="text-[11px] text-text-secondary truncate">{p.creator_name}</span>
                    <span className="text-[10px] text-text-muted ml-auto whitespace-nowrap">
                      {fmtRelative(p.published_at)}
                    </span>
                  </div>
                  <p className="text-xs text-text-primary line-clamp-2">{headline}</p>
                  <div className="text-[10px] text-text-muted mt-1">
                    {p.comments_count} comentario{p.comments_count === 1 ? '' : 's'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT — thread view */}
      <div className="bg-bg-card border border-border rounded-xl p-5 min-h-[400px]">
        {!activePost ? (
          <p className="text-sm text-text-muted text-center py-20">
            Elige una publicación de la izquierda para ver sus comentarios.
          </p>
        ) : (
          <PostThreadView post={activePost} />
        )}
      </div>
    </div>
  );
}

// Thread view — fetches the comments for one post, shows the post excerpt
// on top, then a list of top-level threads. By default we hide the ones
// the author already replied to (toggleable) so the user only sees the
// pile they actually have to work through.
function PostThreadView({ post }: { post: LivePost }) {
  const [showAnswered, setShowAnswered] = useState(false);
  const { data, loading, error, refetch } = useApi<CommentsResponse>(
    `/api/accounts/posts/${post.id}/comments`
  );

  const threads = useMemo(() => {
    if (!data) return [];
    return showAnswered ? data.threads : data.threads.filter((t) => !t.answered_by_author);
  }, [data, showAnswered]);

  return (
    <div className="space-y-4">
      {/* Post header */}
      <div className="border-b border-border pb-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar src={post.creator_image} name={post.creator_name} size={28} />
          <span className="text-sm font-medium">{post.creator_name}</span>
          <span className="text-xs text-text-muted">· {fmtDate(post.published_at)}</span>
          {post.post_url && (
            <a
              href={post.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs text-accent hover:text-accent-light"
            >
              Ver en LinkedIn →
            </a>
          )}
        </div>
        <p className="text-sm text-text-secondary whitespace-pre-wrap line-clamp-4">
          {post.content_text}
        </p>
      </div>

      {/* Counts + toggle */}
      {data && (
        <div className="flex items-center justify-between text-xs">
          <div className="text-text-secondary">
            <span className="font-medium text-text-primary">{data.unanswered_threads}</span>{' '}
            sin responder
            <span className="text-text-muted"> · {data.total_threads} totales</span>
          </div>
          <label className="flex items-center gap-2 text-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={showAnswered}
              onChange={(e) => setShowAnswered(e.target.checked)}
              className="accent-accent"
            />
            Mostrar también respondidos
          </label>
        </div>
      )}

      {loading && <p className="text-sm text-text-muted text-center py-8">Cargando comentarios…</p>}
      {error && (
        <p className="text-sm text-red-400 text-center py-4">
          {error}{' '}
          <button onClick={refetch} className="underline">Reintentar</button>
        </p>
      )}

      {data && threads.length === 0 && (
        <p className="text-sm text-text-muted text-center py-8">
          {showAnswered ? 'No hay comentarios.' : '🎉 Todos respondidos.'}
        </p>
      )}

      <div className="space-y-3">
        {threads.map((t) => (
          <ThreadCard key={t.id} thread={t} postId={post.id} onReplied={refetch} />
        ))}
      </div>
    </div>
  );
}

// Single top-level comment + its replies + the draft-reply box.
function ThreadCard({
  thread,
  postId,
  onReplied,
}: {
  thread: Thread;
  postId: string;
  onReplied: () => void;
}) {
  const [draft, setDraft] = useState<string>('');
  const [voice, setVoice] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setMsg(null);
    try {
      const res = await apiPost<{ reply: string; voice: string }>(
        `/api/accounts/posts/${postId}/comments/${encodeURIComponent(thread.id)}/generate`,
        {
          comment_text: thread.text,
          commenter_name: thread.author.name,
          commenter_headline: thread.author.headline,
        }
      );
      setDraft(res.reply);
      setVoice(res.voice);
    } catch (e: any) {
      setMsg(`✗ ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    setMsg(null);
    try {
      await apiPost(
        `/api/accounts/posts/${postId}/comments/${encodeURIComponent(thread.id)}/reply`,
        { text: draft.trim() }
      );
      setSent(true);
      setMsg('✓ Enviado a LinkedIn');
      // Refresh the comments list so this thread now shows as answered.
      // Small delay so the LinkedIn-side comment has time to land.
      setTimeout(onReplied, 1500);
    } catch (e: any) {
      setMsg(`✗ ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`border rounded-lg p-3 ${
        sent ? 'border-accent/30 bg-accent/5 opacity-70' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar src={thread.author.profile_picture_url} name={thread.author.name} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{thread.author.name || 'Anónimo'}</span>
            {thread.author.headline && (
              <span className="text-[11px] text-text-muted truncate">· {thread.author.headline}</span>
            )}
            <span className="text-[10px] text-text-muted ml-auto whitespace-nowrap">
              {fmtRelative(thread.date)}
            </span>
          </div>
          <p className="text-sm text-text-primary whitespace-pre-wrap">{thread.text}</p>

          {/* Existing replies, if any */}
          {thread.replies.length > 0 && (
            <div className="mt-3 space-y-2 pl-3 border-l border-border">
              {thread.replies.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <Avatar src={r.author.profile_picture_url} name={r.author.name} size={22} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{r.author.name || 'Anónimo'}</span>
                      <span className="text-[10px] text-text-muted">{fmtRelative(r.date)}</span>
                    </div>
                    <p className="text-xs text-text-secondary whitespace-pre-wrap">{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Draft + actions */}
          {!sent && (
            <div className="mt-3 space-y-2">
              {!draft && !generating && (
                <button
                  onClick={handleGenerate}
                  className="text-xs px-2.5 py-1 rounded-md border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                >
                  ✨ Generar respuesta
                </button>
              )}
              {generating && (
                <p className="text-xs text-text-muted">Escribiendo en la voz del autor…</p>
              )}
              {(draft || generating) && (
                <>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Tu respuesta…"
                    disabled={generating || sending}
                    className="w-full text-sm bg-bg-primary border border-border rounded-md px-3 py-2 min-h-[80px] resize-y focus:outline-none focus:border-accent disabled:opacity-50"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSend}
                      disabled={sending || !draft.trim()}
                      className="text-xs px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending ? 'Enviando…' : 'Enviar a LinkedIn'}
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={generating || sending}
                      className="text-xs px-2.5 py-1 rounded-md border border-border text-text-secondary hover:border-accent/40 disabled:opacity-50"
                    >
                      ↻ Regenerar
                    </button>
                    {voice && (
                      <span className="text-[10px] text-text-muted ml-auto">voz: {voice}</span>
                    )}
                  </div>
                </>
              )}
              {msg && <p className="text-[11px] text-text-muted">{msg}</p>}
            </div>
          )}
          {sent && msg && <p className="text-[11px] text-text-muted mt-2">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
