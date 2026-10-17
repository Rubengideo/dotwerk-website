/* Speeltuin: maakt de onderdelen van /speeltuin/ levend met de Modulair-componenten. */
(function(){
"use strict";
var M=window.Modulair;
if(!M||!window.React||!window.ReactDOM) return;
var h=React.createElement, useState=React.useState, useEffect=React.useEffect, useRef=React.useRef;
var REDUCE=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
var COLORS=M.DOT_COLORS, SHAPES=M.DOT_SHAPES, ACCS=M.DOT_ACCESSORIES, STATES=M.DOT_STATES, LABELS=M.DOT_STATE_LABELS;
var HEX={cobalt:'#2F6BFF',tomato:'#FF5A36',sun:'#FFC22E',leaf:'#1FB070',plum:'#8B5CF6',rose:'#FF7EB6',teal:'#18B8B0',sky:'#5AB8FF'};
var SHAPE_NL={circle:'Rond',pebble:'Kiezel',squircle:'Blokje',capsule:'Capsule',drop:'Druppel'};
var ACC_NL={none:'Geen',glasses:'Bril',bow:'Strik',beret:'Baret',monocle:'Monocle'};
var COLOR_NL={cobalt:'Kobalt',tomato:'Tomaat',sun:'Zon',leaf:'Blad',plum:'Pruim',rose:'Roze',teal:'Teal',sky:'Lucht'};
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function mount(id,el){var n=document.getElementById(id); if(n) ReactDOM.createRoot(n).render(el); return n;}
function engineIn(el){var c=el&&el.querySelector('canvas'); return c&&c.__moDot;}

/* ---------- Dotfetti: confetti in de kleuren van de Dots ---------- */
var fx=null, parts=[], running=false;
function dotfetti(x,y,n){
  if(REDUCE) return;
  if(!fx){fx=document.createElement('canvas'); fx.className='dotfetti'; fx.setAttribute('aria-hidden','true'); document.body.appendChild(fx);}
  var dpr=Math.min(window.devicePixelRatio||1,2);
  fx.width=innerWidth*dpr; fx.height=innerHeight*dpr;
  var cols=Object.keys(HEX).map(function(k){return HEX[k];});
  for(var i=0;i<(n||90);i++){
    var a=-Math.PI/2+(Math.random()-.5)*2.6, sp=260+Math.random()*520;
    parts.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:3+Math.random()*6,c:pick(cols),life:1.4+Math.random()*.8,sq:Math.random()<.35,rot:Math.random()*6,vr:(Math.random()-.5)*10});
  }
  if(running) return;
  running=true; var last=performance.now(); requestAnimationFrame(tick);
  function tick(now){
    var dt=Math.min(.033,(now-last)/1000); last=now;
    var g=fx.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,innerWidth,innerHeight);
    for(var i=parts.length-1;i>=0;i--){
      var p=parts[i]; p.vy+=900*dt; p.vx*=.99; p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=p.vr*dt; p.life-=dt;
      if(p.life<=0||p.y>innerHeight+40){parts.splice(i,1);continue;}
      g.globalAlpha=Math.min(1,p.life*2); g.fillStyle=p.c;
      g.save(); g.translate(p.x,p.y); g.rotate(p.rot);
      if(p.sq){g.fillRect(-p.r,-p.r*.55,p.r*2,p.r*1.1);} else {g.beginPath(); g.arc(0,0,p.r,0,6.283); g.fill();}
      g.restore();
    }
    if(parts.length) requestAnimationFrame(tick); else {g.clearRect(0,0,innerWidth,innerHeight); running=false;}
  }
}
function burstFrom(el,n){var b=el.getBoundingClientRect(); dotfetti(b.left+b.width/2,b.top+b.height/2,n);}

/* ---------- vaste Dots in de HTML (logo, titel) ---------- */
document.querySelectorAll('[data-dot]').forEach(function(el){
  var p={}; try{p=JSON.parse(el.getAttribute('data-dot'));}catch(e){}
  el.style.width=el.style.height='';
  ReactDOM.createRoot(el).render(h(M.Dot,p));
});
mount('title-dot',h(M.Dot,{size:window.innerWidth<560?40:56,shape:'circle',color:'cobalt',state:'listen',name:'Dot'}));

