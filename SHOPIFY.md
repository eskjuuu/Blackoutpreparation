# Shopify obchod PŘIPRAVENI – postapokalyptické téma

Hotové soubory:

| Soubor | K čemu je |
|---|---|
| `pripraveni-shopify-theme.zip` | celé téma (vzhled obchodu) k nahrání do Shopify |
| `shopify-products.csv` | 3 produkty k importu: batoh, pumpa (2 ks), balíček |
| `shopify-theme/` | zdrojové soubory tématu (pro úpravy) |
| `img/` | vizualizace produktů (Blender), jsou i v tématu jako záložní obrázky |

## Spuštění (asi 15 minut)

1. **Produkty:** Shopify admin → *Produkty* → *Importovat* → vyber `shopify-products.csv`.
   Vzniknou produkty s popisy, cenami a štítky `3d-batoh` / `3d-pumpa`, podle kterých téma zobrazí 3D rozklad.
2. **Téma:** *Online obchod* → *Témata* → *Přidat téma* → *Nahrát soubor ZIP* → `pripraveni-shopify-theme.zip` → *Publikovat*.
   Úvodní stránka už je napojená na produkty (podle adres `evakuacni-batoh-pro-kocku`, `bateriova-pumpa-na-palivo-2ks`, `balicek-preziti`).
3. **Menu:** *Online obchod* → *Navigace* → hlavní menu: Batoh `/#vybava`, Pumpa `/#pumpa`, Balíček `/#balicek`, Otázky `/#otazky`.
4. **Patička:** v editoru tématu vyplň provozovatele (jméno, IČO, adresa, e‑mail). Zákon to vyžaduje.
5. **Zásady:** *Nastavení* → *Zásady* → vygeneruj obchodní podmínky, vrácení zboží a ochranu soukromí a přidej je do menu patičky.
6. **Doprava a platby:** doprava zdarma od 1 500 Kč, Shopify Payments.
7. **Dropshipping:** nainstaluj DSers nebo CJdropshipping a propoj produkty s dodavatelem.

## Fotky a 3D modely

Téma umí všechno, co Shopify podporuje u produktu:
- **fotky a videa** – nahraj je k produktu, nahradí vizualizace,
- **3D model (.glb)** – nahraj ho k produktu jako médium. Zobrazí se v galerii a na iPhonu půjde tlačítkem
  **„Zobrazit u sebe v AR“** položit produkt do pokoje ve skutečné velikosti,
- **3D rozklad** (vlastní) – rozložení na díly a animace funkce. Zobrazí se u produktů se štítkem `3d-batoh` / `3d-pumpa`.

### Jak získat opravdu realistické fotky a 3D model
Vizualizace v `img/` jsou počítačové rendery zjednodušených modelů. Na první pohled je poznat, že to nejsou fotky.
Realistický výsledek „jako bys to držel v ruce“ dá jen skutečný kus:

1. Objednej si od dodavatele **1 vzorek** od každého produktu (stejně je potřeba ověřit kvalitu).
2. **3D sken telefonem:** aplikace *Polycam* nebo *Scaniverse* (iPhone, zdarma) → obejdi produkt dokola → export **GLB** → nahrát k produktu.
   Vznikne fotorealistický model se skutečnou texturou látky a plastu, včetně AR.
3. **Fotky:** vyfoť vzorek venku za soumraku nebo v garáži (styl tématu). Telefon na stativ, boční světlo z baterky.
   Případně použij fotky dodavatele: CJdropshipping a většina prodejců na AliExpressu je dropshipperům k použití poskytuje.
