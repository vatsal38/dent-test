"use client";

import Link from "next/link";
import type { BobDashboardAlert } from "@/platform/api/bob/dashboard";

const SEVERITY_STYLES: Record<
  BobDashboardAlert["severity"],
  string
> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  critical: "border-red-200 bg-red-50 text-red-900",
};

export function AlertBanner({ alert }: { alert: BobDashboardAlert }) {
  const inner = (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${SEVERITY_STYLES[alert.severity]}`}
    >
      <p className="font-semibold">{alert.title}</p>
      {alert.body ? <p className="mt-0.5 opacity-90">{alert.body}</p> : null}
    </div>
  );

  if (alert.href) {
    return (
      <Link href={alert.href} className="block hover:opacity-95 transition-opacity">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function AlertStrip({ alerts }: { alerts: BobDashboardAlert[] }) {
  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <AlertBanner key={a.id} alert={a} />
      ))}
    </div>
  );
}
