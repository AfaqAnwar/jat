const STATE_TO_ABBR: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY", "district of columbia": "DC",
};

/** Replace full state name with 2-letter abbreviation in a location string. */
export function normalizeLocation(loc: string): string {
  if (!loc) return loc;

  if (/^(remote|hybrid)/i.test(loc)) {
    const match = loc.match(/,\s*([A-Za-z\s]+)$/);
    if (match) {
      const abbr = STATE_TO_ABBR[match[1].trim().toLowerCase()];
      if (abbr) return loc.replace(match[1], ` ${abbr}`);
    }
    return loc;
  }

  const parts = loc.split(",");
  if (parts.length < 2) return loc;

  const last = parts[parts.length - 1].trim();
  if (/^[A-Z]{2}$/.test(last)) return loc;

  const abbr = STATE_TO_ABBR[last.toLowerCase()];
  if (!abbr) return loc;

  const city = parts[parts.length - 2]?.trim();
  if (!city || city.length < 2 || city.length > 40) return loc;

  return [...parts.slice(0, -1), ` ${abbr}`].join(",");
}

/** Strip work-model prefixes, metro suffixes, and normalize city names. */
export function cleanLocationName(loc: string): string {
  return loc
    .replace(/^remote\s*[-—–]?\s*/i, "")
    .replace(/^hybrid\s*[-—–]?\s*/i, "")
    .replace(/^\(/, "")
    .replace(/\)$/, "")
    .replace(/\s*(Metropolitan Area|Metro Area|Metro)\s*/gi, "")
    .replace(/New York City/gi, "New York")
    .trim();
}

/**
 * Extract only the dollar range from a salary string.
 * Instead of trying to strip bad suffixes (which risks data loss),
 * we match the known-good pattern and return only that.
 * Collapses identical min/max into a single value (e.g. "$65,000 - $65,000" → "$65,000").
 * Returns "" if no valid salary range is found.
 */
export function extractSalaryRange(raw: string): string {
  if (!raw) return "";

  const cleaned = raw.replace(/\.00/g, "");

  // Match "$X - $Y" or "$X-$Y" with optional commas and K shorthand
  const rangeMatch = cleaned.match(
    /\$[\d,]+(?:\.\d+)?[Kk]?\s*[-–—]\s*\$[\d,]+(?:\.\d+)?[Kk]?/
  );
  if (rangeMatch) {
    const formatted = formatDollars(expandK(rangeMatch[0]));
    return collapseIdenticalRange(formatted);
  }

  // Match a single "$X" value (some postings only list one number)
  const singleMatch = cleaned.match(/\$[\d,]+(?:\.\d+)?[Kk]?/);
  if (singleMatch) {
    return formatDollars(expandK(singleMatch[0]));
  }

  return "";
}

/** Convert K/k shorthand to full thousands (e.g. "$150K" → "$150,000") */
function expandK(salary: string): string {
  return salary.replace(/\$(\d+(?:,\d+)?(?:\.\d+)?)[Kk]/g, (_match, num: string) => {
    const n = parseFloat(num.replace(/,/g, "")) * 1000;
    return `$${n.toLocaleString("en-US")}`;
  });
}

/** Ensure every "$X" token has proper comma-separated formatting. */
function formatDollars(salary: string): string {
  return salary.replace(/\$[\d,]+/g, (token) => {
    const n = parseInt(token.slice(1).replace(/,/g, ""), 10);
    return isNaN(n) ? token : `$${n.toLocaleString("en-US")}`;
  });
}

/** Collapse "$X - $X" into just "$X" when both sides are identical. */
function collapseIdenticalRange(salary: string): string {
  const parts = salary.split(/\s*[-–—]\s*/);
  if (parts.length === 2 && parts[0].trim() === parts[1].trim()) {
    return parts[0].trim();
  }
  return salary;
}

/** Convert relative date strings like "2 weeks ago" to ISO date. */
export function resolveRelativeDate(raw: string): string {
  const text = raw.toLowerCase().trim();
  const match = text.match(/(\d+)\s*(day|week|month|hour|minute)s?\s*ago/);
  if (!match) return "";

  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const now = new Date();

  if (unit === "day") now.setDate(now.getDate() - amount);
  else if (unit === "week") now.setDate(now.getDate() - amount * 7);
  else if (unit === "month") now.setMonth(now.getMonth() - amount);
  else if (unit === "hour") now.setHours(now.getHours() - amount);
  else if (unit === "minute") now.setMinutes(now.getMinutes() - amount);

  return now.toISOString().split("T")[0];
}

