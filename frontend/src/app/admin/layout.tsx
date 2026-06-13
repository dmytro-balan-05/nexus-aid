'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [unreadChats, setUnreadChats] = useState(0);
    const [pendingVerifications, setPendingVerifications] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [chatsRes, verRes] = await Promise.all([
                    fetch('/api/chat/admin/all', { credentials: 'include' }),
                    fetch('/api/verification?status=pending', { credentials: 'include' }),
                ]);
                if (chatsRes.ok) {
                    const chats = await chatsRes.json();
                    setUnreadChats(chats.filter((c: any) => c.unreadCount > 0).length);
                }
                if (verRes.ok) {
                    const reqs = await verRes.json();
                    setPendingVerifications(reqs.length);
                }
            } catch {}
        };
        fetchCounts();
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const tabs = [
        { href: '/admin/users',        label: '👥 Користувачі', count: 0 },
        { href: '/admin/badges',       label: '🏅 Досягнення',  count: 0 },
        { href: '/admin/verification', label: '🔐 Заявки',       count: pendingVerifications },
        { href: '/admin/chats',        label: '💬 Чати',         count: unreadChats },
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
                            className={`relative px-4 py-2 rounded-lg text-sm font-bold transition ${
                                pathname === tab.href
                                    ? 'bg-black text-white dark:bg-white dark:text-black'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                                    {tab.count > 9 ? '9+' : tab.count}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
                {children}
            </div>
        </div>
    );
}