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
        // ЗМІНА 1: items-end (рівняємо по низу), flex-wrap (щоб на мобілках не ламалося)
        <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-end shadow-sm">

            {/* Пошук - розтягується на всю доступну ширину */}
            <div className="flex-grow w-full">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Пошук</label>
                <input
                    type="text"
                    placeholder="Назва або опис..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    // ЗМІНА 2: h-[46px] - фіксована висота, щоб все було рівно
                    className="w-full border border-gray-300 p-2.5 rounded-lg h-[46px] focus:ring-2 focus:ring-black outline-none transition"
                />
            </div>

            {/* Категорія - робимо ширше */}
            {/* ЗМІНА 3: md:w-64 замість w-48 (даємо більше місця тексту) */}
            <div className="w-full md:w-64 flex-shrink-0">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Категорія</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg bg-white h-[46px] focus:ring-2 focus:ring-black outline-none cursor-pointer transition"
                >
                    <option value="all">Всі категорії</option>
                    <option value="military">Військові</option>
                    <option value="medical">Медицина</option>
                    <option value="humanitarian">Гуманітарка</option>
                </select>
            </div>

            {/* Сортування - робимо ширше */}
            <div className="w-full md:w-56 flex-shrink-0">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Сортування</label>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg bg-white h-[46px] focus:ring-2 focus:ring-black outline-none cursor-pointer transition"
                >
                    <option value="desc">Спочатку нові</option>
                    <option value="asc">Спочатку старі</option>
                </select>
            </div>

            {/* Кнопка */}
            <button
                type="submit"
                className="w-full md:w-auto bg-black text-white px-8 rounded-lg font-bold hover:bg-gray-800 transition h-[46px] flex items-center justify-center shadow-lg hover:shadow-xl"
            >
                Знайти
            </button>
        </form>
    );
}