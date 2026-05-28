"use client";

import { HiOutlineRefresh } from "react-icons/hi";
import {
  useBobAirtableStatus,
  useBobAirtableSync,
} from "@/platform/query/hooks/useBobAirtableStatus";
import { parseApiError } from "@/platform/api/errors";

function formatRelativeTime(dateStr: string | null | undefined) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function BobSyncStatusBadge() {
  const { data: status, isLoading, error, refetch } = useBobAirtableStatus();
  const syncMutation = useBobAirtableSync();

  const syncing = syncMutation.isPending || Boolean(status?.running);

  async function handleSync() {
    try {
      await syncMutation.mutateAsync();
    } catch (err) {
      console.error(parseApiError(err));
    }
  }

  if (isLoading && !status) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full w-full">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse shrink-0" />
        <span className="text-sm font-medium text-gray-500">BoB sync</span>
      </div>
    );
  }

  if (error && !status) {
    return (
      <button
        type="button"
        onClick={() => refetch()}
        className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full w-full text-left"
      >
        <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
        <span className="text-xs text-red-700 truncate">Sync unavailable</span>
      </button>
    );
  }

  if (!status?.connected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full w-full">
        <div className="w-2 h-2 bg-amber-500 rounded-full shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-amber-800">Airtable</p>
          <p className="text-xs text-amber-700 truncate">Not configured</p>
        </div>
      </div>
    );
  }

  const lastSync = status.lastSuccessAt || status.lastRunAt;
  const syncError =
    status.lastError?.message ||
    (status.access?.ok === false ? status.access.error : null);

  if (syncError) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full w-full">
        <div className="w-2 h-2 bg-yellow-500 rounded-full shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-yellow-800">Sync issue</p>
          <p className="text-xs text-yellow-700 truncate" title={syncError}>
            {syncError}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="text-yellow-700 hover:text-yellow-900 shrink-0"
          aria-label="Retry sync"
        >
          <HiOutlineRefresh
            className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full w-full">
      <div
        className={`w-2 h-2 rounded-full shrink-0 ${syncing ? "bg-orange-500 animate-pulse" : "bg-green-500"}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-green-800">Airtable</p>
        <p className="text-xs text-green-700 truncate">
          {syncing ? "Syncing…" : `Synced ${formatRelativeTime(lastSync)}`}
        </p>
      </div>
      <button
        type="button"
        onClick={handleSync}
        disabled={syncing}
        className="text-green-700 hover:text-green-900 shrink-0"
        aria-label="Sync now"
      >
        <HiOutlineRefresh
          className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
        />
      </button>
    </div>
  );
}
