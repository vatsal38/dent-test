"use client";

import type { PunchType, PunchVisualState } from "../types";
import { PUNCH_TYPES } from "../types";
import { PUNCH_SHORT, PUNCH_STATE_COLORS } from "../model/constants";

export function PunchDots({
  punches,
}: {
  punches: Record<PunchType, { state: PunchVisualState; timeLabel?: string }>;
}) {
  return (
    <div className="inline-flex items-center gap-1" title="Session punches">
      {PUNCH_TYPES.map((pt) => {
        const slot = punches[pt];
        const colors = PUNCH_STATE_COLORS[slot.state];
        return (
          <span
            key={pt}
            title={`${PUNCH_SHORT[pt]}${slot.timeLabel ? `: ${slot.timeLabel}` : ""}`}
            className={`h-2.5 w-2.5 rounded-full ring-2 ring-white ${colors.dot}`}
          />
        );
      })}
    </div>
  );
}

/** @deprecated Use SessionLegend from SessionSummary */
export function PunchLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
      <span>Morning In · Morning Out · Afternoon In · Afternoon Out</span>
    </div>
  );
}
