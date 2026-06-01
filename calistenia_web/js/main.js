import { closeModal, switchTab, VALID_TABS } from './core/ui.js';
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

  // Bind all static HTML buttons via addEventListener
  setupEvents();

  // ── Hash routing: restore tab from URL on load ────────────
  const initHash = location.hash.slice(1);
  if (VALID_TABS.includes(initHash)) {
    switchTab(initHash);
  } else {
    history.replaceState(null, '', '#reps');
  }

  // ── Hash routing: back / forward navigation ───────────────
  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (VALID_TABS.includes(id)) switchTab(id);
  });
}

// ── Event listeners for all static HTML buttons ───────────────
function setupEvents() {
  // Nav tabs
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Reps
  document.getElementById('generateRepsBtn')?.addEventListener('click', generateReps);
  document.getElementById('clearHistoryBtn')?.addEventListener('click', clearRepsHistory);

  // Timer
  document.getElementById('timerStartBtn')?.addEventListener('click', timerToggle);
  document.getElementById('timerResetBtn')?.addEventListener('click', timerReset);
  document.getElementById('srcTimer')?.addEventListener('click', () => selectTimeSource('timer'));
  document.getElementById('srcManual')?.addEventListener('click', () => selectTimeSource('manual'));
  document.getElementById('saveRankingBtn')?.addEventListener('click', saveToRanking);

  // Ranking
  document.getElementById('updateRankingBtn')?.addEventListener('click', () => loadRanking(true));
  document.getElementById('deleteMyEntryBtn')?.addEventListener('click', confirmDeleteMyEntry);

  // Modal
  document.getElementById('modalOverlay')?.addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn')?.addEventListener('click', closeModal);

  // Roulette
  document.getElementById('rouletteSpinBtn')?.addEventListener('click', spinExerciseRoulette);
  document.getElementById('rouletteEndSessionBtn')?.addEventListener('click', endRouletteSession);
  document.getElementById('routineGenBtn')?.addEventListener('click', generateRoutine);

  // Survival popover (desktop)
  document.getElementById('survivalTeaser')?.addEventListener('click', e => window.toggleSurvivalPopover(e));
  document.getElementById('survivalPopoverCloseBtn')?.addEventListener('click', window.closeSurvivalPopover);

  // Survival toggles — sync both checkboxes
  ['survivalToggleDesktop', 'survivalToggleMobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', function () {
      window.onSurvivalToggleChange(this.checked);
    });
  });

  // Survival fail buttons
  document.getElementById('survivalFailBtnDesktop')?.addEventListener('click', survivalFail);
  document.getElementById('survivalFailBtnMobile')?.addEventListener('click', survivalFail);

  // Survival mobile panel accordion
  document.getElementById('survivalMobileHeader')?.addEventListener('click', () => window.toggleSurvivalMobilePanel());

  // Challenge filters (use data attributes already on buttons)
  document.querySelectorAll('.challenges-level-btn').forEach(btn => {
    btn.addEventListener('click', () => setLevelFilter(btn.dataset.nivel));
  });
  document.querySelectorAll('.challenges-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTypeFilter(btn.dataset.tipo === 'todos' ? null : btn.dataset.tipo);
    });
  });
}

// window.* assignments keep onclick handlers in dynamically-generated HTML working.
// Static HTML buttons now use addEventListener (see setupEvents above).
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

// Mobile accordion toggle — animación fluida por JS (sin jank en móvil)
window.toggleSurvivalMobilePanel = function() {
  const panel = document.getElementById('survivalMobilePanel');
  if (!panel) return;

  const wrapper = panel.querySelector('.survival-mobile-body-wrapper');
  const body    = panel.querySelector('.survival-mobile-body');
  if (!wrapper || !body) { panel.classList.toggle('expanded'); return; }

  const isExpanded = panel.classList.contains('expanded');

  // Pista al compositor para preparar la capa antes de animar
  wrapper.style.willChange = 'height';

  if (isExpanded) {
    // ── CERRAR ──
    // Congelar el padding del body inline ANTES de quitar la clase.
    // Sin esto, al quitar 'expanded' el padding desaparece de golpe y
    // todo el contenido se desplaza visualmente mientras la altura baja.
    body.style.padding = window.getComputedStyle(body).padding;

    wrapper.style.height = wrapper.scrollHeight + 'px';
    void wrapper.offsetHeight; // forzar reflow para que el browser registre el valor
    wrapper.style.height = '0px';

    // Quitar 'expanded' ahora: chevron y header vuelven (OK),
    // pero el padding ya está congelado vía inline → el body no salta
    panel.classList.remove('expanded');

    wrapper.addEventListener('transitionend', function cleanup(e) {
      if (e.propertyName !== 'height') return; // ignorar opacity u otros transitionend
      body.style.padding = '';        // limpiar cuando el panel ya está oculto
      wrapper.style.willChange = 'auto';
      wrapper.removeEventListener('transitionend', cleanup);
    });

  } else {
    // ── ABRIR ──
    panel.classList.add('expanded'); // aplica padding:12px al body vía CSS → afecta scrollHeight
    const targetH = body.scrollHeight; // altura real incluyendo padding
    wrapper.style.height = '0px';
    void wrapper.offsetHeight; // forzar reflow
    wrapper.style.height = targetH + 'px';

    wrapper.addEventListener('transitionend', function cleanup(e) {
      if (e.propertyName !== 'height') return;
      wrapper.style.height = 'auto'; // permite reflow libre si el contenido cambia luego
      wrapper.style.willChange = 'auto';
      wrapper.removeEventListener('transitionend', cleanup);
    });
  }
};

// Activate from desktop popover — just toggle on
window.activateSurvivalFromPopover = function() {
  document.getElementById('survivalPopoverDesktop')?.classList.remove('open');
  window.onSurvivalToggleChange(true);
};

window.scrollToSurvival = function() {
  // No longer needed (card removed), but keep for safety
  document.getElementById('survivalPopoverDesktop')?.classList.remove('open');
  // Usar la función de toggle si el panel está abierto, para animar el cierre
  const panel = document.getElementById('survivalMobilePanel');
  if (panel?.classList.contains('expanded')) window.toggleSurvivalMobilePanel();
};

init();