'use strict';

const DELETE_CODE_HASH = '338d5c1af7635429a968c92017f7055133cf862c5cd083661f04b1fac4349626';

const state = {
  people: [],
  sections: [],
  exercises: [],
  currentPerson: localStorage.getItem('person') || '',
  currentFilter: 'all',
  search: '',
  editingId: null,
  pendingDeleteId: null,
  completedExerciseIds: new Set(),
};

const elements = {};

/* ============================================================
   DATOS
   ============================================================ */
async function loadInitialData() {
  setConnectionStatus('loading', 'Conectando…');

  const [people, sections] = await Promise.all([
    DB.getPeople(),
    DB.getSections(),
  ]);

  state.people = people;
  state.sections = sections;

  if (!people.some(person => person.id === state.currentPerson)) {
    state.currentPerson = people[0]?.id || '';
  }

  loadCompletedExercises();
  await loadExercises();
  setConnectionStatus('online', 'Supabase');
}

async function loadExercises() {
  if (!state.currentPerson) {
    state.exercises = [];
    render();
    return;
  }

  state.exercises = await DB.getExercises(state.currentPerson);
  pruneCompletedExercises();
  render();
}

function pruneCompletedExercises() {
  const validIds = new Set(state.exercises.map(exercise => exercise.id));
  const previousSize = state.completedExerciseIds.size;
  state.completedExerciseIds = new Set(
    [...state.completedExerciseIds].filter(id => validIds.has(id))
  );

  if (state.completedExerciseIds.size !== previousSize) saveCompletedExercises();
}

/* ============================================================
   RENDER
   ============================================================ */
function render() {
  renderPeople();
  renderFilters();
  renderRoutineProgress();
  renderExercises();
}

function renderPeople() {
  elements.personTabs.innerHTML = state.people.map(person => `
    <button class="person-tab${person.id === state.currentPerson ? ' active' : ''}"
            type="button"
            data-person="${escapeAttribute(person.id)}"
            aria-pressed="${person.id === state.currentPerson}">
      <span class="person-av">${escapeHTML(person.avatar || '🏋️')}</span>
      <span>${escapeHTML(person.label)}</span>
    </button>
  `).join('');
}

function renderFilters() {
  const buttons = [
    '<button class="chip active" type="button" data-filter="all"><span>✨</span> Toda la rutina</button>',
    ...state.sections.map(section => `
      <button class="chip" type="button" data-filter="${escapeAttribute(section.id)}">
        <span>${sectionEmoji(section.id)}</span> ${escapeHTML(section.label)}
      </button>
    `),
  ];

  elements.filterBar.innerHTML = buttons.join('');
  updateActiveFilter();
}

function renderRoutineProgress() {
  const total = state.exercises.length;
  const completed = state.exercises.filter(exercise => state.completedExerciseIds.has(exercise.id)).length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  elements.routineProgressText.textContent = `${completed} de ${total}`;
  elements.routineProgressPercent.textContent = `${percentage}%`;
  elements.routineProgressBar.style.width = `${percentage}%`;
}

function renderExercises() {
  const filtered = getVisibleExercises();
  const sectionsWithExercises = state.sections.filter(section =>
    filtered.some(exercise => exercise.section_id === section.id)
  );

  if (!sectionsWithExercises.length) {
    elements.main.innerHTML = `
      <div class="empty-state">
        <span>🏋️</span>
        <h2>No hay ejercicios</h2>
        <p>Añade uno nuevo o cambia los filtros de búsqueda.</p>
      </div>
    `;
    updateSearchInfo(0);
    renderRoutineProgress();
    return;
  }

  elements.main.innerHTML = sectionsWithExercises.map(section => {
    const exercises = filtered
      .filter(exercise => exercise.section_id === section.id)
      .sort(compareExercises);

    const completed = exercises.filter(exercise => state.completedExerciseIds.has(exercise.id)).length;
    const percentage = exercises.length ? Math.round((completed / exercises.length) * 100) : 0;

    return `
      <section class="section" data-section="${escapeAttribute(section.id)}">
        <div class="section-hero" style="--section-color:${escapeAttribute(section.color || '#64748B')}">
          ${section.image_url ? `
            <img class="section-hero-img"
                 src="${escapeAttribute(section.image_url)}"
                 alt="${escapeAttribute(section.label)}"
                 loading="lazy">
          ` : ''}
          <div class="section-overlay"></div>
          <div class="section-hero-content">
            <div>
              <span class="section-kicker">${sectionEmoji(section.id)} Grupo muscular</span>
              <h2>${escapeHTML(section.label)}</h2>
            </div>
            <div class="section-progress" title="Ejercicios completados">
              <strong>${completed}/${exercises.length}</strong>
              <span>completados</span>
            </div>
          </div>
          <div class="section-progress-track" aria-hidden="true">
            <span style="width:${percentage}%"></span>
          </div>
        </div>

        <div class="exercise-list">
          ${exercises.map((exercise, index) => exerciseCardHTML(exercise, index)).join('')}
        </div>
      </section>
    `;
  }).join('');

  updateSearchInfo(filtered.length);
  renderRoutineProgress();
}

