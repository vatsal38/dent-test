'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { BobStudent } from "@/platform/api/bob/students";
import {
  getBlitzTeamOptions,
  submitBobOneStop,
  type BlitzTeamOptionsResponse,
  type BobOneStopPayload,
} from "@/platform/api/bob/submit";
import { useBobStudentsList } from "@/platform/query/hooks/useBobStudents";
import { useBobMe } from "@/platform/query/hooks/useBobMe";
import { useBobPodDetail } from "@/platform/query/hooks/useBobPods";
import { decodeBobReturnTo } from "@/lib/bobReturnUrl";
import { useAuth } from "@/context/AuthContext";
import { FormsHub } from "@/features/bob/submit/FormsHub";
import {
  getBobFormDefinition,
  isBobFormType,
} from "@/features/bob/submit/formsConfig";
import {
  isStaffFormType,
  StaffRequestFormFields,
} from "@/features/bob/submit/StaffRequestFormFields";
import {
  CoachFeedbackFormFields,
  isCoachFeedbackType,
} from "@/features/bob/submit/CoachFeedbackFormFields";
import {
  StudentMultiSelect,
  studentLabel,
} from "@/features/bob/submit/StudentMultiSelect";
import { readFileAsBase64 } from "@/features/bob/submit/fileUtils";
import { useBobAccess } from "@/platform/rbac/useBobAccess";

function isValidFormType(value: string | null): boolean {
  return isBobFormType(value);
}

