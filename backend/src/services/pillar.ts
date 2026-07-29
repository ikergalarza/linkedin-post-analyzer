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
 *   · peloteo_objeto — el DESPIECE: un objeto partido en piezas, y cada pieza
 *                      con la empresa que la fabrica ("→ Los frenos: @X - @Y")
 *   · lead_magnet    — el cuerpo pide EXPLICITAMENTE "comenta <palabra>"
 *   · meme           — el motor es la IMAGEN y el cuerpo es corto por diseño.
 *                      Las risas disparadas (>25%) confirman, pero NO se exigen
 *   · historia       — anecdota personal en primera persona (pilar nuevo)
 *   · otro           — lo que no encaja; mejor null-ish que una etiqueta falsa
 *
 * REGLA DE ORO: ante la duda, 'otro'. Una etiqueta inventada contamina el
 * analisis mas que un hueco, porque un hueco se ve y una etiqueta mal no.
 */

export type Pillar =
  | 'peloteo_mapa'
  | 'peloteo_los10'
  | 'peloteo_objeto'
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
 * Fichas del DESPIECE. Se distinguen de las del mapa y de "los 10" por llevar
 * la PIEZA delante y dos puntos: "→ Los frenos: @Empresa - @Persona". Los otros
 * dos formatos van directos a "→ @Empresa - @Persona", sin pieza y sin ":".
 */
function contarPiezas(texto: string): number {
  return texto
    .split('\n')
    .filter((l) => {
      const s = l.trim();
      if (!s.startsWith('→')) return false;
      const cuerpo = s.slice(1).trim();
      const dosPuntos = cuerpo.indexOf(':');
      if (dosPuntos < 1) return false;
      // El guion de empresa-persona va DESPUES de los dos puntos.
      return / - | – | — /.test(cuerpo.slice(dosPuntos));
    }).length;
}

/**
 * ¿El cuerpo tiene forma de meme? Señal ESTRUCTURAL, disponible el dia que se
 * publica, al contrario que las risas.
 *
 * POR QUE HIZO FALTA (Iker, 2026-07-29): el clasificador solo miraba el % de
 * risa, que es un RESULTADO, asi que **solo reconocia los memes que ya habian
 * funcionado**. El meme del tatuaje del 29/07 se estaba haciendo viral y estaba
 * etiquetado como 'otro' porque LinkedIn aun no habia acumulado reacciones. Un
 * clasificador que necesita que el post triunfe para saber lo que es no sirve
 * para comparar dentro del pilar, que es justo para lo que se creo.
 *
 * En un meme el motor es la imagen: el texto es corto por diseño (la receta
 * pide 3-6 lineas de cuerpo). Se exige ademas que NO abra como lead magnet,
 * que esos tambien llevan imagen y a veces son cortos.
 */
function pareceMeme(texto: string): boolean {
  const lineas = texto.split('\n').filter((l) => l.trim()).length;
  if (texto.length > 700 || lineas > 16) return false;
  const arranque = texto.slice(0, 60).toUpperCase();
  if (arranque.includes('🚨') || arranque.includes('ÚLTIMA HORA') || arranque.includes('ULTIMA HORA')) return false;
  return true;
}

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
 *  1. fichas con pieza   → peloteo_objeto (despiece); van antes porque tambien
 *                          cuentan como mencion y si no caerian en "los 10"
 *  2. bloque de menciones → peloteo (y el numero de fichas separa mapa de "los 10")
 *  3. gate de comentario  → lead magnet
 *  4. imagen + risas O imagen + cuerpo corto → meme
 *  5. escena personal     → historia
 *  6. lo demas            → otro
 */
export function classifyPillar(post: PillarInput): Pillar {
  const t = (post.content_text || '').trim();
  if (!t) return 'otro';

  // 1. Peloteo regional. El bloque de "→" solo existe en estos dos formatos.
  // El mapa lleva 16 o 20 fichas (5x4 o 4x4); "los 10" lleva 10. Se parte por
  // 13 para dejar holgura si alguna ficha se quedo sin publicar.
  // El despiece se comprueba ANTES: sus fichas tambien cuentan como mencion,
  // asi que si no se mirara primero caeria en "los 10" o en mapa segun cuantas
  // piezas tenga el objeto.
  const piezas = contarPiezas(t);
  if (piezas >= 6) return 'peloteo_objeto';

  const menciones = contarMenciones(t);
  if (menciones >= 6) {
    return menciones >= 13 ? 'peloteo_mapa' : 'peloteo_los10';
  }

  // 2. Lead magnet: pide comentar una palabra concreta al final.
  if (pideComentarPalabra(t)) return 'lead_magnet';

  // 3. Meme. Solo con imagen: un texto pelado no es un meme aunque haga gracia.
  // Dos señales, y basta con UNA:
  //   a) las risas disparadas — inequivoca, pero solo existe si el post ya
  //      acumulo reacciones, asi que no sirve el dia 1 ni con un meme flojo;
  //   b) la forma del cuerpo — corto y sin apertura de lead magnet, disponible
  //      desde el minuto cero y sin depender de como haya ido.
  const conImagen = !!post.content_type && post.content_type !== 'text';
  if (conImagen) {
    const risa = pctRisa(post.reaction_mix);
    if (risa !== null && risa > UMBRAL_RISA) return 'meme';
    if (pareceMeme(t)) return 'meme';
  }

  // 4. Historia personal.
  if (pareceHistoria(t)) return 'historia';

  return 'otro';
}
