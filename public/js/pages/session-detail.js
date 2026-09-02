// ============================================================
// session-detail.js — Session detail, staff, registrations, CSV
// ============================================================

async function renderSessionDetailPage(sessionId) {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const data = await api.get(`/sessions/${sessionId}`);
        const session = data.session || data;
        const isOrganizer = currentUser.role === 'organizer';

        // Capacity bar
        const occupied = session.occupiedCount || 0;
        const capacity = session.capacity || 1;
        const pct = Math.round((occupied / capacity) * 100);
        let barColor = '#16a34a';
        if (pct >= 95) barColor = '#dc2626';
        else if (pct >= 80) barColor = '#d97706';

        // Staff section (organizer only)
        let staffHtml = '';
        if (isOrganizer) {
            try {
                const staffList = await api.get(`/sessions/${sessionId}/staff`);
                const staffArr = staffList.staff || staffList || [];

                // Fetch all check_in_staff users for the dropdown
                const allUsersData = await api.get('/users?role=check_in_staff');
                const allStaff = allUsersData.users || [];
                // Filter out already assigned staff
                const assignedIds = staffArr.map(s => s.id);
                const available = allStaff.filter(u => !assignedIds.includes(u.id));

                staffHtml = `
                    <div class="card" style="margin-top:1.5rem;">
                        <h3>Staff Assignments</h3>
                        ${staffArr.length > 0 ? `
                            <ul style="margin:0.5rem 0; padding-left:1.5rem;">
                                ${staffArr.map(s => `
                                    <li style="margin-bottom:0.3rem;">
                                        ${escapeHtml(s.name)} (${escapeHtml(s.email)}) — <strong>ID: ${s.id}</strong>
                                        <button class="btn-danger btn-sm" style="margin-left:0.5rem;padding:2px 8px;font-size:0.75rem;" onclick="removeStaff(${sessionId}, ${s.id})">Remove</button>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : '<p class="text-muted" style="margin:0.5rem 0;">No staff assigned yet.</p>'}
                        ${available.length > 0 ? `
                            <div style="display:flex; gap:0.5rem; margin-top:0.75rem;">
                                <select id="staff-user-id" style="min-width:200px;">
                                    <option value="">Select staff member...</option>
                                    ${available.map(u => `<option value="${u.id}">${escapeHtml(u.name)} (${escapeHtml(u.email)})</option>`).join('')}
                                </select>
                                <button class="btn-primary btn-sm" onclick="assignStaff(${sessionId})">Assign</button>
                            </div>
                        ` : '<p class="text-muted" style="margin-top:0.5rem;font-size:0.85rem;">All staff members are already assigned.</p>'}
                    </div>
                `;
            } catch (e) { /* ignore staff errors */ }
        }

        // Registrations
        let regsHtml = '';
        try {
            const regData = await api.get(`/registrations?sessionId=${sessionId}&limit=100`);
            const regs = regData.registrations || [];
            regsHtml = regs.length > 0 ? `
                <table class="data-table">
                    <thead><tr>
                        <th>Name</th><th>Email</th><th>Status</th><th>Reserved</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                        ${regs.map(r => `
                            <tr onclick="window.location.hash='#/registrations/${r.id}'" style="cursor:pointer;">
                                <td>${escapeHtml(r.attendee_name)}</td>
                                <td>${escapeHtml(r.attendee_email)}</td>
                                <td><span class="status-badge status-${r.status}">${escapeHtml(r.status)}</span></td>
                                <td>${r.reserved_at ? new Date(r.reserved_at).toLocaleString() : ''}</td>
                                <td onclick="event.stopPropagation();">
                                    ${r.status === 'reserved' ? `
                                        <button class="btn-primary btn-sm" onclick="regAction(${r.id},'confirm',${sessionId})">Confirm</button>
                                        <button class="btn-danger btn-sm" onclick="regAction(${r.id},'cancel',${sessionId})">Cancel</button>
                                    ` : r.status === 'confirmed' ? `
                                        <button class="btn-primary btn-sm" onclick="regAction(${r.id},'check-in',${sessionId})">Check In</button>
                                        <button class="btn-danger btn-sm" onclick="regAction(${r.id},'cancel',${sessionId})">Cancel</button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div class="empty-state">No registrations yet.</div>';
        } catch (e) {
            regsHtml = '<div class="empty-state">No registrations yet.</div>';
        }

        app.innerHTML = `
            <div class="breadcrumb">
                <a href="#/events">Events</a> / <a href="#/events/${session.event_id}">${escapeHtml(session.event_name || 'Event')}</a> / ${escapeHtml(session.title)}
            </div>

            <div class="card" style="margin-top:1rem;">
                <div class="flex-between">
                    <h2>${escapeHtml(session.title)}</h2>
                </div>
                <div class="meta">🕐 ${escapeHtml(session.start_time)} · ${session.duration_minutes} min</div>
                <div class="meta">📍 ${escapeHtml(session.location)}</div>
                <div style="margin-top:1rem;">
                    <strong>Capacity:</strong> ${occupied} / ${capacity} seats
                    <div style="width:100%;height:10px;background:#e2e8f0;border-radius:5px;margin-top:5px;overflow:hidden;">
                        <div style="width:${Math.min(pct,100)}%;height:100%;background:${barColor};transition:width 0.3s;"></div>
                    </div>
                </div>
            </div>

            ${staffHtml}

            <div class="card" style="margin-top:1.5rem;">
                <div class="flex-between">
                    <h3>Registrations</h3>
                    <div class="flex gap-1">
                        <button class="btn-primary btn-sm" onclick="openNewRegModal(${sessionId})">+ Register</button>
                        <label class="btn-secondary btn-sm" style="cursor:pointer;display:inline-block;padding:0.3rem 0.8rem;">
                            📥 Import CSV <input type="file" id="csv-file-input" accept=".csv" style="display:none;" onchange="handleCsvImport(${sessionId}, this)" />
                        </label>
                        <a href="/api/sessions/${sessionId}/registrations/export" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none;display:inline-block;padding:0.3rem 0.8rem;">📤 Export CSV</a>
                    </div>
                </div>
                <div id="import-results"></div>
                <div style="margin-top:1rem;">${regsHtml}</div>
            </div>
        `;
    } catch (err) {
        app.innerHTML = `<div class="error-text">${escapeHtml(err.message)}</div>`;
    }
}

async function regAction(regId, action, sessionId) {
    try {
        await api.patch(`/registrations/${regId}/${action}`);
        showToast(`Registration ${action}ed successfully`);
        renderSessionDetailPage(sessionId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function openNewRegModal(sessionId) {
    openModal(`
        <h3>New Registration</h3>
        <div id="reg-form-error" class="error-text"></div>
        <div class="form-group">
            <label>Attendee Name</label>
            <input id="reg-name" placeholder="Full name" />
        </div>
        <div class="form-group">
            <label>Attendee Email</label>
            <input id="reg-email" type="email" placeholder="email@example.com" />
        </div>
        <div class="modal-actions">
            <button class="btn-primary" onclick="submitNewReg(${sessionId})">Reserve Seat</button>
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
    `);
}

async function submitNewReg(sessionId) {
    const errorEl = document.getElementById('reg-form-error');
    errorEl.textContent = '';
    try {
        await api.post(`/sessions/${sessionId}/registrations`, {
            attendeeName: document.getElementById('reg-name').value,
            attendeeEmail: document.getElementById('reg-email').value
        });
        closeModal();
        showToast('Registration created');
        renderSessionDetailPage(sessionId);
    } catch (err) {
        errorEl.textContent = err.message;
    }
}

async function handleCsvImport(sessionId, input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = await api.post(`/sessions/${sessionId}/registrations/import`, { csvData: e.target.result });
            const s = data.results ? data.results.summary : data.summary || {};
            document.getElementById('import-results').innerHTML = `
                <div class="card" style="margin-top:0.5rem;background:#f0fdf4;padding:1rem;">
                    <strong>Import Complete:</strong> ${s.created || 0} created, ${s.duplicates || 0} duplicates, ${s.invalid || 0} invalid, ${s.capacityFull || 0} full
                </div>
            `;
            renderSessionDetailPage(sessionId);
        } catch (err) {
            showToast('Import failed: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

async function assignStaff(sessionId) {
    const userId = document.getElementById('staff-user-id').value;
    if (!userId) return;
    try {
        await api.post(`/sessions/${sessionId}/staff`, { userId: parseInt(userId) });
        showToast('Staff assigned');
        renderSessionDetailPage(sessionId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function removeStaff(sessionId, userId) {
    try {
        await api.delete(`/sessions/${sessionId}/staff/${userId}`);
        showToast('Staff removed');
        renderSessionDetailPage(sessionId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}
