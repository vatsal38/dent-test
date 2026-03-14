'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { API_BASE, getBobStudents, BobStudent } from '@/lib/api';

type SubmissionType = 'incident' | 'blitz_points' | 'anonymous_feedback' | 'progress_update' | 'parent_contact';

function studentLabel(s: BobStudent) {
    return [s.firstName, s.lastName].filter(Boolean).join(' ') || s.id;
}

export default function BobSubmitPage() {
    const [submissionType, setSubmissionType] = useState<SubmissionType>('incident');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<Record<string, string>>({});
    const [students, setStudents] = useState<BobStudent[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const studentDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const needStudents = submissionType === 'incident' || submissionType === 'progress_update' || submissionType === 'parent_contact';
        if (!needStudents) return;
        setStudentsLoading(true);
        getBobStudents({ limit: 500 })
            .then((res) => setStudents(res.students || []))
            .catch(() => setStudents([]))
            .finally(() => setStudentsLoading(false));
    }, [submissionType]);

    const filteredStudents = useMemo(() => {
        if (!studentSearch.trim()) return students.slice(0, 50);
        const q = studentSearch.trim().toLowerCase();
        return students.filter(
            (s) =>
                (s.firstName || '').toLowerCase().includes(q) ||
                (s.lastName || '').toLowerCase().includes(q) ||
                (s.email || '').toLowerCase().includes(q) ||
                (s.school || '').toLowerCase().includes(q) ||
                s.id.toLowerCase().includes(q)
        ).slice(0, 50);
    }, [students, studentSearch]);

    const selectedStudent = useMemo(() => {
        const id = form.studentId;
        if (!id) return null;
        return students.find((s) => s.id === id) ?? null;
    }, [form.studentId, students]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (studentDropdownRef.current && !studentDropdownRef.current.contains(e.target as Node)) {
                setStudentDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function setSelectedStudent(s: BobStudent | null) {
        setForm((f) => ({
            ...f,
            studentId: s?.id ?? '',
            student: s ? studentLabel(s) : '',
        }));
        setStudentSearch('');
        setStudentDropdownOpen(false);
    }

    const studentDropdown = (
        <div className="relative" ref={studentDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <input
                type="text"
                value={studentDropdownOpen ? studentSearch : (selectedStudent ? studentLabel(selectedStudent) : '')}
                onChange={(e) => { setStudentSearch(e.target.value); setStudentDropdownOpen(true); }}
                onFocus={() => { setStudentDropdownOpen(true); if (!selectedStudent) setStudentSearch(''); }}
                placeholder={studentsLoading ? 'Loading…' : 'Search students…'}
                disabled={studentsLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {selectedStudent && !studentDropdownOpen && (
                <button type="button" onClick={() => setSelectedStudent(null)} className="absolute right-2 top-8 text-gray-400 hover:text-gray-600" title="Clear">×</button>
            )}
            {studentDropdownOpen && (
                <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    {filteredStudents.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-gray-500">No students match</li>
                    ) : (
                        filteredStudents.map((s) => (
                            <li key={s.id}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedStudent(s)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50 flex justify-between items-center"
                                >
                                    <span>{studentLabel(s)}</span>
                                    {s.school && <span className="text-gray-500 text-xs truncate max-w-[40%]">{s.school}</span>}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const needsStudent = submissionType === 'incident' || submissionType === 'progress_update' || submissionType === 'parent_contact';
        if (needsStudent && !(form.studentId || form.student)) {
            setError('Please select a student.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/bob/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: submissionType, ...form }),
            });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error((errBody && errBody.error) || res.statusText || 'Submit failed');
            }
            setSubmitted(true);
            setForm({});
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Submit failed');
        } finally {
            setSubmitting(false);
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Submitted</h1>
                    <p className="text-gray-600 mb-6">Your submission has been received.</p>
                    <button type="button" onClick={() => setSubmitted(false)} className="text-orange-600 hover:underline font-medium">Submit another</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-orange-50">
                    <h1 className="text-xl font-bold text-gray-900">BoB One-Stop Submit</h1>
                    <p className="text-sm text-gray-600 mt-1">Incidents, Blitz points, feedback, progress updates, parent contact.</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Submission type</label>
                        <select
                            value={submissionType}
                            onChange={(e) => setSubmissionType(e.target.value as SubmissionType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                            <option value="incident">Incident Report</option>
                            <option value="blitz_points">Blitz Points Award</option>
                            <option value="anonymous_feedback">Anonymous Feedback</option>
                            <option value="progress_update">Weekly Progress Update</option>
                            <option value="parent_contact">Parent Contact Log</option>
                        </select>
                    </div>

                    {submissionType === 'incident' && (
                        <>
                            {studentDropdown}
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={form.incidentType ?? ''} onChange={(e) => setForm((f) => ({ ...f, incidentType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"><option value="">Select</option><option value="behavior">Behavior</option><option value="safety">Safety</option><option value="medical">Medical</option><option value="parent_contact">Parent contact</option></select></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" rows={3} required placeholder="Description" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Severity</label><select value={form.severity ?? ''} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"><option value="">Select</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                        </>
                    )}
                    {submissionType === 'blitz_points' && (
                        <>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Team</label><input type="text" value={form.team ?? ''} onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" placeholder="Team name" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Points</label><input type="number" value={form.points ?? ''} onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" placeholder="Points" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label><input type="text" value={form.reason ?? ''} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" placeholder="Reason" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Awarded by</label><input type="text" value={form.awardedBy ?? ''} onChange={(e) => setForm((f) => ({ ...f, awardedBy: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" placeholder="Your name" /></div>
                        </>
                    )}
                    {submissionType === 'anonymous_feedback' && (
                        <>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={form.category ?? ''} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"><option value="">Select</option><option value="program">Program</option><option value="logistics">Logistics</option><option value="other">Other</option></select></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label><textarea value={form.feedback ?? ''} onChange={(e) => setForm((f) => ({ ...f, feedback: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" rows={4} placeholder="Your feedback (no name required)" required /></div>
                        </>
                    )}
                    {submissionType === 'progress_update' && (
                        <>
                            {studentDropdown}
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Milestone / focus</label><input type="text" value={form.milestone ?? ''} onChange={(e) => setForm((f) => ({ ...f, milestone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" placeholder="Milestone or topic" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Progress notes</label><textarea value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" rows={3} placeholder="Notes" required /></div>
                        </>
                    )}
                    {submissionType === 'parent_contact' && (
                        <>
                            {studentDropdown}
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Parent / guardian name</label><input type="text" value={form.parentName ?? ''} onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label><input type="text" value={form.reason ?? ''} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" placeholder="Reason for contact" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" rows={3} placeholder="Notes" /></div>
                        </>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium">
                            {submitting ? 'Submitting…' : 'Submit'}
                        </button>
                        <Link href="/app/bob" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium text-center">Cancel</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
