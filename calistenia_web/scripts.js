import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ============================
// CONFIG
// ============================
const SUPABASE_URL = 'https://qnjutwgnoythmxmvrijy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_j12MaBN7UScMEnBvyfGrag_v90DsQBs';
const TABLE_NAME = 'ranking';
const CACHE_KEY = 'calibeast_ranking_cache';
const PLAYER_NAME_KEY = 'calibeast_player_name';
const PLAYER_TOKEN_KEY = 'calibeast_player_token';

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
// ROULETTE STATE
// ============================
const exerciseRouletteItems = [
  { name: 'Dominadas Prono', emoji: '🦍' },
  { name: 'Flexiones Diamante', emoji: '💎' },
  { name: 'Dominadas Neutras', emoji: '💀' },
  { name: 'Flexiones explosivas', emoji: '💥' },
  { name: 'Dominadas Supino', emoji: '🔥' },
  { name: 'Fondos Paralela', emoji: '🦾' },
  { name: 'Dominadas explosivas', emoji: '🚀' },
  { name: 'Fondos en Barra', emoji: '😎' }
];

const exerciseRoulettePalette = [
  '#8b5cf6',
  '#06b6d4',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#3b82f6',
  '#14b8a6'
];

let rouletteSpinning = false;
let rouletteCurrentRotation = 0;

// ============================
// PLAYER / ALIAS
// ============================
function normalizeName(name = '') {
  return String(name).trim().replace(/\s+/g, ' ').toLowerCase();
}

function getClaimedName() {
  return localStorage.getItem(PLAYER_NAME_KEY) || '';
}

function setClaimedName(name) {
  localStorage.setItem(PLAYER_NAME_KEY, String(name).trim().replace(/\s+/g, ' '));
}

function clearClaimedName() {
  localStorage.removeItem(PLAYER_NAME_KEY);
}

