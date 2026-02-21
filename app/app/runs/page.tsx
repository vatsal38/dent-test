'use client';

import { useEffect, useState } from 'react';
import { getRuns, getRunTemplates, RunListItem, RunTemplate, createRun, getPartnerships, PartnershipsListResponse } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RunsPage() {
    const router = useRouter();
    const [runs, setRuns] = useState<RunListItem[]>([]);
    const [templates, setTemplates] = useState<RunTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<RunTemplate | null>(null);
    const [runName, setRunName] = useState('');
    const [creating, setCreating] = useState(false);
    const [selectedPartnershipIds, setSelectedPartnershipIds] = useState<string[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            const [runsData, templatesData] = await Promise.all([
                getRuns({ limit: 50 }),
                getRunTemplates(),
            ]);
            setRuns(runsData.runs);
            setTemplates(templatesData.templates);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load runs');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateRun() {
        if (!runName.trim()) return;
        setCreating(true);
        try {
            const run = await createRun({
                templateId: selectedTemplate?.id,
                name: runName,
                description: selectedTemplate ? `Run: ${selectedTemplate.name}` : undefined,
                linkedPartnershipIds: selectedPartnershipIds,
            });
            router.push(`/app/runs/${run.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create run');
            setCreating(false);
        }
    }

    const getStatusIcon = (template: RunTemplate) => {
        // Based on template name or category, return appropriate icon
        if (template.name.toLowerCase().includes('stalled')) {
            return (
                <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            );
        } else if (template.name.toLowerCase().includes('mou')) {
            return (
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </div>
            );
        } else if (template.name.toLowerCase().includes('inbox')) {
            return (
                <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            );
        } else {
            return (
                <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
            );
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                    <svg className="w-6 h-6 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <h1 className="text-2xl font-bold text-gray-900">Guided Work Sessions</h1>
                </div>
                <p className="text-gray-600">Focused work runs with step-by-step guidance</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Available Runs Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Available Run Templates</h2>
                    <button
                        onClick={() => {
                            setSelectedTemplate(null);
                            setRunName('');
                            setShowCreateModal(true);
                        }}
                        className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium"
                    >
                        + Create Custom Run
                    </button>
                </div>
                {templates.length === 0 ? (
                    <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <p className="text-gray-500 mb-2">No run templates available</p>
                        <p className="text-sm text-gray-400 mb-4">Create a custom run to get started</p>
                        <button
                            onClick={() => {
                                setSelectedTemplate(null);
                                setRunName('');
                                setShowCreateModal(true);
                            }}
                            className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium"
                        >
                            Create Custom Run
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template) => (
                        <div
                            key={template.id}
                            className="p-6 rounded-lg bg-white border border-gray-200 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                                    <p className="text-sm text-gray-600">{template.description}</p>
                                </div>
                                <div className="ml-4">
                                    {getStatusIcon(template)}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{template.estimatedMinutes} mins</span>
                                    </div>
                                    <span>{template.steps.length} steps</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedTemplate(template);
                                        setRunName(template.name);
                                        setShowCreateModal(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                    Start Run
                                </button>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Sessions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h2>
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full" />
                    </div>
                ) : runs.length === 0 ? (
                    <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-500">No runs yet. Start a run from above!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {runs.map((run) => {
                            const startedDate = new Date(run.startedAt);
                            const now = new Date();
                            const diffMs = now.getTime() - startedDate.getTime();
                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                            const diffDays = Math.floor(diffHours / 24);
                            
                            let timeAgo = '';
                            if (diffDays === 0) {
                                timeAgo = `Today at ${startedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
                            } else if (diffDays === 1) {
                                timeAgo = `Yesterday at ${startedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
                            } else {
                                timeAgo = `${diffDays} days ago`;
                            }

                            const elapsedMinutes = Math.floor(diffMs / (1000 * 60));

                            return (
                                <div
                                    key={run.id}
                                    onClick={() => router.push(`/app/runs/${run.id}`)}
                                    className="p-4 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{run.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">{timeAgo}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span>{run.stepsCompleted} items processed</span>
                                                <span>{elapsedMinutes} mins elapsed</span>
                                            </div>
                                        </div>
                                        {run.status === 'completed' && (
                                            <div className="flex items-center gap-2 text-green-600">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-sm font-medium">Completed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Run Modal */}
            {showCreateModal && (
                <CreateRunModal
                    template={selectedTemplate}
                    runName={runName}
                    onNameChange={setRunName}
                    selectedPartnershipIds={selectedPartnershipIds}
                    onPartnershipIdsChange={setSelectedPartnershipIds}
                    onCreate={handleCreateRun}
                    onClose={() => {
                        setShowCreateModal(false);
                        setSelectedTemplate(null);
                        setRunName('');
                        setSelectedPartnershipIds([]);
                    }}
                    creating={creating}
                />
            )}
        </div>
    );
}

function CreateRunModal({
    template,
    runName,
    onNameChange,
    selectedPartnershipIds,
    onPartnershipIdsChange,
    onCreate,
    onClose,
    creating,
}: {
    template: RunTemplate | null;
    runName: string;
    onNameChange: (name: string) => void;
    selectedPartnershipIds: string[];
    onPartnershipIdsChange: (ids: string[]) => void;
    onCreate: () => void;
    onClose: () => void;
    creating: boolean;
}) {
    const [partnerships, setPartnerships] = useState<PartnershipsListResponse | null>(null);
    const [loadingPartnerships, setLoadingPartnerships] = useState(false);
    const [showPartnershipSelector, setShowPartnershipSelector] = useState(false);
    const [partnershipSearch, setPartnershipSearch] = useState('');

    useEffect(() => {
        if (showPartnershipSelector && !partnerships && !loadingPartnerships) {
            setLoadingPartnerships(true);
            getPartnerships({ limit: 100, view: 'list' })
                .then(data => {
                    setPartnerships(data);
                })
                .catch(err => {
                    console.error('Failed to load partnerships:', err);
                })
                .finally(() => {
                    setLoadingPartnerships(false);
                });
        }
    }, [showPartnershipSelector, partnerships, loadingPartnerships]);

    const filteredPartnerships = partnerships?.partnerships?.filter(p =>
        p.partnerName.toLowerCase().includes(partnershipSearch.toLowerCase()) ||
        p.contactName?.toLowerCase().includes(partnershipSearch.toLowerCase()) ||
        p.contactEmail?.toLowerCase().includes(partnershipSearch.toLowerCase())
    ) || [];

    const togglePartnership = (partnershipId: string) => {
        if (selectedPartnershipIds.includes(partnershipId)) {
            onPartnershipIdsChange(selectedPartnershipIds.filter(id => id !== partnershipId));
        } else {
            onPartnershipIdsChange([...selectedPartnershipIds, partnershipId]);
        }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl border border-gray-200 p-6 max-w-md w-full mx-4 shadow-xl">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {template ? 'Create Run from Template' : 'Create Custom Run'}
                </h2>
                
                {template ? (
                    <div className="mb-4 p-3 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-900 font-medium">{template.name}</p>
                        {template.description && (
                            <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            {template.steps.length} steps · ~{template.estimatedMinutes} minutes
                        </p>
                    </div>
                ) : (
                    <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm text-blue-900 font-medium mb-1">Custom Run</p>
                        <p className="text-xs text-blue-700">
                            Create a run without a template. You can add steps manually after creation.
                        </p>
                    </div>
                )}

                <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                        Run Name
                    </label>
                    <input
                        type="text"
                        value={runName}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder={template ? `Enter run name...` : "e.g., Weekly Review, Follow-up Session"}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    />
                </div>

                {/* Partnership Selector */}
                <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                        Link to Partnerships (Optional)
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowPartnershipSelector(!showPartnershipSelector)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 bg-white text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        >
                            <span className="text-sm">
                                {selectedPartnershipIds.length > 0
                                    ? `${selectedPartnershipIds.length} partnership${selectedPartnershipIds.length > 1 ? 's' : ''} selected`
                                    : 'Select partnerships...'}
                            </span>
                            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showPartnershipSelector && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                <div className="p-2 border-b border-gray-200">
                                    <input
                                        type="text"
                                        value={partnershipSearch}
                                        onChange={(e) => setPartnershipSearch(e.target.value)}
                                        placeholder="Search partnerships..."
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                {loadingPartnerships ? (
                                    <div className="p-4 text-center">
                                        <div className="animate-spin w-5 h-5 border-2 border-[#3b82f6] border-t-transparent rounded-full mx-auto"></div>
                                        <p className="text-xs text-gray-500 mt-2">Loading partnerships...</p>
                                    </div>
                                ) : filteredPartnerships.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                        {partnershipSearch ? 'No partnerships found' : 'No partnerships available'}
                                    </div>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto">
                                        {filteredPartnerships.slice(0, 20).map((partnership) => (
                                            <label
                                                key={partnership.id}
                                                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPartnershipIds.includes(partnership.id)}
                                                    onChange={() => togglePartnership(partnership.id)}
                                                    className="mt-1 w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6]"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {partnership.partnerName}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {partnership.contactName && (
                                                            <span className="text-xs text-gray-600">
                                                                {partnership.contactName}
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                                            {partnership.stageLabel}
                                                        </span>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {selectedPartnershipIds.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {partnerships?.partnerships
                                ?.filter(p => selectedPartnershipIds.includes(p.id))
                                .map((partnership) => (
                                    <span
                                        key={partnership.id}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                                    >
                                        {partnership.partnerName}
                                        <button
                                            type="button"
                                            onClick={() => togglePartnership(partnership.id)}
                                            className="text-blue-700 hover:text-blue-900"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onCreate}
                        disabled={!runName.trim() || creating}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors disabled:opacity-50"
                    >
                        {creating ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}
