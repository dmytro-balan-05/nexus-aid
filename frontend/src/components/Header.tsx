'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotification } from '@/context/NotificationContext';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import QuickDonateButton from './QuickDonateButton';

export default function Header() {
    const { user, logout } = useAuth();
    const { isDark, toggle } = useTheme();
    const { unreadChatCount, newBadgeCount, setNewBadgeCount } = useNotification();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const pathname = usePathname();
    const isHome = pathname === '/';

    const totalCount = unreadChatCount + newBadgeCount;

    const handleBellClick = () => {
        setShowNotifications(p => !p);
        if (!showNotifications) setNewBadgeCount(0);
    };

    return (
        <header className="border-b border-[var(--border)] bg-[var(--bg-card)] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">
                            NEXUS<span style={{ color: 'var(--accent)' }}>AID</span>
                        </Link>
                        <nav className="hidden md:ml-10 md:flex space-x-8">
                            <Link href="/campaigns" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition">Всі збори</Link>
                            <Link href="/about" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition">Про нас</Link>
                            {user?.role === 'admin' && (
                                <Link href="/admin/users" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition">Адмін панель</Link>
                            )}
                        </nav>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        {!isHome && <QuickDonateButton compact />}

                        <button onClick={toggle} className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition" title={isDark ? 'Світла тема' : 'Темна тема'}>
                            {isDark ? '☀️' : '🌙'}
                        </button>

                        {user && (
                            <div className="relative">
                                <button onClick={handleBellClick} className="relative w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
                                    🔔
                                    {totalCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                                            {totalCount > 9 ? '9+' : totalCount}
                                        </span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <div className="absolute right-0 top-12 w-72 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-xl z-50 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-[var(--border)]">
                                            <p className="font-bold text-sm text-[var(--text-primary)]">🔔 Сповіщення</p>
                                        </div>
                                        {totalCount === 0 ? (
                                            <div className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">Немає нових сповіщень</div>
                                        ) : (
                                            <>
                                                {unreadChatCount > 0 && (
                                                    <Link href="/profile" onClick={() => setShowNotifications(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] transition">
                                                        <span className="text-xl">💬</span>
                                                        <div>
                                                            <p className="text-sm font-bold text-[var(--text-primary)]">Нові повідомлення</p>
                                                            <p className="text-xs text-[var(--text-secondary)]">{unreadChatCount} непрочитаних від адміна</p>
                                                        </div>
                                                    </Link>
                                                )}
                                                {newBadgeCount > 0 && (
                                                    <Link href="/profile" onClick={() => setShowNotifications(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] transition">
                                                        <span className="text-xl">🏅</span>
                                                        <div>
                                                            <p className="text-sm font-bold text-[var(--text-primary)]">Нові бейджі</p>
                                                            <p className="text-xs text-[var(--text-secondary)]">Ви отримали {newBadgeCount} нових досягнень</p>
                                                        </div>
                                                    </Link>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
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
                                            <span className="text-gray-600 font-bold">{(user.name?.[0] || 'U').toUpperCase()}</span>
                                        )}
                                    </div>
                                </Link>
                                <button onClick={logout} className="text-sm text-red-600 font-medium hover:text-red-800">Вийти</button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-[var(--text-primary)] font-medium hover:opacity-70 px-3 py-2 transition">Увійти</Link>
                                <Link href="/register" className="bg-black dark:bg-white dark:text-black text-white px-4 py-2 rounded-lg font-medium hover:opacity-80 transition">Реєстрація</Link>
                            </>
                        )}
                    </div>

                    <div className="md:hidden flex items-center gap-2">
                        <button onClick={toggle} className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center">
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