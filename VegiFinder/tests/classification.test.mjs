import assert from 'node:assert/strict';
import { classifyProduct, normalizeProduct, VEGAN_STATUS, uniqueProducts } from '../assets/js/classification.js';

const tests = [
  {
    name: 'confirma por análisis de ingredientes',
    product: { ingredients_analysis_tags: ['en:vegan'] },
    expected: VEGAN_STATUS.CONFIRMED
  },
  {
    name: 'confirma por etiqueta vegana',
    product: { labels_tags: ['es:vegano'] },
    expected: VEGAN_STATUS.CONFIRMED
  },
  {
    name: 'prioriza una señal no vegana aunque también haya etiqueta vegana',
    product: { ingredients_analysis_tags: ['en:non-vegan'], labels_tags: ['en:vegan'] },
    expected: VEGAN_STATUS.NOT_VEGAN
  },
  {
    name: 'mantiene incertidumbre sin datos',
    product: {},
    expected: VEGAN_STATUS.UNCERTAIN
  },
  {
    name: 'detecta estado vegano desconocido',
    product: { ingredients_analysis_tags: ['en:vegan-status-unknown'] },
    expected: VEGAN_STATUS.UNCERTAIN
  }
];

for (const test of tests) {
  assert.equal(classifyProduct(test.product).status, test.expected, test.name);
}

const normalized = normalizeProduct({
  code: '12345678',
  product_name_es: 'Producto de prueba',
  brands: 'Marca',
  ingredients_analysis_tags: ['en:vegan']
});
assert.equal(normalized.name, 'Producto de prueba');
assert.equal(normalized.classification.status, VEGAN_STATUS.CONFIRMED);
assert.match(normalized.sourceUrl, /12345678/);

assert.equal(uniqueProducts([normalized, normalized]).length, 1, 'elimina productos duplicados');

const relevantPotato = normalizeProduct({
  code: '200',
  product_name_es: 'Patatas fritas clásicas',
  brands: 'Marca A',
  ingredients_text_es: 'Patatas, aceite y sal'
}, { query: 'patatas', index: 5 });
const irrelevantOats = normalizeProduct({
  code: '201',
  product_name_es: 'Copos de avena',
  brands: 'Marca B',
  ingredients_text_es: 'Avena'
}, { query: 'patatas', index: 0 });
assert.ok(relevantPotato.relevance > irrelevantOats.relevance, 'prioriza coincidencias reales sobre el orden bruto de la API');
assert.equal(relevantPotato.sourceRank, 5, 'conserva la posición original como criterio de desempate');

console.log(`✓ ${tests.length + 6} comprobaciones superadas`);
