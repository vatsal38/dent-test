'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getBobPods, BobPod } from '@/lib/api';

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
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pods</h1>
                    <p className="text-gray-600">Manage pods and assign students.</p>
                </div>
                <div className="flex items-center gap-2">
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
                )}
            </div>
            {data && data.total > 0 && (
                <p className="mt-2 text-sm text-gray-500">Showing {data.pods.length} of {data.total}</p>
            )}
        </div>
    );
}
