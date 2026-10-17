// Bouwt de site naar dist/. Geen dependencies nodig: `node build.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import {renderBody, headTags, robotsTxt, sitemapXml} from './src/render.mjs';
import {renderSpeeltuin, speeltuinHead, SPEELTUIN} from './src/speeltuin.mjs';

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

const page = ({head, css, body, scripts}) => `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${head}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/ds/bundle.css">
<style>
${css}</style>
</head>
<body>
${body}
<script src="/ds/vendor/react.production.min.js"></script>
<script src="/ds/vendor/react-dom.production.min.js"></script>
<script src="/ds/bundle.js"></script>
${scripts}
</body>
</html>
`;

const html = page({head: headTags(seo, content), css: read('src/site.css'), body: renderBody(content), scripts: '<script src="/site.js"></script>'});

// De Speeltuin: een etalage van het ontwerpsysteem op /speeltuin/.
fs.mkdirSync(path.join(out, 'speeltuin'), {recursive: true});
fs.writeFileSync(path.join(out, 'speeltuin/index.html'), page({
  head: speeltuinHead(seo), css: read('src/site.css') + read('src/speeltuin.css'),
  body: renderSpeeltuin(content), scripts: '<script src="/speeltuin.js"></script>'}));
fs.copyFileSync(path.join(root, 'src/speeltuin.js'), path.join(out, 'speeltuin.js'));

fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, 'robots.txt'), robotsTxt(seo));
if (seo.url && seo.index) fs.writeFileSync(path.join(out, 'sitemap.xml'), sitemapXml(seo, [SPEELTUIN.path]));
fs.copyFileSync(path.join(root, 'src/site.js'), path.join(out, 'site.js'));
fs.cpSync(path.join(root, 'ds'), path.join(out, 'ds'), {recursive: true});
fs.cpSync(path.join(root, 'public'), out, {recursive: true});

// Beheer (/admin): gebruikt dezelfde render-code en stijl als de site.
fs.cpSync(path.join(root, 'admin'), path.join(out, 'admin'), {recursive: true});
fs.copyFileSync(path.join(root, 'src/render.mjs'), path.join(out, 'admin/render.mjs'));
fs.copyFileSync(path.join(root, 'src/site.css'), path.join(out, 'site.css'));

console.log('Gebouwd naar dist/ voor ' + (seo.url || '(geen adres)') + (seo.index ? '' : ' (noindex)'));
