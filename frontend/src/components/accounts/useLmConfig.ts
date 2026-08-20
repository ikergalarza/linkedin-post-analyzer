/* La config del lead magnet de un post: tipo, recurso, tema y palabra.
 *
 * Vive en la BASE desde el 2026-08-20, pero `localStorage` sigue siendo la
 * SEMILLA. Los posts que Iker ya tenia configurados a mano tienen ahi su tipo, y
 * perderlo significaria que un lead magnet de tipo Lista genera el DM normal —
 * el mensaje equivocado, a gente real. La primera vez que se abre un post cuya
 * columna esta vacia se sube lo que hubiera en el navegador, y a partir de ahi
 * manda la base.
 *
 * ⚠️ Se sigue escribiendo en localStorage ADEMAS de en la base. Es la red: si el
 * PUT falla (Railway dormido, sin internet), el tipo no se pierde y el siguiente
 * arranque lo vuelve a subir.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, apiPut } from '../../hooks/useApi';
import { saveConfig } from './lmConfigLocal';
import type { LmConfig } from './lmTypes';

export function useLmConfig(postId: string, semilla: LmConfig) {
  const [cfg, setCfg] = useState<LmConfig>(semilla);
  // ⛔ Hasta que la base ha contestado NO se escribe en ella. Sin esta bandera,
  // el primer render subiria la semilla local y pisaria lo que ya hubiera
  // guardado — que es justo el caso de entrar desde otro ordenador.
  const listo = useRef(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await apiGet<{ config: LmConfig | null }>(
          `/api/accounts/lead-magnet/config?post_id=${postId}`
        );
        if (!vivo) return;
        // La base manda, pero solo sobre lo que trae: un config viejo sin `topic`
        // no debe borrar el que la deteccion acaba de sacar del post.
        if (r.config) setCfg((c) => ({ ...c, ...r.config }));
      } catch {
        /* Sin base se trabaja con la semilla local. No es fatal y no se avisa:
           el panel funciona igual y un cartel aqui no le dice nada a nadie. */
      } finally {
        if (vivo) listo.current = true;
      }
    })();
    return () => { vivo = false; };
    // La semilla se calcula del post y solo importa en el primer render: meterla
    // en las dependencias reharia la peticion en cada cambio de config.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // Misma forma que el `setCfg` de antes —`setCfg((c) => ({...c, kind}))`— para
  // que ninguna de las llamadas del panel tenga que cambiar.
  const guardar = useCallback((fn: (c: LmConfig) => LmConfig) => {
    setCfg((c) => {
      const next = fn(c);
      saveConfig(postId, next);
      if (listo.current) {
        apiPut('/api/accounts/lead-magnet/config', { post_id: postId, config: next })
          .catch(() => { /* queda en localStorage y se reintenta al recargar */ });
      }
      return next;
    });
  }, [postId]);

  return [cfg, guardar] as const;
}
