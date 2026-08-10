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
      return SEPARADOR.test(cuerpo) && cuerpo.length > 8;
    }).length;
}

/**
 * El guion que separa empresa de persona.
 *
 * Era ' - ' literal y eso tiraba fichas reales (Iker, 2026-08-10): en el
 * despiece de Navarra, "→ La direccion: Lizarte S.A.U.- Oscar Huarte Azpiroz"
 * no contaba, porque el punto de "S.A.U." se come el espacio de delante del
 * guion. Se acepta el guion precedido de espacio O de punto. Lo que sigue
 * exigiendo es el espacio de DETRAS, que es lo que impide contar como ficha un
 * nombre compuesto tipo "Mercedes-Benz".
 */
const SEPARADOR = /(?:\s|\.)[-–—]\s/;

/**
 * Fichas de peloteo SIN persona: "→ Gonvarri Industries", "→ Las llantas:
 * Mapsa S. Coop.".
 *
 * POR QUE EXISTEN (Iker, 2026-08-10): la receta permite desde el 06/08 llevar
 * empresas sin persona verificada — "eso no me parece bien" fue la respuesta a
 * quitar las 12 empresas porque 8 no tenian nombre. Pero el clasificador seguia
 * definiendo la ficha como empresa+persona, asi que el despiece de Navarra, con
 * 8 de 12 fichas sin persona, conto 5 y se quedo a UNA del umbral. Se etiqueto
 * 'otro' un despiece de manual.
 *
 * Se exige que la linea sea CORTA y sin punto final: un nombre de empresa, no
 * una frase. Es lo que separa esto de las viñetas de una oferta de empleo
 * ("→ Trabajaras codo con codo con los fundadores.").
 */
function contarFichasSinPersona(texto: string): number {
  return texto
    .split('\n')
    .filter((l) => {
      const s = l.trim();
      if (!s.startsWith('→')) return false;
      const cuerpo = s.slice(1).trim();
      if (SEPARADOR.test(cuerpo)) return false; // ya la cuenta contarMenciones
      const nombre = cuerpo.includes(':') ? cuerpo.slice(cuerpo.indexOf(':') + 1).trim() : cuerpo;
      if (nombre.length < 3 || nombre.length > 60) return false;
      // Sin punto final: una empresa no lo lleva, una frase si. Se descuenta
      // antes la forma juridica, que acaba en punto de forma legitima
      // ("Mapsa S. Coop.", "Plasticos Brello, S.A.").
      const sinForma = nombre.replace(/,?\s*(S\.\s?A\.(\s?U\.)?|S\.\s?L\.(\s?U\.)?|S\.\s?Coop\.|Coop\.)$/i, '').trim();
      return !/[.!?]$/.test(sinForma);
    }).length;
}

/**
 * Cuenta las fichas que llevan CIFRA, que es lo que separa "los 10" del mapa.
 *
 * Contar menciones ya no vale (Iker, 2026-07-31). El umbral era 13 porque el
 * mapa llevaba 16 o 20 fichas y "los 10" llevaba 10, pero §4.0c bajo el suelo
 * del mapa a 10 para no repetir empresa, y el mapa de Asturias salio con 12 y
 * se clasifico como "los 10". El numero ya no distingue nada.
 *
 * Lo que SI distingue es la forma de la ficha, y no cambia nunca:
 *   · "los 10" → "→ @Persona - @Empresa · récord de 806M€, +19%"
 *                cada empresa entra con SU cifra verificada y su fuente, que
 *                es el nucleo del pilar.
 *   · mapa     → "→ @ArcelorMittal - @José Gómez García"
 *                la ficha va desnuda; los datos viven en el cuerpo, no aqui.
 */
function contarFichasConCifra(texto: string): number {
  return texto
    .split('\n')
    .filter((l) => {
      const s = l.trim();
      if (!s.startsWith('→')) return false;
      const cuerpo = s.slice(1).trim();
      if (!/ - | – | — /.test(cuerpo)) return false;
      // El separador "·" abre la cifra, y detras tiene que haber un digito.
      return /·/.test(cuerpo) && /\d/.test(cuerpo.split('·').slice(1).join('·'));
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
      // LA PERSONA ES OPCIONAL (Iker, 2026-08-10). Antes se exigia el guion
      // empresa-persona detras de los dos puntos, y con eso el despiece de
      // Navarra conto 5 de sus 12 piezas: las otras 7 solo llevaban empresa,
      // porque no habia persona verificada. La firma del despiece es la PIEZA,
      // no la persona.
      const pieza = cuerpo.slice(0, dosPuntos).trim();
      const quien = cuerpo.slice(dosPuntos + 1).trim();
      // La pieza es un sustantivo corto ("Los frenos", "El bloque del motor"),
      // nunca una frase. Es lo que impide contar "→ Nota: ..." como despiece.
      return pieza.length >= 3 && pieza.length <= 40 && quien.length >= 3;
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
  // 850/18 medido contra los memes REALES de las 3 cuentas (Iker, 2026-07-29),
  // no elegido a ojo. Con 700 se quedaba fuera el meme del tiburon (750 car,
  // 13 lineas, 1.63x), que es el mas largo que hemos publicado. El siguiente
  // post por encima de ese umbral ya NO es meme: el "pais inventado" de Unai
  // (885 car), que es su propio formato con dibujo. La linea cae en ese hueco.
  if (texto.length > 850 || lineas > 18) return false;
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

  // 1. Peloteo regional. El bloque de "→" solo existe en estos tres formatos y
  // se separan por la FORMA de la ficha, de la mas marcada a la mas sobria:
  //
  //   objeto → "→ La forja: @Alcorta - @Pedro Alvarez"      (pieza + dos puntos)
  //   los 10 → "→ @Silvia - @UNICA · récord de 806M€"       (cifra tras el "·")
  //   mapa   → "→ @ArcelorMittal - @José Gómez García"      (desnuda)
  //
  // El despiece va PRIMERO porque sus fichas tambien cuentan como mencion.
  const piezas = contarPiezas(t);
  if (piezas >= 6) return 'peloteo_objeto';

  // Las fichas sin persona SUMAN, pero no mandan solas: se exigen al menos 3
  // con persona. Sin ese suelo volveria el fallo que motivo `contarMenciones`
  // — la oferta de "Busco 2 SDRs Junior", con 6 viñetas "→", se clasificaba
  // como peloteo. Un peloteo real siempre nombra a alguien; lo que ya no se
  // exige es que los nombre a TODOS.
  const conPersona = contarMenciones(t);
  const menciones = conPersona + contarFichasSinPersona(t);
  if (menciones >= 6 && conPersona >= 3) {
    // "Los 10" mete la cifra de cada empresa DENTRO de la ficha; el mapa no.
    // Se pide mayoria (>=60%) y no todas, porque alguna ficha puede quedarse
    // sin dato si no se pudo verificar. Se exige ademas <=12 fichas: "los 10"
    // son 10 por definicion, asi que una lista mas larga es mapa aunque lleve
    // cifras. Antes esto se decidia SOLO por numero (>=13 = mapa) y el mapa de
    // Asturias, con 12 fichas, se clasifico mal (Iker, 2026-07-31).
    const conCifra = contarFichasConCifra(t);
    if (menciones <= 12 && conCifra >= Math.ceil(menciones * 0.6)) return 'peloteo_los10';
    return 'peloteo_mapa';
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
