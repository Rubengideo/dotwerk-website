# Dotwerk website

De homepage van Dotwerk, een AI-consultancy voor het mkb. Statische site op Vercel, inhoud te bewerken via Decap CMS op `/admin`.

## Hoe het werkt

- **Inhoud** staat in `content/home.json` (teksten) en `content/seo.json` (titel, beschrijving, bedrijfsgegevens).
- **`node build.mjs`** maakt daar `dist/` van: een kant-en-klare `index.html` met alle teksten, head-tags, gestructureerde data (JSON-LD), `robots.txt` en, zodra indexeren aan staat, `sitemap.xml`.
- **Vercel** draait die build bij elke push naar `main`. Zonder eigen domein gebruikt de build automatisch het vaste `*.vercel.app`-adres.
- **Ontwerp**: `ds/bundle.css` en `ds/bundle.js` komen uit het Modulair-ontwerpsysteem. React staat in `ds/vendor/`, zodat de site geen externe scripts laadt.

## Bewerken via /admin

Decap CMS logt in met GitHub en slaat elke wijziging op als commit op `main`. Vercel publiceert die binnen een minuut.

Eenmalig nodig: een GitHub OAuth App.

1. Ga naar GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
2. Homepage URL: het vercel.app-adres van de site. Authorization callback URL: `<dat adres>/api/callback`.
3. Zet de Client ID en een nieuw Client secret in Vercel → Project → Settings → Environment Variables als `GITHUB_CLIENT_ID` en `GITHUB_CLIENT_SECRET`, en deploy opnieuw.

## Contactformulier

Maak een gratis formulier aan op [formspree.io](https://formspree.io) en zet het adres (`https://formspree.io/f/...`) in het CMS onder Homepagina → Contact → Formulieradres. Leeg betekent dat het formulier niets verstuurt.

## Naar een eigen domein

1. Voeg het domein toe in Vercel → Project → Settings → Domains.
2. Zet het adres in het CMS onder SEO → Adres van de site.
3. Zet "Zoekmachines mogen de site opnemen" aan als de inhoud klaar is. Dan komen er ook een sitemap en index-tags.
4. Werk de Homepage- en callback-URL van de GitHub OAuth App bij.

## Lokaal bekijken

```
node build.mjs
npx serve dist
```
