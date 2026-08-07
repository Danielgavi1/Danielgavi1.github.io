export const VEGAN_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  NOT_VEGAN: 'not-vegan',
  UNCERTAIN: 'uncertain'
});

const asArray = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(asArray);
  if (typeof value === 'string') return value.trim() ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
  if (typeof value === 'number' || typeof value === 'boolean') return [String(value)];
  if (typeof value === 'object') {
    const direct = value.key ?? value.id ?? value.tag ?? value.name;
    if (typeof direct === 'string') return [direct];
    return Object.values(value).flatMap(asArray);
  }
  return [];
};

const normalizeTag = (tag) => String(tag || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/^([a-z]{2,3}):/, '')
  .replace(/_/g, '-');

const containsAny = (tags, needles) => tags.some((tag) => needles.some((needle) => tag.includes(needle)));

export function classifyProduct(product = {}) {
  const analysisTags = asArray(product.ingredients_analysis_tags ?? product.ingredients_analysis).map(normalizeTag);
  const labelTags = asArray(product.labels_tags ?? product.labels).map(normalizeTag);
  const allTags = [...analysisTags, ...labelTags];

  const nonVegan = containsAny(allTags, [
    'non-vegan',
    'not-vegan',
    'no-vegano',
    'no-vegan'
  ]);

  if (nonVegan) {
    return {
      status: VEGAN_STATUS.NOT_VEGAN,
      label: 'No vegano',
      shortLabel: 'No vegano',
      reason: 'La información disponible señala ingredientes o una clasificación no vegana.',
      confidence: 'high'
    };
  }

  const analysisConfirmsVegan = analysisTags.some((tag) => [
    'vegan',
    'vegano',
    'vegan-ingredients'
  ].includes(tag));

  if (analysisConfirmsVegan) {
    return {
      status: VEGAN_STATUS.CONFIRMED,
      label: 'Vegano según los datos',
      shortLabel: 'Vegano',
      reason: 'El análisis de ingredientes de Open Food Facts figura como vegano.',
      confidence: 'high'
    };
  }

  const veganLabel = labelTags.some((tag) => [
    'vegan',
    'vegano',
    'certified-vegan',
    'vegan-society',
    'v-label-vegan'
  ].includes(tag));

  if (veganLabel) {
    return {
      status: VEGAN_STATUS.CONFIRMED,
      label: 'Etiquetado como vegano',
      shortLabel: 'Vegano',
      reason: 'El producto contiene una etiqueta vegana en la base de datos.',
      confidence: 'medium'
    };
  }

  const explicitlyUnknown = containsAny(allTags, [
    'maybe-vegan',
    'may-be-vegan',
    'vegan-status-unknown',
    'unknown-vegan-status',
    'vegetarian-status-unknown'
  ]);

  return {
    status: VEGAN_STATUS.UNCERTAIN,
    label: 'No se puede confirmar',
    shortLabel: 'Sin confirmar',
    reason: explicitlyUnknown
      ? 'La propia base de datos indica que el estado vegano es incierto.'
      : 'Faltan datos suficientes para confirmar si el producto es vegano.',
    confidence: 'low'
  };
}

const firstText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const text = value.filter((item) => typeof item === 'string' && item.trim()).join(', ').trim();
      if (text) return text;
    }
    if (value && typeof value === 'object') {
      for (const key of ['es', 'main', 'en', 'name']) {
        const text = firstText(value[key]);
        if (text) return text;
      }
    }
  }
  return '';
};

function selectedImage(product = {}) {
  const front = product.selected_images?.front;
  if (!front || typeof front !== 'object') return '';

  for (const size of ['small', 'display', 'thumb']) {
    const variants = front[size];
    if (!variants || typeof variants !== 'object') continue;
    const url = variants.es ?? variants.main ?? variants.en ?? Object.values(variants).find((item) => typeof item === 'string');
    if (typeof url === 'string' && url.trim()) return url.trim();
  }
  return '';
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function calculateRelevance({ query, name, genericName, brands, ingredients, sourceRank }) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return Math.max(0, 20 - sourceRank * 0.15);

  const tokens = normalizedQuery.split(/\s+/).filter((token) => token.length > 1);
  const normalizedName = normalizeSearchText(name);
  const normalizedGeneric = normalizeSearchText(genericName);
  const normalizedBrands = normalizeSearchText(brands);
  const normalizedIngredients = normalizeSearchText(ingredients);

  let score = Math.max(0, 22 - sourceRank * 0.2);

  if (normalizedName === normalizedQuery) score += 180;
  else if (normalizedName.startsWith(normalizedQuery)) score += 135;
  else if (normalizedName.includes(normalizedQuery)) score += 115;

  if (normalizedGeneric.includes(normalizedQuery)) score += 75;
  if (normalizedBrands === normalizedQuery) score += 105;
  else if (normalizedBrands.includes(normalizedQuery)) score += 65;

  const nameTokenMatches = tokens.filter((token) => normalizedName.includes(token)).length;
  const genericTokenMatches = tokens.filter((token) => normalizedGeneric.includes(token)).length;
  const brandTokenMatches = tokens.filter((token) => normalizedBrands.includes(token)).length;
  const ingredientTokenMatches = tokens.filter((token) => normalizedIngredients.includes(token)).length;

  score += nameTokenMatches * 32;
  score += genericTokenMatches * 18;
  score += brandTokenMatches * 20;
  score += Math.min(ingredientTokenMatches, 2) * 5;

  if (tokens.length && nameTokenMatches === tokens.length) score += 55;
  return score;
}

export function normalizeProduct(product = {}, { query = '', index = 0 } = {}) {
  const code = String(product.code || product._id || '').trim();
  const classification = classifyProduct(product);
  const name = firstText(product.product_name_es, product.product_name, product.generic_name_es, product.generic_name) || 'Producto sin nombre';
  const genericName = firstText(product.generic_name_es, product.generic_name);
  const brands = firstText(product.brands) || 'Marca no indicada';
  const ingredients = firstText(product.ingredients_text_es, product.ingredients_text);

  return {
    code,
    name,
    genericName,
    brands,
    quantity: firstText(product.quantity),
    imageUrl: firstText(product.image_front_small_url, product.image_front_url, product.image_url, selectedImage(product)),
    ingredients,
    allergens: asArray(product.allergens_tags ?? product.allergens).map(normalizeTag),
    traces: asArray(product.traces_tags ?? product.traces).map(normalizeTag),
    labels: asArray(product.labels_tags ?? product.labels).map(normalizeTag),
    countries: asArray(product.countries_tags ?? product.countries).map(normalizeTag),
    nutritionGrade: firstText(product.nutrition_grades, product.nutriscore_grade).toLowerCase(),
    ecoScore: firstText(product.ecoscore_grade, product.environmental_score_grade).toLowerCase(),
    novaGroup: Number(product.nova_group) || null,
    completeness: Number(product.completeness) || 0,
    lastModified: Number(product.last_modified_t) || null,
    sourceRank: Number(index) || 0,
    relevance: calculateRelevance({ query, name, genericName, brands, ingredients, sourceRank: Number(index) || 0 }),
    classification,
    sourceUrl: code ? `https://world.openfoodfacts.org/product/${encodeURIComponent(code)}` : 'https://world.openfoodfacts.org/'
  };
}

export function uniqueProducts(products = []) {
  const seen = new Set();
  return products.filter((product) => {
    const key = product.code || `${product.name}|${product.brands}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
