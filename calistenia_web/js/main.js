import { closeModal, switchTab } from './core/ui.js';
import { clearRepsHistory, generateReps, renderRepsHistory } from './sections/reps.js';
import { getCurrentTimeMs, selectTimeSource, timerReset, timerToggle, updateTimerDisplay } from './sections/timer.js';
import { initExerciseRoulette, spinExerciseRoulette } from './sections/roulette.js';
import {
  confirmDeleteMyEntry,
  loadRanking,
  renderPlayerStatus,
  renderRanking,
  saveToRanking,
  setupPlayerNameBlur,
  setupRealtime
} from './sections/ranking.js';

async function init() {
  renderRanking();
  renderRepsHistory();
  updateTimerDisplay();
  renderPlayerStatus();
  initExerciseRoulette();
  await loadRanking();
  setupRealtime();
  setupPlayerNameBlur();
}

// Mantiene compatibles los onclick="..." que ya tienes en el HTML.
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
