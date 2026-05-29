"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BobRecruitmentListParams } from "@/platform/api/bob/recruitment";
import type { BobRosterSchemaField } from "@/platform/api/bob/shared";
import {
  getBobRecruitmentImportStatus,
  startBobRecruitmentImport,
} from "@/platform/api/bob/recruitment";
import { intakeDataTableColumns } from "@/lib/bobIntakeColumns";
import {
  IntakeTableCell,
  ProgramsBadge,
  RecruitmentRowPipeline,
  StatusBadge,
  TransferredBadge,
  pickYouthWorksStatus,
} from "@/components/bob/RecruitmentUi";
import { useBobLinkedFieldLabels } from "@/hooks/useBobLinkedFieldLabels";
import { TruncatedWithTooltip } from "@/components/TruncatedWithTooltip";
import {
  EMPTY_RECRUITMENT_FILTERS,
  RecruitmentRecordsToolbar,
} from "@/components/bob/RecruitmentTableFilters";
import {
  serializeFiltersForApi,
  type RecruitmentTableFilterState,
} from "@/lib/bobRecruitmentFilters";
import { Skeleton } from "@/components/Skeleton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { BobImportProgress } from "@/components/BobImportProgress";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { IntakeQueueTabs } from "@/features/bob/inbox/IntakeQueueTabs";
import { IntakeDetailDrawer } from "@/features/bob/inbox/IntakeDetailDrawer";
import { curatedInboxListColumns } from "@/features/bob/inbox/curatedListColumns";
import {
  getIntakeQueue,
  type IntakeQueueId,
} from "@/features/bob/inbox/queues";
import {
  initialsOf,
  pickRecordSubtitle,
} from "@/features/bob/inbox/recordDisplay";
import {
  useBobRecruitmentFacets,
  useBobRecruitmentList,
  useBobRecruitmentSchema,
  useDeleteBobRecruitment,
} from "@/platform/query/hooks/useBobRecruitmentList";
type NameSortOrder = "asc" | "desc";

