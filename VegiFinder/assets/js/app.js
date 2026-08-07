import { searchProducts, buildExternalSources, ApiError } from './api.js?v=2.1.0';
import { VEGAN_STATUS, uniqueProducts } from './classification.js?v=2.1.0';
import {
  addRecentSearch,
  getFavorites,
  getRecentSearches,
  getStoredTheme,
  isFavorite,
  storeTheme,
  toggleFavorite
} from './storage.js?v=2.1.0';
import { createBarcodeScanner } from './scanner.js?v=2.1.0';

const dom = {
  searchForm: document.querySelector('#search-form'),
  searchInput: document.querySelector('#search-input'),
  searchButton: document.querySelector('#search-submit'),
  scanButton: document.querySelector('#scan-button'),
  resultsSection: document.querySelector('#results'),
  resultsTitle: document.querySelector('#results-title'),
  resultsMeta: document.querySelector('#results-meta'),
  resultsSummary: document.querySelector('#results-summary'),
  resultsToolbar: document.querySelector('#results-toolbar'),
  resultsGrid: document.querySelector('#products-grid'),
  loading: document.querySelector('#loading-state'),
  loadingMessage: document.querySelector('#loading-message'),
  error: document.querySelector('#error-state'),
  errorMessage: document.querySelector('#error-message'),
  retryButton: document.querySelector('#retry-search'),
  notice: document.querySelector('#results-notice'),
  noticeMessage: document.querySelector('#results-notice-message'),
  empty: document.querySelector('#empty-state'),
  emptyTitle: document.querySelector('#empty-title'),
  emptyMessage: document.querySelector('#empty-message'),
  loadMore: document.querySelector('#load-more'),
  statusFilter: document.querySelector('#status-filter'),
  sortSelect: document.querySelector('#sort-select'),
  externalSection: document.querySelector('#external-sources'),
  externalGrid: document.querySelector('#external-grid'),
  recentList: document.querySelector('#recent-list'),
  recentWrapper: document.querySelector('#recent-searches'),
  favoritesSection: document.querySelector('#favorites'),
  favoritesGrid: document.querySelector('#favorites-grid'),
  clearFavorites: document.querySelector('#clear-favorites'),
  themeToggle: document.querySelector('#theme-toggle'),
  shareButton: document.querySelector('#share-search'),
  productDialog: document.querySelector('#product-dialog'),
  productDialogContent: document.querySelector('#product-dialog-content'),
  scannerDialog: document.querySelector('#scanner-dialog'),
  scannerVideo: document.querySelector('#scanner-video'),
  scannerStatus: document.querySelector('#scanner-status'),
  scannerManualForm: document.querySelector('#manual-barcode-form'),
  scannerManualInput: document.querySelector('#manual-barcode'),
  toast: document.querySelector('#toast'),
  year: document.querySelector('#current-year')
};

const state = {
  query: '',
  products: [],
  total: 0,
  page: 1,
  pageSize: 24,
  mode: 'text',
  source: 'Open Food Facts',
  loading: false,
  activeQuery: '',
  abortController: null,
  requestSequence: 0,
  activeRequestId: 0,
  hasMore: false
};

const STATUS_ORDER = {
  [VEGAN_STATUS.CONFIRMED]: 0,
  [VEGAN_STATUS.UNCERTAIN]: 1,
  [VEGAN_STATUS.NOT_VEGAN]: 2
};

const statusMeta = {
  [VEGAN_STATUS.CONFIRMED]: { icon: '✓', className: 'status--confirmed' },
  [VEGAN_STATUS.UNCERTAIN]: { icon: '?', className: 'status--uncertain' },
  [VEGAN_STATUS.NOT_VEGAN]: { icon: '!', className: 'status--not-vegan' }
};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.hidden = false;
  globalThis.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = globalThis.setTimeout(() => {
    dom.toast.hidden = true;
  }, 2800);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  dom.themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro');
  dom.themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  dom.themeToggle.querySelector('[data-theme-icon]').textContent = theme === 'dark' ? '☀' : '☾';
  storeTheme(theme);
}

