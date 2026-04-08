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
  return /linkedin\.com\/(in|company)\/[a-zA-Z0-9_-]+/.test(url);
}
