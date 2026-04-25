// CHALLENGES DATA
const challengesData = [
    // ===== FÁCIL — TIRÓN (5) =====
    {
        id: 'easy-pull-1',
        nivel: 'Fácil',
        tipo: 'Tirón',
        nombre: 'Dead Hang',
        descripcion: 'Aguanta colgado y empieza a sentir el tirón desde cero',
        ejercicios: [
            { nombre: 'Dead Hang (aguantar colgado)', reps: 30, unit: 'segundos', emoji: '🏋️' },
            { nombre: 'Dominadas Australianas', reps: 15, emoji: '🦘' },
            { nombre: 'Dead Hang (aguantar colgado)', reps: 30, unit: 'segundos', emoji: '🏋️' },
        ]
    },
    {
        id: 'easy-pull-2',
        nivel: 'Fácil',
        tipo: 'Tirón',
        nombre: 'Dominadas Australianas',
        descripcion: 'El primer tirón real: cuerpo inclinado, control total',
        ejercicios: [
            { nombre: 'Dominadas Australianas', reps: 20, emoji: '🦘' },
            { nombre: 'Dead Hang (aguantar colgado)', reps: 60, unit: 'segundos', emoji: '🏋️' },
            { nombre: 'Dominadas Asistidas con Goma', reps: 15, emoji: '🎗️' },
        ]
    },
    {
        id: 'easy-pull-3',
        nivel: 'Fácil',
        tipo: 'Tirón',
        nombre: 'Dominadas Asistidas con Goma',
        descripcion: 'La goma te ayuda a completar el recorrido completo',
        ejercicios: [
            { nombre: 'Dominadas Asistidas con Goma', reps: 20, emoji: '🎗️' },
            { nombre: 'Dominadas Australianas', reps: 25, emoji: '🦘' },
            { nombre: 'Dead Hang (aguantar colgado)', reps: 90, unit: 'segundos', emoji: '🏋️' },
        ]
    },
    {
        id: 'easy-pull-4',
        nivel: 'Fácil',
        tipo: 'Tirón',
        nombre: 'Dominadas Supino',
        descripcion: 'Agarre hacia ti: más bíceps, tu primer tirón sin ayuda',
        ejercicios: [
            { nombre: 'Dominadas Supino (agarre normal)', reps: 12, emoji: '🦍' },
            { nombre: 'Dominadas Asistidas con Goma', reps: 15, emoji: '🎗️' },
            { nombre: 'Dominadas Australianas', reps: 20, emoji: '🦘' },
        ]
    },
    {
        id: 'easy-pull-5',
        nivel: 'Fácil',
        tipo: 'Tirón',
        nombre: 'Dominadas Supino Cerradas',
        descripcion: 'Agarre supino cerrado: más tensión en bíceps y dorsal bajo',
        ejercicios: [
            { nombre: 'Dominadas Supino (agarre cerrado)', reps: 12, emoji: '🤝' },
            { nombre: 'Dominadas Supino (agarre normal)', reps: 12, emoji: '🦍' },
            { nombre: 'Dominadas Australianas', reps: 20, emoji: '🦘' },
        ]
    },

    // ===== INTERMEDIO — TIRÓN (5) =====
    {
        id: 'mid-pull-1',
        nivel: 'Intermedio',
        tipo: 'Tirón',
        nombre: 'Dominadas Supino Abiertas',
        descripcion: 'Agarre ancho supino: más anchura de espalda',
        ejercicios: [
            { nombre: 'Dominadas Supino (agarre abierto)', reps: 15, emoji: '💀' },
            { nombre: 'Dominadas Supino (agarre normal)', reps: 18, emoji: '🦍' },
            { nombre: 'Dominadas Supino (agarre cerrado)', reps: 15, emoji: '🤝' },
        ]
    },
    {
        id: 'mid-pull-2',
        nivel: 'Intermedio',
        tipo: 'Tirón',
        nombre: 'Dominadas Prono',
        descripcion: 'El agarre clásico: palmas hacia fuera, dorsal al máximo',
        ejercicios: [
            { nombre: 'Dominadas Prono (agarre normal)', reps: 18, emoji: '🦍' },
            { nombre: 'Dominadas Supino (agarre normal)', reps: 15, emoji: '🦍' },
            { nombre: 'Dominadas Australianas', reps: 25, emoji: '🦘' },
        ]
    },
    {
        id: 'mid-pull-3',
        nivel: 'Intermedio',
        tipo: 'Tirón',
        nombre: 'Dominadas Prono Cerradas',
        descripcion: 'Prono con agarre estrecho: más tríceps largo y dorsal bajo',
        ejercicios: [
            { nombre: 'Dominadas Prono (agarre cerrado)', reps: 18, emoji: '🤝' },
            { nombre: 'Dominadas Prono (agarre normal)', reps: 15, emoji: '🦍' },
            { nombre: 'Dominadas Supino (agarre normal)', reps: 15, emoji: '🦍' },
        ]
    },
    {
        id: 'mid-pull-4',
        nivel: 'Intermedio',
        tipo: 'Tirón',
        nombre: 'Dominadas Prono Abiertas',
        descripcion: 'Agarre bien abierto: el mayor estímulo de anchura dorsal',
        ejercicios: [
            { nombre: 'Dominadas Prono (agarre abierto)', reps: 18, emoji: '💀' },
            { nombre: 'Dominadas Prono (agarre normal)', reps: 18, emoji: '🦍' },
            { nombre: 'Dominadas Prono (agarre cerrado)', reps: 18, emoji: '🤝' },
        ]
    },
    {
        id: 'mid-pull-5',
        nivel: 'Intermedio',
        tipo: 'Tirón',
        nombre: 'Dominadas Neutras',
        descripcion: 'Palmas enfrentadas: la posición más natural y completa',
        ejercicios: [
            { nombre: 'Dominadas Neutras (agarre normal)', reps: 20, emoji: '💀' },
            { nombre: 'Dominadas Prono (agarre normal)', reps: 20, emoji: '🦍' },
            { nombre: 'Dominadas Supino (agarre normal)', reps: 20, emoji: '🦍' },
        ]
    },

    // ===== AVANZADO — TIRÓN (5) =====
    {
        id: 'hard-pull-1',
        nivel: 'Avanzado',
        tipo: 'Tirón',
        nombre: 'Neutras Variadas',
        descripcion: 'Combina los agarres neutros para máximo estímulo',
        ejercicios: [
            { nombre: 'Dominadas Neutras (agarre cerrado)', reps: 25, emoji: '🤝' },
            { nombre: 'Dominadas Neutras (agarre normal)', reps: 20, emoji: '🦍' },
            { nombre: 'Dominadas Neutras (agarre abierto)', reps: 15, emoji: '💀' },
        ]
    },
    {
        id: 'hard-pull-2',
        nivel: 'Avanzado',
        tipo: 'Tirón',
        nombre: 'Dominadas Arqueras',
        descripcion: 'Un brazo tira, el otro guía: la base del tirón a un brazo',
        ejercicios: [
            { nombre: 'Dominadas Arqueras', reps: 18, emoji: '🏹' },
            { nombre: 'Dominadas Neutras (agarre normal)', reps: 20, emoji: '💀' },
            { nombre: 'Dominadas Prono (agarre abierto)', reps: 25, emoji: '🦍' },
        ]
    },
    {
        id: 'hard-pull-3',
        nivel: 'Avanzado',
        tipo: 'Tirón',
        nombre: 'Dominadas Explosivas',
        descripcion: 'Sube rápido y con potencia: trabaja la fuerza reactiva',
        ejercicios: [
            { nombre: 'Dominadas Explosivas', reps: 15, emoji: '💥' },
            { nombre: 'Dominadas Arqueras', reps: 15, emoji: '🏹' },
            { nombre: 'Dominadas Prono (agarre normal)', reps: 20, emoji: '🦍' },
        ]
    },
    {
        id: 'hard-pull-4',
        nivel: 'Avanzado',
        tipo: 'Tirón',
        nombre: 'Dominadas Explosivas Abiertas',
        descripcion: 'Explosión con agarre abierto: preámbulo del muscle-up',
        ejercicios: [
            { nombre: 'Dominadas Prono Explosivas (agarre abierto)', reps: 15, emoji: '💀💥' },
            { nombre: 'Dominadas Prono Explosivas', reps: 18, emoji: '💥' },
            { nombre: 'Dominadas Arqueras', reps: 15, emoji: '🏹' },
        ]
    },
    {
        id: 'hard-pull-5',
        nivel: 'Avanzado',
        tipo: 'Tirón',
        nombre: 'Muscle-Up y Lastre',
        descripcion: 'La cima del tirón: muscle-up y dominadas con peso añadido',
        ejercicios: [
            { nombre: 'Muscle-Up', reps: 8, emoji: '💫' },
            { nombre: 'Dominadas Prono Explosivas', reps: 15, emoji: '💥' },
            { nombre: 'Dominadas Prono con Lastre (10 kg)', reps: 10, emoji: '⚖️' },
        ]
    },

    // ===== FÁCIL — EMPUJE (5) =====
    {
        id: 'easy-push-1',
        nivel: 'Fácil',
        tipo: 'Empuje',
        nombre: 'Flexiones Inclinadas',
        descripcion: 'Manos en barra elevada: menos carga, misma técnica',
        ejercicios: [
            { nombre: 'Flexiones Inclinadas (con barra)', reps: 20, emoji: '📐' },
            { nombre: 'Flexiones de Rodillas', reps: 20, emoji: '🦵' },
            { nombre: 'Flexiones Inclinadas (con barra)', reps: 15, emoji: '📐' },
        ]
    },
    {
        id: 'easy-push-2',
        nivel: 'Fácil',
        tipo: 'Empuje',
        nombre: 'Flexiones de Rodillas',
        descripcion: 'Rodillas apoyadas y core activo: el primer empuje real',
        ejercicios: [
            { nombre: 'Flexiones de Rodillas', reps: 20, emoji: '🦵' },
            { nombre: 'Flexiones Inclinadas (con barra)', reps: 20, emoji: '📐' },
            { nombre: 'Flexiones Normales', reps: 12, emoji: '💪' },
        ]
    },
    {
        id: 'easy-push-3',
        nivel: 'Fácil',
        tipo: 'Empuje',
        nombre: 'Flexiones Normales',
        descripcion: 'El hito del empuje: flexión completa en el suelo',
        ejercicios: [
            { nombre: 'Flexiones Normales', reps: 15, emoji: '💪' },
            { nombre: 'Flexiones de Rodillas', reps: 20, emoji: '🦵' },
            { nombre: 'Flexiones Inclinadas (con barra)', reps: 20, emoji: '📐' },
        ]
    },
    {
        id: 'easy-push-4',
        nivel: 'Fácil',
        tipo: 'Empuje',
        nombre: 'Flexiones Diamante',
        descripcion: 'Manos juntas bajo el pecho: foco en tríceps',
        ejercicios: [
            { nombre: 'Flexiones Diamante', reps: 20, emoji: '💎' },
            { nombre: 'Flexiones Normales', reps: 15, emoji: '💪' },
            { nombre: 'Flexiones Inclinadas (con barra)', reps: 20, emoji: '📐' },
        ]
    },
    {
        id: 'easy-push-5',
        nivel: 'Fácil',
        tipo: 'Empuje',
        nombre: 'Fondos en Barra',
        descripcion: 'Los Fondos en barra: tríceps, pecho y hombros en una sola barra',
        ejercicios: [
            { nombre: 'Fondos (en 1 sola barra)', reps: 12, emoji: '🤸' },
            { nombre: 'Flexiones Diamante', reps: 15, emoji: '💎' },
            { nombre: 'Flexiones Normales', reps: 18, emoji: '💪' },
        ]
    },

    // ===== INTERMEDIO — EMPUJE (5) =====
    {
        id: 'mid-push-1',
        nivel: 'Intermedio',
        tipo: 'Empuje',
        nombre: 'Fondos en Paralelas',
        descripcion: 'El squat del tren superior: pecho, tríceps y hombros',
        ejercicios: [
            { nombre: 'Fondos en Paralelas', reps: 15, emoji: '🤸' },
            { nombre: 'Fondos (en 1 sola barra)', reps: 18, emoji: '🤸' },
            { nombre: 'Flexiones Diamante', reps: 20, emoji: '💎' },
        ]
    },
    {
        id: 'mid-push-2',
        nivel: 'Intermedio',
        tipo: 'Empuje',
        nombre: 'Flexiones Abiertas',
        descripcion: 'Manos bien separadas: más pecho y menos tríceps',
        ejercicios: [
            { nombre: 'Flexiones Abiertas', reps: 18, emoji: '🙌' },
            { nombre: 'Flexiones Normales', reps: 25, emoji: '💪' },
            { nombre: 'Fondos en Paralelas', reps: 20, emoji: '🤸' },
        ]
    },
    {
        id: 'mid-push-3',
        nivel: 'Intermedio',
        tipo: 'Empuje',
        nombre: 'Flexiones Arqueras',
        descripcion: 'Un brazo lidera el movimiento: preámbulo al empuje a un brazo',
        ejercicios: [
            { nombre: 'Flexiones Arqueras', reps: 15, emoji: '🏹' },
            { nombre: 'Flexiones Abiertas', reps: 18, emoji: '🙌' },
            { nombre: 'Fondos en Paralelas', reps: 20, emoji: '🤸' },
        ]
    },
    {
        id: 'mid-push-4',
        nivel: 'Intermedio',
        tipo: 'Empuje',
        nombre: 'Flexiones con Palmada',
        descripcion: 'Empuje explosivo: potencia y velocidad de reacción',
        ejercicios: [
            { nombre: 'Flexiones con Palmada', reps: 12, emoji: '👏' },
            { nombre: 'Flexiones Normales', reps: 20, emoji: '💪' },
            { nombre: 'Fondos en Paralelas', reps: 25, emoji: '🤸' },
        ]
    },
    {
        id: 'mid-push-5',
        nivel: 'Intermedio',
        tipo: 'Empuje',
        nombre: 'Flexiones Lean Planche',
        descripcion: 'Cuerpo inclinado hacia adelante: activa la palanca del planche (recuerda hacer bien el hollow)',
        ejercicios: [
            { nombre: 'Flexiones Lean Planche', reps: 18, emoji: '📐' },
            { nombre: 'Flexiones Arqueras', reps: 18, emoji: '🏹' },
            { nombre: 'Fondos en Paralelas', reps: 30, emoji: '🤸' },
        ]
    },

    // ===== AVANZADO — EMPUJE (5) =====
    {
        id: 'hard-push-1',
        nivel: 'Avanzado',
        tipo: 'Empuje',
        nombre: 'Flexiones a un Brazo',
        descripcion: 'Solo un brazo empuja: la cumbre del empuje unilateral',
        ejercicios: [
            { nombre: 'Flexiones a un Brazo', reps: 12, emoji: '☝️' },
            { nombre: 'Flexiones Arqueras', reps: 20, emoji: '🏹' },
            { nombre: 'Flexiones con Palmada', reps: 18, emoji: '👏' },
        ]
    },
    {
        id: 'hard-push-2',
        nivel: 'Avanzado',
        tipo: 'Empuje',
        nombre: 'Anillas',
        descripcion: 'Superficie inestable: máxima activación estabilizadora',
        ejercicios: [
            { nombre: 'Fondos en Anillas', reps: 18, emoji: '🔴' },
            { nombre: 'Flexiones en Anillas', reps: 25, emoji: '🔴' },
            { nombre: 'Fondos en Paralelas', reps: 35, emoji: '🤸' },
        ]
    },
    {
        id: 'hard-push-3',
        nivel: 'Avanzado',
        tipo: 'Empuje',
        nombre: 'Flexiones Declinadas',
        descripcion: 'Pies en banco: máxima carga en pecho alto y hombros',
        ejercicios: [
            { nombre: 'Flexiones Declinadas (con banco)', reps: 20, emoji: '📉' },
            { nombre: 'Flexiones a un Brazo', reps: 15, emoji: '☝️' },
            { nombre: 'Flexiones Lean Planche', reps: 20, emoji: '📐' },
        ]
    },
    {
        id: 'hard-push-4',
        nivel: 'Avanzado',
        tipo: 'Empuje',
        nombre: 'Flexiones Pike',
        descripcion: 'Caderas arriba y cuerpo en V: trabaja los hombros desde el suelo',
        ejercicios: [
            { nombre: 'Flexiones Pike', reps: 20, emoji: '🔺' },
            { nombre: 'Flexiones Declinadas (con banco)', reps: 18, emoji: '📉' },
            { nombre: 'Flexiones Lean Planche', reps: 20, emoji: '📐' },
        ]
    },
    {
        id: 'hard-push-5',
        nivel: 'Avanzado',
        tipo: 'Empuje',
        nombre: 'Flexiones de Pino',
        descripcion: 'La cima del empuje: pino libre con flexión completa',
        ejercicios: [
            { nombre: 'Flexiones de Pino Asistidas', reps: 15, emoji: '🤲' },
            { nombre: 'Pino (aguantar)', reps: 60, unit: 'segundos', emoji: '⏱️' },
            { nombre: 'Flexiones de Pino', reps: 5, emoji: '🤲' },
        ]
    },

];

