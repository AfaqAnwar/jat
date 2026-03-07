import type { Doc, Id } from "../../convex/_generated/dataModel";

export type Status = Doc<"jobs">["status"];
export type LocType = "onsite" | "remote" | "hybrid";
export type Job = Doc<"jobs"> & { resumeName: string | null };
export type Resume = Doc<"resumes">;

export const STATUSES: Status[] = [
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "ghosted",
];

export const LOC_TYPES = ["onsite", "remote", "hybrid"] as const;

export type ResumeId = Id<"resumes">;
export type JobId = Id<"jobs">;
