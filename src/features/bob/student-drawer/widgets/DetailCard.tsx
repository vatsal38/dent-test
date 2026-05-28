"use client";

import type { ReactNode } from "react";

export function DetailCard({
  label,
  value,
  hint,
  action,
  className = "",
  children,
}: {
  label: string;
  value?: ReactNode;
  hint?: string;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </p>
        {action}
      </div>
      {children ?? (
        <p className="mt-1.5 text-sm font-semibold text-gray-900 tabular-nums">
          {value ?? "—"}
        </p>
      )}
      {hint ? (
        <p className="mt-1 text-xs text-gray-500 leading-snug">{hint}</p>
      ) : null}
    </div>
  );
}

export function DetailCardGrid({
  children,
  cols = 2,
}: {
  children: ReactNode;
  cols?: 2 | 3;
}) {
  const colClass = cols === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={`grid ${colClass} gap-3`}>{children}</div>
  );
}
