import { useState, type ReactNode } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationTypeIcon, LOC_TYPE_CONFIG } from "@/components/location-type-icon";
import { cycleLocationType } from "@/lib/types";
import type { LocType, Resume, ManualEntry, ManualJobFields } from "@/lib/types";
import type { Id } from "../../convex/_generated/dataModel";
import { todayISO } from "@/lib/format-date";

export function ManualJobModal({
  entry,
  resumes,
  activeResumeId,
  onSubmit,
  onClose,
}: {
  entry: ManualEntry;
  resumes: Resume[] | undefined;
  activeResumeId: string | undefined;
  onSubmit: (fields: ManualJobFields) => Promise<boolean>;
  onClose: () => void;
}) {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState<LocType>("onsite");
  const [datePosted, setDatePosted] = useState("");
  const [resumeId, setResumeId] = useState(activeResumeId ?? "");
  const [submitting, setSubmitting] = useState(false);

  const today = todayISO();
  const canSubmit = role.trim().length > 0 && company.trim().length > 0;
  const showResumePicker = (resumes?.length ?? 0) > 1;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const success = await onSubmit({
      role: role.trim(),
      company: company.trim(),
      sector: sector.trim() || undefined,
      salary: salary.trim() || undefined,
      location: location.trim() || undefined,
      locationType,
      dateApplied: today,
      datePosted: datePosted || undefined,
      status: "applied",
      resumeId: resumeId ? (resumeId as Id<"resumes">) : undefined,
    });
    setSubmitting(false);
    if (success) onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Job Manually</DialogTitle>
          <p className="text-xs text-muted-foreground">{entry.reason}</p>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          className="space-y-3"
        >
          <Field label="Role" required>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Software Engineer"
              aria-required
              autoFocus
            />
          </Field>
          <Field label="Company" required>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
              aria-required
            />
          </Field>
          <Field label="Sector / Team">
            <Input
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Frontend"
            />
          </Field>
          <Field label="Salary">
            <Input
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="$140,000 - $180,000"
            />
          </Field>
          <Field label="Location">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLocationType(cycleLocationType(locationType))}
                className="flex w-24 shrink-0 cursor-pointer items-center justify-center gap-1 border px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                aria-label={`Work model: ${LOC_TYPE_CONFIG[locationType].title}. Click to change.`}
              >
                <LocationTypeIcon type={locationType} />
                <span>{LOC_TYPE_CONFIG[locationType].title}</span>
              </button>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="New York, NY"
                className="flex-1"
              />
            </div>
          </Field>
          <Field label="Posted">
            <Input
              type="date"
              value={datePosted}
              max={today}
              onChange={(e) => {
                const v = e.target.value;
                setDatePosted(v > today ? today : v);
              }}
              className={datePosted ? "" : "date-empty"}
            />
          </Field>
          {showResumePicker && (
            <Field label="Resume">
              <Select value={resumeId} onValueChange={setResumeId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resumes?.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <Button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full"
          >
            {submitting ? "Adding..." : "Add"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
