'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    getBobPod,
    updateBobPod,
    getBobStudents,
    BobPod,
    BobStudent,
} from '@/lib/api';

export default function PodDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [pod, setPod] = useState<BobPod | null>(null);
    const [allStudents, setAllStudents] = useState<BobStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCoachId, setEditCoachId] = useState('');
    const [editSiteSupporterId, setEditSiteSupporterId] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

    const loadPod = useCallback(async () => {
        if (!id) return;
        try {
            const p = await getBobPod(id);
            setPod(p);
            setEditName(p.name);
            setEditCoachId(p.coachId || '');
            setEditSiteSupporterId(p.siteSupporterId || '');
            setSelectedStudentIds(new Set(p.students || []));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Pod not found');
        }
    }, [id]);

    const loadStudents = useCallback(async () => {
        try {
            const res = await getBobStudents({ limit: 500 });
            setAllStudents(res.students);
        } catch {
            // non-blocking
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        setError(null);
        Promise.all([loadPod(), loadStudents()]).finally(() => setLoading(false));
    }, [loadPod, loadStudents]);

    async function handleSavePod() {
        if (!pod) return;
        setSaving(true);
        try {
            const updated = await updateBobPod(pod.id, {
                name: editName.trim() || pod.name,
                coachId: editCoachId.trim() || null,
                siteSupporterId: editSiteSupporterId.trim() || null,
            });
            setPod(updated);
            setEditName(updated.name);
            setEditCoachId(updated.coachId || '');
            setEditSiteSupporterId(updated.siteSupporterId || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveStudents() {
        if (!pod) return;
        setSaving(true);
        try {
            const updated = await updateBobPod(pod.id, {
                students: Array.from(selectedStudentIds),
            });
            setPod(updated);
            setSelectedStudentIds(new Set(updated.students || []));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update students');
        } finally {
            setSaving(false);
        }
    }

    function toggleStudent(studentId: string) {
        setSelectedStudentIds((prev) => {
            const next = new Set(prev);
            if (next.has(studentId)) next.delete(studentId);
            else next.add(studentId);
            return next;
        });
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error || !pod) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error || 'Pod not found'}</div>
                <Link href="/app/bob/pods" className="mt-4 inline-block text-sm text-orange-600 hover:underline">← Back to Pods</Link>
            </div>
        );
    }

    const studentsInPod = (pod.students || []).map((sid) => allStudents.find((s) => s.id === sid)).filter(Boolean) as BobStudent[];
    const nameChanged = editName.trim() !== pod.name || editCoachId !== (pod.coachId || '') || editSiteSupporterId !== (pod.siteSupporterId || '');
    const studentsChanged =
        selectedStudentIds.size !== (pod.students?.length ?? 0) ||
        (pod.students || []).some((sid) => !selectedStudentIds.has(sid));

    return (
        <div className="px-6 py-8">
            <div className="mb-6">
                <Link href="/app/bob/pods" className="text-sm text-orange-600 hover:underline">← Back to Pods</Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Pod: {pod.name}</h1>

                {/* Pod details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Coach ID</label>
                        <input
                            type="text"
                            value={editCoachId}
                            onChange={(e) => setEditCoachId(e.target.value)}
                            placeholder="Firebase UID"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Site supporter ID</label>
                        <input
                            type="text"
                            value={editSiteSupporterId}
                            onChange={(e) => setEditSiteSupporterId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                </div>
                {nameChanged && (
                    <button
                        type="button"
                        onClick={handleSavePod}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
                    >
                        {saving ? 'Saving…' : 'Save pod details'}
                    </button>
                )}

                {/* Students in this pod */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Students in this pod</h2>
                    <p className="text-sm text-gray-600 mb-3">Select students to assign to this pod. Changes save below.</p>
                    <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
                        {allStudents.map((s) => (
                            <li key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    checked={selectedStudentIds.has(s.id)}
                                    onChange={() => toggleStudent(s.id)}
                                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</span>
                                {s.email && <span className="text-xs text-gray-500">{s.email}</span>}
                            </li>
                        ))}
                    </ul>
                    {allStudents.length === 0 && <p className="text-sm text-gray-500 py-2">No students in roster yet.</p>}
                    {studentsChanged && (
                        <button
                            type="button"
                            onClick={handleSaveStudents}
                            disabled={saving}
                            className="mt-3 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
                        >
                            {saving ? 'Saving…' : 'Save student assignment'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
