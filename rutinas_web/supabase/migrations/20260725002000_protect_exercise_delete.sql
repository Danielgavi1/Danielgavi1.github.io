-- Protege el borrado de ejercicios con un código comprobado dentro de Supabase.
-- El CRUD de lectura, creación y edición permanece igual.

create extension if not exists pgcrypto with schema extensions;

-- Ya no se permite borrar directamente mediante la API REST con la clave pública.
drop policy if exists "public delete exercises" on public.exercises;

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

  delete from public.exercises
  where id = p_exercise_id;

  if not found then
    raise exception 'El ejercicio no existe o ya fue eliminado.';
  end if;
end;
$$;

revoke all on function public.delete_exercise_with_code(uuid, text) from public;
grant execute on function public.delete_exercise_with_code(uuid, text) to anon, authenticated;
