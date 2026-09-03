// ============================================================
// my-registrations.js — Guest's own registrations
// ============================================================

async function renderMyRegistrationsPage() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const data = await api.get('/registrations/my');
        const regs = data.registrations || [];

        app.innerHTML = `
            <div class="page-header">
                <h2>My Registrations</h2>
            </div>
            ${regs.length === 0 ? `
                <div class="empty-state">
                    <div style="font-size:3rem;">🎫</div>
                    <p>You haven't registered for any sessions yet.</p>
                    <a href="#/events" class="btn-primary" style="display:inline-block;margin-top:1rem;text-decoration:none;">Browse Events →</a>
                </div>
            ` : `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem;">
                    ${regs.map(r => `
                        <div class="card">
                            <div class="flex-between">
                                <h3 style="font-size:1rem;">${escapeHtml(r.session_title || 'Session')}</h3>
                                <span class="status-badge status-${r.status}">${escapeHtml(r.status)}</span>
                            </div>
                            <p class="text-muted" style="font-size:0.85rem;">${escapeHtml(r.event_name || '')}</p>
                            <div style="margin-top:0.75rem;font-size:0.9rem;">
                                <div>📅 Reserved: ${r.reserved_at ? new Date(r.reserved_at).toLocaleString() : '—'}</div>
                                ${r.confirmed_at ? `<div>✅ Confirmed: ${new Date(r.confirmed_at).toLocaleString()}</div>` : ''}
                                ${r.checked_in_at ? `<div>📋 Checked In: ${new Date(r.checked_in_at).toLocaleString()}</div>` : ''}
                            </div>
                            ${r.status === 'reserved' ? `
                                <div style="margin-top:0.75rem;">
                                    <button class="btn-danger btn-sm" onclick="cancelMyReg(${r.id})">Cancel Registration</button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `}
        `;
    } catch (err) {
        app.innerHTML = `<div class="error-text">${escapeHtml(err.message)}</div>`;
    }
}

async function cancelMyReg(regId) {
    if (!confirm('Are you sure you want to cancel this registration?')) return;
    try {
        await api.patch(`/registrations/${regId}/cancel`);
        showToast('Registration cancelled');
        renderMyRegistrationsPage();
    } catch (err) {
        showToast(err.message, 'error');
    }
}
