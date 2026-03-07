import { Badge } from "@/components/ui/badge";

const statusConfig = {
  applied: { label: "Applied", variant: "secondary" },
  interviewing: { label: "Interviewing", variant: "default" },
  offer: { label: "Offer", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  ghosted: { label: "Ghosted", variant: "outline" },
} as const;

type Status = keyof typeof statusConfig;

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
