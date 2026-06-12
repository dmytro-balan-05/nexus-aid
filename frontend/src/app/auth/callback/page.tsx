'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackContent() {
    const params = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const token = params.get('token');
        if (!token) { router.push('/login'); return; }

        fetch('/api/auth/set-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ token }),
        })
            .then(() => router.push('/profile'))
            .catch(() => router.push('/login'));
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Авторизація...</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return <Suspense><CallbackContent /></Suspense>;
}