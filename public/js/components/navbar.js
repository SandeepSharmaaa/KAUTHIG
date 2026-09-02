// ============================================================
// navbar.js — Navigation bar with role-based links & alert badge
// ============================================================

let alertCount = 0;

async function fetchAlertCount() {
    try {
        const data = await api.get('/alerts/count');
        alertCount = data.count || 0;
    } catch {
        alertCount = 0;
    }
}

function renderNavbar() {
    const el = document.getElementById('navbar');

    if (!currentUser) {
        el.innerHTML = '';
        el.style.display = 'none';
        return;
    }

    el.style.display = '';
    const isOrganizer = currentUser.role === 'organizer';
    const isStaff = currentUser.role === 'check_in_staff';

    // Determine active route for highlighting
    const hash = window.location.hash || '';

    function activeClass(path) {
        return hash.startsWith(path) ? 'nav-link active' : 'nav-link';
    }

    el.innerHTML = `
        <div class="nav-brand">
            <a href="#/dashboard" class="brand-link">KAUTHIG</a>
        </div>
        <div class="nav-links">
            <a href="#/dashboard" class="${activeClass('#/dashboard')}">Dashboard</a>
            <a href="#/events" class="${activeClass('#/events')}">Events</a>
            <a href="#/registrations" class="${activeClass('#/registrations')}">Registrations</a>
            ${isOrganizer ? `<a href="#/staff-management" class="${activeClass('#/staff-management')}">Staff</a>` : ''}
            ${isStaff ? `<a href="#/my-assignments" class="${activeClass('#/my-assignments')}">My Assignments</a>` : ''}
            <a href="#/alerts" class="${activeClass('#/alerts')}">
                Alerts${alertCount > 0 ? `<span class="alert-badge">${alertCount}</span>` : ''}
            </a>
        </div>
        <div class="nav-user">
            <span class="nav-user-info">${escapeHtml(currentUser.name)} <span class="nav-role">${escapeHtml(currentUser.role.replace('_', ' '))}</span></span>
            <button class="btn-logout" onclick="logout()">Logout</button>
        </div>
    `;

    // Refresh alert count in background
    fetchAlertCount().then(() => {
        const badgeEl = el.querySelector('.alert-badge');
        const alertLink = el.querySelector('a[href="#/alerts"]');
        if (alertCount > 0 && !badgeEl && alertLink) {
            alertLink.innerHTML = `Alerts<span class="alert-badge">${alertCount}</span>`;
        } else if (alertCount === 0 && badgeEl) {
            badgeEl.remove();
        }
    });
}