"use client";

import Link from "next/link";
import { BOB_POD_SINGULAR } from "@/lib/bobDisplayTerminology";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { BobSyncStatusBadge } from "@/features/bob/sync/BobSyncStatusBadge";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { UnauthorizedState } from "@/platform/rbac/UnauthorizedState";
import {
  getBobRecruitmentImportStatus,
  getBobRosterImportStatus,
  resetBobPipeline,
  startBobRecruitmentImport,
  startBobRosterImport,
  getEvaluationsDemographicsSyncStatus,
  startEvaluationsDemographicsSync,
} from "@/platform/api/bob";
import { parseApiError } from "@/platform/api/errors";
import type { BobImportJobStatus } from "@/platform/api/bob/shared";

export function BobSettingsPage() {
  const { can } = useBobAccess();
  const [importBusy, setImportBusy] = useState<string | null>(null);
  const [demographicsStarting, setDemographicsStarting] = useState(false);
  const [demographicsStatus, setDemographicsStatus] =
    useState<BobImportJobStatus | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pollDemographicsStatus = useCallback(async () => {
    try {
      const status = await getEvaluationsDemographicsSyncStatus();
      setDemographicsStatus(status);
      if (!status.running && status.progress?.phase === "done") {
        setMessage(
          status.result?.message ||
            status.progress?.message ||
            "Demographics sync complete.",
        );
      } else if (!status.running && status.progress?.phase === "error") {
        setMessage(
          status.lastError?.message ||
            status.progress?.message ||
            "Demographics sync failed.",
        );
      }
      return status;
    } catch (err) {
      setMessage(parseApiError(err));
      return null;
    }
  }, []);

  useEffect(() => {
    void pollDemographicsStatus();
  }, [pollDemographicsStatus]);

  const demographicsRunning =
    demographicsStarting || Boolean(demographicsStatus?.running);

  useEffect(() => {
    if (!demographicsRunning) return;
    void pollDemographicsStatus();
    const id = window.setInterval(() => void pollDemographicsStatus(), 1500);
    return () => window.clearInterval(id);
  }, [demographicsRunning, pollDemographicsStatus]);

  if (!can("settings.manage")) {
    return (
      <div>
        <PageHeader
          title="Settings"
          description="Program configuration and admin tools."
        />
        <UnauthorizedState
          description="You do not have access to BoB settings. Contact an admin."
          backHref="/app/bob"
        />
      </div>
    );
  }

  async function runImport(kind: "students" | "recruitment") {
    setImportBusy(kind);
    setMessage(null);
    try {
      if (kind === "students") {
        await startBobRosterImport();
        const status = await getBobRosterImportStatus();
        setMessage(
          status.running
            ? "Roster import started — refresh intake/roster lists shortly."
            : `Roster import: ${status.lastError?.message ?? "finished"}`,
        );
      } else {
        await startBobRecruitmentImport();
        const status = await getBobRecruitmentImportStatus();
        setMessage(
          status.running
            ? "Intake import started — refresh the intake inbox shortly."
            : `Intake import: ${status.lastError?.message ?? "finished"}`,
        );
      }
    } catch (err) {
      setMessage(parseApiError(err));
    } finally {
      setImportBusy(null);
    }
  }

  async function handleDemographicsSync() {
    setDemographicsStarting(true);
    setMessage(null);
    try {
      try {
        await startEvaluationsDemographicsSync({
          sinceHours: 0,
          limit: 500,
          force: true,
        });
      } catch (err) {
        // Another click / leftover run — keep polling instead of looking "broken".
        const status =
          err && typeof err === "object" && "status" in err
            ? (err as { status?: number }).status
            : undefined;
        if (status !== 409) throw err;
      }
      const status = await pollDemographicsStatus();
      if (!status?.running && status?.progress?.phase === "done") {
        setMessage(
          status.result?.message ||
            status.progress?.message ||
            "Demographics sync complete.",
        );
      }
    } catch (err) {
      setMessage(parseApiError(err));
    } finally {
      setDemographicsStarting(false);
    }
  }

  async function handlePipelineReset() {
    const ok = window.confirm(
      "Type OK to wipe bob_recruitment and bob_students in Mongo. This cannot be undone.",
    );
    if (!ok) return;
    setResetBusy(true);
    setMessage(null);
    try {
      const result = await resetBobPipeline();
      setMessage(
        `Pipeline reset complete. Deleted: ${JSON.stringify(result.deleted)}`,
      );
    } catch (err) {
      setMessage(parseApiError(err));
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Bet on Baltimore"
        title="Settings"
        description="Airtable sync, bulk imports, staff, and admin tools."
      />

      {message && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
          {message}
        </div>
      )}

      <div className="space-y-8 max-w-2xl">
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Airtable sync
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Bi-directional sync with BoB Airtable bases. Status also appears in
            the sidebar. Sync uses the server&apos;s Airtable API token — not
            your Dent login role.
          </p>
          <BobSyncStatusBadge />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Bulk import from Airtable
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            One-time or refresh imports into Mongo for operational queues.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={importBusy !== null}
              onClick={() => runImport("recruitment")}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {importBusy === "recruitment"
                ? "Importing intake…"
                : "Import intake table"}
            </button>
            <button
              type="button"
              disabled={importBusy !== null}
              onClick={() => runImport("students")}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {importBusy === "students"
                ? "Importing roster…"
                : "Import roster table"}
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Evaluations demographics
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Copy submitted demographics from{" "}
            <a
              href="https://airtable.com/appUBN5NyXcVYXXNg/tblJwtZnVZoGpUjY3/viwDJlqMlViKB2Dmm?blocks=hide"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-gray-800"
            >
              Dent Evaluations
            </a>{" "}
            into{" "}
            <a
              href="https://airtable.com/appjDzuL6WUmrcZ5d/tblWX69llgeaLCKlT/viweLHMuhtXqs2bx7?blocks=hide"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-gray-800"
            >
              Students &amp; Alums
            </a>{" "}
            (matched by email or BCPSS ID). Linked school/org records stay in Evaluations —
            labels are copied as text because the tables are in different bases.
            Students must already be on the roster. Each run re-syncs the full demographics
            view (all submissions) and overwrites prior syncs when forced.
          </p>
          <button
            type="button"
            disabled={demographicsRunning || importBusy !== null}
            onClick={() => void handleDemographicsSync()}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {demographicsRunning
              ? "Syncing demographics…"
              : "Sync demographics from Evaluations"}
          </button>
          {demographicsRunning ? (
            <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-950">
              <div className="font-medium">Demographics sync in progress</div>
              <div className="mt-1 text-xs text-orange-900/80">
                {demographicsStatus?.progress?.message ||
                  "Reading evaluations and updating Students & Alums…"}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs tabular-nums">
                <span>Scanned: {demographicsStatus?.progress?.scanned ?? 0}</span>
                <span>
                  Updated: {demographicsStatus?.progress?.updated ?? 0}
                </span>
                <span>
                  Skipped: {demographicsStatus?.progress?.skipped ?? 0}
                </span>
                <span>
                  Failed: {demographicsStatus?.progress?.imported ?? 0}
                </span>
                {demographicsStatus?.elapsed ? (
                  <span>Elapsed: {demographicsStatus.elapsed}</span>
                ) : null}
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-white/60 overflow-hidden">
                <div className="h-full w-[40%] bg-orange-500 animate-pulse rounded-full" />
              </div>
            </div>
          ) : null}
          {!demographicsRunning && demographicsStatus?.result?.message ? (
            <p className="mt-3 text-xs text-gray-500">
              Last run: {demographicsStatus.result.message}
            </p>
          ) : null}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Staff & pods
          </h2>
          <ul className="text-sm space-y-2">
            <li>
              <Link
                href="/app/bob/staff"
                className="text-orange-600 hover:underline"
              >
                Staff directory →
              </Link>
            </li>
            <li>
              <Link
                href="/app/bob/pods"
                className="text-orange-600 hover:underline"
              >
                {BOB_POD_SINGULAR} assignments →
              </Link>
            </li>
          </ul>
        </section>

        {can("settings.manage") && (
          <section className="rounded-xl border border-red-200 bg-red-50 p-4">
            <h2 className="text-sm font-semibold text-red-800 uppercase tracking-wider mb-2">
              Danger zone
            </h2>
            <p className="text-sm text-red-700 mb-3">
              Clears recruitment and student collections in Mongo (not
              Airtable). Requires confirm token on the API.
            </p>
            <button
              type="button"
              disabled={resetBusy}
              onClick={handlePipelineReset}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {resetBusy ? "Resetting…" : "Reset pipeline collections"}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
