# Migración desde la versión anterior

## 1. Copia de seguridad

Descarga o crea una rama con el contenido actual de `VegiFinder/` antes de sustituirlo.

## 2. Archivos que deben desaparecer

No conserves los archivos de la versión antigua dentro de la carpeta publicada:

- `html/login.html`
- `html/lista.html`
- `html/gestor.html`
- `php/login.php`
- cualquier segundo `login.php`
- `css/login.css`
- el antiguo `css/style.css`
- el antiguo `js/index.js`
- el archivo de notas que enlazaba a la administración de Railway
- copias duplicadas de Bootstrap, Popper o Font Awesome

GitHub Pages no ejecuta PHP y VegiFinder 2.1 no necesita cuentas ni base de datos.

## 3. Sustitución

Vacía la carpeta `VegiFinder/` del repositorio y copia dentro **todo el contenido** de esta entrega, incluidos:

- `.nojekyll`
- `assets/`
- los HTML, el manifest, el service worker y la documentación

## 4. Comprobación local

```bash
npm test
npm run serve
```

Visita `http://localhost:5500` y prueba:

1. una búsqueda por nombre;
2. una búsqueda por código de barras;
3. los tres filtros de estado;
4. favoritos y tema oscuro;
5. el escáner en un dispositivo con HTTPS;
6. las páginas Acerca y Privacidad.

## 5. Publicación

Haz commit y push a `main`. Después abre la URL de GitHub Pages y realiza una recarga forzada. El nombre de la caché y las URL versionadas cambian en esta versión para evitar mezclar JavaScript antiguo y nuevo.

Si después del primer despliegue siguieras viendo la interfaz anterior:

1. realiza una recarga forzada con `Ctrl + F5`;
2. cierra y vuelve a abrir la pestaña;
3. como último recurso, abre DevTools → Application → Service Workers → **Unregister**, y recarga.