function initTheme() {
  const stored = getStoredTheme();
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  setTheme(stored === 'dark' || stored === 'light' ? stored : preferred);
}

function formatList(tags, fallback = 'No indicado') {
  if (!tags?.length) return fallback;
  return tags
    .map((tag) => tag.replace(/-/g, ' '))
    .map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1))
    .join(', ');
}

function truncate(text, max = 155) {
  if (!text) return 'Ingredientes no disponibles.';
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function formatDate(timestamp) {
  if (!timestamp) return 'Fecha no disponible';
  try {
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(timestamp * 1000));
  } catch {
    return 'Fecha no disponible';
  }
}

function createStatusBadge(classification) {
  const meta = statusMeta[classification.status];
  const badge = createElement('span', `status-badge ${meta.className}`);
  badge.append(createElement('span', 'status-badge__icon', meta.icon));
  badge.append(document.createTextNode(classification.shortLabel));
  badge.title = classification.reason;
  return badge;
}

function handleImageError(event) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = './assets/img/product-placeholder.svg';
  image.alt = '';
  if (image.classList.contains('product-card__image')) {
    image.classList.add('product-card__image--placeholder');
  }
}

function updateFavoriteButton(button, product, active) {
  const labelled = button.dataset.favoriteStyle === 'label';
  button.classList.toggle('is-active', active);
  button.setAttribute('aria-pressed', String(active));
  button.setAttribute('aria-label', active ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`);
  button.textContent = labelled
    ? (active ? '★ Guardado' : '☆ Guardar')
    : (active ? '★' : '☆');
}

function createFavoriteButton(product, { compact = false, labelled = false } = {}) {
  const button = createElement('button', compact ? 'icon-button favorite-button' : 'favorite-button');
  button.type = 'button';
  button.disabled = !product.code;
  button.dataset.favoriteCode = product.code || '';
  button.dataset.favoriteName = product.name;
  button.dataset.favoriteStyle = labelled ? 'label' : 'icon';
  updateFavoriteButton(button, product, Boolean(product.code) && isFavorite(product.code));

  button.addEventListener('click', () => {
    if (!product.code) return;
    const saved = toggleFavorite(product);
    syncFavoriteButtons(product.code, saved);
    renderFavorites();
    showToast(saved ? 'Producto guardado en favoritos.' : 'Producto eliminado de favoritos.');
  });

  return button;
}

function syncFavoriteButtons(code, saved) {
  if (!code) return;
  document.querySelectorAll(`[data-favorite-code="${CSS.escape(code)}"]`).forEach((button) => {
    const product = { code, name: button.dataset.favoriteName || 'este producto' };
    updateFavoriteButton(button, product, saved);
  });
}

function createProductCard(product) {
  const article = createElement('article', 'product-card');
  article.dataset.status = product.classification.status;

  const media = createElement('div', 'product-card__media');
  const image = document.createElement('img');
  image.className = 'product-card__image';
  image.src = product.imageUrl || './assets/img/product-placeholder.svg';
  image.alt = product.imageUrl ? `Envase de ${product.name}` : '';
  image.width = 320;
  image.height = 260;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.addEventListener('error', handleImageError);
  media.append(image);
  media.append(createFavoriteButton(product, { compact: true }));

  const body = createElement('div', 'product-card__body');
  body.append(createStatusBadge(product.classification));
  body.append(createElement('h3', 'product-card__title', product.name));
  body.append(createElement('p', 'product-card__brand', [product.brands, product.quantity].filter(Boolean).join(' · ')));
  body.append(createElement('p', 'product-card__ingredients', truncate(product.ingredients)));

  const facts = createElement('div', 'product-card__facts');
  if (product.nutritionGrade) facts.append(createElement('span', 'fact-chip', `Nutri-Score ${product.nutritionGrade.toUpperCase()}`));
  if (product.novaGroup) facts.append(createElement('span', 'fact-chip', `NOVA ${product.novaGroup}`));
  if (product.code) facts.append(createElement('span', 'fact-chip fact-chip--muted', product.code));
  body.append(facts);

  const actions = createElement('div', 'product-card__actions');
  const detailsButton = createElement('button', 'button button--primary button--small', 'Ver detalles');
  detailsButton.type = 'button';
  detailsButton.addEventListener('click', () => openProductDialog(product));
  actions.append(detailsButton);

  const sourceLink = createElement('a', 'button button--ghost button--small', 'Ver fuente ↗');
  sourceLink.href = product.sourceUrl;
  sourceLink.target = '_blank';
  sourceLink.rel = 'noopener noreferrer';
  sourceLink.setAttribute('aria-label', `Ver ${product.name} en Open Food Facts, se abre en una pestaña nueva`);
  actions.append(sourceLink);
  body.append(actions);

  article.append(media, body);
  return article;
}

function filteredAndSortedProducts() {
  const filter = dom.statusFilter.value;
  const sort = dom.sortSelect.value;
  const products = filter === 'all'
    ? [...state.products]
    : state.products.filter((product) => product.classification.status === filter);

  if (sort === 'relevance') {
    products.sort((a, b) =>
      (b.relevance - a.relevance)
      || (b.completeness - a.completeness)
      || (a.sourceRank - b.sourceRank));
  } else if (sort === 'status') {
    products.sort((a, b) =>
      (STATUS_ORDER[a.classification.status] - STATUS_ORDER[b.classification.status])
      || (b.relevance - a.relevance));
  } else if (sort === 'name') {
    products.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  } else if (sort === 'completeness') {
    products.sort((a, b) => (b.completeness - a.completeness) || (b.relevance - a.relevance));
  }

  return products;
}

function renderSummary() {
  const counts = state.products.reduce((acc, product) => {
    acc[product.classification.status] += 1;
    return acc;
  }, {
    [VEGAN_STATUS.CONFIRMED]: 0,
    [VEGAN_STATUS.UNCERTAIN]: 0,
    [VEGAN_STATUS.NOT_VEGAN]: 0
  });

  dom.resultsSummary.replaceChildren();
  const summaryItems = [
    ['Confirmados', counts[VEGAN_STATUS.CONFIRMED], 'summary-card--confirmed'],
    ['Sin confirmar', counts[VEGAN_STATUS.UNCERTAIN], 'summary-card--uncertain'],
    ['No veganos', counts[VEGAN_STATUS.NOT_VEGAN], 'summary-card--not-vegan']
  ];

  summaryItems.forEach(([label, value, className]) => {
    const item = createElement('div', `summary-card ${className}`);
    item.append(createElement('strong', 'summary-card__value', String(value)));
    item.append(createElement('span', 'summary-card__label', label));
    dom.resultsSummary.append(item);
  });

  dom.resultsSummary.hidden = state.products.length === 0;
}

function renderProducts() {
  const products = filteredAndSortedProducts();
  dom.resultsGrid.replaceChildren(...products.map(createProductCard));
  dom.resultsToolbar.hidden = state.products.length === 0;

  if (state.products.length === 0) {
    dom.empty.hidden = true;
  } else if (products.length === 0) {
    dom.emptyTitle.textContent = 'No hay productos con este filtro';
    dom.emptyMessage.textContent = 'Cambia el estado seleccionado para volver a mostrar los resultados cargados.';
    dom.empty.hidden = false;
  } else {
    dom.empty.hidden = true;
  }

  dom.loadMore.hidden = !state.hasMore;
  dom.loadMore.disabled = state.loading;
}

function updateResultsHeader() {
  dom.resultsTitle.textContent = state.query ? `Resultados para “${state.query}”` : 'Resultados';
  const loaded = state.products.length;
  const totalText = state.total > loaded
    ? `${loaded} mostrados de ${state.total.toLocaleString('es-ES')}`
    : `${loaded} resultado${loaded === 1 ? '' : 's'}`;
  const ordering = dom.sortSelect.value === 'relevance' ? 'Ordenados por relevancia.' : 'Puedes cambiar el orden con los controles inferiores.';
  dom.resultsMeta.textContent = `${totalText}. ${ordering}`;
}

function setSearchBusy(loading, { append = false, message = '' } = {}) {
  state.loading = loading;
  dom.searchInput.setAttribute('aria-busy', String(loading));
  dom.searchForm.setAttribute('aria-busy', String(loading));
  dom.searchButton.classList.toggle('is-loading', loading && !append);
  dom.searchButton.textContent = loading && !append ? 'Buscando…' : 'Buscar';
  dom.loading.hidden = !loading || append;
  dom.loadingMessage.textContent = message || 'Consultando productos…';
  dom.loadMore.disabled = loading;
  if (append) dom.loadMore.textContent = loading ? 'Cargando…' : 'Cargar más resultados';
}

function resetResultsForSearch(query) {
  state.query = query;
  state.page = 1;
  state.products = [];
  state.total = 0;
  state.mode = 'text';
  state.source = 'Open Food Facts';
  state.hasMore = false;
  resetRetryButton();

  dom.resultsSection.hidden = false;
  dom.resultsTitle.textContent = `Buscando “${query}”`;
  dom.resultsMeta.textContent = 'Preparando la consulta…';
  dom.resultsGrid.replaceChildren();
  dom.resultsSummary.replaceChildren();
  dom.resultsSummary.hidden = true;
  dom.resultsToolbar.hidden = true;
  dom.statusFilter.value = 'all';
  dom.sortSelect.value = 'relevance';
  dom.error.hidden = true;
  dom.notice.hidden = true;
  dom.empty.hidden = true;
  dom.shareButton.hidden = true;
  dom.loadMore.hidden = true;
  dom.loadMore.textContent = 'Cargar más resultados';
}

function showResultsNotice(message) {
  dom.noticeMessage.textContent = message;
  dom.notice.hidden = !message;
}

function renderExternalSources(query) {
  dom.externalGrid.replaceChildren();
  buildExternalSources(query).forEach((source) => {
    const link = createElement('a', 'source-card');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Buscar ${query} en ${source.name}, se abre en una pestaña nueva`);
    link.append(createElement('strong', 'source-card__title', source.name));
    link.append(createElement('span', 'source-card__description', source.description));
    link.append(createElement('span', 'source-card__action', `Buscar “${query}” ↗`));
    dom.externalGrid.append(link);
  });
  dom.externalSection.hidden = !query;
}

