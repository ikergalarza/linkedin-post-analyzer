/**
 * Walks a WVMP raw_response and pulls every viewer's viewedAt timestamp.
 *
 * LinkedIn's Voyager schema rotates field names from time to time, so we
 * try several known candidates and accept either ms-epoch or s-epoch.
 * Returns ms-epoch numbers, filtered to the last 365 days to ignore
 * garbage values (occasionally LinkedIn returns 0 / pre-1970 / future
 * dates for synthetic rows like the "anonymous viewer" teaser).
 */
export function extractViewerTimestamps(rawResponse: any): number[] {
  const elements: any[] =
    rawResponse?.data?.data?.premiumDashAnalyticsObjectByAnalyticsEntity?.elements ??
    rawResponse?.data?.premiumDashAnalyticsObjectByAnalyticsEntity?.elements ??
    rawResponse?.premiumDashAnalyticsObjectByAnalyticsEntity?.elements ??
    [];
  if (!Array.isArray(elements)) return [];

  const out: number[] = [];
  const now = Date.now();
  const yearAgo = now - 365 * 86400_000;

  for (const el of elements) {
    if (!el || typeof el !== 'object') continue;
    const candidates: unknown[] = [
      el.viewedAt,
      el.viewerActorViewedAt,
      el.time,
      el.actionAt,
      el.viewedAtMs,
      el.timestamp,
      el?.actionContext?.actionAt,
      el?.actionContext?.viewedAt,
      el?.viewerInfo?.viewedAt,
    ];
    let pickedMs: number | null = null;
    for (const c of candidates) {
      if (typeof c !== 'number' || !Number.isFinite(c) || c <= 0) continue;
      const ms = c > 1e12 ? c : c * 1000;
      if (ms >= yearAgo && ms <= now + 86400_000) {
        pickedMs = ms;
        break;
      }
    }
    if (pickedMs !== null) out.push(pickedMs);
  }
  return out;
}
