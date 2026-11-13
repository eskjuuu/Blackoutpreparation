// ============================================================
//  NASTAVENÍ OBCHODU – tady měníte ceny, texty a napojení na Shopify
// ============================================================

export const CONFIG = {
  brand: 'PŘIPRAVENI',
  currency: 'Kč',

  // Doprava zdarma od této částky (jen informace pro zákazníka,
  // skutečnou cenu dopravy počítá Shopify v pokladně).
  freeShippingFrom: 1500,

  // ---- SHOPIFY -------------------------------------------------
  // 1) storeDomain: adresa vašeho obchodu, např. 'pripraveni.myshopify.com'
  // 2) u každého produktu vyplňte shopifyVariantId (číslo varianty)
  // Dokud je storeDomain prázdný, web běží v DEMO režimu (košík funguje,
  // ale pokladna jen ukáže návod).
  shopify: {
    storeDomain: '',
    // Slevový kód, který se použije, když je v košíku balíček
    // a balíček nemá vlastní variantu (vytvořte ho v Shopify → Slevy).
    bundleDiscountCode: 'BALICEK',
  },

  // Údaje provozovatele – zákon je vyžaduje na webu (patička).
  company: {
    name: '',      // např. 'Jana Nováková'
    ico: '',       // IČO
    address: '',   // sídlo / místo podnikání
    email: '',     // kontaktní e‑mail
  },

  products: {
    backpack: {
      id: 'backpack',
      name: 'Evakuační batoh pro kočku',
      short: 'Rozšiřitelný, větraný, ruce zůstanou volné',
      price: 1190, // nákup ~525 Kč
      shopifyVariantId: '',
      // OVĚŘIT U DODAVATELE před spuštěním – typické hodnoty pro tento typ batohu
      specs: [
        ['Rozměry (složený)', 'cca 33 × 28 × 42 cm'],
        ['Rozšíření', 'boční síťovaný díl na zip'],
        ['Doporučeno pro', 'kočky a malé psy do cca 7 kg'],
        ['Materiál', 'polyesterová tkanina, síťovina, plastová výztuha dna'],
        ['Větrání', 'síťovaná okna ze 4 stran'],
      ],
    },
    pump: {
      id: 'pump',
      name: 'Bateriová pumpa na palivo – sada 2 ks',
      short: 'Benzín, nafta, petrolej. Bez nasávání pusou.',
      price: 790, // nákup ~352 Kč
      shopifyVariantId: '',
      // OVĚŘIT U DODAVATELE před spuštěním
      specs: [
        ['Průtok', 'až 6 l/min (údaj výrobce)'],
        ['Napájení', '2× baterie typu D – nejsou součástí balení'],
        ['Obsah balení', '2× pumpa, 2× tryska, 2× adaptér, držáky baterií'],
        ['Kapaliny', 'benzín, nafta, petrolej, voda'],
        ['Ovládání', 'jedno tlačítko'],
      ],
    },
  },

  bundle: {
    id: 'bundle',
    name: 'Balíček Připraveni (batoh + 2 pumpy)',
    items: ['backpack', 'pump'],
    price: 1790,
    // Volitelné: pokud v Shopify vytvoříte balíček jako samostatný produkt
    // (aplikace Shopify Bundles), vložte sem jeho variantu.
    shopifyVariantId: '',
  },
};

export const formatPrice = (n) =>
  new Intl.NumberFormat('cs-CZ').format(n) + ' ' + CONFIG.currency;

export const allItems = () => ({ ...CONFIG.products, bundle: CONFIG.bundle });
