'use strict';

/* ============================================================
   DATOS DE RUTINAS
   ============================================================ */

const RUTINAS = {
  victoria: {
    label: 'Victoria',
    sections: {
      gluteo: [
        { id: 'v-gl-0', name: 'Hip trust libre',               load: '(barra 22.7Kg) + 60Kg (30Kg x lado)',     sets: '3 ', reps: ' 10 reps', note: 'Negativa al fallo' },
        { id: 'v-gl-1', name: 'Patada de glúteo',              load: '11.3Kg',                                  sets: '4 ', reps: ' 10 reps' },
        { id: 'v-gl-2', name: 'Sentadilla búlgara multipower', load: 'barra: (22.7Kg) + 15Kg (7,5Kg x lado)',   sets: '3 ', reps: ' 10 reps' },
        { id: 'v-gl-3', name: 'Abductor externo focalizado 🍑',load: '56Kg',                                    sets: '3 ', reps: ' 10 reps' },
        { id: 'v-gl-4', name: 'Press pierna sentada 🍑',       load: '64Kg',                                    sets: '3 ', reps: ' 10 reps', note: 'Rango completo' },
        { id: 'v-gl-5', name: 'Peso muerto rumano',            load: 'barra: (22.7Kg) + 15Kg (7,5Kg x lado)',    sets: '3 ', reps: ' 10 reps' },
        { id: 'v-gl-6', name: 'Hacka',                         load: '(barra)',                                  sets: '3 ', reps: ' 10 reps' },
      ],
      pierna: [
        { id: 'v-pi-0', name: 'Extensión de cuádriceps',  load: '27.5Kg', sets: '3 ', reps: ' 10 reps' },
        { id: 'v-pi-1', name: 'Curl de pierna',           load: '23Kg',  sets: '3 ', reps: ' 10 reps' },
        { id: 'v-pi-2', name: 'Abductor interno',         load: '54Kg',  sets: '3 ', reps: ' 10 reps' },
        { id: 'v-pi-3', name: 'Abductor externo',         load: '64Kg',  sets: '3 ', reps: ' 10 reps' },
        { id: 'v-pi-4', name: 'Press pierna sentada 🍑',  load: '64Kg',  sets: '3 ', reps: ' 10 reps', note: 'Rango completo' },
      ],
      espalda: [
        { id: 'v-es-0', name: 'Estirar hacia abajo', load: '27.5Kg', sets: '3 ', reps: ' 10 reps' },
        { id: 'v-es-1', name: 'Remo',                load: '15Kg',   sets: '3 ', reps: ' 10 reps' },
      ],
    },
  },

  daniel: {
    label: 'Daniel',
    sections: {
      gluteo: [
        { id: 'd-gl-0', name: 'Hip trust',                        load: '20Kg',    sets: '4', reps: '10' },
        { id: 'd-gl-1', name: 'Patada de glúteo',                 load: '20Kg',    sets: '4', reps: '10' },
        { id: 'd-gl-2', name: 'Press pierna sentado 🍑',          load: '87Kg',    sets: '3', reps: '10', note: 'Rango completo' },
        { id: 'd-gl-3', name: 'Peso muerto rumano',               load: 'barra: (22.7Kg) + 15Kg (7,5Kg x lado)',       sets: '3', reps: '10' },
        { id: 'd-gl-4', name: 'Sentadilla búlgara con mancuerna', load: '—',       sets: '4', reps: '10' },
        { id: 'd-gl-5', name: 'Abductor focalizado 🍑',           load: '50Kg',    sets: '3', reps: '10' },
        { id: 'd-gl-6', name: 'Hacka',                            load: '(barra)', sets: '3', reps: '10' },
      ],
      pierna: [
        { id: 'd-pi-0', name: 'Femoral tumbado',           load: '25Kg', sets: '3', reps: '10' },
        { id: 'd-pi-1', name: 'Extensión de cuádriceps',   load: '45Kg', sets: '3', reps: '10' },
        { id: 'd-pi-2', name: 'Curl de pierna',            load: '35Kg', sets: '3', reps: '10' },
        { id: 'd-pi-3', name: 'Abductor interno',          load: '93Kg', sets: '3', reps: '10' },
        { id: 'd-pi-4', name: 'Aductor externo',           load: '77Kg', sets: '3', reps: '10' },
      ],
      espalda: [
        { id: 'd-es-0', name: 'Estirar hacia abajo', load: '75Kg', sets: '3', reps: '10' },
        { id: 'd-es-1', name: 'Remo',                load: '75Kg', sets: '3', reps: '10' },
      ],
    },
  },
};

const SECTION_META = {
  gluteo:  { label: 'Glúteo',  img: './img/culo.webp',    alt: 'Glúteos' },
  pierna:  { label: 'Pierna',  img: './img/pierna.webp',  alt: 'Pierna' },
  espalda: { label: 'Espalda', img: './img/espalda.webp', alt: 'Espalda' },
};

/* ============================================================
   STATE
   ============================================================ */
let currentPerson = localStorage.getItem('person') || 'victoria';
let currentFilter = 'all';
let searchOpen    = false;

/* ============================================================
   STORAGE HELPERS
   ============================================================ */
