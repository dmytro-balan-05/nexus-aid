'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DonateButton from '@/components/DonateButton';
import Leaderboard from '@/components/Leaderboard';
import QuickDonateButton from '@/components/QuickDonateButton';
import UrgentBadge from '@/components/UrgentBadge';

interface Campaign {
    id: string;
    title: string;
    shortDescription: string;
    goalAmount: number;
    currentAmount: number;
    category: string;
    images: string[];
    isUrgent: boolean;
    urgentUntil: string | null;
    author: { name: string; avatar: string | null };
}

interface UrgentItem {
    category: string;
    campaign: Campaign;
}

const CATEGORY_LABELS: Record<string, string> = {
    military:     '🎖️ Військові',
    medical:      '🏥 Медичні',
    humanitarian: '🤝 Гуманітарні',
    general:      '⭐ Загальні',
};

function daysLeft(urgentUntil: string, now: number): number {
    return Math.ceil((new Date(urgentUntil).getTime() - now) / 86400000);
}

export default function HomePage() {
    const [urgent, setUrgent] = useState<UrgentItem[]>([]);
    const [stats, setStats] = useState({ campaigns: 0, donors: 0, totalAmount: 0 });
    const [now, setNow] = useState(0);

    useEffect(() => {
        setNow(Date.now());
        fetch('/api/campaigns/urgent').then((r) => r.json()).then(setUrgent).catch(() => {});
        fetch('/api/gamification/leaderboard')
            .then((r) => r.json())
            .then((data) => setStats((prev) => ({
                ...prev,
                donors: data.length,
                totalAmount: data.reduce((sum: number, d: { totalAmount?: number }) => sum + (d.totalAmount || 0), 0),
            }))).catch(() => {});
        fetch('/api/campaigns')
            .then((r) => r.json())
            .then((data) => setStats((prev) => ({ ...prev, campaigns: data.length })))
            .catch(() => {});
    }, []);

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)]">
            <section className="bg-black text-white py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl font-black mb-4 tracking-tight">
                        NEXUS<span style={{ color: 'var(--accent)' }}>AID</span>
                    </h1>
                    <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
                        Єдина платформа для прозорих благодійних зборів з верифікацією волонтерів та системою досягнень
                    </p>
                    <p className="text-gray-500 mb-10 text-sm">Збори структуровані, волонтери перевірені, кошти прозорі</p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link href="/campaigns" className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition">Всі збори</Link>
                        <QuickDonateButton />
                        <Link href="/register" className="border border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white hover:text-black transition">Приєднатись</Link>
                    </div>
                </div>
            </section>

            <section className="py-10 bg-[var(--bg-card)] border-b border-[var(--border)]">
                <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-6 text-center">
                    <div>
                        <div className="text-3xl font-black text-[var(--text-primary)]">{stats.campaigns}</div>
                        <div className="text-sm text-[var(--text-secondary)] mt-1">активних зборів</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-[var(--text-primary)]">{stats.donors}</div>
                        <div className="text-sm text-[var(--text-secondary)] mt-1">донорів</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-[var(--text-primary)]">{stats.totalAmount.toLocaleString()} ₴</div>
                        <div className="text-sm text-[var(--text-secondary)] mt-1">зібрано всього</div>
                    </div>
                </div>
            </section>

            {urgent.length > 0 && (
                <section className="py-12 px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-2xl">⚡</span>
                            <UrgentBadge />
                            <span className="text-sm text-[var(--text-secondary)]">— потребують допомоги зараз</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {urgent.map(({ category, campaign }) => {
                                const percent = Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100);
                                const days = campaign.urgentUntil && now ? daysLeft(campaign.urgentUntil, now) : null;
                                return (
                                    <div key={campaign.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm hover:border-gray-400 transition">
                                        <Link href={`/campaigns/${campaign.id}`} className="block">
                                            <div className="relative">
                                                <img src={campaign.images?.[0] || 'https://placehold.co/400x200/png?text=NexusAid'} alt={campaign.title} className="w-full h-36 object-cover" />
                                                <div className="absolute top-2 left-2 flex gap-1">
                                                    <UrgentBadge />
                                                    <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">{CATEGORY_LABELS[category] || category}</span>
                                                </div>
                                            </div>
                                            <div className="p-4 pb-2">
                                                <h3 className="font-bold text-[var(--text-primary)] mb-1 line-clamp-1">{campaign.title}</h3>
                                                {days !== null && (
                                                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--accent)' }}>
                                                        ⏰ Залишилось {days} {days === 1 ? 'день' : days < 5 ? 'дні' : 'днів'}
                                                    </p>
                                                )}
                                                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                                                    <span>{campaign.currentAmount.toLocaleString()} ₴</span>
                                                    <span>{campaign.goalAmount.toLocaleString()} ₴</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                                                    <div className="h-1.5 rounded-full" style={{ width: `${percent}%`, backgroundColor: 'var(--accent)' }} />
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="px-4 pb-4">
                                            <DonateButton campaignId={campaign.id} campaignTitle={campaign.title} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            <section className="py-12 px-4">
                <div className="max-w-3xl mx-auto"><Leaderboard /></div>
            </section>

            <section className="py-12 px-4 bg-[var(--bg-card)]">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-extrabold text-[var(--text-primary)] mb-8 text-center">Чому NexusAid?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: '✅', title: 'Верифікація', desc: 'Всі волонтери проходять перевірку перед публікацією зборів' },
                            { icon: '📊', title: 'Прозорість', desc: 'Кожен збір має звітність і документи підтвердження' },
                            { icon: '🎮', title: 'Гейміфікація', desc: 'Система бейджів і рівнів мотивує донорів робити більше' },
                        ].map((item) => (
                            <div key={item.title} className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border)] text-center">
                                <div className="text-4xl mb-3">{item.icon}</div>
                                <h3 className="font-bold text-[var(--text-primary)] mb-2">{item.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)]">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}