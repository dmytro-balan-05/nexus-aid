'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';

interface ChatMessage {
    id: string;
    text: string;
    isAdmin: boolean;
    createdAt: string;
    sender: { id: string; name: string; avatar: string | null; role: string };
}

interface Chat {
    id: string;
    user: { id: string; name: string; email: string; avatar: string | null };
    messages: ChatMessage[];
}

export default function AdminChatDetailPage() {
    const { chatId } = useParams<{ chatId: string }>();
    const router = useRouter();
    const { socket, setAdminUnreadCount } = useNotification();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [chat, setChat] = useState<Chat | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    const fetchChat = async () => {
        try {
            const res = await fetch(`/api/chat/admin/${chatId}`, { credentials: 'include' });
            if (!res.ok) return;
            setChat(await res.json());
            setTimeout(scrollToBottom, 50);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async () => {
        try {
            await fetch(`/api/chat/admin/${chatId}/read`, { method: 'POST', credentials: 'include' });
            setAdminUnreadCount(prev => Math.max(0, prev - 1));
        } catch {}
    };

    useEffect(() => {
        fetchChat();
        markAsRead();
    }, [chatId]);

    useEffect(() => {
        if (!socket) return;
        const onNewMessage = (data: any) => {
            if (data.chatUserId && data.message) {
                setChat(prev => {
                    if (!prev) return prev;
                    if (prev.messages.some((m: ChatMessage) => m.id === data.message.id)) return prev;
                    setTimeout(scrollToBottom, 50);
                    return { ...prev, messages: [...prev.messages, data.message] };
                });
                markAsRead();
            }
        };
        socket.on('new_message', onNewMessage);
        return () => { socket.off('new_message', onNewMessage); };
    }, [socket, chatId]);

    const handleSend = async () => {
        if (!newMessage.trim() || !chat) return;
        setIsSending(true);
        try {
            const res = await fetch(`/api/chat/admin/${chatId}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ text: newMessage }),
            });
            if (!res.ok) throw new Error();
            const msg = await res.json();
            setChat(prev => {
                if (!prev) return prev;
                setTimeout(scrollToBottom, 50);
                return { ...prev, messages: [...prev.messages, msg] };
            });
            setNewMessage('');
        } catch {
            alert('Помилка');
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) return <div className="py-10 text-center text-gray-400 text-sm">Завантаження...</div>;
    if (!chat) return <div className="py-10 text-center text-red-400 text-sm">Чат не знайдено</div>;

    const avatarUrl = chat.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(chat.user.name || 'U')}`;

    return (
        <div className="pb-10 space-y-4">
            <button onClick={() => router.push('/admin/chats')} className="text-sm text-gray-500 hover:text-black transition">
                ← Назад до чатів
            </button>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover" alt={chat.user.name} />
                    <div>
                        <p className="font-bold text-gray-900 text-sm">{chat.user.name || chat.user.email}</p>
                        <p className="text-xs text-gray-400">волонтер</p>
                    </div>
                </div>

                <div ref={chatContainerRef} className="p-4 space-y-3 min-h-64 max-h-96 overflow-y-auto">
                    {chat.messages.length === 0 ? (
                        <p className="text-center text-gray-300 text-sm py-10">Повідомлень ще немає</p>
                    ) : (
                        chat.messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-2 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {msg.sender.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className={`max-w-sm rounded-xl px-3 py-2 text-sm ${msg.isAdmin ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
                                    {msg.text}
                                    <div className="text-xs mt-1 text-gray-400">
                                        {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="px-4 pb-4 flex gap-2">
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Написати повідомлення..."
                        className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                    />
                    <button onClick={handleSend} disabled={isSending || !newMessage.trim()} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition">
                        →
                    </button>
                </div>
            </div>
        </div>
    );
}