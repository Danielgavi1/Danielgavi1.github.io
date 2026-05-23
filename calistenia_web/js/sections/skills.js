import { showToast } from '../core/ui.js';

// ============================
// DATA — SKILL PROGRESSIONS
// ============================
export const skillsData = [
  {
    id: 'muscle-up',
    nombre: 'Muscle-Up',
    img: 'img/muscle-up.png',
    descripcion: 'El rey de la barra: tirón explosivo + transición + empuje en un solo movimiento.',
    tiempoEstimado: '3 – 6 meses',
    cssClass: 'color-purple',
    barColor: 'rgba(139,92,246,0.9)',
    progressColor: '#8b5cf6',
    fases: [
      {
        id: 'mu-1',
        nombre: 'Base de Tirón',
        nivel: 'Principiante',
        duracion: '2 – 3 semanas',
        completionsRequired: 8,
        descripcion: 'El muscle-up necesita una base sólida de dominadas. Construye fuerza de tirón y aprende a colgarte con control.',
        ejercicios: [
          { nombre: 'Death Hang (Aguantar Colgado)', series: 3, reps: 45, unit: 'seg', emoji: '💪' },
          { nombre: 'Dominadas Australianas', series: 4, reps: 15, emoji: '🦘' },
          { nombre: 'Dominadas Prono', series: 4, reps: 8, emoji: '🦍' },
        ],
      },
      {
        id: 'mu-2',
        nombre: 'Tirón Explosivo',
        nivel: 'Principiante',
        duracion: '3 – 4 semanas',
        completionsRequired: 10,
        descripcion: 'El muscle-up exige potencia. Aprende a generar explosividad y a tirar la barra por debajo del pecho.',
        ejercicios: [
          { nombre: 'Dominadas Explosivas', series: 5, reps: 6, emoji: '💥' },
          { nombre: 'Dominadas al Pecho', series: 4, reps: 8, emoji: '🎯' },
          { nombre: 'Dominadas Negativas lentas (5s)', series: 4, reps: 5, emoji: '⬇️' },
        ],
      },
      {
        id: 'mu-3',
        nombre: 'Transición en Barra Baja',
        nivel: 'Intermedio',
        duracion: '3 – 4 semanas',
        completionsRequired: 10,
        descripcion: 'Practica el giro de muñecas y la transición del tirón al empuje en una barra baja o anillas.',
        ejercicios: [
          { nombre: 'Muscle-Up en Barra Baja', series: 5, reps: 8, emoji: '🔄' },
          { nombre: 'Dominadas al Pecho', series: 4, reps: 10, emoji: '🎯' },
          { nombre: 'Fondos en Barra', series: 4, reps: 15, emoji: '🤸' },
        ],
      },
      {
        id: 'mu-4',
        nombre: 'Muscle-Up Asistido',
        nivel: 'Intermedio',
        duracion: '2 – 3 semanas',
        completionsRequired: 8,
        descripcion: 'Usa una goma elástica para repetir el patrón completo del movimiento y fijar la técnica.',
        ejercicios: [
          { nombre: 'Muscle-Up con Goma', series: 5, reps: 6, emoji: '🎗️' },
          { nombre: 'Dominadas Explosivas Abiertas', series: 4, reps: 8, emoji: '💥' },
          { nombre: 'Muscle-Up con Kipping', series: 4, reps: 5, emoji: '↗️' },
        ],
      },
      {
        id: 'mu-5',
        nombre: 'Muscle-Up Limpio',
        nivel: 'Avanzado',
        duracion: 'Práctica continua',
        completionsRequired: 0,
        descripcion: '¡El movimiento completo! Sin impulso, sin kipping. Limpio y controlado en barra o anillas.',
        ejercicios: [
          { nombre: 'Muscle-Up', series: 5, reps: 7, emoji: '💫' },
          { nombre: 'Muscle-Up en Anillas', series: 4, reps: 5, emoji: '🔴' },
          { nombre: 'Muscle-Up Negativo lento (3s)', series: 4, reps: 4, emoji: '⬇️' },
        ],
      },
    ],
  },

  {
    id: 'front-lever',
    nombre: 'Front Lever',
    img: 'img/front-lever.png',
    descripcion: 'Cuerpo completamente horizontal suspendido de la barra. Fuerza de core y espalda extrema.',
    tiempoEstimado: '6 – 12 meses',
    cssClass: 'color-cyan',
    barColor: 'rgba(8,145,178,0.9)',
    progressColor: '#22d3ee',
    fases: [
      {
        id: 'fl-1',
        nombre: 'Base de Fuerza de Tirón',
        nivel: 'Principiante',
        duracion: '2 – 3 semanas',
        completionsRequired: 8,
        descripcion: 'El front lever exige una base sólida de tirón horizontal y vertical. Estos tres ejercicios construyen exactamente esa fuerza desde cero.',
        ejercicios: [
          { nombre: 'Dominadas Prono', series: 4, reps: 8, emoji: '🦍' },
          { nombre: 'Remo en Barra Baja', series: 4, reps: 12, emoji: '📐' },
          { nombre: 'Dominadas Negativas Lentas (5 seg)', series: 4, reps: 5, emoji: '⬇️' },
        ],
      },
      {
        id: 'fl-2',
        nombre: 'Tuck Front Lever',
        nivel: 'Principiante',
        duracion: '3 – 5 semanas',
        completionsRequired: 12,
        descripcion: 'Rodillas pegadas al pecho, cuerpo paralelo al suelo. Tu primer hold real de front lever.',
        ejercicios: [
          { nombre: 'Tuck Front Lever Hold', series: 5, reps: 20, unit: 'seg', emoji: '🔵' },
          { nombre: 'Elevación a Tuck Front Lever', series: 4, reps: 8, emoji: '⬆️' },
          { nombre: 'Dominadas al Pecho', series: 4, reps: 8, emoji: '🎯' },
        ],
      },
      {
        id: 'fl-3',
        nombre: 'Advanced Tuck FL',
        nivel: 'Intermedio',
        duracion: '4 – 6 semanas',
        completionsRequired: 15,
        descripcion: 'Rodillas a 90°, espalda plana. Un gran salto de dificultad y un paso más hacia el horizontal.',
        ejercicios: [
          { nombre: 'Tuck Advanced Front Lever', series: 5, reps: 15, unit: 'seg', emoji: '🟣' },
          { nombre: 'Elevaciones de Tuck Front Lever', series: 4, reps: 10, emoji: '⬆️' },
          { nombre: 'Dominadas Prono Abiertas', series: 4, reps: 12, emoji: '🦍' },
        ],
      },
      {
        id: 'fl-4',
        nombre: 'Straddle Front Lever',
        nivel: 'Avanzado',
        duracion: '5 – 8 semanas',
        completionsRequired: 18,
        descripcion: 'Piernas abiertas para reducir el brazo de palanca. Estás casi en el full lever.',
        ejercicios: [
          { nombre: 'Straddle Front Lever', series: 5, reps: 8, unit: 'seg', emoji: '⭐' },
          { nombre: 'Front Lever a Una Pierna', series: 4, reps: 10, unit: 'seg', emoji: '🦵' },
          { nombre: 'Elevaciones de Tuck Advanced FL', series: 4, reps: 8, emoji: '⬆️' },
        ],
      },
      {
        id: 'fl-5',
        nombre: 'Full Front Lever',
        nivel: 'Élite',
        duracion: 'Práctica continua',
        completionsRequired: 0,
        descripcion: '¡Cuerpo completamente horizontal! La élite de la calistenia de fuerza. Pocos lo consiguen.',
        ejercicios: [
          { nombre: 'Full Front Lever Hold', series: 5, reps: 3, unit: 'seg', emoji: '🎽' },
          { nombre: 'Elevaciones de Straddle Front Lever', series: 4, reps: 5, emoji: '⬆️' },
          { nombre: 'Negativa de Front Lever', series: 4, reps: 4, emoji: '⬇️' },
        ],
      },
    ],
  },

  {
    id: 'planche',
    nombre: 'Full Planche',
    img: 'img/full-planche.png',
    descripcion: 'El movimiento más técnico de la calistenia. Cuerpo horizontal boca abajo, brazos extendidos.',
    tiempoEstimado: '1 – 2 años',
    cssClass: 'color-red',
    barColor: 'rgba(239,68,68,0.9)',
    progressColor: '#f87171',
    fases: [
      {
        id: 'pl-1',
        nombre: 'Planche Lean',
        nivel: 'Principiante',
        duracion: '3 – 4 semanas',
        completionsRequired: 10,
        descripcion: 'Inclina el cuerpo hacia adelante desde posición de flexión. Activa la palanca y prepara los hombros.',
        ejercicios: [
          { nombre: 'Planche Lean Hold', series: 4, reps: 30, unit: 'seg', emoji: '📐' },
          { nombre: 'Flexiones Lean Planche', series: 4, reps: 10, emoji: '💪' },
          { nombre: 'Fondos', series: 4, reps: 25, emoji: '🦾' },
        ],
      },
      {
        id: 'pl-2',
        nombre: 'Tuck Planche',
        nivel: 'Principiante',
        duracion: '4 – 6 semanas',
        completionsRequired: 15,
        descripcion: 'Rodillas al pecho, caderas subidas, suelo solo debajo de las manos. Tu primer hold de planche real.',
        ejercicios: [
          { nombre: 'Tuck Planche Hold', series: 5, reps: 10, unit: 'seg', emoji: '🔵' },
          { nombre: 'Flexiones en Tuck Planche', series: 4, reps: 5, emoji: '💪' },
          { nombre: 'Planche Lean Hold', series: 4, reps: 60, unit: 'seg', emoji: '📐' },
        ],
      },
      {
        id: 'pl-3',
        nombre: 'Advanced Tuck Planche',
        nivel: 'Intermedio',
        duracion: '6 – 8 semanas',
        completionsRequired: 20,
        descripcion: 'Rodillas a 90° y espalda casi plana. Un salto de dificultad brutal. Aquí es donde la gente se estanca.',
        ejercicios: [
          { nombre: 'Tuck Advanced Planche (Hold)', series: 5, reps: 8, unit: 'seg', emoji: '🟣' },
          { nombre: 'Flexiones en Tuck Planche', series: 4, reps: 8, emoji: '💪' },
          { nombre: 'Fondos en Anillas', series: 4, reps: 18, emoji: '🔴' },
        ],
      },
      {
        id: 'pl-4',
        nombre: 'Straddle Planche',
        nivel: 'Avanzado',
        duracion: '2 – 4 meses',
        completionsRequired: 35,
        descripcion: 'Piernas abiertas: el paso más cercano a la planche completa. Fuerza de hombros extrema.',
        ejercicios: [
          { nombre: 'Straddle Planche Hold', series: 5, reps: 5, unit: 'seg', emoji: '⭐' },
          { nombre: 'Flexiones en Tuck Advanced', series: 4, reps: 5, emoji: '💪' },
          { nombre: 'Press Straddle Planche', series: 4, reps: 3, emoji: '🔝' },
        ],
      },
      {
        id: 'pl-5',
        nombre: 'Full Planche',
        nivel: 'Élite',
        duracion: 'Práctica continua',
        completionsRequired: 0,
        descripcion: '¡La cumbre! Cuerpo completamente horizontal, piernas juntas. Solo el 1% de los atletas lo logra.',
        ejercicios: [
          { nombre: 'Full Planche Hold', series: 5, reps: 5, unit: 'seg', emoji: '✈️' },
          { nombre: 'Straddle Planche Push-up', series: 4, reps: 4, emoji: '💪' },
          { nombre: 'Press a Full Planche', series: 4, reps: 2, emoji: '🔝' },
        ],
      },
    ],
  },

  {
    id: 'handstand',
    nombre: 'Handstand',
    img: 'img/handstand.png',
    descripcion: 'Equilibrio puro en manos sin apoyo. La base de toda la calistenia aérea.',
    tiempoEstimado: '2 – 6 meses',
    cssClass: 'color-green',
    barColor: 'rgba(34,197,94,0.9)',
    progressColor: '#4ade80',
    fases: [
      {
        id: 'hs-1',
        nombre: 'Pino contra Pared',
        nivel: 'Principiante',
        duracion: '1 – 3 semanas',
        completionsRequired: 6,
        descripcion: 'La pared como guía. Aprende a aguantar el peso en las manos y activar los hombros.',
        ejercicios: [
          { nombre: 'Pino contra Pared Hold', series: 4, reps: 30, unit: 'seg', emoji: '🧱' },
          { nombre: 'Flexiones de Pike', series: 4, reps: 10, emoji: '🔺' },
          { nombre: 'Hold en posición de Pike', series: 3, reps: 60, unit: 'seg', emoji: '🔺' },
        ],
      },
      {
        id: 'hs-2',
        nombre: 'Kick-up y Estabilización',
        nivel: 'Principiante',
        duracion: '3 – 4 semanas',
        completionsRequired: 8,
        descripcion: 'Aprende a entrar al pino con kick-up limpio y a aguantar más tiempo contra la pared.',
        ejercicios: [
          { nombre: 'Kick-up a la Pared', series: 5, reps: 15, emoji: '🦵' },
          { nombre: 'Pino Hold (pared asistida)', series: 4, reps: 60, unit: 'seg', emoji: '🧱' },
          { nombre: 'Shoulder Shrugs en Pino', series: 3, reps: 15, emoji: '🤷' },
        ],
      },
      {
        id: 'hs-3',
        nombre: 'Equilibrio con Dedos',
        nivel: 'Intermedio',
        duracion: '3 – 6 semanas',
        completionsRequired: 12,
        descripcion: 'Aléjate de la pared. Aprende a corregir el equilibrio con los dedos. La fase más difícil mentalmente.',
        ejercicios: [
          { nombre: 'Pino contra Pared', series: 4, reps: 45, unit: 'seg', emoji: '🧱' },
          { nombre: 'Pino con Toque de Pared', series: 5, reps: 30, unit: 'seg', emoji: '🤏' },
          { nombre: 'Kick-up con caída controlada', series: 5, reps: 20, emoji: '🦵' },
        ],
      },
      {
        id: 'hs-4',
        nombre: 'Handstand',
        nivel: 'Avanzado',
        duracion: 'Práctica continua',
        completionsRequired: 0,
        descripcion: '¡Sin pared! Equilibrio puro en manos. Empieza con segundos y ve aumentando.',
        ejercicios: [
          { nombre: 'Handstand Hold', series: 5, reps: 5, unit: 'seg', emoji: '🤲' },
          { nombre: 'Press a Pino desde el Suelo', series: 4, reps: 3, emoji: '🔝' },
          { nombre: 'Flexiones de Pino', series: 4, reps: 3, emoji: '💪' },
        ],
      },
    ],
  },

  {
    id: 'back-lever',
    nombre: 'Back Lever',
    img: 'img/back-lever.png',
    descripcion: 'Cuerpo horizontal boca abajo suspendido de la barra. El primo más accesible del front lever.',
    tiempoEstimado: '2 – 4 meses',
    cssClass: 'color-amber',
    barColor: 'rgba(245,158,11,0.9)',
    progressColor: '#fcd34d',
    fases: [
      {
        id: 'bl-1',
        nombre: 'Pasada por Abajo y Movilidad',
        nivel: 'Principiante',
        duracion: '2 – 3 semanas',
        completionsRequired: 8,
        descripcion: 'Pasa el cuerpo por debajo de la barra con control total. Movilidad y fuerza de hombros.',
        ejercicios: [
          { nombre: 'Skin The Cat', series: 4, reps: 8, emoji: '🔄' },
          { nombre: 'German Hang', series: 4, reps: 20, unit: 'seg', emoji: '🔽' },
          { nombre: 'Dominadas Prono', series: 4, reps: 18, emoji: '🦍' },
        ],
      },
      {
        id: 'bl-2',
        nombre: 'Tuck Back Lever',
        nivel: 'Principiante',
        duracion: '3 – 4 semanas',
        completionsRequired: 10,
        descripcion: 'Rodillas al pecho, cuerpo paralelo al suelo boca abajo. El primer hold real del back lever.',
        ejercicios: [
          { nombre: 'Tuck Back Lever Hold', series: 5, reps: 15, unit: 'seg', emoji: '🔵' },
          { nombre: 'Skin The Cat', series: 4, reps: 10, emoji: '🔄' },
          { nombre: 'German Hang', series: 4, reps: 30, unit: 'seg', emoji: '🔽' },
        ],
      },
      {
        id: 'bl-3',
        nombre: 'Straddle Back Lever',
        nivel: 'Intermedio',
        duracion: '4 – 6 semanas',
        completionsRequired: 15,
        descripcion: 'Piernas abiertas, cuerpo casi horizontal. El paso previo al full back lever.',
        ejercicios: [
          { nombre: 'Straddle Back Lever Hold', series: 5, reps: 8, unit: 'seg', emoji: '⭐' },
          { nombre: 'Tuck Back Lever Hold', series: 4, reps: 25, unit: 'seg', emoji: '🔵' },
          { nombre: 'Back Lever Negativa', series: 4, reps: 5, emoji: '⬇️' },
        ],
      },
      {
        id: 'bl-4',
        nombre: 'Full Back Lever',
        nivel: 'Avanzado',
        duracion: 'Práctica continua',
        completionsRequired: 0,
        descripcion: '¡Conseguido! Cuerpo completamente recto y horizontal boca abajo. Progresión al front lever.',
        ejercicios: [
          { nombre: 'Full Back Lever Hold', series: 5, reps: 5, unit: 'seg', emoji: '🔙' },
          { nombre: 'Elevaciones de Back Lever Straddle', series: 4, reps: 6, emoji: '⬆️' },
          { nombre: 'Fondos en Back Lever', series: 4, reps: 4, emoji: '💪' },
        ],
      },
    ],
  },

  {
    id: 'human-flag',
    nombre: 'Human Flag',
    img: 'img/human-flag.png',
    descripcion: 'Cuerpo horizontal sujeto a un poste vertical. Fuerza lateral de todo el cuerpo.',
    tiempoEstimado: '4 – 6 meses',
    cssClass: 'color-purple',
    barColor: 'rgba(139,92,246,0.9)',
    progressColor: '#8b5cf6',
    fases: [
      {
        id: 'hf-1',
        nombre: 'Press Lateral en Barra',
        nivel: 'Principiante',
        duracion: '3 – 4 semanas',
        completionsRequired: 10,
        descripcion: 'Aprende a empujar y tirar lateralmente al mismo tiempo. La base del human flag.',
        ejercicios: [
          { nombre: 'Flag plank', series: 4, reps: 15, unit: 'seg', emoji: '↔️' },
          { nombre: 'Dominadas Prono', series: 4, reps: 12, emoji: '🦍' },
          { nombre: 'Flexiones con Palmada', series: 4, reps: 12, emoji: '👏' },
        ],
      },
      {
        id: 'hf-2',
        nombre: 'Tuck Human Flag',
        nivel: 'Intermedio',
        duracion: '4 – 6 semanas',
        completionsRequired: 15,
        descripcion: 'Rodillas al pecho en posición lateral. Tu primer hold real de human flag.',
        ejercicios: [
          { nombre: 'Tuck Human Flag Hold', series: 5, reps: 5, unit: 'seg', emoji: '🔵' },
          { nombre: 'Human Flag Inclinado', series: 4, reps: 8, unit: 'seg', emoji: '📐' },
          { nombre: 'Human Flag Negativa (tuck)', series: 4, reps: 5, emoji: '⬇️' },
        ],
      },
      {
        id: 'hf-3',
        nombre: 'Straddle Human Flag',
        nivel: 'Avanzado',
        duracion: '5 – 8 semanas',
        completionsRequired: 18,
        descripcion: 'Piernas abiertas en horizontal. Un paso enorme hacia el full human flag.',
        ejercicios: [
          { nombre: 'Straddle Human Flag Hold', series: 5, reps: 8, unit: 'seg', emoji: '⭐' },
          { nombre: 'Tuck Human Flag Hold', series: 4, reps: 10, unit: 'seg', emoji: '🔵' },
          { nombre: 'Human Flag Negativa (straddle)', series: 4, reps: 5, emoji: '⬇️' },
        ],
      },
      {
        id: 'hf-4',
        nombre: 'Full Human Flag',
        nivel: 'Élite',
        duracion: 'Práctica continua',
        completionsRequired: 0,
        descripcion: '¡El movimiento más impresionante de la calistenia! Cuerpo completamente horizontal al lado del poste.',
        ejercicios: [
          { nombre: 'Full Human Flag Hold', series: 5, reps: 8, unit: 'seg', emoji: '🚩' },
          { nombre: 'Straddle Human Flag Hold', series: 4, reps: 10, unit: 'seg', emoji: '⭐' },
          { nombre: 'Human Flag Negativa', series: 4, reps: 5, emoji: '⬇️' },
        ],
      },
    ],
  },
];

