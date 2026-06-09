"use client";

import { forwardRef } from "react";
import type { RosterTrackOption } from "@/lib/bobRosterTrackOptions";

export const RosterTrackScopeSelect = forwardRef<
  HTMLSelectElement,
  {
    value: string;
    onChange: (track: string) => void;
    options: RosterTrackOption[];
    loading?: boolean;
    className?: string;
    emptyLabel?: string;
  }
>(function RosterTrackScopeSelect(
  {
    value,
    onChange,
    options,
    loading,
    className = "",
    emptyLabel = "All tracks",
  },
  ref,
) {
  return (
    <select
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading && options.length === 0}
      aria-label="Filter by track"
      className={
        className ||
        "h-[42px] shrink-0 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 min-w-[10rem] max-w-[16rem]"
      }
    >
      <option value="">{loading ? "Loading tracks…" : emptyLabel}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
          {opt.count > 0 ? ` (${opt.count})` : ""}
        </option>
      ))}
    </select>
  );
});
