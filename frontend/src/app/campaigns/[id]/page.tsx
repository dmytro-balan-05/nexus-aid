import { notFound } from 'next/navigation';
import Link from 'next/link';
import EditButton from '@/components/EditButton';
import DonateButton from '@/components/DonateButton';

const BACKEND_URL = 'https://nexus-aid-production.up.railway.app';

interface Campaign {
    id: string;
    title: string;
    shortDescription: string;
    fullDescription: string;
    goalAmount: number;
    currentAmount: number;
    category: string;
    status: string;
    location: string;
    beneficiary: string;
    images: string[];
    documents: string[];
    author: { id: string; name: string; email: string; };
}

async function getCampaign(id: string): Promise<Campaign> {
    const res = await fetch(`${BACKEND_URL}/campaigns/${id}`, { cache: 'no-store' });
    if (!res.ok) { if (res.status === 404) return notFound(); throw new Error('Failed to fetch campaign'); }
    return res.json();
}

const CATEGORY_LABELS: Record<string, string> = {
    military: 'Військові', medical: 'Медичні', humanitarian: 'Гуманітарні', general: 'Загальні',
};

const STATUS_LABELS: Record<string, string> = {
    active: 'Активний', completed: 'Завершено', pending: 'На розгляді',
};

type Props = { params: Promise<{ id: string }> };

export default async function CampaignDetailPage({ params }: Props) {
    const { id } = await params;
    let campaign: Campaign;
    try { campaign = await getCampaign(id); } catch { return notFound(); }

    const percent = Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100);
    const mainImage = campaign.images?.[0] || 'https://placehold.co/800x400/png?text=NexusAid';

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)]">
            <div className="container mx-auto p-6 max-w-5xl">
                <Link href="/campaigns" className="text-[var(--text-secondary)] mb-6 inline-block hover:text-[var(--text-primary)] transition">
                    ← Назад до списку
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)]">
                            <img src={mainImage} alt={campaign.title} className="w-full h-auto object-cover" />
                        </div>

                        <div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {CATEGORY_LABELS[campaign.category] || campaign.category}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                    campaign.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                                }`}>
                                    {STATUS_LABELS[campaign.status] || campaign.status}
                                </span>
                            </div>

                            <h1 className="text-4xl font-extrabold text-[var(--text-primary)] mb-4 leading-tight">{campaign.title}</h1>

                            <div className="flex items-center gap-4 text-[var(--text-secondary)] text-sm mb-8 pb-8 border-b border-[var(--border)]">
                                <div className="flex items-center gap-1">📍 {campaign.location}</div>
                                <div className="flex items-center gap-1">👤 Бенефіціар: {campaign.beneficiary}</div>
                            </div>

                            <div className="text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
                                {campaign.fullDescription}
                            </div>
                        </div>

                        {campaign.documents && campaign.documents.length > 0 && (
                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] mt-8">
                                <h3 className="font-bold text-lg text-[var(--text-primary)] mb-4">📄 Документи та звітність</h3>
                                <ul className="space-y-2">
                                    {campaign.documents.map((doc, index) => {
                                        const cleanDocPath = doc.startsWith('/') ? doc.substring(1) : doc;
                                        const fullDocUrl = doc.startsWith('http') ? doc : `${BACKEND_URL}/${cleanDocPath}`;
                                        return (
                                            <li key={index}>
                                                <a href={fullDocUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                                                    📎 Переглянути документ {index + 1}
                                                </a>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm sticky top-6">
                            <div className="mb-6">
                                <div className="flex justify-between text-lg font-bold mb-2">
                                    <span style={{ color: 'var(--accent)' }}>{campaign.currentAmount.toLocaleString()} ₴</span>
                                    <span className="text-[var(--text-secondary)]">{campaign.goalAmount.toLocaleString()} ₴</span>
                                </div>
                                <div className="w-full bg-[var(--bg-secondary)] rounded-full h-3 overflow-hidden">
                                    <div className="h-3 rounded-full" style={{ width: `${percent}%`, backgroundColor: 'var(--accent)' }} />
                                </div>
                                <p className="text-right text-xs text-[var(--text-secondary)] mt-2">зібрано від цілі</p>
                            </div>

                            <DonateButton campaignId={campaign.id} campaignTitle={campaign.title} />
                            <EditButton campaignId={campaign.id} authorId={campaign.author.id} />

                            <div className="mt-8 pt-6 border-t border-[var(--border)]">
                                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-3">Організатор збору</p>
                                <Link href={`/profile/${campaign.author.id}`} className="flex items-center gap-3 hover:bg-[var(--bg-secondary)] p-2 -mx-2 rounded-lg transition group">
                                    <div className="w-10 h-10 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center font-bold text-[var(--text-secondary)]">
                                        {campaign.author.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-[var(--text-primary)]">{campaign.author.name}</div>
                                        <div className="text-xs text-[var(--text-secondary)]">Перевірений волонтер</div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}