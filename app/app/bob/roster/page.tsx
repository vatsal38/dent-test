"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getBobStudents,
  getBobPods,
  getBobStudentsFacets,
  getBobRosterImportStatus,
  startBobRosterImport,
  getBobRosterSchema,
  deleteBobStudent,
  BobRosterSchemaField,
  BobStudent,
  BobStudentsFacetsResponse,
  BobStudentsListParams,
  BobInterviewStage,
  BobStudentStatus,
} from "@/lib/api";
import {
  HeadshotCell,
  IntakeTableCell,
  StatusBadge,
  cellDisplayValue,
} from "@/components/bob/RecruitmentUi";
import {
  EMPTY_ROSTER_FILTERS,
  RosterRecordsToolbar,
} from "@/components/bob/RosterTableFilters";
import {
  countDrawerRosterFilters,
  serializeFiltersForApi,
  type RosterTableFilterState,
} from "@/lib/bobRosterFilters";
import { useBobLinkedFieldLabels } from "@/hooks/useBobLinkedFieldLabels";
import { importantRosterTableColumns } from "@/lib/bobIntakeColumns";
import { extractAirtableAttachments } from "@/lib/bobAirtableDisplay";
import { TruncatedWithTooltip } from "@/components/TruncatedWithTooltip";
import { Skeleton } from "@/components/Skeleton";
import { BobImportProgress } from "@/components/BobImportProgress";
import { ConfirmModal } from "@/components/ConfirmModal";

const STATUS_LABELS: Record<BobStudentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  graduated: "Graduated",
  withdrawn: "Withdrawn",
};

const STAGE_LABELS: Record<BobInterviewStage, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  placed: "Placed",
  not_placed: "Not placed",
};

type NameSortOrder = "asc" | "desc";

function listParamsFromFilters(
  f: RosterTableFilterState,
  page: number,
  pageSize: number,
  nameSort: NameSortOrder | null,
): BobStudentsListParams {
  const params: BobStudentsListParams = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    includeAirtableFields: true,
  };
  const q = f.search.trim();
  if (q) params.search = q;
  const filtersJson = serializeFiltersForApi(f);
  if (filtersJson) params.filters = filtersJson;
  if (nameSort) {
    params.sortBy = "name";
    params.sortOrder = nameSort;
  }
  return params;
}

function NameColumnHeader({
  sortOrder,
  onToggleSort,
}: {
  sortOrder: NameSortOrder | null;
  onToggleSort: () => void;
}) {
  const activeAsc = sortOrder === "asc";
  const activeDesc = sortOrder === "desc";
  const label =
    sortOrder === "asc"
      ? "Sorted by name A–Z. Click to sort Z–A."
      : sortOrder === "desc"
        ? "Sorted by name Z–A. Click to sort A–Z."
        : "Sort by name. Click to sort A–Z.";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggleSort();
      }}
      className="inline-flex items-center gap-1.5 uppercase tracking-wider text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
      aria-label={label}
      title={label}
    >
      <span>Name</span>
      <span className="inline-flex flex-col -space-y-0.5 shrink-0" aria-hidden>
        <svg
          className={`h-3 w-3 ${activeAsc ? "text-orange-600" : "text-gray-300"}`}
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 3L10 8H2L6 3Z" />
        </svg>
        <svg
          className={`h-3 w-3 ${activeDesc ? "text-orange-600" : "text-gray-300"}`}
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 9L2 4H10L6 9Z" />
        </svg>
      </span>
    </button>
  );
}

