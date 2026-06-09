'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Props {
    campaignId: string;
    campaignTitle: string;
}

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

export default function DonateButton({ campaignId, campaignTitle }: Props) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [amount, setAmount] = useState<number | ''>('');
    const [donorName, setDonorName] = useState('');
    const [donorEmail, setDonorEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!amount || Number(amount) < 10) {
            setError('Мінімальна сума — 10 ₴');
            return;
        }

        if (!user && (!donorName || !donorEmail)) {
            setError('Вкажіть імʼя та email');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const endpoint = user
                ? '/api/donations/initiate'
                : '/api/donations/initiate/anonymous';

            const body: any = { campaignId, amount: Number(amount) };

            if (!user) {
                body.donorName = donorName;
                body.donorEmail = donorEmail;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Помилка при ініціалізації платежу');
            }

            const data = await res.json();

            // Формуємо і сабмітимо форму на WayForPay
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'https://secure.wayforpay.com/pay';

            const fields: Record<string, string> = {
                merchantAccount: data.merchantAccount,
                merchantDomainName: data.merchantDomain,
                merchantTransactionSecureType: 'AUTO',
                merchantSignature: data.merchantSignature,
                orderReference: data.orderReference,
                orderDate: String(data.orderDate),
                amount: String(data.amount),
                currency: data.currency,
                'productName[]': data.productName,
                'productCount[]': '1',
                'productPrice[]': String(data.amount),
                returnUrl: data.returnUrl,
                serviceUrl: data.serviceUrl,
                language: 'UA',
            };

            Object.entries(fields).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();

        } catch (err: any) {
            setError(err.message || 'Помилка');
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform active:scale-95"
            >
                Підтримати збір
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Підтримати збір</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-black text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <p className="text-gray-500 text-sm mb-6 truncate">{campaignTitle}</p>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {PRESET_AMOUNTS.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setAmount(preset)}
                                    className={`py-2 rounded-lg border font-bold text-sm transition ${
                                        amount === preset
                                            ? 'bg-black text-white border-black'
                                            : 'border-gray-200 hover:border-black'
                                    }`}
                                >
                                    {preset} ₴
                                </button>
                            ))}
                        </div>

                        <div className="relative mb-4">
                            <input
                                type="number"
                                min={10}
                                placeholder="Або введіть свою суму"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                                className="w-full border border-gray-300 rounded-lg p-3 pr-8 focus:ring-2 focus:ring-black outline-none"
                            />
                            <span className="absolute right-3 top-3 text-gray-400 font-bold">₴</span>
                        </div>

                        {!user && (
                            <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 font-bold uppercase">Дані для анонімного донату</p>
                                <input
                                    type="text"
                                    placeholder="Ваше імʼя"
                                    value={donorName}
                                    onChange={(e) => setDonorName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-black outline-none"
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={donorEmail}
                                    onChange={(e) => setDonorEmail(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-black outline-none"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 transition"
                        >
                            {isLoading ? 'Перенаправлення...' : `Задонатити ${amount ? `${amount} ₴` : ''}`}
                        </button>

                        <p className="text-center text-xs text-gray-400 mt-4">
                            Оплата через захищену сторінку WayForPay
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}