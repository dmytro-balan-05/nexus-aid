import { notFound } from 'next/navigation';
import Link from 'next/link';
import EditButton from '@/components/EditButton';

// Інтерфейс даних
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
    author: {
        id: string;
        name: string;
        email: string;
    };
}

async function getCampaign(id: string): Promise<Campaign> {
    const res = await fetch(`http://localhost:3000/campaigns/${id}`, { cache: 'no-store' });
    if (!res.ok) {
        if (res.status === 404) return notFound();
        throw new Error('Failed to fetch campaign');
    }
    return res.json();
}

type Props = {
    params: Promise<{ id: string }>;
};

export default async function CampaignDetailPage({ params }: Props) {
    const { id } = await params;
    let campaign: Campaign;

    try {
        campaign = await getCampaign(id);
    } catch (err) {
        return notFound();
    }

    const percent = Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100);
    const mainImage = (campaign.images && campaign.images.length > 0)
        ? campaign.images[0]
        : 'https://placehold.co/800x400/png?text=NexusAid';

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <Link href="/campaigns" className="text-gray-500 mb-6 inline-block hover:text-black transition">
                &larr; Назад до списку
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ЛІВА КОЛОНКА: Фото та Опис */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Головне фото */}
                    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
                        <img src={mainImage} alt={campaign.title} className="w-full h-auto object-cover" />
                    </div>

                    {/* Інформація */}
                    <div>
                        <div className="flex flex-wrap gap-2 mb-4">
               <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                 {campaign.category}
               </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                campaign.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                 {campaign.status}
               </span>
                        </div>

                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{campaign.title}</h1>

                        <div className="flex items-center gap-4 text-gray-500 text-sm mb-8 pb-8 border-b border-gray-100">
                            <div className="flex items-center gap-1">📍 {campaign.location}</div>
                            <div className="flex items-center gap-1">👤 Бенефіціар: {campaign.beneficiary}</div>
                        </div>

                        <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                            {campaign.fullDescription}
                        </div>
                    </div>

                    {/* ДОКУМЕНТИ ТА ЗВІТИ */}
                    {campaign.documents && campaign.documents.length > 0 && (
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mt-8">
                            <h3 className="font-bold text-lg mb-4">📄 Документи та звітність</h3>
                            <ul className="space-y-2">
                                {campaign.documents.map((doc, index) => {
                                    const baseUrl = 'http://localhost:3000';

                                    const cleanDocPath = doc.startsWith('/') ? doc.substring(1) : doc;
                                    const fullDocUrl = doc.startsWith('http')
                                        ? doc
                                        : `${baseUrl}/${cleanDocPath}`;

                                    return (
                                        <li key={index}>
                                            <a
                                                href={fullDocUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline flex items-center gap-2"
                                            >
                                                📎 Переглянути документ {index + 1}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* ПРАВА КОЛОНКА: Донат та Автор */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm sticky top-6">
                        <div className="mb-6">
                            <div className="flex justify-between text-lg font-bold mb-2">
                                <span className="text-blue-600">{campaign.currentAmount.toLocaleString()} ₴</span>
                                <span className="text-gray-400">{campaign.goalAmount.toLocaleString()} ₴</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                            <p className="text-right text-xs text-gray-400 mt-2">зібрано від цілі</p>
                        </div>

                        <button className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition shadow-lg hover:shadow-xl transform active:scale-95">
                            Підтримати збір
                        </button>
                        <EditButton campaignId={campaign.id} authorId={campaign.author.id} />

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Організатор збору</p>
                            <Link href={`/users/${campaign.author.id}`} className="flex items-center gap-3 hover:bg-gray-50 p-2 -mx-2 rounded-lg transition group">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600 group-hover:bg-white group-hover:shadow-md transition">
                                    {campaign.author.name[0]}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900">{campaign.author.name}</div>
                                    <div className="text-xs text-gray-500">Перевірений волонтер</div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}