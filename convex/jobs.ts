import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { locationTypeValidator, statusValidator } from "./lib/validators";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return ctx.db.insert("jobs", {
      ...args,
      sector: args.sector || undefined,
      salary: args.salary || undefined,
      location: args.location || undefined,
      locationType: args.locationType || undefined,
      datePosted: args.datePosted || undefined,
      userId,
    });
  },
});

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const job = await ctx.db.get(id);
    if (!job || job.userId !== userId) throw new Error("Not found");

    const updates: Record<string, unknown> = Object.fromEntries(
      Object.entries(fields).filter(([, val]) => val !== undefined),
    );

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(id, updates);
    }
  },
});

export const remove = mutation({
  args: { id: v.id("jobs") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const job = await ctx.db.get(id);
    if (!job || job.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(id);
  },
});
