import { Badge } from "@/components/ui/badge";
import type { Status } from "@/lib/types";

const STATUS_CONFIG = {
  applied: { label: "Applied", variant: "secondary" },
  interviewing: { label: "Interviewing", variant: "default" },
  offer: { label: "Offer", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  ghosted: { label: "Ghosted", variant: "outline" },
} as const;

export function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
