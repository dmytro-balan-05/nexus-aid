'use client';

import { useState, useEffect, useRef } from 'react';

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
    selectedFrame: string | null;
    selectedBackground: string | null;
    selectedFont: string | null;
    quote: string | null;
}

interface Props {
    badges: Badge[];
    profile: DonorProfile | null;
    onSave: (data: {
        selectedFrame?: string;
        selectedBackground?: string;
        selectedFont?: string;
        quote?: string;
    }) => Promise<void>;
}

const FONT_CONFIG: Record<string, { label: string; preview: string; style: React.CSSProperties }> = {
    font_default:  { label: 'Default',  preview: 'Звичайний текст',   style: { fontFamily: 'Arial, sans-serif' } },
    font_bold:     { label: 'Serif',    preview: 'Класичний стиль',   style: { fontFamily: 'Georgia, serif' } },
    font_elegant:  { label: 'Elegant',  preview: 'Елегантний вигляд', style: { fontFamily: 'Palatino, serif', fontStyle: 'italic' } },
    font_military: { label: 'Military', preview: 'Чіткий і строгий',  style: { fontFamily: 'Courier New, monospace' } },
};

const FRAME_CONFIG: Record<string, { label: string; preview: string }> = {
    frame_simple:    { label: 'Звичайна',  preview: '○' },
    frame_double:    { label: 'Подвійна',  preview: '◎' },
    frame_square:    { label: 'Квадратна', preview: '□' },
    frame_star:      { label: 'Зіркова',   preview: '✦' },
    frame_drone:     { label: 'Дрон',      preview: '🚁' },
    frame_wings:     { label: 'Крила',     preview: '✈️' },
    frame_shield:    { label: 'Щит',       preview: '🛡️' },
    frame_cross:     { label: 'Хрест',     preview: '➕' },
    frame_medic:     { label: 'Медик',     preview: '💉' },
    frame_ambulance: { label: 'Швидка',    preview: '🚑' },
    frame_hands:     { label: 'Руки',      preview: '🤝' },
    frame_heart:     { label: 'Серце',     preview: '❤️' },
    frame_pillar:    { label: 'Стовп',     preview: '🏛️' },
    frame_diamond:   { label: 'Діамант',   preview: '💎' },
    frame_crown:     { label: 'Корона',    preview: '👑' },
};

const RANDOM_QUOTES = [
    'Разом до перемоги 🇺🇦',
    'Кожна гривня рятує життя',
    'Підтримую своїх — завжди',
    'Україна понад усе',
    'Донатю, бо це важливо',
    'Ми не мовчимо — ми діємо',
    'Сила в єдності',
    'Наші захисники потребують нас',
    'Небо буде нашим',
    'Перемога буде за нами',
];

