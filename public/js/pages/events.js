async function renderEventsPage() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="empty-state">Loading events...</div>';

    try {
        const data = await api.get('/events');
        const events = data.events;

        const canCreate = currentUser.role === 'organizer';

        app.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h2>Events</h2>
                ${canCreate ? '<button class="primary" onclick="openCreateEventModal()">+ New Event</button>' : ''}
            </div>
            <div id="events-list"></div>
        `;

        const listEl = document.getElementById('events-list');

        if (events.length === 0) {
            listEl.innerHTML = '<div class="empty-state">No events yet.</div>';
            return;
        }

        listEl.innerHTML = events.map((ev) => `
            <div class="card" onclick="window.location.hash='#/events/${ev.id}'" style="cursor:pointer;">
                <h3>${ev.name}</h3>
                <div class="meta">${ev.start_date} to ${ev.end_date} — ${ev.venue}</div>
                <div class="meta">${ev.is_archived ? 'Archived' : 'Active'}</div>
            </div>
        `).join('');
    } catch (err) {
        app.innerHTML = `<div class="error-text">${err.message}</div>`;
    }
}

function openCreateEventModal() {
    openModal(`
        <h3>New Event</h3>
        <div id="event-form-error" class="error-text"></div>
        <label>Name</label>
        <input id="ev-name" />
        <label>Description</label>
        <textarea id="ev-desc" rows="3"></textarea>
        <label>Start Date</label>
        <input id="ev-start" type="date" />
        <label>End Date</label>
        <input id="ev-end" type="date" />
        <label>Venue</label>
        <input id="ev-venue" />
        <div style="display:flex; gap:0.5rem; margin-top:1rem;">
            <button class="primary" onclick="submitCreateEvent()">Create</button>
            <button class="secondary" onclick="closeModal()">Cancel</button>
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
        renderEventsPage();
    } catch (err) {
        errorEl.textContent = err.message;
    }
}