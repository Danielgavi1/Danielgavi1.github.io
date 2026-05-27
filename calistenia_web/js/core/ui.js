// ============================
// UI HELPERS
// ============================
export function switchTab(id, btn) {
  document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach((b) => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');

  // Scroll the nav so the active tab is centered
  const nav = btn.closest('nav');
  if (nav) {
    const navWidth = nav.offsetWidth;
    const btnLeft = btn.offsetLeft;
    const btnWidth = btn.offsetWidth;
    const targetScroll = btnLeft - (navWidth / 2) + (btnWidth / 2);
    nav.scrollTo({ left: targetScroll, behavior: 'smooth' });
  }
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
// ── Swipe-to-dismiss bottom sheet ────────────────────────────
(function initSwipeToDismiss() {
  let startY = 0;
  let currentY = 0;
  let dragging = false;
  let modal = null;
  let overlay = null;

  function getModal() {
    if (!overlay) overlay = document.getElementById('modalOverlay');
    if (!modal)   modal   = overlay?.querySelector('.modal');
    return { modal, overlay };
  }

  function onStart(e) {
    const { modal: m, overlay: o } = getModal();
    if (!o?.classList.contains('open')) return;

    // Only start drag from the handle area (top 48px of modal)
    const touch = e.touches ? e.touches[0] : e;
    const rect  = m.getBoundingClientRect();
    if (touch.clientY - rect.top > 56) return;

    dragging = true;
    startY   = touch.clientY;
    currentY = 0;

    // Disable CSS transition while dragging for instant follow
    m.style.transition = 'none';
  }

  function onMove(e) {
    if (!dragging) return;
    const touch = e.touches ? e.touches[0] : e;
    const delta = Math.max(0, touch.clientY - startY); // only downward
    currentY = delta;

    const { modal: m, overlay: o } = getModal();
    m.style.transform = `translateY(${delta}px)`;

    // Fade overlay backdrop proportionally (modal height ~60vh estimate)
    const modalH = m.offsetHeight || 400;
    const ratio  = Math.min(delta / modalH, 1);
    o.style.opacity = 1 - ratio * 0.85;

    if (e.cancelable) e.preventDefault();
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;

    const { modal: m, overlay: o } = getModal();
    const modalH    = m.offsetHeight || 400;
    const threshold = modalH * 0.32;

    // Re-enable modal transition for snap-back or dismiss
    m.style.transition = '';

    if (currentY > threshold) {
      // Keep opacity inline so CSS transition doesn't flash it back
      // Animate modal out, then remove open (opacity stays at current low value)
      m.style.transform = `translateY(100%)`;
      setTimeout(() => {
        m.style.transform = '';
        o.style.opacity   = '';   // clear only after overlay is hidden
        o.classList.remove('open');
      }, 320);
    } else {
      // Snap back — restore opacity via CSS
      o.style.opacity   = '';
      m.style.transform = 'translateY(0)';
    }
    currentY = 0;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const { modal: m } = getModal();
    if (!m) return;

    m.addEventListener('touchstart', onStart, { passive: true });
    m.addEventListener('touchmove',  onMove,  { passive: false });
    m.addEventListener('touchend',   onEnd,   { passive: true });

    // Mouse fallback for desktop testing
    m.addEventListener('mousedown',  onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onEnd);
  });
})();