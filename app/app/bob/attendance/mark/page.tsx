'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    getBobPods,
    getBobPod,
    getBobAttendance,
    getBobStudents,
    createBobAttendance,
    BobPod,
    BobStudent,
    BOB_ATTENDANCE_STATUSES,
    BobAttendanceStatus,
} from '@/lib/api';
import { Skeleton } from '@/components/Skeleton';

const STATUS_LABELS: Record<BobAttendanceStatus, string> = {
    present: 'Present',
    absent: 'Absent',
    excused: 'Excused',
    late: 'Late',
};

export default function MarkAttendancePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pods, setPods] = useState<BobPod[]>([]);
    const [selectedPodId, setSelectedPodId] = useState(() => searchParams?.get('pod') || '');
    const [selectedDate, setSelectedDate] = useState(() => searchParams?.get('date') || new Date().toISOString().slice(0, 10));
    const [pod, setPod] = useState<BobPod | null>(null);
    const [studentDetails, setStudentDetails] = useState<BobStudent[]>([]);
    const [existingByStudent, setExistingByStudent] = useState<Map<string, { id: string; status: BobAttendanceStatus }>>(new Map());
    const [statusByStudent, setStatusByStudent] = useState<Map<string, BobAttendanceStatus>>(new Map());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPods = useCallback(async () => {
        try {
            const res = await getBobPods({ limit: 100 });
            setPods(res.pods);
            if (res.pods.length > 0 && !selectedPodId) setSelectedPodId(res.pods[0].id);
        } catch {
            setError('Failed to load pods');
        }
    }, [selectedPodId]);

    useEffect(() => {
        loadPods();
    }, [loadPods]);

    useEffect(() => {
        if (!selectedPodId || !selectedDate) {
            setPod(null);
            setStudentDetails([]);
            setExistingByStudent(new Map());
            setStatusByStudent(new Map());
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        (async () => {
            try {
                const [podRes, attRes, studentsRes] = await Promise.all([
                    getBobPod(selectedPodId),
                    getBobAttendance({ podId: selectedPodId, date: selectedDate, limit: 200 }),
                    getBobStudents({ limit: 500 }),
                ]);
                if (cancelled) return;
                setPod(podRes);
                const studentIds = podRes.students || [];
                const studentIdSet = new Set(studentIds);
                const details = studentsRes.students.filter((s) => studentIdSet.has(s.id));
                setStudentDetails(details);
                const existing = new Map<string, { id: string; status: BobAttendanceStatus }>();
                const statusBy = new Map<string, BobAttendanceStatus>();
                for (const a of attRes.attendance) {
                    existing.set(a.studentId, { id: a.id, status: a.status });
                    statusBy.set(a.studentId, a.status);
                }
                for (const sid of studentIds) {
                    if (!statusBy.has(sid)) statusBy.set(sid, 'present');
                }
                setExistingByStudent(existing);
                setStatusByStudent(statusBy);
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [selectedPodId, selectedDate]);

    async function handleSave() {
        if (!pod || !selectedDate) return;
        setSaving(true);
        setError(null);
        try {
            for (const [studentId, status] of statusByStudent) {
                await createBobAttendance({ studentId, date: selectedDate, podId: pod.id, status });
            }
            router.push('/app/bob/attendance');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    function setStatusForStudent(studentId: string, status: BobAttendanceStatus) {
        setStatusByStudent((prev) => {
            const next = new Map(prev);
            next.set(studentId, status);
            return next;
        });
    }

    if (pods.length === 0 && !loading) {
        return (
            <div className="px-6 py-8">
                <Link href="/app/bob/attendance" className="text-sm text-orange-600 hover:underline">← Back to Attendance</Link>
                <div className="mt-6 p-6 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                    You don’t have any pods where you can mark attendance. Create a pod from the Pods page and add students to mark attendance.
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 py-8">
            <div className="max-w-3xl">
            <div className="mb-6">
                <Link href="/app/bob/attendance" className="text-sm text-orange-600 hover:underline">← Back to Attendance</Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mark attendance</h1>
            <p className="text-gray-600 mb-6">Select a pod and date, then set each student’s status. Saving creates or updates records for that day.</p>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pod</label>
                        <select
                            value={selectedPodId}
                            onChange={(e) => setSelectedPodId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="">Select pod</option>
                            {pods.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                </div>

                {loading && (
                    <div className="flex justify-center py-8">
                        <div className="w-full max-w-2xl space-y-3">
                            <Skeleton className="h-4 w-48 mx-auto" />
                            <div className="space-y-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-gray-200 bg-white">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-56" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-8 w-16" rounded="lg" />
                                            <Skeleton className="h-8 w-16" rounded="lg" />
                                            <Skeleton className="h-8 w-16" rounded="lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {!loading && pod && (
                    <>
                        <h2 className="text-lg font-semibold text-gray-900 pt-2">Students</h2>
                        {(pod.students?.length ?? 0) === 0 ? (
                            <p className="text-sm text-gray-500">No students in this pod. Assign students from the pod page.</p>
                        ) : (
                            <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                                {(pod.students || []).map((studentId) => {
                                    const s = studentDetails.find((x) => x.id === studentId);
                                    const label = s ? `${s.firstName} ${s.lastName}` : studentId;
                                    return (
                                        <li key={studentId} className="flex items-center justify-between px-3 py-3">
                                            <span className="text-sm font-medium text-gray-900">{label}</span>
                                            <select
                                                value={statusByStudent.get(studentId) ?? 'present'}
                                                onChange={(e) => setStatusForStudent(studentId, e.target.value as BobAttendanceStatus)}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                {BOB_ATTENDANCE_STATUSES.map((st) => (
                                                    <option key={st} value={st}>{STATUS_LABELS[st]}</option>
                                                ))}
                                            </select>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving || (pod.students?.length ?? 0) === 0}
                                className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
                            >
                                {saving ? 'Saving…' : 'Save attendance'}
                            </button>
                            <Link
                                href="/app/bob/attendance"
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                            >
                                Cancel
                            </Link>
                        </div>
                    </>
                )}
            </div>
            </div>
        </div>
    );
}