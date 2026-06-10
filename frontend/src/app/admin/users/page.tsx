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

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [q, setQ] = useState('');
    const [role, setRole] = useState('');
    const [isSearching, setIsSearching] = useState(false);

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
                    <div
                        key={u.id}
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                        className="border border-[var(--border)] bg-[var(--bg-card)] p-3 rounded-xl flex justify-between items-center cursor-pointer hover:border-gray-400 transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden">
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
                        <span className="text-[var(--text-secondary)] text-sm">→</span>
                    </div>
                ))}
            </div>
        </div>
    );
}