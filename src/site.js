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