function renderRecentSearches() {
  const searches = getRecentSearches();
  dom.recentList.replaceChildren();
  dom.recentWrapper.hidden = searches.length === 0;

  searches.forEach((query) => {
    const button = createElement('button', 'chip-button', query);
    button.type = 'button';
    button.addEventListener('click', () => {
      dom.searchInput.value = query;
      performSearch(query);
    });
    dom.recentList.append(button);
  });
}

function createFavoriteCard(product) {
  const article = createElement('article', 'favorite-card');
  const image = document.createElement('img');
  image.className = 'favorite-card__image';
  image.src = product.imageUrl || './assets/img/product-placeholder.svg';
  image.alt = '';
  image.width = 76;
  image.height = 76;
  image.loading = 'lazy';
  image.addEventListener('error', handleImageError);

  const content = createElement('div', 'favorite-card__content');
  content.append(createElement('strong', 'favorite-card__title', product.name));
  content.append(createElement('span', 'favorite-card__brand', product.brands));
  content.append(createStatusBadge(product.classification));

  const actions = createElement('div', 'favorite-card__actions');
  const details = createElement('button', 'button button--ghost button--small', 'Detalles');
  details.type = 'button';
  details.addEventListener('click', () => openProductDialog(product));
  actions.append(details);
  actions.append(createFavoriteButton(product, { compact: true }));

  article.append(image, content, actions);
  return article;
}

