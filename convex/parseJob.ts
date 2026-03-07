import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { rateLimiter } from "./lib/rateLimits";
import {
  normalizeLocation,
  cleanLocationName,
  extractSalaryRange,
  resolveRelativeDate,
  decodeEntities,
  htmlToText,
  coerceLocationList,
  splitRoleAndSector,
} from "./lib/normalize";

type ParseResult = {
  role: string;
  sector: string;
  company: string;
  salary: string;
  locations: string[];
  locationType: "onsite" | "remote" | "hybrid";
  datePosted: string;
  error?: string;
};

const EMPTY_RESULT: ParseResult = {
  role: "",
  sector: "",
  company: "",
  salary: "",
  locations: [],
  locationType: "onsite" as const,
  datePosted: "",
};

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^\[::1\]$/,
  /^\[::\]$/,
  /^\[0{0,4}(:0{0,4}){5}:0{0,4}[01]\]$/,
  /^\[::ffff:127\.\d+\.\d+\.\d+\]$/,
  /^\[::ffff:10\.\d+\.\d+\.\d+\]$/,
  /^\[::ffff:172\.(1[6-9]|2\d|3[01])\.\d+\.\d+\]$/,
  /^\[::ffff:192\.168\.\d+\.\d+\]$/,
  /^\[::ffff:169\.254\.\d+\.\d+\]$/,
  /^\[::ffff:0\.0\.0\.0\]$/,
];

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return BLOCKED_HOSTNAME_PATTERNS.some((re) => re.test(lower));
}

function validateFetchUrl(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only http/https URLs are allowed");
  }

  if (isBlockedHostname(parsed.hostname)) {
    throw new Error("URL points to a blocked address");
  }

  if (/^\d+$/.test(parsed.hostname)) {
    throw new Error("Numeric IP addresses are not allowed");
  }

  return parsed.href;
}

const PROMPT_TEMPLATE = `Extract job details from the PRIMARY posting in this text. Ignore sidebars and other listings.

IMPORTANT: Use the OFFICIAL job title shown at the top of the posting (the heading/title line), NOT informal references in the description body. For example, if the title says "Software Engineer, UI/UX" but the body says "We're looking for a UI Engineer", use "Software Engineer, UI/UX".

Return ONLY valid JSON with these fields:

"role" — base job title WITHOUT any comma suffix or dash suffix. Split at the FIRST comma, or at " - " if the suffix describes a team/product. Keep level indicators (Senior, Staff, Lead, Junior, Principal, and numeric levels like 4, II, III) on the role. Extract specialization prefixes (Frontend, Backend, Full-Stack, Platform, etc.) as sector.
"sector" — ONLY from the job title itself: the part after a comma or dash separator, or a specialization prefix (e.g. "Frontend", "Full-Stack", "Platform"). Level words like Senior/Staff/Lead/Junior and numeric levels (4, I, II, III, IV) are NOT sector. Do NOT use page categories, tags, or metadata. "" if the title has no sector.
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
  "Senior Fullstack Software Engineer" → role: "Senior Software Engineer", sector: "Fullstack"
  "Senior Full Stack Engineer" → role: "Senior Engineer", sector: "Full Stack"
  "Lead Backend Engineer" → role: "Lead Engineer", sector: "Backend"
  "Staff Platform Engineer" → role: "Staff Engineer", sector: "Platform"
  "Junior Frontend Developer" → role: "Junior Developer", sector: "Frontend"
  "Software Engineer 4 - Ads Signals Conversion API" → role: "Software Engineer 4", sector: "Ads Signals Conversion API"
  "Software Engineer II - Platform" → role: "Software Engineer II", sector: "Platform"
  "SDE III - Payments" → role: "SDE III", sector: "Payments"
  "Software Engineer" → role: "Software Engineer", sector: ""
  "Software Engineer - All Levels" → role: "Software Engineer - All Levels", sector: "" (this is a level descriptor, not a team)
  "Senior Software Engineer" → role: "Senior Software Engineer", sector: "" (Senior is a level, NOT a sector)
  "Senior Data Analyst" → role: "Senior Data Analyst", sector: "" (Senior is a level, NOT a sector)
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

export const checkParseRateLimit = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await rateLimiter.limit(ctx, "parseJob", { key: userId, throws: true });
    await rateLimiter.limit(ctx, "globalParse", { throws: true });
  },
});

export const fromUrl = action({
  args: { url: v.string() },
  handler: async (ctx, { url }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.runMutation(internal.parseJob.checkParseRateLimit, { userId });

    let safeUrl: string;
    try {
      safeUrl = validateFetchUrl(url);
    } catch {
      return { ...EMPTY_RESULT, error: "fetch" };
    }

    const page = await fetchPageText(safeUrl);
    if ("error" in page) return { ...EMPTY_RESULT, error: page.error };

    const aiResult = await callGemini(page.text);
    if (!aiResult) return { ...EMPTY_RESULT, error: "parse" };

    return normalizeAiResult(aiResult);
  },
});

type FetchResult = { text: string } | { error: string };

async function fetchPageText(url: string): Promise<FetchResult> {
  for (const tryApi of [tryGreenhouseApi, tryLeverApi]) {
    const apiUrl = tryApi(url);
    if (apiUrl) {
      const result = await fetchUrl(apiUrl);
      if (!("error" in result)) return result;
    }
  }
  return fetchUrl(url);
}

function tryGreenhouseApi(url: string): string | null {
  const parsed = new URL(url);

  const ghBoardMatch = parsed.hostname === "boards.greenhouse.io"
    && parsed.pathname.match(/^\/([^/]+)\/jobs\/(\d+)/);
  if (ghBoardMatch) {
    return `https://boards-api.greenhouse.io/v1/boards/${ghBoardMatch[1]}/jobs/${ghBoardMatch[2]}`;
  }

  const ghJid = parsed.searchParams.get("gh_jid");
  if (ghJid) {
    const boardSlug = parsed.hostname
      .replace(/^www\./, "")
      .replace(/\.(com|io|org|co|net)$/, "")
      .replace(/\./g, "");
    return `https://boards-api.greenhouse.io/v1/boards/${boardSlug}/jobs/${ghJid}`;
  }

  return null;
}

