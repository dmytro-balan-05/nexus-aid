'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateCampaignPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [docFiles, setDocFiles] = useState<File[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        shortDescription: '',
        fullDescription: '',
        goalAmount: '',
        location: '',
        beneficiary: '',
        category: 'military',
        imageURL: '',
        isUrgent: false,
        urgentUntil: '',
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            if (filesArray.length > 5) { alert('Максимум 5 файлів!'); return; }
            setDocFiles(filesArray);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (docFiles.length === 0) {
            setError('Обовʼязково прикріпіть хоча б один файл-підтвердження (PDF/Фото)');
            setIsLoading(false);
            return;
        }

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('shortDescription', formData.shortDescription);
            data.append('fullDescription', formData.fullDescription);
            data.append('goalAmount', formData.goalAmount);
            data.append('location', formData.location);
            data.append('beneficiary', formData.beneficiary);
            data.append('category', formData.category);
            data.append('isUrgent', String(formData.isUrgent));
            if (formData.isUrgent && formData.urgentUntil) {
                data.append('urgentUntil', formData.urgentUntil);
            }
            if (formData.imageURL) data.append('image', formData.imageURL);
            docFiles.forEach((file) => data.append('documents', file));

            await fetch('/api/campaigns', {
                method: 'POST',
                body: data,
                credentials: 'include',
            });

            router.push('/campaigns');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Помилка при створенні');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            <Link href="/campaigns" className="text-gray-500 text-sm mb-4 inline-block">&larr; Назад до зборів</Link>
            <h1 className="text-3xl font-bold mb-8">Створити новий збір</h1>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded mb-6 border border-red-200">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border">
                <div>
                    <label className="block text-sm font-medium mb-1">Назва</label>
                    <input name="title" required className="w-full border border-gray-300 p-2 rounded" onChange={handleChange} />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Фото (URL посилання)</label>
                    <input name="imageURL" type="url" placeholder="https://..." className="w-full border border-gray-300 p-2 rounded" onChange={handleChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Сума (грн)</label>
                        <input name="goalAmount" type="number" required className="w-full border border-gray-300 p-2 rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Категорія</label>
                        <select name="category" className="w-full border border-gray-300 p-2 rounded bg-white" onChange={handleChange} value={formData.category}>
                            <option value="military">Військові</option>
                            <option value="medical">Медицина</option>
                            <option value="humanitarian">Гуманітарка</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Короткий опис</label>
                    <textarea name="shortDescription" required rows={2} className="w-full border border-gray-300 p-2 rounded" onChange={handleChange} />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Повний опис</label>
                    <textarea name="fullDescription" required rows={5} className="w-full border border-gray-300 p-2 rounded" onChange={handleChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Локація</label>
                        <input name="location" required className="w-full border border-gray-300 p-2 rounded" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Бенефіціар</label>
                        <input name="beneficiary" required className="w-full border border-gray-300 p-2 rounded" onChange={handleChange} />
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
                                required={formData.isUrgent}
                                className="w-full border border-orange-300 p-2 rounded focus:ring-2 focus:ring-orange-400 outline-none"
                            />
                        </div>
                    )}
                </div>

                <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-2">Документи / Звіти *</label>
                    <input
                        type="file"
                        multiple
                        required
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-black file:text-white cursor-pointer"
                    />
                    <div className="flex justify-between items-start mt-1">
                        <p className="text-xs text-gray-400">PDF, DOCX або зображення. Макс. 5 файлів.</p>
                        {docFiles.length > 0 && <p className="text-xs font-bold text-green-600">Обрано: {docFiles.length}</p>}
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition">
                    {isLoading ? 'Завантаження...' : 'Опублікувати'}
                </button>
            </form>
        </div>
    );
}