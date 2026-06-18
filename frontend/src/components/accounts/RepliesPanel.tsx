import { useEffect, useMemo, useRef, useState } from 'react';
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
  profile_id: string | null;
  // Company page → not mentionable, so we skip the @-mention on replies.
  is_company?: boolean;
}

interface Thread {
  id: string;
  text: string;
  date: string | null;
  author: CommentAuthor;
  replies: Thread[];
  answered_by_author?: boolean;
  // The reaction we've already placed on this comment, or null. Sourced
  // from the backend (comment_reactions table) so it persists across
  // reloads.
  my_reaction?: string | null;
}

interface CommentsResponse {
  post: { id: string; content_text: string; creator_name: string | null };
  threads: Thread[];
  total_threads: number;
  unanswered_threads: number;
  // Present when the backend couldn't parse an author name on any thread
  // (Unipile rotated a field) — we render it inline so the shape can be
  // diagnosed without leaving the browser.
  _debug_sample?: unknown;
}

interface Props {
  accounts: ManagedAccount[];
  selectedCreator: string; // 'all' or creator id — shared with the BI tab
  onSelectCreator: (id: string) => void;
}

// The 6 LinkedIn reactions, in the order LinkedIn shows them on hover.
// `type` is the lowercase key the backend + Unipile expect; emoji + label
// are for the UI. Reacting to a comment is a one-click action via Unipile
// (the account is connected), so the user doesn't have to open LinkedIn.
const REACTIONS: { type: string; emoji: string; label: string }[] = [
  { type: 'like', emoji: '👍', label: 'Recomendar' },
  { type: 'celebrate', emoji: '👏', label: 'Celebrar' },
  { type: 'support', emoji: '🫶', label: 'Apoyar' },
  { type: 'love', emoji: '❤️', label: 'Me encanta' },
  { type: 'insightful', emoji: '💡', label: 'Interesante' },
  { type: 'funny', emoji: '😄', label: 'Divertido' },
];

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
      <div className="bg-bg-card border border-border rounded-xl p-3 space-y-3 min-w-0">
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

      {/* RIGHT — thread view. min-w-0 is load-bearing: without it the 1fr
          grid track keeps its default min-width:auto and a long commenter
          headline (which can't break) blows the track past the viewport,
          adding a page-wide horizontal scrollbar. min-w-0 lets the track
          shrink so the headline's `truncate` actually kicks in. */}
      <div className="bg-bg-card border border-border rounded-xl p-5 min-h-[400px] min-w-0">
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

// Imperative handle each ThreadCard exposes, so the parent can ask "are you
// already filled in, and if not generate a draft now". Bulk generation just
// awaits each card in turn — sequential is intentional, both for cleaner
// progress UX and to avoid hammering Anthropic / hitting per-key rate limits.
interface ThreadCardHandle {
  generateIfEmpty: () => Promise<void>;
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

  // Refs keyed by thread id so they survive ordering changes (showAnswered
  // toggle, refetch) without losing the slot that holds each card's handle.
  const cardRefs = useRef<Map<string, ThreadCardHandle | null>>(new Map());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  const handleBulkGenerate = async () => {
    if (bulkRunning) return;
    // Snapshot the visible threads so refetches mid-run don't change the
    // queue length under our feet.
    const targets = threads.map((t) => t.id);
    setBulkRunning(true);
    setBulkProgress({ done: 0, total: targets.length });
    for (let i = 0; i < targets.length; i++) {
      const handle = cardRefs.current.get(targets[i]);
      try {
        if (handle) await handle.generateIfEmpty();
      } catch {
        // Per-card errors are surfaced inside the card itself — keep the
        // bulk loop going so one failure doesn't block the rest.
      }
      setBulkProgress({ done: i + 1, total: targets.length });
    }
    setBulkRunning(false);
  };

