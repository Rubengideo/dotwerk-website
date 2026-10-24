(function(){
"use strict";
var M=window.Modulair;

/* ---------- Dots ---------- */
if(M&&window.React&&window.ReactDOM){
  var h=React.createElement;
  document.querySelectorAll('[data-dot]').forEach(function(el){
    var p={}; try{p=JSON.parse(el.getAttribute('data-dot'));}catch(e){}
    el.style.width=el.style.height='';
    ReactDOM.createRoot(el).render(h(M.Dot,p));
  });
  ReactDOM.createRoot(document.getElementById('feed')).render(h(M.ActivityFeed,{items:[
    {time:'08:12',who:'Inbox-collega',text:'sorteerde 37 mails en zette 5 antwoorden klaar',dot:{shape:'capsule',color:'teal'},state:'done'},
    {time:'09:40',who:'Offerte-collega',text:'maakt een offerte voor een warmtepomp',code:'Fam. Jansen',dot:{shape:'circle',color:'cobalt'},state:'work'},
    {time:'10:05',who:'Planning-collega',text:'plande 3 monteurs in voor donderdag',dot:{shape:'squircle',color:'leaf'},state:'done'}]}));
  ReactDOM.createRoot(document.getElementById('approval')).render(h(M.ApprovalCard,{
    title:'Offerte versturen naar Fam. Jansen',dotName:'Offerte-collega',dot:{shape:'circle',color:'cobalt'},
    detail:'Ik heb de offerte voor de warmtepomp klaar. Mag ik hem versturen?',amount:'€ 8.420,00',
    rows:[['Inclusief','Installatie en 5 jaar garantie'],['Geldig tot','vr 31 okt']],approveLabel:'Versturen',rejectLabel:'Eerst nakijken'}));
}

/* ---------- speelse achtergrond ---------- */
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Stippenveld: één stip per 24 px, meeschuivend met de pagina. Een paar procent is confetti in
// een Dot-kleur, vaker in de marges dan achter de tekst. Rond de cursor zwellen de stippen op,
// kleuren ze mee en wijken ze een stukje uit.
var field=document.querySelector('.field');
if(field&&field.getContext){
  var g=field.getContext('2d'), PITCH=24, R=170, COLORS=['cobalt','tomato','sun','leaf','plum','rose','teal','sky'];
  var pal={}, W=0, H=0, dpr=1, mx=-999, my=-999, lx=-999, ly=-999, on=0, onT=0, queued=0;
  var fine=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var readColors=function(){
    var cs=getComputedStyle(document.documentElement);
    pal.base=cs.getPropertyValue('--line').trim()||'#E1E5EC';
    COLORS.forEach(function(c){pal[c]=cs.getPropertyValue('--dot-'+c).trim();});
  };
  var hash=function(i,j){var x=Math.sin(i*127.1+j*311.7)*43758.5453;return x-Math.floor(x);};
  var size=function(){
    dpr=Math.min(window.devicePixelRatio||1,2); W=innerWidth; H=innerHeight;
    field.width=W*dpr; field.height=H*dpr; draw();
  };
  var draw=function(){
    queued=0;
    var k=reduce?1:.2;
    lx+=(mx-lx)*k; ly+=(my-ly)*k; on+=(onT-on)*(reduce?1:.12);
    g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
    var sy=window.scrollY||0, j0=Math.floor(sy/PITCH), off=-(sy%PITCH);
    var col=Math.max(0,(W-1120)/2), cols=Math.ceil(W/PITCH)+1, rows=Math.ceil(H/PITCH)+1;
    for(var j=0;j<rows;j++){
      var y=off+j*PITCH+12, jj=j0+j;
      for(var i=0;i<cols;i++){
        var x=i*PITCH+12, h=hash(i,jj), inside=x>col+16&&x<W-col-16;
        var confetti=!inside&&h<.09, c=COLORS[Math.floor(hash(jj,i)*8)];
        var r=confetti?2.25:1.25, color=confetti?pal[c]:pal.base, a=1;
        if(on>.01){
          var dx=x-lx, dy=y-ly, d=Math.sqrt(dx*dx+dy*dy);
          if(d<R){
            var t=(1-d/R)*on, e=t*t*(3-2*t), push=e*7/(d||1);
            x+=dx*push; y+=dy*push; r+= e*2.2; color=pal[c]; a=confetti?1:.35+e*.65;
          }
        }
        g.globalAlpha=a; g.fillStyle=color; g.beginPath(); g.arc(x,y,r,0,6.2832); g.fill();
      }
    }
    g.globalAlpha=1;
    if(Math.abs(mx-lx)+Math.abs(my-ly)>.5||Math.abs(onT-on)>.01) request();
  };
  var request=function(){if(!queued){queued=1;requestAnimationFrame(draw);}};
  readColors(); size();
  window.addEventListener('resize',size);
  window.addEventListener('scroll',request,{passive:true});
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){readColors();request();});
  if(fine){
    document.addEventListener('pointermove',function(e){
      if(onT===0){lx=e.clientX;ly=e.clientY;}
      mx=e.clientX; my=e.clientY; onT=1; request();
    },{passive:true});
    document.documentElement.addEventListener('pointerleave',function(){onT=0;request();});
  }
}
// Dots op de lijnen springen één keer op als hun lijn in beeld komt, de een na de ander.
if(!reduce&&'IntersectionObserver' in window){
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(!en.isIntersecting) return; io.unobserve(en.target);
      en.target.querySelectorAll('canvas').forEach(function(cv,i){
        setTimeout(function(){if(cv.__moDot) cv.__moDot.boop();},180+i*110);
      });
    });
  },{rootMargin:'0px 0px -25% 0px'});
  setTimeout(function(){document.querySelectorAll('.crew,.demo-card__perch').forEach(function(el){io.observe(el);});},300);
}

/* ---------- contactformulier ---------- */
var form=document.getElementById('scan-form'), msg=document.getElementById('form-msg');
var endpoint=form.getAttribute('data-endpoint');
function say(tone,title,text){
  msg.hidden=false; msg.className='mo-banner mo-banner--'+tone;
  msg.innerHTML='<div class="mo-banner__body"><span class="mo-banner__title"></span><span></span></div>';
  msg.querySelector('.mo-banner__title').textContent=title; msg.querySelector('span:last-child').textContent=text;
}
form.addEventListener('submit',function(e){
  e.preventDefault();
  if(!form.checkValidity()){say('danger','Vul je naam en e-mailadres in','Dan weten we wie we kunnen terugmailen.');return;}
  if(!endpoint){say('info','Aanvraag niet verstuurd','Het formulier is nog niet gekoppeld. Mail ons gerust direct.');return;}
  var btn=form.querySelector('button[type=submit]'); btn.disabled=true;
  fetch(endpoint,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}})
    .then(function(r){
      if(!r.ok) throw new Error(r.status);
      form.reset(); say('success','Bedankt, je aanvraag is binnen','Je hoort binnen twee werkdagen van ons.');
    })
    .catch(function(){say('danger','Versturen mislukt','Probeer het nog eens, of mail ons direct.');})
    .then(function(){btn.disabled=false;});
});
})();
