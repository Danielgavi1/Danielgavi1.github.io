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

function legacyPayload(name, code = '111') {
  return {
    count: name ? 1 : 0,
    page: 1,
    page_size: 24,
    products: name ? [{
      code,
      product_name_es: name,
      brands: 'Prueba',
      ingredients_analysis_tags: ['en:vegan']
    }] : []
  };
}

function searchPayload(name, code = '222') {
  return {
    count: name ? 1 : 0,
    page: 1,
    page_size: 24,
    hits: name ? [{
      code,
      product_name: name,
      brands: 'Prueba',
      ingredients_analysis_tags: ['en:vegan']
    }] : []
  };
}

async function testPrimarySuccess() {
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls += 1;
    assert.match(String(url), /world\.openfoodfacts\.org\/cgi\/search\.pl/);
    return jsonResponse(legacyPayload('Tofu natural'));
  };

  const result = await searchProducts('tofu-test-unique');
  assert.equal(calls, 1);
  assert.equal(result.products.length, 1);
  assert.equal(result.source, 'Open Food Facts');
}

async function testImmediateFallback() {
  let legacyCalls = 0;
  let fallbackCalls = 0;

  globalThis.fetch = async (url) => {
    const text = String(url);
    if (text.includes('/cgi/search.pl')) {
      legacyCalls += 1;
      return jsonResponse({}, 503);
    }
    if (text.includes('search.openfoodfacts.org/search')) {
      fallbackCalls += 1;
      return jsonResponse(searchPayload('Patatas fritas'));
    }
    throw new Error(`URL inesperada: ${text}`);
  };

  const result = await searchProducts('patatas-fallback-unique');
  assert.equal(legacyCalls, 1, 'No debe duplicar la misma petición antes de probar el proveedor alternativo');
  assert.equal(fallbackCalls, 1, 'Debe cambiar al proveedor alternativo en la misma búsqueda');
  assert.equal(result.products[0].name, 'Patatas fritas');
  assert.equal(result.source, 'Open Food Facts Search');
}

async function testSilentWholeSearchRetry() {
  let calls = 0;
  const messages = [];

  globalThis.fetch = async (url) => {
    calls += 1;
    const text = String(url);

    // Primera ronda completa: fallan los dos proveedores.
    if (calls <= 2) throw new TypeError('network down');

    // Segunda ronda: el orden se invierte y Search-a-licious responde.
    assert.match(text, /search\.openfoodfacts\.org\/search/);
    return jsonResponse(searchPayload('Chocolate negro', '333'));
  };

  const result = await searchProducts('chocolate-retry-round-unique', {
    onProgress: (message) => messages.push(message)
  });

  assert.equal(calls, 3, 'Después de fallar ambos proveedores debe iniciar otra ronda silenciosa');
  assert.equal(result.products[0].name, 'Chocolate negro');
  assert.ok(messages.some((message) => message.includes('Reintentando en segundo plano')));
}

async function testEmptyResponseIsNotAnError() {
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls += 1;
    return String(url).includes('/cgi/search.pl')
      ? jsonResponse(legacyPayload(null))
      : jsonResponse(searchPayload(null));
  };

  const result = await searchProducts('asd-empty-unique');
  assert.equal(calls, 2, 'El segundo proveedor confirma el resultado vacío sin activar rondas de error');
  assert.equal(result.products.length, 0);
  assert.equal(result.total, 0);
}

await testPrimarySuccess();
await testImmediateFallback();
await testSilentWholeSearchRetry();
await testEmptyResponseIsNotAnError();
console.log('✓ 4 comprobaciones de API superadas');
