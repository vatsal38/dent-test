'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { BobDeliverable } from '@/platform/api/bob/milestones';
import { BobImportProgress } from '@/components/BobImportProgress';
import {
  getBobDeliverablesImportStatus,
  startBobDeliverablesImport,
} from '@/platform/api/bob/deliverablesImport';
import {
  BOB_MILESTONES_ORG_ID,
  useBobMilestonesList,
  useUpdateBobMilestone,
} from '@/platform/query/hooks/useBobMilestones';
import { parseApiError } from '@/platform/api/errors';
import { Skeleton } from '@/components/Skeleton';
import { PageHeader } from '@/design-system/patterns/PageHeader';
import {
  TRACK_FILTERS,
  REVIEW_STATUS_OPTIONS,
  TRACKER_STATUS_OPTIONS,
  APP_REVIEW_TO_TRACKER,
  TRACKER_TO_APP_REVIEW,
  formatDeliverableDates,
  pendingUploadCount,
  progressStatusBadge,
  reviewStatusBadge,
  computeDeliverableTrackStats,
  computeOverallDeliverableStats,
} from './deliverableDisplay';
import { formatBobTrackDisplayLabel } from '@/lib/bobDisplayTerminology';

export function MilestonesPage() {
  const orgId = BOB_MILESTONES_ORG_ID;
  const [tab, setTab] = useState<'all' | 'pending_review'>('all');
  const [trackFilter, setTrackFilter] = useState('');
  const [detail, setDetail] = useState<BobDeliverable | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [detailSaveError, setDetailSaveError] = useState<string | null>(null);

  const milestonesQuery = useBobMilestonesList({
    orgId,
    tab: tab === 'pending_review' ? 'pending_review' : undefined,
    track: trackFilter || undefined,
  });
  const updateMilestone = useUpdateBobMilestone();
  const data = milestonesQuery.data?.data ?? [];
  const loading = milestonesQuery.isLoading;
  const error = milestonesQuery.error
    ? parseApiError(milestonesQuery.error)
    : null;

  const pendingCount = useMemo(
    () =>
      data.filter(
        (d) =>
          d.reviewStatus === 'pending_review' ||
          d.reviewStatus === 'in_progress' ||
          pendingUploadCount(d) > 0,
      ).length,
    [data],
  );

  const groupedByTrack = useMemo(() => {
    const map = new Map<string, BobDeliverable[]>();
    for (const d of data) {
      const key = d.trackName || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  const overallStats = useMemo(
    () => computeOverallDeliverableStats(data),
    [data],
  );

  const trackStats = useMemo(
    () => computeDeliverableTrackStats(data),
    [data],
  );

  function applyOptimisticDeliverable(
    item: BobDeliverable,
    reviewStatus: string,
    trackerStatus?: string,
  ): BobDeliverable {
    const trackerValue =
      trackerStatus || (reviewStatus ? APP_REVIEW_TO_TRACKER[reviewStatus] : undefined);
    const reviewValue =
      reviewStatus ||
      (trackerStatus ? TRACKER_TO_APP_REVIEW[trackerStatus] : item.reviewStatus);
    const trackers = [...(item.trackerRecords || [])];
    if (trackerValue) {
      if (trackers.length) {
        trackers[0] = {
          ...trackers[0],
          deliverableStatus: trackerValue,
          reviewStatus: TRACKER_TO_APP_REVIEW[trackerValue] || reviewValue,
        };
      } else {
        trackers.push({
          id: 'pending',
          airtableRecordId: 'pending',
          date: null,
          deliverableStatus: trackerValue,
          reviewStatus: TRACKER_TO_APP_REVIEW[trackerValue] || reviewValue,
          staffReviewNotes: null,
          projectDeliverable: null,
          amountEarned: null,
          uploads: [],
        });
      }
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
  ) {
    const previous = detail?.id === item.id ? detail : item;
    const optimistic = applyOptimisticDeliverable(
      item,
      reviewStatus,
      trackerStatus,
    );

    setUpdatingId(item.id);
    setDetailSaveError(null);
    if (detail?.id === item.id) setDetail(optimistic);

    try {
      const updated = await updateMilestone.mutateAsync({
        orgId,
        milestoneId: item.id,
        data: {
          reviewStatus: reviewStatus || undefined,
          trackerDeliverableStatus: trackerStatus,
          trackerId: item.trackerRecords?.[0]?.id,
        },
      });
      if (detail?.id === updated.id) setDetail(updated);
      await milestonesQuery.refetch();
    } catch (err) {
      if (detail?.id === item.id) setDetail(previous);
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

      {milestonesQuery.data?.syncedAt ? (
        <p className="text-xs text-gray-500 -mt-2 mb-4">
          Last synced {new Date(milestonesQuery.data.syncedAt).toLocaleString()}
        </p>
      ) : null}

      {data.length > 0 ? (
        <section className="mb-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Due deliverables progress
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Percentages count only deliverables past their target completion
              date.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                All tracks
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">
                {overallStats.pctDueCompleted}%
              </p>
              <p className="text-sm text-gray-600">completed (due)</p>
              <p className="text-xs text-gray-500 mt-2 tabular-nums">
                {overallStats.completedCount}/{overallStats.dueCount} due ·{' '}
                {overallStats.pctDueSubmitted}% submitted
              </p>
              {overallStats.overdueCount > 0 ? (
                <p className="text-xs text-red-700 mt-1">
                  {overallStats.overdueCount} overdue
                </p>
              ) : null}
            </div>
            {trackStats.map((t) => (
              <div
                key={t.trackName}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
                  {formatBobTrackDisplayLabel(t.trackName)}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">
                  {t.pctDueCompleted}%
                </p>
                <p className="text-sm text-gray-600">completed (due)</p>
                <p className="text-xs text-gray-500 mt-2 tabular-nums">
                  {t.completedCount}/{t.dueCount} due · {t.pctDueSubmitted}%
                  submitted
                </p>
                {t.overdueCount > 0 ? (
                  <p className="text-xs text-red-700 mt-1">
                    {t.overdueCount} overdue
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'all'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          Catalog
        </button>
        <button
          type="button"
          onClick={() => setTab('pending_review')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 ${
            tab === 'pending_review'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-600'
          }`}
        >
          Deliverables to Review
          {pendingCount > 0 ? (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800">
              {pendingCount}
            </span>
          ) : null}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TRACK_FILTERS.map((t) => (
          <button
            key={t.id || 'all'}
            type="button"
            onClick={() => setTrackFilter(t.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
              trackFilter === t.id
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-gray-700 font-medium">
            {needsImport && !trackFilter && tab === 'all'
              ? 'No deliverables imported yet'
              : 'No deliverables in this view'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {needsImport && !trackFilter && tab === 'all'
              ? 'Use Import deliverables from Airtable above to load the catalog.'
              : 'Import from Airtable or adjust track filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByTrack.map(([track, items]) => (
            <section key={track}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {formatBobTrackDisplayLabel(track)}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((d) => {
                  const review = reviewStatusBadge(d.reviewStatus);
                  const progress = progressStatusBadge(d.progressStatus);
                  const uploads = pendingUploadCount(d);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setDetailSaveError(null);
                        setDetail(d);
                      }}
                      className="text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-orange-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-orange-700">
                            {d.deliverableNumber || 'Deliverable'}
                          </p>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {d.deliverableName}
                          </h3>
                        </div>
                        {d.milestoneComplete ? (
                          <span className="shrink-0 text-green-600 text-lg" title="Complete">
                            ✓
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {d.teamNames?.join(', ') || d.projectNames?.join(', ') || 'No team linked'}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {formatDeliverableDates(d)}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${progress.className}`}>
                          {progress.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${review.className}`}>
                          {review.label}
                        </span>
                        {uploads > 0 ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            {uploads} upload{uploads === 1 ? '' : 's'} to review
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {detail ? (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setDetail(null)}
            aria-hidden
          />
          <div className="fixed top-0 right-0 w-full max-w-lg h-full bg-white shadow-xl z-50 overflow-y-auto border-l border-gray-200">
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-orange-700">
                    {detail.trackName} · {detail.deliverableNumber}
                  </p>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">
                    {detail.deliverableName}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Planned start</dt>
                  <dd className="font-medium">{detail.plannedStartDate || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Target completion</dt>
                  <dd className="font-medium">{detail.targetCompletionDate || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Type</dt>
                  <dd className="font-medium">{detail.typeOfMilestone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Teams</dt>
                  <dd className="font-medium">
                    {detail.teamNames?.join(', ') || '—'}
                  </dd>
                </div>
              </dl>

              {detail.details ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    SMART goal & definition of done
                  </h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap rounded-lg bg-gray-50 border border-gray-200 p-3">
                    {detail.details}
                  </div>
                </div>
              ) : null}

              {detailSaveError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {detailSaveError}
                </div>
              ) : null}

              {updatingId === detail.id ? (
                <p className="text-sm text-orange-600 font-medium flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  Saving to Airtable…
                </p>
              ) : null}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff review (tracker status)
                </label>
                <select
                  value={detail.trackerRecords?.[0]?.deliverableStatus || ''}
                  disabled={updatingId === detail.id}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    handleReviewChange(
                      detail,
                      TRACKER_TO_APP_REVIEW[v] || 'pending_review',
                      v,
                    );
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-60 disabled:cursor-wait"
                >
                  <option value="">—</option>
                  {TRACKER_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  App review status
                </label>
                <select
                  value={detail.reviewStatus || ''}
                  disabled={updatingId === detail.id}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    handleReviewChange(
                      detail,
                      v,
                      APP_REVIEW_TO_TRACKER[v],
                    );
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-60 disabled:cursor-wait"
                >
                  {REVIEW_STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {(detail.trackerRecords || []).length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Team submissions
                  </h3>
                  <ul className="space-y-3">
                    {detail.trackerRecords.map((t) => (
                      <li
                        key={t.id}
                        className="rounded-lg border border-gray-200 p-3 text-sm"
                      >
                        <p className="font-medium text-gray-900">
                          {t.date || 'Submission'} · {t.deliverableStatus || 'Status pending'}
                        </p>
                        {t.staffReviewNotes ? (
                          <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                            {t.staffReviewNotes}
                          </p>
                        ) : null}
                        {t.uploads?.length ? (
                          <ul className="mt-2 space-y-1">
                            {t.uploads.map((u) => (
                              <li key={u.id}>
                                <a
                                  href={u.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-orange-600 hover:underline"
                                >
                                  {u.filename}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {detail.finalDeliverableLinks ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Final links
                  </h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {detail.finalDeliverableLinks}
                  </p>
                </div>
              ) : null}

              <Link
                href="/app/bob/inbox?type=progress_update"
                className="inline-block text-sm font-medium text-orange-600 hover:underline"
              >
                View progress updates in inbox →
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
