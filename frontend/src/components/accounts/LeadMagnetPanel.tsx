import { useEffect, useMemo, useRef, useState } from 'react';
import { useApi, apiPost, apiGet } from '../../hooks/useApi';
import { Avatar, EmojiPicker, ReactionBar, fmtRelative } from './shared';
import type { Thread } from './shared';
import { buildDm, buildInviteNote, buildReply, commentDepth, matchesKeyword, voiceFor } from './leadMagnetCopy';
import type { Voice } from './leadMagnetCopy';

// LeadMagnetPanel — the "Lead Magnet" sub-tab.
//
// The job: a lead magnet post tells people to comment a keyword, and in
// exchange we send them a resource by DM. This tab does that end to end —
// pick the account, pick the post, type the keyword + link + topic, and get
// one card per person who commented it, each with the reply and the DM
// already drafted.
//
// Three things worth knowing before reading on:
//
// 1. The drafts are TEMPLATES, not model output (see leadMagnetCopy.ts).
//    They're there the moment the card renders — there's no "generate" step
//    for the normal case. The AI button only shows on comments that asked a
//    real question.
//
// 2. LinkedIn only delivers a plain DM to a 1st-degree connection. Everyone
//    else gets an invitation carrying the resource in the note. The card
//    picks which, from the degree badge, and says so.
//
// 3. Sends are ONE BY ONE, deliberately. No "send all" — a hundred DMs in a
//    burst from one account is the pattern LinkedIn restricts accounts for,
//    and losing the account costs more than any lead magnet earns.

interface ManagedAccount {
  id: string;
  name: string | null;
  profile_image_url?: string | null;
}

interface Props {
  accounts: ManagedAccount[];
  onSelectCreator: (id: string) => void;
}

interface GridPost {
  id: string;
  hook_text: string | null;
  content_text: string | null;
  content_type: string | null;
  published_at: string | null;
  post_url: string | null;
  comments_count: number | null;
  likes_count: number | null;
  creator_name: string | null;
  creator_image: string | null;
}

interface CommentsResponse {
  post: { id: string; content_text: string | null; creator_name: string | null };
  threads: Thread[];
}

// One row of lead_magnet_sends, as the backend returns it. Keyed by PERSON
// (provider_id), not by comment — one resource per person per post.
interface SendRecord {
  comment_social_id: string;
  provider_id: string;
  kind: 'dm' | 'invite';
  status: 'sent' | 'failed';
  text: string | null;
  error: string | null;
  created_at: string;
}

// The per-post config (keyword / link / topic). Kept in localStorage keyed by
// post id: you'll come back to the same lead magnet over a couple of days as
// comments trickle in, and retyping the link every time is how a wrong link
// eventually goes out.
// Los 2 tipos de lead magnet (`docs/skills/global-instructions.md §4.4`). No son
// un ajuste: son dos formatos con dos mecánicas y dos resultados distintos.
//  · dm      → comenta la palabra, le mandamos el recurso por privado.
//  · publico → el valor se entrega en el comentario, a la vista de todos, y el
//              enlace lleva a lo que no puede conseguir solo (ahí pedimos correo).
// El público tiene el techo (8.55x · 483 comentarios) pero el que se hizo
// regalaba TODO y no capturó ni un correo. Por eso el público NO pide campos: su
// generador (/api/accounts/rastro/generate) escribe el análisis, le crea su
// página con gate de correo y devuelve el comentario con el enlace ya dentro.
export type LmKind = 'dm' | 'publico';

interface LmConfig {
  kind: LmKind;
  keyword: string;
  link: string;
  topic: string;
}
const emptyConfig: LmConfig = { kind: 'dm', keyword: '', link: '', topic: '' };

function loadConfig(postId: string): LmConfig {
  try {
    const raw = localStorage.getItem(`lm-config:${postId}`);
    if (!raw) return emptyConfig;
    const p = JSON.parse(raw);
    return {
      kind: p.kind === 'publico' ? 'publico' : 'dm', // los configs viejos no tienen kind
      keyword: p.keyword || '',
      link: p.link || '',
      topic: p.topic || '',
    };
  } catch {
    return emptyConfig;
  }
}
function saveConfig(postId: string, cfg: LmConfig) {
  try {
    localStorage.setItem(`lm-config:${postId}`, JSON.stringify(cfg));
  } catch {
    /* private mode / quota — the config just won't persist, not fatal */
  }
}

