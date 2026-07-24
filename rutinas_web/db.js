'use strict';

/*
 * Única responsabilidad de este archivo: hablar con Supabase.
 * No gestiona DOM, sesiones, localStorage ni datos de respaldo.
 */
const DB = (() => {
  let client;

  function init() {
    if (!window.supabase?.createClient) {
      throw new Error('No se pudo cargar Supabase JS.');
    }

    const { url, anonKey } = SUPABASE_CONFIG;
    if (!url || !anonKey) {
      throw new Error('Falta configurar la URL o la clave de Supabase.');
    }

    client = window.supabase.createClient(url, anonKey);
  }

  function requireClient() {
    if (!client) throw new Error('Supabase no está inicializado.');
    return client;
  }

  async function getPeople() {
    const { data, error } = await requireClient()
      .from('people')
      .select('id, label, avatar, sort_order')
      .order('sort_order');

    if (error) throw error;
    return data;
  }

  async function getSections() {
    const { data, error } = await requireClient()
      .from('sections')
      .select('id, label, color, image_url, sort_order')
      .order('sort_order');

    if (error) throw error;
    return data;
  }

  async function getExercises(personId) {
    const { data, error } = await requireClient()
      .from('exercises')
      .select('id, person_id, section_id, name, default_load, target_sets, target_reps, note, sort_order')
      .eq('person_id', personId)
      .order('section_id')
      .order('sort_order')
      .order('name');

    if (error) throw error;
    return data;
  }

  async function createExercise(exercise) {
    const { data, error } = await requireClient()
      .from('exercises')
      .insert(toDatabaseRow(exercise))
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function updateExercise(id, exercise) {
    const row = {
      ...toDatabaseRow(exercise),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await requireClient()
      .from('exercises')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function deleteExercise(id, securityCode) {
    const { error } = await requireClient()
      .rpc('delete_exercise_with_code', {
        p_exercise_id: id,
        p_code: securityCode,
      });

    if (error) throw error;
  }

  function toDatabaseRow(exercise) {
    return {
      person_id: exercise.personId,
      section_id: exercise.sectionId,
      name: exercise.name.trim(),
      default_load: exercise.defaultLoad.trim(),
      target_sets: exercise.targetSets,
      target_reps: exercise.targetReps,
      note: exercise.note.trim() || null,
      sort_order: exercise.sortOrder,
    };
  }

  return {
    init,
    getPeople,
    getSections,
    getExercises,
    createExercise,
    updateExercise,
    deleteExercise,
  };
})();
