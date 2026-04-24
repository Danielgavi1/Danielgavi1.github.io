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

export function spinExerciseRoulette() {
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

export function initExerciseRoulette() {
  renderExerciseWheel();
  renderRouletteExerciseList();
}
