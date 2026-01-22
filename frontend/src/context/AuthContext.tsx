'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// ПОВЕРТАЄМО ТВІЙ ОРИГІНАЛЬНИЙ ІНТЕРФЕЙС
export interface User{
    id: string;
    email: string;
    name: string | null;
    role: 'user' | 'volonteer' | 'admin';
    avatar: string | null;
    provider: string; // Поле повернуто
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => Promise<void>;
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
            // Вказуємо тип User безпосередньо в generic запиту
            const data = await api.get<User>('/auth/me');

            if (data) {
                // Використовуємо unknown як проміжний етап для безпечного касту
                setUser(data as unknown as User);
            }
        } catch (err) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        router.push('/profile');
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_role');
            router.push('/login');
        }
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