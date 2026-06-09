'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await api.post('/auth/login', { email, password });

            await login();
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Невідома помилка входу');
            }
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 text-black">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-6 text-center">Вхід Nexus Aid</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition">
                        Увійти
                    </button>
                </form>
                <div className="mt-4 text-center text-sm">
                    <Link href="/register" className="text-blue-500 hover:underline">
                        Немає акаунту? Реєстрація
                    </Link>
                </div>
            </div>
        </div>
    );
}