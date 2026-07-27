/**
 * Clasificador de PILAR de contenido.
 *
 * POR QUE EXISTE
 * --------------
 * `hook_type` y `post_structure` describen COMO esta escrito un post. Lo que
 * faltaba era el QUE: a que formato de nuestra parrilla pertenece. Sin eso, al
 * mirar la tabla de resultados se comparaban peras con manzanas — un meme (que
 * es corto por diseño y vive de la imagen) contra un mapa (2.000 caracteres y
 * 20 menciones) — y se sacaban conclusiones falsas del tipo "los posts cortos
 * van mal", cuando lo corto era simplemente que eran memes (Iker, 2026-07-27).
 *
 * Los cuatro pilares y su señal, tal y como los definio Iker:
 *   · peloteo_mapa   — foto de un mapa + bloque de ~20 menciones (5x4)
 *   · peloteo_los10  — foto que pone "los 10" + bloque de ~10 menciones
 *   · lead_magnet    — el cuerpo pide EXPLICITAMENTE "comenta <palabra>"
 *   · meme           — el motor es la imagen y las reacciones de RISA se
 *                      disparan (>25% del mix) en vez de los me-gusta normales
 *   · historia       — anecdota personal en primera persona (pilar nuevo)
 *   · otro           — lo que no encaja; mejor null-ish que una etiqueta falsa
 *
 * REGLA DE ORO: ante la duda, 'otro'. Una etiqueta inventada contamina el
 * analisis mas que un hueco, porque un hueco se ve y una etiqueta mal no.
 */

export type Pillar =
  | 'peloteo_mapa'
  | 'peloteo_los10'
  | 'lead_magnet'
  | 'meme'
  | 'historia'
  | 'otro';

export interface PillarInput {
  content_text: string | null;
  reaction_mix?: Record<string, number> | null;
  content_type?: string | null;
}

/**
 * Cuenta las FICHAS del bloque de peloteo: "→ Empresa - Persona".
 *
 * No basta con contar flechas. Usamos "→" tambien como viñeta normal (ofertas
 * de empleo, listas de ventajas), y sin filtrar, un post de "Busco un Full
 * Stack Developer" con 6 viñetas se clasificaba como peloteo. La ficha de
 * peloteo SIEMPRE empareja empresa y persona con un guion en medio, y esa es
 * la firma que se exige aqui.
 */
function contarMenciones(texto: string): number {
  return texto
    .split('\n')
    .filter((l) => {
      const s = l.trim();
      if (!s.startsWith('→')) return false;
      const cuerpo = s.slice(1).trim();
      return / - | – | — /.test(cuerpo) && cuerpo.length > 8;
    }).length;
}

/**
 * % de reacciones que son risa. Es la firma del meme: la gente reacciona con
 * 😂, no con 👍. Se aceptan las dos claves porque LinkedIn ha usado ambas
 * (ENTERTAINMENT es la actual, FUNNY la heredada) — mismo criterio que el
 * filtro de memes de la pagina de Inspiration.
 */
export function pctRisa(mix: Record<string, number> | null | undefined): number | null {
  if (!mix) return null;
  const total = Number(mix.total) || 0;
  if (!total) return null;
  const risa = (Number(mix.FUNNY) || 0) + (Number(mix.ENTERTAINMENT) || 0);
  return risa / total;
}

const UMBRAL_RISA = 0.25;

/**
 * ¿El cuerpo pide comentar una palabra? Es el gate del lead magnet, y va
 * siempre en las ultimas lineas ("Comenta \"subvencion\" y te la envio").
 * Se exige que la peticion este en el ULTIMO TERCIO para no confundirla con un
 * "comenta que te parece" suelto a mitad de un post cualquiera.
 */
function pideComentarPalabra(texto: string): boolean {
  const cola = texto.slice(Math.floor(texto.length * 0.6));
  return /\bcomenta\w*\b[^.\n]{0,40}["“«'']?[A-Za-zÁÉÍÓÚÑáéíóúñ]{3,}["”»'']?/i.test(cola)
    || /\bcomenta\w*\s+(la\s+palabra|["“«''])/i.test(cola);
}

/**
 * Anecdota personal: abre con una ESCENA propia en primera persona y no lleva
 * ni lista de menciones ni gate de comentario. Se pide señal doble (apertura
 * personal + narracion en primera persona mas adelante) porque un solo "mi" o
 * "yo" suelto aparece en cualquier post de opinion.
 */
function pareceHistoria(texto: string): boolean {
  const primeras = texto.split('\n').slice(0, 3).join(' ').toLowerCase();
  const abrePersonal =
    /(^|\s)(mi |mis |me |nunca (me|habia)|cuando (yo|tenia|empece)|hace \w+ (años|meses|semanas)|la primera vez|acab[eé]|empec[eé]|recuerdo)/.test(
      primeras
    );
  const yoes = (texto.match(/\b(yo|me|mi|mis|conmigo|acab[eé]|sal[ií]|llegu[eé]|ten[ií]a|hab[ií]a|estaba|sent[ií])\b/gi) || [])
    .length;
  return abrePersonal && yoes >= 4;
}

/**
 * Clasifica un post en su pilar.
 *
 * ORDEN DELIBERADO (de la señal mas inequivoca a la mas interpretable):
 *  1. bloque de menciones → peloteo (y el numero de fichas separa mapa de "los 10")
 *  2. gate de comentario  → lead magnet
 *  3. risas disparadas    → meme
 *  4. escena personal     → historia
 *  5. lo demas            → otro
 */
export function classifyPillar(post: PillarInput): Pillar {
  const t = (post.content_text || '').trim();
  if (!t) return 'otro';

  // 1. Peloteo regional. El bloque de "→" solo existe en estos dos formatos.
  // El mapa lleva 16 o 20 fichas (5x4 o 4x4); "los 10" lleva 10. Se parte por
  // 13 para dejar holgura si alguna ficha se quedo sin publicar.
  const menciones = contarMenciones(t);
  if (menciones >= 6) {
    return menciones >= 13 ? 'peloteo_mapa' : 'peloteo_los10';
  }

  // 2. Lead magnet: pide comentar una palabra concreta al final.
  if (pideComentarPalabra(t)) return 'lead_magnet';

  // 3. Meme: el motor es la imagen y la gente reacciona con risa. Solo se
  // aplica si hay imagen — un texto pelado no es un meme aunque haga gracia.
  const risa = pctRisa(post.reaction_mix);
  if (risa !== null && risa > UMBRAL_RISA && post.content_type !== 'text') return 'meme';

  // 4. Historia personal.
  if (pareceHistoria(t)) return 'historia';

  return 'otro';
}
