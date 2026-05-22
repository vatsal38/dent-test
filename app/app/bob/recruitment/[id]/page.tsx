"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getBobStudents,
  getBobRecruitmentRecord,
  getBobRecruitmentSchema,
  resolveBobAirtableRecordLabels,
  approveBobRecruitment,
  previewBobRecruitmentTransfer,
  transferBobRecruitment,
  updateBobRecruitmentPrograms,
  type BobRecruitmentTransferPreview,
  type BobRecruitmentTransferResult,
  updateBobRecruitment,
  BobRecruitmentRecord,
  BobRosterSchemaField,
  BobRosterSchemaResponse,
} from "@/lib/api";
import { importantIntakeTableColumns } from "@/lib/bobIntakeColumns";
import {
  StatusBadge,
  TransferredBadge,
  isStatusLikeFieldName,
  pickYouthWorksStatus,
} from "@/components/bob/RecruitmentUi";
import { TransferConfirmationModal } from "@/components/bob/TransferConfirmationModal";
import { Skeleton } from "@/components/Skeleton";

function formatDateTime(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isRecruitmentApproved(status: string | null | undefined) {
  return String(status || "")
    .trim()
    .toLowerCase() === "approved";
}

function isTransferred(record: BobRecruitmentRecord) {
  return Boolean(
    record.studentsAlumsAirtableRecordId ||
      String(record.recruitmentStatus || "")
        .trim()
        .toLowerCase() === "transferred",
  );
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

function looksLikeJsonString(s: string) {
  const t = s.trim();
  return (t.startsWith("[") && t.endsWith("]")) || (t.startsWith("{") && t.endsWith("}"));
}

function tryParseJsonString(s: string): unknown | null {
  if (!looksLikeJsonString(s)) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function isAirtableRecordId(s: string) {
  const t = s.trim();
  // Airtable record ids usually look like: recXXXXXXXXXXXXXX
  return /^rec[a-zA-Z0-9]{10,}$/.test(t);
}

function extractAirtableRecordIdsFromRaw(raw: string): string[] {
  const s = String(raw ?? "");
  const parsed = parseArrayFromString(s);
  const fromArray = Array.isArray(parsed)
    ? parsed
        .map((x) => (x == null ? "" : String(x).trim()))
        .filter(Boolean)
        .filter((x) => isAirtableRecordId(x))
    : [];
  if (fromArray.length) return Array.from(new Set(fromArray));
  const matches = s.match(/rec[a-zA-Z0-9]{10,}/g) || [];
  return Array.from(new Set(matches.map((m) => m.trim()).filter(Boolean)));
}

function parseArrayFromString(raw: string): unknown[] | null {
  const parsed = tryParseJsonString(raw);
  if (Array.isArray(parsed)) return parsed;
  return null;
}

function linkedRecordSummaryFromRaw(raw: string): {
  linkedCount: number;
  visibleValues: string[];
} {
  const arr = parseArrayFromString(raw);
  if (!arr) return { linkedCount: 0, visibleValues: [] };
  const normalized = arr
    .map((x) => (x == null ? "" : String(x).trim()))
    .filter(Boolean);
  const linkedCount = normalized.filter((x) => isAirtableRecordId(x)).length;
  return { linkedCount, visibleValues: normalized };
}

function useOnClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    function onDown(e: MouseEvent | TouchEvent) {
      const el = ref.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && el.contains(target)) return;
      onOutside();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown as any);
    };
  }, [enabled, onOutside, ref]);
}

