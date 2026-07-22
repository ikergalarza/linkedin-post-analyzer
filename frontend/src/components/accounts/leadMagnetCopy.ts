// Copy engine for the Lead Magnet tab.
//
// Everything here is DETERMINISTIC — no model call. A lead magnet reply is
// "Enviado!"; there's nothing for an LLM to reason about, and a template is
// instant, free, and can't drift off-brand. The variety that keeps it from
// reading like a bot comes from three cheap moves: rotate the variant, stretch
// a vowel, sometimes add one emoji.
//
// The AI path still exists in the panel, but only as an explicit button on the
// comments that actually earned it (someone who asked a real question next to
// the keyword) — that goes through the existing /generate endpoint.

// ─────────────────────────── keyword matching ───────────────────────────

// Strip accents + lowercase, so "MAPA" matches "mapa", "Mapa" and "mapá".
function normalize(s: string): string {
  // ̀-ͯ is the combining-diacritics block: after NFD, "á" is "a" +
  // U+0301, so dropping the block leaves the bare letter. Written as escapes
  // on purpose — literal combining marks here are invisible in a diff and
  // die on the first encoding mishap.
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Does this comment contain the keyword as a WHOLE WORD?
//
// Whole-word, not substring: "MAPA" must not match "mapamundi", and a keyword
// like "IA" would otherwise hit every "financiera" in the thread. The bounds
// are hand-rolled rather than \b because \b is ASCII-only in JS — it would
// break on a keyword with ñ or an accent.
export function matchesKeyword(text: string, keyword: string): boolean {
  const k = normalize(keyword).trim();
  if (!k) return false;
  const t = normalize(text);
  const isWordChar = (c: string | undefined) => !!c && /[a-z0-9]/.test(c);
  let from = 0;
  for (;;) {
    const i = t.indexOf(k, from);
    if (i === -1) return false;
    if (!isWordChar(t[i - 1]) && !isWordChar(t[i + k.length])) return true;
    from = i + 1;
  }
}

// ──────────────────────────── name extraction ────────────────────────────

// "Mario Carrillo Pérez" → "Mario". The DM opens with the first name, never
// the full display name (nobody says "Hola Mario Carrillo Pérez").
//
// Returns null when the name is unusable, and the caller then drops the name
// slot entirely rather than guessing — a mangled "Hola Ceo!" is worse than a
// plain "Holaaa!". Unusable means: emoji/decoration only, or an all-caps
// token that's really a title.
export function firstName(fullName: string | null | undefined): string | null {
  if (!fullName) return null;
  // Drop the noise people staple to their LinkedIn name: separators
  // ("| Growth @Acme"), parentheticals ("(she/her)"), and any emoji.
  // The separators and the emoji are two passes because they need
  // different matching — a literal set vs. the Unicode property. Emoji are
  // deliberately NOT listed literally: \p{Extended_Pictographic} already
  // covers every one of them, and spelling a few out by hand only invites
  // stray variation selectors into the character class.
  const cleaned = fullName
    .replace(/[|·•‣]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[\p{Extended_Pictographic}️]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const first = cleaned.split(' ')[0] || '';
  if (first.length < 2) return null;
  // Letters only (accents and ñ included) — rejects "CEO", "Dr.", "@handle".
  if (!/^[\p{L}][\p{L}'’-]*$/u.test(first)) return null;
  // ALL-CAPS multi-letter token → almost always a title, not a name.
  if (first.length > 1 && first === first.toUpperCase() && first !== first.toLowerCase()) return null;
  // Normalize "mario" → "Mario", per hyphen-separated part so "Jean-Luc"
  // survives as "Jean-Luc" instead of being flattened to "Jean-luc".
  return first
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
    .join('-');
}

// ───────────────────────────── vowel stretching ─────────────────────────────

// "Hola" → "Holaaa", "Listo" → "Listooo". Stretches the LAST vowel of the
// word, which is where the emphasis naturally lands in Spanish. Same trick
// replyGenerator's RULE 12 asks the model for, done in code because here the
// input is a fixed vocabulary.
// `total` is how many copies of the vowel end up in the word, not how many
// get added: total=2 turns "Hola" into "Holaa".
function stretchLastVowel(word: string, total: number): string {
  const m = word.match(/^(.*?)([aeiouáéíóú])([^aeiouáéíóú]*)$/i);
  if (!m) return word;
  const [, head, vowel, tail] = m;
  // The EXTRA copies are lowercase, always. When the stretched vowel is a
  // capital ("Ep" — the vowel is the first letter), repeating it verbatim
  // gives "EEEp", which reads as shouting at someone we're cold-messaging.
  // "Eeep" is the thing a person actually types.
  return head + vowel + vowel.toLowerCase().repeat(Math.max(0, total - 1)) + tail;
}

// ─────────────────────────────── voice per founder ───────────────────────────

// Cuánto se alarga la vocal. Es un RASGO DE VOZ de la persona cuya cuenta
// publica, no un ajuste global, y va en escala:
//
//   sobrio (Unai) > medio (Asier) > cercano (Iker)
//
// Unai es el FUNDADOR: firma él y nuestro lector es un director industrial de
// ~50 años, así que "Holaaaa" no es él. Iker es el más cercano de los tres.
//
// TWIN: backend/src/services/replyGenerator.ts tiene la misma escala
// (voiceForAuthor) para las respuestas a comentarios. Son paquetes separados
// sin módulo común: si cambia el reparto, hay que tocar los dos.
export type Voice = 'sobrio' | 'medio' | 'cercano';

// Se compara por el nombre de pila porque es lo que guarda la tabla creators y
// lo que ya enseña la UI. Un desconocido cae en 'medio', que es el menos
// equivocado de los tres: una cuenta nueva nunca debe heredar en silencio la
// voz de otro.
export function voiceFor(creatorName: string | null | undefined): Voice {
  const first = (creatorName || '').trim().split(/\s+/)[0]?.toLowerCase();
  if (first === 'unai') return 'sobrio';
  if (first === 'iker') return 'cercano';
  return 'medio';
}

// ────────────────────────────── reply variants ──────────────────────────────

// The user's own list. `stretch: false` marks the ones where stretching reads
// wrong ("Revisa tu DM" → "Revisaaa tu DM" is not a thing anyone says).
const REPLY_VARIANTS: { text: string; stretch: boolean }[] = [
  { text: 'Enviado', stretch: true },
  { text: 'Ya está', stretch: false },
  { text: 'Ya lo tienes', stretch: false },
  { text: 'Hecho', stretch: true },
  { text: 'Mandado', stretch: true },
  { text: 'Listo', stretch: true },
  { text: 'Entregado', stretch: true },
  { text: 'Emitido', stretch: true },
  { text: 'Remitido', stretch: true },
  { text: 'Te lo he pasado', stretch: false },
  { text: 'Te lo he mandado', stretch: false },
  { text: 'Revisa tu DM', stretch: false },
  { text: 'Mira tu DM', stretch: false },
];

const REPLY_EMOJIS = ['🙌', '🔥', '💪', '✅', '🚀', '😊', '👌'];

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// Build one reply. `recent` is the variants already used on THIS post — we
// avoid them so a run of 40 comments doesn't show "Enviado!" eight times in
// a row, which is the exact thing that makes it read as a bot. Once every
// variant is spent the caller resets the list.
export function buildReply(
  opts: { recent?: string[]; rng?: () => number; voice?: Voice } = {}
): { text: string; variant: string } {
  const rng = opts.rng ?? Math.random;
  const recent = opts.recent ?? [];
  const voice = opts.voice ?? 'medio';
  const pool = REPLY_VARIANTS.filter((v) => !recent.includes(v.text));
  const chosen = pick(pool.length > 0 ? pool : REPLY_VARIANTS, rng);

  let text = chosen.text;
  // Stretch roughly 2 of every 3 eligible replies — always is try-hard.
  if (chosen.stretch && rng() < 0.66) {
    // Unai y Asier paran en "Enviadoo"; Iker mantiene los 2-3 de siempre.
    const total = voice === 'cercano' ? 2 + Math.floor(rng() * 2) : 2;
    text = stretchLastVowel(text, total);
  }
  // "!" on about half. Some variants read better flat ("Ya está").
  if (rng() < 0.5) text += '!';
  // One emoji on about a third, never two.
  if (rng() < 0.35) text += ` ${pick(REPLY_EMOJIS, rng)}`;

  return { text, variant: chosen.text };
}

// ────────────────────────────── regional greeting ──────────────────────────

// Region-aware greeting, ONLY when the profile location is unambiguous.
//
// The location LinkedIn gives us is free text the person typed ("Bilbao y
// alrededores", "Greater Barcelona Area"), so this is a whitelist of cities
// and provinces, not a parser. Anything not on the list → neutral. That's the
// deliberate bias: a "kaixo" to someone who isn't from Euskadi lands worse
// than a plain "holaaa", and the DM is the door to the lead — not the place
// to be clever. The greetings themselves are the soft, everyday ones ("ep",
// "kaixo"), never the formal ones.
const REGIONS: { keys: string[]; greetings: string[] }[] = [
  {
    keys: ['bilbao', 'bizkaia', 'vizcaya', 'donostia', 'san sebastian', 'gipuzkoa',
           'guipuzcoa', 'vitoria', 'gasteiz', 'araba', 'alava', 'euskadi',
           'pais vasco', 'basque country', 'getxo', 'barakaldo', 'irun'],
    greetings: ['Kaixo', 'Aupa'],
  },
  {
    keys: ['barcelona', 'girona', 'gerona', 'lleida', 'lerida', 'tarragona',
           'catalunya', 'cataluna', 'catalonia', 'sabadell', 'terrassa',
           'badalona', 'hospitalet', 'manresa', 'reus'],
    greetings: ['Ep', 'Bon dia'],
  },
  {
    keys: ['valencia', 'valència', 'castellon', 'castello', 'alicante',
           'alacant', 'comunitat valenciana', 'comunidad valenciana', 'gandia',
           'elx', 'elche'],
    greetings: ['Ei', 'Bon dia'],
  },
];

const NEUTRAL_GREETINGS = ['Hola', 'Ey'];

// Pick the greeting word (no name yet, no stretching yet).
function baseGreeting(location: string | null | undefined, rng: () => number): string {
  if (location) {
    const loc = normalize(location);
    for (const r of REGIONS) {
      // Whole-word check so "Alava" doesn't fire on "Palavas".
      if (r.keys.some((k) => matchesKeyword(loc, k))) {
        // Even on a hit, stay neutral a third of the time: two DMs to the
        // same city shouldn't both open in Basque, and it keeps the whole
        // batch from reading as a mail merge with a locale column.
        if (rng() < 0.66) return pick(r.greetings, rng);
        return pick(NEUTRAL_GREETINGS, rng);
      }
    }
  }
  return pick(NEUTRAL_GREETINGS, rng);
}

// "Hola" → "Holaaa" / "Holaa". Stretching the greeting is what turns a dry
// mail-merge open into something a person would type. For "Ey" the letter that
// stretches is the y, not a vowel, so it's handled apart.
//
// `total` counts the final letters, so it lines up with buildReply. Sober is a
// flat 2 ("Holaa", "Eyy", "Kaixoo"); 'cercano' (Iker) keeps 3–4, which is what this has
// always produced.
function stretchGreeting(g: string, rng: () => number, voice: Voice): string {
  const total = voice === 'cercano' ? 3 + Math.floor(rng() * 2) : 2;
  if (/y$/i.test(g)) return g + 'y'.repeat(Math.max(0, total - 1));
  return stretchLastVowel(g, total);
}

// ──────────────────────────────── DM variants ────────────────────────────────

// Shapes for the private message, built from the reference the user gave:
//   "Hola XXNOMBREXX! Te dejo el recurso sobre XXTEMAXX por aquí: XXENLACEXX
//    Espero que te sirva XXEMOJIXX"
// Same skeleton (greeting → here's the resource → link → sign-off), reworded
// so a batch doesn't read identical. `{t}` is the topic.
//
// The link is NOT in these strings — it goes on its own line (see buildDm).
// A URL is one unbreakable token, and LinkedIn's message pane drops it onto
// a new line together with whatever word precedes it, so "…comercial por /
// aquí: <link>" is what the recipient actually sees. Owning the break means
// LinkedIn has nothing left to wrap, and a link on its own line is how a
// person sends one anyway.
const DM_BODIES = [
  'Te dejo el recurso sobre {t} por aquí:',
  'Aquí lo tienes, el recurso sobre {t}:',
  'Va para ti el recurso sobre {t}:',
  'Como te prometí, el recurso sobre {t}:',
  'Te paso el recurso sobre {t}:',
];

const DM_SIGNOFFS = [
  'Espero que te sirva',
  'Espero que te venga bien',
  'Ojalá te sea útil',
  'Cualquier cosa me dices',
  'Me cuentas qué te parece',
];

const DM_EMOJIS = ['🙌', '💪', '🚀', '😊', '🔥', '👌'];

export interface DmInput {
  name: string | null;
  location?: string | null;
  topic: string;
  link: string;
  // Whose account is writing. Defaults to 'medio' so a caller that forgets it
  // gets the long-standing behaviour, never a voice that isn't theirs.
  voice?: Voice;
  rng?: () => number;
}

// The full private message. The greeting carries the first name when we could
// extract one; when we couldn't, the greeting stands alone ("Holaaa!") rather
// than risking a wrong name.
export function buildDm(input: DmInput): string {
  const rng = input.rng ?? Math.random;
  const g = stretchGreeting(baseGreeting(input.location, rng), rng, input.voice ?? 'medio');
  const name = firstName(input.name);
  const open = name ? `${g} ${name}!` : `${g}!`;
  // replaceAll with a function: a plain string replacement would interpret
  // "$&"/"$'" inside the topic as substitution patterns.
  const body = pick(DM_BODIES, rng).replaceAll('{t}', () => input.topic);
  const signoff = `${pick(DM_SIGNOFFS, rng)} ${pick(DM_EMOJIS, rng)}`;
  // Link on its own line, sign-off after a blank one. See DM_BODIES for why
  // the link can't share a line with the text.
  return `${open} ${body}\n${input.link}\n\n${signoff}`;
}

// The invitation note — same job as the DM, for people we can't DM because
// they aren't a 1st-degree connection.
//
// LinkedIn hard-rejects a note over 300 characters, so this is deliberately
// terser than the DM: greeting, one line of context (they commented, this is
// the thing), the link. No sign-off. The backend truncates as a backstop, but
// arriving pre-trimmed means the link is never what gets cut.
export function buildInviteNote(input: DmInput): string {
  const rng = input.rng ?? Math.random;
  const g = stretchGreeting(baseGreeting(input.location, rng), rng, input.voice ?? 'medio');
  const name = firstName(input.name);
  const open = name ? `${g} ${name}!` : `${g}!`;
  const note = `${open} Comentaste en mi post, te dejo el recurso sobre ${input.topic}: ${input.link}`;
  if (note.length <= 300) return note;
  // Too long → drop the topic, never the link.
  return `${open} Comentaste en mi post, te dejo el recurso: ${input.link}`.slice(0, 300);
}

// ──────────────────────────── lista personalizada ───────────────────────────
//
// El lead magnet "lista": la persona comenta «lista» + su sector, y le mandamos
// por DM una lista de empresas reales de ese sector. El backend
// (/lead-magnet/lista) trae las empresas reales; aquí se extrae el sector del
// comentario y se formatea el DM en la voz de la cuenta, como el resto del panel.

export interface ListaCompany {
  name: string;
  zona: string | null;
  linkedinUrl: string;
}

// "lista automoción porfa" → "automoción". Quita la palabra clave y el relleno,
// deja lo que la persona escribió como sector. Conserva acentos (usa la palabra
// original, no la normalizada) porque la búsqueda de Unipile los tolera y se ve
// mejor en el DM. Vacío si solo comentó la palabra clave.
export function extractSector(text: string, keyword: string): string {
  const k = normalize(keyword).trim();
  const raw = (text || '').trim();
  if (!raw) return '';
  const kept = raw.split(/\s+/).filter((w) => {
    const n = normalize(w).replace(/[^\p{L}\p{N}]/gu, '');
    if (!n) return false;
    if (n === k) return false;
    return !FILLER.has(n);
  });
  // Deja letras/números/espacios y los separadores que un sector real puede
  // llevar ("i+d", "auto-moción"); fuera emoji y puntuación suelta.
  return kept.join(' ').replace(/[^\p{L}\p{N}\s+.&/-]/gu, '').replace(/\s+/g, ' ').trim();
}

// "https://www.linkedin.com/company/gestamp/" → "linkedin.com/company/gestamp",
// que es como se lee un enlace en un DM sin ocupar dos líneas.
function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

export interface ListaInput {
  name: string | null;
  sector: string;
  companies: ListaCompany[];
  location?: string | null;
  voice?: Voice;
  rng?: () => number;
}

// El "spam ninja" del DM. El lead magnet "lista" NO crea web ni gate, así que el
// DM es el único sitio donde capturar hacia producto: sin esto regalamos la
// lista y no llevamos a nadie a ningún lado (el error del 8.52x "desmonto
// perfiles" — se hizo viral y capturó CERO). Apunta a `agendar`, el destino
// canónico del spam ninja (global §4.4b).
//
// Diferencia clave con el POST: en el post público el lead magnet NO lleva spam
// ninja (apilaría CTAs y hundiría los comentarios, global §4.4b). Aquí es un DM
// PRIVADO a alguien que ya comentó y ya tiene su recurso, así que un funnel al
// final no compite con nada. Y nombrar Neety SÍ vale: es un mensaje personal,
// no un post (donde la marca delataría el guiño). Una sola mención, sin vender
// (brand-voice §4). Cierra el "a quién" que da la lista con el "cuándo" que es
// justo lo que hace el producto.
// El enlace va con https:// (no la versión "bonita" sin protocolo): LinkedIn
// solo genera la tarjeta de preview del recurso si el enlace lleva https. Los 15
// de las empresas van SIN protocolo a propósito (prettyUrl), para que no compitan
// por la preview y la tarjeta que salga sea la de señales.
const NINJA_DM =
  'PD: la lista es a quién vender. Cuándo escribirle a cada una (la señal que dispara la compra) lo tienes aquí: https://recursos.neety.com/senales';

// El DM con la lista entera, para 1er grado. Abre con el saludo regional (mismo
// que buildDm), dice el número REAL de empresas (no "15" fijo), lista cada una
// con su zona y su LinkedIn, y cierra con el spam ninja hacia agendar.
export function buildListaDm(input: ListaInput): string {
  const rng = input.rng ?? Math.random;
  const g = stretchGreeting(baseGreeting(input.location, rng), rng, input.voice ?? 'medio');
  const name = firstName(input.name);
  const open = name ? `${g} ${name}!` : `${g}!`;
  const n = input.companies.length;
  const cuenta = n === 1
    ? '1 empresa activa a la que puedes vender, con dónde está y su LinkedIn'
    : `${n} empresas activas a las que puedes vender, con dónde están y su LinkedIn`;
  const intro = `${open} Aquí tienes tu lista de ${input.sector}.\n${cuenta}:`;
  const lines = input.companies
    .map((c) => `→ ${c.name}${c.zona ? ` · ${c.zona}` : ''}\n   ${prettyUrl(c.linkedinUrl)}`)
    .join('\n');
  const close = 'Escríbeles por lo que venden, no por el nombre: es lo que abre la puerta.';
  return `${intro}\n\n${lines}\n\n${close}\n\n${NINJA_DM}`;
}

// La nota de invitación, para quien no es 1er grado.
//
// La lista ENTERA no cabe: LinkedIn corta la nota a 300 caracteres (es su tope,
// NO el InMail de pago — la solicitud con nota es gratis y sin cupo con Premium).
// Así que la nota lleva un ADELANTO real (los primeros nombres + "y N más") y la
// lista completa se manda por DM en cuanto la persona acepte y sea 1er grado.
//
// El adelanto se llena avaramente: se meten nombres reales mientras quepan bajo
// 300 con el cierre, y el resto se cuenta ("y 12 más"). Si ni un nombre cabe
// (sector con nombres larguísimos), cae a la nota sin adelanto.
export function buildListaInvite(
  input: { name: string | null; sector: string; companies: ListaCompany[]; location?: string | null; voice?: Voice; rng?: () => number }
): string {
  const rng = input.rng ?? Math.random;
  const g = stretchGreeting(baseGreeting(input.location, rng), rng, input.voice ?? 'medio');
  const name = firstName(input.name);
  const open = name ? `${g} ${name}!` : `${g}!`;
  const total = input.companies.length;

  const head = `${open} Aquí va tu lista de ${input.sector}: `;
  const cierre = (resto: number) =>
    resto > 0
      ? ` y ${resto} más. Acéptame y te la mando entera con su LinkedIn.`
      : `. Acéptame y te la mando entera con su LinkedIn.`;

  const nombres: string[] = [];
  let usado = head.length;
  for (const c of input.companies) {
    const trozo = (nombres.length ? ', ' : '') + c.name;
    // Reserva sitio para el cierre con el número de "más" que quedaría.
    if (usado + trozo.length + cierre(total - nombres.length - 1).length > 300) break;
    nombres.push(c.name);
    usado += trozo.length;
  }

  // Ni un nombre cabe → nota sin adelanto (sigue siendo gratis y honesta).
  if (nombres.length === 0) {
    const plana = `${open} Te monto la lista de ${input.sector} que pediste. Acéptame y te la paso entera por aquí.`;
    return plana.slice(0, 300);
  }

  const resto = total - nombres.length;
  const note = head + nombres.join(', ') + cierre(resto);
  return note.length <= 300 ? note : note.slice(0, 300);
}

// Words that are NOT content: someone typing "MAPA porfa gracias!!" wrote the
// keyword and nothing else, however many words it technically is.
const FILLER = new Set([
  'porfa', 'porfavor', 'favor', 'por', 'gracias', 'graciass', 'grac', 'plis',
  'please', 'quiero', 'me', 'lo', 'la', 'el', 'interesa', 'interesada',
  'interesado', 'apunto', 'apuntado', 'yo', 'tambien', 'gustaria', 'dale',
  'va', 'vamos', 'si', 'sii', 'claro', 'genial', 'top', 'crack', 'grande',
  'gran', 'buen', 'bueno', 'buena', 'brutal', 'mucho', 'muy', 'un', 'una',
  'y', 'a', 'de', 'que', 'en', 'con', 'para', 'mil', 'eso', 'esto',
]);

// Does this comment deserve a written answer, or is "Enviado!" the whole of it?
//
//   'plain' — the keyword and nothing more ("MAPA", "MAPA porfa!", "MAPA 🙌").
//             The template IS the right answer; there's nothing to engage with.
//   'rich'  — they wrote something real next to the keyword: a question, an
//             opinion, their own experience. This is the best comment on the
//             post and answering it with "remitido!" wastes it.
//
// Rich is deliberately NOT "has a question mark". Plenty of the best comments
// never ask anything — they tell you something. So the test is whether any
// CONTENT survives once the keyword, the punctuation, the emoji and the
// filler are stripped out.
export function commentDepth(text: string, keyword: string): 'plain' | 'rich' {
  let rest = normalize(text);
  // Remove every occurrence of the keyword, not just the first.
  const k = normalize(keyword).trim();
  if (k) rest = rest.split(k).join(' ');
  const words = rest
    .replace(/[\p{Extended_Pictographic}️]/gu, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !FILLER.has(w));
  // A question is rich even if short ("¿cubre Gipuzkoa?" → 2 content words),
  // because a question demands an answer no template can give.
  if (/[?¿]/.test(rest) && words.length >= 1) return 'rich';
  return words.length >= 3 ? 'rich' : 'plain';
}
