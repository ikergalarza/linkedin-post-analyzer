// ¿Llegó de verdad el mensaje que dijimos que mandamos?
//
// Vive en su propio módulo, sin Express ni SQL alrededor, por dos motivos: es la
// pieza que decide si a una persona se le vuelve a escribir (equivocarse cuesta
// un lead o un mensaje duplicado) y es la única del flujo que se puede ejercer
// contra datos reales sin mandarle nada a nadie —ver `scripts/probar-verificacion.ts`.
//
// ⛔ LAS DOS FORMAS DE EQUIVOCARSE NO CUESTAN LO MISMO, Y NINGUNA ES GRATIS
// (Iker, 2026-08-13 y 2026-08-14, un fallo de cada signo en dos días):
//
//   · decir "enviado" cuando no salió → el lead se pierde en silencio y encima
//     le contestamos en público que ya se lo habíamos mandado.
//   · decir "NO ha llegado" cuando sí llegó → le mandamos el mismo recurso dos
//     veces, quedando como un bot, a alguien que acaba de darnos su atención.
//
// Por eso hay TRES respuestas y no dos. `null` ("no he podido comprobarlo") es
// una respuesta de primera clase: es lo que se devuelve siempre que el barrido
// no haya sido concluyente. Convertir un null en true o en false es el bug.

// Los mensajes tal y como los devuelve Unipile. Solo se declara lo que se usa.
export interface MensajeChat {
  is_sender?: number | string | null;
  text?: string | null;
  timestamp?: string | null;
}

export interface PaginaMensajes {
  items: MensajeChat[];
  cursor?: string | null;
}

// Lee una página de un chat. Se inyecta para poder probar la búsqueda contra
// páginas grabadas sin tocar la red.
export type LeerPagina = (chatId: string, cursor?: string) => Promise<PaginaMensajes>;

export type Veredicto = { ok: boolean | null; motivo: string | null };

