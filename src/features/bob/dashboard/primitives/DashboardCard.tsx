"use client";

import type { ReactNode } from "react";

type Props = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Subtle pulse when background refresh is in flight */
  refreshing?: boolean;
};

export function DashboardCard({
  title,
  action,
  children,
  className = "",
  refreshing = false,
}: Props) {
  return (
    <div
      className={`h-full p-4 rounded-xl border border-gray-200 bg-white shadow-sm transition-opacity flex flex-col ${refreshing ? "opacity-80" : ""} ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-2 mb-3">
          {title ? (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
