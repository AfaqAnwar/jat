import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

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

async function upsertPreferences(
  ctx: Pick<MutationCtx, "db">,
  userId: Id<"users">,
  patch: Partial<{ state: string; alwaysUseLatestResume: boolean }>,
) {
  const existing = await ctx.db
    .query("userPreferences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, patch);
  } else {
    await ctx.db.insert("userPreferences", { userId, ...patch });
  }
}

export const setState = mutation({
  args: { state: v.string() },
  handler: async (ctx, { state }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await upsertPreferences(ctx, userId, { state: state || undefined });
  },
});

export const setAlwaysUseLatestResume = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, { enabled }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await upsertPreferences(ctx, userId, { alwaysUseLatestResume: enabled });

    const resumes = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (enabled) {
      for (const r of resumes) {
        if (r.isDefault) {
          await ctx.db.patch(r._id, { isDefault: undefined });
        }
      }
    } else if (resumes.length > 0) {
      // Star the latest resume so there's always a visible default
      const latest = resumes[resumes.length - 1];
      await ctx.db.patch(latest._id, { isDefault: true });
    }
  },
});
