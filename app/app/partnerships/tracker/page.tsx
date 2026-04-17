'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { getPartnerships, PartnershipTotalsResponse, getPartnershipTotals, PartnershipSummary } from '@/lib/api';
import { formatPartnerName } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/Skeleton';

const KNOWN_STAGE_GRADIENTS: Record<string, string> = {
    general_contact: 'from-slate-400 to-slate-600',
    need_outreach: 'from-blue-400 to-blue-600',
    awaiting_response: 'from-amber-400 to-amber-600',
    conversation_active: 'from-emerald-400 to-emerald-600',
    interested: 'from-orange-400 to-orange-600',
    mou_sent: 'from-purple-400 to-purple-600',
    confirmed_locked: 'from-indigo-400 to-indigo-600',
    not_this_season: 'from-gray-400 to-gray-600',
};

const KNOWN_STAGE_BADGES: Record<string, string> = {
    general_contact: 'bg-slate-50 text-slate-700 border-slate-100',
    need_outreach: 'bg-blue-50 text-blue-700 border-blue-100',
    awaiting_response: 'bg-amber-50 text-amber-700 border-amber-100',
    conversation_active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    interested: 'bg-orange-50 text-orange-700 border-orange-100',
    mou_sent: 'bg-purple-50 text-purple-700 border-purple-100',
    confirmed_locked: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    not_this_season: 'bg-gray-50 text-gray-700 border-gray-100',
};

const FALLBACK_STAGE_GRADIENTS = [
    'from-sky-400 to-sky-600',
    'from-teal-400 to-teal-600',
    'from-rose-400 to-rose-600',
    'from-orange-400 to-orange-600',
    'from-lime-400 to-lime-600',
    'from-fuchsia-400 to-fuchsia-600',
    'from-cyan-400 to-cyan-600',
];

const FALLBACK_STAGE_BADGES = [
    'bg-sky-50 text-sky-700 border-sky-100',
    'bg-teal-50 text-teal-700 border-teal-100',
    'bg-rose-50 text-rose-700 border-rose-100',
    'bg-orange-50 text-orange-700 border-orange-100',
    'bg-lime-50 text-lime-700 border-lime-100',
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    'bg-cyan-50 text-cyan-700 border-cyan-100',
];

function simpleHash(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
}

function stageGradient(stage: string) {
    return (
        KNOWN_STAGE_GRADIENTS[stage] ??
        FALLBACK_STAGE_GRADIENTS[simpleHash(stage) % FALLBACK_STAGE_GRADIENTS.length]
    );
}

function stageBadge(stage: string) {
    return (
        KNOWN_STAGE_BADGES[stage] ??
        FALLBACK_STAGE_BADGES[simpleHash(stage) % FALLBACK_STAGE_BADGES.length]
    );
}

