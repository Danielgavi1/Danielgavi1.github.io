# Informe de calidad — VegiFinder 2.1

Fecha de revisión: 3 de agosto de 2026.

## Comprobaciones ejecutadas

- 11 pruebas unitarias de clasificación, normalización, deduplicación y relevancia.
- 3 pruebas de recuperación de API:
  - éxito del proveedor principal;
  - reintento automático después de un error HTTP 503;
  - cambio automático al proveedor de respaldo después de un fallo de red.
- Sintaxis válida en todos los módulos JavaScript y en el service worker.
- CSS analizado sin errores de parseo.
- HTML analizado sin identificadores duplicados.
- Todas las páginas declaran idioma, título y viewport.
- Todas las referencias locales de HTML, manifest y precaché apuntan a archivos existentes.
- Iconos declarados en el manifest presentes.
- Enlaces externos con `target="_blank"` protegidos mediante `noopener noreferrer`.
- Prueba de interacción en Chromium con respuestas simuladas:
  - una sola pulsación inicia y completa la búsqueda;
  - la relevancia corrige un orden defectuoso de la fuente;
  - un error nuevo elimina controles pertenecientes al resultado anterior;
  - una consulta lenta no puede sobrescribir una consulta posterior;
  - el título no queda cubierto por la cabecera fija.
- Sin desbordamiento horizontal a 1440 px ni a 390 px en la prueba de navegador.
- Sin PHP, login, Railway, Bootstrap, Font Awesome ni credenciales administrativas.

## Errores corregidos en 2.1

- Una consulta nueva ya no conserva los botones, filtros, resúmenes o paginación de la anterior.
- “Compartir búsqueda” y “Cargar más resultados” quedan ocultos durante errores y consultas vacías.
- El botón de búsqueda no exige varios intentos: la aplicación reintenta automáticamente los fallos transitorios.
- Una búsqueda diferente cancela la anterior en lugar de ignorarse.
- Las respuestas antiguas que terminan tarde ya no pueden sobrescribir una consulta más reciente.
- El estado de carga solo puede cerrarlo la petición que lo abrió.
- El buscador de texto oficial heredado es ahora la primera opción; Search-a-licious funciona como respaldo.
- La ordenación inicial es por relevancia, no por estado vegano.
- El título de resultados ya no queda debajo de la cabecera fija.
- El texto y estado de los botones de favoritos se sincronizan correctamente.
- Cerrar el diálogo del escáner durante el inicio de cámara ya no puede dejar una cámara activa.
- El service worker utiliza red primero y versiones explícitas para evitar mezclar archivos antiguos y nuevos.

## Comprobaciones recomendadas después de publicar

Estas funciones dependen del navegador, el dispositivo y los servicios externos, por lo que deben verificarse en la URL HTTPS definitiva:

- respuesta en directo de Open Food Facts desde varias redes;
- comportamiento al alcanzar un límite temporal de consultas;
- permisos de cámara y compatibilidad de `BarcodeDetector`;
- instalación como PWA;
- actualización del service worker desde la versión 2.0;
- visualización en Safari iOS y Chrome Android.
