const STATE_ABBREVS: Record<string, string> = {
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

function extractState(location: string): string | null {
  const parts = location.split(/[,—\-–]/);
  for (const part of parts) {
    const trimmed = part.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(trimmed) && Object.values(STATE_ABBREVS).includes(trimmed)) {
      return trimmed;
    }
  }
  const lower = location.toLowerCase();
  for (const [name, abbr] of Object.entries(STATE_ABBREVS)) {
    if (lower.includes(name)) return abbr;
  }
  return null;
}

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
