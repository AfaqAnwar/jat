import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const setState = mutation({
  args: { state: v.string() },
  handler: async (ctx, { state }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { state: state || undefined });
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        state: state || undefined,
      });
    }
  },
});

export const setAlwaysUseLatestResume = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, { enabled }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { alwaysUseLatestResume: enabled });
    } else {
      await ctx.db.insert("userPreferences", {
        userId,
        alwaysUseLatestResume: enabled,
      });
    }

    if (enabled) {
      const resumes = await ctx.db
        .query("resumes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      for (const r of resumes) {
        if (r.isDefault) {
          await ctx.db.patch(r._id, { isDefault: undefined });
        }
      }
    }
  },
});