function pickStudentSubtitle(
  s: BobStudent,
  fields: Record<string, unknown>,
  schoolLabels?: Record<string, string>,
): string {
  if (s.email?.trim()) return s.email.trim();
  for (const k of ["Student Email", "Email"]) {
    const v = fields[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  if (s.school?.trim()) return s.school.trim();
  for (const k of ["School", "Organization", "City"]) {
    const text = cellDisplayValue(fields[k], schoolLabels);
    if (text && text !== "—" && text !== "…") return text;
  }
  return s.track?.trim() || "All Students";
}

function initialsOf(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] || "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (a + b).toUpperCase();
}

function RosterTableSkeleton({
  rowCount = 10,
  dataColumnCount = 8,
}: {
  rowCount?: number;
  dataColumnCount?: number;
}) {
  return (
    <div className="overflow-x-auto" aria-busy="true">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 sticky left-0 bg-gray-50 z-10 min-w-[220px]">
              <Skeleton className="h-3 w-16" />
            </th>
            {Array.from({ length: 2 + dataColumnCount + 1 }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {Array.from({ length: rowCount }).map((_, ri) => (
            <tr key={ri}>
              <td className="px-4 py-3 sticky left-0 bg-white z-1">
                <div className="flex items-center gap-3 min-w-[220px]">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </td>
              {Array.from({ length: 2 + dataColumnCount + 1 }).map((_, ci) => (
                <td key={ci} className="px-4 py-3">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RosterPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    students: BobStudent[];
    total: number;
  } | null>(null);
  const [schema, setSchema] = useState<BobRosterSchemaField[] | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const bootstrappedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] =
    useState<RosterTableFilterState>(EMPTY_ROSTER_FILTERS);
  const [debouncedFilters, setDebouncedFilters] =
    useState<RosterTableFilterState>(EMPTY_ROSTER_FILTERS);
  const [facets, setFacets] = useState<BobStudentsFacetsResponse | null>(null);
  const [facetsLoading, setFacetsLoading] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [nameSort, setNameSort] = useState<NameSortOrder | null>(null);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    setFacetsLoading(true);
    getBobStudentsFacets()
      .then((d) => {
        if (!cancelled) setFacets(d);
      })
      .catch(() => {
        if (!cancelled) setFacets(null);
      })
      .finally(() => {
        if (!cancelled) setFacetsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const tableFields = useMemo(
    () => importantRosterTableColumns(schema),
    [schema],
  );

  const tableFieldNames = useMemo(
    () => tableFields.map((f) => f.name),
    [tableFields],
  );

  const { labelsForField } = useBobLinkedFieldLabels(
    schema,
    data?.students ?? [],
    tableFieldNames,
  );

  const loadInitial = useCallback(async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const [res, sch] = await Promise.all([
        getBobStudents(
          listParamsFromFilters(debouncedFilters, page, pageSize, nameSort),
        ),
        getBobRosterSchema(),
      ]);
      if (sch?.fields) setSchema(sch.fields);
      setData({ students: res.students, total: res.total });
      bootstrappedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roster");
    } finally {
      setInitialLoading(false);
    }
  }, [debouncedFilters, page, pageSize, nameSort]);

  const loadTable = useCallback(async () => {
    setTableLoading(true);
    setError(null);
    try {
      const res = await getBobStudents(
        listParamsFromFilters(debouncedFilters, page, pageSize, nameSort),
      );
      setData({ students: res.students, total: res.total });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roster");
    } finally {
      setTableLoading(false);
    }
  }, [debouncedFilters, page, pageSize, nameSort]);

  const refreshAfterImport = useCallback(() => {
    void loadTable();
    getBobStudentsFacets()
      .then(setFacets)
      .catch(() => setFacets(null));
  }, [loadTable]);

  useEffect(() => {
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!bootstrappedRef.current) return;
    void loadTable();
  }, [debouncedFilters, page, pageSize, nameSort, loadTable]);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, nameSort]);

  function toggleNameSort() {
    setNameSort((prev) => {
      if (prev === null) return "asc";
      return prev === "asc" ? "desc" : "asc";
    });
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  function buildPageItems(total: number, current: number): (number | "…")[] {
    if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set<number>();
    set.add(1);
    set.add(2);
    set.add(total - 1);
    set.add(total);
    for (let n = current - 2; n <= current + 2; n++) {
      if (n > 2 && n < total - 1) set.add(n);
    }
    const list = Array.from(set).sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    for (let i = 0; i < list.length; i++) {
      out.push(list[i]);
      const next = list[i + 1];
      if (next != null && next - list[i] > 1) out.push("…");
    }
    return out;
  }

  const pageItems = buildPageItems(totalPages, currentPage);

  async function handleExportCsv() {
    if (!data?.students?.length) return;
    setExporting(true);
    try {
      const { pods } = await getBobPods({ limit: 500 });
      const podNameById = new Map(pods.map((p) => [p.id, p.name ?? p.id]));
      const headers = [
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Status",
        "Interview Stage",
        "Pod",
        "School",
        "Track",
        "Coach",
        "Stage",
        "YW Status",
        "Attendance",
        "Milestones",
      ];
      const rows = data.students.map((s) => {
        const att = s.attendanceStats
          ? `${s.attendanceStats.present ?? 0}P/${s.attendanceStats.absent ?? 0}A`
          : "";
        const mil = s.milestoneStats
          ? `${s.milestoneStats.submitted ?? 0}/${s.milestoneStats.total ?? 0}`
          : "";
        const podName = s.podId ? (podNameById.get(s.podId) ?? "") : "";
        return [
          s.firstName,
          s.lastName,
          s.email ?? "",
          s.phone ?? "",
          s.status,
          s.interviewStage,
          podName,
          s.school ?? "",
          s.track ?? "",
          s.coach ?? "",
          s.stage ?? "",
          s.ywStatus ?? "",
          att,
          mil,
        ]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(",");
      });
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bob-students-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <Skeleton className="h-7 w-44 mb-2" />
            <Skeleton className="h-4 w-[520px] max-w-full" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-36" rounded="lg" />
            <Skeleton className="h-10 w-36" rounded="lg" />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <Skeleton className="h-10 flex-1 max-w-[520px]" rounded="lg" />
          <Skeleton className="h-10 w-40" rounded="lg" />
          <Skeleton className="h-10 w-40" rounded="lg" />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-6">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="px-4 py-4 flex items-center gap-6">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-6 w-24" rounded="full" />
                <Skeleton className="h-6 w-24" rounded="full" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
        <Link
          href="/app/bob"
          className="mt-4 inline-block text-sm text-orange-600 hover:underline"
        >
          ← Back to BOB
        </Link>
      </div>
    );
  }

  async function confirmDeleteStudent() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteBobStudent(deleteTarget.id);
      setDeleteTarget(null);
      await loadTable();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete student",
      );
    } finally {
      setDeleting(false);
    }
  }

  const totalRecords = data?.total ?? 0;
  const rows = data?.students ?? [];
  const catalogTotal = facets?.pipeline?.total;
  const isCatalogEmpty =
    catalogTotal === 0 && !facetsLoading && !initialLoading && !tableLoading;
  const hasActiveFilters =
    countDrawerRosterFilters(debouncedFilters) > 0 ||
    debouncedFilters.search.trim().length > 0;
  const isFilterEmpty = totalRecords === 0 && !isCatalogEmpty;
  const headshotField = tableFields.find(
    (f) =>
      f.type === "multipleAttachments" || /headshot|head\s*shot/i.test(f.name),
  );
  const tableFieldsWithoutHeadshot = headshotField
    ? tableFields.filter((f) => f.name !== headshotField.name)
    : tableFields;

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Students
          </h1>
          <p className="text-gray-600">
            All Students roster
            {tableFields.length > 0 ? (
              <>
                {" · "}
                <span className="font-medium">{tableFields.length}</span> key
                columns
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleExportCsv()}
            disabled={!data?.students?.length || exporting}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
          <Link
            href="/app/bob/roster/new"
            className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <span>+</span> Add Student
          </Link>
        </div>
      </div>
      <BobImportProgress
        className="mb-6"
        label="roster"
        fetchStatus={getBobRosterImportStatus}
        startImport={startBobRosterImport}
        onComplete={refreshAfterImport}
      />

      <RosterRecordsToolbar
        filters={filters}
        facets={facets}
        facetsLoading={facetsLoading}
        schema={schema}
        drawerOpen={filterDrawerOpen}
        onDrawerOpenChange={setFilterDrawerOpen}
        onSearchChange={(search) =>
          setFilters((prev: RosterTableFilterState) => ({ ...prev, search }))
        }
        onApplyDrawerFilters={(drawer) =>
          setFilters((prev: RosterTableFilterState) => ({ ...prev, ...drawer }))
        }
        onClearDrawerFilters={() =>
          setFilters((prev: RosterTableFilterState) => ({
            ...EMPTY_ROSTER_FILTERS,
            search: prev.search,
          }))
        }
      />

      {error && data ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4 text-xs text-gray-500">
        {tableLoading ? (
          <span className="text-gray-400">Updating students…</span>
        ) : (
          <>
            Showing{" "}
            <span className="font-medium text-gray-800">{rows.length}</span> of{" "}
            <span className="font-medium text-gray-800">{totalRecords}</span>{" "}
            matching students
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete student?"
        message={
          deleteTarget
            ? `Remove ${deleteTarget.name} from the roster? This cannot be undone in the app.`
            : ""
        }
        confirmText={deleting ? "Deleting…" : "Delete"}
        cancelText="Cancel"
        confirmButtonStyle="danger"
        onConfirm={() => void confirmDeleteStudent()}
        onCancel={() => {
          if (!deleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      />
      {deleteError && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {deleteError}
        </div>
      )}

      {isCatalogEmpty ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-800">No students yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Import from Airtable or add a student to get started.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/app/bob/roster/new"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              Add student
            </Link>
          </div>
        </div>
      ) : isFilterEmpty && !tableLoading ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-gray-800">
            No students match your filters
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Try clearing filters or broadening search.
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() =>
                setFilters((prev: RosterTableFilterState) => ({
                  ...EMPTY_ROSTER_FILTERS,
                  search: prev.search,
                }))
              }
              className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {tableLoading ? (
              <RosterTableSkeleton
                rowCount={pageSize}
                dataColumnCount={Math.max(tableFieldsWithoutHeadshot.length, 6)}
              />
            ) : rows.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No matching students.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left sticky left-0 bg-gray-50 z-10 min-w-[220px]">
                        <NameColumnHeader
                          sortOrder={nameSort}
                          onToggleSort={toggleNameSort}
                        />
                      </th>
                      {headshotField ? (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[140px]">
                          {headshotField.name}
                        </th>
                      ) : null}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[140px]">
                        Interview stage
                      </th>
                      {tableFieldsWithoutHeadshot.map((f) => (
                        <th
                          key={f.name}
                          className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap truncate ${
                            f.type === "multipleAttachments" ||
                            /headshot|photo/i.test(f.name)
                              ? "min-w-[140px]"
                              : "max-w-[200px]"
                          }`}
                          title={
                            f.type ? `${f.name} (Airtable: ${f.type})` : f.name
                          }
                        >
                          {f.name}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rows.map((s) => {
                      const fields = (s.airtableFields || {}) as Record<
                        string,
                        unknown
                      >;
                      const displayName =
                        `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() ||
                        "Student";
                      const initial = initialsOf(displayName);
                      const schoolLabels = labelsForField(
                        tableFieldsWithoutHeadshot.find((c) =>
                          /school/i.test(c.name),
                        )?.name ?? "School",
                      );
                      const subtitle = pickStudentSubtitle(
                        s,
                        fields,
                        schoolLabels,
                      );
                      const headshots = headshotField
                        ? extractAirtableAttachments(fields[headshotField.name])
                        : [];
                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-orange-50/40 cursor-pointer transition-colors group"
                          onClick={() => router.push(`/app/bob/roster/${s.id}`)}
                        >
                          <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-orange-50/40 z-1">
                            <div className="flex items-center gap-3 min-w-[220px]">
                              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-xs font-semibold shadow-sm shrink-0">
                                {initial}
                              </div>
                              <div className="min-w-0 flex-1">
                                <TruncatedWithTooltip
                                  text={displayName}
                                  className="text-sm font-semibold text-gray-900"
                                  maxWidthClass="max-w-[200px]"
                                />
                                <TruncatedWithTooltip
                                  text={subtitle}
                                  className="text-xs text-gray-500"
                                  maxWidthClass="max-w-[200px]"
                                />
                              </div>
                            </div>
                          </td>
                          {headshotField ? (
                            <td
                              className="px-4 py-3 align-top"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <HeadshotCell attachments={headshots} />
                            </td>
                          ) : null}
                          <td className="px-4 py-3 whitespace-nowrap align-top">
                            <StatusBadge
                              label={
                                STATUS_LABELS[s.status as BobStudentStatus] ||
                                s.status
                              }
                              variant="app"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap align-top">
                            <StatusBadge
                              label={
                                STAGE_LABELS[
                                  s.interviewStage as BobInterviewStage
                                ] || s.interviewStage
                              }
                              variant="airtable"
                            />
                          </td>
                          {tableFieldsWithoutHeadshot.map((f) => (
                            <td
                              key={f.name}
                              className="px-4 py-3 text-sm text-gray-700 max-w-[280px]"
                            >
                              <IntakeTableCell
                                fieldName={f.name}
                                fieldType={f.type}
                                value={fields[f.name]}
                                linkedLabels={labelsForField(f.name)}
                              />
                            </td>
                          ))}
                          <td
                            className="px-4 py-3 text-right sticky right-0 bg-white group-hover:bg-orange-50/40 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-nowrap items-center justify-end gap-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(`/app/bob/roster/${s.id}`)
                                }
                                title="View student"
                                aria-label="View student"
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  aria-hidden
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(`/app/bob/roster/${s.id}?edit=1`)
                                }
                                title="Edit student"
                                aria-label="Edit student"
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-900"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  aria-hidden
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleteTarget({
                                    id: s.id,
                                    name: displayName,
                                  });
                                }}
                                title="Delete student"
                                aria-label="Delete student"
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  aria-hidden
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || tableLoading}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Prev
              </button>
              {pageItems.map((it, idx) =>
                it === "…" ? (
                  <span
                    key={`e-${idx}`}
                    className="px-2 py-1 text-sm text-gray-500"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={it}
                    type="button"
                    onClick={() => setPage(it)}
                    disabled={tableLoading}
                    className={`px-3 py-1.5 rounded-md border text-sm ${
                      it === currentPage
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    } disabled:opacity-50`}
                  >
                    {it}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || tableLoading}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
