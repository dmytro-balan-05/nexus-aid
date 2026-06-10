'use client';

import { useState, useEffect, useRef } from 'react';

interface Badge {
    id?: string;
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
    selectedFrame: string | null;
    selectedBackground: string | null;
    selectedFont: string | null;
    selectedBadgeId: string | null;
    quote: string | null;
}

interface Props {
    badges: Badge[];
    profile: DonorProfile | null;
    onSave: (data: {
        selectedFrame?: string;
        selectedBackground?: string;
        selectedFont?: string;
        selectedBadgeId?: string;
        quote?: string;
    }) => Promise<void>;
}

const FONT_CONFIG: Record<string, { label: string; preview: string; style: React.CSSProperties }> = {
    font_default:  { label: 'Default',  preview: 'Звичайний текст',   style: { fontFamily: 'Arial, sans-serif' } },
    font_bold:     { label: 'Serif',    preview: 'Класичний стиль',   style: { fontFamily: 'Georgia, serif' } },
    font_elegant:  { label: 'Elegant',  preview: 'Елегантний вигляд', style: { fontFamily: 'Palatino, serif', fontStyle: 'italic' } },
    font_military: { label: 'Military', preview: 'Чіткий і строгий',  style: { fontFamily: 'Courier New, monospace' } },
};

const FRAME_CONFIG: Record<string, { label: string; color: string; borderStyle?: string; borderRadius?: string }> = {
    frame_simple:    { label: 'Звичайна',   color: '#9ca3af' },
    frame_double:    { label: 'Подвійна',   color: '#6b7280', borderStyle: 'double' },
    frame_square:    { label: 'Квадратна',  color: '#374151', borderRadius: '4px' },
    frame_star:      { label: 'Зіркова',    color: '#facc15' },
    frame_drone:     { label: 'Дрон',       color: '#6366f1', borderRadius: '4px' },
    frame_wings:     { label: 'Крила',      color: '#8b5cf6' },
    frame_shield:    { label: 'Щит',        color: '#3b82f6' },
    frame_cross:     { label: 'Хрест',      color: '#f87171' },
    frame_medic:     { label: 'Медик',      color: '#ef4444' },
    frame_ambulance: { label: 'Швидка',     color: '#dc2626', borderRadius: '8px' },
    frame_hands:     { label: 'Руки',       color: '#22c55e', borderStyle: 'dashed' },
    frame_heart:     { label: 'Серце',      color: '#ec4899' },
    frame_pillar:    { label: 'Стовп',      color: '#78716c', borderRadius: '4px' },
    frame_diamond:   { label: 'Діамант',    color: '#22d3ee' },
    frame_crown:     { label: 'Корона',     color: '#f59e0b' },
    frame_coin:      { label: 'Монета',     color: '#fbbf24', borderStyle: 'double' },
    frame_fire:      { label: 'Вогонь',     color: '#f97316' },
    frame_explosion: { label: 'Вибух',      color: '#ef4444' },
    frame_stars:     { label: 'Зірки',      color: '#a3e635' },
    frame_medal:     { label: 'Медаль',     color: '#d97706', borderStyle: 'double' },
    frame_hero:      { label: 'Герой',      color: '#7c3aed', borderRadius: '12px' },
    frame_gold:      { label: 'Золото',     color: '#ca8a04', borderStyle: 'double' },
    frame_clover:    { label: 'Конюшина',   color: '#4ade80' },
    frame_mirror:    { label: 'Дзеркало',   color: '#94a3b8', borderStyle: 'dashed' },
    frame_week:      { label: 'Тиждень',    color: '#fb923c' },
    frame_podium:    { label: 'Подіум',     color: '#eab308' },
    frame_secret:    { label: '???',        color: '#7c3aed', borderStyle: 'dashed' },
    frame_emergency: { label: 'Екстрений',  color: '#dc2626', borderRadius: '4px' },
    frame_hourglass: { label: 'Пісочний',   color: '#78716c' },
    frame_seed:      { label: 'Зерно',      color: '#166534' },
    frame_megaphone: { label: 'Рупор',      color: '#9333ea', borderRadius: '6px' },
    frame_funded:    { label: 'Фінансовий', color: '#15803d' },
    frame_loyal:     { label: 'Вірний',     color: '#dc2626', borderStyle: 'double' },
    frame_marathon:  { label: 'Марафон',    color: '#1d4ed8' },
    frame_phantom:   { label: 'Привид',     color: '#e2e8f0', borderStyle: 'dashed' },
    frame_ukraine:   { label: 'Україна',    color: '#005BBB' },
    frame_sunflower: { label: 'Соняшник',   color: '#fbbf24' },
    frame_moon:      { label: 'Місяць',     color: '#818cf8' },
    frame_rainbow:   { label: 'Веселка',    color: '#f43f5e' },
    frame_butterfly: { label: 'Метелик',    color: '#c084fc' },
    frame_sparkle:   { label: 'Іскра',      color: '#fb7185' },
    frame_perfect:   { label: 'Ідеальна',   color: '#6366f1' },
    frame_elite:     { label: 'Еліта',      color: '#a855f7', borderRadius: '3px' },
    frame_trophy:    { label: 'Кубок',      color: '#f59e0b' },
    frame_champion:  { label: 'Чемпіон',    color: '#fbbf24', borderStyle: 'double' },
    frame_paint:     { label: 'Арт',        color: '#f472b6' },
    frame_check:     { label: 'Успіх',      color: '#16a34a' },
    frame_leaf:      { label: 'Листок',     color: '#16a34a' },
    frame_fashion:   { label: 'Стиль',      color: '#db2777', borderRadius: '16px' },
    frame_build:     { label: 'Архітектор', color: '#1e40af' },
};

