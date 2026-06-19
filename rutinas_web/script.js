'use strict';

/* ============================================================
   SCRIPT.JS — DOM, ESTADO Y ORQUESTACIÓN
   ============================================================
   Usa:
     - data.js   → seed local (PEOPLE, SECTION_META, RUTINAS)
     - logic.js  → cálculos puros (Logic.*)
     - db.js     → Supabase (DB.*)
   No define datos ni fórmulas aquí: solo pinta y conecta.
   ============================================================ */

/* ============================================================
   ESTADO EN MEMORIA
   ============================================================ */
let currentPerson   = localStorage.getItem('person') || 'victoria';
let currentFilter   = 'all';
let searchOpen      = false;
let isOnline         = false;

// Catálogo de ejercicios EN USO (viene de Supabase si hay conexión,
// si no, se deriva de RUTINAS en data.js). Forma normalizada:
// { id, personId, sectionId, name, defaultLoad, sets, reps, note, sortOrder }
let exerciseCatalog = [];

// Sesión actual: { id, personId, sessionDate } — id es null en modo local
let currentSession  = null;

// Logs de la sesión actual en memoria, indexados por exerciseId:
// { loadKg, loadLabel, sets, reps, done }
let sessionLogs      = {};

// Historial por ejercicio (para PR / delta / sugerencia), indexado
// por exerciseId → array de { sessionDate, loadKg, done }
let exerciseHistoryCache = {};

/* ============================================================
   STORAGE LOCAL (fallback / caché — siempre se escribe aquí
   aunque haya Supabase, para que la app funcione sin red)
   ============================================================ */
const store = {
  isDone(id)       { return localStorage.getItem(`chk:${id}`) === '1'; },
  setDone(id, val) { val ? localStorage.setItem(`chk:${id}`, '1') : localStorage.removeItem(`chk:${id}`); },
  getLoad(id, def) { return localStorage.getItem(`ld:${id}`) || def; },
  setLoad(id, val) { localStorage.setItem(`ld:${id}`, val); },

  // Histórico local de sesiones, por si no hay Supabase.
  // Estructura: { "victoria": { "2026-06-17": { "v-gl-0": {loadKg,sets,reps,done}, ... } } }
  getHistoryBlob() {
    try { return JSON.parse(localStorage.getItem('sessionHistory') || '{}'); }
    catch { return {}; }
  },
  saveHistoryBlob(blob) { localStorage.setItem('sessionHistory', JSON.stringify(blob)); },

  recordLocalLog(personId, dateISO, exerciseId, fields) {
    const blob = this.getHistoryBlob();
    blob[personId] = blob[personId] || {};
    blob[personId][dateISO] = blob[personId][dateISO] || {};
    blob[personId][dateISO][exerciseId] = { ...fields };
    this.saveHistoryBlob(blob);
  },

  getExerciseHistoryLocal(personId, exerciseId, excludeDate) {
    const blob = this.getHistoryBlob();
    const perPerson = blob[personId] || {};
    return Object.entries(perPerson)
      .filter(([date]) => date !== excludeDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, exs]) => ({ sessionDate: date, ...(exs[exerciseId] || {}) }))
      .filter(h => h.loadKg !== undefined);
  },

  // Catálogo local editable (CRUD sin Supabase) — se guarda aparte
  // de RUTINAS (que es el seed de fábrica) para no perder cambios
  // del usuario si se actualiza data.js en el futuro.
  getLocalCatalog() {
    try { return JSON.parse(localStorage.getItem('localCatalog') || 'null'); }
    catch { return null; }
  },
  saveLocalCatalog(catalog) { localStorage.setItem('localCatalog', JSON.stringify(catalog)); },
};

/* ============================================================
   CATÁLOGO — normaliza RUTINAS (data.js) a la forma plana que
   usa toda la app, o usa el catálogo local guardado por el CRUD.
   ============================================================ */
function buildCatalogFromSeed() {
  const list = [];
  Object.entries(RUTINAS).forEach(([personId, persona]) => {
    Object.entries(persona.sections).forEach(([sectionId, exs]) => {
      exs.forEach((ex, i) => {
        list.push({
          id: ex.id,
          personId,
          sectionId,
          name: ex.name,
          defaultLoad: ex.load,
          sets: ex.sets,
          reps: ex.reps,
          note: ex.note || null,
          sortOrder: i,
        });
      });
    });
  });
  return list;
}