/* ---------- donker/licht ---------- */
function ThemeSwitch(){
  var mq=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)');
  var st=useState(document.documentElement.getAttribute('data-theme')==='dark'||(!document.documentElement.getAttribute('data-theme')&&mq&&mq.matches));
  return h(M.Switch,{label:'Donker',checked:st[0],onChange:function(on){st[1](on); document.documentElement.setAttribute('data-theme',on?'dark':'light');}});
}
mount('theme-switch',h(ThemeSwitch));

/* ---------- hero: een groep Dots ---------- */
var CROWD=[
  {shape:'pebble',color:'sun',accessory:'glasses',size:88},{shape:'circle',color:'cobalt',size:120},{shape:'squircle',color:'leaf',accessory:'beret',size:84},
  {shape:'capsule',color:'tomato',accessory:'bow',size:64},{shape:'drop',color:'plum',size:96},{shape:'circle',color:'teal',accessory:'monocle',size:72},
  {shape:'pebble',color:'rose',size:60},{shape:'squircle',color:'sky',accessory:'glasses',size:100},{shape:'drop',color:'sun',size:56},
  {shape:'capsule',color:'leaf',size:76},{shape:'circle',color:'tomato',accessory:'beret',size:68},{shape:'pebble',color:'plum',accessory:'bow',size:80}];
var crowdBus={set:null};
function Crowd(){
  var st=useState(CROWD.map(function(){return 'idle';})), states=st[0], small=window.innerWidth<560;
  var timers=useRef([]);
  crowdBus.set=function(s,wave){
    timers.current.forEach(clearTimeout); timers.current=[];
    CROWD.forEach(function(_,i){
      timers.current.push(setTimeout(function(){st[1](function(prev){var n=prev.slice(); n[i]=s; return n;});},wave?i*90:0));
    });
  };
  return h('div',{className:'crowd__in'},CROWD.map(function(d,i){
    return h('span',{key:i,className:'crowd__item',style:{'--i':i}},h(M.Dot,{size:Math.round(d.size*(small?.62:1)),shape:d.shape,color:d.color,accessory:d.accessory,state:states[i],name:'Dot '+(i+1)}));
  }));
}
function CrowdActions(){
  var st=useState('idle');
  function go(s,e){
    st[1](s); crowdBus.set&&crowdBus.set(s,true);
    if(s==='done'&&e) burstFrom(e.currentTarget,120);
  }
  var b=function(s,label,icon,variant){return h(M.Button,{key:s,variant:st[0]===s?'primary':variant||'secondary',icon:icon,onClick:function(e){go(s,e);},'aria-pressed':st[0]===s},label);};
  return h(React.Fragment,null,
    b('done','Laat ze juichen','bolt'),b('think','Laat ze nadenken'),b('work','Aan het werk'),b('wait','Vraag akkoord'),b('idle','Rust','pause','ghost'));
}
mount('crowd',h(Crowd));
mount('crowd-actions',h(CrowdActions));

/* ---------- stemmingen ---------- */
document.querySelectorAll('#moods .mood').forEach(function(card){
  var s=card.getAttribute('data-state'), slot=card.querySelector('.mood__dot');
  var looks={idle:['pebble','sky'],listen:['circle','cobalt'],think:['squircle','plum'],work:['capsule','teal'],wait:['circle','sun'],done:['pebble','leaf'],blocked:['drop','tomato']};
  function Mood(){
    var st=useState(s);
    useEffect(function(){
      function replay(){st[1]('idle'); setTimeout(function(){st[1](s);},380);}
      card.addEventListener('click',replay);
      card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();replay();}});
      return function(){card.removeEventListener('click',replay);};
    },[]);
    return h(M.Dot,{size:80,shape:looks[s][0],color:looks[s][1],state:st[0],interactive:false});
  }
  card.classList.add('mo-card--interactive'); card.tabIndex=0; card.setAttribute('role','button'); card.setAttribute('aria-label',LABELS[s]+': nog eens laten zien');
  ReactDOM.createRoot(slot).render(h(Mood));
});

