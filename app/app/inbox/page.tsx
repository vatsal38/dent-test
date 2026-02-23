'use client';

import { useEffect, useState, useCallback } from 'react';
import { getGmailThreads, GmailThread, GmailThreadsResponse, linkThread, markThreadReviewed, connectGmail, disconnectGmail, getGmailStatus, syncGmail, getPartnerships, PartnershipsListResponse, unlinkThread } from '@/lib/api';
import Link from 'next/link';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function InboxPage() {
    const [data, setData] = useState<GmailThreadsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedThread, setSelectedThread] = useState<string | null>(null);
    const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; emailAddress?: string | null } | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [partnershipContactsOnly, setPartnershipContactsOnly] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [threadsResponse, statusResponse] = await Promise.all([
                getGmailThreads({
                    category: selectedCategory === 'all' ? undefined : selectedCategory,
                    partnershipContactsOnly: partnershipContactsOnly ? 'true' : undefined,
                }).catch(() => ({ connected: false, threads: [], counts: {} })),
                getGmailStatus().catch(() => ({ connected: false })),
            ]);
            setData(threadsResponse);
            setGmailStatus(statusResponse);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load inbox');
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, partnershipContactsOnly]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleLinkThread(threadId: string, partnershipId: string) {
        try {
            await linkThread(threadId, partnershipId);
            loadData();
        } catch (err) {
            console.error('Failed to link thread:', err);
        }
    }

    async function handleUnlinkThread(threadId: string) {
        try {
            await unlinkThread(threadId);
            loadData();
        } catch (err) {
            console.error('Failed to unlink thread:', err);
        }
    }


    async function handleMarkReviewed(threadId: string) {
        try {
            await markThreadReviewed(threadId);
            loadData();
        } catch (err) {
            console.error('Failed to mark reviewed:', err);
        }
    }

    async function handleConnectGmail() {
        setConnecting(true);
        try {
            const response = await connectGmail();
            // Redirect to Google OAuth
            window.location.href = response.authUrl;
        } catch (err) {
            console.error('Failed to connect Gmail:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect Gmail');
            setConnecting(false);
        }
    }

    async function handleDisconnectGmail() {
        if (!confirm('Are you sure you want to disconnect Gmail? This will remove all synced emails.')) return;
        setDisconnecting(true);
        try {
            await disconnectGmail();
            await loadData(); // Reload inbox to clear out threads
        } catch (err) {
            console.error('Failed to disconnect Gmail:', err);
            setError(err instanceof Error ? err.message : 'Failed to disconnect Gmail');
        } finally {
            setDisconnecting(false);
        }
    }

    async function handleSyncGmail() {
        if (!gmailStatus?.connected) return;

        setSyncing(true);
        setError(null);
        try {
            const result = await syncGmail();
            setLastSyncTime(new Date());
            // Reload data after sync
            await loadData();
            // Show success message briefly
            setTimeout(() => {
                // Could add a toast notification here
            }, 100);
        } catch (err) {
            console.error('Failed to sync Gmail:', err);
            setError(err instanceof Error ? err.message : 'Failed to sync emails');
        } finally {
            setSyncing(false);
        }
    }

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

    const threads = data.threads || [];
    const counts = data.counts || { total: 0, unlinked_intros: 0, needs_response: 0, hot_leads: 0, mou_related: 0 };

    const categories = [
        { id: 'all', label: 'All Emails', count: counts.total || 0, icon: '📧', color: 'bg-blue-50 border-blue-200' },
        { id: 'unlinked_intro', label: 'New Intros', count: counts.unlinked_intros || 0, icon: '👤', color: 'bg-gray-50 border-gray-200' },
        { id: 'needs_response', label: 'Needs Response', count: counts.needs_response || 0, icon: '⚠️', color: 'bg-yellow-50 border-yellow-200' },
        { id: 'hot_lead', label: 'Hot Leads', count: counts.hot_leads || 0, icon: '⚡', color: 'bg-orange-50 border-orange-200' },
        { id: 'mou_related', label: 'MOU & Invoices', count: counts.mou_related || 0, icon: '📄', color: 'bg-green-50 border-green-200' },
    ];

    const selectedThreadData = threads.find(t => t.id === selectedThread) || null;

    // Helper function to format relative time
    const formatRelativeTime = (date: string) => {
        const now = new Date();
        const emailDate = new Date(date);
        const diffMs = now.getTime() - emailDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return emailDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Get initials for avatar
    const getInitials = (name: string | null, email: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return email[0].toUpperCase();
    };

    return (
        <div className="flex h-[calc(100vh-80px)] bg-gray-50">
            {/* Left Side - Email List */}
            <div className={`flex flex-col transition-all bg-white border-r border-gray-200 ${selectedThread ? 'w-2/5' : 'w-full'}`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
                            {gmailStatus?.connected && gmailStatus.emailAddress && (
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-sm text-gray-500">{gmailStatus.emailAddress}</p>
                                    {lastSyncTime && (
                                        <span className="text-xs text-gray-400">
                                            Last synced: {formatRelativeTime(lastSyncTime.toISOString())}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {gmailStatus?.connected && (
                                <button
                                    onClick={handleSyncGmail}
                                    disabled={syncing}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${syncing
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    title="Sync latest emails"
                                >
                                    {syncing ? (
                                        <>
                                            <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                                            <span>Syncing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span>Sync</span>
                                        </>
                                    )}
                                </button>
                            )}
                            {gmailStatus?.connected && (
                                <button
                                    onClick={handleDisconnectGmail}
                                    disabled={disconnecting}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${disconnecting
                                            ? 'bg-red-50 text-red-300 cursor-not-allowed border border-red-200'
                                            : 'bg-white border border-red-300 text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                                </button>
                            )}
                            {!gmailStatus?.connected && (
                                <button
                                    onClick={handleConnectGmail}
                                    disabled={connecting}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${connecting
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#3b82f6] text-white hover:bg-[#2563eb]'
                                        }`}
                                >
                                    {connecting ? 'Connecting...' : 'Connect Gmail'}
                                </button>
                            )}
                            {gmailStatus?.connected && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-xs font-medium text-green-700">Connected</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center justify-between mb-2">
                        {/* Category Tabs */}
                        <div className="flex items-center gap-1 border-b border-gray-200">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${selectedCategory === cat.id
                                            ? 'border-[#3b82f6] text-[#3b82f6]'
                                            : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {cat.label}
                                    {cat.count > 0 && (
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${selectedCategory === cat.id
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {cat.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Partnership Contacts Filter */}
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={partnershipContactsOnly}
                                    onChange={(e) => setPartnershipContactsOnly(e.target.checked)}
                                    className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6]"
                                />
                                <span className="text-sm text-gray-700">Partnership contacts only</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Email List */}
                <div className="flex-1 overflow-y-auto">
                    {threads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-12">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-500 text-center">
                                {data.connected ? 'No emails in this category' : 'Connect Gmail to see your emails'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {threads.map((thread) => {
                                const isSelected = selectedThread === thread.id;
                                const displayName = thread.fromName || thread.fromEmail.split('@')[0];

                                return (
                                    <div
                                        key={thread.id}
                                        onClick={() => setSelectedThread(thread.id)}
                                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''
                                            } ${!thread.isRead ? 'bg-white' : ''}`}
                                    >
                                        {/* Checkbox */}
                                        <div className="pt-1">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-[#3b82f6] border-gray-300 rounded focus:ring-[#3b82f6]"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>

                                        {/* Star/Important */}
                                        <button
                                            className="pt-1 text-gray-400 hover:text-yellow-500 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                        </button>

                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                                {getInitials(thread.fromName, thread.fromEmail)}
                                            </div>
                                        </div>

                                        {/* Email Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <span className={`text-sm truncate ${!thread.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                        {displayName}
                                                    </span>
                                                    {thread.partnerName && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full shrink-0">
                                                            {thread.partnerName}
                                                        </span>
                                                    )}
                                                    {thread.category === 'needs_response' && (
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full shrink-0">
                                                            Needs Response
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 ml-2">
                                                    {thread.hasAttachment && (
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                        </svg>
                                                    )}
                                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                                        {formatRelativeTime(thread.receivedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className={`text-sm mb-1 line-clamp-1 ${!thread.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                {thread.subject}
                                            </p>
                                            {thread.snippet && (
                                                <p className="text-sm text-gray-500 line-clamp-1">
                                                    {thread.snippet}
                                                </p>
                                            )}
                                        </div>

                                        {/* Unread Indicator */}
                                        {!thread.isRead && (
                                            <div className="w-2 h-2 bg-[#3b82f6] rounded-full shrink-0 mt-2"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side - Email Detail Panel */}
            {selectedThread && selectedThreadData && (
                <EmailDetailPanel
                    thread={selectedThreadData}
                    onClose={() => setSelectedThread(null)}
                    onLink={handleLinkThread}
                    onUnlink={handleUnlinkThread}
                    onMarkReviewed={handleMarkReviewed}
                />
            )}
        </div>
    );
}

function EmailDetailPanel({
    thread,
    onClose,
    onLink,
    onUnlink,
    onMarkReviewed,
}: {
    thread: GmailThread;
    onClose: () => void;
    onLink: (threadId: string, partnershipId: string) => void;
    onUnlink: (threadId: string) => void;
    onMarkReviewed: (threadId: string) => void;
}) {
    const [linkPartnershipId, setLinkPartnershipId] = useState('');
    const [partnerships, setPartnerships] = useState<PartnershipsListResponse | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPartnershipDropdown, setShowPartnershipDropdown] = useState(false);
    const [loadingPartnerships, setLoadingPartnerships] = useState(false);
    const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

    const displayName = thread.fromName || thread.fromEmail.split('@')[0];
    const getInitials = (name: string | null, email: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return email[0].toUpperCase();
    };

    // Load partnerships when dropdown opens
    useEffect(() => {
        if (showPartnershipDropdown && !partnerships && !loadingPartnerships) {
            setLoadingPartnerships(true);
            getPartnerships({ limit: 50, view: 'list' })
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
    }, [showPartnershipDropdown, partnerships, loadingPartnerships]);

    // Filter partnerships by search query
    const filteredPartnerships = partnerships?.partnerships?.filter(p =>
        p.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleLinkPartnership = (partnershipId: string) => {
        onLink(thread.id, partnershipId);
        setShowPartnershipDropdown(false);
        setSearchQuery('');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showPartnershipDropdown && !target.closest('.partnership-dropdown-container')) {
                setShowPartnershipDropdown(false);
            }
        };
        if (showPartnershipDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showPartnershipDropdown]);

    return (
        <div className="w-3/5 bg-white flex flex-col h-full overflow-y-auto border-l border-gray-200">
            {/* Email Header */}
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold text-gray-900 mb-3">{thread.subject}</h1>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                {getInitials(thread.fromName, thread.fromEmail)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">{displayName}</span>
                                    <span className="text-sm text-gray-500">&lt;{thread.fromEmail}&gt;</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {new Date(thread.receivedAt).toLocaleString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            onClick={() => onMarkReviewed(thread.id)}
                            title="Mark as reviewed"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Category Badge */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${thread.category === 'needs_response' ? 'bg-red-100 text-red-700' :
                            thread.category === 'hot_lead' ? 'bg-orange-100 text-orange-700' :
                                thread.category === 'mou_related' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                        }`}>
                        {thread.category === 'unlinked_intro' ? 'New Introduction' :
                            thread.category === 'needs_response' ? 'Needs Response' :
                                thread.category === 'hot_lead' ? 'Hot Lead' :
                                    thread.category === 'mou_related' ? 'MOU Related' :
                                        'Uncategorized'}
                    </span>
                    {thread.hasAttachment && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            Attachment
                        </span>
                    )}
                </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 px-6 py-6">
                <div className="prose prose-sm max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {thread.snippet || 'No email content available'}
                    </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                {thread.partnershipId ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <span className="text-sm font-medium text-blue-700">Linked to Partnership</span>
                                    {thread.partnerName && (
                                        <span className="text-sm text-gray-600">• {thread.partnerName}</span>
                                    )}
                                </div>
                                <Link
                                    href={`/app/partnerships/${thread.partnershipId}`}
                                    className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium"
                                >
                                    View Partnership →
                                </Link>
                            </div>
                            <button
                                onClick={() => onMarkReviewed(thread.id)}
                                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                Mark as Reviewed
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowUnlinkConfirm(true)}
                                className="px-4 py-2 rounded-lg bg-white border border-red-300 text-red-700 hover:bg-red-50 transition-colors text-sm font-medium"
                            >
                                Unlink Partnership
                            </button>
                            <button
                                onClick={() => {
                                    setShowPartnershipDropdown(true);
                                    setSearchQuery('');
                                }}
                                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                Change Partnership
                            </button>
                        </div>
                        <ConfirmModal
                            isOpen={showUnlinkConfirm}
                            title="Unlink Email from Partnership"
                            message="Are you sure you want to unlink this email from the partnership? This action can be undone by linking it again."
                            confirmText="Unlink"
                            cancelText="Cancel"
                            confirmButtonStyle="danger"
                            onConfirm={() => {
                                onUnlink(thread.id);
                                setShowUnlinkConfirm(false);
                            }}
                            onCancel={() => setShowUnlinkConfirm(false)}
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative partnership-dropdown-container">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            if (!showPartnershipDropdown) setShowPartnershipDropdown(true);
                                        }}
                                        onFocus={() => setShowPartnershipDropdown(true)}
                                        placeholder="Search partnerships to link..."
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                                    />
                                    <button
                                        onClick={() => setShowPartnershipDropdown(!showPartnershipDropdown)}
                                        className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium whitespace-nowrap"
                                    >
                                        Link Email
                                    </button>
                                </div>

                                {/* Partnership Dropdown */}
                                {showPartnershipDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                        {loadingPartnerships ? (
                                            <div className="p-4 text-center">
                                                <div className="animate-spin w-5 h-5 border-2 border-[#3b82f6] border-t-transparent rounded-full mx-auto"></div>
                                                <p className="text-xs text-gray-500 mt-2">Loading partnerships...</p>
                                            </div>
                                        ) : filteredPartnerships.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-gray-500">
                                                {searchQuery ? 'No partnerships found' : 'Start typing to search partnerships'}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="p-2 border-b border-gray-200 bg-gray-50">
                                                    <p className="text-xs font-medium text-gray-700">
                                                        Select a partnership to link this email
                                                    </p>
                                                </div>
                                                {filteredPartnerships.slice(0, 10).map((partnership) => (
                                                    <button
                                                        key={partnership.id}
                                                        onClick={() => handleLinkPartnership(partnership.id)}
                                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between">
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
                                                                    {partnership.contactEmail && (
                                                                        <span className="text-xs text-gray-500">
                                                                            {partnership.contactEmail}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                                                                    {partnership.stageLabel}
                                                                </span>
                                                                {partnership.estimatedRevenue && (
                                                                    <span className="text-xs text-gray-600 font-medium">
                                                                        ${partnership.estimatedRevenue.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                                {filteredPartnerships.length > 10 && (
                                                    <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 text-center">
                                                        Showing first 10 of {filteredPartnerships.length} partnerships
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => onMarkReviewed(thread.id)}
                                className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                Mark as Reviewed
                            </button>
                        </div>
                        {thread.contactedBy && (
                            <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                <span className="font-medium">⚠️ Previously contacted:</span> {thread.contactedBy.userName || 'team member'} on{' '}
                                {new Date(thread.contactedBy.contactedAt).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
