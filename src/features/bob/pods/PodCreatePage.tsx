"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { useCreateBobPod } from "@/platform/query/hooks/useBobPods";
import { useBobStaffList } from "@/platform/query/hooks/useBobStaff";
import { StaffMemberSelect } from "@/features/bob/pods/StaffMemberSelect";
import { staffForRole } from "@/features/bob/pods/staffDisplay";
import { parseApiError } from "@/platform/api/errors";

export function PodCreatePage() {
  const router = useRouter();
  const createPod = useCreateBobPod();
  const staffQuery = useBobStaffList();
  const [name, setName] = useState("");
  const [site, setSite] = useState("");
  const [coachId, setCoachId] = useState("");
  const [siteSupporterId, setSiteSupporterId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const staff = staffQuery.data?.staff ?? [];
  const coachOptions = staffForRole(staff, "coach");
  const supporterOptions = staffForRole(staff, "site_supporter");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Pod name is required.");
      return;
    }
    try {
      const pod = await createPod.mutateAsync({
        name: trimmedName,
        site: site.trim() || null,
        coachId: coachId || null,
        siteSupporterId: siteSupporterId || null,
        students: [],
      });
      router.push(`/app/bob/pods/${pod.id}`);
    } catch (err) {
      setError(parseApiError(err));
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Create pod"
        description="Create a pod in Dent and assign coach and site supporter from your staff directory."
        actions={
          <Link
            href="/app/bob/pods"
            className="text-sm text-orange-600 hover:underline"
          >
            ← Back to Pods
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pod name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site (optional)
          </label>
          <input
            type="text"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="e.g. Harbor East"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StaffMemberSelect
            label="Coach"
            hint="BoB user with coach role — controls My Pod access."
            value={coachId}
            onChange={setCoachId}
            staff={coachOptions.length ? coachOptions : staff}
          />
          <StaffMemberSelect
            label="Site supporter"
            hint="Can mark attendance for this pod."
            value={siteSupporterId}
            onChange={setSiteSupporterId}
            staff={supporterOptions.length ? supporterOptions : staff}
          />
        </div>
        {staffQuery.isLoading ? (
          <p className="text-xs text-gray-500">Loading staff directory…</p>
        ) : staff.length === 0 ? (
          <p className="text-xs text-amber-700">
            No staff users found. Add BoB users with coach or site supporter roles
            in Settings, or sync from your user admin.
          </p>
        ) : null}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={createPod.isPending}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
          >
            {createPod.isPending ? "Creating…" : "Create pod"}
          </button>
          <Link
            href="/app/bob/pods"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
