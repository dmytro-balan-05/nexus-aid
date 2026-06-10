'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const router = useRouter();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/register', { email, password, name });
            setSuccess(true);
            setTimeout(() => router.push('/login'), 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Невідома помилка реєстрації');
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-[var(--bg-secondary)] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="text-[20vw] font-black tracking-tighter opacity-[0.03] text-[var(--text-primary)] whitespace-nowrap">
                    NEXUSAID
                </span>
            </div>

            <div className="relative z-10 bg-[var(--bg-card)] p-8 rounded-2xl shadow-xl w-full max-w-sm border border-[var(--border)]">
                <h1 className="text-2xl font-black mb-2 text-center text-[var(--text-primary)]">
                    NEXUS<span style={{ color: 'var(--accent)' }}>AID</span>
                </h1>
                <p className="text-center text-sm text-[var(--text-secondary)] mb-6">Створити акаунт</p>

                <div className="flex flex-col gap-3 mb-6">
                    <a href="/api/auth/github" className="flex items-center justify-center gap-3 w-full border border-[var(--border)] py-2.5 rounded-xl text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        Через GitHub
                    </a>
                    <a href="/api/auth/google" className="flex items-center justify-center gap-3 w-full border border-[var(--border)] py-2.5 rounded-xl text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Через Google
                    </a>
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <span className="text-xs text-[var(--text-secondary)]">або email</span>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                </div>

                {success ? (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-center">
                        <p className="font-bold">Успішно!</p>
                        <p className="text-sm">Перенаправлення на вхід...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input className="border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm" type="text" placeholder="Ваше імʼя" value={name} onChange={(e) => setName(e.target.value)} required />
                        <input className="border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <input className="border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-black text-sm" type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button type="submit" className="bg-black text-white p-2.5 rounded-xl font-bold hover:bg-gray-800 transition text-sm">
                            Створити акаунт
                        </button>
                    </form>
                )}

                <div className="mt-4 text-center text-sm">
                    <Link href="/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
                        Вже є акаунт? <span className="font-bold" style={{ color: 'var(--accent)' }}>Увійти</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}