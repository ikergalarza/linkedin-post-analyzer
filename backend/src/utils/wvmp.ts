/**
 * Walks a WVMP raw_response and pulls every viewer's viewedAt as ms-epoch.
 *
 * LinkedIn's WVMP schema does NOT carry a numeric viewedAt on each element
 * anymore (it used to). What it does carry is a localized human-readable
 * relative string buried at:
 *
 *   element.content.analyticsEntityLockup.entityLockup.caption.text
 *
 * with values like "Viewed 1m ago", "Viewed 5h ago", "Viewed 2d ago",
 * "Viewed 3w ago", "Viewed 4mo ago", "Viewed 1y ago" (English locale) or
 * the Spanish equivalents. We parse the relative span and subtract from
 * "now" — accurate to the unit LinkedIn surfaces (~minute precision for
 * recent viewers, day precision once you're past a week).
 *
 * Numeric viewedAt fields (`viewedAt`, `viewerActorViewedAt`, etc.) are
 * still tried first for forward compatibility in case LinkedIn rotates
 * the schema back to numeric epoch values for some accounts.
 *
 * Returns ms-epoch numbers filtered to the last 365 days.
 */
export function extractViewerTimestamps(rawResponse: any, nowMs: number = Date.now()): number[] {
  const elements: any[] =
    rawResponse?.data?.data?.premiumDashAnalyticsObjectByAnalyticsEntity?.elements ??
    rawResponse?.data?.premiumDashAnalyticsObjectByAnalyticsEntity?.elements ??
    rawResponse?.premiumDashAnalyticsObjectByAnalyticsEntity?.elements ??
    [];
  if (!Array.isArray(elements)) return [];

  const out: number[] = [];
  const yearAgo = nowMs - 365 * 86400_000;

  for (const el of elements) {
    if (!el || typeof el !== 'object') continue;

    // First: numeric fields (legacy schema). Cheap to check, and forward-
    // compatible if LinkedIn changes back.
    const numericCandidates: unknown[] = [
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
    for (const c of numericCandidates) {
      if (typeof c !== 'number' || !Number.isFinite(c) || c <= 0) continue;
      const ms = c > 1e12 ? c : c * 1000;
      if (ms >= yearAgo && ms <= nowMs + 86400_000) {
        pickedMs = ms;
        break;
      }
    }

    // Fallback: parse the "Viewed Xm ago" caption.
    if (pickedMs === null) {
      const captionText: string | undefined =
        el?.content?.analyticsEntityLockup?.entityLockup?.caption?.text ??
        el?.analyticsEntityLockup?.entityLockup?.caption?.text ??
        el?.entityLockup?.caption?.text ??
        el?.caption?.text;
      if (typeof captionText === 'string' && captionText.length > 0) {
        pickedMs = parseRelativeViewedAt(captionText, nowMs);
      }
    }

    if (pickedMs !== null && pickedMs >= yearAgo && pickedMs <= nowMs + 86400_000) {
      out.push(pickedMs);
    }
  }
  return out;
}

/**
 * Parse a localized "Viewed N <unit> ago" string into a ms-epoch by
 * subtracting from nowMs.
 *
 * Recognised units (matched longest-first so "mo" wins over "m"):
 *   mo / month / mes  → 30 days
 *   y  / year  / año  → 365 days
 *   w  / week  / sem  → 7 days
 *   d  / day   / día  → 1 day
 *   h  / hour  / hora → 1 hour
 *   m  / min   / minuto → 1 minute
 *   s  / sec   / seg  → 1 second (rare)
 *
 * Returns null if no recognised unit is found.
 */
function parseRelativeViewedAt(text: string, nowMs: number): number | null {
  const lower = text.toLowerCase();
  // Order in the alternation matters: "mo" must come before "m", and the
  // longer English words must come before their abbreviated forms so the
  // regex doesn't grab a prefix. Spanish equivalents in the same set.
  const re = /(\d+)\s*(months?|month|mo|años?|year?s?|y|weeks?|w|sem(?:ana)?s?|days?|d|días?|hours?|h|horas?|minutes?|min|m|minutos?|seconds?|sec|s|segundos?)/i;
  const m = lower.match(re);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 0) return null;
  const unit = m[2].toLowerCase();

  const MS_MIN = 60_000;
  const MS_HR = 3_600_000;
  const MS_DAY = 86_400_000;

  let perUnit = 0;
  if (/^(mo|month|months|mes|meses)$/.test(unit)) perUnit = 30 * MS_DAY;
  else if (/^(y|year|years|año|años)$/.test(unit)) perUnit = 365 * MS_DAY;
  else if (/^(w|week|weeks|sem|semana|semanas)$/.test(unit)) perUnit = 7 * MS_DAY;
  else if (/^(d|day|days|día|días|dia|dias)$/.test(unit)) perUnit = MS_DAY;
  else if (/^(h|hour|hours|hora|horas)$/.test(unit)) perUnit = MS_HR;
  else if (/^(m|min|minute|minutes|minuto|minutos)$/.test(unit)) perUnit = MS_MIN;
  else if (/^(s|sec|second|seconds|segundo|segundos)$/.test(unit)) perUnit = 1000;

  if (perUnit === 0) return null;
  return nowMs - n * perUnit;
}
