/**
 * Estimates timezone from a LinkedIn location string.
 * LinkedIn locations are typically like "Madrid, Spain", "New York, NY", "London, England, United Kingdom"
 */

interface TimezoneResult {
  timezone: string;   // e.g. "Europe/Madrid"
  utc_offset: number; // e.g. 1 (standard time, not DST)
}

// City-level overrides (take priority)
const cityTimezones: Record<string, TimezoneResult> = {
  // Spain
  'madrid': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'barcelona': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'valencia': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'sevilla': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'seville': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'bilbao': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'malaga': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'zaragoza': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'canarias': { timezone: 'Atlantic/Canary', utc_offset: 0 },
  'las palmas': { timezone: 'Atlantic/Canary', utc_offset: 0 },
  'tenerife': { timezone: 'Atlantic/Canary', utc_offset: 0 },

  // US cities
  'new york': { timezone: 'America/New_York', utc_offset: -5 },
  'los angeles': { timezone: 'America/Los_Angeles', utc_offset: -8 },
  'san francisco': { timezone: 'America/Los_Angeles', utc_offset: -8 },
  'chicago': { timezone: 'America/Chicago', utc_offset: -6 },
  'houston': { timezone: 'America/Chicago', utc_offset: -6 },
  'dallas': { timezone: 'America/Chicago', utc_offset: -6 },
  'austin': { timezone: 'America/Chicago', utc_offset: -6 },
  'denver': { timezone: 'America/Denver', utc_offset: -7 },
  'seattle': { timezone: 'America/Los_Angeles', utc_offset: -8 },
  'miami': { timezone: 'America/New_York', utc_offset: -5 },
  'boston': { timezone: 'America/New_York', utc_offset: -5 },
  'atlanta': { timezone: 'America/New_York', utc_offset: -5 },
  'washington': { timezone: 'America/New_York', utc_offset: -5 },
  'phoenix': { timezone: 'America/Phoenix', utc_offset: -7 },
  'philadelphia': { timezone: 'America/New_York', utc_offset: -5 },
  'san diego': { timezone: 'America/Los_Angeles', utc_offset: -8 },
  'portland': { timezone: 'America/Los_Angeles', utc_offset: -8 },
  'minneapolis': { timezone: 'America/Chicago', utc_offset: -6 },
  'detroit': { timezone: 'America/New_York', utc_offset: -5 },
  'nashville': { timezone: 'America/Chicago', utc_offset: -6 },

  // UK
  'london': { timezone: 'Europe/London', utc_offset: 0 },
  'manchester': { timezone: 'Europe/London', utc_offset: 0 },
  'birmingham': { timezone: 'Europe/London', utc_offset: 0 },
  'edinburgh': { timezone: 'Europe/London', utc_offset: 0 },
  'glasgow': { timezone: 'Europe/London', utc_offset: 0 },

  // France
  'paris': { timezone: 'Europe/Paris', utc_offset: 1 },
  'lyon': { timezone: 'Europe/Paris', utc_offset: 1 },
  'marseille': { timezone: 'Europe/Paris', utc_offset: 1 },

  // Germany
  'berlin': { timezone: 'Europe/Berlin', utc_offset: 1 },
  'munich': { timezone: 'Europe/Berlin', utc_offset: 1 },
  'hamburg': { timezone: 'Europe/Berlin', utc_offset: 1 },
  'frankfurt': { timezone: 'Europe/Berlin', utc_offset: 1 },

  // Italy
  'rome': { timezone: 'Europe/Rome', utc_offset: 1 },
  'milan': { timezone: 'Europe/Rome', utc_offset: 1 },
  'milano': { timezone: 'Europe/Rome', utc_offset: 1 },

  // Netherlands
  'amsterdam': { timezone: 'Europe/Amsterdam', utc_offset: 1 },

  // Portugal
  'lisbon': { timezone: 'Europe/Lisbon', utc_offset: 0 },
  'lisboa': { timezone: 'Europe/Lisbon', utc_offset: 0 },
  'porto': { timezone: 'Europe/Lisbon', utc_offset: 0 },

  // Latin America
  'mexico city': { timezone: 'America/Mexico_City', utc_offset: -6 },
  'ciudad de mexico': { timezone: 'America/Mexico_City', utc_offset: -6 },
  'cdmx': { timezone: 'America/Mexico_City', utc_offset: -6 },
  'guadalajara': { timezone: 'America/Mexico_City', utc_offset: -6 },
  'monterrey': { timezone: 'America/Monterrey', utc_offset: -6 },
  'bogota': { timezone: 'America/Bogota', utc_offset: -5 },
  'bogotá': { timezone: 'America/Bogota', utc_offset: -5 },
  'medellin': { timezone: 'America/Bogota', utc_offset: -5 },
  'medellín': { timezone: 'America/Bogota', utc_offset: -5 },
  'lima': { timezone: 'America/Lima', utc_offset: -5 },
  'buenos aires': { timezone: 'America/Argentina/Buenos_Aires', utc_offset: -3 },
  'santiago': { timezone: 'America/Santiago', utc_offset: -4 },
  'sao paulo': { timezone: 'America/Sao_Paulo', utc_offset: -3 },
  'são paulo': { timezone: 'America/Sao_Paulo', utc_offset: -3 },
  'rio de janeiro': { timezone: 'America/Sao_Paulo', utc_offset: -3 },

  // Asia
  'tokyo': { timezone: 'Asia/Tokyo', utc_offset: 9 },
  'singapore': { timezone: 'Asia/Singapore', utc_offset: 8 },
  'hong kong': { timezone: 'Asia/Hong_Kong', utc_offset: 8 },
  'shanghai': { timezone: 'Asia/Shanghai', utc_offset: 8 },
  'beijing': { timezone: 'Asia/Shanghai', utc_offset: 8 },
  'mumbai': { timezone: 'Asia/Kolkata', utc_offset: 5.5 },
  'delhi': { timezone: 'Asia/Kolkata', utc_offset: 5.5 },
  'new delhi': { timezone: 'Asia/Kolkata', utc_offset: 5.5 },
  'bangalore': { timezone: 'Asia/Kolkata', utc_offset: 5.5 },
  'dubai': { timezone: 'Asia/Dubai', utc_offset: 4 },
  'abu dhabi': { timezone: 'Asia/Dubai', utc_offset: 4 },
  'riyadh': { timezone: 'Asia/Riyadh', utc_offset: 3 },
  'seoul': { timezone: 'Asia/Seoul', utc_offset: 9 },
  'bangkok': { timezone: 'Asia/Bangkok', utc_offset: 7 },
  'jakarta': { timezone: 'Asia/Jakarta', utc_offset: 7 },
  'tel aviv': { timezone: 'Asia/Jerusalem', utc_offset: 2 },
  'istanbul': { timezone: 'Europe/Istanbul', utc_offset: 3 },

  // Oceania
  'sydney': { timezone: 'Australia/Sydney', utc_offset: 10 },
  'melbourne': { timezone: 'Australia/Melbourne', utc_offset: 10 },

  // Canada
  'toronto': { timezone: 'America/Toronto', utc_offset: -5 },
  'vancouver': { timezone: 'America/Vancouver', utc_offset: -8 },
  'montreal': { timezone: 'America/Toronto', utc_offset: -5 },

  // Africa
  'cape town': { timezone: 'Africa/Johannesburg', utc_offset: 2 },
  'johannesburg': { timezone: 'Africa/Johannesburg', utc_offset: 2 },
  'lagos': { timezone: 'Africa/Lagos', utc_offset: 1 },
  'nairobi': { timezone: 'Africa/Nairobi', utc_offset: 3 },
  'cairo': { timezone: 'Africa/Cairo', utc_offset: 2 },

  // Nordics
  'stockholm': { timezone: 'Europe/Stockholm', utc_offset: 1 },
  'copenhagen': { timezone: 'Europe/Copenhagen', utc_offset: 1 },
  'oslo': { timezone: 'Europe/Oslo', utc_offset: 1 },
  'helsinki': { timezone: 'Europe/Helsinki', utc_offset: 2 },

  // Eastern Europe
  'warsaw': { timezone: 'Europe/Warsaw', utc_offset: 1 },
  'prague': { timezone: 'Europe/Prague', utc_offset: 1 },
  'vienna': { timezone: 'Europe/Vienna', utc_offset: 1 },
  'budapest': { timezone: 'Europe/Budapest', utc_offset: 1 },
  'bucharest': { timezone: 'Europe/Bucharest', utc_offset: 2 },
  'athens': { timezone: 'Europe/Athens', utc_offset: 2 },
  'moscow': { timezone: 'Europe/Moscow', utc_offset: 3 },

  // Other
  'zurich': { timezone: 'Europe/Zurich', utc_offset: 1 },
  'geneva': { timezone: 'Europe/Zurich', utc_offset: 1 },
  'brussels': { timezone: 'Europe/Brussels', utc_offset: 1 },
  'dublin': { timezone: 'Europe/Dublin', utc_offset: 0 },
};

