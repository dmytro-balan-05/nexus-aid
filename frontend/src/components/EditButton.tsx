'use client';

import Link from 'next/link';

interface Props {
    campaignId: string;
    authorId: string;
}

export default function EditButton({ campaignId, authorId }: Props) {

    if (typeof window === 'undefined') {
        return null;
    }

    const myId = localStorage.getItem('user_id');
    const myRole = localStorage.getItem('user_role');

    const canEdit = (myId && myId.length > 5) && (myId === authorId || myRole === 'admin');
    if (!canEdit) return null;

    return (
        <div className="mt-4 text-center">
            <Link
                href={`/campaigns/${campaignId}/edit`}
                className="inline-block text-gray-400 hover:text-black text-sm underline transition"
            >
                ⚙️ Редагувати збір / Додати звіт
            </Link>
        </div>
    );
}