import type { Doc } from "../../convex/_generated/dataModel";

type Resume = Doc<"resumes">;

export function getDefaultResumeId(
  resumes: Resume[] | undefined,
  alwaysUseLatest?: boolean,
): string | undefined {
  if (!resumes || resumes.length === 0) return undefined;
  if (resumes.length === 1) return resumes[0]._id;

  if (alwaysUseLatest) {
    return resumes[resumes.length - 1]._id;
  }

  const starred = resumes.find((r) => r.isDefault);
  if (starred) return starred._id;

  return resumes[resumes.length - 1]._id;
}
