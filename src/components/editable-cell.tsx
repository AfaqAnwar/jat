import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format-date";

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
  const isDate = type === "date";
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
        className={`h-7 w-full min-w-0 px-1 text-sm${isDate && !draft ? " date-empty" : ""}`}
      />
    );
  }

  const displayValue = isDate ? formatDate(value) : value;

  return (
    <span
      onClick={() => setEditing(true)}
      className="-mx-1 block cursor-pointer truncate px-1 py-0.5 hover:bg-muted"
    >
      {displayValue || placeholder}
    </span>
  );
}
