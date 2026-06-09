export type UserRole = 'user' | 'volunteer' | 'admin';

export type CampaignStatus = 'draft' | 'pending' | 'active' | 'rejected' | 'closed';

export type CampaignCategory = 'military' | 'medical' | 'humanitarian' | 'animal';

// Информация об авторе (которая придет с бэкенда через join)
export interface CampaignAuthor {
    id: string;
    name: string;
    avatarUrl?: string; // Если есть аватарка
    isVerified: boolean; // Галочка верификации
}

export interface Campaign {
    id: string;
    title: string;
    shortDescription: string; // Для карточки
    fullDescription: string;  // Для детальной страницы

    // Финансы
    goalAmount: number;
    currentAmount: number;

    // Логистика
    location: string; // Куда поедет помощь (напр. "Донецкая обл.")
    beneficiary: string; // Кто получатель (напр. "3-я ОШБр")
    category: CampaignCategory;

    status: CampaignStatus;
    createdAt: string;

    // Связи
    author: CampaignAuthor;

    // Медиа и документы
    images: string[]; // Фотографии сбора
    documents: string[]; // Ссылки на чеки/документы (пруфы)
}