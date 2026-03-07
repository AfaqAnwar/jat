import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { LocType, Status } from "@/lib/types";
import { toast } from "sonner";
import { normalizeUrl } from "@/lib/normalize-url";
import { getDefaultResumeId } from "@/lib/use-default-resume";
import { resolveLocation } from "@/lib/resolve-location";
import { todayISO } from "@/lib/format-date";

export type ManualEntry = {
  url: string;
  reason: string;
};

export type ManualJobFields = {
  role: string;
  company: string;
  sector?: string;
  salary?: string;
  location?: string;
  locationType?: LocType;
  dateApplied: string;
  datePosted?: string;
  status: Status;
  resumeId?: Id<"resumes">;
};

export function useAddJob() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeOverride, setResumeOverride] = useState<Id<"resumes"> | "">("");
  const [manualEntry, setManualEntry] = useState<ManualEntry | null>(null);

  const parseJob = useAction(api.parseJob.fromUrl);
  const addJob = useMutation(api.jobs.add);
  const resumes = useQuery(api.resumes.list);
  const prefs = useQuery(api.preferences.get);

  const defaultResumeId = getDefaultResumeId(resumes, prefs?.alwaysUseLatestResume ?? false);
  const activeResumeId = resumeOverride || defaultResumeId;
  const hasMultipleResumes = (resumes?.length ?? 0) > 1;

  const activeResumeName = resumes?.find((r) => r._id === activeResumeId)?.name;
  const defaultResumeName = resumes?.find((r) => r._id === defaultResumeId)?.name;

  const errorMessage = (error: string | undefined): string => {
    if (error === "spa") return "This site loads dynamically and can't be read automatically.";
    if (error === "fetch") return "Couldn't reach that URL.";
    return "Couldn't extract job data automatically.";
  };

  const submit = async (): Promise<boolean> => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      toast.dismiss();
      toast.error("Invalid URL — paste a direct link to a job posting");
      return false;
    }

    setLoading(true);
    try {
      const result = await parseJob({ url: normalized });

      const hasRole = !!result.role;
      const hasCompany = !!result.company;

      if (!hasRole && !hasCompany) {
        const error = "error" in result ? (result.error as string) : undefined;
        setManualEntry({ url: normalized, reason: errorMessage(error) });
        return false;
      }

      await addJob({
        url: normalized,
        role: result.role || "Untitled Role",
        sector: result.sector || undefined,
        company: result.company || "Unknown Company",
        salary: result.salary || undefined,
        location: resolveLocation(result.locations, prefs?.state ?? undefined) || undefined,
        locationType: result.locationType !== "onsite" ? result.locationType : undefined,
        dateApplied: todayISO(),
        datePosted: result.datePosted || undefined,
        status: "applied",
        resumeId: (activeResumeId as Id<"resumes">) || undefined,
      });

      setUrl("");
      setResumeOverride("");
      toast.dismiss();

      if (!hasRole || !hasCompany) {
        toast.warning("Added with incomplete data — click any field to edit", {
          duration: 5000,
        });
      } else {
        toast.success(`Added ${result.role} at ${result.company}`);
      }
      return true;
    } catch {
      setManualEntry({ url: normalized, reason: "Something went wrong while parsing." });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitManual = async (fields: ManualJobFields): Promise<boolean> => {
    if (!manualEntry) return false;

    try {
      await addJob({
        url: manualEntry.url,
        role: fields.role,
        sector: fields.sector || undefined,
        company: fields.company,
        salary: fields.salary || undefined,
        location: fields.location || undefined,
        locationType: fields.locationType !== "onsite" ? fields.locationType : undefined,
        dateApplied: fields.dateApplied,
        datePosted: fields.datePosted || undefined,
        status: fields.status,
        resumeId: fields.resumeId || undefined,
      });

      setUrl("");
      setResumeOverride("");
      setManualEntry(null);
      toast.dismiss();
      toast.success(`Added ${fields.role} at ${fields.company}`);
      return true;
    } catch {
      toast.dismiss();
      toast.error("Failed to add job");
      return false;
    }
  };

  const dismissManualEntry = () => setManualEntry(null);

  const selectResume = (id: Id<"resumes"> | "") => {
    setResumeOverride(id);
  };

  return {
    url,
    setUrl,
    loading,
    submit,
    manualEntry,
    submitManual,
    dismissManualEntry,
    resumeOverride,
    selectResume,
    resumes,
    activeResumeId,
    activeResumeName,
    defaultResumeId,
    defaultResumeName,
    hasMultipleResumes,
  };
}
