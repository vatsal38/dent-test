export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export interface StatusMeta {
  tone: StatusTone;
  label?: string;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral:
    "bg-gray-50 text-gray-800 border-gray-200",
  info: "bg-sky-50 text-sky-800 border-sky-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-800 border-red-200",
};

export function statusToneClasses(tone: StatusTone): string {
  return TONE_CLASSES[tone];
}

function normalizeKey(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Recruitment pipeline statuses (Mongo recruitmentStatus). */
export function recruitmentStatusMeta(
  status: string | null | undefined,
): StatusMeta {
  const key = normalizeKey(status || "");
  if (key === "new lead") return { tone: "info" };
  if (key === "pending review") return { tone: "warning" };
  if (key === "ready to transfer") return { tone: "info" };
  if (key === "contacted") return { tone: "neutral" };
  if (key === "transferred") return { tone: "info" };
  if (key === "approved" || key === "active student")
    return { tone: "success" };
  if (key === "onboarding") return { tone: "success" };
  if (key === "rejected") return { tone: "danger" };
  if (key === "archived") return { tone: "neutral" };
  return { tone: "neutral" };
}

export function recruitmentStatusBadgeClass(
  status: string | null | undefined,
): string {
  const { tone } = recruitmentStatusMeta(status);
  const base =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap";
  return `${base} ${statusToneClasses(tone)}`;
}
