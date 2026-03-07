import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { locationTypeValidator, statusValidator } from "./lib/validators";

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
    locationType: v.optional(locationTypeValidator),
    dateApplied: v.string(),
    datePosted: v.optional(v.string()),
    status: statusValidator,
    resumeId: v.optional(v.id("resumes")),
    resumeName: v.optional(v.string()),
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
