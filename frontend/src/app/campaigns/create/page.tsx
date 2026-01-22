'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateCampaignPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Данные формы
    const [formData, setFormData] = useState({
        title: '',
        shortDescription: '',
        fullDescription: '',
        goalAmount: '',
        location: '',
        beneficiary: '',
        category: 'military',
        imageURL: '',
    });

    // 1. ИЗМЕНЕНИЕ: Массив файлов вместо одного файла
    const [docFiles, setDocFiles] = useState<File[]>([]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // 2. ИЗМЕНЕНИЕ: Обработчик выбора файлов (с лимитом 5 шт)
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);

            if (filesArray.length > 5) {
                alert("Максимум 5 файлів!");
                return;
            }
            setDocFiles(filesArray);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // 3. ИЗМЕНЕНИЕ: Проверяем длину массива
        if (docFiles.length === 0) {
            setError('Обовʼязково прикріпіть хоча б один файл-підтвердження (PDF/Фото)');
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('jwt_token');

            console.log('DEBUG: Token found:', token);

            if (!token) {
                throw new Error('Ви не авторизовані. Будь ласка, вийдіть і зайдіть знову.');
            }

            const data = new FormData();

            // Добавляем текстовые поля
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value);
            });

            // 4. ИЗМЕНЕНИЕ: Добавляем каждый файл отдельно в цикле
            docFiles.forEach((file) => {
                data.append('documents', file);
            });

            // Картинку шлем как текст (ссылку) в поле 'image'
            if (formData.imageURL) {
                data.append('image', formData.imageURL);
            }

            const res = await fetch('http://localhost:3000/campaigns', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });

            if (!res.ok) {
                let errorMessage = 'Помилка при створенні';
                try {
                    const errData = await res.json();
                    errorMessage = errData.message || errorMessage;
                } catch (e) {
                    errorMessage = `Server Error: ${res.status} ${res.statusText}`;
                }
                throw new Error(errorMessage);
            }

            // Успех
            router.push('/campaigns');
            router.refresh();

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Невідома помилка');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold mb-8">Створити новий збір</h1>
            {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-6 border border-red-200">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border">

                {/* Название */}
                <div>
                    <label className="block text-sm font-medium mb-1">Назва</label>
                    <input
                        name="title"
                        required
                        className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-black outline-none"
                        onChange={handleChange}
                    />
                </div>

                {/* Фото URL */}
                <div>
                    <label className="block text-sm font-medium mb-1">Фото (URL посилання)</label>
                    <input
                        name="imageURL"
                        type="url"
                        placeholder="https://..."
                        className="w-full border border-gray-300 p-2 rounded"
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Сума (грн)</label>
                        <input
                            name="goalAmount"
                            type="number"
                            required
                            className="w-full border border-gray-300 p-2 rounded"
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Категорія</label>
                        <select
                            name="category"
                            className="w-full border border-gray-300 p-2 rounded bg-white"
                            onChange={handleChange}
                            value={formData.category}
                        >
                            <option value="military">Військові</option>
                            <option value="medical">Медицина</option>
                            <option value="humanitarian">Гуманітарка</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Короткий опис</label>
                    <textarea
                        name="shortDescription"
                        required
                        rows={2}
                        className="w-full border border-gray-300 p-2 rounded"
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Повний опис</label>
                    <textarea
                        name="fullDescription"
                        required
                        rows={5}
                        className="w-full border border-gray-300 p-2 rounded"
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Локація</label>
                        <input
                            name="location"
                            required
                            className="w-full border border-gray-300 p-2 rounded"
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Бенефіціар</label>
                        <input
                            name="beneficiary"
                            required
                            className="w-full border border-gray-300 p-2 rounded"
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Загрузка документа */}
                <div className="border-t pt-4">
                    <label className="block text-sm font-medium mb-2">Документи / Звіти *</label>
                    <input
                        type="file"
                        multiple // 5. ИЗМЕНЕНИЕ: Разрешаем несколько файлов
                        required
                        onChange={handleFileChange} // Используем новую функцию
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-black file:text-white hover:file:bg-gray-800 transition cursor-pointer"
                    />

                    <div className="flex justify-between items-start mt-1">
                        <p className="text-xs text-gray-400">PDF, DOCX або зображення (макс. 5MB). Можна обрати декілька.</p>
                        {/* Отображение количества выбранных файлов */}
                        {docFiles.length > 0 && (
                            <p className="text-xs font-bold text-green-600">Обрано файлів: {docFiles.length}</p>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50"
                >
                    {isLoading ? 'Завантаження...' : 'Опублікувати'}
                </button>
            </form>
        </div>
    );
}