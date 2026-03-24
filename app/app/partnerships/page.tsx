'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { getPartnerships, PartnershipsListResponse, getPartnershipTotals, getPartnershipDetails, addPartnershipNote, updatePartnershipStage, updatePartnershipRoles, updatePartnershipFields, PartnershipDetail, addPartnershipContact, AddContactInput, sendEmail, auth } from '@/lib/api';
import { formatPartnerName } from '@/lib/utils';
import { CreatePartnershipModal } from './CreatePartnershipModal';
import { EmailComposer } from '@/components/EmailComposer';
import Link from 'next/link';
import { Skeleton } from '@/components/Skeleton';
import { AirtableNotesBlock } from '@/components/AirtableNotesBlock';
import { TextWithLinks } from '@/components/TextWithLinks';

/** Fallback labels when backend hasn't returned types yet (e.g. before first sync). */
const PARTNERSHIP_TYPE_LABELS: Record<string, string> = {
    'dentership_host': 'Denternship Host',
    'space_partner': 'Space Partner',
    'made_at_dent': 'Made@Dent',
    'sponsor': 'Sponsor',
    'food_for_thought_speaker': 'Food-for-Thought Speaker',
    'aixdt_irc_evaluator': 'AIxDT IRC Evaluator',
    'other': 'Other',
};

/** Card/list title: individual when known, else organization. */
function partnershipListPrimaryTitle(p: {
    primaryContactName?: string | null;
    contactName: string | null;
    partnerName: string;
}) {
    const person = p.primaryContactName || p.contactName;
    return person ? formatPartnerName(person) : formatPartnerName(p.partnerName);
}

/** Shown under staleness when title is a person — the organization name. */
function partnershipListOrgLine(p: {
    primaryContactName?: string | null;
    contactName: string | null;
    partnerName: string;
}): string | null {
    const person = p.primaryContactName || p.contactName;
    return person ? formatPartnerName(p.partnerName) : null;
}

function partnershipPanelPrimaryTitle(partnership: PartnershipDetail) {
    const primary = partnership.contacts?.find((c) => c.isPrimary);
    const name = primary?.name || partnership.contacts?.[0]?.name;
    return name ? formatPartnerName(name) : formatPartnerName(partnership.partnerName);
}

function partnershipPanelOrgLine(partnership: PartnershipDetail): string | null {
    const primary = partnership.contacts?.find((c) => c.isPrimary);
    const name = primary?.name || partnership.contacts?.[0]?.name;
    return name ? formatPartnerName(partnership.partnerName) : null;
}

/** Stalled if partnership record not updated in this many days (see backend PARTNERSHIP_STALE_RECORD_DAYS). */
const PARTNERSHIP_STALL_DAYS = 7;
/** For Need outreach column, hide very old records (before mid-2024). */
const NEED_OUTREACH_CUTOFF = new Date('2024-07-01T00:00:00.000Z');

function daysSinceLastPartnershipUpdate(p: { daysSinceUpdate?: number | null }) {
    return p.daysSinceUpdate ?? null;
}

function lastUpdateLabel(days: number | null) {
    if (days === null) return 'No activity on record';
    if (days === 0) return 'Updated today';
    if (days === 1) return 'Last updated 1 day ago';
    return `Last updated ${days} days ago`;
}

function formatMoney(value?: number | null): string {
    if (value == null || Number.isNaN(Number(value))) return '—';
    return `$${Number(value).toLocaleString()}`;
}

