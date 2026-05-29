import { closeModal, switchTab } from './core/ui.js';
import { clearRepsHistory, generateReps, renderRepsHistory } from './sections/reps.js';
import { getCurrentTimeMs, selectTimeSource, timerReset, timerToggle, updateTimerDisplay } from './sections/timer.js';
import { initExerciseRoulette, spinExerciseRoulette, endRouletteSession, toggleSurvivalMode, survivalFail, generateRoutine, toggleRoutineItem } from './sections/roulette.js';
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

  // nothing extra needed — onSurvivalToggleChange handles sync
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
window.spinExerciseRoulette  = spinExerciseRoulette;
window.endRouletteSession    = endRouletteSession;
window.toggleSurvivalMode    = toggleSurvivalMode;
window.survivalFail          = survivalFail;
window.generateRoutine       = generateRoutine;
window.toggleRoutineItem     = toggleRoutineItem;
window.selectChallenge = selectChallenge;
window.toggleChallengeComplete = toggleChallengeComplete;
window.setLevelFilter = setLevelFilter;
window.setTypeFilter = setTypeFilter;
window.openSkill = openSkill;
window.openPhase = openPhase;
window.openPhase_skill = openPhase_skill;
window.completeSession = completeSession;

// ── Survival unified helpers ──────────────────────────────────

// Called by both toggles (desktop & mobile)
window.onSurvivalToggleChange = function(enabled) {
  // Sync the other toggle
  ['survivalToggleDesktop', 'survivalToggleMobile'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.checked !== enabled) el.checked = enabled;
  });
  // Sync teaser & mobile panel visual state
  const teaser = document.getElementById('survivalTeaser');
  const panel  = document.getElementById('survivalMobilePanel');
  if (enabled) {
    teaser?.classList.add('active-mode');
    panel?.classList.add('active-mode');
  } else {
    teaser?.classList.remove('active-mode');
    panel?.classList.remove('active-mode');
  }
  toggleSurvivalMode(enabled);
};

// Desktop popover open/close
function closeSurvivalPopoverOutside(e) {
  const popover = document.getElementById('survivalPopoverDesktop');
  const teaser  = document.getElementById('survivalTeaser');
  if (popover && !popover.contains(e.target) && !teaser?.contains(e.target)) {
    popover.classList.remove('open');
  }
}

window.toggleSurvivalPopover = function(e) {
  e.stopPropagation();
  const popover = document.getElementById('survivalPopoverDesktop');
  if (!popover) return;
  const isOpen = popover.classList.contains('open');
  if (isOpen) {
    popover.classList.remove('open');
  } else {
    popover.classList.add('open');
    setTimeout(() => {
      document.addEventListener('click', closeSurvivalPopoverOutside, { once: true });
    }, 0);
  }
};

window.closeSurvivalPopover = function() {
  document.getElementById('survivalPopoverDesktop')?.classList.remove('open');
};

// Mobile accordion toggle
window.toggleSurvivalMobilePanel = function() {
  const panel = document.getElementById('survivalMobilePanel');
  if (!panel) return;
  panel.classList.toggle('expanded');
};

// Activate from desktop popover — just toggle on
window.activateSurvivalFromPopover = function() {
  document.getElementById('survivalPopoverDesktop')?.classList.remove('open');
  window.onSurvivalToggleChange(true);
};

window.scrollToSurvival = function() {
  // No longer needed (card removed), but keep for safety
  document.getElementById('survivalPopoverDesktop')?.classList.remove('open');
  document.getElementById('survivalMobilePanel')?.classList.remove('expanded');
};

window.addEventListener('DOMContentLoaded', init);