'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPartnershipDetails, addPartnershipNote, updatePartnershipStage, PartnershipDetail } from '@/lib/api';

export default function PartnershipDetailPage() {
    const params = useParams();
    const router = useRouter();
    const partnershipId = params.id as string;
    const [partnership, setPartnership] = useState<PartnershipDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [note, setNote] = useState('');

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
            loadPartnership();
        } catch (err) {
            console.error('Failed to update stage:', err);
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen bg-white">
                <div className="animate-spin w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full" />
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
        { value: 'new_intro_made', label: 'New Intro Made' },
        { value: 'awaiting_response', label: 'Awaiting Response' },
        { value: 'conversation_active', label: 'Conversation Active' },
        { value: 'mou_sent', label: 'MOU Sent' },
        { value: 'confirmed_locked', label: 'Confirmed & Locked' },
        { value: 'not_this_season', label: 'Not This Season' },
    ];

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 bg-white">
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
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">{partnership.partnerName}</h1>
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
                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                                    Math.floor((new Date().getTime() - new Date(partnership.lastContactAt).getTime()) / (1000 * 60 * 60 * 24)) >= 14
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
                                        <div key={activity.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 flex-shrink-0">
                                                    {getActivityIcon()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                                            {activity.type.replace(/_/g, ' ')}
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
                                                        <p className="text-sm text-gray-900 mt-1">{activity.content}</p>
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
                    {/* Contacts */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contacts</h2>
                        <div className="space-y-3">
                            {partnership.contacts.length === 0 ? (
                                <div className="p-4 text-center bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-500">No contacts</p>
                                </div>
                            ) : (
                                partnership.contacts.map((contact) => (
                                    <div key={contact.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                                        <p className="font-medium text-gray-900">{contact.name}</p>
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
        </div>
    );
}
