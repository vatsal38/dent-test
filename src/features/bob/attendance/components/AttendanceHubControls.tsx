"use client";

import type { Ref } from "react";
import type { AttendanceIssueSummary, AttendanceWorkspaceData, IssueFilter } from "../types";
import { ATTENDANCE_PAGE_SIZE } from "../model/scale";
import { RosterTrackScopeSelect } from "@/components/bob/RosterTrackScopeSelect";
import type { RosterTrackOption } from "@/lib/bobRosterTrackOptions";

const PRIMARY_FILTERS: Array<{ id: IssueFilter; label: string }> = [
  { id: "missing", label: "Gaps" },
  { id: "late", label: "Late" },
  { id: "complete", label: "Present" },
  { id: "all", label: "All" },
];

const ISSUE_FILTERS: Array<{
  id: IssueFilter;
  label: string;
  key: keyof AttendanceIssueSummary;
}> = [
  { id: "corrections", label: "Overrides", key: "manualOverrides" },
  { id: "auto_filled", label: "Auto filled", key: "autoFilled" },
  { id: "correction_requests", label: "Requests", key: "correctionRequests" },
];

function Segmented({
  value,
  options,
  onChange,
  disabledKeys,
}: {
  value: string;
  options: Array<{ id: string; label: string }>;
  onChange: (id: string) => void;
  disabledKeys?: Set<string>;
}) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
      {options.map((opt) => {
        const disabled = disabledKeys?.has(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors disabled:opacity-40 ${
              value === opt.id
                ? "bg-white text-orange-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function MetricPill({
  label,
  value,
  total,
  active,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  total?: number;
  active?: boolean;
  tone?: "good" | "warn" | "bad";
  onClick?: () => void;
}) {
  const toneClass =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "bad"
          ? "text-red-700"
          : "text-gray-700";
  const pct =
    total != null && total > 0 ? Math.round((value / total) * 100) : null;
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] tabular-nums ${
        active
          ? "bg-orange-100 text-orange-800 ring-1 ring-orange-200"
          : "bg-white text-gray-600 ring-1 ring-gray-200"
      } ${onClick ? "hover:bg-orange-50" : ""}`}
    >
      <span className={active ? undefined : toneClass}>
        {value}
        {pct != null ? ` (${pct}%)` : ""}
      </span>
      <span className="text-gray-500">{label}</span>
    </Tag>
  );
}

export function AttendanceHubControls({
  focusDate,
  onFocusDateChange,
  trackFilter,
  onTrackFilterChange,
  trackOptions,
  tracksLoading,
  requiresScope,
  viewMode,
  onViewModeChange,
  healthFilter,
  onHealthFilterChange,
  summary,
  issues,
  search,
  onSearchChange,
  page,
  totalRows,
  onPageChange,
  pageSize = ATTENDANCE_PAGE_SIZE,
  trackSelectRef,
  hideTrackFilter = false,
  hideSearch = false,
  hideWeekMode = false,
  hideHealthFilters = false,
  hideSummaryBar = false,
  minDate,
  maxDate,
}: {
  focusDate: string;
  onFocusDateChange: (date: string) => void;
  trackFilter: string;
  onTrackFilterChange: (track: string) => void;
  trackOptions: RosterTrackOption[];
  tracksLoading?: boolean;
  requiresScope: boolean;
  viewMode: "day" | "week" | "month";
  onViewModeChange: (mode: "day" | "week" | "month") => void;
  healthFilter: IssueFilter;
  onHealthFilterChange: (filter: IssueFilter) => void;
  summary: AttendanceWorkspaceData["summary"];
  issues: AttendanceIssueSummary;
  search: string;
  onSearchChange: (v: string) => void;
  page: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  trackSelectRef?: Ref<HTMLSelectElement>;
  hideTrackFilter?: boolean;
  hideSearch?: boolean;
  hideWeekMode?: boolean;
  hideHealthFilters?: boolean;
  hideSummaryBar?: boolean;
  minDate?: string;
  maxDate?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const start = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRows);

  const extraIssueFilters = ISSUE_FILTERS.filter((f) => issues[f.key] > 0);

  return (
    <div className="mb-3 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <input
          type="date"
          value={focusDate}
          min={minDate}
          max={maxDate}
          onChange={(e) => onFocusDateChange(e.target.value)}
          className="h-8 px-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        />
        <RosterTrackScopeSelect
          ref={trackSelectRef}
          value={trackFilter}
          onChange={onTrackFilterChange}
          options={trackOptions}
          loading={tracksLoading}
          emptyLabel={requiresScope ? "Select track…" : "All tracks"}
          className={`h-8 px-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-orange-500 focus:border-orange-500 min-w-[140px] max-w-[220px] ${hideTrackFilter ? "hidden" : ""}`}
        />

        {!hideWeekMode ? (
          <Segmented
            value={viewMode}
            options={[
              { id: "day", label: "Day" },
              { id: "week", label: "Week" },
              { id: "month", label: "Month" },
            ]}
            onChange={(id) =>
              onViewModeChange(id as "day" | "week" | "month")
            }
          />
        ) : null}

        {!hideHealthFilters ? (
        <>
        <div className="hidden sm:block h-5 w-px bg-gray-200" />

        <Segmented
          value={healthFilter}
          options={PRIMARY_FILTERS}
          onChange={(id) => onHealthFilterChange(id as IssueFilter)}
        />
        </>
        ) : null}

        <div className="flex-1 min-w-[140px]" />

        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search students…"
          className={`h-8 w-full sm:w-44 lg:w-52 px-2.5 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-orange-500 ${hideSearch ? "hidden" : ""}`}
        />

        {totalPages > 1 ? (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-8 px-2 text-xs rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              ‹
            </button>
            <span className="text-[11px] text-gray-500 tabular-nums px-1">
              {page}/{totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-8 px-2 text-xs rounded-md border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
            >
              ›
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-gray-500 tabular-nums shrink-0">
            {start}–{end} of {totalRows}
          </span>
        )}
      </div>

      {!hideSummaryBar ? (
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 bg-gray-50 border-t border-gray-100">
        <MetricPill label="expected" value={summary.expected} />
        <MetricPill
          label="present"
          value={summary.present}
          total={summary.expected}
          tone="good"
          active={healthFilter === "complete"}
          onClick={() => onHealthFilterChange("complete")}
        />
        <MetricPill
          label="missing"
          value={summary.missingStudents}
          total={summary.expected}
          tone="bad"
          active={healthFilter === "missing"}
          onClick={() => onHealthFilterChange("missing")}
        />
        <MetricPill
          label="late"
          value={summary.late}
          total={summary.expected}
          tone="warn"
          active={healthFilter === "late"}
          onClick={() => onHealthFilterChange("late")}
        />
        {issues.total > 0 ? (
          <MetricPill label="issues" value={issues.total} tone="warn" />
        ) : null}

        {extraIssueFilters.length > 0 ? (
          <>
            <span className="text-gray-300 mx-0.5">|</span>
            {extraIssueFilters.map((f) => (
              <MetricPill
                key={f.id}
                label={f.label}
                value={issues[f.key]}
                active={healthFilter === f.id}
                onClick={() => onHealthFilterChange(f.id)}
              />
            ))}
          </>
        ) : null}

        {healthFilter !== "all" ? (
          <button
            type="button"
            onClick={() => onHealthFilterChange("all")}
            className="ml-auto text-[11px] text-gray-500 hover:text-orange-600 underline-offset-2 hover:underline"
          >
            Clear filter
          </button>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
