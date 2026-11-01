/* ---------- Cumbres y Lugares: «Cerca de un lugar» y «Cerca de mí» (como en Rutas); en Rutas también «Cerca de mí» ---------- */
(function(){
let PICK=null;   // pestaña que está eligiendo sitio («cumbres» o «lugares»)
window.cercaBar=(kind,C)=>`<div class="wizrow cerca"><button class="btn ghost wizbtn" data-cnear>📍 Cerca de un lugar</button><button class="btn ghost wizbtn" data-cme>🎯 Cerca de mí</button></div>`+
  (C.near?`<div class="wzban"><b>📍 Cerca de ${esc(C.near.label)}</b><span>A menos de ${C.near.rad} km, de la más cercana a la más lejana.</span><div><button class="btn primary" data-cnear>Cambiar</button> <button class="linkbtn" data-cnoff>Ver todas</button></div></div>`:"");
window.cercaTit=()=>PICK==="cumbres"?"Cumbres cerca de…":PICK==="lugares"?"Lugares cerca de…":"Rutas cerca de…";
window.nearPick=(lat,lon,label)=>{if(!PICK)return false;const k=PICK;PICK=null;COL[k].near={lat,lon,label,rad:radAt(lat,lon)};
  if(typeof OVS!=="undefined"&&OVS.length)ovCloseAll();setTimeout(()=>{showView(k);renderCol(k);const v=document.getElementById("v-"+k);if(v)v.scrollTop=0},150);return true};
function geo(cb){if(!navigator.geolocation){toast("Este móvil no da la ubicación");return}toast("Buscando dónde estás…");
  navigator.geolocation.getCurrentPosition(p=>cb(p.coords.latitude,p.coords.longitude),()=>toast("No he podido saber dónde estás. Revisa que la ubicación esté activada."),{enableHighAccuracy:true,timeout:12000,maximumAge:300000})}
for(const k of ["cumbres","lugares"]){const v=document.getElementById("v-"+k);if(!v)continue;v.addEventListener("click",e=>{
  if(e.target.closest("[data-cnear]")){PICK=k;ovShow({t:"search"});return}
  if(e.target.closest("[data-cme]")){geo((la,lo)=>{PICK=k;nearPick(la,lo,"tu ubicación")});return}
  if(e.target.closest("[data-cnoff]")){COL[k].near=null;renderCol(k)}})}
// si se sale de la búsqueda sin elegir sitio, no queda pendiente
addEventListener("popstate",()=>setTimeout(()=>{if(typeof OVS!=="undefined"&&!OVS.length)PICK=null},0));
// Rutas: «Cerca de mí» al lado de «Cerca de un lugar»
const b2=document.getElementById("b-near2");
if(b2){b2.insertAdjacentHTML("afterend",`<button class="btn ghost wizbtn" id="b-nearme">🎯 Cerca de mí</button>`);
  document.getElementById("b-nearme").addEventListener("click",()=>geo((la,lo)=>ovShow({t:"near",lat:la,lon:lo,label:"tu ubicación"})))}
renderCols();
})();
