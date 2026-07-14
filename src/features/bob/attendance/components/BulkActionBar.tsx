"use client";

import type { BobAttendanceStatus } from "@/platform/api/bob/attendance";
import { STATUS_LABELS } from "../model/constants";

const BULK_STATUSES: BobAttendanceStatus[] = [
  "present",
  "absent",
  "excused",
  "late",
];

export function BulkActionBar({
  selectedCount,
  onApply,
  onClear,
  disabled,
}: {
  selectedCount: number;
  onApply: (status: BobAttendanceStatus) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-30 mx-auto max-w-3xl rounded-xl border border-orange-200 bg-white shadow-lg px-4 py-3 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-900 mr-1">
        Bulk triage · {selectedCount} selected
      </span>
      {BULK_STATUSES.map((st) => (
        <button
          key={st}
          type="button"
          disabled={disabled}
          onClick={() => onApply(st)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Mark {STATUS_LABELS[st]}
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-800"
      >
        Clear
      </button>
    </div>
  );
}
