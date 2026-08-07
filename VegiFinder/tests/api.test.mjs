import assert from 'node:assert/strict';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] ?? null; }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
  clear() { this.map.clear(); }
}

globalThis.sessionStorage = new MemoryStorage();

const { searchProducts } = await import('../assets/js/api.js');

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

async function testPrimarySuccess() {
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls += 1;
    assert.match(String(url), /world\.openfoodfacts\.org\/cgi\/search\.pl/);
    return jsonResponse({
      count: 1,
      page: 1,
      page_size: 24,
      products: [{
        code: '111',
        product_name_es: 'Tofu natural',
        brands: 'Prueba',
        ingredients_analysis_tags: ['en:vegan']
      }]
    });
  };

  const result = await searchProducts('tofu-test-unique');
  assert.equal(calls, 1);
  assert.equal(result.products.length, 1);
  assert.equal(result.source, 'Open Food Facts');
}

async function testAutomaticRetry() {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) return jsonResponse({}, 503);
    return jsonResponse({
      count: 1,
      page: 1,
      page_size: 24,
      products: [{
        code: '222',
        product_name_es: 'Patatas fritas',
        brands: 'Prueba',
        ingredients_analysis_tags: ['en:vegan']
      }]
    });
  };

  const messages = [];
  const result = await searchProducts('patatas-retry-unique', {
    onProgress: (message) => messages.push(message)
  });

  assert.equal(calls, 2, 'Debe reintentar automáticamente una respuesta 503');
  assert.equal(result.products[0].name, 'Patatas fritas');
  assert.ok(messages.some((message) => message.includes('Reintentando')));
}

async function testFallbackProvider() {
  let legacyCalls = 0;
  let fallbackCalls = 0;

  globalThis.fetch = async (url) => {
    const text = String(url);
    if (text.includes('/cgi/search.pl')) {
      legacyCalls += 1;
      throw new TypeError('network down');
    }
    if (text.includes('search.openfoodfacts.org/search')) {
      fallbackCalls += 1;
      return jsonResponse({
        count: 1,
        page: 1,
        page_size: 24,
        hits: [{
          code: '333',
          product_name: 'Chocolate negro',
          brands: 'Prueba',
          ingredients_analysis_tags: ['en:vegan']
        }]
      });
    }
    throw new Error(`URL inesperada: ${text}`);
  };

  const result = await searchProducts('chocolate-fallback-unique');
  assert.equal(legacyCalls, 2, 'El proveedor principal debe intentar una vez y reintentar una vez');
  assert.equal(fallbackCalls, 1, 'Después debe usar un único proveedor alternativo');
  assert.equal(result.source, 'Open Food Facts Search');
  assert.equal(result.products.length, 1);
}

await testPrimarySuccess();
await testAutomaticRetry();
await testFallbackProvider();
console.log('✓ 3 comprobaciones de API superadas');
