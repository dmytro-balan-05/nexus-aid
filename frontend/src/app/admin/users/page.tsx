'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'volonteer' | 'admin';
    avatar?: string;
}

const DELETE_REASONS = [
    'Порушення правил платформи',
    'Підозріла активність',
    'Запит самого користувача',
    'Дублікат акаунту',
    'Інше',
];

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [q, setQ] = useState('');
    const [role, setRole] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [deleteReason, setDeleteReason] = useState(DELETE_REASONS[0]);
    const [customReason, setCustomReason] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchUsers = async () => {
        setIsSearching(true);
        try {
            const params = new URLSearchParams();
            if (q) params.append('q', q);
            if (role) params.append('role', role);
            const res = await fetch(`/api/users?${params.toString()}`, { credentials: 'include' });
            setUsers(await res.json());
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const reason = deleteReason === 'Інше' ? customReason : deleteReason;
        if (!reason.trim()) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/users/${deleteTarget.id}?reason=${encodeURIComponent(reason)}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
                setDeleteTarget(null);
                setDeleteReason(DELETE_REASONS[0]);
                setCustomReason('');
            } else {
                const err = await res.json().catch(() => ({}));
                alert(`Помилка: ${err.message || res.status}`);
            }
        } catch (e: any) {
            alert(`Помилка: ${e.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="pb-10">
            <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} className="flex gap-2 mb-4">
                <input
                    placeholder="Пошук..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2 rounded-xl w-full outline-none focus:ring-2 focus:ring-black"
                />
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2 rounded-xl outline-none"
                >
                    <option value="">Всі</option>
                    <option value="user">User</option>
                    <option value="volonteer">Volonteer</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit" disabled={isSearching} className="bg-black text-white px-4 rounded-xl disabled:opacity-50">
                    {isSearching ? '...' : 'Пошук'}
                </button>
            </form>

            <div className="space-y-2">
                {users.map((u) => (
                    <div key={u.id} className="border border-[var(--border)] bg-[var(--bg-card)] p-3 rounded-xl flex justify-between items-center">
                        <div
                            className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80 transition"
                            onClick={() => router.push(`/admin/users/${u.id}`)}
                        >
                            <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden flex-shrink-0">
                                {u.avatar ? (
                                    <img src={u.avatar} className="w-full h-full object-cover" alt={u.name} />
                                ) : (
                                    <span className="text-sm font-bold text-[var(--text-secondary)]">
                                        {(u.name?.[0] || 'U').toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-[var(--text-primary)]">{u.name || 'No name'}</div>
                                <div className="text-sm text-[var(--text-secondary)]">{u.email}</div>
                                <div className="text-xs text-[var(--text-secondary)]">{u.role}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-[var(--text-secondary)] text-sm cursor-pointer hover:opacity-80"
                                onClick={() => router.push(`/admin/users/${u.id}`)}
                            >→</span>
                            {u.role !== 'admin' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(u); }}
                                    className="text-red-500 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50"
                                    title="Видалити користувача"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-md border border-[var(--border)] shadow-2xl">
                        <h2 className="text-xl font-black text-[var(--text-primary)] mb-1">Видалити користувача</h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            <strong>{deleteTarget.name || deleteTarget.email}</strong> — це незворотня дія.
                        </p>

                        <div className="mb-3">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block mb-1">
                                Причина видалення
                            </label>
                            <select
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                className="w-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-xl outline-none"
                            >
                                {DELETE_REASONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        {deleteReason === 'Інше' && (
                            <div className="mb-3">
                                <textarea
                                    rows={3}
                                    placeholder="Вкажіть причину..."
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    className="w-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-xl outline-none resize-none text-sm"
                                />
                            </div>
                        )}

                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting || (deleteReason === 'Інше' && !customReason.trim())}
                                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition"
                            >
                                {isDeleting ? 'Видалення...' : 'Видалити'}
                            </button>
                            <button
                                onClick={() => { setDeleteTarget(null); setCustomReason(''); setDeleteReason(DELETE_REASONS[0]); }}
                                className="flex-1 border border-[var(--border)] py-2.5 rounded-xl font-bold hover:border-black transition text-[var(--text-primary)]"
                            >
                                Скасувати
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}