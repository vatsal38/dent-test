'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getBobAttendance, getBobPods, getBobStudents, BobAttendance, BobPod, BobStudent } from '@/lib/api';

function getWeekMonday(d: Date): string {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date.toISOString().slice(0, 10);
}

function getWeekSunday(mondayISO: string): string {
    const d = new Date(mondayISO);
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
}

interface DiscrepancyRow {
    id: string;
    studentId: string;
    studentName: string;
    podId: string;
    podName: string;
    date: string;
    type: string;
    status: 'open' | 'resolved';
}

export default function DiscrepanciesPage() {
    const [attendance, setAttendance] = useState<BobAttendance[]>([]);
    const [pods, setPods] = useState<BobPod[]>([]);
    const [students, setStudents] = useState<BobStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [weekOf, setWeekOf] = useState(() => getWeekMonday(new Date()));
    const startDate = useMemo(() => weekOf, [weekOf]);
    const endDate = useMemo(() => getWeekSunday(weekOf), [weekOf]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [attRes, podsRes, studentsRes] = await Promise.all([
                getBobAttendance({ startDate, endDate, limit: 500 }),
                getBobPods({ limit: 100 }),
                getBobStudents({ limit: 500 }),
            ]);
            setAttendance(attRes.attendance);
            setPods(podsRes.pods);
            setStudents(studentsRes.students);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load discrepancies');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
    const podMap = useMemo(() => new Map(pods.map((p) => [p.id, p])), [pods]);

    const expectedByDay = useMemo(() => {
        const set = new Set<string>();
        pods.forEach((p) => {
            (p.students || []).forEach((studentId) => {
                for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().slice(0, 10);
                    set.add(`${p.id}|${studentId}|${dateStr}`);
                }
            });
        });
        return set;
    }, [pods, startDate, endDate]);

    const attendanceByKey = useMemo(() => {
        const map = new Map<string, BobAttendance>();
        attendance.forEach((a) => map.set(`${a.podId}|${a.studentId}|${a.date}`, a));
        return map;
    }, [attendance]);

    const discrepancies = useMemo((): DiscrepancyRow[] => {
        const list: DiscrepancyRow[] = [];
        expectedByDay.forEach((key) => {
            const hasRecord = attendanceByKey.has(key);
            if (!hasRecord) {
                const [podId, studentId, date] = key.split('|');
                const student = studentMap.get(studentId);
                const pod = podMap.get(podId);
                list.push({
                    id: key,
                    studentId,
                    studentName: student ? `${student.firstName} ${student.lastName}` : studentId,
                    podId,
                    podName: pod?.name ?? podId,
                    date,
                    type: 'Missing clock-in',
                    status: 'open',
                });
            }
        });
        return list.sort((a, b) => a.date.localeCompare(b.date) || a.studentName.localeCompare(b.studentName));
    }, [expectedByDay, attendanceByKey, studentMap, podMap]);

    const openCount = discrepancies.filter((d) => d.status === 'open').length;
    const resolvedCount = 0;

    function handleExportYW() {
        const headers = ['Date', 'Pod', 'Student', 'Status'];
        const rows = attendance.map((a) => {
            const pod = podMap.get(a.podId);
            const student = studentMap.get(a.studentId);
            return [
                a.date,
                pod?.name ?? '',
                student ? `${student.firstName} ${student.lastName}`.trim() : '',
                a.status,
            ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
        });
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yw-attendance-${startDate}-${endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
                <Link href="/app/bob/attendance" className="mt-4 inline-block text-sm text-orange-600 hover:underline">← Back to Attendance</Link>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <Link href="/app/bob/attendance" className="text-sm text-orange-600 hover:text-orange-700 hover:underline">← Back to Attendance</Link>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payroll Discrepancies</h1>
                    <p className="text-gray-600">Missing clock-ins and flagged records for resolution.</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Week of:</label>
                    <input
                        type="date"
                        value={weekOf}
                        onChange={(e) => setWeekOf(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button
                        type="button"
                        onClick={handleExportYW}
                        disabled={attendance.length === 0}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export YW Report
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Open this week</p>
                    <p className="text-2xl font-bold text-orange-600">{openCount}</p>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Unreviewed</p>
                    <p className="text-2xl font-bold text-gray-900">{openCount}</p>
                </div>
            </div>

            {/* Discrepancy list */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Discrepancy list</h2>
                    {discrepancies.length > 0 && (
                        <span className="text-sm text-gray-500">{discrepancies.length} missing clock-in(s)</span>
                    )}
                </div>
                {discrepancies.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No open discrepancies for this week. Missing clock-ins will appear here after sync.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pod</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {discrepancies.map((d) => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.studentName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{d.date}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{d.podName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{d.type}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">Open</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/app/bob/attendance/mark?pod=${d.podId}&date=${d.date}`}
                                            className="text-sm font-medium text-orange-600 hover:text-orange-700"
                                        >
                                            Resolve →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>
        </div>
    );
}
