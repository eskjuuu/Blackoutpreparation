import { CONFIG, formatPrice, allItems } from './config.js';
import { cart } from './cart.js';
import { mountViewer } from './viewer.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---- ceny a parametry z konfigurace
const catalog = allItems();
$$('[data-price]').forEach((el) => { el.textContent = formatPrice(catalog[el.dataset.price].price); });
const sum = CONFIG.bundle.items.reduce((s, id) => s + CONFIG.products[id].price, 0);
$$('[data-bundle-sum]').forEach((el) => { el.textContent = formatPrice(sum); });
$$('[data-bundle-save]').forEach((el) => { el.textContent = formatPrice(sum - CONFIG.bundle.price); });
$$('[data-free-from]').forEach((el) => { el.textContent = formatPrice(CONFIG.freeShippingFrom); });
$$('[data-specs]').forEach((dl) => {
  dl.innerHTML = CONFIG.products[dl.dataset.specs].specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
});

// ---- údaje provozovatele
const co = CONFIG.company;
$('#company').textContent = co.name
  ? `Provozovatel: ${co.name}, IČO ${co.ico}, ${co.address} · ${co.email}`
  : 'Údaje provozovatele doplňte v souboru js/config.js (jméno, IČO, adresa, e‑mail).';
$('#year').textContent = new Date().getFullYear();

// ---- 3D prohlížeče
$$('[data-viewer]').forEach((el) => mountViewer(el, el.dataset.viewer));

// ---- galerie produktu: fotky / 3D
$$('.media').forEach((m) => {
  const img = $('.media__img', m);
  const v3d = $('.media__3d', m);
  const thumbs = $$('[data-show]', m);
  thumbs.forEach((t) => t.addEventListener('click', () => {
    thumbs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
    const is3d = t.dataset.show === '3d';
    img.hidden = is3d;
    v3d.hidden = !is3d;
    if (!is3d) { img.src = t.dataset.show; img.alt = t.dataset.alt; }
  }));
});

// ---- košík
const drawer = $('#cart');
const icons = {
  backpack: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="10" width="28" height="32" rx="6"/><rect x="16" y="15" width="16" height="10" rx="5" class="i-net"/><rect x="15" y="30" width="18" height="9" rx="3" class="i-net"/><path d="M18 10V6h12v4"/></svg>',
  pump: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="18" y="4" width="10" height="16" rx="3"/><rect x="21" y="20" width="4" height="24"/><path d="M27 21c10 0 12 6 12 14" class="i-hose"/><path d="M39 35l3 7" class="i-acc"/></svg>',
};
icons.bundle = `<span class="duo">${icons.backpack}${icons.pump}</span>`;

function openCart() { drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('is-open')); $('#cart-close').focus(); }
function closeCart() { drawer.classList.remove('is-open'); setTimeout(() => { drawer.hidden = true; }, 250); }
$$('[data-open-cart]').forEach((b) => b.addEventListener('click', openCart));
$('#cart-close').addEventListener('click', closeCart);
drawer.addEventListener('click', (e) => { if (e.target === drawer) closeCart(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCart(); closeModal(); } });

$$('[data-add]').forEach((b) => b.addEventListener('click', () => {
  cart.add(b.dataset.add);
  b.classList.add('is-added');
  const old = b.textContent;
  b.textContent = 'Přidáno ✓';
  setTimeout(() => { b.textContent = old; b.classList.remove('is-added'); }, 1400);
  openCart();
}));

cart.subscribe(() => {
  const count = cart.count();
  $$('[data-cart-count]').forEach((el) => { el.textContent = count; el.hidden = count === 0; });
  const lines = cart.lines();
  $('#cart-lines').innerHTML = lines.length ? lines.map((l) => `
    <li class="line">
      <div class="line__icon">${icons[l.id]}</div>
      <div class="line__body">
        <p class="line__name">${l.name}</p>
        <p class="line__price">${formatPrice(l.price)} / ks</p>
        <div class="qty">
          <button type="button" data-q="${l.id}" data-d="-1" aria-label="Ubrat kus">−</button>
          <span>${l.qty}</span>
          <button type="button" data-q="${l.id}" data-d="1" aria-label="Přidat kus">+</button>
        </div>
      </div>
      <p class="line__total">${formatPrice(l.total)}</p>
    </li>`).join('') : '<li class="empty">Košík je prázdný. Začněte batohem nebo pumpou.</li>';
  $$('#cart-lines [data-q]').forEach((b) => b.addEventListener('click', () => {
    const line = lines.find((l) => l.id === b.dataset.q);
    cart.set(line.id, line.qty + Number(b.dataset.d));
  }));
  const sub = cart.subtotal();
  $('#cart-subtotal').textContent = formatPrice(sub);
  const left = CONFIG.freeShippingFrom - sub;
  $('#ship-text').textContent = sub === 0 ? `Doprava zdarma od ${formatPrice(CONFIG.freeShippingFrom)}.`
    : left > 0 ? `Do dopravy zdarma zbývá ${formatPrice(left)}.` : 'Máte dopravu zdarma.';
  $('#ship-bar').style.width = `${Math.min(100, (sub / CONFIG.freeShippingFrom) * 100)}%`;
  $('#checkout').disabled = lines.length === 0;
});

// ---- pokladna → Shopify
const modal = $('#modal');
function closeModal() { modal.hidden = true; }
$('#modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
$('#checkout').addEventListener('click', () => {
  const res = cart.checkoutUrl();
  if (res.ok) { window.location.href = res.url; return; }
  $('#modal-text').textContent = res.reason === 'missing-variant'
    ? `Produkt „${res.product}“ ještě nemá v js/config.js vyplněné číslo varianty ze Shopify.`
    : 'Obchod zatím běží v ukázkovém režimu. Po vyplnění adresy Shopify obchodu v js/config.js vás toto tlačítko přenese do zabezpečené pokladny Shopify.';
  modal.hidden = false;
});

