'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ResultContent() {
    const params = useSearchParams();
    const status = params.get('transactionStatus');

    const isSuccess = status === 'Approved';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-lg border border-gray-200">
                <div className="text-6xl mb-6">
                    {isSuccess ? '🎉' : '😔'}
                </div>
                <h1 className="text-3xl font-extrabold mb-3">
                    {isSuccess ? 'Дякуємо!' : 'Оплата не вдалась'}
                </h1>
                <p className="text-gray-500 mb-8">
                    {isSuccess
                        ? 'Ваш донат успішно проведено. Разом до перемоги!'
                        : 'Щось пішло не так. Спробуйте ще раз.'}
                </p>
                <Link
                    href="/campaigns"
                    className="inline-block bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition"
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