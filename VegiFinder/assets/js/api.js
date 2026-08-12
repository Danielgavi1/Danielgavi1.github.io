import { normalizeProduct, uniqueProducts } from './classification.js?v=2.2.0';

const PRODUCT_API_ORIGIN = 'https://world.openfoodfacts.org';
const SEARCH_API_ORIGIN = 'https://search.openfoodfacts.org';
const PAGE_SIZE = 24;
const FRESH_CACHE_TTL = 15 * 60 * 1000;
const STALE_CACHE_TTL = 24 * 60 * 60 * 1000;
const CACHE_PREFIX = 'vegifinder:api:v2.2:';
const MAX_STORED_RESPONSES = 18;
const memoryCache = new Map();

const PRODUCT_FIELDS = [
  'code',
  'product_name_es',
  'product_name',
  'generic_name_es',
  'generic_name',
  'brands',
  'quantity',
  'image_front_small_url',
  'image_front_url',
  'image_url',
  'ingredients_text_es',
  'ingredients_text',
  'ingredients_analysis_tags',
  'labels_tags',
  'allergens_tags',
  'traces_tags',
  'countries_tags',
  'nutrition_grades',
  'nutriscore_grade',
  'ecoscore_grade',
  'environmental_score_grade',
  'nova_group',
  'completeness',
  'last_modified_t'
];

const SEARCH_FIELDS = [
  'code',
  'product_name',
  'generic_name',
  'brands',
  'quantity',
  'ingredients_text',
  'ingredients_analysis_tags',
  'labels',
  'allergens',
  'traces',
  'countries',
  'nutrition_grades',
  'nutriscore_grade',
  'environmental_score_grade',
  'nova_group',
  'completeness',
  'last_modified_t',
  'selected_images',
  'image_front_small_url',
  'image_front_url',
  'image_url'
];

const TRANSIENT_STATUS = new Set([408, 425, 500, 502, 503, 504]);
const TEXT_SEARCH_ROUNDS = 3;
const TEXT_SEARCH_RETRY_DELAYS = [0, 900, 2200];

