"use client";

import type { AttendanceIssueSummary, AttendanceWorkspaceData } from "../types";
import type { IssueFilter } from "../types";

function Stat({
  label,
  value,
  tone = "default",
  active = false,
  onClick,
}: {
  label: string;
  value: number;
  tone?: "default" | "good" | "warn" | "bad" | "muted";
  active?: boolean;
  onClick?: () => void;
}) {
  const valueClass =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "bad"
          ? "text-red-600"
          : tone === "muted"
            ? "text-gray-600"
            : "text-gray-900";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`p-3 sm:p-4 bg-white border rounded-lg min-w-[120px] flex-1 text-left transition-colors ${
        active ? "border-orange-500 ring-2 ring-orange-100" : "border-gray-200"
      } ${onClick ? "hover:border-orange-200 cursor-pointer" : ""}`}
    >
      <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-xl sm:text-2xl font-bold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </Tag>
  );
}

export function AttendanceHealthBar({
  summary,
  issues,
  date,
  activeFilter = "all",
  onIssueFilter,
}: {
  summary: AttendanceWorkspaceData["summary"];
  issues: AttendanceIssueSummary;
  date: string;
  activeFilter?: IssueFilter;
  onIssueFilter?: (filter: IssueFilter) => void;
}) {
  return (
    <div className="mb-4 space-y-3">
      <p className="text-xs text-gray-500">Health for {date}</p>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Stat label="Expected" value={summary.expected} />
        <Stat label="Present" value={summary.present} tone="good" />
        <Stat
          label="Missing punches"
          value={summary.missingPunches}
          tone="bad"
          active={activeFilter === "missing"}
          onClick={onIssueFilter ? () => onIssueFilter("missing") : undefined}
        />
        <Stat
          label="Late"
          value={summary.late}
          tone="warn"
          active={activeFilter === "late"}
          onClick={onIssueFilter ? () => onIssueFilter("late") : undefined}
        />
        <Stat
          label="Open issues"
          value={issues.total}
          tone="warn"
          active={activeFilter !== "all" && activeFilter !== "complete"}
          onClick={onIssueFilter ? () => onIssueFilter("missing") : undefined}
        />
      </div>

      {onIssueFilter ? (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Open issues — click to filter table
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: "missing" as IssueFilter,
                label: "Missing punches",
                count: issues.missingPunches,
              },
              {
                id: "late" as IssueFilter,
                label: "Late arrivals",
                count: issues.late,
              },
              {
                id: "corrections" as IssueFilter,
                label: "Manual overrides",
                count: issues.manualOverrides,
              },
              {
                id: "auto_filled" as IssueFilter,
                label: "Auto filled",
                count: issues.autoFilled,
              },
              {
                id: "correction_requests" as IssueFilter,
                label: "Correction requests",
                count: issues.correctionRequests,
              },
            ].map((item) => (
              <button
                key={`${item.id}-${item.label}`}
                type="button"
                disabled={item.count === 0}
                onClick={() => onIssueFilter(item.id)}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  activeFilter === item.id
                    ? "border-orange-500 bg-orange-50 text-orange-800"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                }`}
              >
                {item.label} ({item.count})
              </button>
            ))}
            {activeFilter !== "all" ? (
              <button
                type="button"
                onClick={() => onIssueFilter("all")}
                className="text-xs px-2.5 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Clear filter
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
