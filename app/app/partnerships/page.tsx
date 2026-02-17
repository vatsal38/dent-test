'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPartnerships, PartnershipsListResponse, getPartnershipDetails, addPartnershipNote, updatePartnershipStage, PartnershipDetail } from '@/lib/api';
import { CreatePartnershipModal } from './CreatePartnershipModal';

export default function PartnershipsPage() {
    const [view, setView] = useState<'list' | 'kanban'>('kanban');
    const [data, setData] = useState<PartnershipsListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPartnership, setSelectedPartnership] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const loadData = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        setError(null);
        try {
            // For kanban view, request maximum partnerships and sort by createdAt to show newest first
            // For list view, use the default limit
            const limit = view === 'kanban' ? 100 : 50; // Backend max limit is 100
            const response = await getPartnerships({ 
                view, 
                limit,
                sortBy: view === 'kanban' ? 'createdAt' : 'priorityScore',
                sortOrder: 'desc'
            });
            setData(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load partnerships');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, [view]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full" />
            </div>
        );
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
        <div className="flex h-[calc(100vh-80px)] bg-white">
            {/* Main Content */}
            <div className={`flex-1 overflow-auto transition-all ${selectedPartnership ? 'w-2/3' : 'w-full'}`}>
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Partnerships Pipeline</h1>
                            <p className="text-gray-600">Manage all partnership stages and activities in one view.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setView('kanban')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    view === 'kanban'
                                        ? 'bg-[#3b82f6] text-white'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Kanban Board
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    view === 'list'
                                        ? 'bg-[#3b82f6] text-white'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                List View
                            </button>
                            <button 
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium"
                            >
                                + New Partnership
                            </button>
                        </div>
                    </div>

                    {/* Kanban View */}
                    {view === 'kanban' && data.columns && (
                        <div className="grid grid-cols-3 gap-6">
                            {data.columns.map((column) => (
                                <div key={column.stage} className="flex flex-col">
                                    <div className="mb-4 pb-3 border-b border-gray-200">
                                        <h3 className="font-semibold text-gray-900 text-lg">{column.label}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{column.count} partnerships</p>
                                    </div>
                                    <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-2">
                                        {column.partnerships.length === 0 ? (
                                            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                                                <p className="text-sm text-gray-500">No partnerships</p>
                                            </div>
                                        ) : (
                                            column.partnerships.map((partnership) => {
                                                // Determine status based on days since contact
                                                let status = 'on track';
                                                let statusColor = 'bg-green-100 text-green-700 border-green-200';
                                                
                                                if (partnership.daysSinceContact !== null) {
                                                    if (partnership.daysSinceContact >= 14) {
                                                        status = 'stalled';
                                                        statusColor = 'bg-red-100 text-red-700 border-red-200';
                                                    } else if (partnership.daysSinceContact >= 7 || partnership.stage === 'mou_sent') {
                                                        status = 'at risk';
                                                        statusColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
                                                    }
                                                }

                                                const isSelected = selectedPartnership === partnership.id;
                                                
                                                const isStuck = partnership.daysSinceContact !== null && partnership.daysSinceContact >= 14;
                                                
                                                return (
                                                    <div
                                                        key={partnership.id}
                                                        onClick={() => setSelectedPartnership(partnership.id)}
                                                        className={`p-4 rounded-lg bg-white border cursor-pointer transition-all hover:shadow-md ${
                                                            isSelected ? 'border-[#3b82f6] shadow-lg ring-2 ring-blue-100' : isStuck ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h4 className="font-semibold text-gray-900 text-sm flex-1 pr-2">
                                                                {partnership.partnerName}
                                                            </h4>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium border shrink-0 ${statusColor}`}>
                                                                {status}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Revenue Badge */}
                                                        {partnership.estimatedRevenue && (
                                                            <div className="mb-2">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">
                                                                    ${partnership.estimatedRevenue.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Contact Info */}
                                                        <div className="space-y-1 mb-2">
                                                            <p className={`text-xs ${isStuck ? 'text-red-700 font-semibold' : 'text-gray-500'}`}>
                                                                {partnership.daysSinceContact !== null 
                                                                    ? `${partnership.daysSinceContact} days since contact`
                                                                    : 'No contact'}
                                                            </p>
                                                            {partnership.contactName && (
                                                                <p className="text-xs text-gray-600">
                                                                    {partnership.contactName}
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
                                </div>
                            ))}
                        </div>
                    )}

                    {/* List View */}
                    {view === 'list' && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
                                <div className="col-span-4">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Partner</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Stage</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Contact</span>
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
                                {data.partnerships && data.partnerships.length > 0 ? (
                                    data.partnerships.map((partnership) => (
                                        <div
                                            key={partnership.id}
                                            onClick={() => setSelectedPartnership(partnership.id)}
                                            className={`grid grid-cols-12 gap-4 px-6 py-4 cursor-pointer transition-colors ${
                                                selectedPartnership === partnership.id
                                                    ? 'bg-blue-50 border-l-4 border-l-[#3b82f6]'
                                                    : 'bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="col-span-4">
                                                <h3 className="font-semibold text-gray-900">{partnership.partnerName}</h3>
                                                {partnership.partnershipType && (
                                                    <p className="text-xs text-gray-500 mt-1">{partnership.partnershipType}</p>
                                                )}
                                            </div>
                                            <div className="col-span-2">
                                                <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                                    {partnership.stageLabel}
                                                </span>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-sm text-gray-900">{partnership.contactName || '—'}</p>
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
                                    ))
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

function PartnershipPanel({ partnershipId, onClose, onUpdate }: { partnershipId: string; onClose: () => void; onUpdate?: (showLoading?: boolean) => Promise<void> }) {
    const [partnership, setPartnership] = useState<PartnershipDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');

    const loadPartnership = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPartnershipDetails(partnershipId);
            setPartnership(data);
        } catch (err) {
            console.error('Failed to load partnership:', err);
        } finally {
            setLoading(false);
        }
    }, [partnershipId]);

    useEffect(() => {
        loadPartnership();
    }, [loadPartnership]);

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

    const stages = [
        { value: 'new_intro_made', label: 'New Intro Made' },
        { value: 'awaiting_response', label: 'Awaiting Response' },
        { value: 'conversation_active', label: 'Conversation Active' },
        { value: 'mou_sent', label: 'MOU Sent' },
        { value: 'confirmed_locked', label: 'Confirmed & Locked' },
        { value: 'not_this_season', label: 'Not This Season' },
    ];

    if (loading) {
        return (
            <div className="w-1/3 border-l border-gray-200 bg-white p-6">
                <div className="animate-spin w-6 h-6 border-2 border-[#3b82f6] border-t-transparent rounded-full mx-auto" />
            </div>
        );
    }

    if (!partnership) return null;

    const daysSinceContact = partnership.lastContactAt
        ? Math.floor((new Date().getTime() - new Date(partnership.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
        : null;
    
    const needsAttention = partnership.stage === 'mou_sent' && 
                          (daysSinceContact !== null && daysSinceContact > 5);

    return (
        <div className="w-1/3 border-l border-gray-200 bg-white flex flex-col h-full overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 truncate">{partnership.partnerName}</h2>
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

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Quick Actions */}
                <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium">
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

                {/* Notes Section */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-gray-900">Notes</h3>
                    </div>
                    <div className="space-y-3 mb-4">
                        {partnership.activities
                            .filter(a => a.type === 'note')
                            .map((activity) => (
                                <div key={activity.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-700 leading-relaxed">{activity.content}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {new Date(activity.createdAt).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            ))}
                        {partnership.activities.filter(a => a.type === 'note').length === 0 && (
                            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-500">No notes yet</p>
                            </div>
                        )}
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

                {/* Activity Section */}
                <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Activity Timeline</h3>
                    <div className="space-y-3">
                        {partnership.activities.slice(0, 10).length === 0 ? (
                            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-500">No activity yet</p>
                            </div>
                        ) : (
                            partnership.activities.slice(0, 10).map((activity) => {
                                const getActivityIcon = () => {
                                    switch (activity.type) {
                                        case 'email_sent':
                                        case 'email_received':
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
                                        default:
                                            return (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            );
                                    }
                                };

                                return (
                                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0">
                                            {getActivityIcon()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900">{activity.content || activity.type.replace(/_/g, ' ')}</p>
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
            </div>
        </div>
    );
}
