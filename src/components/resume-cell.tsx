import type { Job, Resume, ResumeId } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResumePreviewLink } from "@/components/resume-preview-link";

export function ResumeCell({
  job,
  resumes,
  onUpdate,
}: {
  job: Job;
  resumes: Resume[];
  onUpdate: (resumeId: ResumeId) => void;
}) {
  const canEdit = resumes.length >= 1;
  const isDeleted = !job.resumeId && !!job.resumeName;
  const nameClass = isDeleted ? "text-muted-foreground/40" : "";

  if (canEdit) {
    return (
      <div className="group/resume flex min-w-0 items-center gap-1">
        <Select
          value={job.resumeId ?? undefined}
          onValueChange={(v) => onUpdate(v as ResumeId)}
        >
          <SelectTrigger className="h-7 w-auto min-w-0 cursor-pointer border-none bg-transparent p-0 text-sm shadow-none focus:ring-0 [&>svg]:hidden">
            <SelectValue placeholder={
              <span className={`-mx-1 cursor-pointer truncate px-1 py-0.5 hover:bg-muted ${nameClass}`}>
                {job.resumeName || "—"}
              </span>
            }>
              <span className="-mx-1 cursor-pointer truncate px-1 py-0.5 hover:bg-muted">
                {job.resumeName || "—"}
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
        <ResumeEyeIcon resumeId={job.resumeId} resumes={resumes} />
      </div>
    );
  }

  return (
    <div className="group/resume flex min-w-0 items-center gap-1">
      <span className={`truncate text-sm ${nameClass}`}>{job.resumeName || "—"}</span>
      <ResumeEyeIcon resumeId={job.resumeId} resumes={resumes} />
    </div>
  );
}

function ResumeEyeIcon({
  resumeId,
  resumes,
}: {
  resumeId?: ResumeId;
  resumes: Resume[];
}) {
  if (!resumeId) return null;
  const resume = resumes.find((r) => r._id === resumeId);
  if (!resume) return null;
  return (
    <ResumePreviewLink
      storageId={resume.storageId}
      className="inline-flex cursor-pointer p-0.5 text-muted-foreground/0 transition-colors group-hover/resume:text-muted-foreground hover:text-foreground!"
    />
  );
}