// Country-level fallbacks
const countryTimezones: Record<string, TimezoneResult> = {
  // English names
  'spain': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'espana': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'españa': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'united states': { timezone: 'America/New_York', utc_offset: -5 },
  'usa': { timezone: 'America/New_York', utc_offset: -5 },
  'estados unidos': { timezone: 'America/New_York', utc_offset: -5 },
  'united kingdom': { timezone: 'Europe/London', utc_offset: 0 },
  'uk': { timezone: 'Europe/London', utc_offset: 0 },
  'england': { timezone: 'Europe/London', utc_offset: 0 },
  'scotland': { timezone: 'Europe/London', utc_offset: 0 },
  'wales': { timezone: 'Europe/London', utc_offset: 0 },
  'france': { timezone: 'Europe/Paris', utc_offset: 1 },
  'francia': { timezone: 'Europe/Paris', utc_offset: 1 },
  'germany': { timezone: 'Europe/Berlin', utc_offset: 1 },
  'alemania': { timezone: 'Europe/Berlin', utc_offset: 1 },
  'deutschland': { timezone: 'Europe/Berlin', utc_offset: 1 },
  'italy': { timezone: 'Europe/Rome', utc_offset: 1 },
  'italia': { timezone: 'Europe/Rome', utc_offset: 1 },
  'netherlands': { timezone: 'Europe/Amsterdam', utc_offset: 1 },
  'holland': { timezone: 'Europe/Amsterdam', utc_offset: 1 },
  'belgium': { timezone: 'Europe/Brussels', utc_offset: 1 },
  'portugal': { timezone: 'Europe/Lisbon', utc_offset: 0 },
  'ireland': { timezone: 'Europe/Dublin', utc_offset: 0 },
  'switzerland': { timezone: 'Europe/Zurich', utc_offset: 1 },
  'suiza': { timezone: 'Europe/Zurich', utc_offset: 1 },
  'austria': { timezone: 'Europe/Vienna', utc_offset: 1 },
  'sweden': { timezone: 'Europe/Stockholm', utc_offset: 1 },
  'suecia': { timezone: 'Europe/Stockholm', utc_offset: 1 },
  'denmark': { timezone: 'Europe/Copenhagen', utc_offset: 1 },
  'norway': { timezone: 'Europe/Oslo', utc_offset: 1 },
  'finland': { timezone: 'Europe/Helsinki', utc_offset: 2 },
  'poland': { timezone: 'Europe/Warsaw', utc_offset: 1 },
  'czech republic': { timezone: 'Europe/Prague', utc_offset: 1 },
  'czechia': { timezone: 'Europe/Prague', utc_offset: 1 },
  'hungary': { timezone: 'Europe/Budapest', utc_offset: 1 },
  'romania': { timezone: 'Europe/Bucharest', utc_offset: 2 },
  'greece': { timezone: 'Europe/Athens', utc_offset: 2 },
  'grecia': { timezone: 'Europe/Athens', utc_offset: 2 },
  'turkey': { timezone: 'Europe/Istanbul', utc_offset: 3 },
  'turquia': { timezone: 'Europe/Istanbul', utc_offset: 3 },
  'russia': { timezone: 'Europe/Moscow', utc_offset: 3 },
  'rusia': { timezone: 'Europe/Moscow', utc_offset: 3 },

  // Americas
  'mexico': { timezone: 'America/Mexico_City', utc_offset: -6 },
  'méxico': { timezone: 'America/Mexico_City', utc_offset: -6 },
  'canada': { timezone: 'America/Toronto', utc_offset: -5 },
  'canadá': { timezone: 'America/Toronto', utc_offset: -5 },
  'brazil': { timezone: 'America/Sao_Paulo', utc_offset: -3 },
  'brasil': { timezone: 'America/Sao_Paulo', utc_offset: -3 },
  'argentina': { timezone: 'America/Argentina/Buenos_Aires', utc_offset: -3 },
  'colombia': { timezone: 'America/Bogota', utc_offset: -5 },
  'chile': { timezone: 'America/Santiago', utc_offset: -4 },
  'peru': { timezone: 'America/Lima', utc_offset: -5 },
  'perú': { timezone: 'America/Lima', utc_offset: -5 },
  'ecuador': { timezone: 'America/Guayaquil', utc_offset: -5 },
  'venezuela': { timezone: 'America/Caracas', utc_offset: -4 },
  'uruguay': { timezone: 'America/Montevideo', utc_offset: -3 },
  'paraguay': { timezone: 'America/Asuncion', utc_offset: -4 },
  'bolivia': { timezone: 'America/La_Paz', utc_offset: -4 },
  'costa rica': { timezone: 'America/Costa_Rica', utc_offset: -6 },
  'panama': { timezone: 'America/Panama', utc_offset: -5 },
  'panamá': { timezone: 'America/Panama', utc_offset: -5 },
  'dominican republic': { timezone: 'America/Santo_Domingo', utc_offset: -4 },
  'republica dominicana': { timezone: 'America/Santo_Domingo', utc_offset: -4 },
  'puerto rico': { timezone: 'America/Puerto_Rico', utc_offset: -4 },
  'guatemala': { timezone: 'America/Guatemala', utc_offset: -6 },
  'el salvador': { timezone: 'America/El_Salvador', utc_offset: -6 },
  'honduras': { timezone: 'America/Tegucigalpa', utc_offset: -6 },
  'nicaragua': { timezone: 'America/Managua', utc_offset: -6 },
  'cuba': { timezone: 'America/Havana', utc_offset: -5 },

  // Asia
  'japan': { timezone: 'Asia/Tokyo', utc_offset: 9 },
  'japon': { timezone: 'Asia/Tokyo', utc_offset: 9 },
  'china': { timezone: 'Asia/Shanghai', utc_offset: 8 },
  'india': { timezone: 'Asia/Kolkata', utc_offset: 5.5 },
  'south korea': { timezone: 'Asia/Seoul', utc_offset: 9 },
  'korea': { timezone: 'Asia/Seoul', utc_offset: 9 },
  'singapore': { timezone: 'Asia/Singapore', utc_offset: 8 },
  'uae': { timezone: 'Asia/Dubai', utc_offset: 4 },
  'united arab emirates': { timezone: 'Asia/Dubai', utc_offset: 4 },
  'saudi arabia': { timezone: 'Asia/Riyadh', utc_offset: 3 },
  'israel': { timezone: 'Asia/Jerusalem', utc_offset: 2 },
  'thailand': { timezone: 'Asia/Bangkok', utc_offset: 7 },
  'indonesia': { timezone: 'Asia/Jakarta', utc_offset: 7 },
  'malaysia': { timezone: 'Asia/Kuala_Lumpur', utc_offset: 8 },
  'philippines': { timezone: 'Asia/Manila', utc_offset: 8 },
  'filipinas': { timezone: 'Asia/Manila', utc_offset: 8 },
  'vietnam': { timezone: 'Asia/Ho_Chi_Minh', utc_offset: 7 },
  'pakistan': { timezone: 'Asia/Karachi', utc_offset: 5 },
  'bangladesh': { timezone: 'Asia/Dhaka', utc_offset: 6 },
  'sri lanka': { timezone: 'Asia/Colombo', utc_offset: 5.5 },
  'nepal': { timezone: 'Asia/Kathmandu', utc_offset: 5.75 },

  // Oceania
  'australia': { timezone: 'Australia/Sydney', utc_offset: 10 },
  'new zealand': { timezone: 'Pacific/Auckland', utc_offset: 12 },

  // Africa
  'south africa': { timezone: 'Africa/Johannesburg', utc_offset: 2 },
  'nigeria': { timezone: 'Africa/Lagos', utc_offset: 1 },
  'kenya': { timezone: 'Africa/Nairobi', utc_offset: 3 },
  'egypt': { timezone: 'Africa/Cairo', utc_offset: 2 },
  'egipto': { timezone: 'Africa/Cairo', utc_offset: 2 },
  'morocco': { timezone: 'Africa/Casablanca', utc_offset: 1 },
  'marruecos': { timezone: 'Africa/Casablanca', utc_offset: 1 },
  'ghana': { timezone: 'Africa/Accra', utc_offset: 0 },
  'ethiopia': { timezone: 'Africa/Addis_Ababa', utc_offset: 3 },
  'tanzania': { timezone: 'Africa/Dar_es_Salaam', utc_offset: 3 },
  'tunisia': { timezone: 'Africa/Tunis', utc_offset: 1 },
  'algeria': { timezone: 'Africa/Algiers', utc_offset: 1 },
  'argelia': { timezone: 'Africa/Algiers', utc_offset: 1 },
};

