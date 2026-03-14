'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getBobStudents, BobStudent, BobInterviewStage } from '@/lib/api';
import { HiOutlineFilter, HiOutlineUserGroup } from 'react-icons/hi';

const STAGE_LABELS: Record<BobInterviewStage, string> = {
    applied: 'Applied',
    screening: 'Screening',
    interview: 'Interview',
    offer: 'Offer',
    placed: 'Placed',
    not_placed: 'Not placed',
};

const STAGE_ORDER: BobInterviewStage[] = ['applied', 'screening', 'interview', 'offer', 'placed', 'not_placed'];

export default function BobInterviewPage() {
    const [students, setStudents] = useState<BobStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stageFilter, setStageFilter] = useState<BobInterviewStage | ''>('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBobStudents({ limit: 500 });
            setStudents(res.students);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const byStage = useMemo(() => {
        const map = new Map<BobInterviewStage, BobStudent[]>();
        STAGE_ORDER.forEach((s) => map.set(s, []));
        students.forEach((s) => {
            const stage = s.interviewStage || 'applied';
            const list = map.get(stage) || [];
            list.push(s);
            map.set(stage, list);
        });
        return map;
    }, [students]);

    const filtered = useMemo(() => {
        if (!stageFilter) return students;
        return students.filter((s) => (s.interviewStage || 'applied') === stageFilter);
    }, [students, stageFilter]);

    if (loading) {
        return (
            <div className="px-6 py-8 flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-6 py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
                <Link href="/app/bob" className="mt-4 inline-block text-sm text-orange-600 hover:underline">← Back to Command Center</Link>
            </div>
        );
    }

    return (
        <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Interview pipeline</h1>
                    <p className="text-gray-600">Track candidates by interview stage.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/app/bob/recruitment" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
                        <HiOutlineUserGroup className="w-4 h-4" />
                        Recruitment
                    </Link>
                    <Link href="/app/bob/roster" className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium">
                        Roster
                    </Link>
                </div>
            </div>

            {/* Stage summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {STAGE_ORDER.map((stage) => {
                    const count = byStage.get(stage)?.length ?? 0;
                    const isActive = stageFilter === stage;
                    return (
                        <button
                            key={stage}
                            type="button"
                            onClick={() => setStageFilter(isActive ? '' : stage)}
                            className={`p-3 rounded-lg border text-left transition-colors ${isActive ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-gray-200 bg-white hover:border-orange-200'}`}
                        >
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{STAGE_LABELS[stage]}</p>
                            <p className="text-xl font-bold text-gray-900">{count}</p>
                        </button>
                    );
                })}
            </div>

            {/* Pipeline table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <HiOutlineFilter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                        {stageFilter ? `Showing ${filtered.length} in ${STAGE_LABELS[stageFilter]}` : `All ${students.length} candidates`}
                    </span>
                    {stageFilter && (
                        <button type="button" onClick={() => setStageFilter('')} className="text-sm text-orange-600 hover:underline">
                            Clear filter
                        </button>
                    )}
                </div>
                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No candidates match.</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filtered.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link href={`/app/bob/roster?student=${s.id}`} className="text-sm font-medium text-orange-600 hover:underline">
                                            {s.firstName} {s.lastName}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{s.school || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                            {STAGE_LABELS[s.interviewStage || 'applied']}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{s.coach || '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={`/app/bob/roster?student=${s.id}`} className="text-sm text-orange-600 hover:underline">View →</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