export default function LeadMagnetPanel({ accounts, onSelectCreator }: Props) {
  // Same deferred-load shape as the Comentarios tab: nothing fetches until
  // an account is chosen.
  const [creator, setCreator] = useState<string>('');
  const [postId, setPostId] = useState<string | null>(null);

  const { data: gridData, loading: gridLoading, error: gridError } = useApi<{ posts: GridPost[] }>(
    creator ? `/api/accounts/lead-magnet/posts?creator_id=${creator}` : null
  );

  const posts = gridData?.posts ?? [];
  const selectedPost = posts.find((p) => p.id === postId) ?? null;

  const pickAccount = (v: string) => {
    setCreator(v);
    setPostId(null); // a post from the old account must not survive the switch
    onSelectCreator(v);
  };

  return (
    <div className="space-y-4 min-w-0">
      {/* Step 1 — account */}
      <div className="bg-bg-card border border-border rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Cuenta:</span>
          <select
            value={creator}
            onChange={(e) => pickAccount(e.target.value)}
            className="bg-bg-primary border border-border rounded-md px-2 py-1 text-xs"
          >
            <option value="" disabled>— elige una cuenta —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name || 'Unknown'}</option>
            ))}
          </select>
        </div>
        {selectedPost && (
          <button
            onClick={() => setPostId(null)}
            className="text-xs text-accent hover:text-accent-light"
          >
            ← Cambiar de post
          </button>
        )}
      </div>

      {!creator && (
        <p className="text-center text-text-muted text-sm py-10">
          Elige una cuenta para ver sus posts.
        </p>
      )}

      {/* Step 2 — the post grid. Hidden once a post is picked, so the working
          area isn't competing with 20 cards you're done with. */}
      {creator && !selectedPost && (
        <div>
          {gridLoading && <p className="text-center text-text-muted text-sm py-10">Cargando posts…</p>}
          {gridError && <p className="text-center text-red-400 text-sm py-6">{gridError}</p>}
          {!gridLoading && posts.length === 0 && (
            <p className="text-center text-text-muted text-sm py-10">Esta cuenta no tiene posts registrados.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {posts.map((p) => (
              <PostTile key={p.id} post={p} onPick={() => setPostId(p.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — the working area. Keyed by post id so switching posts
          REMOUNTS it: every draft, every "ver más" and the loaded config
          belong to one post, and carrying any of it across would mean
          sending post A's resource to post B's commenters. */}
      {selectedPost && <Workspace key={selectedPost.id} post={selectedPost} creatorId={creator} />}
    </div>
  );
}

// One tile in the post grid. No thumbnail on purpose: LinkedIn's image URLs
// are time-signed and 403 once expired, so a 20-tile grid would fire 20
// refresh calls and still show holes. The hook is what identifies the post
// anyway.
function PostTile({ post, onPick }: { post: GridPost; onPick: () => void }) {
  const headline = (post.hook_text || post.content_text || '(sin texto)')
    .replace(/\s+/g, ' ')
    .trim();
  return (
    <button
      onClick={onPick}
      className="text-left bg-bg-card border border-border hover:border-accent/50 rounded-xl p-3 transition-colors min-w-0 flex flex-col gap-2"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Avatar src={post.creator_image} name={post.creator_name} size={20} />
        <span className="text-[11px] text-text-muted whitespace-nowrap">{fmtRelative(post.published_at)}</span>
        {post.content_type && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-primary border border-border text-text-muted whitespace-nowrap">
            {post.content_type}
          </span>
        )}
      </div>
      <p className="text-xs text-text-primary line-clamp-3 flex-1">{headline}</p>
      <div className="flex items-center gap-3 text-[11px] text-text-muted">
        <span className="tabular-nums">💬 {post.comments_count ?? 0}</span>
        <span className="tabular-nums">👍 {post.likes_count ?? 0}</span>
      </div>
    </button>
  );
}

// The post's config bar + the filtered commenter list.
function Workspace({ post, creatorId }: { post: GridPost; creatorId: string }) {
  // No "reload on post change" effect: the parent keys this component by
  // post id, so a different post is a fresh mount and this initialiser runs
  // again on its own.
  const [cfg, setCfg] = useState<LmConfig>(() => loadConfig(post.id));
  useEffect(() => { saveConfig(post.id, cfg); }, [post.id, cfg]);

  const { data, loading, error, refetch } = useApi<CommentsResponse>(
    `/api/accounts/posts/${post.id}/comments`
  );
  const { data: sendsData, refetch: refetchSends } = useApi<{ sends: SendRecord[] }>(
    `/api/accounts/lead-magnet/sends?post_id=${post.id}`
  );

  // provider_id → the records for that PERSON. Keyed by person, not comment:
  // someone with two keyword-carrying comments has one delivery between them,
  // and both cards need to know about it. A person can legitimately have both
  // an invite and (later) a DM, so this is a list.
  const sendsByPerson = useMemo(() => {
    const m = new Map<string, SendRecord[]>();
    for (const s of sendsData?.sends ?? []) {
      const list = m.get(s.provider_id) ?? [];
      list.push(s);
      m.set(s.provider_id, list);
    }
    return m;
  }, [sendsData]);

  // Cada tipo necesita campos distintos, así que "listo" no es el mismo.
  // En PÚBLICO solo hace falta la palabra clave: el generador pone el análisis,
  // la página y el enlace. En DM siguen haciendo falta el enlace y el tema.
  const ready =
    cfg.kind === 'publico'
      ? !!cfg.keyword.trim()
      : !!(cfg.keyword.trim() && cfg.link.trim() && cfg.topic.trim());

  // Keyword filter, client-side: the comment list is already in memory, so
  // changing the keyword re-filters instantly instead of hitting LinkedIn
  // again. Company pages are dropped — you can't DM a company page, and a
  // company commenting the keyword isn't a lead.
  const matches = useMemo(() => {
    if (!cfg.keyword.trim()) return [];
    return (data?.threads ?? []).filter(
      (t) => !t.author.is_company && matchesKeyword(t.text || '', cfg.keyword)
    );
  }, [data, cfg.keyword]);

  // Pagination resets whenever the keyword changes (a new keyword is a new
  // list, and inheriting "showing 40" from the previous one is nonsense).
  // The reset is DERIVED rather than done in an effect: we remember which
  // keyword the count belongs to, and ignore it once that goes stale.
  // Which comment owns the DM for each person.
  //
  // The same person can land on this list twice: once for the real request
  // ("COMITÉ ventas") and once for a longer comment where the keyword just
  // happens to appear mid-sentence ("...el comité te la desmonta"). Both
  // match, and offering the resource on both is how you send it twice — the
  // second time for a comment that never asked for anything.
  //
  // So the resource lives on exactly ONE card per person: their plain
  // keyword comment, which is the actual request. Only if a person has no
  // plain comment at all does the rich one inherit it — otherwise someone
  // who asked AND added something ("PROPUESTA, ¿cubre servicios?") would
  // silently never get it, which is worse than the duplicate we're avoiding.
  //
  // Ties break on the OLDEST comment: if someone left the same shape twice,
  // the first is the request and the second is chatter.
  const dmOwnerByPerson = useMemo(() => {
    const owner = new Map<string, string>(); // provider_id → comment id
    const best = new Map<string, { id: string; plain: boolean; at: number }>();
    for (const t of matches) {
      const pid = t.author.profile_id;
      if (!pid) continue;
      const plain = commentDepth(t.text || '', cfg.keyword) === 'plain';
      const at = t.date ? new Date(t.date).getTime() : Number.MAX_SAFE_INTEGER;
      const cur = best.get(pid);
      const better =
        !cur ||
        (plain && !cur.plain) ||            // a real request beats prose
        (plain === cur.plain && at < cur.at); // same shape → the earlier one
      if (better) best.set(pid, { id: t.id, plain, at });
    }
    for (const [pid, b] of best) owner.set(pid, b.id);
    return owner;
  }, [matches, cfg.keyword]);

  const PAGE = 10;
  const [vis, setVis] = useState<{ key: string; n: number }>({ key: cfg.keyword, n: PAGE });
  const visible = vis.key === cfg.keyword ? vis.n : PAGE;
  const showMore = () => setVis({ key: cfg.keyword, n: visible + PAGE });

  const headline = (post.hook_text || post.content_text || '').replace(/\s+/g, ' ').trim().slice(0, 200);

  // Variant rotation lives at the LIST level, not the card: the point is that
  // two cards in the same batch don't both say "Enviado!". A ref (not state)
  // because updating it must not re-render every sibling card.
  // Whose account is answering. Everything written on this post is in that
  // person's voice — Asier's stretch is shorter than Iker's or Unai's.
  const voice = voiceFor(post.creator_name);

  const recentVariants = useRef<string[]>([]);
  const takeVariant = () => {
    const { text, variant } = buildReply({ recent: recentVariants.current, voice });
    recentVariants.current = [...recentVariants.current, variant].slice(-6);
    return text;
  };

  const sentCount = (sendsData?.sends ?? []).filter((s) => s.status === 'sent').length;

  return (
    <div className="space-y-4 min-w-0">
      {/* The post we're working on */}
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 flex-wrap min-w-0 mb-1.5">
          <Avatar src={post.creator_image} name={post.creator_name} size={24} />
          <span className="text-sm font-medium">{post.creator_name}</span>
          <span className="text-[11px] text-text-muted">· {fmtRelative(post.published_at)}</span>
          <span className="text-[11px] text-text-muted">· 💬 {post.comments_count ?? 0}</span>
          {/* Refresh lives HERE, top-right of the post, and is NOT gated on
              the config being filled in: while a lead magnet is live the
              comments arrive by the minute, and this is the button you hit
              over and over. Re-reads the comments from LinkedIn AND the
              already-sent list, so a card can't come back offering to send
              the resource to someone who already got it. */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => { refetch(); refetchSends(); }}
              disabled={loading}
              className="text-[11px] text-text-muted hover:text-accent disabled:opacity-50 transition-colors whitespace-nowrap"
              title="Vuelve a leer los comentarios de este post en LinkedIn"
            >
              {loading ? '↻ Buscando…' : '↻ Recargar comentarios'}
            </button>
            {post.post_url && (
              <a
                href={post.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-accent hover:text-accent-light whitespace-nowrap"
              >
                Ver en LinkedIn →
              </a>
            )}
          </div>
        </div>
        {headline && <p className="text-xs text-text-primary line-clamp-2">{headline}</p>}
      </div>

      {/* Tipo de lead magnet + su config. El tipo va PRIMERO y arriba porque
          decide qué campos tienen sentido debajo: son dos formatos distintos,
          no un ajuste. */}
      <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
        <KindPicker value={cfg.kind} onChange={(k) => setCfg((c) => ({ ...c, kind: k }))} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field
            label="Palabra clave"
            hint="La que pides comentar. Ej: MAPA"
            value={cfg.keyword}
            onChange={(v) => setCfg((c) => ({ ...c, keyword: v }))}
            placeholder="MAPA"
          />
          {/* El DM necesita saber QUÉ se manda y ADÓNDE. El público no: el
              generador escribe el análisis y le crea su propia página, así que
              pedirle un enlace fijo aquí sería pedirle algo que no existe. */}
          {cfg.kind === 'dm' && (
            <Field
              label="Enlace del recurso"
              hint="El de recursos.neety.com que va en el mensaje"
              value={cfg.link}
              onChange={(v) => setCfg((c) => ({ ...c, link: v }))}
              placeholder="https://recursos.neety.com/…"
            />
          )}
          {cfg.kind === 'dm' && (
            <Field
              label="Tema"
              hint="Rellena «el recurso sobre…»"
              value={cfg.topic}
              onChange={(v) => setCfg((c) => ({ ...c, topic: v }))}
              placeholder="el mapa de logística de Bizkaia"
            />
          )}
        </div>

        {cfg.kind === 'publico' && (
          <p className="text-[11px] text-text-muted leading-snug pt-1 border-t border-border">
            Solo hace falta la palabra clave. El post tiene que pedirles que{' '}
            <span className="text-text-secondary">peguen su web</span> junto a ella. Al darle a{' '}
            <span className="text-text-secondary">Redactar respuesta</span> en cada comentario, se lee su web de
            verdad, se audita, se le crea su propia página y el enlace ya viene dentro del texto. El comentario
            regala el fallo más caro citando su titular, y la página pide el correo para ver los demás. Si el
            comentario no trae web, avisa y no genera nada.
          </p>
        )}


        {ready && (
          <div className="flex items-center gap-3 flex-wrap text-xs text-text-secondary pt-1 border-t border-border">
            <span>
              <span className="font-semibold text-text-primary">{matches.length}</span> comentario
              {matches.length === 1 ? '' : 's'} con «{cfg.keyword.trim()}»
            </span>
            {sentCount > 0 && (
              <span className="text-text-muted">· {sentCount} ya recibieron el recurso</span>
            )}
          </div>
        )}
      </div>

      {!ready && (
        <p className="text-center text-text-muted text-sm py-10">
          Rellena la palabra clave, el enlace y el tema para ver a quién hay que mandarle el recurso.
        </p>
      )}

      {ready && loading && !data && (
        <p className="text-center text-text-muted text-sm py-10">Cargando comentarios del post…</p>
      )}
      {ready && error && (
        <p className="text-center text-red-400 text-sm py-6">
          {error} <button onClick={refetch} className="underline">Reintentar</button>
        </p>
      )}
      {ready && data && matches.length === 0 && (
        <p className="text-center text-text-muted text-sm py-10">
          Ningún comentario contiene «{cfg.keyword.trim()}». Revisa que la palabra sea la del post.
        </p>
      )}

      {ready && matches.slice(0, visible).map((t) => (
        <CommenterCard
          key={t.id}
          thread={t}
          postId={post.id}
          creatorId={creatorId}
          cfg={cfg}
          sends={t.author.profile_id ? sendsByPerson.get(t.author.profile_id) ?? [] : []}
          ownsDm={dmOwnerByPerson.get(t.author.profile_id ?? '') === t.id}
          voice={voice}
          initialReply={takeVariant}
          onSent={refetchSends}
        />
      ))}

      {ready && matches.length > visible && (
        <button
          onClick={showMore}
          className="w-full py-2.5 text-xs font-medium text-accent hover:text-accent-light border border-border hover:border-accent/40 rounded-lg transition-colors"
        >
          Ver más ({matches.length - visible} restantes) ↓
        </button>
      )}
    </div>
  );
}

// El selector de tipo. Dos opciones, no un desplegable: con dos, un desplegable
// esconde la mitad de la decisión detrás de un clic. Cada una dice en una línea
// qué hace, porque la diferencia entre las dos no es obvia por el nombre.
function KindPicker({ value, onChange }: { value: LmKind; onChange: (k: LmKind) => void }) {
  const OPCIONES: { id: LmKind; titulo: string; sub: string }[] = [
    { id: 'dm', titulo: 'Por privado', sub: 'Comentan la palabra y les mandamos el recurso al DM' },
    { id: 'publico', titulo: 'En comentarios', sub: 'Les damos el valor en público y el enlace pide el correo' },
  ];
  return (
    <div>
      <label className="block text-[11px] font-medium text-text-secondary mb-1.5">
        Tipo de lead magnet
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPCIONES.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={on}
              className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                on
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-bg-primary hover:border-text-muted'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`w-3.5 h-3.5 rounded-full border-[3px] shrink-0 transition-colors ${
                    on ? 'border-accent' : 'border-border'
                  }`}
                />
                <span className={`text-sm font-medium ${on ? 'text-accent' : 'text-text-primary'}`}>
                  {o.titulo}
                </span>
              </span>
              <span className="block text-[10px] text-text-muted mt-1 ml-[22px]">{o.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  const cls =
    'w-full text-sm bg-bg-primary border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-accent';
  return (
    <div className="min-w-0">
      <label className="block text-[11px] font-medium text-text-secondary mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={`${cls} resize-y leading-snug`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
      <p className="text-[10px] text-text-muted mt-1">{hint}</p>
    </div>
  );
}

// The degree badge. This is the load-bearing bit of information on the card:
// it decides whether the person can be DM'd at all.
function DegreeBadge({ d }: { d: number | null | undefined }) {
  if (d === 1) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30 whitespace-nowrap">
        1er grado · DM
      </span>
    );
  }
  const label = d === 2 ? '2º grado' : d === 3 ? '3er grado' : 'grado desconocido';
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded bg-bg-primary text-text-muted border border-border whitespace-nowrap"
      title="LinkedIn solo entrega un DM normal a contactos de 1er grado. A esta persona se le manda una invitación con el recurso en la nota."
    >
      {label} · invitación
    </span>
  );
}

// One person who commented the keyword: their comment, the reaction bar, the
// reply draft, and the DM (or invitation) draft. Both drafts arrive written.
function CommenterCard({
  thread,
  postId,
  creatorId,
  cfg,
  sends,
  ownsDm,
  voice,
  initialReply,
  onSent,
}: {
  thread: Thread;
  postId: string;
  creatorId: string;
  cfg: LmConfig;
  sends: SendRecord[];
  // True on the ONE card per person that carries the resource. False on that
  // person's other keyword-matching comments, which show only a reply — the
  // resource goes out once, from the comment that actually asked for it.
  ownsDm: boolean;
  // The voice of the account that published the post, not of the commenter.
  voice: Voice;
  initialReply: () => string;
  onSent: () => void;
}) {
  const degree = thread.author.network_distance ?? null;
  // A plain DM only reaches 1st-degree. Unknown degree → invitation, because
  // guessing wrong on a DM burns the send; an invitation always at least
  // arrives.
  const kind: 'dm' | 'invite' = degree === 1 ? 'dm' : 'invite';

  const priorSend = sends.find((s) => s.kind === kind) ?? null;
  const alreadySent = priorSend?.status === 'sent';

  // 'plain' → they dropped the keyword and nothing else; the template IS the
  // answer. 'rich' → they wrote something real, and "remitido!" would be
  // throwing away the best comment on the post.
  const depth = commentDepth(thread.text || '', cfg.keyword);

  // ── reply state ──
  // Drafted once on mount, from the list-level variant rotation. Lazy initial
  // state so the rotation advances exactly once per card, not on every render.
  const [reply, setReply] = useState<string>(() => {
    // En PÚBLICO no hay plantilla que valga: la respuesta es el valor entero y
    // personalizado, así que se redacta. Un "Enviado!" precargado aquí sería
    // justo lo contrario de lo que hace funcionar al formato.
    if (cfg.kind === 'publico') return '';
    const name = thread.author.name;
    const base = initialReply();
    return name && thread.author.profile_id ? `${name} ${base.charAt(0).toLowerCase()}${base.slice(1)}` : base;
  });
  const [replySending, setReplySending] = useState(false);
  const [replySent, setReplySent] = useState(!!thread.answered_by_author);
  // Your own edits are law: once you've typed in the box, nothing auto-drafts
  // over it.
  const [replyTouched, setReplyTouched] = useState(false);
  const [replyMsg, setReplyMsg] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  // ── location, for the region-aware greeting ──
  // Lazily fetched per rendered card (the comment payload has no location).
  // The DM draft is written immediately with a neutral greeting and rewritten
  // if a location turns up — so a slow or failed profile call costs nothing
  // but the regional touch.
  const [location, setLocation] = useState<string | null>(null);
  useEffect(() => {
    // Not the owner → no message to greet with, so don't spend a Unipile
    // profile call on it.
    if (!thread.author.profile_id || !ownsDm) return;
    let cancelled = false;
    apiGet<{ location: string | null }>(
      `/api/accounts/lead-magnet/commenter?creator_id=${creatorId}&provider_id=${encodeURIComponent(thread.author.profile_id)}`
    )
      .then((r) => { if (!cancelled && r?.location) setLocation(r.location); })
      .catch(() => { /* neutral greeting is a fine outcome */ });
    return () => { cancelled = true; };
  }, [thread.author.profile_id, creatorId, ownsDm]);

  // ── message state ──
  const [message, setMessage] = useState<string>('');
  // The user may have edited the draft; don't clobber their text when the
  // location arrives or the topic changes.
  const [msgTouched, setMsgTouched] = useState(false);
  useEffect(() => {
    if (msgTouched || alreadySent || !ownsDm) return;
    const input = { name: thread.author.name, location, topic: cfg.topic, link: cfg.link, voice };
    setMessage(kind === 'dm' ? buildDm(input) : buildInviteNote(input));
  }, [location, cfg.topic, cfg.link, kind, msgTouched, alreadySent, ownsDm, voice, thread.author.name]);

  const [msgSending, setMsgSending] = useState(false);
  const [msgResult, setMsgResult] = useState<{ status: 'sent' | 'failed'; error: string | null } | null>(
    priorSend ? { status: priorSend.status, error: priorSend.error } : null
  );

  const mention = thread.author.name && thread.author.profile_id && !thread.author.is_company
    ? { name: thread.author.name, profile_id: thread.author.profile_id }
    : null;
  const willMention = !!mention && reply.slice(0, mention.name.length).toLowerCase() === mention.name.toLowerCase();

  const insertEmoji = (emoji: string) => {
    setReplyTouched(true); // dropping an emoji in is an edit like any other
    const ta = replyRef.current;
    if (!ta) { setReply((d) => d + emoji); return; }
    const start = ta.selectionStart ?? reply.length;
    const end = ta.selectionEnd ?? reply.length;
    setReply(reply.slice(0, start) + emoji + reply.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  // The written reply, for comments that earned one. Goes through the
  // Comentarios tab's generator — same voice, same rules.
  //
  // The topic is sent ONLY when this card is the one delivering the resource
  // (ownsDm). That flag is what makes "te lo acabo de mandar" true: if the
  // DM goes out from this person's OTHER comment, saying it here is a lie the
  // first time and a repeat the second — they'd read that we sent it twice.
  // Without the topic the generator writes a plain reply that just engages
  // with their point, which is exactly right for a comment that isn't the
  // request.
  const handleAi = async () => {
    setAiLoading(true);
    setReplyMsg(null);
    try {
      // Camino PÚBLICO: no pasa por el generador de respuestas normal. Este lee
      // la web que ha pegado, la audita, le crea su propia página y devuelve el
      // comentario con el enlace ya dentro. Tarda más que el normal (hay que
      // leer su web de verdad) y falla a propósito si el comentario no trae URL.
      if (cfg.kind === 'publico') {
        const r = await apiPost<{ publicComment: string; shareUrl: string; sector: string }>(
          '/api/accounts/rastro/generate',
          {
            post_id: postId,
            comment_text: thread.text,
            commenter_name: thread.author.name,
            commenter_headline: thread.author.headline,
            commenter_profile_id: thread.author.profile_id,
          }
        );
        setReply(r.publicComment);
        // Sin shareUrl = web no auditable (youtube y compañía): hay comentario con
        // gracia pero NO hay página, así que no la anuncies.
        setReplyMsg(
          r.shareUrl
            ? `✓ Auditada ${r.sector} · página creada: ${r.shareUrl}`
            : `✓ ${r.sector} no es auditable · respuesta con guasa, sin página`
        );
        return;
      }

      const res = await apiPost<{ reply: string }>(
        `/api/accounts/posts/${postId}/comments/${encodeURIComponent(thread.id)}/generate`,
        {
          comment_text: thread.text,
          commenter_name: thread.author.name,
          commenter_headline: thread.author.headline,
          commenter_profile_id: thread.author.profile_id,
          lead_magnet_topic: ownsDm ? cfg.topic : undefined,
        }
      );
      setReply(res.reply);
    } catch (e: any) {
      setReplyMsg(`✗ ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // A rich comment drafts its real reply on its own — no button to hunt for.
  // The template draft is already in the box, so if this is slow or fails you
  // still have something sendable; it just gets replaced when the good one
  // lands. Only fires for rich comments, so a post full of bare "PROPUESTA"
  // costs nothing.
  //
  // The ref remembers WHICH role we drafted under, not just "did we draft".
  // Two reasons: it stops StrictMode's double-mount from paying for the same
  // reply twice, and it re-drafts if ownership moves. Ownership really does
  // move — someone comments with substance (this card owns the DM, so the
  // reply confirms it), then leaves the bare keyword a minute later, and on
  // refresh the delivery hops to that one. Without this the stale reply would
  // still claim we sent it, which is the double-confirm we're avoiding.
  // A reply you've edited is never clobbered.
  const draftedFor = useRef<boolean | null>(null);
  useEffect(() => {
    // ⛔ El PÚBLICO nunca se autogenera, y no es una preferencia de UI: cada
    // borrador lee la web del comentarista de verdad y la audita, así que
    // autogenerar dispararía una lectura y una llamada al modelo por cada
    // comentario nada más abrir el post, sin que nadie lo haya pedido. En un lead
    // magnet con 400 comentarios eso es 400 auditorías que quizá no quieras.
    // Lo pide el usuario y además es lo barato: aquí se genera al pulsar.
    if (cfg.kind === 'publico') return;
    if (depth !== 'rich' || replySent || replyTouched) return;
    if (draftedFor.current === ownsDm) return;
    draftedFor.current = ownsDm;
    handleAi();
  }, [depth, replySent, replyTouched, ownsDm, cfg.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReply = async () => {
    if (!reply.trim()) return;
    setReplySending(true);
    setReplyMsg(null);
    try {
      await apiPost(
        `/api/accounts/posts/${postId}/comments/${encodeURIComponent(thread.id)}/reply`,
        { text: reply.trim(), mention }
      );
      setReplySent(true);
      setReplyMsg('✓ Respondido en LinkedIn');
    } catch (e: any) {
      setReplyMsg(`✗ ${e.message}`);
    } finally {
      setReplySending(false);
    }
  };

  const handleSendResource = async () => {
    if (!message.trim() || !thread.author.profile_id) return;
    setMsgSending(true);
    try {
      const res = await apiPost<{ status: 'sent' | 'failed'; error: string | null }>(
        `/api/accounts/lead-magnet/send`,
        {
          post_id: postId,
          comment_id: thread.id,
          provider_id: thread.author.profile_id,
          kind,
          text: message.trim(),
        }
      );
      setMsgResult({ status: res.status, error: res.error });
      onSent();
    } catch (e: any) {
      setMsgResult({ status: 'failed', error: e.message });
    } finally {
      setMsgSending(false);
    }
  };

  const noProfileId = !thread.author.profile_id;

  return (
    <div className={`bg-bg-card border rounded-xl p-4 min-w-0 ${alreadySent ? 'border-accent/30' : 'border-border'}`}>
      <div className="flex items-start gap-3">
        <Avatar src={thread.author.profile_picture_url} name={thread.author.name} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 min-w-0 flex-wrap">
            <span className="text-sm font-medium">{thread.author.name || 'Anónimo'}</span>
            <DegreeBadge d={degree} />
            {thread.author.headline && (
              <span className="text-[11px] text-text-muted truncate min-w-0">· {thread.author.headline}</span>
            )}
            <span className="text-[10px] text-text-muted ml-auto whitespace-nowrap">{fmtRelative(thread.date)}</span>
          </div>
          <p className="text-sm text-text-primary whitespace-pre-wrap">{thread.text}</p>

          <ReactionBar postId={postId} commentId={thread.id} initialReaction={thread.my_reaction} />

          {/* ── Reply ── */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-text-secondary">Respuesta al comentario</span>
              {depth === 'rich' && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30"
                  title="No solo dejó la palabra clave: escribió algo. La plantilla se queda corta, así que la respuesta se redacta entera."
                >
                  ✨ comentario con chicha
                </span>
              )}
              {aiLoading && <span className="text-[10px] text-text-muted">Escribiendo respuesta…</span>}
              {/* El texto y el peso dependen de si YA HAY BORRADOR, no del tipo de
                  comentario. Antes miraba `depth` y ponía "↻ Regenerar" siempre en
                  los comentarios con chicha, lo cual valía cuando se autogeneraba
                  al abrir: siempre había algo que regenerar. Al quitar el
                  autogenerado (el público audita una web de verdad por borrador),
                  la caja sale vacía y el único botón decía "Regenerar" sobre la
                  nada. Sin borrador es la acción PRINCIPAL y va destacado. */}
              {!aiLoading && !replySent && (
                <button
                  onClick={handleAi}
                  className={
                    reply.trim()
                      ? 'text-[10px] text-text-muted hover:text-accent transition-colors ml-auto'
                      : 'ml-auto text-[11px] font-medium px-2.5 py-1 rounded bg-accent text-white hover:brightness-110 transition'
                  }
                  title={
                    reply.trim()
                      ? 'Vuelve a redactarla'
                      : cfg.kind === 'publico'
                        ? 'Lee su web, la audita y le crea su página con el enlace ya dentro'
                        : 'Redacta la respuesta a este comentario'
                  }
                >
                  {reply.trim()
                    ? '↻ Regenerar'
                    : cfg.kind === 'publico'
                      ? '✨ Generar análisis'
                      : '✨ Redactar respuesta'}
                </button>
              )}
            </div>
            {/* Sin borrador no hay caja (usuario, 2026-07-17). Una caja vacía con un
                "Responder" al lado invita a responder a mano lo que se genera solo,
                y sobre todo NO distingue "aún no has generado" de "se generó vacío".
                Ese fallo salta a la vista cuando la caja solo existe si hay texto.
                Mientras genera sí se enseña, para que se vea que está pasando algo. */}
            {replySent ? (
              <p className="text-[11px] text-text-muted">{replyMsg || '✓ Ya respondido'}</p>
            ) : !reply.trim() ? (
              /* Tampoco mientras genera: una caja vacía que tarda 30s en llenarse
                 se lee como que está rota. El aviso de arriba ya dice que escribe. */
              <p className="text-[11px] text-text-muted">
                {aiLoading
                  ? cfg.kind === 'publico'
                    ? 'Leyendo su web y auditándola… tarda un poco, hay que abrir su página de verdad.'
                    : 'Redactando…'
                  : replyMsg?.startsWith('✗')
                    ? 'No se ha podido generar. Mira el error de arriba.'
                    : cfg.kind === 'publico'
                      ? 'Dale a Generar análisis: lee su web, la audita y te deja aquí el comentario con su enlace ya dentro.'
                      : 'Dale a Redactar respuesta.'}
              </p>
            ) : (
              <>
                <textarea
                  ref={replyRef}
                  value={reply}
                  onChange={(e) => { setReply(e.target.value); setReplyTouched(true); }}
                  disabled={replySending || aiLoading}
                  className="w-full text-sm bg-bg-primary border border-border rounded-md px-3 py-2 min-h-[52px] resize-y focus:outline-none focus:border-accent disabled:opacity-50"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleReply}
                    disabled={replySending || !reply.trim()}
                    className="text-xs px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent-light disabled:opacity-50 transition-colors"
                  >
                    {replySending ? 'Enviando…' : 'Responder'}
                  </button>
                  <EmojiPicker onPick={insertEmoji} disabled={replySending} />
                  {mention && (
                    <span
                      className={`text-[10px] ${willMention ? 'text-accent' : 'text-text-muted'}`}
                      title={
                        willMention
                          ? `LinkedIn etiquetará a ${mention.name}, y así le llega la notificación de que mire el DM`
                          : `El nombre "${mention.name}" debe ir al inicio para que se etiquete`
                      }
                    >
                      {willMention ? `@${mention.name} ✓` : `@${mention.name} ✗`}
                    </span>
                  )}
                  {/* Los errores NO pueden ir en gris de 10px como el resto: un
                      "✗ el generador no devolvió JSON válido" pintado igual que un
                      "✓ auditada" se lee como que no ha pasado nada, y lo que ves
                      es una caja vacía sin motivo (usuario, 2026-07-17). */}
                  {replyMsg && (
                    <span className={replyMsg.startsWith('✗')
                      ? 'text-[11px] text-red-400 font-medium'
                      : 'text-[10px] text-text-muted'}>{replyMsg}</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── The resource: DM or invitation ──
              Only on the card that owns it. This person's OTHER matching
              comments get no send box at all: two boxes for one person is
              how you send the resource twice, and the second one would be
              answering a comment that never asked for it.

              ⛔ En el tipo PÚBLICO no existe: el recurso se entrega en el propio
              comentario y en la página con gate, así que no hay nada que mandar
              por privado. Salía igualmente (bug, 2026-07-17) y ofrecía un "Enviar
              DM" con el topic vacío: "Te dejo el recurso sobre  por aquí:". */}
          {cfg.kind === 'publico' ? null : !ownsDm ? (
            <p className="mt-3 pt-3 border-t border-border text-[11px] text-text-muted">
              Aquí solo se responde. El recurso se le manda desde su otro comentario, el de la palabra
              clave, y es ahí donde se le avisa del envío.
            </p>
          ) : (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-text-secondary">
                {kind === 'dm' ? 'Mensaje privado con el recurso' : 'Invitación con el recurso en la nota'}
              </span>
              {kind === 'invite' && (
                <span className="text-[10px] text-text-muted tabular-nums">
                  {message.length}/300
                </span>
              )}
            </div>

            {noProfileId ? (
              <p className="text-[11px] text-text-muted">
                LinkedIn no expone el perfil de esta persona, así que no se le puede escribir. Solo respuesta.
              </p>
            ) : msgResult?.status === 'sent' ? (
              <p className="text-[11px] text-accent">
                ✓ {kind === 'dm' ? 'Recurso enviado por DM' : 'Invitación enviada con el recurso'}
              </p>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setMsgTouched(true); }}
                  disabled={msgSending}
                  className="w-full text-sm bg-bg-primary border border-border rounded-md px-3 py-2 min-h-[68px] resize-y focus:outline-none focus:border-accent disabled:opacity-50"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleSendResource}
                    disabled={msgSending || !message.trim() || !cfg.link.trim()}
                    className="text-xs px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent-light disabled:opacity-50 transition-colors"
                  >
                    {msgSending ? 'Enviando…' : kind === 'dm' ? 'Enviar DM' : 'Invitar con nota'}
                  </button>
                  {location && (
                    <span className="text-[10px] text-text-muted" title="Se usa para adaptar el saludo">
                      📍 {location}
                    </span>
                  )}
                  {msgResult?.status === 'failed' && (
                    <span className="text-[10px] text-red-400" title={msgResult.error || ''}>
                      ✗ LinkedIn lo rechazó: {(msgResult.error || '').slice(0, 90)}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
