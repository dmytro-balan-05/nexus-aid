'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

const BACKEND_URL = 'https://nexus-aid-production.up.railway.app';

interface VerificationMessage {
    id: string; text: string; isAdmin: boolean; createdAt: string;
    sender: { id: string; name: string; avatar: string | null; role: string };
}

interface VerificationRequest {
    id: string; status: 'pending' | 'approved' | 'rejected';
    about: string; experience: string; socialLinks: string | null;
    documents: string[]; createdAt: string;
    user: { id: string; name: string; email: string; avatar: string | null; role: string };
    messages: VerificationMessage[];
}

const STATUS_CONFIG = {
    pending:  { label: 'На розгляді',  color: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Підтверджено', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Відхилено',    color: 'bg-red-100 text-red-800' },
};

export default function AdminVerificationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [request, setRequest] = useState<VerificationRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchRequest = async () => {
        const res = await fetch(`/api/verification/${id}`, { credentials: 'include' });
        if (res.ok) setRequest(await res.json());
        setIsLoading(false);
    };

    useEffect(() => { fetchRequest(); }, [id]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [request?.messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !request) return;
        setIsSending(true);
        try {
            const res = await fetch(`/api/verification/${id}/message`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                credentials: 'include', body: JSON.stringify({ text: newMessage }),
            });
            if (!res.ok) throw new Error();
            const msg = await res.json();
            setRequest((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
            setNewMessage('');
        } catch { alert('Помилка відправки'); }
        finally { setIsSending(false); }
    };

    const handleStatus = async (status: 'approved' | 'rejected') => {
        if (!confirm(status === 'approved' ? 'Підтвердити заявку?' : 'Відхилити заявку?')) return;
        setIsUpdatingStatus(true);
        try {
            const res = await fetch(`/api/verification/${id}/status`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                credentials: 'include', body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error();
            setSuccessMessage(status === 'approved' ? 'Заявку підтверджено ✅' : 'Заявку відхилено ❌');
            await fetchRequest();
        } catch { alert('Помилка'); }
        finally { setIsUpdatingStatus(false); }
    };

    if (isLoading) return <div className="py-10 text-center text-[var(--text-secondary)] text-sm">Завантаження...</div>;
    if (!request) return <div className="py-10 text-center text-red-400 text-sm">Заявку не знайдено</div>;

    const avatarUrl = request.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(request.user.name || 'U')}`;

    return (
        <div className="pb-10 space-y-6">
            <button onClick={() => router.push('/admin/verification')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
                ← Назад до заявок
            </button>

            {successMessage && (
                <div className="bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-200 font-bold">{successMessage}</div>
            )}

            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
                <div className="flex items-center gap-4 mb-4">
                    <img src={avatarUrl} alt={request.user.name} className="w-14 h-14 rounded-xl object-cover border border-[var(--border)]" />
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">{request.user.name || 'Без імені'}</h2>
                        <p className="text-sm text-[var(--text-secondary)]">{request.user.email}</p>
                    </div>
                    <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${STATUS_CONFIG[request.status].color}`}>
                        {STATUS_CONFIG[request.status].label}
                    </span>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Про себе</p>
                        <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)]">{request.about}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Досвід</p>
                        <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)]">{request.experience}</p>
                    </div>
                    {request.socialLinks && (
                        <div>
                            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Соцмережі</p>
                            <p className="text-sm" style={{ color: 'var(--accent)' }}>{request.socialLinks}</p>
                        </div>
                    )}
                    {request.documents.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Документи</p>
                            <div className="flex flex-wrap gap-2">
                                {request.documents.map((doc, i) => (
                                    <a key={i} href={`${BACKEND_URL}${doc}`} target="_blank" rel="noopener noreferrer"
                                       className="text-xs bg-[var(--bg-secondary)] hover:bg-[var(--border)] border border-[var(--border)] px-3 py-1.5 rounded-lg text-[var(--text-secondary)] transition">
                                        📎 Документ {i + 1}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h3 className="font-bold text-[var(--text-primary)]">💬 Діалог</h3>
                </div>
                <div className="p-4 space-y-3 min-h-32 max-h-80 overflow-y-auto">
                    {request.messages.length === 0 ? (
                        <p className="text-center text-[var(--text-secondary)] text-sm py-6">Повідомлень ще немає</p>
                    ) : (
                        request.messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-2 ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                                <div className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-xs font-bold flex-shrink-0 text-[var(--text-secondary)]">
                                    {msg.sender.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className={`max-w-sm rounded-xl px-3 py-2 text-sm ${msg.isAdmin ? 'bg-black text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}>
                                    {msg.text}
                                    <div className="text-xs mt-1 opacity-50">
                                        {msg.sender.name} · {new Date(msg.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="px-4 pb-4 flex gap-2">
                    <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} placeholder="Написати повідомлення..." className="flex-1 border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black outline-none" />
                    <button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition">→</button>
                </div>
            </div>

            {request.status === 'pending' && (
                <div className="flex gap-3">
                    <button onClick={() => handleStatus('approved')} disabled={isUpdatingStatus} className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition">✅ Підтвердити</button>
                    <button onClick={() => handleStatus('rejected')} disabled={isUpdatingStatus} className="flex-1 border border-red-300 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 disabled:opacity-50 transition">❌ Відхилити</button>
                </div>
            )}
        </div>
    );
}