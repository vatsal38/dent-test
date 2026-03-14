'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBobStudent, BOB_STUDENT_STATUSES, BOB_INTERVIEW_STAGES, BobStudentStatus, BobInterviewStage } from '@/lib/api';

const STATUS_LABELS: Record<BobStudentStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    graduated: 'Graduated',
    withdrawn: 'Withdrawn',
};

const STAGE_LABELS: Record<BobInterviewStage, string> = {
    applied: 'Applied',
    screening: 'Screening',
    interview: 'Interview',
    offer: 'Offer',
    placed: 'Placed',
    not_placed: 'Not placed',
};

export default function NewStudentPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [status, setStatus] = useState<BobStudentStatus>('active');
    const [interviewStage, setInterviewStage] = useState<BobInterviewStage>('applied');
    const [school, setSchool] = useState('');
    const [track, setTrack] = useState('');
    const [coach, setCoach] = useState('');
    const [stage, setStage] = useState('');
    const [ywStatus, setYwStatus] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        const first = firstName.trim();
        const last = lastName.trim();
        if (!first || !last) {
            setError('First name and last name are required.');
            return;
        }
        setSubmitting(true);
        try {
            await createBobStudent({
                firstName: first,
                lastName: last,
                email: email.trim() || undefined,
                phone: phone.trim() || undefined,
                status,
                interviewStage,
                school: school.trim() || undefined,
                track: track.trim() || undefined,
                coach: coach.trim() || undefined,
                stage: stage.trim() || undefined,
                ywStatus: ywStatus.trim() || undefined,
            });
            router.push('/app/bob/roster');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create student');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="px-6 py-8">
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/app/bob/roster" className="text-sm text-orange-600 hover:text-orange-700 hover:underline">
                        ← Back to Roster
                    </Link>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Add student</h1>
                <p className="text-gray-600 mb-6">Create a new student record. Pod can be assigned later.</p>

                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                        {error}
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
                        <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last name *</label>
                        <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                        <input
                            type="text"
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Track</label>
                        <input
                            type="text"
                            value={track}
                            onChange={(e) => setTrack(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Coach</label>
                        <input
                            type="text"
                            value={coach}
                            onChange={(e) => setCoach(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                        <input
                            type="text"
                            value={stage}
                            onChange={(e) => setStage(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">YW Status</label>
                        <input
                            type="text"
                            value={ywStatus}
                            onChange={(e) => setYwStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as BobStudentStatus)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            {BOB_STUDENT_STATUSES.map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Interview stage</label>
                        <select
                            value={interviewStage}
                            onChange={(e) => setInterviewStage(e.target.value as BobInterviewStage)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            {BOB_INTERVIEW_STAGES.map((s) => (
                                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
                    >
                        {submitting ? 'Creating…' : 'Create student'}
                    </button>
                    <Link
                        href="/app/bob/roster"
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
