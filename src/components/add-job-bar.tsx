import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GearSixIcon, CircleNotchIcon } from "@phosphor-icons/react";
import type { AddJobState } from "@/lib/use-add-job";
import { ManualJobModal } from "@/components/manual-job-modal";
import { ResumePickerList } from "@/components/resume-picker-list";

export function AddJobBar({ addJob }: { addJob: AddJobState }) {
  const [gearOpen, setGearOpen] = useState(false);
  const {
    url, setUrl, loading, submit,
    manualEntry, submitManual, dismissManualEntry,
    resumeOverride, selectResume,
    resumes,
    activeResumeId,
    activeResumeName, defaultResumeId, defaultResumeName,
    hasMultipleResumes,
  } = addJob;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && url.trim()) {
      void submit();
    }
  };

  return (
    <>
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
                aria-label={activeResumeName ? `Resume: ${activeResumeName}` : "Select resume"}
              >
                <GearSixIcon size={16} weight="light" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="max-h-64 w-56 overflow-y-auto rounded-none p-2">
              <ResumePickerList
                resumes={resumes ?? []}
                resumeOverride={resumeOverride}
                defaultResumeId={defaultResumeId}
                defaultResumeName={defaultResumeName}
                onSelect={(id) => {
                  selectResume(id);
                  setGearOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        )}
        <Button
          onClick={() => void submit()}
          disabled={loading || !url.trim()}
          size="default"
        >
          {loading && <CircleNotchIcon size={14} weight="light" className="animate-spin" />}
          {loading ? "Adding..." : "Add"}
        </Button>
      </div>

      {manualEntry && (
        <ManualJobModal
          entry={manualEntry}
          resumes={resumes}
          activeResumeId={activeResumeId}
          onSubmit={submitManual}
          onClose={dismissManualEntry}
        />
      )}
    </>
  );
}
