import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { ResumeId } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ResumePreviewLink } from "@/components/resume-preview-link";
import { showSuccess, showError, checkMaxLength } from "@/lib/toast-utils";
import { TrashIcon, PencilSimpleIcon, CheckIcon, XIcon, StarIcon } from "@phosphor-icons/react";
import { formatFileName, deduplicateName } from "@/lib/format-file";

export function ResumeManager({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const resumes = useQuery(api.resumes.list);
  const prefs = useQuery(api.preferences.get);
  const generateUploadUrl = useMutation(api.resumes.generateUploadUrl);
  const saveResume = useMutation(api.resumes.save);
  const renameResume = useMutation(api.resumes.rename);
  const removeResume = useMutation(api.resumes.remove);
  const setDefaultResume = useMutation(api.resumes.setDefault);
  const setAlwaysUseLatest = useMutation(api.preferences.setAlwaysUseLatestResume);

  const [uploading, setUploading] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const [editingId, setEditingId] = useState<ResumeId | null>(null);
  const [editName, setEditName] = useState("");
  const [pendingResumeId, setPendingResumeId] = useState<ResumeId | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mobileFileRef = useRef<HTMLInputElement>(null);

  const isAlwaysLatest = prefs?.alwaysUseLatestResume ?? false;
  const hasExistingResumes = (resumes?.length ?? 0) > 0;

  const uploadFile = async (file: File) => {
    const existingNames = resumes?.map((r) => r.name) ?? [];
    const parsed = formatFileName(file.name);
    const name = deduplicateName(parsed, existingNames);

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error(`Upload failed (${result.status})`);
      const { storageId } = await result.json();
      const id = await saveResume({ name, storageId });
      showSuccess(`Uploaded "${name}"`);

      if (hasExistingResumes && !isAlwaysLatest) {
        setPendingResumeId(id);
      }
    } catch (err) {
      console.error("Failed to upload resume:", err);
      showError("Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  const handleDesktopUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await uploadFile(file);
    if (fileRef.current) fileRef.current.value = "";
    setHasFile(false);
  };

  const handleMobileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    if (mobileFileRef.current) mobileFileRef.current.value = "";
  };

  const handlePromptSetDefault = async () => {
    if (!pendingResumeId) return;
    await setDefaultResume({ id: pendingResumeId });
    setPendingResumeId(null);
    showSuccess("Set as default");
  };

  const handlePromptAlwaysLatest = async () => {
    await setAlwaysUseLatest({ enabled: true });
    setPendingResumeId(null);
    showSuccess("New uploads will always be the default");
  };

  const handleRename = async (id: ResumeId) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (!checkMaxLength(trimmed, "Name")) return;
    await renameResume({ id, name: trimmed });
    setEditingId(null);
    showSuccess("Renamed");
  };

  const handleDelete = async (id: ResumeId) => {
    await removeResume({ id });
    showSuccess("Resume deleted");
  };

  const handleSetDefault = async (id: ResumeId) => {
    await setDefaultResume({ id });
    showSuccess("Set as default");
  };

  const showStars = (resumes?.length ?? 0) > 1 && !isAlwaysLatest;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setPendingResumeId(null); onOpenChange(v); }}>
      <DialogContent className="max-h-[85dvh] rounded-none sm:max-w-md flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Resumes</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          {pendingResumeId && (
            <div className="space-y-2 border p-3">
              <p className="text-sm">Set this as your default resume?</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => void handlePromptSetDefault()}
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPendingResumeId(null)}
                >
                  No
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handlePromptAlwaysLatest()}
                >
                  Always Use Latest
                </Button>
              </div>
            </div>
          )}

          {/* Desktop upload */}
          <div className="hidden shrink-0 sm:flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={() => setHasFile(!!fileRef.current?.files?.length)}
              className="flex-1 cursor-pointer text-sm file:mr-2 file:cursor-pointer file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
            <Button
              size="sm"
              onClick={() => void handleDesktopUpload()}
              disabled={uploading || !hasFile}
            >
              {uploading ? "..." : "Upload"}
            </Button>
          </div>

          {/* Mobile upload */}
          <div className="shrink-0 sm:hidden">
            <input
              ref={mobileFileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => void handleMobileFileChange(e)}
              className="hidden"
            />
            <Button
              className="w-full rounded-none"
              onClick={() => mobileFileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Resume"}
            </Button>
          </div>

          {isAlwaysLatest && (resumes?.length ?? 0) > 1 && (
            <p className="text-xs text-muted-foreground">
              Using latest upload as default.{" "}
              <button
                onClick={() => void setAlwaysUseLatest({ enabled: false })}
                className="cursor-pointer underline hover:text-foreground"
              >
                Change
              </button>
            </p>
          )}

          {resumes && resumes.length > 0 && (
            <>
              <Separator className="shrink-0" />
              <ul className="min-h-0 min-w-0 space-y-2 overflow-y-auto">
                {resumes.map((r) => (
                  <li
                    key={r._id}
                    className="flex items-center gap-2 rounded-none border px-3 py-2 text-sm min-w-0 overflow-hidden"
                  >
                    {editingId === r._id ? (
                      <div className="flex flex-1 items-center gap-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void handleRename(r._id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => void handleRename(r._id)}
                          className="cursor-pointer p-1 text-muted-foreground hover:text-foreground"
                        >
                          <CheckIcon size={14} weight="light" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="cursor-pointer p-1 text-muted-foreground hover:text-foreground"
                        >
                          <XIcon size={14} weight="light" />
                        </button>
                      </div>
                    ) : (
                      <>
                        {showStars && (
                          <button
                            onClick={() => void handleSetDefault(r._id)}
                            className="cursor-pointer shrink-0 p-0.5"
                            title={r.isDefault ? "Default resume" : "Set as default"}
                            aria-label={r.isDefault ? "Default resume" : "Set as default"}
                          >
                            <StarIcon
                              size={14}
                              weight={r.isDefault ? "fill" : "light"}
                              className={r.isDefault ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"}
                            />
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="block truncate">{r.name}</span>
                          <span className="block text-[11px] text-muted-foreground/60">
                            {new Date(r._creationTime).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <ResumePreviewLink storageId={r.storageId} />
                          <button
                            onClick={() => {
                              setEditingId(r._id);
                              setEditName(r.name);
                            }}
                            className="cursor-pointer p-1 text-muted-foreground hover:text-foreground"
                            title="Rename"
                          >
                            <PencilSimpleIcon size={14} weight="light" />
                          </button>
                          <button
                            onClick={() => void handleDelete(r._id)}
                            className="cursor-pointer p-1 text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <TrashIcon size={14} weight="light" />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

