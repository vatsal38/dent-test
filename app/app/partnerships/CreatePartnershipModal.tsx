'use client';

import React, { useState } from 'react';
import {
    createPartnership,
    createPartnershipForExistingOrg,
    CreatePartnershipInput,
    DuplicateOrg,
    searchAirtable as apiSearchAirtable,
    importAirtableRecord,
    getPartnerships,
    PartnershipListItem,
} from '@/lib/api';
import { formatPartnerName } from '@/lib/utils';

interface CreatePartnershipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (partnershipId: string) => void;
}

const PARTNERSHIP_TYPES = [
    { value: 'dentership_host', label: 'Denternship Host' },
    { value: 'space_partner', label: 'Space Partner' },
    { value: 'made_at_dent', label: 'Made@Dent' },
    { value: 'sponsor', label: 'Sponsor' },
    { value: 'food_for_thought_speaker', label: 'Food-for-Thought Speaker' },
    { value: 'aixdt_irc_evaluator', label: 'AIxDT IRC Evaluator' },
    { value: 'other', label: 'Other' },
];

const PARTNERSHIP_STAGES = [
    { value: 'need_outreach', label: 'Need 1st Outreach' },
    { value: 'awaiting_response', label: 'Awaiting Response' },
    { value: 'conversation_active', label: 'Conversation Active' },
    { value: 'interested', label: 'Interested' },
    { value: 'mou_sent', label: 'MOU/Invoice Sent' },
    { value: 'confirmed_locked', label: 'Confirmed/Locked' },
    { value: 'not_this_season', label: 'Not This Season' },
];

const ORG_TYPES = [
    { value: 'school', label: 'School' },
    { value: 'nonprofit', label: 'Nonprofit' },
    { value: 'company', label: 'Company' },
    { value: 'government', label: 'Government' },
    { value: 'other', label: 'Other' },
];

