// ============================================================
// modal.js — Reusable modal component
// ============================================================

function openModal(contentHtml) {
    // Remove any existing modal
    closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box">${contentHtml}</div>`;

    // Close on overlay click (not on modal box click)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // Close on Escape key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    document.body.appendChild(overlay);

    // Focus first input if available
    setTimeout(() => {
        const firstInput = overlay.querySelector('input, textarea, select');
        if (firstInput) firstInput.focus();
    }, 100);
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.remove();
}