// ============================
// STORAGE
// ============================
const SKILLS_KEY = 'calibeast_skills_progress';
let skillsProgress = {};

function loadProgress() {
  try {
    skillsProgress = JSON.parse(localStorage.getItem(SKILLS_KEY) || '{}');
  } catch {
    skillsProgress = {};
  }
}

function saveProgress() {
  localStorage.setItem(SKILLS_KEY, JSON.stringify(skillsProgress));
}

function getCompletions(skillId, phaseId) {
  return skillsProgress[skillId]?.[phaseId] || 0;
}

function addCompletion(skillId, phaseId) {
  if (!skillsProgress[skillId]) skillsProgress[skillId] = {};
  skillsProgress[skillId][phaseId] = (skillsProgress[skillId][phaseId] || 0) + 1;
  saveProgress();
}

// ============================
// UNLOCK LOGIC
// ============================
function isPhaseUnlocked(skill, phaseIndex) {
  if (phaseIndex === 0) return true;
  const prev = skill.fases[phaseIndex - 1];
  return getCompletions(skill.id, prev.id) >= prev.completionsRequired;
}

function isPhaseFullyCompleted(skill, phaseIndex) {
  const phase = skill.fases[phaseIndex];
  if (phase.completionsRequired === 0) return getCompletions(skill.id, phase.id) >= 1;
  return getCompletions(skill.id, phase.id) >= phase.completionsRequired;
}

