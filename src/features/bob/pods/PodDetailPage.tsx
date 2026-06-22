"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { BobPod } from "@/platform/api/bob/pods";
import {
  useBobPodDetail,
  useUpdateBobPod,
} from "@/platform/query/hooks/useBobPods";
import { useBobStudentsList } from "@/platform/query/hooks/useBobStudents";
import { parseApiError } from "@/platform/api/errors";
import { Skeleton } from "@/components/Skeleton";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { BobPermissionGuard } from "@/platform/rbac/BobPermissionGuard";
import { useBobStaffList } from "../../../platform/query/hooks/useBobStaff";
import { StaffMemberSelect } from "./StaffMemberSelect";
import { staffForRole, resolveStaffLabel, podCoachIds, resolveStaffLabels } from "./staffDisplay";
import {
  BOB_MY_POD,
  BOB_POD_PLURAL,
  BOB_POD_SINGULAR,
  BOB_SITE_SUPPORTER,
  formatBobTrackDisplayLabel,
} from "@/lib/bobDisplayTerminology";

export function PodDetailPage() {
  const { can } = useBobAccess();
  const canEditPod = can("pods.edit");
  const params = useParams();
  const id = params?.id as string;
  const podQuery = useBobPodDetail(id);
  const studentsQuery = useBobStudentsList({ limit: 500, includeStats: false });
  const staffQuery = useBobStaffList();
  const updatePod = useUpdateBobPod();

  const [pod, setPod] = useState<BobPod | null>(null);
  const [editName, setEditName] = useState("");
  const [editSite, setEditSite] = useState("");
  const [editCoachId, setEditCoachId] = useState("");
  const [editSiteSupporterId, setEditSiteSupporterId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const [studentQuery, setStudentQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const allStudents = studentsQuery.data?.students ?? [];
  const loading = podQuery.isLoading;
  const error = podQuery.error ? parseApiError(podQuery.error) : formError;

  useEffect(() => {
    if (!podQuery.data) return;
    const p = podQuery.data;
    setPod(p);
    setEditName(p.displayLabel || p.name);
    setEditSite(p.site || "");
    setEditCoachId(p.coachId || "");
    setEditSiteSupporterId(p.siteSupporterId || "");
    setSelectedStudentIds(new Set(p.students || []));
  }, [podQuery.data]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return allStudents;
    return allStudents.filter((s) => {
      const name = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      const email = (s.email || "").toLowerCase();
      const school = (s.school || "").toLowerCase();
      return name.includes(q) || email.includes(q) || school.includes(q);
    });
  }, [allStudents, studentQuery]);

  const saving = updatePod.isPending;

  async function handleSavePod() {
    if (!pod) return;
    setFormError(null);
    try {
      const updated = await updatePod.mutateAsync({
        id: pod.id,
        data: {
          name: editName.trim() || pod.name,
          site: editSite.trim() || null,
          coachId: editCoachId || null,
          siteSupporterId: editSiteSupporterId || null,
        },
      });
      setPod(updated);
      setEditName(updated.displayLabel || updated.name);
      setEditSite(updated.site || "");
      setEditCoachId(updated.coachId || "");
      setEditSiteSupporterId(updated.siteSupporterId || "");
    } catch (err) {
      setFormError(parseApiError(err));
    }
  }

  async function handleSaveStudents() {
    if (!pod) return;
    setFormError(null);
    try {
      const updated = await updatePod.mutateAsync({
        id: pod.id,
        data: { students: Array.from(selectedStudentIds) },
      });
      setPod(updated);
      setSelectedStudentIds(new Set(updated.students || []));
    } catch (err) {
      setFormError(parseApiError(err));
    }
  }

  function toggleStudent(studentId: string) {
    if (!canEditPod) return;
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  if (loading) {
    return (
      <div>
        <PageHeader title={`Manage ${BOB_POD_SINGULAR.toLowerCase()}`} description={`Loading ${BOB_POD_SINGULAR.toLowerCase()}…`} />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !pod) {
    return (
      <div>
        <PageHeader title={`Manage ${BOB_POD_SINGULAR.toLowerCase()}`} />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || `${BOB_POD_SINGULAR} not found`}
        </div>
        <Link
          href="/app/bob/pods"
          className="mt-4 inline-block text-sm text-orange-600 hover:underline"
        >
          ← Back to {BOB_POD_PLURAL.toLowerCase()}
        </Link>
      </div>
    );
  }

  const staff = staffQuery.data?.staff ?? [];
  const resolve = (ref: string | null | undefined) =>
    resolveStaffLabel(staff, ref);
  const coachOptions = staffForRole(staff, "coach");
  const supporterOptions = staffForRole(staff, "site_supporter");

  const nameChanged =
    editName.trim() !== (pod.displayLabel || pod.name) ||
    editSite.trim() !== (pod.site || "") ||
    editCoachId !== (pod.coachId || "") ||
    editSiteSupporterId !== (pod.siteSupporterId || "");
  const studentsChanged =
    selectedStudentIds.size !== (pod.students?.length ?? 0) ||
    (pod.students || []).some((sid) => !selectedStudentIds.has(sid));

  const displayName = formatBobTrackDisplayLabel(
    pod.displayLabel || pod.name,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={displayName}
        description={`Assign coach, ${BOB_SITE_SUPPORTER.toLowerCase()}, and students. Changes sync to Airtable Programs.`}
        actions={
          <Link
            href="/app/bob/pods"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            ← All {BOB_POD_PLURAL.toLowerCase()}
          </Link>
        }
      />

      {pod.programYear || pod.syncedAt ? (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4">
          {pod.programYear ? (
            <div>
              <dt className="text-gray-500 text-xs uppercase tracking-wide">
                Program year
              </dt>
              <dd className="font-medium text-gray-900 mt-0.5">
                {pod.programYear}
              </dd>
            </div>
          ) : null}
          {pod.trackRole ? (
            <div>
              <dt className="text-gray-500 text-xs uppercase tracking-wide">
                Track / role
              </dt>
              <dd className="font-medium text-gray-900 mt-0.5">
                {pod.trackRole}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-gray-500 text-xs uppercase tracking-wide">
              Students assigned
            </dt>
            <dd className="font-medium text-gray-900 mt-0.5 tabular-nums">
              {pod.students?.length ?? 0}
            </dd>
          </div>
          {pod.syncedAt ? (
            <div>
              <dt className="text-gray-500 text-xs uppercase tracking-wide">
                Last synced
              </dt>
              <dd className="font-medium text-gray-900 mt-0.5">
                {new Date(pod.syncedAt).toLocaleString()}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">{BOB_POD_SINGULAR} details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              readOnly={!canEditPod}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site
            </label>
            <input
              type="text"
              value={editSite}
              onChange={(e) => setEditSite(e.target.value)}
              readOnly={!canEditPod}
              placeholder="Site or location"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50"
            />
          </div>
          <StaffMemberSelect
            label="Coach"
            hint={`Controls ${BOB_MY_POD} access and coach-scoped views.`}
            value={editCoachId}
            onChange={setEditCoachId}
            staff={coachOptions.length ? coachOptions : staff}
            disabled={!canEditPod}
          />
          <StaffMemberSelect
            label={BOB_SITE_SUPPORTER}
            hint={`Can mark attendance for this ${BOB_POD_SINGULAR.toLowerCase()}.`}
            value={editSiteSupporterId}
            onChange={setEditSiteSupporterId}
            staff={supporterOptions.length ? supporterOptions : staff}
            disabled={!canEditPod}
          />
        </div>

        {!canEditPod && (podCoachIds(pod).length || pod.siteSupporterId) ? (
          <p className="text-sm text-gray-600">
            Coaches: {resolveStaffLabels(staff, podCoachIds(pod))} · Track
            supporter: {resolve(pod.siteSupporterId)}
          </p>
        ) : null}

        {pod.staffLabels?.length ? (
          <p className="text-xs text-gray-500">
            Airtable staff: {pod.staffLabels.join(", ")}
          </p>
        ) : null}

        {staffQuery.isLoading ? (
          <p className="text-xs text-gray-500">Loading staff directory…</p>
        ) : staff.length === 0 ? (
          <p className="text-xs text-amber-700">
            No BoB staff users found. Add Dent users with coach or track
            supporter roles to assign them here.
          </p>
        ) : null}

        <BobPermissionGuard permission="pods.edit" silent>
          {nameChanged ? (
            <button
              type="button"
              onClick={() => void handleSavePod()}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? "Saving…" : "Save track details"}
            </button>
          ) : null}
        </BobPermissionGuard>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Student roster
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Select students assigned to this track. Saves sync to Airtable when
            roster students are linked.
          </p>
        </div>

        <input
          type="text"
          value={studentQuery}
          onChange={(e) => setStudentQuery(e.target.value)}
          placeholder="Search by name, email, or school…"
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />

        <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-80 overflow-y-auto">
          {filteredStudents.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedStudentIds.has(s.id)}
                onChange={() => toggleStudent(s.id)}
                disabled={!canEditPod}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 disabled:opacity-50"
              />
              <span className="text-sm font-medium text-gray-900">
                {s.firstName} {s.lastName}
              </span>
              {s.email ? (
                <span className="text-xs text-gray-500 truncate">{s.email}</span>
              ) : null}
            </li>
          ))}
        </ul>

        {allStudents.length === 0 ? (
          <p className="text-sm text-gray-500">
            No students in roster yet.{" "}
            <Link href="/app/bob/roster" className="text-orange-600 hover:underline">
              Open roster
            </Link>
          </p>
        ) : null}
        {allStudents.length > 0 && filteredStudents.length === 0 ? (
          <p className="text-sm text-gray-500">No students match your search.</p>
        ) : null}

        <BobPermissionGuard permission="pods.edit" silent>
          {studentsChanged ? (
            <button
              type="button"
              onClick={() => void handleSaveStudents()}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? "Saving…" : "Save student assignment"}
            </button>
          ) : null}
        </BobPermissionGuard>
      </section>
    </div>
  );
}
