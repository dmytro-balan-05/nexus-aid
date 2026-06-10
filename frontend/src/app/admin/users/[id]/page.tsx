'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Badge { id: string; key: string; name: string; icon: string; description: string; category: string; }
interface UserBadge { id: string; grantedBy: string | null; createdAt: string; badge: Badge; }
interface Donation { id: string; amount: number; createdAt: string; campaign: { id: string; title: string; category: string; }; }
interface DonorProfile { level: string; totalAmount: number; donationCount: number; }
interface UserDetails { id: string; name: string; email: string; role: string; avatar: string | null; provider: string; createdAt: string; donorProfile: DonorProfile | null; userBadges: UserBadge[]; donations: Donation[]; }
interface AllBadge { id: string; key: string; name: string; icon: string; category: string; }

const LEVEL_COLORS: Record<string, string> = {
    bronze: 'bg-orange-100 text-orange-800', silver: 'bg-gray-100 text-gray-800',
    gold: 'bg-yellow-100 text-yellow-800', platinum: 'bg-purple-100 text-purple-800',
};

export default function AdminUserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [user, setUser] = useState<UserDetails | null>(null);
    const [allBadges, setAllBadges] = useState<AllBadge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newRole, setNewRole] = useState('');
    const [isSavingRole, setIsSavingRole] = useState(false);
    const [selectedBadgeKey, setSelectedBadgeKey] = useState('');
    const [isGranting, setIsGranting] = useState(false);
    const [message, setMessage] = useState('');

    const fetchUser = async () => {
        const res = await fetch(`/api/users/${id}`, { credentials: 'include' });
        const data = await res.json();
        setUser(data); setNewRole(data.role); setIsLoading(false);
    };

    useEffect(() => {
        fetchUser();
        fetch('/api/gamification/badges').then(r => r.json()).then(setAllBadges);
    }, [id]);

    const showMessage = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

    const handleRoleChange = async () => {
        if (!user || newRole === user.role) return;
        setIsSavingRole(true);
        try {
            const res = await fetch(`/api/users/${id}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ role: newRole }) });
            if (!res.ok) throw new Error(await res.text());
            await fetchUser(); showMessage('Роль змінено');
        } catch (e: any) { showMessage(e.message || 'Помилка'); }
        finally { setIsSavingRole(false); }
    };

    const handleGrantBadge = async () => {
        if (!selectedBadgeKey) return;
        setIsGranting(true);
        try {
            const res = await fetch('/api/gamification/admin/grant-badge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ userId: id, badgeKey: selectedBadgeKey }) });
            if (!res.ok) throw new Error(await res.text());
            setSelectedBadgeKey(''); await fetchUser(); showMessage('Бейдж видано');
        } catch (e: any) { showMessage(e.message || 'Помилка'); }
        finally { setIsGranting(false); }
    };

    const handleRevokeBadge = async (badgeKey: string) => {
        if (!confirm('Забрати бейдж?')) return;
        try {
            const res = await fetch(`/api/users/${id}/badges/${badgeKey}`, { method: 'DELETE', credentials: 'include' });
            if (!res.ok) throw new Error(await res.text());
            await fetchUser(); showMessage('Бейдж забрано');
        } catch (e: any) { showMessage(e.message || 'Помилка'); }
    };

    if (isLoading) return <div className="p-6 text-[var(--text-secondary)]">Завантаження...</div>;
    if (!user) return <div className="p-6 text-red-500">Користувача не знайдено</div>;

    const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || 'U')}`;
    const ownedBadgeKeys = new Set(user.userBadges.map((ub) => ub.badge.key));
    const availableBadges = allBadges.filter((b) => !ownedBadgeKeys.has(b.key));

    return (
        <div className="pb-10 space-y-6">
            <button onClick={() => router.push('/admin/users')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
                ← Назад до списку
            </button>

            {message && (
                <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-200 font-bold">{message}</div>
            )}

            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
                <div className="flex items-start gap-4">
                    <img src={avatarUrl} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-[var(--border)]" />
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">{user.name || 'Без імені'}</h2>
                        <p className="text-[var(--text-secondary)] text-sm">{user.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'volonteer' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{user.role}</span>
                            {user.donorProfile && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[user.donorProfile.level] || ''}`}>{user.donorProfile.level}</span>}
                            <span className="text-xs text-[var(--text-secondary)]">Провайдер: {user.provider}</span>
                            <span className="text-xs text-[var(--text-secondary)]">З {new Date(user.createdAt).toLocaleDateString('uk-UA')}</span>
                        </div>
                    </div>
                </div>
                {user.donorProfile && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center border border-[var(--border)]">
                            <div className="text-xl font-black text-[var(--text-primary)]">{user.donorProfile.totalAmount.toLocaleString()} ₴</div>
                            <div className="text-xs text-[var(--text-secondary)]">задоначено</div>
                        </div>
                        <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center border border-[var(--border)]">
                            <div className="text-xl font-black text-[var(--text-primary)]">{user.donorProfile.donationCount}</div>
                            <div className="text-xs text-[var(--text-secondary)]">донатів</div>
                        </div>
                    </div>
                )}
            </div>

            {user.role !== 'admin' && (
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
                    <h3 className="font-bold text-[var(--text-primary)] mb-3">Роль користувача</h3>
                    <div className="flex gap-2">
                        <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-black">
                            <option value="user">User</option>
                            <option value="volonteer">Volonteer</option>
                        </select>
                        <button onClick={handleRoleChange} disabled={isSavingRole || newRole === user.role} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition">
                            {isSavingRole ? 'Збереження...' : 'Зберегти'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
                <h3 className="font-bold text-[var(--text-primary)] mb-4">🏅 Бейджі ({user.userBadges.length})</h3>
                {user.userBadges.length > 0 ? (
                    <div className="space-y-2 mb-4">
                        {user.userBadges.map((ub) => (
                            <div key={ub.id} className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)]">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{ub.badge.icon}</span>
                                    <div>
                                        <div className="font-bold text-sm text-[var(--text-primary)]">{ub.badge.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-[var(--text-secondary)]">{ub.grantedBy ? '👤 Вручну' : '🤖 Авто'}</span>
                                            <span className="text-xs text-[var(--text-secondary)]">{new Date(ub.createdAt).toLocaleDateString('uk-UA')}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleRevokeBadge(ub.badge.key)} className="text-xs border border-red-200 text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition">Забрати</button>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-[var(--text-secondary)] mb-4">Бейджів ще немає</p>}

                {availableBadges.length > 0 && (
                    <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                        <select value={selectedBadgeKey} onChange={(e) => setSelectedBadgeKey(e.target.value)} className="flex-1 border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-black">
                            <option value="">Видати бейдж...</option>
                            {availableBadges.map((b) => <option key={b.key} value={b.key}>{b.icon} {b.name}</option>)}
                        </select>
                        <button onClick={handleGrantBadge} disabled={!selectedBadgeKey || isGranting} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition">
                            {isGranting ? '...' : 'Видати'}
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
                <h3 className="font-bold text-[var(--text-primary)] mb-4">💳 Донати ({user.donations.length})</h3>
                {user.donations.length > 0 ? (
                    <div className="space-y-2">
                        {user.donations.map((d) => (
                            <div key={d.id} className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)]">
                                <div>
                                    <div className="font-bold text-sm text-[var(--text-primary)]">{d.campaign.title}</div>
                                    <div className="text-xs text-[var(--text-secondary)]">{new Date(d.createdAt).toLocaleDateString('uk-UA')}</div>
                                </div>
                                <span className="font-black text-[var(--text-primary)]">{d.amount.toLocaleString()} ₴</span>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-[var(--text-secondary)]">Донатів ще немає</p>}
            </div>
        </div>
    );
}