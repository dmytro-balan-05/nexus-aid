'use client';

import { useEffect, useState, useRef, useCallback, ChangeEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
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
    quote: string | null;
}

interface GamificationData {
    profile: DonorProfile | null;
    badges: Badge[];
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

export default function ProfilePage() {
    const { user, isLoading, logout, refreshProfile } = useAuth();
    const router = useRouter();
    const cardRef = useRef<DonorCardRef>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [newName, setNewName] = useState('');
    const [newAvatar, setNewAvatar] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [gamification, setGamification] = useState<GamificationData>({ profile: null, badges: [] });

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

    useEffect(() => {
        if (user) {
            api.get<GamificationData>('/gamification/me').then((data) => {
                if (data) setGamification(data);
            });

            fetch('/api/verification/me', { credentials: 'include' })
                .then((r) => r.ok ? r.json() : null)
                .then((data) => {
                    setVerification(data);
                    setVerificationLoaded(true);
                })
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
            await api.patch('/users/me', { name: newName, avatar: newAvatar });
            await refreshProfile();
            setIsEditing(false);
            setMessage('Профіль успішно оновлено!');
            setTimeout(() => setMessage(''), 3000);
        } catch {
            alert('Помилка оновлення');
        }
    };

    const handleCustomizationSave = useCallback(async (data: {
        selectedFrame?: string;
        selectedBackground?: string;
        selectedFont?: string;
        quote?: string;
    }) => {
        await api.patch('/gamification/me/customization', data);
        const updated = await api.get<GamificationData>('/gamification/me');
        if (updated) {
            setGamification(updated);
            setTimeout(() => cardRef.current?.generate(), 100);
        }
    }, []);

    const handleVerificationSubmit = async () => {
        if (!verificationForm.about || !verificationForm.experience) {
            alert('Заповніть всі обовʼязкові поля');
            return;
        }

        setIsSubmittingVerification(true);
        try {
            const data = new FormData();
            data.append('about', verificationForm.about);
            data.append('experience', verificationForm.experience);
            if (verificationForm.socialLinks) data.append('socialLinks', verificationForm.socialLinks);
            verificationFiles.forEach((f) => data.append('documents', f));

            const res = await fetch('/api/verification', {
                method: 'POST',
                body: data,
                credentials: 'include',
            });

            if (!res.ok) throw new Error(await res.text());

            const result = await res.json();
            setVerification(result);
            setShowVerificationForm(false);
        } catch (e: any) {
            alert(e.message || 'Помилка');
        } finally {
            setIsSubmittingVerification(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !verification) return;
        setIsSendingMessage(true);
        try {
            const res = await fetch(`/api/verification/${verification.id}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ text: newMessage }),
            });

            if (!res.ok) throw new Error();
            const msg = await res.json();
            setVerification((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
            setNewMessage('');
        } catch {
            alert('Помилка відправки');
        } finally {
            setIsSendingMessage(false);
        }
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-400 text-sm">Завантаження...</div>
            </div>
        );
    }

    const avatarUrl = user.avatar
        ? user.avatar
        : `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=random&size=128`;

    return (
        <div className="min-h-screen bg-gray-50 text-black">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

                {/* Шапка профілю */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-gray-900 to-gray-700" />
                    <div className="px-6 pb-6">
                        <div className="flex items-end justify-between -mt-12 mb-4">
                            <img
                                src={avatarUrl}
                                alt="Avatar"
                                className="w-20 h-20 rounded-2xl border-4 border-white object-cover shadow-md"
                            />
                            <button
                                onClick={logout}
                                className="text-sm text-red-500 hover:text-red-700 font-medium transition mb-2"
                            >
                                Вийти →
                            </button>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap mb-1">
                            <h1 className="text-2xl font-extrabold text-gray-900">{user.name || 'Без імені'}</h1>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                user.role === 'admin'     ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'volonteer' ? 'bg-orange-100 text-orange-800' :
                                        'bg-blue-100 text-blue-800'
                            }`}>
                                {user.role}
                            </span>
                            {gamification.profile && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[gamification.profile.level]}`}>
                                    {LEVEL_LABELS[gamification.profile.level]}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-400 text-sm">{user.email}</p>

                        {gamification.profile && (
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                                    <div className="text-xl font-black text-gray-900">{gamification.profile.totalAmount.toLocaleString()} ₴</div>
                                    <div className="text-xs text-gray-400 mt-0.5">задоначено</div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                                    <div className="text-xl font-black text-gray-900">{gamification.profile.donationCount}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">донатів</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {message && (
                    <div className="p-3 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm font-bold">
                        {message}
                    </div>
                )}

                {/* Редагування */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Редагування профілю</h2>
                    {isEditing ? (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Імʼя</label>
                                <input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="border border-gray-300 p-2.5 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="Введіть імʼя"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">URL Аватарки</label>
                                <input
                                    value={newAvatar}
                                    onChange={(e) => setNewAvatar(e.target.value)}
                                    className="border border-gray-300 p-2.5 rounded-xl w-full focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="https://example.com/image.png"
                                />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button onClick={handleUpdate} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition">
                                    Зберегти
                                </button>
                                <button onClick={() => setIsEditing(false)} className="border border-gray-300 px-4 py-2 rounded-xl text-sm font-bold hover:border-black transition">
                                    Скасувати
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Поточне імʼя</div>
                                <div className="text-lg font-bold text-gray-900">{user.name || 'Не вказано'}</div>
                            </div>
                            <button onClick={startEditing} className="text-sm text-blue-600 font-bold hover:text-blue-800 transition">
                                Редагувати →
                            </button>
                        </div>
                    )}
                </div>

                {/* Верифікація */}
                {user.role !== 'admin' && user.role !== 'volonteer' && verificationLoaded && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">🔐 Верифікація волонтера</h2>
                        <p className="text-sm text-gray-400 mb-4">Пройдіть верифікацію щоб створювати збори</p>

                        {!verification && !showVerificationForm && (
                            <button
                                onClick={() => setShowVerificationForm(true)}
                                className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition"
                            >
                                Подати заявку
                            </button>
                        )}

                        {showVerificationForm && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Про себе *</label>
                                    <textarea
                                        rows={3}
                                        value={verificationForm.about}
                                        onChange={(e) => setVerificationForm((p) => ({ ...p, about: e.target.value }))}
                                        className="border border-gray-300 p-2.5 rounded-xl w-full focus:ring-2 focus:ring-black outline-none text-sm resize-none"
                                        placeholder="Розкажіть хто ви і чим займаєтесь..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Досвід волонтерства *</label>
                                    <textarea
                                        rows={3}
                                        value={verificationForm.experience}
                                        onChange={(e) => setVerificationForm((p) => ({ ...p, experience: e.target.value }))}
                                        className="border border-gray-300 p-2.5 rounded-xl w-full focus:ring-2 focus:ring-black outline-none text-sm resize-none"
                                        placeholder="Опишіть ваш досвід..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Соцмережі</label>
                                    <input
                                        value={verificationForm.socialLinks}
                                        onChange={(e) => setVerificationForm((p) => ({ ...p, socialLinks: e.target.value }))}
                                        className="border border-gray-300 p-2.5 rounded-xl w-full focus:ring-2 focus:ring-black outline-none text-sm"
                                        placeholder="Instagram, Facebook, Telegram..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Документи</label>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                            if (e.target.files) setVerificationFiles(Array.from(e.target.files));
                                        }}
                                        className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:bg-black file:text-white file:text-xs cursor-pointer"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleVerificationSubmit}
                                        disabled={isSubmittingVerification}
                                        className="bg-black text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition"
                                    >
                                        {isSubmittingVerification ? 'Відправка...' : 'Відправити заявку'}
                                    </button>
                                    <button
                                        onClick={() => setShowVerificationForm(false)}
                                        className="border border-gray-300 px-5 py-2 rounded-xl text-sm font-bold hover:border-black transition"
                                    >
                                        Скасувати
                                    </button>
                                </div>
                            </div>
                        )}

                        {verification && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_CONFIG[verification.status].color}`}>
                                        {STATUS_CONFIG[verification.status].icon} {STATUS_CONFIG[verification.status].label}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(verification.createdAt).toLocaleDateString('uk-UA')}
                                    </span>
                                </div>

                                {(verification.messages?.length ?? 0) > 0 && (
                                    <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
                                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                                            <p className="text-xs font-bold text-gray-500 uppercase">Діалог з адміном</p>
                                        </div>
                                        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                                            {verification.messages.map((msg) => (
                                                <div key={msg.id} className={`flex gap-2 ${msg.isAdmin ? '' : 'flex-row-reverse'}`}>
                                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                        {msg.sender.name?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${
                                                        msg.isAdmin
                                                            ? 'bg-gray-100 text-gray-900'
                                                            : 'bg-black text-white'
                                                    }`}>
                                                        {msg.text}
                                                        <div className={`text-xs mt-1 ${msg.isAdmin ? 'text-gray-400' : 'text-gray-300'}`}>
                                                            {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>
                                )}

                                {verification.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                            placeholder="Написати адміну..."
                                            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={isSendingMessage || !newMessage.trim()}
                                            className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition"
                                        >
                                            →
                                        </button>
                                    </div>
                                )}

                                {verification.status === 'rejected' && (
                                    <button
                                        onClick={() => { setShowVerificationForm(true); setVerification(null); }}
                                        className="mt-2 text-sm text-blue-600 font-bold hover:text-blue-800 transition"
                                    >
                                        Подати нову заявку →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {user.role === 'volonteer' && <VolonteerChat />}
                {/* Досягнення */}
                {gamification.badges.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">🏆 Мої досягнення</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {gamification.badges.map((badge) => (
                                <div key={badge.key} className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3 hover:border-gray-300 transition">
                                    <span className="text-2xl">{badge.icon}</span>
                                    <div>
                                        <div className="font-bold text-sm text-gray-900">{badge.name}</div>
                                        <div className="text-xs text-gray-400">{badge.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Кастомізація + Картка */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">🎨 Кастомізація картки</h2>
                        <BadgeCustomizer
                            badges={gamification.badges}
                            profile={gamification.profile}
                            onSave={handleCustomizationSave}
                        />
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">🪪 Картка донора</h2>
                        <DonorCard
                            ref={cardRef}
                            userName={user.name || user.email}
                            avatarUrl={avatarUrl}
                            profile={gamification.profile}
                            badges={gamification.badges}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}