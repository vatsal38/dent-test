'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { bootstrap, BootstrapResponse } from '@/lib/api';

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
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Bootstrap user after Firebase auth
    const bootstrapUser = useCallback(async (fbUser: FirebaseUser) => {
        try {
            const response: BootstrapResponse = await bootstrap();

            // User is registered (either admin or has invite)
            const currentOrg = response.orgs.length > 0 ? response.orgs[0] : null;

            setAppUser({
                id: response.user.id,
                firebaseUid: fbUser.uid,
                email: response.user.email,
                name: response.user.name || fbUser.displayName || '',
                photoURL: fbUser.photoURL,
                isAdmin: response.isAdmin,
                orgId: response.defaultOrgId || currentOrg?.id || '',
                memberships: response.orgs.map(o => ({
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
        } catch (error) {
            console.error('Bootstrap error:', error);
            // User might not be registered yet - that's okay
            setAppUser(null);
            setOrganization(null);
        }
    }, []);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setFirebaseUser(user);
            if (user) {
                await bootstrapUser(user);
            } else {
                setAppUser(null);
                setOrganization(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [bootstrapUser]);

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

    const logout = useCallback(async () => {
        try {
            await firebaseSignOut(auth);
            setAppUser(null);
            setOrganization(null);
        } catch (error) {
            console.error('Sign-out error:', error);
            throw error;
        }
    }, []);

    const getIdToken = useCallback(async () => {
        if (!firebaseUser) return null;
        return firebaseUser.getIdToken();
    }, [firebaseUser]);

    const value: AuthContextType = {
        user: appUser,
        firebaseUser,
        organization,
        isAuthenticated: !!firebaseUser,
        isLoading,
        signInWithGoogle,
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
