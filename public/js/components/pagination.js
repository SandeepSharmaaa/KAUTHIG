function renderPagination({ page, totalPages, onPageChange }) {
    if (totalPages <= 1) return '';

    let html = `<div class="pagination">`;
    
    // Previous button
    const prevDisabled = page === 1 ? 'disabled' : '';
    const prevStyle = page === 1 ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button class="btn btn-outline btn-sm page-prev" style="${prevStyle}" data-page="${page - 1}" ${prevDisabled}>Previous</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        // simple logic: show first, last, current, and +/- 1 from current
        if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
            const activeClass = i === page ? 'btn-primary' : 'btn-outline';
            html += `<button class="btn ${activeClass} btn-sm page-num" data-page="${i}">${i}</button>`;
        } else if (i === page - 2 || i === page + 2) {
            html += `<span class="btn btn-sm" style="pointer-events: none;">...</span>`;
        }
    }
    
    // Next button
    const nextDisabled = page === totalPages ? 'disabled' : '';
    const nextStyle = page === totalPages ? 'opacity: 0.5; pointer-events: none;' : '';
    html += `<button class="btn btn-outline btn-sm page-next" style="${nextStyle}" data-page="${page + 1}" ${nextDisabled}>Next</button>`;
    
    html += `</div>`;
    
    return html;
}

document.addEventListener('click', function(e) {
    const btn = e.target.closest('.pagination button[data-page]');
    if (btn) {
        const pageNum = parseInt(btn.getAttribute('data-page'), 10);
        btn.closest('.pagination').dispatchEvent(new CustomEvent('pagechange', { detail: pageNum, bubbles: true }));
    }
});
