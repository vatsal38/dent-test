"use client";

export function IntakeBulkTransferBar({
  selectedCount,
  pageCount,
  allOnPageSelected,
  onSelectAllPage,
  onClear,
  onPreviewTransfer,
  busy,
}: {
  selectedCount: number;
  pageCount: number;
  allOnPageSelected: boolean;
  onSelectAllPage: () => void;
  onClear: () => void;
  onPreviewTransfer: () => void;
  busy: boolean;
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 mx-auto max-w-5xl flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 text-white shadow-lg">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <button
        type="button"
        disabled={busy || pageCount === 0}
        onClick={onSelectAllPage}
        className="text-sm px-3 py-1.5 rounded bg-gray-800 border border-gray-600 hover:bg-gray-700 disabled:opacity-50"
      >
        {allOnPageSelected ? "Deselect page" : `Select all on page (${pageCount})`}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onPreviewTransfer}
        className="text-sm px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 font-semibold disabled:opacity-50"
      >
        {busy ? "Working…" : "Transfer selected"}
      </button>
      <button
        type="button"
        onClick={onClear}
        className="text-sm px-3 py-1.5 rounded border border-gray-600 hover:bg-gray-800 ml-auto"
      >
        Clear
      </button>
    </div>
  );
}
