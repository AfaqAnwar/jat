import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireAuth } from "./lib/auth";
import { syncResumeStarsForLatestPref } from "./lib/resume-defaults";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx).catch(() => null);
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
    const userId = await requireAuth(ctx);
    await upsertPreferences(ctx, userId, { state: state === "" ? undefined : state });
  },
});

export const setAlwaysUseLatestResume = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, { enabled }) => {
    const userId = await requireAuth(ctx);
    await upsertPreferences(ctx, userId, { alwaysUseLatestResume: enabled });
    await syncResumeStarsForLatestPref(ctx, userId, enabled);
  },
});
