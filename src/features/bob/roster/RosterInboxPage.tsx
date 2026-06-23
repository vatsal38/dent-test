"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { BobStudentsListParams } from "@/platform/api/bob/students";
import {
  getBobRosterImportStatus,
  startBobRosterImport,
} from "@/platform/api/bob";
import {
  HeadshotCell,
  IntakeTableCell,
  StatusBadge,
} from "@/components/bob/RecruitmentUi";
import { extractAirtableAttachments } from "@/lib/bobAirtableDisplay";
import { formatBobFieldDisplayName } from "@/lib/bobDisplayTerminology";
import { useBobLinkedFieldLabels } from "@/hooks/useBobLinkedFieldLabels";
import { TruncatedWithTooltip } from "@/components/TruncatedWithTooltip";
import {
  EMPTY_ROSTER_FILTERS,
  RosterRecordsToolbar,
} from "@/components/bob/RosterTableFilters";
import {
  serializeFiltersForApi,
  type RosterTableFilterState,
} from "@/lib/bobRosterFilters";
import { RosterPageSkeleton } from "@/features/bob/roster/RosterPageSkeleton";
import { BobImportProgress } from "@/components/BobImportProgress";
import { ConfirmModal } from "@/components/ConfirmModal";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { RosterQueueTabs } from "@/features/bob/roster/RosterQueueTabs";
import { RosterGridView } from "@/features/bob/roster/RosterGridView";
import { useStudentDrawerUrl } from "@/features/bob/student-drawer";
import { curatedRosterListColumns } from "@/features/bob/roster/curatedListColumns";
import { getRosterQueue, type RosterQueueId } from "@/features/bob/roster/queues";
import {
  contractStatusLabel,
  preSurveyLabel,
  ywRegistrationLabel,
} from "@/features/bob/onboarding/statusLabels";
import {
  initialsOf,
  studentDisplayName,
} from "@/features/bob/roster/recordDisplay";
import { OnboardingStatusChips } from "@/features/bob/onboarding/OnboardingStatusChips";
import {
  useBobRosterSchema,
  useBobStudentsFacets,
  useBobStudentsList,
  useDeleteBobStudent,
} from "@/platform/query/hooks/useBobStudents";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { ScopedEmptyState } from "@/platform/rbac/ScopedEmptyState";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  graduated: "Graduated",
  withdrawn: "Withdrawn",
};

const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  placed: "Placed",
  not_placed: "Not placed",
};

function listParams(
  f: RosterTableFilterState,
  queueParams: Partial<BobStudentsListParams>,
  page: number,
  pageSize: number,
  trackFilter?: string | null,
): BobStudentsListParams {
  const params: BobStudentsListParams = {
    ...queueParams,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    includeAirtableFields: true,
    includeStats: true,
  };
  const q = f.search.trim();
  if (q) params.search = q;
  const track = String(queueParams.track || trackFilter || "").trim();
  if (track) params.track = track;
  const filtersJson = serializeFiltersForApi(f);
  if (filtersJson) params.filters = filtersJson;
  return params;
}

