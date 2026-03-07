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
import { ResumePickerList } from "@/components/resume-picker-list";

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

  const handleDialogChange = (v: boolean) => {
    setOpen(v);
    if (!v) { setUrl(""); selectResume(""); }
  };

  const defaultResumeName = resumes?.find((r) => r._id === defaultResumeId)?.name;

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

      <Dialog open={open} onOpenChange={handleDialogChange}>
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
              <ResumePickerList
                resumes={resumes}
                resumeOverride={resumeOverride}
                defaultResumeId={defaultResumeId}
                defaultResumeName={defaultResumeName}
                onSelect={selectResume}
                variant="stacked"
              />
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
