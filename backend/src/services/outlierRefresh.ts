import pool from '../db';
import { scrapeCreatorPosts } from './creatorScrape';

/**
 * Refresco bajo demanda de la base de outliers.
 *
 * POR QUE EXISTE
 * --------------
 * postMonitor solo vigila las CUENTAS GESTIONADAS y solo dentro de una ventana
 * de 7 dias (`c.is_managed = TRUE AND published_at > NOW() - 7 days`). La
 * competencia — que es la mayor parte del corpus de outliers — no se refresca
 * sola: habia que llamar a POST /api/creators/:id/refresh a mano, uno a uno.
 *
 * Esto es el job que faltaba: coge los creadores mas rancios, los reescanea y
 * deja que recalcCreatorOutliers emita los eventos de entrada/salida. De ahi
 * sale el "que hay de nuevo" del resumen diario.
 *
 * PRESUPUESTO, NO "TODOS"
 * -----------------------
 * Cada creador refrescado son llamadas a Unipile, y el rate limit de LinkedIn
 * se paga en TODO el scraping (postMonitor ya raciona la analitica Premium a 6
 * por vuelta por lo mismo). Por eso se refresca un numero acotado de creadores
 * por llamada, siempre los mas rancios primero: en varias vueltas se recorre
 * todo el corpus sin picos.
 */

export type AmbitoRefresco = 'competencia' | 'propias' | 'todas';

export interface ResultadoRefresco {
  ambito: AmbitoRefresco;
  creadores_refrescados: number;
  creadores_con_error: number;
  posts_nuevos: number;
  eventos: { nuevo: number; promovido: number; degradado: number };
  detalle: { id: string; nombre: string | null; estado: string; nuevos?: number }[];
  saltado_por_concurrencia?: true;
}

// Guarda de concurrencia: dos refrescos a la vez duplicarian el gasto de
// Unipile y se pisarian en el recalculo. El segundo vuelve inmediatamente en
// vez de encolarse — quien llama prefiere saberlo a esperar sin señal.
let refrescoEnCurso = false;

const LIMITE_POR_DEFECTO = 15;
const LIMITE_MAXIMO = 60;

export async function refrescarOutliers(opciones: {
  ambito?: AmbitoRefresco;
  limite?: number;
  creator_ids?: string[];
} = {}): Promise<ResultadoRefresco> {
  const ambito = opciones.ambito || 'competencia';
  const limite = Math.min(Math.max(1, opciones.limite || LIMITE_POR_DEFECTO), LIMITE_MAXIMO);

  const vacio: ResultadoRefresco = {
    ambito,
    creadores_refrescados: 0,
    creadores_con_error: 0,
    posts_nuevos: 0,
    eventos: { nuevo: 0, promovido: 0, degradado: 0 },
    detalle: [],
  };

  if (refrescoEnCurso) {
    return { ...vacio, saltado_por_concurrencia: true };
  }
  refrescoEnCurso = true;

  // Marca de inicio para contar SOLO los eventos que ha generado esta vuelta.
  const inicio = new Date();

  try {
    let sql: string;
    const params: any[] = [];

    if (opciones.creator_ids && opciones.creator_ids.length > 0) {
      sql = `SELECT id, name, linkedin_id FROM creators
              WHERE id = ANY($1::uuid[]) AND linkedin_id IS NOT NULL`;
      params.push(opciones.creator_ids);
    } else {
      const filtro =
        ambito === 'competencia'
          ? 'AND COALESCE(is_managed, FALSE) = FALSE'
          : ambito === 'propias'
            ? 'AND is_managed = TRUE'
            : '';
      // NULLS FIRST: un creador que nunca se ha escaneado es el mas rancio de
      // todos y tiene que entrar antes que cualquiera con fecha.
      sql = `SELECT id, name, linkedin_id FROM creators
              WHERE linkedin_id IS NOT NULL ${filtro}
              ORDER BY last_scraped_at ASC NULLS FIRST
              LIMIT $1`;
      params.push(limite);
    }

    const { rows: creadores } = await pool.query(sql, params);

    const detalle: ResultadoRefresco['detalle'] = [];
    let refrescados = 0;
    let conError = 0;
    let postsNuevos = 0;

    for (const c of creadores) {
      try {
        const { nuevos } = await scrapeCreatorPosts(c.id, c.linkedin_id);
        detalle.push({ id: c.id, nombre: c.name, estado: 'ok', nuevos });
        refrescados++;
        postsNuevos += nuevos;
      } catch (err: any) {
        // Un creador que falla (perfil borrado, rate limit puntual) no puede
        // tumbar la vuelta entera: el resto del corpus sigue actualizandose.
        console.error(`[outlierRefresh] ${c.name || c.id}: ${err?.message}`);
        detalle.push({ id: c.id, nombre: c.name, estado: `error: ${err?.message}` });
        conError++;
      }
    }

    const { rows: conteo } = await pool.query(
      `SELECT evento, COUNT(*)::int AS n
         FROM outlier_events
        WHERE detectado_en >= $1
        GROUP BY evento`,
      [inicio]
    );
    const eventos = { nuevo: 0, promovido: 0, degradado: 0 };
    for (const r of conteo) {
      if (r.evento in eventos) eventos[r.evento as keyof typeof eventos] = r.n;
    }

    return {
      ambito,
      creadores_refrescados: refrescados,
      creadores_con_error: conError,
      posts_nuevos: postsNuevos,
      eventos,
      detalle,
    };
  } finally {
    refrescoEnCurso = false;
  }
}

export function hayRefrescoEnCurso(): boolean {
  return refrescoEnCurso;
}
