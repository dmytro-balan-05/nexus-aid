'use client';

import { useNotification } from '@/context/NotificationContext';

const TOAST_STYLES = {
    badge:   'bg-yellow-50 border-yellow-200 text-yellow-800',
    message: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50 border-red-200 text-red-800',
};

export default function Toast() {
    const { toasts, removeToast } = useNotification();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium animate-in slide-in-from-right ${TOAST_STYLES[toast.type]}`}
                >
                    {toast.icon && <span className="text-xl flex-shrink-0">{toast.icon}</span>}
                    <span className="flex-1">{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-current opacity-50 hover:opacity-100 transition flex-shrink-0"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}