import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ============================
// CONFIG
// ============================
const SUPABASE_URL = 'https://qnjutwgnoythmxmvrijy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_j12MaBN7UScMEnBvyfGrag_v90DsQBs';
const TABLE_NAME = 'ranking';
const CACHE_KEY = 'calibeast_ranking_cache';

const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================
// STATE
// ============================
let ranking = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
let timerInterval = null;
let timerRunning = false;
let timerStart = 0;
let timerElapsed = 0;
let repsHistory = [];
let useManualTime = false;
let realtimeChannel = null;

// ============================
// TABS
// ============================
function switchTab(id, btn) {
  document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach((b) => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
}

// ============================
// RANDOM REPS
// ============================
function generateReps() {
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
    ">${n}</span>
  `).join('');
}

function clearRepsHistory() {
  repsHistory = [];
  renderRepsHistory();
  document.getElementById('repsNumber').textContent = '—';
  showToast('🗑 Historial limpiado');
}

// ============================
// TIMER
// ============================
function formatTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);

  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

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

// ============================
// TIME SOURCE
// ============================
function selectTimeSource(src) {
  useManualTime = src === 'manual';
  document.getElementById('srcTimer').classList.toggle('active', !useManualTime);
  document.getElementById('srcManual').classList.toggle('active', useManualTime);
  document.getElementById('manualTimeFields').style.display = useManualTime ? 'block' : 'none';
}

function getCurrentTimeMs() {
  if (useManualTime) {
    const h = parseInt(document.getElementById('manualH').value, 10) || 0;
    const m = parseInt(document.getElementById('manualM').value, 10) || 0;
    const s = parseInt(document.getElementById('manualS').value, 10) || 0;

    if (h === 0 && m === 0 && s === 0) {
      throw new Error('⚠️ Introduce un tiempo válido');
    }

    return (h * 3600 + m * 60 + s) * 1000;
  }

  if (timerElapsed === 0 && !timerRunning) {
    throw new Error('⚠️ El cronómetro está en 0');
  }

  return timerRunning ? timerElapsed + (Date.now() - timerStart) : timerElapsed;
}

// ============================
// CLOUD RANKING
// ============================
async function saveToRanking() {
  const name = document.getElementById('playerName').value.trim();

  if (!name) {
    showToast('⚠️ Pon tu nombre');
    return;
  }

  if (!hasSupabaseConfig) {
    showToast('⚠️ Falta configurar Supabase');
    setSyncInfo('Falta configurar SUPABASE_URL y SUPABASE_ANON_KEY.');
    return;
  }

  let totalMs;
  try {
    totalMs = getCurrentTimeMs();
  } catch (error) {
    showToast(error.message);
    return;
  }

  const entry = {
    name: name.slice(0, 30),
    time_ms: totalMs,
    time_str: `${formatTime(totalMs)}.${(totalMs % 1000).toString().padStart(3, '0')}`,
    event_date: new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  };

  setSyncInfo('Guardando tiempo en la nube...');

  const { error } = await supabase.from(TABLE_NAME).insert(entry);

  if (error) {
    console.error('Error insert:', error);
    showToast('❌ No se pudo guardar');
    setSyncInfo('Error al guardar. Revisa tabla, RLS y permisos.');
    return;
  }

  document.getElementById('playerName').value = '';
  timerReset();
  showToast(`🏆 ¡${entry.name} guardado en el ranking!`);
  setSyncInfo('Tiempo guardado. Sincronizando...');
  if (navigator.vibrate) navigator.vibrate([30, 50, 100]);

  await loadRanking();
}

async function loadRanking(showFeedback = false) {
  if (!hasSupabaseConfig) {
    renderRanking();
    setSyncInfo('Modo local: falta configurar Supabase.');
    return;
  }

  if (showFeedback) setSyncInfo('Actualizando ranking...');

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('id, name, time_ms, time_str, event_date, created_at')
    .order('time_ms', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error select:', error);
    setSyncInfo('No se pudo leer la nube. Revisa tabla, RLS y permisos.');
    renderRanking();
    return;
  }

  ranking = Array.isArray(data) ? data : [];
  localStorage.setItem(CACHE_KEY, JSON.stringify(ranking));
  renderRanking();
  setSyncInfo(`Sincronizado correctamente. Última actualización: ${new Date().toLocaleTimeString('es-ES')}.`);
}

function renderRanking() {
  const list = document.getElementById('rankingList');
  document.getElementById('statTotal').textContent = ranking.length;
  document.getElementById('statBest').textContent = ranking.length ? formatTime(ranking[0].time_ms) : '—';

  if (!ranking.length) {
    list.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🏆</span>
        <div class="empty-text">Sin registros aún.<br>¡Completa tu primera rutina!</div>
      </div>
    `;
    return;
  }

  const medalClass = ['gold', 'silver', 'bronze'];

  list.innerHTML = ranking.map((entry, i) => `
    <li class="ranking-item ${medalClass[i] || ''}">
      <div class="rank-pos">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
      <div class="rank-info">
        <div class="rank-name">${escHtml(entry.name)}</div>
        <div class="rank-date">${entry.event_date || ''}</div>
      </div>
      <div class="rank-time">${entry.time_str}</div>
    </li>
  `).join('');
}

function setupRealtime() {
  if (!hasSupabaseConfig) return;
  if (realtimeChannel) return;

  realtimeChannel = supabase
    .channel('ranking-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE_NAME },
      async () => {
        await loadRanking();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setSyncInfo('Conectado en tiempo real. Los cambios se verán automáticamente.');
      }
    });
}

function showAdminNotice() {
  showModal(
    'Gestión admin',
    'En la versión pública no conviene dejar borrar o vaciar el ranking, porque cualquier persona podría hacerlo. Esa parte debería estar en una zona privada de administración.',
    null
  );
}

// ============================
// UTILS
// ============================
function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setSyncInfo(text) {
  const el = document.getElementById('syncInfo');
  if (el) el.textContent = text;
}

let toastTimeout;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 2500);
}

function showModal(title, text, onConfirm = null) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalText').textContent = text;
  document.getElementById('modalConfirmBtn').onclick = () => {
    if (typeof onConfirm === 'function') onConfirm();
    closeModal();
  };
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.remove('open');
}

// ============================
// INIT
// ============================
async function init() {
  renderRanking();
  renderRepsHistory();
  updateTimerDisplay();
  await loadRanking();
  setupRealtime();
}

window.switchTab = switchTab;
window.generateReps = generateReps;
window.clearRepsHistory = clearRepsHistory;
window.timerToggle = timerToggle;
window.timerReset = timerReset;
window.selectTimeSource = selectTimeSource;
window.saveToRanking = saveToRanking;
window.loadRanking = loadRanking;
window.showAdminNotice = showAdminNotice;
window.closeModal = closeModal;

window.addEventListener('DOMContentLoaded', init);