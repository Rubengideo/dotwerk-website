// Eigen beheer voor de Dotwerk-site. Leest en schrijft content/home.json en content/seo.json
// in de GitHub-repository; Vercel bouwt de site opnieuw na elke publicatie.
import {renderBody, headTags, robotsTxt, sitemapXml, esc} from './render.mjs';

const REPO = 'Rubengideo/dotwerk-website';
const BRANCH = 'main';
const FILES = {content: 'content/home.json', seo: 'content/seo.json'};
const TOKEN_KEY = 'dotwerk-admin-token';

const ICON = {
  check:'<svg class="mo-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  alert:'<svg class="mo-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v5M12 16.2v.1"/></svg>',
  ok:'<svg class="mo-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.3l2.4 2.4 4.6-4.9"/></svg>',
  chev:'<svg class="mo-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  up:'<svg class="mo-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
  down:'<svg class="mo-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  x:'<svg class="mo-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

const $ = id => document.getElementById(id);
const clone = o => JSON.parse(JSON.stringify(o));
const getAt = (o, path) => path.split('.').reduce((a, k) => a == null ? a : a[k], o);
function setAt(o, path, v){const ks = path.split('.'), last = ks.pop(), t = ks.reduce((a, k) => a[k], o); t[last] = v;}
const dot = (look, size) => '<span data-dot=\'' + esc(JSON.stringify(Object.assign({size}, look))) + '\' style="width:' + size + 'px;height:' + size + 'px"></span>';
const siteUrl = seo => /^https:\/\//.test(seo.url || '') ? seo.url : location.origin + '/';

/* ---------- token (sessie) ---------- */
function getToken(){try{return sessionStorage.getItem(TOKEN_KEY);}catch(e){return null;}}
function setToken(t){try{t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY);}catch(e){}}

/* ---------- GitHub ---------- */
async function gh(path, opts = {}){
  const r = await fetch('https://api.github.com/repos/' + REPO + path, {
    ...opts,
    headers: {Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + getToken(), ...(opts.body ? {'Content-Type': 'application/json'} : {})}
  });
  if (!r.ok) {const e = new Error('GitHub ' + r.status); e.status = r.status; throw e;}
  return r.json();
}
function decode(b64){const bin = atob(b64.replace(/\n/g, '')); return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));}
async function loadFiles(){
  const ref = await gh('/git/ref/heads/' + BRANCH);
  const head = ref.object.sha;
  const [c, s] = await Promise.all([FILES.content, FILES.seo].map(p => gh('/contents/' + p + '?ref=' + head)));
  return {head, content: JSON.parse(decode(c.content)), seo: JSON.parse(decode(s.content))};
}
// Eén commit met beide bestanden. Faalt als iemand anders intussen heeft gepubliceerd.
async function publish(base, data, message){
  const commit = await gh('/git/commits/' + base);
  const tree = await gh('/git/trees', {method: 'POST', body: JSON.stringify({
    base_tree: commit.tree.sha,
    tree: Object.keys(FILES).filter(k => data[k]).map(k => ({path: FILES[k], mode: '100644', type: 'blob', content: JSON.stringify(data[k], null, 2) + '\n'}))
  })});
  const next = await gh('/git/commits', {method: 'POST', body: JSON.stringify({message, tree: tree.sha, parents: [base]})});
  await gh('/git/refs/heads/' + BRANCH, {method: 'PATCH', body: JSON.stringify({sha: next.sha, force: false})});
  return next.sha;
}

/* ---------- inloggen (zelfde handshake als api/callback.js) ---------- */
function login(){
  return new Promise((resolve, reject) => {
    const w = 600, h = 720, left = screenX + (outerWidth - w) / 2, top = screenY + (outerHeight - h) / 2;
    const popup = open('/api/auth', 'dotwerk-login', `width=${w},height=${h},left=${left},top=${top}`);
    if (!popup) {reject(new Error('Pop-up geblokkeerd'));return;}
    function onMsg(e){
      if (e.origin !== location.origin || typeof e.data !== 'string') return;
      if (e.data === 'authorizing:github') {e.source.postMessage('authorizing:github', e.origin); return;}
      const m = e.data.match(/^authorization:github:(success|error):(.*)$/s);
      if (!m) return;
      removeEventListener('message', onMsg);
      const payload = JSON.parse(m[2]);
      m[1] === 'success' ? resolve(payload.token) : reject(new Error(payload.message || 'Inloggen mislukt'));
    }
    addEventListener('message', onMsg);
  });
}

