'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Chat {
    id: string;
    user: { id: string; name: string; email: string; avatar: string | null };
    messages: { text: string; createdAt: string }[];
    updatedAt: string;
}

export default function AdminChatsPage() {
    const router = useRouter();
    const [chats, setChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/chat/admin/all', { credentials: 'include' })
            .then((r) => r.json())
            .then(setChats)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) return <div className="py-10 text-center text-gray-400 text-sm">Завантаження...</div>;

    return (
        <div className="pb-10">
            {chats.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">Чатів ще немає</div>
            ) : (
                <div className="space-y-3">
                    {chats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => router.push(`/admin/chats/${chat.id}`)}
                            className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 cursor-pointer hover:border-black transition"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {chat.user.avatar ? (
                                    <img src={chat.user.avatar} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-bold text-gray-600">
                                        {(chat.user.name?.[0] || 'U').toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900">{chat.user.name || chat.user.email}</div>
                                <div className="text-xs text-gray-400 truncate">
                                    {chat.messages[0]?.text || 'Немає повідомлень'}
                                </div>
                            </div>
                            <div className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(chat.updatedAt).toLocaleDateString('uk-UA')}
                            </div>
                            <span className="text-gray-400">→</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}