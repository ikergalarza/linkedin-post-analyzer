export function normalizeLinkedInUrl(url: string): string {
  let cleaned = url.trim();
  if (!cleaned.startsWith('http')) {
    cleaned = 'https://' + cleaned;
  }
  // Remove trailing slash and query params
  cleaned = cleaned.split('?')[0].replace(/\/+$/, '');
  // Ensure https
  cleaned = cleaned.replace(/^http:/, 'https:');
  return cleaned;
}

export function isValidLinkedInUrl(url: string): boolean {
  // LinkedIn slugs can contain percent-encoded chars (e.g. emojis like
  // %F0%9F%90%9D for 🐝) and decoded Unicode if the browser passed it
  // through. Accept anything after /in/ or /company/ that isn't a URL
  // separator — `[a-zA-Z0-9_-]` was too narrow and rejected valid profiles.
  return /linkedin\.com\/(in|company)\/[^\/?#\s]+/.test(url);
}
