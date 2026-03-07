import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react";

export function EditableRoleCell({
  role,
  sector,
  onSaveRole,
  onSaveSector,
  onEditingChange,
}: {
  role: string;
  sector: string;
  onSaveRole: (value: string) => void;
  onSaveSector: (value: string) => void;
  onEditingChange?: (editing: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [field, setField] = useState<"role" | "sector">("role");
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, field]);

  const startEditing = () => {
    setField("role");
    setDraft(role);
    setEditing(true);
    onEditingChange?.(true);
  };

  const swap = () => {
    commitCurrent();
    if (field === "role") {
      setField("sector");
      setDraft(sector);
    } else {
      setField("role");
      setDraft(role);
    }
  };

  const commitCurrent = () => {
    if (field === "role" && draft !== role) onSaveRole(draft);
    if (field === "sector" && draft !== sector) onSaveSector(draft);
  };

  const close = () => {
    commitCurrent();
    setEditing(false);
    onEditingChange?.(false);
  };

  if (editing) {
    return (
      <div className="relative">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={close}
          onKeyDown={(e) => {
            if (e.key === "Enter") close();
            if (e.key === "Escape") {
              setEditing(false);
              onEditingChange?.(false);
            }
            if (e.key === "Tab") {
              e.preventDefault();
              swap();
            }
          }}
          placeholder={field === "role" ? "Role" : "Sector / Team"}
          className="h-7 w-full min-w-0 pr-8 text-sm"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            swap();
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
          title={field === "role" ? "Edit sector" : "Edit role"}
        >
          <ArrowsLeftRightIcon size={14} weight="light" />
        </button>
      </div>
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
      role="button"
      tabIndex={0}
      className="-mx-1 block cursor-pointer truncate px-1 py-0.5 hover:bg-muted"
    >
      {role || "Untitled Role"}
    </span>
  );
}
