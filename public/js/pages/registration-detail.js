// ============================================================
// registration-detail.js — Single registration detail + timeline
// ============================================================

async function renderRegistrationDetailPage(regId) {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const data = await api.get(`/registrations/${regId}`);
        const reg = data.registration || data;
        const timeline = reg.timeline || [];

        // Action buttons based on current status
        let actionsHtml = '';
        if (reg.status === 'reserved') {
            actionsHtml = `
                <button class="btn-primary btn-sm" onclick="regDetailAction(${reg.id}, 'confirm')">✅ Confirm</button>
                <button class="btn-danger btn-sm" onclick="regDetailAction(${reg.id}, 'cancel')">❌ Cancel</button>
            `;
        } else if (reg.status === 'confirmed') {
            actionsHtml = `
                <button class="btn-primary btn-sm" onclick="regDetailAction(${reg.id}, 'check-in')">📋 Check In</button>
                <button class="btn-danger btn-sm" onclick="regDetailAction(${reg.id}, 'cancel')">❌ Cancel</button>
            `;
        } else {
            actionsHtml = `<span class="text-muted">No actions available (terminal state)</span>`;
        }

        app.innerHTML = `
            <div class="breadcrumb">
                <a href="#/registrations">Registrations</a> / ${escapeHtml(reg.attendee_name)}
            </div>

            <div class="card" style="margin-top:1rem;">
                <div class="flex-between">
                    <h2>Registration #${reg.id}</h2>
                    <span class="status-badge status-${reg.status}">${escapeHtml(reg.status)}</span>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:1.5rem;">
                    <div>
                        <h4 style="margin-bottom:0.5rem;">Attendee</h4>
                        <p><strong>Name:</strong> ${escapeHtml(reg.attendee_name)}</p>
                        <p><strong>Email:</strong> ${escapeHtml(reg.attendee_email)}</p>
                    </div>
                    <div>
                        <h4 style="margin-bottom:0.5rem;">Session</h4>
                        <p><strong>Session:</strong> <a href="#/sessions/${reg.session_id}">${escapeHtml(reg.session_title || 'Session ' + reg.session_id)}</a></p>
                        <p><strong>Event:</strong> ${escapeHtml(reg.event_name || '')}</p>
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid #e2e8f0;">
                    <div><strong>Reserved:</strong><br/>${reg.reserved_at ? new Date(reg.reserved_at).toLocaleString() : '—'}</div>
                    <div><strong>Confirmed:</strong><br/>${reg.confirmed_at ? new Date(reg.confirmed_at).toLocaleString() : '—'}</div>
                    <div><strong>Checked In:</strong><br/>${reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleString() : '—'}</div>
                    <div><strong>Cancelled:</strong><br/>${reg.cancelled_at ? new Date(reg.cancelled_at).toLocaleString() : '—'}</div>
                </div>

                <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #e2e8f0;">
                    <h4>Actions</h4>
                    <div class="flex gap-1" style="margin-top:0.5rem;">
                        ${actionsHtml}
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top:1.5rem;">
                <h3>Add Note</h3>
                <div style="display:flex;gap:0.5rem;margin-top:0.75rem;">
                    <input id="note-input" placeholder="Type a note..." style="flex:1;" />
                    <button class="btn-primary btn-sm" onclick="submitRegNote(${reg.id})">Add Note</button>
                </div>
            </div>

            <div class="card" style="margin-top:1.5rem;">
                <h3>Timeline</h3>
                <div class="timeline" style="margin-top:1rem;">
                    ${timeline.length > 0 ? timeline.map(t => `
                        <div class="timeline-item" style="padding:0.75rem;border-left:3px solid #2563eb;margin-bottom:0.75rem;margin-left:0.5rem;padding-left:1rem;background:#f8fafc;border-radius:0 4px 4px 0;">
                            <div class="flex-between">
                                <strong>${escapeHtml(t.action)}</strong>
                                <span class="text-muted" style="font-size:0.8rem;">${t.performed_at ? new Date(t.performed_at).toLocaleString() : ''}</span>
                            </div>
                            ${t.old_status || t.new_status ? `<div style="margin-top:0.25rem;"><span class="status-badge status-${t.old_status || ''}">${escapeHtml(t.old_status || '—')}</span> → <span class="status-badge status-${t.new_status || ''}">${escapeHtml(t.new_status || '—')}</span></div>` : ''}
                            ${t.performed_by_name ? `<div class="text-muted" style="font-size:0.8rem;margin-top:0.25rem;">by ${escapeHtml(t.performed_by_name)}</div>` : ''}
                            ${t.note ? `<div style="margin-top:0.5rem;padding:0.5rem;background:#fff;border-radius:4px;">${escapeHtml(t.note)}</div>` : ''}
                        </div>
                    `).join('') : '<p class="text-muted">No timeline events yet.</p>'}
                </div>
            </div>
        `;
    } catch (err) {
        app.innerHTML = `<div class="error-text">${escapeHtml(err.message)}</div>`;
    }
}

async function regDetailAction(regId, action) {
    try {
        await api.patch(`/registrations/${regId}/${action}`);
        showToast(`Registration ${action} successful`);
        renderRegistrationDetailPage(regId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function submitRegNote(regId) {
    const input = document.getElementById('note-input');
    const note = input.value.trim();
    if (!note) return;
    try {
        await api.post(`/registrations/${regId}/notes`, { note });
        showToast('Note added');
        renderRegistrationDetailPage(regId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}
