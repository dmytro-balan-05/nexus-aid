'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (user) {
                router.push('/profile');
            } else {
                router.push('/login');
            }
        }
    }, [user, isLoading, router]);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Loading Nexus Aid...</p>
        </div>
    );
}