'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // <--- Нове поле
    const router = useRouter();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Відправляємо name разом з email та password
            await api.post('/auth/register', { email, password, name });
            setSuccess(true);

            setTimeout(() => {
                router.push('/login');
            }, 1500);

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Невідома помилка реєстрації');
            }
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 text-black">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-6 text-center">Реєстрація</h1>

                {success ? (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center mb-4">
                        <p className="font-bold">Успішно!</p>
                        <p className="text-sm">Перенаправлення на вхід...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Новий інпут для Імені */}
                        <input
                            className="border p-2 rounded text-black"
                            type="text"
                            placeholder="Ваше ім'я"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        <input
                            className="border p-2 rounded text-black"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            className="border p-2 rounded text-black"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white p-2 rounded transition">
                            Створити акаунт
                        </button>
                    </form>
                )}

                <div className="mt-4 text-center text-sm">
                    <Link href="/login" className="text-blue-500 hover:underline">
                        Вже є акаунт? Увійти
                    </Link>
                </div>
            </div>
        </div>
    );
}