// US state abbreviation mapping
const usStateTimezones: Record<string, TimezoneResult> = {
  'ny': { timezone: 'America/New_York', utc_offset: -5 },
  'ca': { timezone: 'America/Los_Angeles', utc_offset: -8 },
  'tx': { timezone: 'America/Chicago', utc_offset: -6 },
  'fl': { timezone: 'America/New_York', utc_offset: -5 },
  'il': { timezone: 'America/Chicago', utc_offset: -6 },
  'pa': { timezone: 'America/New_York', utc_offset: -5 },
  'oh': { timezone: 'America/New_York', utc_offset: -5 },
  'ga': { timezone: 'America/New_York', utc_offset: -5 },
  'nc': { timezone: 'America/New_York', utc_offset: -5 },
  'mi': { timezone: 'America/New_York', utc_offset: -5 },
  'wa': { timezone: 'America/Los_Angeles', utc_offset: -8 },
  'az': { timezone: 'America/Phoenix', utc_offset: -7 },
  'ma': { timezone: 'America/New_York', utc_offset: -5 },
  'tn': { timezone: 'America/Chicago', utc_offset: -6 },
  'in': { timezone: 'America/New_York', utc_offset: -5 },
  'mo': { timezone: 'America/Chicago', utc_offset: -6 },
  'md': { timezone: 'America/New_York', utc_offset: -5 },
  'wi': { timezone: 'America/Chicago', utc_offset: -6 },
  'co': { timezone: 'America/Denver', utc_offset: -7 },
  'mn': { timezone: 'America/Chicago', utc_offset: -6 },
  'sc': { timezone: 'America/New_York', utc_offset: -5 },
  'al': { timezone: 'America/Chicago', utc_offset: -6 },
  'la': { timezone: 'America/Chicago', utc_offset: -6 },
  'ky': { timezone: 'America/New_York', utc_offset: -5 },
  'or': { timezone: 'America/Los_Angeles', utc_offset: -8 },
  'ok': { timezone: 'America/Chicago', utc_offset: -6 },
  'ct': { timezone: 'America/New_York', utc_offset: -5 },
  'ut': { timezone: 'America/Denver', utc_offset: -7 },
  'nv': { timezone: 'America/Los_Angeles', utc_offset: -8 },
  'va': { timezone: 'America/New_York', utc_offset: -5 },
  'dc': { timezone: 'America/New_York', utc_offset: -5 },
  'hi': { timezone: 'Pacific/Honolulu', utc_offset: -10 },
  'ak': { timezone: 'America/Anchorage', utc_offset: -9 },
};

