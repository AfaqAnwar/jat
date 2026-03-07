import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Id } from "../../convex/_generated/dataModel";
import { GearSixIcon, CheckIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { normalizeUrl } from "@/lib/normalize-url";
import { getDefaultResumeId } from "@/lib/use-default-resume";
import { resolveLocation } from "@/lib/resolve-location";

export function AddJobBar() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeOverride, setResumeOverride] = useState<Id<"resumes"> | "">("");
  const [gearOpen, setGearOpen] = useState(false);

  const parseJob = useAction(api.parseJob.fromUrl);
  const addJob = useMutation(api.jobs.add);
  const resumes = useQuery(api.resumes.list);
  const prefs = useQuery(api.preferences.get);

  const defaultResumeId = getDefaultResumeId(resumes, prefs?.alwaysUseLatestResume ?? false);
  const activeResumeId = resumeOverride || defaultResumeId;
  const hasMultipleResumes = (resumes?.length ?? 0) > 1;

  const activeResumeName = resumes?.find((r) => r._id === activeResumeId)?.name;
  const defaultResumeName = resumes?.find((r) => r._id === defaultResumeId)?.name;

  const handleSubmit = async () => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      toast.dismiss();
      toast.error("Invalid URL — paste a direct link to a job posting");
      return;
    }

    setLoading(true);
    try {
      const result = await parseJob({ url: normalized });

      const hasRole = !!result.role;
      const hasCompany = !!result.company;

      if (!hasRole && !hasCompany) {
        toast.dismiss();
        toast.error("This doesn't look like a job posting — couldn't extract any data");
        return;
      }

      await addJob({
        url: normalized,
        role: result.role || "Untitled Role",
        sector: result.sector || undefined,
        company: result.company || "Unknown Company",
        salary: result.salary || undefined,
        location: resolveLocation(result.locations, prefs?.state ?? undefined) || undefined,
        locationType: result.locationType !== "onsite" ? result.locationType : undefined,
        dateApplied: new Date().toISOString().split("T")[0],
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
    } catch {
      toast.dismiss();
      toast.error("Something went wrong — check the URL and try again");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      void handleSubmit();
    }
  };

  const selectResume = (id: Id<"resumes"> | "") => {
    setResumeOverride(id);
    setGearOpen(false);
  };

  return (
    <div className="hidden sm:flex gap-2">
      <Input
        placeholder="Paste a job URL and press Enter..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1"
        disabled={loading}
      />
      {hasMultipleResumes && (
        <Popover open={gearOpen} onOpenChange={setGearOpen}>
          <PopoverTrigger asChild>
            <button
              className="flex cursor-pointer items-center justify-center rounded-none border px-2 text-muted-foreground hover:text-foreground"
              title={activeResumeName ? `Resume: ${activeResumeName}` : "Select resume"}
            >
              <GearSixIcon size={16} weight="light" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 rounded-none p-2">
            <p className="px-2 pb-1 text-xs text-muted-foreground">
              Resume for this submission
            </p>
            <button
              onClick={() => selectResume("")}
              className="flex w-full cursor-pointer items-center gap-2 rounded-none px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <span className="w-4 shrink-0">
                {!resumeOverride && <CheckIcon size={14} weight="light" />}
              </span>
              Default{defaultResumeName ? ` (${defaultResumeName})` : ""}
            </button>
            {resumes?.map((r) => (
              <button
                key={r._id}
                onClick={() => selectResume(r._id)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-none px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <span className="w-4 shrink-0">
                  {resumeOverride === r._id && <CheckIcon size={14} weight="light" />}
                </span>
                {r.name}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
      <Button
        onClick={() => void handleSubmit()}
        disabled={loading || !url.trim()}
        size="default"
      >
        {loading ? "Adding..." : "Add"}
      </Button>
    </div>
  );
}
