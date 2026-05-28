"use client";

import Link from "next/link";
import type { AttendanceAlert } from "../types";

const SEVERITY = {
  critical: "border-red-200 bg-red-50 text-red-900 hover:bg-red-100/80",
  warning: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/80",
  info: "border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100/80",
} as const;

import { MAX_ALERTS_VISIBLE } from "../model/scale";

export function AttendanceAlertStrip({
  alerts,
  truncatedCount = 0,
}: {
  alerts: AttendanceAlert[];
  truncatedCount?: number;
}) {
  if (!alerts.length) return null;
  const visible = alerts.slice(0, MAX_ALERTS_VISIBLE);
  return (
    <div className="space-y-2 mb-4">
      {visible.map((alert) => {
        const inner = (
          <div
            className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${SEVERITY[alert.severity]}`}
          >
            <div>
              <p className="font-semibold">{alert.title}</p>
              {alert.body ? (
                <p className="mt-0.5 text-sm opacity-90">{alert.body}</p>
              ) : null}
            </div>
            <span className="shrink-0 text-xs font-medium opacity-80">Review →</span>
          </div>
        );
        return alert.href ? (
          <Link key={alert.id} href={alert.href} className="block">
            {inner}
          </Link>
        ) : (
          <div key={alert.id}>{inner}</div>
        );
      })}
      {truncatedCount > 0 || alerts.length > MAX_ALERTS_VISIBLE ? (
        <p className="text-xs text-gray-500 px-1">
          {alerts.length > MAX_ALERTS_VISIBLE
            ? `${alerts.length - MAX_ALERTS_VISIBLE} more alert${alerts.length - MAX_ALERTS_VISIBLE === 1 ? "" : "s"} — filter by pod to focus`
            : null}
          {truncatedCount > 0
            ? `${truncatedCount} pod${truncatedCount === 1 ? "" : "s"} summarized in the queue below.`
            : null}
        </p>
      ) : null}
    </div>
  );
}
