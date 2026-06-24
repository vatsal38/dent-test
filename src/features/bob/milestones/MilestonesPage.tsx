"use client";

import { useMemo, useState } from "react";
import type { BobDeliverable } from "@/platform/api/bob/milestones";
import { BobImportProgress } from "@/components/BobImportProgress";
import {
  getBobDeliverablesImportStatus,
  startBobDeliverablesImport,
} from "@/platform/api/bob/deliverablesImport";
import {
  BOB_MILESTONES_ORG_ID,
  useBobMilestonesList,
  useUpdateBobMilestone,
} from "@/platform/query/hooks/useBobMilestones";
import { parseApiError } from "@/platform/api/errors";
import { Skeleton } from "@/components/Skeleton";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import {
  TRACK_FILTERS,
  APP_REVIEW_TO_TRACKER,
  TRACKER_TO_APP_REVIEW,
  formatDeliverableDates,
  reviewStatusBadge,
} from "./deliverableDisplay";
import {
  groupDeliverablesByTeam,
  groupDeliverablesByTrack,
  sortByDeliverableNumber,
} from "./deliverableGrouping";
import { DeliverablesProgressTable } from "./components/DeliverablesProgressTable";
import {
  DeliverablesTeamMatrix,
  DeliverablesTrackMatrix,
} from "./components/DeliverablesMatrixView";
import { DeliverableDetailDrawer } from "./components/DeliverableDetailDrawer";
import {
  findTrackerForTeam,
  teamNamesFromDeliverables,
  teamPendingUploadCount,
  teamReviewStatus,
} from "./deliverableTeamReview";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { useBobMe } from "@/platform/query/hooks/useBobMe";

type DetailState = {
  deliverable: BobDeliverable;
  teamName?: string;
};

