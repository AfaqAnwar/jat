import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireOwnership } from "./lib/auth";
import { starResume } from "./lib/resumeDefaults";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return [];
    return ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await requireAuth(ctx).catch(() => null);
    if (!userId) return null;

    const resume = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const ownsFile = resume.some((r) => r.storageId === storageId);
    if (!ownsFile) return null;

    return ctx.storage.getUrl(storageId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const save = mutation({
  args: {
    name: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { name, storageId }) => {
    const userId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const hasDefault = existing.some((r) => r.isDefault);

    return ctx.db.insert("resumes", {
      userId,
      name,
      storageId,
      isDefault: !hasDefault ? true : undefined,
    });
  },
});

export const rename = mutation({
  args: {
    id: v.id("resumes"),
    name: v.string(),
  },
  handler: async (ctx, { id, name }) => {
    const userId = await requireAuth(ctx);
    await requireOwnership(ctx, "resumes", id, userId);
    await ctx.db.patch(id, { name });
  },
});

export const setDefault = mutation({
  args: { id: v.id("resumes") },
  handler: async (ctx, { id }) => {
    const userId = await requireAuth(ctx);
    await requireOwnership(ctx, "resumes", id, userId);
    await starResume(ctx, userId, id);
  },
});

export const remove = mutation({
  args: { id: v.id("resumes") },
  handler: async (ctx, { id }) => {
    const userId = await requireAuth(ctx);
    const resume = await requireOwnership(ctx, "resumes", id, userId);

    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const job of jobs) {
      if (job.resumeId === id) {
        await ctx.db.patch(job._id, {
          resumeId: undefined,
          resumeName: resume.name,
        });
      }
    }

    await ctx.storage.delete(resume.storageId);
    await ctx.db.delete(id);
  },
});
