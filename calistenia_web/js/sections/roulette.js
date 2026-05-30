import { showToast } from '../core/ui.js';

// ============================
// EXERCISE ROULETTE
// ============================
const exerciseRouletteItems = [
  { name: 'Dominadas Prono',     emoji: '🦍', type: 'pull', muscles: ['Espalda', 'Bíceps', 'Core'] },
  { name: 'Flexiones Diamante',  emoji: '💎', type: 'push', muscles: ['Tríceps', 'Pecho'] },
  { name: 'Dominadas Neutras',   emoji: '💀', type: 'pull', muscles: ['Espalda', 'Bíceps'] },
  { name: 'Flexiones Explosivas',emoji: '💥', type: 'push', muscles: ['Pecho', 'Hombros', 'Tríceps'] },
  { name: 'Dominadas Supino',    emoji: '🔥', type: 'pull', muscles: ['Bíceps', 'Espalda'] },
  { name: 'Fondos Paralela',     emoji: '🦾', type: 'push', muscles: ['Tríceps', 'Pecho', 'Hombros'] },
  { name: 'Dominadas Explosivas',emoji: '🚀', type: 'pull', muscles: ['Espalda', 'Bíceps', 'Core'] },
  { name: 'Fondos en Barra',     emoji: '😎', type: 'push', muscles: ['Tríceps', 'Pecho'] },
];

const exerciseRoulettePalette = [
  '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b',
  '#ef4444', '#ec4899', '#3b82f6', '#14b8a6',
];

let rouletteSpinning       = false;
let rouletteCurrentRotation = 0;

// ── Session tracking ──────────────────────────────────────────
let sessionStartTime  = null;
let sessionLog        = [];      // { name, emoji, reps, ts }
let sessionTypeHistory = [];     // 'push' | 'pull'  — for balance
let sessionMuscles    = {};      // muscle → count

function ensureSessionStarted() {
  if (!sessionStartTime) {
    sessionStartTime = Date.now();
    updateSessionUI();
  }
}

function logSessionEntry(item, reps) {
  ensureSessionStarted();
  sessionLog.push({ name: item.name, emoji: item.emoji, reps, ts: Date.now() });
  sessionTypeHistory.push(item.type);

  // Muscle detector
  item.muscles.forEach(m => { sessionMuscles[m] = (sessionMuscles[m] || 0) + 1; });

  updateSessionUI();
  renderMuscleDetector();
  renderBalanceAlert();
}

function updateSessionUI() {
  const badge  = document.getElementById('sessionGiroBadge');
  if (badge) badge.textContent = sessionLog.length;
  const endBtn = document.getElementById('rouletteEndSessionBtn');
  if (endBtn) endBtn.style.display = sessionLog.length > 0 ? 'flex' : 'none';
}

// ============================
// ⚔️  SURVIVAL MODE
// ============================
let survivalMode      = false;
let survivalWave      = 1;
const SURV_BASE_MIN   = 3;
const SURV_BASE_MAX   = 8;
const SURV_INCREMENT  = 2;   // +2 reps each wave

export function toggleSurvivalMode(enabled) {
  survivalMode = enabled;
  survivalWave = 1;
  // Show/hide stats in all panels
  ['survivalStatsDesktop', 'survivalStatsMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = enabled ? 'block' : 'none';
  });
  // Show/hide info sections (inverse)
  ['survivalInfoDesktop', 'survivalInfoMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = enabled ? 'none' : 'block';
  });
  // Hide all fail buttons on toggle
  ['survivalFailBtnDesktop', 'survivalFailBtnMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  if (enabled) {
    updateSurvivalUI();
    showToast('⚔️ ¡Modo Supervivencia activado! Las reps aumentan con cada giro.');
  } else {
    showToast('Modo Supervivencia desactivado');
  }
}

function getSurvivalRange() {
  return {
    min: SURV_BASE_MIN + (survivalWave - 1) * SURV_INCREMENT,
    max: SURV_BASE_MAX + (survivalWave - 1) * SURV_INCREMENT,
  };
}

