const API_BASE = '/api/v1';
const CSRF_COOKIE_ENDPOINT = '/sanctum/csrf-cookie';
const TOKEN_KEY = 'smartshift_auth_token';

export class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

export function buildQuery(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }

        query.set(key, value);
    });

    const result = query.toString();
    return result ? `?${result}` : '';
}

function readCookie(name) {
    const match = document.cookie
        .split('; ')
        .find((entry) => entry.startsWith(`${name}=`));

    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

export function setAuthToken(token) {
    if (token) {
        localStorage.setItem(TOKEN_KEY, token);
    }
}

export function clearAuthToken() {
    localStorage.removeItem(TOKEN_KEY);
}

async function parseResponse(response) {
    const raw = await response.text();

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw);
    } catch {
        return { message: raw };
    }
}

export async function ensureCsrfCookie() {
    const response = await fetch(CSRF_COOKIE_ENDPOINT, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    if (!response.ok) {
        const data = await parseResponse(response);

        throw new ApiError(
            data?.message ?? 'Unable to initialize CSRF protection.',
            response.status,
            data,
        );
    }
}

export async function api(path, options = {}) {
    const headers = new Headers(options.headers ?? {});

    headers.set('Accept', 'application/json');
    headers.set('X-Requested-With', 'XMLHttpRequest');

    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const csrfToken = readCookie('XSRF-TOKEN');
    if (csrfToken) {
        headers.set('X-XSRF-TOKEN', csrfToken);
    }

    const authToken = localStorage.getItem(TOKEN_KEY);
    if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
    }

    const response = await fetch(`${API_BASE}${path}`, {
        method: options.method ?? 'GET',
        credentials: 'same-origin',
        headers,
        body: options.body
            ? options.body instanceof FormData
                ? options.body
                : JSON.stringify(options.body)
            : undefined,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
        throw new ApiError(
            data?.message ?? 'Request failed.',
            response.status,
            data,
        );
    }

    return data;
}

export function getErrorMessage(error) {
    if (error?.status === 419) {
        return 'Your session expired. Refresh the page and try again.';
    }

    if (error?.status >= 500) {
        return 'The server encountered an unexpected error. Please try again later.';
    }

    if (error?.data?.errors) {
        const firstField = Object.values(error.data.errors)[0];
        if (Array.isArray(firstField) && firstField.length > 0) {
            return firstField[0];
        }
    }

    return error?.message ?? 'Something went wrong.';
}