export function CreatePartnershipModal({ isOpen, onClose, onSuccess }: CreatePartnershipModalProps) {
    const [formData, setFormData] = useState<CreatePartnershipInput>({
        organizationName: '',
        organizationType: 'other',
        primaryContactName: '',
        primaryContactEmail: '',
        primaryContactJobTitle: '',
        primaryContactPhone: '',
        partnershipType: ['dentership_host'],
        initialStage: 'need_outreach',
        season: '',
        source: '',
        estimatedRevenue: undefined,
        tags: [],
    });

    const [airtableSearch, setAirtableSearch] = useState('');
    const [airtableResults, setAirtableResults] = useState<any[]>([]);
    const [existingResults, setExistingResults] = useState<PartnershipListItem[]>([]);
    const [isSearchingAirtable, setIsSearchingAirtable] = useState(false);
    const [showAirtableSearch, setShowAirtableSearch] = useState(false);

    const [duplicates, setDuplicates] = useState<DuplicateOrg[] | null>(null);
    const [selectedDuplicate, setSelectedDuplicate] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError(null);
        setDuplicates(null);

        try {
            const result = await createPartnership(formData);
            // Call onSuccess before closing to ensure parent can refresh
            if (onSuccess) {
                await onSuccess(result.id);
            }
            handleClose();
        } catch (err: any) {
            // Check if it's a duplicate error
            if (err.status === 409 && err.data && err.data.duplicates) {
                setDuplicates(err.data.duplicates);
            } else {
                setError(err instanceof Error ? err.message : 'Failed to create partnership');
            }
        } finally {
            setCreating(false);
        }
    };

    const handleCreateForExisting = async () => {
        if (!selectedDuplicate) return;

        setCreating(true);
        setError(null);

        try {
            const { organizationName, organizationType, ...restData } = formData;
            const result = await createPartnershipForExistingOrg(selectedDuplicate, restData);
            // Call onSuccess before closing to ensure parent can refresh
            if (onSuccess) {
                await onSuccess(result.id);
            }
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create partnership instance');
            setCreating(false);
        }
    };

    const handleClose = () => {
        setFormData({
            organizationName: '',
            organizationType: 'other',
            primaryContactName: '',
            primaryContactEmail: '',
            primaryContactJobTitle: '',
            primaryContactPhone: '',
            partnershipType: ['dentership_host'],
            initialStage: 'need_outreach',
            season: '',
            source: '',
            estimatedRevenue: undefined,
            tags: [],
        });
        setAirtableSearch('');
        setAirtableResults([]);
        setExistingResults([]);
        setShowAirtableSearch(false);
        setDuplicates(null);
        setSelectedDuplicate(null);
        setError(null);
        onClose();
    };

    const searchAirtable = async () => {
        if (!airtableSearch.trim()) return;
        setIsSearchingAirtable(true);
        setError(null);
        try {
            const [airtableData, dbData] = await Promise.all([
                apiSearchAirtable(airtableSearch).catch(err => {
                    console.error('Airtable search error:', err);
                    return { records: [] };
                }),
                getPartnerships({ search: airtableSearch, limit: 10 }).catch(err => {
                    console.error('DB search error:', err);
                    return { partnerships: [] };
                })
            ]);

            setAirtableResults(airtableData.records || []);
            setExistingResults(dbData.partnerships || []);
        } catch (err: any) {
            setError(err.message || 'Failed to search');
        } finally {
            setIsSearchingAirtable(false);
        }
    };

    const handleImportAirtable = async (record: any) => {
        setCreating(true);
        setError(null);
        try {
            const data = await importAirtableRecord(record.id);

            if (onSuccess) {
                await onSuccess(data.partnershipId);
            }
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Failed to import from Airtable');
            setCreating(false);
        }
    };

    const togglePartnershipType = (type: string) => {
        setFormData(prev => {
            const current = prev.partnershipType || [];
            if (current.includes(type)) {
                return { ...prev, partnershipType: current.filter(t => t !== type) };
            } else {
                return { ...prev, partnershipType: [...current, type] };
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative bg-white rounded-lg border border-gray-200 p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Create Partnership</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && !duplicates && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Duplicate Detection Modal */}
                {duplicates && duplicates.length > 0 && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                            ⚠️ Potential Duplicate Found
                        </h3>
                        <p className="text-sm text-gray-700 mb-4">
                            An organization with a similar name already exists. Choose an option below:
                        </p>

                        <div className="space-y-2 mb-4">
                            {duplicates.map((dup) => (
                                <label
                                    key={dup.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedDuplicate === dup.id
                                        ? 'bg-blue-50 border-blue-300'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="duplicate"
                                        value={dup.id}
                                        checked={selectedDuplicate === dup.id}
                                        onChange={(e) => setSelectedDuplicate(e.target.value)}
                                        className="text-blue-600"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{dup.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {dup.type} · {dup.partnershipCount} existing partnership{dup.partnershipCount !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateForExisting}
                                disabled={!selectedDuplicate || creating}
                                className="flex-1 px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? 'Creating...' : 'Create New Partnership Instance'}
                            </button>
                            <button
                                onClick={() => {
                                    setDuplicates(null);
                                    setSelectedDuplicate(null);
                                }}
                                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                {!duplicates && (
                    <div className="flex border-b border-gray-200 mb-6">
                        <button
                            onClick={() => setShowAirtableSearch(false)}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${!showAirtableSearch
                                ? 'border-[#3b82f6] text-[#3b82f6]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Manual Entry
                        </button>
                        <button
                            onClick={() => setShowAirtableSearch(true)}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${showAirtableSearch
                                ? 'border-[#3b82f6] text-[#3b82f6]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Search Airtable
                        </button>
                    </div>
                )}

                {/* Airtable Search Flow */}
                {showAirtableSearch && !duplicates && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={airtableSearch}
                                onChange={(e) => setAirtableSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchAirtable()}
                                placeholder="Search by organization name..."
                                className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                            <button
                                onClick={searchAirtable}
                                disabled={isSearchingAirtable}
                                className="px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] disabled:opacity-50"
                            >
                                {isSearchingAirtable ? 'Searching...' : 'Search'}
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                            {airtableResults.length === 0 && existingResults.length === 0 && !isSearchingAirtable && (
                                <div className="text-center py-8 text-gray-500 text-sm">
                                    No records found. Try a different search term.
                                </div>
                            )}

                            {/* Existing Records Section */}
                            {existingResults.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sticky top-0 bg-white py-1">
                                        Existing Partnerships ({existingResults.length})
                                    </h3>
                                    {existingResults.map((record) => (
                                        <div
                                            key={record.id}
                                            className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 transition-all flex items-start justify-between gap-4"
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                                    {record.partnerName}
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                                                        Already in DB
                                                    </span>
                                                </h3>
                                                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                                    <span>{record.stageLabel}</span>
                                                    {record.contactName && <span>• {record.contactName}</span>}
                                                </div>
                                            </div>
                                            <a
                                                href={`/app/partnerships?id=${record.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                View
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Airtable Records Section */}
                            {airtableResults.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sticky top-0 bg-white py-1">
                                        Airtable Records ({airtableResults.length})
                                    </h3>
                                    {airtableResults.map((record) => {
                                        const displayName = formatPartnerName(
                                            record.fields['Organization Name'] ||
                                            record.fields['Organization'] ||
                                            record.fields['Name']
                                        );

                                        // Check if this Airtable record name closely matches an existing DB record
                                        const isAlreadyImported = existingResults.some(
                                            er => er.partnerName.toLowerCase() === displayName.toLowerCase()
                                        );

                                        return (
                                            <div
                                                key={record.id}
                                                className={`p-4 rounded-xl border transition-all group ${isAlreadyImported
                                                    ? 'border-gray-200 bg-gray-50 opacity-75'
                                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                                            {displayName}
                                                            {isAlreadyImported && (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600 uppercase">
                                                                    Exists
                                                                </span>
                                                            )}
                                                        </h3>
                                                        {record.fields.Website && (
                                                            <div className="text-xs text-blue-500 mt-2 truncate max-w-xs cursor-default">
                                                                {record.fields.Website}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleImportAirtable(record)}
                                                        disabled={creating || isAlreadyImported}
                                                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all shadow-sm ${isAlreadyImported
                                                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                                                            }`}
                                                    >
                                                        {creating ? 'Importing...' : isAlreadyImported ? 'Imported' : 'Import Record'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Manual Create Form */}
                {
                    !duplicates && !showAirtableSearch && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                                        Organization Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.organizationName}
                                        onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="Acme School District"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                                        Organization Type *
                                    </label>
                                    <select
                                        value={formData.organizationType}
                                        onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    >
                                        {ORG_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                                        Contact Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.primaryContactName}
                                        onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                                        Contact Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.primaryContactEmail}
                                        onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                                        Job Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.primaryContactJobTitle}
                                        onChange={(e) => setFormData({ ...formData, primaryContactJobTitle: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="Principal"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.primaryContactPhone}
                                        onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                                    Partnership Types *
                                </label>
                                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    {PARTNERSHIP_TYPES.map((type) => (
                                        <label key={type.value} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.partnershipType?.includes(type.value)}
                                                onChange={() => togglePartnershipType(type.value)}
                                                className="w-4 h-4 rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                                                {type.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                                        Initial Stage *
                                    </label>
                                    <select
                                        value={formData.initialStage}
                                        onChange={(e) => setFormData({ ...formData, initialStage: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    >
                                        {PARTNERSHIP_STAGES.map((stage) => (
                                            <option key={stage.value} value={stage.value}>
                                                {stage.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                                        Season
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.season}
                                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="FY26 Spring"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                                        Source
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="Referral, Email, etc."
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                                        Estimated Revenue
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.estimatedRevenue || ''}
                                        onChange={(e) => setFormData({ ...formData, estimatedRevenue: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        min="0"
                                        step="0.01"
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                        placeholder="50000"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !formData.partnershipType?.length}
                                    className="flex-1 px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating ? 'Creating...' : 'Create Partnership'}
                                </button>
                            </div>
                        </form>
                    )
                }
            </div >
        </div >
    );
}
