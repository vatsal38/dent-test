"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getBobRecruitmentList,
  getBobRecruitmentSchema,
  getBobRecruitmentFacets,
  deleteBobRecruitment,
  getBobRecruitmentImportStatus,
  startBobRecruitmentImport,
  BobRecruitmentRecord,
  BobRecruitmentFacetsResponse,
  BobRecruitmentListParams,
  BobRosterSchemaField,
  BobRosterSchemaResponse,
} from "@/lib/api";
import { intakeDataTableColumns } from "@/lib/bobIntakeColumns";
import {
  IntakeTableCell,
  ProgramsBadge,
  RecruitmentRowPipeline,
  StatusBadge,
  TransferredBadge,
  cellDisplayValue,
  pickYouthWorksStatus,
} from "@/components/bob/RecruitmentUi";
import { useBobLinkedFieldLabels } from "@/hooks/useBobLinkedFieldLabels";
import { TruncatedWithTooltip } from "@/components/TruncatedWithTooltip";
import {
  EMPTY_RECRUITMENT_FILTERS,
  RecruitmentRecordsToolbar,
} from "@/components/bob/RecruitmentTableFilters";
import {
  countDrawerRecruitmentFilters,
  serializeFiltersForApi,
  type RecruitmentTableFilterState,
} from "@/lib/bobRecruitmentFilters";
import { Skeleton } from "@/components/Skeleton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { BobImportProgress } from "@/components/BobImportProgress";

type NameSortOrder = "asc" | "desc";

