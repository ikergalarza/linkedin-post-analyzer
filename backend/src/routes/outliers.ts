import { Router, Request, Response } from 'express';
import {
  buscarOutliers,
  facetasOutliers,
  agruparOutliers,
  saludCorpus,
  FiltrosOutliers,
  ORDENES_VALIDOS,
  EJES_VALIDOS,
  DIMENSIONES_VALIDAS,
} from '../services/outlierQuery';
import {
  arrancarRefresco,
  estadoRefresco,
  contarCreadores,
  AmbitoRefresco,
} from '../services/outlierRefresh';
import {
  novedadesOutliers,
  marcarEventosEnviados,
  digestOutliers,
  detallePost,
} from '../services/outlierDigest';

const router = Router();

// --- parseo de query params ------------------------------------------------

function num(v: any): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function lista(v: any): string[] | undefined {
  if (!v) return undefined;
  const arr = Array.isArray(v) ? v : String(v).split(',');
  const limpio = arr.map((s) => String(s).trim()).filter(Boolean);
  return limpio.length ? limpio : undefined;
}

function bool(v: any): boolean | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  return v === 'true' || v === true || v === '1';
}

function filtrosDeQuery(q: any): FiltrosOutliers {
  return {
    ambito: ['propias', 'competencia', 'todas'].includes(q.ambito) ? q.ambito : undefined,
    creator_ids: lista(q.creator_ids),
    creador: q.creador || undefined,
    seguidores_min: num(q.seguidores_min),
    seguidores_max: num(q.seguidores_max),
    desde: q.desde || undefined,
    hasta: q.hasta || undefined,
    ultimos_dias: num(q.ultimos_dias),
    solo_outliers: bool(q.solo_outliers),
    ratio_min: num(q.ratio_min),
    ratio_max: num(q.ratio_max),
    likes_min: num(q.likes_min),
    likes_max: num(q.likes_max),
    comentarios_min: num(q.comentarios_min),
    reposts_min: num(q.reposts_min),
    impresiones_min: num(q.impresiones_min),
    engagement_min: num(q.engagement_min),
    comment_like_ratio_min: num(q.comment_like_ratio_min),
    share_like_ratio_min: num(q.share_like_ratio_min),
    guardados_min: num(q.guardados_min),
    clics_enlace_min: num(q.clics_enlace_min),
    pilar: lista(q.pilar),
    tema: lista(q.tema),
    hook_type: lista(q.hook_type),
    estructura: lista(q.estructura),
    tono: lista(q.tono),
    tipo_contenido: lista(q.tipo_contenido),
    idioma: q.idioma || undefined,
    longitud_min: num(q.longitud_min),
    longitud_max: num(q.longitud_max),
    q: q.q || undefined,
    modo: ['frase', 'todas', 'cualquiera'].includes(q.modo) ? q.modo : undefined,
    excluir: q.excluir || undefined,
    orden: q.orden || undefined,
    limit: num(q.limit),
    offset: num(q.offset),
    cursor: q.cursor || undefined,
  };
}

// --- GET /api/outliers/buscar ----------------------------------------------

