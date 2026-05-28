"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Drawer } from "@/components/Drawer";
import { TransferConfirmationModal } from "@/components/bob/TransferConfirmationModal";
import {
  StatusBadge,
  TransferredBadge,
  pickYouthWorksStatus,
} from "@/components/bob/RecruitmentUi";
import { Skeleton } from "@/components/Skeleton";
import {
  getIntakeNextAction,
  isApprovedRecord,
  isTransferredRecord,
} from "@/features/bob/inbox/intakeNextAction";
import {
  useApproveBobRecruitment,
  useBobRecruitmentDetail,
  useBobRecruitmentSchema,
} from "@/platform/query/hooks/useBobRecruitmentList";
import {
  previewBobRecruitmentTransfer,
  transferBobRecruitment,
  type BobRecruitmentTransferPreview,
  type BobRecruitmentTransferResult,
} from "@/platform/api/bob/recruitment";
import { pickSummaryFields } from "@/features/bob/inbox/recordDisplay";
import { parseApiError } from "@/platform/api/errors";

export function IntakeDetailDrawer({
  recordId,
  open,
  onClose,
  onRecordUpdated,
}: {
  recordId: string | null;
  open: boolean;
  onClose: () => void;
  onRecordUpdated?: () => void;
}) {
  const {
    data: record,
    isLoading,
    error,
    refetch,
  } = useBobRecruitmentDetail(open ? recordId : null);
  const { data: schema } = useBobRecruitmentSchema();
  const approveMutation = useApproveBobRecruitment();

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferPreview, setTransferPreview] =
    useState<BobRecruitmentTransferPreview | null>(null);
  const [loadingTransferPreview, setLoadingTransferPreview] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferResult, setTransferResult] =
    useState<BobRecruitmentTransferResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const programIds = record?.programRecordIds ?? [];

  const openTransferPreview = useCallback(async () => {
    if (!recordId) return;
    setActionError(null);
    setTransferResult(null);
    setTransferModalOpen(true);
    setLoadingTransferPreview(true);
    try {
      const preview = await previewBobRecruitmentTransfer(recordId, {
        programRecordIds: programIds,
      });
      setTransferPreview(preview);
    } catch (err) {
      setTransferModalOpen(false);
      setActionError(parseApiError(err));
    } finally {
      setLoadingTransferPreview(false);
    }
  }, [recordId, programIds]);

  async function confirmTransfer() {
    if (!recordId) return;
    setTransferring(true);
    setActionError(null);
    try {
      const result = await transferBobRecruitment(recordId, {
        programRecordIds: programIds,
      });
      setTransferResult(result);
      setTransferModalOpen(false);
      await refetch();
      onRecordUpdated?.();
    } catch (err) {
      setActionError(parseApiError(err));
    } finally {
      setTransferring(false);
    }
  }

  async function handleApprove() {
    if (!recordId) return;
    setActionError(null);
    try {
      await approveMutation.mutateAsync(recordId);
      await refetch();
      onRecordUpdated?.();
    } catch (err) {
      setActionError(parseApiError(err));
    }
  }

  const fields = (record?.airtableFields || {}) as Record<string, unknown>;
  const yw = pickYouthWorksStatus(fields);
  const nextAction = record ? getIntakeNextAction(record) : null;
  const summary = record ? pickSummaryFields(fields, record) : [];

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        widthClassName="w-full sm:w-[min(100%,520px)] lg:w-[560px]"
        panelClassName="border-l border-gray-200"
      >
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : error && !record ? (
          <div className="p-6">
            <p className="text-sm text-red-700">{parseApiError(error)}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 text-sm text-orange-600 font-medium"
            >
              Retry
            </button>
          </div>
        ) : record ? (
          <div className="flex flex-col min-h-full">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-1">
                    Intake record
                  </p>
                  <h2 className="text-lg font-bold text-gray-900 truncate">
                    {record.label || "Untitled"}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge
                      label={record.recruitmentStatus || "—"}
                      variant="app"
                    />
                    {yw ? (
                      <StatusBadge label={yw.value} variant="airtable" />
                    ) : null}
                    <TransferredBadge
                      transferred={isTransferredRecord(record)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {nextAction && nextAction.kind !== "none" ? (
                <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-3">
                  <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide">
                    Next step
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {nextAction.label}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {nextAction.description}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {nextAction?.kind === "transfer" &&
                !isTransferredRecord(record) ? (
                  <button
                    type="button"
                    disabled={loadingTransferPreview || transferring}
                    onClick={() => void openTransferPreview()}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                  >
                    Transfer
                  </button>
                ) : null}
                {nextAction?.kind === "approve" &&
                isTransferredRecord(record) &&
                !isApprovedRecord(record) ? (
                  <button
                    type="button"
                    disabled={approveMutation.isPending}
                    onClick={() => void handleApprove()}
                    className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                  >
                    {approveMutation.isPending ? "Approving…" : "Approve"}
                  </button>
                ) : null}
                {record.rosterStudentId ? (
                  <Link
                    href={`/app/bob/roster/${record.rosterStudentId}`}
                    className="px-3 py-2 rounded-lg border border-green-300 bg-green-50 text-green-800 text-sm font-semibold"
                  >
                    View roster
                  </Link>
                ) : null}
                <Link
                  href={`/app/bob/recruitment/${record.id}`}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Full record →
                </Link>
              </div>

              {actionError ? (
                <p className="mt-3 text-sm text-red-700">{actionError}</p>
              ) : null}
              {transferResult ? (
                <p className="mt-2 text-xs text-emerald-700">
                  Transfer completed — Students & Alums updated.
                </p>
              ) : null}
            </div>

            <div className="px-5 py-4 flex-1 space-y-6">
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Summary
                </h3>
                {summary.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No summary fields yet.
                  </p>
                ) : (
                  <dl className="grid grid-cols-1 gap-3">
                    {summary.map((row) => (
                      <div
                        key={row.label}
                        className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                      >
                        <dt className="text-xs text-gray-500">{row.label}</dt>
                        <dd className="text-sm font-medium text-gray-900 mt-0.5 break-words">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>

              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Pipeline
                </h3>
                <ol className="space-y-2 text-sm">
                  {[
                    {
                      label: "Youth Apps & Intake",
                      done: Boolean(record.airtableRecordId),
                    },
                    {
                      label: "Students & Alums",
                      done: Boolean(record.studentsAlumsAirtableRecordId),
                    },
                    { label: "Roster", done: Boolean(record.rosterStudentId) },
                  ].map((step) => (
                    <li
                      key={step.label}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <span
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          step.done
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {step.done ? "✓" : "·"}
                      </span>
                      {step.label}
                    </li>
                  ))}
                </ol>
              </section>

              {schema?.programOptions && schema.programOptions.length > 0 ? (
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Programs
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Edit programs on the full record page.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {schema.programOptions
                      .filter((o) => programIds.includes(o.id))
                      .map((o) => (
                        <span
                          key={o.id}
                          className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-800 border border-indigo-100"
                        >
                          {o.label}
                        </span>
                      ))}
                    {programIds.length === 0 ? (
                      <span className="text-sm text-gray-400">
                        None selected
                      </span>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        ) : null}
      </Drawer>

      <TransferConfirmationModal
        open={transferModalOpen}
        preview={transferPreview}
        loadingPreview={loadingTransferPreview}
        transferring={transferring}
        onConfirm={() => void confirmTransfer()}
        onCancel={() => {
          if (!transferring) {
            setTransferModalOpen(false);
            setTransferPreview(null);
          }
        }}
      />
    </>
  );
}
