import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  jobs: defineTable({
    userId: v.id("users"),
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
  }).index("by_user", ["userId"]),
  resumes: defineTable({
    userId: v.id("users"),
    name: v.string(),
    storageId: v.id("_storage"),
    isDefault: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),
  userPreferences: defineTable({
    userId: v.id("users"),
    alwaysUseLatestResume: v.optional(v.boolean()),
    state: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});

export default schema;
