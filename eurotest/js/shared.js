function showModal(title, msg) {
    const modal = document.getElementById('modal-overlay');
    const mTitle = document.getElementById('modal-title');
    const mMsg = document.getElementById('modal-msg');

    if (mTitle) mTitle.textContent = title;
    if (mMsg) mMsg.textContent = msg;
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.style.display = 'none';
}

window.showModal = showModal;
window.closeModal = closeModal;
