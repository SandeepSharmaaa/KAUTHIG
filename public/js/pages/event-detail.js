// ============================================================
// event-detail.js — Event detail page with sessions & edit
// ============================================================

async function renderEventDetailPage(eventId) {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const data = await api.get(`/events/${eventId}`);
        const ev = data.event;
        const canEdit = currentUser.role === 'organizer';

        app.innerHTML = `
            <div class="breadcrumb">
                <a href="#/events">Events</a> / ${escapeHtml(ev.name)}
            </div>

            <div class="card" style="margin-top:1rem;">
                <div class="flex-between">
                    <h2>${escapeHtml(ev.name)}</h2>
                    ${canEdit ? `
                        <div class="flex gap-1">
                            <button class="btn-secondary btn-sm" onclick="openEditEventModal(${ev.id})">✏️ Edit</button>
                            <button class="btn-secondary btn-sm" onclick="toggleArchive(${ev.id}, ${ev.is_archived})">
                                ${ev.is_archived ? '📂 Restore' : '📁 Archive'}
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="meta">📍 ${escapeHtml(ev.venue)}</div>
                <div class="meta">📆 ${escapeHtml(ev.start_date)} to ${escapeHtml(ev.end_date)}</div>
                ${ev.description ? `<p style="margin-top:1rem; color:#475569;">${escapeHtml(ev.description)}</p>` : ''}
                ${ev.is_archived ? '<div class="status-badge status-cancelled" style="margin-top:0.5rem;">Archived</div>' : ''}
            </div>

            <div class="page-header" style="margin-top:2rem;">
                <h3>Sessions (${ev.sessions.length})</h3>
                ${canEdit ? `<button class="btn-primary btn-sm" onclick="openCreateSessionModal(${ev.id})">+ Add Session</button>` : ''}
            </div>

            <div id="sessions-list">
                ${ev.sessions.length === 0
                    ? '<div class="empty-state">📝 No sessions yet. Add your first session above.</div>'
                    : ev.sessions.map((s) => `
                        <div class="card card-hover" onclick="window.location.hash='#/sessions/${s.id}'" style="cursor:pointer;">
                            <div class="flex-between">
                                <h4>${escapeHtml(s.title)}</h4>
                                <span class="meta">Capacity: ${s.capacity}</span>
                            </div>
                            <div class="meta">🕐 ${escapeHtml(s.start_time)} · ${s.duration_minutes} min · 📍 ${escapeHtml(s.location)}</div>
                        </div>
                    `).join('')}
            </div>
        `;
    } catch (err) {
        app.innerHTML = `<div class="error-text">${escapeHtml(err.message)}</div>`;
    }
}

async function toggleArchive(eventId) {
    try {
        await api.patch(`/events/${eventId}/archive`);
        showToast('Archive status updated');
        renderEventDetailPage(eventId);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function openEditEventModal(eventId) {
    // Fetch current data to pre-fill
    api.get(`/events/${eventId}`).then(data => {
        const ev = data.event;
        openModal(`
            <h3>Edit Event</h3>
            <div id="edit-event-error" class="error-text"></div>
            <div class="form-group">
                <label>Name</label>
                <input id="edit-ev-name" value="${escapeHtml(ev.name)}" />
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="edit-ev-desc" rows="3">${escapeHtml(ev.description || '')}</textarea>
            </div>
            <div class="form-group">
                <label>Start Date</label>
                <input id="edit-ev-start" type="date" value="${ev.start_date}" />
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input id="edit-ev-end" type="date" value="${ev.end_date}" />
            </div>
            <div class="form-group">
                <label>Venue</label>
                <input id="edit-ev-venue" value="${escapeHtml(ev.venue)}" />
            </div>
            <div class="modal-actions">
                <button class="btn-primary" onclick="submitEditEvent(${eventId})">Save Changes</button>
                <button class="btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        `);
    });
}

async function submitEditEvent(eventId) {
    const errorEl = document.getElementById('edit-event-error');
    errorEl.textContent = '';

    try {
        await api.put(`/events/${eventId}`, {
            name: document.getElementById('edit-ev-name').value,
            description: document.getElementById('edit-ev-desc').value,
            startDate: document.getElementById('edit-ev-start').value,
            endDate: document.getElementById('edit-ev-end').value,
            venue: document.getElementById('edit-ev-venue').value
        });
        closeModal();
        showToast('Event updated successfully');
        renderEventDetailPage(eventId);
    } catch (err) {
        errorEl.textContent = err.message;
    }
}

function openCreateSessionModal(eventId) {
    openModal(`
        <h3>New Session</h3>
        <div id="session-form-error" class="error-text"></div>
        <div class="form-group">
            <label>Title</label>
            <input id="sess-title" placeholder="Session title" />
        </div>
        <div class="form-group">
            <label>Start Time</label>
            <input id="sess-start" type="datetime-local" />
        </div>
        <div class="form-group">
            <label>Duration (minutes)</label>
            <input id="sess-duration" type="number" min="1" value="60" />
        </div>
        <div class="form-group">
            <label>Location</label>
            <input id="sess-location" placeholder="Room or hall" />
        </div>
        <div class="form-group">
            <label>Capacity</label>
            <input id="sess-capacity" type="number" min="1" value="30" />
        </div>
        <div class="modal-actions">
            <button class="btn-primary" onclick="submitCreateSession(${eventId})">Create Session</button>
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
    `);
}

async function submitCreateSession(eventId) {
    const errorEl = document.getElementById('session-form-error');
    errorEl.textContent = '';

    try {
        await api.post(`/events/${eventId}/sessions`, {
            title: document.getElementById('sess-title').value,
            startTime: document.getElementById('sess-start').value,
            durationMinutes: parseInt(document.getElementById('sess-duration').value),
            location: document.getElementById('sess-location').value,
            capacity: parseInt(document.getElementById('sess-capacity').value)
        });
        closeModal();
        showToast('Session created successfully');
        renderEventDetailPage(eventId);
    } catch (err) {
        errorEl.textContent = err.message;
    }
}