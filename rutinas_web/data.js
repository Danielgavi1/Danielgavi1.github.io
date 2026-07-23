'use strict';

/* ============================================================
   DATA.JS — DATOS PUROS
   ============================================================
   Sin lógica. Solo estructuras de datos.
   Esto es el "seed" / fallback local: la app intenta cargar
   estos mismos datos desde Supabase (tablas people, sections,
   exercises) y si no hay conexión o aún no hay nada en la BBDD,
   usa esto para no quedarse en blanco.

   IMPORTANTE: el id de cada ejercicio es estable (v-gl-0, d-pi-3...)
   y se usa como ancla para mapear contra el id (uuid) real de
   Supabase una vez sincronizado — ver db.js → ensureExerciseIds().
   ============================================================ */

const PEOPLE = [
  { id: 'victoria', label: 'Victoria', avatar: '👩', sortOrder: 1 },
  { id: 'daniel',   label: 'Daniel',   avatar: '👨', sortOrder: 2 },
];

const SECTION_META = {
  gluteo:  { id: 'gluteo',  label: 'Glúteo',  color: '#EC4899', img: './img/culo.webp',    alt: 'Glúteos', sortOrder: 1 },
  pierna:  { id: 'pierna',  label: 'Pierna',  color: '#06B6D4', img: './img/pierna.webp',  alt: 'Pierna',  sortOrder: 2 },
  espalda: { id: 'espalda', label: 'Espalda', color: '#F59E0B', img: './img/espalda.webp', alt: 'Espalda', sortOrder: 3 },
};

/* Catálogo de ejercicios. Es el seed inicial: una vez Supabase está
   conectado, la fuente de verdad pasa a ser la tabla `exercises` y
   este objeto solo se usa como fallback sin conexión. */
const RUTINAS = {
  victoria: {
    label: 'Victoria',
    sections: {
      gluteo: [
        { id: 'v-gl-0', name: 'Hip trust libre',               load: 'barra (22.7Kg) + 75Kg', sets: 3, reps: 10, note: 'Negativa al fallo' },
        { id: 'v-gl-2', name: 'Sentadilla búlgara multipower', load: 'barra (22.7Kg) + 20Kg',  sets: 4, reps: 10 },
        { id: 'v-gl-6', name: 'Sentadilla barra',              load: 'barra (22.7Kg) + 20Kg',  sets: 3, reps: 10 },
        { id: 'v-gl-5', name: 'Peso muerto rumano',            load: 'barra (22.7Kg) + 15Kg',  sets: 3, reps: 10 },
        { id: 'v-gl-1', name: 'Patada de glúteo',              load: '11.3Kg',                 sets: 4, reps: 10 },
        { id: 'v-gl-3', name: 'Abductor externo focalizado 🍑',load: '73Kg',                   sets: 3, reps: 10 },
        { id: 'v-gl-4', name: 'Press pierna sentada 🍑',       load: '82Kg',                   sets: 3, reps: 10, note: 'Rango completo' },
      ],
      pierna: [
        { id: 'v-pi-0', name: 'Extensión de cuádriceps', load: '32Kg', sets: 3, reps: 10 },
        { id: 'v-pi-1', name: 'Curl de pierna',           load: '23Kg',  sets: 3, reps: 10 },
        { id: 'v-pi-2', name: 'Abductor interno',         load: '70Kg',  sets: 3, reps: 10 },
        { id: 'v-pi-3', name: 'Abductor externo',         load: '73Kg',  sets: 3, reps: 10 },
        { id: 'v-pi-4', name: 'Press pierna sentada 🍑',  load: '82Kg',  sets: 3, reps: 10, note: 'Rango completo' },
      ],
      espalda: [
        { id: 'v-es-1', name: 'Remo',                load: '15Kg',   sets: 3, reps: 10 },
        { id: 'v-es-0', name: 'Estirar hacia abajo', load: '27.5Kg', sets: 3, reps: 10 },
      ],
    },
  },

  daniel: {
    label: 'Daniel',
    sections: {
      gluteo: [
        { id: 'd-gl-0', name: 'Hip trust',                        load: '20Kg', sets: 4, reps: 10 },
        { id: 'd-gl-1', name: 'Patada de glúteo',                 load: '20Kg', sets: 4, reps: 10 },
        { id: 'd-gl-2', name: 'Press pierna sentado 🍑',          load: '87Kg', sets: 3, reps: 10, note: 'rango completo' },
        { id: 'd-gl-3', name: 'Peso muerto rumano',               load: 'barra (22.7Kg) + 15Kg', sets: 3, reps: 10 },
        { id: 'd-gl-4', name: 'Sentadilla búlgara con mancuerna', load: 'barra (22.7Kg) + 15Kg', sets: 4, reps: 10 },
        { id: 'd-gl-5', name: 'Abductor focalizado 🍑',           load: '50Kg', sets: 3, reps: 10 },
        { id: 'd-gl-6', name: 'Sentadilla barra',                  load: 'barra (22.7Kg) + 15Kg', sets: 3, reps: 10 },
      ],
      pierna: [
        { id: 'd-pi-0', name: 'Femoral tumbado',           load: '25Kg', sets: 3, reps: 10 },
        { id: 'd-pi-1', name: 'Extensión de cuádriceps',   load: '45Kg', sets: 3, reps: 10 },
        { id: 'd-pi-2', name: 'Curl de pierna',            load: '35Kg', sets: 3, reps: 10 },
        { id: 'd-pi-3', name: 'Abductor interno',          load: '93Kg', sets: 3, reps: 10 },
        { id: 'd-pi-4', name: 'Aductor externo',           load: '77Kg', sets: 3, reps: 10 },
      ],
      espalda: [
        { id: 'd-es-0', name: 'Estirar hacia abajo', load: '75Kg', sets: 3, reps: 10 },
        { id: 'd-es-1', name: 'Remo',                load: '75Kg', sets: 3, reps: 10 },
      ],
    },
  },
};

/* ============================================================
   CONFIG SUPABASE
   ============================================================
   La "anon/publishable key" es pública por diseño (va en el
   bundle del cliente); la seguridad real la dan las políticas
   RLS definidas en supabase_schema.sql, no esta clave.
   ============================================================ */
const SUPABASE_CONFIG = {
  url: 'https://hibknehibgzqldpmedgt.supabase.co',
  anonKey: 'sb_publishable_l8sWzYzLylSn81l5dwG3Cg__xHFoJTn',
};
