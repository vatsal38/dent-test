"use client";

import { ATTENDANCE_PAGE_SIZE } from "../model/scale";

export function AttendanceTableToolbar({
  search,
  onSearchChange,
  page,
  totalRows,
  pageSize = ATTENDANCE_PAGE_SIZE,
  onPageChange,
  showingLabel,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  page: number;
  totalRows: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  showingLabel?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const start = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRows);

  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search students…"
          className="w-full sm:max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
        />
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {showingLabel ?? `${start}–${end} of ${totalRows}`}
        </span>
      </div>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            Prev
          </button>
          <span className="text-xs text-gray-600 px-2 tabular-nums">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
