"use client";

import type {
  BobBulkTransferPreviewResponse,
  BobBulkTransferResult,
} from "@/platform/api/bob/recruitment";

function downloadErrorReport(errors: BobBulkTransferResult["errors"]) {
  const lines = [
    "id,label,code,error",
    ...errors.map((e) =>
      [
        e.id,
        JSON.stringify(e.label || ""),
        e.code || "",
        JSON.stringify(e.error || ""),
      ].join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transfer-errors-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkTransferModal({
  open,
  phase,
  selectedCount,
  preview,
  result,
  loadingPreview,
  transferring,
  onPreview,
  onConfirm,
  onClose,
}: {
  open: boolean;
  phase: "preview" | "result";
  selectedCount: number;
  preview: BobBulkTransferPreviewResponse | null;
  result: BobBulkTransferResult | null;
  loadingPreview: boolean;
  transferring: boolean;
  onPreview: () => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const summary = preview?.summary;
  const canConfirm =
    phase === "preview" &&
    preview?.canTransfer &&
    !loadingPreview &&
    !transferring;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-transfer-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2
            id="bulk-transfer-title"
            className="text-lg font-semibold text-gray-900"
          >
            {phase === "result" ? "Transfer complete" : "Bulk transfer preview"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {phase === "result"
              ? "Students & Alums updated for the selected intake records."
              : `${selectedCount} student(s) selected — review estimated changes before confirming.`}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {phase === "preview" ? (
            <>
              {!preview && !loadingPreview ? (
                <p className="text-sm text-gray-600">
                  Click Preview to validate selections and detect existing
                  Students & Alums matches.
                </p>
              ) : null}

              {loadingPreview ? (
                <p className="text-sm text-gray-500">Analyzing selections…</p>
              ) : null}

              {summary ? (
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="New students" value={summary.newStudents} />
                  <StatCard
                    label="Existing students"
                    value={summary.existingStudents}
                  />
                  <StatCard
                    label="Duplicates detected"
                    value={summary.duplicatesDetected}
                  />
                  <StatCard
                    label="Programs to add"
                    value={summary.programsToAdd}
                  />
                  {summary.invalid > 0 ? (
                    <StatCard
                      label="Cannot transfer"
                      value={summary.invalid}
                      variant="warn"
                    />
                  ) : null}
                </div>
              ) : null}

              {preview?.items?.some((it) => !it.ok) ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 max-h-40 overflow-y-auto">
                  <p className="font-semibold mb-2">Records with issues</p>
                  <ul className="space-y-1">
                    {preview.items
                      .filter((it) => !it.ok)
                      .slice(0, 12)
                      .map((it) => (
                        <li key={it.id}>
                          {it.label || it.id}:{" "}
                          {it.error ||
                            it.errors?.[0]?.message ||
                            "Validation failed"}
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}

              {preview?.items?.some(
                (it) => it.ok && it.preview?.duplicate,
              ) ? (
                <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm">
                  <p className="font-semibold text-violet-900">
                    Existing matches (sample)
                  </p>
                  <ul className="mt-2 space-y-1 text-violet-800">
                    {preview.items
                      .filter((it) => it.ok && it.preview?.duplicate)
                      .slice(0, 5)
                      .map((it) => (
                        <li key={it.id}>
                          {it.label}: {it.preview?.duplicate?.label || "match"}{" "}
                          ({it.preview?.duplicate?.matchType})
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}

          {phase === "result" && result ? (
            <>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-lg font-semibold text-emerald-900">
                  Success: {result.success}
                </p>
                {result.failed > 0 ? (
                  <p className="text-sm text-red-700 mt-1">
                    Failed: {result.failed}
                  </p>
                ) : null}
              </div>
              {result.errors.length > 0 ? (
                <button
                  type="button"
                  onClick={() => downloadErrorReport(result.errors)}
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  Download error report
                </button>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="p-5 border-t border-gray-100 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={transferring}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            {phase === "result" ? "Close" : "Cancel"}
          </button>
          {phase === "preview" && !preview && !loadingPreview ? (
            <button
              type="button"
              onClick={onPreview}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-semibold hover:bg-gray-900"
            >
              Preview changes
            </button>
          ) : null}
          {phase === "preview" && preview ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {transferring
                ? "Transferring…"
                : `Confirm transfer (${selectedCount})`}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "warn";
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        variant === "warn"
          ? "border-amber-200 bg-amber-50"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}