function getOwnerToken() {
  let token = localStorage.getItem(PLAYER_TOKEN_KEY);

  if (!token) {
    token = crypto.randomUUID
      ? crypto.randomUUID()
      : `cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(PLAYER_TOKEN_KEY, token);
  }

  return token;
}

function clearOwnerToken() {
  localStorage.removeItem(PLAYER_TOKEN_KEY);
}

function getMyEntry() {
  return ranking.find((entry) => entry.is_mine) || null;
}

function renderPlayerStatus() {
  const helpEl = document.getElementById('playerHelp');
  const inputEl = document.getElementById('playerName');
  const saveBtn = document.getElementById('saveRankingBtn');
  const deleteBtn = document.getElementById('deleteMyEntryBtn');

  const claimedName = getClaimedName();
  const myEntry = getMyEntry();

  if (myEntry) {
    if (inputEl && !inputEl.value.trim()) {
      inputEl.value = myEntry.name;
    }

    if (helpEl) {
      helpEl.innerHTML = `Este navegador está usando el alias <strong>${escHtml(myEntry.name)}</strong>. Si guardas otro tiempo con ese mismo nombre, se actualizará tu marca.`;
    }

    if (saveBtn) saveBtn.textContent = '♻️ ACTUALIZAR MI TIEMPO';
    if (deleteBtn) deleteBtn.disabled = false;
    return;
  }

  if (claimedName && inputEl && !inputEl.value.trim()) {
    inputEl.value = claimedName;
  }

  if (claimedName) {
    if (helpEl) {
      helpEl.innerHTML = `Este navegador recuerda el alias <strong>${escHtml(claimedName)}</strong>. Si ese alias ya lo usa otra persona, tendrás que elegir otro.`;
    }
  } else {
    if (helpEl) {
      helpEl.textContent = 'El alias que elijas quedará ligado a este navegador. No pueden existir dos usuarios con el mismo nombre.';
    }
  }

  if (saveBtn) saveBtn.textContent = '🏆 GUARDAR EN RANKING';
  if (deleteBtn) deleteBtn.disabled = true;
}

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
// EXERCISE ROULETTE
// ============================
function buildRouletteGradient() {
  const total = exerciseRouletteItems.length;
  const step = 360 / total;

  const stops = exerciseRouletteItems.map((_, i) => {
    const start = i * step;
    const end = (i + 1) * step;
    const color = exerciseRoulettePalette[i % exerciseRoulettePalette.length];
    return `${color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(from -90deg, ${stops.join(', ')})`;
}

function renderExerciseWheel() {
  const wheel = document.getElementById('exerciseWheel');
  const labels = document.getElementById('exerciseWheelLabels');

  if (!wheel || !labels) return;

  wheel.style.background = buildRouletteGradient();

  const total = exerciseRouletteItems.length;
  const step = 360 / total;
  const radius = 126;

  labels.innerHTML = exerciseRouletteItems.map((item, index) => {
    const angle = (step * index) - 90 + (step / 2);

    return `
      <div
        class="exercise-wheel__label"
        style="
          left: 50%;
          top: 50%;
          transform:
            translate(-50%, -50%)
            rotate(${angle}deg)
            translate(${radius}px)
            rotate(${-angle}deg);
        "
      >
        <span>${item.emoji}</span>
        <strong>${item.name}</strong>
      </div>
    `;
  }).join('');
}

function renderRouletteExerciseList(activeIndex = -1) {
  const list = document.getElementById('rouletteExerciseList');
  if (!list) return;

  list.innerHTML = exerciseRouletteItems.map((item, index) => `
    <div class="roulette-exercise-chip ${index === activeIndex ? 'active' : ''}">
      <span>${item.emoji}</span>
      <strong>${item.name}</strong>
    </div>
  `).join('');
}

function getRouletteRepRange() {
  const min = parseInt(document.getElementById('rouletteRepMin')?.value, 10) || 1;
  const max = parseInt(document.getElementById('rouletteRepMax')?.value, 10) || 20;

  if (min > max) {
    throw new Error('⚠️ En la ruleta el mínimo no puede ser mayor que el máximo');
  }

  return { min, max };
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getWheelRotationDegrees(element) {
  const style = window.getComputedStyle(element);
  const transform = style.transform;

  if (!transform || transform === 'none') return 0;

  const matrix2d = transform.match(/^matrix\((.+)\)$/);
  if (matrix2d) {
    const values = matrix2d[1].split(',').map(v => parseFloat(v.trim()));
    const a = values[0];
    const b = values[1];
    const angle = Math.atan2(b, a) * (180 / Math.PI);
    return (angle + 360) % 360;
  }

  const matrix3d = transform.match(/^matrix3d\((.+)\)$/);
  if (matrix3d) {
    const values = matrix3d[1].split(',').map(v => parseFloat(v.trim()));
    const a = values[0];
    const b = values[1];
    const angle = Math.atan2(b, a) * (180 / Math.PI);
    return (angle + 360) % 360;
  }

  return 0;
}

function getWinningRouletteIndexFromRotation(rotationDeg) {
  const total = exerciseRouletteItems.length;
  const step = 360 / total;

  const normalized = (360 - rotationDeg) % 360;
  const rawIndex = Math.round((normalized - step / 2) / step);
  return ((rawIndex % total) + total) % total;
}

function setRouletteResult(item, reps) {
  const exerciseEl = document.getElementById('rouletteExercise');
  const repsEl = document.getElementById('rouletteReps');
  const metaEl = document.getElementById('rouletteMeta');
  const resultEl = document.getElementById('rouletteResult');

  if (!exerciseEl || !repsEl || !metaEl || !resultEl) return;

  exerciseEl.textContent = `${item.emoji} ${item.name}`;
  repsEl.textContent = `${reps} reps`;
  metaEl.textContent = 'Hazlo ahora mismo y vuelve a girar cuando acabes';
  resultEl.classList.add('show');
}

function spinExerciseRoulette() {
  if (rouletteSpinning) return;

  let range;
  try {
    range = getRouletteRepRange();
  } catch (error) {
    showToast(error.message);
    return;
  }

  const wheel = document.getElementById('exerciseWheel');
  const spinBtn = document.getElementById('rouletteSpinBtn');

  if (!wheel || !spinBtn) return;

  rouletteSpinning = true;
  spinBtn.disabled = true;
  spinBtn.textContent = '🌀 GIRANDO...';

  const previewIndex = Math.floor(Math.random() * exerciseRouletteItems.length);
  const previewReps = randomBetween(range.min, range.max);

  const total = exerciseRouletteItems.length;
  const step = 360 / total;
  const segmentCenter = (previewIndex * step) + (step / 2);

  const extraTurns = 6 + Math.floor(Math.random() * 3);
  const targetRotation = rouletteCurrentRotation + (extraTurns * 360) + (360 - segmentCenter);

  wheel.style.setProperty('--roulette-rotate', `${targetRotation}deg`);
  wheel.classList.add('spinning');

  renderRouletteExerciseList(-1);

  const handleSpinEnd = () => {
    wheel.removeEventListener('transitionend', handleSpinEnd);

    const actualRotation = getWheelRotationDegrees(wheel);
    rouletteCurrentRotation = actualRotation;

    const winningIndex = getWinningRouletteIndexFromRotation(actualRotation);
    const winningItem = exerciseRouletteItems[winningIndex];
    const winningReps = previewReps;

    rouletteSpinning = false;
    spinBtn.disabled = false;
    spinBtn.textContent = '🎯 GIRAR RULETA';
    wheel.classList.remove('spinning');

    setRouletteResult(winningItem, winningReps);
    renderRouletteExerciseList(winningIndex);

    if (navigator.vibrate) navigator.vibrate([30, 40, 90]);
    showToast(`🎯 ${winningItem.name} — ${winningReps} reps`);
  };

  wheel.addEventListener('transitionend', handleSpinEnd, { once: true });
}

function initExerciseRoulette() {
  renderExerciseWheel();
  renderRouletteExerciseList();
}

// ============================
// CLOUD RANKING
// ============================
async function saveToRanking() {
  const inputEl = document.getElementById('playerName');
  const rawName = String(inputEl.value || '').trim().replace(/\s+/g, ' ');

  if (!rawName) {
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

  const timeStr = `${formatTime(totalMs)}.${(totalMs % 1000).toString().padStart(3, '0')}`;
  const eventDate = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  setSyncInfo('Guardando o actualizando tu tiempo...');

  const { data, error } = await supabase.rpc('upsert_my_ranking_entry', {
    p_name: rawName,
    p_time_ms: totalMs,
    p_time_str: timeStr,
    p_event_date: eventDate,
    p_owner_token: getOwnerToken()
  });

  if (error) {
    console.error('Error upsert rpc:', error);

    if (String(error.message || '').includes('ALIAS_TAKEN')) {
      showToast('⚠️ Ese nombre ya existe en el ranking');
      setSyncInfo('Ese alias ya está ocupado. Elige otro diferente.');
      return;
    }

    showToast('❌ No se pudo guardar');
    setSyncInfo('Error al guardar o actualizar en Supabase.');
    return;
  }

  const savedName = data?.name || rawName;

  setClaimedName(savedName);
  inputEl.value = savedName;
  timerReset();
  showToast('🏆 Tiempo guardado correctamente');
  setSyncInfo('Sincronizando ranking...');
  if (navigator.vibrate) navigator.vibrate([30, 50, 100]);

  await loadRanking();
  renderPlayerStatus();
}

async function deleteMyEntry() {
  const myEntry = getMyEntry();

  if (!myEntry) {
    showToast('⚠️ No tienes ninguna marca asociada en este navegador');
    return;
  }

  setSyncInfo('Borrando tu marca...');

  const { data, error } = await supabase.rpc('delete_my_ranking_entry', {
    p_owner_token: getOwnerToken()
  });

  if (error) {
    console.error('Error delete rpc:', error);
    showToast('❌ No se pudo borrar');
    setSyncInfo('Error al borrar en Supabase.');
    return;
  }

  if (Number(data || 0) < 1) {
    showToast('⚠️ No se encontró tu marca para borrar');
    setSyncInfo('No se encontró ninguna fila vinculada a este navegador.');
    return;
  }

  clearClaimedName();
  clearOwnerToken();
  document.getElementById('playerName').value = '';
  showToast('🗑 Tu marca ha sido eliminada');
  setSyncInfo('Marca borrada correctamente.');

  await loadRanking();
  renderPlayerStatus();
}

function confirmDeleteMyEntry() {
  const myEntry = getMyEntry();

  if (!myEntry) {
    showToast('⚠️ No tienes ninguna marca guardada en este navegador');
    return;
  }

  showModal(
    'Borrar mi marca',
    `¿Seguro que quieres borrar tu tiempo (${myEntry.name} — ${myEntry.time_str})?`,
    deleteMyEntry
  );
}

async function loadRanking(showFeedback = false) {
  if (!hasSupabaseConfig) {
    setSyncInfo('Modo local: falta configurar Supabase.');
    renderRanking();
    renderPlayerStatus();
    return;
  }

  if (showFeedback) setSyncInfo('Actualizando ranking...');

  const { data, error } = await supabase.rpc('get_public_ranking', {
    p_owner_token: getOwnerToken()
  });

  if (error) {
    console.error('Error get_public_ranking:', error);
    setSyncInfo('No se pudo leer la nube. Revisa las funciones SQL de Supabase.');
    renderRanking();
    renderPlayerStatus();
    return;
  }

  ranking = Array.isArray(data) ? data : [];
  localStorage.setItem(CACHE_KEY, JSON.stringify(ranking));
  renderRanking();
  renderPlayerStatus();
  setSyncInfo(`Sincronizado correctamente. Última actualización: ${new Date().toLocaleTimeString('es-ES')}.`);
}

function renderRanking() {
  const list = document.getElementById('rankingList');

  document.getElementById('statTotal').textContent = ranking.length;
  document.getElementById('statBest').textContent = ranking.length
    ? (ranking[0].time_str || `${formatTime(Number(ranking[0].time_ms || 0))}.${String(Number(ranking[0].time_ms || 0) % 1000).padStart(3, '0')}`)
    : '—';

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
        <div class="rank-name">
          ${escHtml(entry.name)}
          ${entry.is_mine ? '<span style="margin-left:8px;padding:3px 8px;border-radius:999px;background:rgba(124,58,237,0.18);border:1px solid rgba(167,139,250,0.35);font-size:0.7rem;font-weight:800;letter-spacing:0.03em;color:#ddd6fe;vertical-align:middle;">TÚ</span>' : ''}
        </div>
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
  renderPlayerStatus();
  initExerciseRoulette();
  await loadRanking();
  setupRealtime();

  const inputEl = document.getElementById('playerName');
  if (inputEl) {
    inputEl.addEventListener('blur', () => {
      inputEl.value = inputEl.value.trim().replace(/\s+/g, ' ');
      renderPlayerStatus();
    });
  }
}

window.switchTab = switchTab;
window.generateReps = generateReps;
window.clearRepsHistory = clearRepsHistory;
window.timerToggle = timerToggle;
window.timerReset = timerReset;
window.selectTimeSource = selectTimeSource;
window.saveToRanking = saveToRanking;
window.loadRanking = loadRanking;
window.confirmDeleteMyEntry = confirmDeleteMyEntry;
window.closeModal = closeModal;
window.spinExerciseRoulette = spinExerciseRoulette;

window.addEventListener('DOMContentLoaded', init);