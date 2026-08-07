const KEYS = Object.freeze({
  favorites: 'vegifinder:favorites:v2',
  recent: 'vegifinder:recent:v2',
  theme: 'vegifinder:theme:v2'
});

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // La aplicación continúa funcionando aunque el navegador bloquee localStorage.
  }
}

export function getFavorites() {
  const favorites = readJson(KEYS.favorites, []);
  return Array.isArray(favorites) ? favorites : [];
}

export function isFavorite(code) {
  return getFavorites().some((product) => product.code === code);
}

export function toggleFavorite(product) {
  const favorites = getFavorites();
  const index = favorites.findIndex((item) => item.code === product.code);

  if (index >= 0) {
    favorites.splice(index, 1);
    writeJson(KEYS.favorites, favorites);
    return false;
  }

  favorites.unshift(product);
  writeJson(KEYS.favorites, favorites.slice(0, 50));
  return true;
}

export function getRecentSearches() {
  const recent = readJson(KEYS.recent, []);
  return Array.isArray(recent) ? recent.filter((item) => typeof item === 'string') : [];
}

export function addRecentSearch(query) {
  const clean = String(query || '').trim();
  if (!clean) return;
  const recent = getRecentSearches().filter((item) => item.toLowerCase() !== clean.toLowerCase());
  recent.unshift(clean);
  writeJson(KEYS.recent, recent.slice(0, 6));
}

export function getStoredTheme() {
  try {
    return localStorage.getItem(KEYS.theme);
  } catch {
    return null;
  }
}

export function storeTheme(theme) {
  try {
    localStorage.setItem(KEYS.theme, theme);
  } catch {
    // Sin persistencia, el tema seguirá funcionando durante la sesión.
  }
}