function renderFavorites() {
  const favorites = getFavorites();
  dom.favoritesSection.hidden = favorites.length === 0;
  dom.favoritesGrid.replaceChildren(...favorites.map(createFavoriteCard));
}

function detailRow(term, value) {
  const row = createElement('div', 'detail-row');
  row.append(createElement('dt', 'detail-row__term', term));
  row.append(createElement('dd', 'detail-row__value', value || 'No indicado'));
  return row;
}

function openProductDialog(product) {
  const wrapper = createElement('div', 'product-detail');
  const image = document.createElement('img');
  image.className = 'product-detail__image';
  image.src = product.imageUrl || './assets/img/product-placeholder.svg';
  image.alt = product.imageUrl ? `Envase de ${product.name}` : '';
  image.width = 360;
  image.height = 360;
  image.addEventListener('error', handleImageError);

  const content = createElement('div', 'product-detail__content');
  content.append(createStatusBadge(product.classification));
  content.append(createElement('h2', 'product-detail__title', product.name));
  content.append(createElement('p', 'product-detail__brand', [product.brands, product.quantity].filter(Boolean).join(' · ')));
  content.append(createElement('p', 'product-detail__reason', product.classification.reason));

  const list = document.createElement('dl');
  list.className = 'detail-list';
  list.append(
    detailRow('Ingredientes', product.ingredients || 'No disponibles'),
    detailRow('Alérgenos', formatList(product.allergens)),
    detailRow('Posibles trazas', formatList(product.traces)),
    detailRow('Etiquetas', formatList(product.labels)),
    detailRow('Código de barras', product.code || 'No indicado'),
    detailRow('Última actualización', formatDate(product.lastModified))
  );
  content.append(list);

  const warning = createElement('div', 'notice notice--warning');
  warning.append(createElement('strong', '', 'Comprueba siempre el envase. '));
  warning.append(document.createTextNode('Las recetas y procesos de fabricación pueden cambiar, y la base de datos es colaborativa.'));
  content.append(warning);

  const actions = createElement('div', 'product-detail__actions');
  const source = createElement('a', 'button button--primary', 'Abrir ficha original ↗');
  source.href = product.sourceUrl;
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  actions.append(source);
  const favorite = createFavoriteButton(product, { labelled: true });
  favorite.classList.add('button', 'button--ghost');
  actions.append(favorite);
  content.append(actions);

  wrapper.append(image, content);
  dom.productDialogContent.replaceChildren(wrapper);
  dom.productDialog.showModal();
}

