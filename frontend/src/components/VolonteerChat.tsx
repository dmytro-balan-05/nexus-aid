'use client';

import { useEffect, useState, useRef } from 'react';

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
    const [chat, setChat] = useState<Chat | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !chat) {
            fetch('/api/chat/me', { credentials: 'include' })
                .then((r) => r.json())
                .then(setChat)
                .catch(() => {});
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat?.messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || !chat) return;
        setIsSending(true);
        try {
            const res = await fetch('/api/chat/me/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ text: newMessage }),
            });
            if (!res.ok) throw new Error();
            const msg = await res.json();
            setChat((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
            setNewMessage('');
        } catch {
            alert('Помилка');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">💬 Зв'язок з адміністрацією</h2>
                    <p className="text-sm text-gray-400">Напишіть нам якщо є питання</p>
                </div>
                <button
                    onClick={() => setIsOpen((p) => !p)}
                    className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition"
                >
                    {isOpen ? 'Згорнути' : 'Відкрити чат'}
                </button>
            </div>

            {isOpen && (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="p-4 space-y-3 min-h-32 max-h-64 overflow-y-auto">
                        {!chat ? (
                            <p className="text-center text-gray-300 text-sm py-4">Завантаження...</p>
                        ) : chat.messages.length === 0 ? (
                            <p className="text-center text-gray-300 text-sm py-4">Напишіть перше повідомлення</p>
                        ) : (
                            chat.messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-2 ${!msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        {msg.sender.name?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${
                                        !msg.isAdmin ? 'bg-black text-white' : 'bg-gray-100 text-gray-900'
                                    }`}>
                                        {msg.text}
                                        <div className="text-xs mt-1 text-gray-400">
                                            {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="px-4 pb-4 flex gap-2 border-t border-gray-100 pt-3">
                        <input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Написати повідомлення..."
                            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isSending || !newMessage.trim()}
                            className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition"
                        >
                            →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}