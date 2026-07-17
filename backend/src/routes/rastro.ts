import { Router, Request, Response } from 'express';
import pool from '../db';

// Las páginas públicas del lead magnet "rastro": /r/:shareId
//
// ⚠️ ESTAS RUTAS VAN FUERA DEL BASIC AUTH, y es el punto entero: el enlace se
// pega en un comentario de LinkedIn y lo abre un desconocido que no tiene
// nuestras credenciales. Si alguien las mete detrás del auth, el lead magnet
// muere en silencio (el enlace sale igual y nadie puede abrirlo).
// El mismo diseño que el roaster, donde `/` da 401 y `/r/loquesea` da 404.
//
// El GATE: sin correo se ve la primera señal ENTERA (regalar una de verdad es lo
// que hace que dejen el email) y las demás se ven BLOQUEADAS, no contadas
// (`lead-magnet-web §1`: ni todo ni nada).

const router = Router();

interface Hallazgo {
  titulo: string;
  prioridad: number;
  lo_que_dice: string;
  por_que_pierde: string;
  arreglo: string;
}

// Escapado obligatorio, y aquí MÁS que en ningún sitio: `lo_que_dice` es una cita
// LITERAL de una web cualquiera de internet, elegida por un desconocido, servida
// dentro de nuestro HTML. Sin esto es un XSS con una vía de entrada regalada.
function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Paleta, tarjeta y tipografía: COPIADAS de `neety-gate.zip` (gate.html), que el
// diseñador de neety-resources extrajo de perfil/index.html. NO se tocan a ojo.
//
// ⚠️ LO QUE HABÍA ANTES ERA INVENTADO Y POR ESO SE VEÍA MAL. Escribí --tinta:#0c202e,
// --crema:#f5f0eb, --naranja:#ee9363 de memoria, sin haber visto un recurso real.
// Lo gracioso: los colores estaban CASI bien y el error fue INVERTIRLOS — el sitio
// va en OSCURO (fondo #0A1524, texto #EEF1F6) y yo puse la tinta de texto sobre un
// crema de fondo. De ahí el "está blanca y tiene la paleta a medias" del usuario.
// Acertar los hex y fallar cuál es el papel es igual de roto que fallarlos todos.
const CSS = `
:root{
  --bg:#0A1524; --bg-2:#0F1D30; --surface:#13243B; --surface-2:#17293F;
  --line:rgba(255,255,255,.08); --line-strong:rgba(255,255,255,.14);
  --text:#EEF1F6; --text-dim:#A6B0C1; --text-muted:#6D7A8E;
  --coral:#E89456; --coral-soft:#F0A978; --coral-dim:rgba(232,148,86,.12); --coral-line:rgba(232,148,86,.28);
  --radius:14px; --radius-lg:22px;
}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font:16px/1.55 'Switzer',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px 20px 72px}
.wrap{max-width:680px;margin:0 auto}
.eyebrow{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px}
h1{font-family:'Bricolage Grotesque',sans-serif;font-weight:500;font-size:clamp(26px,5vw,38px);line-height:1.15;letter-spacing:-.02em;margin-bottom:12px}
h1 em{font-style:normal;color:var(--coral)}
.lede{color:var(--text-dim);margin-bottom:28px;max-width:52ch}
.card{background:var(--surface);border:1px solid var(--line-strong);border-radius:var(--radius);padding:20px;margin-bottom:14px}
.card h2{font-family:'Bricolage Grotesque',sans-serif;font-weight:500;font-size:17px;margin-bottom:10px;letter-spacing:-.02em}
.row{display:flex;gap:10px;padding:7px 0;border-top:1px solid var(--line)}
.row:first-of-type{border-top:0}
.k{color:var(--text-muted);font-size:12px;min-width:104px;flex-shrink:0;padding-top:2px}
.v{font-size:14px;color:var(--text-dim)}
.v q{color:var(--text)}
.locked{position:relative;overflow:hidden}
.locked .card{filter:blur(4.5px);opacity:.5;pointer-events:none;user-select:none}
/* La tarjeta del gate. ⚠️ max-width 440px A PROPÓSITO: su .form-card es width:100%
   y su .nf-input también, así que el campo del correo se estira a lo que le des.
   Con los 680px del .wrap salía un input de lado a lado que se veía fatal en
   escritorio. Un formulario compacto y centrado entre tarjetas anchas además hace
   de foco, que es lo que interesa aquí. NADA de selectores
   desnudos (form/input/button): pisarian el formulario que inyecta SU
   neety-form.js, que es el mismo pecado de las reglas .hs-* de las que avisa su
   README. El CSS del formulario es suyo y viene dentro de su fichero. */
.hs-form-container{width:100%}
.gate{width:100%;max-width:440px;background:var(--surface);border:1px solid var(--line-strong);border-radius:var(--radius-lg);padding:32px 28px 28px;margin:22px auto 28px;box-shadow:0 4px 32px rgba(0,0,0,.25),0 0 0 1px var(--line)}
.gate h2{font-family:'Bricolage Grotesque',sans-serif;font-weight:500;font-size:22px;letter-spacing:-.02em;margin-bottom:6px;text-align:center}
.gate>p{font-size:14px;color:var(--text-muted);margin:0 0 20px;text-align:center}
.cierre{border-top:1px solid var(--line);margin-top:32px;padding-top:22px;color:var(--text-dim);font-size:14px}
@media(max-width:560px){
  body{padding:24px 16px 56px}
  .gate{padding:26px 18px 22px;border-radius:var(--radius)}
  /* Las filas son flex con .k a 104px fijos: en móvil eso deja a .v sin sitio y
     parte cada valor en un acordeón de 2 palabras. Apiladas se leen. */
  .row{flex-direction:column;gap:2px}
  .k{min-width:0;padding-top:0}
}
.cta{display:inline-block;margin-top:12px;background:var(--coral);color:#0A1524;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600;font-size:14px}
`;

