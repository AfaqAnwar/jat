import { v } from "convex/values";

export const locationTypeValidator = v.union(
  v.literal("onsite"),
  v.literal("remote"),
  v.literal("hybrid"),
);

export const statusValidator = v.union(
  v.literal("applied"),
  v.literal("interviewing"),
  v.literal("offer"),
  v.literal("rejected"),
  v.literal("ghosted"),
);
