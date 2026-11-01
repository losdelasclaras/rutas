/* ---------- Cumbres y Lugares: «Cerca de un lugar» y «Cerca de mí» (como en Rutas); en Rutas también «Cerca de mí» ---------- */
(function(){
let PICK=null;   // pestaña que está eligiendo sitio («cumbres» o «lugares»)
window.cercaBar=(kind,C)=>`<div class="wizrow cerca"><button class="btn ghost wizbtn" data-cnear>📍 Cerca de un lugar</button><button class="btn ghost wizbtn" data-cme>🎯 Cerca de mí</button><button class="btn ghost wizbtn" data-fpopen>⚙ Filtros${fpN(C)?" ("+fpN(C)+")":""}</button></div>`+
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

/* ---------- ⚙ Filtros: panel desde abajo en Rutas, Cumbres y Lugares ---------- */
document.head.insertAdjacentHTML("beforeend",`<style>
#b-wiz,#fbox,#list .rsrc,.wzban:has([data-wzedit]){display:none!important}
.fpanel{position:fixed;inset:0;z-index:60;display:none}
.fpanel.open{display:block}
.fpback{position:absolute;inset:0;background:rgba(0,0,0,.45)}
.fpin{position:absolute;left:0;right:0;bottom:0;max-height:86vh;overflow:auto;background:var(--paper,#fff);border-radius:18px 18px 0 0;padding:14px 16px calc(16px + env(safe-area-inset-bottom));box-shadow:0 -4px 20px rgba(0,0,0,.25)}
@media (min-width:860px){.fpin{left:50%;right:auto;width:560px;transform:translateX(-50%);bottom:24px;border-radius:18px}}
.fphead{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}.fphead b{font-size:1.25em}
.fphead .x{width:42px;height:42px;border-radius:50%;border:0;background:#c3262e;color:#fff;font-size:26px;font-weight:700;cursor:pointer}
.fpanel .chips{margin:0 0 12px}
.fpanel .chips::before{flex-basis:100%;font-size:.8em;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#666);margin:6px 0 2px}
.fpanel .chips[data-grp=z]::before{content:"Zona"}
.fpanel .chips[data-grp=f]::before{content:"Mis marcas"}
.fpanel .chips[data-grp=o]::before,.fpanel .chips[data-grp=rs]::before{content:"De quién"}
#v-cumbres .fpanel .chips[data-grp=g]::before{content:"Altura"}
#v-lugares .fpanel .chips[data-grp=g]::before{content:"Tipo de lugar"}
.fpanel .chips[data-grp=ep]::before{content:"Época"}
.fpanel .chips[data-grp=iv]::before{content:"Invierno"}
.fpanel .chips[data-grp=tk]::before{content:"Track"}
.fpfoot{display:flex;gap:12px;align-items:center;flex-wrap:wrap;position:sticky;bottom:-16px;background:inherit;padding:10px 0 4px}
.fpfoot .btn{flex:1;font-size:1.05em;padding:13px}
.fpills:empty{display:none}
.fpills{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}
.fpills button{border:0;border-radius:999px;padding:7px 12px;background:#20302a;color:#fff;font-weight:700;font-size:.92em;cursor:pointer}
</style>`);
const FP={};  // panel abierto por pestaña
const DEF={z:"cant",f:"todas",o:"todas",g:"todas"};
window.fpN=C=>["f","o","g"].filter(k=>(C[k]||"todas")!=="todas").length+(C.z!=="cant"?1:0);
window.fpOpen=(kind,C)=>`<div class="fpanel${FP[kind]?" open":""}"><div class="fpback" data-fpclose></div><div class="fpin"><div class="fphead"><b>Filtros</b><button class="x" data-fpclose aria-label="Cerrar">×</button></div>`;
window.fpClose=(kind,C,n)=>{const lab=k=>{const b=document.querySelector(`#v-${kind} .chips[data-grp=${k}] [data-v="${C[k]}"]`);return b?b.textContent.trim():C[k]};
  const act=["z","f","o","g"].filter(k=>(C[k]||DEF[k])!==DEF[k]);
  return `<div class="fpfoot"><button class="btn primary" data-fpclose>Ver ${n} ${n===1?"resultado":"resultados"}</button>${act.length?`<button class="linkbtn" data-fpreset>Quitar filtros</button>`:""}</div></div></div>`+
    (act.length?`<div class="fpills" data-fpills="${kind}">${act.map(k=>`<button data-fpx="${k}" title="Quitar">${esc(String(C["_l_"+k]||C[k]))} ✕</button>`).join("")}</div>`:"")};
// nombres legibles de los filtros activos (para las etiquetas con ✕)
function labels(kind){const C=COL[kind];for(const k of ["z","f","o","g"]){const b=document.querySelector(`#v-${kind} .chips[data-grp=${k}] [data-v="${C[k]}"]`);if(b)C["_l_"+k]=b.textContent.replace(/·\s*\d+$/,"").trim()}}
for(const k of ["cumbres","lugares"]){const v=document.getElementById("v-"+k);if(!v)continue;
  v.addEventListener("click",e=>{const C=COL[k];
    if(e.target.closest("[data-fpopen]")){FP[k]=true;renderCol(k);return}
    if(e.target.closest("[data-fpclose]")){FP[k]=false;renderCol(k);return}
    if(e.target.closest("[data-fpreset]")){Object.assign(C,DEF);renderCol(k);labels(k);renderCol(k);return}
    const x=e.target.closest("[data-fpx]");if(x){C[x.dataset.fpx]=DEF[x.dataset.fpx];if(x.dataset.fpx==="z")C.g="todas";renderCol(k);return}
    if(e.target.closest(".fpanel .chips [data-v]"))setTimeout(()=>{labels(k);renderCol(k)},0)},true)}

/* Rutas: estado propio de los filtros sencillos */
const RF={z:"",ep:"",iv:"",tk:""},CUT=new Date().getFullYear()-5;
window.RFOK=r=>(!RF.z||zoneOf(r.r)===RF.z)&&(!RF.ep||(RF.ep==="new"?(r.y||0)>=CUT:(r.y||0)<CUT))&&(!RF.iv||(RF.iv==="si"?!!r.iv:!r.iv))&&(!RF.tk||!!r.gx);
const rsrc=()=>window.COLX?COLX.rsrc:"todas";
const RG=()=>[["z","Zona",[["","Todas"],["cant","Cantábrica"],["pir","Pirineos"],["alp","Alpes y Dolomitas"]]],
  ...(window.COLX?[["rs","De quién",[["todas","Todas"],["grupo","Del grupo"],...CO_LIST()]]]:[]),
  ["ep","Época",[["","Todas"],["new",`Desde ${CUT}`],["old",`Antes de ${CUT}`]]],
  ["iv","Invierno",[["","Todas"],["si","Solo invernales"],["no","Sin invernales"]]],
  ["tk","Track",[["","Todas"],["si","Con track en el mapa"]]]];
const CO_LIST=()=>{const s=document.querySelectorAll("#list .rsrc [data-rsrc]");return [...s].filter(b=>/^co_/.test(b.dataset.rsrc)).map(b=>[b.dataset.rsrc,b.textContent.trim()])};
let RFO=false;
function rval(k){return k==="rs"?rsrc():RF[k]}
function ract(){return RG().filter(([k])=>k==="rs"?rsrc()!=="todas":!!RF[k])}
function rlab(k){const g=RG().find(x=>x[0]===k);const o=g&&g[2].find(x=>x[0]===rval(k));return o?o[1]:""}
window.rfSync=()=>{const lst=document.getElementById("list");if(!lst)return;
  const cnt=(lst.querySelector(".count")||{}).textContent||"";const n=parseInt(cnt)||0;
  let bf=document.getElementById("b-filt");const row=document.getElementById("b-near2")&&document.getElementById("b-near2").parentElement;
  if(!bf&&row){row.insertAdjacentHTML("beforeend",`<button class="btn ghost wizbtn" id="b-filt">⚙ Filtros</button>`);bf=document.getElementById("b-filt");bf.addEventListener("click",()=>{RFO=true;rfSync()})}
  const a=ract();if(bf)bf.textContent="⚙ Filtros"+(a.length?` (${a.length})`:"");
  let pl=document.getElementById("rfpills");if(!pl&&row){row.insertAdjacentHTML("afterend",`<div class="fpills" id="rfpills"></div>`);pl=document.getElementById("rfpills")}
  if(pl)pl.innerHTML=a.map(([k])=>`<button data-rfx="${k}">${esc(rlab(k))} ✕</button>`).join("");
  let fp=document.getElementById("rfpanel");if(!fp){document.getElementById("v-rutas").insertAdjacentHTML("beforeend",`<div class="fpanel" id="rfpanel"></div>`);fp=document.getElementById("rfpanel")}
  fp.classList.toggle("open",RFO);
  if(RFO)fp.innerHTML=`<div class="fpback" data-rfclose></div><div class="fpin"><div class="fphead"><b>Filtros</b><button class="x" data-rfclose aria-label="Cerrar">×</button></div>`+
    RG().map(([k,,ops])=>`<div class="chips" data-grp="${k}">${ops.map(([v,l])=>`<button class="chip" data-rfk="${k}" data-rfv="${v}" aria-pressed="${rval(k)===v}">${esc(l)}</button>`).join("")}</div>`).join("")+
    `<div class="fpfoot"><button class="btn primary" data-rfclose>Ver ${n} ${n===1?"ruta":"rutas"}</button>${a.length?`<button class="linkbtn" data-rfreset>Quitar filtros</button>`:""}</div></div>`};
document.getElementById("v-rutas").addEventListener("click",e=>{
  const ch=e.target.closest("[data-rfk]");if(ch){const k=ch.dataset.rfk,v=ch.dataset.rfv;if(k==="rs"){if(window.COLX)COLX.rsrc=v}else RF[k]=v;renderList();return}
  if(e.target.closest("[data-rfclose]")){RFO=false;rfSync();return}
  if(e.target.closest("[data-rfreset]")){for(const k in RF)RF[k]="";if(window.COLX)COLX.rsrc="todas";renderList();return}
  const x=e.target.closest("[data-rfx]");if(x){const k=x.dataset.rfx;if(k==="rs"){if(window.COLX)COLX.rsrc="todas"}else RF[k]="";renderList();return}});
// en Rutas, el buscador arriba del todo, como en Cumbres y Lugares
{const q=document.getElementById("q"),row=document.getElementById("b-near2");if(q&&row){q.style.marginBottom="12px";row.parentElement.parentElement.insertBefore(q,row.parentElement)}}
// sin el asistente: si estaba puesto, se quita
if(typeof F!=="undefined"&&F.wz){F.wz=null}
renderList();
renderCols();
})();
