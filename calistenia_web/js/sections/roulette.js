import { showToast } from '../core/ui.js';

// ============================
// EXERCISE ROULETTE
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
  '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b',
  '#ef4444', '#ec4899', '#3b82f6', '#14b8a6'
];

let rouletteSpinning = false;
let rouletteCurrentRotation = 0;

// ── Session tracking ──────────────────────────────────────────
let sessionStartTime = null;
let sessionLog = []; // { name, emoji, reps, ts }

function ensureSessionStarted() {
  if (!sessionStartTime) {
    sessionStartTime = Date.now();
    updateSessionUI();
  }
}

function logSessionEntry(item, reps) {
  ensureSessionStarted();
  sessionLog.push({ name: item.name, emoji: item.emoji, reps, ts: Date.now() });
  updateSessionUI();
}

function updateSessionUI() {
  const badge = document.getElementById('sessionGiroBadge');
  if (badge) badge.textContent = sessionLog.length;
  const endBtn = document.getElementById('rouletteEndSessionBtn');
  if (endBtn) endBtn.style.display = sessionLog.length > 0 ? 'flex' : 'none';
}

// ── Wheel rendering ───────────────────────────────────────────
function buildRouletteGradient() {
  const total = exerciseRouletteItems.length;
  const step = 360 / total;
  const stops = exerciseRouletteItems.map((_, i) => {
    const color = exerciseRoulettePalette[i % exerciseRoulettePalette.length];
    return `${color} ${i * step}deg ${(i + 1) * step}deg`;
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

// ── Helpers ───────────────────────────────────────────────────
function getRouletteRepRange() {
  const min = parseInt(document.getElementById('rouletteRepMin')?.value, 10) || 1;
  const max = parseInt(document.getElementById('rouletteRepMax')?.value, 10) || 20;
  if (min > max) throw new Error('⚠️ En la ruleta el mínimo no puede ser mayor que el máximo');
  return { min, max };
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getWinningRouletteIndexFromRotation(totalRotationDeg) {
  const total = exerciseRouletteItems.length;
  const step = 360 / total;
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
  metaEl.textContent     = 'Hazlo ahora mismo y vuelve a girar cuando acabes';
  resultEl.classList.add('show');
}

// ── "Near-miss" dramatic braking ─────────────────────────────
//
// How it works:
//  Phase 1 – fast spin  → cubic-bezier that decelerates quickly,
//             stopping just past the BORDER of the target segment
//             (i.e. a couple of degrees before the center).
//  Phase 2 – slow creep → short linear transition that nudges the
//             wheel those last few degrees into the center of the
//             winning segment, giving the "OMG it almost went past" effect.
//
function spinWithNearMiss(wheel, targetRotation, onComplete) {
  const total = exerciseRouletteItems.length;
  const step  = 360 / total;

  // How many degrees before the final center do we "fake-stop"?
  // Between 60-80% of a segment width, always on the "past-center" side
  // so it looks like it *barely* made it.
  const overshootDeg = step * (0.55 + Math.random() * 0.2); // 55-75% of segment

  const phase1Target = targetRotation - overshootDeg;  // just before center
  const phase2Target = targetRotation;                  // true center

  // ── Phase 1: fast spin with dramatic deceleration ──
  wheel.style.transition = `transform 4.2s cubic-bezier(0.08, 0.82, 0.17, 1)`;
  wheel.style.setProperty('--roulette-rotate', `${phase1Target}deg`);
  wheel.style.transform  = `rotate(${phase1Target}deg)`;

  const onPhase1End = () => {
    wheel.removeEventListener('transitionend', onPhase1End);

    // tiny pause so the player "sees" it stop — feels real
    setTimeout(() => {
      // ── Phase 2: slow creep into the winning segment ──
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

// ── Main spin ─────────────────────────────────────────────────
export function spinExerciseRoulette() {
  if (rouletteSpinning) return;

  let range;
  try { range = getRouletteRepRange(); }
  catch (error) { showToast(error.message); return; }

  const wheel      = document.getElementById('exerciseWheel');
  const spinBtn    = document.getElementById('rouletteSpinBtn');
  const centerMain = spinBtn?.querySelector('.exercise-wheel__center-main');
  if (!wheel || !spinBtn) return;

  rouletteSpinning = true;
  spinBtn.style.pointerEvents = 'none';
  if (centerMain) centerMain.textContent = '🌀';

  const previewIndex = Math.floor(Math.random() * exerciseRouletteItems.length);
  const previewReps  = randomBetween(range.min, range.max);

  const step          = 360 / exerciseRouletteItems.length;
  const segmentCenter = (previewIndex * step) + (step / 2);
  const extraTurns    = 6 + Math.floor(Math.random() * 3);
  const targetRotation = rouletteCurrentRotation + (extraTurns * 360) + (360 - segmentCenter);

  wheel.classList.add('spinning');
  renderRouletteExerciseList(-1);

  spinWithNearMiss(wheel, targetRotation, () => {
    // ── After both phases complete ──
    rouletteCurrentRotation = targetRotation;

    const winningIndex = getWinningRouletteIndexFromRotation(targetRotation);
    const winningItem  = exerciseRouletteItems[winningIndex];

    rouletteSpinning = false;
    spinBtn.style.pointerEvents = '';
    if (centerMain) centerMain.textContent = 'SPIN';
    wheel.classList.remove('spinning');
    // Clear inline transform so CSS var takes over again
    wheel.style.transition = '';
    wheel.style.transform  = '';
    wheel.style.setProperty('--roulette-rotate', `${targetRotation}deg`);

    setRouletteResult(winningItem, previewReps);
    renderRouletteExerciseList(winningIndex);
    logSessionEntry(winningItem, previewReps);

    if (navigator.vibrate) navigator.vibrate([30, 40, 90]);
    showToast(`🎯 ${winningItem.name} — ${previewReps} reps`);
  });
}

// ── Session summary modal ─────────────────────────────────────
export function endRouletteSession() {
  if (sessionLog.length === 0) {
    showToast('⚠️ Aún no has hecho ningún giro');
    return;
  }

  const totalReps    = sessionLog.reduce((s, e) => s + e.reps, 0);
  const elapsed      = Date.now() - sessionStartTime;
  const mins         = Math.floor(elapsed / 60000);
  const secs         = Math.floor((elapsed % 60000) / 1000);
  const timeStr      = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  // Count reps per exercise
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

  // Inject the summary modal (reuse existing modal infrastructure)
  const overlay = document.getElementById('modalOverlay');
  const title   = document.getElementById('modalTitle');
  const text    = document.getElementById('modalText');
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
      <div class="session-summary__list">${rows}</div>
    </div>`;

  confirmBtn.textContent = '🔄 Nueva sesión';
  confirmBtn.onclick = () => {
    sessionLog = [];
    sessionStartTime = null;
    updateSessionUI();
    overlay.classList.remove('open');
    showToast('✅ Sesión reiniciada');
  };

  // Replace cancel button text
  const cancelBtn = overlay.querySelector('.btn-outline');
  if (cancelBtn) cancelBtn.textContent = 'Cerrar';

  overlay.classList.add('open');
}

// ── Init ──────────────────────────────────────────────────────
export function initExerciseRoulette() {
  renderExerciseWheel();
  renderRouletteExerciseList();
  updateSessionUI();
}

// Restore modal cancel button text when closed from outside roulette
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