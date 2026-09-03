// ============================================================
// router.js — Hash-based SPA router
// ============================================================

async function router() {
    const hash = window.location.hash || '#/login';
    const parts = hash.replace('#/', '').split('/');
    const path = parts[0];
    const param = parts[1];

    // Auth guard — skip for login and signup pages
    if (path !== 'login' && path !== 'signup') {
        const user = await checkAuth();
        if (!user) {
            window.location.hash = '#/login';
            return;
        }
        renderNavbar();
    } else {
        renderNavbar(); // will hide itself when no user
    }

    // Route matching
    switch (path) {
        case 'login':
            renderLoginPage();
            break;

        case 'signup':
            renderSignupPage();
            break;

        case 'dashboard':
            renderDashboardPage();
            break;

        case 'events':
            if (param) {
                renderEventDetailPage(param);
            } else {
                renderEventsPage();
            }
            break;

        case 'sessions':
            if (param) {
                renderSessionDetailPage(param);
            }
            break;

        case 'registrations':
            if (param) {
                renderRegistrationDetailPage(param);
            } else {
                renderRegistrationsPage();
            }
            break;

        case 'my-registrations':
            renderMyRegistrationsPage();
            break;

        case 'my-assignments':
            renderMyAssignmentsPage();
            break;

        case 'alerts':
            renderAlertsPage();
            break;

        case 'staff-management':
            renderStaffManagementPage();
            break;

        default:
            if (currentUser) {
                window.location.hash = currentUser.role === 'guest' ? '#/events' : '#/dashboard';
            } else {
                window.location.hash = '#/login';
            }
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);