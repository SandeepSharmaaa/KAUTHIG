// ============================================================
// my-assignments.js — Staff's assigned sessions
// ============================================================

async function renderMyAssignmentsPage() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const sessions = await api.get('/my-assignments');
        const list = Array.isArray(sessions) ? sessions : (sessions.assignments || []);

        app.innerHTML = `
            <div class="page-header">
                <h2>My Assignments</h2>
            </div>
            ${list.length === 0 ? '<div class="empty-state">📋 You have no assigned sessions at this time.</div>' : `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem;">
                    ${list.map(s => `
                        <div class="card card-hover" onclick="window.location.hash='#/sessions/${s.id}'" style="cursor:pointer;">
                            <h3>${escapeHtml(s.title)}</h3>
                            <p class="text-muted" style="font-size:0.85rem;">${escapeHtml(s.event_name || 'Event')}</p>
                            <div style="margin-top:0.75rem;">
                                <div class="meta">🕐 ${escapeHtml(s.start_time)} · ${s.duration_minutes} min</div>
                                <div class="meta">📍 ${escapeHtml(s.location)}</div>
                                <div style="margin-top:0.5rem;"><strong>Active Registrations:</strong> ${s.active_registration_count || 0} / ${s.capacity}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        `;
    } catch (err) {
        app.innerHTML = `<div class="error-text">${escapeHtml(err.message)}</div>`;
    }
}
