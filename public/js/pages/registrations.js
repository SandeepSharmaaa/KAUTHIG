// ============================================================
// registrations.js — Registrations list with search/filter/sort/pagination
// ============================================================

let regCurrentPage = 1;
let regSearch = '';
let regStatus = '';
let regSort = 'reserved_at';
let regOrder = 'desc';

async function renderRegistrationsPage() {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="page-header">
            <h2>Registrations</h2>
        </div>
        <div class="card">
            <div class="filter-bar">
                <input type="text" id="reg-search" placeholder="Search name or email..." value="${escapeHtml(regSearch)}" style="flex:1;" />
                <select id="reg-status-filter">
                    <option value="">All Statuses</option>
                    <option value="reserved" ${regStatus==='reserved'?'selected':''}>Reserved</option>
                    <option value="confirmed" ${regStatus==='confirmed'?'selected':''}>Confirmed</option>
                    <option value="checked_in" ${regStatus==='checked_in'?'selected':''}>Checked In</option>
                    <option value="cancelled" ${regStatus==='cancelled'?'selected':''}>Cancelled</option>
                    <option value="expired" ${regStatus==='expired'?'selected':''}>Expired</option>
                </select>
                <button class="btn-primary btn-sm" id="reg-filter-btn">Search</button>
            </div>
            <div id="reg-table-area"><div class="loading-spinner"></div></div>
            <div id="reg-pagination-area"></div>
        </div>
    `;

    loadRegistrations();

    document.getElementById('reg-filter-btn').addEventListener('click', () => {
        regSearch = document.getElementById('reg-search').value;
        regStatus = document.getElementById('reg-status-filter').value;
        regCurrentPage = 1;
        loadRegistrations();
    });

    // Enter key triggers search
    document.getElementById('reg-search').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            regSearch = e.target.value;
            regStatus = document.getElementById('reg-status-filter').value;
            regCurrentPage = 1;
            loadRegistrations();
        }
    });
}

async function loadRegistrations() {
    const tableArea = document.getElementById('reg-table-area');
    const paginationArea = document.getElementById('reg-pagination-area');

    try {
        const params = new URLSearchParams();
        if (regSearch) params.set('search', regSearch);
        if (regStatus) params.set('status', regStatus);
        params.set('sort', regSort);
        params.set('order', regOrder);
        params.set('page', regCurrentPage);
        params.set('limit', 20);

        const res = await api.get(`/registrations?${params.toString()}`);
        const regs = res.registrations || [];
        const pagination = res.pagination || { page: 1, totalPages: 1, total: 0 };

        if (regs.length === 0) {
            tableArea.innerHTML = '<div class="empty-state">No registrations found.</div>';
            paginationArea.innerHTML = '';
            return;
        }

        // Sort indicators
        function sortIcon(col) {
            if (regSort === col) return regOrder === 'asc' ? ' ▲' : ' ▼';
            return ' ↕';
        }

        tableArea.innerHTML = `
            <table class="data-table">
                <thead><tr>
                    <th class="sortable" data-col="attendee_name" style="cursor:pointer;">Name${sortIcon('attendee_name')}</th>
                    <th class="sortable" data-col="attendee_email" style="cursor:pointer;">Email${sortIcon('attendee_email')}</th>
                    <th>Session</th>
                    <th class="sortable" data-col="status" style="cursor:pointer;">Status${sortIcon('status')}</th>
                    <th class="sortable" data-col="reserved_at" style="cursor:pointer;">Reserved${sortIcon('reserved_at')}</th>
                </tr></thead>
                <tbody>
                    ${regs.map(r => `
                        <tr onclick="window.location.hash='#/registrations/${r.id}'" style="cursor:pointer;">
                            <td>${escapeHtml(r.attendee_name)}</td>
                            <td>${escapeHtml(r.attendee_email)}</td>
                            <td>${escapeHtml(r.session_title || '')}</td>
                            <td><span class="status-badge status-${r.status}">${escapeHtml(r.status)}</span></td>
                            <td>${r.reserved_at ? new Date(r.reserved_at).toLocaleString() : ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Pagination
        if (pagination.totalPages > 1) {
            let pagHtml = '<div class="pagination">';
            pagHtml += `<button class="btn-secondary btn-sm" ${pagination.page <= 1 ? 'disabled' : ''} onclick="regGoPage(${pagination.page - 1})">← Prev</button>`;
            for (let i = 1; i <= pagination.totalPages; i++) {
                pagHtml += `<button class="${i === pagination.page ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="regGoPage(${i})">${i}</button>`;
            }
            pagHtml += `<button class="btn-secondary btn-sm" ${pagination.page >= pagination.totalPages ? 'disabled' : ''} onclick="regGoPage(${pagination.page + 1})">Next →</button>`;
            pagHtml += '</div>';
            paginationArea.innerHTML = pagHtml;
        } else {
            paginationArea.innerHTML = `<div class="text-muted" style="text-align:center;margin-top:0.5rem;">Showing ${pagination.total} results</div>`;
        }

        // Sort click handler
        tableArea.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.dataset.col;
                if (regSort === col) {
                    regOrder = regOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    regSort = col;
                    regOrder = 'asc';
                }
                loadRegistrations();
            });
        });

    } catch (err) {
        tableArea.innerHTML = `<div class="error-text">${escapeHtml(err.message)}</div>`;
    }
}

function regGoPage(page) {
    regCurrentPage = page;
    loadRegistrations();
}
