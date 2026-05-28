"use client";

import type { DayHealth } from "../types";
import { DAY_HEALTH_STYLES } from "../model/constants";

export function AttendanceStatusBadge({ health }: { health: DayHealth }) {
  const style = DAY_HEALTH_STYLES[health] ?? DAY_HEALTH_STYLES.missing;
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${style.badge}`}
    >
      {style.label}
    </span>
  );
}
