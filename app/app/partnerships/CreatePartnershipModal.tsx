'use client';

import React, { useState } from 'react';
import {
    createPartnership,
    createPartnershipForExistingOrg,
    CreatePartnershipInput,
    DuplicateOrg,
} from '@/lib/api';

interface CreatePartnershipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (partnershipId: string) => void;
}

const PARTNERSHIP_TYPES = [
    { value: 'dentership_host', label: 'Dentership Host' },
    { value: 'made_at_dent_partner', label: 'Made at Dent Partner' },
    { value: 'internship_host', label: 'Internship Host' },
    { value: 'sponsor', label: 'Sponsor' },
    { value: 'other', label: 'Other' },
];

const PARTNERSHIP_STAGES = [
    { value: 'new_intro_made', label: 'New / Intro Made' },
    { value: 'awaiting_response', label: 'Awaiting Response' },
    { value: 'conversation_active', label: 'Conversation Active' },
    { value: 'mou_sent', label: 'MOU Sent' },
    { value: 'confirmed_locked', label: 'Confirmed / Locked' },
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
        partnershipType: 'dentership_host',
        initialStage: 'new_intro_made',
        season: '',
        source: '',
        estimatedRevenue: undefined,
        tags: [],
    });

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
            partnershipType: 'dentership_host',
            initialStage: 'new_intro_made',
            season: '',
            source: '',
            estimatedRevenue: undefined,
            tags: [],
        });
        setDuplicates(null);
        setSelectedDuplicate(null);
        setError(null);
        onClose();
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
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                        selectedDuplicate === dup.id
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

                {/* Create Form */}
                {!duplicates && (
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                                    Partnership Type *
                                </label>
                                <select
                                    value={formData.partnershipType}
                                    onChange={(e) => setFormData({ ...formData, partnershipType: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:border-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-blue-100"
                                >
                                    {PARTNERSHIP_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                                disabled={creating}
                                className="flex-1 px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? 'Creating...' : 'Create Partnership'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