// STATE
let currentChallengeId = null;
let completedChallenges = [];

const STORAGE_KEY = 'calistenia_completed_challenges';

// ===== INICIALIZACIÓN =====
export function initChallenges() {
  loadCompletedChallenges();
  renderChallenges();
}

// ===== PERSISTENCIA =====
function loadCompletedChallenges() {
  const stored = localStorage.getItem(STORAGE_KEY);
  completedChallenges = stored ? JSON.parse(stored) : [];
}

function saveChallengeCompletion(challengeId, completed) {
  if (completed && !completedChallenges.includes(challengeId)) {
    completedChallenges.push(challengeId);
  } else if (!completed && completedChallenges.includes(challengeId)) {
    completedChallenges = completedChallenges.filter(id => id !== challengeId);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(completedChallenges));
}

function isCompletedChallenge(challengeId) {
  return completedChallenges.includes(challengeId);
}

// ===== FILTRADO =====
function getFilteredChallenges(nivel = null, tipo = null) {
  return challengesData.filter(ch => {
    const matchNivel = nivel === null || ch.nivel === nivel;
    const matchTipo = tipo === null || ch.tipo === tipo;
    return matchNivel && matchTipo;
  });
}

// ===== RENDERIZADO PRINCIPAL =====
export function renderChallenges() {
  const container = document.getElementById('challengesContainer');
  if (!container) return;

  const selectedNivel = document.querySelector('.challenges-level-btn.active')?.dataset.nivel || 'Fácil';
  let selectedTipo = document.querySelector('.challenges-type-btn.active')?.dataset.tipo || null;
  
  // Convertir "todos" a null para filtrado
  if (selectedTipo === 'todos') {
    selectedTipo = null;
  }

  if (currentChallengeId) {
    renderChallengeDetail(currentChallengeId);
  } else {
    renderChallengeList(selectedNivel, selectedTipo);
  }
}

