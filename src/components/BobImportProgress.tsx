"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BobImportJobStatus } from "@/lib/api";

export type { BobImportJobStatus };

type Props = {
  label: string;
  fetchStatus: () => Promise<BobImportJobStatus>;
  startImport: () => Promise<{ started?: boolean }>;
  onComplete?: () => void;
  className?: string;
  compact?: boolean;
};

export function BobImportProgress({
  label,
  fetchStatus,
  startImport,
  onComplete,
  className = "",
  compact = false,
}: Props) {
  const [status, setStatus] = useState<BobImportJobStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchStatusRef = useRef(fetchStatus);
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);
  const wasRunningRef = useRef(false);

  useEffect(() => {
    fetchStatusRef.current = fetchStatus;
  }, [fetchStatus]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const applyStatus = useCallback((s: BobImportJobStatus) => {
    if (s.running) {
      wasRunningRef.current = true;
      setDismissed(false);
    } else if (
      wasRunningRef.current &&
      s.progress?.phase === "done" &&
      !completedRef.current
    ) {
      completedRef.current = true;
      wasRunningRef.current = false;
      onCompleteRef.current?.();
    } else if (s.progress?.phase === "error") {
      wasRunningRef.current = false;
    }
    setStatus(s);
  }, []);

  const pollOnce = useCallback(async () => {
    try {
      const s = await fetchStatusRef.current();
      applyStatus(s);
      setError(null);
      return s;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load import status");
      return null;
    }
  }, [applyStatus]);

  // One status check on mount (resume UI if user refreshed mid-import).
  useEffect(() => {
    void pollOnce();
  }, [pollOnce]);

  // Poll only while import is active; stop when done/error/idle.
  const shouldPoll = Boolean(status?.running) || starting;

  useEffect(() => {
    if (!shouldPoll) return;
    void pollOnce();
    const id = window.setInterval(() => void pollOnce(), 1500);
    return () => window.clearInterval(id);
  }, [shouldPoll, pollOnce]);

  async function handleStart() {
    setStarting(true);
    setError(null);
    setDismissed(false);
    completedRef.current = false;
    wasRunningRef.current = false;
    try {
      await startImport();
      await pollOnce();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start import");
    } finally {
      setStarting(false);
    }
  }

  const running = Boolean(status?.running) || starting;
  const p = status?.progress;
  const scanned = p?.scanned ?? 0;
  const imported = p?.imported ?? 0;
  const updated = p?.updated ?? 0;
  const skipped = p?.skipped ?? 0;
  const inApp = p?.totalInMongo;
  const phase = p?.phase ?? "idle";
  const isDone = phase === "done" && !running;
  const isError = phase === "error" || Boolean(status?.lastError);
  const showPanel = !dismissed && (running || isDone || isError);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleStart()}
          disabled={running}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {running ? "Importing…" : `Import ${label} from Airtable`}
        </button>
        {status?.elapsed && running ? (
          <span className="text-sm text-gray-600">Elapsed: {status.elapsed}</span>
        ) : null}
        {status?.recordsPerSecond && running ? (
          <span className="text-sm text-gray-500">
            ~{status.recordsPerSecond} rows/s
          </span>
        ) : null}
      </div>

      {showPanel && (
        <div
          className={`rounded-xl border ${compact ? "px-3 py-2" : "px-4 py-3"} text-sm ${
            isError
              ? "border-red-200 bg-red-50 text-red-800"
              : isDone
                ? "border-green-200 bg-green-50 text-green-900"
                : "border-orange-200 bg-orange-50 text-orange-950"
          }`}
        >
          <div className={`flex items-start justify-between gap-3 ${compact ? "min-h-0" : ""}`}>
            <div className="font-semibold">
              {running
                ? `Live import — ${label}`
                : isDone
                  ? "Import complete"
                  : "Import failed"}
            </div>
            {!running && (isDone || isError) ? (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-xs font-medium opacity-70 hover:opacity-100 shrink-0"
              >
                Dismiss
              </button>
            ) : null}
          </div>
          <div className={`${compact ? "mt-0.5" : "mt-1"} text-xs opacity-90`}>
            {p?.message ||
              status?.result?.message ||
              status?.lastError?.message ||
              (running ? "Fetching records from Airtable…" : "")}
          </div>

          {(running || isDone) && !compact && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-lg bg-white/70 px-2 py-1.5 border border-black/5">
                <div className="text-gray-500">Scanned</div>
                <div className="text-lg font-bold tabular-nums">{scanned}</div>
              </div>
              <div className="rounded-lg bg-white/70 px-2 py-1.5 border border-black/5">
                <div className="text-gray-500">New</div>
                <div className="text-lg font-bold tabular-nums text-green-700">
                  {imported}
                </div>
              </div>
              <div className="rounded-lg bg-white/70 px-2 py-1.5 border border-black/5">
                <div className="text-gray-500">Updated</div>
                <div className="text-lg font-bold tabular-nums text-blue-700">
                  {updated}
                </div>
              </div>
              <div className="rounded-lg bg-white/70 px-2 py-1.5 border border-black/5">
                <div className="text-gray-500">In app</div>
                <div className="text-lg font-bold tabular-nums">
                  {inApp ?? "—"}
                </div>
              </div>
            </div>
          )}

          {!compact && skipped > 0 ? (
            <div className="mt-2 text-xs text-gray-600">Skipped (empty): {skipped}</div>
          ) : null}

          {running && (
            <div className={`${compact ? "mt-2" : "mt-3"} h-2 w-full rounded-full bg-white/60 overflow-hidden`}>
              <div className="h-full w-[40%] bg-orange-500 animate-pulse rounded-full" />
            </div>
          )}
        </div>
      )}

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
    </div>
  );
}
