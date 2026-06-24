"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { useCreateBobPod } from "@/platform/query/hooks/useBobPods";
import { useBobStaffList } from "@/platform/query/hooks/useBobStaff";
import { StaffMemberSelect } from "@/features/bob/pods/StaffMemberSelect";
import { staffForRole } from "@/features/bob/pods/staffDisplay";
import { parseApiError } from "@/platform/api/errors";
import { getBobTrackFormOptions } from "@/platform/api/bob/pods";
import { Skeleton } from "@/components/Skeleton";
import {
  BOB_POD_SINGULAR,
  BOB_SITE_SUPPORTER,
} from "@/lib/bobDisplayTerminology";

export function PodCreatePage() {
  const router = useRouter();
  const createPod = useCreateBobPod();
  const staffQuery = useBobStaffList();
  const [name, setName] = useState("");
  const [trackRole, setTrackRole] = useState("");
  const [site, setSite] = useState("");
  const [program, setProgram] = useState("");
  const [coachId, setCoachId] = useState("");
  const [siteSupporterId, setSiteSupporterId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [trackRoles, setTrackRoles] = useState<string[]>([]);
  const [sites, setSites] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    getBobTrackFormOptions()
      .then((opts) => {
        if (cancelled) return;
        setTrackRoles(opts.trackRoles);
        setSites(opts.sites);
        setPrograms(opts.programs);
        setProgram(opts.defaultProgram);
      })
      .catch(() => {
        if (!cancelled) setPrograms(["Bet on Baltimore"]);
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const staff = staffQuery.data?.staff ?? [];
  const coachOptions = staffForRole(staff, "coach");
  const supporterOptions = staffForRole(staff, "site_supporter");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Track name is required.");
      return;
    }
    try {
      const pod = await createPod.mutateAsync({
        name: trimmedName,
        trackRole: trackRole.trim() || trimmedName,
        site: site.trim() || null,
        program: program.trim() || null,
        coachId: coachId || null,
        siteSupporterId: siteSupporterId || null,
      });
      router.push(`/app/bob/pods/${pod.id}`);
    } catch (err) {
      setError(parseApiError(err));
    }
  }

  if (optionsLoading) {
    return (
      <div>
        <PageHeader title={`Create ${BOB_POD_SINGULAR.toLowerCase()}`} description="Adds a row to Airtable Programs and Dent." />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <PageHeader
        title={`Create ${BOB_POD_SINGULAR.toLowerCase()}`}
        description={`Creates the ${BOB_POD_SINGULAR.toLowerCase()} in Airtable Programs and in Dent. Assign coach and students on the next screen.`}
      />
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 bg-white border border-gray-200 rounded-lg p-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {BOB_POD_SINGULAR} name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g. Made@Dent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Track / role (Airtable)
          </label>
          <input
            type="text"
            list="track-role-options"
            value={trackRole}
            onChange={(e) => setTrackRole(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Defaults to track name"
          />
          <datalist id="track-role-options">
            {trackRoles.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
          <p className="text-xs text-gray-500 mt-1">
            Must match an Airtable Programs choice when possible.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Program
          </label>
          <select
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {programs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site (optional)
          </label>
          <input
            type="text"
            list="site-options"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <datalist id="site-options">
            {sites.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <StaffMemberSelect
          label="Coach (optional)"
          value={coachId}
          onChange={setCoachId}
          staff={coachOptions.length ? coachOptions : staff}
        />
        <StaffMemberSelect
          label={`${BOB_SITE_SUPPORTER} (optional)`}
          value={siteSupporterId}
          onChange={setSiteSupporterId}
          staff={supporterOptions.length ? supporterOptions : staff}
        />

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={createPod.isPending}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {createPod.isPending ? "Creating…" : `Create ${BOB_POD_SINGULAR.toLowerCase()}`}
          </button>
          <Link
            href="/app/bob/pods"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
