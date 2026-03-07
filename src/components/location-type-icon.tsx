import { BuildingsIcon, WifiHighIcon, CircleHalfTiltIcon } from "@phosphor-icons/react";
import type { LocType } from "@/lib/types";
import { LOC_TYPES } from "@/lib/types";

const LOC_TYPE_CONFIG = {
  onsite: { icon: BuildingsIcon, title: "On-site" },
  remote: { icon: WifiHighIcon, title: "Remote" },
  hybrid: { icon: CircleHalfTiltIcon, title: "Hybrid" },
} as const;

export function LocationTypeIcon({
  type,
  onCycle,
}: {
  type?: string | null;
  onCycle?: () => void;
}) {
  const key = (type ?? "onsite") as LocType;
  const config = LOC_TYPE_CONFIG[key] ?? LOC_TYPE_CONFIG.onsite;
  const Icon = config.icon;

  if (!onCycle) {
    return (
      <span title={config.title} className="shrink-0 text-muted-foreground/50">
        <Icon size={13} weight="light" />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onCycle}
      title={config.title}
      className="shrink-0 cursor-pointer text-muted-foreground/50 hover:text-muted-foreground"
    >
      <Icon size={13} weight="light" />
    </button>
  );
}

export function cycleLocationType(current?: string | null): LocType {
  const idx = LOC_TYPES.indexOf((current ?? "onsite") as LocType);
  return LOC_TYPES[(idx + 1) % LOC_TYPES.length];
}
