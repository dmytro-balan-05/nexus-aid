'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function CreateCampaignButton() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    const role = user.role?.toLowerCase() || '';

    const canCreate = role === 'volonteer' || role === 'admin';

    if (!canCreate) {
        return null;
    }

    return (
        <Link
            href="/campaigns/create"
            className="bg-black text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition shadow-lg hover:shadow-xl flex items-center gap-2"
        >
            <span>+</span> Створити збір
        </Link>
    );
}