function updateSurvivalUI() {
  const range = getSurvivalRange();
  const rangeStr = `${range.min}–${range.max}`;
  ['survivalWaveDesktop', 'survivalWaveMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = survivalWave;
  });
  ['survivalRangeDesktop', 'survivalRangeMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = rangeStr;
  });
}

export function survivalFail() {
  const finalWave = survivalWave;
  // Reset mode
  survivalMode = false;
  survivalWave = 1;
  // Uncheck all toggles
  ['survivalToggleDesktop', 'survivalToggleMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });
  // Hide stats, show info, hide fail buttons
  ['survivalStatsDesktop', 'survivalStatsMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  ['survivalInfoDesktop', 'survivalInfoMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
  });
  ['survivalFailBtnDesktop', 'survivalFailBtnMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  showToast(`💀 Supervivencia terminada — llegaste a la oleada ${finalWave}`);
}

// ============================
// 🧬  MUSCLE DETECTOR
// ============================
const muscleColors = {
  'Espalda':  '#8b5cf6',
  'Bíceps':   '#06b6d4',
  'Tríceps':  '#ef4444',
  'Pecho':    '#f59e0b',
  'Hombros':  '#22c55e',
  'Core':     '#ec4899',
};

function renderMuscleDetector() {
  const el = document.getElementById('muscleMap');
  if (!el) return;

  const entries = Object.entries(sessionMuscles);
  if (entries.length === 0) {
    el.innerHTML = '<p class="muscle-empty">Aún no has girado. Los músculos aparecerán aquí.</p>';
    return;
  }

  // Find max count for intensity scaling
  const maxCount = Math.max(...entries.map(([, c]) => c));

  el.innerHTML = entries
    .sort((a, b) => b[1] - a[1])
    .map(([muscle, count]) => {
      const color = muscleColors[muscle] || '#8fa0b8';
      const intensity = Math.min(Math.ceil((count / maxCount) * 5), 5);
      return `<div class="muscle-badge" style="--mc:${color}" data-intensity="${intensity}">
        <span class="muscle-badge-dot"></span>
        ${muscle}
        <span class="muscle-badge-count">×${count}</span>
      </div>`;
    }).join('');
}

// ============================
// ⚖️  SESSION BALANCE
// ============================
function renderBalanceAlert() {
  const el = document.getElementById('balanceAlert');
  if (!el) return;
  const last3 = sessionTypeHistory.slice(-3);
  if (last3.length < 3) { el.style.display = 'none'; return; }

  if (last3.every(t => t === 'push')) {
    el.style.display = 'flex';
    el.innerHTML = `<span class="balance-icon">⚖️</span> <span>3 empujes seguidos — dando más peso a <strong>jalones</strong></span>`;
  } else if (last3.every(t => t === 'pull')) {
    el.style.display = 'flex';
    el.innerHTML = `<span class="balance-icon">⚖️</span> <span>3 jalones seguidos — dando más peso a <strong>empujes</strong></span>`;
  } else {
    el.style.display = 'none';
  }
}

// Returns a weighted random index applying balance logic
function getWeightedIndex() {
  const total = exerciseRouletteItems.length;
  const last3 = sessionTypeHistory.slice(-3);
  let boostType = null;
  if (last3.length === 3 && last3.every(t => t === 'push')) boostType = 'pull';
  if (last3.length === 3 && last3.every(t => t === 'pull')) boostType = 'push';

  if (!boostType) return Math.floor(Math.random() * total);

  const weights     = exerciseRouletteItems.map(ex => ex.type === boostType ? 3 : 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < total; i++) {
    rand -= weights[i];
    if (rand <= 0) return i;
  }
  return total - 1;
}

// ============================
// 📋  ROUTINE GENERATOR
// ============================
let routinePlan = [];  // { item, reps, done }

// Clamp listener para el input de ejercicios (se registra una sola vez)
(function setupGirosClamp() {
  function clampGiros() {
    const el = document.getElementById('routineGiros');
    if (!el) return;
    let v = parseInt(el.value, 10);
    if (isNaN(v) || v < 3) v = 3;
    if (v > 8) v = 8;
    el.value = v;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const el = document.getElementById('routineGiros');
      if (el) { el.addEventListener('change', clampGiros); el.addEventListener('blur', clampGiros); }
    });
  } else {
    const el = document.getElementById('routineGiros');
    if (el) { el.addEventListener('change', clampGiros); el.addEventListener('blur', clampGiros); }
  }
})();

