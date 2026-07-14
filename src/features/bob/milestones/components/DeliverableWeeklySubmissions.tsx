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

/** 99B — weekly progress_update submissions linked to this deliverable (+ optional team). */
export function DeliverableWeeklySubmissions({
  deliverableId,
  teamName,
}: {
  deliverableId: string;
  teamName?: string;
}) {
  const { can } = useBobAccess();
  const query = useBobSubmissionsList({
    type: "progress_update",
    deliverableId,
    teamName: teamName || undefined,
    excludeArchived: true,
    limit: 100,
  });

  const submissions = useMemo(() => {
    const rows = query.data?.submissions || [];
    const sorted = [...rows].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (!teamName) return sorted;
    return sorted.filter((s) => {
      const label = s.teamName || s.team || "";
      if (!label) return true;
      return teamNameMatchesFilter(label, teamName);
    });
  }, [query.data?.submissions, teamName]);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Weekly progress submissions
          {submissions.length ? ` (${submissions.length})` : ""}
        </h3>
        {can("inbox.view") ? (
          <Link
            href="/app/bob/inbox?type=progress_update"
            className="text-xs text-orange-600 hover:underline"
          >
            Open inbox →
          </Link>
        ) : null}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Each team member submits one weekly progress form for this deliverable.
        Connected submissions show here for staff review.
      </p>
      {query.isLoading ? (
        <p className="text-sm text-gray-500">Loading weekly submissions…</p>
      ) : query.error ? (
        <p className="text-sm text-red-600">Could not load weekly submissions.</p>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-gray-500 rounded-lg border border-dashed border-gray-200 px-3 py-3">
          No weekly progress updates linked yet
          {teamName ? ` for ${teamName}` : ""}. Youth submit via Weekly progress
          update.
        </p>
      ) : (
        <ul className="space-y-3">
          {submissions.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {s.student || s.createdByLabel || "Youth"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatWhen(s.createdAt)}
                    {s.programWeekIndex != null
                      ? ` · Week ${s.programWeekIndex}`
                      : ""}
                    {s.teamName || s.team
                      ? ` · ${s.teamName || s.team}`
                      : ""}
                  </p>
                </div>
                {s.deliverableStatus ? (
                  <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                    {progressStatusLabel(s.deliverableStatus)}
                  </span>
                ) : null}
              </div>
              {s.reflection ? (
                <p className="text-gray-700 mt-2 whitespace-pre-wrap text-xs leading-relaxed">
                  {s.reflection}
                </p>
              ) : null}
              <SubmissionFiles submission={s} />
              {can("inbox.view") ? (
                <Link
                  href={`/app/bob/inbox?id=${encodeURIComponent(s.id)}&type=progress_update`}
                  className="inline-block mt-2 text-xs font-medium text-orange-600 hover:underline"
                >
                  Open submission →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
