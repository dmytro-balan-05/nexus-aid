'use client';

import { useEffect, useState } from 'react';

interface Badge {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlocksFrame: string | null;
    unlocksBackground: string | null;
    unlocksFont: string | null;
}

const EMPTY_BADGE = {
    key: '',
    name: '',
    description: '',
    icon: '',
    category: 'general',
    unlocksFrame: '',
    unlocksBackground: '',
    unlocksFont: '',
};

const CATEGORIES = ['general', 'military', 'medical', 'humanitarian'];
const FONTS = ['', 'font_default', 'font_bold', 'font_elegant', 'font_military'];
const FRAMES = [
    '', 'frame_simple', 'frame_double', 'frame_square', 'frame_star',
    'frame_drone', 'frame_wings', 'frame_shield', 'frame_cross',
    'frame_medic', 'frame_ambulance', 'frame_hands', 'frame_heart',
    'frame_pillar', 'frame_diamond', 'frame_crown',
];

export default function AdminBadgesPage() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState(EMPTY_BADGE);
    const [isSaving, setIsSaving] = useState(false);
    const [bgPreview, setBgPreview] = useState('');

    const fetchBadges = async () => {
        const res = await fetch('/api/gamification/badges', { credentials: 'include' });
        setBadges(await res.json());
    };

    useEffect(() => { fetchBadges(); }, []);

    const openCreate = () => {
        setForm(EMPTY_BADGE);
        setBgPreview('');
        setEditingBadge(null);
        setIsCreating(true);
    };

    const openEdit = (badge: Badge) => {
        setForm({
            key:               badge.key,
            name:              badge.name,
            description:       badge.description,
            icon:              badge.icon,
            category:          badge.category,
            unlocksFrame:      badge.unlocksFrame      || '',
            unlocksBackground: badge.unlocksBackground || '',
            unlocksFont:       badge.unlocksFont       || '',
        });
        setBgPreview(badge.unlocksBackground || '');
        setEditingBadge(badge);
        setIsCreating(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                ...form,
                unlocksFrame:      form.unlocksFrame      || null,
                unlocksBackground: form.unlocksBackground || null,
                unlocksFont:       form.unlocksFont       || null,
            };

            const res = editingBadge
                ? await fetch(`/api/gamification/admin/badges/${editingBadge.key}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                })
                : await fetch('/api/gamification/admin/badges', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });

            if (!res.ok) throw new Error(await res.text());
            await fetchBadges();
            setIsCreating(false);
            setEditingBadge(null);
        } catch (e: any) {
            alert(e.message || 'Помилка збереження');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (key: string) => {
        if (!confirm(`Видалити бейдж "${key}"?`)) return;
        await fetch(`/api/gamification/admin/badges/${key}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        await fetchBadges();
    };

    const CATEGORY_COLORS: Record<string, string> = {
        general:      'bg-gray-100 text-gray-700',
        military:     'bg-blue-100 text-blue-700',
        medical:      'bg-red-100 text-red-700',
        humanitarian: 'bg-green-100 text-green-700',
    };

    return (
        <div className="pb-10">
            <div className="flex justify-between items-center mb-6">
                <p className="text-gray-500 text-sm">{badges.length} бейджів у системі</p>
                <button
                    onClick={openCreate}
                    className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition"
                >
                    + Новий бейдж
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badges.map((badge) => (
                    <div key={badge.key} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                        <span className="text-3xl">{badge.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900">{badge.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${CATEGORY_COLORS[badge.category] || 'bg-gray-100'}`}>
                                    {badge.category}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{badge.description}</p>
                            <div className="flex flex-wrap gap-1">
                                {badge.unlocksBackground && (
                                    <span className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                                        <span
                                            className="w-3 h-3 rounded-full inline-block border border-gray-300"
                                            style={{
                                                backgroundColor: badge.unlocksBackground.startsWith('#') ? badge.unlocksBackground : undefined,
                                                backgroundImage: badge.unlocksBackground.startsWith('http') ? `url(${badge.unlocksBackground})` : undefined,
                                                backgroundSize: 'cover',
                                            }}
                                        />
                                        Фон
                                    </span>
                                )}
                                {badge.unlocksFrame && (
                                    <span className="text-xs bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                                        🖼 {badge.unlocksFrame}
                                    </span>
                                )}
                                {badge.unlocksFont && (
                                    <span className="text-xs bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                                        🔤 {badge.unlocksFont}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => openEdit(badge)}
                                className="text-xs border border-gray-200 px-2 py-1 rounded hover:border-black transition"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={() => handleDelete(badge.key)}
                                className="text-xs border border-red-200 text-red-500 px-2 py-1 rounded hover:bg-red-50 transition"
                            >
                                🗑
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">
                                {editingBadge ? 'Редагувати бейдж' : 'Новий бейдж'}
                            </h2>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-black text-2xl">×</button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Key (унікальний)</label>
                                    <input
                                        value={form.key}
                                        onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                                        disabled={!!editingBadge}
                                        className="border border-gray-300 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-black outline-none disabled:bg-gray-50"
                                        placeholder="my_badge_key"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Іконка (емодзі)</label>
                                    <input
                                        value={form.icon}
                                        onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                                        className="border border-gray-300 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-black outline-none text-2xl"
                                        placeholder="🏅"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Назва</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    className="border border-gray-300 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-black outline-none"
                                    placeholder="Назва бейджу"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Опис</label>
                                <input
                                    value={form.description}
                                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                    className="border border-gray-300 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-black outline-none"
                                    placeholder="Умова отримання"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Категорія</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                                    className="border border-gray-300 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-black outline-none"
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-3">Що розблоковує</p>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                                            Фон картки (hex або URL зображення)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                value={form.unlocksBackground}
                                                onChange={(e) => {
                                                    setForm((p) => ({ ...p, unlocksBackground: e.target.value }));
                                                    setBgPreview(e.target.value);
                                                }}
                                                className="border border-gray-300 rounded-lg p-2 flex-1 text-sm focus:ring-2 focus:ring-black outline-none"
                                                placeholder="#1a1a2e або https://..."
                                            />
                                            {bgPreview && (
                                                <div
                                                    className="w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0"
                                                    style={{
                                                        backgroundColor: bgPreview.startsWith('#') ? bgPreview : undefined,
                                                        backgroundImage: bgPreview.startsWith('http') ? `url(${bgPreview})` : undefined,
                                                        backgroundSize: 'cover',
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Для зображення — вкажи пряме посилання на PNG/JPG
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Рамка аватара</label>
                                        <select
                                            value={form.unlocksFrame}
                                            onChange={(e) => setForm((p) => ({ ...p, unlocksFrame: e.target.value }))}
                                            className="border border-gray-300 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-black outline-none"
                                        >
                                            {FRAMES.map((f) => (
                                                <option key={f} value={f}>{f || '— без рамки —'}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Шрифт</label>
                                        <select
                                            value={form.unlocksFont}
                                            onChange={(e) => setForm((p) => ({ ...p, unlocksFont: e.target.value }))}
                                            className="border border-gray-300 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-black outline-none"
                                        >
                                            {FONTS.map((f) => (
                                                <option key={f} value={f}>{f || '— без шрифту —'}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl text-sm font-bold hover:border-black transition"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !form.key || !form.name || !form.icon}
                                className="flex-1 bg-black text-white py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition"
                            >
                                {isSaving ? 'Збереження...' : editingBadge ? 'Зберегти зміни' : 'Створити'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}