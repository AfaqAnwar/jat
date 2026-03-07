import type { Job, Resume, ResumeId } from "@/lib/types";
import { ResumeSelect } from "@/components/resume-select";
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
  return (
    <div className="group/resume flex min-w-0 items-center gap-1">
      <ResumeSelect
        job={job}
        resumes={resumes}
        onUpdate={onUpdate}
        valueLabelClassName="-mx-1 cursor-pointer px-1 py-0.5 hover:bg-muted"
      />
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