function listParamsFromFilters(
  f: RecruitmentTableFilterState,
  queueParams: Partial<BobRecruitmentListParams>,
  page: number,
  pageSize: number,
  nameSort: NameSortOrder | null,
): BobRecruitmentListParams {
  const params: BobRecruitmentListParams = {
    ...queueParams,
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

export function IntakeInboxPage({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queueId = (searchParams.get("queue") || "all") as IntakeQueueId;
  const queue = getIntakeQueue(queueId);
  const selectedId = searchParams.get("id");

  const [filters, setFilters] = useState<RecruitmentTableFilterState>(
    EMPTY_RECRUITMENT_FILTERS,
  );
  const [debouncedFilters, setDebouncedFilters] =
    useState<RecruitmentTableFilterState>(EMPTY_RECRUITMENT_FILTERS);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [nameSort] = useState<NameSortOrder | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const deleteMutation = useDeleteBobRecruitment();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, nameSort, queueId]);

  const listParams = useMemo(
    () =>
      listParamsFromFilters(
        debouncedFilters,
        queue.listParams,
        page,
        pageSize,
        nameSort,
      ),
    [debouncedFilters, queue.listParams, page, pageSize, nameSort],
  );

  const {
    data: listData,
    isLoading: listLoading,
    isFetching: listFetching,
    error: listError,
    refetch: refetchList,
  } = useBobRecruitmentList(listParams);

  const { data: facets, isLoading: facetsLoading } = useBobRecruitmentFacets();
  const { data: recruitmentSchema } = useBobRecruitmentSchema();
  const schema = recruitmentSchema?.fields ?? null;

  const intakeTableColumns = useMemo(
    () => curatedInboxListColumns(schema, 3),
    [schema],
  );

  const linkedLabelFieldNames = useMemo(() => {
    const all = intakeDataTableColumns(schema);
    return all.map((f) => f.name);
  }, [schema]);

  const linkedLabelOverrides = useMemo(() => {
    const out: Record<string, string> = {};
    const programsTableId = recruitmentSchema?.programsTable?.id || "";
    if (programsTableId) {
      for (const f of intakeTableColumns) {
        if (/program/i.test(f.name)) out[f.name] = programsTableId;
      }
    }
    return out;
  }, [intakeTableColumns, recruitmentSchema]);

  const { labelsForField } = useBobLinkedFieldLabels(
    schema,
    listData?.records ?? [],
    linkedLabelFieldNames,
    linkedLabelOverrides,
  );

  const updateUrl = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(searchParams.toString());
      mutate(sp);
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  function setQueue(next: IntakeQueueId) {
    updateUrl((sp) => {
      sp.set("queue", next);
      sp.delete("id");
    });
  }

  function openRecord(id: string) {
    updateUrl((sp) => {
      sp.set("id", id);
    });
  }

  function closeDrawer() {
    updateUrl((sp) => {
      sp.delete("id");
    });
  }

  const totalRecords = listData?.total ?? 0;
  const rows = listData?.records ?? [];
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageItems = buildPageItems(totalPages, currentPage);
  const tableLoading = listLoading || listFetching;

  const catalogTotal = facets?.pipeline?.total;
  const isCatalogEmpty =
    catalogTotal === 0 && !facetsLoading && !listLoading;
  const isFilterEmpty = totalRecords === 0 && !isCatalogEmpty;

  const intakeTableMeta = recruitmentSchema?.intakeTable ?? recruitmentSchema?.table;

  if (listLoading && !listData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full max-w-3xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      {!embedded ? (
        <PageHeader
          eyebrow="Intake inbox"
          title="Applications & pipeline"
          description={
            intakeTableMeta
              ? `${intakeTableMeta.name} — review, transfer, and approve youth applications`
              : "Youth Apps & Intake — sync from Airtable to begin"
          }
          actions={
            <>
              <Link
                href="/app/bob/recruitment/new"
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                New record
              </Link>
              <button
                type="button"
                onClick={() => refetchList()}
                disabled={tableLoading}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Refresh
              </button>
            </>
          }
        />
      ) : null}

      <div className="mb-6">
        <IntakeQueueTabs
          active={queue.id}
          facets={facets ?? null}
          onChange={setQueue}
        />
        <p className="mt-2 text-xs text-gray-500">{queue.description}</p>
      </div>

      <BobImportProgress
        className="mb-6"
        label="recruitment"
        fetchStatus={getBobRecruitmentImportStatus}
        startImport={startBobRecruitmentImport}
        onComplete={() => refetchList()}
        compact
      />

      <RecruitmentRecordsToolbar
        filters={filters}
        facets={facets ?? null}
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

      {listError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {listError instanceof Error ? listError.message : "Failed to load"}
        </div>
      ) : null}

      <div className="mb-4 text-xs text-gray-500">
        {tableLoading ? (
          <span className="text-gray-400">Updating…</span>
        ) : (
          <>
            Showing{" "}
            <span className="font-medium text-gray-800">{rows.length}</span> of{" "}
            <span className="font-medium text-gray-800">{totalRecords}</span> in
            this queue
          </>
        )}
      </div>

      {isCatalogEmpty ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-800">No intake rows yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Import from Airtable or create a new record.
          </p>
        </div>
      ) : isFilterEmpty && !tableLoading ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-gray-800">
            No records in this queue
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Try another queue or clear filters.
          </p>
        </div>
      ) : (
        <>
          <ConfirmModal
            isOpen={Boolean(deleteTarget)}
            title="Delete intake record?"
            message={
              deleteTarget
                ? `Delete “${deleteTarget.label}”? This removes the row from Airtable when configured.`
                : ""
            }
            confirmText={deleteMutation.isPending ? "Deleting…" : "Delete"}
            cancelText="Cancel"
            confirmButtonStyle="danger"
            onConfirm={async () => {
              if (!deleteTarget) return;
              try {
                await deleteMutation.mutateAsync(deleteTarget.id);
                setDeleteTarget(null);
                if (selectedId === deleteTarget.id) closeDrawer();
              } catch {
                /* toast later */
              }
            }}
            onCancel={() => {
              if (!deleteMutation.isPending) setDeleteTarget(null);
            }}
          />

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {tableLoading && rows.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No matching records.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left sticky left-0 bg-gray-50 z-10 min-w-[200px] text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        Pipeline
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                        YW &apos;26
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        S&A
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Programs
                      </th>
                      {intakeTableColumns.map((f: BobRosterSchemaField) => (
                        <th
                          key={f.name}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase max-w-[160px] truncate"
                        >
                          {f.name}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-10">
                        ···
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((r) => {
                      const fields = (r.airtableFields || {}) as Record<
                        string,
                        unknown
                      >;
                      const name = r.label || "Untitled";
                      const selected = selectedId === r.id;
                      const schoolLabels = labelsForField(
                        intakeTableColumns.find((c) => /school/i.test(c.name))
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
                          className={`cursor-pointer transition-colors ${
                            selected
                              ? "bg-orange-50"
                              : "hover:bg-orange-50/50"
                          }`}
                          onClick={() => openRecord(r.id)}
                        >
                          <td className="px-4 py-3 sticky left-0 bg-inherit z-1">
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center text-xs font-semibold">
                                {initialsOf(name)}
                              </div>
                              <div className="min-w-0">
                                <TruncatedWithTooltip
                                  text={name}
                                  className="text-sm font-semibold text-gray-900"
                                  maxWidthClass="max-w-[180px]"
                                />
                                <TruncatedWithTooltip
                                  text={subtitle}
                                  className="text-xs text-gray-500"
                                  maxWidthClass="max-w-[180px]"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <RecruitmentRowPipeline record={r} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {yw ? (
                              <StatusBadge label={yw.value} variant="airtable" />
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <TransferredBadge
                              transferred={Boolean(
                                r.studentsAlumsAirtableRecordId,
                              )}
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <ProgramsBadge count={programCount} />
                          </td>
                          {intakeTableColumns.map((f) => (
                            <td key={f.name} className="px-4 py-3 max-w-[200px]">
                              <IntakeTableCell
                                fieldName={f.name}
                                fieldType={f.type}
                                value={fields[f.name]}
                                linkedLabels={labelsForField(f.name)}
                              />
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right sticky right-0 bg-inherit">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({ id: r.id, label: name });
                              }}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Delete
                            </button>
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
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || tableLoading}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm disabled:opacity-50"
              >
                Prev
              </button>
              {pageItems.map((it, idx) =>
                it === "…" ? (
                  <span key={`e-${idx}`} className="px-2 text-sm text-gray-500">
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
                        : "border-gray-300"
                    }`}
                  >
                    {it}
                  </button>
                ),
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || tableLoading}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <IntakeDetailDrawer
        recordId={selectedId}
        open={Boolean(selectedId)}
        onClose={closeDrawer}
        onRecordUpdated={() => refetchList()}
      />
    </div>
  );
}
