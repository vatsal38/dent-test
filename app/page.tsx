'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                router.push('/app');
            } else {
                router.push('/login');
            }
        }
    }, [isAuthenticated, isLoading, router]);

  return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
            <div className="animate-spin w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full" />
    </div>
  );
}
