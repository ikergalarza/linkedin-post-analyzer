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
function stretchLastVowel(word: string, times: number): string {
  const m = word.match(/^(.*?)([aeiouáéíóú])([^aeiouáéíóú]*)$/i);
  if (!m) return word;
  const [, head, vowel, tail] = m;
  // The EXTRA copies are lowercase, always. When the stretched vowel is a
  // capital ("Ep" — the vowel is the first letter), repeating it verbatim
  // gives "EEEp", which reads as shouting at someone we're cold-messaging.
  // "Eeep" is the thing a person actually types.
  return head + vowel + vowel.toLowerCase().repeat(Math.max(0, times - 1)) + tail;
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
  opts: { recent?: string[]; rng?: () => number } = {}
): { text: string; variant: string } {
  const rng = opts.rng ?? Math.random;
  const recent = opts.recent ?? [];
  const pool = REPLY_VARIANTS.filter((v) => !recent.includes(v.text));
  const chosen = pick(pool.length > 0 ? pool : REPLY_VARIANTS, rng);

  let text = chosen.text;
  // Stretch roughly 2 of every 3 eligible replies — always is try-hard.
  if (chosen.stretch && rng() < 0.66) {
    text = stretchLastVowel(text, 2 + Math.floor(rng() * 2)); // 2–3 repeats
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

// "Hola" → "Holaaa", "Ey" → "Eyyy". Stretching the greeting is what turns a
// dry mail-merge open into something a person would type. For "Ey" the letter
// that stretches is the y, not a vowel, so it's handled apart.
function stretchGreeting(g: string, rng: () => number): string {
  const n = 2 + Math.floor(rng() * 2); // 2–3 extra chars
  if (/y$/i.test(g)) return g + 'y'.repeat(n);
  return stretchLastVowel(g, n + 1);
}

// ──────────────────────────────── DM variants ────────────────────────────────

// Shapes for the private message, built from the reference the user gave:
//   "Hola XXNOMBREXX! Te dejo el recurso sobre XXTEMAXX por aquí: XXENLACEXX
//    Espero que te sirva XXEMOJIXX"
// Same skeleton (greeting → here's the resource → link → sign-off), reworded
// so a batch doesn't read identical. `{g}` greeting, `{t}` topic, `{l}` link.
const DM_BODIES = [
  'Te dejo el recurso sobre {t} por aquí: {l}',
  'Aquí lo tienes, el recurso sobre {t}: {l}',
  'Va para ti el recurso sobre {t}: {l}',
  'Como prometido, el recurso sobre {t}: {l}',
  'Te paso el recurso sobre {t}: {l}',
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
  rng?: () => number;
}

// The full private message. The greeting carries the first name when we could
// extract one; when we couldn't, the greeting stands alone ("Holaaa!") rather
// than risking a wrong name.
export function buildDm(input: DmInput): string {
  const rng = input.rng ?? Math.random;
  const g = stretchGreeting(baseGreeting(input.location, rng), rng);
  const name = firstName(input.name);
  const open = name ? `${g} ${name}!` : `${g}!`;
  const body = pick(DM_BODIES, rng).replace('{t}', input.topic).replace('{l}', input.link);
  const signoff = `${pick(DM_SIGNOFFS, rng)} ${pick(DM_EMOJIS, rng)}`;
  return `${open} ${body}\n${signoff}`;
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
  const g = stretchGreeting(baseGreeting(input.location, rng), rng);
  const name = firstName(input.name);
  const open = name ? `${g} ${name}!` : `${g}!`;
  const note = `${open} Comentaste en mi post, te dejo el recurso sobre ${input.topic}: ${input.link}`;
  if (note.length <= 300) return note;
  // Too long → drop the topic, never the link.
  return `${open} Comentaste en mi post, te dejo el recurso: ${input.link}`.slice(0, 300);
}

// Does this comment deserve a real, written answer instead of "Enviado!"?
//
// The signal is a question mark plus enough words to be an actual question —
// someone who typed "MAPA" and nothing else gets the template; someone who
// typed "MAPA, ¿cubre también Gipuzkoa?" gets the AI button. The keyword
// itself is stripped first so "¿MAPA?" alone doesn't trip it.
export function hasQuestion(text: string, keyword: string): boolean {
  const withoutKeyword = normalize(text).replace(normalize(keyword), ' ');
  if (!/[?¿]/.test(withoutKeyword)) return false;
  const words = withoutKeyword.replace(/[?¿!¡.,]/g, ' ').trim().split(/\s+/).filter(Boolean);
  return words.length >= 3;
}
