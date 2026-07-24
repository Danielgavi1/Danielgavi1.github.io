# Rutinas — CRUD directo con Supabase

La rutina usa Supabase como única fuente de verdad para personas, secciones y ejercicios.
Los checks de ejercicios completados son temporales y se guardan en `localStorage` por persona y por día.

## Archivos principales

- `config.js`: URL y clave pública de Supabase.
- `db.js`: lectura y CRUD de ejercicios.
- `app.js`: estado, renderizado, checks diarios y eventos.
- `index.html`: interfaz y diálogos.
- `style.css`: diseño adaptable a móvil y escritorio.
- `supabase/migrations/`: cambios que deben aplicarse a la base de datos.

## Mejoras de interfaz

- Peso o carga destacado dentro de cada ejercicio.
- Series y repeticiones separadas y fáciles de leer.
- Progreso total y progreso por grupo muscular.
- Estados visuales `Pendiente` y `Completado`.
- Modal de edición centrado también en móviles.
- Confirmación de borrado mediante código de seguridad.

## Protección de borrado

El borrado directo mediante la API pública queda desactivado. La aplicación llama a una función de Supabase que valida el código antes de eliminar el ejercicio.

Esta protección evita borrados accidentales y que alguien use directamente la operación REST de borrado. No sustituye a un sistema completo de autenticación: un código de seis cifras no ofrece la misma seguridad que una cuenta de usuario y políticas RLS asociadas a esa cuenta.

## Aplicar los cambios en Supabase

Después de sustituir los archivos, ejecuta desde esta carpeta:

```bash
npx supabase db push
```

La migración nueva es:

```text
supabase/migrations/20260725002000_protect_exercise_delete.sql
```

No vuelvas a ejecutar todo `supabase_schema.sql` sobre una base de datos que ya contiene tus rutinas.

## Publicar en GitHub Pages

```bash
git add .
git commit -m "Mejorar interfaz y proteger borrado de ejercicios"
git push
```

`node_modules`, los temporales de Supabase, los backups y los archivos `.env` están excluidos mediante `.gitignore`.
