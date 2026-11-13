import { CONFIG, allItems } from './config.js';

const KEY = 'pripraveni_cart_v1';
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === 'object' ? data : {};
  } catch { return {}; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* bez úložiště */ }
}

let items = load();
const emit = () => { save(); listeners.forEach((fn) => fn(cart)); };

export const cart = {
  lines() {
    const catalog = allItems();
    return Object.entries(items)
      .filter(([id, q]) => catalog[id] && q > 0)
      .map(([id, qty]) => ({ ...catalog[id], qty, total: catalog[id].price * qty }));
  },
  add(id, qty = 1) { items[id] = (items[id] || 0) + qty; emit(); },
  set(id, qty) { if (qty <= 0) delete items[id]; else items[id] = qty; emit(); },
  clear() { items = {}; emit(); },
  count() { return this.lines().reduce((s, l) => s + l.qty, 0); },
  subtotal() { return this.lines().reduce((s, l) => s + l.total, 0); },
  subscribe(fn) { listeners.add(fn); fn(cart); return () => listeners.delete(fn); },

  // Sestaví odkaz do pokladny Shopify (tzv. cart permalink):
  // https://obchod.myshopify.com/cart/VARIANTA:POCET,VARIANTA:POCET?discount=KOD
  checkoutUrl() {
    const { storeDomain, bundleDiscountCode } = CONFIG.shopify;
    if (!storeDomain) return { ok: false, reason: 'no-store' };
    const qty = {};
    let needsDiscount = false;
    for (const line of this.lines()) {
      if (line.id === 'bundle' && !CONFIG.bundle.shopifyVariantId) {
        for (const pid of CONFIG.bundle.items) {
          const vid = CONFIG.products[pid].shopifyVariantId;
          if (!vid) return { ok: false, reason: 'missing-variant', product: CONFIG.products[pid].name };
          qty[vid] = (qty[vid] || 0) + line.qty;
        }
        needsDiscount = true;
      } else {
        const vid = line.shopifyVariantId;
        if (!vid) return { ok: false, reason: 'missing-variant', product: line.name };
        qty[vid] = (qty[vid] || 0) + line.qty;
      }
    }
    const path = Object.entries(qty).map(([v, q]) => `${v}:${q}`).join(',');
    if (!path) return { ok: false, reason: 'empty' };
    const domain = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    let url = `https://${domain}/cart/${path}`;
    if (needsDiscount && bundleDiscountCode) url += `?discount=${encodeURIComponent(bundleDiscountCode)}`;
    return { ok: true, url };
  },
};
