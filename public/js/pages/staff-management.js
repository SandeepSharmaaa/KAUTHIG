// ============================================================
// staff-management.js — Organizer page to view & create staff
// ============================================================

async function renderStaffManagementPage() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const data = await api.get('/users?role=check_in_staff');
        const staff = data.users || [];

        app.innerHTML = `
            <div class="page-header">
                <h2>Staff Management</h2>
                <button class="btn-primary" onclick="openCreateStaffModal()">+ Create Staff</button>
            </div>

            ${staff.length > 0 ? `
                <div class="card">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${staff.map(u => `
                                <tr>
                                    <td><strong>${u.id}</strong></td>
                                    <td>${escapeHtml(u.name)}</td>
                                    <td>${escapeHtml(u.email)}</td>
                                    <td>${u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="empty-state">
                    <div style="font-size:3rem;">👥</div>
                    <p>No staff members yet. Click "Create Staff" to add one.</p>
                </div>
            `}
        `;
    } catch (err) {
        app.innerHTML = `<div class="error-text">${escapeHtml(err.message)}</div>`;
    }
}

function openCreateStaffModal() {
    openModal(`
        <h3>Create Staff Member</h3>
        <div id="create-staff-error" class="error-text"></div>
        <div class="form-group">
            <label>Full Name</label>
            <input id="staff-name" placeholder="e.g. Rahul Kumar" />
        </div>
        <div class="form-group">
            <label>Email</label>
            <input id="staff-email" type="email" placeholder="e.g. rahul@kauthig.com" />
        </div>
        <div class="form-group">
            <label>Password</label>
            <input id="staff-password" type="password" placeholder="Min 6 characters" />
        </div>
        <div class="modal-actions">
            <button class="btn-primary" onclick="submitCreateStaff()">Create</button>
            <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
    `);
}

async function submitCreateStaff() {
    const errorEl = document.getElementById('create-staff-error');
    errorEl.textContent = '';

    const name = document.getElementById('staff-name').value.trim();
    const email = document.getElementById('staff-email').value.trim();
    const password = document.getElementById('staff-password').value;

    if (!name || !email || !password) {
        errorEl.textContent = 'All fields are required.';
        return;
    }
    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters.';
        return;
    }

    try {
        await api.post('/users', { name, email, password, role: 'check_in_staff' });
        closeModal();
        showToast('Staff member created successfully!');
        renderStaffManagementPage();
    } catch (err) {
        errorEl.textContent = err.message;
    }
}
