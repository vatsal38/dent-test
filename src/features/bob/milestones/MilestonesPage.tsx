"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  groupDeliverablesByTrack,
  deliverablesToTeamSlotMap,
  deliverableAppliesToTeamWithTrack,
} from "./deliverableGrouping";
import { DeliverablesProgressTable } from "./components/DeliverablesProgressTable";
import {
  DeliverablesTeamMatrix,
  DeliverablesTrackMatrix,
} from "./components/DeliverablesMatrixView";
import { DeliverableDetailDrawer } from "./components/DeliverableDetailDrawer";
import {
  findTrackerForTeam,
  teamPendingUploadCount,
  teamReviewStatus,
  teamNameMatchesFilter,
  countTeamDeliverablesNeedingReview,
  listTeamDeliverablesNeedingReview,
  shortProjectTeamName,
} from "./deliverableTeamReview";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
import { useBobProjectTeamsList, useMyBobProjectTeams } from "@/platform/query/hooks/useBobProjectTeams";
import { useBobSubmissionsList } from "@/platform/query/hooks/useBobSubmissions";
import type { BobStudent } from "@/platform/api/bob/students";
import {
  filterDeliverablesForStudent,
  studentProjectTeamNames,
} from "./deliverableStudentScope";

type DetailState = {
  deliverable: BobDeliverable;
  teamName?: string;
};

