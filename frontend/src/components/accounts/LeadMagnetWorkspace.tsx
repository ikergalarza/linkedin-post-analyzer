/* El area de trabajo de un lead magnet: la config del post, los dos bloques de
   seguimiento y una tarjeta por comentarista, con su respuesta publica y su
   envio privado ya escritos.

   Salio de LeadMagnetPanel.tsx el 2026-08-20 porque ahora lo monta TAMBIEN la
   pestana Comments, al desplegar un post cuyo pilar es `lead_magnet`. Es el
   MISMO componente en los dos sitios a proposito: las tres defensas contra el
   doble envio (gestionadosArriba, sendsByComment, dmOwnerByPerson) viven aqui
   dentro, y una segunda copia acabaria divergiendo de esta.

   MOVIMIENTO LITERAL: ni una linea de logica cambiada respecto al Workspace que
   llevaba meses funcionando. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApi, apiPost, apiGet } from '../../hooks/useApi';
import { Avatar, EmojiPicker, ErrorBoundary, ReactionBar, fmtRelative } from './shared';
import type { Thread } from './shared';
import {
  buildAskReply, buildDm, buildListaDm, buildReply,
  commentDepth, detectarRecurso, extractKeyword, extractSector, resolverRecurso, voiceFor,
} from './leadMagnetCopy';
import type { ListaCompany, Voice } from './leadMagnetCopy';
import { loadConfig, saveConfig } from './lmConfigLocal';
import type {
  Canal, CanalInfo, CommentsResponse, FollowupRow, GridPost, LmConfig, LmKind,
  PedidoRow, SendRecord,
} from './lmTypes';

export default function LeadMagnetWorkspace({ post, creatorId }: { post: GridPost; creatorId: string }) {
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

  // Por dónde puede escribir esta cuenta. Una llamada para todo el post: la
  // lista de solicitudes pendientes es la misma para sus 400 comentarios.
  const { data: canalData } = useApi<CanalInfo>(
    `/api/accounts/lead-magnet/canal?creator_id=${creatorId}`
  );
  // provider_id → invitation_id de la solicitud que ESA persona nos mandó.
  const solicitudesPendientes = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of canalData?.pendientes ?? []) m.set(p.provider_id, p.invitation_id);
    return m;
  }, [canalData]);

  // Revisar envíos: relee LinkedIn y corrige los que se guardaron como enviados
  // sin haber llegado. Existe por el 13/08 (ver el comentario de cabecera): sin
  // esto, esos envíos siguen puestos en verde para siempre.
  const [revisando, setRevisando] = useState(false);
  const [revisionMsg, setRevisionMsg] = useState<string | null>(null);
  const revisarEnvios = async () => {
    setRevisando(true);
    setRevisionMsg(null);
    try {
      const r = await apiPost<{
        revisados: number; caidos: number; recuperados: number;
        sin_comprobar: number; omitidos: number;
      }>('/api/accounts/lead-magnet/reverificar', { post_id: post.id });
      // El mensaje se compone por partes: un repaso puede a la vez tumbar unos
      // y recuperar otros, y quedarse con una sola frase esconde la otra mitad.
      const partes: string[] = [];
      if (r.caidos > 0) partes.push(`✗ ${r.caidos} NO llegaron: marcados como fallidos, hay que volver a escribirles`);
      if (r.recuperados > 0) partes.push(`↩ ${r.recuperados} que estaban en rojo SÍ habían llegado: recuperados`);
      if (r.sin_comprobar > 0) partes.push(`${r.sin_comprobar} sin poder comprobar`);
      if (r.omitidos > 0) partes.push(`quedan ${r.omitidos} sin revisar, vuelve a darle`);
      setRevisionMsg(
        partes.length === 0
          ? `✓ ${r.revisados} envíos comprobados, todos llegaron.`
          : `${r.caidos > 0 ? '✗' : '✓'} ${r.revisados} revisados · ${partes.join(' · ')}.`
      );
      refetchSends();
    } catch (e: any) {
      setRevisionMsg(`✗ ${e.message}`);
    } finally {
      setRevisando(false);
    }
  };

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

  // Comentarios cuya entrega YA se gestiona ARRIBA, en las secciones de
  // seguimiento, por comment_social_id. Se usa el id del COMENTARIO (estable) y
  // NO el provider_id: cuando la persona acepta y pasa a 1er grado, LinkedIn
  // puede devolver otro provider_id, así que el sends-por-persona no casa y la
  // tarjeta volvía a enseñar los controles de envío — el riesgo de mandar la
  // lista DOS veces que avisó Iker (2026-07-23).
  //
  // Son dos casos y los dos se gestionan igual:
  //   · 'invite' → la invitación vieja, en Seguimientos (histórico).
  //   · 'ask'    → le pedimos la solicitud, en Solicitudes pedidas.
  const gestionadosArriba = useMemo(
    () => new Set(
      (sendsData?.sends ?? [])
        .filter((s) => s.kind === 'invite' || s.kind === 'ask')
        .map((s) => s.comment_social_id)
    ),
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

  // ── filtro por grado de red (Iker, 2026-08-14) ──
  //
  // "Así siempre empezaré con los de primer grado, que como ya los tengo
  // agregados, nunca tendré problemas." El orden de trabajo natural es por
  // CANAL: primero los DM (gratis y sin riesgo), luego el resto.
  //
  // El grupo 3 incluye el grado DESCONOCIDO a propósito: la tarjeta trata a
  // ambos igual (no son DM-ables → se les pide la solicitud), así que separarlos
  // crearía un cuarto botón para la misma decisión.
  //
  // El filtro es SOLO de vista. `dmOwnerByPerson` y compañía siguen calculando
  // sobre la lista entera: quién es el dueño del recurso de cada persona no
  // puede depender de qué pestaña estés mirando.
  const [gradoFiltro, setGradoFiltro] = useState<'todos' | 1 | 2 | 3>('todos');
  const grupoDe = (t: Thread) => {
    const d = t.author.network_distance ?? null;
    return d === 1 ? 1 : d === 2 ? 2 : 3;
  };
  const filtrados = useMemo(
    () => (gradoFiltro === 'todos' ? matches : matches.filter((t) => grupoDe(t) === gradoFiltro)),
    [matches, gradoFiltro]
  );
  const cuentaGrado = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0 } as Record<1 | 2 | 3, number>;
    for (const t of matches) c[grupoDe(t)]++;
    return c;
  }, [matches]);

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
  // La clave lleva el filtro: cambiar de grado es cambiar de lista, y heredar
  // el "viendo 40" del filtro anterior es el mismo sinsentido que heredarlo de
  // otro post.
  const PAGE_KEY = `${post.id}:${gradoFiltro}`;
  const [vis, setVis] = useState<{ key: string; n: number }>({ key: PAGE_KEY, n: PAGE });
  const visible = vis.key === PAGE_KEY ? vis.n : PAGE;
  const showMore = () => setVis({ key: PAGE_KEY, n: visible + PAGE });

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
            va la lista entera; a quien no lo sea se le pide la solicitud, y la lista sale en cuanto la mande.
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
            {/* Filtro por grado: empezar por los de 1er grado (DM directo, cero
                friccion) y dejar para el final a los que hay que pedirles la
                solicitud es el orden de trabajo que pidió Iker (2026-08-14). El
                grupo 3º+ incluye el grado desconocido: mismo canal, misma
                decisión. */}
            <span className="flex items-center gap-1">
              {([
                ['todos', `Todos (${matches.length})`],
                [1, `1er grado (${cuentaGrado[1]})`],
                [2, `2º (${cuentaGrado[2]})`],
                [3, `3º+ (${cuentaGrado[3]})`],
              ] as const).map(([valor, etiqueta]) => (
                <button
                  key={String(valor)}
                  onClick={() => setGradoFiltro(valor)}
                  className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                    gradoFiltro === valor
                      ? 'bg-accent/15 text-accent border-accent/40'
                      : 'border-border text-text-muted hover:border-accent/30 hover:text-text-secondary'
                  }`}
                >
                  {etiqueta}
                </button>
              ))}
            </span>
            {sentCount > 0 && (
              <span className="text-text-muted">· {sentCount} ya recibieron el recurso</span>
            )}
            {/* Revisar envíos: el botón que desmiente a la propia herramienta.
                Relee LinkedIn uno por uno y marca en rojo los que se guardaron
                como enviados sin haber salido. */}
            {sentCount > 0 && (
              <button
                onClick={revisarEnvios}
                disabled={revisando}
                className="text-[11px] px-2 py-0.5 rounded border border-border hover:border-accent/40 text-text-muted hover:text-accent disabled:opacity-50 transition-colors"
                title="Relee LinkedIn y comprueba que cada envío llegó de verdad"
              >
                {revisando ? 'Revisando…' : '↻ Revisar envíos'}
              </button>
            )}
            {revisionMsg && (
              <span className={revisionMsg.startsWith('✗') ? 'text-[11px] text-red-400 font-medium' : 'text-[11px] text-text-muted'}>
                {revisionMsg}
              </span>
            )}
          </div>
        )}

        {canalData?.aviso && (
          <p className="text-[11px] text-amber-400 leading-snug pt-1">⚠️ {canalData.aviso}</p>
        )}
      </div>

      {/* Las dos secciones de seguimiento, en orden de importancia:
          · Solicitudes pedidas — el flujo de HOY: a quien le pedimos que nos
            mandara la solicitud, y quién ya la ha mandado.
          · Seguimientos — el HISTÓRICO: los invitados con nota de antes del
            17/08. No se crean más, pero los que hay siguen esperando su recurso.
          Ninguna de las dos aplica al tipo público, que no tiene canal privado. */}
      {cfg.kind !== 'publico' && (
        <>
          <SolicitudesPedidas post={post} creatorId={creatorId} cfg={cfg} voice={voice} />
          <Seguimientos post={post} creatorId={creatorId} cfg={cfg} voice={voice} />
        </>
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
      {ready && data && matches.length > 0 && filtrados.length === 0 && (
        <p className="text-center text-text-muted text-sm py-10">
          Ningún comentario de ese grado en este post.
        </p>
      )}
      {ready && data && matches.length === 0 && (
        <p className="text-center text-text-muted text-sm py-10">
          Este post no tiene todavía ningún comentario de una persona.
        </p>
      )}

      {/* Una tarjeta por comentarista, cada una en su propia red: si revienta
          la de uno, esa sale en rojo y las otras 40 siguen usables. */}
      {ready && filtrados.slice(0, visible).map((t) => (
        <ErrorBoundary key={t.id} donde={`la tarjeta de ${t.author.name || 'este comentario'}`}>
        <CommenterCard
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
          gestionadosArriba={gestionadosArriba}
          ownsDm={dmOwnerByPerson.get(t.author.profile_id ?? '') === t.id}
          invitacionPendiente={
            t.author.profile_id ? solicitudesPendientes.get(t.author.profile_id) ?? null : null
          }
          voice={voice}
          initialReply={takeVariant}
          onSent={refetchSends}
        />
        </ErrorBoundary>
      ))}

      {ready && filtrados.length > visible && (
        <button
          onClick={showMore}
          className="w-full py-2.5 text-xs font-medium text-accent hover:text-accent-light border border-border hover:border-accent/40 rounded-lg transition-colors"
        >
          Ver más ({filtrados.length - visible} restantes) ↓
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
// El grado de red Y por dónde se le escribe.
//
// ⛔ EL CANAL SE LE PASA, NO SE DEDUCE DEL GRADO (Iker, 2026-08-14). Esto decía
// "2º grado · invitación" fijo para todo el que no fuera de 1er grado, y eso era
// mentira dos veces: ni se manda invitación, ni el 2º grado implica un canal
// concreto (si esa persona nos mandó solicitud, se le contesta gratis; y si no,
// da igual que sea 2º o 3º, se le pide el paso). Un badge que contradice al botón
// que tiene tres centímetros más abajo es peor que no tener badge.
function DegreeBadge({ d, canal }: { d: number | null | undefined; canal: Canal }) {
  const grado = d === 1 ? '1er grado' : d === 2 ? '2º grado' : d === 3 ? '3er grado' : 'grado desconocido';
  const via =
    canal === 'dm' ? 'DM'
    : canal === 'dm-solicitud' ? 'mensaje a su solicitud'
    : 'le pedimos solicitud';
  const pista =
    canal === 'dm' ? 'Es contacto de 1er grado: le llega un mensaje privado normal.'
    : canal === 'dm-solicitud' ? 'Te mandó una solicitud y sigue sin aceptar. LinkedIn deja contestarla con un mensaje normal: llega igual y no hace falta aceptarla.'
    : 'Ni sois contacto ni te ha mandado solicitud, así que LinkedIn no le entrega un privado. No se le manda nada: la respuesta le pide que te mande él la solicitud, y cuando llegue sale arriba en Solicitudes pedidas.';
  const resaltado = canal === 'dm' || canal === 'dm-solicitud';
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap border ${
        resaltado
          ? 'bg-accent/10 text-accent border-accent/30'
          : 'bg-bg-primary text-text-muted border-border'
      }`}
      title={pista}
    >
      {grado} · {via}
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
  gestionadosArriba,
  ownsDm,
  invitacionPendiente,
  voice,
  initialReply,
  onSent,
}: {
  thread: Thread;
  postId: string;
  creatorId: string;
  cfg: LmConfig;
  sends: SendRecord[];
  // Ids de comentario cuya entrega se gestiona ARRIBA: los invitados de antes
  // (Seguimientos) y los que tienen la solicitud pedida (Solicitudes pedidas).
  gestionadosArriba: Set<string>;
  // True on the ONE card per person that carries the resource. False on that
  // person's other keyword-matching comments, which show only a reply — the
  // resource goes out once, from the comment that actually asked for it.
  ownsDm: boolean;
  // El invitation_id de la solicitud que ESTA persona nos mandó y sigue sin
  // aceptar, o null. Con ella se le puede escribir un mensaje normal.
  invitacionPendiente: string | null;
  // The voice of the account that published the post, not of the commenter.
  voice: Voice;
  initialReply: () => string;
  onSent: () => void;
}) {
  const degree = thread.author.network_distance ?? null;
  // POR DÓNDE SE LE ESCRIBE. El orden importa y no es arbitrario:
  //
  //  1. 1er grado → DM normal. Nada que decidir.
  //  2. Nos mandó solicitud y sigue pendiente → mensaje normal contestando a esa
  //     solicitud. Es gratis, llega igual, y no hace falta aceptarla.
  //  3. Si no → NO hay canal privado. Se le pide la solicitud en público.
  //
  // Grado desconocido nunca cae en DM: adivinar mal quema el envío.
  const canal: Canal =
    degree === 1 ? 'dm'
    : invitacionPendiente ? 'dm-solicitud'
    : 'pedir';

  const priorSend = sends.find((s) => s.kind === 'dm') ?? null;
  // ⭐ Un DM enviado bloquea la tarjeta AUNQUE ahora toque otro `kind`
  // (Iker, 2026-08-06). `kind` se recalcula con el grado de red de HOY: alguien
  // a quien invitaste siendo 2º grado pasa a 1º al aceptarte, y entonces la
  // tarjeta pasaba a buscar un envío de tipo 'dm' bajo el provider_id nuevo, no
  // lo encontraba, y volvía a ofrecer el envío. El recurso ya lo tiene: es un
  // mensaje repetido a alguien que además acaba de darnos su atención.
  // El InMail cuenta igual que el DM: los dos son el recurso ya entregado por
  // privado, y volver a mandarlo por el otro canal es el mismo mensaje repetido
  // (y encima gastando un crédito).
  const dmSent = sends.some((s) => (s.kind === 'dm' || s.kind === 'inmail') && s.status === 'sent');
  const alreadySent = priorSend?.status === 'sent' || dmSent;
  // ¿El envío que dimos por bueno está COMPROBADO en LinkedIn? `false` aquí no
  // existe (el backend lo pasa a 'failed'); lo que sí existe es `null` = se
  // mandó pero no se pudo comprobar, y eso se dice, no se pinta de verde.
  const envioVerificado = (sends.find((s) => s.status === 'sent' && s.kind === 'dm') ?? null)?.verificado ?? null;

  // ¿La entrega de esta persona se gestiona ya ARRIBA? Se mira por el id del
  // comentario (estable), NO por el provider_id (cambia al pasar a 1er grado). Si
  // es así, esta tarjeta NO muestra controles de envío — así no se manda el
  // recurso dos veces.
  // ⭐ Ya NO se limita al tipo "lista" (Iker, 2026-08-06). El segundo mensaje hace
  // falta en TODOS los lead magnets: el flujo pedir → da el paso → recurso es el
  // mismo siempre.
  const handledInSeguimientos = cfg.kind !== 'publico' && gestionadosArriba.has(thread.id);

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
    // ⛔ A QUIEN NO PODEMOS ESCRIBIRLE NO SE LE DICE "ENVIADO" (2026-08-17). Las
    // 13 variantes de buildReply afirman que el recurso ya salió, y en canal
    // `pedir` no ha salido nada ni va a salir hasta que la persona mande su
    // solicitud: "Ya lo tienes" ahí es mentira. Se le pide el paso.
    //
    // Sin nombre delante, a diferencia del resto: la petición ya es una frase
    // larga y con el nombre pegado se lee como una plantilla de mail merge justo
    // cuando le estamos pidiendo algo.
    if (canal === 'pedir' && ownsDm) return buildAskReply().text;
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
    // En canal `pedir` no hay mensaje privado que redactar: no hay a dónde
    // mandarlo. El recurso se escribe el día que la persona mande su solicitud,
    // arriba en Solicitudes pedidas.
    if (canal === 'pedir') { setMessage(''); return; }
    // Enlace y tema salen de la palabra clave (recursoFor). Si la palabra no
    // tiene recurso, no hay nada que mandar: se deja el mensaje vacío y el
    // botón queda bloqueado, en vez de redactar un DM con un enlace en blanco.
    const recurso = resolverRecurso(cfg.keyword, cfg.link, cfg.topic);
    if (!recurso) { setMessage(''); return; }
    setMessage(buildDm({ name: thread.author.name, location, topic: recurso.topic, link: recurso.link, voice }));
  }, [location, cfg.keyword, cfg.kind, canal, msgTouched, alreadySent, ownsDm, voice, thread.author.name]);

  // ── lista state (solo tipo 'lista') ──
  // El sector se prerrellena con lo que la persona escribió tras la palabra
  // clave ("lista automoción" → "automoción"); si solo comentó la palabra, sale
  // vacío y se escribe a mano.
  const [sector, setSector] = useState<string>(() => extractSector(thread.text || '', cfg.keyword));
  const [listaLoading, setListaLoading] = useState(false);
  const [listaMsg, setListaMsg] = useState<string | null>(null);
  // La lista COMPLETA, guardada aparte cuando a la persona no se le puede
  // escribir todavía: se pre-genera entera y se guarda con el pedido de solicitud
  // (`/lead-magnet/ask`) para mandarla en cuanto la mande, sin regenerarla (ver la
  // sección Solicitudes pedidas).
  const [followupText, setFollowupText] = useState<string>('');

  const [msgSending, setMsgSending] = useState(false);
  const [msgResult, setMsgResult] = useState<
    { status: 'sent' | 'failed'; error: string | null; verificado: boolean | null } | null
  >(priorSend ? { status: priorSend.status, error: priorSend.error, verificado: priorSend.verificado } : null);

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
          // Sin contacto no hay envío que prometer: que la respuesta cierre
          // pidiéndole la solicitud en vez de decir "te lo acabo de mandar".
          pedir_solicitud: canal === 'pedir',
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

  // ⛔ NO SE CONTESTA "ENVIADO!" ANTES DE QUE EL RECURSO HAYA SALIDO
  // (Iker, 2026-08-13). Ese día pasó justo esto: las notas se caían en silencio,
  // la respuesta pública sí se publicaba, y la gente contestaba al comentario
  // diciendo que no había recibido nada. La respuesta de esta pestaña afirma que
  // el recurso está mandado, así que mientras no lo esté es mentira.
  //
  // No se bloquea del todo: hay comentarios que merecen respuesta sin recurso de
  // por medio, así que queda el "responder igualmente" a un clic.
  //
  // En canal `pedir` NO aplica: ahí la respuesta no afirma ningún envío, ES la
  // acción entera. Bloquearla sería bloquear lo único que se puede hacer con esa
  // persona.
  const recursoSinEntregar =
    cfg.kind !== 'publico' && canal !== 'pedir' && ownsDm && !!thread.author.profile_id &&
    !alreadySent && !handledInSeguimientos;
  const [forzarRespuesta, setForzarRespuesta] = useState(false);

  const handleReply = async () => {
    if (!reply.trim()) return;
    if (recursoSinEntregar && !forzarRespuesta) return;
    setReplySending(true);
    setReplyMsg(null);
    try {
      await apiPost(
        `/api/accounts/posts/${postId}/comments/${encodeURIComponent(thread.id)}/reply`,
        { text: reply.trim(), mention }
      );
      setReplySent(true);
      // ⛔ EL RECIBO DEL PEDIDO VA DESPUÉS DE QUE LA RESPUESTA SALGA, NUNCA ANTES.
      // Esta fila es lo único que hará que esta persona aparezca en «Solicitudes
      // pedidas» el día que mande la suya. Grabarla antes sería quedarnos
      // esperando un paso que nadie le ha pedido.
      if (canal === 'pedir' && ownsDm && thread.author.profile_id) {
        try {
          await apiPost('/api/accounts/lead-magnet/ask', {
            post_id: postId,
            comment_id: thread.id,
            provider_id: thread.author.profile_id,
            text: reply.trim(),
            ...(thread.author.name ? { provider_name: thread.author.name } : {}),
            ...(cfg.kind === 'lista' && sector.trim() ? { sector: sector.trim() } : {}),
            ...(cfg.kind === 'lista' && followupText ? { followup_text: followupText } : {}),
          });
          onSent();
          setReplyMsg('✓ Respondido · le he pedido la solicitud, sale arriba en Solicitudes pedidas');
        } catch (e: any) {
          // La respuesta SÍ salió: se dicen las dos cosas. Sin la fila, esta
          // persona no volverá a aparecer sola por ningún lado, y eso hay que
          // leerlo, no esconderlo detrás de un ✓.
          setReplyMsg(`⚠️ Respondido en LinkedIn, pero NO he podido apuntar el pedido (${e.message}). No va a salir en Solicitudes pedidas: apúntatelo.`);
        }
        return;
      }
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
      const cuantas = `${r.companies.length} empresa${r.companies.length === 1 ? '' : 's'}${r.companies.length < 15 ? ' (no hay más de ese sector)' : ''}`;
      if (canal === 'pedir') {
        // No hay a dónde mandarla todavía. Se guarda montada como follow-up (sin
        // saludo de cero: entrega lo prometido) y viaja con el pedido de
        // solicitud, para salir entera el día que la persona lo dé.
        setFollowupText(buildListaDm({ name: thread.author.name, sector: r.sector, companies: r.companies, location, voice, followup: true }));
        setListaMsg(`${cuantas} · guardadas, se le mandan en cuanto te mande la solicitud`);
        return;
      }
      // Por privado cabe la lista ENTERA, y da igual que sea un DM de 1er grado o
      // la respuesta a una solicitud pendiente: los dos llegan a la bandeja.
      setMessage(buildListaDm({ name: thread.author.name, sector: r.sector, companies: r.companies, location, voice, followup: false }));
      setMsgTouched(true); // ya es un mensaje real; que ningún efecto lo pise
      setListaMsg(cuantas);
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
      const res = await apiPost<{ status: 'sent' | 'failed'; error: string | null; verificado: boolean | null }>(
        `/api/accounts/lead-magnet/send`,
        {
          post_id: postId,
          comment_id: thread.id,
          provider_id: thread.author.profile_id,
          kind: 'dm',
          text: message.trim(),
          // Contestar a la solicitud que ELLA nos mandó: mensaje normal, sin
          // aceptarla y sin gastar nada.
          ...(canal === 'dm-solicitud' && invitacionPendiente
            ? { invitation_id: invitacionPendiente }
            : {}),
          // ⛔ EL NOMBRE VA SIEMPRE (Iker, 2026-08-12). Estaba dentro del
          // `...(cfg.kind === 'lista' && …)`, así que en cualquier otro lead
          // magnet se guardaba NULL y las secciones de seguimiento pintaban "Sin
          // nombre" — imposible saber a quién estabas escribiendo.
          ...(thread.author.name ? { provider_name: thread.author.name } : {}),
        }
      );
      setMsgResult({ status: res.status, error: res.error, verificado: res.verificado });
      onSent();
    } catch (e: any) {
      setMsgResult({ status: 'failed', error: e.message, verificado: false });
    } finally {
      setMsgSending(false);
    }
  };

  // "Este ya se lo mandé yo." Marca el envío como hecho SIN mandar nada.
  //
  // ⛔ Existe porque hay envíos que la herramienta NO PUEDE VER (Iker,
  // 2026-08-14): el InMail a Susana Osorio salió a mano desde Sales Navigator, y
  // esa bandeja no se puede consultar por API con fiabilidad, así que la tarjeta
  // se lo seguía ofreciendo y la misma persona recibía el recurso dos veces. Sigue
  // valiendo para todo lo que se manda por fuera de aquí, a mano.
  const [marcando, setMarcando] = useState(false);
  const marcarManual = async () => {
    if (!thread.author.profile_id) return;
    setMarcando(true);
    try {
      await apiPost('/api/accounts/lead-magnet/marcar-manual', {
        post_id: postId,
        comment_id: thread.id,
        provider_id: thread.author.profile_id,
        kind: 'dm',
        text: message.trim() || null,
        ...(thread.author.name ? { provider_name: thread.author.name } : {}),
      });
      setMsgResult({
        status: 'sent',
        error: 'lo marcaste a mano, así que no lo he comprobado yo',
        verificado: null,
      });
      onSent();
    } catch (e: any) {
      setMsgResult({ status: 'failed', error: e.message, verificado: false });
    } finally {
      setMarcando(false);
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
            <DegreeBadge d={degree} canal={canal} />
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
                    disabled={replySending || !reply.trim() || (recursoSinEntregar && !forzarRespuesta)}
                    className="text-xs px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent-light disabled:opacity-50 transition-colors"
                  >
                    {replySending ? 'Enviando…' : 'Responder'}
                  </button>
                  {recursoSinEntregar && !forzarRespuesta && (
                    <span className="text-[11px] text-amber-400 leading-snug">
                      Primero mándale el recurso, abajo. Esta respuesta le dice que ya se lo has enviado.{' '}
                      <button onClick={() => setForzarRespuesta(true)} className="underline hover:text-amber-300">
                        Responder igualmente
                      </button>
                    </span>
                  )}
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
            /* Ya en marcha arriba: su entrega vive en una de las dos secciones de
               seguimiento. Aquí NO se enseñan controles de envío, para no mandar
               el recurso dos veces (Iker, 2026-07-23). Solo el puntero. */
            <p className="mt-3 pt-3 border-t border-border text-[11px] text-accent leading-snug">
              ✓ Ya está en marcha arriba. Cuando te mande la solicitud, el recurso se le manda desde{' '}
              <span className="font-semibold">Solicitudes pedidas</span>. Aquí no, para no mandarlo dos veces.
            </p>
          ) : canal === 'pedir' ? (
            /* ⛔ NO HAY CANAL PRIVADO Y NO SE INVENTA UNO (2026-08-17). Aquí antes
               había una caja con la nota de la invitación o el InMail. Los dos se
               retiraron, así que lo honesto es decir por qué no hay nada que
               mandar y a dónde va a aparecer esta persona cuando dé el paso. */
            <p className="mt-3 pt-3 border-t border-border text-[11px] text-text-muted leading-snug">
              No es contacto y no te ha mandado solicitud, así que LinkedIn no le entrega un mensaje privado. No le
              mandamos nada: la respuesta de aquí arriba le pide la solicitud, y en cuanto la mande sale en{' '}
              <span className="text-text-secondary font-medium">Solicitudes pedidas</span> con el recurso ya escrito.
            </p>
          ) : (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-text-secondary">
                {cfg.kind === 'lista' ? 'Lista de empresas por privado' : 'Mensaje privado con el recurso'}
              </span>
              {/* Por qué este canal y no otro. Sin esto no se entiende que a uno
                  le vaya un mensaje normal y al de al lado se le pida el paso. */}
              {canal === 'dm-solicitud' && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent"
                  title="Te mandó una solicitud y sigue sin aceptar. LinkedIn deja contestarla con un mensaje normal: llega igual y no hace falta aceptarla."
                >
                  te invitó él · mensaje gratis
                </span>
              )}
            </div>

            {/* Tipo LISTA: el sector (prerrellenado del comentario, editable) y el
                botón que busca las empresas y rellena la caja.
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
              /* ⛔ ENVIADO ≠ LLEGADO. Solo se pinta en verde lo que el backend ha
                 releído en LinkedIn. Cuando la comprobación no se pudo hacer va
                 en ámbar y lo dice, porque el 13/08 el verde de aquí era mentira
                 para media lista de comentaristas. */
              (msgResult.verificado ?? envioVerificado) === true ? (
                <p className="text-[11px] text-accent">
                  ✓ Recurso enviado y comprobado en LinkedIn
                </p>
              ) : (
                <p className="text-[11px] text-amber-400 leading-snug">
                  ⚠️ Enviado, pero NO he podido comprobar que esté en LinkedIn
                  {msgResult.error ? ` (${msgResult.error})` : ''}. Dale a{' '}
                  <span className="font-semibold">Revisar envíos</span> arriba antes de darlo por bueno.
                </p>
              )
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
                    disabled={
                      msgSending || !message.trim() ||
                      (cfg.kind === 'dm' && !resolverRecurso(cfg.keyword, cfg.link, cfg.topic))
                    }
                    className="text-xs px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent-light disabled:opacity-50 transition-colors"
                  >
                    {msgSending
                      ? 'Enviando y comprobando…'
                      : canal === 'dm-solicitud' ? 'Contestar a su solicitud'
                      : 'Enviar DM'}
                  </button>
                  {/* La salida para lo que la herramienta no puede ver: lo que se
                      manda a mano por fuera. Sin esto, la tarjeta te lo ofrece
                      otra vez y esa persona lo recibe dos veces. */}
                  <button
                    onClick={marcarManual}
                    disabled={marcando || msgSending}
                    className="text-[11px] px-2 py-1 rounded border border-border text-text-muted hover:text-accent hover:border-accent/40 disabled:opacity-50 transition-colors"
                    title="Márcalo como entregado sin mandar nada. Para cuando ya se lo has mandado tú por fuera (por ejemplo un InMail desde Sales Navigator, que no puedo comprobar por API)."
                  >
                    {marcando ? 'Marcando…' : '✓ Ya se lo mandé a mano'}
                  </button>
                  {location && (
                    <span className="text-[10px] text-text-muted" title="Se usa para adaptar el saludo">
                      📍 {location}
                    </span>
                  )}
                  {/* El fallo, entero y en rojo. Antes se recortaba a 90
                      caracteres y el motivo real —"no aparece en tus
                      invitaciones pendientes, es el baneo de la cuenta"— se
                      quedaba fuera, que es justo lo que hacía falta leer. */}
                  {msgResult?.status === 'failed' && (
                    <span className="text-[11px] text-red-400 font-medium leading-snug">
                      ✗ NO le ha llegado: {msgResult.error || 'LinkedIn lo rechazó sin decir por qué'}
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

// SOLICITUDES PEDIDAS: la gente a la que le respondimos «mándame solicitud».
//
// Es la mitad que faltaba del flujo nuevo (Iker, 2026-08-17): la respuesta pública
// pide el paso, y esto detecta cuándo lo han dado. Sin esta sección, la persona
// manda su solicitud y nadie se entera nunca.
//
// El cruce lo hace el backend con UNA llamada por cuenta. Aquí solo se pintan los
// dos cubos: los que ya la mandaron (accionables, con el recurso ya escrito) y los
// que siguen sin darla. Una persona desaparece de aquí en cuanto se le manda el
// recurso: el backend la excluye en cuanto hay un DM enviado.
export function SolicitudesPedidas({ post, creatorId, cfg, voice }: {
  post: GridPost; creatorId: string; cfg: LmConfig; voice: Voice;
}) {
  const { data, loading, refetch } = useApi<{
    llegadas: PedidoRow[]; esperando: PedidoRow[]; aviso: string | null;
  }>(`/api/accounts/lead-magnet/pendientes-solicitud?creator_id=${creatorId}`);

  // Solo las de ESTE post: el endpoint devuelve las de la cuenta entera.
  const llegadas = useMemo(
    () => (data?.llegadas ?? []).filter((f) => f.post_id === post.id), [data, post.id]);
  const esperando = useMemo(
    () => (data?.esperando ?? []).filter((f) => f.post_id === post.id), [data, post.id]);

  const [texts, setTexts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [ascendidos, setAscendidos] = useState<PedidoRow[]>([]);

  // El texto del recurso. La lista guarda el suyo al pedir la solicitud (son 15
  // empresas que hubo que ir a buscar a Unipile); el resto se monta aquí con el
  // recurso de la palabra clave.
  const textFor = useCallback((f: PedidoRow): string => {
    if (f.followup_text) return f.followup_text;
    const recurso = resolverRecurso(cfg.keyword, cfg.link, cfg.topic);
    if (!recurso) return '';
    return buildDm({ name: f.provider_name, topic: recurso.topic, link: recurso.link, voice });
  }, [cfg.keyword, cfg.link, cfg.topic, voice]);

  // EL CASO RARO, y pasa: alguien acaba siendo contacto por otra vía (lo aceptáis
  // a mano desde el móvil) y entonces desaparece de las solicitudes recibidas, así
  // que se quedaría en «esperando» para siempre esperando algo que ya se puede
  // mandar. Esto relee su grado de red y lo sube al cubo accionable, ya sin
  // invitation_id: a un contacto de 1er grado se le manda un DM normal.
  const comprobarGrado = async () => {
    if (esperando.length === 0) return;
    setChecking(true);
    setErr(null);
    try {
      const r = await apiPost<{ results: { provider_id: string; accepted: boolean }[] }>(
        '/api/accounts/lead-magnet/check-accepted',
        { creator_id: creatorId, provider_ids: esperando.map((f) => f.provider_id) }
      );
      const ok = new Set(r.results.filter((x) => x.accepted).map((x) => x.provider_id));
      setAscendidos(esperando.filter((f) => ok.has(f.provider_id)).map((f) => ({ ...f, invitation_id: null })));
      if (ok.size === 0) setErr('⚠️ Ninguno de los que esperan es contacto todavía.');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setChecking(false);
    }
  };

  const enviar = async (f: PedidoRow) => {
    const text = (texts[f.provider_id] ?? textFor(f)).trim();
    if (!text) return;
    setSending(f.provider_id);
    setErr(null);
    try {
      const res = await apiPost<{ status: 'sent' | 'failed'; error: string | null; verificado: boolean | null }>(
        '/api/accounts/lead-magnet/send',
        {
          post_id: f.post_id, comment_id: f.comment_social_id, provider_id: f.provider_id,
          kind: 'dm', text,
          ...(f.invitation_id ? { invitation_id: f.invitation_id } : {}),
          ...(f.provider_name ? { provider_name: f.provider_name } : {}),
        }
      );
      if (res.status === 'sent') {
        setSentIds((s) => new Set(s).add(f.provider_id));
        // Enviado pero sin recibo: se dice. Un "✓" sobre algo que no hemos podido
        // comprobar es el bug del 13/08 otra vez.
        if (res.verificado !== true) {
          setErr(`⚠️ Mandado a ${f.provider_name || 'esta persona'}, pero no he podido comprobar que esté en LinkedIn${res.error ? ` (${res.error})` : ''}. Míralo en su chat antes de darlo por bueno.`);
        }
      } else setErr(res.error || 'LinkedIn rechazó el mensaje');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSending(null);
    }
  };

  // Los ascendidos a mano van con los que ya han mandado la solicitud, sin
  // duplicar a nadie que estuviera en las dos listas.
  const accionables = [
    ...llegadas,
    ...ascendidos.filter((a) => !llegadas.some((l) => l.provider_id === a.provider_id)),
  ];
  const pendientes = esperando.filter((f) => !ascendidos.some((a) => a.provider_id === f.provider_id));
  const listos = accionables.filter((f) => !sentIds.has(f.provider_id)).length;

  // Nada pedido → no metas ruido en la pantalla.
  if (loading || (accionables.length === 0 && pendientes.length === 0)) return null;

  return (
    <div className="bg-bg-card border border-accent/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">Solicitudes pedidas</span>
        <span className="text-[11px] text-text-muted">
          · {listos} listo{listos === 1 ? '' : 's'} para enviar
          {pendientes.length > 0 ? ` · ${pendientes.length} sin dar el paso` : ''}
        </span>
        {/* Las dos comprobaciones son hermanas y van juntas arriba a la derecha: una
            mira quién te ha mandado solicitud, la otra quién ya era contacto por otra
            vía. Escondida abajo, después de la lista, la segunda no se veía. */}
        <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => { setAscendidos([]); setErr(null); refetch(); }}
            className="text-[11px] font-medium px-2.5 py-1 rounded bg-accent text-white hover:brightness-110 transition whitespace-nowrap"
            title="Vuelve a mirar en LinkedIn quién te ha mandado ya la solicitud"
          >
            ↻ Mirar si han mandado solicitud
          </button>
          {pendientes.length > 0 && (
            <button
              onClick={comprobarGrado}
              disabled={checking}
              className="text-[11px] font-medium px-2.5 py-1 rounded bg-accent text-white hover:brightness-110 disabled:opacity-50 transition whitespace-nowrap"
              title="Por si alguno ya es contacto vuestro por otra vía: relee su grado de red en LinkedIn, uno por uno"
            >
              {checking ? 'Comprobando…' : '↻ Mirar si ya son contacto'}
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-text-muted leading-snug">
        A esta gente le pediste que te mandara ella la solicitud. En cuanto la manda sube aquí arriba con el recurso
        ya escrito: se le contesta a su propia solicitud, así que llega sin aceptarla y sin gastar nada.
      </p>
      {data?.aviso && <p className="text-[11px] text-amber-400 leading-snug">⚠️ {data.aviso}</p>}
      {err && (
        <p className={err.startsWith('⚠️')
          ? 'text-[11px] text-amber-400 font-medium leading-snug'
          : 'text-[11px] text-red-400 font-medium'}>
          {err.startsWith('⚠️') ? err : `✗ ${err}`}
        </p>
      )}

      <div className="space-y-2">
        {accionables.map((f) => {
          if (sentIds.has(f.provider_id)) {
            return (
              <div key={f.provider_id} className="flex items-center gap-2 flex-wrap text-sm border-t border-border pt-2">
                <span className="font-medium">{f.provider_name || 'Sin nombre'}</span>
                {f.sector && <span className="text-[11px] text-text-muted">· {f.sector}</span>}
                <span className="ml-auto text-[11px] text-accent">✓ Recurso enviado</span>
              </div>
            );
          }
          const val = texts[f.provider_id] ?? textFor(f);
          return (
            <div key={f.provider_id} className="border-t border-border pt-2 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{f.provider_name || 'Sin nombre'}</span>
                {f.sector && <span className="text-[11px] text-text-muted">· {f.sector}</span>}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30">
                  {f.invitation_id ? '✓ te ha mandado solicitud' : '✓ ya sois contacto'}
                </span>
              </div>
              <textarea
                value={val}
                onChange={(e) => setTexts((t) => ({ ...t, [f.provider_id]: e.target.value }))}
                disabled={sending === f.provider_id}
                className={`w-full text-sm bg-bg-primary border border-border rounded-md px-3 py-2 resize-y focus:outline-none focus:border-accent disabled:opacity-50 ${
                  cfg.kind === 'lista' ? 'min-h-[240px]' : 'min-h-[80px]'
                }`}
              />
              <button
                onClick={() => enviar(f)}
                disabled={sending === f.provider_id || !val.trim()}
                className="text-xs px-3 py-1.5 rounded-md bg-accent text-white hover:bg-accent-light disabled:opacity-50 transition-colors"
              >
                {sending === f.provider_id
                  ? 'Enviando y comprobando…'
                  : f.invitation_id ? 'Contestar a su solicitud' : 'Enviar DM'}
              </button>
            </div>
          );
        })}

        {pendientes.length > 0 && (
          <div className="border-t border-border pt-2 space-y-1">
            {pendientes.map((f) => (
              <div key={f.provider_id} className="flex items-center gap-2 flex-wrap text-sm">
                <span className="font-medium">{f.provider_name || 'Sin nombre'}</span>
                {f.sector && <span className="text-[11px] text-text-muted">· {f.sector}</span>}
                <span className="ml-auto text-[11px] text-text-muted">
                  sin mandar solicitud · {f.dias === 0 ? 'hoy' : `hace ${f.dias} día${f.dias === 1 ? '' : 's'}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// SEGUIMIENTOS: los invitados con nota que esperan su recurso al aceptar. El botón
// recomprueba el grado de red con Unipile (NO lee su chat); a los que ya te
// aceptaron, un clic les manda lo guardado sin regenerarlo. Se ocultan solas al
// recibirlo (el backend las excluye en cuanto hay un DM enviado a esa persona en
// ese post).
//
// ⚠️ ESTA SECCIÓN ES HISTÓRICA (2026-08-17). Vive de las filas kind='invite', y ya
// no se crean: la invitación con nota se retiró. Sigue aquí porque la gente que se
// invitó antes del cambio sigue aceptando y sigue esperando su recurso. El flujo de
// hoy es `SolicitudesPedidas`, justo encima. Cuando esto se quede vacío para
// siempre, se puede borrar entero.
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
      const res = await apiPost<{ status: 'sent' | 'failed'; error: string | null; verificado: boolean | null }>(
        '/api/accounts/lead-magnet/send',
        { post_id: f.post_id, comment_id: f.comment_social_id, provider_id: f.provider_id, kind: 'dm', text }
      );
      if (res.status === 'sent') {
        setSentIds((s) => new Set(s).add(f.provider_id));
        // Enviado pero sin recibo: se dice. Un "✓" sobre algo que no hemos
        // podido comprobar es el bug del 13/08 otra vez.
        if (res.verificado !== true) {
          setErr(`⚠️ Mandado a ${f.provider_name || 'esta persona'}, pero no he podido comprobar que esté en LinkedIn${res.error ? ` (${res.error})` : ''}. Míralo en su chat antes de darlo por bueno.`);
        }
      } else setErr(res.error || 'LinkedIn rechazó el DM');
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
      {/* Un envío sin comprobar no es un fallo, pero tampoco un ✓: va en ámbar
          y con su propio texto, no disfrazado de error rojo. */}
      {err && (
        <p className={err.startsWith('⚠️')
          ? 'text-[11px] text-amber-400 font-medium leading-snug'
          : 'text-[11px] text-red-400 font-medium'}>
          {err.startsWith('⚠️') ? err : `✗ ${err}`}
        </p>
      )}
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
