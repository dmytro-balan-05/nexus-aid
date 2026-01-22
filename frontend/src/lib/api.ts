const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Функція для отримання заголовків з токеном
const getHeaders = () => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('jwt_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const api = {
    get: async (endpoint: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    post: async (endpoint: string, body: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error occurred');
        }
        return res.json();
    },

    patch: async (endpoint: string, body: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to update');
        return res.json();
    },
};