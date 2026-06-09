'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DonorCard, { DonorCardRef } from '@/components/DonorCard';
import BadgeCustomizer from '@/components/BadgeCustomizer';

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

export default function ProfilePage() {
    const { user, isLoading, logout, refreshProfile } = useAuth();
    const router = useRouter();
    const cardRef = useRef<DonorCardRef>(null);

    const [newName, setNewName] = useState('');
    const [newAvatar, setNewAvatar] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [gamification, setGamification] = useState<GamificationData>({ profile: null, badges: [] });

    useEffect(() => {
        if (!isLoading && !user) router.push('/login');
    }, [user, isLoading, router]);

    useEffect(() => {
        if (user) {
            api.get<GamificationData>('/gamification/me').then((data) => {
                if (data) setGamification(data);
            });
        }
    }, [user]);

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

    if (isLoading || !user) {
        return <div className="p-10 text-center">Завантаження профілю...</div>;
    }

    const avatarUrl = user.avatar
        ? user.avatar
        : `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=random&size=128`;

    const LEVEL_LABELS = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };
    const LEVEL_COLORS = {
        bronze:   'bg-orange-100 text-orange-800',
        silver:   'bg-gray-100 text-gray-800',
        gold:     'bg-yellow-100 text-yellow-800',
        platinum: 'bg-purple-100 text-purple-800',
    };

    return (
        <div className="min-h-screen p-8 bg-gray-100 text-black">
            <div className="max-w-4xl mx-auto space-y-6">

                <div className="bg-white rounded-2xl shadow-md p-6">
                    <div className="flex justify-between items-start mb-6 border-b pb-4">
                        <div className="flex items-center gap-4">
                            <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-gray-200 object-cover" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Мій Профіль</h1>
                                <p className="text-gray-500 text-sm">{user.email}</p>
                                {gamification.profile && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${LEVEL_COLORS[gamification.profile.level]}`}>
                                        {LEVEL_LABELS[gamification.profile.level]}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition text-sm">
                            Вийти
                        </button>
                    </div>

                    {message && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-200">{message}</div>
                    )}

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">ID</label>
                                <div className="font-mono text-xs bg-gray-50 p-2 rounded border truncate" title={user.id}>{user.id}</div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Роль</label>
                                <div className="mt-1">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        user.role === 'admin'     ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'volonteer' ? 'bg-orange-100 text-orange-800' :
                                                'bg-blue-100 text-blue-800'
                                    }`}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Провайдер</label>
                            <div className="text-sm text-gray-600">{user.provider}</div>
                        </div>

                        <div className="pt-4 border-t mt-4">
                            <h3 className="text-lg font-semibold mb-4">Редагування даних</h3>
                            {isEditing ? (
                                <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded border">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Імʼя</label>
                                        <input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="border p-2 rounded w-full border-blue-500 ring-1 ring-blue-500"
                                            placeholder="Введіть імʼя"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">URL Аватарки</label>
                                        <input
                                            value={newAvatar}
                                            onChange={(e) => setNewAvatar(e.target.value)}
                                            className="border p-2 rounded w-full border-blue-500 ring-1 ring-blue-500 text-sm"
                                            placeholder="https://example.com/image.png"
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={handleUpdate} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                            Зберегти зміни
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
                                            Скасувати
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center group bg-gray-50 p-3 rounded border hover:border-blue-300 transition">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block">Імʼя</label>
                                        <span className="text-xl font-medium">{user.name || 'Не вказано'}</span>
                                    </div>
                                    <button onClick={startEditing} className="text-blue-600 underline text-sm font-bold px-3 py-1 rounded hover:bg-blue-50">
                                        Редагувати профіль
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {gamification.badges.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">🏆 Мої досягнення</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {gamification.badges.map((badge) => (
                                <div key={badge.key} className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex items-center gap-3">
                                    <span className="text-2xl">{badge.icon}</span>
                                    <div>
                                        <div className="font-bold text-sm text-gray-900">{badge.name}</div>
                                        <div className="text-xs text-gray-500">{badge.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">🎨 Кастомізація картки</h2>
                        <BadgeCustomizer
                            badges={gamification.badges}
                            profile={gamification.profile}
                            onSave={handleCustomizationSave}
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">🪪 Картка донора</h2>
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