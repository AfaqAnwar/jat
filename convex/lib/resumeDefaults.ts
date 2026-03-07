import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * When a resume is explicitly starred, clear `alwaysUseLatestResume`
 * and unstar all other resumes.
 */
export async function starResume(
  ctx: Pick<MutationCtx, "db">,
  userId: Id<"users">,
  resumeId: Id<"resumes">,
) {
  const all = await ctx.db
    .query("resumes")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  for (const r of all) {
    if (r._id === resumeId) {
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
}

/**
 * When `alwaysUseLatestResume` is toggled, sync the resume stars accordingly.
 */
export async function syncResumeStarsForLatestPref(
  ctx: Pick<MutationCtx, "db">,
  userId: Id<"users">,
  enabled: boolean,
) {
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
    const latest = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    if (latest) {
      for (const r of resumes) {
        if (r._id === latest._id) {
          await ctx.db.patch(r._id, { isDefault: true });
        } else if (r.isDefault) {
          await ctx.db.patch(r._id, { isDefault: undefined });
        }
      }
    }
  }
}