/* ---------- Dot-bouwer ---------- */
function Builder(){
  var st=useState({shape:'pebble',color:'sun',accessory:'glasses',state:'idle',name:'Fien',follow:true}), d=st[0];
  var stage=useRef(null), big=window.innerWidth<560?150:220;
  function set(k,v){st[1](function(p){var n=Object.assign({},p); n[k]=v; return n;});}
  function surprise(e){
    var names=['Fien','Joop','Noor','Bram','Saar','Teun','Lotte','Mees','Pim','Roos','Gijs','Ilse'];
    st[1]({shape:pick(SHAPES),color:pick(COLORS),accessory:pick(ACCS),state:pick(['idle','listen','think','work','wait','done']),name:pick(names),follow:d.follow});
    var eng=engineIn(stage.current); if(eng) eng.boop();
  }
  function boop(e){var eng=engineIn(stage.current); if(eng) eng.boop(); burstFrom(stage.current.querySelector('canvas'),40);}
  var code='<Dot\n  name="'+(d.name||'Dot')+'"\n  shape="'+d.shape+'"\n  color="'+d.color+'"\n'+(d.accessory!=='none'?'  accessory="'+d.accessory+'"\n':'')+'  state="'+d.state+'"\n  size={'+big+'}'+(d.follow?'':'\n  followPointer={false}')+'\n/>';
  return h('div',{className:'builder__grid'},
    h('div',{className:'builder__stage',ref:stage},
      h('div',{className:'builder__spot'},h(M.Dot,{size:big,shape:d.shape,color:d.color,accessory:d.accessory,state:d.state,name:d.name,followPointer:d.follow})),
      h('div',{className:'builder__id'},h('b',{className:'heading-m'},d.name||'Naamloos'),h(M.DotStatus,{state:d.state})),
      h('div',{className:'builder__stagebtns'},
        h(M.Button,{variant:'primary',icon:'bolt',onClick:surprise},'Verras me'),
        h(M.Button,{variant:'secondary',onClick:boop},'Aai'))),
    h('div',{className:'mo-card mo-card--padded builder__panel'},
      h('fieldset',{className:'ctl'},h('legend',{className:'ctl__label'},'Vorm'),
        h('div',{className:'ctl__row'},SHAPES.map(function(s){return h('button',{key:s,type:'button',className:'chip',onClick:function(){set('shape',s);},'aria-pressed':d.shape===s},
          h(M.Dot,{size:28,shape:s,color:d.color,interactive:false,followPointer:false}),SHAPE_NL[s]);}))),
      h('fieldset',{className:'ctl'},h('legend',{className:'ctl__label'},'Kleur'),
        h('div',{className:'ctl__row'},COLORS.map(function(c){return h('button',{key:c,type:'button',className:'swatch',style:{background:'var(--dot-'+c+')'},onClick:function(){set('color',c);},'aria-pressed':d.color===c,'aria-label':COLOR_NL[c],title:COLOR_NL[c]});}))),
      h('div',{className:'ctl'},h('span',{className:'ctl__label',id:'acc-l'},'Accessoire'),
        h('div',{className:'tabs-scroll'},h(M.Tabs,{label:'Accessoire',value:d.accessory,onChange:function(v){set('accessory',v);},tabs:ACCS.map(function(a){return {id:a,label:ACC_NL[a]};})}))),
      h('div',{className:'ctl'},h('span',{className:'ctl__label'},'Stemming'),
        h('div',{className:'tabs-scroll'},h(M.Tabs,{label:'Stemming',value:d.state,onChange:function(v){set('state',v);},tabs:STATES.map(function(s){return {id:s,label:LABELS[s]};})}))),
      h('div',{className:'ctl ctl--two'},
        h(M.Input,{label:'Naam',value:d.name,maxLength:16,onChange:function(e){set('name',e.target.value);},hint:'Zo heet je collega'}),
        h('div',{className:'ctl__switch'},h(M.Switch,{label:'Kijkt je na',checked:d.follow,onChange:function(v){set('follow',v);}}))),
      h('details',{className:'code'},h('summary',null,'Bekijk de code'),h('pre',null,h('code',null,code)))));
}
mount('builder',h(Builder));

/* ---------- live meekijken ---------- */
var TEAM={
  inbox:{name:'Inbox-collega',role:'Sorteert mail en zet antwoorden klaar',dot:{shape:'capsule',color:'teal'}},
  offerte:{name:'Offerte-collega',role:'Maakt offertes uit inmeetgegevens',dot:{shape:'circle',color:'cobalt'}},
  planning:{name:'Planning-collega',role:'Plant monteurs en materiaal in',dot:{shape:'squircle',color:'leaf',accessory:'beret'}},
  factuur:{name:'Factuur-collega',role:'Verstuurt facturen en herinneringen',dot:{shape:'drop',color:'plum',accessory:'monocle'}}};
