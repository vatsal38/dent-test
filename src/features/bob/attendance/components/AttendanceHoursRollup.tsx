"use client";

import type { HoursAttendanceRollup } from "../model/hoursRollup";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";

function pctCell(value: number, detail?: string) {
  return (
    <div className="text-right">
      <span className="tabular-nums font-semibold text-gray-900">{value}%</span>
      {detail ? (
        <p className="text-[10px] text-gray-500 tabular-nums mt-0.5">{detail}</p>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  period,
}: {
  label: string;
  period: { hoursPct: number; hoursAttended: number; hoursPotential: number };
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">
        {period.hoursPct}%
      </p>
      <p className="text-xs text-gray-500 tabular-nums mt-0.5">
        {period.hoursAttended}h of {period.hoursPotential}h
      </p>
    </div>
  );
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
  const { overall, byTrack } = rollup;
  const activeFilter = String(trackFilter || "").trim();

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
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            BoB attendance (hours-based)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Overall program rollup and breakdown by track · as of {focusDate}
          </p>
        </div>
        <span className="text-xs text-gray-500 tabular-nums">
          {overall.studentCount} student{overall.studentCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-b border-gray-100 bg-orange-50/40">
        <SummaryCard label="Today" period={overall.today} />
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
                row.trackLabel.toLowerCase().includes(activeFilter.toLowerCase());
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
                    {pctCell(
                      row.today.hoursPct,
                      `${row.today.hoursAttended}h / ${row.today.hoursPotential}h`,
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {pctCell(
                      row.week.hoursPct,
                      `${row.week.hoursAttended}h / ${row.week.hoursPotential}h`,
                    )}
                  </td>
                  <td className="px-3 py-2.5 pr-4">
                    {pctCell(
                      row.program.hoursPct,
                      `${row.program.hoursAttended}h / ${row.program.hoursPotential}h`,
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
