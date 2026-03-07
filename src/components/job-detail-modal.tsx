import type { ReactNode } from "react";
import type { Job, Resume, JobId, ResumeId } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditableCell } from "@/components/editable-cell";
import { StatusSelect } from "@/components/status-select";
import { LocationTypeIcon } from "@/components/location-type-icon";
import { cycleLocationType } from "@/lib/types";
import { TrashIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";

export function JobDetailModal({
  job,
  resumes,
  onClose,
  onUpdate,
  onDelete,
}: {
  job: Job | null;
  resumes: Resume[];
  onClose: () => void;
  onUpdate: (id: JobId, field: string, value: string) => void;
  onDelete: (id: JobId) => Promise<void>;
}) {
  if (!job) return null;

  return (
    <Dialog open={!!job} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            <span className="truncate">{job.role || "Untitled Role"}</span>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Open posting"
            >
              <ArrowSquareOutIcon size={16} weight="light" />
            </a>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <DetailRow label="Company">
            <EditableCell
              value={job.company}
              onSave={(v) => onUpdate(job._id, "company", v)}
            />
          </DetailRow>
          <DetailRow label="Sector">
            <EditableCell
              value={job.sector ?? ""}
              onSave={(v) => onUpdate(job._id, "sector", v)}
              placeholder="—"
            />
          </DetailRow>
          <DetailRow label="Salary">
            <EditableCell
              value={job.salary ?? ""}
              onSave={(v) => onUpdate(job._id, "salary", v)}
              placeholder="—"
            />
          </DetailRow>
          <DetailRow label="Location">
            <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
              <LocationTypeIcon
                type={job.locationType}
                onCycle={() =>
                  onUpdate(job._id, "locationType", cycleLocationType(job.locationType))
                }
              />
              <div className="min-w-0 flex-1">
                <EditableCell
                  value={job.location ?? ""}
                  onSave={(v) => onUpdate(job._id, "location", v)}
                  placeholder="—"
                />
              </div>
            </div>
          </DetailRow>
          <DetailRow label="Applied">
            <EditableCell
              value={job.dateApplied}
              onSave={(v) => onUpdate(job._id, "dateApplied", v)}
              type="date"
            />
          </DetailRow>
          <DetailRow label="Posted">
            <EditableCell
              value={job.datePosted ?? ""}
              onSave={(v) => onUpdate(job._id, "datePosted", v)}
              type="date"
              placeholder="—"
            />
          </DetailRow>
          <DetailRow label="Status">
            <StatusSelect
              value={job.status}
              onValueChange={(s) => onUpdate(job._id, "status", s)}
            />
          </DetailRow>
          <DetailRow label="Resume">
            <ModalResumeSelect
              job={job}
              resumes={resumes}
              onUpdate={(resumeId) =>
                onUpdate(job._id, "resumeId", resumeId)
              }
            />
          </DetailRow>
          <div className="flex justify-end pt-2">
            <button
              onClick={async () => {
                await onDelete(job._id);
                onClose();
              }}
              className="cursor-pointer p-1 text-muted-foreground hover:text-destructive"
              aria-label="Delete"
            >
              <TrashIcon size={18} weight="light" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5rem_1fr] items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <div className="overflow-hidden *:truncate">{children}</div>
    </div>
  );
}

function ModalResumeSelect({
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

  if (!canEdit) {
    return (
      <span className={`truncate ${nameClass || "text-muted-foreground"}`}>
        {job.resumeName || "—"}
      </span>
    );
  }

  return (
    <Select
      value={job.resumeId ?? undefined}
      onValueChange={(v) => onUpdate(v as ResumeId)}
    >
      <SelectTrigger className="h-7 w-auto min-w-0 cursor-pointer border-none bg-transparent p-0 text-sm shadow-none focus:ring-0 [&>svg]:hidden">
        <SelectValue placeholder={
          <span className={`truncate ${nameClass}`}>{job.resumeName || "—"}</span>
        }>
          <span className="truncate">{job.resumeName || "—"}</span>
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
