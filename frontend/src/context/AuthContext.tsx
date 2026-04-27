'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
    id: string;
    email: string;
    name: string | null;
    role: 'user' | 'volonteer' | 'admin';
    avatar: string | null;
    provider: string;
}

interface AuthContextType {
    user: User | null;
    login: () => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchUser = async () => {
        try {
            const userData = await api.get<User>('/users/me');

            if (!userData) {
                setUser(null);
                return;
            }

            setUser(userData);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async () => {
        await fetchUser();
        router.push('/profile');
    };

    const logout = async () => {
        await api.post('/auth/logout', {});
        setUser(null);
        router.push('/login');
    };

    const refreshProfile = async () => {
        await fetchUser();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};