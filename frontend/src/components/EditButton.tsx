'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Props {
    campaignId: string;
    authorId: string;
}

export default function EditButton({ campaignId, authorId }: Props) {
    const { user, isLoading } = useAuth();

    if (isLoading) return null;

    const canEdit = user && (
        user.role === 'admin' ||
        (user.role === 'volonteer' && user.id === authorId)
    );

    if (!canEdit) return null;

    return (
        <div className="mt-8 pt-6 border-t border-gray-100">
            <Link
                href={`/campaigns/${campaignId}/edit`}
                className="inline-block text-gray-400 hover:text-black text-sm underline transition"
            >
                ⚙️ Редагувати збір / Додати звіт
            </Link>
        </div>
    );
}