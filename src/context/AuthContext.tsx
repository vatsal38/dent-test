'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser,
} from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { auth, googleProvider } from '@/lib/firebase';
import { bootstrap, BootstrapResponse } from '@/lib/api';
import {
    getStoredDemoToken,
    setStoredDemoToken,
} from '@/lib/demoAuth';
import {
    postDemoLogin,
    type DemoLoginRole,
} from '@/platform/api/auth';
import {
    clearBobSessionCache,
    invalidateBobSession,
} from '@/platform/query/sessionCache';

interface Organization {
    id: string;
    name: string;
    slug?: string;
    vertical: 'education' | 'construction';
    role: string;
}

interface AppUser {
    id: string;
    firebaseUid: string;
    email: string;
    name: string;
    photoURL?: string | null;
    isAdmin: boolean;
    orgId: string;
    memberships: Array<{
        orgId: string;
        orgName: string;
        orgSlug?: string;
        vertical: 'education' | 'construction';
        role: string;
    }>;
}

interface AuthContextType {
    user: AppUser | null;
    firebaseUser: FirebaseUser | null;
    organization: Organization | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isDemoSession: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signInWithDemo: (role: DemoLoginRole) => Promise<void>;
    logout: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const lastBootstrapUid = useRef<string | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [demoToken, setDemoToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const applyBootstrapResponse = useCallback(
        (response: BootstrapResponse, sessionKey: string, photoURL?: string | null) => {
            if (lastBootstrapUid.current !== sessionKey) {
                invalidateBobSession(queryClient);
                lastBootstrapUid.current = sessionKey;
            }
            const currentOrg = response.orgs.length > 0 ? response.orgs[0] : null;
            setAppUser({
                id: response.user.id,
                firebaseUid: sessionKey,
                email: response.user.email,
                name: response.user.name || '',
                photoURL: photoURL ?? null,
                isAdmin: response.isAdmin,
                orgId: response.defaultOrgId || currentOrg?.id || '',
                memberships: response.orgs.map((o) => ({
                    orgId: o.id,
                    orgName: o.name,
                    orgSlug: o.slug || undefined,
                    vertical: o.vertical || 'education',
                    role: o.role,
                })),
            });
            if (currentOrg) {
                setOrganization({
                    id: currentOrg.id,
                    name: currentOrg.name,
                    slug: currentOrg.slug || undefined,
                    vertical: currentOrg.vertical || 'education',
                    role: currentOrg.role,
                });
            }
        },
        [queryClient],
    );

    // Bootstrap user after Firebase auth
    const bootstrapUser = useCallback(async (fbUser: FirebaseUser) => {
        try {
            const response: BootstrapResponse = await bootstrap();
            applyBootstrapResponse(response, fbUser.uid, fbUser.photoURL);

        } catch (error) {
            console.error('Bootstrap error:', error);
            setAppUser(null);
            setOrganization(null);
        }
    }, [applyBootstrapResponse]);

    const bootstrapDemoSession = useCallback(async (token: string) => {
        try {
            const response: BootstrapResponse = await bootstrap();
            applyBootstrapResponse(response, `demo:${token.slice(-24)}`);
        } catch (error) {
            console.error('Demo bootstrap error:', error);
            setAppUser(null);
            setOrganization(null);
            setDemoToken(null);
            setStoredDemoToken(null);
        }
    }, [applyBootstrapResponse]);

    useEffect(() => {
        const stored = getStoredDemoToken();
        if (stored) {
            setDemoToken(stored);
            bootstrapDemoSession(stored).finally(() => setIsLoading(false));
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            if (user) {
                await bootstrapUser(user);
            } else if (!getStoredDemoToken()) {
                setAppUser(null);
                setOrganization(null);
                lastBootstrapUid.current = null;
                clearBobSessionCache(queryClient);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [bootstrapUser, bootstrapDemoSession, queryClient]);

    const signInWithGoogle = useCallback(async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            if (result.user) {
                await bootstrapUser(result.user);
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    }, [bootstrapUser]);

    const signInWithEmail = useCallback(
        async (email: string, password: string) => {
            try {
                const result = await signInWithEmailAndPassword(
                    auth,
                    email.trim(),
                    password,
                );
                if (result.user) {
                    await bootstrapUser(result.user);
                }
            } catch (error) {
                throw error;
            }
        },
        [bootstrapUser],
    );

    const signInWithDemo = useCallback(
        async (role: DemoLoginRole) => {
            const result = await postDemoLogin(role);
            setStoredDemoToken(result.token);
            setDemoToken(result.token);
            setFirebaseUser(null);
            await bootstrapDemoSession(result.token);
        },
        [bootstrapDemoSession],
    );

    const logout = useCallback(async () => {
        try {
            clearBobSessionCache(queryClient);
            setAppUser(null);
            setOrganization(null);
            setDemoToken(null);
            setStoredDemoToken(null);
            lastBootstrapUid.current = null;
            if (firebaseUser) {
                await firebaseSignOut(auth);
            }
        } catch (error) {
            console.error('Sign-out error:', error);
            throw error;
        }
    }, [queryClient, firebaseUser]);

    const getIdToken = useCallback(async () => {
        if (demoToken) return demoToken;
        if (!firebaseUser) return null;
        return firebaseUser.getIdToken();
    }, [demoToken, firebaseUser]);

    const value: AuthContextType = {
        user: appUser,
        firebaseUser,
        organization,
        isAuthenticated: !!(demoToken || firebaseUser) && !!appUser,
        isLoading,
        isDemoSession: Boolean(demoToken),
        signInWithGoogle,
        signInWithEmail,
        signInWithDemo,
        logout,
        getIdToken,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
