'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function ProfilePage() {
    const { user, isLoading, logout, refreshProfile } = useAuth();
    const router = useRouter();

    // Стейт для редагування
    const [newName, setNewName] = useState('');
    const [newAvatar, setNewAvatar] = useState(''); // <--- Додали стейт для аватара

    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');

    // 1. Захист сторінки
    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    // Ініціалізація редагування
    const startEditing = () => {
        setNewName(user?.name || '');
        setNewAvatar(user?.avatar || ''); // <--- Заповнюємо поточним URL
        setIsEditing(true);
    };

    // Збереження змін
    const handleUpdate = async () => {
        try {
            // Відправляємо і ім'я, і аватар
            await api.patch('/users/me', {
                name: newName,
                avatar: newAvatar // <--- Відправляємо на бек
            });

            await refreshProfile();
            setIsEditing(false);
            setMessage('Профіль успішно оновлено!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            alert('Помилка оновлення');
        }
    };

    if (isLoading || !user) {
        return <div className="p-10 text-center">Завантаження профілю...</div>;
    }

    // Логіка відображення аватара (якщо немає свого, беремо UI Avatars)
    const avatarUrl = user.avatar
        ? user.avatar
        : `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=random&size=128`;

    return (
        <div className="min-h-screen p-8 bg-gray-100 text-black">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">

                {/* Header + Avatar */}
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                    <div className="flex items-center gap-4">
                        {/* Кругла картинка */}
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-20 h-20 rounded-full border-2 border-gray-200 object-cover"
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Мій Профіль</h1>
                            <p className="text-gray-500 text-sm">{user.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition text-sm"
                    >
                        Вийти
                    </button>
                </div>

                {/* Status Message */}
                {message && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-200">
                        {message}
                    </div>
                )}

                {/* User Info Form */}
                <div className="space-y-4">

                    {/* Read Only Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">ID</label>
                            <div className="font-mono text-xs bg-gray-50 p-2 rounded border truncate" title={user.id}>
                                {user.id}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Роль</label>
                            <div className="mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'volonteer' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                }`}>
                  {user.role}
                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Провайдер</label>
                        <div className="text-sm text-gray-600">{user.provider}</div>
                    </div>

                    {/* Edit Section */}
                    <div className="pt-4 border-t mt-4">
                        <h3 className="text-lg font-semibold mb-4">Редагування даних</h3>

                        {isEditing ? (
                            <div className="flex flex-col gap-4 bg-gray-50 p-4 rounded border">

                                {/* Input Name */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Ім'я</label>
                                    <input
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="border p-2 rounded w-full border-blue-500 ring-1 ring-blue-500"
                                        placeholder="Введіть ім'я"
                                    />
                                </div>

                                {/* Input Avatar URL */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">URL Аватарки</label>
                                    <input
                                        value={newAvatar}
                                        onChange={(e) => setNewAvatar(e.target.value)}
                                        className="border p-2 rounded w-full border-blue-500 ring-1 ring-blue-500 text-sm"
                                        placeholder="https://example.com/image.png"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Вставте пряме посилання на зображення</p>
                                </div>

                                <div className="flex gap-2 mt-2">
                                    <button onClick={handleUpdate} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                        Зберегти зміни
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
                                        Скасувати
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <div className="flex justify-between items-center group bg-gray-50 p-3 rounded border hover:border-blue-300 transition">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block">Ім'я</label>
                                    <span className="text-xl font-medium">{user.name || 'Не вказано'}</span>
                                </div>
                                <button
                                    onClick={startEditing}
                                    className="text-blue-600 underline text-sm font-bold px-3 py-1 rounded hover:bg-blue-50"
                                >
                                    Редагувати профіль
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}