export function MilestonesPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab");
  const teamFilterParam = searchParams?.get("team") || "";
  const deliverableIdParam =
    searchParams?.get("deliverableId") || searchParams?.get("id") || "";
  const orgId = BOB_MILESTONES_ORG_ID;
  const { access, can } = useBobAccess();
  const { data: me } = useBobMe();
  const defaultReviewerName =
    me?.user?.name?.trim() || me?.user?.email?.trim() || "";
  const studentTrack = useMemo(() => {
    if (access.role !== "student") return "";
    const raw = me?.linkedStudent?.track || "";
    return raw ? formatBobTrackDisplayLabel(raw) : "";
  }, [access.role, me?.linkedStudent?.track]);

  const linkedStudent = useMemo((): BobStudent | null => {
    if (access.role !== "student" || !me?.linkedStudent?.id) return null;
    const ls = me.linkedStudent;
    return {
      id: ls.id,
      firstName: ls.firstName || "",
      lastName: ls.lastName || "",
      preferredName: ls.preferredName || null,
      email: null,
      phone: null,
      status: "active",
      interviewStage: "placed",
      podId: ls.podId ?? null,
      track: ls.track ?? null,
      airtableRecordId: ls.airtableRecordId ?? null,
      createdAt: "",
      updatedAt: "",
    };
  }, [access.role, me?.linkedStudent]);
  const [tab, setTab] = useState<"all" | "by_team" | "pending_review">(() => {
    if (teamFilterParam) return "by_team";
    if (initialTab === "by_team" || initialTab === "pending_review") {
      return initialTab;
    }
    return access.role === "student" ? "by_team" : "all";
  });
  const [selectedTeam, setSelectedTeam] = useState(teamFilterParam);
  const [trackFilter, setTrackFilter] = useState(studentTrack);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailSaveError, setDetailSaveError] = useState<string | null>(null);

  // Always fetch the full catalog. Track chips filter Catalog/By Team client-side;
  // Deliverables to Review always uses the unscoped list (so coaches see Denternship
  // items even when browsing Made@Dent).
  const milestonesQuery = useBobMilestonesList({ orgId });
  const isStudent = access.role === "student";
  const projectTeamsQuery = useBobProjectTeamsList(undefined, {
    enabled: !isStudent,
  });
  const myProjectTeamsQuery = useMyBobProjectTeams(isStudent);
  const projectTeams = isStudent
    ? (myProjectTeamsQuery.data?.data ?? [])
    : (projectTeamsQuery.data?.data ?? []);
  const updateMilestone = useUpdateBobMilestone();
  const progressSubmissionsQuery = useBobSubmissionsList({
    type: "progress_update",
    excludeArchived: true,
    limit: 300,
  });
  /** Keys: `${deliverableId}|${shortTeamName}` for open weekly progress awaiting staff look. */
  const progressReviewKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const s of progressSubmissionsQuery.data?.submissions || []) {
      if (!s.deliverableId) continue;
      if (s.status === "done" || s.status === "archived") continue;
      const team = shortProjectTeamName(s.teamName || s.team || "");
      if (team) keys.add(`${s.deliverableId}|${team}`);
    }
    return keys;
  }, [progressSubmissionsQuery.data?.submissions]);

  const rawData = milestonesQuery.data?.data ?? [];
  const scopedData = useMemo(() => {
    let rows = rawData;
    // Students only see deliverables for their project teams / track.
    // Coaches and site supporters always keep the full catalog — never filter by
    // pod name ≈ track (that hid Denternship items for Demo Coach).
    if (linkedStudent) {
      rows = filterDeliverablesForStudent(rows, linkedStudent, projectTeams);
    }
    return rows;
  }, [rawData, linkedStudent, projectTeams]);
  /** Track chip filters Catalog / progress table only — not Deliverables to Review. */
  const data = useMemo(() => {
    if (!trackFilter) return scopedData;
    const needle = formatBobTrackDisplayLabel(trackFilter).toLowerCase();
    return scopedData.filter((d) => {
      const track = formatBobTrackDisplayLabel(d.trackName || "").toLowerCase();
      return track.includes(needle) || needle.includes(track);
    });
  }, [scopedData, trackFilter]);
  const reviewData = scopedData;
  const loading = milestonesQuery.isLoading;
  const error = milestonesQuery.error
    ? parseApiError(milestonesQuery.error)
    : null;

  const teamsReady = isStudent
    ? !myProjectTeamsQuery.isLoading
    : !projectTeamsQuery.isLoading;

  const allowedTeamNames = useMemo(
    () => projectTeams.map((t) => t.name).filter(Boolean),
    [projectTeams],
  );

  const pendingCount = useMemo(() => {
    if (!teamsReady) return 0;
    return countTeamDeliverablesNeedingReview(
      reviewData,
      allowedTeamNames,
      progressReviewKeys,
      projectTeams,
    );
  }, [
    reviewData,
    allowedTeamNames,
    teamsReady,
    progressReviewKeys,
    projectTeams,
  ]);

  const groupedByTrack = useMemo(() => groupDeliverablesByTrack(data), [data]);

  const groupedByTeam = useMemo(() => {
    // 100B — only BoB '26 Project Teams (synced allowlist), not stale tracker teams
    if (!teamsReady) return [];
    if (projectTeams.length) {
      let teams = linkedStudent
        ? projectTeams.filter(
            (team) => studentProjectTeamNames(linkedStudent, [team]).length > 0,
          )
        : projectTeams;
      let grouped = teams.map((team) => ({
        teamName: team.name,
        items: data.filter((d) =>
          deliverableAppliesToTeamWithTrack(d, team.name, team.trackLabel),
        ),
        slots: deliverablesToTeamSlotMap(team.name, data, team.trackLabel),
      }));
      if (selectedTeam) {
        grouped = grouped.filter((row) =>
          teamNameMatchesFilter(row.teamName, selectedTeam),
        );
      }
      return grouped;
    }
    return [];
  }, [data, selectedTeam, projectTeams, linkedStudent, teamsReady]);

  const pendingReviewItems = useMemo(() => {
    if (!teamsReady) return [];
    return listTeamDeliverablesNeedingReview(
      reviewData,
      allowedTeamNames,
      progressReviewKeys,
      projectTeams,
    );
  }, [
    reviewData,
    allowedTeamNames,
    teamsReady,
    progressReviewKeys,
    projectTeams,
  ]);

  // Deep-link: /app/bob/deliverables?deliverableId=…&team=…&tab=by_team
  // (also accepts legacy ?id= for deliverable — student drawer excludes this route)
  const lastDeepLinkKey = useRef("");
  useEffect(() => {
    if (!deliverableIdParam || !reviewData.length) return;
    const key = `${deliverableIdParam}|${teamFilterParam}`;
    if (lastDeepLinkKey.current === key) return;
    const match = reviewData.find((d) => d.id === deliverableIdParam);
    if (!match) return;
    lastDeepLinkKey.current = key;
    setDetailSaveError(null);
    setDetail({
      deliverable: match,
      teamName: teamFilterParam || undefined,
    });
    if (teamFilterParam) {
      setTab("by_team");
      setSelectedTeam(teamFilterParam);
    } else if (initialTab === "by_team" || initialTab === "pending_review") {
      setTab(initialTab);
    }
  }, [deliverableIdParam, reviewData, teamFilterParam, initialTab]);

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
    reviewedBy?: string,
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
              reviewStatus: "not_started",
              staffReviewNotes: null,
              projectDeliverable: null,
              amountEarned: null,
              uploads: [],
              teamNames: teamName ? [teamName] : [],
            };
      nextRow.deliverableStatus = trackerValue;
      nextRow.reviewStatus = TRACKER_TO_APP_REVIEW[trackerValue] || reviewValue;
      if (reviewedBy) {
        nextRow.reviewedBy = reviewedBy;
        nextRow.reviewedAt = new Date().toISOString();
      }
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
    reviewedByName?: string,
  ) {
    const previous =
      detail?.deliverable.id === item.id ? detail.deliverable : item;
    const reviewer =
      String(reviewedByName || defaultReviewerName || "").trim() || undefined;
    const optimistic = applyOptimisticDeliverable(
      item,
      reviewStatus,
      trackerStatus,
      teamName,
      reviewer,
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
          reviewedBy: reviewer,
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

  async function handleSaveStaffReview(
    item: BobDeliverable,
    payload: {
      staffReviewNotes: string;
      reviewedBy: string;
      teamName?: string;
    },
  ) {
    const previous =
      detail?.deliverable.id === item.id ? detail.deliverable : item;
    const tracker = findTrackerForTeam(item, payload.teamName);

    setUpdatingId(item.id);
    setDetailSaveError(null);

    try {
      const updated = await updateMilestone.mutateAsync({
        orgId,
        milestoneId: item.id,
        data: {
          staffReviewNotes: payload.staffReviewNotes,
          reviewedBy: payload.reviewedBy || undefined,
          trackerId: tracker?.id,
          teamName: payload.teamName,
        },
      });
      if (detail?.deliverable.id === updated.id) {
        setDetail({ deliverable: updated, teamName: payload.teamName });
      }
      await milestonesQuery.refetch();
    } catch (err) {
      if (detail?.deliverable.id === item.id) {
        setDetail({ deliverable: previous, teamName: payload.teamName });
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
        description="FY26 deliverable catalog by track — synced from Airtable. By Team and Deliverables to review only show BoB '26 Project Teams. Weekly progress submissions appear on each team deliverable."
        actions={
          <Link
            href="/app/bob/progress-update"
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
          >
            Weekly progress update
          </Link>
        }
      />

      {selectedTeam ? (
        <p className="text-sm text-gray-600 mb-4 -mt-2">
          Showing deliverables for{" "}
          <span className="font-medium text-gray-900">{selectedTeam}</span>
          {" · "}
          <button
            type="button"
            onClick={() => setSelectedTeam("")}
            className="text-orange-600 hover:underline"
          >
            Clear filter
          </button>
        </p>
      ) : null}

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
      ) : tab === "pending_review" && pendingReviewItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-gray-700 font-medium">Nothing to review</p>
          <p className="text-sm text-gray-500 mt-1">
            No team deliverables are waiting for staff review in this track.
          </p>
        </div>
      ) : tab === "pending_review" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingReviewItems.map(({ deliverable: d, teamName: team }) => {
            const review = reviewStatusBadge(teamReviewStatus(d, team));
            const uploads = teamPendingUploadCount(d, team);
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
          })}
        </div>
      ) : null}

      {detail ? (
        <DeliverableDetailDrawer
          deliverable={detail.deliverable}
          teamName={detail.teamName}
          allowedTeamNames={allowedTeamNames}
          updatingId={updatingId}
          detailSaveError={detailSaveError}
          defaultReviewerName={defaultReviewerName}
          onClose={() => setDetail(null)}
          onReviewChange={handleReviewChange}
          onSaveStaffReview={handleSaveStaffReview}
          onOpenTeamReview={openTeamReview}
        />
      ) : null}
    </div>
  );
}
