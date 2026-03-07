import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
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
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Verify the storage ID belongs to one of the user's resumes
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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.storage.generateUploadUrl();
  },
});

export const save = mutation({
  args: {
    name: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { name, storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const resume = await ctx.db.get(id);
    if (!resume || resume.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(id, { name });
  },
});

export const setDefault = mutation({
  args: { id: v.id("resumes") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const resume = await ctx.db.get(id);
    if (!resume || resume.userId !== userId) throw new Error("Not found");

    const all = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const r of all) {
      if (r._id === id) {
        await ctx.db.patch(r._id, { isDefault: true });
      } else if (r.isDefault) {
        await ctx.db.patch(r._id, { isDefault: undefined });
      }
    }

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (prefs?.alwaysUseLatestResume) {
      await ctx.db.patch(prefs._id, { alwaysUseLatestResume: undefined });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("resumes") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const resume = await ctx.db.get(id);
    if (!resume || resume.userId !== userId) throw new Error("Not found");

    // Clear resumeId from jobs that used this resume (resumeName is retained)
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const job of jobs) {
      if (job.resumeId === id) {
        await ctx.db.patch(job._id, { resumeId: undefined });
      }
    }

    await ctx.storage.delete(resume.storageId);
    await ctx.db.delete(id);
  },
});
