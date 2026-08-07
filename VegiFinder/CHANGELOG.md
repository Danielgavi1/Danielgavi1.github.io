# Historial de cambios

## 2.1.0 — 2026-08-03

- Corregido el reinicio incompleto de la interfaz entre búsquedas.
- Ocultación fiable de filtros, botones, avisos y estados que pertenecían a una consulta anterior.
- El buscador oficial heredado pasa a ser la fuente principal y Search-a-licious queda como respaldo.
- Reintento automático ante errores transitorios y recuperación desde caché reciente.
- Protección contra respuestas antiguas que llegan después de una búsqueda nueva.
- Una búsqueda diferente cancela correctamente la anterior; una repetida ya no provoca peticiones duplicadas.
- Botón de reintento y mensajes de progreso más claros.
- Ordenación por relevancia como opción predeterminada.
- Corregido el desplazamiento de resultados bajo la cabecera fija.
- Corregido el estado y texto de los botones de favoritos.
- Corregida una carrera al cerrar el escáner mientras la cámara se estaba iniciando.
- Service worker actualizado con estrategia network-first para evitar archivos obsoletos.
- Añadidas 3 pruebas automáticas de recuperación de API.

## 2.0.0 — 2026-08-02

- Reconstrucción completa como aplicación estática compatible con GitHub Pages.
- Búsqueda real por texto, marca y código de barras.
- Clasificación prudente en tres estados.
- Ingredientes, alérgenos, trazas, Nutri-Score, NOVA y fecha de actualización.
- Filtros, ordenación, favoritos, búsquedas recientes y enlaces de contraste.
- Escáner de código de barras con alternativa manual.
- Nueva interfaz responsive, accesible y con modo oscuro.
- SEO, PWA, página 404, metodología, privacidad y documentación.
- Eliminación del login PHP, la base de datos y las dependencias duplicadas.
- Pruebas unitarias y comprobaciones de sintaxis.
