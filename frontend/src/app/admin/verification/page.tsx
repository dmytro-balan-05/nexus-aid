'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface VerificationRequest {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    about: string;
    createdAt: string;
    user: { id: string; name: string; email: string; avatar: string | null };
    messages: { id: string }[];
}

const STATUS_CONFIG = {
    pending:  { label: 'На розгляді',  color: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Підтверджено', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Відхилено',    color: 'bg-red-100 text-red-800' },
};

export default function AdminVerificationPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [filter, setFilter] = useState('pending');
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/verification?status=${filter}`, { credentials: 'include' });
            setRequests(await res.json());
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, [filter]);

    return (
        <div className="pb-10">
            <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200 w-fit">
                {(['pending', 'approved', 'rejected'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
                            filter === s ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {STATUS_CONFIG[s].label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-gray-400 text-sm">Завантаження...</div>
            ) : requests.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">Заявок немає</div>
            ) : (
                <div className="space-y-3">
                    {requests.map((req) => (
                        <div
                            key={req.id}
                            onClick={() => router.push(`/admin/verification/${req.id}`)}
                            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 cursor-pointer hover:border-black transition"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {req.user.avatar ? (
                                    <img src={req.user.avatar} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-bold text-gray-600">
                                        {(req.user.name?.[0] || 'U').toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900">{req.user.name || req.user.email}</div>
                                <div className="text-xs text-gray-400 truncate">{req.about}</div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {req.messages.length > 0 && (
                                    <span className="text-xs text-gray-400">💬 {req.messages.length}</span>
                                )}
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[req.status].color}`}>
                                    {STATUS_CONFIG[req.status].label}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {new Date(req.createdAt).toLocaleDateString('uk-UA')}
                                </span>
                                <span className="text-gray-400">→</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}