"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStudentDrawerContext } from "../../context/StudentDrawerContext";
import {
  useStudentMilestones,
  useStudentSubmissions,
} from "../../hooks/useStudentTabQueries";
import { DetailCard, DetailCardGrid } from "../../widgets/DetailCard";
import { MilestonesTabSkeleton } from "../../widgets/TabPanelSkeleton";
import {
  isDeliverableCompleted,
  isDeliverableDue,
  isDeliverableOverdue,
  isDeliverableSubmitted,
  portfolioStatusBadge,
} from "@/features/bob/milestones/deliverableDisplay";
import { resolveIndustryCredentialTarget } from "../../lib/profileSignals";
import { formatBobTrackDisplayLabel } from "@/lib/bobDisplayTerminology";
import {
  downloadBobSubmissionAttachment,
  type BobSubmission,
} from "@/platform/api/bob/submissions";
import { formatWhen } from "@/features/bob/submissions/display";
import { progressStatusLabel } from "@/features/bob/progress/progressConstants";
import { useBobAccess } from "@/platform/rbac/useBobAccess";

function extractUrls(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = String(text).match(/https?:\/\/[^\s<>"']+/gi) || [];
  return [...new Set(matches.map((u) => u.replace(/[.,);]+$/, "")))];
}

function WeeklySubmissionFiles({ submission }: { submission: BobSubmission }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const proofUrls = extractUrls(submission.proofLinks);
  const attachments = submission.attachments || [];

  if (!attachments.length && !proofUrls.length) {
    return (
      <p className="text-[11px] text-gray-400 mt-1">No files attached yet.</p>
    );
  }

  return (
    <ul className="mt-1.5 space-y-0.5">
      {attachments.map((a) => (
        <li key={a.id}>
          <button
            type="button"
            disabled={busyId === a.id}
            className="text-xs text-orange-600 hover:underline disabled:opacity-50"
            onClick={async () => {
              setBusyId(a.id);
              try {
                await downloadBobSubmissionAttachment(submission.id, a.id);
              } catch {
                // ignore — toast optional
              } finally {
                setBusyId(null);
              }
            }}
          >
            {busyId === a.id ? "Downloading…" : `${a.filename} ⬇`}
          </button>
        </li>
      ))}
      {proofUrls.map((url) => (
        <li key={url}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-orange-600 hover:underline break-all"
          >
            {url.length > 48 ? `${url.slice(0, 48)}…` : url} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}

export function MilestonesTab() {
  const { student, tab } = useStudentDrawerContext();
  const { can } = useBobAccess();
  const { data: milestones = [], isLoading } = useStudentMilestones(student, tab);
  const { data: submissions = [], isLoading: submissionsLoading } =
    useStudentSubmissions(student?.id ?? null, tab);

  const weeklyUpdates = useMemo(() => {
    return (submissions || [])
      .filter((s) => s.type === "progress_update" && s.status !== "archived")
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [submissions]);

  const updatesByDeliverable = useMemo(() => {
    const map = new Map<string, BobSubmission[]>();
    for (const s of weeklyUpdates) {
      const key = s.deliverableId || "";
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [weeklyUpdates]);

  if (!student) return null;
  if (isLoading) return <MilestonesTabSkeleton />;

  const stats = student.milestoneStats;
  const dueItems = milestones.filter((m) => isDeliverableDue(m));
  const overdueCount =
    stats?.overdue ??
    dueItems.filter((m) => isDeliverableOverdue(m)).length;
  const submittedCount =
    dueItems.filter((m) => isDeliverableSubmitted(m)).length;
  const completedCount =
    dueItems.filter((m) => isDeliverableCompleted(m)).length;

  const credential = resolveIndustryCredentialTarget(student);
  const canOpenInbox = can("inbox.view");

  return (
    <div className="p-5 space-y-5">
      <DetailCardGrid cols={2}>
        <DetailCard
          label="Due deliverables submitted"
          value={
            stats?.pctDueSubmitted != null
              ? `${stats.pctDueSubmitted}%`
              : dueItems.length
                ? `${Math.round((submittedCount / dueItems.length) * 100)}%`
                : "—"
          }
          hint={`${submittedCount} of ${dueItems.length || stats?.total || 0} due`}
        />
        <DetailCard
          label="Due deliverables completed"
          value={
            stats?.pctDueCompleted != null
              ? `${stats.pctDueCompleted}%`
              : dueItems.length
                ? `${Math.round((completedCount / dueItems.length) * 100)}%`
                : "—"
          }
          hint={`${completedCount} completed`}
        />
      </DetailCardGrid>

      <DetailCardGrid cols={3}>
        <DetailCard label="Overdue" value={overdueCount} />
        <DetailCard
          label="Submitted (due)"
          value={stats?.submitted ?? submittedCount}
        />
        <DetailCard
          label="Completed (due)"
          value={stats?.completed ?? completedCount}
        />
      </DetailCardGrid>

      {/* 73 — Industry credential as its own section */}
      <section
        className={`rounded-xl border px-4 py-3 ${
          credential.earned
            ? "border-green-200 bg-green-50"
            : "border-indigo-200 bg-indigo-50/60"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Industry credential
        </p>
        <p
          className={`mt-1 text-sm font-semibold ${
            credential.earned ? "text-green-900" : "text-indigo-950"
          }`}
        >
          {credential.credentialName}
        </p>
        <p className="mt-1 text-xs text-gray-600">
          {credential.trackLabel && credential.trackLabel !== "Unassigned"
            ? `${credential.trackLabel} track`
            : "Track not assigned yet"}
          {" · "}
          {credential.earned
            ? "Marked complete on this Denter’s record"
            : "Working toward this credential"}
        </p>
        {/content\s*creation/i.test(credential.trackLabel) ? null : (
          <p className="mt-1.5 text-[11px] text-gray-500">
            Content Creation &amp; Marketing works toward Adobe credentials;
            Made@Dent, Denternship, and AYD work toward AI × Design Thinking.
          </p>
        )}
      </section>

      <div className="flex justify-between items-center gap-3">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Portfolio ({milestones.length})
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Deliverables + weekly submission files
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/app/bob/progress-update?studentId=${encodeURIComponent(student.id)}`}
            className="text-xs font-semibold text-orange-600"
          >
            + Weekly update
          </Link>
          <Link
            href="/app/bob/deliverables"
            className="text-xs text-orange-600 font-medium"
          >
            Hub →
          </Link>
        </div>
      </div>

      <ul className="space-y-2">
        {milestones.length === 0 ? (
          <li className="text-sm text-gray-500 py-8 text-center rounded-xl border border-dashed border-gray-200">
            No deliverables linked to this student yet.
          </li>
        ) : (
          milestones.map((m) => {
            const due = isDeliverableDue(m);
            const overdue = isDeliverableOverdue(m);
            const uploads = (m.trackerRecords || []).flatMap(
              (t) => t.uploads || [],
            );
            const review = portfolioStatusBadge(m);
            const linkedUpdates = updatesByDeliverable.get(m.id) || [];
            return (
              <li
                key={m.id}
                className="rounded-xl border border-gray-200 p-3 hover:border-orange-200 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {m.deliverableNumber ? `${m.deliverableNumber}: ` : ""}
                    {m.deliverableName}
                  </p>
                  <span
                    title={review.title}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${review.className}`}
                  >
                    {review.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatBobTrackDisplayLabel(m.trackName) || "—"}
                  {m.targetCompletionDate
                    ? ` · due ${m.targetCompletionDate}`
                    : ""}
                  {!due && m.targetCompletionDate ? " · not yet due" : ""}
                  {overdue ? " · overdue" : ""}
                </p>

                {uploads.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Deliverable files
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {uploads.map((u) => (
                        <li key={u.id || u.url}>
                          {u.url ? (
                            <a
                              href={u.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-orange-600 hover:underline"
                            >
                              {u.filename || "File"} ↗
                            </a>
                          ) : (
                            <span className="text-xs text-gray-500">
                              {u.filename || "File"}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* 72 — weekly submissions linked on the deliverable */}
                {linkedUpdates.length > 0 ? (
                  <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50/50 px-2.5 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-800">
                      Weekly submissions ({linkedUpdates.length})
                    </p>
                    <ul className="mt-1.5 space-y-2">
                      {linkedUpdates.map((s) => (
                        <li key={s.id}>
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-xs font-medium text-gray-900">
                              {s.programWeekIndex != null
                                ? `Week ${s.programWeekIndex}`
                                : "Weekly update"}
                              {s.deliverableStatus
                                ? ` · ${progressStatusLabel(s.deliverableStatus)}`
                                : ""}
                            </p>
                            <span className="text-[10px] text-gray-500">
                              {formatWhen(s.createdAt)}
                            </span>
                          </div>
                          <WeeklySubmissionFiles submission={s} />
                          {canOpenInbox ? (
                            <Link
                              href={`/app/bob/inbox?id=${encodeURIComponent(s.id)}`}
                              className="text-[11px] font-medium text-orange-600 hover:underline"
                            >
                              Open submission →
                            </Link>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {m.details ? (
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                    {m.details}
                  </p>
                ) : null}
              </li>
            );
          })
        )}
      </ul>

      {/* Weekly updates not tied to a portfolio deliverable id */}
      {(() => {
        const orphan = weeklyUpdates.filter(
          (s) => !s.deliverableId || !milestones.some((m) => m.id === s.deliverableId),
        );
        if (submissionsLoading && orphan.length === 0) {
          return (
            <p className="text-xs text-gray-400">Loading weekly submissions…</p>
          );
        }
        if (orphan.length === 0) return null;
        return (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Weekly submissions ({orphan.length})
            </h3>
            <p className="text-[11px] text-gray-400">
              Progress updates with file links for this Denter
            </p>
            <ul className="space-y-2">
              {orphan.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-gray-200 p-3 bg-white"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {s.deliverableLabel ||
                        s.milestone ||
                        (s.programWeekIndex != null
                          ? `Week ${s.programWeekIndex} update`
                          : "Weekly progress update")}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      {formatWhen(s.createdAt)}
                    </span>
                  </div>
                  {s.deliverableStatus ? (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {progressStatusLabel(s.deliverableStatus)}
                    </p>
                  ) : null}
                  <WeeklySubmissionFiles submission={s} />
                  {canOpenInbox ? (
                    <Link
                      href={`/app/bob/inbox?id=${encodeURIComponent(s.id)}`}
                      className="text-[11px] font-medium text-orange-600 hover:underline mt-1 inline-block"
                    >
                      Open submission →
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        );
      })()}
    </div>
  );
}
