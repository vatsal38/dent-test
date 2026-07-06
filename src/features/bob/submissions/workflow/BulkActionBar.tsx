"use client";

import {
  BOB_SUBMISSION_STATUSES,
  type BobSubmissionStatus,
} from "@/platform/api/bob/submissions";
import {
  levelLabel,
  PRIORITY_OPTIONS,
  SUBMISSION_STATUS_LABELS,
} from "@/features/bob/submissions/workflow/constants";
import type { BobStaffMember } from "@/platform/api/bob/staff";

export function BulkActionBar({
  selectedCount,
  staff,
  onClear,
  onSetStatus,
  onSetPriority,
  onAssign,
  onArchive,
  busy,
}: {
  selectedCount: number;
  staff: BobStaffMember[];
  onClear: () => void;
  onSetStatus: (status: BobSubmissionStatus) => void;
  onSetPriority: (priority: string) => void;
  onAssign: (userId: string, label: string | null) => void;
  onArchive: () => void;
  busy: boolean;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 mx-auto max-w-4xl flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl bg-gray-900 text-white shadow-lg">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <select
        disabled={busy}
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value as BobSubmissionStatus;
          if (v) onSetStatus(v);
          e.target.value = "";
        }}
        className="text-sm px-2 py-1 rounded bg-gray-800 border border-gray-600 text-white"
      >
        <option value="">Move to…</option>
        {BOB_SUBMISSION_STATUSES.filter((s) => s !== "archived").map((s) => (
          <option key={s} value={s}>
            {SUBMISSION_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <select
        disabled={busy}
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onSetPriority(e.target.value);
          e.target.value = "";
        }}
        className="text-sm px-2 py-1 rounded bg-gray-800 border border-gray-600 text-white"
      >
        <option value="">Priority…</option>
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {levelLabel(p)}
          </option>
        ))}
      </select>
      <select
        disabled={busy}
        defaultValue=""
        onChange={(e) => {
          const id = e.target.value;
          if (!id) return;
          const person = staff.find((s) => s.id === id);
          onAssign(id, person?.name || person?.email || null);
          e.target.value = "";
        }}
        className="text-sm px-2 py-1 rounded bg-gray-800 border border-gray-600 text-white max-w-[140px]"
      >
        <option value="">Assign to…</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name || s.email}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={busy}
        onClick={onArchive}
        className="text-sm px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
      >
        Archive
      </button>
      <button
        type="button"
        onClick={onClear}
        className="text-sm px-3 py-1 rounded border border-gray-600 hover:bg-gray-800 ml-auto"
      >
        Clear
      </button>
    </div>
  );
}
