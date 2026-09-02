const API_BASE = '/api';

async function apiRequest(path, options = {}) {
    const res = await fetch(API_BASE + path, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers },
        credentials: 'include'
    });

    if (res.status === 401) {
        window.location.hash = '#/login';
        throw new Error('Not authenticated');
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error?.message || 'Request failed');
    }

    return data;
}

const api = {
    get: (path) => apiRequest(path),
    post: (path, body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body) => apiRequest(path, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (path, body) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) })
};