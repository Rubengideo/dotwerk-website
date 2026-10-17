// De Speeltuin (/speeltuin/): een etalage van het Modulair-ontwerpsysteem.
// De teksten staan hier vast in de HTML; src/speeltuin.js maakt de onderdelen levend.
import {esc} from './render.mjs';

const absUrl=u=>/^https?:\/\//.test(u||'')?u:'';
const dot=(look,size)=>'<span data-dot=\''+esc(JSON.stringify(Object.assign({size},look)))+'\' style="width:'+size+'px;height:'+size+'px"></span>';
const head=(eyebrow,title,id,intro)=>'<div class="sec-head"><p class="eyebrow">'+esc(eyebrow)+'</p><h2 class="heading-l" id="'+id+'">'+esc(title)+'</h2>'+(intro?'<p class="body-l">'+esc(intro)+'</p>':'')+'</div>';

export const SPEELTUIN = {
  path: 'speeltuin/',
  title: 'Speeltuin: zo voelen AI-collega\'s | Dotwerk',
  description: 'Speel met de Dots van Dotwerk: bouw je eigen AI-collega, kijk mee met een werkdag en ontdek alle bouwstenen van ons ontwerpsysteem Modulair.'
};

export function speeltuinHead(seo){
  const url=absUrl(seo.url)?seo.url.replace(/\/?$/,'/')+SPEELTUIN.path:'';
  const t=[
    '<title>'+esc(SPEELTUIN.title)+'</title>',
    '<meta name="description" content="'+esc(SPEELTUIN.description)+'">',
    '<meta name="robots" content="'+(seo.index?'index, follow':'noindex, nofollow')+'">'];
  if(url) t.push('<link rel="canonical" href="'+esc(url)+'">','<meta property="og:url" content="'+esc(url)+'">');
  t.push('<meta property="og:type" content="website">','<meta property="og:locale" content="nl_NL">',
    '<meta property="og:title" content="'+esc(SPEELTUIN.title)+'">',
    '<meta property="og:description" content="'+esc(SPEELTUIN.description)+'">',
    '<meta name="twitter:card" content="summary">');
  return t.join('\n');
}

const STATES=[
  ['idle','Wacht rustig af, ademt zachtjes en kijkt je na.'],
  ['listen','Hoort je vraag. De ring beweegt mee met je stem.'],
  ['think','Kijkt omhoog en broedt op een goed antwoord.'],
  ['work','Er draait een maantje rond zolang het werk loopt.'],
  ['wait','Springt op met een geel bolletje: jouw akkoord is nodig.'],
  ['done','Blije oogjes, een sprongetje en een beetje confetti.'],
  ['blocked','Kleurt grijs en kijkt omlaag. Er is hulp nodig.']];
const LABEL={idle:'Rust',listen:'Luistert',think:'Denkt na',work:'Bezig',wait:'Wacht op jou',done:'Klaar',blocked:'Vastgelopen'};

