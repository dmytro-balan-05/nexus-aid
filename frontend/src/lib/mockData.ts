import { Campaign } from './types';

export const MOCK_CAMPAIGNS: Campaign[] = [
    {
        id: '1',
        title: 'Дрони Mavic 3T для розвідки',
        shortDescription: 'Терміновий збір на 2 дрони з тепловізорами для хлопців на Сході.',
        fullDescription: 'Наш підрозділ потребує "очей" вночі. Збираємо на два DJI Mavic 3T. Це дозволить ефективно виявляти ворога та коригувати вогонь у темний час доби. Офіційний запит від командира додано в документи.',

        goalAmount: 400000,
        currentAmount: 156000,

        location: 'Запорізький напрямок',
        beneficiary: '110 ОМБр',
        category: 'military',
        status: 'active',
        createdAt: '2026-01-20T10:00:00Z',

        author: {
            id: 'usr_1',
            firstName: 'Олександр',
            lastName: 'Петренко',
            isVerified: true,
            avatarUrl: '',
        },

        images: [], // Тут будут ссылки на фото
        documents: ['request_scan.pdf', 'invoice.pdf'], // Пруфы
    },
    {
        id: '2',
        title: 'Ліки та турнікети',
        shortDescription: 'Закупівля качесвтених турнікетів CAT та гемостатиків.',
        fullDescription: 'Медики на "нулі" потребують поповнення запасів. Закуповуємо оригінальні турнікети CAT Gen 7 та кровоспинні бинти.',

        goalAmount: 50000,
        currentAmount: 12500,

        location: 'Харківська область',
        beneficiary: 'Госпітальєри',
        category: 'medical',
        status: 'active',
        createdAt: '2026-01-21T14:30:00Z',

        author: {
            id: 'usr_2',
            firstName: 'Марія',
            lastName: 'Коваль',
            isVerified: false,
        },

        images: [],
        documents: [],
    },
];