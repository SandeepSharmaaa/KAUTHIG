function renderNavbar() {
    const el = document.getElementById('navbar');
    if (!currentUser) {
        el.innerHTML = '';
        return;
    }
    el.innerHTML = `
        <div>
            <a href="#/events">Events</a>
        </div>
        <div>
            <span style="margin-right:1rem">${currentUser.name} (${currentUser.role})</span>
            <button onclick="logout()">Logout</button>
        </div>
    `;
}