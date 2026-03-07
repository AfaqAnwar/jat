import { action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  normalizeLocation,
  cleanLocationName,
  extractSalaryRange,
  resolveRelativeDate,
  htmlToText,
  coerceLocationList,
  splitRoleAndSector,
} from "./lib/normalize";

type LocType = "onsite" | "remote" | "hybrid";

type ParseResult = {
  role: string;
  sector: string;
  company: string;
  salary: string;
  locations: string[];
  locationType: LocType;
  datePosted: string;
  error?: string;
};

const EMPTY_RESULT: ParseResult = {
  role: "",
  sector: "",
  company: "",
  salary: "",
  locations: [],
  locationType: "onsite",
  datePosted: "",
};

const PROMPT_TEMPLATE = `Extract job details from the PRIMARY posting in this text. Ignore sidebars and other listings.

Return ONLY valid JSON with these fields:

"role" — base job title WITHOUT any comma suffix. Split at the FIRST comma.
"sector" — ONLY from the job title itself: the part after a comma, or a prefix qualifier (e.g. "Frontend", "Full-Stack"). Do NOT use page categories, tags, or metadata. "" if the title has no sector.
"company" — the hiring organization. NOT the team/sector.
"salary" — base pay ONLY: "$XXX,XXX - $XXX,XXX" for ranges, or "$XXX,XXX" for a single figure. No /yr, no equity, no benefits, no "(Annual)". "" if not found.
"locations" — array of "City, ST" (2-letter state). No "Remote"/"Hybrid" here. [] if none.
"workModel" — "onsite", "remote", or "hybrid".
"datePosted" — as written (e.g. "1 week ago") or "". Do NOT guess.

Examples of role/sector splitting:
  "Software Engineer, Frontend" → role: "Software Engineer", sector: "Frontend"
  "Software Engineer, Payments" → role: "Software Engineer", sector: "Payments"
  "Software Engineer, Roku" → role: "Software Engineer", sector: "Roku"
  "Full-Stack Software Engineer II (JavaScript)" → role: "Software Engineer II", sector: "Full-Stack"
  "Frontend Engineer" → role: "Engineer", sector: "Frontend"
  "Backend Software Engineer" → role: "Software Engineer", sector: "Backend"
  "Software Engineer" → role: "Software Engineer", sector: ""
  "Software Engineer - All Levels" → role: "Software Engineer - All Levels", sector: ""
  "Senior Data Analyst" → role: "Senior Data Analyst", sector: ""
  "Artist's Marketing Assistant" → role: "Marketing Assistant", sector: "" (page tags like "Graphic Design, Marketing/Ad/Sales" are NOT sector)
  "Software Development Engineer" → role: "Software Development Engineer", sector: "" (do NOT use page categories like "Engineering" as sector)

Examples of salary cleaning:
  "$143,200.00/yr - $284,000.00/yr" → "$143,200 - $284,000"
  "$150,000-$230,000+ target equity + benefits" → "$150,000 - $230,000"
  "$150K/yr - $250K/yr" → "$150,000 - $250,000"
  "$65000 (Annual)" → "$65,000"
  "$65,000" → "$65,000" (single figure, do NOT duplicate into a range)

Text:
`;

export const fromUrl = action({
  args: { url: v.string() },
  handler: async (ctx, { url }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const page = await fetchPageText(url);
    if ("error" in page) return { ...EMPTY_RESULT, error: page.error };

    const aiResult = await callGemini(page.text);
    if (!aiResult) return { ...EMPTY_RESULT, error: "parse" };

    return normalizeAiResult(aiResult);
  },
});

type FetchResult = { text: string } | { error: string };

async function fetchPageText(url: string): Promise<FetchResult> {
  const isSpaHash = url.includes("#/") || url.includes("#!/");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; JobTracker/1.0; +https://github.com)",
      },
    });
  } catch {
    return { error: "fetch" };
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) return { error: "fetch" };

  const html = await response.text();
  if (!html || html.length < 200) return { error: "empty" };

  let text = htmlToText(html);

  if (text.length < 100) {
    return { error: isSpaHash ? "spa" : "empty" };
  }

  if (text.length > 6000) {
    const aboutIdx = text.search(/about (the|this) (role|job|position)/i);
    if (aboutIdx > 0 && aboutIdx < 3000) {
      text = text.slice(Math.max(0, aboutIdx - 500));
    }
  }

  return { text: text.slice(0, 6000) };
}

async function callGemini(text: string): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured");
    return null;
  }

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-4b-it:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT_TEMPLATE + text }] }],
        }),
      },
    );
  } catch (err) {
    console.error("Gemini API request failed:", err);
    return null;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`Gemini API error ${response.status}: ${body.slice(0, 200)}`);
    return null;
  }

  const data = await response.json();
  const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try {
    return JSON.parse(resultText);
  } catch {
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
}

function normalizeAiResult(parsed: Record<string, unknown>) {
  console.log("[parseJob] Raw AI response:", JSON.stringify(parsed));

  const rawDate = String(parsed.datePosted ?? "");
  const datePosted = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : resolveRelativeDate(rawDate);

  const salary = extractSalaryRange(String(parsed.salary ?? ""));

  const rawLocations = coerceLocationList(parsed.locations ?? parsed.location);
  const locations = rawLocations
    .map(normalizeLocation)
    .map(cleanLocationName)
    .filter(Boolean);

  const rawModel = String(parsed.workModel ?? "").toLowerCase();
  let locationType: LocType = "onsite";
  if (rawModel === "remote") locationType = "remote";
  else if (rawModel === "hybrid") locationType = "hybrid";

  if (locations.length === 0 && locationType === "remote") {
    locations.push("US");
  }

  const { role, sector } = splitRoleAndSector(
    String(parsed.role ?? ""),
    String(parsed.sector ?? ""),
  );

  const result = {
    role,
    sector,
    company: String(parsed.company ?? ""),
    salary,
    locations,
    locationType,
    datePosted,
  };

  console.log("[parseJob] Normalized result:", JSON.stringify(result));
  return result;
}
