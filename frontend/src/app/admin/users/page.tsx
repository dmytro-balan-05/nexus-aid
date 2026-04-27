'use client';

import { useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'volonteer' | 'admin';
    _newRole?: 'user' | 'volonteer';
    avatar?: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [q, setQ] = useState('');
    const [role, setRole] = useState('');
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const fetchUsers = async () => {
        try {
            setIsSearching(true);

            const params = new URLSearchParams();
            if (q) params.append('q', q);
            if (role) params.append('role', role);

            const res = await fetch(`/api/users?${params.toString()}`, {
                credentials: 'include',
            });

            const data = await res.json();
            setUsers(data);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Користувачі</h1>

            {}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    fetchUsers();
                }}
                className="flex gap-2 mb-4"
            >
                <input
                    placeholder="Пошук..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="border p-2 rounded w-full"
                />

                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="border p-2 rounded"
                >
                    <option value="">Всі</option>
                    <option value="user">User</option>
                    <option value="volonteer">Volonteer</option>
                    <option value="admin">Admin</option>
                </select>

                <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-black text-white px-4 rounded disabled:opacity-50"
                >
                    {isSearching ? 'Пошук...' : 'Пошук'}
                </button>
            </form>

            <div className="space-y-2">
                {users.map((u, idx) => (
                    <div key={u.id} className="border p-3 rounded flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {u.avatar ? (
                                    <img
                                        src={u.avatar}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-gray-700">
                {(u.name?.[0] || 'U').toUpperCase()}
            </span>
                                )}
                            </div>

                            <div>
                                <div className="font-bold">{u.name || 'No name'}</div>
                                <div className="text-sm text-gray-500">{u.email}</div>
                                <div className="text-xs">{u.role}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                defaultValue={u.role}
                                disabled={u.role === 'admin'}
                                onChange={(e) => {
                                    const updated = [...users];
                                    updated[idx]._newRole = e.target.value as 'user' | 'volonteer';
                                    setUsers(updated);
                                }}
                                className={`border px-2 py-1 rounded ${
                                    u._newRole && u._newRole !== u.role ? 'border-blue-500' : ''
                                }`}
                            >
                                <option value="user">User</option>
                                <option value="volonteer">Volonteer</option>
                                {u.role === 'admin' && <option value="admin">Admin</option>}
                            </select>

                            <button
                                disabled={u.role === 'admin' || loadingId === u.id}
                                onClick={async () => {
                                    const newRole = u._newRole || u.role;

                                    if (newRole === u.role) return;

                                    try {
                                        setLoadingId(u.id);

                                        const res = await fetch(`http://localhost:3000/users/${u.id}/role`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ role: newRole }),
                                            credentials: 'include',
                                        });

                                        if (!res.ok) {
                                            const text = await res.text();
                                            alert(text);
                                            return;
                                        }

                                        await fetchUsers();
                                    } catch {
                                        alert('Помилка');
                                    } finally {
                                        setLoadingId(null);
                                    }
                                }}
                                className="bg-black text-white px-3 py-1 rounded disabled:opacity-50"
                            >
                                {loadingId === u.id ? 'Зберігається...' : 'Зберегти'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}