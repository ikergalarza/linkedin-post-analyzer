import crypto from 'crypto';
import { trackedCreate } from './claudeClient';
import { stripLoneSurrogates } from '../utils/sanitizeText';
import pool from '../db';

// Generador del lead magnet PÚBLICO "rastro".
//
// QUÉ ES: alguien comenta la palabra clave + su sector. A cambio le decimos qué
// señales públicas avisan de que una empresa de SU sector está a punto de
// comprar. El comentario público lleva 1 señal entera + el enlace a su página,
// donde están las demás a cambio del correo.
//
// POR QUÉ EXISTE (y no reusamos el roaster): el roaster analiza PERFILES, y ese
// ángulo ya lo quemó Unai ("destripo perfiles", 0.21x). Esto es el mismo
// mecanismo (pega algo → te devuelve un análisis + un enlace único) sobre otro
// objeto: el sector.
//
// ⭐ EL GATE ES EL PUNTO. El lead magnet público que mejor funcionó (8.55x · 483
// comentarios) regalaba el análisis entero y capturó CERO correos. Aquí el
// teaser va gratis y el resto se cambia por el email.

export interface RastroInput {
  postId: string | null;
  /** Lo que ha escrito en su comentario: de ahí sale el sector. */
  commentText: string;
  commenterName: string | null;
  commenterHeadline: string | null;
  commenterProfileId: string | null;
  /** El texto del post, para que la respuesta case con lo que se prometió. */
  postContent: string;
  /** Quién firma: decide el registro (`brand-voice §1b`). */
  authorName: string;
}

export interface Senal {
  titulo: string;
  /** Qué es y por qué avisa de una compra. */
  que_es: string;
  /** Dónde se ve, gratis. */
  donde: string;
  /** Cuánto suele tardar en convertirse en pedido. */
  plazo: string;
}

export interface RastroOutput {
  shareId: string;
  shareUrl: string;
  sector: string;
  /** El comentario listo para pegar en LinkedIn (ya lleva el enlace). */
  publicComment: string;
  teaser: Senal;
  full: Senal[];
}

const SYSTEM = `Eres un fundador de una empresa de ventas B2B respondiendo, en PÚBLICO, al comentario de alguien que ha pedido las señales de compra de su sector.

Tu trabajo: decirle qué señales PÚBLICAS avisan de que una empresa de SU sector está a punto de comprar lo que él vende.

═══ QUÉ ES UNA SEÑAL VÁLIDA ═══
Un hecho PÚBLICO, comprobable y gratis, que ocurre ANTES de la compra y que un comercial puede vigilar. Ejemplos del tipo correcto: cambian al director de compras, publican una vacante que describe el producto, abren planta, les entra un pedido que no pueden servir con la capacidad que tienen, su competidor directo acaba de comprarlo, piden una licencia, ganan un concurso.
NO valen: cosas de pago, cosas que solo se saben por dentro, ni consejos genéricos de ventas.

═══ REGLAS DURAS ═══
1. ATERRÍZALO EN SU SECTOR. Si tu respuesta le vale igual a cualquier otro sector, está MAL. Usa el vocabulario, los actores y los tiempos de SU mundo. Aquí se gana o se pierde.
2. NO INVENTES DATOS. Ni cifras, ni porcentajes, ni nombres de empresas, ni estudios. Las señales son mecanismos, no estadísticas. Si te pide el cuerpo escribir "el 73%", no lo escribas.
3. SI NO SABES SU SECTOR, dilo en el campo sector como "generico" y da señales del B2B industrial. Nunca te lo inventes a partir de su nombre.
4. Español de España, tuteando. Cero jerga de marketing. Cero guiones largos (— o –): usa comas, puntos o "y / pero / así que". Nunca una coma antes de "y".

═══ EL COMENTARIO PÚBLICO ═══
- Abre con su nombre EXACTO, un espacio, y la primera palabra en minúscula. Sin coma detrás del nombre.
- Dale la PRIMERA señal ENTERA y gratis: qué es, dónde se ve y cuánto tarda. Completa, sin regatear. Es lo que hace que la gente comente.
- Después, una línea diciendo cuántas más tiene en su página. Nada de "más info": di qué son.
- 5-9 líneas. Sin markdown (LinkedIn no lo renderiza), sin viñetas con guion. Líneas cortas, se lee en el móvil.
- NO pongas el enlace: se añade después por código.

Devuelve SOLO un JSON válido, sin texto alrededor:
{"sector":"<el suyo, en 1-3 palabras, en minúscula>","public_comment":"<el comentario>","senales":[{"titulo":"","que_es":"","donde":"","plazo":""}, ...4-5 en total]}
La PRIMERA del array es la que va entera en el comentario público.`;

export async function generarRastro(input: RastroInput): Promise<RastroOutput> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');

  const msg = await trackedCreate('rastro_generator', {
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Firma la respuesta ${input.authorName}.

═══ EL POST AL QUE HA COMENTADO ═══
${input.postContent}

═══ QUIÉN COMENTA ═══
Nombre (va literal al principio de la respuesta): ${input.commenterName || '(desconocido)'}
Titular: ${input.commenterHeadline || '(sin titular)'}

═══ SU COMENTARIO ═══
"${input.commentText}"

De ahí sale su sector. Si el comentario no lo dice, mira su titular. Si tampoco, sector "generico".`,
      },
    ],
  });

  const block = msg.content.find((b) => b.type === 'text') as { type: 'text'; text: string } | undefined;
  const raw = stripLoneSurrogates(block?.text ?? '').trim();
  // El modelo a veces envuelve el JSON en ```json … ```, aunque se le pida que no.
  const jsonTxt = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed: { sector?: string; public_comment?: string; senales?: Senal[] };
  try {
    parsed = JSON.parse(jsonTxt);
  } catch {
    throw new Error('El generador no devolvió JSON válido');
  }
  const senales = Array.isArray(parsed.senales) ? parsed.senales.filter((s) => s && s.titulo) : [];
  if (!parsed.public_comment || senales.length < 2) {
    throw new Error('El generador devolvió un análisis incompleto');
  }

  // 8 bytes en base64url: corto para un comentario, y con 2^64 combinaciones
  // nadie va a adivinar la página de otro.
  const shareId = crypto.randomBytes(8).toString('base64url');
  const base = (process.env.PUBLIC_BASE_URL || 'https://linkedin-post-analyzer-production.up.railway.app').replace(/\/$/, '');

  await pool.query(
    `INSERT INTO rastro_analysis
       (share_id, post_id, commenter_name, commenter_headline, commenter_profile_id,
        sector, teaser, full_analysis, public_comment)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      shareId,
      input.postId,
      input.commenterName,
      input.commenterHeadline,
      input.commenterProfileId,
      parsed.sector || 'generico',
      JSON.stringify(senales[0]),
      JSON.stringify(senales),
      parsed.public_comment,
    ]
  );

  const shareUrl = `${base}/r/${shareId}`;
  return {
    shareId,
    shareUrl,
    sector: parsed.sector || 'generico',
    // El enlace se pega por código y no lo escribe el modelo: así no se lo
    // inventa ni lo deforma, que es exactamente lo que hace con las URLs.
    publicComment: `${parsed.public_comment.trim()}\n\nLas otras ${senales.length - 1} las tienes aquí: ${shareUrl}`,
    teaser: senales[0],
    full: senales,
  };
}
