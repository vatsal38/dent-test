'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
    getBobStudents,
    importBobStudentsFromAirtable,
    BobStudent,
    BobStudentsListParams,
    BOB_STUDENT_STATUSES,
    BOB_INTERVIEW_STAGES,
    BobStudentStatus,
    BobInterviewStage,
} from '@/lib/api';

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

export default function RosterPage() {
    const [data, setData] = useState<{ students: BobStudent[]; total: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<BobStudentStatus | ''>('');
    const [stageFilter, setStageFilter] = useState<BobInterviewStage | ''>('');
    const [search, setSearch] = useState('');
    const [importing, setImporting] = useState(false);
    const [importMessage, setImportMessage] = useState<string | null>(null);
    const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: BobStudentsListParams = { limit: 100, offset: 0 };
            if (statusFilter) params.status = statusFilter;
            if (stageFilter) params.interviewStage = stageFilter;
            if (search.trim()) params.search = search.trim();
            const res = await getBobStudents(params);
            setData({ students: res.students, total: res.total });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load roster');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, stageFilter, search]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleImportFromAirtable() {
        setImporting(true);
        setImportMessage(null);
        try {
            const res = await importBobStudentsFromAirtable();
            setImportMessage(res.message ?? `Imported ${res.imported} student(s).`);
            if (res.imported > 0) loadData();
        } catch (err) {
            setImportMessage(err instanceof Error ? err.message : 'Import failed');
        } finally {
            setImporting(false);
        }
    }

    function handleExportCsv() {
        if (!data?.students?.length) return;
        const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Interview Stage', 'Pod ID', 'School', 'Track', 'Coach', 'Stage', 'YW Status', 'Attendance', 'Milestones'];
        const rows = data.students.map((s) => {
            const att = s.attendanceStats ? `${s.attendanceStats.present ?? 0}P/${s.attendanceStats.absent ?? 0}A` : '';
            const mil = s.milestoneStats ? `${s.milestoneStats.submitted ?? 0}/${s.milestoneStats.total ?? 0}` : '';
            return [
                s.firstName,
                s.lastName,
                s.email ?? '',
                s.phone ?? '',
                s.status,
                s.interviewStage,
                s.podId ?? '',
                s.school ?? '',
                s.track ?? '',
                s.coach ?? '',
                s.stage ?? '',
                s.ywStatus ?? '',
                att,
                mil,
            ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
        });
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bob-students-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                    <p className="text-gray-600">{data?.total ?? 0} enrolled</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={!data?.students?.length}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export CSV
                    </button>
                    <button
                        type="button"
                        onClick={handleImportFromAirtable}
                        disabled={importing}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        {importing ? 'Importing…' : 'Import from Airtable'}
                    </button>
                    <Link
                        href="/app/bob/roster/new"
                        className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <span>+</span> Add Student
                    </Link>
                </div>
            </div>
            {importMessage && (
                <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
                    {importMessage}
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <input
                    type="text"
                    placeholder="Search name, school, YW ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-72 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter((e.target.value || '') as BobStudentStatus | '')}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="">All statuses</option>
                    {BOB_STUDENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                </select>
                <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter((e.target.value || '') as BobInterviewStage | '')}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                    <option value="">All interview stages</option>
                    {BOB_INTERVIEW_STAGES.map((s) => (
                        <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {!data || data.students.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No students found. Add a student to get started.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Track</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YW Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Milestones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.students.map((s) => {
                                    const initial = (s.firstName?.[0] || '') + (s.lastName?.[0] || '') || '?';
                                    const total = s.milestoneStats?.total ?? 0;
                                    const submitted = s.milestoneStats?.submitted ?? 0;
                                    const pct = total ? Math.round((submitted / total) * 100) : 0;
                                    const present = s.attendanceStats?.present ?? 0;
                                    const absent = s.attendanceStats?.absent ?? 0;
                                    const dots = 4;
                                    const greenDots = Math.min(present, dots);
                                    const redDots = Math.min(absent, dots - greenDots);
                                    const grayDots = dots - greenDots - redDots;
                                    const ywOk = s.ywStatus && String(s.ywStatus).toLowerCase() !== 'error' && String(s.ywStatus).toLowerCase() !== 'failed';
                                    return (
                                        <tr
                                            key={s.id}
                                            className="hover:bg-gray-50 cursor-pointer"
                                            onClick={() => setDetailStudentId(s.id)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-8 h-8 rounded-full bg-orange-500 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                                                        {initial}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{s.school || '—'}</td>
                                            <td className="px-4 py-3">
                                                {s.track ? (
                                                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                        {s.track}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{s.coach || '—'}</td>
                                            <td className="px-4 py-3">
                                                {s.stage ? (
                                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                                        s.stage.toLowerCase().includes('placed') ? 'bg-yellow-100 text-yellow-800' :
                                                        s.stage.toLowerCase().includes('program') ? 'bg-green-100 text-green-800' :
                                                        s.stage.toLowerCase().includes('sync') ? 'bg-purple-100 text-purple-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {s.stage}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {ywOk ? (
                                                    <span className="text-green-600" title="Synced"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></span>
                                                ) : (
                                                    <span className="text-red-600" title="Issue"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-0.5">
                                                    {Array.from({ length: greenDots }, (_, i) => <span key={`g-${i}`} className="w-2 h-2 rounded-full bg-green-500" />)}
                                                    {Array.from({ length: redDots }, (_, i) => <span key={`r-${i}`} className="w-2 h-2 rounded-full bg-red-500" />)}
                                                    {Array.from({ length: grayDots }, (_, i) => <span key={`x-${i}`} className="w-2 h-2 rounded-full bg-gray-300" />)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {s.milestoneStats != null ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-700">{submitted}/{total}</span>
                                                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                ) : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {data && data.total > 0 && (
                <p className="mt-2 text-sm text-gray-500">Showing {data.students.length} of {data.total}</p>
            )}

            {/* Student detail slide-over (480px) */}
            {detailStudentId && data && (() => {
                const s = data.students.find((x) => x.id === detailStudentId);
                if (!s) return null;
                const initial = (s.firstName?.[0] || '') + (s.lastName?.[0] || '') || '?';
                const total = s.milestoneStats?.total ?? 0;
                const submitted = s.milestoneStats?.submitted ?? 0;
                const ywOk = s.ywStatus && String(s.ywStatus).toLowerCase() !== 'error' && String(s.ywStatus).toLowerCase() !== 'failed';
                const present = s.attendanceStats?.present ?? 0;
                const absent = s.attendanceStats?.absent ?? 0;
                const dots = 4;
                const greenDots = Math.min(present, dots);
                const redDots = Math.min(absent, dots - greenDots);
                const grayDots = dots - greenDots - redDots;
                return (
                    <>
                        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDetailStudentId(null)} aria-hidden />
                        <div className="fixed top-0 right-0 w-[480px] max-w-full h-full bg-white shadow-xl z-50 overflow-y-auto border-l border-gray-200 flex flex-col">
                            <div className="p-6 border-b border-gray-200 flex items-start justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className="w-12 h-12 rounded-full bg-orange-500 text-white text-lg font-semibold flex items-center justify-center">{initial}</span>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">{s.firstName} {s.lastName}</h2>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                        {s.track && <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">{s.track}</span>}
                                        {s.stage && <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{s.stage}</span>}
                                        </div>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setDetailStudentId(null)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-6 space-y-5 overflow-y-auto">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">YouthWorks</h3>
                                    <p className="text-sm text-gray-600">ID: {s.ywStatus || '—'}</p>
                                    <span className={`inline-flex mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${ywOk ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {ywOk ? 'Synced' : 'Not synced'}
                                    </span>
                                    <button type="button" className="ml-2 text-xs text-orange-600 hover:underline">Manual sync</button>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Attendance this week</h3>
                                    <div className="flex gap-1">
                                        {Array.from({ length: greenDots }, (_, i) => <span key={`g-${i}`} className="w-3 h-3 rounded-full bg-green-500" />)}
                                        {Array.from({ length: redDots }, (_, i) => <span key={`r-${i}`} className="w-3 h-3 rounded-full bg-red-500" />)}
                                        {Array.from({ length: grayDots }, (_, i) => <span key={`x-${i}`} className="w-3 h-3 rounded-full bg-gray-300" />)}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{present} present, {absent} absent (summary)</p>
                                    <Link href="/app/bob/attendance" className="text-xs text-orange-600 hover:underline mt-1 inline-block">View full grid →</Link>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Milestones</h3>
                                    <p className="text-sm text-gray-600">{submitted} / {total} submitted</p>
                                    <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${total ? (submitted / total) * 100 : 0}%` }} />
                                    </div>
                                    <Link href="/app/bob/milestones" className="text-xs text-orange-600 hover:underline mt-1 inline-block">View all milestones →</Link>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Details</h3>
                                    <dl className="text-sm space-y-1">
                                        <div><dt className="text-gray-500 inline">School: </dt><dd className="inline text-gray-900">{s.school || '—'}</dd></div>
                                        <div><dt className="text-gray-500 inline">Coach: </dt><dd className="inline text-gray-900">{s.coach || '—'}</dd></div>
                                        <div><dt className="text-gray-500 inline">Email: </dt><dd className="inline text-gray-900">{s.email || '—'}</dd></div>
                                    </dl>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Coach notes</h3>
                                    <textarea placeholder="Add a note…" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500" rows={3} />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Link href={`/app/bob/roster?student=${s.id}`} className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium">Edit student</Link>
                                    <button type="button" onClick={() => setDetailStudentId(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Close</button>
                                </div>
                            </div>
                        </div>
                    </>
                );
            })()}
        </div>
    );
}
