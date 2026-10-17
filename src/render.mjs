// Zet content/home.json en content/seo.json om in kant-en-klare HTML.
// De opmaak is 1-op-1 overgenomen uit het Dotwerk-artifact; alleen het beheerpaneel is vervangen door Decap CMS (/admin).

const ICON = {
  check:'<svg class="mo-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  plus:'<svg class="mo-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  mail:'<svg class="mo-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/></svg>',
  clock:'<svg class="mo-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>'
};
const LOOKS = [
  {shape:'pebble',color:'sun',accessory:'glasses'},{shape:'circle',color:'cobalt',state:'work'},{shape:'squircle',color:'leaf',accessory:'beret'},
  {shape:'capsule',color:'tomato',accessory:'bow'},{shape:'drop',color:'plum'},{shape:'pebble',color:'sky'}];
const SMALL = [
  {shape:'circle',color:'cobalt',state:'wait'},{shape:'capsule',color:'teal'},{shape:'drop',color:'plum'},{shape:'pebble',color:'rose'},
  {shape:'squircle',color:'leaf'},{shape:'circle',color:'sky'}];

export function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const lines=arr=>(arr||[]).filter(s=>String(s).trim());
const dot=(look,size)=>'<span data-dot=\''+esc(JSON.stringify(Object.assign({size},look)))+'\' style="width:'+size+'px;height:'+size+'px"></span>';
const head=(s,id,withIntro)=>'<div class="sec-head"><p class="eyebrow">'+esc(s.eyebrow)+'</p><h2 class="heading-l" id="'+id+'">'+esc(s.title)+'</h2>'+(withIntro&&s.intro?'<p class="body-l">'+esc(s.intro)+'</p>':'')+'</div>';

