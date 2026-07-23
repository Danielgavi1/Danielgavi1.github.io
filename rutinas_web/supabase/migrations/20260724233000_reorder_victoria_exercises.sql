-- Reordena únicamente la rutina de Victoria.
-- No modifica pesos, series, repeticiones, notas ni registros históricos.

begin;

update public.exercises
set sort_order = case name
  when 'Hip trust libre' then 0
  when 'Sentadilla búlgara multipower' then 1
  when 'Sentadilla barra' then 2
  when 'Peso muerto rumano' then 3
  when 'Patada de glúteo' then 4
  when 'Abductor externo focalizado 🍑' then 5
  when 'Press pierna sentada 🍑' then 6
end,
updated_at = now()
where person_id = 'victoria'
  and section_id = 'gluteo'
  and active = true
  and name in (
    'Hip trust libre',
    'Sentadilla búlgara multipower',
    'Sentadilla barra',
    'Peso muerto rumano',
    'Patada de glúteo',
    'Abductor externo focalizado 🍑',
    'Press pierna sentada 🍑'
  );

update public.exercises
set sort_order = case name
  when 'Extensión de cuádriceps' then 0
  when 'Curl de pierna' then 1
  when 'Abductor interno' then 2
  when 'Abductor externo' then 3
  when 'Press pierna sentada 🍑' then 4
end,
updated_at = now()
where person_id = 'victoria'
  and section_id = 'pierna'
  and active = true
  and name in (
    'Extensión de cuádriceps',
    'Curl de pierna',
    'Abductor interno',
    'Abductor externo',
    'Press pierna sentada 🍑'
  );

update public.exercises
set sort_order = case name
  when 'Remo' then 0
  when 'Estirar hacia abajo' then 1
end,
updated_at = now()
where person_id = 'victoria'
  and section_id = 'espalda'
  and active = true
  and name in ('Remo', 'Estirar hacia abajo');

commit;
