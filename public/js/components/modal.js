function openModal(contentHtml) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box">${contentHtml}</div>`;
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.remove();
}