// ===== STATE =====
let ranking = JSON.parse(localStorage.getItem('calibeast_ranking') || '[]');
let timerInterval = null;
let timerRunning = false;
let timerStart = 0;
let timerElapsed = 0;
let repsHistory = [];

// ===== TABS =====
function switchTab(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
}

// ===== RANDOM REPS =====
function generateReps() {
  const min = parseInt(document.getElementById('repMin').value) || 1;
  const max = parseInt(document.getElementById('repMax').value) || 20;
  if (min > max) { showToast('⚠️ Min no puede ser mayor que Max'); return; }

  const el = document.getElementById('repsNumber');
  el.classList.add('spinning');

  let count = 0;
  const interval = setInterval(() => {
    el.textContent = Math.floor(Math.random() * (max - min + 1)) + min;
    count++;
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

function renderRepsHistory() {
  const el = document.getElementById('repsHistory');
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
    ">${n}</span>`).join('');
}

function clearRepsHistory() {
  repsHistory = [];
  renderRepsHistory();
  document.getElementById('repsNumber').textContent = '—';
  showToast('🗑 Historial limpiado');
}

// ===== TIMER =====
function formatTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function pad(n) { return n.toString().padStart(2, '0'); }

function updateTimerDisplay() {
  const now = timerRunning ? Date.now() - timerStart + timerElapsed : timerElapsed;
  document.getElementById('timerDisplay').textContent = formatTime(now);
  document.getElementById('timerMs').textContent = '.' + (now % 1000).toString().padStart(3, '0');
}

function timerToggle() {
  if (!timerRunning) {
    timerStart = Date.now();
    timerRunning = true;
    timerInterval = setInterval(updateTimerDisplay, 16);
    document.getElementById('timerStartBtn').textContent = '⏸ PAUSAR';
    document.getElementById('timerDisplay').classList.add('running');
    document.getElementById('timerStatus').textContent = 'EN MARCHA';
    document.getElementById('timerStatus').classList.add('active');
    if (navigator.vibrate) navigator.vibrate(30);
  } else {
    timerElapsed += Date.now() - timerStart;
    timerRunning = false;
    clearInterval(timerInterval);
    document.getElementById('timerStartBtn').textContent = '▶ CONTINUAR';
    document.getElementById('timerDisplay').classList.remove('running');
    document.getElementById('timerStatus').textContent = 'PAUSADO';
    document.getElementById('timerStatus').classList.remove('active');
  }
}

function timerReset() {
  timerRunning = false;
  clearInterval(timerInterval);
  timerElapsed = 0;
  timerStart = 0;
  updateTimerDisplay();
  document.getElementById('timerStartBtn').textContent = '▶ INICIAR';
  document.getElementById('timerDisplay').classList.remove('running');
  document.getElementById('timerStatus').textContent = 'LISTO';
  document.getElementById('timerStatus').classList.remove('active');
}

// ===== TIME SOURCE =====
let useManualTime = false;

function selectTimeSource(src) {
  useManualTime = src === 'manual';
  document.getElementById('srcTimer').classList.toggle('active', !useManualTime);
  document.getElementById('srcManual').classList.toggle('active', useManualTime);
  document.getElementById('manualTimeFields').style.display = useManualTime ? 'block' : 'none';
}

function saveToRanking() {
  const name = document.getElementById('playerName').value.trim();
  if (!name) { showToast('⚠️ Pon tu nombre'); return; }

  let totalMs;

  if (useManualTime) {
    const h = parseInt(document.getElementById('manualH').value) || 0;
    const m = parseInt(document.getElementById('manualM').value) || 0;
    const s = parseInt(document.getElementById('manualS').value) || 0;
    if (h === 0 && m === 0 && s === 0) { showToast('⚠️ Introduce un tiempo válido'); return; }
    totalMs = (h * 3600 + m * 60 + s) * 1000;
  } else {
    if (timerElapsed === 0 && !timerRunning) { showToast('⚠️ El cronómetro está en 0'); return; }
    totalMs = timerRunning ? timerElapsed + (Date.now() - timerStart) : timerElapsed;
  }

  const entry = {
    id: Date.now(),
    name,
    timeMs: totalMs,
    timeStr: formatTime(totalMs) + '.' + (totalMs % 1000).toString().padStart(3, '0'),
    date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
  };

  ranking.push(entry);
  ranking.sort((a, b) => a.timeMs - b.timeMs);
  saveRanking();
  renderRanking();
  showToast('🏆 ¡' + name + ' guardado en el ranking!');
  if (navigator.vibrate) navigator.vibrate([30, 50, 100]);
}

// ===== RANKING =====
function saveRanking() {
  localStorage.setItem('calibeast_ranking', JSON.stringify(ranking));
}

function renderRanking() {
  const list = document.getElementById('rankingList');
  document.getElementById('statTotal').textContent = ranking.length;
  document.getElementById('statBest').textContent = ranking.length ? formatTime(ranking[0].timeMs) : '—';

  if (!ranking.length) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🏆</span>
        <div class="empty-text">Sin registros aún.<br>¡Completa tu primera rutina!</div>
      </div>`;
    return;
  }

  const medals = ['p1', 'p2', 'p3'];
  const medalClass = ['gold', 'silver', 'bronze'];

  list.innerHTML = ranking.map((entry, i) => `
    <li class="ranking-item ${medalClass[i] || ''}">
      <div class="rank-pos ${medals[i] || ''}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
      <div class="rank-info">
        <div class="rank-name">${escHtml(entry.name)}</div>
        <div class="rank-date">${entry.date || ''}</div>
      </div>
      <div class="rank-time">${entry.timeStr}</div>
      <button class="rank-delete" onclick="deleteEntry(${entry.id})" title="Eliminar">✕</button>
    </li>`).join('');
}

function deleteEntry(id) {
  ranking = ranking.filter(e => e.id !== id);
  saveRanking();
  renderRanking();
  showToast('🗑 Entrada eliminada');
}

function confirmClearRanking() {
  showModal('Borrar Ranking', '¿Seguro que quieres eliminar TODOS los registros? Esta acción no se puede deshacer.', () => {
    ranking = [];
    saveRanking();
    renderRanking();
    showToast('🗑 Ranking borrado');
  });
}

// ===== EXPORT / IMPORT =====
function exportRanking() {
  if (!ranking.length) { showToast('⚠️ El ranking está vacío'); return; }
  const data = JSON.stringify({ version: 1, exported: new Date().toISOString(), ranking }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'calibeast_ranking_' + Date.now() + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 Ranking exportado');
}

function importRanking(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      const imported = data.ranking || data;
      if (!Array.isArray(imported)) throw new Error('Formato inválido');
      const existingIds = new Set(ranking.map(r => r.id));
      let added = 0;
      imported.forEach(entry => {
        if (!existingIds.has(entry.id)) { ranking.push(entry); added++; }
      });
      ranking.sort((a, b) => a.timeMs - b.timeMs);
      saveRanking();
      renderRanking();
      showToast(`✅ ${added} nuevas entradas importadas`);
    } catch {
      showToast('❌ Error al leer el archivo');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ===== UTILS =====
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

let toastTimeout;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 2500);
}

function showModal(title, text, onConfirm) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalText').textContent = text;
  document.getElementById('modalConfirmBtn').onclick = () => { onConfirm(); closeModal(); };
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.remove('open');
}

// ===== INIT =====
renderRanking();
updateTimerDisplay();