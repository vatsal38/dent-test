"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { KpiGrid, type KpiItem } from "@/design-system/patterns/KpiGrid";
import {
  attendanceSummary,
  initialsOf,
  milestoneSummary,
  studentDisplayName,
} from "@/features/bob/roster/recordDisplay";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
import { useBobPodDetail } from "@/platform/query/hooks/useBobPods";
import { useBobStudentsList } from "@/platform/query/hooks/useBobStudents";
import { Skeleton } from "@/components/Skeleton";

export function CoachPodPage() {
  const { data: me, isLoading: meLoading } = useBobMe();
  const podId = me?.primaryPod?.id ?? null;
  const { data: pod, isLoading: podLoading } = useBobPodDetail(podId);

  const { data: studentsRes, isLoading: studentsLoading } = useBobStudentsList({
    limit: 500,
    includeAirtableFields: true,
  });

  const students = useMemo(() => {
    if (!pod?.students?.length) return [];
    const ids = new Set(pod.students);
    return (studentsRes?.students ?? []).filter((s) => ids.has(s.id));
  }, [pod?.students, studentsRes?.students]);

  const needsAttention = students.filter(
    (s) =>
      (s.milestoneStats?.submitted ?? 0) === 0 ||
      (s.attendanceStats?.absent ?? 0) >= 2,
  );

  const kpis: KpiItem[] = [
    {
      id: "students",
      label: "Students in pod",
      value: students.length,
      href: pod ? `/app/bob/roster?pod=${pod.id}` : "/app/bob/roster",
    },
    {
      id: "attention",
      label: "Needs attention",
      value: needsAttention.length,
      href: "/app/bob/roster",
    },
    {
      id: "attendance",
      label: "Mark attendance",
      value: "→",
      href: pod
        ? `/app/bob/attendance/mark?pod=${encodeURIComponent(pod.id)}`
        : "/app/bob/attendance/mark",
    },
    {
      id: "submit",
      label: "Log incident",
      value: "→",
      href: "/app/bob/submit",
    },
  ];

  const loading = meLoading || podLoading || studentsLoading;

  if (loading && !pod) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!pod) {
    return (
      <div>
        <PageHeader
          eyebrow="Coach home"
          title="My pod"
          description="No pod is assigned to your account yet."
        />
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-700">
            Ask an admin to set your email or user id on a pod&apos;s coach field in{" "}
            <Link href="/app/bob/pods" className="text-orange-600 font-medium">
              Pods
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Coach home"
        title={pod.name}
        description="Your students today — attendance, deliverables, and quick actions."
        actions={
          <>
            <Link
              href={`/app/bob/attendance/mark?pod=${encodeURIComponent(pod.id)}`}
              className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
            >
              Mark attendance
            </Link>
            <Link
              href={`/app/bob/pods/${pod.id}`}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium"
            >
              Pod settings
            </Link>
          </>
        }
      />

      <section className="mb-8">
        <KpiGrid items={kpis} loading={loading} columns={4} />
      </section>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Students ({students.length})
          </h2>
          <Link
            href={`/app/bob/roster?pod=${pod.id}`}
            className="text-sm text-orange-600 font-medium"
          >
            View roster →
          </Link>
        </div>
        {students.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No students assigned yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {students.map((s) => {
              const name = studentDisplayName(s);
              const attention = needsAttention.some((x) => x.id === s.id);
              return (
                <li key={s.id}>
                  <Link
                    href={`/app/bob/roster?id=${s.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50/50"
                  >
                    <span className="w-9 h-9 rounded-lg bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {initialsOf(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {name}
                        {attention ? (
                          <span className="ml-2 text-xs font-normal text-red-600">
                            Needs attention
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-gray-500">
                        {attendanceSummary(s)} · {milestoneSummary(s)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
