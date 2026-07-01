"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { Drawer } from "@/components/Drawer";
import { Skeleton } from "@/components/Skeleton";
import {
  badgeClassesForType,
  cardTitle,
  cardSummary,
  formatWhen,
  SUBMISSION_STATUS_LABELS,
} from "@/features/bob/submissions/display";
import {
  useBobSubmissionDetail,
  useBobSubmissionsList,
} from "@/platform/query/hooks/useBobSubmissions";
import type { BobSubmission } from "@/platform/api/bob/submissions";

function SubmissionRow({
  submission,
  onOpen,
}: {
  submission: BobSubmission;
  onOpen: () => void;
}) {
  const typeClass = badgeClassesForType(submission.type);
  const status =
    SUBMISSION_STATUS_LABELS[submission.status] || submission.status;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-orange-200 hover:shadow-md transition-all"
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${typeClass}`}
        >
          {submission.type.replace(/_/g, " ")}
        </span>
        <span className="text-[11px] font-medium text-gray-500">{status}</span>
        <span className="text-[11px] text-gray-400 ml-auto">
          {formatWhen(submission.createdAt)}
        </span>
      </div>
      <p className="font-semibold text-gray-900">{cardTitle(submission)}</p>
      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{cardSummary(submission)}</p>
    </button>
  );
}

function SubmissionReadOnlyDetail({ submissionId }: { submissionId: string }) {
  const { data, isLoading } = useBobSubmissionDetail(submissionId);

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  const body =
    data.reflection ||
    data.description ||
    data.concernSummary ||
    data.feedback ||
    data.notes ||
    data.reason ||
    "";

  return (
    <div className="p-6 space-y-4">
      <div>
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeClassesForType(data.type)}`}
        >
          {data.type.replace(/_/g, " ")}
        </span>
        <h2 className="mt-2 text-lg font-semibold text-gray-900">{cardTitle(data)}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {SUBMISSION_STATUS_LABELS[data.status] || data.status} ·{" "}
          {formatWhen(data.createdAt)}
        </p>
      </div>
      {body ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
          {body}
        </div>
      ) : null}
      {data.teamName ? (
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-800">Team:</span> {data.teamName}
        </p>
      ) : null}
    </div>
  );
}

export function MySubmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const { data, isLoading, error } = useBobSubmissionsList({
    limit: 100,
    excludeArchived: true,
  });

  const submissions = useMemo(
    () =>
      [...(data?.submissions ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data?.submissions],
  );

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="My activity"
        title="My submissions"
        description="Forms and updates you have submitted. You only see your own activity here — not other students' submissions or staff notes."
        actions={
          <Link
            href="/app/bob/submit"
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
          >
            Submit something
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-700">
          {error instanceof Error ? error.message : "Failed to load submissions"}
        </p>
      ) : submissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-gray-900">No submissions yet</p>
          <p className="mt-2 text-sm text-gray-600">
            Progress updates, testimony, and feedback you submit will appear here.
          </p>
          <Link
            href="/app/bob/submit"
            className="mt-4 inline-flex text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Open submit forms →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <SubmissionRow
              key={s.id}
              submission={s}
              onOpen={() => {
                const sp = new URLSearchParams(searchParams.toString());
                sp.set("id", s.id);
                router.push(`/app/bob/my-submissions?${sp.toString()}`, {
                  scroll: false,
                });
              }}
            />
          ))}
        </div>
      )}

      <Drawer
        open={Boolean(selectedId)}
        onClose={() => router.push("/app/bob/my-submissions", { scroll: false })}
        widthClassName="w-full sm:w-[min(100%,520px)]"
      >
        {selectedId ? <SubmissionReadOnlyDetail submissionId={selectedId} /> : null}
      </Drawer>
    </div>
  );
}