function hallazgoCard(h: Hallazgo, n: number): string {
  return `<div class="card">
    <h2>${n}. ${esc(h.titulo)}</h2>
    <div class="row"><span class="k">Tu web dice</span><span class="v"><q>${esc(h.lo_que_dice)}</q></span></div>
    <div class="row"><span class="k">Qué te cuesta</span><span class="v">${esc(h.por_que_pierde)}</span></div>
    <div class="row"><span class="k">Qué poner</span><span class="v">${esc(h.arreglo)}</span></div>
  </div>`;
}

function page(opts: { sector: string; nombre: string | null; senales: Hallazgo[]; abierto: boolean; shareId: string; error?: string }): string {
  const { sector, nombre, senales, abierto, shareId } = opts;
  const total = senales.length;
  const visibles = abierto ? senales : senales.slice(0, 1);
  const bloqueadas = abierto ? [] : senales.slice(1);

  // El gate es SU fichero, servido desde recursos.neety.com, no una copia.
  // Aquí solo va el div vacío: neety-form.js lo rellena e inyecta su propio CSS.
  // El <h2>/<p> son copy nuestro; el formulario, sus dos consentimientos y sus
  // textos legales son suyos y no se tocan (ver routes/gateProxy.ts).
  // data-redirect NO se pone: sin él muestra la confirmación inline, que es lo que
  // queremos porque el contenido vive en esta página.
  const gate = abierto
    ? ''
    : `<div class="gate">
        <h2>Los otros ${total - 1} fallos</h2>
        <p>Déjame el correo y se abren aquí mismo. Acceso inmediato, sin esperar ningún email.</p>
        <div class="hs-form-container">
          <div data-neety-form data-resource="auditoria-web" data-cta="Ver los ${total - 1} que quedan"></div>
        </div>
      </div>
      <script src="https://recursos.neety.com/assets/neety-form.js" defer></script>
      <script>
        // Su gate no recarga: avisa por evento. Recargamos para que el servidor
        // vuelva a pintar la página ya abierta, que es quien decide qué se ve.
        document.addEventListener('neety:submitted', function () { location.reload(); });
      </script>`;

  return `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..700&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600,700&display=swap" rel="stylesheet">
<title>Por qué se van de ${esc(sector)} sin pedirte presupuesto · Neety</title>
<style>${CSS}</style></head><body><div class="wrap">
  <p class="eyebrow">Neety · auditoría de ${esc(sector)}</p>
  <h1>${nombre ? `${esc(nombre.split(' ')[0])}, esto` : 'Esto'} es lo que le pasa a un comprador en <em>${esc(sector)}</em>.</h1>
  <p class="lede">Ordenados por lo que te cuestan, no por lo que se ven. Cada uno cita tu propia web: nada de esto es una opinión sobre tu diseño.</p>
  ${visibles.map((s, i) => hallazgoCard(s, i + 1)).join('')}
  ${gate}
  ${bloqueadas.length ? `<div class="locked">${bloqueadas.map((s, i) => hallazgoCard(s, i + 2)).join('')}</div>` : ''}
  <div class="cierre">
    <p>Arregla esto y el que ya entra en tu web te pedirá presupuesto más veces. Pero seguirás dependiendo de que entre, y eso es lo que no controlas.</p>
    <p style="margin-top:10px">Eso es lo que hacemos nosotros: te decimos a qué empresa escribir y cuándo, sin esperar a que te encuentre.</p>
    <a class="cta" href="https://recursos.neety.com/agendar/">Ver cómo funciona →</a>
  </div>
</div></body></html>`;
}

async function cargar(shareId: string) {
  const { rows } = await pool.query(
    'SELECT share_id, commenter_name, sector, full_analysis, email FROM rastro_analysis WHERE share_id = $1',
    [shareId]
  );
  return rows[0] ?? null;
}

// GET /r/:shareId — la página. PÚBLICA.
router.get('/:shareId', async (req: Request, res: Response) => {
  const row = await cargar(String(req.params.shareId));
  if (!row) return res.status(404).type('html').send('<p style="font:16px sans-serif;padding:40px">Este enlace no existe.</p>');
  res.type('html').send(
    page({
      sector: row.sector,
      nombre: row.commenter_name,
      senales: row.full_analysis || [],
      abierto: !!row.email,
      shareId: row.share_id,
    })
  );
});

// POST /r/:shareId — el correo. PÚBLICA.
// Sin JS a propósito: un <form> normal funciona en cualquier navegador, con
// cualquier bloqueador, y no hay estado que se pueda quedar a medias.
router.post('/:shareId', async (req: Request, res: Response) => {
  const row = await cargar(String(req.params.shareId));
  if (!row) return res.status(404).type('html').send('<p>Este enlace no existe.</p>');

  const email = String(req.body?.email || '').trim().toLowerCase();
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!ok) {
    return res.status(400).type('html').send(
      page({
        sector: row.sector,
        nombre: row.commenter_name,
        senales: row.full_analysis || [],
        abierto: false,
        shareId: row.share_id,
        error: 'Ese correo no parece válido.',
      })
    );
  }
  // Solo se guarda el primero: si vuelve a entrar, la página ya está abierta y
  // no tiene sentido pisar el correo con el que teclee la segunda vez.
  if (!row.email) {
    await pool.query('UPDATE rastro_analysis SET email = $1, email_at = NOW() WHERE share_id = $2', [email, row.share_id]);
  }
  res.redirect(303, `/r/${encodeURIComponent(row.share_id)}`);
});

export default router;
