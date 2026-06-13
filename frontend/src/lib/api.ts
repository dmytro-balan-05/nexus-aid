const API_URL = '/api';

const getHeaders = (): HeadersInit => {
    return { 'Content-Type': 'application/json' };
};

const extractError = async (res: Response): Promise<string> => {
    const text = await res.text();
    try {
        const json = JSON.parse(text);
        return json.message || text || 'Помилка';
    } catch {
        return text || 'Помилка';
    }
};

export const api = {
    get: async <T = unknown>(endpoint: string): Promise<T | null> => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include',
        });

        if (res.status === 401) return null;

        const text = await res.text();
        if (!text) return null;

        return JSON.parse(text) as T;
    },

    post: async <T = unknown>(endpoint: string, body: unknown): Promise<T> => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body),
            credentials: 'include',
        });

        if (!res.ok) {
            throw new Error(await extractError(res));
        }

        const text = await res.text();
        return text ? (JSON.parse(text) as T) : ({} as T);
    },

    patch: async <T = unknown>(endpoint: string, body: unknown): Promise<T> => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(body),
            credentials: 'include',
        });

        if (!res.ok) {
            throw new Error(await extractError(res));
        }

        const text = await res.text();
        return text ? (JSON.parse(text) as T) : ({} as T);
    },
};