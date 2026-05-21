"use client";

import type { BobRecruitmentRecord } from "@/lib/api";
import {
  cellDisplayValue as formatCellDisplay,
  extractAirtableAttachments,
  isAttachmentLikeField,
  type AirtableAttachmentItem,
} from "@/lib/bobAirtableDisplay";
import { TruncatedWithTooltip } from "@/components/TruncatedWithTooltip";

export { extractAirtableRecordIds, cellDisplayValue } from "@/lib/bobAirtableDisplay";

const MAX_HEADSHOTS_VISIBLE = 4;

export function HeadshotCell({
  attachments,
  maxVisible = MAX_HEADSHOTS_VISIBLE,
}: {
  attachments: AirtableAttachmentItem[];
  maxVisible?: number;
}) {
  if (attachments.length === 0) {
    return <span className="text-xs text-gray-300">—</span>;
  }

  const visible = attachments.slice(0, maxVisible);
  const extra = attachments.length - visible.length;

  return (
    <div
      className="flex items-center gap-1 flex-wrap"
      onClick={(e) => e.stopPropagation()}
    >
      {visible.map((att, idx) => (
        <a
          key={att.id || att.url || idx}
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          title={att.filename || `Photo ${idx + 1}`}
          className="block shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 hover:ring-2 hover:ring-orange-400 transition-shadow"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={att.thumbUrl || att.url}
            alt={att.filename || `Headshot ${idx + 1}`}
            className="h-10 w-10 object-cover"
            loading="lazy"
          />
        </a>
      ))}
      {extra > 0 ? (
        <span
          className="inline-flex h-10 min-w-[2rem] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-1.5 text-xs font-medium text-gray-600"
          title={`${attachments.length} photos total`}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

export function normalizeStatusKey(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** App pipeline statuses (Mongo recruitmentStatus). */
export function recruitmentStatusBadgeClass(status: string | null | undefined): string {
  const key = normalizeStatusKey(status || "");
  const base =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap";
  if (key === "new lead")
    return `${base} bg-sky-50 text-sky-800 border-sky-200`;
  if (key === "pending review")
    return `${base} bg-amber-50 text-amber-800 border-amber-200`;
  if (key === "ready to transfer")
    return `${base} bg-violet-50 text-violet-800 border-violet-200`;
  if (key === "contacted")
    return `${base} bg-cyan-50 text-cyan-800 border-cyan-200`;
  if (key === "transferred")
    return `${base} bg-indigo-50 text-indigo-800 border-indigo-200`;
  if (key === "approved")
    return `${base} bg-emerald-50 text-emerald-800 border-emerald-200`;
  if (key === "rejected" || key.includes("reject"))
    return `${base} bg-red-50 text-red-700 border-red-200`;
  if (key === "archived")
    return `${base} bg-gray-100 text-gray-600 border-gray-300`;
  if (key === "onboarding")
    return `${base} bg-violet-50 text-violet-800 border-violet-200`;
  if (key === "active student" || key.includes("active"))
    return `${base} bg-green-50 text-green-800 border-green-200`;
  return `${base} bg-gray-50 text-gray-700 border-gray-200`;
}

/** Airtable / Youth Works style status values. */
export function airtableStatusBadgeClass(value: string | null | undefined): string {
  const key = normalizeStatusKey(value || "");
  const base =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap max-w-[220px] truncate";
  if (!key) return `${base} bg-gray-50 text-gray-400 border-gray-200`;
  if (
    key.includes("approved") ||
    key.includes("confirmed") ||
    key.includes("complete") ||
    key.includes("placed") ||
    key.includes("hired")
  )
    return `${base} bg-emerald-50 text-emerald-800 border-emerald-200`;
  if (
    key.includes("reject") ||
    key.includes("declined") ||
    key.includes("not this") ||
    key.includes("withdraw")
  )
    return `${base} bg-red-50 text-red-700 border-red-200`;
  if (
    key.includes("pending") ||
    key.includes("review") ||
    key.includes("wait") ||
    key.includes("hold")
  )
    return `${base} bg-amber-50 text-amber-800 border-amber-200`;
  if (
    key.includes("contact") ||
    key.includes("outreach") ||
    key.includes("intro") ||
    key.includes("new")
  )
    return `${base} bg-sky-50 text-sky-800 border-sky-200`;
  if (key.includes("interview") || key.includes("active") || key.includes("progress"))
    return `${base} bg-blue-50 text-blue-800 border-blue-200`;
  if (key.includes("mou") || key.includes("offer") || key.includes("invoice"))
    return `${base} bg-purple-50 text-purple-800 border-purple-200`;
  return `${base} bg-gray-50 text-gray-800 border-gray-200`;
}

export function isStatusLikeFieldName(name: string): boolean {
  const n = name.toLowerCase();
  if (/youth\s*works.*bob.*26.*status/i.test(n)) return true;
  if (/^status$/i.test(n)) return true;
  if (/recruitment\s*status|application\s*status|pipeline|stage/i.test(n)) return true;
  if (/\bstatus\b/i.test(n) && !/yw\s*id/i.test(n)) return true;
  return false;
}

export function isYouthWorksStatusField(name: string): boolean {
  return /youth\s*works.*bob.*26.*status/i.test(name);
}

function statusDot(className: string) {
  return (
    <span
      className={`w-1.5 h-1.5 rounded-full shrink-0 ${className}`}
      aria-hidden
    />
  );
}

export function StatusBadge({
  label,
  variant = "app",
}: {
  label: string | null | undefined;
  variant?: "app" | "airtable";
}) {
  const text = label?.trim() || "—";
  if (text === "—") {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-xs text-gray-400 border border-dashed border-gray-200">
        No status
      </span>
    );
  }
  const cls =
    variant === "app"
      ? recruitmentStatusBadgeClass(text)
      : airtableStatusBadgeClass(text);
  const dot =
    variant === "app"
      ? "bg-current opacity-60"
      : "bg-current opacity-50";
  return (
    <span className={`${cls} max-w-[260px]`} title={text}>
      <span className="inline-flex items-center gap-1.5 max-w-full min-w-0">
        {statusDot(dot)}
        <span className="truncate">{text}</span>
      </span>
    </span>
  );
}

export function TransferredBadge({ transferred }: { transferred: boolean }) {
  return transferred ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      In Students & Alums
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" aria-hidden />
      Not transferred
    </span>
  );
}

export function ProgramsBadge({ count }: { count: number }) {
  if (count <= 0) {
    return (
      <span className="text-xs text-gray-400">—</span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200">
      {count} program{count === 1 ? "" : "s"}
    </span>
  );
}

export function pickYouthWorksStatus(
  fields: Record<string, unknown> | undefined,
): { value: string; fieldName: string } | null {
  if (!fields) return null;
  for (const [k, v] of Object.entries(fields)) {
    if (!isYouthWorksStatusField(k)) continue;
    const s = formatCellDisplay(v);
    if (s && s !== "—") return { value: s, fieldName: k };
  }
  for (const [k, v] of Object.entries(fields)) {
    if (!isYouthWorksStatusField(k)) continue;
    const s = formatCellDisplay(v);
    if (s) return { value: s, fieldName: k };
  }
  return null;
}

export function IntakeTableCell({
  fieldName,
  value,
  linkedLabels,
  fieldType,
}: {
  fieldName: string;
  value: unknown;
  linkedLabels?: Record<string, string>;
  fieldType?: string | null;
}) {
  if (isAttachmentLikeField(fieldName, fieldType)) {
    const attachments = extractAirtableAttachments(value);
    return <HeadshotCell attachments={attachments} />;
  }

  const display = formatCellDisplay(value, linkedLabels);
  if (display === "—") {
    return <span className="text-xs text-gray-300">—</span>;
  }
  if (isStatusLikeFieldName(fieldName)) {
    return <StatusBadge label={display} variant="airtable" />;
  }
  if (/email/i.test(fieldName)) {
    return (
      <TruncatedWithTooltip
        text={display}
        href={`mailto:${display}`}
        onClick={(e) => e.stopPropagation()}
        className="text-sm text-orange-600 hover:underline"
        maxWidthClass="max-w-[200px]"
      />
    );
  }
  if (/phone|cell/i.test(fieldName)) {
    return (
      <TruncatedWithTooltip
        text={display}
        href={`tel:${display.replace(/[^\d+]/g, "")}`}
        onClick={(e) => e.stopPropagation()}
        className="text-sm text-gray-800 hover:text-orange-600"
        maxWidthClass="max-w-[160px]"
      />
    );
  }
  return (
    <TruncatedWithTooltip
      text={display}
      maxWidthClass="max-w-[240px]"
      loadingTitle="Loading linked record names…"
    />
  );
}

export function RecruitmentRowPipeline({
  record,
}: {
  record: BobRecruitmentRecord;
}) {
  return <StatusBadge label={record.recruitmentStatus} variant="app" />;
}
