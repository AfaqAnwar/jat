import type { Id } from "../../convex/_generated/dataModel";
import type { Resume } from "@/lib/types";
import { CheckIcon } from "@phosphor-icons/react";

export function ResumePickerList({
  resumes,
  resumeOverride,
  defaultResumeName,
  onSelect,
  variant = "popover",
}: {
  resumes: Resume[];
  resumeOverride: Id<"resumes"> | "";
  defaultResumeName: string | undefined;
  onSelect: (id: Id<"resumes"> | "") => void;
  variant?: "popover" | "stacked";
}) {
  if (variant === "stacked") {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Resume</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelect("")}
            aria-pressed={!resumeOverride}
            className={`flex w-full items-center gap-2 rounded-none border px-3 py-2 text-left text-sm ${!resumeOverride ? "border-foreground" : "border-border"}`}
          >
            Default ({defaultResumeName ?? "latest"})
          </button>
          {resumes.map((r) => (
            <button
              key={r._id}
              type="button"
              onClick={() => onSelect(r._id)}
              aria-pressed={resumeOverride === r._id}
              className={`flex w-full items-center gap-2 rounded-none border px-3 py-2 text-left text-sm ${resumeOverride === r._id ? "border-foreground" : "border-border"}`}
            >
              {r.name}
            </button>
          ))}
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