function exFromCatalog(personId) {
  return exerciseCatalog.filter(e => e.personId === personId);
}

function exById(id) {
  return exerciseCatalog.find(e => e.id === id);
}

/* ============================================================
   CARGA INICIAL DE DATOS (Supabase si hay, si no local)
   ============================================================ */
async function loadCatalog() {
  if (isOnline) {
    const remote = await DB.fetchExercises(currentPerson);
    if (remote) {
      const normalized = remote.map(r => ({
        id: r.id,
        personId: r.person_id,
        sectionId: r.section_id,
        name: r.name,
        defaultLoad: r.default_load,
        sets: r.target_sets,
        reps: r.target_reps,
        note: r.note,
        sortOrder: r.sort_order,
      }));
      exerciseCatalog = exerciseCatalog.filter(e => e.personId !== currentPerson).concat(normalized);
      return;
    }
  }
  const local = store.getLocalCatalog();
  exerciseCatalog = local || buildCatalogFromSeed();
}

async function ensureSession() {
  const dateISO = Logic.todayISO();
  if (isOnline) {
    const s = await DB.getOrCreateSession(currentPerson, dateISO);
    if (s) {
      currentSession = { id: s.id, personId: s.person_id, sessionDate: s.session_date };
      const logs = await DB.fetchSessionLogs(s.id);
      sessionLogs = {};
      (logs || []).forEach(l => {
        sessionLogs[l.exercise_id] = {
          loadKg: l.load_kg, loadLabel: l.load_label,
          sets: l.sets, reps: l.reps, done: l.done,
        };
      });
      return;
    }
  }
  currentSession = { id: null, personId: currentPerson, sessionDate: dateISO };
  sessionLogs = {};
}

async function loadHistoryForExercise(exerciseId) {
  if (exerciseHistoryCache[exerciseId]) return exerciseHistoryCache[exerciseId];

  let history = [];
  if (isOnline) {
    const remote = await DB.fetchExerciseHistory(exerciseId);
    if (remote) {
      history = remote
        .filter(r => r.session_date !== currentSession.sessionDate)
        .map(r => ({
          sessionDate: r.session_date,
          loadKg: r.load_kg,
          sets: r.sets ?? null,
          reps: r.reps ?? null,
          // volume_kg viene precalculado de la vista; si por lo que sea
          // no está, lo derivamos nosotros con la misma fórmula de Logic.
          volumeKg: r.volume_kg ?? Logic.calcVolume(r.load_kg, r.sets, r.reps),
          done: r.done,
        }));
    }
  } else {
    history = store.getExerciseHistoryLocal(currentPerson, exerciseId, currentSession.sessionDate)
      .map(h => ({ ...h, volumeKg: Logic.calcVolume(h.loadKg, h.sets, h.reps) }));
  }
  exerciseHistoryCache[exerciseId] = history;
  return history;
}

/* ============================================================
   GETTERS DE ESTADO POR EJERCICIO (usados en el render)
   ============================================================ */
function getExerciseState(ex) {
  const logged = sessionLogs[ex.id];
  const loadLabel = logged?.loadLabel ?? store.getLoad(ex.id, ex.defaultLoad);
  const done      = logged?.done ?? false;  // Cada nueva sesión empieza limpia (sin heredar checks de ayer)
  const sets      = logged?.sets ?? ex.sets;
  const reps      = logged?.reps ?? ex.reps;
  const loadKg    = logged?.loadKg ?? Logic.parseLoad(loadLabel);

  return { loadLabel, loadKg, sets, reps, done };
}

/* ============================================================
   PERSISTENCIA DE UN CAMBIO (toggle / edición de carga)
   ============================================================ */
async function persistExerciseLog(ex, state) {
  store.setDone(ex.id, state.done);
  store.setLoad(ex.id, state.loadLabel);
  store.recordLocalLog(currentPerson, currentSession.sessionDate, ex.id, {
    loadKg: state.loadKg, loadLabel: state.loadLabel,
    sets: state.sets, reps: state.reps, done: state.done,
  });
  sessionLogs[ex.id] = { ...state };

  delete exerciseHistoryCache[ex.id];

  if (isOnline && currentSession.id) {
    await DB.upsertSetLog(currentSession.id, ex.id, state);
  }
}

