import pool from '../db';
import { scrapeCreatorPosts } from './creatorScrape';

/**
 * Refresco de la base de outliers, EN SEGUNDO PLANO.
 *
 * POR QUE NO ES SINCRONO (lo fue, y estaba mal)
 * ---------------------------------------------
 * La primera version devolvia el resumen al terminar. Con 145 creadores a unos
 * segundos cada uno son ~10 minutos, y el timeout de una tool MCP son 60
 * segundos: el cliente se rendia, el servidor seguia trabajando y quien lo
 * habia lanzado no tenia forma de saber si seguia vivo, habia acabado o habia
 * reventado. Peor aun, reintentar solo devolvia "ya hay uno en curso" sin
 * decir por donde iba.
 *
 * Ahora arrancarRefresco() vuelve en milisegundos con un id, el trabajo sigue
 * por su cuenta y se pregunta por el con estadoRefresco(). El estado vive en
 * Postgres (tabla refresh_jobs) y no en una variable: asi sobrevive a un
 * redeploy y la guarda de concurrencia vale aunque Railway levante varias
 * instancias.
 *
 * PRESUPUESTO
 * -----------
 * Cada creador son llamadas a Unipile, y el rate limit de LinkedIn se paga en
 * TODO el scraping. Por eso se refresca un numero acotado por vuelta, siempre
 * los mas rancios primero: en varias vueltas se recorre el corpus sin picos.
 */

export type AmbitoRefresco = 'competencia' | 'propias' | 'todas';

export interface JobRefresco {
  id: string;
  ambito: string;
  estado: 'en_curso' | 'terminado' | 'fallido' | 'abandonado';
  total: number;
  procesados: number;
  ok: number;
  con_error: number;
  posts_nuevos: number;
  creador_actual: string | null;
  errores: { nombre: string | null; error: string }[];
  empezado_en: Date;
  latido_en: Date;
  terminado_en: Date | null;
  error: string | null;
}

export interface EstadoRefresco extends JobRefresco {
  segundos_transcurridos: number;
  segundos_por_creador: number | null;
  segundos_restantes_estimados: number | null;
  eventos: { nuevo: number; promovido: number; degradado: number };
}

const LIMITE_POR_DEFECTO = 25;
// Con el trabajo en segundo plano el techo ya no lo pone el timeout HTTP, asi
// que cabe el corpus entero de una vez. Sigue habiendo un maximo como red de
// seguridad contra un `limite` absurdo por error de tecleo.
const LIMITE_MAXIMO = 500;

// Un job cuyo latido lleva mas de esto parado es un proceso muerto (redeploy,
// OOM, crash). Generoso a proposito: un creador con muchos posts puede tardar
// bastante, y marcar como muerto algo que sigue vivo es peor que esperar.
const LATIDO_MAXIMO_MIN = 10;

/** Marca como abandonados los jobs cuyo proceso murio sin cerrarlos. */
async function sanearJobsMuertos(): Promise<void> {
  await pool.query(
    `UPDATE refresh_jobs
        SET estado = 'abandonado',
            terminado_en = latido_en,
            error = 'El proceso dejo de dar señales (redeploy o caida). Lo procesado se guardo.'
      WHERE estado = 'en_curso'
        AND latido_en < NOW() - ($1 || ' minutes')::interval`,
    [String(LATIDO_MAXIMO_MIN)]
  );
}

export async function jobEnCurso(): Promise<JobRefresco | null> {
  await sanearJobsMuertos();
  const { rows } = await pool.query(
    `SELECT * FROM refresh_jobs WHERE estado = 'en_curso' ORDER BY empezado_en DESC LIMIT 1`
  );
  return rows[0] || null;
}

export interface OpcionesRefresco {
  ambito?: AmbitoRefresco;
  limite?: number;
  creator_ids?: string[];
}

export interface ArranqueRefresco {
  arrancado: boolean;
  job: JobRefresco;
  /** Cuando ya habia uno corriendo: se devuelve ESE, no se lanza otro. */
  ya_habia_uno?: true;
}

/**
 * Arranca un refresco y vuelve inmediatamente.
 *
 * El trabajo se lanza sin await a proposito. Cualquier fallo dentro se captura
 * y se escribe en el job — si se escapara, seria un unhandledRejection y en
 * Node tumbaria el proceso entero por un creador con el perfil borrado.
 */
export async function arrancarRefresco(o: OpcionesRefresco = {}): Promise<ArranqueRefresco> {
  const enCurso = await jobEnCurso();
  if (enCurso) return { arrancado: false, job: enCurso, ya_habia_uno: true };

  const ambito = o.ambito || 'competencia';
  const limite = Math.min(Math.max(1, o.limite || LIMITE_POR_DEFECTO), LIMITE_MAXIMO);

  const creadores = await seleccionarCreadores(ambito, limite, o.creator_ids);

  const { rows } = await pool.query(
    `INSERT INTO refresh_jobs (ambito, estado, total) VALUES ($1, 'en_curso', $2) RETURNING *`,
    [ambito, creadores.length]
  );
  const job: JobRefresco = rows[0];

  if (creadores.length === 0) {
    await pool.query(
      `UPDATE refresh_jobs SET estado = 'terminado', terminado_en = NOW() WHERE id = $1`,
      [job.id]
    );
    return { arrancado: true, job: { ...job, estado: 'terminado' } };
  }

  void procesar(job.id, creadores);
  return { arrancado: true, job };
}

