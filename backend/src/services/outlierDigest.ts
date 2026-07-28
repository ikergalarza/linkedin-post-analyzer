import pool from '../db';
import { CTE_METODO, agruparOutliers, saludCorpus } from './outlierQuery';
import {
  detectViralityDriver,
  generatePostExplanation,
  analyzeNarrativeRhythm,
} from './patterns';

/**
 * Novedades, digest y detalle de post.
 *
 * Vive en un servicio y no dentro de las rutas porque tiene DOS consumidores:
 * los endpoints REST y las tools del MCP montadas en /mcp, que llaman a estas
 * funciones directamente sin dar la vuelta por HTTP. Si esto se quedara inline
 * en el router, el MCP tendria que hacerse una peticion a si mismo.
 */

export interface OpcionesNovedades {
  desde?: string;
  dias?: number;
  limit?: number;
  solo_pendientes?: boolean;
  ratio_min?: number;
  eventos?: string[];
}

const CAMPOS_NOVEDAD = `
  e.id AS evento_id, e.evento, e.motivo, e.ratio_antes, e.ratio_despues,
  e.detectado_en, e.enviado_en,
  CASE WHEN m.hibrido THEN 'hibrido' ELSE 'absoluto' END AS metodo,
  p.id AS post_id, p.hook_text AS hook,
  p.pillar AS pilar, p.topic AS tema, p.content_type AS tipo_contenido,
  p.published_at, p.likes_count AS likes, p.comments_count AS comentarios,
  p.reposts_count AS reposts, p.impressions_count AS impresiones,
  p.outlier_ratio AS ratio, p.peak_outlier_ratio AS ratio_pico,
  p.comment_like_ratio, p.share_like_ratio, p.post_url AS url,
  c.name AS creador, COALESCE(c.is_managed, FALSE) AS es_gestionada,
  COALESCE(c.followers_count, 0) AS seguidores
`;

export async function novedadesOutliers(o: OpcionesNovedades = {}) {
  const limite = Math.min(o.limit || 30, 100);
  const eventos = o.eventos?.length ? o.eventos : ['nuevo', 'promovido'];

  const params: any[] = [eventos];
  const cond: string[] = [`e.evento = ANY($1::text[])`];

  if (o.desde) {
    params.push(o.desde);
    cond.push(`e.detectado_en >= $${params.length}::timestamptz`);
  } else {
    params.push(String(o.dias ?? 7));
    cond.push(`e.detectado_en >= NOW() - ($${params.length} || ' days')::interval`);
  }
  if (o.solo_pendientes) cond.push('e.enviado_en IS NULL');
  if (o.ratio_min != null) {
    params.push(o.ratio_min);
    cond.push(`p.outlier_ratio >= $${params.length}`);
  }
  params.push(limite);

  const { rows } = await pool.query(
    `WITH ${CTE_METODO}
     SELECT ${CAMPOS_NOVEDAD}, p.content_text
       FROM outlier_events e
       JOIN posts p ON p.id = e.post_id
       JOIN creators c ON c.id = p.creator_id
       LEFT JOIN metodo m ON m.creator_id = p.creator_id
      WHERE ${cond.join(' AND ')}
      ORDER BY p.outlier_ratio DESC NULLS LAST, e.detectado_en DESC
      LIMIT $${params.length}`,
    params
  );
  return rows;
}

export async function marcarEventosEnviados(ids: string[]): Promise<number> {
  const { rowCount } = await pool.query(
    `UPDATE outlier_events SET enviado_en = NOW()
      WHERE id = ANY($1::uuid[]) AND enviado_en IS NULL`,
    [ids]
  );
  return rowCount || 0;
}

export interface OpcionesDigest {
  dias?: number;
  ratio_min?: number;
  solo_pendientes?: boolean;
}

export async function digestOutliers(o: OpcionesDigest = {}) {
  const dias = o.dias ?? 1;
  const ratioMin = o.ratio_min ?? 3;
  const soloPendientes = o.solo_pendientes ?? true;

  const params: any[] = [String(dias), ratioMin];
  const cond = [
    `e.evento = ANY(ARRAY['nuevo','promovido'])`,
    `e.detectado_en >= NOW() - ($1 || ' days')::interval`,
    `p.outlier_ratio >= $2`,
  ];
  if (soloPendientes) cond.push('e.enviado_en IS NULL');

  const { rows: novedades } = await pool.query(
    `WITH ${CTE_METODO}
     SELECT ${CAMPOS_NOVEDAD}
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

  return {
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
  };
}

export async function detallePost(id: string) {
  const { rows } = await pool.query(
    `SELECT p.*, c.name AS creador, COALESCE(c.is_managed, FALSE) AS es_gestionada,
            COALESCE(c.followers_count, 0) AS seguidores, c.headline AS creador_headline
       FROM posts p JOIN creators c ON c.id = p.creator_id
      WHERE p.id = $1`,
    [id]
  );
  const p = rows[0];
  if (!p) return null;

  // raw_data (el JSON crudo de Unipile) y la imagen en base64 se quedan fuera:
  // son megas y esto tiene que caber en el contexto de un modelo.
  const { raw_data, cached_image_b64, ...limpio } = p;

  return {
    post: {
      ...limpio,
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
  };
}

export async function cuentasGestionadas() {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.followers_count, c.last_scraped_at,
            COUNT(p.id)::int AS total_posts,
            COUNT(p.id) FILTER (WHERE p.is_outlier = TRUE)::int AS total_outliers,
            COALESCE(ROUND(AVG(p.engagement_score))::int, 0) AS avg_engagement,
            MAX(p.published_at) AS last_post_at
       FROM creators c
       LEFT JOIN posts p ON p.creator_id = c.id AND p.linkedin_post_id <> 'DEMO_LIVE_POST'
      WHERE c.is_managed = TRUE
      GROUP BY c.id
      ORDER BY avg_engagement DESC`
  );
  return rows;
}