function scrollToResults() {
  const header = document.querySelector('.site-header');
  const headerHeight = header?.getBoundingClientRect().height || 0;
  const top = dom.resultsSection.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' });
}

function validateQuery(rawQuery) {
  const query = String(rawQuery || '').trim().replace(/\s+/g, ' ');
  const isBarcode = /^\d{8,14}$/.test(query.replace(/[\s-]/g, ''));
  if (!query || (!isBarcode && query.length < 2)) {
    dom.searchInput.setCustomValidity('Escribe al menos dos caracteres o un código de barras válido.');
    dom.searchInput.reportValidity();
    dom.searchInput.setCustomValidity('');
    return '';
  }
  return query;
}

function resetRetryButton() {
  globalThis.clearInterval(resetRetryButton.intervalId);
  resetRetryButton.intervalId = null;
  dom.retryButton.disabled = false;
  dom.retryButton.textContent = 'Reintentar búsqueda';
}

function applyRetryCooldown(error) {
  resetRetryButton();
  if (!(error instanceof ApiError) || error.status !== 429) return;

  const endAt = Date.now() + Math.max(error.retryAfter || 0, 60_000);
  const update = () => {
    const seconds = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    dom.retryButton.disabled = seconds > 0;
    dom.retryButton.textContent = seconds > 0 ? `Reintentar en ${seconds} s` : 'Reintentar búsqueda';
    if (seconds === 0) resetRetryButton();
  };

  update();
  resetRetryButton.intervalId = globalThis.setInterval(update, 1000);
}

