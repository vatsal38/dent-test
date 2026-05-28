"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { BobPod } from "@/platform/api/bob/pods";
import type { BobStudent } from "@/platform/api/bob/students";
import {
  useBobPodDetail,
  useUpdateBobPod,
} from "@/platform/query/hooks/useBobPods";
import { useBobStudentsList } from "@/platform/query/hooks/useBobStudents";
import { parseApiError } from "@/platform/api/errors";
import { Skeleton } from "@/components/Skeleton";
import { useBobAccess } from "@/platform/rbac/useBobAccess";
import { BobPermissionGuard } from "@/platform/rbac/BobPermissionGuard";
import { PodDashboardPanel } from "@/features/bob/dashboard/PodDashboardPanel";
import { useBobStaffList } from "../../../platform/query/hooks/useBobStaff";
import { StaffMemberSelect } from "./StaffMemberSelect";
import { staffForRole } from "./staffDisplay";

export function PodDetailPage() {
  const { can } = useBobAccess();
  const canEditPod = can("pods.edit");
  const params = useParams();
  const id = params?.id as string;
  const podQuery = useBobPodDetail(id);
  const studentsQuery = useBobStudentsList({ limit: 500 });
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
    setEditName(p.name);
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
      setEditName(updated.name);
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
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-4 w-40 mb-6" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <Skeleton className="h-7 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-28" rounded="lg" />
            <Skeleton className="h-10 w-24" rounded="lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <Skeleton className="h-5 w-44 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" rounded="lg" />
                <Skeleton className="h-10 w-full" rounded="lg" />
                <Skeleton className="h-10 w-full" rounded="lg" />
              </div>
              <Skeleton className="h-10 w-32 mt-4" rounded="lg" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <Skeleton className="h-5 w-40 mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-4 h-4" rounded="sm" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-28 mt-4" rounded="lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !pod) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || "Pod not found"}
        </div>
        <Link
          href="/app/bob/pods"
          className="mt-4 inline-block text-sm text-orange-600 hover:underline"
        >
          ← Back to Pods
        </Link>
      </div>
    );
  }

  const studentsInPod = (pod.students || [])
    .map((sid) => allStudents.find((s) => s.id === sid))
    .filter(Boolean) as BobStudent[];
  const staff = staffQuery.data?.staff ?? [];
  const coachOptions = staffForRole(staff, "coach");
  const supporterOptions = staffForRole(staff, "site_supporter");

  const nameChanged =
    editName.trim() !== pod.name ||
    editSite.trim() !== (pod.site || "") ||
    editCoachId !== (pod.coachId || "") ||
    editSiteSupporterId !== (pod.siteSupporterId || "");
  const studentsChanged =
    selectedStudentIds.size !== (pod.students?.length ?? 0) ||
    (pod.students || []).some((sid) => !selectedStudentIds.has(sid));

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/app/bob/pods"
          className="text-sm text-orange-600 hover:underline"
        >
          ← Back to Pods
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Pod: {pod.name}</h1>

        {/* Pod details */}
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
              placeholder="Location / site name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50"
            />
          </div>
          <StaffMemberSelect
            label="Coach"
            hint="Controls My Pod access and coach-scoped views."
            value={editCoachId}
            onChange={setEditCoachId}
            staff={coachOptions.length ? coachOptions : staff}
            disabled={!canEditPod}
          />
          <StaffMemberSelect
            label="Site supporter"
            hint="Can mark attendance for this pod."
            value={editSiteSupporterId}
            onChange={setEditSiteSupporterId}
            staff={supporterOptions.length ? supporterOptions : staff}
            disabled={!canEditPod}
          />
        </div>
        {staffQuery.isLoading ? (
          <p className="text-xs text-gray-500">Loading staff directory…</p>
        ) : staff.length === 0 ? (
          <p className="text-xs text-amber-700">
            No BoB staff users found. Add Dent users with coach or site
            supporter roles to assign them here.
          </p>
        ) : null}
        <BobPermissionGuard permission="pods.edit" silent>
          {nameChanged && (
            <button
              type="button"
              onClick={handleSavePod}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? "Saving…" : "Save pod details"}
            </button>
          )}
        </BobPermissionGuard>

        {/* Students in this pod */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Students in this pod
          </h2>
          <p className="text-sm text-gray-600 mb-3">
            Select students to assign to this pod. Changes save below.
          </p>
          <input
            type="text"
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
            placeholder="Search students by name, email, school…"
            className="mb-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {filteredStudents.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedStudentIds.has(s.id)}
                  onChange={() => toggleStudent(s.id)}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  {s.firstName} {s.lastName}
                </span>
                {s.email && (
                  <span className="text-xs text-gray-500">{s.email}</span>
                )}
              </li>
            ))}
          </ul>
          {allStudents.length === 0 && (
            <p className="text-sm text-gray-500 py-2">
              No students in roster yet.
            </p>
          )}
          {allStudents.length > 0 && filteredStudents.length === 0 && (
            <p className="text-sm text-gray-500 py-2">
              No students match your search.
            </p>
          )}
          <BobPermissionGuard permission="pods.edit" silent>
            {studentsChanged && (
              <button
                type="button"
                onClick={handleSaveStudents}
                disabled={saving}
                className="mt-3 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
              >
                {saving ? "Saving…" : "Save student assignment"}
              </button>
            )}
          </BobPermissionGuard>
        </div>
      </div>

      {pod ? <PodDashboardPanel podId={pod.id} podName={pod.name} /> : null}
    </div>
  );
}