function buildPageItems(
  total: number,
  current: number,
): (number | "…")[] {
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

export function RosterInboxPage({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queueId = (searchParams.get("queue") || "bob_cohort") as RosterQueueId;
  const queue = getRosterQueue(queueId);
  const { openStudent } = useStudentDrawerUrl();
  const selectedId = searchParams.get("id") ?? searchParams.get("student");
  const trackFilter = searchParams.get("track") ?? "";
  const view = (searchParams.get("view") || "grid") as "grid" | "table";

  const [filters, setFilters] = useState<RosterTableFilterState>(EMPTY_ROSTER_FILTERS);
  const [debouncedFilters, setDebouncedFilters] =
    useState<RosterTableFilterState>(EMPTY_ROSTER_FILTERS);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(
    null,
  );
  const deleteMutation = useDeleteBobStudent();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 300);
    return () => clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, queueId, trackFilter]);

  const listParamsMemo = useMemo(
    () =>
      listParams(debouncedFilters, queue.listParams, page, pageSize, trackFilter),
    [debouncedFilters, queue.listParams, page, pageSize, trackFilter],
  );

  const {
    data: listData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useBobStudentsList(listParamsMemo);
  const { data: facets, isLoading: facetsLoading } = useBobStudentsFacets();
  const { access, isScoped } = useBobAccess();
  const { data: schemaRes } = useBobRosterSchema();
  const schema = schemaRes?.fields ?? null;

  const { headshot, columns } = useMemo(
    () => curatedRosterListColumns(schema),
    [schema],
  );

  const linkedFieldNames = useMemo(() => {
    const fromSchema =
      (schema || [])
        .filter((f) => f?.type === "multipleRecordLinks" && f?.name)
        .map((f) => f.name) ?? [];
    return Array.from(new Set([...fromSchema, ...columns.map((c) => c.name)]));
  }, [schema, columns]);

  const { labelsForField } = useBobLinkedFieldLabels(
    schema,
    listData?.students ?? [],
    linkedFieldNames,
  );

  const updateUrl = (mutate: (sp: URLSearchParams) => void) => {
    const sp = new URLSearchParams(searchParams.toString());
    mutate(sp);
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const exportCsv = () => {
    const headers = [
      "id",
      "firstName",
      "lastName",
      "email",
      "phone",
      "status",
      "interviewStage",
      "school",
      "track",
      "coach",
      "podId",
      "contractStatus",
      "ywRegistration",
      "preSurvey",
      "readyForProgram",
      "attendancePresent",
      "attendanceAbsent",
      "deliverablesSubmitted",
      "deliverablesTotal",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      const needs = /[",\n]/.test(s);
      const out = s.replace(/"/g, '""');
      return needs ? `"${out}"` : out;
    };
    const lines = [
      headers.join(","),
      ...rows.map((s) => {
        const a = s.attendanceStats || {};
        const m = s.milestoneStats || {};
        const ob = s.onboardingStatus;
        const vals = [
          s.id,
          s.firstName,
          s.lastName,
          s.email ?? "",
          s.phone ?? "",
          s.status,
          s.interviewStage,
          s.school ?? "",
          s.track ?? "",
          s.coach ?? "",
          s.podId ?? "",
          ob ? contractStatusLabel(ob.contract.phase) : "",
          ob ? ywRegistrationLabel(ob.ywRegistration) : "",
          ob ? preSurveyLabel(ob.preSurvey) : "",
          ob?.readyForProgram ? "yes" : ob ? "no" : "",
          (a as { present?: number }).present ?? "",
          (a as { absent?: number }).absent ?? "",
          (m as { submitted?: number }).submitted ?? "",
          (m as { total?: number }).total ?? "",
        ];
        return vals.map(esc).join(",");
      }),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const rows = listData?.students ?? [];
  const total = listData?.total ?? 0;
  const totalForPagination = listData?.total ?? 0;
  const loading = isLoading || isFetching;
  const totalPages = Math.max(1, Math.ceil(totalForPagination / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageItems = buildPageItems(totalPages, currentPage);
  const tableLoading = loading;
  const filtersActive =
    Boolean(debouncedFilters.search.trim()) ||
    (debouncedFilters.conditions?.length ?? 0) > 0 ||
    Boolean(trackFilter);
  const scopedRosterEmpty =
    isScoped && rows.length === 0 && !loading && !filtersActive && !error;

  if (isLoading && !listData) {
    return (
      <RosterPageSkeleton embedded={embedded} view={view === "table" ? "table" : "grid"} />
    );
  }

  return (
    <div>
      {!embedded ? (
        <PageHeader
          eyebrow="Operational roster"
          title="Students"
          description="Active youth on program — attendance, deliverables, and track assignments."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportCsv}
                disabled={loading}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => startBobRosterImport()}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Import from Airtable
              </button>
              <Link
                href="/app/bob/roster/new"
                className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
              >
                Add student
              </Link>
            </div>
          }
        />
      ) : null}

      {trackFilter ? (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900 flex items-center justify-between gap-2">
          <span>Track: {trackFilter}</span>
          <button
            type="button"
            onClick={() =>
              updateUrl((sp) => {
                sp.delete("track");
              })
            }
            className="text-orange-700 font-medium hover:underline"
          >
            Clear track filter
          </button>
        </div>
      ) : null}

      <div className="mb-6">
        <RosterQueueTabs
          active={queue.id}
          facets={facets ?? null}
          onChange={(q) =>
            updateUrl((sp) => {
              sp.set("queue", q);
              sp.delete("track");
              sp.delete("id");
              sp.delete("tab");
              sp.delete("student");
            })
          }
        />
        <p className="mt-2 text-xs text-gray-500">{queue.description}</p>
      </div>

      <BobImportProgress
        className="mb-6"
        label="roster"
        fetchStatus={getBobRosterImportStatus}
        startImport={startBobRosterImport}
        onComplete={() => refetch()}
        compact
      />

      <RosterRecordsToolbar
        filters={filters}
        facets={facets ?? null}
        facetsLoading={facetsLoading}
        schema={schema}
        trackFilter={trackFilter}
        onTrackFilterChange={(track) =>
          updateUrl((sp) => {
            if (track) sp.set("track", track);
            else sp.delete("track");
          })
        }
        drawerOpen={filterDrawerOpen}
        onDrawerOpenChange={setFilterDrawerOpen}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        onApplyDrawerFilters={(drawer) => setFilters((f) => ({ ...f, ...drawer }))}
        onClearDrawerFilters={() =>
          setFilters((f) => ({ ...EMPTY_ROSTER_FILTERS, search: f.search }))
        }
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {loading ? "Updating…" : `${rows.length} of ${total} students`}
        </p>
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
          <button
            type="button"
            onClick={() =>
              updateUrl((sp) => {
                sp.set("view", "grid");
              })
            }
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              view === "grid" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
            }`}
            aria-pressed={view === "grid"}
          >
            Gallery
          </button>
          <button
            type="button"
            onClick={() =>
              updateUrl((sp) => {
                sp.set("view", "table");
              })
            }
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              view === "table" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
            }`}
            aria-pressed={view === "table"}
          >
            List
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-700 mb-4">
          {error instanceof Error ? error.message : "Failed to load"}
        </p>
      ) : null}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Remove student?"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.name}? This may remove linked Airtable rows.`
            : ""
        }
        confirmText={deleteMutation.isPending ? "Deleting…" : "Delete"}
        confirmButtonStyle="danger"
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteMutation.mutateAsync(deleteTarget.id);
          setDeleteTarget(null);
          if (selectedId === deleteTarget.id) {
            updateUrl((sp) => sp.delete("id"));
          }
        }}
        onCancel={() => !deleteMutation.isPending && setDeleteTarget(null)}
      />

      {view === "grid" ? (
        scopedRosterEmpty ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50">
            <ScopedEmptyState access={access} resource="students" />
          </div>
        ) : rows.length === 0 && !loading ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-gray-800">No students in this queue</p>
            <p className="mt-2 text-sm text-gray-500">Try another queue or clear filters.</p>
          </div>
        ) : (
          <RosterGridView
            students={rows}
            headshot={headshot}
            columns={columns}
            labelsForField={labelsForField}
            onOpenStudent={openStudent}
          />
        )
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headshot ? (
                    <th className="px-3 py-3 w-14" aria-label="Photo" />
                  ) : null}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                    Onboarding
                  </th>
                  {columns.map((f) => (
                    <th
                      key={f.name}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase max-w-[140px] truncate"
                    >
                      {formatBobFieldDisplayName(f.name)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase sticky right-0 bg-gray-50">
                    ···
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((s) => {
                  const fields = (s.airtableFields || {}) as Record<string, unknown>;
                  const name = studentDisplayName(s);
                  const selected = selectedId === s.id;
                  const attachments = headshot
                    ? extractAirtableAttachments(fields[headshot.name])
                    : [];

                  return (
                    <tr
                      key={s.id}
                      className={`cursor-pointer ${selected ? "bg-orange-50" : "hover:bg-orange-50/40"}`}
                      onClick={() => openStudent(s.id)}
                    >
                      {headshot ? (
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <HeadshotCell attachments={attachments} />
                        </td>
                      ) : null}
                    <td className="px-4 py-3 sticky left-0 bg-inherit z-1">
                        <div className="flex items-center gap-2 min-w-[200px]">
                          <span className="w-8 h-8 rounded-lg bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                            {initialsOf(name)}
                          </span>
                          <TruncatedWithTooltip
                            text={name}
                            className="text-sm font-semibold text-gray-900"
                            maxWidthClass="max-w-[160px]"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge
                          label={STATUS_LABELS[s.status] || s.status}
                          variant="app"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge
                          label={STAGE_LABELS[s.interviewStage] || s.interviewStage}
                          variant="airtable"
                        />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <OnboardingStatusChips
                          status={s.onboardingStatus}
                          compact
                        />
                      </td>
                      {columns.map((f) => (
                        <td key={f.name} className="px-4 py-3 max-w-[180px]">
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
                          className="text-xs text-red-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ id: s.id, name });
                          }}
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
          {scopedRosterEmpty ? (
            <ScopedEmptyState access={access} resource="students" />
          ) : rows.length === 0 && !loading ? (
            <p className="p-8 text-center text-sm text-gray-500">No students in this queue.</p>
          ) : null}
        </div>
      )}

      {totalForPagination > 0 ? (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() =>
                setPage((p) => Math.max(1, p - 1))
              }
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
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage >= totalPages || tableLoading}
              className="px-3 py-1.5 rounded-md border border-gray-300 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

    </div>
  );
}