  return (
    <div className="space-y-4">
      {/* Post header */}
      <div className="border-b border-border pb-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Avatar src={post.creator_image} name={post.creator_name} size={28} />
          <span className="text-sm font-medium">{post.creator_name}</span>
          <span className="text-xs text-text-muted">· {fmtDate(post.published_at)}</span>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={refetch}
              disabled={loading}
              className="text-xs text-text-muted hover:text-text-primary disabled:opacity-50 transition-colors"
              title="Vuelve a pedir los comentarios a LinkedIn por si hay nuevos"
            >
              {loading ? '↻ Cargando…' : '↻ Actualizar comentarios'}
            </button>
            {post.post_url && (
              <a
                href={post.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:text-accent-light"
              >
                Ver en LinkedIn →
              </a>
            )}
          </div>
        </div>
        <p className="text-sm text-text-secondary whitespace-pre-wrap line-clamp-4">
          {post.content_text}
        </p>
      </div>

      {/* Inline debug — auto-shown when the backend couldn't parse author
          names on any thread, so we can read the actual Unipile shape and
          extend shapeComment's fallbacks. */}
      {data?._debug_sample !== undefined && (
        <details className="text-[11px] border border-red-400/30 bg-red-400/5 rounded p-2">
          <summary className="cursor-pointer text-red-400 font-medium">
            ⚠ Autor no detectado — pulsa para ver la respuesta cruda de Unipile (cópiamela)
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all text-text-secondary">
            {JSON.stringify(data._debug_sample, null, 2)}
          </pre>
        </details>
      )}

      {/* Counts + toggle + bulk action */}
      {data && (
        <div className="flex items-center justify-between text-xs gap-3 flex-wrap">
          <div className="text-text-secondary">
            <span className="font-medium text-text-primary">{data.unanswered_threads}</span>{' '}
            sin responder
            <span className="text-text-muted"> · {data.total_threads} totales</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {threads.length > 0 && (
              <button
                onClick={handleBulkGenerate}
                disabled={bulkRunning}
                className="text-xs px-2.5 py-1 rounded-md border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Genera un borrador por cada hilo visible (sólo los que no tengan ya draft)"
              >
                {bulkRunning && bulkProgress
                  ? `Generando ${bulkProgress.done}/${bulkProgress.total}…`
                  : `✨ Generar todas (${threads.length})`}
              </button>
            )}
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
          <ThreadCard
            key={t.id}
            thread={t}
            postId={post.id}
            onReplied={refetch}
            handleRef={(h) => {
              if (h) cardRefs.current.set(t.id, h);
              else cardRefs.current.delete(t.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Curated emoji set for the reply box — common, comment-appropriate ones.
const REPLY_EMOJIS = [
  '😊', '😅', '😂', '🤣', '😉', '😍', '🤩', '😎', '🤔', '🫡',
  '👀', '🙌', '👏', '👍', '🙏', '🔥', '💪', '🚀', '💯', '✅',
  '🎯', '💡', '⚡', '📈', '🤝', '❤️', '🥳', '😮',
];

// Small emoji picker: a 😊 button that toggles a popover grid. Clicking
// an emoji calls onPick (the parent inserts it at the textarea cursor).
// Closes on pick or on click-outside.
function EmojiPicker({ onPick, disabled }: { onPick: (e: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        title="Añadir emoji"
        className="text-sm px-2 py-1 rounded-md border border-border text-text-secondary hover:border-accent/40 disabled:opacity-50 transition-colors"
      >
        😊
      </button>
      {open && (
        <div className="absolute z-20 bottom-full mb-1 left-0 w-56 max-h-40 overflow-y-auto p-2 rounded-md border border-border bg-bg-card shadow-lg grid grid-cols-7 gap-1">
          {REPLY_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => { onPick(e); setOpen(false); }}
              className="text-lg leading-none p-1 rounded hover:bg-bg-primary"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Reusable reaction bar for ANY comment — top-level OR a reply. Reacting
// to a comment goes through the same endpoint regardless of nesting
// (post_id + comment_id), so this component just needs the post id + the
// specific comment's social id + the reaction already on it (my_reaction).
// `compact` shrinks it slightly for the nested reply rows.
function ReactionBar({
  postId,
  commentId,
  initialReaction,
  compact = false,
}: {
  postId: string;
  commentId: string;
  initialReaction?: string | null;
  compact?: boolean;
}) {
  const [reacting, setReacting] = useState<string | null>(null);
  const [reactedType, setReactedType] = useState<string | null>(initialReaction || null);
  const [reactMsg, setReactMsg] = useState<string | null>(null);

  // The component persists across comment refetches (stable key on the
  // row), so the mount-only initial state won't pick up a reaction that
  // appears on a later refetch. Upgrade null→value when the backend
  // reports one; never downgrade.
  useEffect(() => {
    if (initialReaction && !reactedType) setReactedType(initialReaction);
  }, [initialReaction]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReact = async (reactionType: string) => {
    // One reaction per comment — once set, the bar is locked.
    if (reacting || reactedType) return;
    setReacting(reactionType);
    setReactMsg(null);
    try {
      await apiPost(
        `/api/accounts/posts/${postId}/comments/${encodeURIComponent(commentId)}/react`,
        { reaction_type: reactionType }
      );
      setReactedType(reactionType);
      const r = REACTIONS.find((x) => x.type === reactionType);
      setReactMsg(`✓ ${r?.emoji} ${r?.label} enviado`);
    } catch (e: any) {
      setReactMsg(`✗ ${e.message}`);
    } finally {
      setReacting(null);
    }
  };

  if (reactedType) {
    const r = REACTIONS.find((x) => x.type === reactedType);
    return (
      <div className={`mt-1.5 inline-flex items-center gap-1.5 ${compact ? 'text-[10px]' : 'text-[11px]'} text-text-secondary bg-accent/10 border border-accent/30 rounded-md px-2 py-0.5`}>
        <span className="leading-none">{r?.emoji}</span>
        <span>Ya reaccionaste · <span className="text-accent font-medium">{r?.label}</span></span>
      </div>
    );
  }
  return (
    <div className="mt-1.5 flex items-center gap-1 flex-wrap">
      {REACTIONS.map((r) => {
        const isLoading = reacting === r.type;
        return (
          <button
            key={r.type}
            onClick={() => handleReact(r.type)}
            disabled={!!reacting}
            title={r.label}
            className={`${compact ? 'text-sm' : 'text-base'} leading-none px-1.5 py-1 rounded-md border transition-all disabled:cursor-not-allowed border-transparent hover:border-border hover:bg-bg-primary opacity-70 hover:opacity-100 ${
              isLoading ? 'animate-pulse opacity-100' : ''
            }`}
          >
            {r.emoji}
          </button>
        );
      })}
      {reactMsg && <span className="text-[10px] text-text-muted ml-1">{reactMsg}</span>}
    </div>
  );
}

// Single top-level comment + its replies + the draft-reply box.
function ThreadCard({
  thread,
  postId,
  onReplied,
  handleRef,
}: {
  thread: Thread;
  postId: string;
  onReplied: () => void;
  handleRef?: (handle: ThreadCardHandle | null) => void;
}) {
  const [draft, setDraft] = useState<string>('');
  const [voice, setVoice] = useState<string | null>(null);
  // Whether the current draft will be sent with a @-mention chip tagging the
  // commenter. True when the draft starts with the commenter's exact name
  // (the backend rewrites that prefix into Unipile's {{0}} mention template).
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert an emoji at the textarea cursor (or append if it's not
  // focused), then restore the caret right after the inserted emoji.
  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setDraft((d) => d + emoji);
      return;
    }
    const start = ta.selectionStart ?? draft.length;
    const end = ta.selectionEnd ?? draft.length;
    setDraft(draft.slice(0, start) + emoji + draft.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  // No mention for company pages — they aren't mentionable (Unipile 422s
  // on the @-mention template), so we reply to them as plain text from
  // the start instead of relying on the backend's 422 retry.
  const mention = thread.author.name && thread.author.profile_id && !thread.author.is_company
    ? { name: thread.author.name, profile_id: thread.author.profile_id }
    : null;

  const willMention = !!mention && draft
    .slice(0, mention.name.length)
    .toLowerCase() === mention.name.toLowerCase();

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
          commenter_profile_id: thread.author.profile_id,
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
        { text: draft.trim(), mention }
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

  // Expose generateIfEmpty so the parent's "Generar todas" loop can drive
  // us. We mirror state into refs so the closure inside the handle always
  // reads the latest values (the handle is registered once on mount).
  const stateRef = useRef({ draft, sent, generating });
  stateRef.current = { draft, sent, generating };
  const generateRef = useRef(handleGenerate);
  generateRef.current = handleGenerate;
  useEffect(() => {
    const handle: ThreadCardHandle = {
      generateIfEmpty: async () => {
        const s = stateRef.current;
        if (s.draft || s.sent || s.generating) return;
        await generateRef.current();
      },
    };
    handleRef?.(handle);
    return () => handleRef?.(null);
  }, [handleRef]);

  return (
    <div
      className={`border rounded-lg p-3 ${
        sent ? 'border-accent/30 bg-accent/5 opacity-70' : 'border-border'
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar src={thread.author.profile_picture_url} name={thread.author.name} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <span className="text-sm font-medium whitespace-nowrap">{thread.author.name || 'Anónimo'}</span>
            {thread.author.headline && (
              <span className="text-[11px] text-text-muted truncate min-w-0">· {thread.author.headline}</span>
            )}
            <span className="text-[10px] text-text-muted ml-auto whitespace-nowrap flex-shrink-0">
              {fmtRelative(thread.date)}
            </span>
          </div>
          <p className="text-sm text-text-primary whitespace-pre-wrap">{thread.text}</p>

          {/* Reaction bar for the top-level comment. Once a reaction is
              set (this session or read back from LinkedIn) the bar locks
              and shows the chosen reaction. */}
          <ReactionBar postId={postId} commentId={thread.id} initialReaction={thread.my_reaction} />

          {/* Existing replies, if any — each gets its own reaction bar so
              you can react to a reply-to-a-comment too, not just the
              top-level comment. Same fixed logic via the shared component. */}
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
                    <ReactionBar postId={postId} commentId={r.id} initialReaction={r.my_reaction} compact />
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
                    ref={textareaRef}
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
                    <EmojiPicker onPick={insertEmoji} disabled={generating || sending} />
                    <button
                      onClick={handleGenerate}
                      disabled={generating || sending}
                      className="text-xs px-2.5 py-1 rounded-md border border-border text-text-secondary hover:border-accent/40 disabled:opacity-50"
                    >
                      ↻ Regenerar
                    </button>
                    {mention && (
                      <span
                        className={`text-[10px] ml-auto ${
                          willMention ? 'text-accent' : 'text-text-muted'
                        }`}
                        title={
                          willMention
                            ? `LinkedIn etiquetará a ${mention.name} al inicio`
                            : `El nombre "${mention.name}" debe ir al inicio para que se etiquete`
                        }
                      >
                        {willMention ? `@${mention.name} ✓` : `@${mention.name} ✗`}
                      </span>
                    )}
                    {voice && (
                      <span className="text-[10px] text-text-muted">voz: {voice}</span>
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