// Spanish region names
const spanishRegionTimezones: Record<string, TimezoneResult> = {
  'comunidad de madrid': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'cataluña': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'catalunya': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'andalucia': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'andalucía': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'pais vasco': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'país vasco': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'galicia': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'comunidad valenciana': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'castilla y leon': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'castilla la mancha': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'aragon': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'aragón': { timezone: 'Europe/Madrid', utc_offset: 1 },
  'islas canarias': { timezone: 'Atlantic/Canary', utc_offset: 0 },
  'canary islands': { timezone: 'Atlantic/Canary', utc_offset: 0 },
  'islas baleares': { timezone: 'Europe/Madrid', utc_offset: 1 },
};

export function estimateTimezone(location: string | null | undefined): TimezoneResult | null {
  if (!location) return null;

  const loc = location.toLowerCase().trim();
  if (!loc) return null;

  // Split by commas and clean up parts
  const parts = loc.split(',').map((p) => p.trim()).filter(Boolean);

  // 1. Try city-level match (check each part)
  for (const part of parts) {
    if (cityTimezones[part]) return cityTimezones[part];
  }

  // 2. Try multi-word city names across full string
  for (const [city, tz] of Object.entries(cityTimezones)) {
    if (loc.includes(city)) return tz;
  }

  // 3. Try Spanish regions
  for (const [region, tz] of Object.entries(spanishRegionTimezones)) {
    if (loc.includes(region)) return tz;
  }

  // 4. Try US state abbreviations (last part, 2 chars)
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.length === 2 && usStateTimezones[lastPart]) {
    return usStateTimezones[lastPart];
  }
  // Also try second-to-last if last is a country
  if (parts.length >= 2) {
    const secondLast = parts[parts.length - 2]?.trim();
    if (secondLast && secondLast.length === 2 && usStateTimezones[secondLast]) {
      return usStateTimezones[secondLast];
    }
  }

  // 5. Try country-level match (check each part)
  for (const part of parts) {
    if (countryTimezones[part]) return countryTimezones[part];
  }

  // 6. Try substring country match
  for (const [country, tz] of Object.entries(countryTimezones)) {
    if (loc.includes(country)) return tz;
  }

  console.log(`[Timezone] Could not estimate timezone for location: "${location}"`);
  return null;
}

export function formatUtcOffset(offset: number): string {
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const hours = Math.floor(abs);
  const minutes = (abs - hours) * 60;
  if (minutes > 0) {
    return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  return `UTC${sign}${hours}`;
}
