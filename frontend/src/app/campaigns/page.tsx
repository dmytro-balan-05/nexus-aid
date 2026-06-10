import Link from 'next/link';
import CreateCampaignButton from '@/components/CreateCampaignButton';
import SearchFilter from '@/components/SearchFilter';

const DEFAULT_IMAGE = 'https://placehold.co/600x400/png?text=NexusAid';
const BACKEND_URL = 'https://nexus-aid-production.up.railway.app';

interface Author {
    name: string;
}

interface Campaign {
    id: string;
    title: string;
    shortDescription: string;
    goalAmount: number;
    currentAmount: number;
    category: string;
    status: string;
    location: string;
    beneficiary: string;
    author: Author;
    images: string[];
    isUrgent: boolean;
    urgentUntil: string | null;
}

type SearchParamsType = { [key: string]: string | string[] | undefined };

async function getCampaigns(searchParams: SearchParamsType) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
        if (typeof value === 'string') params.append(key, value);
    });
    const res = await fetch(`${BACKEND_URL}/campaigns?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
}

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CampaignsPage({ searchParams }: Props) {
    const resolvedParams = await searchParams;

    let campaigns: Campaign[] = [];
    try {
        campaigns = await getCampaigns(resolvedParams);
    } catch (e) {
        console.error(e);
    }

    const now = Date.now();

    const sorted = [...campaigns].sort((a, b) => {
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        if (a.isUrgent && b.isUrgent && a.urgentUntil && b.urgentUntil) {
            return new Date(a.urgentUntil).getTime() - new Date(b.urgentUntil).getTime();
        }
        return 0;
    });

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Актуальні збори</h1>
                    <p className="text-gray-500">Допомагайте перевіреним волонтерам</p>
                </div>
                <CreateCampaignButton />
            </div>

            <SearchFilter />

            {sorted.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-xl font-bold text-gray-400">Нічого не знайдено 😔</p>
                    <p className="text-gray-500">Спробуйте змінити параметри пошуку</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sorted.map((campaign) => {
                    const percent = Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100);
                    const imageUrl = campaign.images?.[0] || DEFAULT_IMAGE;
                    const isUrgent = campaign.isUrgent && campaign.urgentUntil && new Date(campaign.urgentUntil).getTime() > now;
                    const days = isUrgent && campaign.urgentUntil
                        ? Math.ceil((new Date(campaign.urgentUntil).getTime() - now) / 86400000)
                        : null;

                    return (
                        <Link href={`/campaigns/${campaign.id}`} key={campaign.id} className="block">
                            <article className={`border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition flex flex-col group cursor-pointer ${
                                isUrgent ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200'
                            }`}>
                                <div className="h-48 overflow-hidden relative bg-gray-100">
                                    <img
                                        src={imageUrl}
                                        alt={campaign.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                    />
                                    <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                                        {isUrgent && (
                                            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                                                ⚡ ТЕРМІНОВО
                                            </span>
                                        )}
                                        <span className="bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded uppercase shadow-sm">
                                            {campaign.category}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm ${
                                            campaign.status === 'active' ? 'bg-green-500 text-white' :
                                                campaign.status === 'completed' ? 'bg-blue-500 text-white' :
                                                    'bg-yellow-500 text-black'
                                        }`}>
                                            {campaign.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-5 flex-grow">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                        {campaign.title}
                                    </h3>
                                    {days !== null && (
                                        <p className="text-xs text-blue-600 font-bold mb-2">
                                            ⏰ Залишилось {days} {days === 1 ? 'день' : days < 5 ? 'дні' : 'днів'}
                                        </p>
                                    )}
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                        {campaign.shortDescription}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span>📍</span>
                                        <span>{campaign.location}</span>
                                    </div>
                                </div>

                                <div className="px-5 pb-5 mt-auto">
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm font-medium mb-1">
                                            <span className={isUrgent ? 'text-orange-500' : 'text-blue-600'}>
                                                {campaign.currentAmount.toLocaleString()} ₴
                                            </span>
                                            <span className="text-gray-500">{campaign.goalAmount.toLocaleString()} ₴</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${isUrgent ? 'bg-orange-500' : 'bg-blue-600'}`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </div>
                                    </div>
                                    <hr className="border-gray-100 mb-4" />
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {campaign.author.name?.[0] || 'U'}
                                        </div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {campaign.author.name}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}