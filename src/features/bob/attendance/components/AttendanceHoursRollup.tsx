"use client";

import { useMemo, useState } from "react";
import type {
  HoursAttendanceRollup,
  HoursRollupPeriod,
  MonthHoursRollup,
  TrackHoursRollupRow,
} from "../model/hoursRollup";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";

type RollupView = "summary" | "month";

function hoursDetail(period: HoursRollupPeriod) {
  return `${period.hoursAttended}h / ${period.hoursPotential}h`;
}

function pctTone(pct: number): string {
  if (pct >= 90) return "text-emerald-700";
  if (pct >= 75) return "text-gray-900";
  if (pct >= 50) return "text-amber-700";
  return "text-rose-700";
}

function barTone(pct: number): string {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 75) return "bg-orange-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-rose-400";
}

function pctCell(value: number, detail?: string) {
  return (
    <div className="text-right">
      <span className={`tabular-nums font-semibold ${pctTone(value)}`}>
        {value}%
      </span>
      {detail ? (
        <p className="text-[10px] text-gray-500 tabular-nums mt-0.5">{detail}</p>
      ) : null}
    </div>
  );
}

function presentTodayCell(period: HoursRollupPeriod) {
  const pct = period.presentPct ?? 0;
  const detail =
    period.presentCount != null && period.expectedCount != null
      ? `${period.presentCount}/${period.expectedCount} present`
      : undefined;
  return pctCell(pct, detail);
}

