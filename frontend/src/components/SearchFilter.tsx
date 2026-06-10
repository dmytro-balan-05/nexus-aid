'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react';

export default function SearchFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'desc');
    const [category, setCategory] = useState(searchParams.get('category') || 'all');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (category && category !== 'all') params.set('category', category);
        params.set('sort', sort);
        router.push(`/campaigns?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSearch} className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] mb-8 flex flex-col md:flex-row gap-4 items-end shadow-sm">
            <div className="flex-grow w-full">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase ml-1 mb-1 block">Пошук</label>
                <input
                    type="text"
                    placeholder="Назва або опис..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-lg h-[46px] focus:ring-2 focus:ring-black outline-none transition"
                />
            </div>

            <div className="w-full md:w-64 flex-shrink-0">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase ml-1 mb-1 block">Категорія</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-lg h-[46px] focus:ring-2 focus:ring-black outline-none cursor-pointer transition"
                >
                    <option value="all">Всі категорії</option>
                    <option value="military">Військові</option>
                    <option value="medical">Медицина</option>
                    <option value="humanitarian">Гуманітарка</option>
                </select>
            </div>

            <div className="w-full md:w-56 flex-shrink-0">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase ml-1 mb-1 block">Сортування</label>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] p-2.5 rounded-lg h-[46px] focus:ring-2 focus:ring-black outline-none cursor-pointer transition"
                >
                    <option value="desc">Спочатку нові</option>
                    <option value="asc">Спочатку старі</option>
                </select>
            </div>

            <button type="submit" className="w-full md:w-auto bg-black text-white px-8 rounded-lg font-bold hover:bg-gray-800 transition h-[46px] flex items-center justify-center">
                Знайти
            </button>
        </form>
    );
}