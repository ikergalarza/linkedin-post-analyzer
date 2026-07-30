import { useEffect, useRef, useState } from 'react';
import { useApi, apiPost } from '../../hooks/useApi';
import { Avatar, EmojiPicker, ReactionBar, fmtRelative } from './shared';
import type { Thread } from './shared';

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


interface Props {
  accounts: ManagedAccount[];
  selectedCreator: string; // 'all' or creator id — shared with the BI tab
  onSelectCreator: (id: string) => void;
}

// Shape returned by GET /api/accounts/comments/pending.
interface PendingGroup {
  post: {
    id: string;
    hook_text: string | null;
    content_text: string | null;
    content_type: string | null;
    published_at: string | null;
    post_url: string | null;
    creator_id: string;
    creator_name: string | null;
    creator_image: string | null;
  };
  pending_threads: Thread[];
  pending_count: number;
}
interface PendingResponse {
  groups: PendingGroup[];
  total_pending: number;
  posts_scanned: number;
}

// Unified "pending comments inbox": EVERY unanswered comment across recent
// posts, grouped by post. We fetch the combined inbox (all accounts) ONCE
// and filter by account CLIENT-SIDE — so switching accounts is instant (no
// re-scan). Each post shows its first few pending comments with a per-post
// "ver más", and the whole list paginates with an overall "ver más".
export default function RepliesPanel({ accounts, onSelectCreator }: Props) {
  // Deferred load: entering the Comments tab must NOT auto-fetch (the scan
  // is slow). We start with an EMPTY choice and show a "elige una cuenta"
  // prompt; the fetch only fires once the user picks something. `choice` is
  // local (not seeded from the shared filter) so every entry starts fresh.
  // Passing null to useApi keeps it idle until then. The scan itself is the
  // same regardless of account (backend returns all accounts, we filter
  // client-side), so any choice triggers the one fetch and switching between
  // accounts afterwards is instant.
  const [choice, setChoice] = useState<string>('');
  const { data, loading, error, refetch } = useApi<PendingResponse>(
    choice ? '/api/accounts/comments/pending' : null
  );

  const GROUPS_PAGE = 5;
  const [visibleGroups, setVisibleGroups] = useState(GROUPS_PAGE);
  useEffect(() => {
    setVisibleGroups(GROUPS_PAGE);
  }, [choice]);

  const allGroups = data?.groups ?? [];
  // Client-side account filter — instant, no network.
  const groups = choice === 'all'
    ? allGroups
    : allGroups.filter((g) => g.post.creator_id === choice);
  const totalPending = groups.reduce((n, g) => n + g.pending_count, 0);

  const pick = (v: string) => {
    setChoice(v);
    onSelectCreator(v); // keep the shared filter in sync for the other tabs
  };

  return (
    <div className="space-y-4 min-w-0">
      {/* Header: account selector + total + refresh */}
      <div className="bg-bg-card border border-border rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Cuenta:</span>
          <select
            value={choice}
            onChange={(e) => pick(e.target.value)}
            className="bg-bg-primary border border-border rounded-md px-2 py-1 text-xs"
          >
            <option value="" disabled>— elige una cuenta —</option>
            <option value="all">Todas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name || 'Unknown'}</option>
            ))}
          </select>
        </div>
        {choice && data && (
          <span className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{totalPending}</span> comentario
            {totalPending === 1 ? '' : 's'} sin responder en {groups.length} post{groups.length === 1 ? '' : 's'}
          </span>
        )}
        {choice && (
          <button
            onClick={refetch}
            disabled={loading}
            className="ml-auto text-xs text-text-muted hover:text-accent disabled:opacity-50 transition-colors"
            title="Vuelve a buscar comentarios pendientes en tus posts recientes"
          >
            {loading ? '↻ Buscando…' : '↻ Actualizar'}
          </button>
        )}
      </div>

      {!choice && (
        <p className="text-center text-text-muted text-sm py-10">
          Elige una cuenta arriba para buscar sus comentarios pendientes.
        </p>
      )}

      {loading && !data && (
        <p className="text-center text-text-muted text-sm py-10">
          Buscando comentarios pendientes en tus posts recientes… (puede tardar unos segundos)
        </p>
      )}
      {error && (
        <p className="text-center text-red-400 text-sm py-6">
          {error} <button onClick={refetch} className="underline">Reintentar</button>
        </p>
      )}
      {data && groups.length === 0 && (
        <p className="text-center text-text-muted text-sm py-10">🎉 No hay comentarios pendientes.</p>
      )}

      {groups.slice(0, visibleGroups).map((g) => (
        <PostGroup key={g.post.id} group={g} />
      ))}

      {groups.length > visibleGroups && (
        <button
          onClick={() => setVisibleGroups((v) => v + GROUPS_PAGE)}
          className="w-full py-2.5 text-xs font-medium text-accent hover:text-accent-light border border-border hover:border-accent/40 rounded-lg transition-colors"
        >
          Ver más posts ({groups.length - visibleGroups} restantes) ↓
        </button>
      )}
    </div>
  );
}

