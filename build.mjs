// Bouwt de site naar dist/. Geen dependencies nodig: `node build.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import {renderBody, headTags, robotsTxt, sitemapXml} from './src/render.mjs';

const root = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(root, 'dist');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const json = p => JSON.parse(read(p));

const content = json('content/home.json');
const seo = json('content/seo.json');

// Zonder eigen domein gebruiken we het vaste vercel.app-adres van het project.
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl = (seo.url || (vercelHost ? 'https://' + vercelHost + '/' : '')).replace(/\/?$/, '/');
seo.url = /^https:\/\//.test(siteUrl) ? siteUrl : '';

fs.rmSync(out, {recursive: true, force: true});
fs.mkdirSync(path.join(out, 'ds'), {recursive: true});
fs.mkdirSync(path.join(out, 'admin'), {recursive: true});

const html = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${headTags(seo, content)}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/ds/bundle.css">
<style>
${read('src/site.css')}</style>
</head>
<body>
${renderBody(content)}
<script src="/ds/vendor/react.production.min.js"></script>
<script src="/ds/vendor/react-dom.production.min.js"></script>
<script src="/ds/bundle.js"></script>
<script src="/site.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, 'robots.txt'), robotsTxt(seo));
if (seo.url && seo.index) fs.writeFileSync(path.join(out, 'sitemap.xml'), sitemapXml(seo));
fs.copyFileSync(path.join(root, 'src/site.js'), path.join(out, 'site.js'));
fs.cpSync(path.join(root, 'ds'), path.join(out, 'ds'), {recursive: true});
fs.cpSync(path.join(root, 'public'), out, {recursive: true});

// Decap CMS: het inlogadres moet naar dit eigen domein wijzen.
fs.copyFileSync(path.join(root, 'admin/index.html'), path.join(out, 'admin/index.html'));
const origin = seo.url ? seo.url.replace(/\/$/, '') : 'http://localhost:3000';
fs.writeFileSync(path.join(out, 'admin/config.yml'), read('admin/config.yml').replaceAll('__SITE_ORIGIN__', origin));

console.log('Gebouwd naar dist/ voor ' + (seo.url || '(geen adres)') + (seo.index ? '' : ' (noindex)'));
