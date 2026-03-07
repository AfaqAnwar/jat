import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusIcon } from "@phosphor-icons/react";
import type { AddJobState } from "@/lib/use-add-job";
import { ManualJobModal } from "@/components/manual-job-modal";

export function MobileAddButton({ addJob }: { addJob: AddJobState }) {
  const [open, setOpen] = useState(false);
  const {
    url, setUrl, loading, submit,
    manualEntry, submitManual, dismissManualEntry,
    resumeOverride, selectResume,
    resumes,
    activeResumeId,
    defaultResumeId,
    hasMultipleResumes,
  } = addJob;

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
            {hasMultipleResumes && resumes && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Resume</p>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => selectResume("")}
                    className={`flex w-full items-center gap-2 rounded-none border px-3 py-2 text-left text-sm ${!resumeOverride ? "border-foreground" : "border-border"}`}
                  >
                    Default ({resumes.find((r) => r._id === defaultResumeId)?.name ?? "latest"})
                  </button>
                  {resumes.map((r) => (
                    <button
                      key={r._id}
                      type="button"
                      onClick={() => selectResume(r._id)}
                      className={`flex w-full items-center gap-2 rounded-none border px-3 py-2 text-left text-sm ${resumeOverride === r._id ? "border-foreground" : "border-border"}`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
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
