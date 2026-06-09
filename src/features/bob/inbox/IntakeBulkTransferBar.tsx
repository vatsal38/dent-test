"use client";

export function IntakeBulkTransferBar({
  selectedCount,
  pageCount,
  matchingCount,
  matchingCapped,
  matchingMax,
  allOnPageSelected,
  allMatchingSelected,
  loadingMatching,
  onSelectAllPage,
  onSelectAllMatching,
  onTransferAllMatching,
  onClear,
  onPreviewTransfer,
  busy,
}: {
  selectedCount: number;
  pageCount: number;
  matchingCount: number;
  matchingCapped: boolean;
  matchingMax: number;
  allOnPageSelected: boolean;
  allMatchingSelected: boolean;
  loadingMatching: boolean;
  onSelectAllPage: () => void;
  onSelectAllMatching: () => void;
  onTransferAllMatching: () => void;
  onClear: () => void;
  onPreviewTransfer: () => void;
  busy: boolean;
}) {
  if (selectedCount === 0 && matchingCount === 0) return null;

  const matchingLabel = loadingMatching
    ? "…"
    : String(matchingCount);

  return (
    <div className="sticky bottom-4 z-20 mx-auto max-w-5xl flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 text-white shadow-lg">
      {selectedCount > 0 ? (
        <span className="text-sm font-medium">{selectedCount} selected</span>
      ) : (
        <span className="text-sm font-medium">
          {loadingMatching
            ? "Loading matching records…"
            : `${matchingLabel} ready to transfer`}
        </span>
      )}

      {pageCount > 0 ? (
        <button
          type="button"
          disabled={busy || pageCount === 0}
          onClick={onSelectAllPage}
          className="text-sm px-3 py-1.5 rounded bg-gray-800 border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
        >
          {allOnPageSelected ? "Deselect page" : `Select page (${pageCount})`}
        </button>
      ) : null}

      {matchingCount > 0 ? (
        <>
          <button
            type="button"
            disabled={busy || loadingMatching}
            onClick={onSelectAllMatching}
            className="text-sm px-3 py-1.5 rounded bg-gray-800 border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
          >
            {allMatchingSelected
              ? "Deselect all matching"
              : `Select all matching (${matchingLabel}${matchingCapped ? ` of ${matchingMax}+` : ""})`}
          </button>
          <button
            type="button"
            disabled={busy || loadingMatching}
            onClick={onTransferAllMatching}
            className="text-sm px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 font-semibold disabled:opacity-50"
          >
            {busy
              ? "Working…"
              : `Transfer all matching (${matchingLabel}${matchingCapped ? "+" : ""})`}
          </button>
        </>
      ) : null}

      {selectedCount > 0 ? (
        <button
          type="button"
          disabled={busy}
          onClick={onPreviewTransfer}
          className="text-sm px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 font-semibold disabled:opacity-50"
        >
          {busy ? "Working…" : "Transfer selected"}
        </button>
      ) : null}

      {selectedCount > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="text-sm px-3 py-1.5 rounded border border-gray-600 hover:bg-gray-800 ml-auto"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
