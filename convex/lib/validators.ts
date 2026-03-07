import { v } from "convex/values";

export const locationTypeValidator = v.union(
  v.literal("onsite"),
  v.literal("remote"),
  v.literal("hybrid"),
);

export const statusValidator = v.union(
  v.literal("applied"),
  v.literal("interviewing"),
  v.literal("offer"),
  v.literal("rejected"),
  v.literal("ghosted"),
);

const US_STATE_ABBREVS = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY",
]);

export function assertValidStateAbbrev(state: string) {
  if (state !== "" && !US_STATE_ABBREVS.has(state)) {
    throw new Error("Invalid US state abbreviation");
  }
}

export function assertHttpUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error();
    }
  } catch {
    throw new Error("Invalid URL: must be a valid http or https URL");
  }
}

const MAX_SHORT = 500;
const MAX_URL = 2048;

export function assertMaxLength(value: string | undefined, max: number, field: string) {
  if (value !== undefined && value.length > max) {
    throw new Error(`${field} exceeds maximum length of ${max}`);
  }
}

export { MAX_SHORT, MAX_URL };
