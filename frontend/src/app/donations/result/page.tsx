'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

function ResultContent() {
    const [verified, setVerified] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const orderReference = localStorage.getItem('pending_donation_order');

        if (!orderReference) {
            setLoading(false);
            setVerified(false);
            return;
        }

        localStorage.removeItem('pending_donation_order');

        fetch('/api/donations/verify-return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ orderReference }),
        })
            .then(r => r.json())
            .then(data => setVerified(data.success === true || data.alreadyProcessed === true))
            .catch(() => setVerified(false))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <p style={{ color: 'var(--text-secondary)' }}>Верифікуємо платіж...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
            <div className="rounded-2xl p-10 max-w-md w-full text-center shadow-lg"
                 style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-6xl mb-6">{verified ? '🎉' : '😔'}</div>
                <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {verified ? 'Дякуємо!' : 'Оплата не вдалась'}
                </h1>
                <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                    {verified
                        ? 'Ваш донат успішно проведено. Разом до перемоги!'
                        : 'Щось пішло не так. Спробуйте ще раз.'}
                </p>
                <Link href="/campaigns"
                      className="inline-block px-8 py-3 rounded-xl font-bold transition"
                      style={{ background: 'var(--accent)', color: '#ffffff' }}>
                    До зборів
                </Link>
            </div>
        </div>
    );
}

export default function DonationResultPage() {
    return <Suspense><ResultContent /></Suspense>;
}