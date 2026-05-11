/**
 * Strips orphan UTF-16 surrogates from a string. JavaScript / Node uses
 * UTF-16 internally, so emojis like 🐝 are stored as a *pair* (a high
 * surrogate 0xD800-0xDBFF + a low surrogate 0xDC00-0xDFFF). Some posts
 * scraped from LinkedIn contain *lone* halves of these pairs — usually
 * because content was truncated mid-character somewhere upstream, or
 * the source had legacy encoding glitches.
 *
 * When a JSON body containing a lone surrogate is serialised and sent
 * to the Anthropic API, the API rejects it with:
 *   400 invalid_request_error · "no low surrogate in string"
 *
 * Real, well-formed emojis are PRESERVED — only orphan halves get
 * stripped.
 */
export function stripLoneSurrogates(t: string): string {
  if (!t) return '';
  return (
    t
      // Orphan high surrogate (not followed by a low one)
      .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
      // Orphan low surrogate (not preceded by a high one). Using a captured
      // non-surrogate prefix instead of a lookbehind for broad compatibility.
      // eslint-disable-next-line no-misleading-character-class
      .replace(/(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '$1')
  );
}

/**
 * General-purpose sanitiser for free-text we forward to the LLM provider.
 * Strips control chars + lone surrogates and collapses whitespace so the
 * payload stays compact and JSON-safe.
 */
export function sanitizeForLLM(t: string): string {
  if (!t) return '';
  return stripLoneSurrogates(
    t
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Collapse multi-line hooks into a single physical line.
 *
 * LinkedIn truncates the feed preview at the first \n (or at ~210 chars,
 * whichever comes first). A hook split across two short sentences with a
 * line break between them — e.g. "Short sentence one.\nShort sentence two." —
 * gets cut at the \n: "Short sentence one. …see more". The second sentence
 * never reaches the reader.
 *
 * This helper walks from the top of the post and merges consecutive prose
 * lines (no list markers, no blank breaks) into one physical line, then
 * preserves the rest of the post unchanged. So:
 *
 *   "Hook A.\nHook B.\n\nBody"      → "Hook A. Hook B.\n\nBody"
 *   "Hook A line\nHook B line"       → "Hook A line Hook B line"
 *   "Hook\n- bullet"                 → "Hook\n- bullet" (list stops the hook)
 *   "Hook\n\nBody"                   → "Hook\n\nBody"   (already single)
 *
 * Idempotent. Safe to apply on every generated/improved post.
 */
export function ensureSingleLineHook(text: string): string {
  if (!text) return text;

  // ── Step 1: classic collapse of consecutive prose lines (Line A\nLine B). ──
  const lines = text.split('\n');
  if (lines.length <= 1) return text;
  // List markers + numbered items + arrows + tick/cross + emoji-bullets that
  // outlier posts commonly use to start a body section. If line N+1 starts
  // with one, the hook is line N and we leave the structure alone.
  const listMarker = /^([-•▶→↳👉👇✅❌📌💡🔥]|\d+[.)])\s/u;

  let hookEnd = 0;
  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) break;            // blank line → end of hook section
    if (listMarker.test(trimmed)) break; // list begins → end of hook section
    hookEnd = i;
  }

  let normalised = text;
  if (hookEnd > 0) {
    const hookLine = lines
      .slice(0, hookEnd + 1)
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ');
    let restStart = hookEnd + 1;
    while (restStart < lines.length && !lines[restStart].trim()) restStart++;
    const rest = lines.slice(restStart);
    normalised = rest.length === 0 ? hookLine : `${hookLine}\n\n${rest.join('\n')}`;
  }

  // ── Step 2: catch the harder case — two short prose paragraphs at the    ──
  // ── top of the post, separated by a blank line. LinkedIn cuts at the     ──
  // ── first \n\n so this splits the hook in two, and only the first        ──
  // ── sentence reaches the reader. Detect by:                              ──
  //  - both paragraphs are single-line (no internal \n)
  //  - first paragraph ≤ 140 chars
  //  - second paragraph ≤ 140 chars
  //  - combined ≤ 210 chars (fits in the see-more preview window)
  //  - second paragraph ends with an open-loop signal (👇 ? : … ...) OR
  //    starts with a bridge connector ("y ", "pero ", "and ", "but ", etc.)
  //
  // If all match, merge them with ". " into one block. Conservative on
  // purpose — false positives risk eating a deliberate one-line standalone
  // body intro, so we require BOTH a length window and a curiosity tell.
  const parts = normalised.split(/\n\s*\n/);
  if (parts.length >= 2) {
    const p1 = parts[0].trim();
    const p2 = parts[1].trim();
    const isOneLine = (s: string) => !s.includes('\n');
    const lowerP2 = p2.toLowerCase();
    const hasOpenLoop = /(👇|👉|→|↳|\?|:|…|\.\.\.)\s*$/u.test(p2);
    const startsWithBridge = /^(y |y aquí|y casi|pero |pero ahora|aquí |aquí está|aquí tienes|and |but |here is|here's|or )/i.test(lowerP2);
    const fits = p1.length <= 140 && p2.length <= 140 && (p1.length + p2.length + 1) <= 210;
    const looksLikeListStart = listMarker.test(p2);

    if (isOneLine(p1) && isOneLine(p2) && fits && !looksLikeListStart && (hasOpenLoop || startsWithBridge)) {
      // Merge p1 + p2 with ". " unless p1 already ends with sentence punctuation,
      // in which case use a single space.
      const sep = /[.!?…]\s*$/.test(p1) ? ' ' : '. ';
      const mergedHook = (p1 + sep + p2).replace(/\s+/g, ' ').trim();
      const restParts = parts.slice(2);
      return restParts.length > 0 ? `${mergedHook}\n\n${restParts.join('\n\n')}` : mergedHook;
    }
  }

  return normalised;
}
