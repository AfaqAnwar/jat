import type { Job, Resume, ResumeId } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ResumeSelect({
  job,
  resumes,
  onUpdate,
  triggerClassName,
  valueLabelClassName,
}: {
  job: Job;
  resumes: Resume[];
  onUpdate: (resumeId: ResumeId) => void;
  triggerClassName?: string;
  valueLabelClassName?: string;
}) {
  const canEdit = resumes.length >= 1;
  const isDeleted = !job.resumeId && !!job.resumeName;
  const nameClass = isDeleted ? "text-muted-foreground/40" : "";
  const displayName = job.resumeName || "—";

  if (!canEdit) {
    return (
      <span className={`truncate text-sm ${nameClass || "text-muted-foreground"}`}>
        {displayName}
      </span>
    );
  }

  return (
    <Select
      value={job.resumeId ?? undefined}
      onValueChange={(v) => onUpdate(v as ResumeId)}
    >
      <SelectTrigger
        className={
          triggerClassName ??
          "h-7 w-auto min-w-0 cursor-pointer border-none bg-transparent p-0 text-sm shadow-none focus:ring-0 [&>svg]:hidden"
        }
      >
        <SelectValue
          placeholder={
            <span className={`truncate ${nameClass} ${valueLabelClassName ?? ""}`}>
              {displayName}
            </span>
          }
        >
          <span className={`truncate ${valueLabelClassName ?? ""}`}>
            {displayName}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {resumes.map((r) => (
          <SelectItem key={r._id} value={r._id}>
            {r.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
