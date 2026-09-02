async function router() {
    const hash = window.location.hash || '#/login';
    const [, path, param] = hash.split('/');

    if (path !== 'login') {
        const user = await checkAuth();
        if (!user) {
            window.location.hash = '#/login';
            return;
        }
    }

    renderNavbar();

    if (path === 'login') {
        renderLoginPage();
    } else if (path === 'events' && !param) {
        renderEventsPage();
    } else if (path === 'events' && param) {
        renderEventDetailPage(param);
    } else {
        window.location.hash = '#/events';
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);