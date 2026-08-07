# VegiFinder 2.1

VegiFinder es una aplicación web estática que ayuda a comprobar productos por nombre, marca o código de barras. Consulta Open Food Facts y comunica el resultado con tres estados prudentes:

- **Vegano según los datos**: el análisis de ingredientes o una etiqueta registrada lo respaldan.
- **No se puede confirmar**: faltan datos o el estado es incierto.
- **No vegano**: existe una señal explícita de ingredientes o clasificación no vegana.

La aplicación no sustituye el etiquetado, una certificación ni el consejo médico.

## Cambios respecto al proyecto original

La versión anterior funcionaba como una lista de enlaces externos e incluía un login PHP incompatible con GitHub Pages. Esta reconstrucción:

- elimina `php/`, `login.html`, `login.php`, `gestor.html`, `lista.html`, `login.css` y el enlace privado de Railway;
- elimina Bootstrap, Font Awesome, Google Fonts y todo JavaScript duplicado;
- incorpora búsqueda real de productos y consulta exacta por código de barras;
- clasifica resultados sin convertir la falta de datos en una falsa confirmación;
- añade ingredientes, alérgenos, trazas, Nutri-Score, NOVA y fecha de actualización;
- añade filtros, ordenación, favoritos locales, historial reciente y enlaces para contrastar;
- descarta fuentes externas caídas en lugar de dirigir al usuario a páginas rotas;
- incorpora escáner progresivo con `BarcodeDetector` y alternativa manual;
- mejora responsive, accesibilidad, contraste, navegación por teclado y reducción de movimiento;
- añade SEO, Open Graph, sitemap, robots, páginas de metodología y privacidad;
- añade PWA, caché de archivos estáticos, iconos y página 404;
- añade 14 comprobaciones automáticas de clasificación, relevancia y recuperación de la API;
- corrige estados visuales obsoletos, respuestas tardías, reintentos y ordenación por relevancia.

## Estructura

```text
VegiFinder/
├── index.html
├── acerca.html
├── privacidad.html
├── 404.html
├── manifest.webmanifest
├── INFORME_QA.md
├── robots.txt
├── sitemap.xml
├── sw.js
├── assets/
│   ├── css/styles.css
│   ├── img/
│   └── js/
│       ├── api.js
│       ├── app.js
│       ├── classification.js
│       ├── scanner.js
│       ├── storage.js
│       └── theme-static.js
├── tests/classification.test.mjs
└── tests/api.test.mjs
```

## Ejecutar en local

Los módulos ES y el service worker necesitan un servidor HTTP; no abras `index.html` directamente con `file://`.

```bash
npm run serve
```

Después abre:

```text
http://localhost:5500
```

También puedes usar Live Server en VS Code.

## Pruebas

No hay dependencias que instalar:

```bash
npm test
```

## Publicar en GitHub Pages

Consulta también `MIGRACION.md` para sustituir la versión antigua sin conservar archivos incompatibles.


1. Haz una copia de seguridad de la carpeta `VegiFinder` actual.
2. Elimina su contenido antiguo.
3. Copia **el contenido de esta carpeta** dentro de `VegiFinder/` en el repositorio.
4. Confirma que existe el archivo `.nojekyll`.
5. Haz commit y push a `main`.
6. Comprueba `https://danielgavi1.github.io/VegiFinder/` y fuerza una recarga si el service worker anterior conserva archivos.

## Open Food Facts

### Endpoints utilizados

- Búsqueda de texto principal: endpoint oficial de texto completo `/cgi/search.pl`.
- Respaldo automático: Search-a-licious mediante `https://search.openfoodfacts.org/search` cuando el endpoint principal no responde.
- Código de barras: `/api/v3.6/product/{code}.json`.
- Una respuesta transitoria se reintenta automáticamente antes de mostrar un error.
- Las respuestas recientes se guardan temporalmente en `sessionStorage` para evitar repetir consultas.

La aplicación solo busca cuando el usuario envía el formulario; no implementa búsqueda mientras escribe. Esto ayuda a respetar los límites publicados por Open Food Facts.

### Identificación de la aplicación

Los navegadores no permiten modificar manualmente la cabecera `User-Agent`. Para una versión con tráfico importante, conviene desplegar un pequeño proxy propio —por ejemplo, una Cloudflare Worker— que:

1. añada un `User-Agent` identificativo;
2. aplique caché y límites por usuario;
3. desacople la aplicación de cambios futuros en los servicios externos;
4. permita monitorizar errores sin recopilar datos personales.

Antes de lanzar la aplicación públicamente, completa el formulario de uso de API de Open Food Facts y revisa sus condiciones de reutilización.

## Clasificación

La lógica está en `assets/js/classification.js` y sigue estas prioridades:

1. Una señal explícita **no vegana** prevalece sobre cualquier etiqueta contradictoria.
2. El análisis de ingredientes `vegan` confirma el estado con mayor confianza.
3. Una etiqueta vegana registrada confirma con confianza media.
4. La ausencia de datos o los estados desconocidos producen **No se puede confirmar**.

No se intenta deducir el origen de aditivos únicamente por su nombre.

## Privacidad

- Sin cuentas ni base de datos propia.
- Sin analítica ni publicidad.
- Favoritos, historial y tema en `localStorage`.
- Cámara activada únicamente bajo petición.
- El vídeo no se guarda ni se envía.
- Las consultas se realizan directamente a Open Food Facts.

## Licencias

- Código de VegiFinder: MIT.
- Base de datos Open Food Facts: ODbL.
- Contenidos individuales de la base: Database Contents License.
- Imágenes de Open Food Facts: Creative Commons Attribution-ShareAlike.

Los nombres comerciales y envases pertenecen a sus respectivos titulares.