var STEPS=['Inmeetgegevens uit de agenda gehaald','Prijzen uit jullie prijslijst berekend','Offerte opgemaakt in jullie huisstijl','Wachten op jouw akkoord','Offerte versturen'];
function blank(){return {msgs:[],typing:null,steps:0,task:false,roster:{inbox:'done',offerte:'idle',planning:'idle',factuur:'idle'},feed:[{time:'08:12',who:'Inbox-collega',text:'sorteerde 37 mails en zette 5 antwoorden klaar',dot:TEAM.inbox.dot,state:'done'}],approval:null,ended:false};}
function Sim(){
  var st=useState(blank), s=st[0];
  var pl=useState(false), playing=pl[0];
  var idx=useRef(0), timer=useRef(null), started=useRef(false), root=useRef(null), chat=useRef(null);
  function up(fn){st[1](function(p){var n=Object.assign({},p,{roster:Object.assign({},p.roster)}); fn(n); return n;});}
  function say(who,text){up(function(n){n.typing=null; n.msgs=n.msgs.concat([{who:who,text:text,time:clock()}]);});}
  function feed(who,text,state,code){up(function(n){n.feed=n.feed.concat([{time:clock(),who:TEAM[who].name,text:text,code:code,dot:TEAM[who].dot,state:state}]);});}
  var base=useRef(9*60+38);
  function clock(){base.current+=1; return String(Math.floor(base.current/60)).padStart(2,'0')+':'+String(base.current%60).padStart(2,'0');}
  var SCRIPT=[
    [600,function(){say('user','Kun je een offerte maken voor de warmtepomp van fam. Jansen? Gisteren ingemeten, 120 m².'); up(function(n){n.roster.offerte='listen';});}],
    [1100,function(){up(function(n){n.typing='offerte'; n.roster.offerte='think';});}],
    [1500,function(){say('offerte','Doe ik! Ik haal de inmeetgegevens uit de agenda en reken met jullie prijslijst.'); up(function(n){n.task=true; n.roster.offerte='work';}); feed('offerte','begon aan een offerte voor een warmtepomp','work','Fam. Jansen');}],
    [1400,function(){up(function(n){n.steps=1;});}],
    [1300,function(){up(function(n){n.steps=2; n.roster.planning='think';}); feed('planning','zoekt een montagedatum voor Fam. Jansen','think');}],
    [1500,function(){up(function(n){n.steps=3; n.roster.planning='done';}); feed('planning','reserveerde 2 monteurs op do 6 nov','done');}],
    [900,function(){up(function(n){n.typing='offerte';});}],
    [1300,function(){say('offerte','De offerte is klaar: € 8.420,00 inclusief installatie en 5 jaar garantie. Mag ik hem versturen?'); up(function(n){n.roster.offerte='wait'; n.approval='pending'; n.msgs=n.msgs.concat([{who:'approval'}]);});}]
  ];
  function run(){
    if(idx.current>=SCRIPT.length){pl[1](false); return;}
    timer.current=setTimeout(function(){SCRIPT[idx.current][1](); idx.current++; run();},REDUCE?Math.min(SCRIPT[idx.current][0],500):SCRIPT[idx.current][0]);
  }
  function play(){if(idx.current>=SCRIPT.length) return; pl[1](true); run();}
  function pause(){clearTimeout(timer.current); pl[1](false);}
  function restart(){clearTimeout(timer.current); idx.current=0; base.current=9*60+38; st[1](blank()); pl[1](true); setTimeout(run,50);}
  useEffect(function(){
    var io=new IntersectionObserver(function(es){if(es[0].isIntersecting&&!started.current){started.current=true; play();}},{threshold:.35});
    io.observe(root.current); return function(){io.disconnect(); clearTimeout(timer.current);};
  },[]);
  useEffect(function(){var c=chat.current; if(c) c.scrollTop=c.scrollHeight;},[s.msgs.length,s.typing]);
  function approve(){
    up(function(n){n.steps=5; n.roster.offerte='done'; n.approval='approved'; n.ended=true; n.roster.factuur='work';});
    feed('offerte','verstuurde de offerte naar Fam. Jansen','done');
    var ap=root.current.querySelector('.mo-approval'); if(ap) burstFrom(ap,140);
    setTimeout(function(){up(function(n){n.typing='offerte';});},500);
    setTimeout(function(){say('offerte','Verstuurd! Over vijf werkdagen stuur ik een vriendelijke herinnering als we niets horen.');},1700);
    setTimeout(function(){up(function(n){n.roster.factuur='idle';}); feed('factuur','zette de aanbetaling klaar voor na akkoord','done');},2600);
  }
  function reject(){
    up(function(n){n.roster.offerte='blocked'; n.approval='rejected'; n.ended=true;});
    setTimeout(function(){up(function(n){n.typing='offerte';});},400);
    setTimeout(function(){say('offerte','Prima, er is niets verstuurd. Wat moet er anders aan de offerte?'); up(function(n){n.roster.offerte='listen';});},1500);
  }
  function answer(q){
    var t=q.toLowerCase(), who='offerte', a='Goeie vraag! In het echt zou ik dit nu voor je uitzoeken. Dit is een demo met vaste antwoorden, maar in een gratis AI-scan laten we zien wat echt kan.';
    if(/plan|agenda|monteur|datum|morgen/.test(t)){who='planning'; a='Donderdag en vrijdag zijn er nog twee monteurs vrij. Zal ik er een vastzetten?';}
    else if(/mail|inbox|klant/.test(t)){who='inbox'; a='Er staan 5 conceptantwoorden klaar. Ik verstuur niets zonder jouw akkoord.';}
    else if(/factu|beta|geld|herinner/.test(t)){who='factuur'; a='Er staan nog 3 facturen open, samen € 4.180,00. Ik kan vandaag een herinnering sturen.';}
    else if(/offerte|prijs|kosten/.test(t)){a='Ik maak er graag nog een. Voor welke klant en welk werk?';}
    else if(/^(hoi|hallo|hey|hi|goedemorgen|dag)\b/.test(t)){a='Hoi! Ik ben de Offerte-collega. Vraag me iets over offertes, planning, mail of facturen.';}
    else if(/dank|top|super|bedankt/.test(t)){a='Graag gedaan! Daar ben ik voor.';}
    say('user',q); up(function(n){n.roster[who]='think';});
    setTimeout(function(){up(function(n){n.typing=who;});},500);
    setTimeout(function(){say(who,a); up(function(n){n.roster[who]=who==='offerte'&&n.approval==='pending'?'wait':'idle';});},1700);
  }
  var steps=STEPS.map(function(l,i){return {label:l,done:i<s.steps};});
  return h('div',{className:'sim__grid',ref:root},
    h('div',{className:'mo-card sim__chat'},
      h('div',{className:'sim__bar'},
        h(M.DotStack,{dots:[TEAM.inbox.dot,TEAM.offerte.dot,TEAM.planning.dot,TEAM.factuur.dot],size:24}),
        h('div',{className:'sim__title'},h('b',null,'Team Bakker Installatie'),h('span',{className:'body-s'},'4 AI-collega\'s · 1 mens')),
        h('span',{className:'mo-spacer'}),
        h(M.IconButton,{icon:playing?'pause':'play',label:playing?'Pauzeren':'Afspelen',size:'sm',onClick:playing?pause:play,disabled:!playing&&idx.current>=SCRIPT.length}),
        h(M.Button,{variant:'ghost',size:'sm',onClick:restart},'Opnieuw')),
      h('div',{className:'sim__msgs',ref:chat,'aria-live':'polite'},
        s.msgs.length?null:h('p',{className:'sim__empty body-s'},'Het gesprek begint zo...'),
        s.msgs.map(function(m,i){
          if(m.who==='approval') return h('div',{className:'sim__approval',key:i},h(M.ApprovalCard,{title:'Offerte versturen naar Fam. Jansen',dotName:'Offerte-collega',dot:TEAM.offerte.dot,
            detail:'Warmtepomp lucht-water, 120 m², inclusief installatie.',amount:'€ 8.420,00',rows:[['Montage','do 6 nov, 2 monteurs'],['Geldig tot','vr 31 okt']],
            approveLabel:'Versturen',rejectLabel:'Eerst nakijken',onApprove:approve,onReject:reject}));
          if(m.who==='user') return h(M.Message,{key:i,from:'user',name:'Jij',time:m.time},m.text);
          return h(M.Message,{key:i,name:TEAM[m.who].name,time:m.time,dot:Object.assign({state:'idle'},TEAM[m.who].dot)},m.text);
        }),
        s.typing?h(M.Message,{key:'t',name:TEAM[s.typing].name,typing:true,dot:TEAM[s.typing].dot}):null),
      h('div',{className:'sim__composer'},h(M.Composer,{placeholder:'Vraag het team iets, bijvoorbeeld over de planning',onSend:answer,mentions:[{name:'Offerte-collega',dot:TEAM.offerte.dot}]}))),
    h('div',{className:'sim__side'},
      s.task?h(M.TaskCard,{title:'Offerte warmtepomp Fam. Jansen',dotName:'Offerte-collega',due:'Vandaag 11:00',dot:TEAM.offerte.dot,steps:steps,state:s.roster.offerte==='blocked'?'blocked':s.steps>=5?'done':s.approval==='pending'?'wait':'work'})
        :h(M.EmptyState,{title:'Nog geen taken',body:'Zodra je iets vraagt, verschijnt hier de voortgang.',dot:{shape:'circle',color:'cobalt'},size:72}),
      h('div',{className:'mo-card mo-card--padded'},h('h3',{className:'heading-s side__h'},'Het team'),
        h(M.TeamRoster,{members:Object.keys(TEAM).map(function(k){return Object.assign({},TEAM[k],{state:s.roster[k]});})})),
      h('div',{className:'mo-card mo-card--padded'},h('h3',{className:'heading-s side__h'},'Logboek'),h(M.ActivityFeed,{items:s.feed.slice(-5)}))));
}
mount('sim',h(Sim));

