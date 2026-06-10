'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Badge {
    key: string;
    name: string;
    description: string;
    icon: string;
    category: string;
}

interface PublicProfile {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
    createdAt: string;
    donorProfile: {
        level: string;
        totalAmount: number;
        donationCount: number;
        selectedFrame: string | null;
        selectedBackground: string | null;
        selectedFont: string | null;
        quote: string | null;
    } | null;
    userBadges: { badge: Badge }[];
}

const LEVEL_COLORS: Record<string, string> = {
    bronze:   'bg-orange-100 text-orange-800',
    silver:   'bg-gray-100 text-gray-800',
    gold:     'bg-yellow-100 text-yellow-800',
    platinum: 'bg-purple-100 text-purple-800',
};

const LEVEL_LABELS: Record<string, string> = {
    bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum',
};

export default function PublicProfilePage() {
    const { id } = useParams<{ id: string }>();
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
            return;
        }

        if (user && id === user.id) {
            router.replace('/profile');
            return;
        }

        if (!user) return;

        fetch(`/api/users/${id}/profile`, { credentials: 'include' })
            .then((r) => {
                if (!r.ok) { setNotFound(true); return null; }
                return r.json();
            })
            .then((data) => { if (data) setProfile(data); })
            .finally(() => setPageLoading(false));
    }, [id, user, authLoading, router]);

    if (authLoading || pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
                <div className="text-[var(--text-secondary)] text-sm">Завантаження...</div>
            </div>
        );
    }

    if (notFound || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-secondary)] gap-4">
                <div className="text-2xl font-bold text-[var(--text-primary)]">Профіль не знайдено</div>
                <Link href="/" className="text-sm font-bold hover:opacity-70 transition" style={{ color: 'var(--accent)' }}>
                    ← На головну
                </Link>
            </div>
        );
    }

    const avatarUrl = profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.name || profile.id)}`;
    const dp = profile.donorProfile;

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
                    ← Назад
                </Link>

                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                    <div className="h-24" style={{ background: dp?.selectedBackground || 'linear-gradient(to right, #111827, #374151)' }} />
                    <div className="px-6 pb-6">
                        <div className="flex items-end justify-between -mt-12 mb-4">
                            <img src={avatarUrl} alt={profile.name || 'Avatar'} className="w-20 h-20 rounded-2xl border-4 border-[var(--bg-card)] object-cover shadow-md" />
                            {dp && (
                                <span className={`text-xs font-bold px-3 py-1 rounded-full mb-2 ${LEVEL_COLORS[dp.level] || 'bg-gray-100 text-gray-800'}`}>
                                    {LEVEL_LABELS[dp.level] || dp.level}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">{profile.name || 'Анонім'}</h1>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                profile.role === 'admin'     ? 'bg-purple-100 text-purple-800' :
                                    profile.role === 'volonteer' ? 'bg-orange-100 text-orange-800' :
                                        'bg-blue-100 text-blue-800'
                            }`}>
                                {profile.role}
                            </span>
                        </div>

                        {dp?.quote && <p className="text-[var(--text-secondary)] text-sm italic mt-1">"{dp.quote}"</p>}

                        {dp && (
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)] text-center">
                                    <div className="text-xl font-black text-[var(--text-primary)]">{dp.totalAmount.toLocaleString()} ₴</div>
                                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">задоначено</div>
                                </div>
                                <div className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)] text-center">
                                    <div className="text-xl font-black text-[var(--text-primary)]">{dp.donationCount}</div>
                                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">донатів</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {profile.userBadges.length > 0 && (
                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
                        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">🏆 Досягнення</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {profile.userBadges.map(({ badge }) => (
                                <div key={badge.key} className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)] flex items-center gap-3">
                                    <span className="text-2xl">{badge.icon}</span>
                                    <div>
                                        <div className="font-bold text-sm text-[var(--text-primary)]">{badge.name}</div>
                                        <div className="text-xs text-[var(--text-secondary)]">{badge.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}