/* ============================================================
   RENDER HELPERS
   ============================================================ */

function prBadgeHTML(prInfo) {
  if (!prInfo || prInfo.isFirstTime || !prInfo.isPR) return '';
  return `<span class="ex-pr-badge" title="Nuevo récord">🏆 PR</span>`;
}

function deltaBadgeHTML(delta) {
  if (!delta || delta.kind === 'none') return '';
  const text = Logic.formatDelta(delta);
  const cls  = delta.kind === 'up' ? 'up' : delta.kind === 'down' ? 'down' : 'same';
  const arrow = delta.kind === 'up' ? '▲' : delta.kind === 'down' ? '▼' : '●';
  return `<span class="ex-delta ex-delta-${cls}" title="vs. sesión anterior">${arrow} ${text}</span>`;
}

function suggestionHTML(suggestion, currentLoadKg) {
  if (!suggestion || suggestion.suggestedKg == null) return '';
  if (suggestion.suggestedKg === currentLoadKg) return '';
  return `<button type="button" class="ex-suggest" data-suggest="${suggestion.suggestedKg}"
            title="Sugerencia para próxima sesión">💡 Probar ${suggestion.suggestedKg}Kg</button>`;
}

function cardHTML(ex) {
  const state = getExerciseState(ex);
  const history = exerciseHistoryCache[ex.id] || [];

  // PR y delta solo deben comparar contra sesiones COMPLETADAS: un set no
  // terminado no cuenta como referencia de progreso. La sugerencia, en
  // cambio, necesita ver también las incompletas (para no subir peso si
  // la última vez no se llegó a las reps objetivo).
  const completedHistory = history.filter(h => h.done !== false);

  const prInfo = Logic.detectPR(
    completedHistory.map(h => ({ loadKg: h.loadKg })),
    state.loadKg
  );

  const lastCompleted = completedHistory.length ? completedHistory[completedHistory.length - 1] : null;
  const delta = lastCompleted ? Logic.calcDelta(state.loadKg, lastCompleted.loadKg) : { kind: 'none' };

  const suggestion = Logic.suggestNextLoad(
    history.map(h => ({ loadKg: h.loadKg, completed: h.done })),
    state.loadKg
  );

  const doneClass = state.done ? ' done' : '';
  const prClass   = (!prInfo.isFirstTime && prInfo.isPR && state.done) ? ' has-pr' : '';

  return /* html */`
    <article class="ex-card${doneClass}${prClass}"
             data-id="${ex.id}"
             data-group="${ex.sectionId}"
             data-name="${ex.name.toLowerCase()}"
             role="listitem">
      <div class="ex-body">
        <p class="ex-name">${ex.name}</p>
        <div class="ex-meta">
          <span class="ex-sets">${state.sets}×${state.reps}</span>
          <span class="ex-dot">·</span>
          <span class="ex-load"
                data-id="${ex.id}"
                data-default="${ex.defaultLoad}"
                title="Toca para editar carga">${state.loadLabel}</span>
          ${ex.note ? `<span class="ex-dot">·</span><span class="ex-note">${ex.note}</span>` : ''}
        </div>
        <div class="ex-stats">
          ${state.done ? deltaBadgeHTML(delta) : ''}
          ${state.done ? prBadgeHTML(prInfo) : ''}
        </div>
        ${!state.done ? suggestionHTML(suggestion, state.loadKg) : ''}
      </div>
      <button class="ex-check-btn"
              type="button"
              tabindex="-1"
              aria-label="${state.done ? 'Completado' : 'Marcar como completado'}">
        <svg class="check-icon" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="3.5"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    </article>`;
}

