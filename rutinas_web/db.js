'use strict';

/* ============================================================
   DB.JS — CAPA SUPABASE (sync + CRUD)
   ============================================================
   Responsabilidad única: hablar con Supabase.
   No toca el DOM. No conoce localStorage (eso es cosa de
   script.js, que decide cuándo usar caché local vs red).

   Estrategia online-first con fallback local:
     - Si SUPABASE_CONFIG tiene url/key válidos Y el cliente
       carga bien → se usa Supabase como fuente de verdad.
     - Si falla (sin red, error, etc.) → DB.isOnline() devuelve
       false y script.js cae automáticamente a localStorage.
   ============================================================ */

const DB = (() => {
  let client = null;
  let online = false;
  let initPromise = null;

  /* ---- Carga perezosa del SDK de Supabase desde CDN ---- */
  function loadSupabaseSDK() {
    return new Promise((resolve, reject) => {
      if (window.supabase && window.supabase.createClient) {
        resolve(window.supabase);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      script.onload = () => {
        if (window.supabase && window.supabase.createClient) resolve(window.supabase);
        else reject(new Error('Supabase SDK cargó pero no expone createClient'));
      };
      script.onerror = () => reject(new Error('No se pudo cargar el SDK de Supabase (¿sin conexión?)'));
      document.head.appendChild(script);
    });
  }

  /* ---- Inicialización: intenta conectar, prueba con un ping real ---- */
  async function init() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const cfg = SUPABASE_CONFIG;
      if (!cfg || !cfg.url || !cfg.anonKey || cfg.url.includes('TU-PROYECTO')) {
        online = false;
        return false;
      }
      try {
        const sb = await loadSupabaseSDK();
        client = sb.createClient(cfg.url, cfg.anonKey);

        // Ping real: si las tablas no existen o no hay red, esto falla.
        const { error } = await client.from('people').select('id').limit(1);
        if (error) throw error;

        online = true;
        return true;
      } catch (err) {
        console.warn('[DB] Supabase no disponible, usando modo local:', err.message);
        client = null;
        online = false;
        return false;
      }
    })();

    return initPromise;
  }

  function isOnline() { return online; }

  /* ----------------------------------------------------------
     PEOPLE / SECTIONS — catálogo base (rara vez cambia)
     ---------------------------------------------------------- */
  async function fetchPeople() {
    if (!online) return null;
    const { data, error } = await client.from('people').select('*').order('sort_order');
    if (error) { console.error(error); return null; }
    return data;
  }

  async function fetchSections() {
    if (!online) return null;
    const { data, error } = await client.from('sections').select('*').order('sort_order');
    if (error) { console.error(error); return null; }
    return data;
  }

  /* ----------------------------------------------------------
     EXERCISES — CRUD completo (Tier 3: editable sin tocar código)
     ---------------------------------------------------------- */
  async function fetchExercises(personId) {
    if (!online) return null;
    const { data, error } = await client
      .from('exercises')
      .select('*')
      .eq('person_id', personId)
      .eq('active', true)
      .order('section_id')
      .order('sort_order');
    if (error) { console.error(error); return null; }
    return data;
  }

  async function createExercise(ex) {
    if (!online) return null;
    const { data, error } = await client.from('exercises').insert({
      person_id: ex.personId,
      section_id: ex.sectionId,
      name: ex.name,
      default_load: ex.defaultLoad || '',
      target_sets: ex.targetSets || 3,
      target_reps: ex.targetReps || 10,
      note: ex.note || null,
      sort_order: ex.sortOrder || 0,
    }).select().single();
    if (error) { console.error(error); return null; }
    return data;
  }

  async function updateExercise(id, patch) {
    if (!online) return null;
    const row = {};
    if (patch.name !== undefined)        row.name = patch.name;
    if (patch.defaultLoad !== undefined) row.default_load = patch.defaultLoad;
    if (patch.targetSets !== undefined)  row.target_sets = patch.targetSets;
    if (patch.targetReps !== undefined)  row.target_reps = patch.targetReps;
    if (patch.note !== undefined)        row.note = patch.note;
    if (patch.sectionId !== undefined)   row.section_id = patch.sectionId;
    if (patch.sortOrder !== undefined)   row.sort_order = patch.sortOrder;
    row.updated_at = new Date().toISOString();

    const { data, error } = await client.from('exercises').update(row).eq('id', id).select().single();
    if (error) { console.error(error); return null; }
    return data;
  }

  /* Soft delete: lo marcamos inactivo en lugar de borrar, así no
     se pierde el histórico de set_logs ligado a este ejercicio. */
  async function deleteExercise(id) {
    if (!online) return false;
    const { error } = await client.from('exercises').update({ active: false }).eq('id', id);
    if (error) { console.error(error); return false; }
    return true;
  }

  /* ----------------------------------------------------------
     SESSIONS — una por persona y día
     ---------------------------------------------------------- */
  async function getOrCreateSession(personId, dateISO) {
    if (!online) return null;

    const { data: existing, error: selErr } = await client
      .from('sessions')
      .select('*')
      .eq('person_id', personId)
      .eq('session_date', dateISO)
      .maybeSingle();

    if (selErr) { console.error(selErr); return null; }
    if (existing) return existing;

    const { data: created, error: insErr } = await client
      .from('sessions')
      .insert({ person_id: personId, session_date: dateISO })
      .select()
      .single();

    if (insErr) { console.error(insErr); return null; }
    return created;
  }

  async function fetchSessions(personId, limit = 60) {
    if (!online) return null;
    const { data, error } = await client
      .from('sessions')
      .select('*')
      .eq('person_id', personId)
      .order('session_date', { ascending: false })
      .limit(limit);
    if (error) { console.error(error); return null; }
    return data;
  }

  /* ----------------------------------------------------------
     SET_LOGS — el registro real de cada ejercicio en cada sesión
     ---------------------------------------------------------- */
  async function upsertSetLog(sessionId, exerciseId, fields) {
    if (!online) return null;
    const row = {
      session_id: sessionId,
      exercise_id: exerciseId,
      load_kg: fields.loadKg ?? null,
      load_label: fields.loadLabel ?? null,
      sets: fields.sets ?? null,
      reps: fields.reps ?? null,
      done: !!fields.done,
      completed_at: fields.done ? new Date().toISOString() : null,
    };
    const { data, error } = await client
      .from('set_logs')
      .upsert(row, { onConflict: 'session_id,exercise_id' })
      .select()
      .single();
    if (error) { console.error(error); return null; }
    return data;
  }

  /* Historial de un ejercicio concreto, ordenado cronológicamente,
     usado para PR / sugerencia / gráfico de progresión. */
  async function fetchExerciseHistory(exerciseId, limit = 50) {
    if (!online) return null;
    const { data, error } = await client
      .from('exercise_history')
      .select('*')
      .eq('exercise_id', exerciseId)
      .order('session_date', { ascending: true })
      .limit(limit);
    if (error) { console.error(error); return null; }
    return data;
  }

  /* Todos los logs de una sesión (para pintar el estado al cargar
     la app y saber qué hay marcado como hecho). */
  async function fetchSessionLogs(sessionId) {
    if (!online) return null;
    const { data, error } = await client
      .from('set_logs')
      .select('*')
      .eq('session_id', sessionId);
    if (error) { console.error(error); return null; }
    return data;
  }

  /* Para el gráfico de progresión: histórico completo de volumen
     por sesión y persona (todas las secciones, todas las fechas). */
  async function fetchVolumeBySession(personId, limit = 90) {
    if (!online) return null;
    const { data, error } = await client
      .from('exercise_history')
      .select('session_date, volume_kg, person_id')
      .eq('person_id', personId)
      .order('session_date', { ascending: true })
      .limit(limit * 30); // margen amplio, se agrega después en JS
    if (error) { console.error(error); return null; }
    return data;
  }

  return {
    init,
    isOnline,
    fetchPeople,
    fetchSections,
    fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise,
    getOrCreateSession,
    fetchSessions,
    upsertSetLog,
    fetchExerciseHistory,
    fetchSessionLogs,
    fetchVolumeBySession,
  };
})();
