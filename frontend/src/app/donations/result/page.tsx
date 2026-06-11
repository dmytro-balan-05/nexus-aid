'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ResultContent() {
    const params = useSearchParams();
    const success = params.get('success') === 'true';
    const status = params.get('status') || '';
    const isInProcessing = status === 'InProcessing';

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
             style={{ background: 'var(--bg-primary)' }}>
            <div className="rounded-2xl p-10 max-w-md w-full text-center shadow-lg"
                 style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-6xl mb-6">
                    {success ? '🎉' : isInProcessing ? '⏳' : '😔'}
                </div>
                <h1 className="text-3xl font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {success ? 'Дякуємо!' : isInProcessing ? 'Обробляється...' : 'Оплата не вдалась'}
                </h1>
                <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                    {success
                        ? 'Ваш донат успішно проведено. Разом до перемоги!'
                        : isInProcessing
                            ? 'Платіж обробляється банком. Донат зарахується автоматично.'
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
    return (
        <Suspense><ResultContent /></Suspense>
    );
}