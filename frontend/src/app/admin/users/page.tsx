'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'volonteer' | 'admin';
    _newRole?: 'user' | 'volonteer';
    avatar?: string;
}

interface Badge {
    id: string;
    key: string;
    name: string;
    icon: string;
    category: string;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
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

    const fetchBadges = async () => {
        const res = await fetch('/api/gamification/badges');
        setBadges(await res.json());
    };

    useEffect(() => {
        fetchUsers();
        fetchBadges();
    }, []);

    return (
        <div className="pb-10">
            <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} className="flex gap-2 mb-4">
                <input
                    placeholder="Пошук..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="border p-2 rounded w-full"
                />
                <select value={role} onChange={(e) => setRole(e.target.value)} className="border p-2 rounded">
                    <option value="">Всі</option>
                    <option value="user">User</option>
                    <option value="volonteer">Volonteer</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit" disabled={isSearching} className="bg-black text-white px-4 rounded disabled:opacity-50">
                    {isSearching ? 'Пошук...' : 'Пошук'}
                </button>
            </form>

            <div className="space-y-2">
                {users.map((u) => (
                    <div
                        key={u.id}
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                        className="border p-3 rounded flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {u.avatar ? (
                                    <img src={u.avatar} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-sm font-bold text-gray-700">
                                        {(u.name?.[0] || 'U').toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div>
                                <div className="font-bold">{u.name || 'No name'}</div>
                                <div className="text-sm text-gray-500">{u.email}</div>
                                <div className="text-xs text-gray-400">{u.role}</div>
                            </div>
                        </div>
                        <span className="text-gray-400 text-sm">→</span>
                    </div>
                ))}
            </div>
        </div>
    );
}