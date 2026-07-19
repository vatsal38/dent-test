"use client";

import type { ReactNode } from "react";

/** Compact Morning/Afternoon sign-in → sign-out row for mobile attendance cards. */
export function AttendancePunchRow({
  label,
  inTime,
  outTime,
  hours,
  tone = "emerald",
  size = "default",
}: {
  label: string;
  inTime?: string;
  outTime?: string;
  hours?: string;
  tone?: "emerald" | "orange" | "gray";
  size?: "default" | "large";
}) {
  const inLabel = inTime && inTime !== "—" && inTime !== "[object Object]" ? inTime : "—";
  const outLabel =
    outTime && outTime !== "—" && outTime !== "[object Object]" ? outTime : "—";
  const labelTone =
    tone === "orange"
      ? "text-orange-800"
      : tone === "gray"
        ? "text-gray-600"
        : "text-emerald-800";
  const hoursTone =
    tone === "orange" ? "text-orange-700" : tone === "gray" ? "text-gray-600" : "text-emerald-700";
  const textSize = size === "large" ? "text-sm" : "text-xs";

  return (
    <div className={`flex items-center gap-2 ${textSize}`}>
      <span className={`w-[4.75rem] sm:w-24 shrink-0 font-semibold tracking-wide ${labelTone}`}>
        {label}
      </span>
      <span className="flex-1 min-w-0 tabular-nums text-gray-900">
        <span className="font-medium">{inLabel}</span>
        <span className="text-gray-400 mx-1">→</span>
        <span className="font-medium">{outLabel}</span>
      </span>
      {hours ? (
        <span className={`shrink-0 tabular-nums font-semibold ${hoursTone}`}>{hours}</span>
      ) : null}
    </div>
  );
}

export function AttendancePunchBlock({
  title,
  children,
  tone = "emerald",
}: {
  title: string;
  children: ReactNode;
  tone?: "emerald" | "gray";
}) {
  const border =
    tone === "gray" ? "border-gray-200 bg-gray-50/70" : "border-emerald-100 bg-emerald-50/50";
  const heading = tone === "gray" ? "text-gray-700" : "text-emerald-900";

  return (
    <div className={`rounded-lg border px-3 py-2.5 space-y-2 ${border}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${heading}`}>{title}</p>
      {children}
    </div>
  );
}
