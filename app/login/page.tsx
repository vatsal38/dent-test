'use client';

import { useAuth } from '@/context/AuthContext';
import { isDemoModeEnabledClient } from '@/lib/demoAuth';
import { isDentOpsPath } from '@/platform/rbac/dentOpsRoutes';
import type { DemoLoginRole } from '@/platform/api/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Skeleton } from '@/components/Skeleton';

const DEMO_ROLES: { role: DemoLoginRole; label: string }[] = [
  { role: 'admin', label: 'Admin' },
  { role: 'site_supporter', label: 'Site Supporter' },
  { role: 'coach', label: 'Coach' },
  { role: 'student', label: 'Student' },
];

function firebaseAuthErrorMessage(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: string }).code)
      : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    default:
      return error instanceof Error ? error.message : 'Sign in failed.';
  }
}

function LoginForm() {
  const {
    signInWithGoogle,
    signInWithEmail,
    signInWithDemo,
    isAuthenticated,
    isLoading,
    user,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [signingIn, setSigningIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const demoModeEnabled = isDemoModeEnabledClient();

  const fromParam = searchParams.get('from');
  const defaultHome = user?.isAdmin ? '/app' : '/app/bob';

  function resolvePostLoginPath() {
    const target = fromParam?.startsWith('/') ? fromParam : defaultHome;
    if (!user?.isAdmin && isDentOpsPath(target)) {
      return '/app/bob';
    }
    return target;
  }

  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      router.push(resolvePostLoginPath());
      setSigningIn(false);
    }
  }, [isAuthenticated, isLoading, user, router, fromParam]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign in error:', err);
      setError(firebaseAuthErrorMessage(err));
      setSigningIn(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(firebaseAuthErrorMessage(err));
      setSigningIn(false);
    }
  };

  const handleDemoSignIn = async (role: DemoLoginRole) => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithDemo(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo sign in failed.');
      setSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Skeleton className="w-12 h-12" rounded="md" />
                <Skeleton className="h-8 w-36" />
              </div>
              <Skeleton className="h-4 w-56 mx-auto" />
            </div>
            <Skeleton className="h-10 w-full mb-3" rounded="lg" />
            <Skeleton className="h-10 w-full" rounded="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 bg-[#3b82f6] rounded flex items-center justify-center text-white font-bold text-lg">
                DO
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Dent Ops</h1>
            </div>
            <p className="text-gray-600">Sign in to continue</p>
          </div>

          {error && (
            <div
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignIn} className="space-y-3 mb-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={signingIn}
              className="w-full px-4 py-3 rounded-lg bg-[#3b82f6] text-white font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
            >
              {signingIn ? 'Signing in…' : 'Sign in with email'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white text-gray-900 border-2 border-gray-300 hover:border-gray-400 transition-colors disabled:opacity-50 font-medium shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {demoModeEnabled ? (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Demo accounts (for review)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ROLES.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    disabled={signingIn}
                    onClick={() => handleDemoSignIn(item.role)}
                    className="px-3 py-2.5 rounded-lg border border-orange-200 bg-orange-50 text-sm font-medium text-orange-900 hover:bg-orange-100 disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Demo accounts are for review only — data is read-only.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Skeleton className="h-8 w-32" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
