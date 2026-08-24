-- Añade la sección Pecho y sus ejercicios para Daniel y Victoria.
-- Generado a partir de los datos proporcionados el 2026-08-24.

insert into public.sections (id, label, color, image_url, sort_order) values
  ('pecho', 'Pecho', '#8B5CF6', './img/pecho.webp', 4)
on conflict (id) do update set
  label = excluded.label,
  color = excluded.color,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;

insert into public.exercises
  (id, person_id, section_id, name, default_load, target_sets, target_reps, note, sort_order)
values
  ('d4c9d852-ef50-40ab-8868-a2992885b4eb', 'daniel', 'pecho', 'Apertura de pecho (máquina)', '35Kg', 3, 10, null, 0),
  ('a9710227-06b6-4179-9f02-c1eb22266dbc', 'daniel', 'pecho', 'Chest Press Máquina (peso libre)', '100Kg', 3, 5, null, 1),
  ('2195f295-1d78-4e95-933c-a21c6b112399', 'daniel', 'pecho', 'Press Banca Smith', '80Kg', 3, 8, null, 2),
  ('87cfdb93-b76c-4981-9cfd-6b870d7f87a9', 'victoria', 'pecho', 'Apertura de pecho (máquina)', '0Kg', 3, 8, null, 0),
  ('9f93eb33-828e-4be2-9663-699a07acc6e1', 'victoria', 'pecho', 'Chest Press Máquina (peso libre)', '10Kg', 3, 8, null, 1),
  ('02d16a43-4c5d-44e8-8088-ca038681b251', 'victoria', 'pecho', 'Press Banca Smith', '10Kg', 3, 8, null, 2)
on conflict (id) do update set
  person_id = excluded.person_id,
  section_id = excluded.section_id,
  name = excluded.name,
  default_load = excluded.default_load,
  target_sets = excluded.target_sets,
  target_reps = excluded.target_reps,
  note = excluded.note,
  sort_order = excluded.sort_order,
  updated_at = now();