export function generateRoutine() {
  const girosInput = document.getElementById('routineGiros');
  let rawVal = parseInt(girosInput?.value, 10);
  if (isNaN(rawVal) || rawVal < 3) rawVal = 3;
  if (rawVal > 8) rawVal = 8;
  if (girosInput) girosInput.value = rawVal;
  const n = rawVal;

  const routineMin = parseInt(document.getElementById('routineRepMin')?.value, 10) || 5;
  const routineMax = parseInt(document.getElementById('routineRepMax')?.value, 10) || 12;
  if (routineMin > routineMax) { showToast('⚠️ El mínimo no puede ser mayor que el máximo'); return; }
  const range = { min: routineMin, max: routineMax };

  let tempHistory = [];
  routinePlan = [];

  for (let i = 0; i < n; i++) {
    const last3 = tempHistory.slice(-3);
    let boostType = null;
    if (last3.length === 3 && last3.every(t => t === 'push')) boostType = 'pull';
    if (last3.length === 3 && last3.every(t => t === 'pull')) boostType = 'push';

    let idx;
    if (!boostType) {
      idx = Math.floor(Math.random() * exerciseRouletteItems.length);
    } else {
      const weights     = exerciseRouletteItems.map(ex => ex.type === boostType ? 3 : 1);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalWeight;
      for (let j = 0; j < exerciseRouletteItems.length; j++) {
        rand -= weights[j];
        if (rand <= 0) { idx = j; break; }
      }
      if (idx === undefined) idx = exerciseRouletteItems.length - 1;
    }

    const item = exerciseRouletteItems[idx];
    const reps = randomBetween(range.min, range.max);
    routinePlan.push({ item, reps, done: false });
    tempHistory.push(item.type);
  }

  renderRoutine();
  showToast(`📋 Rutina de ${n} ejercicios generada`);

  // Scroll to routine card
  document.getElementById('routineCard')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function toggleRoutineItem(idx) {
  if (!routinePlan[idx]) return;
  routinePlan[idx].done = !routinePlan[idx].done;
  if (routinePlan[idx].done) {
    logSessionEntry(routinePlan[idx].item, routinePlan[idx].reps);
    if (navigator.vibrate) navigator.vibrate([20, 30, 60]);
  } else {
    // Undo: remove from session
    const entry = routinePlan[idx];
    const logIdx = [...sessionLog].reverse().findIndex(
      e => e.name === entry.item.name && e.reps === entry.reps
    );
    if (logIdx >= 0) {
      sessionLog.splice(sessionLog.length - 1 - logIdx, 1);
      sessionTypeHistory.splice(sessionTypeHistory.length - 1 - logIdx, 1);
      // Rebuild muscles
      sessionMuscles = {};
      sessionLog.forEach(e => {
        const ex = exerciseRouletteItems.find(r => r.name === e.name);
        if (ex) ex.muscles.forEach(m => { sessionMuscles[m] = (sessionMuscles[m] || 0) + 1; });
      });
      updateSessionUI();
      renderMuscleDetector();
      renderBalanceAlert();
    }
  }
  renderRoutine();
  if (routinePlan.length > 0 && routinePlan.every(r => r.done)) {
    setTimeout(() => showToast('🏆 ¡Rutina completada! Brutal sesión.'), 400);
  }
}

function renderRoutine() {
  const el = document.getElementById('routineList');
  if (!el) return;
  if (routinePlan.length === 0) { el.innerHTML = ''; return; }

  const done  = routinePlan.filter(r => r.done).length;
  const total = routinePlan.length;
  const pct   = Math.round((done / total) * 100);

  el.innerHTML = `
    <div class="routine-header">
      <div class="routine-progress-bar">
        <div class="routine-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="routine-progress-label">${done}/${total} completados</div>
    </div>
    <div class="routine-items">
      ${routinePlan.map((r, i) => {
        const typeLabel = r.item.type === 'push' ? 'Empuje' : 'Jalón';
        const typeClass = r.item.type;
        return `
        <div class="routine-item ${r.done ? 'done' : ''}" onclick="toggleRoutineItem(${i})">
          <span class="routine-item-emoji">${r.item.emoji}</span>
          <div class="routine-item-body">
            <strong class="routine-item-name">${r.item.name}</strong>
            <span class="routine-item-sub">
              <span class="routine-type-pill ${typeClass}">${typeLabel}</span>
              ${r.item.muscles.join(' · ')}
            </span>
          </div>
          <div class="routine-item-right">
            <span class="routine-item-reps">${r.reps}<small>reps</small></span>
            <span class="routine-item-check">${r.done ? '✅' : '⬜'}</span>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

// ============================
// WHEEL RENDERING
// ============================
function buildRouletteGradient() {
  const total = exerciseRouletteItems.length;
  const step  = 360 / total;
  const stops = exerciseRouletteItems.map((_, i) => {
    const color = exerciseRoulettePalette[i % exerciseRoulettePalette.length];
    return `${color} ${i * step}deg ${(i + 1) * step}deg`;
  });
  return `conic-gradient(from -90deg, ${stops.join(', ')})`;
}

function renderExerciseWheel() {
  const wheel  = document.getElementById('exerciseWheel');
  const labels = document.getElementById('exerciseWheelLabels');
  if (!wheel || !labels) return;
  wheel.style.background = buildRouletteGradient();
  const total  = exerciseRouletteItems.length;
  const step   = 360 / total;
  const radius = 126;
  labels.innerHTML = exerciseRouletteItems.map((item, index) => {
    const angle = (step * index) - 90 + (step / 2);
    return `
      <div class="exercise-wheel__label" style="
        left:50%;top:50%;
        transform:translate(-50%,-50%) rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg);
      ">
        <span>${item.emoji}</span>
        <strong>${item.name}</strong>
      </div>`;
  }).join('');
}

function renderRouletteExerciseList(activeIndex = -1) {
  const list = document.getElementById('rouletteExerciseList');
  if (!list) return;
  list.innerHTML = exerciseRouletteItems.map((item, index) => `
    <div class="roulette-exercise-chip ${index === activeIndex ? 'active' : ''}">
      <span>${item.emoji}</span>
      <strong>${item.name}</strong>
    </div>`).join('');
}

// ============================
// HELPERS
// ============================
function getRouletteRepRange() {
  // Survival mode overrides inputs
  if (survivalMode) return getSurvivalRange();
  const min = parseInt(document.getElementById('rouletteRepMin')?.value, 10) || 1;
  const max = parseInt(document.getElementById('rouletteRepMax')?.value, 10) || 20;
  if (min > max) throw new Error('⚠️ El mínimo no puede ser mayor que el máximo');
  return { min, max };
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getWinningRouletteIndexFromRotation(totalRotationDeg) {
  const total      = exerciseRouletteItems.length;
  const step       = 360 / total;
  const normalized = ((totalRotationDeg % 360) + 360) % 360;
  const pointerOnWheel = (360 - normalized + 360) % 360;
  return ((Math.floor(pointerOnWheel / step) % total) + total) % total;
}

function setRouletteResult(item, reps) {
  const exerciseEl = document.getElementById('rouletteExercise');
  const repsEl     = document.getElementById('rouletteReps');
  const metaEl     = document.getElementById('rouletteMeta');
  const resultEl   = document.getElementById('rouletteResult');
  if (!exerciseEl || !repsEl || !metaEl || !resultEl) return;
  exerciseEl.textContent = `${item.emoji} ${item.name}`;
  repsEl.textContent     = `${reps} reps`;

  let metaText = 'Hazlo ahora mismo y vuelve a girar cuando acabes';
  if (survivalMode) metaText = `⚔️ Oleada ${survivalWave} — ¡a por ello!`;
  metaEl.textContent = metaText;
  resultEl.classList.add('show');
}

// ── Near-miss dramatic braking ─────────────────────────────────
function spinWithNearMiss(wheel, targetRotation, onComplete) {
  const total        = exerciseRouletteItems.length;
  const step         = 360 / total;
  const overshootDeg = step * (0.55 + Math.random() * 0.2);
  const phase1Target = targetRotation - overshootDeg;
  const phase2Target = targetRotation;

  wheel.style.transition = `transform 4.2s cubic-bezier(0.08, 0.82, 0.17, 1)`;
  wheel.style.setProperty('--roulette-rotate', `${phase1Target}deg`);
  wheel.style.transform  = `rotate(${phase1Target}deg)`;

  const onPhase1End = () => {
    wheel.removeEventListener('transitionend', onPhase1End);
    setTimeout(() => {
      wheel.style.transition = `transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      wheel.style.transform  = `rotate(${phase2Target}deg)`;
      const onPhase2End = () => {
        wheel.removeEventListener('transitionend', onPhase2End);
        onComplete();
      };
      wheel.addEventListener('transitionend', onPhase2End, { once: true });
    }, 80);
  };
  wheel.addEventListener('transitionend', onPhase1End, { once: true });
}

// ============================
// MAIN SPIN
// ============================
export function spinExerciseRoulette() {
  if (rouletteSpinning) return;

  let range;
  try { range = getRouletteRepRange(); }
  catch (error) { showToast(error.message); return; }

  const wheel      = document.getElementById('exerciseWheel');
  const spinBtn    = document.getElementById('rouletteSpinBtn');
  const centerMain = spinBtn?.querySelector('.exercise-wheel__center-main');
  if (!wheel || !spinBtn) return;

  // Hide "Fallé" buttons while spinning
  ['survivalFailBtnDesktop', 'survivalFailBtnMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  rouletteSpinning = true;
  spinBtn.style.pointerEvents = 'none';
  if (centerMain) centerMain.textContent = '🌀';

  // Weighted random for balance
  const previewIndex = getWeightedIndex();
  const previewReps  = randomBetween(range.min, range.max);

  const step           = 360 / exerciseRouletteItems.length;
  const segmentCenter  = (previewIndex * step) + (step / 2);
  const extraTurns     = 6 + Math.floor(Math.random() * 3);
  const targetRotation = rouletteCurrentRotation + (extraTurns * 360) + (360 - segmentCenter);

  wheel.classList.add('spinning');
  renderRouletteExerciseList(-1);

  spinWithNearMiss(wheel, targetRotation, () => {
    rouletteCurrentRotation = targetRotation;

    const winningIndex = getWinningRouletteIndexFromRotation(targetRotation);
    const winningItem  = exerciseRouletteItems[winningIndex];

    rouletteSpinning = false;
    spinBtn.style.pointerEvents = '';
    if (centerMain) centerMain.textContent = 'SPIN';
    wheel.classList.remove('spinning');
    wheel.style.transition = '';
    wheel.style.transform  = '';
    wheel.style.setProperty('--roulette-rotate', `${targetRotation}deg`);

    setRouletteResult(winningItem, previewReps);
    renderRouletteExerciseList(winningIndex);
    logSessionEntry(winningItem, previewReps);

    // Survival: advance wave & show fail button
    if (survivalMode) {
      survivalWave++;
      updateSurvivalUI();
      ['survivalFailBtnDesktop', 'survivalFailBtnMobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
      });
    }

    if (navigator.vibrate) navigator.vibrate([30, 40, 90]);
    showToast(`🎯 ${winningItem.name} — ${previewReps} reps`);
  });
}

// ============================
// SESSION SUMMARY MODAL
// ============================
export function endRouletteSession() {
  if (sessionLog.length === 0) {
    showToast('⚠️ Aún no has hecho ningún giro');
    return;
  }

  const totalReps = sessionLog.reduce((s, e) => s + e.reps, 0);
  const elapsed   = Date.now() - sessionStartTime;
  const mins      = Math.floor(elapsed / 60000);
  const secs      = Math.floor((elapsed % 60000) / 1000);
  const timeStr   = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const byExercise = {};
  sessionLog.forEach(e => {
    if (!byExercise[e.name]) byExercise[e.name] = { emoji: e.emoji, reps: 0, times: 0 };
    byExercise[e.name].reps  += e.reps;
    byExercise[e.name].times += 1;
  });

  const rows = Object.entries(byExercise)
    .sort((a, b) => b[1].reps - a[1].reps)
    .map(([name, d]) =>
      `<div class="session-summary__row">
        <span class="session-summary__emoji">${d.emoji}</span>
        <span class="session-summary__name">${name}</span>
        <span class="session-summary__reps">${d.reps} reps</span>
        <span class="session-summary__times">×${d.times}</span>
      </div>`
    ).join('');

  // Muscle summary
  const muscleRows = Object.entries(sessionMuscles)
    .sort((a, b) => b[1] - a[1])
    .map(([m, c]) => {
      const color = muscleColors[m] || '#8fa0b8';
      return `<span class="muscle-badge-sm" style="--mc:${color}">🔵 ${m} ×${c}</span>`;
    }).join('');

  const overlay    = document.getElementById('modalOverlay');
  const title      = document.getElementById('modalTitle');
  const text       = document.getElementById('modalText');
  const confirmBtn = document.getElementById('modalConfirmBtn');
  if (!overlay || !title || !text || !confirmBtn) return;

  title.textContent = '📊 Resumen de sesión';
  text.innerHTML = `
    <div class="session-summary">
      <div class="session-summary__stats">
        <div class="session-summary__stat">
          <span class="session-summary__stat-val">${sessionLog.length}</span>
          <span class="session-summary__stat-lbl">Giros</span>
        </div>
        <div class="session-summary__stat">
          <span class="session-summary__stat-val">${totalReps}</span>
          <span class="session-summary__stat-lbl">Reps totales</span>
        </div>
        <div class="session-summary__stat">
          <span class="session-summary__stat-val">${timeStr}</span>
          <span class="session-summary__stat-lbl">Duración</span>
        </div>
      </div>
      ${muscleRows ? `<div class="muscle-summary-row">${muscleRows}</div>` : ''}
      <div class="session-summary__list">${rows}</div>
    </div>`;

  confirmBtn.textContent = '🔄 Nueva sesión';
  confirmBtn.onclick = () => {
    sessionLog = [];
    sessionStartTime  = null;
    sessionTypeHistory = [];
    sessionMuscles    = {};
    routinePlan       = [];
    survivalMode      = false;
    survivalWave      = 1;

    ['survivalToggleDesktop', 'survivalToggleMobile'].forEach(id => {
      const el = document.getElementById(id); if (el) el.checked = false;
    });
    ['survivalStatsDesktop', 'survivalStatsMobile'].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = 'none';
    });
    ['survivalInfoDesktop', 'survivalInfoMobile'].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = 'block';
    });
    ['survivalFailBtnDesktop', 'survivalFailBtnMobile'].forEach(id => {
      const el = document.getElementById(id); if (el) el.style.display = 'none';
    });

    updateSessionUI();
    renderMuscleDetector();
    renderBalanceAlert();
    renderRoutine();
    overlay.classList.remove('open');
    showToast('✅ Sesión reiniciada');
  };

  const cancelBtn = overlay.querySelector('.btn-outline');
  if (cancelBtn) cancelBtn.textContent = 'Cerrar';
  overlay.classList.add('open');
}

// ============================
// INIT
// ============================
export function initExerciseRoulette() {
  renderExerciseWheel();
  renderRouletteExerciseList();
  renderMuscleDetector();
  updateSessionUI();
}

// Restore modal cancel text when closed
(function patchCloseModal() {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  const observer = new MutationObserver(() => {
    if (!overlay.classList.contains('open')) {
      const cancelBtn = overlay.querySelector('.btn-outline');
      if (cancelBtn && cancelBtn.textContent === 'Cerrar') {
        cancelBtn.textContent = 'Cancelar';
      }
    }
  });
  observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
})();