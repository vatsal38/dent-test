"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BobSubmissionStatus } from "@/platform/api/bob/submissions";
import { Drawer } from "@/components/Drawer";
import { Skeleton } from "@/components/Skeleton";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { SubmissionDetailPanel } from "@/features/bob/submissions/SubmissionDetailPanel";
import { BulkActionBar } from "@/features/bob/submissions/workflow/BulkActionBar";
import { KanbanBoard } from "@/features/bob/submissions/workflow/KanbanBoard";
import { SubmissionFilters } from "@/features/bob/submissions/workflow/SubmissionFilters";
import { SubmissionNotificationsStrip } from "@/features/bob/submissions/workflow/SubmissionNotificationsStrip";
import { ROUTING_HINTS } from "@/features/bob/submissions/workflow/constants";
import {
  filtersToListParams,
  filtersToSearchParams,
  parseFiltersFromSearchParams,
  type SubmissionFilterState,
} from "@/features/bob/submissions/workflow/filters";
import { useSubmissionKanban } from "@/features/bob/submissions/workflow/useSubmissionKanban";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
import { useBobStaffList } from "@/platform/query/hooks/useBobStaff";
import {
  useBobSubmissionFacets,
  useBobSubmissionsList,
  useBulkUpdateBobSubmissions,
  useMoveSubmissionStatus,
} from "@/platform/query/hooks/useBobSubmissions";

export function SubmissionsInboxPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedId = searchParams.get("id");
  const [filters, setFilters] = useState<SubmissionFilterState>(() =>
    parseFiltersFromSearchParams(searchParams),
  );
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [bulkIds, setBulkIds] = useState<Set<string>>(new Set());
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    setFilters(parseFiltersFromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 250);
    return () => clearTimeout(t);
  }, [filters.search]);

  const syncFiltersToUrl = useCallback(
    (next: SubmissionFilterState) => {
      const sp = filtersToSearchParams(next);
      if (selectedId) sp.set("id", selectedId);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, selectedId],
  );

  const handleFiltersChange = (next: SubmissionFilterState) => {
    setFilters(next);
    syncFiltersToUrl(next);
  };

  const { data: me } = useBobMe();
  const myId = me?.user?.id || null;
  const { access } = useBobAccess();
  const canViewPto =
    access.role === "admin" ||
    access.role === "program_manager" ||
    access.role === "site_supporter";
  const listParams = useMemo(
    () =>
      filtersToListParams(filters, debouncedSearch, myId, {
        excludePto: !canViewPto,
      }),
    [filters, debouncedSearch, myId, canViewPto],
  );

  const { data, isLoading, error, refetch } = useBobSubmissionsList(listParams);
  const { data: facets } = useBobSubmissionFacets({
    assignedTo: listParams.assignedTo,
    search: listParams.search,
    excludeArchived: listParams.excludeArchived,
    excludeTypes: listParams.excludeTypes,
  });
  const { data: staffData } = useBobStaffList();
  const items = data?.submissions ?? [];
  const columns = useSubmissionKanban(items, {
    archivedOnly: filters.archivedOnly,
    includeArchivedColumn: !filters.excludeArchived && !filters.archivedOnly,
  });
  const moveMutation = useMoveSubmissionStatus();
  const bulkMutation = useBulkUpdateBobSubmissions();

  const openId = (id: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("id", id);
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const closeDrawer = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("id");
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleMove = async (id: string, status: BobSubmissionStatus) => {
    setMovingId(id);
    try {
      await moveMutation.moveAsync(id, status);
    } finally {
      setMovingId(null);
    }
  };

  const toggleBulk = (id: string) => {
    setBulkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkIdsArr = Array.from(bulkIds);

  const handleBulkStatus = (status: BobSubmissionStatus) => {
    bulkMutation.mutate(
      { ids: bulkIdsArr, status },
      { onSuccess: () => setBulkIds(new Set()) },
    );
  };

  const handleBulkPriority = (priority: string) => {
    bulkMutation.mutate(
      { ids: bulkIdsArr, priority },
      { onSuccess: () => setBulkIds(new Set()) },
    );
  };

  const handleBulkAssign = (userId: string, label: string | null) => {
    bulkMutation.mutate(
      { ids: bulkIdsArr, assignedTo: userId, assignedToLabel: label },
      { onSuccess: () => setBulkIds(new Set()) },
    );
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <PageHeader
        eyebrow="Workflow engine"
        title="Submissions"
        description="Incidents and wellness checks by default. Check “All submission types” to include Blitz points."
        actions={
          <>
            <Link
              href="/app/bob/submit"
              className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
            >
              Open forms
            </Link>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium"
            >
              Refresh
            </button>
          </>
        }
      />

      {error ? (
        <p className="text-sm text-red-700 mb-4">
          {error instanceof Error ? error.message : "Failed to load"}
        </p>
      ) : null}

      <SubmissionNotificationsStrip onOpenSubmission={openId} />

      <details className="mb-3 text-xs text-gray-600">
        <summary className="cursor-pointer font-medium text-gray-700">
          Routing rules
        </summary>
        <ul className="mt-2 space-y-1 list-disc pl-5">
          {Object.entries(ROUTING_HINTS).map(([type, hint]) => (
            <li key={type}>
              <span className="font-medium">{type.replace(/_/g, " ")}:</span>{" "}
              {hint}
            </li>
          ))}
        </ul>
      </details>

      <SubmissionFilters
        filters={filters}
        onChange={handleFiltersChange}
        facets={facets}
      />

      <p className="text-xs text-gray-500 mb-2">
        {data?.total ?? items.length} submission
        {(data?.total ?? 0) === 1 ? "" : "s"} · drag cards between columns to
        change status
      </p>

      <div className="flex-1 min-h-0 overflow-x-auto">
        <KanbanBoard
          columns={columns}
          selectedId={selectedId}
          bulkIds={bulkIds}
          onOpen={openId}
          onToggleBulk={toggleBulk}
          onMove={handleMove}
          movingId={movingId}
        />
      </div>

      <BulkActionBar
        selectedCount={bulkIds.size}
        staff={staffData?.staff ?? []}
        onClear={() => setBulkIds(new Set())}
        onSetStatus={handleBulkStatus}
        onSetPriority={handleBulkPriority}
        onAssign={handleBulkAssign}
        onArchive={() => handleBulkStatus("archived")}
        busy={bulkMutation.isPending}
      />

      <Drawer open={Boolean(selectedId)} onClose={closeDrawer}>
        {selectedId ? (
          <SubmissionDetailPanel
            submissionId={selectedId}
            onClose={closeDrawer}
          />
        ) : null}
      </Drawer>
    </div>
  );
}