export function SubmitPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { access } = useBobAccess();
    const isStudent = access.role === "student";
    const { data: me } = useBobMe();
    const linkedStudentId = me?.linkedStudent?.id ?? null;

    const returnHref = decodeBobReturnTo(searchParams?.get("returnTo"));
    const prefilledStudentId = searchParams?.get("studentId") || '';
    const typeParam = searchParams?.get("type");
    const submissionType = isValidFormType(typeParam)
        ? typeParam
        : prefilledStudentId && !isStudent
          ? 'incident'
          : null;
    const assignedCount = me?.assignedPods?.length ?? 0;
    const wellnessPodId =
        submissionType === "wellness_check" && me?.coachScope && assignedCount <= 1
            ? me?.primaryPod?.id ?? me?.assignedPods?.[0]?.id ?? null
            : null;
    const { data: wellnessPod } = useBobPodDetail(wellnessPodId);
    const wellnessPodStudentIds = wellnessPod?.students ?? [];

    const studentsListParams = useMemo(() => {
        if (submissionType === "wellness_check" && wellnessPodStudentIds.length > 0) {
            return {
                ids: wellnessPodStudentIds.join(","),
                limit: wellnessPodStudentIds.length,
                includeStats: false,
            };
        }
        return { limit: 500, includeStats: false };
    }, [submissionType, wellnessPodStudentIds]);

    const formDef = submissionType ? getBobFormDefinition(submissionType) : null;
    const submitterName = user?.name?.trim() || user?.email?.trim() || 'You';

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<Record<string, string>>({});
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [submitAnonymously, setSubmitAnonymously] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const needStudents =
        !isStudent &&
        (submissionType === "incident" || submissionType === "wellness_check");
    const studentsQuery = useBobStudentsList(
        studentsListParams,
        { enabled: Boolean(needStudents) },
    );
    const students = studentsQuery.data?.students ?? [];
    const studentsLoading = studentsQuery.isLoading;

    const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const studentDropdownRef = useRef<HTMLDivElement>(null);
    const [blitzOptions, setBlitzOptions] = useState<BlitzTeamOptionsResponse | null>(null);
    const [blitzOptionsLoading, setBlitzOptionsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const blitzCategoryMeta = useMemo(() => {
        const id = form.blitzCategory ?? '';
        return blitzOptions?.categories?.find((c) => c.id === id) ?? null;
    }, [form.blitzCategory, blitzOptions?.categories]);

    const blitzTeamOptions = useMemo(() => {
        if (!blitzOptions) return [];
        return [
            ...(blitzOptions.trackTeams ?? []),
            ...(blitzOptions.globalTeams ?? blitzOptions.colors ?? []),
            ...(blitzOptions.squads ?? []),
        ];
    }, [blitzOptions]);

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
        if (submissionType !== 'blitz_points') return;
        let cancelled = false;
        setBlitzOptionsLoading(true);
        getBlitzTeamOptions()
            .then((data) => {
                if (!cancelled) setBlitzOptions(data);
            })
            .catch(() => {
                if (!cancelled) setBlitzOptions(null);
            })
            .finally(() => {
                if (!cancelled) setBlitzOptionsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [submissionType]);

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

    useEffect(() => {
        if (!prefilledStudentId || !students.length) return;
        if (submissionType === 'incident') {
            if (selectedStudentIds.length) return;
            const match = students.find((s) => s.id === prefilledStudentId);
            if (match) {
                setSelectedStudentIds([match.id]);
                setForm((f) => ({
                    ...f,
                    student: studentLabel(match),
                }));
            }
            return;
        }
        if (form.studentId) return;
        const match = students.find((s) => s.id === prefilledStudentId);
        if (match) setSelectedStudent(match);
    }, [prefilledStudentId, students, form.studentId, submissionType, selectedStudentIds.length]);

    function resetFormState() {
        setForm({});
        setSelectedStudentIds([]);
        setSubmitAnonymously(false);
        setPendingFiles([]);
        setSubmitted(false);
        setError(null);
    }

    function backToHub() {
        const params = new URLSearchParams();
        if (returnHref) params.set('returnTo', returnHref);
        const qs = params.toString();
        router.push(qs ? `/app/bob/submit?${qs}` : '/app/bob/submit');
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

    const submittedByField = (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Submitted by</label>
            <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
                {submitterName}
            </div>
        </div>
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!submissionType) return;

        if (submissionType === 'incident' && selectedStudentIds.length === 0) {
            setError('Please select at least one student.');
            return;
        }
        if (submissionType === 'wellness_check' && !(form.studentId || form.student)) {
            setError('Please select a student.');
            return;
        }
        if (submissionType === 'wellness_check') {
            const score = Number(form.wellnessScore);
            if (!Number.isFinite(score) || score < 1 || score > 10) {
                setError('Please enter a wellness score between 1 and 10.');
                return;
            }
            if (!(form.wellnessReason || form.concernSummary || form.description)?.trim()) {
                setError('Please explain why you chose this score.');
                return;
            }
        }
        if (submissionType === 'blitz_points') {
            if (!form.blitzCategory) {
                setError('Please select a blitz category.');
                return;
            }
            if (!form.team) {
                setError('Please select a blitz team.');
                return;
            }
            if (!blitzCategoryMeta?.fixedPoints) {
                const pts = Number(form.points);
                if (!Number.isFinite(pts) || pts < 1) {
                    setError('Please enter at least 1 point for coaching awards.');
                    return;
                }
            }
        }
        if (submissionType === 'coach_feedback') {
            const rating = Number(form.coachRating);
            if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
                setError('Please select a rating from 1 to 5.');
                return;
            }
            if (!form.description?.trim()) {
                setError('Please share how your week went.');
                return;
            }
        }

        setSubmitting(true);
        setError(null);
        try {
            const payload: BobOneStopPayload = { ...form };
            if (submissionType === 'incident') {
                payload.studentIds = selectedStudentIds;
                payload.studentId = selectedStudentIds[0];
            }
            if (submissionType === 'wellness_check') {
                payload.wellnessReason =
                    form.wellnessReason || form.concernSummary || form.description;
                payload.concernSummary = payload.wellnessReason as string;
                payload.description = payload.wellnessReason as string;
            }
            if (submissionType === 'anonymous_feedback') {
                payload.submitAnonymously = submitAnonymously;
            }
            if (submissionType === 'blitz_points' && blitzCategoryMeta?.fixedPoints) {
                payload.points = String(blitzCategoryMeta.defaultPoints);
            }
            if (pendingFiles.length > 0) {
                payload.attachments = await Promise.all(
                    pendingFiles.map(async (file) => ({
                        filename: file.name,
                        mimeType: file.type || 'application/octet-stream',
                        content: await readFileAsBase64(file),
                    })),
                );
            }
            await submitBobOneStop(submissionType, payload);
            setSubmitted(true);
            setForm({});
            setSelectedStudentIds([]);
            setSubmitAnonymously(false);
            setPendingFiles([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Submit failed');
        } finally {
            setSubmitting(false);
        }
    }

    if (!submissionType || !formDef) {
        return <FormsHub returnHref={returnHref} studentMode={isStudent} />;
    }

    if (isStudent && submissionType !== "anonymous_feedback") {
        return <FormsHub returnHref={returnHref} studentMode />;
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Submitted</h1>
                    <p className="text-gray-600 mb-6">Your {formDef.title.toLowerCase()} has been received.</p>
                    <div className="flex flex-col gap-2 items-center">
                        {returnHref ? (
                            <Link href={returnHref} className="text-orange-600 hover:underline font-medium">
                                Back to student
                            </Link>
                        ) : null}
                        <button type="button" onClick={resetFormState} className="text-gray-600 hover:underline font-medium">
                            Submit another
                        </button>
                        <button type="button" onClick={backToHub} className="text-orange-600 hover:underline font-medium">
                            Back to forms
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const hubParams = new URLSearchParams();
    if (returnHref) hubParams.set('returnTo', returnHref);
    const hubHref = hubParams.toString()
        ? `/app/bob/submit?${hubParams.toString()}`
        : '/app/bob/submit';

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-orange-50">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <Link href={hubHref} className="text-xs font-medium text-orange-700 hover:underline">
                                ← All forms
                            </Link>
                            <h1 className="text-xl font-bold text-gray-900 mt-1">{formDef.title}</h1>
                            <p className="text-sm text-gray-600 mt-1">{formDef.description}</p>
                        </div>
                        {returnHref ? (
                            <Link href={returnHref} className="text-sm text-orange-600 hover:underline shrink-0">
                                Back
                            </Link>
                        ) : null}
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
                    )}

                    {submissionType !== 'anonymous_feedback' ? submittedByField : null}

                    {submissionType === 'incident' && (
                        <>
                            <StudentMultiSelect
                                students={students}
                                loading={studentsLoading}
                                selectedIds={selectedStudentIds}
                                onChange={(ids, labels) => {
                                    setSelectedStudentIds(ids);
                                    setForm((f) => ({
                                        ...f,
                                        student: labels,
                                        studentId: ids[0] || '',
                                    }));
                                }}
                            />
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={form.incidentType ?? ''} onChange={(e) => setForm((f) => ({ ...f, incidentType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"><option value="">Select</option><option value="behavior">Behavior</option><option value="safety">Safety</option><option value="medical">Medical</option><option value="parent_contact">Parent contact</option></select></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" rows={3} required placeholder="What happened?" /></div>
                            <div>
                                <span className="block text-sm font-medium text-gray-700 mb-2">Was a parent/guardian contacted?</span>
                                <div className="flex gap-4">
                                    {(['yes', 'no'] as const).map((value) => (
                                        <label key={value} className="inline-flex items-center gap-2 text-sm text-gray-700">
                                            <input
                                                type="radio"
                                                name="parentContacted"
                                                value={value}
                                                checked={(form.parentContacted ?? '') === value}
                                                onChange={() => setForm((f) => ({ ...f, parentContacted: value }))}
                                                className="text-orange-500 focus:ring-orange-500"
                                            />
                                            {value === 'yes' ? 'Yes' : 'No'}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Severity</label><select value={form.severity ?? ''} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"><option value="">Select</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length) setPendingFiles((prev) => [...prev, ...files]);
                                        e.target.value = '';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    Add photos or documents
                                </button>
                                {pendingFiles.length > 0 ? (
                                    <ul className="mt-2 space-y-1">
                                        {pendingFiles.map((file, idx) => (
                                            <li key={`${file.name}-${idx}`} className="flex items-center justify-between text-sm text-gray-600">
                                                <span className="truncate">{file.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
                                                    className="text-gray-400 hover:text-gray-600 ml-2"
                                                >
                                                    Remove
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="mt-1 text-xs text-gray-500">Photos, PDFs, and documents (max 2MB each).</p>
                                )}
                            </div>
                        </>
                    )}
                    {submissionType === 'wellness_check' && (
                        <>
                            {studentDropdown}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    How is the student feeling this week? (1–10)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={form.wellnessScore ?? ''}
                                    onChange={(e) => setForm((f) => ({ ...f, wellnessScore: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                    required
                                    placeholder="1 = struggling, 10 = thriving"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Scores 1–4 automatically escalate to program leadership.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Why?</label>
                                <textarea
                                    value={form.wellnessReason ?? ''}
                                    onChange={(e) => setForm((f) => ({ ...f, wellnessReason: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                    rows={4}
                                    required
                                    placeholder="What did the student share or what did you observe?"
                                />
                            </div>
                            {wellnessPodId && wellnessPodStudentIds.length === 0 && !studentsLoading ? (
                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    No students are assigned to your pod yet.
                                </p>
                            ) : null}
                        </>
                    )}
                    {submissionType === 'blitz_points' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={form.blitzCategory ?? ''}
                                    onChange={(e) => {
                                        const id = e.target.value;
                                        const meta = blitzOptions?.categories?.find((c) => c.id === id);
                                        setForm((f) => ({
                                            ...f,
                                            blitzCategory: id,
                                            points: meta?.fixedPoints ? String(meta.defaultPoints) : '',
                                        }));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                    required
                                    disabled={blitzOptionsLoading}
                                >
                                    <option value="">
                                        {blitzOptionsLoading ? 'Loading…' : 'Select category'}
                                    </option>
                                    {blitzOptions?.categories?.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Blitz team</label>
                                <select
                                    value={form.team ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const opt = blitzTeamOptions.find((o) => o.value === value);
                                        setForm((f) => ({
                                            ...f,
                                            team: value,
                                            blitzScope: opt?.blitzScope ?? '',
                                            blitzColor: opt?.blitzColor ?? '',
                                            blitzTrack: opt?.blitzTrack ?? '',
                                        }));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                    required
                                    disabled={blitzOptionsLoading}
                                >
                                    <option value="">
                                        {blitzOptionsLoading ? 'Loading teams…' : 'Select team'}
                                    </option>
                                    {blitzOptions?.trackTeams?.length ? (
                                        <optgroup label="Track teams (color + program track)">
                                            {blitzOptions.trackTeams.map((o) => (
                                                <option key={`t-${o.value}`} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ) : null}
                                    {blitzOptions?.globalTeams?.length || blitzOptions?.colors?.length ? (
                                        <optgroup label="Global color teams">
                                            {(blitzOptions.globalTeams ?? blitzOptions.colors ?? []).map((o) => (
                                                <option key={`g-${o.value}`} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ) : null}
                                    {blitzOptions?.squads?.length ? (
                                        <optgroup label="Squads (BoB '26)">
                                            {blitzOptions.squads.map((o) => (
                                                <option key={`s-${o.value}`} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ) : null}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Track awards also roll up to the matching global color team on the leaderboard.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                                {blitzCategoryMeta?.fixedPoints ? (
                                    <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
                                        {blitzCategoryMeta.defaultPoints} points (fixed for this category)
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="number"
                                            min={1}
                                            max={blitzOptions?.coachingWeeklyCap ?? 10}
                                            value={form.points ?? ''}
                                            onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                            placeholder="Points"
                                            required={Boolean(form.blitzCategory)}
                                            disabled={!form.blitzCategory}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Coaching cap: {blitzOptions?.coachingWeeklyCap ?? 10} points per team per program week.
                                        </p>
                                    </>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <input
                                    type="text"
                                    value={form.reason ?? ''}
                                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                    placeholder="What did the team earn points for?"
                                />
                            </div>
                        </>
                    )}
                    {submissionType === 'anonymous_feedback' && (
                        <>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={form.category ?? ''} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"><option value="">Select</option><option value="program">Program</option><option value="logistics">Logistics</option><option value="other">Other</option></select></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label><textarea value={form.feedback ?? ''} onChange={(e) => setForm((f) => ({ ...f, feedback: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" rows={4} placeholder="Share your feedback" required /></div>
                            <label className="flex items-start gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={submitAnonymously}
                                    onChange={(e) => setSubmitAnonymously(e.target.checked)}
                                    className="mt-0.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                                <span>
                                    Submit anonymously
                                    <span className="block text-xs text-gray-500 mt-0.5">
                                        {submitAnonymously
                                            ? 'Your name will not be shown with this feedback.'
                                            : `Submitted as ${submitterName}.`}
                                    </span>
                                </span>
                            </label>
                        </>
                    )}
                    {submissionType && isStaffFormType(submissionType) ? (
                        <StaffRequestFormFields
                            type={submissionType}
                            form={form}
                            setForm={setForm}
                            pendingFiles={pendingFiles}
                            setPendingFiles={setPendingFiles}
                            fileInputRef={fileInputRef}
                        />
                    ) : null}
                    {submissionType && isCoachFeedbackType(submissionType) ? (
                        <CoachFeedbackFormFields form={form} setForm={setForm} />
                    ) : null}

                    <div className="pt-4 flex gap-3">
                        <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 text-sm font-medium">
                            {submitting ? 'Submitting…' : formDef.submitLabel}
                        </button>
                        <Link href={hubHref} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium text-center">Cancel</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
