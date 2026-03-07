import type { Doc, Id } from "../../convex/_generated/dataModel";

export type Status = Doc<"jobs">["status"];
export type LocType = "onsite" | "remote" | "hybrid";
export type Job = Omit<Doc<"jobs">, "resumeName"> & { resumeName: string | null };
export type Resume = Doc<"resumes">;

export const STATUSES = [
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "ghosted",
] as const satisfies readonly Status[];

export const LOC_TYPES = ["onsite", "remote", "hybrid"] as const;

export function cycleLocationType(current?: string | null): LocType {
  const idx = LOC_TYPES.indexOf((current ?? "onsite") as LocType);
  return LOC_TYPES[(idx + 1) % LOC_TYPES.length];
}

export type ResumeId = Id<"resumes">;
export type JobId = Id<"jobs">;

export type ManualEntry = {
  url: string;
  reason: string;
};

export type ManualJobFields = {
  role: string;
  company: string;
  sector?: string;
  salary?: string;
  location?: string;
  locationType?: LocType;
  dateApplied: string;
  datePosted?: string;
  status: Status;
  resumeId?: Id<"resumes">;
};
