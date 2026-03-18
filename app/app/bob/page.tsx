'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getBobCommandCenterStats, BobCommandCenterStats } from '@/lib/api';
import { Skeleton } from '@/components/Skeleton';

/**
 * Bet On Baltimore Operations Engine — Command Center dashboard.
 * BOB-specific widgets (cards, attendance by site, etc.) + feature links.
 */
export default function BobDashboardPage() {
    const [bobStats, setBobStats] = useState<BobCommandCenterStats | null>(null);
    const [loading, setLoading] = useState(true);

    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const stats = await getBobCommandCenterStats().catch(() => null);
            setBobStats(stats);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    return (
        <div className="p-6">
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
                    <p className="mt-1 text-gray-600">Bet on Baltimore 2026 — Week 3 of 5</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={loadStats} disabled={loading} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Sync Now
                    </button>
                    <Link href="/app/bob/attendance" className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </Link>
                </div>
            </div>

            {/* BOB Command Center widgets — orange theme */}
            {loading ? (
                <div className="mb-8 space-y-6">
                    <Skeleton className="h-4 w-48" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-lg border border-gray-200 bg-white">
                                <Skeleton className="h-3 w-28 mb-2" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-lg border border-gray-200 bg-white">
                                <Skeleton className="h-5 w-44 mb-4" />
                                <div className="space-y-3">
                                    {Array.from({ length: 4 }).map((__, j) => (
                                        <div key={j}>
                                            <div className="flex items-center justify-between mb-2">
                                                <Skeleton className="h-3 w-40" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                            <Skeleton className="h-2 w-full rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : bobStats ? (
                <div className="mb-8 space-y-6">
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Program Overview</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="p-4 rounded-lg border border-gray-200 bg-white">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Students Enrolled</p>
                            <p className="text-2xl font-bold text-gray-900">{bobStats.cards.studentsEnrolled}</p>
                        </div>
                        <div className="p-4 rounded-lg border border-gray-200 bg-white">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">YouthWorks Synced</p>
                            <p className="text-2xl font-bold text-gray-900">{bobStats.cards.youthWorksSynced}%</p>
                        </div>
                        <div className="p-4 rounded-lg border border-gray-200 bg-white">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <span className="w-5 h-5 rounded bg-orange-100 flex items-center justify-center text-orange-600">✓</span>
                                Checked In Today
                            </p>
                            <p className="text-2xl font-bold text-gray-900">{bobStats.cards.checkedInToday}</p>
                        </div>
                        <div className="p-4 rounded-lg border border-gray-200 bg-white">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <span className="w-5 h-5 rounded bg-orange-100 flex items-center justify-center text-orange-600">✓</span>
                                Milestones This Week
                            </p>
                            <p className="text-2xl font-bold text-gray-900">{bobStats.cards.milestonesThisWeek}%</p>
                        </div>
                        <div className="p-4 rounded-lg border border-gray-200 bg-white">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Open Discrepancies</p>
                            <p className="text-2xl font-bold text-gray-900">{bobStats.cards.openDiscrepancies}</p>
                        </div>
                    </div>
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider pt-2">Today</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="p-4 rounded-lg border border-gray-200 bg-white">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Attendance by Site</h2>
                            <div className="space-y-3">
                                {bobStats.attendanceBySite.length === 0 ? (
                                    <p className="text-sm text-gray-500">No site data</p>
                                ) : (
                                    bobStats.attendanceBySite.map((site) => {
                                        const total = site.present + site.absent + site.excused + site.late || 1;
                                        const pct = total ? Math.round((site.present / total) * 100) : 0;
                                        return (
                                            <div key={site.siteId}>
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="font-medium text-gray-900">{site.siteName}</span>
                                                    <span className="text-gray-600">{site.present}/{total} ({pct}%)</span>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <Link href="/app/bob/attendance" className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700">View full attendance grid →</Link>
                        </div>
                        <div className="p-4 rounded-lg border border-gray-200 bg-white">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">No-Shows Today</h2>
                            <div className="space-y-1">
                                {bobStats.noShowsToday.length === 0 ? (
                                    <p className="text-sm text-gray-500">None</p>
                                ) : (
                                    <p className="text-sm text-gray-700">{bobStats.noShowsToday.length} student(s)</p>
                                )}
                            </div>
                            <Link href="/app/bob/attendance" className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700">Resolve missing clock-ins →</Link>
                        </div>
                        <div className="p-4 rounded-lg border border-gray-200 bg-white">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Milestone Submission by Track</h2>
                            <div className="space-y-3">
                                {bobStats.milestoneSubmissionByTrack.length === 0 ? (
                                    <p className="text-sm text-gray-500">No tracks</p>
                                ) : (
                                    bobStats.milestoneSubmissionByTrack.map((t) => {
                                        const pct = t.total ? Math.round((t.submitted / t.total) * 100) : 0;
                                        return (
                                            <div key={t.track}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-gray-900">{t.track}</span>
                                                    <span className="text-gray-600">{t.submitted}/{t.total} ({pct}%)</span>
                                                </div>
                                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        <div className="p-4 rounded-lg border border-gray-200 bg-white">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">At-Risk Students</h2>
                            <div className="space-y-2">
                                {bobStats.atRiskStudents.length === 0 ? (
                                    <p className="text-sm text-gray-500">None</p>
                                ) : (
                                    bobStats.atRiskStudents.slice(0, 5).map((s) => (
                                        <div key={s.id} className="text-sm text-gray-700">
                                            {s.firstName} {s.lastName}
                                            <span className="ml-2 text-xs text-gray-500">({s.status})</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="p-4 rounded-lg border border-gray-200 bg-white lg:col-span-2">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">Blitz Teams This Week</h2>
                            <div className="flex flex-wrap gap-2">
                                {bobStats.blitzTeams.length === 0 ? (
                                    <p className="text-sm text-gray-500">No teams</p>
                                ) : (
                                    bobStats.blitzTeams.map((t) => (
                                        <span key={t.id} className="px-3 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-full text-sm font-medium">
                                            {t.name}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: 'Roster Management', desc: 'Students', href: '/app/bob/roster', status: null },
                    { label: 'Pods', desc: 'Pod assignments', href: '/app/bob/pods', status: null },
                    { label: 'Attendance', desc: 'Mark & view attendance', href: '/app/bob/attendance', status: null },
                    { label: 'Interview pipeline', desc: 'Interview tracking', href: '/app/bob/interview', status: null },
                    { label: 'Milestones', desc: 'Program milestones', href: '/app/bob/milestones', status: null },
                    { label: 'Reports', desc: 'Reports & analytics', href: '/app/bob/reports', status: null },
                ].map((card) => (
                    <div
                        key={card.label}
                        className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                    >
                        {card.href ? (
                            <Link href={card.href} className="block group">
                                <h2 className="font-semibold text-gray-900 group-hover:text-orange-600">{card.label}</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{card.desc}</p>
                                <p className="text-xs text-orange-600 mt-2">Open →</p>
                            </Link>
                        ) : (
                            <>
                                <h2 className="font-semibold text-gray-900">{card.label}</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{card.desc}</p>
                                <p className="text-xs text-gray-400 mt-2">{card.status}</p>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