export function renderBody(c){
  const h=c.hero, s=c.services, st=c.steps, pr=c.principles, cs=c.case, f=c.faq, ct=c.contact;
  return `
<header class="top">
  <div class="wrap top__in">
    <a class="brand" href="#top">${dot({shape:'circle',color:'cobalt',interactive:false},28)}<span>${esc(c.brand)}</span></a>
    <nav class="nav" aria-label="Hoofdmenu">
      <a href="#diensten">Diensten</a>
      <a href="#werkwijze">Werkwijze</a>
      <a href="#regie">Zo werken we</a>
      <a href="#vragen">Vragen</a>
    </nav>
    <a class="mo-btn mo-btn--primary mo-btn--sm" href="#contact">Gesprek plannen</a>
  </div>
</header>

<main id="top">
  <div class="wrap">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__copy">
        <p class="eyebrow">${esc(h.eyebrow)}</p>
        <h1 class="display-xl" id="hero-title">${esc(h.title)}</h1>
        <p class="body-l">${esc(h.intro)}</p>
        <div class="hero__cta"><a class="mo-btn mo-btn--primary mo-btn--lg" href="#contact">${esc(h.ctaPrimary)}</a>${h.ctaSecondary?'<a class="mo-btn mo-btn--outline mo-btn--lg" href="#werkwijze">'+esc(h.ctaSecondary)+'</a>':''}</div>
        <div class="hero__proof">${lines(h.proof).map(p=>'<span>'+ICON.check+esc(p)+'</span>').join('')}</div>
      </div>
      <div class="hero__demo" aria-label="Voorbeeld van een werkdag met AI-collega's">
        <div class="mo-card demo-card">
          <div class="demo-card__head">
            <h2 class="heading-s">Vandaag bij Bakker Installatie</h2>
            <span class="mo-badge">Voorbeeld</span>
          </div>
          <div id="feed"></div>
        </div>
        <div id="approval"></div>
        <p class="demo-note">Fictief voorbeeld. Probeer de knoppen: de AI-collega wacht op jouw besluit.</p>
      </div>
    </section>
    <div class="sectors" aria-label="Sectoren"><p class="eyebrow">${esc(c.sectorsLabel)}</p>${lines(c.sectors).map(x=>'<span class="mo-tag mo-tag--plain">'+esc(x)+'</span>').join('')}</div>
  </div>

  <div class="wrap">
    <section class="section" id="diensten" aria-labelledby="diensten-title">${head(s,'diensten-title',true)}<div class="grid3">${
      (s.items||[]).map((it,i)=>'<article class="mo-card mo-card--padded svc'+(it.featured?' svc--featured':'')+'">'+
        '<div class="svc__top">'+dot(LOOKS[i%LOOKS.length],64)+(it.badge?'<span class="mo-badge '+(it.featured?'mo-badge--solid':i===0?'mo-badge--success':'')+'">'+esc(it.badge)+'</span>':'')+'</div>'+
        '<h3 class="heading-m">'+esc(it.name)+'</h3><p class="body-s">'+esc(it.text)+'</p>'+
        '<ul>'+lines(it.bullets).map(b=>'<li>'+ICON.check+esc(b)+'</li>').join('')+'</ul>'+
        '<div class="svc__price"><b class="num">'+esc(it.price)+'</b><span class="body-s">'+esc(it.priceNote)+'</span></div></article>').join('')
    }</div></section>

    <section class="section" id="werkwijze" aria-labelledby="werkwijze-title">${head(st,'werkwijze-title')}<ol class="steps">${
      (st.items||[]).map((it,i)=>'<li class="step"><span class="step__n">Stap '+(i+1)+'</span><h3 class="heading-s">'+esc(it.title)+'</h3><p class="body-s">'+esc(it.text)+'</p>'+(it.when?'<span class="step__when">'+esc(it.when)+'</span>':'')+'</li>').join('')
    }</ol></section>

    <section class="section" id="regie" aria-labelledby="regie-title"><div class="split"><div class="sec-head" style="margin-bottom:0"><p class="eyebrow">${esc(pr.eyebrow)}</p><h2 class="heading-l" id="regie-title">${esc(pr.title)}</h2><p class="body-l">${esc(pr.intro)}</p></div><ul class="principles">${
      (pr.items||[]).map((it,i)=>'<li>'+dot(Object.assign({interactive:false},SMALL[i%SMALL.length]),28)+'<div><h3 class="heading-s">'+esc(it.title)+'</h3><p class="body-s">'+esc(it.text)+'</p></div></li>').join('')
    }</ul></div></section>

    <section class="section" id="case" aria-labelledby="case-title"><div class="mo-card mo-card--padded case"><div class="case__body">
      <div style="display:flex;gap:var(--space-2);align-items:center;flex-wrap:wrap"><span class="mo-badge">${esc(cs.label)}</span><span class="body-s">${esc(cs.meta)}</span></div>
      <h2 class="mo-sr" id="case-title">${esc(cs.label)}</h2><p class="quote">"${esc(cs.quote)}"</p><p class="body-s">${esc(cs.source)}</p></div>
      <div class="stats">${(cs.stats||[]).map(x=>'<div class="stat"><b>'+esc(x.value)+'</b><span class="body-s">'+esc(x.label)+'</span></div>').join('')}</div></div></section>

    <section class="section" id="vragen" aria-labelledby="vragen-title">${head(f,'vragen-title')}<div class="faq">${
      (f.items||[]).map(it=>'<details><summary>'+esc(it.q)+ICON.plus+'</summary><p>'+esc(it.a)+'</p></details>').join('')
    }</div></section>

    <section class="section" id="contact" aria-labelledby="contact-title">
      <div class="contact">
        <div class="contact__intro">${dot({shape:'circle',color:'cobalt'},64)}
          <h2 class="heading-l" id="contact-title">${esc(ct.title)}</h2><p class="body-l">${esc(ct.intro)}</p>
          ${ct.email?'<div class="contact-line">'+ICON.mail+'<a href="mailto:'+esc(ct.email)+'" style="color:inherit">'+esc(ct.email)+'</a></div>':''}
          ${ct.hours?'<div class="contact-line">'+ICON.clock+'<span>'+esc(ct.hours)+'</span></div>':''}
        </div>
        <form class="mo-card mo-card--padded form" id="scan-form" method="post" action="${esc(ct.formEndpoint||'')}" data-endpoint="${esc(ct.formEndpoint||'')}" novalidate>
          <div class="row2">
            <label class="mo-field" for="f-naam"><span class="mo-field__label">Naam</span><input class="mo-input" id="f-naam" name="naam" autocomplete="name" placeholder="Sanne de Vries" required></label>
            <label class="mo-field" for="f-bedrijf"><span class="mo-field__label">Bedrijf</span><input class="mo-input" id="f-bedrijf" name="bedrijf" autocomplete="organization" placeholder="De Vries Groothandel"></label>
          </div>
          <label class="mo-field" for="f-mail"><span class="mo-field__label">E-mailadres</span><input class="mo-input" id="f-mail" name="email" type="email" autocomplete="email" placeholder="sanne@devries.nl" required></label>
          <label class="mo-field" for="f-vraag"><span class="mo-field__label">Waar ben je de meeste tijd aan kwijt?</span><textarea class="mo-input" id="f-vraag" name="vraag" placeholder="Bijvoorbeeld: offertes maken, de inbox bijhouden, facturen invoeren"></textarea><span class="mo-field__hint">Een paar woorden is genoeg.</span></label>
          <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
          <button class="mo-btn mo-btn--primary mo-btn--block" type="submit">Scan aanvragen</button>
          <div id="form-msg" role="status" hidden></div>
        </form>
      </div>
    </section>
  </div>
</main>

<footer class="foot">
  <div class="wrap foot__in"><span>${esc(c.footer.left)}</span><span>${esc(c.footer.right)}</span></div>
</footer>`;
}

