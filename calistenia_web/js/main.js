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
import { initChallenges, selectChallenge, toggleChallengeComplete, setLevelFilter, setTypeFilter } from './sections/challenges.js';
import { initSkills, openSkill, openPhase, openPhase_skill, completeSession } from './sections/skills.js';

async function init() {
  renderRanking();
  renderRepsHistory();
  updateTimerDisplay();
  renderPlayerStatus();
  initExerciseRoulette();
  initChallenges();
  initSkills();
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
window.selectChallenge = selectChallenge;
window.toggleChallengeComplete = toggleChallengeComplete;
window.setLevelFilter = setLevelFilter;
window.setTypeFilter = setTypeFilter;
window.openSkill = openSkill;
window.openPhase = openPhase;
window.openPhase_skill = openPhase_skill;
window.completeSession = completeSession;

window.addEventListener('DOMContentLoaded', init);