export function renderSpeeltuin(c){
  return `
<a class="mo-sr skip" href="#main">Naar de inhoud</a>
<header class="top">
  <div class="wrap top__in">
    <a class="brand" href="/">${dot({shape:'circle',color:'cobalt',interactive:false},28)}<span>${esc(c.brand)}</span></a>
    <nav class="nav" aria-label="Speeltuin">
      <a href="#dots">De Dots</a>
      <a href="#bouwer">Bouw je Dot</a>
      <a href="#live">Live</a>
      <a href="#bouwstenen">Bouwstenen</a>
    </nav>
    <span id="theme-switch" class="theme-switch"></span>
    <a class="mo-btn mo-btn--primary mo-btn--sm" href="/#contact">Gesprek plannen</a>
  </div>
</header>

<main id="main">
  <div class="wrap">
    <section class="pg-hero" aria-labelledby="pg-title">
      <div class="pg-hero__copy">
        <p class="eyebrow">Speeltuin · ontwerpsysteem Modulair</p>
        <h1 class="display-xl" id="pg-title">Maak kennis met de <span class="pg-inline-dot" id="title-dot" aria-hidden="true"></span> Dots</h1>
        <p class="body-l">Bij Dotwerk krijgt elke AI-collega een gezicht. Ze kijken je na, denken hardop, juichen als iets lukt en wachten netjes op jouw akkoord. Beweeg je muis, tik ze aan en speel gerust met alles op deze pagina.</p>
        <div class="pg-hero__cta" id="crowd-actions"></div>
      </div>
      <div class="crowd" id="crowd" aria-label="Een groep Dots die je volgen met hun ogen"></div>
    </section>
  </div>

  <div class="wrap">
    <section class="section" id="dots" aria-labelledby="dots-title">
      ${head('Zeven stemmingen','Je ziet meteen wat een Dot aan het doen is','dots-title','Geen draaiende wieltjes of cryptische meldingen. Elke Dot laat met zijn hele lijf zien of hij luistert, werkt of op jou wacht. Tik op een kaart om hem nog eens te zien.')}
      <div class="moods" id="moods">${STATES.map(([s,t])=>'<div class="mo-card mo-card--padded mood" data-state="'+s+'"><div class="mood__dot"></div><span class="mo-status mo-status--'+s+'"><span class="mo-status__mark"></span>'+LABEL[s]+'</span><p class="body-s">'+esc(t)+'</p></div>').join('')}</div>
    </section>

    <section class="section" id="bouwer" aria-labelledby="bouwer-title">
      ${head('Dot-bouwer','Bouw je eigen AI-collega','bouwer-title','Vijf vormen, acht kleuren, vier accessoires en zeven stemmingen. Samen tweehonderd verschillende collega\'s, allemaal uit hetzelfde systeem.')}
      <div id="builder" class="builder"></div>
    </section>

    <section class="section" id="live" aria-labelledby="live-title">
      ${head('Live meekijken','Een werkdag bij Bakker Installatie, in een halve minuut','live-title','Zo werken de Dots samen. De Offerte-collega maakt een offerte, de Planning-collega zoekt een datum en niets gaat de deur uit zonder jouw goedkeuring. Typ gerust zelf iets in de chat.')}
      <div id="sim" class="sim"></div>
      <p class="demo-note">Fictief voorbeeld met vaste antwoorden. Er wordt niets verstuurd.</p>
    </section>

    <section class="section" id="bouwstenen" aria-labelledby="bouwstenen-title">
      ${head('Bouwstenen','Alles werkt, alles is van hetzelfde systeem','bouwstenen-title','Knoppen, velden, meldingen en dialogen delen dezelfde maten, kleuren en bewegingen. Daardoor voelt elk scherm dat we voor je bouwen meteen vertrouwd.')}
      <div id="gallery" class="gallery"></div>
    </section>

    <section class="section" id="tokens" aria-labelledby="tokens-title">
      ${head('Fundament','De kleuren, letters en bewegingen eronder','tokens-title','Rustig grijs en wit als basis. De Dots zijn de enige kleur, zodat je oog altijd weet waar het werk gebeurt.')}
      <div id="tokens-root" class="tokens"></div>
    </section>

    <section class="section pg-end" aria-labelledby="end-title">
      <div class="mo-card mo-card--padded pg-end__card">
        <div class="pg-end__dots" id="end-dots"></div>
        <h2 class="heading-l" id="end-title">Zo voelt AI in jouw bedrijf</h2>
        <p class="body-l">Benieuwd welke Dots jouw team het meeste tijd besparen? In een gratis AI-scan van een uur zetten we de drie grootste kansen op een rij.</p>
        <div class="pg-hero__cta"><a class="mo-btn mo-btn--primary mo-btn--lg" href="/#contact">Gratis AI-scan aanvragen</a><a class="mo-btn mo-btn--outline mo-btn--lg" href="/">Terug naar de homepage</a></div>
      </div>
    </section>
  </div>
</main>

<footer class="foot">
  <div class="wrap foot__in"><span>${esc(c.footer.left)}</span><span>Gemaakt met Modulair, het ontwerpsysteem van ${esc(c.brand)}</span></div>
</footer>`;
}
