async function renderEventDetailPage(eventId) {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="empty-state">Loading...</div>';

    try {
        const data = await api.get(`/events/${eventId}`);
        const ev = data.event;
        const canEdit = currentUser.role === 'organizer';

        app.innerHTML = `
            <a href="#/events">&larr; Back to Events</a>
            <div class="card" style="margin-top:1rem;">
                <h2>${ev.name}</h2>
                <div class="meta">${ev.start_date} to ${ev.end_date} — ${ev.venue}</div>
                <p style="margin:1rem 0;">${ev.description || ''}</p>
                ${canEdit ? `
                    <button class="secondary" onclick="toggleArchive(${ev.id}, ${ev.is_archived})">
                        ${ev.is_archived ? 'Restore' : 'Archive'}
                    </button>
                ` : ''}
            </div>
            <h3 style="margin-top:1.5rem;">Sessions</h3>
            <div id="sessions-list">
                ${ev.sessions.length === 0
                    ? '<div class="empty-state">No sessions yet.</div>'
                    : ev.sessions.map((s) => `
                        <div class="card">
                            <h3>${s.title}</h3>
                            <div class="meta">${s.start_time} — ${s.location} — Capacity: ${s.capacity}</div>
                        </div>
                    `).join('')}
            </div>
        `;
    } catch (err) {
        app.innerHTML = `<div class="error-text">${err.message}</div>`;
    }
}

async function toggleArchive(eventId, currentlyArchived) {
    try {
        await api.patch(`/events/${eventId}/archive`, { isArchived: !currentlyArchived });
        renderEventDetailPage(eventId);
    } catch (err) {
        alert(err.message);
    }
}