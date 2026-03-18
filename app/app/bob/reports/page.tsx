'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getBobCommandCenterStats, BobCommandCenterStats } from '@/lib/api';
import { HiOutlineChartBar, HiOutlineClipboardCheck, HiOutlineUserGroup, HiOutlineExclamationCircle } from 'react-icons/hi';
import { Skeleton } from '@/components/Skeleton';

export default function BobReportsPage() {
    const [stats, setStats] = useState<BobCommandCenterStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getBobCommandCenterStats();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load reports');
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
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-10 w-24" rounded="lg" />
                </div>
                <div className="space-y-6">
                    <div>
                        <Skeleton className="h-4 w-40 mb-4" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="p-4 rounded-lg border border-gray-200 bg-white">
                                    <Skeleton className="h-3 w-28 mb-2" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Skeleton className="h-4 w-44 mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="p-4 rounded-lg border border-gray-200 bg-white">
                                    <Skeleton className="h-4 w-56 mb-2" />
                                    <Skeleton className="h-3 w-[520px] max-w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
                <Link href="/app/bob" className="mt-4 inline-block text-sm text-orange-600 hover:underline">← Back to Command Center</Link>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports & analytics</h1>
                    <p className="text-gray-600">Program overview and key metrics.</p>
                </div>
                <button type="button" onClick={loadData} disabled={loading} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium">
                    Refresh
                </button>
            </div>

            {stats && (
                <div className="space-y-6">
                    <section>
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <HiOutlineChartBar className="w-4 h-4" />
                            Program overview
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="p-4 rounded-lg border border-gray-200 bg-white">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Students enrolled</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.cards.studentsEnrolled}</p>
                            </div>
                            <div className="p-4 rounded-lg border border-gray-200 bg-white">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">YouthWorks synced</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.cards.youthWorksSynced}%</p>
                            </div>
                            <div className="p-4 rounded-lg border border-gray-200 bg-white">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Checked in today</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.cards.checkedInToday}</p>
                            </div>
                            <div className="p-4 rounded-lg border border-gray-200 bg-white">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <HiOutlineClipboardCheck className="w-4 h-4 text-orange-500" />
                                    Milestones this week
                                </p>
                                <p className="text-2xl font-bold text-gray-900">{stats.cards.milestonesThisWeek}%</p>
                            </div>
                            <div className="p-4 rounded-lg border border-gray-200 bg-white">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <HiOutlineExclamationCircle className="w-4 h-4 text-amber-500" />
                                    Open discrepancies
                                </p>
                                <p className="text-2xl font-bold text-gray-900">{stats.cards.openDiscrepancies}</p>
                                <Link href="/app/bob/attendance/discrepancies" className="text-xs text-orange-600 hover:underline mt-1 inline-block">View →</Link>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Attendance by site</h2>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            {stats.attendanceBySite.length === 0 ? (
                                <p className="p-6 text-gray-500 text-sm">No site data</p>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {stats.attendanceBySite.map((site) => {
                                        const total = site.present + site.absent + site.excused + site.late || 1;
                                        const pct = total ? Math.round((site.present / total) * 100) : 0;
                                        return (
                                            <div key={site.siteId} className="px-6 py-4 flex items-center gap-4">
                                                <div className="min-w-[140px] font-medium text-gray-900">{site.siteName}</div>
                                                <div className="flex-1 max-w-xs">
                                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600 whitespace-nowrap">
                                                    {site.present}/{total} present ({pct}%)
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                                <Link href="/app/bob/attendance" className="text-sm font-medium text-orange-600 hover:underline">Full attendance grid →</Link>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <HiOutlineUserGroup className="w-4 h-4" />
                            Milestone submission by track
                        </h2>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            {stats.milestoneSubmissionByTrack.length === 0 ? (
                                <p className="p-6 text-gray-500 text-sm">No track data</p>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {stats.milestoneSubmissionByTrack.map((t) => {
                                        const pct = t.total ? Math.round((t.submitted / t.total) * 100) : 0;
                                        return (
                                            <div key={t.track} className="px-6 py-4 flex items-center gap-4">
                                                <div className="min-w-[120px] font-medium text-gray-900">{t.track}</div>
                                                <div className="flex-1 max-w-xs">
                                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-600">{t.submitted}/{t.total} ({pct}%)</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                                <Link href="/app/bob/milestones" className="text-sm font-medium text-orange-600 hover:underline">Milestones admin →</Link>
                            </div>
                        </div>
                    </section>

                    {stats.atRiskStudents.length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">At-risk students</h2>
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <ul className="space-y-2">
                                    {stats.atRiskStudents.slice(0, 10).map((s) => (
                                        <li key={s.id} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-900">{s.firstName} {s.lastName}</span>
                                            <span className="text-gray-500">{s.status}</span>
                                            <Link href={`/app/bob/roster?student=${s.id}`} className="text-orange-600 hover:underline">View →</Link>
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/app/bob/roster" className="mt-3 inline-block text-sm font-medium text-orange-600 hover:underline">Full roster →</Link>
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