const RANDOM_QUOTES = [
    'Разом до перемоги 🇺🇦', 'Кожна гривня рятує життя', 'Підтримую своїх — завжди',
    'Україна понад усе', 'Донатю, бо це важливо', 'Ми не мовчимо — ми діємо',
    'Сила в єдності', 'Наші захисники потребують нас', 'Небо буде нашим', 'Перемога буде за нами',
];

export default function BadgeCustomizer({ badges, profile, onSave }: Props) {
    const [selected, setSelected] = useState({
        selectedFrame:      profile?.selectedFrame      || '',
        selectedBackground: profile?.selectedBackground || '',
        selectedFont:       profile?.selectedFont       || '',
        selectedBadgeId:    profile?.selectedBadgeId    || '',
        quote:              profile?.quote              || '',
    });
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const isFirstRender = useRef(true);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const unlockedFrames      = [...new Set(badges.map((b) => b.unlocksFrame).filter(Boolean))]      as string[];
    const unlockedBackgrounds = [...new Set(badges.map((b) => b.unlocksBackground).filter(Boolean))] as string[];
    const unlockedFonts       = [...new Set(badges.map((b) => b.unlocksFont).filter(Boolean))]       as string[];

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(async () => {
            setStatus('saving');
            try {
                await onSave({
                    selectedFrame:      selected.selectedFrame      || undefined,
                    selectedBackground: selected.selectedBackground || undefined,
                    selectedFont:       selected.selectedFont       || undefined,
                    selectedBadgeId:    selected.selectedBadgeId    || undefined,
                    quote:              selected.quote              || undefined,
                });
                setStatus('saved');
                setTimeout(() => setStatus('idle'), 2000);
            } catch { setStatus('idle'); }
        }, 600);
    }, [selected, onSave]);

    if (badges.length === 0) {
        return (
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-dashed border-[var(--border)]">
                <p className="text-[var(--text-secondary)] text-sm">Зроби перший донат щоб розблокувати кастомізацію</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between h-5">
                <p className="text-xs text-[var(--text-secondary)]">Зміни зберігаються автоматично</p>
                {status === 'saving' && <p className="text-xs text-[var(--text-secondary)] animate-pulse">Збереження...</p>}
                {status === 'saved'  && <p className="text-xs text-green-500 font-bold">✓ Збережено</p>}
            </div>

            {unlockedBackgrounds.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Фон картки</p>
                    <div className="flex gap-2 flex-wrap items-center">
                        {unlockedBackgrounds.map((bg) => (
                            <button key={bg} onClick={() => setSelected((p) => ({ ...p, selectedBackground: bg }))} title={bg}
                                    className={`w-9 h-9 rounded-full border-2 transition hover:scale-110 ${selected.selectedBackground === bg ? 'border-black scale-110 shadow-md' : 'border-[var(--border)]'}`}
                                    style={{ background: bg.startsWith('#') ? bg : bg.startsWith('linear') ? bg : undefined, backgroundColor: !bg.startsWith('linear') && !bg.startsWith('http') ? bg : undefined }}
                            />
                        ))}
                        {selected.selectedBackground && (
                            <button onClick={() => setSelected((p) => ({ ...p, selectedBackground: '' }))} className="w-9 h-9 rounded-full border-2 border-dashed border-[var(--border)] text-[var(--text-secondary)] text-xs hover:border-red-400 hover:text-red-400 transition" title="Скинути">✕</button>
                        )}
                    </div>
                </div>
            )}

            {unlockedFrames.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Рамка аватара</p>
                    <div className="grid grid-cols-4 gap-2">
                        {unlockedFrames.map((frame) => {
                            const cfg = FRAME_CONFIG[frame] || { label: frame, color: '#9ca3af' };
                            const isSelected = selected.selectedFrame === frame;
                            return (
                                <button key={frame} onClick={() => setSelected((p) => ({ ...p, selectedFrame: frame }))}
                                        className={`p-2 rounded-lg border text-center transition ${isSelected ? 'border-black bg-gray-900' : 'border-[var(--border)] hover:border-[var(--text-secondary)] bg-[var(--bg-secondary)]'}`}
                                >
                                    <div className="flex items-center justify-center mb-1">
                                        <div className="w-7 h-7 bg-[var(--bg-card)]"
                                             style={{ border: `3px ${cfg.borderStyle || 'solid'} ${cfg.color}`, borderRadius: cfg.borderRadius || '50%', boxShadow: isSelected ? `0 0 8px ${cfg.color}` : 'none' }}
                                        />
                                    </div>
                                    <span className={`text-xs ${isSelected ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{cfg.label}</span>
                                </button>
                            );
                        })}
                        {selected.selectedFrame && (
                            <button onClick={() => setSelected((p) => ({ ...p, selectedFrame: '' }))} className="p-2 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-secondary)] text-xs hover:border-red-400 hover:text-red-400 transition text-center">
                                <span className="text-lg block">✕</span>
                                <span>Скинути</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {unlockedFonts.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Шрифт</p>
                    <div className="flex flex-col gap-2">
                        {unlockedFonts.map((font) => {
                            const fontCfg = FONT_CONFIG[font] || { label: font, preview: font, style: {} };
                            const isSelected = selected.selectedFont === font;
                            return (
                                <button key={font} onClick={() => setSelected((p) => ({ ...p, selectedFont: font }))}
                                        className={`px-4 py-2 rounded-lg border text-left transition ${isSelected ? 'border-black bg-black text-white' : 'border-[var(--border)] hover:border-[var(--text-primary)] bg-[var(--bg-secondary)]'}`}
                                >
                                    <span className="text-xs font-bold uppercase tracking-wider block mb-0.5" style={{ color: isSelected ? '#fff' : 'var(--text-secondary)' }}>{fontCfg.label}</span>
                                    <span style={{ ...fontCfg.style, color: isSelected ? '#fff' : 'var(--text-primary)' }} className="text-sm">{fontCfg.preview}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Головне досягнення на картці</p>
                <div className="grid grid-cols-3 gap-2">
                    {badges.map((badge) => {
                        const badgeId = badge.key;
                        const isSelected = selected.selectedBadgeId === badgeId;
                        return (
                            <button key={badge.key} onClick={() => setSelected((p) => ({ ...p, selectedBadgeId: isSelected ? '' : badgeId }))}
                                    className={`p-2 rounded-lg border text-center transition ${isSelected ? 'border-black bg-gray-900' : 'border-[var(--border)] hover:border-[var(--text-secondary)] bg-[var(--bg-secondary)]'}`}
                                    title={badge.description}
                            >
                                <span className="text-xl block">{badge.icon}</span>
                                <span className={`text-xs truncate block ${isSelected ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{badge.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Цитата на картці</p>
                <div className="relative">
                    <textarea
                        value={selected.quote}
                        onChange={(e) => setSelected((p) => ({ ...p, quote: e.target.value }))}
                        placeholder="Введіть свою цитату..."
                        maxLength={80} rows={2}
                        className="w-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg p-3 pr-24 text-sm focus:ring-2 focus:ring-black outline-none resize-none"
                    />
                    <button onClick={() => {
                        const available = RANDOM_QUOTES.filter((q) => q !== selected.quote);
                        setSelected((p) => ({ ...p, quote: available[Math.floor(Math.random() * available.length)] }));
                    }} className="absolute right-2 top-2 text-xs bg-[var(--bg-secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] px-2 py-1 rounded transition">
                        🎲 Випадкова
                    </button>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{selected.quote.length}/80 символів</p>
            </div>
        </div>
    );
}