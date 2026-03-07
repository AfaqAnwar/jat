import { useState, useRef, useCallback } from "react";
import type { Job, Resume, ResumeId } from "@/lib/types";
import { CheckIcon } from "@phosphor-icons/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/use-media-query";

function ResumeItem({
  name,
  selected,
  onSelect,
}: {
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full cursor-pointer items-center gap-2 rounded-none px-3 py-2 text-left text-sm hover:bg-accent"
      title={name}
    >
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span className="w-4 shrink-0">
        {selected && <CheckIcon size={14} weight="light" />}
      </span>
    </button>
  );
}

export function ResumeSelect({
  job,
  resumes,
  onUpdate,
  valueLabelClassName,
}: {
  job: Job;
  resumes: Resume[];
  onUpdate: (resumeId: ResumeId) => void;
  valueLabelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [boundary, setBoundary] = useState<Element[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const handleOpen = useCallback((nextOpen: boolean) => {
    if (nextOpen && triggerRef.current) {
      const el = triggerRef.current.closest("[data-slot='table-container']");
      setBoundary(el ? [el] : []);
    }
    setOpen(nextOpen);
  }, []);
  const canEdit = resumes.length >= 1;
  const isDeleted = !job.resumeId && !!job.resumeName;
  const nameClass = isDeleted ? "text-muted-foreground/40" : "";
  const displayName = job.resumeName || "—";

  if (!canEdit) {
    return (
      <span className={`truncate text-sm ${nameClass || "text-muted-foreground"}`}>
        {displayName}
      </span>
    );
  }

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(true)}
      className={`min-w-0 max-w-full cursor-pointer truncate text-left text-sm ${valueLabelClassName ?? ""} ${nameClass}`}
    >
      {displayName}
    </button>
  );

  const items = resumes.map((r) => (
    <ResumeItem
      key={r._id}
      name={r.name}
      selected={job.resumeId === r._id}
      onSelect={() => {
        onUpdate(r._id);
        setOpen(false);
      }}
    />
  ));

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={handleOpen}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          collisionBoundary={boundary}
          className="max-h-64 min-w-48 max-w-80 overflow-y-auto p-1"
        >
          {items}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      {trigger}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Select Resume</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[60dvh] overflow-y-auto px-2 pb-4">
            {items}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
