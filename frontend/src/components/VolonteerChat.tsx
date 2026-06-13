'use client';

import { useEffect, useState, useRef } from 'react';
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
    messages: ChatMessage[];
}

export default function VolonteerChat() {
    const { socket, unreadChatCount, setUnreadChatCount, setIsChatOpen } = useNotification();
    const [chat, setChat] = useState<Chat | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [connected, setConnected] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    const loadChat = async () => {
        try {
            const res = await fetch('/api/chat/me', { credentials: 'include' });
            const data = await res.json();
            setChat(data);
            setTimeout(scrollToBottom, 50);
        } catch {}
    };

    const markAsRead = async () => {
        try {
            await fetch('/api/chat/me/read', { method: 'POST', credentials: 'include' });
            setUnreadChatCount(0);
        } catch {}
    };

    useEffect(() => {
        if (!socket) return;
        setConnected(socket.connected);
        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket || !isOpen) return;
        const onNewMessage = (message: ChatMessage) => {
            setChat(prev => {
                if (!prev) return prev;
                if (prev.messages.some(m => m.id === message.id)) return prev;
                setTimeout(scrollToBottom, 50);
                return { ...prev, messages: [...prev.messages, message] };
            });
            if (message.isAdmin) markAsRead();
        };
        socket.on('new_message', onNewMessage);
        return () => { socket.off('new_message', onNewMessage); };
    }, [socket, isOpen]);

    useEffect(() => {
        setIsChatOpen(isOpen);
        if (isOpen) {
            loadChat();
            markAsRead();
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!newMessage.trim() || !chat) return;
        setIsSending(true);
        try {
            if (socket?.connected) {
                socket.emit('send_message', { text: newMessage });
                setNewMessage('');
            } else {
                const res = await fetch('/api/chat/me/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ text: newMessage }),
                });
                if (!res.ok) throw new Error();
                const msg = await res.json();
                setChat(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
                setNewMessage('');
                setTimeout(scrollToBottom, 50);
            }
        } catch {
            alert('Помилка відправки');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">💬 Зв'язок з адміністрацією</h2>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Напишіть нам якщо є питання
                        {connected && <span className="ml-2 text-green-500 text-xs">● online</span>}
                    </p>
                </div>
                <button
                    onClick={() => setIsOpen(p => !p)}
                    className="relative bg-black dark:bg-white dark:text-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition"
                >
                    {isOpen ? 'Згорнути' : 'Відкрити чат'}
                    {!isOpen && unreadChatCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                            {unreadChatCount > 9 ? '9+' : unreadChatCount}
                        </span>
                    )}
                </button>
            </div>

            {isOpen && (
                <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                    <div ref={chatContainerRef} className="p-4 space-y-3 min-h-32 max-h-64 overflow-y-auto">
                        {!chat ? (
                            <p className="text-center text-[var(--text-secondary)] text-sm py-4">Завантаження...</p>
                        ) : chat.messages.length === 0 ? (
                            <p className="text-center text-[var(--text-secondary)] text-sm py-4">Напишіть перше повідомлення</p>
                        ) : (
                            chat.messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-2 ${!msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        {msg.sender.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${!msg.isAdmin ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'}`}>
                                        {msg.text}
                                        <div className="text-xs mt-1 text-gray-400">
                                            {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="px-4 pb-4 flex gap-2 border-t border-[var(--border)] pt-3">
                        <input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Написати повідомлення..."
                            className="flex-1 border border-[var(--border)] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none bg-[var(--bg-primary)] text-[var(--text-primary)]"
                        />
                        <button onClick={handleSend} disabled={isSending || !newMessage.trim()} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition">→</button>
                    </div>
                </div>
            )}
        </div>
    );
}