function exerciseCardHTML(exercise, index) {
  const completed = state.completedExerciseIds.has(exercise.id);
  const load = exercise.default_load?.trim() || 'Sin carga';

  return `
    <article class="exercise-card${completed ? ' completed' : ''}" data-id="${escapeAttribute(exercise.id)}">
      <div class="exercise-leading">
        <span class="exercise-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
        <label class="exercise-check-control" data-action="toggle-complete">
          <input
            class="exercise-check"
            type="checkbox"
            aria-label="Marcar ${escapeAttribute(exercise.name)} como completado"
            ${completed ? 'checked' : ''}
          >
          <span class="exercise-checkmark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 4 4L19 6"/></svg>
          </span>
        </label>
      </div>

      <div class="exercise-content">
        <div class="exercise-title-row">
          <div>
            <span class="exercise-status">${completed ? 'Completado' : 'Pendiente'}</span>
            <h3>${escapeHTML(exercise.name)}</h3>
          </div>

          <div class="card-actions">
            <button class="card-button edit-button" type="button" data-action="edit" aria-label="Editar ${escapeAttribute(exercise.name)}" title="Editar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="card-button delete-button" type="button" data-action="delete" aria-label="Eliminar ${escapeAttribute(exercise.name)}" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>
            </button>
          </div>
        </div>

        <div class="exercise-metrics">
          <div class="exercise-metric exercise-load">
            <span>Peso / carga</span>
            <strong>${escapeHTML(load)}</strong>
          </div>
          <div class="exercise-metric">
            <span>Series</span>
            <strong>${escapeHTML(exercise.target_sets)}</strong>
          </div>
          <div class="exercise-metric">
            <span>Reps</span>
            <strong>${escapeHTML(exercise.target_reps)}</strong>
          </div>
        </div>

        ${exercise.note ? `
          <div class="exercise-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
            <span>${escapeHTML(exercise.note)}</span>
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

function getVisibleExercises() {
  const query = normalizeText(state.search);

  return state.exercises.filter(exercise => {
    const matchesSection = state.currentFilter === 'all' || exercise.section_id === state.currentFilter;
    const searchableText = normalizeText(`${exercise.name} ${exercise.default_load} ${exercise.note || ''}`);
    return matchesSection && (!query || searchableText.includes(query));
  });
}

function compareExercises(a, b) {
  return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    || a.name.localeCompare(b.name, 'es');
}

/* ============================================================
   CHECKS DIARIOS
   ============================================================ */
function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCompletionStorageKey() {
  return `routine-completion:${state.currentPerson}`;
}

function loadCompletedExercises() {
  state.completedExerciseIds = new Set();
  if (!state.currentPerson) return;

  try {
    const saved = JSON.parse(localStorage.getItem(getCompletionStorageKey()) || 'null');
    if (saved?.date === getTodayKey() && Array.isArray(saved.exerciseIds)) {
      state.completedExerciseIds = new Set(saved.exerciseIds);
    } else {
      localStorage.removeItem(getCompletionStorageKey());
    }
  } catch {
    localStorage.removeItem(getCompletionStorageKey());
  }
}

function saveCompletedExercises() {
  if (!state.currentPerson) return;

  localStorage.setItem(getCompletionStorageKey(), JSON.stringify({
    date: getTodayKey(),
    exerciseIds: [...state.completedExerciseIds],
  }));
}

function toggleExerciseCompleted(exerciseId) {
  if (state.completedExerciseIds.has(exerciseId)) {
    state.completedExerciseIds.delete(exerciseId);
  } else {
    state.completedExerciseIds.add(exerciseId);
  }

  saveCompletedExercises();
  renderExercises();
}

/* ============================================================
   FORMULARIO CRUD
   ============================================================ */
function openCreateDialog() {
  state.editingId = null;
  elements.form.reset();
  elements.dialogTitle.textContent = 'Añadir ejercicio';
  elements.sectionField.value = state.currentFilter !== 'all'
    ? state.currentFilter
    : state.sections[0]?.id || '';
  elements.setsField.value = 3;
  elements.repsField.value = 10;
  elements.orderField.value = getNextSortOrder(elements.sectionField.value);
  elements.deleteFromDialog.hidden = true;
  elements.saveButton.textContent = 'Añadir ejercicio';
  elements.dialog.showModal();
  requestAnimationFrame(() => elements.nameField.focus());
}

function openEditDialog(id) {
  const exercise = state.exercises.find(item => item.id === id);
  if (!exercise) return;

  state.editingId = id;
  elements.dialogTitle.textContent = 'Editar ejercicio';
  elements.nameField.value = exercise.name;
  elements.sectionField.value = exercise.section_id;
  elements.loadField.value = exercise.default_load || '';
  elements.setsField.value = exercise.target_sets;
  elements.repsField.value = exercise.target_reps;
  elements.noteField.value = exercise.note || '';
  elements.orderField.value = exercise.sort_order ?? 0;
  elements.deleteFromDialog.hidden = false;
  elements.saveButton.textContent = 'Guardar cambios';
  elements.dialog.showModal();
  requestAnimationFrame(() => elements.nameField.focus());
}

async function saveExercise(event) {
  event.preventDefault();

  const exercise = {
    personId: state.currentPerson,
    sectionId: elements.sectionField.value,
    name: elements.nameField.value,
    defaultLoad: elements.loadField.value,
    targetSets: Number(elements.setsField.value),
    targetReps: Number(elements.repsField.value),
    note: elements.noteField.value,
    sortOrder: Number(elements.orderField.value),
  };

  if (!exercise.name.trim()) {
    elements.nameField.focus();
    return;
  }

  await runMutation(async () => {
    if (state.editingId) {
      await DB.updateExercise(state.editingId, exercise);
    } else {
      await DB.createExercise(exercise);
    }

    elements.dialog.close();
    state.editingId = null;
    await loadExercises();
  });
}

function requestDelete(id) {
  const exercise = state.exercises.find(item => item.id === id);
  if (!exercise) return;

  state.pendingDeleteId = id;
  elements.deleteExerciseName.textContent = `“${exercise.name}”`;
  elements.deleteCode.value = '';
  elements.deleteError.textContent = '';
  elements.deleteForm.classList.remove('invalid');

  if (elements.dialog.open) elements.dialog.close();
  elements.deleteDialog.showModal();
  requestAnimationFrame(() => elements.deleteCode.focus());
}

async function confirmProtectedDelete(event) {
  event.preventDefault();

  const exercise = state.exercises.find(item => item.id === state.pendingDeleteId);
  if (!exercise) {
    closeDeleteDialog();
    return;
  }

  const enteredHash = await sha256(elements.deleteCode.value.trim());
  if (enteredHash !== DELETE_CODE_HASH) {
    elements.deleteError.textContent = 'El código no es correcto. El ejercicio no se ha borrado.';
    elements.deleteForm.classList.remove('invalid');
    void elements.deleteForm.offsetWidth;
    elements.deleteForm.classList.add('invalid');
    elements.deleteCode.select();
    return;
  }

  await runMutation(async () => {
    await DB.deleteExercise(exercise.id, elements.deleteCode.value.trim());
    state.completedExerciseIds.delete(exercise.id);
    saveCompletedExercises();
    closeDeleteDialog();
    state.editingId = null;
    await loadExercises();
  });
}

function closeDeleteDialog() {
  if (elements.deleteDialog.open) elements.deleteDialog.close();
  state.pendingDeleteId = null;
  elements.deleteCode.value = '';
  elements.deleteError.textContent = '';
  elements.deleteForm.classList.remove('invalid');
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function runMutation(action) {
  setFormBusy(true);
  setConnectionStatus('loading', 'Guardando…');

  try {
    await action();
    setConnectionStatus('online', 'Guardado');
    window.setTimeout(() => setConnectionStatus('online', 'Supabase'), 1200);
  } catch (error) {
    handleError(error);
  } finally {
    setFormBusy(false);
  }
}

function populateSectionSelect() {
  elements.sectionField.innerHTML = state.sections.map(section =>
    `<option value="${escapeAttribute(section.id)}">${sectionEmoji(section.id)} ${escapeHTML(section.label)}</option>`
  ).join('');
}

function getNextSortOrder(sectionId) {
  const orders = state.exercises
    .filter(exercise => exercise.section_id === sectionId)
    .map(exercise => Number(exercise.sort_order) || 0);

  return orders.length ? Math.max(...orders) + 1 : 0;
}

/* ============================================================
   EVENTOS
   ============================================================ */
function bindEvents() {
  elements.personTabs.addEventListener('click', async event => {
    const button = event.target.closest('[data-person]');
    if (!button || button.dataset.person === state.currentPerson) return;

    state.currentPerson = button.dataset.person;
    state.currentFilter = 'all';
    localStorage.setItem('person', state.currentPerson);
    loadCompletedExercises();
    await runRead(loadExercises);
  });

  elements.filterBar.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    state.currentFilter = button.dataset.filter;
    updateActiveFilter();
    renderExercises();
  });

  elements.main.addEventListener('click', event => {
    const card = event.target.closest('.exercise-card');
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!card || !action) return;

    if (action === 'toggle-complete') toggleExerciseCompleted(card.dataset.id);
    if (action === 'edit') openEditDialog(card.dataset.id);
    if (action === 'delete') requestDelete(card.dataset.id);
  });

  elements.addButton.addEventListener('click', openCreateDialog);
  elements.form.addEventListener('submit', saveExercise);
  elements.deleteForm.addEventListener('submit', confirmProtectedDelete);

  elements.dialog.addEventListener('click', event => {
    if (event.target.matches('[data-dialog-close]')) elements.dialog.close();
    if (event.target === elements.dialog) elements.dialog.close();
  });

  elements.deleteDialog.addEventListener('click', event => {
    if (event.target === elements.deleteDialog) closeDeleteDialog();
  });

  elements.deleteDialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeDeleteDialog();
  });

  elements.cancelDeleteButton.addEventListener('click', closeDeleteDialog);
  elements.deleteFromDialog.addEventListener('click', () => requestDelete(state.editingId));

  elements.deleteCode.addEventListener('input', () => {
    elements.deleteCode.value = elements.deleteCode.value.replace(/\D/g, '').slice(0, 6);
    elements.deleteError.textContent = '';
    elements.deleteForm.classList.remove('invalid');
  });

  elements.sectionField.addEventListener('change', () => {
    if (!state.editingId) elements.orderField.value = getNextSortOrder(elements.sectionField.value);
  });

  elements.searchToggle.addEventListener('click', toggleSearch);
  elements.searchInput.addEventListener('input', () => {
    state.search = elements.searchInput.value;
    renderExercises();
  });
  elements.searchClear.addEventListener('click', () => {
    state.search = '';
    elements.searchInput.value = '';
    renderExercises();
    elements.searchInput.focus();
  });

  elements.themeButton.addEventListener('click', toggleTheme);

  document.addEventListener('keydown', event => {
    const activeTag = document.activeElement?.tagName;
    if (event.key === '/' && activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
      event.preventDefault();
      openSearch();
    }
  });
}

