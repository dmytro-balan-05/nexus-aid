'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function EditCampaignPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [docFiles, setDocFiles] = useState<File[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        shortDescription: '',
        fullDescription: '',
        goalAmount: '',
        location: '',
        beneficiary: '',
        category: '',
        status: '',
        imageURL: '',
        isUrgent: false,
        urgentUntil: '',
    });

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const res = await fetch(`/api/campaigns/${id}`);
                if (!res.ok) throw new Error('Збір не знайдено');
                const data = await res.json();

                setFormData({
                    title: data.title,
                    shortDescription: data.shortDescription,
                    fullDescription: data.fullDescription,
                    goalAmount: data.goalAmount,
                    location: data.location,
                    beneficiary: data.beneficiary,
                    category: data.category,
                    status: data.status,
                    imageURL: data.images?.[0] || '',
                    isUrgent: data.isUrgent || false,
                    urgentUntil: data.urgentUntil
                        ? new Date(data.urgentUntil).toISOString().split('T')[0]
                        : '',
                });
            } catch {
                setError('Помилка завантаження даних');
            } finally {
                setIsLoading(false);
            }
        };
        fetchCampaign();
    }, [id]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setDocFiles(Array.from(e.target.files));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('shortDescription', formData.shortDescription);
            data.append('fullDescription', formData.fullDescription);
            data.append('goalAmount', String(formData.goalAmount));
            data.append('location', formData.location);
            data.append('beneficiary', formData.beneficiary);
            data.append('category', formData.category);
            data.append('status', formData.status);
            data.append('isUrgent', String(formData.isUrgent));
            if (formData.isUrgent && formData.urgentUntil) {
                data.append('urgentUntil', formData.urgentUntil);
            }
            if (formData.imageURL) data.append('image', formData.imageURL);
            docFiles.forEach((file) => data.append('documents', file));

            await fetch(`/api/campaigns/${id}`, {
                method: 'PATCH',
                body: data,
                credentials: 'include',
            });

            router.push(`/campaigns/${id}`);
            router.refresh();
        } catch (err: any) {
            setError(err?.message || 'Помилка оновлення');
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Точно видалити збір?')) return;
        try {
            await fetch(`/api/campaigns/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            router.push('/campaigns');
            router.refresh();
        } catch {
            alert('Помилка видалення');
        }
    };

    if (isLoading) return <div className="p-20 text-center">Завантаження...</div>;

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            <Link href={`/campaigns/${id}`} className="text-gray-500 text-sm mb-4 inline-block">&larr; Назад до збору</Link>
            <h1 className="text-3xl font-bold mb-8">Редагування збору</h1>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border border-gray-200">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-bold mb-2">Статус</label>
                    <select name="status" className="w-full border p-2 rounded" onChange={handleChange} value={formData.status}>
                        <option value="active">Active (Активний)</option>
                        <option value="pending">Pending (На перевірці)</option>
                        <option value="completed">Completed (Завершено/Звіт)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Назва</label>
                    <input name="title" value={formData.title} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Фото (URL)</label>
                    <input name="imageURL" value={formData.imageURL} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Сума</label>
                        <input name="goalAmount" type="number" value={formData.goalAmount} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Категорія</label>
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full border p-2 rounded bg-white">
                            <option value="military">Військові</option>
                            <option value="medical">Медицина</option>
                            <option value="humanitarian">Гуманітарка</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Короткий опис</label>
                    <textarea name="shortDescription" rows={2} value={formData.shortDescription} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Повний опис</label>
                    <textarea name="fullDescription" rows={5} value={formData.fullDescription} onChange={handleChange} className="w-full border p-2 rounded" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Локація</label>
                        <input name="location" value={formData.location} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Бенефіціар</label>
                        <input name="beneficiary" value={formData.beneficiary} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                </div>

                <div className="border border-orange-200 bg-orange-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isUrgent"
                            name="isUrgent"
                            checked={formData.isUrgent}
                            onChange={handleChange}
                            className="w-4 h-4 accent-orange-500"
                        />
                        <label htmlFor="isUrgent" className="text-sm font-bold text-orange-800 cursor-pointer">
                            🔥 Терміновий збір
                        </label>
                    </div>
                    {formData.isUrgent && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-orange-700">Термін до</label>
                            <input
                                type="date"
                                name="urgentUntil"
                                value={formData.urgentUntil}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full border border-orange-300 p-2 rounded focus:ring-2 focus:ring-orange-400 outline-none"
                            />
                        </div>
                    )}
                </div>

                <div className="border-t pt-4">
                    <label className="block text-sm font-bold mb-2">Додати нові документи / звіти</label>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-black file:text-white cursor-pointer"
                    />
                    <p className="text-xs text-gray-400 mt-1">Нові файли додаються до списку існуючих.</p>
                </div>

                {user?.role === 'admin' && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600 transition"
                    >
                        🗑 Видалити збір
                    </button>
                )}

                <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition">
                    Зберегти зміни
                </button>
            </form>
        </div>
    );
}