# Contribuir a VegiFinder

Gracias por ayudar a mejorar el proyecto.

## Antes de enviar cambios

1. Crea una rama descriptiva.
2. Mantén la aplicación sin dependencias innecesarias ni datos personales.
3. No conviertas la ausencia de información en una confirmación vegana.
4. Conserva la navegación por teclado, el contraste y los textos para lectores de pantalla.
5. Ejecuta:

```bash
npm test
find assets/js -name '*.js' -print0 | xargs -0 -n1 node --check
node --check sw.js
```

## Informar de datos incorrectos

Los datos de productos proceden de Open Food Facts. Las correcciones de ingredientes, imágenes o etiquetas deben realizarse en la ficha original para beneficiar también al resto de aplicaciones que reutilizan esa base.