/* ---------- SEO ---------- */
const absUrl=u=>/^https?:\/\//.test(u||'')?u:'';
function jsonLd(seo,c){
  const org={'@context':'https://schema.org','@type':'ProfessionalService',name:seo.org.name||c.brand,description:seo.description,areaServed:'NL'};
  if(absUrl(seo.url)) org.url=seo.url;
  if(seo.org.email) org.email=seo.org.email;
  if(seo.org.phone) org.telephone=seo.org.phone;
  if(seo.org.city) org.address={'@type':'PostalAddress',addressLocality:seo.org.city,addressCountry:'NL'};
  if(seo.org.kvk) org.identifier={'@type':'PropertyValue',propertyID:'KvK',value:seo.org.kvk};
  const faq={'@context':'https://schema.org','@type':'FAQPage',mainEntity:(c.faq.items||[]).filter(i=>i.q&&i.a).map(i=>({'@type':'Question',name:i.q,acceptedAnswer:{'@type':'Answer',text:i.a}}))};
  return [org,faq];
}
export function headTags(seo,c){
  const t=[
    '<title>'+esc(seo.title||c.brand)+'</title>',
    '<meta name="description" content="'+esc(seo.description)+'">',
    '<meta name="robots" content="'+(seo.index?'index, follow':'noindex, nofollow')+'">'];
  if(absUrl(seo.url)) t.push('<link rel="canonical" href="'+esc(seo.url)+'">');
  t.push('<meta property="og:type" content="website">','<meta property="og:locale" content="nl_NL">',
    '<meta property="og:title" content="'+esc(seo.ogTitle||seo.title)+'">',
    '<meta property="og:description" content="'+esc(seo.ogDescription||seo.description)+'">');
  if(absUrl(seo.url)) t.push('<meta property="og:url" content="'+esc(seo.url)+'">');
  t.push('<meta name="twitter:card" content="summary">');
  jsonLd(seo,c).forEach(o=>t.push('<script type="application/ld+json">'+JSON.stringify(o).replace(/</g,'\\u003c')+'</script>'));
  return t.join('\n');
}
export function robotsTxt(seo){
  const base=absUrl(seo.url).replace(/\/?$/,'/');
  return 'User-agent: *\n'+(seo.index?'Allow: /\nDisallow: /admin/':'Disallow: /')+'\n'+(seo.index&&absUrl(seo.url)?'\nSitemap: '+base+'sitemap.xml\n':'');
}
export function sitemapXml(seo){
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>'+esc(seo.url)+'</loc>\n    <lastmod>'+new Date().toISOString().slice(0,10)+'</lastmod>\n  </url>\n</urlset>\n';
}