/* ---------- voorbeeld ---------- */
let roots = [];
function mountDemo(){
  const M = window.Modulair; if (!M || !window.ReactDOM) return;
  roots.forEach(r => r.unmount()); roots = [];
  const h = React.createElement, mount = (el, node) => {const r = ReactDOM.createRoot(el); r.render(node); roots.push(r);};
  document.querySelectorAll('[data-dot]').forEach(el => {
    let p = {}; try {p = JSON.parse(el.getAttribute('data-dot'));} catch (e) {}
    el.style.width = el.style.height = ''; mount(el, h(M.Dot, p));
  });
  const feed = $('feed'), approval = $('approval');
  if (feed) mount(feed, h(M.ActivityFeed, {items: [
    {time:'08:12',who:'Inbox-collega',text:'sorteerde 37 mails en zette 5 antwoorden klaar',dot:{shape:'capsule',color:'teal'},state:'done'},
    {time:'09:40',who:'Offerte-collega',text:'maakt een offerte voor een warmtepomp',code:'Fam. Jansen',dot:{shape:'circle',color:'cobalt'},state:'work'},
    {time:'10:05',who:'Planning-collega',text:'plande 3 monteurs in voor donderdag',dot:{shape:'squircle',color:'leaf'},state:'done'}]}));
  if (approval) mount(approval, h(M.ApprovalCard, {
    title:'Offerte versturen naar Fam. Jansen',dotName:'Offerte-collega',dot:{shape:'circle',color:'cobalt'},
    detail:'Ik heb de offerte voor de warmtepomp klaar. Mag ik hem versturen?',amount:'€ 8.420,00',
    rows:[['Inclusief','Installatie en 5 jaar garantie'],['Geldig tot','vr 31 okt']],approveLabel:'Versturen',rejectLabel:'Eerst nakijken'}));
}
function showPreview(){
  const s = current();
  $('preview').innerHTML = renderBody(s.content);
  const form = $('scan-form'); if (form) form.addEventListener('submit', e => e.preventDefault());
  document.title = 'Beheer | ' + (s.seo.title || s.content.brand);
  mountDemo();
}