/* ============================================================
   UI AUXILIAR
   ============================================================ */
function cacheElements() {
  elements.personTabs = document.getElementById('personTabs');
  elements.filterBar = document.getElementById('filterBar');
  elements.main = document.getElementById('main');
  elements.connectionBadge = document.getElementById('connectionBadge');
  elements.addButton = document.getElementById('addButton');
  elements.searchToggle = document.getElementById('searchToggle');
  elements.searchBar = document.getElementById('searchBar');
  elements.searchInput = document.getElementById('searchInput');
  elements.searchClear = document.getElementById('searchClear');
  elements.searchInfo = document.getElementById('searchInfo');
  elements.themeButton = document.getElementById('darkToggle');
  elements.routineProgressText = document.getElementById('routineProgressText');
  elements.routineProgressBar = document.getElementById('routineProgressBar');
  elements.routineProgressPercent = document.getElementById('routineProgressPercent');

  elements.dialog = document.getElementById('exerciseDialog');
  elements.dialogTitle = document.getElementById('dialogTitle');
  elements.form = document.getElementById('exerciseForm');
  elements.nameField = document.getElementById('exerciseName');
  elements.sectionField = document.getElementById('exerciseSection');
  elements.loadField = document.getElementById('exerciseLoad');
  elements.setsField = document.getElementById('exerciseSets');
  elements.repsField = document.getElementById('exerciseReps');
  elements.noteField = document.getElementById('exerciseNote');
  elements.orderField = document.getElementById('exerciseOrder');
  elements.cancelButton = document.getElementById('cancelButton');
  elements.deleteFromDialog = document.getElementById('deleteFromDialog');
  elements.saveButton = document.getElementById('saveButton');

  elements.deleteDialog = document.getElementById('deleteDialog');
  elements.deleteForm = document.getElementById('deleteForm');
  elements.deleteExerciseName = document.getElementById('deleteExerciseName');
  elements.deleteCode = document.getElementById('deleteCode');
  elements.deleteError = document.getElementById('deleteError');
  elements.cancelDeleteButton = document.getElementById('cancelDeleteButton');
  elements.confirmDeleteButton = document.getElementById('confirmDeleteButton');
}