const store = {
  isDone(id)         { return localStorage.getItem(`chk:${id}`) === '1'; },
  setDone(id, val)   { val ? localStorage.setItem(`chk:${id}`, '1') : localStorage.removeItem(`chk:${id}`); },
  getLoad(id, def)   { return localStorage.getItem(`ld:${id}`) || def; },
  setLoad(id, val)   { localStorage.setItem(`ld:${id}`, val); },
};

/* ============================================================
   RENDER HELPERS
   ============================================================ */

function cardHTML(ex, sectionKey) {
  const done  = store.isDone(ex.id);
  const load  = store.getLoad(ex.id, ex.load);
  const doneClass = done ? ' done' : '';

  return /* html */`
    <article class="ex-card${doneClass}"
             data-id="${ex.id}"
             data-group="${sectionKey}"
             data-name="${ex.name.toLowerCase()}"
             role="listitem">
      <div class="ex-body">
        <p class="ex-name">${ex.name}</p>
        <div class="ex-meta">
          <span class="ex-sets">${ex.sets}×${ex.reps}</span>
          <span class="ex-dot">·</span>
          <span class="ex-load"
                data-id="${ex.id}"
                data-default="${ex.load}"
                title="Toca para editar carga">${load}</span>
          ${ex.note ? `<span class="ex-dot">·</span><span class="ex-note">${ex.note}</span>` : ''}
        </div>
      </div>
      <button class="ex-check-btn"
              type="button"
              tabindex="-1"
              aria-label="${done ? 'Completado' : 'Marcar como completado'}">
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
  const done    = exercises.filter(ex => store.isDone(ex.id)).length;
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
        ${exercises.map(ex => cardHTML(ex, sectionKey)).join('')}
      </div>
    </section>`;
}

/* ============================================================
   RENDER — FULL REPAINT
   ============================================================ */
function render() {
  const rutina = RUTINAS[currentPerson];
  const main   = document.getElementById('main');

  main.innerHTML = Object.entries(rutina.sections)
    .map(([key, exs]) => sectionHTML(key, exs))
    .join('');

  updateProgress();
  bindCardEvents();

  applyFilter(currentFilter, /* silent */ true);
  const q = document.getElementById('searchInput').value;
  if (q) applySearch(q);
}

/* ============================================================
   PROGRESS UPDATE (incremental, no full re-render)
   ============================================================ */
function updateProgress() {
  const rutina = RUTINAS[currentPerson];
  let totalAll = 0, doneAll = 0;

  Object.entries(rutina.sections).forEach(([key, exs]) => {
    const d = exs.filter(ex => store.isDone(ex.id)).length;
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

  // Global progress bar
  document.getElementById('doneCount').textContent  = doneAll;
  document.getElementById('totalCount').textContent = totalAll;
  const pct  = totalAll ? ((doneAll / totalAll) * 100).toFixed(1) : 0;
  const fill = document.getElementById('progressFill');
  fill.style.width = `${pct}%`;
  fill.classList.toggle('complete', doneAll === totalAll && totalAll > 0);
}

/* ============================================================
   CARD EVENTS (re-bound after each render)
   ============================================================ */
function bindCardEvents() {
  document.querySelectorAll('.ex-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.ex-load') || e.target.tagName === 'INPUT') return;
      toggleCard(card);
    });
  });

  document.querySelectorAll('.ex-load').forEach(loadEl => {
    loadEl.addEventListener('click', e => {
      e.stopPropagation();
      startLoadEdit(loadEl);
    });
  });
}

function toggleCard(card) {
  const id       = card.dataset.id;
  const newState = !store.isDone(id);
  store.setDone(id, newState);

  card.classList.toggle('done', newState);

  const btn = card.querySelector('.ex-check-btn');
  if (btn) {
    btn.setAttribute('aria-label', newState ? 'Completado' : 'Marcar como completado');
    btn.style.animation = 'none';
    btn.offsetHeight; // reflow
    btn.style.animation = '';
  }

  card.classList.add('popping');
  card.addEventListener('animationend', () => card.classList.remove('popping'), { once: true });

  updateProgress();
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

  const save = () => {
    const newVal = input.value.trim() || defaultVal;
    store.setLoad(id, newVal);
    loadEl.classList.remove('editing');
    loadEl.textContent = newVal;
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
function switchPerson(personKey) {
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

  render();
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
   RESET SESSION
   ============================================================ */
function resetSession() {
  const rutina = RUTINAS[currentPerson];
  Object.values(rutina.sections).forEach(exs =>
    exs.forEach(ex => store.setDone(ex.id, false))
  );
  render();
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
document.addEventListener('DOMContentLoaded', () => {

  // ── Theme ──────────────────────────────────────────────
  applyTheme();
  document.getElementById('darkToggle').addEventListener('click', () => applyTheme(true));

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
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') toggleSearch(false);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    applySearch('');
    searchInput.focus();
  });

  // ── Reset ──────────────────────────────────────────────
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm(`¿Reiniciar la sesión de ${RUTINAS[currentPerson].label}?\nSe borrarán todos los checks.`)) {
      resetSession();
    }
  });

  // ── Keyboard: "/" opens search ──────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !searchOpen && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      toggleSearch(true);
    }
  });

  // ── Initial render ─────────────────────────────────────
  render();
});