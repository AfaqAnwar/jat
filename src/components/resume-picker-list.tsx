import type { Id } from "../../convex/_generated/dataModel";
import type { Resume } from "@/lib/types";
import { CheckIcon } from "@phosphor-icons/react";
import { ResumePreviewLink } from "@/components/resume-preview-link";

export function ResumePickerList({
  resumes,
  resumeOverride,
  defaultResumeId,
  defaultResumeName,
  onSelect,
  variant = "popover",
}: {
  resumes: Resume[];
  resumeOverride: Id<"resumes"> | "";
  defaultResumeId: Id<"resumes"> | undefined;
  defaultResumeName: string | undefined;
  onSelect: (id: Id<"resumes"> | "") => void;
  variant?: "popover" | "stacked";
}) {
  const activeId = resumeOverride || defaultResumeId;

  if (variant === "stacked") {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Resume</p>
        <div className="space-y-1">
          {resumes.map((r) => {
            const isActive = r._id === activeId;
            return (
              <div
                key={r._id}
                className={`flex w-full items-center rounded-none border text-sm ${isActive ? "border-foreground" : "border-border"}`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(r._id === defaultResumeId ? "" : r._id)}
                  aria-pressed={isActive}
                  className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left"
                >
                  <span className="truncate">{r.name}</span>
                  {!resumeOverride && r._id === defaultResumeId && (
                    <span className="shrink-0 text-xs text-muted-foreground">(default)</span>
                  )}
                </button>
                <ResumePreviewLink
                  storageId={r.storageId}
                  className="shrink-0 px-2.5 py-2 text-muted-foreground hover:text-foreground"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="px-2 pb-1 text-xs text-muted-foreground">
        Resume for this submission
      </p>
      <button
        onClick={() => onSelect("")}
        aria-pressed={!resumeOverride}
        className="flex w-full cursor-pointer items-center gap-2 rounded-none px-2 py-1.5 text-left text-sm hover:bg-accent"
      >
        <span className="w-4 shrink-0">
          {!resumeOverride && <CheckIcon size={14} weight="light" />}
        </span>
        Default{defaultResumeName ? ` (${defaultResumeName})` : ""}
      </button>
      {resumes.map((r) => (
        <button
          key={r._id}
          onClick={() => onSelect(r._id)}
          aria-pressed={resumeOverride === r._id}
          className="flex w-full cursor-pointer items-center gap-2 rounded-none px-2 py-1.5 text-left text-sm hover:bg-accent"
        >
          <span className="w-4 shrink-0">
            {resumeOverride === r._id && <CheckIcon size={14} weight="light" />}
          </span>
          {r.name}
        </button>
      ))}
    </>
  );
}
