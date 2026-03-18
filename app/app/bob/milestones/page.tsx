'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getBobMilestones, updateBobMilestone, BobMilestone } from '@/lib/api';
import { Skeleton } from '@/components/Skeleton';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekMonday(d: Date): string {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date.toISOString().slice(0, 10);
}

function getDaysInWeek(mondayISO: string): string[] {
    const out: string[] = [];
    const start = new Date(mondayISO);
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        out.push(d.toISOString().slice(0, 10));
    }
    return out;
}

function getWeekForDate(dateISO: string): string {
    return getWeekMonday(new Date(dateISO));
}

/** Bet on Baltimore has no organization; milestones use fixed context 'bob'. */
const BOB_MILESTONES_ORG_ID = 'bob';

export default function BobMilestonesPage() {
    const orgId = BOB_MILESTONES_ORG_ID;
    const [data, setData] = useState<BobMilestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<'all' | 'pending_review'>('all');
    const [view, setView] = useState<'list' | 'grid' | 'studentWeek'>('grid');
    const [weekOf, setWeekOf] = useState(() => getWeekMonday(new Date()));
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [detailMilestone, setDetailMilestone] = useState<BobMilestone | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBobMilestones({
                orgId,
                tab: tab === 'pending_review' ? 'pending_review' : undefined,
            });
            setData(res.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load milestones');
        } finally {
            setLoading(false);
        }
    }, [orgId, tab]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const weekDays = useMemo(() => getDaysInWeek(weekOf), [weekOf]);

    const milestonesByWeekDay = useMemo(() => {
        const map = new Map<string, BobMilestone[]>();
        weekDays.forEach((d) => map.set(d, []));
        data.forEach((m) => {
            const target = m.targetDate || m.targetEndDate;
            if (target && weekDays.includes(target)) {
                const list = map.get(target) || [];
                list.push(m);
                map.set(target, list);
            }
        });
        return map;
    }, [data, weekDays]);

    const programStart = useMemo(() => {
        const d = new Date(weekOf);
        d.setDate(d.getDate() - 7 * 4);
        return d;
    }, [weekOf]);

    const getWeekNumber = useCallback((dateStr: string) => {
        const d = new Date(dateStr);
        const diff = d.getTime() - programStart.getTime();
        const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
        return Math.max(1, Math.min(5, week));
    }, [programStart]);

    const studentWeekGrid = useMemo(() => {
        const byOwner = new Map<string, { name: string; weeks: Map<number, BobMilestone[]> }>();
        data.forEach((m) => {
            const owner = m.ownerId || m.ownerName || '—';
            const name = m.ownerName || owner;
            let row = byOwner.get(owner);
            if (!row) {
                row = { name, weeks: new Map() };
                byOwner.set(owner, row);
            }
            const wn = getWeekNumber(m.targetDate || m.targetEndDate || weekOf);
            const list = row.weeks.get(wn) || [];
            list.push(m);
            row.weeks.set(wn, list);
        });
        return Array.from(byOwner.entries()).map(([ownerId, row]) => ({ ownerId, ...row }));
    }, [data, getWeekNumber, weekOf]);

    async function handleReviewStatusChange(milestone: BobMilestone, newStatus: string) {
        setUpdatingId(milestone.id);
        try {
            const updated = await updateBobMilestone(orgId, milestone.id, {
                reviewStatus: newStatus || null,
            });
            setData((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        } catch {
            // keep previous state
        } finally {
            setUpdatingId(null);
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div>
                        <Skeleton className="h-7 w-40 mb-2" />
                        <Skeleton className="h-4 w-[520px] max-w-full" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Skeleton className="h-10 w-28" rounded="lg" />
                        <Skeleton className="h-10 w-28" rounded="lg" />
                        <Skeleton className="h-10 w-44" rounded="lg" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="p-4 rounded-lg border border-gray-200 bg-white">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-56" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                                <Skeleton className="h-6 w-20" rounded="full" />
                            </div>
                            <Skeleton className="h-3 w-[520px] max-w-full" />
                        </div>
                    ))}
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
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Milestones</h1>
                <p className="text-gray-600">Program milestones and review status.</p>
            </div>

            {/* Tabs: Grid View / Pending Review — orange underline */}
            <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setTab('all')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === 'all' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                >
                    Grid View
                </button>
                <button
                    type="button"
                    onClick={() => setTab('pending_review')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${tab === 'pending_review' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
                >
                    Pending Review
                    {(tab === 'pending_review' ? data.length : data.filter((m) => m.reviewStatus === 'pending_review' || !m.reviewStatus).length) > 0 && (
                        <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            {tab === 'pending_review' ? data.length : data.filter((m) => m.reviewStatus === 'pending_review' || !m.reviewStatus).length}
                        </span>
                    )}
                </button>
            </div>

            {/* View toggle + week filter */}
            <div className="mb-4 flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">View:</span>
                    <button type="button" onClick={() => setView('grid')} className={`px-3 py-1.5 rounded text-sm font-medium ${view === 'grid' ? 'bg-orange-100 text-orange-800' : 'text-gray-600 hover:bg-gray-100'}`}>Cards</button>
                    <button type="button" onClick={() => setView('list')} className={`px-3 py-1.5 rounded text-sm font-medium ${view === 'list' ? 'bg-orange-100 text-orange-800' : 'text-gray-600 hover:bg-gray-100'}`}>List</button>
                    <button type="button" onClick={() => setView('studentWeek')} className={`px-3 py-1.5 rounded text-sm font-medium ${view === 'studentWeek' ? 'bg-orange-100 text-orange-800' : 'text-gray-600 hover:bg-gray-100'}`}>Student × Week</button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Week of:</span>
                    <input
                        type="date"
                        value={weekOf}
                        onChange={(e) => setWeekOf(getWeekForDate(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>
            </div>

            {/* Student × Week grid (PRD admin rollup) */}
            {view === 'studentWeek' && (
                <div className="mb-6 bg-white border border-gray-200 rounded-lg overflow-x-auto">
                    <h2 className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-200">By student and week</h2>
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                {[1, 2, 3, 4, 5].map((w) => (
                                    <th key={w} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Week {w}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {studentWeekGrid.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No milestones yet.</td></tr>
                            ) : (
                                studentWeekGrid.map(({ ownerId, name, weeks }) => (
                                    <tr key={ownerId} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{name}</td>
                                        {[1, 2, 3, 4, 5].map((w) => {
                                            const list = weeks.get(w) || [];
                                            const m = list[0];
                                            const status = m?.reviewStatus;
                                            return (
                                                <td key={w} className="px-2 py-2 text-center">
                                                    {m ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setDetailMilestone(m)}
                                                            className={`inline-flex items-center justify-center w-8 h-8 rounded text-xs font-medium ${
                                                                status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                status === 'changes_requested' ? 'bg-red-100 text-red-800' :
                                                                status === 'pending_review' || !status ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                                                            }`}
                                                            title={m.name}
                                                        >
                                                            {status === 'approved' ? '✓' : status === 'changes_requested' ? 'R' : status === 'pending_review' || !status ? 'P' : '—'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Week columns view (by day) — hide when Student × Week is selected */}
            {view !== 'studentWeek' && (
            <div className="mb-6 bg-white border border-gray-200 rounded-lg overflow-x-auto">
                <h2 className="px-4 py-3 text-sm font-semibold text-gray-700 border-b border-gray-200">By week</h2>
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                            {weekDays.map((d) => (
                                <th key={d} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {DAY_NAMES[new Date(d).getDay()]} {d.slice(5)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td className="px-4 py-3 text-sm font-medium text-gray-700">Milestones due</td>
                            {weekDays.map((d) => {
                                const list = milestonesByWeekDay.get(d) || [];
                                return (
                                    <td key={d} className="px-3 py-3 text-sm text-gray-600">
                                        {list.length > 0 ? (
                                            <div className="space-y-1">
                                                {list.slice(0, 3).map((m) => (
                                                    <div key={m.id} className="truncate" title={m.name}>
                                                        {m.name}
                                                    </div>
                                                ))}
                                                {list.length > 3 && <span className="text-gray-400">+{list.length - 3} more</span>}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
            )}

            {/* Grid or list view */}
            {view === 'studentWeek' ? null : view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.length === 0 ? (
                        <div className="col-span-full p-8 text-center text-gray-500 rounded-lg border border-gray-200 bg-gray-50">
                            No milestones found. {tab === 'pending_review' && 'Switch to "All" to see all milestones.'}
                        </div>
                    ) : (
                        data.map((m) => (
                            <div
                                key={m.id}
                                className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => setDetailMilestone(m)}
                            >
                                <h3 className="font-semibold text-gray-900 truncate" title={m.name}>{m.name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{m.scopeArea} · {m.ownerName || '—'}</p>
                                <p className="text-sm text-gray-600 mt-2">Target: {m.targetDate || '—'}</p>
                                <p className="text-sm text-gray-600">Status: {m.status}</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Review:</span>
                                    <select
                                        value={m.reviewStatus || ''}
                                        onChange={(e) => { e.stopPropagation(); handleReviewStatusChange(m, e.target.value); }}
                                        disabled={updatingId === m.id}
                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                    >
                                        <option value="">—</option>
                                        <option value="pending_review">Pending review</option>
                                        <option value="approved">Approved</option>
                                        <option value="changes_requested">Changes requested</option>
                                    </select>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {data.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No milestones found.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{m.scopeArea}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{m.targetDate || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{m.status}</td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={m.reviewStatus || ''}
                                                onChange={(e) => handleReviewStatusChange(m, e.target.value)}
                                                disabled={updatingId === m.id}
                                                className="text-sm border border-gray-300 rounded px-2 py-1"
                                            >
                                                <option value="">—</option>
                                                <option value="pending_review">Pending review</option>
                                                <option value="approved">Approved</option>
                                                <option value="changes_requested">Changes requested</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
            {data.length > 0 && <p className="mt-2 text-sm text-gray-500">{data.length} milestone(s)</p>}

            {/* Milestone detail panel */}
            {detailMilestone && (
                <>
                    <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDetailMilestone(null)} aria-hidden />
                    <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-xl z-50 overflow-y-auto border-l border-gray-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Milestone detail</h2>
                                <button type="button" onClick={() => setDetailMilestone(null)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <p className="font-medium text-gray-900">{detailMilestone.name}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{detailMilestone.scopeArea}</p>
                            <p className="text-sm text-gray-600 mt-2">Student: {detailMilestone.ownerName || '—'}</p>
                            <p className="text-sm text-gray-600">Target: {detailMilestone.targetDate || '—'}</p>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Review status</label>
                                <select
                                    value={detailMilestone.reviewStatus || ''}
                                    onChange={(e) => { handleReviewStatusChange(detailMilestone, e.target.value); setDetailMilestone((prev) => prev ? { ...prev, reviewStatus: e.target.value || null } : null); }}
                                    disabled={updatingId === detailMilestone.id}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">—</option>
                                    <option value="pending_review">Pending review</option>
                                    <option value="approved">Approved</option>
                                    <option value="changes_requested">Changes requested</option>
                                </select>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <Link href={`/app/bob/roster?student=${detailMilestone.ownerId}`} className="text-sm font-medium text-orange-600 hover:underline">View full portfolio →</Link>
                            </div>
                            <button type="button" onClick={() => setDetailMilestone(null)} className="mt-6 w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">Close</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
