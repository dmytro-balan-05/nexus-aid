'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function Header() {

    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* ЛОГОТИП */}
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-black text-gray-900 tracking-tighter">
                            NEXUS<span className="text-blue-600">AID</span>
                        </Link>

                        {/* Навігація (Десктоп) */}
                        <nav className="hidden md:ml-10 md:flex space-x-8">
                            <Link href="/campaigns" className="text-gray-500 hover:text-gray-900 font-medium transition">
                                Всі збори
                            </Link>
                            <Link href="/about" className="text-gray-500 hover:text-gray-900 font-medium transition">
                                Про нас
                            </Link>
                        </nav>
                    </div>

                    {/* ПРАВА ЧАСТИНА (AUTH) */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <>
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-3 hover:bg-gray-50 px-2 py-1 rounded transition cursor-pointer"
                                >
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">
                                            {user.name || user.email}
                                        </p>
                                        <p className="text-xs text-gray-500 uppercase">
                                            {user.role || 'User'}
                                        </p>
                                    </div>

                                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-gray-600 font-bold">
                            {(user.name?.[0] || 'U').toUpperCase()}
                        </span>
                                        )}
                                    </div>
                                </Link>

                                <button
                                    onClick={logout}
                                    className="text-sm text-red-600 font-medium hover:text-red-800 ml-2"
                                >
                                    Вийти
                                </button>
                            </>
                        ) : (
                            // ЯКЩО ГІСТЬ
                            <>
                                <Link
                                    href="/login"
                                    className="text-gray-900 font-medium hover:text-blue-600 px-3 py-2"
                                >
                                    Увійти
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition"
                                >
                                    Реєстрація
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Бэргер */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-500 p-2">
                            ☰
                        </button>
                    </div>
                </div>
            </div>

            {/* Мобільне меню */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-100 p-4 space-y-3 bg-white">
                    <Link href="/campaigns" className="block font-medium">Всі збори</Link>
                    {user ? (
                        <>
                            <Link href="/profile" className="block text-blue-600 font-bold">Мій профіль</Link>
                            <button onClick={logout} className="block text-red-600 w-full text-left">Вийти</button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="block w-full text-center border py-2 rounded">Увійти</Link>
                            <Link href="/register" className="block w-full text-center bg-black text-white py-2 rounded">Реєстрація</Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}