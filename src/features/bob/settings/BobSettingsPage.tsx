"use client";

import Link from "next/link";
import { useState } from "react";
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
} from "@/platform/api/bob";
import { parseApiError } from "@/platform/api/errors";

export function BobSettingsPage() {
  const { can } = useBobAccess();
  const [importBusy, setImportBusy] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  async function handlePipelineReset() {
    const ok = window.confirm(
      'Type OK to wipe bob_recruitment and bob_students in Mongo. This cannot be undone.',
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
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800">
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
            the sidebar.
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
                Track assignments →
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
              Clears recruitment and student collections in Mongo (not Airtable).
              Requires confirm token on the API.
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
