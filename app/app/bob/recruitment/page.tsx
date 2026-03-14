'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getBobStudents, BobStudent, BobInterviewStage } from '@/lib/api';

const STAGE_LABELS: Record<BobInterviewStage, string> = {
    applied: 'Applied',
    screening: 'Screening',
    interview: 'Interview',
    offer: 'Offer',
    placed: 'Placed',
    not_placed: 'Not placed',
};

type SchoolStatus = 'follow_up' | 'info_scheduled' | 'session_complete' | 'inactive';

interface SchoolCard {
    id: string;
    name: string;
    status: SchoolStatus;
    studentCount: number;
    lastContact?: string;
    contactEmail?: string;
}

function deriveSchoolStatus(students: BobStudent[]): SchoolStatus {
    const stages = students.map((s) => s.interviewStage);
    if (stages.some((s) => s === 'placed' || s === 'offer')) return 'session_complete';
    if (stages.some((s) => s === 'interview' || s === 'screening')) return 'info_scheduled';
    if (stages.some((s) => s === 'applied')) return 'follow_up';
    return 'inactive';
}

export default function RecruitmentPage() {
    const [students, setStudents] = useState<BobStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'schools' | 'interviews'>('schools');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBobStudents({ limit: 500 });
            setStudents(res.students);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load recruitment data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const schoolsByStatus = useMemo(() => {
        const bySchool = new Map<string, BobStudent[]>();
        students.forEach((s) => {
            const name = (s.school || 'Unknown').trim() || 'Unknown';
            const list = bySchool.get(name) || [];
            list.push(s);
            bySchool.set(name, list);
        });
        const cards: SchoolCard[] = [];
        bySchool.forEach((list, name) => {
            const status = deriveSchoolStatus(list);
            cards.push({
                id: name,
                name,
                status,
                studentCount: list.length,
            });
        });
        const followUp = cards.filter((c) => c.status === 'follow_up');
        const infoScheduled = cards.filter((c) => c.status === 'info_scheduled');
        const sessionComplete = cards.filter((c) => c.status === 'session_complete');
        const inactive = cards.filter((c) => c.status === 'inactive');
        return { followUp, infoScheduled, sessionComplete, inactive };
    }, [students]);

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
                <Link href="/app/bob" className="mt-4 inline-block text-sm text-orange-600 hover:underline">← Back to BOB</Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Recruitment</h1>
                    <p className="text-gray-600">BoB 2026 — Schools and student interviews</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/app/bob/roster/new"
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                        Add School
                    </Link>
                    <Link
                        href="/app/bob/roster/new"
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium"
                    >
                        + Add Student
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 mb-6">
                <button
                    type="button"
                    onClick={() => setTab('schools')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'schools' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                >
                    Schools
                    <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {schoolsByStatus.followUp.length + schoolsByStatus.infoScheduled.length + schoolsByStatus.sessionComplete.length + schoolsByStatus.inactive.length}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => setTab('interviews')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'interviews' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                >
                    Student Interviews
                    <span className="ml-2 px-1.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {students.length}
                    </span>
                </button>
            </div>

            {tab === 'schools' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Follow Up Needed */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <h2 className="text-sm font-semibold text-gray-700">Follow Up Needed</h2>
                        </div>
                        <div className="space-y-2 min-h-[120px]">
                            {schoolsByStatus.followUp.length === 0 ? (
                                <p className="text-xs text-gray-500">No schools</p>
                            ) : (
                                schoolsByStatus.followUp.map((card) => (
                                    <div
                                        key={card.id}
                                        className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-shadow cursor-pointer"
                                    >
                                        <p className="font-medium text-gray-900 text-sm">{card.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{card.studentCount} student(s) referred</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {/* Info Session Scheduled */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            <h2 className="text-sm font-semibold text-gray-700">Info Session Scheduled</h2>
                        </div>
                        <div className="space-y-2 min-h-[120px]">
                            {schoolsByStatus.infoScheduled.length === 0 ? (
                                <p className="text-xs text-gray-500">No schools</p>
                            ) : (
                                schoolsByStatus.infoScheduled.map((card) => (
                                    <div
                                        key={card.id}
                                        className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-shadow cursor-pointer"
                                    >
                                        <p className="font-medium text-gray-900 text-sm">{card.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{card.studentCount} student(s)</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {/* Session Complete */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            <h2 className="text-sm font-semibold text-gray-700">Session Complete</h2>
                        </div>
                        <div className="space-y-2 min-h-[120px]">
                            {schoolsByStatus.sessionComplete.length === 0 ? (
                                <p className="text-xs text-gray-500">No schools</p>
                            ) : (
                                schoolsByStatus.sessionComplete.map((card) => (
                                    <div
                                        key={card.id}
                                        className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-shadow cursor-pointer"
                                    >
                                        <p className="font-medium text-gray-900 text-sm">{card.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{card.studentCount} students referred</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    {/* Inactive */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            <h2 className="text-sm font-semibold text-gray-700">Inactive</h2>
                        </div>
                        <div className="space-y-2 min-h-[120px]">
                            {schoolsByStatus.inactive.length === 0 ? (
                                <p className="text-xs text-gray-500">No schools</p>
                            ) : (
                                schoolsByStatus.inactive.map((card) => (
                                    <div
                                        key={card.id}
                                        className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-shadow cursor-pointer"
                                    >
                                        <p className="font-medium text-gray-900 text-sm">{card.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{card.studentCount} student(s)</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'interviews' && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interview status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Track</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interviewer / Coach</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hired</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No students. Add students from the Roster to see them here.
                                    </td>
                                </tr>
                            ) : (
                                students.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link href={`/app/bob/roster?student=${s.id}`} className="text-sm font-medium text-orange-600 hover:underline">
                                                {s.firstName} {s.lastName}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{s.school || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                {STAGE_LABELS[s.interviewStage]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{s.track || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{s.coach || '—'}</td>
                                        <td className="px-4 py-3">
                                            {s.interviewStage === 'placed' ? (
                                                <span className="text-green-600 font-medium">Yes</span>
                                            ) : s.interviewStage === 'not_placed' ? (
                                                <span className="text-red-600">No</span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}
        </div>
    );
}