export default function BadgeCustomizer({ badges, profile, onSave }: Props) {
    const [selected, setSelected] = useState({
        selectedFrame:      profile?.selectedFrame      || '',
        selectedBackground: profile?.selectedBackground || '',
        selectedFont:       profile?.selectedFont       || '',
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
                    quote:              selected.quote              || undefined,
                });
                setStatus('saved');
                setTimeout(() => setStatus('idle'), 2000);
            } catch {
                setStatus('idle');
            }
        }, 600);
    }, [selected, onSave]);

    const handleRandomQuote = () => {
        const available = RANDOM_QUOTES.filter((q) => q !== selected.quote);
        setSelected((p) => ({ ...p, quote: available[Math.floor(Math.random() * available.length)] }));
    };

    if (badges.length === 0) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-dashed border-gray-300">
                <p className="text-gray-400 text-sm">Зроби перший донат щоб розблокувати кастомізацію</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between h-5">
                <p className="text-xs text-gray-400">Зміни зберігаються автоматично</p>
                {status === 'saving' && <p className="text-xs text-gray-400 animate-pulse">Збереження...</p>}
                {status === 'saved'  && <p className="text-xs text-green-600 font-bold">✓ Збережено</p>}
            </div>

            {unlockedBackgrounds.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Фон картки</p>
                    <div className="flex gap-2 flex-wrap items-center">
                        {unlockedBackgrounds.map((bg) => (
                            <button
                                key={bg}
                                onClick={() => setSelected((p) => ({ ...p, selectedBackground: bg }))}
                                title={bg}
                                className={`w-9 h-9 rounded-full border-2 transition hover:scale-110 ${
                                    selected.selectedBackground === bg
                                        ? 'border-black scale-110 shadow-md'
                                        : 'border-gray-200'
                                }`}
                                style={{
                                    backgroundColor: bg.startsWith('#') ? bg : undefined,
                                    backgroundImage: bg.startsWith('http') ? `url(${bg})` : undefined,
                                    backgroundSize: 'cover',
                                }}
                            />
                        ))}
                        {selected.selectedBackground && (
                            <button
                                onClick={() => setSelected((p) => ({ ...p, selectedBackground: '' }))}
                                className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 text-gray-400 text-xs hover:border-red-400 hover:text-red-400 transition"
                                title="Скинути"
                            >✕</button>
                        )}
                    </div>
                </div>
            )}

            {unlockedFrames.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Рамка аватара</p>
                    <div className="grid grid-cols-4 gap-2">
                        {unlockedFrames.map((frame) => {
                            const frameCfg = FRAME_CONFIG[frame] || { label: frame, preview: '○' };
                            return (
                                <button
                                    key={frame}
                                    onClick={() => setSelected((p) => ({ ...p, selectedFrame: frame }))}
                                    className={`p-2 rounded-lg border text-center transition ${
                                        selected.selectedFrame === frame
                                            ? 'border-black bg-black text-white'
                                            : 'border-gray-200 hover:border-black bg-white'
                                    }`}
                                >
                                    <span className="text-lg block">{frameCfg.preview}</span>
                                    <span className="text-xs">{frameCfg.label}</span>
                                </button>
                            );
                        })}
                        {selected.selectedFrame && (
                            <button
                                onClick={() => setSelected((p) => ({ ...p, selectedFrame: '' }))}
                                className="p-2 rounded-lg border border-dashed border-gray-300 text-gray-400 text-xs hover:border-red-400 hover:text-red-400 transition text-center"
                            >
                                <span className="text-lg block">✕</span>
                                <span>Скинути</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {unlockedFonts.length > 0 && (
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Шрифт</p>
                    <div className="flex flex-col gap-2">
                        {unlockedFonts.map((font) => {
                            const fontCfg = FONT_CONFIG[font] || { label: font, preview: font, style: {} };
                            return (
                                <button
                                    key={font}
                                    onClick={() => setSelected((p) => ({ ...p, selectedFont: font }))}
                                    className={`px-4 py-2 rounded-lg border text-left transition ${
                                        selected.selectedFont === font
                                            ? 'border-black bg-black text-white'
                                            : 'border-gray-200 hover:border-black bg-white'
                                    }`}
                                >
                                    <span className="text-xs font-bold uppercase tracking-wider block mb-0.5">
                                        {fontCfg.label}
                                    </span>
                                    <span
                                        style={selected.selectedFont === font ? { ...fontCfg.style, color: '#fff' } : fontCfg.style}
                                        className="text-sm"
                                    >
                                        {fontCfg.preview}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Цитата на картці</p>
                <div className="relative">
                    <textarea
                        value={selected.quote}
                        onChange={(e) => setSelected((p) => ({ ...p, quote: e.target.value }))}
                        placeholder="Введіть свою цитату..."
                        maxLength={80}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg p-3 pr-24 text-sm focus:ring-2 focus:ring-black outline-none resize-none"
                    />
                    <button
                        onClick={handleRandomQuote}
                        className="absolute right-2 top-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition"
                    >
                        🎲 Випадкова
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">{selected.quote.length}/80 символів</p>
            </div>
        </div>
    );
}