function sectionHTML(sectionKey, exercises) {
  const meta    = SECTION_META[sectionKey];
  const done    = exercises.filter(ex => getExerciseState(ex).done).length;
  const total   = exercises.length;
  const pct     = total ? ((done / total) * 100).toFixed(1) : 0;
  const allDone = done === total && total > 0;

  return /* html */`
    <section class="section" data-group="${sectionKey}">
      <div class="section-hero">
        <img class="section-hero-img"
             src="${meta.img}"
             alt="${meta.alt}"
             loading="lazy"
             decoding="async" />
        <div class="section-hero-content">
          <h2 class="section-title">${meta.label}</h2>
          <span class="section-badge${allDone ? ' all-done' : ''}">${done}/${total}</span>
        </div>
      </div>
      <div class="section-minibar">
        <div class="section-minibar-fill" style="width:${pct}%"></div>
      </div>
      ${allDone ? '<div class="section-complete">✓ Sección completada</div>' : ''}
      <div class="ex-list" role="list">
        ${exercises.map(ex => cardHTML(ex)).join('')}
      </div>
    </section>`;
}

/* ============================================================
   RENDER — FULL REPAINT
   ============================================================ */
async function render() {
  const exercises = exFromCatalog(currentPerson);
  const main = document.getElementById('main');

  // Invalidamos la cache de historial de los ejercicios visibles antes de
  // recalcular: es una lectura local barata (o una llamada ya necesaria a
  // Supabase) y evita mostrar PR/delta desactualizados si los datos
  // cambiaron por una vía distinta al flujo normal de toggle/edición
  // (p. ej. sync en segundo plano, multi-pestaña).
  exercises.forEach(ex => delete exerciseHistoryCache[ex.id]);

  await Promise.all(exercises.map(ex => loadHistoryForExercise(ex.id)));

  const bySection = {};
  exercises.forEach(ex => {
    bySection[ex.sectionId] = bySection[ex.sectionId] || [];
    bySection[ex.sectionId].push(ex);
  });

  const order = Object.keys(SECTION_META).filter(k => bySection[k]);
  main.innerHTML = order.map(key => sectionHTML(key, bySection[key])).join('');

  updateProgress();
  bindCardEvents();

  applyFilter(currentFilter, /* silent */ true);
  const q = document.getElementById('searchInput').value;
  if (q) applySearch(q);

  renderOnlineBadge();
}

/* ============================================================
   PROGRESS UPDATE (incremental, no full re-render)
   ============================================================ */
function updateProgress() {
  const exercises = exFromCatalog(currentPerson);
  let totalAll = 0, doneAll = 0;

  const bySection = {};
  exercises.forEach(ex => {
    bySection[ex.sectionId] = bySection[ex.sectionId] || [];
    bySection[ex.sectionId].push(ex);
  });

  Object.entries(bySection).forEach(([key, exs]) => {
    const d = exs.filter(ex => getExerciseState(ex).done).length;
    const t = exs.length;
    totalAll += t;
    doneAll  += d;

    const section  = document.querySelector(`.section[data-group="${key}"]`);
    if (!section) return;

    const badge    = section.querySelector('.section-badge');
    const fill     = section.querySelector('.section-minibar-fill');
    const existing = section.querySelector('.section-complete');
    const minibar  = section.querySelector('.section-minibar');
    const allDone  = d === t && t > 0;

    if (badge) {
      badge.textContent = `${d}/${t}`;
      badge.classList.toggle('all-done', allDone);
    }
    if (fill) fill.style.width = t ? `${((d / t) * 100).toFixed(1)}%` : '0%';

    if (allDone && !existing) {
      const banner = document.createElement('div');
      banner.className = 'section-complete';
      banner.textContent = '✓ Sección completada';
      minibar.insertAdjacentElement('afterend', banner);
    } else if (!allDone && existing) {
      existing.remove();
    }
  });

  document.getElementById('doneCount').textContent  = doneAll;
  document.getElementById('totalCount').textContent = totalAll;
  const pct  = totalAll ? ((doneAll / totalAll) * 100).toFixed(1) : 0;
  const fill = document.getElementById('progressFill');
  fill.style.width = `${pct}%`;
  fill.classList.toggle('complete', doneAll === totalAll && totalAll > 0);
}

/* ============================================================
   ONLINE BADGE (indicador discreto de estado de sync)
   ============================================================ */
function renderOnlineBadge() {
  const el = document.getElementById('syncBadge');
  if (!el) return;
  el.textContent = isOnline ? '☁️ Sync' : '📴 Local';
  el.classList.toggle('online', isOnline);
  el.classList.toggle('offline', !isOnline);
}

