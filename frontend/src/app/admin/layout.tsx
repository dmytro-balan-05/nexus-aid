'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { href: '/admin/users',        label: '👥 Користувачі' },
        { href: '/admin/badges',       label: '🏅 Досягнення' },
        { href: '/admin/verification', label: '🔐 Заявки' },
        { href: '/admin/chats',        label: '💬 Чати' },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)]">
            <div className="max-w-5xl mx-auto pt-6 px-4">
                <h1 className="text-3xl font-extrabold mb-6 text-[var(--text-primary)]">Адмін панель</h1>
                <div className="flex gap-1 mb-6 bg-[var(--bg-card)] rounded-xl p-1 border border-[var(--border)] w-fit">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                                pathname === tab.href
                                    ? 'bg-black text-white dark:bg-white dark:text-black'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                            }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>
                {children}
            </div>
        </div>
    );
}