// ============================================================
// alerts.js — Capacity alerts page
// ============================================================

async function renderAlertsPage() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const data = await api.get('/alerts');
        const alerts = data.alerts || [];
        const isOrganizer = currentUser && currentUser.role === 'organizer';

        if (alerts.length === 0) {
            app.innerHTML = `
                <div class="page-header"><h2>Capacity Alerts</h2></div>
                <div class="empty-state">✅ No capacity alerts. All sessions are within normal limits.</div>
            `;
            return;
        }

        app.innerHTML = `
            <div class="page-header"><h2>Capacity Alerts (${alerts.length})</h2></div>
            <div id="alerts-list">
                ${alerts.map(alert => `
                    <div class="card" style="margin-bottom:1rem;border-left:4px solid #dc2626;">
                        <div class="flex-between">
                            <div>
                                <strong>${escapeHtml(alert.session_title)}</strong>
                                <span class="text-muted" style="margin-left:0.5rem;">(${escapeHtml(alert.event_name || '')})</span>
                                <div class="meta" style="margin-top:0.25rem;">
                                    Capacity: ${alert.active_registration_count || 0} / ${alert.capacity} seats occupied
                                </div>
                            </div>
                            ${isOrganizer ? `<button class="btn-secondary btn-sm dismiss-btn" data-session="${alert.session_id}">Dismiss</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Dismiss handlers
        if (isOrganizer) {
            document.getElementById('alerts-list').addEventListener('click', async (e) => {
                const btn = e.target.closest('.dismiss-btn');
                if (!btn) return;
                const sessionId = btn.dataset.session;
                try {
                    await api.patch(`/alerts/${sessionId}/dismiss`);
                    showToast('Alert dismissed');
                    renderAlertsPage();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        }
    } catch (err) {
        app.innerHTML = `<div class="error-text">${escapeHtml(err.message)}</div>`;
    }
}
