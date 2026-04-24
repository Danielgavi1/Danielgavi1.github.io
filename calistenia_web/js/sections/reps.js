import { showToast } from '../core/ui.js';

// ============================
// REPS GENERATOR
// ============================
let repsHistory = [];

export function generateReps() {
  const min = parseInt(document.getElementById('repMin').value, 10) || 1;
  const max = parseInt(document.getElementById('repMax').value, 10) || 20;

  if (min > max) {
    showToast('⚠️ Min no puede ser mayor que Max');
    return;
  }

  const el = document.getElementById('repsNumber');
  el.classList.add('spinning');

  let count = 0;
  const interval = setInterval(() => {
    el.textContent = Math.floor(Math.random() * (max - min + 1)) + min;
    count += 1;

    if (count >= 16) {
      clearInterval(interval);
      el.classList.remove('spinning');
      const result = Math.floor(Math.random() * (max - min + 1)) + min;
      el.textContent = result;
      addRepsHistory(result);
      if (navigator.vibrate) navigator.vibrate(50);
    }
  }, 60);
}

function addRepsHistory(n) {
  repsHistory.unshift(n);
  if (repsHistory.length > 12) repsHistory.pop();
  renderRepsHistory();
}

export function renderRepsHistory() {
  const el = document.getElementById('repsHistory');
  if (!el) return;

  if (!repsHistory.length) {
    el.innerHTML = '<span style="color:var(--muted);font-size:0.8rem;font-weight:500;">Sin historial aún</span>';
    return;
  }

  el.innerHTML = repsHistory.map((n, i) => `
    <span style="
      background:${i === 0 ? 'rgba(200,255,0,0.15)' : 'var(--surface2)'};
      border:1px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'};
      color:${i === 0 ? 'var(--accent)' : 'var(--text)'};
      font-family:'JetBrains Mono',monospace;
      font-weight:700;
      font-size:0.9rem;
      padding:5px 12px;
      border-radius:20px;
    ">${n}</span>
  `).join('');
}

export function clearRepsHistory() {
  repsHistory = [];
  renderRepsHistory();
  document.getElementById('repsNumber').textContent = '—';
  showToast('🗑 Historial limpiado');
}
