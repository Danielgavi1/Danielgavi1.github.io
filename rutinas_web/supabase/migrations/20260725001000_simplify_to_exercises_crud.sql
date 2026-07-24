-- Simplifica la aplicación a un CRUD directo del catálogo de ejercicios.
-- ATENCIÓN: elimina el histórico de sesiones y los checks diarios.

drop view if exists public.exercise_history;
drop table if exists public.set_logs cascade;
drop table if exists public.sessions cascade;
drop function if exists public.calc_volume();

alter table public.exercises
  drop column if exists active;