async function performSearch(rawQuery, { append = false } = {}) {
  const query = validateQuery(rawQuery);
  if (!query) return;

  if (append && (state.loading || !state.query || state.products.length === 0)) return;

  if (!append && state.loading && state.activeQuery.toLowerCase() === query.toLowerCase()) {
    showToast('La búsqueda ya está en curso. VegiFinder reintentará automáticamente si la fuente falla.');
    return;
  }

  state.abortController?.abort();
  const controller = new AbortController();
  const requestId = ++state.requestSequence;
  state.abortController = controller;
  state.activeRequestId = requestId;
  state.activeQuery = query;

  if (!append) {
    resetResultsForSearch(query);
    renderExternalSources(query);
    addRecentSearch(query);
    renderRecentSearches();

    const url = new URL(window.location.href);
    url.searchParams.set('q', query);
    history.replaceState(null, '', url);
    scrollToResults();
  } else {
    dom.error.hidden = true;
    dom.notice.hidden = true;
  }

  const progress = (message) => {
    if (requestId !== state.activeRequestId) return;
    dom.loadingMessage.textContent = message;
    if (!append) dom.resultsMeta.textContent = message;
  };

  setSearchBusy(true, { append, message: append ? 'Cargando más resultados…' : 'Consultando productos…' });

  try {
    const result = await searchProducts(query, {
      page: append ? state.page + 1 : 1,
      signal: controller.signal,
      onProgress: progress
    });

    if (requestId !== state.activeRequestId) return;

    const previousCount = state.products.length;
    state.page = result.page;
    state.total = result.total;
    state.pageSize = result.pageSize;
    state.mode = result.mode;
    state.source = result.source || 'Open Food Facts';
    state.products = append
      ? uniqueProducts([...state.products, ...result.products])
      : result.products;
    const addedProducts = state.products.length - previousCount;
    state.hasMore = result.mode === 'text'
      && result.products.length > 0
      && (!append || addedProducts > 0)
      && (result.page * result.pageSize < result.total);

    updateResultsHeader();
    renderSummary();
    renderProducts();
    dom.shareButton.hidden = false;
    showResultsNotice(result.warning || (result.cacheState === 'fresh' ? 'Resultados recuperados de la caché reciente para evitar consultas innecesarias.' : ''));

    if (state.products.length === 0) {
      dom.resultsToolbar.hidden = true;
      dom.resultsSummary.hidden = true;
      dom.emptyTitle.textContent = `No hemos encontrado “${query}”`;
      dom.emptyMessage.textContent = 'Prueba con la marca, una descripción más corta o el código de barras. También puedes consultar las fuentes externas.';
      dom.empty.hidden = false;
      dom.resultsMeta.textContent = 'Open Food Facts no ha devuelto productos para esta consulta.';
    }
  } catch (error) {
    if (requestId !== state.activeRequestId) return;
    if (error instanceof ApiError && error.code === 'cancelled') return;

    const message = error instanceof Error ? error.message : 'Se ha producido un error inesperado.';
    applyRetryCooldown(error);
    if (append && state.products.length > 0) {
      showToast('No se han podido cargar más resultados. Puedes volver a intentarlo.');
      dom.loadMore.hidden = false;
      dom.loadMore.disabled = false;
      showResultsNotice(message);
    } else {
      dom.errorMessage.textContent = message;
      dom.error.hidden = false;
      dom.empty.hidden = true;
      dom.resultsGrid.replaceChildren();
      dom.resultsSummary.hidden = true;
      dom.resultsToolbar.hidden = true;
      dom.loadMore.hidden = true;
      dom.shareButton.hidden = true;
      dom.resultsTitle.textContent = `No se pudo buscar “${query}”`;
      dom.resultsMeta.textContent = navigator.onLine
        ? 'La consulta ya se ha reintentado automáticamente. Puedes probar otra vez o usar las fuentes alternativas.'
        : 'Parece que no hay conexión a Internet.';
    }
  } finally {
    if (requestId === state.activeRequestId) {
      setSearchBusy(false, { append });
      state.activeQuery = '';
      state.abortController = null;
    }
  }
}

