# PŘIPRAVENI – e‑shop s výbavou na blackout

Jednostránkový e‑shop pro dva produkty:

- **Evakuační batoh pro kočku** (rozšiřitelný, větraný) – prodejní cena 1 190 Kč
- **Bateriová pumpa na palivo, sada 2 ks** – prodejní cena 790 Kč
- **Balíček** obou produktů – 1 790 Kč

Obsahuje interaktivní **3D modely** obou produktů: lze je otáčet, **rozložit na jednotlivé díly**
(s popisem, k čemu který díl slouží) a přepnout na animaci **„Jak funguje“**
(batoh: vysunutí rozšiřitelného dílu a kočka, která do něj přejde; pumpa: proud paliva
z kanystru přes oběžné kolo, hadici a trysku do nádoby).

## Struktura

| Soubor | Co dělá |
|---|---|
| `index.html` | celá stránka obchodu |
| `css/style.css` | vzhled |
| `js/config.js` | **ceny, parametry, napojení na Shopify, údaje provozovatele** – tady se upravuje většina věcí |
| `js/cart.js` | košík a sestavení odkazu do pokladny Shopify |
| `js/models.js` | 3D modely (Three.js), popisy dílů |
| `js/viewer.js` | 3D prohlížeč (rozložení, popisky, animace) |
| `viewer.html` | samostatný 3D prohlížeč pro vložení do Shopify (`?model=backpack` / `?model=pump`) |

## Spuštění na počítači

```bash
python3 -m http.server 8000
# otevřete http://localhost:8000
```

## Zveřejnění

Nejjednodušší je **GitHub Pages**: v repozitáři Settings → Pages → Deploy from branch → vyberte větev a složku `/ (root)`.
Alternativně Netlify / Vercel (přetáhnout složku).

## Napojení na Shopify (pokladna, platby, objednávky)

Web používá Shopify jen jako **pokladnu a správu objednávek**. Tlačítko „Pokračovat k pokladně“
pošle zákazníka na zabezpečenou pokladnu Shopify s obsahem košíku (tzv. *cart permalink*).

1. Založte obchod na shopify.com (zkušební verze je zdarma), měna CZK, jazyk čeština.
2. Nainstalujte dropshippingovou aplikaci (viz níže) a importujte oba produkty.
3. Nastavte ceny (1 190 Kč a 790 Kč), dopravu (zdarma od 1 500 Kč) a platby (Shopify Payments).
4. Zjistěte **ID varianty** každého produktu: v administraci otevřete produkt → variantu;
   číslo je na konci adresy (`…/variants/1234567890`). Nebo otevřete
   `https://VAS-OBCHOD.myshopify.com/products/NAZEV-PRODUKTU.json` a hledejte `"variants": [{"id": …`.
5. Vyplňte do `js/config.js`:
   ```js
   shopify: { storeDomain: 'vas-obchod.myshopify.com', bundleDiscountCode: 'BALICEK' },
   products: { backpack: { shopifyVariantId: '1234567890', … }, pump: { shopifyVariantId: '…', … } }
   ```
6. **Balíček** – dvě možnosti:
   - v Shopify → Slevy vytvořte kód `BALICEK` (sleva 190 Kč, podmínka: v košíku oba produkty), nebo
   - v bezplatné aplikaci **Shopify Bundles** vytvořte balíček jako produkt a jeho variantu vložte do `bundle.shopifyVariantId`.

Dokud není `storeDomain` vyplněný, web běží v **ukázkovém režimu** – košík funguje, pokladna zobrazí vysvětlení.

### Chcete raději všechno přímo v Shopify?
Můžete použít běžnou Shopify šablonu a 3D model vložit do popisu produktu (blok *Vlastní Liquid* / *Custom Liquid*):

```html
<iframe src="https://VASE-ADRESA.github.io/Blackoutpreparation/viewer.html?model=backpack"
        style="width:100%;aspect-ratio:4/4.4;border:0;border-radius:10px" loading="lazy"
        title="3D model batohu"></iframe>
```

## Dropshipping – odkud zboží brát

**Temu na dropshipping nestačí.** Nemá napojení na e‑shopy, objednávky byste museli zadávat ručně
a balík přijde v obalu Temu. Stejné nebo velmi podobné produkty najdete u dodavatelů, kteří se se Shopify propojí
a objednávky odesílají automaticky:

| Aplikace | Výhody |
|---|---|
| **CJdropshipping** | sklady v EU (rychlejší doručení do ČR), kontrola kvality, vlastní balení |
| **DSers** (AliExpress) | velký výběr, bezplatný základní tarif, automatické objednávky |
| **Zendrop** | rychlé zpracování, vlastní branding |

Hledejte: *„expandable cat backpack carrier“* a *„battery fuel transfer pump 2 pack“*.
Před spuštěním si **objednejte vzorek** obou produktů a ověřte rozměry, nosnost a kvalitu.
Parametry v `js/config.js` jsou typické hodnoty, je potřeba je zkontrolovat.

### Marže (orientačně)

| Produkt | Nákup (Temu, pro srovnání) | Prodej | Hrubá marže |
|---|---|---|---|
| Batoh | 525 Kč | 1 190 Kč | ~665 Kč |
| Pumpa 2 ks | 352 Kč | 790 Kč | ~438 Kč |
| Balíček | 877 Kč | 1 790 Kč | ~913 Kč |

Od marže odečtěte dopravu, poplatky Shopify a platební brány (~2–3 %) a reklamu.

## Před spuštěním (povinné v ČR/EU)

- [ ] Živnostenské oprávnění (volná živnost – maloobchod), IČO → doplnit do `company` v `js/config.js`
- [ ] Obchodní podmínky, reklamační řád, ochrana osobních údajů (GDPR) – Shopify je umí vygenerovat (Nastavení → Zásady)
- [ ] Odkazy v patičce `index.html` nasměrovat na tyto stránky
- [ ] Ceny uvádějte jako konečné (vč. DPH, pokud jste plátce). Neuvádějte smyšlené „původní ceny“ – škrtnutá cena musí být nejnižší cena za posledních 30 dní.
- [ ] Ověřit u dodavatele parametry produktů a že pumpa má označení CE
- [ ] Reklama: Meta a Google omezují reklamy, které strašení válkou či katastrofou používají jako hlavní sdělení.
      Prodávejte klidně a prakticky (výpadek proudu, evakuace, cestování), stejně jako texty na webu.

## Úpravy 3D modelů

Modely jsou postavené v kódu (`js/models.js`), každý díl je samostatný objekt s:
- `explode` – kam se díl posune při rozložení `[x, y, z]`
- `name`, `desc` – název a popis v seznamu dílů

Jsou ilustrační. Pokud dodavatel dodá skutečný 3D model (`.glb`), lze ho načíst přes `GLTFLoader`.