/* ---------- bouwstenen ---------- */
function Block(p){return h('div',{className:'mo-card mo-card--padded block'+(p.wide?' block--wide':'')},h('div',{className:'block__head'},h('h3',{className:'heading-s'},p.title),p.tag?h('code',{className:'block__tag'},p.tag):null),p.children);}
function Gallery(){
  var ld=useState(false), tags=useState(['Offertes','Planning','Inbox','Facturen']), mail=useState(''), touched=useState(false);
  var prog=useState(64), dlg=useState(false), team=useState([]), sw=useState(true), banner=useState('info');
  var mailErr=touched[0]&&mail[0]&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail[0])?'Dit lijkt geen e-mailadres. Klopt de @ en de punt?':null;
  var BANNERS={info:['Nieuw','De Planning-collega kan nu ook materiaal bestellen.'],success:['Gelukt','12 facturen verstuurd, allemaal op tijd.'],warning:['Let op','Twee offertes wachten al drie dagen op je akkoord.'],danger:['Vastgelopen','De boekhoudkoppeling geeft geen antwoord. We kijken mee.']};
  return h(React.Fragment,null,
    h(Block,{title:'Knoppen',tag:'Button'},
      h('div',{className:'row'},h(M.Button,null,'Primair'),h(M.Button,{variant:'secondary'},'Secundair'),h(M.Button,{variant:'outline'},'Omlijnd'),h(M.Button,{variant:'ghost'},'Subtiel'),h(M.Button,{variant:'danger'},'Verwijderen')),
      h('div',{className:'row'},h(M.Button,{size:'sm',icon:'plus'},'Klein'),h(M.Button,{icon:'send'},'Middel'),h(M.Button,{size:'lg',iconRight:'arrowRight'},'Groot'),
        h(M.Button,{variant:'secondary',loading:ld[0],onClick:function(){ld[1](true); setTimeout(function(){ld[1](false);},1600);}},ld[0]?'Even geduld':'Klik om te laden')),
      h('div',{className:'row'},['search','calendar','mail','paperclip','mic','more'].map(function(i){return h(M.IconButton,{key:i,icon:i,label:i});}),h(M.IconButton,{icon:'send',label:'Versturen',variant:'primary',round:true}))),
    h(Block,{title:'Labels en tags',tag:'Badge · Tag'},
      h('div',{className:'row'},h(M.Badge,null,'Neutraal'),h(M.Badge,{tone:'info',icon:'info'},'Info'),h(M.Badge,{tone:'success',icon:'check'},'Klaar'),h(M.Badge,{tone:'warning',icon:'clock'},'Wacht'),h(M.Badge,{tone:'danger',icon:'alert'},'Fout'),h(M.Badge,{tone:'solid'},'Populair')),
      h('div',{className:'row'},tags[0].map(function(t){return h(M.Tag,{key:t,onRemove:function(){tags[1](tags[0].filter(function(x){return x!==t;}));}},t);}),
        tags[0].length<4?h(M.Button,{variant:'ghost',size:'sm',onClick:function(){tags[1](['Offertes','Planning','Inbox','Facturen']);}},'Herstel'):null),
      h('div',{className:'row'},h(M.Tag,{mention:true,dot:TEAM.offerte.dot},'Offerte-collega'),h(M.Tag,{mention:true,dot:TEAM.planning.dot},'Planning-collega'),h(M.Tag,{dot:TEAM.inbox.dot},'Inbox-collega'))),
    h(Block,{title:'Formulieren',tag:'Input · Switch · Checkbox'},
      h(M.Input,{label:'E-mailadres',type:'email',placeholder:'sanne@devries.nl',value:mail[0],onChange:function(e){mail[1](e.target.value);},onBlur:function(){touched[1](true);},error:mailErr,hint:'Typ eens iets zonder @ en klik ernaast'}),
      h(M.Input,{label:'Waar ben je de meeste tijd aan kwijt?',multiline:true,rows:2,placeholder:'Offertes maken, de inbox bijhouden...'}),
      h('div',{className:'row row--tight'},h(M.Switch,{label:'Meldingen',checked:sw[0],onChange:sw[1]}),h(M.Switch,{label:'Uitgeschakeld',disabled:true})),
      h('div',{className:'row row--tight'},h(M.Checkbox,{label:'Offertes eerst laten nakijken',defaultChecked:true}),h(M.Checkbox,{label:'Wekelijks overzicht'}))),
    h(Block,{title:'Voortgang',tag:'ProgressBar'},
      h(M.ProgressBar,{label:'Pilot afgerond',value:prog[0],tone:prog[0]>=100?'success':prog[0]<25?'warning':undefined}),
      h('input',{type:'range',min:0,max:100,value:prog[0],className:'range','aria-label':'Voortgang aanpassen',onChange:function(e){prog[1](+e.target.value);}}),
      h(M.ProgressBar,{label:'Uren bespaard deze maand',value:31,max:40,valueLabel:'31 van 40 uur',tone:'success'}),
      h(M.ProgressBar,{label:'Offertes nagekeken',value:3,max:8,valueLabel:'3 van 8'})),
    h(Block,{title:'Meldingen',tag:'Banner'},
      h('div',{className:'tabs-scroll'},h(M.Tabs,{label:'Soort melding',value:banner[0],onChange:banner[1],tabs:[{id:'info',label:'Info'},{id:'success',label:'Gelukt'},{id:'warning',label:'Let op'},{id:'danger',label:'Fout'}]})),
      h(M.Banner,{tone:banner[0],title:BANNERS[banner[0]][0],action:h(M.Button,{size:'sm',variant:'secondary'},'Bekijk')},BANNERS[banner[0]][1])),
    h(Block,{title:'Mensen en Dots',tag:'Avatar · DotStack · EmptyState'},
      h('div',{className:'row'},h(M.Avatar,{name:'Sanne de Vries',size:40}),h(M.Avatar,{name:'Ruben Bakker',size:40}),h(M.Avatar,{name:'Ilse',size:40}),
        h(M.DotStack,{dots:[TEAM.inbox.dot,TEAM.offerte.dot,TEAM.planning.dot,TEAM.factuur.dot,{shape:'pebble',color:'rose'},{shape:'circle',color:'sun'}],max:4,size:40})),
      team[0].length?h('div',{className:'team'},
          h(M.DotStack,{dots:team[0],max:6,size:48}),
          h('p',{className:'body-s'},team[0].length===1?'1 Dot in je team':team[0].length+' Dots in je team'),
          h('div',{className:'row row--tight'},h(M.Button,{size:'sm',icon:'plus',onClick:function(){team[1](team[0].concat([{shape:pick(SHAPES),color:pick(COLORS),accessory:pick(ACCS),state:'done'}]));}},'Nog een'),h(M.Button,{size:'sm',variant:'ghost',onClick:function(){team[1]([]);}},'Leegmaken')))
        :h(M.EmptyState,{title:'Nog geen Dots',body:'Stel je eerste AI-collega samen.',size:72,dot:{shape:'pebble',color:'sky',state:'wait'},action:h(M.Button,{icon:'plus',onClick:function(){team[1]([{shape:pick(SHAPES),color:pick(COLORS),state:'done'}]);}},'Dot toevoegen')})),
    h(Block,{title:'Dialoog',tag:'Dialog'},
      h('p',{className:'body-s'},'Voor beslissingen die je niet ongedaan kunt maken, vraagt een Dot het je altijd even apart.'),
      h('div',{className:'row'},h(M.Button,{variant:'danger',icon:'alert',onClick:function(){dlg[1](true);}},'Alle concepten wissen')),
      h(M.Dialog,{open:dlg[0],title:'37 concepten wissen?',dot:{shape:'capsule',color:'teal',state:'wait'},onClose:function(){dlg[1](false);},
        actions:[h(M.Button,{key:'n',variant:'secondary',onClick:function(){dlg[1](false);}},'Toch bewaren'),h(M.Button,{key:'y',variant:'danger',onClick:function(){dlg[1](false);}},'Ja, wissen')]},
        'De Inbox-collega heeft 37 conceptantwoorden klaarstaan. Als je ze wist, zijn ze echt weg. (In deze demo gebeurt er niets.)')));
}
mount('gallery',h(Gallery));