async function shareCurrentSearch() {
  const shareData = {
    title: 'VegiFinder',
    text: `Resultados de VegiFinder para “${state.query}”`,
    url: window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Enlace copiado al portapapeles.');
    }
  } catch (error) {
    if (error?.name !== 'AbortError') showToast('No se ha podido compartir el enlace.');
  }
}

function initDialogs() {
  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog')?.close());
  });

  [dom.productDialog, dom.scannerDialog].forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}

const scanner = createBarcodeScanner({
  video: dom.scannerVideo,
  statusElement: dom.scannerStatus,
  onDetected: (barcode) => {
    dom.scannerDialog.close();
    dom.searchInput.value = barcode;
    showToast(`Código detectado: ${barcode}`);
    performSearch(barcode);
  }
});

function initScanner() {
  dom.scanButton.addEventListener('click', async () => {
    dom.scannerManualInput.value = '';
    dom.scannerDialog.showModal();
    await scanner.start();
  });

  dom.scannerDialog.addEventListener('close', () => scanner.stop());
  dom.scannerManualForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const barcode = dom.scannerManualInput.value.replace(/[\s-]/g, '');
    if (!/^\d{8,14}$/.test(barcode)) {
      dom.scannerManualInput.setCustomValidity('Introduce entre 8 y 14 números.');
      dom.scannerManualInput.reportValidity();
      dom.scannerManualInput.setCustomValidity('');
      return;
    }
    scanner.stop();
    dom.scannerDialog.close();
    dom.searchInput.value = barcode;
    performSearch(barcode);
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !window.location.protocol.startsWith('http')) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
      await registration.update();
    } catch {
      // La aplicación sigue siendo funcional sin modo offline.
    }
  });
}

function initEvents() {
  dom.searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    performSearch(dom.searchInput.value);
  });
  dom.statusFilter.addEventListener('change', renderProducts);
  dom.sortSelect.addEventListener('change', () => {
    updateResultsHeader();
    renderProducts();
  });
  dom.loadMore.addEventListener('click', () => performSearch(state.query, { append: true }));
  dom.retryButton.addEventListener('click', () => performSearch(state.query || dom.searchInput.value));
  dom.shareButton.addEventListener('click', shareCurrentSearch);
  dom.themeToggle.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  dom.clearFavorites.addEventListener('click', () => {
    getFavorites().forEach((product) => toggleFavorite(product));
    renderFavorites();
    state.products.forEach((product) => syncFavoriteButtons(product.code, false));
    showToast('Favoritos eliminados.');
  });

  document.querySelectorAll('[data-search-example]').forEach((button) => {
    button.addEventListener('click', () => {
      const query = button.dataset.searchExample;
      dom.searchInput.value = query;
      performSearch(query);
    });
  });

  window.addEventListener('offline', () => showToast('Sin conexión. Las búsquedas nuevas necesitarán Internet.'));
  window.addEventListener('online', () => showToast('Conexión recuperada. Ya puedes volver a buscar.'));
}

function init() {
  initTheme();
  initEvents();
  initDialogs();
  initScanner();
  renderRecentSearches();
  renderFavorites();
  registerServiceWorker();
  dom.year.textContent = String(new Date().getFullYear());

  const initialQuery = new URL(window.location.href).searchParams.get('q');
  if (initialQuery) {
    dom.searchInput.value = initialQuery;
    performSearch(initialQuery);
  }
}

init();
