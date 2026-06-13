'use client';

import { useEffect, useState, useRef, useCallback, ChangeEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DonorCard, { DonorCardRef } from '@/components/DonorCard';
import BadgeCustomizer from '@/components/BadgeCustomizer';
import VolonteerChat from '@/components/VolonteerChat';

interface Badge {
    key: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlocksFrame: string | null;
    unlocksBackground: string | null;
    unlocksFont: string | null;
}

interface DonorProfile {
    level: 'bronze' | 'silver' | 'gold' | 'platinum';
    totalAmount: number;
    donationCount: number;
    selectedFrame: string | null;
    selectedBackground: string | null;
    selectedFont: string | null;
    selectedBadgeId: string | null;
    quote: string | null;
}

interface GamificationData {
    profile: DonorProfile | null;
    badges: Badge[];
}

interface Donation {
    id: string;
    amount: number;
    createdAt: string;
    campaign: {
        id: string;
        title: string;
        category: string;
        images: string[];
    };
}

interface VerificationMessage {
    id: string;
    text: string;
    isAdmin: boolean;
    createdAt: string;
    sender: { id: string; name: string; avatar: string | null; role: string };
}

interface VerificationRequest {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    about: string;
    experience: string;
    socialLinks: string | null;
    documents: string[];
    createdAt: string;
    messages: VerificationMessage[];
}

const LEVEL_LABELS = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };
const LEVEL_COLORS = {
    bronze:   'bg-orange-100 text-orange-800',
    silver:   'bg-gray-100 text-gray-800',
    gold:     'bg-yellow-100 text-yellow-800',
    platinum: 'bg-purple-100 text-purple-800',
};

