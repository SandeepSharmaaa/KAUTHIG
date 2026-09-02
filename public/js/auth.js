let currentUser = null;

async function checkAuth() {
    try {
        const data = await api.get('/auth/me');
        currentUser = data.user;
        return currentUser;
    } catch {
        currentUser = null;
        return null;
    }
}

async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    currentUser = data.user;
    return data.user;
}

async function logout() {
    await api.post('/auth/logout', {});
    currentUser = null;
    window.location.hash = '#/login';
}