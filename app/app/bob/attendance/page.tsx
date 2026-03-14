'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
    getBobAttendance,
    getBobPods,
    getBobStudents,
    BobAttendance,
    BobPod,
    BobStudent,
    BobAttendanceStatus,
} from '@/lib/api';

const STATUS_LABELS: Record<BobAttendanceStatus, string> = {
    present: 'Present',
    absent: 'Absent',
    excused: 'Excused',
    late: 'Late',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function getDaysInRange(startISO: string, endISO: string): string[] {
    const out: string[] = [];
    const start = new Date(startISO);
    const end = new Date(endISO);
    for (let t = start.getTime(); t <= end.getTime(); t += 24 * 60 * 60 * 1000) {
        out.push(new Date(t).toISOString().slice(0, 10));
    }
    return out;
}

export default function AttendancePage() {
    const [data, setData] = useState<{ attendance: BobAttendance[]; total: number } | null>(null);
    const [pods, setPods] = useState<BobPod[]>([]);
    const [students, setStudents] = useState<BobStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [podFilter, setPodFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [weekOf, setWeekOf] = useState(() => getWeekMonday(new Date()));
    const [startDate, setStartDate] = useState(() => {
        const mon = getWeekMonday(new Date());
        return mon;
    });
    const [endDate, setEndDate] = useState(() => getWeekSunday(getWeekMonday(new Date())));
    const [loadedAt, setLoadedAt] = useState<Date | null>(null);
    const [dayDetail, setDayDetail] = useState<{ studentId: string; podId: string; date: string } | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: { podId?: string; date?: string; startDate?: string; endDate?: string; limit: number } = { limit: 200 };
            if (podFilter) params.podId = podFilter;
            if (dateFilter) params.date = dateFilter;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const [attRes, podsRes, studentsRes] = await Promise.all([
                getBobAttendance(params),
                getBobPods({ limit: 100 }),
                getBobStudents({ limit: 500 }),
            ]);
            setData({ attendance: attRes.attendance, total: attRes.total });
            setPods(podsRes.pods);
            setStudents(studentsRes.students);
            setLoadedAt(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load attendance');
        } finally {
            setLoading(false);
        }
    }, [podFilter, dateFilter, startDate, endDate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const studentMap = new Map(students.map((s) => [s.id, s]));
    const podMap = new Map(pods.map((p) => [p.id, p]));

    const dayDates = useMemo(() => {
        if (!startDate || !endDate) return [];
        return getDaysInRange(startDate, endDate);
    }, [startDate, endDate]);
    const isWeekView = dayDates.length >= 1 && dayDates.length <= 7;

    const applyWeekFilter = useCallback(() => {
        const mon = getWeekMonday(new Date(weekOf));
        setStartDate(mon);
        setEndDate(getWeekSunday(mon));
        setDateFilter('');
    }, [weekOf]);

    const attendanceByKey = useMemo(() => {
        const map = new Map<string, BobAttendance>();
        data?.attendance?.forEach((a) => map.set(`${a.podId}|${a.studentId}|${a.date}`, a));
        return map;
    }, [data?.attendance]);

    const expectedStudentIds = useMemo(() => {
        const set = new Set<string>();
        const podsToUse = podFilter ? pods.filter((p) => p.id === podFilter) : pods;
        podsToUse.forEach((p) => (p.students || []).forEach((id) => set.add(id)));
        return set;
    }, [pods, podFilter]);

    const missingByDay = useMemo(() => {
        const byDay: Record<string, number> = {};
        dayDates.forEach((d) => {
            let count = 0;
            expectedStudentIds.forEach((studentId) => {
                const podIdsToCheck = podFilter ? [podFilter] : pods.map((p) => p.id);
                const hasRecord = podIdsToCheck.some((podId) => attendanceByKey.has(`${podId}|${studentId}|${d}`));
                if (!hasRecord) count++;
            });
            byDay[d] = count;
        });
        return byDay;
    }, [dayDates, expectedStudentIds, attendanceByKey, podFilter, pods]);

    const missingTotal = useMemo(() => {
        const daysWithMissing = Object.entries(missingByDay).filter(([, c]) => c > 0);
        return daysWithMissing;
    }, [missingByDay]);

    const weekTableRows = useMemo(() => {
        const list: { studentId: string; podId: string }[] = [];
        const podsToUse = podFilter ? pods.filter((p) => p.id === podFilter) : pods;
        const seen = new Set<string>();
        podsToUse.forEach((p) => {
            (p.students || []).forEach((studentId) => {
                const key = `${p.id}|${studentId}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    list.push({ studentId, podId: p.id });
                }
            });
        });
        return list;
    }, [pods, podFilter]);

    const totalMissingToday = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return Object.entries(missingByDay).find(([d]) => d === today)?.[1] ?? 0;
    }, [missingByDay]);

    const WEEK_TABS = useMemo(() => {
        const base = getWeekMonday(new Date());
        const out: { label: string; weekOf: string }[] = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(base);
            d.setDate(d.getDate() - 7 * (2 - i));
            out.push({ label: `Week ${i + 1}`, weekOf: getWeekMonday(d) });
        }
        return out;
    }, []);

    function handleExportReport() {
        if (!data?.attendance?.length) return;
        const headers = ['Date', 'Pod', 'Student', 'Status'];
        const rows = data.attendance.map((a) => {
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
        a.download = `attendance-report-${startDate || 'range'}-${endDate || ''}.csv`;
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
            </div>
        );
    }

    return (
        <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
                    <p className="text-gray-600">View and mark attendance by week.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={loadData} disabled={loading} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Sync Now
                    </button>
                    <span className="text-xs text-gray-500">Last synced {loadedAt ? `${Math.max(1, Math.floor((Date.now() - loadedAt.getTime()) / 60000))}m ago` : '—'}</span>
                    <button
                        type="button"
                        onClick={handleExportReport}
                        disabled={!data?.attendance?.length}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export YW Report
                    </button>
                    <Link
                        href="/app/bob/attendance/mark"
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm font-medium"
                    >
                        Mark attendance
                    </Link>
                </div>
            </div>

            {/* Missing clock-ins banner */}
            {totalMissingToday > 0 && (
                <div className="mb-4 flex items-center justify-between px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
                    <span className="flex items-center gap-2 text-sm font-medium">
                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {totalMissingToday} missing clock-ins today — Review Now
                    </span>
                    <Link href="/app/bob/attendance/discrepancies" className="text-sm font-medium text-red-700 hover:underline">Go to discrepancies →</Link>
                </div>
            )}

            {/* Week filter tabs */}
            <div className="mb-4 flex items-center gap-1 border-b border-gray-200">
                {WEEK_TABS.map((w) => {
                    const isActive = weekOf === w.weekOf;
                    return (
                        <button
                            key={w.weekOf}
                            type="button"
                            onClick={() => { setWeekOf(w.weekOf); setStartDate(w.weekOf); setEndDate(getWeekSunday(w.weekOf)); setDateFilter(''); }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${isActive ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                        >
                            {w.label}
                        </button>
                    );
                })}
                <button
                    type="button"
                    onClick={() => { setStartDate(''); setEndDate(''); setDateFilter(''); }}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${!startDate && !dateFilter ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                >
                    All
                </button>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-4">
                <select
                    value={podFilter}
                    onChange={(e) => setPodFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="">All pods</option>
                    {pods.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">Week of:</span>
                    <input
                        type="date"
                        value={weekOf}
                        onChange={(e) => setWeekOf(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button
                        type="button"
                        onClick={applyWeekFilter}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                        Apply week
                    </button>
                </div>
                <span className="text-gray-500 text-sm">or single date:</span>
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setStartDate(''); setEndDate(''); }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <span className="text-gray-500 text-sm">or range:</span>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
            </div>

            {/* Week view: day columns */}
            {isWeekView && dayDates.length > 0 && (
                <div className="mb-6 bg-white border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">Student</th>
                                {dayDates.map((d) => {
                                    const dayName = DAY_NAMES[new Date(d).getDay()];
                                    const missing = missingByDay[d] ?? 0;
                                    const m = Number(d.slice(5, 7));
                                    const day = Number(d.slice(8, 10));
                                    return (
                                        <th key={d} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                            {dayName} {m}/{day}
                                            {missing > 0 && <span className="block text-red-600 font-normal normal-case">{missing} missing</span>}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {weekTableRows.map(({ studentId, podId }) => {
                                const student = studentMap.get(studentId);
                                const pod = podMap.get(podId);
                                const initial = student ? (student.firstName?.[0] || '') + (student.lastName?.[0] || '') || '?' : '?';
                                return (
                                    <tr key={`${podId}-${studentId}`} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 sticky left-0 bg-white">
                                            <div className="flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                                                    {initial}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{student ? `${student.firstName} ${student.lastName}` : studentId}</p>
                                                    <p className="text-xs text-gray-500">{student?.coach || pod?.name || '—'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {dayDates.map((d) => {
                                            const a = attendanceByKey.get(`${podId}|${studentId}|${d}`);
                                            const isMissing = !a && expectedStudentIds.has(studentId);
                                            const clockTypes = ['AM In', 'Lunch Out', 'Lunch In', 'PM Out'];
                                            const dotColors: ('green' | 'red' | 'yellow' | 'gray')[] = a
                                                ? a.status === 'present'
                                                    ? ['green', 'green', 'green', 'green']
                                                    : a.status === 'late'
                                                    ? ['green', 'green', 'green', 'yellow']
                                                    : a.status === 'excused'
                                                    ? ['gray', 'gray', 'gray', 'gray']
                                                    : ['red', 'red', 'red', 'red']
                                                : isMissing
                                                ? ['red', 'red', 'red', 'red']
                                                : ['gray', 'gray', 'gray', 'gray'];
                                            return (
                                                <td
                                                    key={d}
                                                    className="px-2 py-2 text-center cursor-pointer hover:bg-orange-50"
                                                    onClick={() => setDayDetail({ studentId, podId, date: d })}
                                                >
                                                    <div className="flex items-center justify-center gap-0.5" title={a ? STATUS_LABELS[a.status] : isMissing ? 'Missing' : 'N/A'}>
                                                        {dotColors.map((color, i) => (
                                                            <span
                                                                key={i}
                                                                className={`inline-block w-2 h-2 rounded-full ${
                                                                    color === 'green' ? 'bg-green-500' :
                                                                    color === 'red' ? 'bg-red-500' :
                                                                    color === 'yellow' ? 'bg-amber-400' : 'bg-gray-300'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {weekTableRows.length === 0 && (
                        <div className="p-6 text-center text-gray-500 text-sm">No students in selected pod(s).</div>
                    )}
                </div>
            )}

            {/* Day detail panel (slide-over) */}
            {dayDetail && (
                <>
                    <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDayDetail(null)} aria-hidden />
                    <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-xl z-50 overflow-y-auto border-l border-gray-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Day detail</h2>
                                <button type="button" onClick={() => setDayDetail(null)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            {(() => {
                                const student = studentMap.get(dayDetail.studentId);
                                const pod = podMap.get(dayDetail.podId);
                                const a = attendanceByKey.get(`${dayDetail.podId}|${dayDetail.studentId}|${dayDetail.date}`);
                                const rows = [
                                    { label: 'AM Sign-In', type: 'am_in' },
                                    { label: 'Lunch Sign-Out', type: 'lunch_out' },
                                    { label: 'Lunch Sign-In', type: 'lunch_in' },
                                    { label: 'PM Sign-Out', type: 'pm_out' },
                                ];
                                return (
                                    <>
                                        <p className="text-sm font-medium text-gray-900">{student ? `${student.firstName} ${student.lastName}` : dayDetail.studentId}</p>
                                        <p className="text-xs text-gray-500">{student?.ywStatus ? `YW ID: ${student.ywStatus}` : '—'}</p>
                                        <p className="text-xs text-gray-500 mt-1">Track: {student?.track || '—'} · Site: {pod?.name || dayDetail.podId}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Date: {dayDetail.date}</p>
                                        <div className="mt-4 border-t border-gray-200 pt-4">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Clock-ins</h3>
                                            {rows.map((row) => (
                                                <div key={row.type} className="flex items-center justify-between py-2 border-b border-gray-100 text-sm">
                                                    <span className="text-gray-700">{row.label}</span>
                                                    {a ? (
                                                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${a.status === 'present' || a.status === 'late' ? 'bg-green-100 text-green-800' : a.status === 'excused' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-800'}`}>
                                                            {a.status === 'present' || a.status === 'late' ? 'Recorded' : STATUS_LABELS[a.status]}
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600 text-xs font-medium">Missing</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <Link
                                                href={`/app/bob/attendance/mark?pod=${dayDetail.podId}&date=${dayDetail.date}`}
                                                className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium text-center"
                                            >
                                                Manual correction
                                            </Link>
                                            <button type="button" onClick={() => setDayDetail(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">
                                                Close
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </>
            )}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {!data || data.attendance.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No attendance records found. Use &quot;Mark attendance&quot; to add records, or use the week filter and &quot;Apply week&quot; to load a date range.
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pod</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.attendance.map((a) => {
                                const student = studentMap.get(a.studentId);
                                const pod = podMap.get(a.podId);
                                return (
                                    <tr key={a.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">{a.date}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{pod?.name ?? a.podId}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {student ? `${student.firstName} ${student.lastName}` : a.studentId}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                {STATUS_LABELS[a.status]}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            {data && data.total > 0 && (
                <p className="mt-2 text-sm text-gray-500">Showing {data.attendance.length} of {data.total}</p>
            )}
        </div>
    );
}
