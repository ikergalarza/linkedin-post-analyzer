import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApi, apiPost, apiGet } from '../../hooks/useApi';
import { Avatar, EmojiPicker, ReactionBar, fmtRelative } from './shared';
import type { Thread } from './shared';
import {
  buildDm, buildInviteNote, buildListaDm, buildListaInvite, buildReply,
  commentDepth, detectarRecurso, extractKeyword, extractSector, resolverRecurso, voiceFor,
} from './leadMagnetCopy';
import type { ListaCompany, Voice } from './leadMagnetCopy';

// LeadMagnetPanel — the "Lead Magnet" sub-tab.
//
// The job: a lead magnet post tells people to comment a keyword, and in
// exchange we send them a resource by DM. This tab does that end to end —
// pick the account, pick the post, type the keyword (the keyword alone
// resolves which resource to send, see recursoFor), and get one card per
// person who commented it, each with the reply and the DM already drafted.
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
export type LmKind = 'dm' | 'publico' | 'lista';

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
      // los configs viejos no tienen kind
      kind: p.kind === 'publico' ? 'publico' : p.kind === 'lista' ? 'lista' : 'dm',
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
  //
  // La palabra clave se saca SOLA del texto del post (Iker, 2026-08-06). El CTA
  // del pilar siempre pide comentar una palabra entre comillas y el validador lo
  // exige antes de publicar, así que el post ya la lleva dentro y teclearla era
  // trabajo repetido —y un sitio donde escribirla mal, que aquí significa que el
  // filtro no reconoce a quien comentó y ese lead se pierde en silencio—.
  // Solo se rellena si la config guardada no trae ninguna: lo que el usuario
  // haya escrito a mano ya está en localStorage y manda sobre esto.
  //
  // ⛔ Y DESDE EL 2026-08-11 NO HAY CAMPO QUE RELLENAR: el recurso se detecta
  // solo (Iker). LinkedIn dejo de repartir el "comenta la palabra X" el
  // 05/08/2026, asi que los posts nuevos no nombran ninguna palabra y no habia
  // nada que teclear. `detectarRecurso` lo saca del propio post —por la palabra
  // si el post es viejo y la lleva, y si no por lo que el post promete— y se
  // escribe aqui como enlace + tema, que es lo que ya sabia usar todo lo de
  // abajo. La palabra se sigue guardando porque `commentDepth` y
  // `extractSector` la usan para limpiarla del comentario en los posts viejos;
  // en los nuevos vale '' y las dos funciones lo tratan bien.
  const [cfg, setCfg] = useState<LmConfig>(() => {
    const saved = loadConfig(post.id);
    // Lo escrito a mano manda: si ya hay enlace guardado, no se toca.
    if (saved.link.trim()) return saved;
    const auto = detectarRecurso(post.content_text);
    return {
      ...saved,
      keyword: saved.keyword.trim() || extractKeyword(post.content_text),
      link: auto?.link ?? saved.link,
      topic: auto?.topic ?? saved.topic,
    };
  });
  useEffect(() => { saveConfig(post.id, cfg); }, [post.id, cfg]);

  // Si la palabra clave es «lista», ES el lead magnet de la lista: cambia solo al
  // tipo «Lista personalizada» para no pedir enlace ni tema y generar el DM con
  // la lista + su spam ninja (Iker, 2026-07-22). Una sola vez, y solo desde el
  // tipo por defecto: si luego el usuario elige otro tipo a mano, no se lo pisa.
  //
  // Sigue vivo SOLO por los posts viejos, que son los unicos que traen palabra.
  // En un post nuevo `cfg.keyword` es '' y esto no dispara nunca: el tipo se
  // elige a mano en el selector de arriba.
  const autoLista = useRef(false);
  useEffect(() => {
    if (autoLista.current) return;
    if (cfg.kind === 'dm' && cfg.keyword.trim().toLowerCase() === 'lista') {
      autoLista.current = true;
      setCfg((c) => ({ ...c, kind: 'lista' }));
    }
  }, [cfg.kind, cfg.keyword]);

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

  // Comentarios que YA tienen una invitación enviada, por comment_social_id. Se
  // usa el id del COMENTARIO (estable) y NO el provider_id: cuando la persona
  // acepta y pasa a 1er grado, LinkedIn puede devolver otro provider_id, así que
  // el sends-por-persona no casa y la tarjeta volvía a enseñar los controles de
  // envío — el riesgo de mandar la lista DOS veces que avisó Iker (2026-07-23). A
  // esta gente se la gestiona SOLO arriba en Seguimientos.
  const invitedCommentIds = useMemo(
    () => new Set((sendsData?.sends ?? []).filter((s) => s.kind === 'invite').map((s) => s.comment_social_id)),
    [sendsData]
  );

  // Y lo mismo para los envíos: indexados TAMBIÉN por comment_social_id, no solo
  // por persona (Iker, 2026-08-06). Era la otra mitad del mismo bug: a alguien a
  // quien ya le habías mandado el DM desde Seguimientos le seguían saliendo abajo
  // los controles de envío, porque el DM se guardó con el provider_id viejo (el
  // de la invitación) y la tarjeta buscaba por el nuevo. Un clic más y le llegaba
  // el mismo mensaje dos veces.
  const sendsByComment = useMemo(() => {
    const m = new Map<string, SendRecord[]>();
    for (const s of sendsData?.sends ?? []) {
      if (!s.comment_social_id) continue;
      const arr = m.get(s.comment_social_id) ?? [];
      arr.push(s);
      m.set(s.comment_social_id, arr);
    }
    return m;
  }, [sendsData]);

  // Ya solo hace falta la PALABRA CLAVE, en los tres tipos. El público y la
  // lista generan su recurso por tarjeta (el análisis o la lista de empresas);
  // el DM resuelve enlace y tema desde la propia palabra (recursoFor), así que
  // no se pide ningún campo de enlace a mano. Si la palabra del DM no tiene
  // recurso mapeado, la tarjeta ya avisa y el botón de enviar se bloquea.
  const recurso = resolverRecurso(cfg.keyword, cfg.link, cfg.topic);
  // El DM necesita un recurso que mandar; el publico y la lista generan el suyo
  // por tarjeta, asi que no dependen de esto.
  const ready = cfg.kind === 'dm' ? !!recurso : true;
  // ¿Salio de detectarRecurso o lo escribio el usuario? Solo sirve para decirlo
  // en la UI: si el panel no distingue las dos cosas, un enlace mal detectado se
  // lee igual que uno confirmado a mano.
  const autoDetectado = useMemo(() => detectarRecurso(post.content_text), [post.content_text]);
  const esAutomatico = !!autoDetectado && autoDetectado.link === recurso?.link;

  // ⛔ SE ACABO EL FILTRO POR PALABRA (Iker, 2026-08-11).
  //
  // Antes solo entraban los comentarios que contenian la palabra del post. Con
  // el gate muerto (05/08/2026) nadie escribe ninguna palabra: el post pregunta
  // "¿quieres los 5 mensajes?" y la gente contesta lo que le sale. Filtrar por
  // palabra hoy significa una lista vacia con 400 comentarios debajo.
  //
  // Entran TODOS los comentarios de personas. Las paginas de empresa se siguen
  // cayendo: no se puede mandar un DM a una pagina, y su comentario no es un
  // lead. Y el envio sigue siendo uno a uno, a mano, tarjeta por tarjeta.
  const matches = useMemo(
    () => (data?.threads ?? []).filter((t) => !t.author.is_company),
    [data]
  );

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

  // La paginacion se resetea al cambiar de POST, no de palabra: ya no hay
  // palabra que cambie, y heredar un "viendo 40" del post anterior no tiene
  // sentido. Derivado, no en un efecto: se recuerda de que post es el contador
  // y se ignora en cuanto queda obsoleto.
  const PAGE = 10;
  const [vis, setVis] = useState<{ key: string; n: number }>({ key: post.id, n: PAGE });
  const visible = vis.key === post.id ? vis.n : PAGE;
  const showMore = () => setVis({ key: post.id, n: visible + PAGE });

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

        {/* Ni palabra clave ni ningún otro input: el recurso lo detecta
            `detectarRecurso` a partir del post. Aquí solo se CONFIRMA cuál va a
            salir, y se puede corregir si la detección falla o si el recurso es
            nuevo y todavía no está en el catálogo. */}
        {cfg.kind === 'dm' && (
          recurso ? (
            <div className="space-y-1.5">
              <p className="text-[11px] text-text-muted leading-snug">
                {esAutomatico ? 'Detectado en el post' : 'Puesto a mano'} · mandará{' '}
                <span className="text-text">{recurso.topic}</span>
                <br />
                <span className="text-accent break-all">{recurso.link}</span>
              </p>
              <button
                onClick={() => setCfg((c) => ({ ...c, link: '', topic: '' }))}
                className="text-[11px] text-text-muted underline hover:text-text-secondary"
              >
                No es éste, lo pongo yo
              </button>
            </div>
          ) : (
            /* SALIDA MANUAL (Iker, 2026-08-07). Nunca se bloquea el envío por
               esperar a que yo toque el código: pasó de verdad un viernes a la
               una, con el post ya subido y la gente comentando. Ahora también
               cubre el caso nuevo — que la detección no lo tenga claro. */
            <div className="space-y-1.5">
              <p className="text-[11px] text-amber-500 leading-snug">
                No he sabido qué recurso pide este post. Pega el enlace y el DM sale igual.
              </p>
              <input
                value={cfg.link}
                onChange={(e) => setCfg((c) => ({ ...c, link: e.target.value }))}
                placeholder="https://recursos.neety.com/…"
                className="w-full md:w-2/3 bg-bg-secondary border border-border rounded px-2 py-1 text-xs"
              />
              <input
                value={cfg.topic}
                onChange={(e) => setCfg((c) => ({ ...c, topic: e.target.value }))}
                placeholder="Tema, para el DM: los 5 mensajes para dar con quien cierra"
                className="w-full md:w-2/3 bg-bg-secondary border border-border rounded px-2 py-1 text-xs"
              />
            </div>
          )
        )}

        {cfg.kind === 'lista' && (
          <p className="text-[11px] text-text-muted leading-snug pt-1 border-t border-border">
            Aquí no hay nada que rellenar. El post les pide comentar{' '}
            <span className="text-text-secondary">su sector</span>. En cada
            comentario se lee el sector, y al darle a <span className="text-text-secondary">Generar lista</span> se
            buscan empresas reales españolas de ese sector con su zona y su LinkedIn, y se rellena el DM. A 1er grado
            va la lista entera; a los demás, una invitación y la lista al aceptar.
          </p>
        )}

        {cfg.kind === 'publico' && (
          <p className="text-[11px] text-text-muted leading-snug pt-1 border-t border-border">
            Aquí no hay nada que rellenar. El post tiene que pedirles que{' '}
            <span className="text-text-secondary">peguen su web</span> en el comentario. Al darle a{' '}
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
              {matches.length === 1 ? '' : 's'} de personas
            </span>
            {sentCount > 0 && (
              <span className="text-text-muted">· {sentCount} ya recibieron el recurso</span>
            )}
          </div>
        )}
      </div>

      {/* Seguimientos: invitados (2º grado+) que esperan la lista, a los que se
          les manda por DM en cuanto aceptan. Solo en el tipo lista. */}
      {cfg.kind !== 'publico' && (
        <Seguimientos post={post} creatorId={creatorId} cfg={cfg} voice={voice} />
      )}

      {!ready && (
        <p className="text-center text-text-muted text-sm py-10">
          Pega arriba el enlace del recurso para ver a quién hay que mandárselo.
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
          Este post no tiene todavía ningún comentario de una persona.
        </p>
      )}

      {ready && matches.slice(0, visible).map((t) => (
        <CommenterCard
          key={t.id}
          thread={t}
          postId={post.id}
          creatorId={creatorId}
          cfg={cfg}
          // Por persona Y por comentario: el provider_id cambia al aceptar la
          // invitación, así que solo con él se pierden los envíos ya hechos.
          sends={[
            ...(t.author.profile_id ? sendsByPerson.get(t.author.profile_id) ?? [] : []),
            ...(sendsByComment.get(t.id) ?? []),
          ]}
          invitedCommentIds={invitedCommentIds}
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
    { id: 'lista', titulo: 'Lista personalizada', sub: 'Comentan «lista» + su sector y les montamos la lista de su sector' },
  ];
  return (
    <div>
      <label className="block text-[11px] font-medium text-text-secondary mb-1.5">
        Tipo de lead magnet
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
  invitedCommentIds,
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
  // Ids de comentario que ya tienen invitación enviada → su follow-up se gestiona
  // arriba en Seguimientos, no aquí.
  invitedCommentIds: Set<string>;
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
  // ⭐ Un DM enviado bloquea la tarjeta AUNQUE ahora toque otro `kind`
  // (Iker, 2026-08-06). `kind` se recalcula con el grado de red de HOY: alguien
  // a quien invitaste siendo 2º grado pasa a 1º al aceptarte, y entonces la
  // tarjeta pasaba a buscar un envío de tipo 'dm' bajo el provider_id nuevo, no
  // lo encontraba, y volvía a ofrecer el envío. El recurso ya lo tiene: es un
  // mensaje repetido a alguien que además acaba de darnos su atención.
  const dmSent = sends.some((s) => s.kind === 'dm' && s.status === 'sent');
  const alreadySent = priorSend?.status === 'sent' || dmSent;

  // ¿Esta persona ya recibió la invitación con la lista prometida? Se mira por el
  // id del comentario (estable), NO por el provider_id (cambia al pasar a 1er
  // grado). Si es así, su seguimiento se gestiona ARRIBA en Seguimientos y esta
  // tarjeta NO muestra controles de envío — así no se manda la lista dos veces.
  // ⭐ Ya NO se limita al tipo "lista" (Iker, 2026-08-06). El segundo mensaje
  // después de que te acepten la invitación hace falta en TODOS los lead magnets,
  // no solo en ese: el flujo invitación → aceptan → recurso es el mismo siempre.
  const handledInSeguimientos = cfg.kind !== 'publico' && invitedCommentIds.has(thread.id);

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
    // La LISTA no se autoredacta: su recurso son 15 empresas que hay que ir a
    // buscar a Unipile con el sector del comentario. Se genera al pulsar el
    // botón (handleLista), no al montar la tarjeta.
    if (cfg.kind === 'lista') return;
    if (msgTouched || alreadySent || !ownsDm) return;
    // Enlace y tema salen de la palabra clave (recursoFor). Si la palabra no
    // tiene recurso, no hay nada que mandar: se deja el mensaje vacío y el
    // botón queda bloqueado, en vez de redactar un DM con un enlace en blanco.
    const recurso = resolverRecurso(cfg.keyword, cfg.link, cfg.topic);
    if (!recurso) { setMessage(''); return; }
    const input = { name: thread.author.name, location, topic: recurso.topic, link: recurso.link, voice };
    setMessage(kind === 'dm' ? buildDm(input) : buildInviteNote(input));
  }, [location, cfg.keyword, cfg.kind, kind, msgTouched, alreadySent, ownsDm, voice, thread.author.name]);

  // ── lista state (solo tipo 'lista') ──
  // El sector se prerrellena con lo que la persona escribió tras la palabra
  // clave ("lista automoción" → "automoción"); si solo comentó la palabra, sale
  // vacío y se escribe a mano.
  const [sector, setSector] = useState<string>(() => extractSector(thread.text || '', cfg.keyword));
  const [listaLoading, setListaLoading] = useState(false);
  const [listaMsg, setListaMsg] = useState<string | null>(null);
  // La lista COMPLETA, guardada aparte cuando la persona NO es 1er grado: la
  // invitación manda solo la nota, pero pre-generamos la lista entera y la
  // guardamos (se envía al backend con la invitación) para mandarla por DM en
  // cuanto acepten, sin regenerarla (ver la sección Seguimientos).
  const [followupText, setFollowupText] = useState<string>('');

  const [msgSending, setMsgSending] = useState(false);
  const [msgResult, setMsgResult] = useState<{ status: 'sent' | 'failed'; error: string | null } | null>(
    priorSend ? { status: priorSend.status, error: priorSend.error } : null
  );

  // Se le contesta AL ÚLTIMO QUE HABLÓ, igual que en la pestaña de Comentarios
  // (Iker, 2026-08-11). Si el hilo trae mensajes posteriores a nuestra última
  // respuesta, el que espera no es el que abrió el hilo. La respuesta se sigue
  // publicando contra `thread.id`, que es el ancla del hilo en LinkedIn; lo que
  // cambia es a quién se menciona y de qué texto sale el borrador.
  const followups = thread.pending_followups ?? [];
  // ⛔ EL PRIMERO SIN CONTESTAR, NO EL ULTIMO (Iker, 2026-08-11).
  // Lo escribi como "el ultimo que hablo" y el hilo real lo tumbo en el acto:
  // Vicente Garces pidio el recurso a las 09:49 y Mario contesto a las 10:17
  // con un "ahora te lo envia mi companiero". Con el ultimo, el borrador salia
  // dirigido a Mario, que ya estaba atendido, y Vicente —que es el LEAD— se
  // quedaba otra vez sin respuesta. El que espera es el que lleva mas tiempo
  // esperando. Las respuestas vienen ordenadas de vieja a nueva, asi que es
  // la primera. Las demas se ven marcadas en el hilo.
  const target = followups.length ? followups[0] : thread;

  const mention = target.author.name && target.author.profile_id && !target.author.is_company
    ? { name: target.author.name, profile_id: target.author.profile_id }
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
        `/api/accounts/posts/${postId}/comments/${encodeURIComponent(target.id)}/generate`,
        {
          comment_text: target.text,
          commenter_name: target.author.name,
          commenter_headline: target.author.headline,
          commenter_profile_id: target.author.profile_id,
          lead_magnet_topic: ownsDm
            ? (cfg.kind === 'lista'
                ? (sector.trim() ? `la lista de ${sector.trim()}` : 'la lista')
                : (resolverRecurso(cfg.keyword, cfg.link, cfg.topic)?.topic ?? ''))
            : undefined,
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
    // ⛔ Ni el PÚBLICO ni la LISTA se autogeneran, y no es preferencia de UI:
    // cada borrador dispara trabajo real por comentario (el público audita la web
    // del comentarista; la lista busca empresas en Unipile con su sector). Como el
    // comentario de la lista SIEMPRE lleva sector tras la palabra ("lista ventas
    // B2B" → cuenta como 'rich'), autogenerar lanzaría una respuesta —y a un clic
    // la búsqueda— en TODOS los comentarios al abrir el post, sin pedirlo. El
    // usuario quiere ir uno por uno: aquí se genera SOLO al pulsar.
    if (cfg.kind === 'publico' || cfg.kind === 'lista') return;
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

  // Genera la lista de empresas del sector y la deja en la caja del DM. Busca en
  // Unipile (empresas reales españolas del sector), y formatea en la voz de la
  // cuenta: la lista entera si es DM (1er grado), la nota corta si es invitación
  // (la lista no cabe en 300 caracteres, va cuando acepten).
  const handleLista = async () => {
    const s = sector.trim();
    if (!s) { setListaMsg('Escribe el sector'); return; }
    setListaLoading(true);
    setListaMsg(null);
    try {
      const r = await apiPost<{ sector: string; companies: ListaCompany[] }>(
        '/api/accounts/lead-magnet/lista',
        { creator_id: creatorId, sector: s }
      );
      if (!r.companies || r.companies.length === 0) {
        setListaMsg('No encuentro empresas de ese sector. Prueba a reescribirlo.');
        return;
      }
      if (kind === 'dm') {
        // Aquí solo llega un 1er grado que NUNCA fue invitado (a los invitados los
        // gestiona Seguimientos): primer contacto por privado, saludo normal.
        setMessage(buildListaDm({ name: thread.author.name, sector: r.sector, companies: r.companies, location, voice, followup: false }));
      } else {
        // Invitación: la caja lleva la nota corta, pero guardamos la lista ENTERA
        // para mandarla por DM cuando la persona acepte (sección Seguimientos). Esa
        // copia guardada se ENVÍA siempre como follow-up, así que se monta ya con
        // `followup: true` (sin saludo de cero: entrega lo prometido).
        setMessage(buildListaInvite({ name: thread.author.name, sector: r.sector, companies: r.companies, location, voice }));
        setFollowupText(buildListaDm({ name: thread.author.name, sector: r.sector, companies: r.companies, location, voice, followup: true }));
      }
      setMsgTouched(true); // ya es un mensaje real; que ningún efecto lo pise
      setListaMsg(`${r.companies.length} empresa${r.companies.length === 1 ? '' : 's'}${r.companies.length < 15 ? ' (no hay más de ese sector)' : ''}`);
    } catch (e: any) {
      setListaMsg(`✗ ${e.message}`);
    } finally {
      setListaLoading(false);
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
          // ⛔ EL NOMBRE VA EN TODA INVITACIÓN, NO SOLO EN LA LISTA (Iker,
          // 2026-08-12). Estaba dentro del `...(cfg.kind === 'lista' && …)`, así
          // que en cualquier otro lead magnet se guardaba NULL y Seguimientos
          // pintaba "Sin nombre" — imposible saber a quién estabas escribiendo.
          // Nació así porque Seguimientos era solo de la lista; el 06/08 se
          // generalizó a todos los pilares y este campo se quedó atrás.
          ...(kind === 'invite' && thread.author.name ? { provider_name: thread.author.name } : {}),
          // La lista guarda ADEMÁS su segundo mensaje y el sector: su nota es un
          // teaser porque las empresas no caben en 300 caracteres, así que el DM
          // de después es la entrega de verdad.
          ...(cfg.kind === 'lista' && kind === 'invite' && followupText
            ? { followup_text: followupText, sector: sector.trim() }
            : {}),
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

          {/* ⛔ EL HILO, QUE AQUÍ NO SE VEÍA (Iker, 2026-08-11).
              La pestaña de Comentarios sí pintaba las respuestas del hilo y
              ésta no: enseñaba el comentario de arriba y nada más. Con eso, un
              lead que pedía el recurso en una respuesta —Vicente Garcés, en el
              lead magnet del 11/08— era literalmente invisible aquí. Cada
              respuesta lleva su barra de reacción, y la que ha entrado después
              de nuestra última contestación va marcada. */}
          {thread.replies?.length > 0 && (
            <div className="mt-3 space-y-2 pl-3 border-l border-border">
              {thread.replies.map((r) => (
                <div key={r.id} className="flex items-start gap-2">
                  <Avatar src={r.author.profile_picture_url} name={r.author.name} size={22} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium">{r.author.name || 'Anónimo'}</span>
                      <span className="text-[10px] text-text-muted">{fmtRelative(r.date)}</span>
                      {followups.some((f) => f.id === r.id) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-medium">
                          sin contestar
                        </span>
                      )}
                    </div>
                    {r.is_media_only || !r.text.trim() ? (
                      <p className="text-xs text-text-muted italic">🎞️ GIF / imagen</p>
                    ) : (
                      <p className="text-xs text-text-secondary whitespace-pre-wrap">{r.text}</p>
                    )}
                    <ReactionBar postId={postId} commentId={r.id} initialReaction={r.my_reaction} compact />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Reply ── */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-text-secondary">
                {followups.length
                  ? `Respuesta a ${target.author.name || 'la respuesta nueva'}`
                  : 'Respuesta al comentario'}
              </span>
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
                  /* 52px valia cuando la respuesta era una plantilla de 2 lineas. La del
                     publico son 8-9 lineas con saltos en blanco: en 52px se lee por
                     una rendija de 2 lineas y hay que hacer scroll para todo. */
                  className={`w-full text-sm bg-bg-primary border border-border rounded-md px-3 py-2 resize-y focus:outline-none focus:border-accent disabled:opacity-50 ${
                    cfg.kind === 'publico' ? 'min-h-[220px]' : 'min-h-[52px]'
                  }`}
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
          ) : handledInSeguimientos ? (
            /* Ya invitada: su seguimiento (mandarle la lista entera al aceptar)
               vive ARRIBA en Seguimientos. Aquí NO se enseñan controles de envío,
               para no mandar la lista dos veces (Iker, 2026-07-23). Solo el puntero. */
            <p className="mt-3 pt-3 border-t border-border text-[11px] text-accent leading-snug">
              ✓ Ya le mandaste la invitación. Su lista se gestiona arriba, en{' '}
              <span className="font-semibold">Seguimientos</span>: cuando te acepte, se la mandas entera por DM desde
              ahí. Aquí no, para no mandarla dos veces.
            </p>
          ) : (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-text-secondary">
                {cfg.kind === 'lista'
                  ? (kind === 'dm' ? 'Lista de empresas por privado' : 'Invitación (la lista va al aceptar)')
                  : (kind === 'dm' ? 'Mensaje privado con el recurso' : 'Invitación con el recurso en la nota')}
              </span>
              {kind === 'invite' && (
                <span className="text-[10px] text-text-muted tabular-nums">
                  {message.length}/300
                </span>
              )}
            </div>

            {/* Tipo LISTA: el sector (prerrellenado del comentario, editable) y el
                botón que busca las empresas y rellena la caja. La lista completa
                solo va por DM; a una invitación se le manda la nota corta y la
                lista entera cuando la persona acepte.
                Una vez enviado el recurso, la lista ya está generada y mandada:
                el botón "Generar lista" NO debe seguir ahí (Iker, 2026-07-23). */}
            {cfg.kind === 'lista' && !noProfileId && msgResult?.status !== 'sent' && (
              <div className="flex items-end gap-2 flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[10px] font-medium text-text-secondary mb-1">Sector</label>
                  <input
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    disabled={listaLoading}
                    placeholder="automoción, logística…"
                    className="w-full text-sm bg-bg-primary border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-accent disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={handleLista}
                  disabled={listaLoading || !sector.trim()}
                  className="text-[11px] font-medium px-2.5 py-1.5 rounded bg-accent text-white hover:brightness-110 disabled:opacity-50 transition whitespace-nowrap"
                  title="Busca empresas reales españolas del sector y rellena el mensaje"
                >
                  {listaLoading ? 'Buscando…' : message.trim() ? '↻ Regenerar' : '✨ Generar lista'}
                </button>
                {listaMsg && (
                  <span className={`text-[10px] ${listaMsg.startsWith('✗') ? 'text-red-400 font-medium' : 'text-text-muted'}`}>
                    {listaMsg}
                  </span>
                )}
              </div>
            )}

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
                  /* La lista son 15 empresas con zona y LinkedIn: en 68px se leía por
                     una rendija. Alta por defecto en lista para poder leerla y hacer
                     scroll cómodo; el resto de mensajes son cortos y no la necesitan. */
                  className={`w-full text-sm bg-bg-primary border border-border rounded-md px-3 py-2 resize-y focus:outline-none focus:border-accent disabled:opacity-50 ${
                    cfg.kind === 'lista' ? 'min-h-[240px]' : 'min-h-[80px]'
                  }`}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleSendResource}
                    disabled={msgSending || !message.trim() || (cfg.kind === 'dm' && !resolverRecurso(cfg.keyword, cfg.link, cfg.topic))}
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

interface FollowupRow {
  post_id: string;
  provider_id: string;
  provider_name: string | null;
  sector: string | null;
  // Vacio salvo en el tipo lista, que guarda la lista entera al invitar. En un
  // lead magnet normal el texto se monta aqui con el recurso de la palabra clave.
  followup_text: string | null;
  comment_social_id: string;
  // true = la nota de la invitación YA llevaba el enlace del recurso, así que
  // esta persona no tiene nada pendiente. Lo calcula el backend mirando el texto
  // realmente enviado, no el tipo de lead magnet.
  ya_entregado?: boolean;
}

// La sección de SEGUIMIENTOS del tipo "lista": los invitados (2º grado o más) a
// los que ya se les mandó la invitación con la lista completa GUARDADA, y que
// esperan a recibirla por DM en cuanto acepten. El botón recomprueba el grado de
// red con Unipile (NO lee su chat); a los que ya te aceptaron, un clic les manda
// la lista guardada sin regenerarla. Se ocultan solas al recibirla (el backend
// las excluye en cuanto hay un DM enviado a esa persona en ese post).
function Seguimientos({ post, creatorId, cfg, voice }: {
  post: GridPost; creatorId: string; cfg: LmConfig; voice: Voice;
}) {
  // El texto del segundo mensaje. Si al invitar guardamos uno (tipo lista), ese
  // manda. Si no, se monta el DM normal con el recurso de la palabra clave, que
  // es justo lo que faltaba para que esto valiera en todos los lead magnets.
  const textFor = useCallback((f: FollowupRow): string => {
    if (f.followup_text) return f.followup_text;
    const recurso = resolverRecurso(cfg.keyword, cfg.link, cfg.topic);
    if (!recurso) return '';
    return buildDm({ name: f.provider_name, topic: recurso.topic, link: recurso.link, voice });
  }, [cfg.keyword, voice]);
  const { data, loading } = useApi<{ followups: FollowupRow[] }>(
    `/api/accounts/lead-magnet/followups?creator_id=${creatorId}`
  );
  const followups = useMemo(
    () => (data?.followups ?? []).filter((f) => f.post_id === post.id),
    [data, post.id]
  );
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  // El texto por persona, editable, precargado con la lista que guardamos al
  // invitar (ya montada con la copia de follow-up, sin saludo de cero).
  const [texts, setTexts] = useState<Record<string, string>>({});

  const check = useCallback(async () => {
    if (followups.length === 0) return;
    setChecking(true);
    setErr(null);
    try {
      const r = await apiPost<{ results: { provider_id: string; accepted: boolean }[] }>(
        '/api/accounts/lead-magnet/check-accepted',
        { creator_id: creatorId, provider_ids: followups.map((f) => f.provider_id) }
      );
      const m: Record<string, boolean> = {};
      for (const x of r.results) m[x.provider_id] = x.accepted;
      setAccepted(m);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setChecking(false);
    }
  }, [creatorId, followups]);

  // Se comprueba UNA vez al cargar, para que quien ya te aceptó suba arriba con su
  // cuadro sin que tengas que pulsar nada (el usuario lo quería así: que se lo
  // recuerde). El botón queda para volver a comprobar a mano.
  const autoChecked = useRef(false);
  useEffect(() => {
    if (autoChecked.current || followups.length === 0) return;
    autoChecked.current = true;
    check();
  }, [followups.length, check]);

  // Nada que seguir → no metas ruido en la pantalla.
  if (loading || followups.length === 0) return null;

  const sendList = async (f: FollowupRow) => {
    const text = (texts[f.provider_id] ?? textFor(f)).trim();
    if (!text) return;
    setSending(f.provider_id);
    setErr(null);
    try {
      const res = await apiPost<{ status: 'sent' | 'failed'; error: string | null }>(
        '/api/accounts/lead-magnet/send',
        { post_id: f.post_id, comment_id: f.comment_social_id, provider_id: f.provider_id, kind: 'dm', text }
      );
      if (res.status === 'sent') setSentIds((s) => new Set(s).add(f.provider_id));
      else setErr(res.error || 'LinkedIn rechazó el DM');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSending(null);
    }
  };

  // Los que ya te aceptaron y esperan el envío van ARRIBA (son los accionables);
  // luego los pendientes de aceptar; al final los ya enviados.
  const rank = (f: FollowupRow) => (sentIds.has(f.provider_id) ? 2 : accepted[f.provider_id] ? 0 : 1);
  const orden = [...followups].sort((a, b) => rank(a) - rank(b));
  // Los que YA recibieron el recurso en la nota no cuentan como "listos para
  // enviar": no hay nada que enviarles. El contador decía "1 listo" señalando a
  // alguien a quien mandarle algo habría sido repetirse (Iker, 2026-08-12).
  const listos = followups.filter(
    (f) => accepted[f.provider_id] && !sentIds.has(f.provider_id) && !f.ya_entregado
  ).length;

  return (
    <div className="bg-bg-card border border-accent/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">Seguimientos</span>
        <span className="text-[11px] text-text-muted">
          · {followups.length} invitado{followups.length === 1 ? '' : 's'}
          {listos > 0 ? ` · ${listos} listo${listos === 1 ? '' : 's'} para enviar` : ''}
        </span>
        <button
          onClick={check}
          disabled={checking}
          className="ml-auto text-[11px] font-medium px-2.5 py-1 rounded bg-accent text-white hover:brightness-110 disabled:opacity-50 transition whitespace-nowrap"
          title="Vuelve a comprobar en LinkedIn quién ya te ha aceptado (no lee su chat)"
        >
          {checking ? 'Comprobando…' : '↻ Volver a comprobar'}
        </button>
      </div>
      <p className="text-[11px] text-text-muted leading-snug">
        Quien te acepta sube aquí arriba con su lista ya montada: la revisas y se la mandas por DM de un tiro. Los que aún no te han aceptado quedan en espera.
      </p>
      {err && <p className="text-[11px] text-red-400 font-medium">✗ {err}</p>}
      <div className="space-y-2">
        {orden.map((f) => {
          const ok = accepted[f.provider_id];
          const done = sentIds.has(f.provider_id);
          if (done) {
            return (
              <div key={f.provider_id} className="flex items-center gap-2 flex-wrap text-sm border-t border-border pt-2">
                <span className="font-medium">{f.provider_name || 'Sin nombre'}</span>
                {f.sector && <span className="text-[11px] text-text-muted">· {f.sector}</span>}
                <span className="ml-auto text-[11px] text-accent">✓ Lista enviada</span>
              </div>
            );
          }
          // ACEPTADO y sin enviar → el cuadro COMPLETO, arriba: la lista guardada,
          // editable, y el botón de mandarla. Es lo que el usuario pedía: que el
          // follow-up no viva perdido entre los comentarios, sino aquí.
          // ⛔ EL QUE YA RECIBIÓ EL RECURSO EN LA NOTA NO TIENE NADA PENDIENTE
          // (Iker, 2026-08-12). `buildInviteNote` mete el enlace DENTRO de la
          // invitación, así que en un lead magnet normal la persona ya lo tiene
          // cuando acepta. Aquí se le montaba igualmente un DM con el MISMO
          // enlace y el botón decía "listo para enviar": mandarlo era escribirle
          // dos veces lo mismo. Se queda visible —aceptar es buena señal y hay
          // que verlo— pero sin caja de texto y sin botón de envío.
          if (ok && f.ya_entregado) {
            return (
              <div key={f.provider_id} className="flex items-center gap-2 flex-wrap text-sm border-t border-border pt-2">
                <span className="font-medium">{f.provider_name || 'Sin nombre'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30">✓ te aceptó</span>
                <span
                  className="ml-auto text-[11px] text-text-muted"
                  title="El enlace del recurso iba dentro de la nota de la invitación, así que ya lo tiene. Volver a mandarlo sería escribirle dos veces lo mismo."
                >
                  ya tiene el recurso · nada que enviar
                </span>
              </div>
            );
          }
          if (ok) {
            const val = texts[f.provider_id] ?? textFor(f);
            return (
              <div key={f.provider_id} className="border-t border-border pt-2 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{f.provider_name || 'Sin nombre'}</span>
                  {f.sector && <span className="text-[11px] text-text-muted">· {f.sector}</span>}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30">✓ te aceptó</span>
                </div>
                <textarea
                  value={val}
                  onChange={(e) => setTexts((t) => ({ ...t, [f.provider_id]: e.target.value }))}
                  disabled={sending === f.provider_id}
                  className="w-full text-sm bg-bg-primary border border-border rounded-md px-3 py-2 min-h-[240px] resize-y focus:outline-none focus:border-accent disabled:opacity-50"
                />
                <button
                  onClick={() => sendList(f)}
                  disabled={sending === f.provider_id || !val.trim()}
                  className="text-xs px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent-light disabled:opacity-50 transition-colors"
                >
                  {sending === f.provider_id ? 'Enviando…' : 'Enviar la lista completa por DM'}
                </button>
              </div>
            );
          }
          return (
            <div key={f.provider_id} className="flex items-center gap-2 flex-wrap text-sm border-t border-border pt-2">
              <span className="font-medium">{f.provider_name || 'Sin nombre'}</span>
              {f.sector && <span className="text-[11px] text-text-muted">· {f.sector}</span>}
              <span className="ml-auto text-[11px] text-text-muted">
                {ok === false ? 'aún no te ha aceptado' : 'comprobando…'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
