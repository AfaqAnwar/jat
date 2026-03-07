import { STATE_NAME_TO_ABBR, VALID_ABBREVS } from "@/lib/us-states";

function extractState(location: string): string | null {
  const parts = location.split(/[,—\-–]/);
  for (const part of parts) {
    const trimmed = part.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(trimmed) && VALID_ABBREVS.has(trimmed)) {
      return trimmed;
    }
  }
  const lower = location.toLowerCase();
  for (const [name, abbr] of Object.entries(STATE_NAME_TO_ABBR)) {
    if (lower.includes(name)) return abbr;
  }
  return null;
}

/** Pick the location matching the user's state from a list, falling back to the first. */
export function resolveLocation(locations: string[], userState: string | undefined): string {
  if (locations.length === 0) return "";
  if (locations.length === 1 || !userState) return locations[0];

  const userAbbr = userState.toUpperCase();

  for (const loc of locations) {
    const locState = extractState(loc);
    if (locState === userAbbr) return loc;
  }

  return locations[0];
}
