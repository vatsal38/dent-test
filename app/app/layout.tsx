'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAirtableStatus, syncAirtable, AirtableStatus } from '@/lib/api';
import { Skeleton } from '@/components/Skeleton';
import {
    HiOutlineHome,
    HiOutlineClipboardList,
    HiOutlineMail,
    HiOutlineMenuAlt3,
    HiOutlineViewGrid,
    HiOutlineUserGroup,
    HiOutlineFilter,
    HiOutlineUser,
    HiOutlineClipboardCheck,
    HiOutlineDocumentText,
    HiOutlineAcademicCap,
    HiOutlineRefresh,
    HiOutlineChartBar,
    HiOutlineMenu,
    HiOutlineX,
} from 'react-icons/hi';

function AirtableStatusBadge() {
    const [status, setStatus] = useState<AirtableStatus | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadStatus = useCallback(async () => {
        try {
            const s = await getAirtableStatus();
            setStatus(s);
            setError(null);
        } catch {
            setError('Failed to load');
        }
    }, []);

    useEffect(() => {
        loadStatus();
        const interval = setInterval(loadStatus, 60000); // refresh every 60s
        return () => clearInterval(interval);
    }, [loadStatus]);

    async function handleSync() {
        setSyncing(true);
        try {
            await syncAirtable();
            await loadStatus();
        } catch {
            setError('Sync failed');
        } finally {
            setSyncing(false);
        }
    }

    const formatRelativeTime = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'Never';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    if (!status) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-500">Airtable</span>
            </div>
        );
    }

    if (!status.connected) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-700">Airtable</span>
                <span className="text-xs text-red-600">Not Connected</span>
            </div>
        );
    }

    if (status.syncErrorMessage) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-yellow-700">Airtable</span>
                <span className="text-xs text-yellow-600">Sync Error</span>
                <button onClick={handleSync} disabled={syncing} className="ml-1 text-yellow-600 hover:text-yellow-700">
                    <HiOutlineRefresh className={`w-4 h-4 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">Airtable</span>
            <span className="text-xs text-green-600">Synced {formatRelativeTime(status.lastSyncAt)}</span>
            <button onClick={handleSync} disabled={syncing} className="ml-1 text-green-600 hover:text-green-700">
                <HiOutlineRefresh className={`w-4 h-4 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
            </button>
        </div>
    );
}

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [bobMoreOpen, setBobMoreOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <div className="hidden md:flex w-64 bg-white border-r border-gray-200 p-4 flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-9 h-9" rounded="lg" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                    <div className="space-y-2 pt-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg">
                                <Skeleton className="w-5 h-5" rounded="md" />
                                <Skeleton className="h-4 w-28" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-200 space-y-2">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <Skeleton className="w-8 h-8" rounded="full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-3 w-36" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex-1 p-6">
                    <Skeleton className="h-8 w-64 mb-4" />
                    <Skeleton className="h-4 w-[520px] max-w-full mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-lg border border-gray-200 bg-white">
                                <Skeleton className="h-4 w-48 mb-2" />
                                <Skeleton className="h-3 w-[520px] max-w-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const dentOpsNavItems = [
        { href: '/app', label: 'Home', icon: <HiOutlineHome className="w-5 h-5 shrink-0" /> },
        { href: '/app/partnerships', label: 'Partnerships', icon: <HiOutlineClipboardList className="w-5 h-5 shrink-0" /> },
        { href: '/app/inbox', label: 'Email', icon: <HiOutlineMail className="w-5 h-5 shrink-0" /> },
        { href: '/app/runs', label: 'Runs', icon: <HiOutlineMenuAlt3 className="w-5 h-5 shrink-0" /> },
    ];

    const bobNavItems = [
        { href: '/app/bob', label: 'Dashboard', icon: <HiOutlineViewGrid className="w-5 h-5 shrink-0" /> },
        { href: '/app/bob/roster', label: 'Roster', icon: <HiOutlineUserGroup className="w-5 h-5 shrink-0" /> },
        { href: '/app/bob/recruitment', label: 'Recruitment', icon: <HiOutlineFilter className="w-5 h-5 shrink-0" /> },
        { href: '/app/bob/pods', label: 'Pods', icon: <HiOutlineUserGroup className="w-5 h-5 shrink-0" /> },
        { href: '/app/bob/attendance', label: 'Attendance', icon: <HiOutlineClipboardCheck className="w-5 h-5 shrink-0" /> },
        { href: '/app/bob/milestones', label: 'Milestones', icon: <HiOutlineClipboardList className="w-5 h-5 shrink-0" /> },
    ];
    const bobNavMoreItems = [
        { href: '/app/bob/my-pod', label: 'My Pod', icon: <HiOutlineUser className="w-4 h-4 shrink-0" /> },
        { href: '/app/bob/submit', label: 'Submit', icon: <HiOutlineDocumentText className="w-4 h-4 shrink-0" /> },
        { href: '/app/bob/reports', label: 'Reports', icon: <HiOutlineChartBar className="w-4 h-4 shrink-0" /> },
        { href: '/app/bob/staff', label: 'Staff', icon: <HiOutlineAcademicCap className="w-4 h-4 shrink-0" /> },
    ];
    const isBobMoreActive = pathname?.startsWith('/app/bob/my-pod') || pathname?.startsWith('/app/bob/submit') || pathname?.startsWith('/app/bob/reports') || pathname?.startsWith('/app/bob/staff');
    const bobMoreExpanded = bobMoreOpen || isBobMoreActive;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile overlay when sidebar open */}
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                />
            )}
            {/* Sidebar: drawer on mobile, fixed on md+ */}
            <aside className={`w-64 shrink-0 flex flex-col bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 md:justify-start">
                    <Link href="/app" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                        <div className="w-8 h-8 bg-[#3b82f6] rounded flex items-center justify-center text-white font-bold text-sm">
                            DO
                        </div>
                        <span className="text-xl font-semibold text-gray-900">Dent Ops</span>
                    </Link>
                    <button type="button" onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 md:hidden" aria-label="Close menu">
                        <HiOutlineX className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Navigation - sections */}
                <div className="flex-1 overflow-y-auto">
                    {/* Dent Ops */}
                    <p className="px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Dent Ops
                    </p>
                    <nav className="p-3 pt-0 space-y-0.5">
                        {dentOpsNavItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/app' && pathname?.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                            ? 'bg-[#3b82f6] text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Baltimore Operations Engine — orange theme */}
                    <div className="px-4 pt-6 pb-1 flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">Bet on Baltimore</span>
                        <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-orange-500 text-white">2026</span>
                    </div>
                    <nav className="p-3 pt-0 space-y-0.5">
                        {bobNavItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/app/bob' && pathname?.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                            ? 'bg-orange-500 text-white'
                                            : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                                        }`}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                        <div className="pt-1">
                            <button
                                type="button"
                                onClick={() => setBobMoreOpen(!bobMoreOpen)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                            >
                                <HiOutlineViewGrid className="w-5 h-5 shrink-0" />
                                <span className="font-medium flex-1">More</span>
                                <svg className={`w-4 h-4 shrink-0 transition-transform ${bobMoreExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {bobMoreExpanded && (
                                <div className="mt-0.5 ml-3 pl-3 border-l border-orange-200 space-y-0.5">
                                    {bobNavMoreItems.map((item) => {
                                        const isActive = pathname === item.href || (item.href !== '/app/bob' && pathname?.startsWith(item.href));
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-orange-100 text-orange-800 font-medium' : 'text-gray-600 hover:bg-orange-50 hover:text-orange-700'}`}
                                            >
                                                {item.icon}
                                                <span>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </nav>
                </div>

                {/* Bottom: Sync Status (BOB) or Airtable (Dent Ops) + User */}
                <div className="p-3 border-t border-gray-200 space-y-3">
                    <div className="w-full min-w-0">
                        {pathname?.startsWith('/app/bob') ? (
                            <div className="flex items-center gap-2 px-3 py-1.5">
                                <HiOutlineRefresh className="w-4 h-4 shrink-0 text-gray-400" />
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-500">Sync Status</p>
                                    <p className="text-xs text-gray-600 truncate">Last synced 2m ago</p>
                                </div>
                            </div>
                        ) : (
                            <AirtableStatusBadge />
                        )}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <button
                            onClick={logout}
                            className="text-sm text-gray-600 hover:text-gray-900 text-left"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile header */}
            <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30 md:hidden">
                <button type="button" onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100" aria-label="Open menu">
                    <HiOutlineMenu className="w-6 h-6 text-gray-700" />
                </button>
                <Link href="/app" className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#3b82f6] rounded flex items-center justify-center text-white font-bold text-xs">DO</div>
                    <span className="font-semibold text-gray-900">Dent Ops</span>
                </Link>
                <div className="w-10 flex justify-end">
                    <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-white font-semibold text-sm">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 min-w-0 pt-14 md:pt-0 md:ml-64">
                <div className="min-h-screen md:min-h-0 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 bg-white">
                    {children}
                </div>
            </main>
        </div>
    );
}