export default function PartnershipsPage() {
    const [view, setView] = useState<'list' | 'kanban'>('kanban');
    const [data, setData] = useState<PartnershipsListResponse | null>(null);
    const [loading, setLoading] = useState(true); // initial page load only
    const [refreshing, setRefreshing] = useState(false); // in-place refresh (filters/view)
    const [error, setError] = useState<string | null>(null);
    const [selectedPartnership, setSelectedPartnership] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [showOnlyMine, setShowOnlyMine] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    /** Dynamic partnership types (Role / Potential Roles) from API – from Airtable sync. */
    const [partnershipTypes, setPartnershipTypes] = useState<Array<{ partnershipType: string; label: string; count: number }>>([]);
    const [roleQuery, setRoleQuery] = useState('');
    const [rolesOpen, setRolesOpen] = useState(false);
    const rolesPopoverRef = useRef<HTMLDivElement | null>(null);
    const [successToast, setSuccessToast] = useState<string | null>(null);

    const loadTotals = useCallback(async () => {
        try {
            const totals = await getPartnershipTotals();
            setPartnershipTypes(totals.byType ?? []);
        } catch {
            setPartnershipTypes([]);
        }
    }, []);

    const loadData = useCallback(async (showLoading = true) => {
        // showLoading=true is used only for the first mount; subsequent refreshes use skeletons.
        if (showLoading) setLoading(true);
        else setRefreshing(true);
        setError(null);
        try {
            const userId = auth.currentUser?.uid;
            const assignedTo = showOnlyMine ? userId : undefined;

            const limit = view === 'kanban' ? 100 : 50;
            const response = await getPartnerships({
                view,
                limit,
                sortBy: view === 'kanban' ? 'createdAt' : 'priorityScore',
                sortOrder: 'desc',
                type: selectedTypes.length > 0 ? selectedTypes.join(',') : undefined,
                search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
                assignedTo,
            });
            setData(response);
            await loadTotals();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load partnerships');
        } finally {
            if (showLoading) setLoading(false);
            setRefreshing(false);
        }
    }, [view, selectedTypes, showOnlyMine, debouncedSearch]);

    useEffect(() => {
        loadTotals();
    }, [loadTotals]);

    useEffect(() => {
        // First mount = full-screen loader. Subsequent dependency changes refresh in-place.
        const isFirst = data === null;
        loadData(isFirst);
    }, [loadData]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchQuery), 250);
        return () => clearTimeout(t);
    }, [searchQuery]);

    useEffect(() => {
        if (!rolesOpen) return;
        function onDocMouseDown(e: MouseEvent) {
            const el = rolesPopoverRef.current;
            if (!el) return;
            if (e.target instanceof Node && el.contains(e.target)) return;
            setRolesOpen(false);
        }
        document.addEventListener('mousedown', onDocMouseDown);
        return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, [rolesOpen]);

    useEffect(() => {
        if (!successToast) return;
        const t = setTimeout(() => setSuccessToast(null), 3000);
        return () => clearTimeout(t);
    }, [successToast]);

    /** Label for a partnership type (dynamic from API, fallback to static map, then raw value). */
    const getTypeLabel = (value: string) =>
        partnershipTypes.find((t) => t.partnershipType === value)?.label ?? PARTNERSHIP_TYPE_LABELS[value] ?? value;

    const allRoleOptions = useMemo(() => {
        const list = (partnershipTypes.length > 0
            ? partnershipTypes
            : Object.entries(PARTNERSHIP_TYPE_LABELS).map(([partnershipType, label]) => ({ partnershipType, label, count: 0 })))
            .map((t) => ({ ...t, label: t.label || t.partnershipType }))
            .sort((a, b) => (a.label || a.partnershipType).localeCompare(b.label || b.partnershipType));
        return list;
    }, [partnershipTypes]);

    const filteredRoleOptions = useMemo(() => {
        const q = roleQuery.trim().toLowerCase();
        if (!q) return allRoleOptions;
        return allRoleOptions.filter((t) => (t.label || '').toLowerCase().includes(q) || t.partnershipType.toLowerCase().includes(q));
    }, [allRoleOptions, roleQuery]);

    if (loading) {
        return <PartnershipsPageSkeleton />;
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="flex flex-col md:flex-row h-screen min-h-0 bg-white p-4">
            {successToast && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
                    <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-md">
                        <div className="flex items-start gap-3">
                            <div className="shrink-0">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-900">Success</p>
                                <p className="text-sm text-green-700 mt-1">{successToast}</p>
                            </div>
                            <button
                                onClick={() => setSuccessToast(null)}
                                className="shrink-0 text-green-400 hover:text-green-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Main Content */}
            <div className={`flex-1 min-w-0 min-h-0 overflow-auto transition-all ${selectedPartnership ? 'hidden md:block md:flex-none md:w-2/3' : 'w-full'}`}>
                <div>
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Partnerships Pipeline</h1>
                            <p className="text-gray-600">Manage all partnership stages and activities in one view.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative mr-2">
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search partners, contacts, notes…"
                                    className="w-[260px] max-w-[70vw] px-3 py-2 pl-9 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                                />
                                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
                                </svg>
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 px-1"
                                        aria-label="Clear search"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <div className="flex bg-gray-100 rounded-lg p-1 mr-4">
                                <button
                                    onClick={() => setShowOnlyMine(false)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!showOnlyMine ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    All Partners
                                </button>
                                <button
                                    onClick={() => setShowOnlyMine(true)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${showOnlyMine ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    My Partners
                                </button>
                            </div>
                            <button
                                onClick={() => setView('kanban')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'kanban'
                                    ? 'bg-[#3b82f6] text-white'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Kanban Board
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'list'
                                    ? 'bg-[#3b82f6] text-white'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                List View
                            </button>
                            <Link
                                href="/app/partnerships/tracker"
                                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Tracker
                            </Link>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium"
                            >
                                + New Partnership
                            </button>
                        </div>
                    </div>

                    {/* Role filter (searchable multi-select) */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role / Potential Roles</label>
                        <div className="flex items-start gap-3 flex-wrap">
                            <div ref={rolesPopoverRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setRolesOpen((v) => !v)}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                    <span>
                                        {selectedTypes.length > 0 ? `Roles (${selectedTypes.length} selected)` : 'Select roles'}
                                    </span>
                                    <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                {rolesOpen && (
                                    <div className="absolute z-30 mt-2 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-lg">
                                        <div className="p-3 border-b border-gray-100">
                                            <input
                                                value={roleQuery}
                                                onChange={(e) => setRoleQuery(e.target.value)}
                                                placeholder="Search roles…"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                                            />
                                        </div>
                                        <div className="max-h-[320px] overflow-auto p-2">
                                            {filteredRoleOptions.length === 0 ? (
                                                <div className="p-6 text-center text-sm text-gray-500">No matching roles</div>
                                            ) : (
                                                filteredRoleOptions.map((opt) => {
                                                    const checked = selectedTypes.includes(opt.partnershipType);
                                                    return (
                                                        <button
                                                            key={opt.partnershipType}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedTypes((prev) =>
                                                                    prev.includes(opt.partnershipType)
                                                                        ? prev.filter((t) => t !== opt.partnershipType)
                                                                        : [...prev, opt.partnershipType]
                                                                );
                                                            }}
                                                            className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 ${checked ? 'bg-blue-50' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <span className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                                    {checked && (
                                                                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                            <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                </span>
                                                                <span className="text-sm text-gray-900 truncate">{opt.label}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-500">{opt.count}</span>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                        <div className="p-3 border-t border-gray-100 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTypes([]);
                                                    setRoleQuery('');
                                                }}
                                                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRolesOpen(false)}
                                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedTypes.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedTypes.slice(0, 4).map((t) => (
                                        <span key={t} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                            {getTypeLabel(t)}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedTypes((prev) => prev.filter((x) => x !== t))}
                                                className="text-blue-700/70 hover:text-blue-900"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                    {selectedTypes.length > 4 && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                                            +{selectedTypes.length - 4} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Kanban View */}
                    {view === 'kanban' && data.columns && (
                        <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6">
                            {refreshing ? (
                                Array.from({ length: Math.min(5, data.columns.length || 5) }).map((_, idx) => (
                                    <div key={idx} className="flex flex-col min-w-[320px] w-[320px]">
                                        <div className="mb-4 pb-3 border-b border-gray-200">
                                            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                                            <div className="h-4 w-24 bg-gray-200 rounded mt-2 animate-pulse" />
                                        </div>
                                        <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-2">
                                            {Array.from({ length: 4 }).map((__, j) => (
                                                <div key={j} className="p-4 rounded-lg bg-white border border-gray-200">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                                                        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                                                    </div>
                                                    <div className="h-3 w-28 bg-gray-200 rounded animate-pulse mb-2" />
                                                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                data.columns.map((column) => (
                                    <div key={column.stage} className="flex flex-col min-w-[320px] w-[320px]">
                                        {/** Need outreach only: hide records created before mid-2024. */}
                                        {(() => {
                                            const filteredPartnerships =
                                                column.stage === 'need_outreach'
                                                    ? column.partnerships.filter((p) => {
                                                        if (!p.createdAt) return false;
                                                        const created = new Date(p.createdAt);
                                                        return !isNaN(created.getTime()) && created >= NEED_OUTREACH_CUTOFF;
                                                    })
                                                    : column.partnerships;
                                            return (
                                                <>
                                        <div className="mb-4 pb-3 border-b border-gray-200">
                                            <h3 className="font-semibold text-gray-900 text-lg">{column.label}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{filteredPartnerships.length} partnerships</p>
                                        </div>
                                        <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-2">
                                            {filteredPartnerships.length === 0 ? (
                                                <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                                                    <p className="text-sm text-gray-500">No partnerships</p>
                                                </div>
                                            ) : (
                                                filteredPartnerships.map((partnership) => {
                                                const daysSinceUpdate = daysSinceLastPartnershipUpdate(partnership);
                                                const isStuck =
                                                    daysSinceUpdate === null || daysSinceUpdate >= PARTNERSHIP_STALL_DAYS;
                                                const status = isStuck ? 'stalled' : 'active';
                                                const statusColor = isStuck
                                                    ? 'bg-red-100 text-red-700 border-red-200'
                                                    : 'bg-green-100 text-green-700 border-green-200';

                                                const isSelected = selectedPartnership === partnership.id;

                                                const orgLine = partnershipListOrgLine(partnership);

                                                return (
                                                    <div
                                                        key={partnership.id}
                                                        onClick={() => setSelectedPartnership(partnership.id)}
                                                        className={`p-4 rounded-lg bg-white border cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-[#3b82f6] shadow-lg ring-2 ring-blue-100' : isStuck ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between mb-1">
                                                            <h4 className="font-semibold text-gray-900 text-sm flex-1 pr-2">
                                                                {partnershipListPrimaryTitle(partnership)}
                                                            </h4>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border shrink-0 ${statusColor}`}>
                                                                {status}
                                                            </span>
                                                        </div>

                                                        {partnership.partnershipType && (
                                                            <p className="text-[10px] text-gray-500 mb-2">
                                                                {Array.isArray(partnership.partnershipType)
                                                                    ? partnership.partnershipType.map((t) => getTypeLabel(t)).join(', ')
                                                                    : getTypeLabel(partnership.partnershipType)}
                                                            </p>
                                                        )}

                                                        {/* Revenue Badge */}
                                                        {partnership.estimatedRevenue && (
                                                            <div className="mb-2">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">
                                                                    ${partnership.estimatedRevenue.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {(partnership.tFocus || partnership.revenueCommitment != null || partnership.estimatedQuote != null || partnership.finalQuote != null) && (
                                                            <div className="mb-2 grid grid-cols-2 gap-1 text-[10px]">
                                                                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                    T Focus: {partnership.tFocus || '—'}
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                    Commitment: {formatMoney(partnership.revenueCommitment)}
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                                                                    Est Quote: {formatMoney(partnership.estimatedQuote)}
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">
                                                                    Final Quote: {formatMoney(partnership.finalQuote)}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Contact Info */}
                                                        <div className="space-y-1 mb-2">
                                                            <p className={`text-xs ${isStuck ? 'text-red-700 font-semibold' : 'text-gray-500'}`}>
                                                                {lastUpdateLabel(daysSinceUpdate)}
                                                                {partnership.daysSinceContact !== null && (
                                                                    <span className="block text-[10px] text-gray-400 mt-0.5">
                                                                        {partnership.daysSinceContact} days since contact
                                                                    </span>
                                                                )}
                                                            </p>
                                                            {orgLine && (
                                                                <p className="text-xs text-gray-600">
                                                                    {orgLine}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Stuck Warning */}
                                                        {isStuck && (
                                                            <div className="mt-2 pt-2 border-t border-red-200">
                                                                <p className="text-xs font-semibold text-red-700">
                                                                    ⚠️ Needs immediate attention
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                            )}
                                        </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* List View */}
                    {view === 'list' && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
                                <div className="col-span-4">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Contact / org</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Stage</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Contact</span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Revenue</span>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-gray-200">
                                {refreshing ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4">
                                            <div className="col-span-4 space-y-2">
                                                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                                                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                                            </div>
                                            <div className="col-span-2">
                                                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                                                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                                            </div>
                                            <div className="col-span-2">
                                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                                            </div>
                                        </div>
                                    ))
                                ) : data.partnerships && data.partnerships.length > 0 ? (
                                    data.partnerships.map((partnership) => {
                                        const listOrgLine = partnershipListOrgLine(partnership);
                                        return (
                                        <div
                                            key={partnership.id}
                                            onClick={() => setSelectedPartnership(partnership.id)}
                                            className={`grid grid-cols-12 gap-4 px-6 py-4 cursor-pointer transition-colors ${selectedPartnership === partnership.id
                                                ? 'bg-blue-50 border-l-4 border-l-[#3b82f6]'
                                                : 'bg-white hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="col-span-4">
                                                <h3 className="font-semibold text-gray-900">{partnershipListPrimaryTitle(partnership)}</h3>
                                                {listOrgLine && (
                                                    <p className="text-xs text-gray-500 mt-0.5">{listOrgLine}</p>
                                                )}
                                                {partnership.partnershipType && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {Array.isArray(partnership.partnershipType)
                                                            ? partnership.partnershipType.map((t) => getTypeLabel(t)).join(', ')
                                                            : getTypeLabel(partnership.partnershipType)}
                                                    </p>
                                                )}
                                                {(partnership.tFocus || partnership.revenueCommitment != null || partnership.estimatedQuote != null || partnership.finalQuote != null) && (
                                                    <p className="text-[11px] text-gray-600 mt-1">
                                                        <span className="font-medium">T:</span> {partnership.tFocus || '—'}
                                                        {' • '}
                                                        <span className="font-medium">Commit:</span> {formatMoney(partnership.revenueCommitment)}
                                                        {' • '}
                                                        <span className="font-medium">Est:</span> {formatMoney(partnership.estimatedQuote)}
                                                        {' • '}
                                                        <span className="font-medium">Final:</span> {formatMoney(partnership.finalQuote)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="col-span-2">
                                                <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                                    {partnership.stageLabel}
                                                </span>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-gray-900">
                                                    {partnership.primaryContactEmail || partnership.contactEmail || partnership.contactName || '—'}
                                                </p>
                                                {partnership.latestActivity && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {partnership.latestActivity.type}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-gray-900">
                                                    {partnership.daysSinceContact !== null
                                                        ? `${partnership.daysSinceContact} days ago`
                                                        : 'Never'}
                                                </p>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                {partnership.estimatedRevenue ? (
                                                    <p className="text-sm font-medium text-gray-900">
                                                        ${partnership.estimatedRevenue.toLocaleString()}
                                                    </p>
                                                ) : (
                                                    <span className="text-sm text-gray-400">—</span>
                                                )}
                                            </div>
                                        </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-12 text-center">
                                        <p className="text-gray-500">No partnerships found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Panel */}
            {selectedPartnership && (
                <PartnershipPanel
                    partnershipId={selectedPartnership}
                    onClose={() => setSelectedPartnership(null)}
                    onSuccessToast={setSuccessToast}
                    onUpdate={async (showLoading = false) => {
                        // Refresh the data
                        await loadData(showLoading);
                    }}
                />
            )}

            {/* Create Partnership Modal */}
            <CreatePartnershipModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccessToast={setSuccessToast}
                onViewExisting={async (partnershipId) => {
                    setShowCreateModal(false);
                    // No need to reload just to view/edit; panel fetches its own details.
                    setSelectedPartnership(partnershipId);
                }}
                onSuccess={async (partnershipId) => {
                    setShowCreateModal(false);
                    // Refresh the partnerships list (without showing loading spinner)
                    await loadData(false);
                    // Select the newly created partnership
                    setSelectedPartnership(partnershipId);
                }}
            />
        </div>
    );
}

function PartnershipsPageSkeleton() {
    return (
        <div className="flex flex-col md:flex-row h-screen bg-white p-4">
            <div className="flex-1 min-w-0 overflow-auto">
                <div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div>
                            <Skeleton className="h-7 w-56 mb-2" />
                            <Skeleton className="h-4 w-[420px] max-w-full" />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Skeleton className="h-10 w-[260px] max-w-[70vw]" rounded="lg" />
                            <Skeleton className="h-10 w-40" rounded="lg" />
                            <Skeleton className="h-10 w-32" rounded="lg" />
                            <Skeleton className="h-10 w-28" rounded="lg" />
                            <Skeleton className="h-10 w-40" rounded="lg" />
                            <Skeleton className="h-10 w-40" rounded="lg" />
                        </div>
                    </div>

                    <div className="mb-6">
                        <Skeleton className="h-4 w-72 mb-2" />
                        <div className="flex items-start gap-3 flex-wrap">
                            <Skeleton className="h-10 w-40" rounded="lg" />
                            <Skeleton className="h-7 w-28" rounded="full" />
                            <Skeleton className="h-7 w-32" rounded="full" />
                        </div>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6">
                        {Array.from({ length: 5 }).map((_, idx) => (
                            <div key={idx} className="flex flex-col min-w-[320px] w-[320px]">
                                <div className="mb-4 pb-3 border-b border-gray-200">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-4 w-24 mt-2" />
                                </div>
                                <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-2">
                                    {Array.from({ length: 4 }).map((__, j) => (
                                        <div key={j} className="p-4 rounded-lg bg-white border border-gray-200">
                                            <div className="flex items-start justify-between mb-2">
                                                <Skeleton className="h-4 w-40" />
                                                <Skeleton className="h-5 w-16" rounded="sm" />
                                            </div>
                                            <Skeleton className="h-3 w-28 mb-2" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="hidden md:block md:w-1/3 md:border-l border-gray-200 bg-white p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-10 w-full mb-4" rounded="lg" />
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                            <Skeleton className="h-4 w-44 mb-2" />
                            <Skeleton className="h-3 w-56" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PartnershipPanel({
    partnershipId,
    onClose,
    onUpdate,
    onSuccessToast,
}: {
    partnershipId: string;
    onClose: () => void;
    onUpdate?: (showLoading?: boolean) => Promise<void>;
    onSuccessToast?: (message: string) => void;
}) {
    const [partnership, setPartnership] = useState<PartnershipDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContact, setNewContact] = useState<AddContactInput>({
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
        isPrimary: false,
    });
    const [addingContact, setAddingContact] = useState(false);
    const [showEmailComposer, setShowEmailComposer] = useState(false);
    const [roleOptions, setRoleOptions] = useState<Array<{ partnershipType: string; label: string; count: number }>>([]);
    const [rolesOpen, setRolesOpen] = useState(false);
    const [roleQuery, setRoleQuery] = useState('');
    const rolesPopoverRef = useRef<HTMLDivElement | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [savingRoles, setSavingRoles] = useState(false);
    const [tFocusInput, setTFocusInput] = useState<string>('T1');
    const [revenueCommitmentInput, setRevenueCommitmentInput] = useState<string>('');
    const [estimatedQuoteInput, setEstimatedQuoteInput] = useState<string>('');
    const [finalQuoteInput, setFinalQuoteInput] = useState<string>('');
    const [savingBusinessFields, setSavingBusinessFields] = useState(false);

    const loadPartnership = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPartnershipDetails(partnershipId);
            setPartnership(data);
            const roles = Array.isArray(data.partnershipType) ? data.partnershipType : (data.partnershipType ? [data.partnershipType] : []);
            setSelectedRoles(roles);
            setTFocusInput(data.tFocus || 'T1');
            setRevenueCommitmentInput(data.revenueCommitment != null ? String(data.revenueCommitment) : '');
            setEstimatedQuoteInput(data.estimatedQuote != null ? String(data.estimatedQuote) : '');
            setFinalQuoteInput(data.finalQuote != null ? String(data.finalQuote) : '');
        } catch (err) {
            console.error('Failed to load partnership:', err);
        } finally {
            setLoading(false);
        }
    }, [partnershipId]);

    const loadRoleOptions = useCallback(async () => {
        try {
            const totals = await getPartnershipTotals();
            setRoleOptions(totals.byType ?? []);
        } catch {
            setRoleOptions([]);
        }
    }, []);

    useEffect(() => {
        loadPartnership();
    }, [loadPartnership]);

    useEffect(() => {
        loadRoleOptions();
    }, [loadRoleOptions]);

    useEffect(() => {
        if (!rolesOpen) return;
        function onDocMouseDown(e: MouseEvent) {
            const el = rolesPopoverRef.current;
            if (!el) return;
            if (e.target instanceof Node && el.contains(e.target)) return;
            setRolesOpen(false);
        }
        document.addEventListener('mousedown', onDocMouseDown);
        return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, [rolesOpen]);

    async function handleAddNote() {
        if (!note.trim()) return;
        try {
            await addPartnershipNote(partnershipId, note);
            setNote('');
            loadPartnership();
        } catch (err) {
            console.error('Failed to add note:', err);
        }
    }

    async function handleAddContact() {
        if (!newContact.name.trim()) return;
        setAddingContact(true);
        try {
            await addPartnershipContact(partnershipId, newContact);
            onSuccessToast?.(`Added ${newContact.name.trim()} to contacts.`);
            setNewContact({ name: '', email: '', phone: '', jobTitle: '', isPrimary: false });
            setShowAddContact(false);
            loadPartnership();
        } catch (err) {
            console.error('Failed to add contact:', err);
        } finally {
            setAddingContact(false);
        }
    }

    async function handleStageChange(newStage: string) {
        try {
            await updatePartnershipStage(partnershipId, newStage);
            // Refresh the parent list to update Kanban board first
            if (onUpdate) {
                await onUpdate(false); // Refresh without showing loading spinner
            }
            // Then refresh the partnership details
            await loadPartnership();
        } catch (err) {
            console.error('Failed to update stage:', err);
        }
    }

    const roleLabel = (value: string) =>
        roleOptions.find((t) => t.partnershipType === value)?.label ?? PARTNERSHIP_TYPE_LABELS[value] ?? value;

    const allRoleOptions = useMemo(() => {
        const list = (roleOptions.length > 0
            ? roleOptions
            : Object.entries(PARTNERSHIP_TYPE_LABELS).map(([partnershipType, label]) => ({ partnershipType, label, count: 0 })))
            .map((t) => ({ ...t, label: t.label || t.partnershipType }))
            .sort((a, b) => (a.label || a.partnershipType).localeCompare(b.label || b.partnershipType));
        return list;
    }, [roleOptions]);

    const filteredRoleOptions = useMemo(() => {
        const q = roleQuery.trim().toLowerCase();
        if (!q) return allRoleOptions;
        return allRoleOptions.filter((t) => (t.label || '').toLowerCase().includes(q) || t.partnershipType.toLowerCase().includes(q));
    }, [allRoleOptions, roleQuery]);

    async function handleSaveRoles() {
        if (!selectedRoles.length) return;
        setSavingRoles(true);
        try {
            await updatePartnershipRoles(partnershipId, selectedRoles);
            if (onUpdate) await onUpdate(false);
            await loadPartnership();
        } catch (err) {
            console.error('Failed to update roles:', err);
        } finally {
            setSavingRoles(false);
        }
    }

    async function handleSaveBusinessFields() {
        setSavingBusinessFields(true);
        try {
            const parseMoney = (v: string) => {
                const s = (v || '').trim();
                if (!s) return null;
                const n = Number(s);
                return Number.isFinite(n) ? n : null;
            };
            await updatePartnershipFields(partnershipId, {
                tFocus: tFocusInput || null,
                revenueCommitment: parseMoney(revenueCommitmentInput),
                estimatedQuote: parseMoney(estimatedQuoteInput),
                finalQuote: parseMoney(finalQuoteInput),
            });
            if (onUpdate) await onUpdate(false);
            await loadPartnership();
            onSuccessToast?.('Updated T focus and quote fields.');
        } catch (err) {
            console.error('Failed to update business fields:', err);
        } finally {
            setSavingBusinessFields(false);
        }
    }

    const stages = [
        { value: 'need_outreach', label: 'Need 1st Outreach' },
        { value: 'awaiting_response', label: 'Awaiting Response' },
        { value: 'conversation_active', label: 'Conversation Active' },
        { value: 'interested', label: 'Interested' },
        { value: 'mou_sent', label: 'MOU/Invoice Sent' },
        { value: 'confirmed_locked', label: 'Confirmed/Locked' },
        { value: 'not_this_season', label: 'Not This Season' },
    ];

    if (loading) {
        return (
            <div className="w-full md:w-1/3 md:border-l border-gray-200 bg-white p-6">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-10 w-full" rounded="lg" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" rounded="lg" />
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-9 w-full" rounded="lg" />
                        <Skeleton className="h-9 w-full" rounded="lg" />
                    </div>
                    <div className="space-y-3 pt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                <Skeleton className="h-4 w-44 mb-2" />
                                <Skeleton className="h-3 w-56" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!partnership) return null;

    const daysSinceContact = partnership.lastContactAt
        ? Math.floor((new Date().getTime() - new Date(partnership.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const needsAttention = partnership.stage === 'mou_sent' &&
        (daysSinceContact !== null && daysSinceContact > 5);

    const panelOrgLine = partnershipPanelOrgLine(partnership);

    return (
        <div className="w-full md:w-1/3 md:border-l border-gray-200 bg-white flex flex-col h-full min-h-0 overflow-y-auto shrink-0">
            <div className="p-6 border-b border-gray-200 bg-white">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 truncate">{partnershipPanelPrimaryTitle(partnership)}</h2>
                        {panelOrgLine && (
                            <p className="text-sm text-gray-600 truncate mt-1">{panelOrgLine}</p>
                        )}
                        <div className="mt-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Stage</label>
                            <select
                                value={partnership.stage}
                                onChange={(e) => handleStageChange(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-sm font-medium"
                            >
                                {stages.map((stage) => (
                                    <option key={stage.value} value={stage.value}>
                                        {stage.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Roles</label>
                            <div className="flex items-start gap-2 flex-wrap">
                                <div ref={rolesPopoverRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setRolesOpen((v) => !v)}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                                    >
                                        <span>{selectedRoles.length ? `Roles (${selectedRoles.length})` : 'Select roles'}</span>
                                        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    {rolesOpen && (
                                        <div className="absolute z-30 mt-2 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-lg">
                                            <div className="p-3 border-b border-gray-100">
                                                <input
                                                    value={roleQuery}
                                                    onChange={(e) => setRoleQuery(e.target.value)}
                                                    placeholder="Search roles…"
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                                                />
                                            </div>
                                            <div className="max-h-[280px] overflow-auto p-2">
                                                {filteredRoleOptions.map((opt) => {
                                                    const checked = selectedRoles.includes(opt.partnershipType);
                                                    return (
                                                        <button
                                                            key={opt.partnershipType}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedRoles((prev) =>
                                                                    prev.includes(opt.partnershipType)
                                                                        ? prev.filter((t) => t !== opt.partnershipType)
                                                                        : [...prev, opt.partnershipType]
                                                                );
                                                            }}
                                                            className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 ${checked ? 'bg-blue-50' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <span className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                                    {checked && (
                                                                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                            <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                </span>
                                                                <span className="text-sm text-gray-900 truncate">{opt.label}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-500">{opt.count}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="p-3 border-t border-gray-100 flex items-center justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedRoles(['other']);
                                                        setRoleQuery('');
                                                    }}
                                                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRolesOpen(false)}
                                                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSaveRoles}
                                    disabled={savingRoles || selectedRoles.length === 0}
                                    className="px-3 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    {savingRoles ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                            {selectedRoles.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {selectedRoles.slice(0, 4).map((t) => (
                                        <span key={t} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                            {roleLabel(t)}
                                            <button type="button" onClick={() => setSelectedRoles((prev) => prev.filter((x) => x !== t))} className="text-blue-700/70 hover:text-blue-900">×</button>
                                        </span>
                                    ))}
                                    {selectedRoles.length > 4 && (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                                            +{selectedRoles.length - 4} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Business Fields</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="col-span-1">
                                    <label className="block text-[11px] text-gray-600 mb-1">T Focus</label>
                                    <select
                                        value={tFocusInput}
                                        onChange={(e) => setTFocusInput(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                                    >
                                        <option value="T1">T1</option>
                                        <option value="T2">T2</option>
                                        <option value="T3">T3</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[11px] text-gray-600 mb-1">Revenue Commitment</label>
                                    <input
                                        type="number"
                                        value={revenueCommitmentInput}
                                        onChange={(e) => setRevenueCommitmentInput(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[11px] text-gray-600 mb-1">Estimated Quote</label>
                                    <input
                                        type="number"
                                        value={estimatedQuoteInput}
                                        onChange={(e) => setEstimatedQuoteInput(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[11px] text-gray-600 mb-1">Final Quote</label>
                                    <input
                                        type="number"
                                        value={finalQuoteInput}
                                        onChange={(e) => setFinalQuoteInput(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleSaveBusinessFields}
                                disabled={savingBusinessFields}
                                className="mt-2 px-3 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                {savingBusinessFields ? 'Saving…' : 'Save fields'}
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 text-gray-400 hover:text-gray-600 shrink-0"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {needsAttention && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-sm font-medium text-red-900">This partnership needs immediate attention</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 space-y-6">
                {/* Contact Details Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Contact Information</h3>
                        <button
                            onClick={() => setShowAddContact(!showAddContact)}
                            className="px-3 py-1.5 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-xs font-medium"
                        >
                            + Add Contact
                        </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Organization</label>
                            <p className="text-sm text-gray-900 mt-1">{formatPartnerName(partnership.partnerName)}</p>
                        </div>

                        {/* Add Contact Form */}
                        {showAddContact && (
                            <div className="border-t border-gray-200 pt-3 space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={newContact.name}
                                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                                        placeholder="Contact name"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={newContact.email}
                                            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={newContact.phone}
                                            onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Job Title</label>
                                    <input
                                        type="text"
                                        value={newContact.jobTitle}
                                        onChange={(e) => setNewContact({ ...newContact, jobTitle: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                                        placeholder="e.g., Director of Partnerships"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isPrimary"
                                        checked={newContact.isPrimary}
                                        onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                                        className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6]"
                                    />
                                    <label htmlFor="isPrimary" className="text-xs text-gray-700">Set as primary contact</label>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setShowAddContact(false);
                                            setNewContact({ name: '', email: '', phone: '', jobTitle: '', isPrimary: false });
                                        }}
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddContact}
                                        disabled={!newContact.name.trim() || addingContact}
                                        className="flex-1 px-3 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium disabled:opacity-50"
                                    >
                                        {addingContact ? 'Adding...' : 'Add Contact'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {partnership.contacts && partnership.contacts.length > 0 && (
                            <div className="space-y-2">
                                {partnership.contacts.map((contact) => (
                                    <div key={contact.id} className="border-t border-gray-200 pt-3 first:border-t-0 first:pt-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                                                    {contact.isPrimary && (
                                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Primary</span>
                                                    )}
                                                </div>
                                                {contact.jobTitle && (
                                                    <p className="text-xs text-gray-600 mt-0.5">{contact.jobTitle}</p>
                                                )}
                                                {contact.email && (
                                                    <a href={`mailto:${contact.email}`} className="text-sm text-[#3b82f6] hover:underline mt-1 block">
                                                        {contact.email}
                                                    </a>
                                                )}
                                                {contact.phone && (
                                                    <a href={`tel:${contact.phone}`} className="text-sm text-gray-700 mt-1 block">
                                                        {contact.phone}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {(!partnership.contacts || partnership.contacts.length === 0) && !showAddContact && (
                            <p className="text-sm text-gray-500">No contact information available</p>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowEmailComposer(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Email
                    </button>
                    <button className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>

                {/* Notes Section — Airtable + app notes */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-gray-900">Notes</h3>
                    </div>
                    <AirtableNotesBlock partnership={partnership} />
                    <div className="space-y-3 mb-4">
                        {partnership.activities
                            .filter((a) => a.type === 'note')
                            .map((activity) => (
                                <div key={activity.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">App</p>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {activity.content ? <TextWithLinks text={activity.content} /> : null}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {new Date(activity.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            ))}
                        {(() => {
                            const hasAirtable =
                                (partnership.organizationNotes || '').trim().length > 0 ||
                                partnership.contacts.some((c) => (c.notes || '').trim().length > 0) ||
                                !!partnership.airtableRecordUrl;
                            const noteActivities = partnership.activities.filter((a) => a.type === 'note');
                            if (hasAirtable || noteActivities.length > 0) return null;
                            return (
                                <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-500">No notes yet</p>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Add Note */}
                    <div>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add a note..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-sm"
                            rows={3}
                        />
                        <button
                            onClick={handleAddNote}
                            className="mt-2 px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium"
                        >
                            Add Note
                        </button>
                    </div>
                </div>

                {/* Activity Timeline Section */}
                <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Activity Timeline</h3>
                    <div className="space-y-3">
                        {partnership.activities.length === 0 ? (
                            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-500">No activity yet</p>
                            </div>
                        ) : (
                            partnership.activities.map((activity) => {
                                const getActivityIcon = () => {
                                    switch (activity.type) {
                                        case 'email_sent':
                                        case 'email_received':
                                        case 'email_reply_sent':
                                            return (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            );
                                        case 'call':
                                        case 'meeting':
                                            return (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            );
                                        case 'stage_changed':
                                            return (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h10m0 0l-3-3m3 3l-3 3M20 17H10m0 0l3-3m-3 3l3 3" />
                                                </svg>
                                            );
                                        case 'roles_updated':
                                            return (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V9H2v11h5m10 0v-4a3 3 0 00-3-3H10a3 3 0 00-3 3v4m10 0H7m8-13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            );
                                        case 'contact_added':
                                            return (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3M5 20a7 7 0 1111.95-4.95M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            );
                                        case 'airtable_imported':
                                        case 'airtable_updated':
                                            return (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m14.836 2A8 8 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-14.836-2M15 15h.01" />
                                                </svg>
                                            );
                                        default:
                                            return (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            );
                                    }
                                };
                                const getActivityLabel = () => {
                                    switch (activity.type) {
                                        case 'email_reply_sent': return 'Email reply sent';
                                        case 'email_sent': return 'Email sent';
                                        case 'email_received': return 'Email received';
                                        case 'stage_changed': return 'Stage changed';
                                        case 'roles_updated': return 'Roles updated';
                                        case 'contact_added': return 'Contact added';
                                        case 'airtable_imported': return 'Airtable imported';
                                        case 'airtable_updated': return 'Airtable updated';
                                        default: return activity.type.replace(/_/g, ' ');
                                    }
                                };
                                const getActivityStyles = () => {
                                    switch (activity.type) {
                                        case 'email_sent':
                                        case 'email_received':
                                        case 'email_reply_sent':
                                            return {
                                                row: 'bg-blue-50 border-blue-200',
                                                iconWrap: 'bg-blue-100 border-blue-200 text-blue-700',
                                            };
                                        case 'airtable_imported':
                                        case 'airtable_updated':
                                            return {
                                                row: 'bg-amber-50 border-amber-200',
                                                iconWrap: 'bg-amber-100 border-amber-200 text-amber-700',
                                            };
                                        case 'stage_changed':
                                        case 'roles_updated':
                                            return {
                                                row: 'bg-purple-50 border-purple-200',
                                                iconWrap: 'bg-purple-100 border-purple-200 text-purple-700',
                                            };
                                        case 'contact_added':
                                            return {
                                                row: 'bg-emerald-50 border-emerald-200',
                                                iconWrap: 'bg-emerald-100 border-emerald-200 text-emerald-700',
                                            };
                                        case 'note':
                                            return {
                                                row: 'bg-gray-50 border-gray-200',
                                                iconWrap: 'bg-white border-gray-200 text-gray-600',
                                            };
                                        default:
                                            return {
                                                row: 'bg-gray-50 border-gray-200',
                                                iconWrap: 'bg-white border-gray-200 text-gray-600',
                                            };
                                    }
                                };
                                const styles = getActivityStyles();

                                return (
                                    <div key={activity.id} className={`flex items-start gap-3 p-3 rounded-lg border ${styles.row}`}>
                                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${styles.iconWrap}`}>
                                            {getActivityIcon()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900">{activity.content || getActivityLabel()}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(activity.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })} • {activity.userId ? 'Team' : 'System'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Email Composer */}
                {showEmailComposer && partnership && (
                    <EmailComposer
                        isOpen={showEmailComposer}
                        to={partnership.contacts?.find(c => c.isPrimary)?.email || partnership.contacts?.[0]?.email || ''}
                        partnershipId={partnership.id}
                        onClose={() => setShowEmailComposer(false)}
                        onSend={async (data) => {
                            try {
                                await sendEmail({
                                    ...data,
                                    partnershipId: partnership.id,
                                    preserveSignature: true,
                                });
                                await loadPartnership();
                            } catch (err) {
                                console.error('Failed to send email:', err);
                                throw err;
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
}