function updateActiveFilter() {
  elements.filterBar.querySelectorAll('[data-filter]').forEach(button => {
    button.classList.toggle('active', button.dataset.filter === state.currentFilter);
  });
}

function updateSearchInfo(count) {
  elements.searchInfo.textContent = state.search
    ? `${count} resultado${count === 1 ? '' : 's'}`
    : '';
}

function toggleSearch() {
  const isOpen = elements.searchBar.classList.toggle('open');
  if (isOpen) elements.searchInput.focus();
  if (!isOpen) {
    state.search = '';
    elements.searchInput.value = '';
    renderExercises();
  }
}

function openSearch() {
  elements.searchBar.classList.add('open');
  elements.searchInput.focus();
}

function applyTheme() {
  const stored = localStorage.getItem('theme');
  const dark = stored ? stored === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('dark', dark);
  document.body.classList.toggle('light', !dark);
  document.getElementById('themeColor').content = dark ? '#0B1120' : '#F4F7FB';
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
  localStorage.setItem('theme', nextTheme);
  applyTheme();
}

function setConnectionStatus(type, text) {
  elements.connectionBadge.className = `connection-badge ${type}`;
  elements.connectionBadge.textContent = text;
}

function setFormBusy(busy) {
  elements.saveButton.disabled = busy;
  elements.cancelButton.disabled = busy;
  elements.deleteFromDialog.disabled = busy;
  elements.confirmDeleteButton.disabled = busy;
  elements.cancelDeleteButton.disabled = busy;

  if (busy && elements.deleteDialog.open) {
    elements.confirmDeleteButton.textContent = 'Eliminando…';
  } else {
    elements.confirmDeleteButton.textContent = 'Eliminar definitivamente';
  }

  if (busy && elements.dialog.open) {
    elements.saveButton.textContent = 'Guardando…';
  } else if (!busy) {
    elements.saveButton.textContent = state.editingId ? 'Guardar cambios' : 'Añadir ejercicio';
  }
}

async function runRead(action) {
  setConnectionStatus('loading', 'Cargando…');
  try {
    await action();
    setConnectionStatus('online', 'Supabase');
  } catch (error) {
    handleError(error);
  }
}

function handleError(error) {
  console.error(error);
  setConnectionStatus('error', 'Error');
  alert(`No se pudo completar la operación.\n\n${error.message || error}`);
}

function sectionEmoji(sectionId) {
  return { gluteo: '🍑', pierna: '🦵', espalda: '💪' }[sectionId] || '🏋️';
}

function normalizeText(value) {
  return String(value || '')
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

/* ============================================================
   INICIO
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  cacheElements();
  applyTheme();
  bindEvents();

  try {
    DB.init();
    await loadInitialData();
    populateSectionSelect();
    render();
  } catch (error) {
    handleError(error);
    elements.main.innerHTML = `
      <div class="empty-state error-state">
        <span>⚠️</span>
        <h2>No se pudo cargar la rutina</h2>
        <p>Comprueba la configuración y las políticas de Supabase.</p>
      </div>
    `;
  }
});
