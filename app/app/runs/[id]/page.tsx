'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getRunDetails, updateRunStep, updateRunStatus, createRunStep, RunDetail, RunStep, getPartnerships, PartnershipsListResponse } from '@/lib/api';
import Link from 'next/link';

export default function RunDetailPage() {
    const params = useParams();
    const router = useRouter();
    const runId = params.id as string;
    const [run, setRun] = useState<RunDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddStepModal, setShowAddStepModal] = useState(false);

    const loadRun = useCallback(async () => {
        if (!runId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getRunDetails(runId);
            setRun(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load run');
        } finally {
            setLoading(false);
        }
    }, [runId]);

    useEffect(() => {
        loadRun();
    }, [loadRun]);

    async function handleStepUpdate(stepId: string, status: string) {
        try {
            await updateRunStep(runId, stepId, { status });
            loadRun();
        } catch (err) {
            console.error('Failed to update step:', err);
        }
    }

    async function handleCompleteRun() {
        try {
            await updateRunStatus(runId, { status: 'completed' });
            loadRun();
        } catch (err) {
            console.error('Failed to complete run:', err);
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

    if (!run) return null;

    const allStepsCompleted = run.steps.every(s => s.status === 'completed' || s.status === 'skipped');
    const progressPercent = run.steps.length > 0
        ? (run.steps.filter(s => s.status === 'completed').length / run.steps.length) * 100
        : 0;

    return (
        <div className="p-8 max-w-6xl mx-auto bg-white">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.push('/app/runs')}
                    className="text-gray-500 hover:text-gray-700 mb-4 text-sm flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Runs
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{run.name}</h1>
                        {run.description && (
                            <p className="text-gray-600">{run.description}</p>
                        )}
                        {run.template && (
                            <p className="text-sm text-gray-500 mt-1">Template: {run.template.name}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            run.status === 'completed' ? 'bg-green-100 text-green-700' :
                            run.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            run.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                            {run.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Progress</span>
                    <span className="text-sm text-gray-600">
                        {run.steps.filter(s => s.status === 'completed').length} / {run.steps.length} steps completed
                    </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Steps</h2>
                    <button
                        onClick={() => setShowAddStepModal(true)}
                        className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {run.steps.length === 0 ? 'Add First Step' : 'Add Step'}
                    </button>
                </div>
                {run.steps.length === 0 ? (
                    <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-gray-500 mb-2">This run has no steps yet</p>
                        <p className="text-sm text-gray-400 mb-4">Add steps to start working through this run</p>
                        <button
                            onClick={() => setShowAddStepModal(true)}
                            className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium"
                        >
                            Add Step
                        </button>
                    </div>
                ) : (
                    run.steps.map((step) => (
                        <StepCard
                            key={step.id}
                            step={step}
                            runId={runId}
                            onUpdate={(status) => handleStepUpdate(step.id, status)}
                            onReload={loadRun}
                        />
                    ))
                )}
            </div>

            {/* Complete Button */}
            {allStepsCompleted && run.status !== 'completed' && (
                <div className="mt-8">
                    <button
                        onClick={handleCompleteRun}
                        className="w-full px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
                    >
                        Complete Run
                    </button>
                </div>
            )}

            {/* Outcome */}
            {run.outcome && (
                <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Outcome</h3>
                    <p className="text-gray-700">{run.outcome}</p>
                </div>
            )}

            {/* Add Step Modal */}
            {showAddStepModal && (
                <AddStepModal
                    runId={runId}
                    currentStepCount={run.steps.length}
                    onClose={() => setShowAddStepModal(false)}
                    onSuccess={() => {
                        setShowAddStepModal(false);
                        loadRun();
                    }}
                />
            )}
        </div>
    );
}

function AddStepModal({
    runId,
    currentStepCount,
    onClose,
    onSuccess,
}: {
    runId: string;
    currentStepCount: number;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [actionType, setActionType] = useState('review');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const actionTypes = [
        { value: 'review', label: 'Review', desc: 'Review data (partnerships, emails, etc.)' },
        { value: 'email', label: 'Email', desc: 'Compose and send emails' },
        { value: 'update_stage', label: 'Update Stage', desc: 'Update partnership stages' },
        { value: 'create_task', label: 'Create Task', desc: 'Create follow-up tasks' },
        { value: 'schedule', label: 'Schedule', desc: 'Schedule meetings/calls' },
        { value: 'note', label: 'Note', desc: 'Add notes/documentation' },
        { value: 'custom', label: 'Custom', desc: 'Custom action' },
    ];

    async function handleCreate() {
        if (!title.trim()) {
            setError('Step title is required');
            return;
        }

        setCreating(true);
        setError(null);
        try {
            await createRunStep(runId, {
                title: title.trim(),
                description: description.trim() || undefined,
                actionType,
                orderIndex: currentStepCount,
            });
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create step');
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl border border-gray-200 p-6 max-w-md w-full mx-4 shadow-xl">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add Step</h2>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                            Step Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Review at-risk partnerships"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description of what this step involves"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">
                            Action Type
                        </label>
                        <select
                            value={actionType}
                            onChange={(e) => setActionType(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        >
                            {actionTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label} - {type.desc}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!title.trim() || creating}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors disabled:opacity-50"
                    >
                        {creating ? 'Creating...' : 'Add Step'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function StepCard({
    step,
    runId,
    onUpdate,
    onReload,
}: {
    step: RunStep;
    runId: string;
    onUpdate: (status: string) => void;
    onReload: () => void;
}) {
    const [showActionContent, setShowActionContent] = useState(false);
    const [partnerships, setPartnerships] = useState<PartnershipsListResponse | null>(null);
    const [loadingData, setLoadingData] = useState(false);

    // Load data when step becomes in_progress
    useEffect(() => {
        if (step.status === 'in_progress' && !showActionContent && step.actionType === 'review') {
            loadStepData();
        }
    }, [step.status, step.actionType]);

    async function loadStepData() {
        if (step.actionType === 'review') {
            setLoadingData(true);
            try {
                // Load partnerships based on step config or default to at-risk
                const data = await getPartnerships({ 
                    view: 'list', 
                    limit: 50,
                    // Could filter by step.config if available
                });
                setPartnerships(data);
                setShowActionContent(true);
            } catch (err) {
                console.error('Failed to load step data:', err);
            } finally {
                setLoadingData(false);
            }
        } else {
            setShowActionContent(true);
        }
    }

    const handleStart = () => {
        onUpdate('in_progress');
        if (step.actionType === 'review') {
            loadStepData();
        } else {
            setShowActionContent(true);
        }
    };

    const getActionIcon = () => {
        switch (step.actionType) {
            case 'review':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                );
            case 'email':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                );
            case 'update_stage':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                );
            case 'create_task':
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                );
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[#3b82f6] flex items-center justify-center text-white font-semibold text-sm">
                            {step.orderIndex + 1}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            step.status === 'completed' ? 'bg-green-100 text-green-700' :
                            step.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            step.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                            {step.status.replace('_', ' ')}
                        </span>
                    </div>
                    {step.description && (
                        <p className="text-sm text-gray-600 ml-12 mb-2">{step.description}</p>
                    )}
                    <div className="flex items-center gap-2 ml-12">
                        <span className="text-xs text-gray-500">Action Type:</span>
                        <span className="text-xs font-medium text-gray-700">{step.actionType.replace('_', ' ')}</span>
                        {getActionIcon()}
                    </div>
                </div>
            </div>

            {/* Action Content - Shows when step is in_progress */}
            {step.status === 'in_progress' && showActionContent && (
                <div className="ml-12 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {step.actionType === 'review' && partnerships && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Partnerships to Review</h4>
                            {partnerships.partnerships && partnerships.partnerships.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {partnerships.partnerships.slice(0, 10).map((p) => (
                                        <Link
                                            key={p.id}
                                            href={`/app/partnerships/${p.id}`}
                                            target="_blank"
                                            className="block p-3 bg-white rounded border border-gray-200 hover:border-[#3b82f6] hover:shadow-sm transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-gray-900">{p.partnerName}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {p.daysSinceContact !== null 
                                                            ? `Last contact: ${p.daysSinceContact} days ago`
                                                            : 'No contact yet'}
                                                    </p>
                                                </div>
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                    {p.stageLabel}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No partnerships found</p>
                            )}
                        </div>
                    )}
                    {step.actionType === 'email' && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Compose Email</h4>
                            <p className="text-sm text-gray-600 mb-3">
                                Use the Email Inbox to compose and send emails. This step will be marked complete when you've sent the required emails.
                            </p>
                            <Link
                                href="/app/inbox"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Go to Email Inbox
                            </Link>
                        </div>
                    )}
                    {step.actionType === 'update_stage' && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Update Partnership Stages</h4>
                            <p className="text-sm text-gray-600 mb-3">
                                Go to the Partnerships page to update stages. This step will be marked complete when you've updated the required partnerships.
                            </p>
                            <Link
                                href="/app/partnerships"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Go to Partnerships
                            </Link>
                        </div>
                    )}
                    {step.actionType === 'note' && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Add Notes</h4>
                            <textarea
                                placeholder="Add your notes here..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                                rows={4}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Notes will be saved when you complete this step.
                            </p>
                        </div>
                    )}
                    {(step.actionType === 'schedule' || step.actionType === 'create_task' || step.actionType === 'custom') && (
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Action Required</h4>
                            <p className="text-sm text-gray-600">
                                Complete this action manually. Mark the step as complete when finished.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Loading State */}
            {step.status === 'in_progress' && loadingData && (
                <div className="ml-12 mb-4 flex items-center justify-center p-8">
                    <div className="animate-spin w-6 h-6 border-2 border-[#3b82f6] border-t-transparent rounded-full" />
                </div>
            )}

            {/* Actions */}
            {step.status === 'pending' && (
                <div className="flex items-center gap-2 ml-12">
                    <button
                        onClick={handleStart}
                        className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium"
                    >
                        Start Step
                    </button>
                    <button
                        onClick={() => onUpdate('skipped')}
                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                        Skip
                    </button>
                </div>
            )}

            {step.status === 'in_progress' && (
                <div className="flex items-center gap-2 ml-12">
                    <button
                        onClick={() => onUpdate('completed')}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                        Mark Complete
                    </button>
                    <button
                        onClick={() => {
                            onUpdate('pending');
                            setShowActionContent(false);
                        }}
                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                        Reset
                    </button>
                </div>
            )}

            {step.status === 'completed' && step.completedAt && (
                <div className="ml-12 mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Completed {new Date(step.completedAt).toLocaleString()}</span>
                </div>
            )}

            {step.status === 'skipped' && (
                <div className="ml-12 mt-2">
                    <button
                        onClick={() => onUpdate('pending')}
                        className="text-sm text-[#3b82f6] hover:underline"
                    >
                        Restart this step
                    </button>
                </div>
            )}
        </div>
    );
}
