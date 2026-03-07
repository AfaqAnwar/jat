import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id, TableNames } from "../_generated/dataModel";

type DocWithUserId = { userId: Id<"users">; [key: string]: unknown };

export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function requireOwnership<T extends TableNames>(
  ctx: QueryCtx | MutationCtx,
  _table: T,
  id: Id<T>,
  userId: Id<"users">,
) {
  const doc = await ctx.db.get(id);
  if (!doc || (doc as unknown as DocWithUserId).userId !== userId) {
    throw new Error("Not found");
  }
  return doc;
}