router.get('/buscar', async (req: Request, res: Response) => {
  try {
    const filtros = filtrosDeQuery(req.query);
    const { filas, total, orden, cursor_siguiente } = await buscarOutliers(filtros);
    res.json({
      filas,
      total,
      devueltos: filas.length,
      orden,
      // Sin esto, una respuesta corta se lee como "no hay mas" cuando en
      // realidad es que el limite corto la lista.
      hay_mas: cursor_siguiente !== null,
      cursor_siguiente,
      ordenes_validos: ORDENES_VALIDOS,
    });
  } catch (err: any) {
    console.error('[outliers/buscar]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- GET /api/outliers/facetas ---------------------------------------------

router.get('/facetas', async (req: Request, res: Response) => {
  try {
    const eje = String(req.query.eje || 'tema');
    const valores = await facetasOutliers(eje, filtrosDeQuery(req.query));
    res.json({ eje, valores, ejes_validos: EJES_VALIDOS });
  } catch (err: any) {
    res.status(400).json({ error: err.message, ejes_validos: EJES_VALIDOS });
  }
});

// --- GET /api/outliers/agrupar ---------------------------------------------

router.get('/agrupar', async (req: Request, res: Response) => {
  try {
    const dimension = String(req.query.dimension || 'pilar');
    const filas = await agruparOutliers(dimension, filtrosDeQuery(req.query));
    res.json({ dimension, filas, dimensiones_validas: DIMENSIONES_VALIDAS });
  } catch (err: any) {
    res.status(400).json({ error: err.message, dimensiones_validas: DIMENSIONES_VALIDAS });
  }
});

// --- GET /api/outliers/comparar --------------------------------------------
// Dos ventanas temporales sobre la misma dimension. Responde "¿los lead
// magnets funcionan peor que antes?" sin que nadie tenga que restar a mano.

router.get('/comparar', async (req: Request, res: Response) => {
  try {
    const dimension = String(req.query.dimension || 'pilar');
    const dias = num(req.query.dias) || 90;
    const base = filtrosDeQuery(req.query);

    const ahora = Date.now();
    const ms = dias * 24 * 60 * 60 * 1000;
    const corteA = new Date(ahora - ms).toISOString();
    const corteB = new Date(ahora - 2 * ms).toISOString();

    const [recientes, previos] = await Promise.all([
      agruparOutliers(dimension, { ...base, desde: corteA, hasta: undefined, ultimos_dias: undefined }),
      agruparOutliers(dimension, { ...base, desde: corteB, hasta: corteA, ultimos_dias: undefined }),
    ]);

    const porValor = new Map<string, any>();
    for (const r of recientes) porValor.set(String(r.valor), { valor: r.valor, reciente: r, previo: null });
    for (const p of previos) {
      const clave = String(p.valor);
      if (porValor.has(clave)) porValor.get(clave).previo = p;
      else porValor.set(clave, { valor: p.valor, reciente: null, previo: p });
    }

    const filas = [...porValor.values()].map((v) => {
      const rA = v.reciente?.ratio_medio ?? null;
      const rB = v.previo?.ratio_medio ?? null;
      const delta_pct =
        rA != null && rB != null && rB > 0 ? Math.round(((rA - rB) / rB) * 100) : null;
      return {
        valor: v.valor,
        n_reciente: v.reciente?.n ?? 0,
        n_previo: v.previo?.n ?? 0,
        ratio_reciente: rA,
        ratio_previo: rB,
        delta_pct,
        // Con menos de 3 posts por lado el delta es anecdota, no señal.
        concluyente: (v.reciente?.n ?? 0) >= 3 && (v.previo?.n ?? 0) >= 3,
      };
    });

    res.json({
      dimension,
      ventana_dias: dias,
      ventana_reciente: { desde: corteA },
      ventana_previa: { desde: corteB, hasta: corteA },
      filas: filas.sort((a, b) => (b.n_reciente + b.n_previo) - (a.n_reciente + a.n_previo)),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- GET /api/outliers/salud -----------------------------------------------

router.get('/salud', async (_req: Request, res: Response) => {
  try {
    res.json(await saludCorpus());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- POST /api/outliers/refresh --------------------------------------------
// Arranca el refresco y vuelve EN EL ACTO con un id. El trabajo sigue por su
// cuenta: 145 creadores son ~10 minutos y el timeout de una tool MCP son 60
// segundos, asi que esperar aqui garantizaba que quien lo lanzo nunca viera
// el final. Se pregunta por el en GET /refresh/estado.

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const ambito = (req.body?.ambito || req.query.ambito || 'competencia') as AmbitoRefresco;
    const limite = num(req.body?.limite ?? req.query.limite);
    const creator_ids = lista(req.body?.creator_ids ?? req.query.creator_ids);

    const r = await arrancarRefresco({ ambito, limite, creator_ids });
    res.status(r.arrancado ? 202 : 409).json(r);
  } catch (err: any) {
    console.error('[outliers/refresh]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- GET /api/outliers/refresh/estado --------------------------------------
// Como va (o como fue) un refresco. Sin job_id, el mas reciente.

router.get('/refresh/estado', async (req: Request, res: Response) => {
  try {
    const estado = await estadoRefresco(req.query.job_id as string | undefined);
    if (!estado) return res.json({ estado: null, mensaje: 'No se ha lanzado ningún refresco todavía.' });
    res.json(estado);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- GET /api/outliers/creadores/conteo ------------------------------------
// Cuantos creadores hay por ambito, para dimensionar la vuelta antes de lanzarla.

router.get('/creadores/conteo', async (_req: Request, res: Response) => {
  try {
    res.json(await contarCreadores());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- GET /api/outliers/novedades -------------------------------------------
// Los eventos de outlier con el post ya resuelto. `solo_pendientes` devuelve
// solo lo que no se ha mandado nunca en un digest.

router.get('/novedades', async (req: Request, res: Response) => {
  try {
    const novedades = await novedadesOutliers({
      desde: req.query.desde as string | undefined,
      dias: num(req.query.dias),
      limit: num(req.query.limit),
      solo_pendientes: bool(req.query.solo_pendientes),
      ratio_min: num(req.query.ratio_min),
      eventos: lista(req.query.eventos),
    });
    res.json({ novedades, total: novedades.length });
  } catch (err: any) {
    console.error('[outliers/novedades]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- POST /api/outliers/novedades/marcar -----------------------------------
// Sella los eventos como enviados. Es lo que hace el digest idempotente: sin
// esto, el mismo post sale cinco dias seguidos y el resumen se deja de leer.

router.post('/novedades/marcar', async (req: Request, res: Response) => {
  try {
    const ids = lista(req.body?.evento_ids);
    if (!ids?.length) return res.status(400).json({ error: 'evento_ids requerido' });
    res.json({ marcados: await marcarEventosEnviados(ids) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- GET /api/outliers/post/:id --------------------------------------------
// El post entero con su diagnostico. Existe aparte de /api/creators/debug-post
// porque aquel devuelve el raw_data de Unipile (megas de JSON).

router.get('/post/:id', async (req: Request, res: Response) => {
  try {
    const detalle = await detallePost(req.params.id as string);
    if (!detalle) return res.status(404).json({ error: 'Post no encontrado' });
    res.json(detalle);
  } catch (err: any) {
    console.error('[outliers/post]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- GET /api/outliers/digest ----------------------------------------------
// Todo lo que necesita el resumen diario, en una llamada: que hay de nuevo,
// que se ha movido, hacia donde va cada formato y de que te puedes fiar.
// Devuelve DATOS, no texto: la redaccion la pone quien lo lee.

router.get('/digest', async (req: Request, res: Response) => {
  try {
    res.json(
      await digestOutliers({
        dias: num(req.query.dias),
        ratio_min: num(req.query.ratio_min),
        solo_pendientes: bool(req.query.solo_pendientes),
      })
    );
  } catch (err: any) {
    console.error('[outliers/digest]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
