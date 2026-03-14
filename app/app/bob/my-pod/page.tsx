'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getBobPods, getBobStudents, BobPod, BobStudent } from '@/lib/api';

const TODAY_SCHEDULE_PLACEHOLDER = [
    { time: '9:30 AM', label: 'Sign-in' },
    { time: '12:30 PM', label: 'Lunch out' },
    { time: '1:00 PM', label: 'Lunch in' },
    { time: '3:45 PM', label: 'Sign-out' },
];

export default function MyPodPage() {
    const [pod, setPod] = useState<BobPod | null>(null);
    const [students, setStudents] = useState<BobStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quickLogStudentId, setQuickLogStudentId] = useState<string | null>(null);
    const [quickLogNote, setQuickLogNote] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const podsRes = await getBobPods({ limit: 10 });
            const pods = podsRes.pods || [];
            if (pods.length === 0) {
                setPod(null);
                setLoading(false);
                return;
            }
            const myPod = pods[0];
            setPod(myPod);
            const studentIds = myPod.students || [];
            if (studentIds.length === 0) {
                setStudents([]);
                setLoading(false);
                return;
            }
            const studentsRes = await getBobStudents({ limit: 500 });
            const studentIdSet = new Set(studentIds);
            const inPod = studentsRes.students.filter((s) => studentIdSet.has(s.id));
            setStudents(inPod);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load your pod');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
                <Link href="/app/bob" className="mt-4 inline-block text-sm text-orange-600 hover:text-orange-700 hover:underline">← Back to BOB</Link>
            </div>
        );
    }

    if (!pod) {
        return (
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">My Pod</h1>
                <p className="text-gray-600 mb-6">No pod assigned yet.</p>
                <div className="p-6 rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
                    View and manage pods from the <Link href="/app/bob/pods" className="text-orange-600 hover:underline">Pods</Link> page.
                </div>
                <Link href="/app/bob" className="mt-6 inline-block text-sm text-orange-600 hover:text-orange-700 hover:underline">← Back to BOB</Link>
            </div>
        );
    }

    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const pendingReviews = students.slice(0, 2);
    const needsAttention = students.filter((s) => (s.milestoneStats?.submitted ?? 0) === 0 || (s.attendanceStats?.absent ?? 0) >= 2).slice(0, 2);

    return (
        <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Pod</h1>
                    <p className="text-gray-600">{pod.name} — Week 3 of 5 - {dateStr}</p>
                </div>
                <Link
                    href={`/app/bob/pods/${pod.id}`}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                    Edit pod
                </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                <div className="p-6">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">My Students Today ({students.length})</h3>
                    {students.length === 0 ? (
                        <p className="text-gray-500 text-sm">No students assigned to this pod yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milestone W3</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((s) => {
                                        const initial = (s.firstName?.[0] || '') + (s.lastName?.[0] || '') || '?';
                                        const status = (s.attendanceStats?.absent ?? 0) > 0 ? 'No-Show' : 'Checked In';
                                        const milestoneStatus = (s.milestoneStats?.submitted ?? 0) >= (s.milestoneStats?.total ?? 1) ? 'Approved' : (s.milestoneStats?.submitted ?? 0) > 0 ? 'Needs Revision' : 'Pending';
                                        return (
                                            <tr key={s.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                                                            {initial}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${status === 'No-Show' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                                        milestoneStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                                                        milestoneStatus === 'Needs Revision' ? 'bg-red-100 text-red-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {milestoneStatus}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-right flex items-center justify-end gap-1">
                                                    <button type="button" onClick={(e) => { e.preventDefault(); setQuickLogStudentId(s.id); setQuickLogNote(''); }} className="p-1 text-gray-400 hover:text-orange-600" title="Quick log">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <Link href={`/app/bob/roster?student=${s.id}`} className="p-1 text-gray-400 hover:text-orange-600" title="Edit">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Today&apos;s schedule</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        {TODAY_SCHEDULE_PLACEHOLDER.map((item, i) => (
                            <li key={i} className="flex justify-between"><span>{item.time}</span><span>{item.label}</span></li>
                        ))}
                    </ul>
                    <p className="text-xs text-gray-400 mt-2">Program schedule (display only)</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Pending Milestone Reviews</h3>
                    {pendingReviews.length === 0 ? (
                        <p className="text-sm text-gray-500">No pending reviews.</p>
                    ) : (
                        <ul className="space-y-3">
                            {pendingReviews.map((s) => {
                                const initial = (s.firstName?.[0] || '') + (s.lastName?.[0] || '') || '?';
                                return (
                                    <li key={s.id} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">{initial}</span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{s.firstName} {s.lastName}</p>
                                                <p className="text-xs text-gray-500">Week 3 - 2 hours ago</p>
                                            </div>
                                        </div>
                                        <Link href="/app/bob/milestones" className="text-sm font-medium text-orange-600 hover:text-orange-700 shrink-0">Review →</Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Needs Attention</h3>
                    {needsAttention.length === 0 ? (
                        <p className="text-sm text-gray-500">No items need attention.</p>
                    ) : (
                        <ul className="space-y-3">
                            {needsAttention.map((s) => {
                                const initial = (s.firstName?.[0] || '') + (s.lastName?.[0] || '') || '?';
                                const reason = (s.attendanceStats?.absent ?? 0) >= 2 && (s.milestoneStats?.submitted ?? 0) === 0 ? 'Both' : (s.milestoneStats?.submitted ?? 0) === 0 ? 'Milestones' : 'Attendance';
                                return (
                                    <li key={s.id} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">{initial}</span>
                                            <div className="min-w-0">
                                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 mr-1">{reason}</span>
                                                <p className="text-xs text-gray-600 truncate">View student details</p>
                                            </div>
                                        </div>
                                        <Link href={`/app/bob/roster?student=${s.id}`} className="text-sm font-medium text-orange-600 hover:text-orange-700 shrink-0">View student →</Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            <div className="flex gap-3">
                <Link href="/app/bob/attendance" className="text-sm font-medium text-orange-600 hover:text-orange-700 hover:underline">View attendance →</Link>
                <Link href="/app/bob" className="text-sm text-gray-600 hover:underline">← Back to BOB</Link>
            </div>

            {/* Quick log modal */}
            {quickLogStudentId && (
                <>
                    <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setQuickLogStudentId(null)} aria-hidden />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick log</h3>
                            <p className="text-sm text-gray-500 mb-3">
                                Add a note for {students.find((s) => s.id === quickLogStudentId)?.firstName} {students.find((s) => s.id === quickLogStudentId)?.lastName}
                            </p>
                            <textarea
                                value={quickLogNote}
                                onChange={(e) => setQuickLogNote(e.target.value)}
                                placeholder="Note…"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                rows={3}
                            />
                            <div className="mt-4 flex gap-2">
                                <button type="button" onClick={() => { setQuickLogStudentId(null); setQuickLogNote(''); }} className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium">
                                    Save note
                                </button>
                                <button type="button" onClick={() => setQuickLogStudentId(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