function formatRelativeDate(dateStr: string | null) {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function PartnershipTrackerPage() {
    const [partnerships, setPartnerships] = useState<PartnershipSummary[]>([]);
    const [totals, setTotals] = useState<PartnershipTotalsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState('all');

    const stageOptions = useMemo(() => {
        const byStage = totals?.byStage ?? [];
        // Preserve backend ordering; just ensure deterministic type.
        return byStage
            .filter((s) => !!s?.stage)
            .map((s) => ({ value: s.stage, label: s.label || s.stage, count: s.count ?? 0 }));
    }, [totals]);

    const stageCount = useCallback(
        (stage: string) => {
            return (
                totals?.countsByStage?.[stage] ??
                totals?.byStage?.find((s) => s.stage === stage)?.count ??
                0
            );
        },
        [totals]
    );

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [resp, totalsResp] = await Promise.all([
                getPartnerships({
                    view: 'list',
                    limit: 200,
                    sortBy: 'priorityScore',
                    sortOrder: 'desc',
                    stage: stageFilter !== 'all' ? stageFilter : undefined,
                    search: searchQuery.trim() ? searchQuery.trim() : undefined,
                }),
                getPartnershipTotals(),
            ]);
            setPartnerships(resp.partnerships || []);
            setTotals(totalsResp);
        } catch (err) {
            console.error('Failed to load tracker data:', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, stageFilter]);

    useEffect(() => {
        const t = setTimeout(() => loadData(), 250);
        return () => clearTimeout(t);
    }, [loadData]);

    const filteredPartnerships = partnerships;

    if (loading) {
        return (
            <div className="px-6 py-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div>
                            <Skeleton className="h-10 w-[520px] max-w-full mb-2" />
                            <Skeleton className="h-5 w-[620px] max-w-full" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10" rounded="lg" />
                        <Skeleton className="h-10 w-32" rounded="lg" />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-5 rounded-2xl border border-gray-200 bg-white">
                            <Skeleton className="h-4 w-24 mb-3" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <Skeleton className="h-11 flex-1" rounded="lg" />
                    <Skeleton className="h-11 w-48" rounded="lg" />
                </div>

                <div className="space-y-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="p-5 rounded-2xl border border-gray-200 bg-white">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-56" />
                                    <Skeleton className="h-4 w-44" />
                                </div>
                                <Skeleton className="h-7 w-24" rounded="full" />
                            </div>
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Array.from({ length: 4 }).map((__, j) => (
                                    <Skeleton key={j} className="h-10 w-full" rounded="lg" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 py-8 animate-in fade-in duration-500">
            {/* Breadcrumbs & Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="space-y-4">
                    <nav className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <Link href="/app/partnerships" className="hover:text-blue-600 transition-colors">Partnerships</Link>
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-gray-900">Tracker</span>
                    </nav>
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                            Partnership <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Tracker</span>
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl">
                            A birds-eye view of your entire partnership ecosystem. Track health, revenue, and relationship velocity.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => loadData()}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
                        title="Refresh Data"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <Link
                        href="/app/partnerships"
                        className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-semibold shadow-lg shadow-gray-200 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
                    >
                        Pipeline View
                    </Link>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Partnerships</h3>
                        <p className="text-3xl font-bold text-gray-900">{totals?.totals?.totalPartnerships ?? totals?.totalCount ?? 0}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Estimated Revenue</h3>
                        <p className="text-3xl font-bold text-gray-900">
                            ${(totals?.totals?.totalRevenue ?? totals?.totalEstimatedRevenue ?? 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Confirmed Partnerships</h3>
                        <p className="text-3xl font-bold text-gray-900">{stageCount('confirmed_locked')}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">MOU Sent</h3>
                        <p className="text-3xl font-bold text-gray-900">{stageCount('mou_sent')}</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="search"
                        placeholder="Search by partner or contact..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    />
                </div>
                <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-gray-700 bg-white"
                >
                    <option value="all">All Stages</option>
                    {stageOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label} ({s.count})
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ring-1 ring-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-bottom border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest leading-none">Partner Organization</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest leading-none">Primary Contact</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest leading-none">Current Stage</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest leading-none text-center">Priority</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest leading-none">Last Contact</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest leading-none text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredPartnerships.length > 0 ? (
                                filteredPartnerships.map((partnership) => (
                                    <tr
                                        key={partnership.id}
                                        className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                                        onClick={() => window.location.href = `/app/partnerships?id=${partnership.id}`}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm shadow-sm group-hover:from-blue-100 group-hover:to-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                                                    {formatPartnerName(partnership.partnerName).substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{formatPartnerName(partnership.partnerName)}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{partnership.partnerType}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {partnership.primaryContactName ? (
                                                <div className="space-y-0.5">
                                                    <p className="text-sm font-semibold text-gray-800">{partnership.primaryContactName}</p>
                                                    <p className="text-xs text-gray-500 truncate max-w-[180px]">{partnership.primaryContactEmail}</p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No contact assigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${stageBadge(partnership.stage)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${stageGradient(partnership.stage)} shadow-sm shadow-black/10`} />
                                                {partnership.stageLabel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-sm"
                                                        style={{ width: `${(partnership.priorityScore || 0) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                                                    {Math.round((partnership.priorityScore || 0) * 100)}% Momentum
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-medium text-gray-700">{formatRelativeDate(partnership.lastContactAt)}</p>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <p className="text-sm font-bold text-gray-900">
                                                {partnership.estimatedRevenue ? `$${partnership.estimatedRevenue.toLocaleString()}` : <span className="text-gray-300">—</span>}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-lg font-medium">No partnerships found</p>
                                            <p className="text-sm">Try adjusting your filters or search query.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Insight */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium italic">
                        * Priority score is calculated based on activity velocity and stage momentum.
                    </p>
                    <p className="text-xs font-bold text-blue-600">
                        {filteredPartnerships.length} Results
                    </p>
                </div>
            </div>
        </div>
    );
}
