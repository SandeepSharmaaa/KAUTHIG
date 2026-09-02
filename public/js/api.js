// ============================================================
// api.js — Fetch wrapper, XSS helper, and toast notifications
// ============================================================

const API_BASE = '/api';

// ── XSS Protection ─────────────────────────────────────────
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ── Toast Notifications ────────────────────────────────────
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-visible'), 10);
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ── API Request Wrapper ────────────────────────────────────
async function apiRequest(path, options = {}) {
    const config = { ...options, credentials: 'include' };

    // Only set Content-Type for requests with JSON body
    if (options.body) {
        config.headers = { 'Content-Type': 'application/json', ...options.headers };
    } else {
        config.headers = { ...options.headers };
    }

    const res = await fetch(API_BASE + path, config);

    if (res.status === 401) {
        window.location.hash = '#/login';
        throw new Error('Not authenticated');
    }

    // Handle non-JSON responses (e.g., CSV export)
    const contentType = res.headers.get('Content-Type') || '';
    if (contentType.includes('text/csv')) {
        if (!res.ok) throw new Error('Export failed');
        return res.text();
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error?.message || 'Request failed');
    }

    return data;
}

// ── API Methods ────────────────────────────────────────────
const api = {
    get:    (path) => apiRequest(path),
    post:   (path, body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) }),
    put:    (path, body) => apiRequest(path, { method: 'PUT', body: JSON.stringify(body) }),
    patch:  (path, body) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (path) => apiRequest(path, { method: 'DELETE' })
};