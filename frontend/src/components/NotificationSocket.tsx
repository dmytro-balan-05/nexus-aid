'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nexus-aid-production.up.railway.app';

export default function NotificationSocket() {
    const { user } = useAuth();
    const { addToast, setUnreadChatCount, setNewBadgeCount, setSocket, isChatOpen } = useNotification();
    const socketRef = useRef<Socket | null>(null);
    const badgeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isChatOpenRef = useRef(isChatOpen);

    useEffect(() => {
        isChatOpenRef.current = isChatOpen;
    }, [isChatOpen]);

    useEffect(() => {
        if (!user) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            setSocket(null);
            if (badgeIntervalRef.current) clearInterval(badgeIntervalRef.current);
            return;
        }

        const knownRole = localStorage.getItem('known_role');
        if (knownRole && knownRole !== user.role && user.role === 'volonteer') {
            addToast('🎉 Вашу заявку схвалено! Ви тепер волонтер', 'success', '🎉');
        }
        localStorage.setItem('known_role', user.role);

        const checkBadges = async () => {
            try {
                const res = await fetch('/api/gamification/me', { credentials: 'include' });
                if (!res.ok) return;
                const data = await res.json();
                const badges: { key: string; name: string; icon: string }[] = data.badges || [];
                const stored = localStorage.getItem('known_badge_ids');
                const known = stored !== null ? JSON.parse(stored) as string[] : null;

                if (known !== null) {
                    const newBadges = badges.filter(b => !known.includes(b.key));
                    if (newBadges.length > 0) {
                        newBadges.forEach(b => addToast(`🏅 Новий бейдж: ${b.name}`, 'badge', b.icon));
                        setNewBadgeCount(prev => prev + newBadges.length);
                    }
                }
                localStorage.setItem('known_badge_ids', JSON.stringify(badges.map(b => b.key)));
            } catch {}
        };

        const connect = async () => {
            try {
                const res = await fetch('/api/auth/ws-token', { credentials: 'include' });
                const { token } = await res.json();

                const socket = io(`${BACKEND_URL}/chat`, {
                    auth: { token },
                    transports: ['websocket', 'polling'],
                });

                socket.on('connect', () => console.log('[WS] Connected'));
                socket.on('disconnect', () => setSocket(null));

                socket.on('new_message', (message: any) => {
                    if (user.role === 'volonteer' && message.isAdmin && !isChatOpenRef.current) {
                        setUnreadChatCount(prev => prev + 1);
                    }
                });

                socket.on('verification_approved', () => {
                    addToast('🎉 Вашу заявку схвалено! Ви тепер волонтер', 'success', '🎉');
                });

                socketRef.current = socket;
                setSocket(socket);
            } catch {}
        };

        if (user.role === 'volonteer') {
            fetch('/api/chat/me/unread', { credentials: 'include' })
                .then(r => r.json())
                .then(data => { if (typeof data === 'number') setUnreadChatCount(data); })
                .catch(() => {});
        }

        connect();
        checkBadges();
        badgeIntervalRef.current = setInterval(checkBadges, 10000);

        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
            setSocket(null);
            if (badgeIntervalRef.current) {
                clearInterval(badgeIntervalRef.current);
                badgeIntervalRef.current = null;
            }
        };
    }, [user]);

    return null;
}