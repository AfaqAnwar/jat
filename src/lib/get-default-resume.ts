import type { Id } from "../../convex/_generated/dataModel";
import type { Resume } from "@/lib/types";

export function getDefaultResumeId(
  resumes: Resume[] | undefined,
  alwaysUseLatest?: boolean,
): Id<"resumes"> | undefined {
  if (!resumes || resumes.length === 0) return undefined;
  if (resumes.length === 1) return resumes[0]._id;

  if (alwaysUseLatest) {
    const sorted = [...resumes].sort((a, b) => a._creationTime - b._creationTime);
    return sorted[sorted.length - 1]._id;
  }

  const starred = resumes.find((r) => r.isDefault);
  if (starred) return starred._id;

  const sorted = [...resumes].sort((a, b) => a._creationTime - b._creationTime);
  return sorted[sorted.length - 1]._id;
}
