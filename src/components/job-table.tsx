import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { EditableCell } from "@/components/editable-cell";
import { EditableRoleCell } from "@/components/editable-role-cell";
import { TrashIcon, ArrowSquareOutIcon, EyeIcon, BuildingsIcon, WifiHighIcon, CircleHalfTiltIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

type Status = Doc<"jobs">["status"];

const statuses: Status[] = [
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "ghosted",
];

type Job = Doc<"jobs"> & { resumeName: string | null };
type Resume = Doc<"resumes">;

export function JobTable({ jobs, resumes }: { jobs: Job[]; resumes: Resume[] }) {
  const updateJob = useMutation(api.jobs.update);
  const removeJob = useMutation(api.jobs.remove);
  const [editingRoleId, setEditingRoleId] = useState<Id<"jobs"> | null>(null);
  const [detailJobId, setDetailJobId] = useState<Id<"jobs"> | null>(null);
  const detailJob = detailJobId ? jobs.find((j) => j._id === detailJobId) ?? null : null;

  const handleUpdate = (id: Id<"jobs">, field: string, value: string) => {
    void updateJob({ id, [field]: value || undefined });
  };

  const handleDelete = async (id: Id<"jobs">) => {
    await removeJob({ id });
    toast.dismiss();
    toast.success("Job removed");
  };

  return (
    <>
      <div className="rounded-none border">
        {/* Desktop table */}
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
            {jobs.map((job) => {
              const isEditingRole = editingRoleId === job._id;
              return (
                <TableRow key={job._id} className="group">
                  <TableCell className="max-w-[180px] font-medium">
                    <div className="group/role relative">
                      <EditableRoleCell
                        role={job.role}
                        sector={job.sector ?? ""}
                        onSaveRole={(v) => handleUpdate(job._id, "role", v)}
                        onSaveSector={(v) => handleUpdate(job._id, "sector", v)}
                        onEditingChange={(editing) =>
                          setEditingRoleId(editing ? job._id : null)
                        }
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
                      onSave={(v) => handleUpdate(job._id, "company", v)}
                    />
                  </TableCell>
                  <TableCell className="hidden max-w-[160px] md:table-cell">
                    <EditableCell
                      value={job.salary ?? ""}
                      onSave={(v) => handleUpdate(job._id, "salary", v)}
                    />
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <LocationTypeIcon
                        type={job.locationType}
                        onCycle={() =>
                          void updateJob({
                            id: job._id,
                            locationType: cycleLocationType(job.locationType),
                          })
                        }
                      />
                      <div className="min-w-0 flex-1 truncate">
                        <EditableCell
                          value={job.location ?? ""}
                          onSave={(v) => handleUpdate(job._id, "location", v)}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <EditableCell
                      value={job.dateApplied}
                      onSave={(v) => handleUpdate(job._id, "dateApplied", v)}
                      type="date"
                    />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <EditableCell
                      value={job.datePosted ?? ""}
                      onSave={(v) => handleUpdate(job._id, "datePosted", v)}
                      type="date"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={job.status}
                      onValueChange={(v) =>
                        void updateJob({ id: job._id, status: v as Status })
                      }
                    >
                      <SelectTrigger className="h-8 w-auto cursor-pointer border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden">
                        <SelectValue>
                          <StatusBadge status={job.status} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            <StatusBadge status={s} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] lg:table-cell">
                    <ResumeCell
                      job={job}
                      resumes={resumes}
                      onUpdate={(resumeId) =>
                        void updateJob({ id: job._id, resumeId })
                      }
                    />
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
                      onClick={() => void handleDelete(job._id)}
                      className="cursor-pointer rounded-none p-1 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:text-foreground!"
                      aria-label="Delete"
                    >
                      <TrashIcon size={16} weight="light" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="flex w-full items-center justify-between gap-3 px-4 py-3"
            >
              <button
                type="button"
                onClick={() => setDetailJobId(job._id)}
                className="min-w-0 flex-1 cursor-pointer text-left active:opacity-70"
              >
                <p className="truncate text-sm font-medium">
                  {job.role || "Untitled Role"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {job.company}
                </p>
              </button>
              <Select
                value={job.status}
                onValueChange={(v) =>
                  void updateJob({ id: job._id, status: v as Status })
                }
              >
                <SelectTrigger className="h-auto w-auto shrink-0 cursor-pointer border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden">
                  <SelectValue>
                    <StatusBadge status={job.status} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      <StatusBadge status={s} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
        updateJob={updateJob}
      />
    </>
  );
}

function ResumeCell({
  job,
  resumes,
  onUpdate,
}: {
  job: Job;
  resumes: Resume[];
  onUpdate: (resumeId: Id<"resumes">) => void;
}) {
  const canEdit = resumes.length > 1 || (resumes.length >= 1 && !job.resumeName);

  if (canEdit) {
    return (
      <div className="group/resume flex min-w-0 items-center gap-1">
        <Select
          value={job.resumeId ?? ""}
          onValueChange={(v) => onUpdate(v as Id<"resumes">)}
        >
          <SelectTrigger className="h-7 w-auto min-w-0 cursor-pointer border-none bg-transparent p-0 text-sm shadow-none focus:ring-0 [&>svg]:hidden">
            <SelectValue>
              <span className="cursor-pointer truncate rounded px-1 py-0.5 hover:bg-muted">
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
        {job.resumeId && (
          <ResumeViewIcon storageId={job.resumeId} resumes={resumes} />
        )}
      </div>
    );
  }

  return (
    <div className="group/resume flex min-w-0 items-center gap-1">
      <span className="truncate text-sm">{job.resumeName || "—"}</span>
      {job.resumeId && (
        <ResumeViewIcon storageId={job.resumeId} resumes={resumes} />
      )}
    </div>
  );
}

function ResumeViewIcon({
  storageId,
  resumes,
}: {
  storageId: Id<"resumes">;
  resumes: Resume[];
}) {
  const resume = resumes.find((r) => r._id === storageId);
  const url = useQuery(
    api.resumes.getUrl,
    resume ? { storageId: resume.storageId } : "skip",
  );
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex cursor-pointer p-0.5 text-muted-foreground/0 transition-colors group-hover/resume:text-muted-foreground hover:text-foreground!"
      aria-label="View resume"
    >
      <EyeIcon size={14} weight="light" />
    </a>
  );
}

function JobDetailModal({
  job,
  resumes,
  onClose,
  onUpdate,
  onDelete,
  updateJob,
}: {
  job: Job | null;
  resumes: Resume[];
  onClose: () => void;
  onUpdate: (id: Id<"jobs">, field: string, value: string) => void;
  onDelete: (id: Id<"jobs">) => Promise<void>;
  updateJob: ReturnType<typeof useMutation<typeof api.jobs.update>>;
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
                  void updateJob({
                    id: job._id,
                    locationType: cycleLocationType(job.locationType),
                  })
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
            <Select
              value={job.status}
              onValueChange={(v) =>
                void updateJob({ id: job._id, status: v as Status })
              }
            >
              <SelectTrigger className="h-8 w-auto cursor-pointer border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden">
                <SelectValue>
                  <StatusBadge status={job.status} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    <StatusBadge status={s} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DetailRow>
          <DetailRow label="Resume">
            {resumes.length > 1 || (resumes.length >= 1 && !job.resumeName) ? (
              <Select
                value={job.resumeId ?? ""}
                onValueChange={(v) =>
                  void updateJob({ id: job._id, resumeId: v as Id<"resumes"> })
                }
              >
                <SelectTrigger className="h-7 w-auto min-w-0 cursor-pointer border-none bg-transparent p-0 text-sm shadow-none focus:ring-0 [&>svg]:hidden">
                  <SelectValue>
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
            ) : (
              <span className="truncate text-muted-foreground">
                {job.resumeName || "—"}
              </span>
            )}
          </DetailRow>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                void onDelete(job._id);
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

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[5rem_1fr] items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <div className="overflow-hidden *:truncate">{children}</div>
    </div>
  );
}

const locTypes = ["onsite", "remote", "hybrid"] as const;
type LocType = (typeof locTypes)[number];

const locTypeConfig = {
  onsite: { icon: BuildingsIcon, title: "On-site" },
  remote: { icon: WifiHighIcon, title: "Remote" },
  hybrid: { icon: CircleHalfTiltIcon, title: "Hybrid" },
} as const;

function LocationTypeIcon({
  type,
  onCycle,
}: {
  type?: string | null;
  onCycle?: () => void;
}) {
  const key = (type ?? "onsite") as LocType;
  const config = locTypeConfig[key] ?? locTypeConfig.onsite;
  const Icon = config.icon;

  if (!onCycle) {
    return (
      <span title={config.title} className="shrink-0 text-muted-foreground/50">
        <Icon size={13} weight="light" />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onCycle}
      title={config.title}
      className="shrink-0 cursor-pointer text-muted-foreground/50 hover:text-muted-foreground"
    >
      <Icon size={13} weight="light" />
    </button>
  );
}

function cycleLocationType(current?: string | null): LocType {
  const idx = locTypes.indexOf((current ?? "onsite") as LocType);
  return locTypes[(idx + 1) % locTypes.length];
}