export function MilestonesPage() {
  const orgId = BOB_MILESTONES_ORG_ID;
  const { access, can } = useBobAccess();
  const { data: me } = useBobMe();
  const studentTrack =
    access.role === "student" ? me?.linkedStudent?.track || "" : "";
  const [tab, setTab] = useState<"all" | "by_team" | "pending_review">(
    access.role === "student" ? "by_team" : "all",
  );
  const [trackFilter, setTrackFilter] = useState(studentTrack);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailSaveError, setDetailSaveError] = useState<string | null>(null);

  const milestonesQuery = useBobMilestonesList({
    orgId,
    tab: tab === "pending_review" ? "pending_review" : undefined,
    track: trackFilter || undefined,
  });
  const updateMilestone = useUpdateBobMilestone();
  const data = milestonesQuery.data?.data ?? [];
  const loading = milestonesQuery.isLoading;
  const error = milestonesQuery.error
    ? parseApiError(milestonesQuery.error)
    : null;

  const pendingCount = useMemo(() => {
    let count = 0;
    for (const d of data) {
      for (const team of teamNamesFromDeliverables([d])) {
        const status = teamReviewStatus(d, team);
        if (
          status === "pending_review" ||
          status === "in_progress" ||
          teamPendingUploadCount(d, team) > 0
        ) {
          count += 1;
        }
      }
    }
    return count;
  }, [data]);

  const groupedByTrack = useMemo(() => groupDeliverablesByTrack(data), [data]);

  const groupedByTeam = useMemo(() => groupDeliverablesByTeam(data), [data]);

  const reviewItems = useMemo(() => sortByDeliverableNumber(data), [data]);

  function openDetail(d: BobDeliverable, teamName?: string) {
    setDetailSaveError(null);
    setDetail({ deliverable: d, teamName });
  }

  function openTeamReview(teamName: string) {
    setTab("by_team");
    setDetail((current) =>
      current ? { deliverable: current.deliverable, teamName } : current,
    );
  }

  function applyOptimisticDeliverable(
    item: BobDeliverable,
    reviewStatus: string,
    trackerStatus?: string,
    teamName?: string,
  ): BobDeliverable {
    const trackerValue =
      trackerStatus ||
      (reviewStatus ? APP_REVIEW_TO_TRACKER[reviewStatus] : undefined);
    const reviewValue =
      reviewStatus ||
      (trackerStatus
        ? TRACKER_TO_APP_REVIEW[trackerStatus]
        : item.reviewStatus);
    const trackers = [...(item.trackerRecords || [])];
    const existingTracker = findTrackerForTeam(item, teamName);
    const trackerIdx = existingTracker
      ? trackers.findIndex(
          (t) =>
            t.id === existingTracker.id ||
            t.airtableRecordId === existingTracker.airtableRecordId,
        )
      : -1;

    if (trackerValue) {
      const nextRow =
        trackerIdx >= 0
          ? { ...trackers[trackerIdx] }
          : {
              id: "pending",
              airtableRecordId: "pending",
              date: null,
              deliverableStatus: null,
              reviewStatus: "pending_review",
              staffReviewNotes: null,
              projectDeliverable: null,
              amountEarned: null,
              uploads: [],
              teamNames: teamName ? [teamName] : [],
            };
      nextRow.deliverableStatus = trackerValue;
      nextRow.reviewStatus = TRACKER_TO_APP_REVIEW[trackerValue] || reviewValue;
      if (trackerIdx >= 0) trackers[trackerIdx] = nextRow;
      else trackers.unshift(nextRow);
    }

    return {
      ...item,
      reviewStatus: reviewValue || item.reviewStatus,
      trackerRecords: trackers,
    };
  }

  async function handleReviewChange(
    item: BobDeliverable,
    reviewStatus: string,
    trackerStatus?: string,
    teamName?: string,
  ) {
    const previous =
      detail?.deliverable.id === item.id ? detail.deliverable : item;
    const optimistic = applyOptimisticDeliverable(
      item,
      reviewStatus,
      trackerStatus,
      teamName,
    );
    const tracker = findTrackerForTeam(item, teamName);

    setUpdatingId(item.id);
    setDetailSaveError(null);
    if (detail?.deliverable.id === item.id) {
      setDetail({ deliverable: optimistic, teamName });
    }

    try {
      const updated = await updateMilestone.mutateAsync({
        orgId,
        milestoneId: item.id,
        data: {
          reviewStatus: reviewStatus || undefined,
          trackerDeliverableStatus: trackerStatus,
          trackerId: tracker?.id,
          teamName,
        },
      });
      if (detail?.deliverable.id === updated.id) {
        setDetail({ deliverable: updated, teamName });
      }
      await milestonesQuery.refetch();
    } catch (err) {
      if (detail?.deliverable.id === item.id) {
        setDetail({ deliverable: previous, teamName });
      }
      setDetailSaveError(parseApiError(err));
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const needsImport = milestonesQuery.data?.needsImport ?? data.length === 0;

  return (
    <div>
      <PageHeader
        eyebrow="Program operations"
        title="Deliverables"
        description="FY26 deliverable catalog by track — synced from Airtable. Coaches review team submissions in the tracker."
      />

      {error ? (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {can("settings.manage") ? (
        <BobImportProgress
          className="mb-6"
          label="deliverables"
          fetchStatus={getBobDeliverablesImportStatus}
          startImport={async () => {
            const result = await startBobDeliverablesImport();
            await milestonesQuery.refetch();
            return result;
          }}
          onComplete={() => void milestonesQuery.refetch()}
        />
      ) : null}

      {milestonesQuery.data?.syncedAt ? (
        <p className="text-xs text-gray-500 -mt-2 mb-4">
          Last synced {new Date(milestonesQuery.data.syncedAt).toLocaleString()}
        </p>
      ) : null}

      {data.length > 0 ? (
        <DeliverablesProgressTable deliverables={data} />
      ) : null}

      <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 pb-3">
        {access.role !== "student" ? (
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === "all"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-600"
            }`}
          >
            Catalog
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setTab("by_team")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "by_team"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-600"
          }`}
        >
          By Team
        </button>
        {can("milestones.edit") ? (
          <button
            type="button"
            onClick={() => setTab("pending_review")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 ${
              tab === "pending_review"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-600"
            }`}
          >
            Deliverables to Review
            {pendingCount > 0 ? (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800">
                {pendingCount}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>

      {access.role !== "student" ? (
        <div className="flex flex-wrap gap-2 mb-6">
          {TRACK_FILTERS.map((t) => (
            <button
              key={t.id || "all"}
              type="button"
              onClick={() => setTrackFilter(t.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                trackFilter === t.id
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : studentTrack ? (
        <p className="text-sm text-gray-600 mb-6">
          Your track:{" "}
          <span className="font-medium text-gray-900">
            {formatBobTrackDisplayLabel(studentTrack)}
          </span>
        </p>
      ) : null}

      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-gray-700 font-medium">
            {needsImport && !trackFilter && tab === "all"
              ? "No deliverables imported yet"
              : "No deliverables in this view"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {needsImport && !trackFilter && tab === "all"
              ? "Use Import deliverables from Airtable above to load the catalog."
              : "Import from Airtable or adjust track filters."}
          </p>
        </div>
      ) : tab === "all" ? (
        <DeliverablesTrackMatrix rows={groupedByTrack} onSelect={openDetail} />
      ) : tab === "by_team" ? (
        <DeliverablesTeamMatrix
          rows={groupedByTeam}
          onSelect={(d, teamName) => openDetail(d, teamName)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviewItems.flatMap((d) =>
            teamNamesFromDeliverables([d]).map((team) => {
              const review = reviewStatusBadge(teamReviewStatus(d, team));
              const uploads = teamPendingUploadCount(d, team);
              const status = teamReviewStatus(d, team);
              if (
                status !== "pending_review" &&
                status !== "in_progress" &&
                uploads === 0
              ) {
                return null;
              }
              return (
                <button
                  key={`${d.id}-${team}`}
                  type="button"
                  onClick={() => openDetail(d, team)}
                  className="text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-orange-700">
                        {formatBobTrackDisplayLabel(d.trackName)} ·{" "}
                        {d.deliverableNumber || "Deliverable"}
                      </p>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {d.deliverableName}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{team}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {formatDeliverableDates(d)}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${review.className}`}
                    >
                      {review.label}
                    </span>
                    {uploads > 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        {uploads} upload{uploads === 1 ? "" : "s"} to review
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            }),
          )}
        </div>
      )}

      {detail ? (
        <DeliverableDetailDrawer
          deliverable={detail.deliverable}
          teamName={detail.teamName}
          updatingId={updatingId}
          detailSaveError={detailSaveError}
          onClose={() => setDetail(null)}
          onReviewChange={handleReviewChange}
          onOpenTeamReview={openTeamReview}
        />
      ) : null}
    </div>
  );
}
