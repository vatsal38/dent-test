"use client";

import {
  recruitmentStatusBadgeClass,
  type StatusTone,
  statusToneClasses,
} from "@/design-system/tokens/status";

export function StatusBadge({
  label,
  tone,
  className = "",
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  const classes = tone
    ? `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusToneClasses(tone)}`
    : recruitmentStatusBadgeClass(label);

  return (
    <span className={`${classes} ${className}`.trim()}>{label || "—"}</span>
  );
}
