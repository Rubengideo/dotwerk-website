# Dotwerk website

De homepage van Dotwerk, een AI-consultancy voor het mkb. Statische site op Vercel, inhoud te bewerken via het eigen beheer op `/admin`.

## Hoe het werkt

- **Inhoud** staat in `content/home.json` (teksten) en `content/seo.json` (titel, beschrijving, bedrijfsgegevens).
- **`node build.mjs`** maakt daar `dist/` van: een kant-en-klare `index.html` met alle teksten, head-tags, gestructureerde data (JSON-LD), `robots.txt` en, zodra indexeren aan staat, `sitemap.xml`.
- **Vercel** draait die build bij elke push naar `main`. Zonder eigen domein gebruikt de build automatisch het vaste `*.vercel.app`-adres.
- **Ontwerp**: `ds/bundle.css` en `ds/bundle.js` komen uit het Modulair-ontwerpsysteem. React staat in `ds/vendor/`, zodat de site geen externe scripts laadt.

## Bewerken via /admin

Het beheer is het paneel uit het oorspronkelijke artifact: de pagina links als live voorbeeld, rechts de velden (tabbladen Inhoud en SEO). Code: `admin/` (`admin.js` gebruikt dezelfde `src/render.mjs` als de build, dus het voorbeeld is exact de live pagina).

- Inloggen gaat met GitHub via `api/auth.js` en `api/callback.js`. Nodig in Vercel: `GITHUB_CLIENT_ID` en `GITHUB_CLIENT_SECRET` van de GitHub OAuth App "Dotwerk CMS" (callback `<site>/api/callback`).
- Alleen wie schrijfrechten op deze repository heeft, kan publiceren.
- Publiceren maakt één commit met `content/home.json` en/of `content/seo.json` op `main`. Vercel bouwt daarna opnieuw, binnen ongeveer een minuut live.
- Een nieuw veld toevoegen: zet het in `content/home.json`, gebruik het in `src/render.mjs` en voeg het toe aan `SCHEMA` in `admin/admin.js`.

## Contactformulier

Maak een gratis formulier aan op [formspree.io](https://formspree.io) en zet het adres (`https://formspree.io/f/...`) in het beheer onder Contact → Formulieradres (Formspree). Leeg betekent dat het formulier niets verstuurt.

## Naar een eigen domein

1. Voeg het domein toe in Vercel → Project → Settings → Domains.
2. Zet het adres in het beheer onder SEO → Adres van de site.
3. Zet "Zoekmachines mogen de site opnemen" aan als de inhoud klaar is. Dan komen er ook een sitemap en index-tags.
4. Werk de Homepage- en callback-URL van de GitHub OAuth App bij.

## Lokaal bekijken

```
node build.mjs
npx serve dist
```