function listParamsFromFilters(
  f: RecruitmentTableFilterState,
  page: number,
  pageSize: number,
  nameSort: NameSortOrder | null,
): BobRecruitmentListParams {
  const params: BobRecruitmentListParams = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
  };
  const q = f.search.trim();
  if (q) params.search = q;
  const filtersJson = serializeFiltersForApi(f);
  if (filtersJson) params.filters = filtersJson;
  if (nameSort) {
    params.sortBy = "label";
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

function pickRecordSubtitle(
  fields: Record<string, unknown>,
  r: BobRecruitmentRecord,
  schoolLabels?: Record<string, string>,
): string {
  for (const k of ["Email", "Student Email"]) {
    const v = fields[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  for (const k of ["School", "Organization", "District", "City"]) {
    const text = cellDisplayValue(fields[k], schoolLabels);
    if (text && text !== "—" && text !== "…") return text;
  }
  if (r.airtableRecordId) return "Synced from Airtable";
  return "Youth Apps & Intake";
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

function RecruitmentTableSkeleton({
  rowCount = 10,
  dataColumnCount = 8,
}: {
  rowCount?: number;
  dataColumnCount?: number;
}) {
  return (
    <div
      className="overflow-x-auto"
      aria-busy="true"
      aria-label="Loading recruitment records"
    >
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 sticky left-0 bg-gray-50 z-10 min-w-[220px]">
              <Skeleton className="h-3 w-16" />
            </th>
            {Array.from({ length: 4 + dataColumnCount + 1 }).map((_, i) => (
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
              {Array.from({ length: 4 + dataColumnCount + 1 }).map((_, ci) => (
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

export default function RecruitmentPage() {
  const router = useRouter();
  const [recruitment, setRecruitment] = useState<{
    records: BobRecruitmentRecord[];
    total: number;
  } | null>(null);
  const [schema, setSchema] = useState<BobRosterSchemaField[] | null>(null);
  const [recruitmentSchema, setRecruitmentSchema] =
    useState<BobRosterSchemaResponse | null>(null);
  const [intakeTableMeta, setIntakeTableMeta] = useState<{
    name: string;
    id: string;
  } | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const bootstrappedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecruitmentTableFilterState>(
    EMPTY_RECRUITMENT_FILTERS,
  );
  const [debouncedFilters, setDebouncedFilters] =
    useState<RecruitmentTableFilterState>(EMPTY_RECRUITMENT_FILTERS);
  const [facets, setFacets] = useState<BobRecruitmentFacetsResponse | null>(
    null,
  );
  const [facetsLoading, setFacetsLoading] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [nameSort, setNameSort] = useState<NameSortOrder | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
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
    getBobRecruitmentFacets()
      .then((data) => {
        if (!cancelled) setFacets(data);
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

  const loadInitial = useCallback(async () => {
    setInitialLoading(true);
    setError(null);
    try {
      const [recRes, sch] = await Promise.all([
        getBobRecruitmentList(
          listParamsFromFilters(debouncedFilters, page, pageSize, nameSort),
        ),
        getBobRecruitmentSchema(),
      ]);
      if (sch?.fields) setSchema(sch.fields);
      const table = sch as BobRosterSchemaResponse;
      setRecruitmentSchema(table);
      if (table?.intakeTable?.name) {
        setIntakeTableMeta({
          name: table.intakeTable.name,
          id: table.intakeTable.id,
        });
      } else if (table?.table?.name) {
        setIntakeTableMeta({ name: table.table.name, id: table.table.id });
      }
      setRecruitment({ records: recRes.records, total: recRes.total });
      bootstrappedRef.current = true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load recruitment data",
      );
    } finally {
      setInitialLoading(false);
    }
  }, [debouncedFilters, page, pageSize, nameSort]);

  const loadRecruitmentTable = useCallback(async () => {
    setTableLoading(true);
    setError(null);
    try {
      const recRes = await getBobRecruitmentList(
        listParamsFromFilters(debouncedFilters, page, pageSize, nameSort),
      );
      setRecruitment({ records: recRes.records, total: recRes.total });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load recruitment data",
      );
    } finally {
      setTableLoading(false);
    }
  }, [debouncedFilters, page, pageSize, nameSort]);

  const refreshAfterImport = useCallback(() => {
    void loadRecruitmentTable();
    getBobRecruitmentFacets()
      .then(setFacets)
      .catch(() => setFacets(null));
  }, [loadRecruitmentTable]);

  useEffect(() => {
    void loadInitial();
    // Bootstrap once on mount; filter/page changes use loadRecruitmentTable only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!bootstrappedRef.current) return;
    void loadRecruitmentTable();
  }, [debouncedFilters, page, pageSize, nameSort, loadRecruitmentTable]);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, nameSort]);

  function toggleNameSort() {
    setNameSort((prev) => {
      if (prev === null) return "asc";
      return prev === "asc" ? "desc" : "asc";
    });
  }

  const totalPages = Math.max(
    1,
    Math.ceil((recruitment?.total ?? 0) / pageSize),
  );
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

  const intakeColumns = useMemo(() => intakeDataTableColumns(schema), [schema]);

  const intakeFieldNames = useMemo(
    () => intakeColumns.map((f) => f.name),
    [intakeColumns],
  );

  const listRecords = recruitment?.records ?? [];

  const linkedLabelOverrides = useMemo(() => {
    const out: Record<string, string> = {};
    const programsTableId = recruitmentSchema?.programsTable?.id || "";
    if (programsTableId) {
      for (const f of intakeColumns) {
        if (/program/i.test(f.name)) out[f.name] = programsTableId;
      }
    }
    return out;
  }, [intakeColumns, recruitmentSchema]);

  const { labelsForField } = useBobLinkedFieldLabels(
    schema,
    listRecords,
    intakeFieldNames,
    linkedLabelOverrides,
  );

  async function confirmDeleteRecruitment() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteBobRecruitment(deleteTarget.id);
      setDeleteTarget(null);
      await loadRecruitmentTable();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete record",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="mb-2 h-7 w-56" />
            <Skeleton className="h-4 w-full max-w-[520px]" />
          </div>
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <Skeleton className="mb-3 h-4 w-40" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !recruitment) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
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

  const totalRecords = recruitment?.total ?? 0;
  const rows = recruitment?.records ?? [];
  const catalogTotal = facets?.pipeline?.total;
  const isCatalogEmpty =
    catalogTotal === 0 && !facetsLoading && !initialLoading && !tableLoading;
  const hasActiveFilters =
    countDrawerRecruitmentFilters(debouncedFilters) > 0 ||
    debouncedFilters.search.trim().length > 0;
  const isFilterEmpty = totalRecords === 0 && !isCatalogEmpty;

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            Recruitment
          </h1>
          <p className="text-gray-600">
            {intakeTableMeta
              ? `Intake: ${intakeTableMeta.name} — key fields in the table below`
              : "Youth Apps & Intake — import or sync to load records"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/bob/recruitment/new"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            New record
          </Link>
          <Link
            href="/app/bob/roster/new"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            + Add student
          </Link>
        </div>
      </div>

      <BobImportProgress
        className="mb-6"
        label="recruitment"
        fetchStatus={getBobRecruitmentImportStatus}
        startImport={startBobRecruitmentImport}
        onComplete={refreshAfterImport}
      />

      <RecruitmentRecordsToolbar
        filters={filters}
        facets={facets}
        facetsLoading={facetsLoading}
        schema={schema}
        drawerOpen={filterDrawerOpen}
        onDrawerOpenChange={setFilterDrawerOpen}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        onApplyDrawerFilters={(drawer) =>
          setFilters((f) => ({ ...f, ...drawer }))
        }
        onClearDrawerFilters={() =>
          setFilters((f) => ({
            ...EMPTY_RECRUITMENT_FILTERS,
            search: f.search,
          }))
        }
      />

      {error && recruitment ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-4 text-xs text-gray-500">
        {tableLoading ? (
          <span className="text-gray-400">Updating records…</span>
        ) : (
          <>
            Showing{" "}
            <span className="font-medium text-gray-800">{rows.length}</span> of{" "}
            <span className="font-medium text-gray-800">{totalRecords}</span>{" "}
            matching records
          </>
        )}
        {intakeColumns.length > 0 && (
          <>
            {" · "}
            <span className="font-medium">{intakeColumns.length}</span> data
            columns
          </>
        )}
      </div>

      {isCatalogEmpty ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-800">
            No recruitment rows yet
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Import Youth Apps & Intake from Airtable, or create a new record.
            Set{" "}
            <code className="rounded bg-gray-200 px-1">
              BOB_AIRTABLE_YOUTH_APPS_TABLE
            </code>{" "}
            if the table is not auto-detected.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Use{" "}
            <span className="font-medium">
              Import recruitment from Airtable
            </span>{" "}
            above.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/app/bob/recruitment/new"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              New record
            </Link>
          </div>
        </div>
      ) : isFilterEmpty && !tableLoading ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-gray-800">
            No records match your filters
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Try clearing filters or broadening search.
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() =>
                setFilters((f) => ({
                  ...EMPTY_RECRUITMENT_FILTERS,
                  search: f.search,
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
          <ConfirmModal
            isOpen={Boolean(deleteTarget)}
            title="Delete recruitment record?"
            message={
              deleteTarget
                ? `Delete “${deleteTarget.label}”? This will also delete it in Airtable.`
                : ""
            }
            confirmText={deleting ? "Deleting…" : "Delete"}
            cancelText="Cancel"
            confirmButtonStyle="danger"
            onConfirm={() => void confirmDeleteRecruitment()}
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

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {tableLoading ? (
              <RecruitmentTableSkeleton
                rowCount={pageSize}
                dataColumnCount={Math.max(intakeColumns.length, 8)}
              />
            ) : rows.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No matching recruitment records.
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[200px]">
                        Pipeline
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[180px]">
                        Youth Works BoB &apos;26
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Students & Alums
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Programs
                      </th>
                      {intakeColumns.map((f) => (
                        <th
                          key={f.name}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[200px] truncate"
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
                    {rows.map((r) => {
                      const fields = (r.airtableFields || {}) as Record<
                        string,
                        unknown
                      >;
                      const name = r.label || "Untitled";
                      const initial = initialsOf(name);
                      const schoolLabels = labelsForField(
                        intakeColumns.find((c) => /school/i.test(c.name))
                          ?.name ?? "School",
                      );
                      const subtitle = pickRecordSubtitle(
                        fields,
                        r,
                        schoolLabels,
                      );
                      const yw = pickYouthWorksStatus(fields);
                      const programCount = Array.isArray(r.programRecordIds)
                        ? r.programRecordIds.length
                        : 0;
                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-orange-50/40 cursor-pointer transition-colors group"
                          onClick={() =>
                            router.push(`/app/bob/recruitment/${r.id}`)
                          }
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-orange-50/40 z-1">
                            <div className="flex items-center gap-3 min-w-[220px]">
                              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                                {initial}
                              </div>
                              <div className="min-w-0 flex-1">
                                <TruncatedWithTooltip
                                  text={name}
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
                          <td className="px-4 py-3 whitespace-nowrap align-top">
                            <RecruitmentRowPipeline record={r} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap align-top">
                            {yw ? (
                              <StatusBadge
                                label={yw.value}
                                variant="airtable"
                              />
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap align-top">
                            <TransferredBadge
                              transferred={Boolean(
                                r.studentsAlumsAirtableRecordId,
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap align-top">
                            <ProgramsBadge count={programCount} />
                          </td>
                          {intakeColumns.map((f) => (
                            <td
                              key={f.name}
                              className="px-4 py-3 align-top max-w-[280px]"
                            >
                              <IntakeTableCell
                                fieldName={f.name}
                                fieldType={f.type}
                                value={fields[f.name]}
                                linkedLabels={labelsForField(f.name)}
                              />
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right sticky right-0 bg-white shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/app/bob/recruitment/${r.id}`);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                                title="View"
                                aria-label="View"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/app/bob/recruitment/${r.id}?edit=1`,
                                  );
                                }}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-900"
                                title="Edit"
                                aria-label="Edit"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget({ id: r.id, label: name });
                                  setDeleteError(null);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                                title="Delete"
                                aria-label="Delete"
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m3-3h4a1 1 0 011 1v1H9V5a1 1 0 011-1z"
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

          {/* Pagination (match roster) */}
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