// LinkedIn devuelve el texto con \r\n donde nosotros guardamos \n, y a veces
// recorta o recompone espacios. Se compara por huella, nunca por igualdad.
export function huellaTexto(t: string | null | undefined): string {
  return (t || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

// Cuántos caracteres de nuestro texto se usan como firma. Corto para que
// sobreviva a un recorte de LinkedIn, largo para que no case con otro mensaje
// distinto que empiece igual (los saludos SÍ se repiten entre destinatarios:
// "Holaa {nombre}! Te dejo el recurso sobre…").
const FIRMA = 60;

// El margen que se le da al reloj. `desde` es la hora de NUESTRO servidor al
// guardar el envío y el timestamp es el de LinkedIn: no tienen por qué coincidir
// al segundo. Si el margen se queda corto, el barrido para justo antes del
// mensaje que busca y volvemos al falso negativo de hoy.
const MARGEN_RELOJ_MS = 10 * 60 * 1000;

export interface OpcionesBusqueda {
  // Los chats donde mirar, EN ORDEN. Se miran TODOS, no solo el primero: una
  // misma persona puede tener más de una conversación abierta con la cuenta
  // (Asier tenía 2 con Unai el 14/08) y el mensaje puede estar en cualquiera.
  chatIds: string[];
  texto: string;
  // Cuándo se mandó. Es lo que ACOTA el barrido: los mensajes vienen del más
  // nuevo al más viejo, así que en cuanto se cruza esta fecha ya se ha pasado
  // de largo y no hace falta seguir bajando. Sin esto habría que elegir entre
  // mirar poco (falso negativo) o barrer chats enteros de años.
  desde?: Date | null;
  tamPagina?: number;
  maxPaginas?: number;
}

/**
 * Busca nuestro mensaje en los chats con esa persona.
 *
 * ⛔ EL FALLO QUE ARREGLA (Iker, 2026-08-14). Esto miraba los 10 mensajes más
 * recientes de UN solo chat. Medido ese día: el DM a Mario estaba en la posición
 * 11 y el de Asier en la 10 — los dos a uno o dos puestos de la ventana— porque
 * la conversación había seguido después de mandarlo. La herramienta los pintó en
 * rojo diciendo "al destinatario NO le ha llegado nada" sobre mensajes que Iker
 * tenía delante en su bandeja. Y el chat se llena rápido: de 66 mensajes de ese
 * hilo, 34 venían con el texto vacío (reacciones, adjuntos), así que una ventana
 * pequeña se gasta en ruido.
 *
 * Ahora se pagina hacia atrás hasta una de estas tres:
 *   1. aparece el mensaje                        → ok: true
 *   2. se cruza la fecha de envío sin encontrarlo → ok: false (de verdad no está)
 *   3. se acaban las páginas antes de llegar     → ok: null  (no lo sé)
 *
 * El caso 3 es el que impide que este arreglo se convierta mañana en el bug de
 * ayer: si no hemos podido mirar hasta el fondo, NO se afirma que no llegó.
 */
export async function buscarMensajeEnviado(
  leerPagina: LeerPagina,
  opts: OpcionesBusqueda
): Promise<{ encontrado: boolean; concluyente: boolean; mirados: number }> {
  const firma = huellaTexto(opts.texto).slice(0, FIRMA);
  const tamPagina = opts.tamPagina ?? 50;
  const maxPaginas = opts.maxPaginas ?? 10;
  // Sin fecha de envío no hay suelo, así que el barrido solo puede terminar por
  // agotar páginas: nunca será concluyente en negativo. Es correcto que sea así.
  const suelo = opts.desde ? opts.desde.getTime() - MARGEN_RELOJ_MS : null;

  let mirados = 0;
  // Concluyente = en ALGÚN chat hemos llegado hasta antes de la fecha de envío.
  // Basta con uno: si en ese chat no está y hemos mirado toda la ventana en la
  // que podría estar, es que no está ahí; y los demás chats se barren igual.
  let concluyente = false;

  for (const chatId of opts.chatIds) {
    let cursor: string | undefined;
    for (let pagina = 0; pagina < maxPaginas; pagina++) {
      let res: PaginaMensajes;
      try {
        res = await leerPagina(chatId, cursor);
      } catch {
        // Un chat que no se deja leer no invalida a los demás, pero tampoco
        // permite concluir nada sobre él: se pasa al siguiente sin marcar.
        break;
      }
      const items = res.items || [];
      for (const m of items) {
        mirados++;
        if (Number(m.is_sender) === 1 && huellaTexto(m.text).includes(firma)) {
          return { encontrado: true, concluyente: true, mirados };
        }
      }
      // ¿Hemos bajado ya por debajo de la fecha del envío? Los mensajes vienen
      // ordenados del más nuevo al más viejo, así que el último de la página es
      // el más antiguo visto hasta ahora.
      if (suelo != null) {
        const masViejo = items[items.length - 1]?.timestamp;
        const t = masViejo ? Date.parse(masViejo) : NaN;
        if (Number.isFinite(t) && t < suelo) { concluyente = true; break; }
      }
      cursor = res.cursor || undefined;
      // Fin del chat: se ha visto entero, así que la respuesta es definitiva
      // aunque no hubiera fecha de envío con la que acotar.
      if (!cursor || items.length === 0) { concluyente = true; break; }
      if (items.length < tamPagina) { concluyente = true; break; }
    }
  }

  return { encontrado: false, concluyente, mirados };
}

// El veredicto que entiende el resto de la app, con los tres estados.
//
// ⛔ "NO ENCUENTRO EL CHAT" NO ES "NO HA LLEGADO" (Iker, 2026-08-14). Esto
// devolvía `false` —rojo, "al destinatario NO le ha llegado nada"— en cuanto no
// aparecía una conversación. Y hay un caso PERFECTAMENTE NORMAL en el que no
// aparece y el mensaje sí salió: el InMail. Su bandeja
// (`INBOX_LINKEDIN_SALES_NAVIGATOR`) usa otros identificadores de persona y
// Unipile la sirve con días de retraso, así que buscarlo por el provider_id del
// comentario da 404 aunque esté entregado.
//
// Ese rojo empujaba a reenviar: otro crédito de InMail gastado y la misma
// persona recibiendo el recurso dos veces. Ahora la ausencia de chat es `null`
// —"no lo sé"—, y "NO ha llegado" se reserva para cuando SÍ hemos encontrado la
// conversación y la hemos barrido hasta antes de la fecha de envío.
export function veredictoDeBusqueda(
  r: { encontrado: boolean; concluyente: boolean },
  sinChats: boolean
): Veredicto {
  if (r.encontrado) return { ok: true, motivo: null };
  if (sinChats) {
    return {
      ok: null,
      motivo: 'no encuentro ninguna conversación con esta persona por API. En un InMail es lo normal: LinkedIn sirve esa bandeja con retraso y con otros identificadores. Míralo en tu bandeja antes de reenviar, que gastarías otro crédito',
    };
  }
  if (!r.concluyente) {
    return {
      ok: null,
      motivo: 'no he podido llegar hasta la fecha del envío en el historial del chat, así que no puedo asegurar ni que llegara ni que no',
    };
  }
  return {
    ok: false,
    motivo: 'LinkedIn aceptó la llamada pero el mensaje no aparece en el chat, y he mirado el historial hasta antes de mandarlo. Al destinatario NO le ha llegado nada.',
  };
}
