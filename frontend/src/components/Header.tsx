'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import QuickDonateButton from './QuickDonateButton';

export default function Header() {
    const { user, logout } = useAuth();
    const { isDark, toggle } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const pathname = usePathname();
    const isHome = pathname === '/';

    useEffect(() => {
        if (user?.role !== 'volonteer') return;
        const fetchUnread = async () => {
            try {
                const res = await fetch('/api/chat/me/unread', { credentials: 'include' });
                const data = await res.json();
                setUnreadCount(typeof data === 'number' ? data : 0);
            } catch {}
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [user]);

    return (
        <header className="border-b border-[var(--border)] bg-[var(--bg-card)] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">
                            NEXUS<span style={{ color: 'var(--accent)' }}>AID</span>
                        </Link>
                        <nav className="hidden md:ml-10 md:flex space-x-8">
                            <Link href="/campaigns" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition">
                                Всі збори
                            </Link>
                            <Link href="/about" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition">
                                Про нас
                            </Link>
                            {user?.role === 'admin' && (
                                <Link href="/admin/users" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition">
                                    Адмін панель
                                </Link>
                            )}
                        </nav>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        {!isHome && <QuickDonateButton compact />}

                        <button
                            onClick={toggle}
                            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition"
                            title={isDark ? 'Світла тема' : 'Темна тема'}
                        >
                            {isDark ? '☀️' : '🌙'}
                        </button>

                        {user?.role === 'volonteer' && (
                            <Link href="/profile" className="relative w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
                                🔔
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {user ? (
                            <>
                                <Link href="/profile" className="flex items-center gap-3 hover:bg-[var(--bg-secondary)] px-2 py-1 rounded transition cursor-pointer">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[var(--text-primary)]">{user.name || user.email}</p>
                                        <p className="text-xs text-[var(--text-secondary)] uppercase">{user.role || 'User'}</p>
                                    </div>
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-600 font-bold">
                                                {(user.name?.[0] || 'U').toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                                <button onClick={logout} className="text-sm text-red-600 font-medium hover:text-red-800">
                                    Вийти
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-[var(--text-primary)] font-medium hover:opacity-70 px-3 py-2 transition">
                                    Увійти
                                </Link>
                                <Link href="/register" className="bg-black dark:bg-white dark:text-black text-white px-4 py-2 rounded-lg font-medium hover:opacity-80 transition">
                                    Реєстрація
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="md:hidden flex items-center gap-2">
                        <button
                            onClick={toggle}
                            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center"
                        >
                            {isDark ? '☀️' : '🌙'}
                        </button>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[var(--text-secondary)] p-2">☰</button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden border-t border-[var(--border)] p-4 space-y-3 bg-[var(--bg-card)]">
                    <Link href="/campaigns" className="block font-medium text-[var(--text-primary)]">Всі збори</Link>
                    {user?.role === 'admin' && (
                        <Link href="/admin/users" className="block font-medium text-[var(--text-primary)]">Адмін панель</Link>
                    )}
                    {!isHome && <QuickDonateButton compact />}
                    {user ? (
                        <>
                            <Link href="/profile" className="block font-bold" style={{ color: 'var(--accent)' }}>Мій профіль</Link>
                            <button onClick={logout} className="block text-red-600 w-full text-left">Вийти</button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="block w-full text-center border border-[var(--border)] py-2 rounded text-[var(--text-primary)]">Увійти</Link>
                            <Link href="/register" className="block w-full text-center bg-black text-white py-2 rounded">Реєстрація</Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}