'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBobPod } from '@/lib/api';

export default function NewPodPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [coachId, setCoachId] = useState('');
    const [siteSupporterId, setSiteSupporterId] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Pod name is required.');
            return;
        }
        setSubmitting(true);
        try {
            await createBobPod({
                name: trimmedName,
                coachId: coachId.trim() || null,
                siteSupporterId: siteSupporterId.trim() || null,
                students: [],
            });
            router.push('/app/bob/pods');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create pod');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="px-6 py-8">
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/app/bob/pods" className="text-sm text-orange-600 hover:text-orange-700 hover:underline">
                        ← Back to Pods
                    </Link>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Create pod</h1>
                <p className="text-gray-600 mb-6">Add a new pod. You can assign students from the pod detail page.</p>

                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                        {error}
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pod name *</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coach ID</label>
                    <input
                        type="text"
                        value={coachId}
                        onChange={(e) => setCoachId(e.target.value)}
                        placeholder="Firebase UID of the coach (they will see only this pod)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site supporter ID</label>
                    <input
                        type="text"
                        value={siteSupporterId}
                        onChange={(e) => setSiteSupporterId(e.target.value)}
                        placeholder="Optional identifier"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
                    >
                        {submitting ? 'Creating…' : 'Create pod'}
                    </button>
                    <Link
                        href="/app/bob/pods"
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
            </div>
        </div>
    );
}
