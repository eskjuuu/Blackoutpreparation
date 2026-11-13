// Mobilní menu
document.querySelectorAll('[data-menu-toggle]').forEach((btn) => {
  const nav = document.getElementById(btn.getAttribute('aria-controls'));
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
  });
});

// Galerie produktu: přepínání fotek, videa, 3D modelu (Shopify) a rozloženého pohledu
document.querySelectorAll('[data-gallery]').forEach((g) => {
  const slides = g.querySelectorAll('[data-slide]');
  const thumbs = g.querySelectorAll('[data-thumb]');
  thumbs.forEach((t) => t.addEventListener('click', () => {
    thumbs.forEach((x) => x.setAttribute('aria-pressed', String(x === t)));
    slides.forEach((s) => { s.hidden = s.dataset.slide !== t.dataset.thumb; });
    g.querySelectorAll('video').forEach((v) => v.pause());
  }));
});

// Výběr varianty → id do formuláře a cena
document.querySelectorAll('[data-variant-select]').forEach((sel) => {
  const form = sel.closest('form');
  const variants = JSON.parse(form.querySelector('[data-variants]').textContent);
  const priceEl = document.querySelector(sel.dataset.priceTarget);
  const btn = form.querySelector('[type=submit]');
  sel.addEventListener('change', () => {
    const v = variants.find((x) => String(x.id) === sel.value);
    if (!v) return;
    if (priceEl) priceEl.textContent = v.price_formatted;
    btn.disabled = !v.available;
    btn.querySelector('[data-label]').textContent = v.available ? 'Přidat do výbavy' : 'Vyprodáno';
  });
});

// Shopify 3D modely a AR
if (document.querySelector('model-viewer') && window.Shopify && Shopify.loadFeatures) {
  Shopify.loadFeatures([
    { name: 'model-viewer-ui', version: '1.0', onLoad: (err) => {
      if (err) return;
      document.querySelectorAll('model-viewer').forEach((m) => new Shopify.ModelViewerUI(m));
    } },
    { name: 'shopify-xr', version: '1.0' },
  ]);
}
