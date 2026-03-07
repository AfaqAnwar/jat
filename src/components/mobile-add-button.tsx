import { useState } from "react";
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
import { useAddJob } from "@/lib/use-add-job";
import { ManualJobModal } from "@/components/manual-job-modal";

export function MobileAddButton() {
  const [open, setOpen] = useState(false);
  const {
    url, setUrl, loading, submit,
    manualEntry, submitManual, dismissManualEntry,
    resumeOverride, selectResume,
    resumes,
    activeResumeId,
    defaultResumeId,
    hasMultipleResumes,
  } = useAddJob();

  const handleSubmit = async () => {
    const success = await submit();
    if (success) setOpen(false);
  };

  const handleManualClose = () => {
    dismissManualEntry();
    setOpen(false);
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
                  selectResume(v === "__default__" ? "" : (v as Id<"resumes">))
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

      {manualEntry && (
        <ManualJobModal
          entry={manualEntry}
          resumes={resumes}
          activeResumeId={activeResumeId}
          onSubmit={submitManual}
          onClose={handleManualClose}
        />
      )}
    </>
  );
}
