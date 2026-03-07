import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Job, Resume, JobId, Status, ResumeId } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditableCell } from "@/components/editable-cell";
import { EditableRoleCell } from "@/components/editable-role-cell";
import { StatusSelect } from "@/components/status-select";
import { ResumeCell } from "@/components/resume-cell";
import { LocationTypeIcon } from "@/components/location-type-icon";
import { cycleLocationType } from "@/lib/types";
import { JobDetailModal } from "@/components/job-detail-modal";
import { TrashIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

export function JobTable({ jobs, resumes }: { jobs: Job[]; resumes: Resume[] }) {
  const updateJob = useMutation(api.jobs.update);
  const removeJob = useMutation(api.jobs.remove);
  const [editingRoleId, setEditingRoleId] = useState<JobId | null>(null);
  const [detailJobId, setDetailJobId] = useState<JobId | null>(null);
  const detailJob = detailJobId ? jobs.find((j) => j._id === detailJobId) ?? null : null;

  const handleUpdate = (id: JobId, field: string, value: string) => {
    void updateJob({ id, [field]: value || undefined });
  };

  const handleDelete = async (id: JobId) => {
    await removeJob({ id });
    toast.dismiss();
    toast.success("Job removed");
  };

  return (
    <>
      <div className="rounded-none border">
        <Table className="hidden table-fixed sm:table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[15%]">Role</TableHead>
              <TableHead className="w-[12%]">Company</TableHead>
              <TableHead className="hidden w-[14%] md:table-cell">Salary</TableHead>
              <TableHead className="hidden w-[14%] md:table-cell">Location</TableHead>
              <TableHead className="w-[10%]">Applied</TableHead>
              <TableHead className="hidden w-[10%] lg:table-cell">Posted</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="hidden w-[14%] lg:table-cell">Resume</TableHead>
              <TableHead className="w-8" />
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <DesktopJobRow
                key={job._id}
                job={job}
                resumes={resumes}
                isEditingRole={editingRoleId === job._id}
                onEditingRoleChange={(editing) =>
                  setEditingRoleId(editing ? job._id : null)
                }
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onStatusChange={(status) =>
                  void updateJob({ id: job._id, status: status as Status })
                }
                onLocationTypeCycle={() =>
                  void updateJob({
                    id: job._id,
                    locationType: cycleLocationType(job.locationType),
                  })
                }
                onResumeChange={(resumeId) =>
                  void updateJob({ id: job._id, resumeId: resumeId as ResumeId })
                }
              />
            ))}
          </TableBody>
        </Table>

        <div className="sm:hidden divide-y">
          {jobs.map((job) => (
            <MobileJobRow
              key={job._id}
              job={job}
              onTap={() => setDetailJobId(job._id)}
              onStatusChange={(status) =>
                void updateJob({ id: job._id, status: status as Status })
              }
            />
          ))}
        </div>
      </div>

      {/* Spacer for mobile sticky add bar */}
      <div className="h-16 sm:hidden" />

      <JobDetailModal
        job={detailJob}
        resumes={resumes}
        onClose={() => setDetailJobId(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </>
  );
}

function DesktopJobRow({
  job,
  resumes,
  isEditingRole,
  onEditingRoleChange,
  onUpdate,
  onDelete,
  onStatusChange,
  onLocationTypeCycle,
  onResumeChange,
}: {
  job: Job;
  resumes: Resume[];
  isEditingRole: boolean;
  onEditingRoleChange: (editing: boolean) => void;
  onUpdate: (id: JobId, field: string, value: string) => void;
  onDelete: (id: JobId) => Promise<void>;
  onStatusChange: (status: string) => void;
  onLocationTypeCycle: () => void;
  onResumeChange: (resumeId: string) => void;
}) {
  return (
    <TableRow className="group">
      <TableCell className="max-w-[180px] font-medium">
        <div className="group/role relative">
          <EditableRoleCell
            role={job.role}
            sector={job.sector ?? ""}
            onSaveRole={(v) => onUpdate(job._id, "role", v)}
            onSaveSector={(v) => onUpdate(job._id, "sector", v)}
            onEditingChange={onEditingRoleChange}
          />
          {job.sector && !isEditingRole && (
            <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden rounded-none bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover/role:block">
              {job.sector}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="max-w-[140px]">
        <EditableCell
          value={job.company}
          onSave={(v) => onUpdate(job._id, "company", v)}
        />
      </TableCell>
      <TableCell className="hidden max-w-[160px] md:table-cell">
        <EditableCell
          value={job.salary ?? ""}
          onSave={(v) => onUpdate(job._id, "salary", v)}
        />
      </TableCell>
      <TableCell className="hidden max-w-[200px] md:table-cell">
        <div className="flex items-center gap-1.5">
          <LocationTypeIcon type={job.locationType} onCycle={onLocationTypeCycle} />
          <div className="min-w-0 flex-1 truncate">
            <EditableCell
              value={job.location ?? ""}
              onSave={(v) => onUpdate(job._id, "location", v)}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <EditableCell
          value={job.dateApplied}
          onSave={(v) => onUpdate(job._id, "dateApplied", v)}
          type="date"
        />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <EditableCell
          value={job.datePosted ?? ""}
          onSave={(v) => onUpdate(job._id, "datePosted", v)}
          type="date"
        />
      </TableCell>
      <TableCell>
        <StatusSelect value={job.status} onValueChange={onStatusChange} />
      </TableCell>
      <TableCell className="hidden max-w-[200px] lg:table-cell">
        <ResumeCell job={job} resumes={resumes} onUpdate={onResumeChange} />
      </TableCell>
      <TableCell>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex cursor-pointer p-1 text-muted-foreground hover:text-foreground"
          aria-label="Open posting"
        >
          <ArrowSquareOutIcon size={16} weight="light" />
        </a>
      </TableCell>
      <TableCell className="pr-4">
        <button
          onClick={() => void onDelete(job._id)}
          className="cursor-pointer rounded-none p-1 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:text-foreground!"
          aria-label="Delete"
        >
          <TrashIcon size={16} weight="light" />
        </button>
      </TableCell>
    </TableRow>
  );
}

function MobileJobRow({
  job,
  onTap,
  onStatusChange,
}: {
  job: Job;
  onTap: () => void;
  onStatusChange: (status: string) => void;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-3 px-4 py-3">
      <button
        type="button"
        onClick={onTap}
        className="min-w-0 flex-1 cursor-pointer text-left active:opacity-70"
      >
        <p className="truncate text-sm font-medium">
          {job.role || "Untitled Role"}
        </p>
        <p className="truncate text-xs text-muted-foreground">{job.company}</p>
      </button>
      <StatusSelect value={job.status} onValueChange={onStatusChange} />
    </div>
  );
}
