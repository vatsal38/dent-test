"use client";

import type { BobRecruitmentTransferPreview } from "@/lib/api";

function SyncHealthBadge({ state }: { state: string | null | undefined }) {
  const key = String(state || "pending").toLowerCase();
  const styles: Record<string, string> = {
    synced: "bg-emerald-50 text-emerald-800 border-emerald-200",
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    conflict: "bg-red-50 text-red-700 border-red-200",
    missing_airtable_record: "bg-orange-50 text-orange-800 border-orange-200",
    duplicate_merge_needed: "bg-violet-50 text-violet-800 border-violet-200",
  };
  const label = key.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${
        styles[key] || "bg-gray-50 text-gray-600 border-gray-200"
      }`}
    >
      {label}
    </span>
  );
}

export function TransferConfirmationModal({
  open,
  preview,
  loadingPreview,
  transferring,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  preview: BobRecruitmentTransferPreview | null;
  loadingPreview: boolean;
  transferring: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const programIds = preview?.programRecordIds || [];
  const programLabels = preview?.programLabels || {};
  const canConfirm = preview?.valid && !loadingPreview && !transferring;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 id="transfer-modal-title" className="text-lg font-semibold text-gray-900">
            Confirm transfer
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Move this applicant to Students & Alums (master student record). Existing
            matches are updated — duplicates are not created.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {loadingPreview ? (
            <p className="text-sm text-gray-500">Running validations…</p>
          ) : null}

          {!loadingPreview && preview && !preview.valid ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold mb-2">Cannot transfer</p>
              <ul className="list-disc pl-5 space-y-1">
                {preview.errors.map((e) => (
                  <li key={e.code}>{e.message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {!loadingPreview && preview?.warnings?.length ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold mb-2">Warnings</p>
              <ul className="list-disc pl-5 space-y-1">
                {preview.warnings.map((w) => (
                  <li key={w.code}>{w.message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {!loadingPreview && preview?.valid ? (
            <>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Action
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {preview.action === "create"
                    ? "Create new Students & Alums record"
                    : preview.alreadyTransferred
                      ? "Update existing link (programs / fields)"
                      : "Update existing Students & Alums record (duplicate match)"}
                </p>
              </div>

              {preview.duplicate ? (
                <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm">
                  <div className="font-semibold text-violet-900">Matched record</div>
                  <p className="text-violet-800 mt-1">
                    {preview.duplicate.label || preview.duplicate.studentsAlumsAirtableRecordId}
                  </p>
                  <p className="text-xs text-violet-700 mt-1">
                    Match: {preview.duplicate.matchType} ({preview.duplicate.source})
                  </p>
                </div>
              ) : null}

              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Programs ({programIds.length})
                </div>
                {programIds.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-1">None selected</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {programIds.map((id) => (
                      <li
                        key={id}
                        className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-800 border border-indigo-100"
                      >
                        {programLabels[id] || id}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Intake sync</span>
                <SyncHealthBadge state={preview.intakeSync?.syncState} />
              </div>

              {preview.proposedFieldKeys?.length ? (
                <p className="text-xs text-gray-500">
                  {preview.proposedFieldKeys.length} field(s) will be written or merged.
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={transferring}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {transferring ? "Transferring…" : "Confirm transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}
