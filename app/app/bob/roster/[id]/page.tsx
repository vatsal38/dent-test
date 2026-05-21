"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBobRosterSchema, getBobStudent, updateBobStudent, BobRosterSchemaField, BobStudent } from "@/lib/api";
import { cellDisplayValue, isAirtableRecordId } from "@/lib/bobAirtableDisplay";
import { useBobLinkedFieldLabels } from "@/hooks/useBobLinkedFieldLabels";
import { Skeleton } from "@/components/Skeleton";

function getAirtableErrorText(v: unknown): string | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const anyV = v as Record<string, unknown>;
  const err = anyV.error;
  if (typeof err === "string" && err.trim()) return err.trim();
  return null;
}

function formatValue(v: unknown, labelsByRecordId?: Record<string, string>): string {
  if (v != null && typeof v === "object" && !Array.isArray(v)) {
    const err = getAirtableErrorText(v);
    if (err) return "Not available";
  }
  return cellDisplayValue(v, labelsByRecordId);
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function isProbablyEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function isProbablyPhone(s: string) {
  const digits = s.replace(/[^\d]/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function isProbablyUrl(s: string) {
  return /^https?:\/\//i.test(s.trim());
}

function isIsoDateTimeString(s: string) {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(s.trim());
}

function isIsoDateString(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

function toDateInputValue(value: unknown): string {
  if (typeof value !== "string") return "";
  const s = value.trim();
  if (isIsoDateString(s)) return s;
  if (isIsoDateTimeString(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function toDateTimeLocalValue(value: unknown): string {
  if (typeof value !== "string") return "";
  const s = value.trim();
  if (isIsoDateTimeString(s)) return s.slice(0, 16); // YYYY-MM-DDTHH:mm
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

function formatFriendlyDate(value: string) {
  const s = value.trim();
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return value;
  // If it's a pure date, show date-only; if datetime, show date+time.
  if (isIsoDateString(s)) {
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback (best-effort)
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(ta);
    }
  }
}

function renderValueNode(
  value: unknown,
  labelsByRecordId?: Record<string, string>,
) {
  if (value == null) return <span className="text-gray-400">—</span>;
  if (typeof value === "object" && !Array.isArray(value)) {
    const err = getAirtableErrorText(value);
    if (err) {
      return (
        <span
          className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
          title={err}
        >
          Not available
          <span className="text-[11px] font-normal text-red-600">{err}</span>
        </span>
      );
    }
  }

  const display = formatValue(value, labelsByRecordId);
  if (display === "—" || display === "…") {
    return <span className="text-gray-400">{display === "…" ? "…" : "—"}</span>;
  }

  if (isProbablyEmail(display)) {
    return (
      <a className="text-orange-700 hover:underline" href={`mailto:${display}`}>
        {display}
      </a>
    );
  }
  if (isProbablyPhone(display)) {
    const digits = display.replace(/[^\d+]/g, "");
    return (
      <a className="text-orange-700 hover:underline" href={`tel:${digits}`}>
        {display}
      </a>
    );
  }
  if (isProbablyUrl(display)) {
    return (
      <a
        className="text-orange-700 hover:underline"
        href={display}
        target="_blank"
        rel="noreferrer"
      >
        {display}
      </a>
    );
  }

  const parts = display.split(/,\s*/).filter(Boolean);
  if (parts.length > 1) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {parts.slice(0, 30).map((it, idx) => (
          <span
            key={`${it}-${idx}`}
            className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
          >
            {it}
          </span>
        ))}
        {parts.length > 30 && (
          <span className="text-xs text-gray-500">+{parts.length - 30} more</span>
        )}
      </div>
    );
  }

  const single = parts[0] || display;
  if (isIsoDateTimeString(single) || isIsoDateString(single)) {
    return <span className="text-gray-900">{formatFriendlyDate(single)}</span>;
  }
  if (isAirtableRecordId(single)) {
    return <span className="text-gray-400">…</span>;
  }
  return <span className="text-gray-900">{single}</span>;
}

function FieldRow({
  label,
  value,
  valueNode,
  labelsByRecordId,
}: {
  label: string;
  value: unknown;
  valueNode?: React.ReactNode;
  labelsByRecordId?: Record<string, string>;
}) {
  const text = formatValue(value, labelsByRecordId);
  const isLong = typeof text === "string" && text.length > 180;
  return (
    <div className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-100">
      <div className="sm:col-span-4 text-xs font-medium text-gray-500 uppercase tracking-wide sm:pt-1">
        {label}
      </div>
      <div className="sm:col-span-7 text-sm whitespace-pre-wrap wrap-break-word">
        {valueNode ? (
          valueNode
        ) : isLong ? (
          <details className="group">
            <summary className="cursor-pointer select-none text-gray-700 hover:text-gray-900">
              {text.slice(0, 180)}…
              <span className="ml-2 text-xs text-orange-600 group-open:hidden">Show more</span>
              <span className="ml-2 text-xs text-orange-600 hidden group-open:inline">Show less</span>
            </summary>
            <div className="mt-2">{renderValueNode(value, labelsByRecordId)}</div>
          </details>
        ) : (
          renderValueNode(value, labelsByRecordId)
        )}
      </div>
      <div className="sm:col-span-1 flex sm:justify-end">
        {!valueNode && (
          <button
            type="button"
            onClick={() => copyToClipboard(text)}
            className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
            title="Copy"
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
}

type FieldGroupKey = "Contact" | "Family" | "School" | "Program" | "Attendance" | "Notes" | "Other";

function groupForFieldName(name: string): FieldGroupKey {
  const n = name.toLowerCase();
  if (/(email|phone|cell|mobile|address|instagram|linkedin)/.test(n)) return "Contact";
  if (/(parent|guardian|emergency|family|home phone)/.test(n)) return "Family";
  if (/(school|grade|gpa|teacher|counselor)/.test(n)) return "School";
  if (/(dent|track|pod|coach|start date|enroll|placement|interview|status|stage)/.test(n)) return "Program";
  if (/(attendance|present|absent|tardy)/.test(n)) return "Attendance";
  if (/(note|notes|comment|reflection)/.test(n)) return "Notes";
  return "Other";
}

function Section({
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="bg-white border border-gray-200 rounded-lg overflow-hidden" open={defaultOpen}>
      <summary className="cursor-pointer select-none px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
        <div className="text-xs text-gray-500 pt-0.5">Toggle</div>
      </summary>
      <div className="px-4">{children}</div>
    </details>
  );
}

export default function StudentDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const openedEditFromQueryRef = useRef(false);

  const [student, setStudent] = useState<BobStudent | null>(null);
  const [schema, setSchema] = useState<BobRosterSchemaField[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showEmpty, setShowEmpty] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [s, sch] = await Promise.all([getBobStudent(id), getBobRosterSchema()]);
      setStudent(s);
      setSchema(sch.fields || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load student");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    openedEditFromQueryRef.current = false;
  }, [id]);

  useEffect(() => {
    if (!student || openedEditFromQueryRef.current) return;
    if (searchParams?.get("edit") === "1") {
      setEditing(true);
      openedEditFromQueryRef.current = true;
    }
  }, [student, searchParams]);

  const airtableFields = (student?.airtableFields || {}) as Record<string, unknown>;
  const fieldTypeByName = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of schema || []) {
      if (f?.name) m.set(f.name, f.type);
    }
    return m;
  }, [schema]);

  const schemaFieldNames = useMemo(
    () => (schema || []).map((f) => f.name).filter(Boolean),
    [schema],
  );

  const { labelsForField } = useBobLinkedFieldLabels(
    schema,
    student ? [student] : [],
    schemaFieldNames,
  );

  useEffect(() => {
    if (!editing) setDraft(airtableFields);
  }, [editing, student]); // eslint-disable-line react-hooks/exhaustive-deps

  const orderedFields = useMemo(() => {
    const list = schema ?? [];
    const seen = new Set<string>();
    const out: { name: string; value: unknown }[] = [];

    // Put the most useful fields first if they exist.
    const pin = [
      "Name",
      "First Name",
      "Last Name",
      "Preferred Name",
      "Student Email",
      "Student Cell Phone Number",
      "School",
      "Parent/Guardian Email",
      "Start Date @ Dent",
    ];
    for (const n of pin) {
      if (Object.prototype.hasOwnProperty.call(airtableFields, n)) {
        out.push({ name: n, value: airtableFields[n] });
        seen.add(n);
      }
    }

    for (const f of list) {
      if (!f?.name || seen.has(f.name)) continue;
      if (!Object.prototype.hasOwnProperty.call(airtableFields, f.name)) continue;
      out.push({ name: f.name, value: airtableFields[f.name] });
      seen.add(f.name);
    }

    // Anything in the row but not in schema (rare) goes last.
    for (const k of Object.keys(airtableFields)) {
      if (seen.has(k)) continue;
      out.push({ name: k, value: airtableFields[k] });
      seen.add(k);
    }

    return out;
  }, [schema, airtableFields]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = orderedFields.filter((f) => {
      if (showEmpty) return true;
      const t = formatValue(f.value);
      return t !== "—";
    });
    if (!term) return base;
    return base.filter((f) => {
      const label = f.name.toLowerCase();
      const val = formatValue(f.value).toLowerCase();
      return label.includes(term) || val.includes(term);
    });
  }, [orderedFields, q, showEmpty]);

  const grouped = useMemo(() => {
    const groups: Record<FieldGroupKey, { name: string; value: unknown }[]> = {
      Contact: [],
      Family: [],
      School: [],
      Program: [],
      Attendance: [],
      Notes: [],
      Other: [],
    };
    for (const f of filtered) groups[groupForFieldName(f.name)].push({ name: f.name, value: f.value });
    return groups;
  }, [filtered]);

  const changedKeys = useMemo(() => {
    if (!editing) return [];
    const keys = new Set<string>([
      ...Object.keys(airtableFields || {}),
      ...Object.keys(draft || {}),
    ]);
    const diffs: string[] = [];
    for (const k of keys) {
      const a = (airtableFields || {})[k];
      const b = (draft || {})[k];
      const sa = a === undefined ? "__undef__" : JSON.stringify(a);
      const sb = b === undefined ? "__undef__" : JSON.stringify(b);
      if (sa !== sb) diffs.push(k);
    }
    diffs.sort((x, y) => x.localeCompare(y));
    return diffs;
  }, [editing, airtableFields, draft]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-10 w-28" rounded="lg" />
        </div>
        <Skeleton className="h-10 w-full max-w-[520px]" rounded="lg" />
        <div className="mt-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-4 border-b border-gray-100">
              <Skeleton className="h-4 w-56 mb-2" />
              <Skeleton className="h-3 w-80" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!student) return null;

  const title = `${student.firstName} ${student.lastName}`.trim() || "Student";
  const subtitle =
    (airtableFields["Student Email"] as string | undefined) ||
    student.email ||
    null;
  const avatar = initialsOf(title);
  const studentPhone =
    (airtableFields["Student Cell Phone Number"] as string | undefined) ||
    (airtableFields["Phone"] as string | undefined) ||
    student.phone ||
    null;
  const school =
    (airtableFields["School"] as string | undefined) || student.school || null;
  const startDate =
    (airtableFields["Start Date @ Dent"] as string | undefined) || null;

  function setDraftField(name: string, value: unknown) {
    setDraft((d) => ({ ...d, [name]: value }));
  }

  function renderEditor(name: string, value: unknown) {
    const t = fieldTypeByName.get(name) || "";
    const normalized = value == null ? "" : value;
    if (t === "date") {
      return (
        <input
          type="date"
          value={toDateInputValue(value)}
          onChange={(e) => setDraftField(name, e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      );
    }
    if (t === "dateTime") {
      return (
        <input
          type="datetime-local"
          value={toDateTimeLocalValue(value)}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return setDraftField(name, null);
            const iso = new Date(v).toISOString();
            setDraftField(name, iso);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      );
    }
    if (t === "checkbox") {
      return (
        <label className="inline-flex items-center gap-2 text-sm text-gray-800">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => setDraftField(name, e.target.checked)}
            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          {Boolean(value) ? "Yes" : "No"}
        </label>
      );
    }
    if (t === "multilineText") {
      return (
        <textarea
          value={typeof normalized === "string" ? normalized : formatValue(normalized)}
          onChange={(e) => setDraftField(name, e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      );
    }
    if (t === "email") {
      return (
        <input
          type="email"
          value={typeof normalized === "string" ? normalized : formatValue(normalized)}
          onChange={(e) => setDraftField(name, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      );
    }
    if (t === "phoneNumber") {
      return (
        <input
          type="tel"
          value={typeof normalized === "string" ? normalized : formatValue(normalized)}
          onChange={(e) => setDraftField(name, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      );
    }
    if (t === "number" || t === "currency" || t === "percent" || t === "rating" || t === "count") {
      const num =
        typeof value === "number"
          ? value
          : typeof value === "string" && value.trim() !== ""
            ? Number(value)
            : "";
      return (
        <input
          type="number"
          value={Number.isNaN(num as number) ? "" : (num as any)}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return setDraftField(name, null);
            const n = Number(raw);
            setDraftField(name, Number.isNaN(n) ? raw : n);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      );
    }
    if (t === "multipleSelects" || t === "multipleRecordLinks") {
      const str = Array.isArray(value)
        ? value.map((x) => String(x ?? "")).filter(Boolean).join(", ")
        : typeof value === "string"
          ? value
          : "";
      return (
        <input
          value={str}
          onChange={(e) =>
            setDraftField(
              name,
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          placeholder="Comma separated…"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
      );
    }
    // default: string-like
    return (
      <input
        value={typeof normalized === "string" ? normalized : formatValue(normalized)}
        onChange={(e) => setDraftField(name, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-[1100px] mx-auto">
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-semibold">
              {avatar}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
                {student.status && (
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    {student.status}
                  </span>
                )}
                {student.stage && (
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {student.stage}
                  </span>
                )}
                {student.track && (
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                    {student.track}
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                {subtitle && (
                  <span>
                    <span className="text-gray-500">Email:</span> {renderValueNode(subtitle)}
                  </span>
                )}
                {studentPhone && (
                  <span>
                    <span className="text-gray-500">Phone:</span> {renderValueNode(studentPhone)}
                  </span>
                )}
                {school && (
                  <span>
                    <span className="text-gray-500">School:</span> {school}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Back
            </button>
            <Link
              href="/app/bob/roster"
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium text-center"
            >
              Roster
            </Link>
            <button
              type="button"
              onClick={() => {
                setSaveError(null);
                setEditing((v) => !v);
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              {editing ? "Cancel" : "Edit"}
            </button>
            {subtitle && isProbablyEmail(String(subtitle)) && (
              <a
                href={`mailto:${String(subtitle)}`}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium text-center"
              >
                Email student
              </a>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-amber-900">
                  You’re editing this student
                </div>
                <div className="text-xs text-amber-800 mt-0.5">
                  Make changes below, then press <span className="font-semibold">Save changes</span>.
                  {changedKeys.length ? (
                    <span className="ml-2">
                      <span className="font-semibold">{changedKeys.length}</span>{" "}
                      change{changedKeys.length === 1 ? "" : "s"}.
                    </span>
                  ) : (
                    <span className="ml-2">No changes yet.</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-amber-800">
                Tip: use the search box to find a field fast.
              </div>
            </div>
          </div>
        )}

        {saveError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {saveError}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500">Start date @ Dent</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">{startDate || "—"}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500">Interview stage</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">{student.interviewStage || "—"}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500">Coach</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">{student.coach || "—"}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500">YouthWorks</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">{student.ywStatus || "—"}</div>
          </div>
        </div>
      </div>

      <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">Find information quickly</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Search by field name (example: “guardian”, “school”, “phone”) or by value.
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search student info…"
              className="mt-3 px-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
            <input
              type="checkbox"
              checked={showEmpty}
              onChange={(e) => setShowEmpty(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            Show empty fields too
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Section
          title={`Contact (${grouped.Contact.length})`}
          subtitle="How to reach the student"
          defaultOpen
        >
          {grouped.Contact.length === 0 ? (
            <div className="py-6 text-sm text-gray-500">No contact details found.</div>
          ) : (
            grouped.Contact.map((f) =>
              editing ? (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={draft[f.name]}
                  valueNode={<div className="w-full">{renderEditor(f.name, draft[f.name])}</div>}
                />
              ) : (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={f.value}
                  labelsByRecordId={labelsForField(f.name)}
                />
              ),
            )
          )}
        </Section>

        <Section
          title={`Family / Guardian (${grouped.Family.length})`}
          subtitle="Parent/guardian and emergency info"
          defaultOpen={false}
        >
          {grouped.Family.length === 0 ? (
            <div className="py-6 text-sm text-gray-500">No family/guardian info found.</div>
          ) : (
            grouped.Family.map((f) =>
              editing ? (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={draft[f.name]}
                  valueNode={<div className="w-full">{renderEditor(f.name, draft[f.name])}</div>}
                />
              ) : (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={f.value}
                  labelsByRecordId={labelsForField(f.name)}
                />
              ),
            )
          )}
        </Section>

        <Section title={`School (${grouped.School.length})`} subtitle="School related info" defaultOpen={false}>
          {grouped.School.length === 0 ? (
            <div className="py-6 text-sm text-gray-500">No school info found.</div>
          ) : (
            grouped.School.map((f) =>
              editing ? (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={draft[f.name]}
                  valueNode={<div className="w-full">{renderEditor(f.name, draft[f.name])}</div>}
                />
              ) : (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={f.value}
                  labelsByRecordId={labelsForField(f.name)}
                />
              ),
            )
          )}
        </Section>

        <Section
          title={`Program (${grouped.Program.length})`}
          subtitle="Dent program, stage, track, coach, etc."
          defaultOpen={false}
        >
          {grouped.Program.length === 0 ? (
            <div className="py-6 text-sm text-gray-500">No program info found.</div>
          ) : (
            grouped.Program.map((f) =>
              editing ? (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={draft[f.name]}
                  valueNode={<div className="w-full">{renderEditor(f.name, draft[f.name])}</div>}
                />
              ) : (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={f.value}
                  labelsByRecordId={labelsForField(f.name)}
                />
              ),
            )
          )}
        </Section>

        <Section
          title={`Attendance (${grouped.Attendance.length})`}
          subtitle="Attendance-related fields"
          defaultOpen={false}
        >
          {grouped.Attendance.length === 0 ? (
            <div className="py-6 text-sm text-gray-500">No attendance info found.</div>
          ) : (
            grouped.Attendance.map((f) =>
              editing ? (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={draft[f.name]}
                  valueNode={<div className="w-full">{renderEditor(f.name, draft[f.name])}</div>}
                />
              ) : (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={f.value}
                  labelsByRecordId={labelsForField(f.name)}
                />
              ),
            )
          )}
        </Section>

        <Section title={`Notes (${grouped.Notes.length})`} subtitle="Notes and comments" defaultOpen={false}>
          {grouped.Notes.length === 0 ? (
            <div className="py-6 text-sm text-gray-500">No notes found.</div>
          ) : (
            grouped.Notes.map((f) =>
              editing ? (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={draft[f.name]}
                  valueNode={<div className="w-full">{renderEditor(f.name, draft[f.name])}</div>}
                />
              ) : (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={f.value}
                  labelsByRecordId={labelsForField(f.name)}
                />
              ),
            )
          )}
        </Section>

        <Section
          title={`Other information (${grouped.Other.length})`}
          subtitle="Everything else from Airtable"
          defaultOpen={false}
        >
          {grouped.Other.length === 0 ? (
            <div className="py-6 text-sm text-gray-500">No other fields found.</div>
          ) : (
            grouped.Other.map((f) =>
              editing ? (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={draft[f.name]}
                  valueNode={<div className="w-full">{renderEditor(f.name, draft[f.name])}</div>}
                />
              ) : (
                <FieldRow
                  key={f.name}
                  label={f.name}
                  value={f.value}
                  labelsByRecordId={labelsForField(f.name)}
                />
              ),
            )
          )}
        </Section>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Source: <span className="font-medium">Airtable → All Students</span>
      </div>

      {editing && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-white/95 backdrop-blur border-t border-gray-200">
            <div className="max-w-[1100px] mx-auto px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-700">
                <span className="font-semibold">{changedKeys.length}</span>{" "}
                change{changedKeys.length === 1 ? "" : "s"} pending
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSaveError(null);
                    setDraft(airtableFields);
                    setEditing(false);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || changedKeys.length === 0}
                  onClick={async () => {
                    if (!student?.id) return;
                    setSaving(true);
                    setSaveError(null);
                    try {
                      const updated = await updateBobStudent(student.id, {
                        airtableFields: draft,
                      });
                      setStudent(updated);
                      setEditing(false);
                    } catch (e) {
                      setSaveError(
                        e instanceof Error ? e.message : "Failed to save changes",
                      );
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

