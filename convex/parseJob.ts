import { action } from "./_generated/server";
import { v } from "convex/values";

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

function normalizeLocation(loc: string): string {
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

function resolveRelativeDate(raw: string): string {
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

export const fromUrl = action({
  args: { url: v.string() },
  handler: async (_ctx, { url }) => {
    type LocType = "onsite" | "remote" | "hybrid";
    const empty = { role: "", sector: "", company: "", salary: "", locations: [] as string[], locationType: "onsite" as LocType, datePosted: "" };

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; JobTracker/1.0; +https://github.com)",
        },
      });
    } catch {
      return empty;
    }

    if (!response.ok) return empty;

    const html = await response.text();
    if (!html || html.length < 200) return empty;

    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 100) return empty;

    if (text.length > 6000) {
      const aboutIdx = text.search(/about (the|this) (role|job|position)/i);
      if (aboutIdx > 0 && aboutIdx < 3000) {
        text = text.slice(Math.max(0, aboutIdx - 500));
      }
    }
    text = text.slice(0, 6000);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return empty;

    const prompt = `This text is from a SINGLE job posting page. It may contain sidebar content or other job listings — IGNORE those. Extract details ONLY for the PRIMARY job being described in detail.

Return ONLY a JSON object:
- "role": core job title only (e.g. "Software Engineer"). Remove team/department/platform suffixes.
- "sector": team, department, or platform IF it appears as a comma-separated suffix in the job title (e.g. "Software Engineer, Payments" → sector is "Payments", "Software Engineer, Roku" → sector is "Roku"). "" if the title has no such suffix.
- "company": the ORGANIZATION that posted the job — look for the company name in the page header, "About [Company]" section, careers URL, or footer. Do NOT use the sector/team/platform as the company. For example, "Software Engineer, Roku" at Paramount → company is "Paramount", NOT "Roku".
- "salary": annual base salary as a clean USD range. Format: "$XXX,XXX - $XXX,XXX". Remove /yr, /year, /hr, K (convert to thousands). No bonus/equity/benefits. "" if not found.
- "locations": array of ALL physical work locations for this role. ALWAYS use 2-letter state abbreviations: "City, ST" (e.g. "New York, NY" NOT "New York, New York"). Use the canonical short city name — "New York, NY" not "New York City, NY". Strip "Metropolitan Area" or "Metro" suffixes. Do NOT include "Remote" or "Hybrid" as a location — those go in workModel. Primary location FIRST. [] if not found.
- "workModel": one of "onsite", "remote", or "hybrid". "hybrid" = mix of office and home (e.g. "3 days in office", "some days on site"). "remote" = fully remote, no office required. "onsite" = fully in-office or if not explicitly stated. Default to "onsite" if unclear.
- "datePosted": posting date or relative time exactly as written (e.g. "1 week ago"). "" if not found.

Rules:
- Only extract from the MAIN job description, not sidebar listings or "similar jobs".
- Salary must be clean numbers: "$143,200 - $284,000" not "$143,200.00/yr - $284,000.00/yr".
- Do NOT invent or guess any values.
- If this text does NOT contain a job posting, return all fields as "".

Text:
${text}`;

    let geminiResponse: Response;
    try {
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-4b-it:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );
    } catch {
      return empty;
    }

    if (!geminiResponse.ok) return empty;

    const data = await geminiResponse.json();
    const resultText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    try {
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return empty;
      const parsed = JSON.parse(jsonMatch[0]);

      const rawDate = parsed.datePosted ?? "";
      const datePosted = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
        ? rawDate
        : resolveRelativeDate(rawDate);

      const rawSalary = (parsed.salary ?? "").replace(/\.00/g, "");

      const rawLocations = parsed.locations ?? parsed.location ?? [];
      const rawList: string[] = Array.isArray(rawLocations)
        ? rawLocations.filter((l: unknown) => typeof l === "string" && l)
        : typeof rawLocations === "string" && rawLocations
          ? [rawLocations]
          : [];
      const normalized = rawList.map(normalizeLocation);

      const locations = normalized.map((l) => {
        return l
          .replace(/^remote\s*[-—–]?\s*/i, "")
          .replace(/^hybrid\s*[-—–]?\s*/i, "")
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/\s*(Metropolitan Area|Metro Area|Metro)\s*/gi, "")
          .replace(/New York City/gi, "New York")
          .trim();
      }).filter(Boolean);

      const rawModel = (parsed.workModel ?? "").toLowerCase();
      let locationType: LocType = "onsite";
      if (rawModel === "remote") locationType = "remote";
      else if (rawModel === "hybrid") locationType = "hybrid";

      if (locations.length === 0 && locationType === "remote") {
        locations.push("US");
      }

      return {
        role: parsed.role ?? "",
        sector: parsed.sector ?? "",
        company: parsed.company ?? "",
        salary: rawSalary,
        locations,
        locationType,
        datePosted,
      };
    } catch {
      return empty;
    }
  },
});