/** Strip HTML to plain text, removing non-content elements. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Prefix qualifiers that describe a specialization/team, not the base role.
 * Matched case-insensitively. Order matters: longer/more-specific first.
 */
const SECTOR_PREFIXES = [
  "full-stack", "full stack", "fullstack",
  "front-end", "front end", "frontend",
  "back-end", "back end", "backend",
  "platform", "infrastructure", "embedded", "mobile",
  "devops", "data", "cloud", "security", "ml", "ai",
];

const SECTOR_PREFIX_RE = new RegExp(
  `^(${SECTOR_PREFIXES.join("|")})\\s+`,
  "i",
);

/**
 * If the role contains a comma-separated suffix and sector is empty,
 * split them (e.g. "Software Engineer, Frontend" → role: "Software Engineer", sector: "Frontend").
 *
 * If the role has a recognized prefix qualifier (e.g. "Full-Stack Software Engineer II"),
 * extract it as the sector (→ role: "Software Engineer II", sector: "Full-Stack").
 *
 * Strips parenthetical suffixes like "(JavaScript)" and appends them to sector.
 *
 * If the role already describes the sector (e.g. "Front End Engineer" + sector "Frontend"),
 * clear the sector to avoid redundancy.
 */
export function splitRoleAndSector(role: string, sector: string): { role: string; sector: string } {
  // 1. Comma split: "Software Engineer, Payments" → role + sector
  if (!sector && role.includes(",")) {
    const commaIdx = role.indexOf(",");
    const candidate = role.slice(commaIdx + 1).trim();
    if (candidate && candidate.length <= 40) {
      role = role.slice(0, commaIdx).trim();
      sector = candidate;
    }
  }

  // 2. Strip parenthetical suffix: "Engineer II (JavaScript)" → role + " (JavaScript)" appended to sector
  const parenMatch = role.match(/\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    role = role.slice(0, parenMatch.index!).trim();
    const parenContent = parenMatch[1].trim();
    sector = sector ? `${sector} (${parenContent})` : parenContent;
  }

  // 3. Prefix extraction: "Full-Stack Software Engineer II" → sector "Full-Stack", role "Software Engineer II"
  const prefixMatch = role.match(SECTOR_PREFIX_RE);
  if (prefixMatch) {
    const prefix = prefixMatch[1];
    const remainder = role.slice(prefixMatch[0].length).trim();
    if (remainder.length >= 3) {
      const capitalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      if (!sector) {
        sector = capitalizedPrefix;
      } else if (!isSectorRedundant(capitalizedPrefix, sector) && !isSectorRedundant(sector, capitalizedPrefix)) {
        sector = `${capitalizedPrefix} (${sector})`;
      }
      role = remainder;
    }
  }

  // 4. Reject metadata noise: slashes or multiple commas indicate page tags, not a real sector
  if (sector && looksLikeMetadata(sector)) {
    sector = "";
  }

  // 5. Redundancy check: "Front End Engineer" + sector "Frontend" → clear sector
  if (sector && isSectorRedundant(role, sector)) {
    sector = "";
  }

  return { role, sector };
}

/** Detect page category/tag noise that the AI incorrectly used as sector. */
function looksLikeMetadata(sector: string): boolean {
  if (sector.includes("/")) return true;
  if ((sector.match(/,/g) || []).length >= 2) return true;
  if (sector.length > 50) return true;
  return false;
}

/** Check if the role already conveys the sector, accounting for common variations. */
function isSectorRedundant(role: string, sector: string): boolean {
  const r = normalizeForComparison(role);
  const s = normalizeForComparison(sector);
  return r.includes(s);
}

/** Collapse whitespace, hyphens, and casing so "Front End" matches "Frontend" etc. */
function normalizeForComparison(str: string): string {
  return str.toLowerCase().replace(/[-\s]+/g, "");
}

/** Coerce raw locations from the AI response into a string array. */
export function coerceLocationList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((l): l is string => typeof l === "string" && l.length > 0);
  }
  if (typeof raw === "string" && raw) return [raw];
  return [];
}