function tryLeverApi(url: string): string | null {
  const match = url.match(/jobs\.lever\.co\/([^/]+)\/([a-f0-9-]+)/);
  if (!match) return null;
  return `https://api.lever.co/v0/postings/${match[1]}/${match[2]}`;
}

async function fetchUrl(url: string): Promise<FetchResult> {
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

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return parseJsonJobResponse(await response.text());
  }

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

function parseJsonJobResponse(body: string): FetchResult {
  try {
    const d = JSON.parse(body);
    const parts: string[] = [];

    const push = (label: string, val: unknown) => {
      if (!val) return;
      parts.push(`${label}: ${typeof val === "string" ? val : JSON.stringify(val)}`);
    };

    push("Job Title", d.title || d.text);
    push("Company", d.company_name || d.company?.name || d.board?.name || d.categories?.team);
    push("Location", d.location?.name || d.categories?.location);
    push("Salary", d.pay || d.salary || d.compensation);

    const content = d.content || d.description || d.descriptionPlain || "";
    if (content) parts.push(htmlToText(decodeEntities(content)));

    const salaryFromMeta = (d.metadata ?? d.compliance ?? [])
      .find((m: { value?: string; name?: string }) => String(m.value ?? m.name ?? "").includes("$"));
    if (salaryFromMeta) push("Salary", salaryFromMeta.value ?? salaryFromMeta.name);

    const text = parts.join("\n\n");
    if (text.length < 50) return { error: "empty" };
    return { text: text.slice(0, 6000) };
  } catch {
    return { error: "parse" };
  }
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
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const jsonStr = raw.startsWith("{") ? raw : raw.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonStr) return null;

  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function normalizeAiResult(parsed: Record<string, unknown>): ParseResult {
  const rawDate = String(parsed.datePosted ?? "");
  const datePosted = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : resolveRelativeDate(rawDate);

  const locations = coerceLocationList(parsed.locations ?? parsed.location)
    .map(normalizeLocation)
    .map(cleanLocationName)
    .filter(Boolean);

  const rawModel = String(parsed.workModel ?? "").toLowerCase();
  const locationType: ParseResult["locationType"] =
    rawModel === "remote" ? "remote" : rawModel === "hybrid" ? "hybrid" : "onsite";

  if (locations.length === 0 && locationType === "remote") {
    locations.push("US");
  }

  const { role, sector } = splitRoleAndSector(
    String(parsed.role ?? ""),
    String(parsed.sector ?? ""),
  );

  return {
    role,
    sector,
    company: String(parsed.company ?? ""),
    salary: extractSalaryRange(String(parsed.salary ?? "")),
    locations,
    locationType,
    datePosted,
  };
}
