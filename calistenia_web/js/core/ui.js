// ============================
// UI HELPERS
// ============================
export function switchTab(id, btn) {
  document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach((b) => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
}

export function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function setSyncInfo(text) {
  const el = document.getElementById('syncInfo');
  if (el) el.textContent = text;
}

let toastTimeout;
export function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;

  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 2500);
}

export function showModal(title, text, onConfirm = null) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalText').textContent = text;
  document.getElementById('modalConfirmBtn').onclick = () => {
    if (typeof onConfirm === 'function') onConfirm();
    closeModal();
  };
  document.getElementById('modalOverlay').classList.add('open');
}

export function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.remove('open');
}
