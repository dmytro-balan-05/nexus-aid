'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
    level: string;
    totalAmount: number;
    donationCount: number;
    badgeCount: number;
    user: { id: string; name: string; avatar: string | null };
}

const LEVEL_COLORS: Record<string, string> = {
    bronze:   'text-orange-500',
    silver:   'text-gray-400',
    gold:     'text-yellow-500',
    platinum: 'text-purple-500',
};

const MEDAL = (i: number) =>
    i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;

export default function Leaderboard() {
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [tab, setTab] = useState<'amount' | 'badges'>('amount');
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/gamification/leaderboard');
            setData(await res.json());
            setLastUpdated(new Date());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const sorted = tab === 'amount'
        ? [...data].sort((a, b) => b.totalAmount - a.totalAmount)
        : [...data].sort((a, b) => b.badgeCount - a.badgeCount);

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">🏆 Скорборд</h2>
                    <p className="text-[var(--text-secondary)] text-sm">Найактивніші донори платформи</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                    {isLoading ? '...' : '↻ Оновити'}
                </button>
            </div>

            {lastUpdated && (
                <p className="text-xs text-[var(--text-secondary)] mb-4 opacity-50">
                    Оновлено: {lastUpdated.toLocaleTimeString('uk-UA')}
                </p>
            )}

            <div className="flex gap-1 mb-5 bg-[var(--bg-secondary)] rounded-xl p-1 w-fit">
                <button
                    onClick={() => setTab('amount')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${tab === 'amount' ? 'bg-[var(--bg-card)] shadow text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                >
                    💰 По сумі
                </button>
                <button
                    onClick={() => setTab('badges')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${tab === 'badges' ? 'bg-[var(--bg-card)] shadow text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
                >
                    🏅 Бейджхантери
                </button>
            </div>

            {isLoading && data.length === 0 ? (
                <div className="py-10 text-center text-[var(--text-secondary)] text-sm">Завантаження...</div>
            ) : sorted.length === 0 ? (
                <div className="py-10 text-center text-[var(--text-secondary)] text-sm">Поки немає даних</div>
            ) : (
                <div className="space-y-2">
                    {sorted.slice(0, 10).map((entry, i) => (
                        <Link
                            key={entry.user.id}
                            href={`/profile/${entry.user.id}`}
                            className="flex items-center gap-4 bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)] hover:border-[var(--text-secondary)] transition cursor-pointer"
                        >
                            <span className={`text-xl font-black w-8 text-center ${
                                i === 0 ? 'text-yellow-500' :
                                    i === 1 ? 'text-gray-400' :
                                        i === 2 ? 'text-orange-400' :
                                            'text-[var(--text-secondary)]'
                            }`}>
                                {MEDAL(i)}
                            </span>

                            <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {entry.user.avatar ? (
                                    <img src={entry.user.avatar} className="w-full h-full object-cover" alt={entry.user.name} />
                                ) : (
                                    <span className="text-sm font-bold text-gray-600">
                                        {(entry.user.name?.[0] || 'U').toUpperCase()}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-[var(--text-primary)] truncate">{entry.user.name || 'Анонім'}</div>
                                <div className={`text-xs font-bold ${LEVEL_COLORS[entry.level] || 'text-[var(--text-secondary)]'}`}>
                                    {entry.level}
                                </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                                {tab === 'amount' ? (
                                    <>
                                        <div className="font-black text-[var(--text-primary)] text-sm">{entry.totalAmount.toLocaleString()} ₴</div>
                                        <div className="text-xs text-[var(--text-secondary)]">{entry.donationCount} донатів</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="font-black text-[var(--text-primary)] text-sm">{entry.badgeCount} 🏅</div>
                                        <div className="text-xs text-[var(--text-secondary)]">бейджів</div>
                                    </>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}