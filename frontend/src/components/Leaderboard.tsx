'use client';

import { useEffect, useState, useCallback } from 'react';

interface LeaderboardEntry {
    level: string;
    totalAmount: number;
    donationCount: number;
    badgeCount: number;
    user: { id: string; name: string; avatar: string | null };
}

const LEVEL_COLORS: Record<string, string> = {
    bronze:   'text-orange-600',
    silver:   'text-gray-500',
    gold:     'text-yellow-500',
    platinum: 'text-purple-600',
};

const MEDAL = (i: number) =>
    i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;

export default function Leaderboard() {
    const [data, setData] = useState<LeaderboardEntry[]>([]);
    const [tab, setTab] = useState<'amount' | 'badges'>('amount');
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetch_ = useCallback(async () => {
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
        fetch_();
        const interval = setInterval(fetch_, 60 * 1000);
        return () => clearInterval(interval);
    }, [fetch_]);

    const sorted = tab === 'amount'
        ? [...data].sort((a, b) => b.totalAmount - a.totalAmount)
        : [...data].sort((a, b) => b.badgeCount - a.badgeCount);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-2">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">🏆 Скорборд</h2>
                    <p className="text-gray-400 text-sm">Найактивніші донори платформи</p>
                </div>
                <button
                    onClick={fetch_}
                    disabled={isLoading}
                    className="text-xs text-gray-400 hover:text-black border border-gray-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                    {isLoading ? '...' : '↻ Оновити'}
                </button>
            </div>

            {lastUpdated && (
                <p className="text-xs text-gray-300 mb-4">
                    Оновлено: {lastUpdated.toLocaleTimeString('uk-UA')}
                </p>
            )}

            <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setTab('amount')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${tab === 'amount' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                >
                    💰 По сумі
                </button>
                <button
                    onClick={() => setTab('badges')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${tab === 'badges' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                >
                    🏅 Бейджхантери
                </button>
            </div>

            {isLoading && data.length === 0 ? (
                <div className="py-10 text-center text-gray-300 text-sm">Завантаження...</div>
            ) : sorted.length === 0 ? (
                <div className="py-10 text-center text-gray-300 text-sm">Поки немає даних</div>
            ) : (
                <div className="space-y-2">
                    {sorted.slice(0, 10).map((entry, i) => (
                        <div key={entry.user.id} className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <span className={`text-xl font-black w-8 text-center ${
                                i === 0 ? 'text-yellow-500' :
                                    i === 1 ? 'text-gray-400' :
                                        i === 2 ? 'text-orange-400' :
                                            'text-gray-300'
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
                                <div className="font-bold text-sm text-gray-900 truncate">{entry.user.name || 'Анонім'}</div>
                                <div className={`text-xs font-bold ${LEVEL_COLORS[entry.level] || 'text-gray-400'}`}>
                                    {entry.level}
                                </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                                {tab === 'amount' ? (
                                    <>
                                        <div className="font-black text-gray-900 text-sm">{entry.totalAmount.toLocaleString()} ₴</div>
                                        <div className="text-xs text-gray-400">{entry.donationCount} донатів</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="font-black text-gray-900 text-sm">{entry.badgeCount} 🏅</div>
                                        <div className="text-xs text-gray-400">бейджів</div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}