/* ---------- SEO-checks (uit het artifact) ---------- */
const has = (text, kw) => !!kw && String(text || '').toLowerCase().includes(kw.toLowerCase());
function words(c){
  const all = [c.hero.title, c.hero.intro, c.services.intro].concat(c.services.items.map(i => i.name + ' ' + i.text + ' ' + (i.bullets || []).join(' ')),
    c.steps.items.map(i => i.title + ' ' + i.text), c.principles.intro, c.principles.items.map(i => i.title + ' ' + i.text),
    c.case.quote, c.faq.items.map(i => i.q + ' ' + i.a), c.contact.intro).join(' ');
  return all.split(/\s+/).filter(Boolean).length;
}
function checks(seo, c){
  const kw = (seo.keyword || '').trim(), tl = (seo.title || '').length, dl = (seo.description || '').length, wc = words(c);
  return [
    {ok:tl>=30&&tl<=60,t:'Paginatitel tussen 30 en 60 tekens',d:'Nu '+tl+' tekens. Langer wordt in Google afgekapt, korter laat ruimte liggen.'},
    {ok:dl>=70&&dl<=160,t:'Metabeschrijving tussen 70 en 160 tekens',d:'Nu '+dl+' tekens. Dit is de tekst onder je titel in de zoekresultaten.'},
    {ok:!!kw,t:'Focuszoekwoord ingesteld',d:kw?'"'+kw+'"':'Kies de zoekterm waarop je gevonden wilt worden.'},
    {ok:has(seo.title,kw),t:'Zoekwoord in de paginatitel',d:'Google weegt de titel zwaar.'},
    {ok:has(seo.description,kw),t:'Zoekwoord in de metabeschrijving',d:'Google maakt het zoekwoord vet in het resultaat.'},
    {ok:has(c.hero.title,kw)||has(c.hero.eyebrow,kw),t:'Zoekwoord in de hoofdkop of het label erboven',d:'Hoofdkop: "'+c.hero.title+'"'},
    {ok:has(c.hero.intro,kw)||has(c.services.intro,kw),t:'Zoekwoord in de eerste alinea',d:'Noem het onderwerp vroeg op de pagina.'},
    {ok:wc>=300,t:'Minstens 300 woorden tekst',d:'Nu '+wc+' woorden.'},
    {ok:/^https:\/\//.test(siteUrl(seo)),t:'Adres van de site met https',d:siteUrl(seo)},
    {ok:!!seo.index,t:'Pagina mag geïndexeerd worden',d:seo.index?'Zoekmachines mogen de pagina opnemen.':'Staat op noindex: Google neemt de pagina niet op. Zet dit aan zodra de inhoud klaar is.'},
    {ok:!!(seo.org.name&&seo.org.city),t:'Bedrijfsgegevens voor Google ingevuld',d:'Naam en plaats komen in de gestructureerde gegevens (LocalBusiness).'},
    {ok:c.faq.items.length>=3&&c.faq.items.every(i=>i.q&&i.a),t:'Veelgestelde vragen compleet',d:'Vragen met antwoord kunnen als FAQ in Google verschijnen.'}
  ];
}
const score = (s, c) => {const l = checks(s, c); return Math.round(l.filter(x => x.ok).length / l.length * 100);};

/* ---------- schema ---------- */
const T = (k, l, o) => Object.assign({k, l, type: 'text'}, o || {});
const A = (k, l, o) => Object.assign({k, l, type: 'area'}, o || {});
const SCHEMA = [
  {title:'Algemeen',fields:[T('brand','Bedrijfsnaam'),T('footer.left','Voettekst links'),T('footer.right','Voettekst rechts')]},
  {title:'Hero',fields:[T('hero.eyebrow','Label boven de kop'),A('hero.title','Hoofdkop (H1)',{rows:2}),A('hero.intro','Introductie'),T('hero.ctaPrimary','Knop 1'),T('hero.ctaSecondary','Knop 2'),
    {k:'hero.proof',l:'Pluspunten',type:'list',item:'text',add:'Pluspunt toevoegen',blank:''}]},
  {title:'Sectoren',fields:[T('sectorsLabel','Label'),{k:'sectors',l:'Sectoren',type:'list',item:'text',add:'Sector toevoegen',blank:''}]},
  {title:'Diensten',fields:[T('services.eyebrow','Label'),T('services.title','Kop'),A('services.intro','Introductie'),
    {k:'services.items',l:'Diensten',type:'list',name:'Dienst',add:'Dienst toevoegen',blank:{name:'Nieuwe dienst',badge:'',text:'',bullets:[],price:'',priceNote:'',featured:false},
     item:[T('name','Naam'),T('badge','Label'),A('text','Omschrijving'),{k:'bullets',l:'Punten',type:'list',item:'text',add:'Punt toevoegen',blank:''},T('price','Prijs'),T('priceNote','Toelichting bij prijs'),{k:'featured',l:'Uitgelicht (zwarte rand)',type:'bool'}]}]},
  {title:'Werkwijze',fields:[T('steps.eyebrow','Label'),T('steps.title','Kop'),
    {k:'steps.items',l:'Stappen',type:'list',name:'Stap',add:'Stap toevoegen',blank:{title:'',text:'',when:''},item:[T('title','Titel'),A('text','Tekst'),T('when','Wanneer')]}]},
  {title:'Zo werken we',fields:[T('principles.eyebrow','Label'),T('principles.title','Kop'),A('principles.intro','Introductie'),
    {k:'principles.items',l:'Principes',type:'list',name:'Principe',add:'Principe toevoegen',blank:{title:'',text:''},item:[T('title','Titel'),A('text','Tekst')]}]},
  {title:'Case',fields:[T('case.label','Label'),T('case.meta','Klant'),A('case.quote','Citaat'),A('case.source','Bron'),
    {k:'case.stats',l:'Cijfers',type:'list',name:'Cijfer',add:'Cijfer toevoegen',blank:{value:'',label:''},item:[T('value','Waarde'),T('label','Toelichting')]}]},
  {title:'Veelgestelde vragen',fields:[T('faq.eyebrow','Label'),T('faq.title','Kop'),
    {k:'faq.items',l:'Vragen',type:'list',name:'Vraag',add:'Vraag toevoegen',blank:{q:'',a:''},item:[T('q','Vraag'),A('a','Antwoord')]}]},
  {title:'Contact',fields:[T('contact.title','Kop'),A('contact.intro','Introductie'),T('contact.email','E-mailadres'),T('contact.hours','Bereikbaarheid'),
    T('contact.formEndpoint','Formulieradres (Formspree)',{hint:'Bijvoorbeeld https://formspree.io/f/abcdwxyz. Leeg betekent dat het formulier niets verstuurt.'})]}
];
const SEO_FIELDS = [
  T('title','Paginatitel',{count:[30,60],hint:'Verschijnt als blauwe link in Google en in het browsertabblad.'}),
  A('description','Metabeschrijving',{count:[70,160],rows:3}),
  T('keyword','Focuszoekwoord',{hint:'De zoekterm waarop deze pagina gevonden moet worden.'}),
  T('url','Adres van de site',{hint:'Leeg laten gebruikt het vercel.app-adres. Vul je eigen domein in zodra je dat hebt, bijvoorbeeld https://www.dotwerk.nl/'}),
  {k:'index',l:'Zoekmachines mogen deze pagina opnemen',type:'bool'},
  T('ogTitle','Titel bij delen op LinkedIn en WhatsApp',{hint:'Leeg laten neemt de paginatitel.'}),
  A('ogDescription','Beschrijving bij delen',{rows:2,hint:'Leeg laten neemt de metabeschrijving.'}),
  T('org.name','Bedrijfsnaam'),T('org.city','Plaats'),T('org.email','E-mailadres'),T('org.phone','Telefoon'),T('org.kvk','KvK-nummer')
];

/* ---------- velden ---------- */
let uid = 0;
function fieldHtml(f, root, path){
  const p = (path ? path + '.' : '') + f.k, v = getAt(root, p), id = 'ed-' + (++uid);
  if (f.type === 'bool') return '<label class="mo-check" for="'+id+'"><input type="checkbox" id="'+id+'" data-path="'+p+'"'+(v?' checked':'')+'><span class="mo-check__box">'+ICON.check+'</span>'+esc(f.l)+'</label>';
  if (f.type === 'list') return listHtml(f, root, p);
  const len = String(v || '').length;
  const cnt = f.count ? '<span class="ed-count'+((len<f.count[0]||len>f.count[1])?' ed-count--bad':'')+'" data-count-for="'+p+'" data-min="'+f.count[0]+'" data-max="'+f.count[1]+'">'+len+' / '+f.count[1]+'</span>' : '';
  const input = f.type === 'area' ? '<textarea class="mo-input" id="'+id+'" data-path="'+p+'" rows="'+(f.rows||4)+'" style="min-height:0">'+esc(v)+'</textarea>'
    : '<input class="mo-input" id="'+id+'" data-path="'+p+'" value="'+esc(v)+'">';
  return '<div class="mo-field"><div class="ed-labelrow"><label class="mo-field__label" for="'+id+'">'+esc(f.l)+'</label>'+cnt+'</div>'+input+(f.hint?'<span class="mo-field__hint">'+esc(f.hint)+'</span>':'')+'</div>';
}
function listHtml(f, root, p){
  const arr = getAt(root, p) || [];
  const tools = i => '<button class="mo-iconbtn mo-iconbtn--sm" type="button" data-act="up" data-list="'+p+'" data-i="'+i+'" aria-label="Omhoog"'+(i===0?' disabled':'')+'>'+ICON.up+'</button>'+
    '<button class="mo-iconbtn mo-iconbtn--sm" type="button" data-act="down" data-list="'+p+'" data-i="'+i+'" aria-label="Omlaag"'+(i===arr.length-1?' disabled':'')+'>'+ICON.down+'</button>'+
    '<button class="mo-iconbtn mo-iconbtn--sm" type="button" data-act="del" data-list="'+p+'" data-i="'+i+'" aria-label="Verwijderen">'+ICON.x+'</button>';
  const body = arr.map((it, i) => {
    if (f.item === 'text') {const id = 'ed-' + (++uid); return '<div class="ed-row"><input class="mo-input" id="'+id+'" aria-label="'+esc(f.l)+' '+(i+1)+'" data-path="'+p+'.'+i+'" value="'+esc(it)+'">'+tools(i)+'</div>';}
    return '<div class="ed-item"><div class="ed-item__bar"><span>'+esc(f.name)+' '+(i+1)+'</span>'+tools(i)+'</div>'+f.item.map(sf => fieldHtml(sf, root, p+'.'+i)).join('')+'</div>';
  }).join('');
  return '<div class="ed-list"><div class="ed-list__label"><span class="mo-field__label">'+esc(f.l)+'</span></div>'+body+
    '<button class="mo-btn mo-btn--secondary mo-btn--sm" type="button" data-act="add" data-list="'+p+'" data-kind="'+esc(JSON.stringify(f.blank))+'">'+esc(f.add)+'</button></div>';
}

/* ---------- toestand ---------- */
let saved = null, draft = null, head = null, tab = 'content', saving = false, note = '', noteTone = '';
const openGroups = {'Hero': true, 'seo-checks': true};
const current = () => draft || saved;
const isDirty = () => !!draft && JSON.stringify(draft) !== JSON.stringify(saved);

function buildEditor(){
  const body = $('drawer-body'), st = body.scrollTop, d = draft;
  uid = 0;
  if (tab === 'content') {
    body.innerHTML = '<p class="ed-note">Wijzigingen zie je meteen in het voorbeeld. Bezoekers zien ze pas na Publiceren.</p>' +
      SCHEMA.map(g => '<details class="ed-group" data-group="'+esc(g.title)+'"'+(openGroups[g.title]?' open':'')+'><summary>'+esc(g.title)+ICON.chev+'</summary><div class="ed-group__body">'+
        g.fields.map(f => fieldHtml(f, d.content, '')).join('')+'</div></details>').join('');
  } else {
    body.innerHTML = '<div id="seo-live"></div>'+
      '<details class="ed-group" open data-group="seo-fields"><summary>Zoekresultaat en delen'+ICON.chev+'</summary><div class="ed-group__body">'+
      SEO_FIELDS.slice(0,7).map(f => fieldHtml(f, d.seo, '')).join('')+'</div></details>'+
      '<details class="ed-group"'+(openGroups['seo-org']?' open':'')+' data-group="seo-org"><summary>Bedrijfsgegevens voor Google'+ICON.chev+'</summary><div class="ed-group__body">'+
      '<p class="ed-note">Deze gegevens gaan als gestructureerde data mee, zodat Google je als lokaal bedrijf herkent.</p>'+
      SEO_FIELDS.slice(7).map(f => fieldHtml(f, d.seo, '')).join('')+'</div></details>'+
      '<div id="seo-code"></div>';
    renderSeoLive();
  }
  body.scrollTop = st;
}
function renderSeoLive(){
  const d = current(), s = d.seo, c = d.content, list = checks(s, c), ok = list.filter(x => x.ok).length, pct = Math.round(ok / list.length * 100);
  let title = s.title || c.brand, desc = s.description || '';
  if (title.length > 60) title = title.slice(0, 58).trim() + ' …';
  if (desc.length > 160) desc = desc.slice(0, 157).trim() + ' …';
  const url = siteUrl(s), host = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const live = $('seo-live');
  if (live) live.innerHTML =
    '<div class="score"><span class="score__num">'+pct+'</span><div class="mo-progress mo-progress--'+(pct>=80?'success':'warning')+'"><div class="mo-progress__top"><span>SEO-score</span><b>'+ok+' van '+list.length+' in orde</b></div><div class="mo-progress__track"><div class="mo-progress__bar" style="width:'+pct+'%"></div></div></div></div>'+
    '<div class="mo-field"><span class="mo-field__label">Zo ziet het eruit in Google</span><div class="serp"><div class="serp__site"><span class="serp__fav">'+dot({shape:'circle',color:'cobalt',interactive:false,followPointer:false},20)+'</span><span style="min-width:0">'+esc(s.org.name||c.brand)+'<small>'+esc(host)+'</small></span></div>'+
    '<p class="serp__title">'+esc(title)+'</p><p class="serp__desc">'+esc(desc)+'</p></div></div>'+
    '<details class="ed-group" data-group="seo-checks"'+(openGroups['seo-checks']?' open':'')+'><summary>Controlepunten'+ICON.chev+'</summary><div class="ed-group__body"><ul class="checks">'+
    list.map(x => '<li class="check check--'+(x.ok?'ok':'bad')+'">'+(x.ok?ICON.ok:ICON.alert)+'<div><b>'+esc(x.t)+'</b><span>'+(x.ok?'In orde. ':'Te verbeteren. ')+esc(x.d)+'</span></div></li>').join('')+'</ul></div></details>';
  const code = $('seo-code');
  const seoOut = Object.assign({}, s, {url});
  if (code) code.innerHTML = '<details class="ed-group" data-group="seo-export"'+(openGroups['seo-export']?' open':'')+'><summary>Wat er in de site komt'+ICON.chev+'</summary><div class="ed-group__body">'+
    '<p class="ed-note">Dit zet de site automatisch in de &lt;head&gt;, robots.txt en sitemap.xml bij elke publicatie.</p>'+
    codeBlock('Head-tags en gestructureerde data', headTags(seoOut, c))+codeBlock('robots.txt', robotsTxt(seoOut))+(s.index?codeBlock('sitemap.xml', sitemapXml(seoOut)):'')+'</div></details>';
  $('seo-count').textContent = pct;
  mountDemo();
}
const codeBlock = (label, text) => '<div class="code"><div class="code__bar"><span class="mo-field__label">'+esc(label)+'</span></div><pre tabindex="0">'+esc(text)+'</pre></div>';
function updateFoot(){
  const el = $('drawer-state'), dirty = isDirty();
  $('btn-save').disabled = !dirty || saving;
  $('btn-discard').disabled = !dirty || saving;
  el.className = 'drawer__state' + (noteTone ? ' drawer__state--' + noteTone : dirty ? ' drawer__state--dirty' : '');
  el.textContent = saving ? 'Bezig met publiceren…' : note ? note : dirty ? 'Niet-gepubliceerde wijzigingen' : 'Alles is gepubliceerd';
  $('seo-count').textContent = score(current().seo, current().content);
}

/* ---------- interactie ---------- */
const drawer = $('drawer'), fab = $('admin-fab');
let tPreview = 0;
function schedulePreview(){clearTimeout(tPreview); tPreview = setTimeout(() => {showPreview(); if (tab === 'seo') renderSeoLive(); updateFoot();}, 140);}
drawer.addEventListener('input', e => {
  const p = e.target.getAttribute('data-path'); if (!p || !draft) return;
  setAt(tab === 'content' ? draft.content : draft.seo, p, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
  const cnt = drawer.querySelector('[data-count-for="'+p+'"]');
  if (cnt) {const n = e.target.value.length; cnt.textContent = n + ' / ' + cnt.dataset.max; cnt.classList.toggle('ed-count--bad', n < +cnt.dataset.min || n > +cnt.dataset.max);}
  note = ''; noteTone = ''; updateFoot(); schedulePreview();
});
drawer.addEventListener('toggle', e => {const g = e.target.getAttribute && e.target.getAttribute('data-group'); if (g) openGroups[g] = e.target.open;}, true);
drawer.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const arr = getAt(draft.content, b.dataset.list), i = +b.dataset.i, act = b.dataset.act;
  if (act === 'add') arr.push(clone(JSON.parse(b.dataset.kind)));
  if (act === 'del') arr.splice(i, 1);
  if (act === 'up' && i > 0) arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
  if (act === 'down' && i < arr.length - 1) arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
  note = ''; noteTone = ''; buildEditor(); updateFoot(); showPreview();
});
function setTab(t){
  tab = t;
  $('tab-content').setAttribute('aria-selected', t === 'content');
  $('tab-seo').setAttribute('aria-selected', t === 'seo');
  $('drawer-body').scrollTop = 0; buildEditor();
}
$('tab-content').onclick = () => setTab('content');
$('tab-seo').onclick = () => setTab('seo');
function openDrawer(){drawer.hidden = false; fab.hidden = true; document.body.classList.add('is-editing'); buildEditor(); updateFoot();}
function closeDrawer(){drawer.hidden = true; fab.hidden = false; document.body.classList.remove('is-editing'); fab.focus();}
$('drawer-close').onclick = closeDrawer;
fab.onclick = openDrawer;
document.addEventListener('keydown', e => {if (e.key === 'Escape' && !drawer.hidden) closeDrawer();});
$('btn-discard').onclick = () => {draft = clone(saved); note = ''; noteTone = ''; buildEditor(); showPreview(); updateFoot();};
$('btn-save').onclick = async () => {
  if (!isDirty() || saving) return;
  saving = true; note = ''; noteTone = ''; updateFoot();
  const snap = clone(draft), data = {};
  if (JSON.stringify(snap.content) !== JSON.stringify(saved.content)) data.content = snap.content;
  if (JSON.stringify(snap.seo) !== JSON.stringify(saved.seo)) data.seo = snap.seo;
  const what = [data.content && 'inhoud', data.seo && 'SEO'].filter(Boolean).join(' en ');
  try {
    head = await publish(head, data, 'Beheer: ' + what + ' bijgewerkt');
    saved = snap;
    note = 'Gepubliceerd om ' + new Date().toLocaleTimeString('nl-NL', {hour: '2-digit', minute: '2-digit'}) + '. Binnen een minuut live.';
    noteTone = '';
  } catch (err) {
    noteTone = 'err';
    note = err.status === 401 ? 'Je sessie is verlopen. Log opnieuw in; je wijzigingen blijven staan.'
      : err.status === 422 || err.status === 409 ? 'Iemand anders heeft intussen gepubliceerd. Kopieer je wijzigingen en herlaad de pagina.'
      : err.status === 404 || err.status === 403 ? 'Je hebt geen schrijfrechten op de repository.'
      : 'Publiceren mislukt. Controleer je verbinding en probeer het opnieuw.';
    if (err.status === 401) {setToken(null); showLogin('Je sessie is verlopen. Log opnieuw in; je wijzigingen blijven bewaard zolang je dit tabblad open laat.');}
  }
  saving = false; updateFoot();
};
$('btn-logout').onclick = () => {setToken(null); location.reload();};

