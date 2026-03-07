import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  locationTypeValidator,
  statusValidator,
  assertHttpUrl,
  assertMaxLength,
  MAX_SHORT,
  MAX_URL,
} from "./lib/validators";
import { requireAuth, requireOwnership } from "./lib/auth";
import { rateLimiter } from "./lib/rateLimits";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return [];
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    const resumeIds = [...new Set(
      jobs.map((j) => j.resumeId).filter(
        (id): id is Id<"resumes"> => id !== undefined,
      ),
    )];
    const resumes = await Promise.all(resumeIds.map((id) => ctx.db.get(id)));
    const resumeMap = new Map(
      resumeIds.map((id, i) => [id, resumes[i]]),
    );

    return jobs.map((job) => {
      const resume = job.resumeId ? resumeMap.get(job.resumeId) : null;
      return {
        ...job,
        resumeName: resume?.name ?? job.resumeName ?? null,
      };
    });
  },
});

export const add = mutation({
  args: {
    url: v.string(),
    role: v.string(),
    sector: v.optional(v.string()),
    company: v.string(),
    salary: v.optional(v.string()),
    location: v.optional(v.string()),
    locationType: v.optional(locationTypeValidator),
    dateApplied: v.string(),
    datePosted: v.optional(v.string()),
    status: statusValidator,
    resumeId: v.optional(v.id("resumes")),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await rateLimiter.limit(ctx, "addJob", { key: userId, throws: true });

    assertHttpUrl(args.url);
    assertMaxLength(args.url, MAX_URL, "url");
    assertMaxLength(args.role, MAX_SHORT, "role");
    assertMaxLength(args.company, MAX_SHORT, "company");
    assertMaxLength(args.sector, MAX_SHORT, "sector");
    assertMaxLength(args.salary, MAX_SHORT, "salary");
    assertMaxLength(args.location, MAX_SHORT, "location");

    if (args.resumeId) {
      await requireOwnership(ctx, "resumes", args.resumeId, userId);
    }

    return ctx.db.insert("jobs", {
      ...args,
      sector: args.sector === "" ? undefined : args.sector,
      salary: args.salary === "" ? undefined : args.salary,
      location: args.location === "" ? undefined : args.location,
      locationType: args.locationType ?? undefined,
      datePosted: args.datePosted === "" ? undefined : args.datePosted,
      userId,
    });
  },
});

type UpdatableJobFields = {
  role?: string;
  sector?: string;
  company?: string;
  salary?: string;
  location?: string;
  locationType?: "onsite" | "remote" | "hybrid";
  dateApplied?: string;
  datePosted?: string;
  status?: "applied" | "interviewing" | "offer" | "rejected" | "ghosted";
  resumeId?: Id<"resumes">;
};

function pickDefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export const update = mutation({
  args: {
    id: v.id("jobs"),
    role: v.optional(v.string()),
    sector: v.optional(v.string()),
    company: v.optional(v.string()),
    salary: v.optional(v.string()),
    location: v.optional(v.string()),
    locationType: v.optional(locationTypeValidator),
    dateApplied: v.optional(v.string()),
    datePosted: v.optional(v.string()),
    status: v.optional(statusValidator),
    resumeId: v.optional(v.id("resumes")),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await requireAuth(ctx);
    await requireOwnership(ctx, "jobs", id, userId);

    assertMaxLength(fields.role, MAX_SHORT, "role");
    assertMaxLength(fields.company, MAX_SHORT, "company");
    assertMaxLength(fields.sector, MAX_SHORT, "sector");
    assertMaxLength(fields.salary, MAX_SHORT, "salary");
    assertMaxLength(fields.location, MAX_SHORT, "location");

    if (fields.resumeId) {
      await requireOwnership(ctx, "resumes", fields.resumeId, userId);
    }

    const updates = pickDefined<UpdatableJobFields>(fields);

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(id, updates);
    }
  },
});

export const remove = mutation({
  args: { id: v.id("jobs") },
  handler: async (ctx, { id }) => {
    const userId = await requireAuth(ctx);
    await requireOwnership(ctx, "jobs", id, userId);
    await ctx.db.delete(id);
  },
});
