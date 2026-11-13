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

// ---- hero: město, ve kterém zhasínají okna
const city = $('#city');
if (city) {
  const W = 1200, H = 260;
  let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">`;
  let x = 0, seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const wins = [];
  while (x < W) {
    const bw = 50 + rnd() * 70, bh = 70 + rnd() * 170;
    svg += `<rect class="bld" x="${x}" y="${H - bh}" width="${bw}" height="${bh}"/>`;
    for (let wy = H - bh + 12; wy < H - 14; wy += 16) {
      for (let wx = x + 8; wx < x + bw - 12; wx += 13) {
        if (rnd() > 0.45) wins.push(`<rect class="win" x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="6" height="8"/>`);
      }
    }
    x += bw + 4 + rnd() * 10;
  }
  svg += `<g>${wins.join('')}</g></svg>`;
  city.innerHTML = svg;
  const lit = $$('.win', city);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const order = lit.map((el, i) => [el, rnd() + (i % 7) * 0.02]).sort((a, b) => a[1] - b[1]).map((a) => a[0]);
    const keep = Math.round(order.length * 0.06);
    let i = 0;
    const t = setInterval(() => {
      for (let k = 0; k < 14 && i < order.length - keep; k++, i++) order[i].classList.add('off');
      if (i >= order.length - keep) clearInterval(t);
    }, 70);
  }
}
