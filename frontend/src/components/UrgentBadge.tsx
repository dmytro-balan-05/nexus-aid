'use client';

import { useTheme } from '@/context/ThemeContext';

export default function UrgentBadge() {
    const { isDark } = useTheme();
    return (
        <span
            style={{ backgroundColor: 'var(--accent)' }}
            className="text-white text-xs font-bold px-2 py-0.5 rounded-full shadow"
        >
            {isDark ? '🔥' : '⚡'} ТЕРМІНОВО
        </span>
    );
}