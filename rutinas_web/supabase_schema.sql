-- ============================================================
-- RUTINAS · ESQUEMA SIMPLE
-- Fuente de verdad: people + sections + exercises
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.people (
  id         text primary key,
  label      text not null,
  avatar     text default '🏋️',
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.sections (
  id         text primary key,
  label      text not null,
  color      text not null default '#64748B',
  image_url  text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.exercises (
  id           uuid primary key default gen_random_uuid(),
  person_id    text not null references public.people(id) on delete cascade,
  section_id   text not null references public.sections(id) on delete cascade,
  name         text not null,
  default_load text not null default '',
  target_sets  int not null default 3 check (target_sets > 0),
  target_reps  int not null default 10 check (target_reps > 0),
  note         text,
  sort_order   int not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_exercises_person_section_order
  on public.exercises(person_id, section_id, sort_order);

alter table public.people enable row level security;
alter table public.sections enable row level security;
alter table public.exercises enable row level security;

drop policy if exists "public read people" on public.people;
create policy "public read people"
  on public.people for select using (true);

drop policy if exists "public read sections" on public.sections;
create policy "public read sections"
  on public.sections for select using (true);

drop policy if exists "public read exercises" on public.exercises;
create policy "public read exercises"
  on public.exercises for select using (true);

drop policy if exists "public write exercises" on public.exercises;
create policy "public write exercises"
  on public.exercises for insert with check (true);

drop policy if exists "public update exercises" on public.exercises;
create policy "public update exercises"
  on public.exercises for update using (true) with check (true);

drop policy if exists "public delete exercises" on public.exercises;

create extension if not exists pgcrypto with schema extensions;

create or replace function public.delete_exercise_with_code(
  p_exercise_id uuid,
  p_code text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if encode(digest(coalesce(p_code, ''), 'sha256'), 'hex')
     <> '338d5c1af7635429a968c92017f7055133cf862c5cd083661f04b1fac4349626' then
    raise exception 'Código de seguridad incorrecto.';
  end if;

  delete from public.exercises where id = p_exercise_id;

  if not found then
    raise exception 'El ejercicio no existe o ya fue eliminado.';
  end if;
end;
$$;

revoke all on function public.delete_exercise_with_code(uuid, text) from public;
grant execute on function public.delete_exercise_with_code(uuid, text) to anon, authenticated;

insert into public.people (id, label, avatar, sort_order) values
  ('victoria', 'Victoria', '👩', 1),
  ('daniel', 'Daniel', '👨', 2)
on conflict (id) do update set
  label = excluded.label,
  avatar = excluded.avatar,
  sort_order = excluded.sort_order;

insert into public.sections (id, label, color, image_url, sort_order) values
  ('gluteo', 'Glúteo', '#EC4899', './img/culo.webp', 1),
  ('pierna', 'Pierna', '#06B6D4', './img/pierna.webp', 2),
  ('espalda', 'Espalda', '#F59E0B', './img/espalda.webp', 3),
  ('pecho', 'Pecho', '#8B5CF6', './img/pecho.webp', 4)
on conflict (id) do update set
  label = excluded.label,
  color = excluded.color,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;