function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = "Select…",
  disabled,
  resolveValueLabel,
}: {
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  resolveValueLabel?: (value: string) => string | null;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [menuRect, setMenuRect] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      const root = rootRef.current;
      const menu = menuRef.current;
      if (target && root && root.contains(target)) return;
      if (target && menu && menu.contains(target)) return;
      setOpen(false);
      setQ("");
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown as any);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setMenuRect(null);
      return;
    }
    const el = buttonRef.current;
    if (!el) return;

    function compute() {
      const btn = buttonRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const margin = 8;
      const below = window.innerHeight - r.bottom - margin;
      const above = r.top - margin;
      const maxHeight = Math.max(180, Math.min(320, Math.max(below, above)));
      const top =
        below >= 180 ? r.bottom + 8 : Math.max(margin, r.top - 8 - maxHeight);
      setMenuRect({
        left: Math.max(
          margin,
          Math.min(r.left, window.innerWidth - margin - r.width),
        ),
        top,
        width: r.width,
        maxHeight,
      });
    }

    compute();
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [options, q]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const optionLabelByValue = useMemo(
    () => new Map(options.map((o) => [o.value, o.label] as const)),
    [options],
  );

  const selectedDisplay = useMemo(() => {
    return selected.map((v) => ({
      value: v,
      label: optionLabelByValue.get(v) || resolveValueLabel?.(v) || "Selected",
      known: optionLabelByValue.has(v),
    }));
  }, [optionLabelByValue, resolveValueLabel, selected]);

  const selectedLabels = useMemo(() => {
    return selectedDisplay.map((x) => x.label).filter(Boolean);
  }, [selectedDisplay]);

  function toggle(v: string) {
    if (selectedSet.has(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  }

  const filteredNonSelected = useMemo(
    () => filtered.filter((o) => !selectedSet.has(o.value)),
    [filtered, selectedSet],
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        ref={buttonRef}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-left bg-white hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            {selectedLabels.length ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedLabels.slice(0, 6).map((lab) => (
                  <span
                    key={lab}
                    className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                  >
                    {lab}
                  </span>
                ))}
                {selectedLabels.length > 6 ? (
                  <span className="text-xs text-gray-500">+{selectedLabels.length - 6} more</span>
                ) : null}
              </div>
            ) : selected.length ? (
              <span className="text-gray-600 text-sm font-medium">
                {selected.length} selected
              </span>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          <span className="text-gray-400 shrink-0">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open &&
        menuRect &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-1000 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
            style={{
              left: menuRect.left,
              top: menuRect.top,
              width: menuRect.width,
            }}
          >
            <div className="p-3 border-b border-gray-100">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                autoFocus
              />
              <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => onChange(filtered.map((o) => o.value))}
                  className="text-orange-700 hover:underline font-medium"
                >
                  Select all (filtered)
                </button>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-gray-600 hover:underline font-medium"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="overflow-auto p-2" style={{ maxHeight: menuRect.maxHeight }}>
              {filtered.length === 0 ? (
                <div className="px-2 py-6 text-sm text-gray-500 text-center">
                  No matches
                </div>
              ) : (
                <>
                  {selectedDisplay.length > 0 ? (
                    <div className="mb-2">
                      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Selected
                      </div>
                      {selectedDisplay.map((x) => (
                        <button
                          key={`sel-${x.value}`}
                          type="button"
                          onClick={() => toggle(x.value)}
                          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 text-left"
                        >
                          <input
                            type="checkbox"
                            checked
                            readOnly
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-900">{x.label}</span>
                        </button>
                      ))}
                      <div className="my-2 border-t border-gray-100" />
                    </div>
                  ) : null}

                  {filteredNonSelected.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggle(o.value)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <input
                        type="checkbox"
                        checked={false}
                        readOnly
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-900">{o.label}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function normalizeKey(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function firstNonEmpty(...vals: Array<string | null | undefined>) {
  for (const v of vals) {
    const s = (v ?? "").toString().trim();
    if (s) return s;
  }
  return "";
}

function displayFriendlyScalar(raw: string) {
  const s = raw.trim();
  if (!s) return "";
  const parsed = tryParseJsonString(s);
  if (Array.isArray(parsed) && parsed.length === 1) {
    const v = parsed[0];
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
  }
  return s;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
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
  opts?: { resolveLinkedId?: (id: string) => { label: string; href?: string } | null },
) {
  if (value == null) return <span className="text-gray-400">—</span>;
  if (typeof value === "string") {
    const parsed = tryParseJsonString(value);
    if (parsed != null) return renderValueNode(parsed, opts);
  }
  if (Array.isArray(value)) {
    const normalized = value
      .map((x) => (x == null ? "" : String(x).trim()))
      .filter(Boolean);
    const rendered: Array<{ key: string; node: React.ReactNode }> = [];
    let unresolved = 0;
    for (const it of normalized) {
      if (isAirtableRecordId(it)) {
        const resolved = opts?.resolveLinkedId?.(it) || null;
        if (resolved?.label) {
          rendered.push({
            key: it,
            node: resolved.href ? (
              <Link
                href={resolved.href}
                className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                {resolved.label}
              </Link>
            ) : (
              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                {resolved.label}
              </span>
            ),
          });
        } else {
          unresolved += 1;
        }
        continue;
      }
      rendered.push({
        key: `${it}-${rendered.length}`,
        node: (
          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {it}
          </span>
        ),
      });
    }
    if (rendered.length === 0) return <span className="text-gray-400">—</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {rendered.slice(0, 30).map((x) => (
          <span key={x.key}>{x.node}</span>
        ))}
        {unresolved > 0 ? (
          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-50 text-gray-700 border border-gray-200">
            +{unresolved} linked
          </span>
        ) : null}
        {rendered.length > 30 ? (
          <span className="text-xs text-gray-500">+{rendered.length - 30} more</span>
        ) : null}
      </div>
    );
  }
  if (typeof value === "object") {
    let s = "";
    try {
      s = JSON.stringify(value);
    } catch {
      s = String(value);
    }
    return (
      <pre className="text-xs bg-gray-50 border border-gray-200 rounded-md p-2 overflow-auto">
        {s}
      </pre>
    );
  }
  const s = String(value).trim();
  if (!s) return <span className="text-gray-400">—</span>;
  if (isAirtableRecordId(s)) {
    const resolved = opts?.resolveLinkedId?.(s) || null;
    if (resolved?.label) {
      return resolved.href ? (
        <Link href={resolved.href} className="text-orange-700 hover:underline">
          {resolved.label}
        </Link>
      ) : (
        <span className="text-gray-900">{resolved.label}</span>
      );
    }
    return <span className="text-gray-400">—</span>;
  }
  if (isProbablyEmail(s)) {
    return (
      <a className="text-orange-700 hover:underline" href={`mailto:${s}`}>
        {s}
      </a>
    );
  }
  if (isProbablyPhone(s)) {
    const digits = s.replace(/[^\d+]/g, "");
    return (
      <a className="text-orange-700 hover:underline" href={`tel:${digits}`}>
        {s}
      </a>
    );
  }
  if (isProbablyUrl(s)) {
    return (
      <a className="text-orange-700 hover:underline" href={s} target="_blank" rel="noreferrer">
        {s}
      </a>
    );
  }
  return <span className="text-gray-900">{s}</span>;
}

type FieldGroupKey =
  | "Top"
  | "Contact"
  | "Pipeline"
  | "Source"
  | "Scheduling"
  | "Notes"
  | "Other";

function groupForFieldName(name: string): FieldGroupKey {
  const n = name.toLowerCase();
  if (/(name|full name|candidate|student name)/.test(n)) return "Top";
  if (/(email|e-mail|phone|mobile|cell|whatsapp|contact|address|city|location|linkedin|instagram)/.test(n))
    return "Contact";
  if (/(status|stage|pipeline|funnel|interview|round|result|decision|offer|enroll)/.test(n))
    return "Pipeline";
  if (/(source|lead source|referral|campaign|utm|how did you hear)/.test(n)) return "Source";
  if (/(date|time|schedule|slot|call|meeting|calendar)/.test(n)) return "Scheduling";
  if (/(note|notes|comment|remarks|feedback|summary)/.test(n)) return "Notes";
  return "Other";
}

export default function RecruitmentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [record, setRecord] = useState<BobRecruitmentRecord | null>(null);
  const [schema, setSchema] = useState<BobRosterSchemaField[] | null>(null);
  const [recruitmentSchema, setRecruitmentSchema] =
    useState<BobRosterSchemaResponse | null>(null);
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [transferring, setTransferring] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferPreview, setTransferPreview] =
    useState<BobRecruitmentTransferPreview | null>(null);
  const [loadingTransferPreview, setLoadingTransferPreview] = useState(false);
  const [transferResult, setTransferResult] =
    useState<BobRecruitmentTransferResult | null>(null);
  const [savingPrograms, setSavingPrograms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [fieldQuery, setFieldQuery] = useState("");
  const [showEmptyFields, setShowEmptyFields] = useState(false);
  const [copied, setCopied] = useState<null | "id">(null);
  const [studentByAirtableId, setStudentByAirtableId] = useState<
    Record<string, { id: string; label: string }>
  >({});
  const [linkedLabelCache, setLinkedLabelCache] = useState<
    Record<string, Record<string, string>>
  >({});

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [rec, sch] = await Promise.all([
        getBobRecruitmentRecord(id),
        getBobRecruitmentSchema(),
      ]);
      setRecord(rec);
      setRecruitmentSchema(sch);
      setSchema(sch.fields || []);
      setSelectedProgramIds(
        Array.isArray(rec.programRecordIds) ? rec.programRecordIds : [],
      );
      setDraftLabel(rec.label || "");
      const af = (rec.airtableFields || {}) as Record<string, unknown>;
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(af)) {
        if (v == null) next[k] = "";
        else if (typeof v === "object") next[k] = JSON.stringify(v);
        else next[k] = String(v);
      }
      setDraftFields(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    async function loadStudentIndex() {
      try {
        const limit = 500;
        let offset = 0;
        const next: Record<string, { id: string; label: string }> = {};
        for (let i = 0; i < 20; i++) {
          const resp = await getBobStudents({ limit, offset });
          for (const s of resp.students || []) {
            const rid = (s as any).airtableRecordId as string | null | undefined;
            if (!rid) continue;
            const label = `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.email || rid;
            next[rid] = { id: s.id, label };
          }
          offset += resp.students?.length || 0;
          if (offset >= resp.total) break;
          if (!resp.students?.length) break;
        }
        if (!cancelled) setStudentByAirtableId(next);
      } catch {
        // best-effort; if this fails we just won't resolve linked ids
      }
    }
    void loadStudentIndex();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveLinkedId = useCallback(
    (rid: string) => {
      const s = studentByAirtableId[rid];
      if (s) return { label: s.label, href: `/app/bob/roster/${s.id}` };
      return null;
    },
    [studentByAirtableId],
  );

  const studentOptions = useMemo(() => {
    const opts = Object.entries(studentByAirtableId).map(([rid, s]) => ({
      rid,
      label: s.label,
    }));
    opts.sort((a, b) => a.label.localeCompare(b.label));
    return opts;
  }, [studentByAirtableId]);

  const studentLabelByRid = useMemo(() => {
    const m = new Map<string, string>();
    for (const [rid, s] of Object.entries(studentByAirtableId)) m.set(rid, s.label);
    return m;
  }, [studentByAirtableId]);

  const linkedTableIdByFieldName = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of schema || []) {
      if (!f?.name) continue;
      if (f.type !== "multipleRecordLinks") continue;
      const tid = (f as any).linkedTableId as string | null | undefined;
      if (tid) m.set(f.name, tid);
    }
    return m;
  }, [schema]);

  const resolveLinkedLabelForField = useCallback(
    (fieldName: string, rid: string) => {
      const tableId = linkedTableIdByFieldName.get(fieldName) || null;
      if (!tableId) return null;
      return linkedLabelCache[tableId]?.[rid] || null;
    },
    [linkedLabelCache, linkedTableIdByFieldName],
  );

  useEffect(() => {
    if (!schema || !record) return;
    const byTable = new Map<string, Set<string>>();
    for (const f of schema || []) {
      if (!f?.name) continue;
      if (f.type !== "multipleRecordLinks") continue;
      const tableId = (f as any).linkedTableId as string | null | undefined;
      if (!tableId) continue;
      const raw = draftFields[f.name] ?? "";
      const ids = extractAirtableRecordIdsFromRaw(String(raw));
      if (!ids.length) continue;
      if (!byTable.has(tableId)) byTable.set(tableId, new Set());
      const set = byTable.get(tableId)!;
      for (const id of ids) set.add(id);
    }
    const tasks: Array<{ tableId: string; ids: string[] }> = [];
    for (const [tableId, set] of byTable.entries()) {
      const existing = linkedLabelCache[tableId] || {};
      const ids = Array.from(set);
      const missing = ids.filter((id) => !existing[id]);
      if (missing.length) tasks.push({ tableId, ids: missing.slice(0, 200) });
    }
    if (!tasks.length) return;
    let cancelled = false;
    (async () => {
      try {
        for (const t of tasks) {
          const resp = await resolveBobAirtableRecordLabels({
            tableId: t.tableId,
            recordIds: t.ids,
          });
          if (cancelled) return;
          setLinkedLabelCache((prev) => {
            const next = { ...prev };
            const bucket = { ...(next[t.tableId] || {}) };
            for (const [rid, lab] of Object.entries(resp.labels || {})) {
              if (typeof lab === "string" && lab.trim()) bucket[rid] = lab.trim();
            }
            next[t.tableId] = bucket;
            return next;
          });
        }
      } catch {
        // best-effort
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftFields, linkedLabelCache, record, schema]);

  const scrubAirtableIdsInText = useCallback(
    (text: string) => {
      return text.replace(/rec[a-zA-Z0-9]{10,}/g, (rid) => studentLabelByRid.get(rid) || "");
    },
    [studentLabelByRid],
  );

  const studentDropdownOptions = useMemo(
    () => studentOptions.map((o) => ({ value: o.rid, label: o.label })),
    [studentOptions],
  );

  const linkedRecordFields = useMemo(() => {
    const s = new Set<string>();
    for (const f of schema || []) {
      if (!f?.name) continue;
      if (f.type === "multipleRecordLinks") s.add(f.name);
    }
    return s;
  }, [schema]);

  const normalizedDraftFields = useMemo(() => {
    const m = new Map<string, { key: string; value: string }>();
    for (const [k, v] of Object.entries(draftFields)) {
      m.set(normalizeKey(k), { key: k, value: v });
    }
    return m;
  }, [draftFields]);

  const highlight = useMemo(() => {
    const get = (name: string) => normalizedDraftFields.get(normalizeKey(name))?.value ?? "";
    const getAny = (...names: string[]) => {
      for (const n of names) {
        const v = get(n);
        const fv = displayFriendlyScalar(v);
        if (fv.trim()) return fv;
      }
      return "";
    };

    const status = getAny(
      "Status",
      "Stage",
      "Pipeline Stage",
      "Recruitment Stage",
      "Application Status",
    );
    const phone = getAny("Phone", "Mobile", "WhatsApp", "Contact Number");
    const email = getAny("Email", "Email ID", "E-mail");
    const location = getAny("City", "Location", "Current Location", "Address");
    const source = getAny("Source", "Lead Source", "How did you hear");
    const assignedTo = getAny("Assigned To", "Owner", "Recruiter", "Handled By");

    const primaryName = firstNonEmpty(
      record?.label,
      getAny("Name", "Full Name", "Student Name", "Candidate Name"),
    );

    return {
      primaryName,
      status,
      phone,
      email,
      location,
      source,
      assignedTo,
    };
  }, [normalizedDraftFields, record?.label]);

  const filteredSchema = useMemo(() => {
    const q = fieldQuery.trim().toLowerCase();
    const list = importantIntakeTableColumns(schema);
    const filtered = q
      ? list.filter((f) => {
          const name = (f.name || "").toLowerCase();
          const raw = draftFields[f.name || ""] ?? "";
          const val = String(raw).toLowerCase();
          return name.includes(q) || val.includes(q);
        })
      : list;
    if (showEmptyFields) return filtered;
    return filtered.filter((f) => {
      const v = draftFields[f.name || ""] ?? "";
      return String(v).trim().length > 0;
    });
  }, [draftFields, fieldQuery, schema, showEmptyFields]);

  const visibleCount = filteredSchema.length;
  const totalCount = importantIntakeTableColumns(schema).length;

  const grouped = useMemo(() => {
    const groups: Record<FieldGroupKey, BobRosterSchemaField[]> = {
      Top: [],
      Contact: [],
      Pipeline: [],
      Source: [],
      Scheduling: [],
      Notes: [],
      Other: [],
    };
    for (const f of filteredSchema) {
      if (!f?.name) continue;
      groups[groupForFieldName(f.name)].push(f);
    }
    return groups;
  }, [filteredSchema]);

  const changedKeys = useMemo(() => {
    if (!editing || !record) return [];
    const before = (record.airtableFields || {}) as Record<string, unknown>;
    const keys = new Set<string>([
      ...Object.keys(before),
      ...Object.keys(draftFields || {}),
    ]);
    const diffs: string[] = [];
    for (const k of keys) {
      const a = before[k];
      const b = draftFields[k];
      const sa = a === undefined ? "__undef__" : JSON.stringify(a);
      const sb = b === undefined ? "__undef__" : JSON.stringify(b);
      if (sa !== sb) diffs.push(k);
    }
    diffs.sort((x, y) => x.localeCompare(y));
    return diffs;
  }, [draftFields, editing, record]);

  async function save() {
    if (!id || !record) return;
    setSaving(true);
    setError(null);
    try {
      const airtableFields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(draftFields)) {
        const s = String(v).trim();
        if (!s) continue;
        if (linkedRecordFields.has(k)) {
          airtableFields[k] = extractAirtableRecordIdsFromRaw(s);
          continue;
        }
        airtableFields[k] = s;
      }
      const updated = await updateBobRecruitment(id, {
        label: draftLabel.trim() || record.label,
        airtableFields,
      });
      setRecord(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
        <Link
          href="/app/bob/recruitment"
          className="mt-4 inline-block text-sm text-orange-600 hover:underline"
        >
          ← Back
        </Link>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="p-6 sm:p-8 max-w-[1100px] mx-auto">
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
          <Link href="/app/bob/recruitment" className="text-orange-600 hover:text-orange-700 hover:underline">
            Recruitment
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">Record</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {highlight.primaryName || "Recruitment record"}
              </h1>
              <StatusBadge
                label={record.recruitmentStatus || highlight.status}
                variant="app"
              />
              {(() => {
                const yw = pickYouthWorksStatus(
                  (record.airtableFields || {}) as Record<string, unknown>,
                );
                return yw ? (
                  <StatusBadge label={yw.value} variant="airtable" />
                ) : null;
              })()}
              <TransferredBadge transferred={isTransferred(record)} />
              {highlight.source ? (
                <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                  {highlight.source}
                </span>
              ) : null}
            </div>

            <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
              {highlight.email ? (
                <span>
                  <span className="text-gray-500">Email:</span>{" "}
                  {renderValueNode(highlight.email)}
                </span>
              ) : null}
              {highlight.phone ? (
                <span>
                  <span className="text-gray-500">Phone:</span>{" "}
                  {renderValueNode(highlight.phone)}
                </span>
              ) : null}
              {highlight.location ? (
                <span>
                  <span className="text-gray-500">Location:</span>{" "}
                  {highlight.location}
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-600">
              <span className="inline-flex items-center gap-2">
                <span className="font-semibold text-gray-900">Created</span>
                <span>{formatDateTime(record.createdAt) || "—"}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="font-semibold text-gray-900">Updated</span>
                <span>{formatDateTime(record.updatedAt) || "—"}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="font-semibold text-gray-900">Synced</span>
                <span>{record.airtableRecordId ? "Yes" : "No"}</span>
              </span>
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

            <button
              type="button"
              onClick={async () => {
                await copyToClipboard(record.id);
                setCopied("id");
                window.setTimeout(() => setCopied(null), 1200);
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
              title="Copy internal record id"
            >
              {copied === "id" ? "Copied" : "Copy ID"}
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setEditing((v) => !v);
                if (editing) load();
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              {editing ? "Cancel" : "Edit"}
            </button>

            {!isTransferred(record) ? (
              <button
                type="button"
                disabled={transferring || loadingTransferPreview}
                onClick={async () => {
                  if (!id) return;
                  setError(null);
                  setTransferResult(null);
                  setTransferModalOpen(true);
                  setLoadingTransferPreview(true);
                  try {
                    const preview = await previewBobRecruitmentTransfer(id, {
                      programRecordIds: selectedProgramIds,
                    });
                    setTransferPreview(preview);
                  } catch (err) {
                    setTransferModalOpen(false);
                    setError(
                      err instanceof Error ? err.message : "Could not load transfer preview",
                    );
                  } finally {
                    setLoadingTransferPreview(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 text-sm font-semibold"
              >
                {loadingTransferPreview
                  ? "Checking…"
                  : "Transfer → Students & Alums"}
              </button>
            ) : null}

            {isTransferred(record) &&
            !record.rosterStudentId &&
            !isRecruitmentApproved(
              record.recruitmentStatus || highlight.status,
            ) ? (
              <button
                type="button"
                disabled={approving}
                onClick={async () => {
                  if (!id) return;
                  setApproving(true);
                  setError(null);
                  try {
                    const updated = await approveBobRecruitment(id);
                    setRecord(updated);
                    await load();
                  } catch (err) {
                    setError(
                      err instanceof Error ? err.message : "Approval failed",
                    );
                  } finally {
                    setApproving(false);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 text-sm font-semibold"
              >
                {approving ? "Approving…" : "Approve → Roster"}
              </button>
            ) : null}

            {record.rosterStudentId ? (
              <Link
                href={`/app/bob/roster/${record.rosterStudentId}`}
                className="px-4 py-2 rounded-lg border border-green-300 bg-green-50 text-green-800 hover:bg-green-100 text-sm font-semibold text-center"
              >
                View roster
              </Link>
            ) : null}

            {highlight.phone && isProbablyPhone(highlight.phone) ? (
              <a
                href={`tel:${highlight.phone.replace(/[^\d+]/g, "")}`}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-sm font-semibold text-center"
              >
                Call
              </a>
            ) : highlight.email && isProbablyEmail(highlight.email) ? (
              <a
                href={`mailto:${highlight.email}`}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-sm font-semibold text-center"
              >
                Email
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Pipeline</h3>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center mb-4">
            {[
              {
                label: "Youth Apps & Intake",
                done: Boolean(record.airtableRecordId),
                hint: "Intake record",
              },
              {
                label: "Students & Alums",
                done: Boolean(record.studentsAlumsAirtableRecordId),
                hint: "Transfer",
              },
              {
                label: "Roster",
                done: Boolean(record.rosterStudentId),
                hint: "Approve",
              },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 ${
                      step.done
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {step.done ? "✓" : i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-900 truncate">
                      {step.label}
                    </div>
                    <div className="text-[11px] text-gray-500">{step.hint}</div>
                  </div>
                </div>
                {i < arr.length - 1 ? (
                  <div
                    className={`hidden sm:block h-0.5 flex-1 mx-3 rounded-full ${
                      step.done ? "bg-emerald-300" : "bg-gray-200"
                    }`}
                    aria-hidden
                  />
                ) : null}
              </div>
            ))}
          </div>

          {recruitmentSchema?.programOptions && recruitmentSchema.programOptions.length > 0 ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Programs {recruitmentSchema.programsFieldName ? `(${recruitmentSchema.programsFieldName})` : ""}
              </label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto mb-3">
                {recruitmentSchema.programOptions.map((opt) => {
                  const checked = selectedProgramIds.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedProgramIds((prev) =>
                          checked ? prev.filter((x) => x !== opt.id) : [...prev, opt.id],
                        );
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        checked
                          ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                          : "bg-white text-gray-700 border-gray-200 hover:border-indigo-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={savingPrograms || selectedProgramIds.length === 0}
                  onClick={async () => {
                    if (!id) return;
                    setSavingPrograms(true);
                    setError(null);
                    try {
                      const updated = await updateBobRecruitmentPrograms(
                        id,
                        selectedProgramIds,
                      );
                      setRecord(updated);
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : "Failed to save programs",
                      );
                    } finally {
                      setSavingPrograms(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {savingPrograms ? "Saving…" : "Save programs"}
                </button>
                <p className="text-xs text-gray-500">
                  Saves to intake track-choice fields (Top / Second / Other) and, after
                  transfer, <span className="font-medium">Programs</span> on Students
                  &amp; Alums. Linking <span className="font-medium">Your Name</span> on
                  the intake row fills &quot;Programs (from Your Name)&quot; in Airtable.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              No Programs table linked in Airtable schema, or options could not be loaded.
            </p>
          )}
        </div>

        {editing && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-amber-900">You’re editing this recruitment record</div>
                <div className="text-xs text-amber-800 mt-0.5">
                  Update fields below, then press <span className="font-semibold">Save changes</span>.
                  {changedKeys.length ? (
                    <span className="ml-2">
                      <span className="font-semibold">{changedKeys.length}</span> change
                      {changedKeys.length === 1 ? "" : "s"}.
                    </span>
                  ) : (
                    <span className="ml-2">No changes yet.</span>
                  )}
                </div>
              </div>
              <div className="text-xs text-amber-800">Tip: search by field name or value.</div>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500">Assigned</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">{highlight.assignedTo || "—"}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500">App status</div>
            <div className="mt-2">
              <StatusBadge
                label={record.recruitmentStatus || highlight.status}
                variant="app"
              />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500">Youth Works BoB &apos;26</div>
            <div className="mt-2">
              {(() => {
                const yw = pickYouthWorksStatus(
                  (record.airtableFields || {}) as Record<string, unknown>,
                );
                return yw ? (
                  <StatusBadge label={yw.value} variant="airtable" />
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                );
              })()}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500">Source</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">{highlight.source || "—"}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500">Synced</div>
            <div className="mt-2 flex flex-col gap-1">
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border w-fit ${
                  record.airtableRecordId
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}
              >
                {record.airtableRecordId ? "Intake linked" : "Local only"}
              </span>
              {record.studentsAlumsAirtableRecordId ? (
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border w-fit ${
                    record.studentsAlumsSyncState === "synced"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : record.studentsAlumsSyncState === "conflict"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  Student:{" "}
                  {record.studentsAlumsSyncState
                    ? record.studentsAlumsSyncState.replace(/_/g, " ")
                    : "synced"}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <TransferConfirmationModal
        open={transferModalOpen}
        preview={transferPreview}
        loadingPreview={loadingTransferPreview}
        transferring={transferring}
        onCancel={() => {
          if (!transferring) setTransferModalOpen(false);
        }}
        onConfirm={async () => {
          if (!id || !transferPreview?.valid) return;
          setTransferring(true);
          setError(null);
          try {
            const result = await transferBobRecruitment(id, {
              programRecordIds: selectedProgramIds,
            });
            setTransferResult(result);
            setTransferModalOpen(false);
            await load();
          } catch (err) {
            const e = err as Error & { details?: { errors?: { message: string }[] } };
            const detailMsg = e.details?.errors?.[0]?.message;
            setError(detailMsg || (err instanceof Error ? err.message : "Transfer failed"));
          } finally {
            setTransferring(false);
          }
        }}
      />

      {transferResult ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">
            {transferResult.action === "create"
              ? "Created new Students & Alums record"
              : "Updated existing Students & Alums record"}
          </p>
          {transferResult.duplicateResolution ? (
            <p className="mt-1 text-emerald-800">
              Duplicate resolution: {transferResult.duplicateResolution.replace(/_/g, " ")}
            </p>
          ) : null}
          {transferResult.warnings?.length ? (
            <ul className="mt-2 list-disc pl-5 text-amber-900">
              {transferResult.warnings.map((w) => (
                <li key={w.code}>{w.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">
              Youth Apps & Intake fields
              {recruitmentSchema?.intakeTable?.name
                ? ` (${recruitmentSchema.intakeTable.name})`
                : ""}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Key intake fields only ({totalCount}) — search by name or value.
            </div>
            <input
              value={fieldQuery}
              onChange={(e) => setFieldQuery(e.target.value)}
              placeholder="Search recruitment info…"
              className="mt-3 px-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
            <input
              type="checkbox"
              checked={showEmptyFields}
              onChange={(e) => setShowEmptyFields(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            Show empty fields too
          </label>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Showing <span className="font-medium">{visibleCount}</span> of{" "}
          <span className="font-medium">{totalCount}</span> fields
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {(
          [
            ["Top", "Important highlights"],
            ["Contact", "How to reach the candidate"],
            ["Pipeline", "Status, stage, interview, decisions"],
            ["Source", "Where the lead came from"],
            ["Scheduling", "Calls, meetings, dates"],
            ["Notes", "Notes and remarks"],
            ["Other", "Everything else from Airtable"],
          ] as Array<[FieldGroupKey, string]>
        ).map(([key, subtitle]) => {
          const fields = grouped[key] || [];
          return (
            <details
              key={key}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              open={key === "Top" || key === "Contact" || key === "Pipeline"}
            >
              <summary className="cursor-pointer select-none px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {key} <span className="text-gray-500 font-normal">({fields.length})</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
                </div>
                <div className="text-xs text-gray-500 pt-0.5">Toggle</div>
              </summary>
              <div className="px-4">
                {fields.length === 0 ? (
                  <div className="py-6 text-sm text-gray-500">No fields found.</div>
                ) : (
                  fields.map((f) => {
                    if (!f.name) return null;
                    const raw = draftFields[f.name] ?? "";
                    const isEmpty = !String(raw).trim();
                    return (
                      <div key={f.name} className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-2 border-b border-gray-100">
                        <div className="sm:col-span-4">
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide sm:pt-1">
                              {f.name}
                            </div>
                            {isEmpty ? (
                              <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-500">
                                empty
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">{f.type}</div>
                        </div>
                        <div className="sm:col-span-7">
                          {editing ? (
                            (() => {
                              const isLinkedField =
                                f.type === "multipleRecordLinks" ||
                                linkedRecordSummaryFromRaw(String(raw)).linkedCount > 0;

                              if (!isLinkedField) {
                                return (
                                  <textarea
                                    value={raw}
                                    onChange={(e) =>
                                      setDraftFields((d) => ({
                                        ...d,
                                        [f.name!]: e.target.value,
                                      }))
                                    }
                                    rows={String(raw).split("\n").length > 2 ? 4 : 2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="—"
                                  />
                                );
                              }

                              return (
                                <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                                  <div className="text-xs font-medium text-gray-500 mb-2">
                                    Select linked students
                                  </div>
                                  <MultiSelectDropdown
                                    options={studentDropdownOptions}
                                    selected={extractAirtableRecordIdsFromRaw(String(raw))}
                                    onChange={(selected) => {
                                      setDraftFields((d) => ({
                                        ...d,
                                        [f.name!]: JSON.stringify(selected),
                                      }));
                                    }}
                                    placeholder="Select students…"
                                    disabled={studentDropdownOptions.length === 0}
                                    resolveValueLabel={(rid) =>
                                      studentLabelByRid.get(rid) ||
                                      resolveLinkedLabelForField(f.name!, rid) ||
                                      null
                                    }
                                  />
                                  <div className="mt-2 text-xs text-gray-600">
                                    Selected:{" "}
                                    {(() => {
                                      const parsed = parseArrayFromString(String(raw));
                                      const ids = parsed
                                        ? parsed
                                            .map((x) => (x == null ? "" : String(x).trim()))
                                            .filter(Boolean)
                                            .filter((x) => isAirtableRecordId(x))
                                        : [];
                                      if (ids.length === 0) return "—";
                                      const names = ids
                                        .map((rid) => studentLabelByRid.get(rid) || "")
                                        .filter(Boolean);
                                      return names.length ? names.join(", ") : "—";
                                    })()}
                                  </div>
                                </div>
                              );
                            })()
                          ) : isStatusLikeFieldName(f.name) && String(raw).trim() ? (
                            <StatusBadge label={String(raw).trim()} variant="airtable" />
                          ) : (
                            <div className="text-sm whitespace-pre-wrap wrap-break-word">
                              {renderValueNode(raw || null, { resolveLinkedId })}
                            </div>
                          )}
                        </div>
                        <div className="sm:col-span-1 flex sm:justify-end">
                          {!editing ? (
                            <button
                              type="button"
                              onClick={() => void copyToClipboard(String(raw ?? ""))}
                              className="text-xs px-2 py-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                              title="Copy"
                            >
                              Copy
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </details>
          );
        })}
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Source: <span className="font-medium">Airtable → Recruitment</span>
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
                    setError(null);
                    setEditing(false);
                    void load();
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving || changedKeys.length === 0}
                  onClick={() => void save()}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 text-sm font-semibold"
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
