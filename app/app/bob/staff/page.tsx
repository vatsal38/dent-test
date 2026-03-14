'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getBobPods, getBobStudents, BobPod, BobStudent } from '@/lib/api';

type StaffRow = {
    id: string;
    label: string;
    roles: ('Coach' | 'Site supporter' | 'Coach (student)')[];
    podIdsAsCoach: string[];
    podIdsAsSiteSupporter: string[];
    studentIds: string[];
};

function buildStaffRows(pods: BobPod[], students: BobStudent[]): StaffRow[] {
    const byId = new Map<string, StaffRow>();

    function getOrCreate(id: string, label: string, role: 'Coach' | 'Site supporter' | 'Coach (student)') {
        let row = byId.get(id);
        if (!row) {
            row = { id, label, roles: [], podIdsAsCoach: [], podIdsAsSiteSupporter: [], studentIds: [] };
            byId.set(id, row);
        }
        if (!row.roles.includes(role)) row.roles.push(role);
        return row;
    }

    for (const p of pods) {
        if (p.coachId) {
            const row = getOrCreate(p.coachId, p.coachId, 'Coach');
            row.podIdsAsCoach.push(p.id);
        }
        if (p.siteSupporterId && p.siteSupporterId !== p.coachId) {
            const row = getOrCreate(p.siteSupporterId, p.siteSupporterId, 'Site supporter');
            row.podIdsAsSiteSupporter.push(p.id);
        } else if (p.siteSupporterId) {
            const row = getOrCreate(p.siteSupporterId, p.siteSupporterId, 'Site supporter');
            if (!row.podIdsAsSiteSupporter.includes(p.id)) row.podIdsAsSiteSupporter.push(p.id);
        }
    }

    for (const s of students) {
        const coachName = (s.coach || '').trim();
        if (!coachName) continue;
        const id = `name:${coachName}`;
        const row = getOrCreate(id, coachName, 'Coach (student)');
        row.studentIds.push(s.id);
    }

    return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export default function BobStaffPage() {
    const [pods, setPods] = useState<BobPod[]>([]);
    const [students, setStudents] = useState<BobStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [podsRes, studentsRes] = await Promise.all([
                getBobPods({ limit: 200 }),
                getBobStudents({ limit: 500 }),
            ]);
            setPods(podsRes.pods);
            setStudents(studentsRes.students);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const staffRows = buildStaffRows(pods, students);
    const podMap = new Map(pods.map((p) => [p.id, p]));

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
        <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Staff & coach roster</h1>
                    <p className="text-gray-600">View staff assignments and who is assigned to which pods and students.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link
                        href="/app/bob/pods"
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                        Pods
                    </Link>
                    <Link
                        href="/app/bob/roster"
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium"
                    >
                        Roster
                    </Link>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {staffRows.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No staff found. Assign coaches and site supporters on pods, or set coach names on students in the roster.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role(s)</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pods (as coach)</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pods (site supporter)</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {staffRows.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-medium text-gray-900">{row.label}</span>
                                        {row.id.startsWith('name:') && (
                                            <span className="ml-1 text-xs text-gray-400">(from roster)</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {row.roles.map((r) => (
                                                <span
                                                    key={r}
                                                    className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800"
                                                >
                                                    {r}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {row.podIdsAsCoach.length === 0
                                            ? '—'
                                            : row.podIdsAsCoach.map((pid) => {
                                                const pod = podMap.get(pid);
                                                return pod ? (
                                                    <Link key={pid} href={`/app/bob/pods/${pid}`} className="text-orange-600 hover:underline block">
                                                        {pod.name}
                                                    </Link>
                                                ) : (
                                                    <span key={pid}>{pid}</span>
                                                );
                                            })}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {row.podIdsAsSiteSupporter.length === 0
                                            ? '—'
                                            : row.podIdsAsSiteSupporter.map((pid) => {
                                                const pod = podMap.get(pid);
                                                return pod ? (
                                                    <Link key={pid} href={`/app/bob/pods/${pid}`} className="text-orange-600 hover:underline block">
                                                        {pod.name}
                                                    </Link>
                                                ) : (
                                                    <span key={pid}>{pid}</span>
                                                );
                                            })}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {row.studentIds.length === 0 ? '—' : `${row.studentIds.length} student(s)`}
                                        {row.studentIds.length > 0 && (
                                            <Link href="/app/bob/roster" className="ml-1 text-orange-600 hover:underline text-xs">
                                                View roster →
                                            </Link>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {row.podIdsAsCoach.length > 0 || row.podIdsAsSiteSupporter.length > 0 ? (
                                            <Link
                                                href={row.podIdsAsCoach[0] ? `/app/bob/pods/${row.podIdsAsCoach[0]}` : `/app/bob/pods/${row.podIdsAsSiteSupporter[0]}`}
                                                className="text-sm text-orange-600 hover:underline"
                                            >
                                                Edit pod
                                            </Link>
                                        ) : (
                                            <Link href="/app/bob/roster" className="text-sm text-orange-600 hover:underline">
                                                Roster
                                            </Link>
                                        )}
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
