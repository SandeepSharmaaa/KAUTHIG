// ============================================================
// events.js — Events list page with archive toggle
// ============================================================

let showArchived = false;

async function renderEventsPage() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const queryParam = showArchived ? '?includeArchived=true' : '';
        const data = await api.get('/events' + queryParam);
        const events = data.events;
        const canCreate = currentUser.role === 'organizer';

        app.innerHTML = `
            <div class="page-header">
                <h2>Events</h2>
                <div class="flex gap-1">
                    <label class="toggle-label">
                        <input type="checkbox" id="archive-toggle" ${showArchived ? 'checked' : ''} onchange="toggleArchiveFilter()" />
                        Show Archived
                    </label>
                    ${canCreate ? '<button class="btn-primary" onclick="openCreateEventModal()">+ New Event</button>' : ''}
                </div>
            </div>
            <div id="events-list"></div>
        `;

        const listEl = document.getElementById('events-list');

        if (events.length === 0) {
            listEl.innerHTML = '<div class="empty-state">📅 No events found.</div>';
            return;
        }

        listEl.innerHTML = events.map((ev) => `
            <div class="card card-hover" onclick="window.location.hash='#/events/${ev.id}'" style="cursor:pointer;">
                <div class="flex-between">
                    <h3>${escapeHtml(ev.name)}</h3>
                    ${ev.is_archived ? '<span class="status-badge status-cancelled">Archived</span>' : '<span class="status-badge status-confirmed">Active</span>'}
                </div>
                <div class="meta">📍 ${escapeHtml(ev.venue)}</div>
                <div class="meta">📆 ${escapeHtml(ev.start_date)} to ${escapeHtml(ev.end_date)}</div>
            </div>
        `).join('');
    } catch (err) {
        app.innerHTML = `<div class="error-text">${escapeHtml(err.message)}</div>`;
    }
}

function toggleArchiveFilter() {
    showArchived = document.getElementById('archive-toggle').checked;
    renderEventsPage();
}

function openCreateEventModal() {
    openModal(`
        <h3>New Event</h3>
        <div id="event-form-error" class="error-text"></div>
        <div class="form-group">
            <label>Name</label>
            <input id="ev-name" placeholder="Event name" />
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea id="ev-desc" rows="3" placeholder="Optional description"></textarea>
        </div>
        <div class="form-group">
            <label>Start Date</label>
            <input id="ev-start" type="date" />
        </div>
        <div class="form-group">
            <label>End Date</label>
            <input id="ev-end" type="date" />
        </div>
        <div class="form-group">
            <label>Venue</label>
            <input id="ev-venue" placeholder="Venue location" />
        </div>
        <div class="modal-actions">
            <button class="btn-primary" onclick="submitCreateEvent()">Create Event</button>
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
    `);
}

async function submitCreateEvent() {
    const errorEl = document.getElementById('event-form-error');
    errorEl.textContent = '';

    try {
        await api.post('/events', {
            name: document.getElementById('ev-name').value,
            description: document.getElementById('ev-desc').value,
            startDate: document.getElementById('ev-start').value,
            endDate: document.getElementById('ev-end').value,
            venue: document.getElementById('ev-venue').value
        });
        closeModal();
        showToast('Event created successfully');
        renderEventsPage();
    } catch (err) {
        errorEl.textContent = err.message;
    }
}