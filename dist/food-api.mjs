// Browser-only Open Food Facts client. No secret, server, or hosting dependency.
const DAY = 86400000;
const DATA_KEY = 'duel-de-placard:data:v2';
const BUDGET_KEY = 'duel-de-placard:budget:v2';
const FIELDS = 'code,product_name,brands,image_front_url,image_front_small_url,nutriscore_grade,nova_group,nutriments,additives_n';
const nutrientKeys = ['sugars_100g', 'saturated-fat_100g', 'salt_100g', 'proteins_100g'];
export const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
export const isBarcode = value => /^\d{8,14}$/.test(String(value));
export class FoodError extends Error {
  constructor(kind, message, retryAt = 0) { super(message); this.kind = kind; this.retryAt = retryAt; }
}
function compact(product) {
  const p = {};
  for (const key of FIELDS.split(',').filter(k => k !== 'nutriments')) if (product[key] !== undefined) p[key] = product[key];
  p.code = String(p.code || '');
  p.nutriments = Object.fromEntries(nutrientKeys.filter(k => product.nutriments?.[k] !== undefined).map(k => [k, product.nutriments[k]]));
  return p;
}
export class FoodClient {
  constructor({fetcher = globalThis.fetch.bind(globalThis), storage = null, now = Date.now, pause = ms => new Promise(resolve => setTimeout(resolve, ms)), random = Math.random} = {}) {
    this.fetcher = fetcher; this.storage = storage; this.now = now; this.pause = pause; this.random = random;
    this.data = {products: {}, searches: {}}; this.budget = {}; this.pending = new Map();
    const saved = this.read(DATA_KEY);
    if (saved && typeof saved === 'object') for (const type of ['products', 'searches']) {
      for (const [key, entry] of Object.entries(saved[type] || {})) {
        if (entry && Number.isFinite(entry.time) && this.now() - entry.time < 30 * DAY && entry.time <= this.now() && (type === 'searches' ? Array.isArray(entry.codes) : entry.product && isBarcode(entry.product.code))) this.data[type][key] = entry;
      }
    }
  }
  read(key) { try { return JSON.parse(this.storage?.getItem(key) || 'null'); } catch { return null; } }
  write(key, value) { try { this.storage?.setItem(key, JSON.stringify(value)); } catch { /* Memory cache remains available when storage is full or disabled. */ } }
  save() {
    for (const [type, limit] of [['products', 120], ['searches', 40]]) {
      this.data[type] = Object.fromEntries(Object.entries(this.data[type]).filter(([, e]) => this.now() - e.time < 30 * DAY).sort((a, b) => b[1].time - a[1].time).slice(0, limit));
    }
    this.write(DATA_KEY, this.data);
  }
  seed(snapshot) {
    const time = Date.parse(snapshot?.retrieved_at + 'T00:00:00Z');
    if (!Number.isFinite(time)) return;
    for (const p of Object.values(snapshot.products || {})) if (isBarcode(p?.code) && (!this.data.products[p.code] || this.data.products[p.code].time < time)) this.data.products[p.code] = {product: compact(p), time};
    this.save();
  }
  peek(code) { return this.data.products[String(code)] || null; }
  remember(p, time = this.now()) { if (isBarcode(p?.code)) this.data.products[String(p.code)] = {product: compact(p), time}; }
  local(query) { const words = normalize(query).split(' '); return Object.values(this.data.products).filter(e => words.every(w => normalize(e.product.product_name + ' ' + e.product.brands).includes(w))).map(e => e.product).slice(0, 6); }
  reserve(type) {
    const current = this.read(BUDGET_KEY) || this.budget;
    const state = current[type] || {times: [], until: 0};
    const times = (Array.isArray(state.times) ? state.times : []).filter(t => Number.isFinite(t) && t > this.now() - 60000 && t <= this.now());
    if (state.until > this.now()) throw new FoodError('throttled', 'Open Food Facts fait une pause. Réessayez dans quelques instants.', state.until);
    // Conservative limits, shared by both selectors and preserved on reload.
    if (times.length >= (type === 'search' ? 8 : 12)) throw new FoodError('throttled', 'Quelques recherches à la fois : patientez avant de réessayer.', times[0] + 60001);
    current[type] = {times: [...times, this.now()], until: 0}; this.budget = current; this.write(BUDGET_KEY, current);
  }
  cooldown(type, until) {
    const current = this.read(BUDGET_KEY) || this.budget;
    current[type] = {...(current[type] || {times: []}), until}; this.budget = current; this.write(BUDGET_KEY, current);
  }
  async json(url, type) {
    let failure;
    for (let attempt = 0; attempt < 2; attempt++) {
      this.reserve(type);
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await this.fetcher(url, {signal: controller.signal});
        if (response.status === 404) throw new FoodError('missing', 'Produit introuvable. Vérifiez le code-barres ou cherchez par son nom.');
        if (response.status === 429 || (response.status === 503 && response.headers?.get('Retry-After'))) {
          const retry = response.headers?.get('Retry-After');
          const until = Math.max(this.now() + 60000, /^\d+$/.test(retry || '') ? this.now() + Number(retry) * 1000 : Date.parse(retry) || 0);
          this.cooldown(type, until); throw new FoodError('throttled', 'Open Food Facts limite momentanément les requêtes.', until);
        }
        if (!response.ok) throw new FoodError(response.status >= 500 ? 'unavailable' : 'request', 'Open Food Facts est momentanément indisponible.');
        const data = await response.json();
        if (!data || typeof data !== 'object') throw new FoodError('request', 'La réponse reçue est incomplète. Réessayez.');
        return data;
      } catch (error) {
        failure = error instanceof FoodError ? error : new FoodError('unavailable', 'Connexion impossible ou délai dépassé. Vérifiez votre connexion puis réessayez.');
        if (failure.kind !== 'unavailable') throw failure;
      } finally { clearTimeout(timer); }
      if (!attempt) await this.pause(900 + Math.round(this.random() * 500));
    }
    this.cooldown(type, this.now() + 30000);
    throw failure;
  }
  dedupe(key, task) {
    if (!this.pending.has(key)) this.pending.set(key, Promise.resolve().then(task).finally(() => this.pending.delete(key)));
    return this.pending.get(key);
  }
  async product(code, {force = false} = {}) {
    code = String(code);
    if (!isBarcode(code)) throw new FoodError('invalid', 'Ce code-barres est invalide. Saisissez entre 8 et 14 chiffres.');
    const cached = this.peek(code);
    if (!force && cached && this.now() - cached.time < DAY) return {...cached, source: 'cache'};
    return this.dedupe('product:' + code, async () => {
      try {
        const data = await this.json(`https://fr.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`, 'product');
        if (data.status !== 1 || !data.product) throw new FoodError('missing', 'Produit introuvable. Vérifiez le code-barres ou cherchez par son nom.');
        const p = compact({...data.product, code}); this.remember(p); this.save(); return {product: p, time: this.now(), source: 'live'};
      } catch (error) {
        if (cached && !['missing', 'invalid'].includes(error.kind)) return {...cached, source: 'fallback', error};
        throw error;
      }
    });
  }
  async search(query) {
    query = String(query).trim(); const key = normalize(query);
    if (key.length < 2) throw new FoodError('invalid', 'Saisissez au moins deux caractères.');
    if (isBarcode(query)) { const result = await this.product(query); return {...result, products: [result.product]}; }
    const cached = Object.hasOwn(this.data.searches, key) ? this.data.searches[key] : null;
    const cachedProducts = cached?.codes.map(code => this.peek(code)?.product).filter(Boolean) || [];
    if (cached && this.now() - cached.time < 3600000 && cachedProducts.length === cached.codes.length) return {products: cachedProducts, time: cached.time, source: 'cache'};
    return this.dedupe('search:' + key, async () => {
      try {
        const params = new URLSearchParams({search_terms: query, search_simple: '1', action: 'process', json: '1', page_size: '8', fields: FIELDS});
        const data = await this.json('https://fr.openfoodfacts.org/cgi/search.pl?' + params, 'search');
        if (!Array.isArray(data.products)) throw new FoodError('request', 'La réponse de recherche est incomplète. Réessayez.');
        const products = [...new Map(data.products.filter(p => p?.product_name && isBarcode(p.code)).map(p => [String(p.code), compact(p)])).values()].sort((a,b) => Number(Boolean(b.image_front_small_url || b.image_front_url)) - Number(Boolean(a.image_front_small_url || a.image_front_url))).slice(0,6);
        products.forEach(p => this.remember(p)); this.data.searches[key] = {codes: products.map(p => p.code), time: this.now()}; this.save();
        return {products, time: this.now(), source: 'live'};
      } catch (error) {
        const products = cachedProducts.length ? cachedProducts : this.local(query);
        if (products.length) return {products, source: 'fallback', time: cached?.time || 0, error};
        throw error;
      }
    });
  }
}
