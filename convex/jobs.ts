import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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

    return Promise.all(
      jobs.map(async (job) => {
        const resume = job.resumeId ? await ctx.db.get(job.resumeId) : null;
        return {
          ...job,
          resumeName: resume?.name ?? job.resumeName ?? null,
        };
      }),
    );
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
    locationType: v.optional(v.union(
      v.literal("onsite"),
      v.literal("remote"),
      v.literal("hybrid"),
    )),
    dateApplied: v.string(),
    datePosted: v.optional(v.string()),
    status: v.union(
      v.literal("applied"),
      v.literal("interviewing"),
      v.literal("offer"),
      v.literal("rejected"),
      v.literal("ghosted"),
    ),
    resumeId: v.optional(v.id("resumes")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let resumeName: string | undefined;
    if (args.resumeId) {
      const resume = await ctx.db.get(args.resumeId);
      resumeName = resume?.name;
    }

    return ctx.db.insert("jobs", {
      ...args,
      sector: args.sector || undefined,
      salary: args.salary || undefined,
      location: args.location || undefined,
      locationType: args.locationType || undefined,
      datePosted: args.datePosted || undefined,
      resumeName,
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
    locationType: v.optional(v.union(
      v.literal("onsite"),
      v.literal("remote"),
      v.literal("hybrid"),
    )),
    dateApplied: v.optional(v.string()),
    datePosted: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("applied"),
        v.literal("interviewing"),
        v.literal("offer"),
        v.literal("rejected"),
        v.literal("ghosted"),
      ),
    ),
    resumeId: v.optional(v.id("resumes")),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const job = await ctx.db.get(id);
    if (!job || job.userId !== userId) throw new Error("Not found");

    const updates: Record<string, unknown> = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined),
    );

    if (fields.resumeId) {
      const resume = await ctx.db.get(fields.resumeId);
      if (resume) {
        updates.resumeName = resume.name;
      }
    }

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