async function seleccionarCreadores(
  ambito: AmbitoRefresco,
  limite: number,
  ids?: string[]
): Promise<{ id: string; name: string | null; linkedin_id: string }[]> {
  if (ids?.length) {
    const { rows } = await pool.query(
      `SELECT id, name, linkedin_id FROM creators
        WHERE id = ANY($1::uuid[]) AND linkedin_id IS NOT NULL`,
      [ids]
    );
    return rows;
  }
  const filtro =
    ambito === 'competencia'
      ? 'AND COALESCE(is_managed, FALSE) = FALSE'
      : ambito === 'propias'
        ? 'AND is_managed = TRUE'
        : '';
  // NULLS FIRST: un creador que nunca se ha escaneado es el mas rancio de
  // todos y tiene que entrar antes que cualquiera con fecha.
  const { rows } = await pool.query(
    `SELECT id, name, linkedin_id FROM creators
      WHERE linkedin_id IS NOT NULL ${filtro}
      ORDER BY last_scraped_at ASC NULLS FIRST
      LIMIT $1`,
    [limite]
  );
  return rows;
}

async function procesar(
  jobId: string,
  creadores: { id: string; name: string | null; linkedin_id: string }[]
): Promise<void> {
  let ok = 0;
  let conError = 0;
  let postsNuevos = 0;
  const errores: { nombre: string | null; error: string }[] = [];

  try {
    for (let i = 0; i < creadores.length; i++) {
      const c = creadores[i];

      // El nombre se escribe ANTES de procesarlo: si el proceso muere aqui, el
      // job queda señalando al creador que lo tumbo.
      await pool.query(
        `UPDATE refresh_jobs SET creador_actual = $2, latido_en = NOW() WHERE id = $1`,
        [jobId, c.name || c.id]
      );

      try {
        const { nuevos } = await scrapeCreatorPosts(c.id, c.linkedin_id);
        ok++;
        postsNuevos += nuevos;
      } catch (err: any) {
        // Un creador que falla (perfil borrado, rate limit puntual) no puede
        // tumbar la vuelta entera: el resto del corpus sigue actualizandose.
        console.error(`[outlierRefresh] ${c.name || c.id}: ${err?.message}`);
        conError++;
        errores.push({ nombre: c.name, error: String(err?.message || err).slice(0, 200) });
      }

      await pool.query(
        `UPDATE refresh_jobs
            SET procesados = $2, ok = $3, con_error = $4, posts_nuevos = $5,
                errores = $6::jsonb, latido_en = NOW()
          WHERE id = $1`,
        [jobId, i + 1, ok, conError, postsNuevos, JSON.stringify(errores.slice(0, 25))]
      );
    }

    await pool.query(
      `UPDATE refresh_jobs
          SET estado = 'terminado', terminado_en = NOW(), latido_en = NOW(), creador_actual = NULL
        WHERE id = $1`,
      [jobId]
    );
  } catch (err: any) {
    console.error('[outlierRefresh] job fallido:', err?.message);
    await pool
      .query(
        `UPDATE refresh_jobs
            SET estado = 'fallido', terminado_en = NOW(), error = $2, creador_actual = NULL
          WHERE id = $1`,
        [jobId, String(err?.message || err).slice(0, 500)]
      )
      .catch(() => {
        /* si ni esto se puede escribir, el saneo por latido lo recogera */
      });
  }
}

export async function estadoRefresco(jobId?: string): Promise<EstadoRefresco | null> {
  await sanearJobsMuertos();

  const { rows } = jobId
    ? await pool.query(`SELECT * FROM refresh_jobs WHERE id = $1`, [jobId])
    : await pool.query(`SELECT * FROM refresh_jobs ORDER BY empezado_en DESC LIMIT 1`);

  const job: JobRefresco | undefined = rows[0];
  if (!job) return null;

  const fin = job.terminado_en ? new Date(job.terminado_en) : new Date();
  const transcurridos = Math.round((fin.getTime() - new Date(job.empezado_en).getTime()) / 1000);
  const porCreador = job.procesados > 0 ? transcurridos / job.procesados : null;
  const restantes =
    porCreador != null && job.estado === 'en_curso'
      ? Math.round(porCreador * (job.total - job.procesados))
      : null;

  // Los eventos generados por ESTE job: los que caen dentro de su ventana.
  const { rows: conteo } = await pool.query(
    `SELECT evento, COUNT(*)::int AS n
       FROM outlier_events
      WHERE detectado_en >= $1 AND ($2::timestamptz IS NULL OR detectado_en <= $2)
      GROUP BY evento`,
    [job.empezado_en, job.terminado_en]
  );
  const eventos = { nuevo: 0, promovido: 0, degradado: 0 };
  for (const r of conteo) {
    if (r.evento in eventos) eventos[r.evento as keyof typeof eventos] = r.n;
  }

  return {
    ...job,
    segundos_transcurridos: transcurridos,
    segundos_por_creador: porCreador != null ? Math.round(porCreador * 10) / 10 : null,
    segundos_restantes_estimados: restantes,
    eventos,
  };
}

/** Cuántos creadores hay por ámbito, para dimensionar la vuelta antes de lanzarla. */
export async function contarCreadores(): Promise<{
  competencia: number;
  propias: number;
  total: number;
  sin_escanear: number;
}> {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE COALESCE(is_managed, FALSE) = FALSE)::int AS competencia,
            COUNT(*) FILTER (WHERE is_managed = TRUE)::int AS propias,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE last_scraped_at IS NULL)::int AS sin_escanear
       FROM creators WHERE linkedin_id IS NOT NULL`
  );
  return rows[0];
}
