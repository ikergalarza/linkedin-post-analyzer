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
