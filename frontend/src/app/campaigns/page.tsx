import Link from 'next/link';
import CreateCampaignButton from '@/components/CreateCampaignButton';
import SearchFilter from '@/components/SearchFilter';

const DEFAULT_IMAGE = 'https://placehold.co/600x400/png?text=NexusAid';

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
}

type SearchParamsType = { [key: string]: string | string[] | undefined };

async function getCampaigns(searchParams: SearchParamsType) {
    const params = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
        if (typeof value === 'string') {
            params.append(key, value);
        }
    });

    const res = await fetch(`http://localhost:3000/campaigns?${params.toString()}`, { cache: 'no-store' });
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

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Актуальні збори</h1>
                    <p className="text-gray-500">Допомагайте перевіреним волонтерам</p>
                </div>
                <CreateCampaignButton />
            </div>

            {/* Панель пошуку та фільтрації */}
            <SearchFilter />

            {/* Якщо список порожній */}
            {campaigns.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-xl font-bold text-gray-400">Нічого не знайдено 😔</p>
                    <p className="text-gray-500">Спробуйте змінити параметри пошуку</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => {
                    const percent = Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100);

                    const imageUrl = (campaign.images && campaign.images.length > 0 && campaign.images[0])
                        ? campaign.images[0]
                        : DEFAULT_IMAGE;

                    return (
                        <article key={campaign.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition flex flex-col group">

                            <div className="h-48 overflow-hidden relative bg-gray-100">
                                <img
                                    src={imageUrl}
                                    alt={campaign.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                />
                                <div className="absolute top-3 left-3">
                  <span className="bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded uppercase shadow-sm">
                    {campaign.category}
                  </span>
                                </div>
                            </div>

                            <div className="p-5 flex-grow">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                    <Link href={`/campaigns/${campaign.id}`} className="hover:text-blue-600">
                                        {campaign.title}
                                    </Link>
                                </h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                    {campaign.shortDescription}
                                </p>
                                <div className="flex flex-col gap-1 text-sm text-gray-500 mb-4">
                                    <div className="flex items-center gap-2"><span>📍</span> {campaign.location}</div>
                                </div>
                            </div>

                            <div className="px-5 pb-5 mt-auto">
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm font-medium mb-1">
                                        <span className="text-blue-600">{campaign.currentAmount.toLocaleString()} ₴</span>
                                        <span className="text-gray-500">{campaign.goalAmount.toLocaleString()} ₴</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                                <hr className="border-gray-100 mb-4" />
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                        {campaign.author.name ? campaign.author.name[0] : 'U'}
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {campaign.author.name}
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}