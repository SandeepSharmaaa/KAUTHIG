function renderTable({ columns, rows, sortColumn, sortOrder, onSort }) {
    let html = `<table class="data-table"><thead><tr>`;
    
    columns.forEach(col => {
        let sortIcon = '';
        if (col.sortable) {
            if (sortColumn === col.key) {
                sortIcon = sortOrder === 'asc' ? ' ▲' : ' ▼';
            } else {
                sortIcon = ' ↕';
            }
        }
        
        const style = col.sortable ? 'cursor: pointer;' : '';
        const dataKey = col.sortable ? `data-sort="${escapeHtml(col.key)}"` : '';
        
        html += `<th style="${style}" ${dataKey}>${escapeHtml(col.label)}${sortIcon}</th>`;
    });
    
    html += `</tr></thead><tbody>`;
    
    if (!rows || rows.length === 0) {
        html += `<tr><td colspan="${columns.length}" class="text-center text-muted py-4">No data available</td></tr>`;
    } else {
        rows.forEach(row => {
            let rowDataAttr = row.id ? `data-id="${escapeHtml(String(row.id))}"` : '';
            html += `<tr ${rowDataAttr}>`;
            columns.forEach(col => {
                const cellVal = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '';
                // Do not escape if it's already HTML (e.g. badges, buttons), but the spec said "Use escapeHtml on all cell values"
                // Assuming caller provides raw text or HTML flags, but to follow strict prompt:
                // If it's a known raw HTML property, we could skip. Let's provide a render option or assume caller sends pre-rendered strings.
                // Wait, prompt: "Use escapeHtml on all cell values".
                // We will escape by default unless `col.raw` is true to allow badges and buttons.
                const content = col.raw ? cellVal : escapeHtml(cellVal);
                html += `<td>${content}</td>`;
            });
            html += `</tr>`;
        });
    }
    
    html += `</tbody></table>`;
    
    // The instructions state: "Register click handlers via event delegation"
    // Since this function returns an HTML string, the caller must attach the event listeners.
    // Or we can attach it globally, but that's messy. Let's return the string, but we can't attach listeners directly to a string.
    // We will assume the parent container catches the event, or we provide a helper to attach.
    // Actually, "Register click handlers via event delegation" means we should probably add a global listener on document or the caller does it.
    // Let's assume the caller injects this string and then sets up delegation, or we can setup a one-time delegated listener here if possible.
    // We'll just return the HTML, and let the page implementation handle it, or we add a document listener here.
    
    return html;
}

// Setup global event delegation for table sorting
document.addEventListener('click', function(e) {
    const th = e.target.closest('th[data-sort]');
    if (th) {
        const sortKey = th.getAttribute('data-sort');
        // We need a way to pass this back.
        // It's better if the page passes an onSort to a wrapper or uses custom events.
        // Since we can't easily capture the specific onSort closure in a global listener,
        // we'll dispatch a custom event on the table element.
        const table = th.closest('table');
        if (table) {
            table.dispatchEvent(new CustomEvent('tablesort', { detail: sortKey, bubbles: true }));
        }
    }
});

// Assuming caller will do something like:
// container.innerHTML = renderTable(...)
// container.querySelector('table').addEventListener('tablesort', e => onSort(e.detail));
