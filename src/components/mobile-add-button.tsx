import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Id } from "../../convex/_generated/dataModel";
import { PlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { normalizeUrl } from "@/lib/normalize-url";
import { getDefaultResumeId } from "@/lib/use-default-resume";
import { resolveLocation } from "@/lib/resolve-location";

export function MobileAddButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeOverride, setResumeOverride] = useState<Id<"resumes"> | "">("");

  const parseJob = useAction(api.parseJob.fromUrl);
  const addJob = useMutation(api.jobs.add);
  const resumes = useQuery(api.resumes.list);
  const prefs = useQuery(api.preferences.get);

  const defaultResumeId = getDefaultResumeId(resumes, prefs?.alwaysUseLatestResume ?? false);
  const activeResumeId = resumeOverride || defaultResumeId;
  const hasMultipleResumes = (resumes?.length ?? 0) > 1;

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
        toast.error("This doesn't look like a job posting");
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
      setOpen(false);
      toast.dismiss();

      if (!hasRole || !hasCompany) {
        toast.warning("Added with incomplete data — tap to edit", {
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

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 bg-background p-3 sm:hidden">
        <Button
          onClick={() => setOpen(true)}
          className="w-full rounded-none"
          size="lg"
        >
          <PlusIcon size={18} weight="light" className="mr-2" />
          Add Job
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Paste a job URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              autoFocus
            />
            {hasMultipleResumes && (
              <Select
                value={resumeOverride || "__default__"}
                onValueChange={(v) =>
                  setResumeOverride(v === "__default__" ? "" : (v as Id<"resumes">))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">
                    Default ({resumes?.find((r) => r._id === defaultResumeId)?.name ?? "latest"})
                  </SelectItem>
                  {resumes?.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={() => void handleSubmit()}
              disabled={loading || !url.trim()}
              className="w-full"
            >
              {loading ? "Adding..." : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
