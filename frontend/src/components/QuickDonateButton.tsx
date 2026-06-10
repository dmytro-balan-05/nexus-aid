'use client';

import { useState, useEffect } from 'react';
import DonateButton from './DonateButton';
import { useTheme } from '@/context/ThemeContext';

interface Campaign {
    id: string;
    title: string;
    category: string;
    isUrgent: boolean;
}

interface UrgentItem {
    category: string;
    campaign: Campaign;
}

interface Props {
    compact?: boolean;
}

const CATEGORIES = [
    { value: 'military',     label: '🎖️ Військові' },
    { value: 'medical',      label: '🏥 Медичні' },
    { value: 'humanitarian', label: '🤝 Гуманітарні' },
];

export default function QuickDonateButton({ compact = false }: Props) {
    const { isDark } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [urgent, setUrgent] = useState<UrgentItem[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [isLoadingRandom, setIsLoadingRandom] = useState(false);

    useEffect(() => {
        fetch('/api/campaigns/urgent').then((r) => r.json()).then(setUrgent).catch(() => {});
    }, []);

    const handleCategoryPick = async (category: string) => {
        setIsLoadingRandom(true);
        try {
            const res = await fetch(`/api/campaigns/random?category=${category}`);
            if (!res.ok) throw new Error();
            const text = await res.text();
            if (!text) { alert('У цій категорії поки немає зборів'); return; }
            const data = JSON.parse(text);
            if (data) setSelectedCampaign(data);
            else alert('У цій категорії поки немає зборів');
        } catch {
            alert('У цій категорії поки немає зборів');
        } finally {
            setIsLoadingRandom(false);
        }
    };

    const reset = () => { setSelectedCampaign(null); setIsOpen(false); };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                style={{ backgroundColor: 'var(--accent)' }}
                className={compact
                    ? "text-white px-3 py-1.5 rounded-lg font-bold text-sm transition flex items-center gap-1.5 hover:opacity-90"
                    : "text-white px-8 py-3 rounded-xl font-bold transition hover:opacity-90 flex items-center gap-2"
                }
            >
                <span>{isDark ? '🔥' : '⚡'}</span>
                Швидкий донат
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[var(--border)]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">{isDark ? '🔥' : '⚡'} Швидкий донат</h2>
                            <button onClick={reset} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl">×</button>
                        </div>

                        {selectedCampaign ? (
                            <div>
                                <div className="bg-[var(--bg-secondary)] rounded-xl p-3 mb-4 border border-[var(--border)]">
                                    <p className="text-xs text-[var(--text-secondary)] mb-1">Обраний збір:</p>
                                    <p className="font-bold text-[var(--text-primary)]">{selectedCampaign.title}</p>
                                    {selectedCampaign.isUrgent && <span className="text-xs text-orange-500 font-bold">🔥 Терміновий</span>}
                                </div>
                                <DonateButton campaignId={selectedCampaign.id} campaignTitle={selectedCampaign.title} />
                                <button onClick={() => setSelectedCampaign(null)} className="w-full mt-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">← Обрати інший</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {urgent.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-orange-500 uppercase mb-2">🔥 Термінові збори</p>
                                        <div className="space-y-2">
                                            {urgent.map(({ category, campaign }) => (
                                                <button key={campaign.id} onClick={() => setSelectedCampaign(campaign)} className="w-full text-left bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-xl p-3 hover:bg-orange-100 dark:hover:bg-orange-900 transition">
                                                    <p className="font-bold text-sm text-[var(--text-primary)] truncate">{campaign.title}</p>
                                                    <p className="text-xs text-orange-500">{category}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
                                        {urgent.length > 0 ? 'Або оберіть категорію' : 'Оберіть категорію'}
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {CATEGORIES.map((cat) => (
                                            <button key={cat.value} onClick={() => handleCategoryPick(cat.value)} disabled={isLoadingRandom} className="p-3 rounded-xl border border-[var(--border)] hover:border-[var(--text-primary)] text-center transition disabled:opacity-50 bg-[var(--bg-secondary)]">
                                                <span className="text-xl block mb-1">{cat.label.split(' ')[0]}</span>
                                                <span className="text-xs text-[var(--text-secondary)]">{cat.label.split(' ').slice(1).join(' ')}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}