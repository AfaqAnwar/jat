import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Id } from "../../convex/_generated/dataModel";
import { GearSixIcon, CheckIcon } from "@phosphor-icons/react";
import type { AddJobState } from "@/lib/use-add-job";
import { ManualJobModal } from "@/components/manual-job-modal";

export function AddJobBar({ addJob }: { addJob: AddJobState }) {
  const [gearOpen, setGearOpen] = useState(false);
  const {
    url, setUrl, loading, submit,
    manualEntry, submitManual, dismissManualEntry,
    resumeOverride, selectResume,
    resumes,
    activeResumeId,
    activeResumeName, defaultResumeName,
    hasMultipleResumes,
  } = addJob;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      void submit();
    }
  };

  const handleSelectResume = (id: Id<"resumes"> | "") => {
    selectResume(id);
    setGearOpen(false);
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
            <PopoverContent align="end" className="w-56 rounded-none p-2">
              <p className="px-2 pb-1 text-xs text-muted-foreground">
                Resume for this submission
              </p>
              <button
                onClick={() => handleSelectResume("")}
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
                  onClick={() => handleSelectResume(r._id)}
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
          onClick={() => void submit()}
          disabled={loading || !url.trim()}
          size="default"
        >
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
