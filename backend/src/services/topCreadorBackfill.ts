/**
 * BACKFILL DE `top_del_creador`.
 *
 * La columna nace en FALSE para los 37.168 posts que ya estan en la BD, y
 * `recalcTopDelCreador` solo corre cuando se rescrapea un creador. Sin esto, el
 * Explorer se quedaria vacio hasta que cada cuenta pasara por el scraper, que
 * en las cuentas de la competencia puede tardar semanas.
 *
 * Mismo patron que `pillarBackfill`: GUARDA DE VERSION en `app_state`. Se sube
 * `TOP_CREADOR_VERSION` a mano cuando cambian K_SIGMAS_TOP o PERCENTIL_TOP, y
 * solo entonces se reprocesa. El disparador es el CAMBIO DE REGLAS, no el
 * arranque ni el calendario.
 */
import pool from '../db';
import { recalcTopDelCreador } from './outliers';

/**
 * Subir a mano al tocar K_SIGMAS_TOP o PERCENTIL_TOP en `outliers.ts`.
 * v1 = percentil 0,92 + suelo mediana*(p84/mediana)^1,5
 */
export const TOP_CREADOR_VERSION = 'v1-pct92-k1.5';

const CLAVE = 'top_del_creador_version';

/**
 * Se llama al arrancar, DESPUES de las migraciones. No lanza nunca: esto es
 * mantenimiento, y un fallo aqui no puede tumbar el servidor.
 */
export async function recalcTopSiCambiaronLasReglas(): Promise<void> {
  try {
    const { rows } = await pool.query(`SELECT value FROM app_state WHERE key = $1`, [CLAVE]);
    if (rows[0]?.value === TOP_CREADOR_VERSION) {
      console.log(`[top_del_creador] reglas sin cambios (${TOP_CREADOR_VERSION}), no se reprocesa`);
      return;
    }

    console.log(
      `[top_del_creador] reglas nuevas: ${rows[0]?.value ?? 'ninguna'} → ${TOP_CREADOR_VERSION}. Reprocesando…`
    );

    // Uno a uno y no en una sola sentencia: el calculo es POR CREADOR (mediana y
    // p84 propios), y en 153 creadores una consulta por cuenta es barata y se ve
    // en el log si una peta.
    const { rows: creadores } = await pool.query(`SELECT id, name FROM creators`);
    let ok = 0;
    let fallos = 0;
    for (const c of creadores) {
      try {
        await recalcTopDelCreador(c.id);
        ok++;
      } catch (e: any) {
        fallos++;
        console.warn(`[top_del_creador] fallo en ${c.name} (${c.id}): ${e?.message}`);
      }
    }

    const { rows: total } = await pool.query(
      `SELECT COUNT(*)::int AS n FROM posts WHERE top_del_creador = TRUE`
    );
    console.log(
      `[top_del_creador] ${ok} creadores recalculados (${fallos} fallos) → ${total[0]?.n ?? 0} posts marcados`
    );

    // Solo se guarda la version si NINGUNO fallo: si alguno quedo a medias,
    // queremos que el siguiente despliegue lo vuelva a intentar.
    if (fallos === 0) {
      await pool.query(
        `INSERT INTO app_state (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [CLAVE, TOP_CREADOR_VERSION]
      );
    }
  } catch (err: any) {
    console.error('[top_del_creador] backfill fallido:', err?.message);
  }
}