const STATUS_CONFIG = {
    pending:  { label: 'На розгляді',  color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    approved: { label: 'Підтверджено', color: 'bg-green-100 text-green-800',  icon: '✅' },
    rejected: { label: 'Відхилено',    color: 'bg-red-100 text-red-800',      icon: '❌' },
};

const CATEGORY_ICONS: Record<string, string> = {
    military: '🪖',
    medical: '🩺',
    humanitarian: '🤝',
    general: '💙',
};

const FRAME_COLORS: Record<string, string> = {
    frame_star: '#facc15', frame_diamond: '#22d3ee', frame_crown: '#f59e0b',
    frame_shield: '#3b82f6', frame_drone: '#6366f1', frame_wings: '#8b5cf6',
    frame_heart: '#ec4899', frame_medic: '#ef4444', frame_hands: '#22c55e',
    frame_trophy: '#f59e0b', frame_champion: '#fbbf24', frame_elite: '#a855f7',
    frame_moon: '#818cf8', frame_rainbow: '#f43f5e', frame_butterfly: '#c084fc',
    frame_sparkle: '#fb7185', frame_perfect: '#6366f1', frame_loyal: '#dc2626',
    frame_marathon: '#1d4ed8', frame_phantom: '#e2e8f0', frame_coin: '#fbbf24',
    frame_fire: '#f97316', frame_explosion: '#ef4444', frame_stars: '#a3e635',
    frame_medal: '#d97706', frame_hero: '#7c3aed', frame_gold: '#ca8a04',
    frame_cross: '#f87171', frame_ambulance: '#dc2626', frame_pillar: '#78716c',
    frame_leaf: '#16a34a', frame_megaphone: '#9333ea', frame_funded: '#15803d',
    frame_clover: '#4ade80', frame_mirror: '#94a3b8', frame_week: '#fb923c',
    frame_podium: '#eab308', frame_secret: '#7c3aed', frame_emergency: '#dc2626',
    frame_hourglass: '#78716c', frame_seed: '#166534', frame_fashion: '#db2777',
    frame_build: '#1e40af', frame_paint: '#f472b6', frame_check: '#16a34a',
    frame_ukraine: '#005BBB', frame_sunflower: '#fbbf24',
};

const FRAME_SHADOWS: Record<string, string> = {
    frame_crown: '0 0 15px rgba(245,158,11,0.6)', frame_diamond: '0 0 15px rgba(34,211,238,0.6)',
    frame_elite: '0 0 20px rgba(168,85,247,0.8)', frame_sparkle: '0 0 20px rgba(251,113,133,0.7)',
    frame_champion: '0 0 15px rgba(251,191,36,0.7)', frame_phantom: '0 0 20px rgba(255,255,255,0.3)',
};

export default function ProfilePage() {
    const { user, isLoading, logout, refreshProfile } = useAuth();
    const { addToast } = useNotification();
    const router = useRouter();
    const cardRef = useRef<DonorCardRef>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [newName, setNewName] = useState('');
    const [newAvatar, setNewAvatar] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [gamification, setGamification] = useState<GamificationData>({ profile: null, badges: [] });
    const [donations, setDonations] = useState<Donation[]>([]);
    const [activeTab, setActiveTab] = useState<'profile' | 'donations'>('profile');

    const [verification, setVerification] = useState<VerificationRequest | null>(null);
    const [verificationLoaded, setVerificationLoaded] = useState(false);
    const [showVerificationForm, setShowVerificationForm] = useState(false);
    const [verificationForm, setVerificationForm] = useState({ about: '', experience: '', socialLinks: '' });
    const [verificationFiles, setVerificationFiles] = useState<File[]>([]);
    const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) router.push('/login');
    }, [user, isLoading, router]);

    const storedBadgeIds = localStorage.getItem('known_badge_ids');
    const knownBadgeIds = storedBadgeIds !== null ? JSON.parse(storedBadgeIds) as string[] : null;

    const knownRole = localStorage.getItem('known_role');
    if (knownRole && knownRole !== user.role && user.role === 'volonteer') {
        addToast('🎉 Вашу заявку схвалено! Ви тепер волонтер', 'success', '🎉');
    }
    localStorage.setItem('known_role', user.role);

    api.get<GamificationData>('/gamification/me').then((data) => {
        if (data) {
            setGamification(data);
            if (knownBadgeIds !== null) {
                const newBadges = data.badges.filter(b => !knownBadgeIds.includes(b.key));
                if (newBadges.length > 0) {
                    newBadges.forEach((b) => addToast(`🏅 Новий бейдж: ${b.name}`, 'badge', b.icon));
                    const prev = parseInt(localStorage.getItem('new_badge_count') || '0');
                    localStorage.setItem('new_badge_count', String(prev + newBadges.length));
                }
            }
            localStorage.setItem('known_badge_ids', JSON.stringify(data.badges.map(b => b.key)));
        }
    });
            fetch('/api/donations/my', { credentials: 'include' })
                .then((r) => r.ok ? r.json() : [])
                .then(setDonations)
                .catch(() => {});
            fetch('/api/verification/me', { credentials: 'include' })
                .then((r) => r.ok ? r.json() : null)
                .then((data) => { setVerification(data); setVerificationLoaded(true); })
                .catch(() => setVerificationLoaded(true));
        }
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [verification?.messages]);

    const startEditing = () => {
        setNewName(user?.name || '');
        setNewAvatar(user?.avatar || '');
        setIsEditing(true);
    };

    const handleUpdate = async () => {
        try {
            const avatarToSave = newAvatar.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newName || user?.name || 'user')}`;
            await api.patch('/users/me', { name: newName, avatar: avatarToSave });
            await refreshProfile();
            setIsEditing(false);
            setMessage('Профіль успішно оновлено!');
            addToast('Профіль оновлено', 'success', '✅');
            setTimeout(() => setMessage(''), 3000);
        } catch { alert('Помилка оновлення'); }
    };

    const handleCustomizationSave = useCallback(async (data: {
        selectedFrame?: string; selectedBackground?: string;
        selectedFont?: string; selectedBadgeId?: string; quote?: string;
    }) => {
        const prevBadgeCount = gamification.badges.length;
        await api.patch('/gamification/me/customization', data);
        const updated = await api.get<GamificationData>('/gamification/me');
        if (updated) {
            if (updated.badges.length > prevBadgeCount) {
                const newBadges = updated.badges.slice(prevBadgeCount);
                newBadges.forEach((b) => addToast(`Новий бейдж: ${b.name}`, 'badge', b.icon));
            }
            setGamification(updated);
            setTimeout(() => cardRef.current?.generate(), 100);
        }
    }, [gamification.badges.length, addToast]);

    const handleVerificationSubmit = async () => {
        if (!verificationForm.about || !verificationForm.experience) { alert('Заповніть всі обовʼязкові поля'); return; }
        setIsSubmittingVerification(true);
        try {
            const data = new FormData();
            data.append('about', verificationForm.about);
            data.append('experience', verificationForm.experience);
            if (verificationForm.socialLinks) data.append('socialLinks', verificationForm.socialLinks);
            verificationFiles.forEach((f) => data.append('documents', f));
            const res = await fetch('/api/verification', { method: 'POST', body: data, credentials: 'include' });
            if (!res.ok) throw new Error(await res.text());
            setVerification(await res.json());
            setShowVerificationForm(false);
        } catch (e: any) { alert(e.message || 'Помилка'); }
        finally { setIsSubmittingVerification(false); }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !verification) return;
        setIsSendingMessage(true);
        try {
            const res = await fetch(`/api/verification/${verification.id}/message`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                credentials: 'include', body: JSON.stringify({ text: newMessage }),
            });
            if (!res.ok) throw new Error();
            const msg = await res.json();
            setVerification((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
            setNewMessage('');
        } catch { alert('Помилка відправки'); }
        finally { setIsSendingMessage(false); }
    };

    if (isLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]"><div className="text-[var(--text-secondary)] text-sm">Завантаження...</div></div>;
    }

    const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || user.email)}`;
    const selectedFrame = gamification.profile?.selectedFrame || '';
    const selectedBackground = gamification.profile?.selectedBackground;

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

                <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
                    <div className="h-24" style={{ background: selectedBackground || 'linear-gradient(to right, #111827, #374151)' }} />
                    <div className="px-6 pb-6">
                        <div className="flex items-end justify-between -mt-12 mb-4">
                            <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover"
                                 style={{ border: `4px solid ${FRAME_COLORS[selectedFrame] || '#ffffff'}`, boxShadow: FRAME_SHADOWS[selectedFrame] || '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 font-medium transition mb-2">Вийти →</button>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">{user.name || 'Без імені'}</h1>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'volonteer' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{user.role}</span>
                            {gamification.profile && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[gamification.profile.level]}`}>{LEVEL_LABELS[gamification.profile.level]}</span>
                            )}
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm">{user.email}</p>
                        {gamification.profile?.quote && <p className="text-[var(--text-secondary)] text-sm italic mt-1">"{gamification.profile.quote}"</p>}
                        {gamification.profile && (
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)] text-center">
                                    <div className="text-xl font-black text-[var(--text-primary)]">{gamification.profile.totalAmount.toLocaleString()} ₴</div>
                                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">задоначено</div>
                                </div>
                                <div className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)] text-center">
                                    <div className="text-xl font-black text-[var(--text-primary)]">{gamification.profile.donationCount}</div>
                                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">донатів</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-1 bg-[var(--bg-card)] rounded-xl p-1 border border-[var(--border)]">
                    <button onClick={() => setActiveTab('profile')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'profile' ? 'bg-black text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Профіль</button>
                    <button onClick={() => setActiveTab('donations')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'donations' ? 'bg-black text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                        Мої донати {donations.length > 0 && <span className="ml-1 opacity-70">({donations.length})</span>}
                    </button>
                </div>

                {message && <div className="p-3 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm font-bold">{message}</div>}

                {activeTab === 'donations' && (
                    <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">💰 Історія донатів</h2>
                        {donations.length === 0 ? (
                            <p className="text-[var(--text-secondary)] text-sm text-center py-8">Донатів ще немає</p>
                        ) : (
                            <div className="space-y-3">
                                {donations.map((d) => (
                                    <div key={d.id} className="flex items-center gap-4 p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
                                        <span className="text-2xl">{CATEGORY_ICONS[d.campaign.category] || '💙'}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm text-[var(--text-primary)] truncate">{d.campaign.title}</div>
                                            <div className="text-xs text-[var(--text-secondary)]">{new Date(d.createdAt).toLocaleDateString('uk-UA')}</div>
                                        </div>
                                        <div className="font-black text-[var(--text-primary)]">{d.amount.toLocaleString()} ₴</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <>
                        <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Редагування профілю</h2>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block mb-1">Імʼя</label>
                                        <input value={newName} onChange={(e) => setNewName(e.target.value)} className="border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-xl w-full focus:ring-2 focus:ring-black outline-none text-sm" placeholder="Введіть імʼя" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block mb-1">URL Аватарки</label>
                                        <input value={newAvatar} onChange={(e) => setNewAvatar(e.target.value)} className="border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-xl w-full focus:ring-2 focus:ring-black outline-none text-sm" placeholder="https://... (залиш пустим для авто)" />
                                        <p className="text-xs text-[var(--text-secondary)] mt-1">Залиш пустим — згенерується автоматично</p>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={handleUpdate} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition">Зберегти</button>
                                        <button onClick={() => setIsEditing(false)} className="border border-[var(--border)] px-4 py-2 rounded-xl text-sm font-bold hover:border-black transition">Скасувати</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Поточне імʼя</div>
                                        <div className="text-lg font-bold text-[var(--text-primary)]">{user.name || 'Не вказано'}</div>
                                    </div>
                                    <button onClick={startEditing} className="text-sm font-bold hover:opacity-70 transition" style={{ color: 'var(--accent)' }}>Редагувати →</button>
                                </div>
                            )}
                        </div>

                        {user.role !== 'admin' && user.role !== 'volonteer' && verificationLoaded && (
                            <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">🔐 Верифікація волонтера</h2>
                                <p className="text-sm text-[var(--text-secondary)] mb-4">Пройдіть верифікацію щоб створювати збори</p>
                                {!verification && !showVerificationForm && (
                                    <button onClick={() => setShowVerificationForm(true)} className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition">Подати заявку</button>
                                )}
                                {showVerificationForm && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block mb-1">Про себе *</label>
                                            <textarea rows={3} value={verificationForm.about} onChange={(e) => setVerificationForm((p) => ({ ...p, about: e.target.value }))} className="border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-xl w-full focus:ring-2 focus:ring-black outline-none text-sm resize-none" placeholder="Розкажіть хто ви і чим займаєтесь..." />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block mb-1">Досвід волонтерства *</label>
                                            <textarea rows={3} value={verificationForm.experience} onChange={(e) => setVerificationForm((p) => ({ ...p, experience: e.target.value }))} className="border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-xl w-full focus:ring-2 focus:ring-black outline-none text-sm resize-none" placeholder="Опишіть ваш досвід..." />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block mb-1">Соцмережі</label>
                                            <input value={verificationForm.socialLinks} onChange={(e) => setVerificationForm((p) => ({ ...p, socialLinks: e.target.value }))} className="border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-xl w-full focus:ring-2 focus:ring-black outline-none text-sm" placeholder="Instagram, Facebook, Telegram..." />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block mb-1">Документи</label>
                                            <input type="file" multiple onChange={(e: ChangeEvent<HTMLInputElement>) => { if (e.target.files) setVerificationFiles(Array.from(e.target.files)); }} className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:bg-black file:text-white file:text-xs cursor-pointer" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={handleVerificationSubmit} disabled={isSubmittingVerification} className="bg-black text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition">{isSubmittingVerification ? 'Відправка...' : 'Відправити заявку'}</button>
                                            <button onClick={() => setShowVerificationForm(false)} className="border border-[var(--border)] px-5 py-2 rounded-xl text-sm font-bold hover:border-black transition">Скасувати</button>
                                        </div>
                                    </div>
                                )}
                                {verification && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_CONFIG[verification.status].color}`}>{STATUS_CONFIG[verification.status].icon} {STATUS_CONFIG[verification.status].label}</span>
                                            <span className="text-xs text-[var(--text-secondary)]">{new Date(verification.createdAt).toLocaleDateString('uk-UA')}</span>
                                        </div>
                                        {(verification.messages?.length ?? 0) > 0 && (
                                            <div className="border border-[var(--border)] rounded-xl overflow-hidden mb-3">
                                                <div className="bg-[var(--bg-secondary)] px-4 py-2 border-b border-[var(--border)]">
                                                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase">Діалог з адміном</p>
                                                </div>
                                                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                                                    {verification.messages.map((msg) => (
                                                        <div key={msg.id} className={`flex gap-2 ${msg.isAdmin ? '' : 'flex-row-reverse'}`}>
                                                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold flex-shrink-0">{msg.sender.name?.[0]?.toUpperCase() || 'U'}</div>
                                                            <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${msg.isAdmin ? 'bg-gray-100 text-gray-900' : 'bg-black text-white'}`}>
                                                                {msg.text}
                                                                <div className={`text-xs mt-1 ${msg.isAdmin ? 'text-gray-400' : 'text-gray-300'}`}>{new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div ref={messagesEndRef} />
                                                </div>
                                            </div>
                                        )}
                                        {verification.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} placeholder="Написати адміну..." className="flex-1 border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" />
                                                <button onClick={handleSendMessage} disabled={isSendingMessage || !newMessage.trim()} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition">→</button>
                                            </div>
                                        )}
                                        {verification.status === 'rejected' && (
                                            <button onClick={() => { setShowVerificationForm(true); setVerification(null); }} className="mt-2 text-sm font-bold hover:opacity-70 transition" style={{ color: 'var(--accent)' }}>Подати нову заявку →</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {user.role === 'volonteer' && <VolonteerChat />}

                        {gamification.badges.length > 0 && (
                            <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">🏆 Мої досягнення</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {gamification.badges.map((badge) => (
                                        <div key={badge.key} className="bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)] flex items-center gap-3 hover:border-gray-400 transition">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">🎨 Кастомізація картки</h2>
                                <BadgeCustomizer badges={gamification.badges} profile={gamification.profile} onSave={handleCustomizationSave} />
                            </div>
                            <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">🪪 Картка донора</h2>
                                <DonorCard ref={cardRef} userName={user.name || user.email} avatarUrl={avatarUrl} profile={gamification.profile} badges={gamification.badges} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}