/* ---------- fundament ---------- */
function Tokens(){
  var cp=useState(null), mv=useState(false);
  function copy(c){
    try{navigator.clipboard.writeText(HEX[c]);}catch(e){}
    cp[1](c); setTimeout(function(){cp[1](function(v){return v===c?null:v;});},1400);
  }
  var EASE=[['ease-out','--ease-out','240ms','Voor bijna alles: snel weg, zacht aankomen'],['ease-in-out','--ease-in-out','450ms','Voor grote verschuivingen'],['spring','--ease-spring','450ms','Voor plezier: schiet een tikje door']];
  return h(React.Fragment,null,
    h(Block,{title:'De acht Dot-kleuren',tag:'--dot-*',wide:true},
      h('div',{className:'palette'},COLORS.map(function(c,i){
        return h('button',{key:c,type:'button',className:'pal',onClick:function(){copy(c);},'aria-label':COLOR_NL[c]+' '+HEX[c]+' kopiëren'},
          h(M.Dot,{size:56,shape:SHAPES[i%SHAPES.length],color:c,state:cp[0]===c?'done':'idle',interactive:false}),
          h('b',null,COLOR_NL[c]),h('code',null,cp[0]===c?'Gekopieerd':HEX[c]));
      }))),
    h(Block,{title:'Letters',tag:'--font-*'},
      h('div',{className:'type'},
        h('div',null,h('span',{className:'type__big'},'Aa'),h('p',{className:'body-s'},'Bricolage Grotesque · koppen')),
        h('div',null,h('span',{className:'type__body'},'Aa'),h('p',{className:'body-s'},'Figtree · lopende tekst')),
        h('div',null,h('span',{className:'type__mono'},'09:40'),h('p',{className:'body-s'},'JetBrains Mono · tijden en code'))),
      h('div',{className:'scale'},h('span',{className:'display-xl'},'56'),h('span',{className:'heading-l'},'28'),h('span',{className:'heading-m'},'22'),h('span',{className:'heading-s'},'18'),h('span',null,'15'),h('span',{className:'body-s'},'13'))),
    h(Block,{title:'Beweging',tag:'--ease-*'},
      h('div',{className:'motion'+(mv[0]?' motion--go':'')},EASE.map(function(e,i){
        return h('div',{key:e[0],className:'track'},h('div',{className:'track__head'},h('b',null,e[0]),h('code',null,e[2])),
          h('div',{className:'track__lane'},h('span',{className:'track__ball',style:{transitionTimingFunction:'var('+e[1]+')',transitionDuration:REDUCE?'0ms':(i===0?'var(--duration-base)':'var(--duration-slow)'),background:'var(--dot-'+['cobalt','tomato','leaf'][i]+')'}})),
          h('p',{className:'body-s'},e[3]));
      })),
      h(M.Button,{variant:'secondary',icon:'play',onClick:function(){mv[1](!mv[0]);}},mv[0]?'Terug':'Speel af')),
    h(Block,{title:'Hoeken en schaduw',tag:'--radius-* · --shadow-*'},
      h('div',{className:'radii'},[['xs',4],['sm',6],['md',10],['lg',16],['xl',24],['pill',999]].map(function(r){return h('div',{key:r[0],className:'radius',style:{borderRadius:'var(--radius-'+r[0]+')'}},h('code',null,r[0]));})),
      h('div',{className:'shadows'},['sm','md','lg'].map(function(s){return h('div',{key:s,className:'shadow',style:{boxShadow:'var(--shadow-'+s+')'}},h('code',null,'shadow-'+s));}))));
}
mount('tokens-root',h(Tokens));

/* ---------- slot ---------- */
mount('end-dots',h(function(){
  var looks=[TEAM.inbox.dot,TEAM.offerte.dot,TEAM.planning.dot,TEAM.factuur.dot,{shape:'pebble',color:'sun',accessory:'glasses'}];
  return h(React.Fragment,null,looks.map(function(d,i){return h(M.Dot,{key:i,size:i===2?72:56,shape:d.shape,color:d.color,accessory:d.accessory,state:i===2?'wait':'idle'});}));
}));
})();