function renderChallengeList(nivel, tipo) {
  const container = document.getElementById('challengesContainer');
  const filtered = getFilteredChallenges(nivel, tipo);

  container.innerHTML = `
    <div class="challenges-grid" id="challengesGrid">
      ${filtered.map(ch => {
        const isCompleted = isCompletedChallenge(ch.id);
        const colorClass = `difficulty-${ch.nivel.toLowerCase()}`;
        return `
          <div class="challenge-card ${colorClass}" onclick="selectChallenge('${ch.id}')">
            <div class="challenge-card__header">
              <div class="challenge-card__title">${ch.nombre}</div>
              ${isCompleted ? '<div class="challenge-card__badge">✅</div>' : ''}
            </div>
            <div class="challenge-card__meta">
              <span class="meta-badge">${ch.nivel}</span>
              <span class="meta-badge">${ch.tipo}</span>
            </div>
            <div class="challenge-card__exercises-count">
              ${ch.ejercicios.length} ejercicios
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderChallengeDetail(challengeId) {
  const challenge = challengesData.find(ch => ch.id === challengeId);
  if (!challenge) return;

  const container = document.getElementById('challengesContainer');
  const isCompleted = isCompletedChallenge(challengeId);

  container.innerHTML = `
    <div class="challenge-detail">
      <button class="challenge-back-btn" onclick="selectChallenge(null)">← Volver</button>
      
      <div class="challenge-detail__header">
        <div class="challenge-detail__title">${challenge.nombre}</div>
        <div class="challenge-detail__meta">
          <span class="meta-badge">${challenge.nivel}</span>
          <span class="meta-badge">${challenge.tipo}</span>
        </div>
      </div>

      <div class="challenge-detail__description">
        ${challenge.descripcion}
      </div>

      <div class="challenge-detail__exercises">
        <span class="label">Ejercicios del reto</span>
        <div class="exercises-list">
          ${challenge.ejercicios.map((ex, idx) => `
            <div class="exercise-item">
              <span class="exercise-item__emoji">${ex.emoji}</span>
              <div class="exercise-item__info">
                <div class="exercise-item__name">${ex.nombre}</div>
                <div class="exercise-item__reps">${ex.reps}${ex.unit === 'segundos' ? ' segundos' : ' reps'}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <button 
        class="btn ${isCompleted ? 'btn-completed' : 'btn-accent'}" 
        onclick="toggleChallengeComplete('${challengeId}')"
      >
        ${isCompleted ? '✅ Completado — Desmarcar' : '🎯 Marcar como Completado'}
      </button>
    </div>
  `;
}

// ===== INTERACCIÓN =====
export function selectChallenge(challengeId) {
  currentChallengeId = challengeId;
  renderChallenges();
}

export function toggleChallengeComplete(challengeId) {
  const isCompleted = isCompletedChallenge(challengeId);
  saveChallengeCompletion(challengeId, !isCompleted);
  renderChallenges();
  if (navigator.vibrate) navigator.vibrate(50);
}

export function setLevelFilter(nivel) {
  document.querySelectorAll('.challenges-level-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-nivel="${nivel}"]`).classList.add('active');
  renderChallenges();
}

export function setTypeFilter(tipo) {
  document.querySelectorAll('.challenges-type-btn').forEach(btn => btn.classList.remove('active'));
  if (tipo) {
    document.querySelector(`[data-tipo="${tipo}"]`).classList.add('active');
  } else {
    document.querySelector('[data-tipo="todos"]').classList.add('active');
  }
  renderChallenges();
}
