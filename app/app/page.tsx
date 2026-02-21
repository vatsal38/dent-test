'use client';

import { useEffect, useState, useCallback } from 'react';
import { getEducationHome, EducationHomePriority, EducationHomeAtRisk, getAirtableStatus, syncAirtable, AirtableStatus } from '@/lib/api';
import Link from 'next/link';
import { ErrorToast } from '@/components/ErrorToast';

export default function HomePage() {
    const [data, setData] = useState<{
        greeting: string;
        date: string;
        orgName: string;
        priorities: EducationHomePriority[];
        urgentCount: number;
        atRisk: EducationHomeAtRisk[];
        recentRuns: Array<{
            id: string;
            name: string;
            status: string;
            startedAt: string;
            completedAt: string | null;
            templateName: string | null;
        }>;
        querySuggestions: string[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [airtableStatus, setAirtableStatus] = useState<AirtableStatus | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [homeResponse, statusResponse] = await Promise.all([
                getEducationHome(),
                getAirtableStatus().catch(() => null), // Don't fail if status check fails
            ]);
            setData(homeResponse);
            setAirtableStatus(statusResponse);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load home data');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSync = useCallback(async () => {
        setSyncing(true);
        setSyncError(null);
        try {
            await syncAirtable();
            // Reload data after sync
            await loadData();
        } catch (err) {
            console.error('Sync failed:', err);
            setSyncError('Sync failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setSyncing(false);
        }
    }, [loadData]);

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

    const topAction = data.priorities[0];
    const greetingTime = data.greeting.includes('morning') ? 'Good morning' : 
                        data.greeting.includes('afternoon') ? 'Good afternoon' : 
                        'Good evening';

    return (
        <>
            <ErrorToast
                isOpen={!!syncError}
                message={syncError || ''}
                onClose={() => setSyncError(null)}
            />
            <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Daily Command Center</h1>
                <p className="text-lg text-gray-600">{greetingTime}. Here&apos;s what matters today.</p>
            </div>

            {/* Live Airtable Sync Card */}
            <div className={`mb-6 p-4 rounded-lg border ${
                airtableStatus?.connected 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
            }`}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            airtableStatus?.connected 
                                ? 'bg-green-100' 
                                : 'bg-yellow-100'
                        }`}>
                            {airtableStatus?.connected ? (
                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">Airtable Sync Status</h3>
                                {airtableStatus?.connected && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                        Connected
                                    </span>
                                )}
                                {!airtableStatus?.connected && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                        Not Connected
                                    </span>
                                )}
                            </div>
                            {airtableStatus?.connected ? (
                                <div className="space-y-1">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">{data.priorities.length}</span> partnerships synced
                                        {airtableStatus.lastSyncAt && (
                                            <span className="text-gray-600">
                                                {' • '}
                                                Last sync: {(() => {
                                                    const syncDate = new Date(airtableStatus.lastSyncAt);
                                                    const now = new Date();
                                                    const diffMs = now.getTime() - syncDate.getTime();
                                                    const diffMins = Math.floor(diffMs / (1000 * 60));
                                                    if (diffMins < 1) return 'Just now';
                                                    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
                                                    const diffHours = Math.floor(diffMins / 60);
                                                    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                                                    const diffDays = Math.floor(diffHours / 24);
                                                    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                                                })()}
                                            </span>
                                        )}
                                    </p>
                                    {airtableStatus.baseId && (
                                        <p className="text-xs text-gray-600">
                                            Base: <code className="bg-white px-1 py-0.5 rounded">{airtableStatus.baseId}</code>
                                            {' • '}
                                            Table: <code className="bg-white px-1 py-0.5 rounded">{airtableStatus.tableId}</code>
                                        </p>
                                    )}
                                    {airtableStatus.syncErrorMessage && (
                                        <p className="text-xs text-red-600">
                                            ⚠️ Sync error: {airtableStatus.syncErrorMessage}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-700">
                                    Airtable is not connected. Add credentials to your backend <code className="bg-white px-1 py-0.5 rounded text-xs">.env</code> file to enable sync.
                                </p>
                            )}
                        </div>
                    </div>
                    {airtableStatus?.connected && (
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-colors flex items-center gap-2"
                        >
                            {syncing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Sync Now
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Who should I follow up with? What deals might miss deadlines?"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-gray-900"
                    />
                </div>
            </div>

            {/* TOP ACTION Card */}
            {topAction && (
                <div className="mb-6 p-6 bg-orange-50 border-2 border-orange-400 rounded-lg shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-semibold text-orange-600 uppercase tracking-wide">START HERE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
                                Priority: {Math.round(topAction.priorityScore * 100)}%
                            </span>
                            {topAction.estimatedRevenue && (
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                    ${topAction.estimatedRevenue.toLocaleString()}
                                </span>
                            )}
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{topAction.partnerName}</h2>
                    <p className="text-lg text-gray-700 mb-4 font-medium">{topAction.whyNow}</p>
                    
                    {/* Next Action Required */}
                    {topAction.suggestedAction && (
                        <div className="mb-4 p-3 bg-white border border-orange-200 rounded-lg">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Next Action Required</p>
                            <p className="text-sm text-gray-900">{topAction.suggestedAction}</p>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Stage</p>
                            <p className="font-semibold text-gray-900">{topAction.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Last Contact</p>
                            <p className={`font-semibold ${topAction.daysSinceContact !== null && topAction.daysSinceContact > 7 ? 'text-red-600' : 'text-gray-900'}`}>
                                {topAction.daysSinceContact !== null ? `${topAction.daysSinceContact} days ago` : 'Never'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Deadline</p>
                            <p className={`font-semibold ${topAction.daysUntilDeadline !== null && topAction.daysUntilDeadline < 7 ? 'text-red-600' : 'text-gray-900'}`}>
                                {topAction.daysUntilDeadline !== null 
                                    ? topAction.daysUntilDeadline < 0 
                                        ? `${Math.abs(topAction.daysUntilDeadline)} days overdue`
                                        : `${topAction.daysUntilDeadline} days`
                                    : 'No deadline'}
                            </p>
                        </div>
                    </div>
                    <Link
                        href={`/app/partnerships/${topAction.id}`}
                        className="inline-block px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                    >
                        Take Action Now →
                    </Link>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Priorities - Left Column */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Priorities</h2>
                    <div className="space-y-3">
                        {data.priorities.slice(1, 6).map((priority, idx) => {
                            // Determine if partnership is stuck (no contact for 14+ days)
                            const isStuck = priority.daysSinceContact !== null && priority.daysSinceContact >= 14;
                            const isUrgent = priority.daysUntilDeadline !== null && priority.daysUntilDeadline < 7 && priority.daysUntilDeadline >= 0;
                            
                            return (
                                <Link
                                    key={priority.id}
                                    href={`/app/partnerships/${priority.id}`}
                                    className={`block p-4 rounded-lg border hover:shadow-md transition-all ${
                                        isStuck 
                                            ? 'bg-red-50 border-red-300' 
                                            : isUrgent 
                                            ? 'bg-orange-50 border-orange-300'
                                            : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            {/* Priority Score Badge */}
                                            <div className="flex flex-col items-center gap-1 shrink-0">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${
                                                    priority.confidence === 'high' 
                                                        ? 'bg-red-100 text-red-700' 
                                                        : priority.confidence === 'medium'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {Math.round(priority.priorityScore * 100)}
                                                </div>
                                                <span className="text-xs text-gray-500">Score</span>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900 truncate">{priority.partnerName}</h3>
                                                    {isStuck && (
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold shrink-0">
                                                            STUCK
                                                        </span>
                                                    )}
                                                    {isUrgent && (
                                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-semibold shrink-0">
                                                            URGENT
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{priority.whyNow}</p>
                                                
                                                {/* Next Action */}
                                                {priority.suggestedAction && (
                                                    <p className="text-xs text-gray-500 mb-2">
                                                        <span className="font-semibold">Action:</span> {priority.suggestedAction}
                                                    </p>
                                                )}
                                                
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 flex-wrap">
                                                    {priority.estimatedRevenue && (
                                                        <span className="font-semibold text-green-700">
                                                            ${priority.estimatedRevenue.toLocaleString()}
                                                        </span>
                                                    )}
                                                    <span className={priority.daysSinceContact !== null && priority.daysSinceContact >= 14 ? 'text-red-600 font-semibold' : ''}>
                                                        {priority.daysSinceContact !== null ? `${priority.daysSinceContact} days since contact` : 'No contact'}
                                                    </span>
                                                    {priority.daysUntilDeadline !== null && (
                                                        <span className={priority.daysUntilDeadline < 7 ? 'text-red-600 font-semibold' : ''}>
                                                            {priority.daysUntilDeadline < 0 
                                                                ? `${Math.abs(priority.daysUntilDeadline)} days overdue`
                                                                : `${priority.daysUntilDeadline} days to deadline`}
                                                        </span>
                                                    )}
                                                    <span className="text-gray-500">
                                                        {priority.stage.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/app/partnerships/${priority.id}`}
                                            className="ml-4 px-4 py-2 text-sm font-medium text-[#3b82f6] hover:text-[#2563eb] hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            View →
                                        </Link>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* At-Risk Alerts */}
                    {data.atRisk.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h2 className="text-lg font-semibold text-gray-900">At-Risk Alerts</h2>
                            </div>
                            <div className="space-y-3">
                                {data.atRisk.slice(0, 2).map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/app/partnerships/${item.id}`}
                                        className="block p-4 rounded-lg bg-pink-50 border border-pink-200 hover:shadow-md transition-shadow"
                                    >
                                        <h3 className="font-semibold text-gray-900 mb-1">{item.partnerName}</h3>
                                        <p className="text-sm text-gray-600 mb-2">{item.detail}</p>
                                        {item.daysUntilDeadline !== null && (
                                            <p className="text-xs text-gray-500 mb-1">
                                                {new Date(item.daysUntilDeadline > 0 ? Date.now() + item.daysUntilDeadline * 24 * 60 * 60 * 1000 : Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ({item.daysUntilDeadline} days left)
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-600 mt-2">
                                            Impact: {item.reason === 'stale' ? 'Partnership may go stale' : 
                                                    item.reason === 'deadline' ? 'Deadline approaching' : 
                                                    'MOU signature pending'}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Work Sessions */}
                    {data.recentRuns.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <h2 className="text-lg font-semibold text-gray-900">Recent Work Sessions</h2>
                            </div>
                            <div className="space-y-3">
                                {data.recentRuns.slice(0, 3).map((run) => {
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

                                    return (
                                        <div
                                            key={run.id}
                                            className="p-4 rounded-lg bg-gray-50 border border-gray-200"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-gray-900">{run.name}</h3>
                                                    <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 text-xs font-medium text-[#3b82f6] bg-blue-50 rounded">
                                                        3 items
                                                    </span>
                                                    {run.status === 'completed' && (
                                                        <div className="flex items-center gap-1 text-green-600">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="text-xs font-medium">Completed</span>
                                                        </div>
                                                    )}
                                                </div>
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
        </>
    );
}
