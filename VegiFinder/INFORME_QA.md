# Informe de calidad — VegiFinder 2.2

Fecha de revisión: 13 de agosto de 2026.

## Comprobaciones ejecutadas

- 11 pruebas unitarias de clasificación, normalización, deduplicación y relevancia.
- 4 pruebas de recuperación de API:
  - éxito inmediato del proveedor principal;
  - cambio al proveedor alternativo después de un HTTP 503;
  - nueva ronda silenciosa cuando fallan los dos proveedores;
  - una respuesta correcta con cero productos se conserva como «sin resultados» y no se convierte en error.
- Sintaxis válida en todos los módulos JavaScript y en el service worker.
- Referencias locales principales y recursos versionados revisados.
- Service worker y query strings de recursos actualizados a 2.2.0.

## Error corregido en 2.2

El problema observado era de flujo de recuperación, no del control de búsquedas vacías. En 2.1 una búsqueda de texto hacía un ciclo limitado de peticiones. Si ese ciclo coincidía con un fallo temporal de Open Food Facts, la interfaz mostraba inmediatamente «No se pudo buscar». Al pulsar «Reintentar», se iniciaba un ciclo nuevo que podía funcionar segundos después.

La versión 2.2 separa ahora tres situaciones:

1. **Búsqueda pendiente:** no se muestra ningún bloque de resultados ni error; el botón indica «Buscando…».
2. **Respuesta válida con cero productos:** se muestra «No hemos encontrado…».
3. **Fallo real de proveedores:** solo se muestra error después de agotar varias rondas silenciosas y los dos proveedores.

Además, el reintento se coordina a nivel de búsqueda completa en lugar de repetir agresivamente el mismo endpoint antes de probar el alternativo. Esto reduce peticiones duplicadas y hace que un fallo temporal que antes requería pulsar manualmente «Reintentar» se recupere dentro de la misma búsqueda.

## Comprobaciones recomendadas después de publicar

Estas funciones dependen del navegador, el dispositivo y servicios externos, por lo que deben verificarse en la URL HTTPS definitiva:

- búsqueda en directo de términos populares como `tofu`, `leche de soja` y una marca concreta;
- búsqueda inventada como `asd` para confirmar el estado vacío;
- comportamiento con conexión lenta o intermitente;
- permisos de cámara y compatibilidad de `BarcodeDetector`;
- actualización del service worker desde 2.1.0 a 2.2.0;
- visualización en Safari iOS y Chrome Android.
