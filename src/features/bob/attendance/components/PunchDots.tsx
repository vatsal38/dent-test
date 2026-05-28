"use client";

import type { PunchSlot } from "../types";
import { PUNCH_TYPES } from "../types";
import { PUNCH_LABELS, PUNCH_SHORT, PUNCH_STATE_COLORS } from "../model/constants";

export function PunchDots({
  punches,
  size = "sm",
  showTooltip = true,
}: {
  punches: Record<string, PunchSlot>;
  size?: "sm" | "md";
  showTooltip?: boolean;
}) {
  const dot = size === "md" ? "w-2.5 h-2.5" : "w-2 h-2";
  return (
    <div className="inline-flex items-center gap-0.5" role="img" aria-label="Punch status">
      {PUNCH_TYPES.map((pt) => {
        const slot = punches[pt];
        const colors = PUNCH_STATE_COLORS[slot?.state ?? "na"];
        const title = showTooltip
          ? `${PUNCH_LABELS[pt]}: ${slot?.state ?? "na"}${slot?.timeLabel ? ` · ${slot.timeLabel}` : ""}`
          : undefined;
        return (
          <span
            key={pt}
            title={title}
            className={`inline-block rounded-full ring-2 ${dot} ${colors.dot} ${colors.ring}`}
            aria-label={title}
          />
        );
      })}
    </div>
  );
}

export function PunchLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
      {PUNCH_TYPES.map((pt) => (
        <span key={pt} className="inline-flex items-center gap-1">
          <span className="font-medium text-gray-600">{PUNCH_SHORT[pt]}</span>
          <span>{PUNCH_LABELS[pt]}</span>
        </span>
      ))}
    </div>
  );
}