/* ---------- opstarten ---------- */
function loginMsg(tone, text){const m = $('login-msg'); m.hidden = !text; m.className = 'mo-banner mo-banner--' + tone; m.innerHTML = '<div class="mo-banner__body"></div>'; m.firstChild.textContent = text;}
function showLogin(text){
  $('login').hidden = false;
  if (text) loginMsg('warning', text);
  mountDemo();
}
async function start(){
  try {
    const data = await loadFiles();
    head = data.head;
    const fresh = {content: data.content, seo: data.seo};
    if (draft && saved && isDirty()) {saved = fresh;} // na opnieuw inloggen: concept bewaren
    else {saved = fresh; draft = clone(fresh);}
    $('login').hidden = true; $('preview').hidden = false;
    showPreview(); openDrawer();
  } catch (err) {
    if (err.status === 401) {setToken(null); showLogin();}
    else if (err.status === 404 || err.status === 403) {setToken(null); showLogin(); loginMsg('danger', 'Dit GitHub-account heeft geen toegang tot de repository ' + REPO + '.');}
    else {showLogin(); loginMsg('danger', 'Laden mislukt. Controleer je verbinding en herlaad de pagina.');}
  }
}
$('btn-login').onclick = async () => {
  loginMsg('info', '');
  try {setToken(await login()); await start();}
  catch (err) {loginMsg('danger', err.message === 'Pop-up geblokkeerd' ? 'Je browser blokkeerde het inlogvenster. Sta pop-ups toe voor deze site en probeer opnieuw.' : 'Inloggen mislukt: ' + err.message);}
};
getToken() ? start() : showLogin();