// One post + its pending comments. Shows the first PER_POST comments with
// a per-post "ver más". Replying to a comment dismisses it locally (so it
// disappears + the count drops) without a full re-scan; the header's
// "Actualizar" does the real refetch. When every comment is handled, the
// whole group collapses.
function PostGroup({ group }: { group: PendingGroup }) {
  const PER_POST = 3;
  const [visible, setVisible] = useState(PER_POST);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { post } = group;
  const threads = group.pending_threads.filter((t) => !dismissed.has(t.id));
  if (threads.length === 0) return null; // all handled → collapse

  const headline = (post.hook_text || post.content_text || '').replace(/\s+/g, ' ').trim().slice(0, 160);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 min-w-0">
      {/* Post header — always shows the creator avatar+name (even with a
          single account selected): the small repetition is preferred over
          any ambiguity about whose post each group is. */}
      <div className="mb-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Avatar src={post.creator_image} name={post.creator_name} size={24} />
          <span className="text-sm font-medium whitespace-nowrap">{post.creator_name}</span>
          <span className="text-[10px] text-text-muted whitespace-nowrap">·</span>
          <span className="text-[11px] text-text-muted whitespace-nowrap">{fmtRelative(post.published_at)}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30 whitespace-nowrap">
            {threads.length} pendiente{threads.length === 1 ? '' : 's'}
          </span>
          {post.post_url && (
            <a
              href={post.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-accent hover:text-accent-light ml-auto whitespace-nowrap"
            >
              Ver en LinkedIn →
            </a>
          )}
        </div>
        {headline && <p className="text-xs text-text-primary line-clamp-2 mt-1.5">{headline}</p>}
      </div>

      {/* Pending comments */}
      <div className="space-y-3">
        {threads.slice(0, visible).map((t) => (
          <ThreadCard
            key={t.id}
            thread={t}
            postId={post.id}
            onReplied={() => setDismissed((s) => new Set(s).add(t.id))}
          />
        ))}
      </div>

      {threads.length > visible && (
        <button
          onClick={() => setVisible((v) => v + PER_POST)}
          className="w-full mt-3 py-2 text-xs font-medium text-accent hover:text-accent-light border border-border hover:border-accent/40 rounded-lg transition-colors"
        >
          Ver más comentarios de este post ({threads.length - visible} restantes) ↓
        </button>
      )}
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

/* Caja de respuesta para una SUB-RESPUESTA dentro de un hilo (Iker, 2026-07-29).
   Antes solo se podia contestar al comentario de primer nivel: las respuestas
   que otra persona le dejaba al comentarista se veian pero no se podian
   contestar, asi que la conversacion se cortaba justo donde ya habia
   interes. El backend no necesitaba nada: `/comments/:commentId/reply` acepta
   cualquier id de comentario y una respuesta TAMBIEN es un comentario, asi que
   basta con pasarle el id de la sub-respuesta.
   Va plegada por defecto: si cada respuesta abriera su textarea, un hilo de
   seis dejaria el panel ilegible. */
function SubReplyBox({
  postId,
  reply,
}: {
  postId: string;
  reply: Thread;
}) {
  const [abierto, setAbierto] = useState(false);
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Misma regla que en el hilo principal: a una pagina de empresa no se la
  // menciona, Unipile devuelve 422 con la plantilla de @-mencion.
  const mention = reply.author.name && reply.author.profile_id && !reply.author.is_company
    ? { name: reply.author.name, profile_id: reply.author.profile_id }
    : null;

  const generar = async () => {
    setGenerating(true); setMsg(null);
    try {
      const res = await apiPost<{ reply: string }>(
        `/api/accounts/posts/${postId}/comments/${encodeURIComponent(reply.id)}/generate`,
        {
          comment_text: reply.text,
          commenter_name: reply.author.name,
          commenter_headline: reply.author.headline,
          commenter_profile_id: reply.author.profile_id,
        }
      );
      setDraft(res.reply);
    } catch (e: any) { setMsg(`✗ ${e.message}`); }
    finally { setGenerating(false); }
  };

  const enviar = async () => {
    if (!draft.trim()) return;
    setSending(true); setMsg(null);
    try {
      await apiPost(
        `/api/accounts/posts/${postId}/comments/${encodeURIComponent(reply.id)}/reply`,
        { text: draft.trim(), mention }
      );
      setSent(true); setMsg('✓ Enviado');
    } catch (e: any) { setMsg(`✗ ${e.message}`); }
    finally { setSending(false); }
  };

  if (sent) return <p className="mt-1 text-[10px] text-green-400">✓ Respondido</p>;

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="mt-1 text-[10px] text-text-muted hover:text-accent transition-colors"
      >
        ↩ Responder
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        autoFocus
        placeholder={mention ? `${mention.name} …` : 'Tu respuesta…'}
        className="w-full bg-bg-secondary border border-border rounded-md p-2 text-xs text-text-primary focus:outline-none focus:border-accent resize-y"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={generar}
          disabled={generating}
          className="text-[10px] px-2 py-1 rounded border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-40"
        >
          {generating ? '…' : '✨ Generar'}
        </button>
        <button
          onClick={enviar}
          disabled={sending || !draft.trim()}
          className="text-[10px] px-2 py-1 rounded bg-accent text-bg-primary font-medium hover:bg-accent-light disabled:opacity-40"
        >
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
        <button
          onClick={() => { setAbierto(false); setDraft(''); setMsg(null); }}
          className="text-[10px] text-text-muted hover:text-text-primary"
        >
          Cancelar
        </button>
        {msg && <span className="text-[10px] text-text-muted">{msg}</span>}
      </div>
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
          {thread.is_media_only || !thread.text.trim() ? (
            <p className="text-sm text-text-muted italic flex items-center gap-1">
              <span>🎞️</span> comentó un GIF / imagen{' '}
              <span className="not-italic text-[10px] text-text-muted">(LinkedIn no expone el contenido)</span>
            </p>
          ) : (
            <p className="text-sm text-text-primary whitespace-pre-wrap">{thread.text}</p>
          )}

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
                    {r.is_media_only || !r.text.trim() ? (
                      <p className="text-xs text-text-muted italic">🎞️ GIF / imagen</p>
                    ) : (
                      <p className="text-xs text-text-secondary whitespace-pre-wrap">{r.text}</p>
                    )}
                    <ReactionBar postId={postId} commentId={r.id} initialReaction={r.my_reaction} compact />
                    <SubReplyBox postId={postId} reply={r} />
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
