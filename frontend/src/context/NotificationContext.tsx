'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
    id: number;
    message: string;
    type: 'badge' | 'message' | 'success' | 'error';
    icon?: string;
}

interface NotificationContextType {
    toasts: Toast[];
    addToast: (message: string, type?: Toast['type'], icon?: string) => void;
    removeToast: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType>({
    toasts: [],
    addToast: () => {},
    removeToast: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: Toast['type'] = 'success', icon?: string) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type, icon }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotification = () => useContext(NotificationContext);