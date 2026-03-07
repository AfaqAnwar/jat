import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

export function EditableCell({
  value,
  onSave,
  placeholder = "—",
  type = "text",
}: {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="h-7 w-auto min-w-0 px-1 text-sm"
        style={{ width: `${Math.max((draft.length + 1) * 0.55, 4)}em` }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className="block cursor-pointer truncate rounded px-1 py-0.5 hover:bg-muted"
    >
      {value || placeholder}
    </span>
  );
}