/* ============================================================
   CARD EVENTS (re-bound after each render)
   ============================================================ */
function bindCardEvents() {
  document.querySelectorAll('.ex-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.ex-load') || e.target.closest('.ex-suggest') || e.target.tagName === 'INPUT') return;
      toggleCard(card);
    });
  });

  document.querySelectorAll('.ex-load').forEach(loadEl => {
    loadEl.addEventListener('click', e => {
      e.stopPropagation();
      startLoadEdit(loadEl);
    });
  });

  document.querySelectorAll('.ex-suggest').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const card = btn.closest('.ex-card');
      const id   = card.dataset.id;
      const ex   = exById(id);
      const newLoad = `${btn.dataset.suggest}Kg`;
      const state = getExerciseState(ex);
      state.loadLabel = newLoad;
      state.loadKg = Logic.parseLoad(newLoad);
      await persistExerciseLog(ex, state);
      await render();
    });
  });
}

async function toggleCard(card) {
  const id = card.dataset.id;
  const ex = exById(id);
  const state = getExerciseState(ex);
  state.done = !state.done;

  await persistExerciseLog(ex, state);

  card.classList.toggle('done', state.done);
  const btn = card.querySelector('.ex-check-btn');
  if (btn) {
    btn.setAttribute('aria-label', state.done ? 'Completado' : 'Marcar como completado');
    btn.style.animation = 'none';
    btn.offsetHeight;
    btn.style.animation = '';
  }
  card.classList.add('popping');
  card.addEventListener('animationend', () => card.classList.remove('popping'), { once: true });

  await render();
}

/* ============================================================
   LOAD EDITING (inline, no modal)
   ============================================================ */
function startLoadEdit(loadEl) {
  if (loadEl.querySelector('input')) return;

  const id         = loadEl.dataset.id;
  const current    = loadEl.textContent.trim();
  const defaultVal = loadEl.dataset.default;

  const input = document.createElement('input');
  input.type      = 'text';
  input.value     = current === '—' ? '' : current;
  input.className = 'load-input';
  input.setAttribute('aria-label', 'Editar carga');

  loadEl.textContent = '';
  loadEl.appendChild(input);
  loadEl.classList.add('editing');

  requestAnimationFrame(() => { input.focus(); input.select(); });

  const save = async () => {
    const newVal = input.value.trim() || defaultVal;
    loadEl.classList.remove('editing');
    loadEl.textContent = newVal;

    const ex = exById(id);
    const state = getExerciseState(ex);
    state.loadLabel = newVal;
    state.loadKg = Logic.parseLoad(newVal);
    await persistExerciseLog(ex, state);
    await render();
  };

  const cancel = () => {
    loadEl.classList.remove('editing');
    loadEl.textContent = current;
  };

  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.removeEventListener('blur', save); cancel(); }
  });
}

/* ============================================================
   FILTER
   ============================================================ */
function applyFilter(filter, silent = false) {
  currentFilter = filter;

  if (!silent) {
    document.querySelectorAll('.chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.filter === filter);
    });
  }

  document.querySelectorAll('.section').forEach(section => {
    const group   = section.dataset.group;
    const visible = filter === 'all' || filter === group;
    section.classList.toggle('hidden', !visible);
  });
}

/* ============================================================
   SEARCH
   ============================================================ */
function applySearch(query) {
  const q    = (query || '').trim().toLowerCase();
  const info = document.getElementById('searchInfo');

  if (!q) {
    document.querySelectorAll('.ex-card').forEach(c => c.classList.remove('search-hidden'));
    document.querySelectorAll('.section').forEach(s => {
      const g = s.dataset.group;
      s.classList.toggle('hidden', currentFilter !== 'all' && currentFilter !== g);
    });
    if (info) info.textContent = '';
    return;
  }

  let totalFound = 0;

  document.querySelectorAll('.section').forEach(section => {
    let sectionFound = 0;
    section.classList.remove('hidden');

    section.querySelectorAll('.ex-card').forEach(card => {
      const name    = card.dataset.name || '';
      const matches = name.includes(q) || fuzzyWordMatch(name, q);
      card.classList.toggle('search-hidden', !matches);
      if (matches) { totalFound++; sectionFound++; }
    });

    if (sectionFound === 0) section.classList.add('hidden');
  });

  if (info) {
    if (totalFound > 0) {
      info.textContent = `${totalFound} ejercicio${totalFound !== 1 ? 's' : ''} encontrado${totalFound !== 1 ? 's' : ''}`;
      info.style.color = '';
    } else {
      info.textContent = 'Sin resultados';
      info.style.color = '#f87171';
    }
  }
}

