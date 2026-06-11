'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-aid-production.up.railway.app';

function ResultContent() {
    const params = useSearchParams();
    const [verified, setVerified] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<string>('');

    useEffect(() => {
        const orderReference = params.get('orderReference');
        if (!orderReference) {
            setLoading(false);
            setVerified(false);
            return;
        }

        const payload: Record<string, string> = {};
        params.forEach((value, key) => { payload[key] = value; });

        fetch(`${API_URL}/donations/verify-return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        })
            .then((res) => res.json())
            .then((data) => {
                setVerified(data.success === true || data.alreadyProcessed === true);
                setStatus(data.status || '');
            })
            .catch(() => {
                setVerified(params.get('transactionStatus') === 'Approved');
            })
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

    const isInProcessing = status === 'InProcessing' || params.get('transactionStatus') === 'InProcessing';

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
            <div className="rounded-2xl p-10 max-w-md w-full text-center shadow-lg"
                 style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-6xl mb-6">
                    {verified ? '🎉' : isInProcessing ? '⏳' : '😔'}
                </div>
                <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {verified ? 'Дякуємо!' : isInProcessing ? 'Обробляється...' : 'Оплата не вдалась'}
                </h1>
                <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                    {verified
                        ? 'Ваш донат успішно проведено. Разом до перемоги!'
                        : isInProcessing
                            ? 'Платіж обробляється банком. Донат зарахується автоматично після підтвердження.'
                            : 'Щось пішло не так. Спробуйте ще раз.'}
                </p>
                <Link href="/campaigns" className="inline-block px-8 py-3 rounded-xl font-bold transition"
                      style={{ background: 'var(--accent)', color: '#ffffff' }}>
                    До зборів
                </Link>
            </div>
        </div>
    );
}

export default function DonationResultPage() {
    return (
        <Suspense><ResultContent /></Suspense>
    );
}