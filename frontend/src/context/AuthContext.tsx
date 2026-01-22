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

// Типізація самого контексту
interface AuthContextType {
    user: User | null;
    login: (token: string) => void;
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
            // Робимо запит за даними профілю
            const userData = await api.get('/users/me');
            setUser(userData);
        } catch (error) {
            console.error('Failed to fetch user', error);
            // Якщо токен невалідний — викидаємо юзера
            localStorage.removeItem('jwt_token');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            fetchUser();
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = (token: string) => {
        localStorage.setItem('jwt_token', token);
        fetchUser();
        router.push('/profile');
    };

    const logout = () => {
        localStorage.removeItem('jwt_token');
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