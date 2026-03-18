'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getBobPods, BobPod } from '@/lib/api';
import { Skeleton } from '@/components/Skeleton';

export default function PodsPage() {
    const [data, setData] = useState<{ pods: BobPod[]; total: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBobPods({ limit: 100, offset: 0 });
            setData({ pods: res.pods, total: res.total });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load pods');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <Skeleton className="h-7 w-36 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Skeleton className="h-10 w-24" rounded="lg" />
                        <Skeleton className="h-10 w-28" rounded="lg" />
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-6">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-24 ml-auto" />
                    </div>
                    <div className="divide-y divide-gray-100">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="px-4 py-4 flex items-center gap-6">
                                <Skeleton className="h-4 w-44" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24 ml-auto" />
                            </div>
                        ))}
                    </div>
                </div>
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
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pods</h1>
                    <p className="text-gray-600">Manage pods and assign students.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/app/bob/my-pod" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">
                        My Pod
                    </Link>
                    <Link
                        href="/app/bob/pods/new"
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm font-medium"
                    >
                        + Create pod
                    </Link>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {!data || data.pods.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No pods found. Create a pod to get started.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site supporter ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.pods.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link href={`/app/bob/pods/${p.id}`} className="text-sm font-medium text-orange-600 hover:underline">
                                            {p.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{p.coachId || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{p.siteSupporterId || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{p.students?.length ?? 0}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/app/bob/pods/${p.id}`}
                                            className="text-sm text-orange-600 hover:underline"
                                        >
                                            Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>
            {data && data.total > 0 && (
                <p className="mt-2 text-sm text-gray-500">Showing {data.pods.length} of {data.total}</p>
            )}
        </div>
    );
}
