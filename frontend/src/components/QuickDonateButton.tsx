'use client';

import { useState, useEffect } from 'react';
import DonateButton from './DonateButton';

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
    const [isOpen, setIsOpen] = useState(false);
    const [urgent, setUrgent] = useState<UrgentItem[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [isLoadingRandom, setIsLoadingRandom] = useState(false);

    useEffect(() => {
        fetch('/api/campaigns/urgent')
            .then((r) => r.json())
            .then(setUrgent)
            .catch(() => {});
    }, []);

    const handleCategoryPick = async (category: string) => {
        setIsLoadingRandom(true);
        try {
            const res = await fetch(`/api/campaigns/random?category=${category}`);
            if (!res.ok) throw new Error();
            const text = await res.text();
            if (!text) {
                alert('У цій категорії поки немає зборів');
                return;
            }
            const data = JSON.parse(text);
            if (data) setSelectedCampaign(data);
            else alert('У цій категорії поки немає зборів');
        } catch {
            alert('У цій категорії поки немає зборів');
        } finally {
            setIsLoadingRandom(false);
        }
    };

    const reset = () => {
        setSelectedCampaign(null);
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={compact
                    ? "bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold text-sm transition flex items-center gap-1.5"
                    : "bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                }
            >
                <span>⚡</span>
                Швидкий донат
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">⚡ Швидкий донат</h2>
                            <button onClick={reset} className="text-gray-400 hover:text-black text-2xl">×</button>
                        </div>

                        {selectedCampaign ? (
                            <div>
                                <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Обраний збір:</p>
                                    <p className="font-bold text-gray-900">{selectedCampaign.title}</p>
                                    {selectedCampaign.isUrgent && (
                                        <span className="text-xs text-orange-600 font-bold">🔥 Терміновий</span>
                                    )}
                                </div>
                                <DonateButton campaignId={selectedCampaign.id} campaignTitle={selectedCampaign.title} />
                                <button
                                    onClick={() => setSelectedCampaign(null)}
                                    className="w-full mt-2 text-sm text-gray-400 hover:text-black transition"
                                >
                                    ← Обрати інший
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {urgent.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-orange-600 uppercase mb-2">🔥 Термінові збори</p>
                                        <div className="space-y-2">
                                            {urgent.map(({ category, campaign }) => (
                                                <button
                                                    key={campaign.id}
                                                    onClick={() => setSelectedCampaign(campaign)}
                                                    className="w-full text-left bg-orange-50 border border-orange-200 rounded-xl p-3 hover:bg-orange-100 transition"
                                                >
                                                    <p className="font-bold text-sm text-gray-900 truncate">{campaign.title}</p>
                                                    <p className="text-xs text-orange-600">{category}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                                        {urgent.length > 0 ? 'Або оберіть категорію' : 'Оберіть категорію'}
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.value}
                                                onClick={() => handleCategoryPick(cat.value)}
                                                disabled={isLoadingRandom}
                                                className="p-3 rounded-xl border border-gray-200 hover:border-blue-600 text-center transition disabled:opacity-50"
                                            >
                                                <span className="text-xl block mb-1">{cat.label.split(' ')[0]}</span>
                                                <span className="text-xs text-gray-600">{cat.label.split(' ').slice(1).join(' ')}</span>
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