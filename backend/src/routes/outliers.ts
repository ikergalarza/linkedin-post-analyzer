import { Router, Request, Response } from 'express';
import pool from '../db';
import {
  buscarOutliers,
  facetasOutliers,
  agruparOutliers,
  saludCorpus,
  FiltrosOutliers,
  ORDENES_VALIDOS,
  EJES_VALIDOS,
  DIMENSIONES_VALIDAS,
  CTE_METODO,
} from '../services/outlierQuery';
import { refrescarOutliers, AmbitoRefresco } from '../services/outlierRefresh';
import {
  detectViralityDriver,
  generatePostExplanation,
  analyzeNarrativeRhythm,
} from '../services/patterns';

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
  };
}

// --- GET /api/outliers/buscar ----------------------------------------------

router.get('/buscar', async (req: Request, res: Response) => {
  try {
    const filtros = filtrosDeQuery(req.query);
    const { filas, total, orden } = await buscarOutliers(filtros);
    res.json({
      filas,
      total,
      devueltos: filas.length,
      orden,
      // Sin esto, una respuesta corta se lee como "no hay mas" cuando en
      // realidad es que el limite corto la lista.
      hay_mas: (filtros.offset || 0) + filas.length < total,
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
// Dispara el refresco. Sincrono a proposito: quien lo llama (una tool del MCP
// o un cron) quiere el resumen de lo que ha cambiado, no un 202 y a mirar.

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const ambito = (req.body?.ambito || req.query.ambito || 'competencia') as AmbitoRefresco;
    const limite = num(req.body?.limite ?? req.query.limite);
    const creator_ids = lista(req.body?.creator_ids ?? req.query.creator_ids);

    const resultado = await refrescarOutliers({ ambito, limite, creator_ids });
    res.json(resultado);
  } catch (err: any) {
    console.error('[outliers/refresh]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- GET /api/outliers/novedades -------------------------------------------
// Los eventos de outlier con el post ya resuelto. `solo_pendientes` devuelve
// solo lo que no se ha mandado nunca en un digest.

router.get('/novedades', async (req: Request, res: Response) => {
  try {
    const desde = req.query.desde as string | undefined;
    const dias = num(req.query.dias) ?? 7;
    const limite = Math.min(num(req.query.limit) || 30, 100);
    const soloPendientes = bool(req.query.solo_pendientes) ?? false;
    const ratioMin = num(req.query.ratio_min);
    const eventos = lista(req.query.eventos) || ['nuevo', 'promovido'];

    const params: any[] = [eventos];
    const cond: string[] = [`e.evento = ANY($1::text[])`];

    if (desde) {
      params.push(desde);
      cond.push(`e.detectado_en >= $${params.length}::timestamptz`);
    } else {
      params.push(String(dias));
      cond.push(`e.detectado_en >= NOW() - ($${params.length} || ' days')::interval`);
    }
    if (soloPendientes) cond.push('e.enviado_en IS NULL');
    if (ratioMin != null) {
      params.push(ratioMin);
      cond.push(`p.outlier_ratio >= $${params.length}`);
    }

    params.push(limite);

    const { rows } = await pool.query(
      `WITH ${CTE_METODO}
       SELECT e.id AS evento_id, e.evento, e.motivo, e.ratio_antes, e.ratio_despues,
              e.detectado_en, e.enviado_en,
              CASE WHEN m.hibrido THEN 'hibrido' ELSE 'absoluto' END AS metodo,
              p.id AS post_id, p.hook_text AS hook, p.content_text,
              p.pillar AS pilar, p.topic AS tema, p.content_type AS tipo_contenido,
              p.published_at, p.likes_count AS likes, p.comments_count AS comentarios,
              p.reposts_count AS reposts, p.impressions_count AS impresiones,
              p.outlier_ratio AS ratio, p.peak_outlier_ratio AS ratio_pico,
              p.comment_like_ratio, p.share_like_ratio, p.post_url AS url,
              c.name AS creador, COALESCE(c.is_managed, FALSE) AS es_gestionada,
              COALESCE(c.followers_count, 0) AS seguidores
         FROM outlier_events e
         JOIN posts p ON p.id = e.post_id
         JOIN creators c ON c.id = p.creator_id
         LEFT JOIN metodo m ON m.creator_id = p.creator_id
        WHERE ${cond.join(' AND ')}
        ORDER BY p.outlier_ratio DESC NULLS LAST, e.detectado_en DESC
        LIMIT $${params.length}`,
      params
    );

    res.json({ novedades: rows, total: rows.length });
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
    const { rowCount } = await pool.query(
      `UPDATE outlier_events SET enviado_en = NOW()
        WHERE id = ANY($1::uuid[]) AND enviado_en IS NULL`,
      [ids]
    );
    res.json({ marcados: rowCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- GET /api/outliers/post/:id --------------------------------------------
// El post entero con su diagnostico. Existe aparte de /api/creators/debug-post
// porque aquel devuelve el raw_data de Unipile (megas de JSON) y esto tiene que
// caber en el contexto de un modelo.

router.get('/post/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, c.name AS creador, COALESCE(c.is_managed, FALSE) AS es_gestionada,
              COALESCE(c.followers_count, 0) AS seguidores, c.headline AS creador_headline
         FROM posts p JOIN creators c ON c.id = p.creator_id
        WHERE p.id = $1`,
      [req.params.id]
    );
    const p = rows[0];
    if (!p) return res.status(404).json({ error: 'Post no encontrado' });

    const { raw_data, cached_image_b64, ...limpio } = p;

    res.json({
      post: {
        ...limpio,
        // reaction_mix es lo que separa un meme de un post serio con foto.
        pct_risa: p.reaction_mix?.total
          ? Math.round(
              (((p.reaction_mix.FUNNY || 0) + (p.reaction_mix.ENTERTAINMENT || 0)) /
                p.reaction_mix.total) *
                100
            )
          : null,
      },
      diagnostico: {
        ...detectViralityDriver(p),
        explicacion: generatePostExplanation(p),
        ritmo: analyzeNarrativeRhythm(p),
      },
    });
  } catch (err: any) {
    console.error('[outliers/post]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- GET /api/outliers/digest ----------------------------------------------
// Todo lo que necesita el resumen diario, en una llamada: que hay de nuevo,
// que se ha movido, hacia donde va cada formato y de que te puedes fiar.
// Devuelve DATOS, no texto: la redaccion la pone quien lo lee (la tool del MCP
// o el modelo), que es quien tiene el criterio de las skills.

router.get('/digest', async (req: Request, res: Response) => {
  try {
    const dias = num(req.query.dias) ?? 1;
    const ratioMin = num(req.query.ratio_min) ?? 3;
    const soloPendientes = bool(req.query.solo_pendientes) ?? true;

    const params: any[] = [String(dias), ratioMin];
    const cond = [
      `e.evento = ANY(ARRAY['nuevo','promovido'])`,
      `e.detectado_en >= NOW() - ($1 || ' days')::interval`,
      `p.outlier_ratio >= $2`,
    ];
    if (soloPendientes) cond.push('e.enviado_en IS NULL');

    const { rows: novedades } = await pool.query(
      `WITH ${CTE_METODO}
       SELECT e.id AS evento_id, e.evento, e.motivo, e.ratio_antes, e.ratio_despues,
              CASE WHEN m.hibrido THEN 'hibrido' ELSE 'absoluto' END AS metodo,
              p.id AS post_id, p.hook_text AS hook, p.pillar AS pilar, p.topic AS tema,
              p.content_type AS tipo_contenido, p.published_at,
              p.likes_count AS likes, p.comments_count AS comentarios,
              p.impressions_count AS impresiones, p.outlier_ratio AS ratio,
              p.comment_like_ratio, p.share_like_ratio, p.post_url AS url,
              c.name AS creador, COALESCE(c.is_managed, FALSE) AS es_gestionada,
              COALESCE(c.followers_count, 0) AS seguidores
         FROM outlier_events e
         JOIN posts p ON p.id = e.post_id
         JOIN creators c ON c.id = p.creator_id
         LEFT JOIN metodo m ON m.creator_id = p.creator_id
        WHERE ${cond.join(' AND ')}
        ORDER BY p.outlier_ratio DESC NULLS LAST
        LIMIT 15`,
      params
    );

    // Tendencia por pilar: 30 dias contra los 30 anteriores.
    const ahora = Date.now();
    const ms30 = 30 * 24 * 60 * 60 * 1000;
    const corteA = new Date(ahora - ms30).toISOString();
    const corteB = new Date(ahora - 2 * ms30).toISOString();
    const [recientes, previos] = await Promise.all([
      agruparOutliers('pilar', { desde: corteA, solo_outliers: false }),
      agruparOutliers('pilar', { desde: corteB, hasta: corteA, solo_outliers: false }),
    ]);
    const previoPorValor = new Map(previos.map((p) => [String(p.valor), p]));
    const tendencias = recientes
      .map((r) => {
        const p = previoPorValor.get(String(r.valor));
        return {
          pilar: r.valor,
          n_reciente: r.n,
          n_previo: p?.n ?? 0,
          ratio_reciente: r.ratio_medio,
          ratio_previo: p?.ratio_medio ?? null,
          delta_pct:
            p && p.ratio_medio > 0
              ? Math.round(((r.ratio_medio - p.ratio_medio) / p.ratio_medio) * 100)
              : null,
          concluyente: r.n >= 3 && (p?.n ?? 0) >= 3,
        };
      })
      .filter((t) => t.pilar);

    const salud = await saludCorpus();

    res.json({
      generado_en: new Date().toISOString(),
      ventana_dias: dias,
      novedades,
      tendencias,
      salud: {
        posts: salud.totales.posts,
        outliers: salud.totales.outliers,
        outliers_sin_tema: salud.totales.outliers_sin_tema,
        temas_distintos: salud.temas_distintos,
        posibles_duplicados: salud.posibles_duplicados.length,
        frescura: salud.frescura,
      },
    });
  } catch (err: any) {
    console.error('[outliers/digest]', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