function fuzzyWordMatch(text, query) {
  return query.split(/\s+/).filter(w => w.length >= 2).some(w => text.includes(w));
}

/* ============================================================
   PERSON SWITCH
   ============================================================ */
async function switchPerson(personKey) {
  currentPerson = personKey;
  localStorage.setItem('person', personKey);

  document.querySelectorAll('.person-tab').forEach(tab => {
    const active = tab.dataset.person === personKey;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  applySearch('');

  currentFilter = 'all';
  document.querySelectorAll('.chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.filter === 'all');
  });

  exerciseHistoryCache = {};
  await loadCatalog();
  await ensureSession();
  await render();
}

/* ============================================================
   THEME
   ============================================================ */
function applyTheme(save = false) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const stored      = localStorage.getItem('theme');
  const isDark      = stored ? stored === 'dark' : prefersDark;

  if (save) localStorage.setItem('theme', isDark ? 'light' : 'dark');

  const nowDark = save ? !isDark : isDark;
  document.body.classList.toggle('dark',  nowDark);
  document.body.classList.toggle('light', !nowDark);

  const meta = document.getElementById('themeColor');
  if (meta) meta.content = nowDark ? '#080A0F' : '#F0F3FA';
}

/* ============================================================
   RESET SESSION (de hoy)
   ============================================================ */
async function resetSession() {
  const exercises = exFromCatalog(currentPerson);
  for (const ex of exercises) {
    const state = getExerciseState(ex);
    state.done = false;
    await persistExerciseLog(ex, state);
  }
  await render();
}

/* ============================================================
   SEARCH TOGGLE
   ============================================================ */
function toggleSearch(force) {
  searchOpen = typeof force === 'boolean' ? force : !searchOpen;

  const bar   = document.getElementById('searchBar');
  const input = document.getElementById('searchInput');

  bar.classList.toggle('open', searchOpen);
  bar.setAttribute('aria-hidden', searchOpen ? 'false' : 'true');

  if (searchOpen) {
    setTimeout(() => input && input.focus(), 220);
  } else {
    if (input) input.value = '';
    applySearch('');
  }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {

  // ── Theme ──────────────────────────────────────────────
  applyTheme();
  document.getElementById('darkToggle').addEventListener('click', () => applyTheme(true));

  // ── Conexión Supabase ──────────────────────────────────
  isOnline = await DB.init();

  // ── Catálogo + sesión inicial ──────────────────────────
  await loadCatalog();
  await ensureSession();

  // ── Person tabs ────────────────────────────────────────
  document.querySelectorAll('.person-tab').forEach(tab => {
    tab.addEventListener('click', () => switchPerson(tab.dataset.person));
  });
  document.querySelectorAll('.person-tab').forEach(tab => {
    const active = tab.dataset.person === currentPerson;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  // ── Filter chips ───────────────────────────────────────
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => applyFilter(chip.dataset.filter));
  });

  // ── Search ─────────────────────────────────────────────
  document.getElementById('searchToggle').addEventListener('click', () => toggleSearch());
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  searchInput.addEventListener('input', () => applySearch(searchInput.value));
  searchInput.addEventListener('keydown', e => { if (e.key === 'Escape') toggleSearch(false); });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    applySearch('');
    searchInput.focus();
  });

  // ── Reset ──────────────────────────────────────────────
  document.getElementById('resetBtn').addEventListener('click', () => {
    const persona = PEOPLE.find(p => p.id === currentPerson)?.label || currentPerson;
    if (confirm(`¿Reiniciar la sesión de ${persona}?\nSe borrarán todos los checks de hoy.`)) {
      resetSession();
    }
  });

  // ── Keyboard: "/" abre búsqueda ──────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !searchOpen && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      toggleSearch(true);
    }
  });

  // ── Initial render ─────────────────────────────────────
  await render();
});
