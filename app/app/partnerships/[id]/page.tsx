'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    addPartnershipContact,
    addPartnershipNote,
    AddContactInput,
    getPartnershipDetails,
    getPartnershipTotals,
    PartnershipDetail,
    sendEmail,
    updatePartnershipFields,
    updatePartnershipRoles,
    updatePartnershipStage,
} from '@/lib/api';
import { formatPartnerName } from '@/lib/utils';
import { Skeleton } from '@/components/Skeleton';
import { AirtableNotesBlock } from '@/components/AirtableNotesBlock';
import { TextWithLinks } from '@/components/TextWithLinks';
import { EmailComposer } from '@/components/EmailComposer';

/** Fallback labels when backend hasn't returned types yet (e.g. before first sync). */
const PARTNERSHIP_TYPE_LABELS: Record<string, string> = {
    dentership_host: 'Denternship Host',
    space_partner: 'Space Partner',
    made_at_dent: 'Made@Dent',
    sponsor: 'Sponsor',
    food_for_thought_speaker: 'Food-for-Thought Speaker',
    aixdt_irc_evaluator: 'AIxDT IRC Evaluator',
    other: 'Other',
};

export default function PartnershipDetailPage() {
    const params = useParams();
    const router = useRouter();
    const partnershipId = params.id as string;
    const [partnership, setPartnership] = useState<PartnershipDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [successToast, setSuccessToast] = useState<string | null>(null);

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

    const loadPartnership = useCallback(async () => {
        if (!partnershipId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getPartnershipDetails(partnershipId);
            setPartnership(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load partnership');
        } finally {
            setLoading(false);
        }
    }, [partnershipId]);

    useEffect(() => {
        loadPartnership();
    }, [loadPartnership]);

    useEffect(() => {
        if (!partnership) return;
        const roles = Array.isArray(partnership.partnershipType)
            ? partnership.partnershipType
            : partnership.partnershipType
                ? [String(partnership.partnershipType)]
                : [];
        setSelectedRoles(roles);
        setTFocusInput(partnership.tFocus || 'T1');
        setRevenueCommitmentInput(partnership.revenueCommitment != null ? String(partnership.revenueCommitment) : '');
        setEstimatedQuoteInput(partnership.estimatedQuote != null ? String(partnership.estimatedQuote) : '');
        setFinalQuoteInput(partnership.finalQuote != null ? String(partnership.finalQuote) : '');
    }, [partnership]);

    const loadRoleOptions = useCallback(async () => {
        try {
            const totals = await getPartnershipTotals();
            setRoleOptions(totals.byType ?? []);
        } catch {
            setRoleOptions([]);
        }
    }, []);

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

    useEffect(() => {
        if (!successToast) return;
        const t = setTimeout(() => setSuccessToast(null), 3000);
        return () => clearTimeout(t);
    }, [successToast]);

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
            setSuccessToast(`Added ${newContact.name.trim()} to contacts.`);
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
            loadPartnership();
        } catch (err) {
            console.error('Failed to update stage:', err);
        }
    }

    const roleLabel = useCallback(
        (value: string) =>
            roleOptions.find((t) => t.partnershipType === value)?.label ??
            PARTNERSHIP_TYPE_LABELS[value] ??
            value,
        [roleOptions]
    );

    const allRoleOptions = useMemo(() => {
        const list = (roleOptions.length > 0
            ? roleOptions
            : Object.entries(PARTNERSHIP_TYPE_LABELS).map(([partnershipType, label]) => ({
                partnershipType,
                label,
                count: 0,
            })))
            .map((t) => ({ ...t, label: t.label || t.partnershipType }))
            .sort((a, b) => (a.label || a.partnershipType).localeCompare(b.label || b.partnershipType));
        return list;
    }, [roleOptions]);

    const filteredRoleOptions = useMemo(() => {
        const q = roleQuery.trim().toLowerCase();
        if (!q) return allRoleOptions;
        return allRoleOptions.filter(
            (t) => (t.label || '').toLowerCase().includes(q) || t.partnershipType.toLowerCase().includes(q)
        );
    }, [allRoleOptions, roleQuery]);

    async function handleSaveRoles() {
        if (!selectedRoles.length) return;
        setSavingRoles(true);
        try {
            await updatePartnershipRoles(partnershipId, selectedRoles);
            await loadPartnership();
            setSuccessToast('Updated roles.');
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
            await loadPartnership();
            setSuccessToast('Updated T focus and quote fields.');
        } catch (err) {
            console.error('Failed to update business fields:', err);
        } finally {
            setSavingBusinessFields(false);
        }
    }

    if (loading) {
        return (
            <div className="px-6 py-8 bg-white">
                <Skeleton className="h-4 w-40 mb-6" />
                <div className="rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between mb-4 gap-6">
                        <div className="flex-1">
                            <Skeleton className="h-9 w-[520px] max-w-full mb-3" />
                            <div className="flex items-center gap-3 flex-wrap">
                                <Skeleton className="h-7 w-32" rounded="lg" />
                                <Skeleton className="h-7 w-24" rounded="lg" />
                                <Skeleton className="h-7 w-36" rounded="lg" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-40" rounded="lg" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                <Skeleton className="h-3 w-28 mb-2" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-lg border border-gray-200 p-6">
                            <Skeleton className="h-5 w-40 mb-4" />
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                        <Skeleton className="h-4 w-56 mb-2" />
                                        <Skeleton className="h-3 w-[620px] max-w-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="rounded-lg border border-gray-200 p-6">
                            <Skeleton className="h-5 w-28 mb-4" />
                            <Skeleton className="h-24 w-full" rounded="lg" />
                            <Skeleton className="h-10 w-32 mt-3" rounded="lg" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-white">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    if (!partnership) return null;

    const stages = [
        { value: 'need_outreach', label: 'Need 1st Outreach' },
        { value: 'awaiting_response', label: 'Awaiting Response' },
        { value: 'conversation_active', label: 'Conversation Active' },
        { value: 'interested', label: 'Interested' },
        { value: 'mou_sent', label: 'MOU/Invoice Sent' },
        { value: 'confirmed_locked', label: 'Confirmed/Locked' },
        { value: 'not_this_season', label: 'Not This Season' },
    ];

    return (
        <div className="px-6 py-8 bg-white">
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
            <button
                onClick={() => router.push('/app/partnerships')}
                className="text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium flex items-center gap-1"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Partnerships
            </button>

            {/* Header */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">{formatPartnerName(partnership.partnerName)}</h1>
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold">
                                {partnership.partnershipType}
                            </span>
                            {partnership.season && (
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                                    {partnership.season}
                                </span>
                            )}
                            {partnership.estimatedRevenue && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                    ${partnership.estimatedRevenue.toLocaleString()} Revenue
                                </span>
                            )}
                            {partnership.lastContactAt && (
                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${Math.floor((new Date().getTime() - new Date(partnership.lastContactAt).getTime()) / (1000 * 60 * 60 * 24)) >= 14
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-50 text-gray-600'
                                    }`}>
                                    {Math.floor((new Date().getTime() - new Date(partnership.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))} days since contact
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="ml-6">
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Stage</label>
                        <select
                            value={partnership.stage}
                            onChange={(e) => handleStageChange(e.target.value)}
                            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-sm font-medium min-w-[200px]"
                        >
                            {stages.map((stage) => (
                                <option key={stage.value} value={stage.value}>
                                    {stage.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Quick Context Bar */}
                <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Source</p>
                            <p className="font-medium text-gray-900">{partnership.source || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Commitment Date</p>
                            <p className="font-medium text-gray-900">
                                {partnership.commitmentDate
                                    ? new Date(partnership.commitmentDate).toLocaleDateString()
                                    : 'Not set'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Created</p>
                            <p className="font-medium text-gray-900">
                                {new Date(partnership.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Last Activity</p>
                            <p className="font-medium text-gray-900">
                                {partnership.activities.length > 0
                                    ? new Date(partnership.activities[0].createdAt).toLocaleDateString()
                                    : 'No activity'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                        <AirtableNotesBlock partnership={partnership} />
                        {!(
                            (partnership.organizationNotes || '').trim() ||
                            partnership.contacts.some((c) => (c.notes || '').trim()) ||
                            partnership.airtableRecordUrl
                        ) && (
                            <p className="text-sm text-gray-500">
                                After an Airtable sync, organization notes and contact notes appear here. URLs in text are
                                clickable.
                            </p>
                        )}
                    </div>
                    {/* Activities */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
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
                                        <div key={activity.id} className={`p-4 rounded-lg border ${styles.row}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${styles.iconWrap}`}>
                                                    {getActivityIcon()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                                            {getActivityLabel()}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(activity.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: 'numeric',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    {activity.content && (
                                                        <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                                                            <TextWithLinks text={activity.content} />
                                                        </p>
                                                    )}
                                                    {activity.previousStage && activity.newStage && (
                                                        <p className="text-xs text-gray-600 mt-2">
                                                            Stage changed: <span className="font-medium">{activity.previousStage.replace(/_/g, ' ')}</span> → <span className="font-medium">{activity.newStage.replace(/_/g, ' ')}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Add Note */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Note</h2>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Enter a note..."
                            className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-sm"
                            rows={4}
                        />
                        <button
                            onClick={handleAddNote}
                            className="mt-3 px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium"
                        >
                            Add Note
                        </button>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Roles */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Roles</h2>
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
                                            {filteredRoleOptions.length === 0 ? (
                                                <div className="p-6 text-center text-sm text-gray-500">No matching roles</div>
                                            ) : (
                                                filteredRoleOptions.map((opt) => {
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
                                                })
                                            )}
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
                            <div className="mt-3 flex flex-wrap gap-2">
                                {selectedRoles.slice(0, 4).map((t) => (
                                    <span key={t} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                        {roleLabel(t)}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRoles((prev) => prev.filter((x) => x !== t))}
                                            className="text-blue-700/70 hover:text-blue-900"
                                        >
                                            ×
                                        </button>
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

                    {/* Business fields */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Fields</h2>
                        <div className="grid grid-cols-2 gap-3">
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
                            className="mt-3 px-3 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                            {savingBusinessFields ? 'Saving…' : 'Save fields'}
                        </button>
                    </div>

                    {/* Contacts */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
                            <button
                                onClick={() => setShowAddContact((v) => !v)}
                                className="px-3 py-1.5 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-xs font-medium"
                            >
                                + Add Contact
                            </button>
                        </div>

                        {showAddContact && (
                            <div className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-3">
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
                                        checked={!!newContact.isPrimary}
                                        onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                                        className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6]"
                                    />
                                    <label htmlFor="isPrimary" className="text-xs text-gray-700">
                                        Set as primary contact
                                    </label>
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

                        <div className="space-y-3">
                            {partnership.contacts.length === 0 ? (
                                <div className="p-4 text-center bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-500">No contacts</p>
                                </div>
                            ) : (
                                partnership.contacts.map((contact) => (
                                    <div key={contact.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900">{contact.name}</p>
                                            {contact.isPrimary && (
                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                        {contact.email && (
                                            <a href={`mailto:${contact.email}`} className="text-sm text-[#3b82f6] hover:text-[#2563eb] mt-1 block">
                                                {contact.email}
                                            </a>
                                        )}
                                        {contact.jobTitle && (
                                            <p className="text-xs text-gray-600 mt-1">{contact.jobTitle}</p>
                                        )}
                                        {contact.phone && (
                                            <p className="text-xs text-gray-600 mt-1">{contact.phone}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <button
                            onClick={() => setShowEmailComposer(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Send Email
                        </button>
                    </div>

                    {/* Tasks */}
                    {partnership.tasks.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
                            <div className="space-y-2">
                                {partnership.tasks.map((task) => {
                                    const statusColors: Record<string, string> = {
                                        completed: 'bg-green-100 text-green-700',
                                        in_progress: 'bg-blue-100 text-blue-700',
                                        pending: 'bg-yellow-100 text-yellow-700',
                                        cancelled: 'bg-gray-100 text-gray-700',
                                    };
                                    return (
                                        <div key={task.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                            <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[task.status] || 'bg-gray-100 text-gray-700'}`}>
                                                    {task.status.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-xs text-gray-500">{task.priority}</span>
                                                {task.dueDate && (
                                                    <span className="text-xs text-gray-500">
                                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Artifacts */}
                    {partnership.artifacts.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
                            <div className="space-y-2">
                                {partnership.artifacts.map((artifact) => {
                                    const statusColors: Record<string, string> = {
                                        signed: 'bg-green-100 text-green-700',
                                        sent: 'bg-blue-100 text-blue-700',
                                        draft: 'bg-gray-100 text-gray-700',
                                    };
                                    return (
                                        <div key={artifact.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                            <p className="font-medium text-gray-900 text-sm">{artifact.name}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-gray-600">{artifact.type}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[artifact.status] || 'bg-gray-100 text-gray-700'}`}>
                                                    {artifact.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Email Composer */}
            {showEmailComposer && partnership && (
                <EmailComposer
                    isOpen={showEmailComposer}
                    to={partnership.contacts?.find((c) => c.isPrimary)?.email || partnership.contacts?.[0]?.email || ''}
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
    );
}
