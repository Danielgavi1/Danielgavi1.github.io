-- ============================================================
-- RUTINAS · ESQUEMA SUPABASE (Tier 3: Sync + CRUD)
-- ============================================================
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- (o vía CLI: supabase db push, si usas migraciones)
--
-- Diseño:
--   people      → Victoria / Daniel (extensible a más personas)
--   sections    → Glúteo / Pierna / Espalda (extensible, con color)
--   exercises   → catálogo de ejercicios (CRUD desde la app)
--   sessions    → una sesión = una persona entrenando en una fecha
--   set_logs    → registro de carga/series/reps por ejercicio y sesión
--                 (de aquí se derivan: volumen, PRs, delta, sugerencia)
-- ============================================================

-- ---- Extensión necesaria para gen_random_uuid() ----
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PEOPLE
-- ============================================================
create table if not exists people (
  id         text primary key,            -- 'victoria', 'daniel'
  label      text not null,
  avatar     text default '🏋️',
  sort_order int  default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 2. SECTIONS (grupos musculares / bloques de rutina)
-- ============================================================
create table if not exists sections (
  id         text primary key,            -- 'gluteo', 'pierna', 'espalda'
  label      text not null,
  color      text not null default '#06B6D4',   -- hex usado como --sc
  image_url  text,
  sort_order int  default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. EXERCISES (catálogo editable sin tocar código)
-- ============================================================
create table if not exists exercises (
  id           uuid primary key default gen_random_uuid(),
  person_id    text not null references people(id) on delete cascade,
  section_id   text not null references sections(id) on delete cascade,
  name         text not null,
  default_load text default '',           -- carga inicial sugerida, texto libre ("20Kg", "barra + 15Kg")
  target_sets  int  default 3,
  target_reps  int  default 10,
  note         text,
  sort_order   int  default 0,
  active       boolean default true,      -- soft delete: false = oculto, no se borra histórico
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_exercises_person_section
  on exercises(person_id, section_id, sort_order);

-- ============================================================
-- 4. SESSIONS (una sesión = persona + fecha)
-- ============================================================
create table if not exists sessions (
  id          uuid primary key default gen_random_uuid(),
  person_id   text not null references people(id) on delete cascade,
  session_date date not null default current_date,
  started_at  timestamptz default now(),
  finished_at timestamptz,
  notes       text,
  created_at  timestamptz default now()
);

create index if not exists idx_sessions_person_date
  on sessions(person_id, session_date desc);

-- Una persona solo puede tener UNA sesión "abierta" por día natural
-- (evita duplicar sesiones si recarga la app el mismo día)
create unique index if not exists uniq_session_person_day
  on sessions(person_id, session_date);

-- ============================================================
-- 5. SET_LOGS (registro real de carga/series/reps ejecutadas)
-- ============================================================
-- Cada fila = el resultado de un ejercicio dentro de una sesión.
-- A partir de esta tabla se calculan: volumen, PR, delta y sugerencia.
create table if not exists set_logs (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references sessions(id) on delete cascade,
  exercise_id  uuid not null references exercises(id) on delete cascade,
  load_kg      numeric(6,2),              -- carga numérica en kg (para cálculos)
  load_label   text,                      -- texto mostrado tal cual ("barra (22.7Kg) + 15Kg")
  sets         int,
  reps         int,
  volume_kg    numeric(10,2),             -- sets * reps * load_kg (generado, ver trigger)
  done         boolean default false,
  completed_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (session_id, exercise_id)        -- un ejercicio aparece una vez por sesión
);

create index if not exists idx_setlogs_exercise
  on set_logs(exercise_id, created_at desc);

create index if not exists idx_setlogs_session
  on set_logs(session_id);

-- ---- Trigger: calcular volumen automáticamente ----
create or replace function calc_volume()
returns trigger as $$
begin
  new.volume_kg := coalesce(new.load_kg, 0) * coalesce(new.sets, 0) * coalesce(new.reps, 0);
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_calc_volume on set_logs;
create trigger trg_calc_volume
  before insert or update on set_logs
  for each row execute function calc_volume();

-- ============================================================
-- 6. VISTA: histórico por ejercicio con PR y delta precalculados
-- ============================================================
-- Útil para el gráfico de progresión y para no recalcular todo en JS.
create or replace view exercise_history as
select
  sl.id,
  sl.exercise_id,
  e.name        as exercise_name,
  e.person_id,
  e.section_id,
  s.session_date,
  sl.load_kg,
  sl.load_label,
  sl.sets,
  sl.reps,
  sl.volume_kg,
  sl.done,
  -- PR de carga: true si load_kg es el máximo histórico hasta esa fecha (inclusive)
  (sl.load_kg >= max(sl.load_kg) over (
      partition by sl.exercise_id
      order by s.session_date
      rows between unbounded preceding and current row
  )) as is_pr_load,
  -- PR de volumen: igual pero para volumen
  (sl.volume_kg >= max(sl.volume_kg) over (
      partition by sl.exercise_id
      order by s.session_date
      rows between unbounded preceding and current row
  )) as is_pr_volume,
  -- carga de la sesión anterior (para delta)
  lag(sl.load_kg) over (
      partition by sl.exercise_id order by s.session_date
  ) as prev_load_kg,
  lag(sl.volume_kg) over (
      partition by sl.exercise_id order by s.session_date
  ) as prev_volume_kg
from set_logs sl
join exercises e on e.id = sl.exercise_id
join sessions  s on s.id = sl.session_id;
-- Nota: NO filtramos por done aquí a propósito. El cliente (logic.js)
-- decide qué hacer con sets incompletos: los PR solo cuentan sesiones
-- completadas, pero la sugerencia de carga SÍ necesita ver también las
-- incompletas (para no subir peso si la última vez no se llegó a las reps).

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================
-- App de uso personal/familiar sin login propio: se usa la clave pública
-- (anon/publishable) y se abre el acceso a las operaciones necesarias.
-- Si en el futuro añades Supabase Auth, sustituye estas políticas por
-- reglas basadas en auth.uid().

alter table people     enable row level security;
alter table sections   enable row level security;
alter table exercises  enable row level security;
alter table sessions   enable row level security;
alter table set_logs   enable row level security;

create policy "public read people"      on people     for select using (true);
create policy "public read sections"    on sections   for select using (true);

create policy "public read exercises"   on exercises  for select using (true);
create policy "public write exercises"  on exercises  for insert with check (true);
create policy "public update exercises" on exercises  for update using (true);
create policy "public delete exercises" on exercises  for delete using (true);

create policy "public read sessions"    on sessions   for select using (true);
create policy "public write sessions"   on sessions   for insert with check (true);
create policy "public update sessions"  on sessions   for update using (true);
create policy "public delete sessions"  on sessions   for delete using (true);

create policy "public read setlogs"     on set_logs   for select using (true);
create policy "public write setlogs"    on set_logs   for insert with check (true);
create policy "public update setlogs"   on set_logs   for update using (true);
create policy "public delete setlogs"   on set_logs   for delete using (true);

-- ============================================================
-- 8. SEED — personas y secciones base
-- ============================================================
insert into people (id, label, avatar, sort_order) values
  ('victoria', 'Victoria', '👩', 1),
  ('daniel',   'Daniel',   '👨', 2)
on conflict (id) do nothing;

insert into sections (id, label, color, image_url, sort_order) values
  ('gluteo',  'Glúteo',  '#EC4899', './img/culo.webp',    1),
  ('pierna',  'Pierna',  '#06B6D4', './img/pierna.webp',  2),
  ('espalda', 'Espalda', '#F59E0B', './img/espalda.webp', 3)
on conflict (id) do nothing;

-- ============================================================
-- 9. SEED — ejercicios (catálogo inicial, igual al que ya tenías)
-- ============================================================
insert into exercises (person_id, section_id, name, default_load, target_sets, target_reps, note, sort_order) values
  -- Victoria · Glúteo
  ('victoria','gluteo','Hip trust libre',               'barra (22.7Kg) + 60Kg', 3, 10, 'Negativa al fallo', 0),
  ('victoria','gluteo','Sentadilla búlgara multipower',  'barra (22.7Kg) + 15Kg', 3, 10, null, 1),
  ('victoria','gluteo','Sentadilla barra',                'barra (22.7Kg) + 15Kg', 3, 10, null, 2),
  ('victoria','gluteo','Peso muerto rumano',             'barra (22.7Kg) + 15Kg', 3, 10, null, 3),
  ('victoria','gluteo','Patada de glúteo',               '11.3Kg',                4, 10, null, 4),
  ('victoria','gluteo','Abductor externo focalizado 🍑', '56Kg',                  3, 10, null, 5),
  ('victoria','gluteo','Press pierna sentada 🍑',        '64Kg',                  3, 10, 'Rango completo', 6),
  -- Victoria · Pierna
  ('victoria','pierna','Extensión de cuádriceps', '27.5Kg', 3, 10, null, 0),
  ('victoria','pierna','Curl de pierna',           '23Kg',  3, 10, null, 1),
  ('victoria','pierna','Abductor interno',         '54Kg',  3, 10, null, 2),
  ('victoria','pierna','Abductor externo',         '61Kg',  3, 10, null, 3),
  ('victoria','pierna','Press pierna sentada 🍑',  '64Kg',  3, 10, 'Rango completo', 4),
  -- Victoria · Espalda
  ('victoria','espalda','Remo',                '15Kg',   3, 10, null, 0),
  ('victoria','espalda','Estirar hacia abajo', '27.5Kg', 3, 10, null, 1),

  -- Daniel · Glúteo
  ('daniel','gluteo','Hip trust',                        '20Kg', 4, 10, null, 0),
  ('daniel','gluteo','Patada de glúteo',                 '20Kg', 4, 10, null, 1),
  ('daniel','gluteo','Press pierna sentado 🍑',          '87Kg', 3, 10, 'rango completo', 2),
  ('daniel','gluteo','Peso muerto rumano',               'barra (22.7Kg) + 15Kg', 3, 10, null, 3),
  ('daniel','gluteo','Sentadilla búlgara con mancuerna', 'barra (22.7Kg) + 15Kg', 4, 10, null, 4),
  ('daniel','gluteo','Abductor focalizado 🍑',           '50Kg', 3, 10, null, 5),
  ('daniel','gluteo','Sentadilla barra',                  'barra (22.7Kg) + 15Kg', 3, 10, null, 6),
  -- Daniel · Pierna
  ('daniel','pierna','Femoral tumbado',         '25Kg', 3, 10, null, 0),
  ('daniel','pierna','Extensión de cuádriceps', '45Kg', 3, 10, null, 1),
  ('daniel','pierna','Curl de pierna',          '35Kg', 3, 10, null, 2),
  ('daniel','pierna','Abductor interno',        '93Kg', 3, 10, null, 3),
  ('daniel','pierna','Aductor externo',         '77Kg', 3, 10, null, 4),
  -- Daniel · Espalda
  ('daniel','espalda','Estirar hacia abajo', '75Kg', 3, 10, null, 0),
  ('daniel','espalda','Remo',                '75Kg', 3, 10, null, 1)
on conflict do nothing;
