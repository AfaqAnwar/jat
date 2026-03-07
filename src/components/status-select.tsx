import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { STATUSES, type Status } from "@/lib/types";

export function StatusSelect({
  value,
  onValueChange,
}: {
  value: Status;
  onValueChange: (status: Status) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as Status)}
    >
      <SelectTrigger className="h-auto w-auto cursor-pointer border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden">
        <SelectValue>
          <StatusBadge status={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            <StatusBadge status={s} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