export class ApiError extends Error {
  constructor(message, {
    status = 0,
    cause = null,
    code = 'api-error',
    retryAfter = 0
  } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

function isBarcode(value) {
  return /^\d{8,14}$/.test(value.replace(/[\s-]/g, ''));
}

function escapeLuceneText(value) {
  return value.replace(/([+\-!(){}\[\]^"~*?:\\/]|&&|\|\|)/g, '\\$1');
}

function cacheKey(url) {
  let hash = 2166136261;
  for (let index = 0; index < url.length; index += 1) {
    hash ^= url.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${CACHE_PREFIX}${(hash >>> 0).toString(36)}`;
}

function readStoredCache(url) {
  const inMemory = memoryCache.get(url);
  if (inMemory) return inMemory;

  try {
    const raw = sessionStorage.getItem(cacheKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.url !== url || !Number.isFinite(parsed.timestamp)) return null;
    memoryCache.set(url, parsed);
    return parsed;
  } catch {
    return null;
  }
}

function pruneStoredCache() {
  try {
    const entries = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (!key?.startsWith(CACHE_PREFIX)) continue;
      try {
        const value = JSON.parse(sessionStorage.getItem(key));
        entries.push({ key, timestamp: Number(value?.timestamp) || 0 });
      } catch {
        sessionStorage.removeItem(key);
      }
    }

    entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(MAX_STORED_RESPONSES)
      .forEach(({ key }) => sessionStorage.removeItem(key));
  } catch {
    // El almacenamiento es una mejora opcional; la búsqueda sigue funcionando sin él.
  }
}

function writeStoredCache(url, data) {
  const entry = { url, data, timestamp: Date.now() };
  memoryCache.set(url, entry);

  try {
    sessionStorage.setItem(cacheKey(url), JSON.stringify(entry));
    pruneStoredCache();
  } catch {
    // Puede fallar por navegación privada o por cuota; mantenemos la caché en memoria.
  }
}

function delay(milliseconds, signal) {
  if (!milliseconds) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener('abort', cancel);
      resolve();
    };
    const timeoutId = globalThis.setTimeout(finish, milliseconds);
    const cancel = () => {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', cancel);
      reject(new DOMException('Búsqueda cancelada.', 'AbortError'));
    };

    if (signal?.aborted) {
      cancel();
      return;
    }

    signal?.addEventListener('abort', cancel, { once: true });
  });
}

function parseRetryAfter(response) {
  const value = response.headers.get('Retry-After');
  if (!value) return 0;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : 0;
}

function messageForStatus(status) {
  if (status === 429) {
    return 'Open Food Facts ha limitado temporalmente las consultas. Espera un minuto antes de volver a buscar.';
  }
  if (status === 503) {
    return 'Open Food Facts está temporalmente saturado. VegiFinder volverá a intentarlo automáticamente.';
  }
  return 'La fuente de datos no ha podido responder correctamente.';
}

async function fetchJson(url, {
  signal,
  timeout = 12000,
  retries = 0,
  onProgress,
  provider = 'Open Food Facts'
} = {}) {
  const cached = readStoredCache(url);
  const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
  if (cached && cacheAge < FRESH_CACHE_TTL) {
    return { data: cached.data, cacheState: 'fresh' };
  }

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (signal?.aborted) {
      throw new ApiError('Búsqueda cancelada.', { code: 'cancelled' });
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = globalThis.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);
    const abortFromParent = () => controller.abort();
    signal?.addEventListener('abort', abortFromParent, { once: true });

    if (attempt > 0) {
      onProgress?.(`Reintentando la consulta con ${provider}…`);
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store'
      });

      if (!response.ok) {
        const retryAfter = parseRetryAfter(response);
        const error = new ApiError(messageForStatus(response.status), {
          status: response.status,
          code: response.status === 429 ? 'rate-limit' : 'http-error',
          retryAfter
        });

        if (attempt < retries && TRANSIENT_STATUS.has(response.status)) {
          lastError = error;
          await delay(Math.max(retryAfter, 700 * (attempt + 1)), signal);
          continue;
        }

        throw error;
      }

      let data;
      try {
        data = await response.json();
      } catch (cause) {
        throw new ApiError('Open Food Facts ha devuelto una respuesta que no se ha podido interpretar.', {
          status: response.status,
          cause,
          code: 'invalid-json'
        });
      }

      writeStoredCache(url, data);
      return { data, cacheState: 'network' };
    } catch (error) {
      if (error instanceof ApiError) {
        lastError = error;
      } else if (signal?.aborted) {
        throw new ApiError('Búsqueda cancelada.', { cause: error, code: 'cancelled' });
      } else if (timedOut) {
        lastError = new ApiError('La consulta ha tardado demasiado.', {
          cause: error,
          code: 'timeout'
        });
      } else if (error?.name === 'AbortError') {
        lastError = new ApiError('La consulta ha sido interrumpida.', {
          cause: error,
          code: 'cancelled'
        });
      } else {
        lastError = new ApiError('No se ha podido conectar con Open Food Facts. Revisa tu conexión.', {
          cause: error,
          code: 'network'
        });
      }

      const canRetry = attempt < retries
        && lastError.code !== 'rate-limit'
        && lastError.code !== 'cancelled';

      if (canRetry) {
        await delay(700 * (attempt + 1), signal);
        continue;
      }
    } finally {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortFromParent);
    }
  }

  if (cached && cacheAge < STALE_CACHE_TTL) {
    return { data: cached.data, cacheState: 'stale', cacheError: lastError };
  }

  throw lastError || new ApiError('No se ha podido completar la consulta.');
}

function normalizeProducts(products, query) {
  return uniqueProducts((products || []).map((product, index) => normalizeProduct(product, { query, index })));
}

async function getByBarcode(rawBarcode, signal, onProgress) {
  const barcode = rawBarcode.replace(/[\s-]/g, '');
  const params = new URLSearchParams({ fields: PRODUCT_FIELDS.join(',') });
  const url = `${PRODUCT_API_ORIGIN}/api/v3.6/product/${encodeURIComponent(barcode)}.json?${params}`;

  onProgress?.('Consultando el código de barras…');
  const { data, cacheState } = await fetchJson(url, {
    signal,
    retries: 1,
    onProgress,
    provider: 'la ficha de producto'
  });
  const product = data.product || data.result?.product || null;

  return {
    products: product ? [normalizeProduct({ ...product, code: product.code || barcode }, { query: barcode, index: 0 })] : [],
    total: product ? 1 : 0,
    page: 1,
    pageSize: 1,
    mode: 'barcode',
    source: 'Open Food Facts',
    cacheState
  };
}

async function searchWithLegacyEndpoint(query, page, signal, onProgress) {
  const params = new URLSearchParams({
    action: 'process',
    json: '1',
    search_simple: '1',
    search_terms: query,
    page: String(page),
    page_size: String(PAGE_SIZE),
    fields: PRODUCT_FIELDS.join(','),
    lc: 'es',
    cc: 'es'
  });

  onProgress?.('Buscando productos en Open Food Facts…');
  const { data, cacheState, cacheError } = await fetchJson(`${PRODUCT_API_ORIGIN}/cgi/search.pl?${params}`, {
    signal,
    retries: 0,
    onProgress,
    provider: 'Open Food Facts'
  });
  const products = normalizeProducts(data.products, query);

  return {
    products,
    total: Number(data.count) || products.length,
    page: Number(data.page) || page,
    pageSize: Number(data.page_size) || PAGE_SIZE,
    mode: 'text',
    source: 'Open Food Facts',
    cacheState,
    warning: cacheState === 'stale'
      ? `Se muestran datos guardados porque la fuente no respondió (${cacheError?.message || 'error temporal'}).`
      : ''
  };
}

async function searchWithSearchALicious(query, page, signal, onProgress) {
  const params = new URLSearchParams({
    q: escapeLuceneText(query),
    page: String(page),
    page_size: String(PAGE_SIZE),
    langs: 'es,en',
    boost_phrase: 'true',
    fields: SEARCH_FIELDS.join(',')
  });

  onProgress?.('Probando el buscador alternativo de Open Food Facts…');
  const { data, cacheState, cacheError } = await fetchJson(`${SEARCH_API_ORIGIN}/search?${params}`, {
    signal,
    retries: 0,
    onProgress,
    provider: 'el buscador alternativo'
  });

  if (Array.isArray(data.errors) && data.errors.length) {
    throw new ApiError(data.errors[0]?.description || 'El buscador alternativo no ha podido completar la consulta.', {
      status: Number(data.errors[0]?.status) || 400,
      code: 'provider-error'
    });
  }

  const products = normalizeProducts(data.hits, query);

  return {
    products,
    total: Number(data.count) || products.length,
    page: Number(data.page) || page,
    pageSize: Number(data.page_size) || PAGE_SIZE,
    mode: 'text',
    source: 'Open Food Facts Search',
    cacheState,
    warning: cacheState === 'stale'
      ? `Se muestran datos guardados porque la fuente no respondió (${cacheError?.message || 'error temporal'}).`
      : 'Se ha utilizado el buscador alternativo de Open Food Facts.'
  };
}

function isCancelledError(error, signal) {
  return Boolean(signal?.aborted || error?.code === 'cancelled' || error?.name === 'AbortError');
}

function isRateLimitError(error) {
  return error?.status === 429 || error?.code === 'rate-limit';
}

function shouldRetrySearchRound(errors) {
  return errors.some((error) => {
    if (!(error instanceof ApiError)) return true;
    if (isRateLimitError(error) || error.code === 'validation' || error.code === 'cancelled') return false;
    return error.status === 0 || TRANSIENT_STATUS.has(error.status) || ['network', 'timeout', 'invalid-json', 'provider-error', 'http-error'].includes(error.code);
  });
}

async function searchByText(query, page, signal, onProgress) {
  let lastErrors = [];

  for (let round = 0; round < TEXT_SEARCH_ROUNDS; round += 1) {
    if (signal?.aborted) {
      throw new ApiError('Búsqueda cancelada.', { code: 'cancelled' });
    }

    if (round > 0) {
      onProgress?.('La fuente ha fallado temporalmente. Reintentando en segundo plano…');
      await delay(TEXT_SEARCH_RETRY_DELAYS[round] || 0, signal);
    }

    const providers = round % 2 === 0
      ? [searchWithLegacyEndpoint, searchWithSearchALicious]
      : [searchWithSearchALicious, searchWithLegacyEndpoint];

    const roundErrors = [];
    let emptyResult = null;

    for (const provider of providers) {
      try {
        const result = await provider(query, page, signal, onProgress);

        // Un HTTP 200 con cero productos es una respuesta válida: permite que
        // el segundo proveedor confirme el vacío, pero nunca lo trata como error.
        if (result.products.length === 0) {
          emptyResult ||= result;
          continue;
        }

        return result;
      } catch (error) {
        if (isCancelledError(error, signal)) throw error;
        roundErrors.push(error);
      }
    }

    if (emptyResult) return emptyResult;

    lastErrors = roundErrors;
    const rateLimitError = roundErrors.find(isRateLimitError);
    if (rateLimitError) throw rateLimitError;

    if (round === TEXT_SEARCH_ROUNDS - 1 || !shouldRetrySearchRound(roundErrors)) break;
  }

  const lastError = lastErrors.at(-1);
  const status = lastErrors.find((error) => Number(error?.status) > 0)?.status || 0;
  const retryAfter = Math.max(0, ...lastErrors.map((error) => Number(error?.retryAfter) || 0));

  throw new ApiError(
    'No se ha podido completar la búsqueda después de varios intentos automáticos. Puedes reintentar o consultar las fuentes externas.',
    {
      status,
      retryAfter,
      code: 'all-providers-failed',
      cause: lastError || null
    }
  );
}

export async function searchProducts(rawQuery, {
  page = 1,
  signal,
  onProgress
} = {}) {
  const query = String(rawQuery || '').trim();
  if (!query) throw new ApiError('Escribe un producto, una marca o un código de barras.', { code: 'validation' });

  return isBarcode(query)
    ? getByBarcode(query, signal, onProgress)
    : searchByText(query, page, signal, onProgress);
}

export function buildExternalSources(query) {
  const cleanQuery = String(query || '').trim();
  const encoded = encodeURIComponent(cleanQuery);

  return [
    {
      name: 'Open Food Facts',
      description: 'Ficha completa, ingredientes y datos colaborativos.',
      url: `https://es.openfoodfacts.org/cgi/search.pl?search_terms=${encoded}&search_simple=1&action=process`
    },
    {
      name: 'Vegano por Accidente Spain',
      description: 'Productos de consumo habitual que pueden ser veganos.',
      url: `https://www.veganoporaccidentespain.com/?s=${encoded}`
    },
    {
      name: 'Superveggie',
      description: 'Directorio de productos, supermercados y restaurantes.',
      url: `https://superveggie.es/?s=${encoded}`
    },
    {
      name: 'Barnivore',
      description: 'Comprobación específica de cerveza, vino y otras bebidas alcohólicas.',
      url: `https://www.barnivore.com/search?keyword=${encoded}`
    }
  ];
}
