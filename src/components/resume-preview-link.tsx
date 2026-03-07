import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { EyeIcon } from "@phosphor-icons/react";

export function ResumePreviewLink({
  storageId,
  className = "cursor-pointer p-1 text-muted-foreground hover:text-foreground",
}: {
  storageId: Id<"_storage">;
  className?: string;
}) {
  const url = useQuery(api.resumes.getUrl, { storageId });
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label="View resume"
    >
      <EyeIcon size={14} weight="light" />
    </a>
  );
}
