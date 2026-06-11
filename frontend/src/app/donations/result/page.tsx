'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-aid-production.up.railway.app';

function ResultContent() {
    const params = useSearchParams();
    const [verified, setVerified] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    const transactionStatus = params.get('transactionStatus');
    const isApprovedByWfp = transactionStatus === 'Approved';

    useEffect(() => {
        if (!isApprovedByWfp) {
            setLoading(false);
            setVerified(false);
            return;
        }

        const payload: Record<string, string> = {};
        params.forEach((value, key) => {
            payload[key] = value;
        });

        fetch(`${API_URL}/donations/verify-return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        })
            .then((res) => res.json())
            .then((data) => {
                setVerified(data.success === true || data.alreadyProcessed === true);
            })
            .catch(() => {
                // якщо бекенд недоступний — довіряємо WayForPay
                setVerified(true);
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

    const isSuccess = verified;

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
            <div
                className="rounded-2xl p-10 max-w-md w-full text-center shadow-lg"
                style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                }}
            >
                <div className="text-6xl mb-6">
                    {isSuccess ? '🎉' : '😔'}
                </div>
                <h1
                    className="text-3xl font-extrabold mb-3"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {isSuccess ? 'Дякуємо!' : 'Оплата не вдалась'}
                </h1>
                <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                    {isSuccess
                        ? 'Ваш донат успішно проведено. Разом до перемоги!'
                        : 'Щось пішло не так. Спробуйте ще раз.'}
                </p>
                <Link
                    href="/campaigns"
                    className="inline-block px-8 py-3 rounded-xl font-bold transition"
                    style={{
                        background: 'var(--accent)',
                        color: '#ffffff',
                    }}
                >
                    До зборів
                </Link>
            </div>
        </div>
    );
}

export default function DonationResultPage() {
    return (
        <Suspense>
            <ResultContent />
        </Suspense>
    );
}