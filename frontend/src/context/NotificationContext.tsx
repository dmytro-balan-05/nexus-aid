'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

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
    unreadChatCount: number;
    setUnreadChatCount: React.Dispatch<React.SetStateAction<number>>;
    newBadgeCount: number;
    setNewBadgeCount: React.Dispatch<React.SetStateAction<number>>;
    adminUnreadCount: number;
    setAdminUnreadCount: React.Dispatch<React.SetStateAction<number>>;
    socket: Socket | null;
    setSocket: (socket: Socket | null) => void;
    isChatOpen: boolean;
    setIsChatOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType>({
    toasts: [],
    addToast: () => {},
    removeToast: () => {},
    unreadChatCount: 0,
    setUnreadChatCount: () => {},
    newBadgeCount: 0,
    setNewBadgeCount: () => {},
    adminUnreadCount: 0,
    setAdminUnreadCount: () => {},
    socket: null,
    setSocket: () => {},
    isChatOpen: false,
    setIsChatOpen: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [newBadgeCount, setNewBadgeCount] = useState(0);
    const [adminUnreadCount, setAdminUnreadCount] = useState(0);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const addToast = useCallback((message: string, type: Toast['type'] = 'success', icon?: string) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type, icon }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{
            toasts, addToast, removeToast,
            unreadChatCount, setUnreadChatCount,
            newBadgeCount, setNewBadgeCount,
            adminUnreadCount, setAdminUnreadCount,
            socket, setSocket,
            isChatOpen, setIsChatOpen,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotification = () => useContext(NotificationContext);