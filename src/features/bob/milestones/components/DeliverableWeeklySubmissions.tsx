"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  downloadBobSubmissionAttachment,
  type BobSubmission,
} from "@/platform/api/bob/submissions";
import { useBobSubmissionsList } from "@/platform/query/hooks/useBobSubmissions";
import { formatWhen } from "@/features/bob/submissions/display";
import { progressStatusLabel } from "@/features/bob/progress/progressConstants";
import { teamNameMatchesFilter } from "../deliverableTeamReview";
import { useBobAccess } from "@/platform/rbac/useBobAccess";

function extractUrls(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = String(text).match(/https?:\/\/[^\s<>"']+/gi) || [];
  return [...new Set(matches.map((u) => u.replace(/[.,);]+$/, "")))];
}

function inboxHref(
  deliverableId: string,
  opts?: { teamName?: string; submissionId?: string },
) {
  const sp = new URLSearchParams();
  sp.set("type", "progress_update");
  sp.set("deliverableId", deliverableId);
  if (opts?.teamName) sp.set("teamName", opts.teamName);
  if (opts?.submissionId) sp.set("id", opts.submissionId);
  return `/app/bob/inbox?${sp.toString()}`;
}

/** Land on this deliverable (opens review drawer) — never the full catalog list. */
function deliverablePageHref(deliverableId: string, teamName?: string) {
  const sp = new URLSearchParams();
  // Prefer deliverableId so global student drawer (?id=) is not triggered
  sp.set("deliverableId", deliverableId);
  if (teamName) {
    sp.set("team", teamName);
    sp.set("tab", "by_team");
  } else {
    sp.set("tab", "all");
  }
  return `/app/bob/deliverables?${sp.toString()}`;
}

function SubmissionFiles({ submission }: { submission: BobSubmission }) {
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
                // ignore
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

function SubmissionCard({
  submission,
  deliverableId,
  teamName,
  showTeam,
  canOpenInbox,
}: {
  submission: BobSubmission;
  deliverableId: string;
  teamName?: string;
  showTeam?: boolean;
  canOpenInbox: boolean;
}) {
  return (
    <li className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {submission.student || submission.createdByLabel || "Youth"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatWhen(submission.createdAt)}
            {submission.programWeekIndex != null
              ? ` · Week ${submission.programWeekIndex}`
              : ""}
            {showTeam && (submission.teamName || submission.team)
              ? ` · ${submission.teamName || submission.team}`
              : ""}
          </p>
        </div>
        {submission.deliverableStatus ? (
          <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
            {progressStatusLabel(submission.deliverableStatus)}
          </span>
        ) : (
          <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
            Not started
          </span>
        )}
      </div>
      {submission.reflection ? (
        <p className="text-gray-700 mt-2 whitespace-pre-wrap text-xs leading-relaxed">
          {submission.reflection}
        </p>
      ) : null}
      <SubmissionFiles submission={submission} />
      {canOpenInbox ? (
        <Link
          href={inboxHref(deliverableId, {
            teamName,
            submissionId: submission.id,
          })}
          className="inline-block mt-2 text-xs font-medium text-orange-600 hover:underline"
        >
          Open submission →
        </Link>
      ) : null}
    </li>
  );
}

/** Weekly progress_update submissions linked to this deliverable (+ optional team). */
export function DeliverableWeeklySubmissions({
  deliverableId,
  deliverableLabel,
  teamName,
}: {
  deliverableId: string;
  deliverableLabel?: string | null;
  teamName?: string;
}) {
  const { can } = useBobAccess();
  // Load all submissions for this deliverable so Review can link to other denters
  const query = useBobSubmissionsList({
    type: "progress_update",
    deliverableId,
    deliverableLabel: deliverableLabel || undefined,
    excludeArchived: true,
    limit: 100,
  });

  const { teamSubmissions, otherSubmissions } = useMemo(() => {
    const rows = [...(query.data?.submissions || [])].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (!teamName) {
      return { teamSubmissions: rows, otherSubmissions: [] as BobSubmission[] };
    }
    const team: BobSubmission[] = [];
    const other: BobSubmission[] = [];
    for (const s of rows) {
      const label = s.teamName || s.team || "";
      if (!label || teamNameMatchesFilter(label, teamName)) team.push(s);
      else other.push(s);
    }
    return { teamSubmissions: team, otherSubmissions: other };
  }, [query.data?.submissions, teamName]);

  const canOpenInbox = can("inbox.view");
  const total = teamSubmissions.length + otherSubmissions.length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Weekly progress submissions
          {total ? ` (${total})` : ""}
        </h3>
        <div className="flex items-center gap-3">
          {canOpenInbox && total > 0 ? (
            <Link
              href={inboxHref(deliverableId, { teamName })}
              className="text-xs text-orange-600 hover:underline font-medium"
            >
              Open inbox →
            </Link>
          ) : null}
          <Link
            href={deliverablePageHref(deliverableId, teamName)}
            className="text-xs text-gray-500 hover:underline"
          >
            Open deliverable →
          </Link>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Each team member submits one weekly progress form for this deliverable.
        Connected submissions (including other denters on the same deliverable)
        show here for staff review. Open inbox jumps straight to the filtered
        submissions view for this deliverable, and Open deliverable returns to
        this review drawer.
      </p>
      {query.isLoading ? (
        <p className="text-sm text-gray-500">Loading weekly submissions…</p>
      ) : query.error ? (
        <p className="text-sm text-red-600">Could not load weekly submissions.</p>
      ) : total === 0 ? (
        <p className="text-sm text-gray-500 rounded-lg border border-dashed border-gray-200 px-3 py-3">
          No weekly progress updates linked yet
          {teamName ? ` for ${teamName}` : ""}. Youth submit via Weekly progress
          update.
        </p>
      ) : (
        <div className="space-y-4">
          {teamSubmissions.length ? (
            <ul className="space-y-3">
              {teamSubmissions.map((s) => (
                <SubmissionCard
                  key={s.id}
                  submission={s}
                  deliverableId={deliverableId}
                  teamName={teamName}
                  showTeam={!teamName}
                  canOpenInbox={canOpenInbox}
                />
              ))}
            </ul>
          ) : teamName ? (
            <p className="text-sm text-gray-500 rounded-lg border border-dashed border-gray-200 px-3 py-3">
              No weekly progress updates for {teamName} yet.
              {otherSubmissions.length
                ? " Other denters’ submissions for this deliverable are below."
                : ""}
            </p>
          ) : null}

          {otherSubmissions.length ? (
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Other denters on this deliverable
              </h4>
              <ul className="space-y-3">
                {otherSubmissions.map((s) => (
                  <SubmissionCard
                    key={s.id}
                    submission={s}
                    deliverableId={deliverableId}
                    teamName={teamName}
                    showTeam
                    canOpenInbox={canOpenInbox}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