function getSkillProgress(skill) {
  return skill.fases.filter((_, i) => isPhaseFullyCompleted(skill, i)).length;
}

// ============================
// VIEW STATE
// ============================
let view = { mode: 'list', skillId: null, phaseIndex: null };

function setView(mode, skillId = null, phaseIndex = null) {
  view = { mode, skillId, phaseIndex };
  renderSkills();
}

// ============================
// RENDER — SKILL LIST
// ============================
function renderSkillList() {
  const container = document.getElementById('skillsContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="skills-intro">
      <p class="skills-intro__text">Elige el truco que quieres dominar y sigue la progresión paso a paso. Cada fase se desbloquea cuando completas la anterior el número de sesiones requeridas.</p>
    </div>
    <div class="skills-grid">
      ${skillsData.map(skill => {
        const completed = getSkillProgress(skill);
        const total = skill.fases.length;
        const pct = Math.round((completed / total) * 100);

        return `
          <div class="skill-card ${skill.cssClass}" onclick="openSkill('${skill.id}')">
            <div class="skill-card__top-bar" style="background:${skill.barColor}"></div>
            <div class="skill-card__img-wrap">
              <img src="${skill.img}" alt="${skill.nombre}" class="skill-card__img">
            </div>
            <div class="skill-card__name">${skill.nombre}</div>
            <div class="skill-card__time">⏱ ${skill.tiempoEstimado}</div>
            <div class="skill-card__prog-row">
              <div class="skill-card__prog-bar">
                <div class="skill-card__prog-fill" style="width:${pct}%;background:${skill.progressColor}"></div>
              </div>
              <span class="skill-card__prog-label">${completed}/${total}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ============================
// RENDER — SKILL DETAIL (phases strip)
// ============================
function renderSkillDetail(skillId) {
  const skill = skillsData.find(s => s.id === skillId);
  if (!skill) return;
  const container = document.getElementById('skillsContainer');
  if (!container) return;

  const completedCount = getSkillProgress(skill);

  container.innerHTML = `
    <button class="skill-back-btn" onclick="openSkill(null)">← Rutas</button>

    <div class="skill-detail__header">
      <div class="skill-detail__img-wrap">
        <img src="${skill.img}" alt="${skill.nombre}" class="skill-detail__img">
      </div>
      <div>
        <div class="skill-detail__title">${skill.nombre}</div>
        <div class="skill-detail__desc">${skill.descripcion}</div>
        <div class="skill-detail__meta">
          <span class="skill-time-badge">⏱ ${skill.tiempoEstimado}</span>
          <span class="skill-progress-text">${completedCount} de ${skill.fases.length} fases completadas</span>
        </div>
      </div>
    </div>

    <div class="phases-label">Progresión de fases</div>
    <div class="phases-strip" id="phasesStrip">
      ${skill.fases.map((phase, i) => {
        const unlocked = isPhaseUnlocked(skill, i);
        const fullyDone = isPhaseFullyCompleted(skill, i);
        const completions = getCompletions(skill.id, phase.id);
        const required = phase.completionsRequired;
        const pct = required > 0 ? Math.min(100, Math.round((completions / required) * 100)) : (completions >= 1 ? 100 : 0);
        const levelClass = getLevelClass(phase.nivel);

        let stateClass = 'locked';
        if (unlocked && fullyDone) { stateClass = 'completed'; }
        else if (unlocked) { stateClass = 'active'; }

        const clickable = unlocked ? `onclick="openPhase('${skillId}', ${i})"` : '';

        return `
          <div class="phase-card ${stateClass}" ${clickable}>
            <div class="phase-card__top-bar" style="background:${unlocked ? skill.barColor : 'rgba(148,163,184,0.14)'}"></div>
            ${!unlocked ? `<span class="phase-card__lock">🔒</span>` : ''}
            ${fullyDone && unlocked ? `<span class="phase-card__check">✅</span>` : ''}
            <div class="phase-card__number">FASE ${i + 1}</div>
            <div class="phase-card__name">${phase.nombre}</div>
            <span class="phase-card__level ${levelClass}">${phase.nivel}</span>
            <div class="phase-card__duration">${phase.duracion}</div>
            <div class="phase-card__prog-bar">
              <div class="phase-card__prog-fill" style="width:${pct}%;background:${unlocked ? skill.progressColor : 'rgba(148,163,184,0.14)'}"></div>
            </div>
            <div class="phase-card__completions">
              ${required > 0
                ? `${completions}/${required} sesiones`
                : completions >= 1 ? '¡En práctica!' : 'Fase final'
              }
            </div>
            ${!unlocked && i > 0
              ? `<div class="phase-card__unlock-hint">Completa la fase ${i} (${skill.fases[i-1].completionsRequired} sesiones)</div>`
              : ''
            }
          </div>
        `;
      }).join('')}
    </div>

    <div class="skill-tip card">
      <span class="label">💡 ¿Cuándo registrar una sesión?</span>
      <p style="font-size:0.82rem;color:var(--muted);margin-top:0.4rem;font-weight:500;line-height:1.6;">
        Registra <strong style="color:var(--text-soft)">una sesión por día de entrenamiento</strong>, después de completar todas las series indicadas. Cada sesión = todas las series de todos los ejercicios de la fase.
      </p>
    </div>
  `;
}

// ============================
// RENDER — PHASE DETAIL
// ============================
function renderPhaseDetail(skillId, phaseIndex) {
  const skill = skillsData.find(s => s.id === skillId);
  if (!skill) return;
  const phase = skill.fases[phaseIndex];
  if (!phase) return;
  const container = document.getElementById('skillsContainer');
  if (!container) return;

  const completions = getCompletions(skillId, phase.id);
  const required = phase.completionsRequired;
  const isLast = phase.completionsRequired === 0;
  const pct = isLast
    ? (completions >= 1 ? 100 : 0)
    : Math.min(100, Math.round((completions / required) * 100));
  const levelClass = getLevelClass(phase.nivel);
  const isNextPhase = phaseIndex + 1 < skill.fases.length;

  container.innerHTML = `
    <div class="phase-breadcrumb">
      <span onclick="openSkill(null)">Rutas</span>
      <span class="bc-sep">›</span>
      <span onclick="openPhase_skill('${skillId}')">${skill.nombre}</span>
      <span class="bc-sep">›</span>
      <span class="bc-current">Fase ${phaseIndex + 1}</span>
    </div>

    <div class="phase-detail__header">
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
        <img src="${skill.img}" alt="${skill.nombre}" class="skill-phase-detail__img">
        <div>
          <div class="phase-detail__title">${phase.nombre}</div>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-top:0.25rem">
            <span class="phase-card__level ${levelClass}" style="padding:0.22rem 0.6rem">${phase.nivel}</span>
            <span style="font-size:0.72rem;color:var(--muted);font-weight:600">⏱ ${phase.duracion}</span>
            <span style="font-size:0.72rem;color:var(--muted);font-weight:600">— Fase ${phaseIndex + 1} de ${skill.fases.length}</span>
          </div>
        </div>
      </div>
      <p class="phase-detail__desc">${phase.descripcion}</p>
    </div>

    <div class="card" style="margin-bottom:1rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem">
        <span class="label">Sesiones completadas</span>
        <span style="font-size:0.82rem;font-weight:700;color:${skill.progressColor}">
          ${isLast ? (completions >= 1 ? '¡En práctica!' : '0 sesiones') : `${completions} / ${required}`}
        </span>
      </div>
      <div class="phase-detail__prog-bar">
        <div class="phase-detail__prog-fill" style="width:${pct}%;background:${skill.progressColor}"></div>
      </div>
      ${!isLast && completions < required
        ? `<p style="font-size:0.75rem;color:var(--muted);font-weight:600;margin-top:0.5rem;line-height:1.5">
            Faltan <strong style="color:var(--text-soft)">${required - completions} sesiones</strong> para desbloquear${isNextPhase ? ` — <em>${skill.fases[phaseIndex+1].nombre}</em>` : ''}.
           </p>`
        : isLast
          ? `<p style="font-size:0.75rem;color:var(--muted);font-weight:600;margin-top:0.5rem">Esta es la fase final. ¡Sigue practicando para perfeccionar el movimiento!</p>`
          : `<p style="font-size:0.75rem;color:#4ade80;font-weight:700;margin-top:0.5rem">✅ ¡Fase completada! La siguiente ya está desbloqueada.</p>`
      }
    </div>

    <div class="card" style="margin-bottom:1rem">
      <span class="label">Entrenamiento de esta sesión</span>
      <div class="exercises-list" style="margin-top:0.75rem">
        ${phase.ejercicios.map(ex => `
          <div class="exercise-item">
            <span class="exercise-item__emoji">${ex.emoji}</span>
            <div class="exercise-item__info">
              <div class="exercise-item__name">${ex.nombre}</div>
              <div class="exercise-item__reps">${ex.series} series × ${ex.reps}${ex.unit ? ' ' + ex.unit : ' reps'}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <button class="btn btn-accent" style="width:100%;margin-bottom:0.75rem" onclick="completeSession('${skillId}', ${phaseIndex})">
      💪 REGISTRAR SESIÓN COMPLETADA
    </button>

    ${completions > 0
      ? `<p style="text-align:center;font-size:0.72rem;color:var(--muted);font-weight:600">
          ${completions} ${completions === 1 ? 'sesión registrada' : 'sesiones registradas'}${!isLast && completions >= required ? ' · ¡Fase desbloqueada!' : ''}
         </p>`
      : ''
    }
  `;
}

// ============================
// HELPERS
// ============================
function getLevelClass(nivel) {
  const map = {
    'Principiante': 'level-principiante',
    'Intermedio':   'level-intermedio',
    'Avanzado':     'level-avanzado',
    'Élite':        'level-elite',
  };
  return map[nivel] || 'level-principiante';
}

// ============================
// EXPORTED ACTIONS
// ============================
export function initSkills() {
  loadProgress();
  renderSkills();
}

export function renderSkills() {
  if (view.mode === 'list') renderSkillList();
  else if (view.mode === 'skill') renderSkillDetail(view.skillId);
  else if (view.mode === 'phase') renderPhaseDetail(view.skillId, view.phaseIndex);
}

export function openSkill(skillId) {
  if (!skillId) { setView('list'); }
  else { setView('skill', skillId); }
}

export function openPhase_skill(skillId) {
  setView('skill', skillId);
}

export function openPhase(skillId, phaseIndex) {
  const skill = skillsData.find(s => s.id === skillId);
  if (!skill) return;
  if (!isPhaseUnlocked(skill, phaseIndex)) return;
  setView('phase', skillId, phaseIndex);
}

export function completeSession(skillId, phaseIndex) {
  const skill = skillsData.find(s => s.id === skillId);
  if (!skill) return;

  const phase = skill.fases[phaseIndex];
  const prevCompletions = getCompletions(skillId, phase.id);
  addCompletion(skillId, phase.id);

  const newCompletions = getCompletions(skillId, phase.id);
  const required = phase.completionsRequired;

  if (navigator.vibrate) navigator.vibrate(50);

  if (required > 0 && prevCompletions < required && newCompletions >= required) {
    const nextPhase = skill.fases[phaseIndex + 1];
    if (nextPhase) {
      showToast(`🔓 ¡Fase "${nextPhase.nombre}" desbloqueada!`);
    } else {
      showToast('🏆 ¡Has completado todas las fases!');
    }
  } else {
    const remaining = required > 0 ? required - newCompletions : 0;
    if (remaining > 0) {
      showToast(`💪 Sesión registrada · Faltan ${remaining} para desbloquear`);
    } else if (required === 0) {
      showToast('🔥 ¡Sesión registrada! Sigue practicando');
    } else {
      showToast('✅ ¡Fase completada! La siguiente ya está desbloqueada');
    }
  }

  renderSkills();
}