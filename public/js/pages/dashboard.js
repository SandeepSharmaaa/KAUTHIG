// ============================================================
// dashboard.js — Dashboard with stats, chart, and summaries
// ============================================================

async function renderDashboardPage() {
    const app = document.getElementById('app');
    app.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const res = await api.get('/dashboard');
        const d = res.dashboard;
        const stats = d.stats;

        app.innerHTML = `
            <div class="page-header">
                <h2>Dashboard</h2>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalEvents || 0}</div>
                    <div class="text-muted">Active Events</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.sessionsToday || 0}</div>
                    <div class="text-muted">Sessions Today</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color:#16a34a;">${stats.checkedInToday || 0}</div>
                    <div class="text-muted">Checked In Today</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" style="color:#d97706;">${stats.expiredThisWeek || 0}</div>
                    <div class="text-muted">Expired This Week</div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;margin-bottom:1.5rem;">
                <div class="card">
                    <h3>Check-ins per Day (Last 14 Days)</h3>
                    <div class="chart-container" style="margin-top:1rem;">
                        <canvas id="checkins-chart" width="600" height="280"></canvas>
                    </div>
                </div>
                <div class="card">
                    <h3>Registrations by Status</h3>
                    <div style="margin-top:1rem;">
                        ${(d.registrationsByStatus || []).map(item => `
                            <div class="flex-between" style="padding:0.5rem;background:#f8fafc;border-radius:4px;margin-bottom:0.5rem;">
                                <span class="status-badge status-${item.status}">${escapeHtml(item.status)}</span>
                                <strong>${item.count}</strong>
                            </div>
                        `).join('') || '<p class="text-muted">No data</p>'}
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>Top Sessions by Registrations</h3>
                ${(d.registrationsBySession || []).length > 0 ? `
                    <table class="data-table" style="margin-top:1rem;">
                        <thead><tr><th>Session</th><th>Event</th><th>Registrations</th><th>Capacity</th></tr></thead>
                        <tbody>
                            ${d.registrationsBySession.map(s => `
                                <tr>
                                    <td>${escapeHtml(s.sessionTitle)}</td>
                                    <td>${escapeHtml(s.eventName)}</td>
                                    <td>${s.total}</td>
                                    <td>${s.capacity}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p class="text-muted" style="margin-top:1rem;">No sessions data available.</p>'}
            </div>
        `;

        // Render chart
        const chartData = (d.checkInsPerDay || []).map(item => ({
            label: item.date ? item.date.substring(5) : '',
            value: item.count
        }));
        setTimeout(() => {
            renderBarChart('checkins-chart', chartData, {
                barColor: '#2563eb',
                yAxisLabel: 'Check-ins'
            });
        }, 50);

    } catch (err) {
        app.innerHTML = `<div class="error-text">${escapeHtml(err.message)}</div>`;
    }
}