function SummaryCard({
  label,
  period,
  mode = "hours",
  subtitle,
}: {
  label: string;
  period: HoursRollupPeriod;
  mode?: "hours" | "present";
  subtitle?: string;
}) {
  const usePresent = mode === "present";
  const pct = usePresent ? (period.presentPct ?? 0) : period.hoursPct;
  const detail = usePresent
    ? period.presentCount != null && period.expectedCount != null
      ? `${period.presentCount}/${period.expectedCount} present`
      : undefined
    : hoursDetail(period);

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      {subtitle ? (
        <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
      ) : null}
      <p className={`text-2xl font-bold tabular-nums mt-1 ${pctTone(pct)}`}>
        {pct}%
      </p>
      {detail ? (
        <p className="text-xs text-gray-500 tabular-nums mt-0.5">{detail}</p>
      ) : null}
      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barTone(pct)}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: RollupView;
  onChange: (next: RollupView) => void;
}) {
  const options: Array<{ id: RollupView; label: string }> = [
    { id: "summary", label: "Summary" },
    { id: "month", label: "By month" },
  ];
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              active
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function monthForRow(
  row: TrackHoursRollupRow,
  monthKey: string,
): MonthHoursRollup | undefined {
  return row.months.find((m) => m.key === monthKey);
}

function formatRange(start: string, end: string) {
  if (start === end) return start;
  return `${start} – ${end}`;
}

export function AttendanceHoursRollup({
  rollup,
  focusDate,
  trackFilter,
}: {
  rollup: HoursAttendanceRollup;
  focusDate: string;
  trackFilter?: string;
}) {
  const [view, setView] = useState<RollupView>("month");
  const { overall, byTrack, monthColumns } = rollup;
  const activeFilter = String(trackFilter || "").trim();

  const monthCards = useMemo(() => {
    return monthColumns.map((col) => {
      const m = monthForRow(overall, col.key);
      return {
        ...col,
        period: m?.period ?? {
          hoursAttended: 0,
          hoursPotential: 0,
          hoursPct: 0,
        },
      };
    });
  }, [monthColumns, overall]);

  if (!overall.studentCount && !byTrack.length) {
    return (
      <section className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600">
        No active BoB students in scope for hours-based attendance on{" "}
        <strong>{focusDate}</strong>.
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            BoB attendance (hours-based)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {view === "month"
              ? "Hours attended vs potential, grouped by program month"
              : "Today, this week, and program-to-date rollup by track"}{" "}
            · as of {focusDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ViewToggle value={view} onChange={setView} />
          <span className="text-xs text-gray-500 tabular-nums">
            {overall.studentCount} student
            {overall.studentCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {view === "summary" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-b border-gray-100 bg-orange-50/40">
            <SummaryCard label="Today" period={overall.today} mode="present" />
            <SummaryCard label="This week" period={overall.week} />
            <SummaryCard label="Program to date" period={overall.program} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-4 py-2.5 font-medium">Track</th>
                  <th className="px-3 py-2.5 font-medium text-right">Students</th>
                  <th className="px-3 py-2.5 font-medium text-right">Today</th>
                  <th className="px-3 py-2.5 font-medium text-right">This week</th>
                  <th className="px-3 py-2.5 font-medium text-right pr-4">
                    Program
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byTrack.map((row) => {
                  const highlighted =
                    activeFilter &&
                    row.trackLabel
                      .toLowerCase()
                      .includes(activeFilter.toLowerCase());
                  return (
                    <tr
                      key={row.trackKey}
                      className={highlighted ? "bg-orange-50/60" : undefined}
                    >
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        {formatBobTrackDisplayLabel(row.trackLabel)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums">
                        {row.studentCount}
                      </td>
                      <td className="px-3 py-2.5">
                        {presentTodayCell(row.today)}
                      </td>
                      <td className="px-3 py-2.5">
                        {pctCell(row.week.hoursPct, hoursDetail(row.week))}
                      </td>
                      <td className="px-3 py-2.5 pr-4">
                        {pctCell(
                          row.program.hoursPct,
                          hoursDetail(row.program),
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-orange-50/70 border-t border-orange-100 font-semibold">
                  <td className="px-4 py-3 text-gray-900">
                    {formatBobTrackDisplayLabel(overall.trackLabel)}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-800 tabular-nums">
                    {overall.studentCount}
                  </td>
                  <td className="px-3 py-3">
                    {presentTodayCell(overall.today)}
                  </td>
                  <td className="px-3 py-3">
                    {pctCell(overall.week.hoursPct, hoursDetail(overall.week))}
                  </td>
                  <td className="px-3 py-3 pr-4">
                    {pctCell(
                      overall.program.hoursPct,
                      hoursDetail(overall.program),
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {monthCards.length === 0 ? (
            <div className="px-4 py-8 text-sm text-gray-600 text-center">
              No program months to show yet for {focusDate}.
            </div>
          ) : (
            <>
              <div
                className={`grid gap-3 p-4 border-b border-gray-100 bg-orange-50/40 ${
                  monthCards.length === 1
                    ? "grid-cols-1 sm:grid-cols-2"
                    : monthCards.length === 2
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {monthCards.map((m) => (
                  <SummaryCard
                    key={m.key}
                    label={m.label}
                    period={m.period}
                    subtitle={`${m.programDayCount} program day${
                      m.programDayCount === 1 ? "" : "s"
                    } · ${formatRange(m.startDate, m.endDate)}`}
                  />
                ))}
                <SummaryCard
                  label="Program to date"
                  period={overall.program}
                  subtitle="All months combined"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <th className="px-4 py-2.5 font-medium sticky left-0 bg-white z-10">
                        Track
                      </th>
                      <th className="px-3 py-2.5 font-medium text-right">
                        Students
                      </th>
                      {monthColumns.map((col) => (
                        <th
                          key={col.key}
                          className="px-3 py-2.5 font-medium text-right min-w-30"
                          title={`${col.label}: ${formatRange(
                            col.startDate,
                            col.endDate,
                          )} · ${col.programDayCount} program days`}
                        >
                          <span className="block">{col.shortLabel}</span>
                          <span className="block text-[10px] font-normal normal-case tracking-normal text-gray-400">
                            {col.programDayCount}d
                          </span>
                        </th>
                      ))}
                      <th className="px-3 py-2.5 font-medium text-right pr-4 min-w-30">
                        <span className="block">All</span>
                        <span className="block text-[10px] font-normal normal-case tracking-normal text-gray-400">
                          program
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {byTrack.map((row) => {
                      const highlighted =
                        activeFilter &&
                        row.trackLabel
                          .toLowerCase()
                          .includes(activeFilter.toLowerCase());
                      return (
                        <tr
                          key={row.trackKey}
                          className={
                            highlighted ? "bg-orange-50/60" : undefined
                          }
                        >
                          <td
                            className={`px-4 py-2.5 font-medium text-gray-900 sticky left-0 z-10 ${
                              highlighted ? "bg-orange-50/60" : "bg-white"
                            }`}
                          >
                            {formatBobTrackDisplayLabel(row.trackLabel)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-gray-600 tabular-nums">
                            {row.studentCount}
                          </td>
                          {monthColumns.map((col) => {
                            const m = monthForRow(row, col.key);
                            const period = m?.period;
                            return (
                              <td key={col.key} className="px-3 py-2.5">
                                {period
                                  ? pctCell(
                                      period.hoursPct,
                                      hoursDetail(period),
                                    )
                                  : pctCell(0, "0h / 0h")}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2.5 pr-4">
                            {pctCell(
                              row.program.hoursPct,
                              hoursDetail(row.program),
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-orange-50/70 border-t border-orange-100 font-semibold">
                      <td className="px-4 py-3 text-gray-900 sticky left-0 bg-orange-50/70 z-10">
                        {formatBobTrackDisplayLabel(overall.trackLabel)}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-800 tabular-nums">
                        {overall.studentCount}
                      </td>
                      {monthColumns.map((col) => {
                        const m = monthForRow(overall, col.key);
                        const period = m?.period;
                        return (
                          <td key={col.key} className="px-3 py-3">
                            {period
                              ? pctCell(period.hoursPct, hoursDetail(period))
                              : pctCell(0, "0h / 0h")}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 pr-4">
                        {pctCell(
                          overall.program.hoursPct,
                          hoursDetail(overall.program),
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
