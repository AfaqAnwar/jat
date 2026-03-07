import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { formatDate, todayISO } from "@/lib/format-date";
import { checkMaxLength } from "@/lib/toast-utils";

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
  const today = isDate ? todayISO() : "";
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
    if (!isDate && !checkMaxLength(draft)) return;
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
        {...(isDate ? { max: today } : {})}
        onChange={(e) => {
          const v = e.target.value;
          setDraft(isDate && v > today ? today : v);
        }}
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
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setEditing(true);
        }
      }}
      role="button"
      tabIndex={0}
      className="-mx-1 block cursor-pointer truncate px-1 py-0.5 hover:bg-muted"
    >
      {displayValue || placeholder}
    </span>
  );
}
