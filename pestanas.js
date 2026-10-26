/* ---------- pestañas de abajo: Mapa · Del grupo (Rutas, Cumbres, Lugares) · Mis cosas (Mis puntos, Mis tracks, Mapas) ----------
   Más adelante se añadirá «Seguidores» (rutas y puntos que publiquen otras personas). */
(function(){
const main=document.querySelector("main"),nav=document.querySelector("nav.tabs");if(!main||!nav)return;
document.head.insertAdjacentHTML("beforeend",`<style>
nav.tabs{grid-template-columns:repeat(3,1fr)!important}
.subtabs{position:sticky;top:0;z-index:5;background:var(--paper);display:grid;gap:6px;padding:8px 0 10px;margin:0 0 4px}
.subtabs button{border:1px solid var(--edge);background:var(--card);color:var(--ink);border-radius:12px;padding:7px 2px 6px;font-weight:700;font-size:13px;line-height:1.15;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0;white-space:nowrap}
.subtabs button .i{font-size:19px;line-height:1}
.subtabs button small{font-weight:700;font-size:11.5px;color:var(--muted)}
.subtabs button[aria-selected=true]{background:var(--ink);color:var(--card);border-color:var(--ink)}
.subtabs button[aria-selected=true] small{color:inherit;opacity:.8}
@media(min-width:700px){.subtabs button{flex-direction:row;justify-content:center;gap:6px;font-size:14.5px;padding:9px 6px}}
#v-mios .mpbox>h2:first-child{display:none}
#v-mios [data-msec][hidden]{display:none!important}
</style>`);
const ICO={mapa:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
  grupo:'<path d="M2 20l7-12 4 6 3-4 6 10z"/><circle cx="17.5" cy="5.5" r="2"/>',
  mios:'<path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 016 0v2"/>'};
const tab=(v,t)=>`<button role="tab" data-v="${v}" aria-selected="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">${ICO[v]}</svg>${t}</button>`;
nav.innerHTML=tab("mapa","Mapa")+tab("grupo","Del grupo")+tab("mios","Mis cosas");

/* «Mis cosas»: una vista nueva con mis puntos, mis tracks y los mapas descargados */
const sec=document.createElement("section");sec.className="view pad";sec.id="v-mios";sec.hidden=true;
sec.innerHTML=`<div class="inner"><h1 class="vt">Mis cosas</h1><p class="lead" style="margin-bottom:4px">Tus puntos, tus tracks y los mapas que has descargado. Con tu cuenta de Google los tienes en el móvil y en el ordenador.</p>
<div class="subtabs" id="st-mios" role="tablist" style="grid-template-columns:repeat(3,1fr)"></div></div>`;
main.appendChild(sec);const inner=sec.firstElementChild;
const MS={mp:document.getElementById("mpbox"),mt:document.getElementById("mtbox"),off:document.getElementById("offbox")};
for(const k in MS)if(MS[k]){MS[k].dataset.msec=k;inner.appendChild(MS[k])}
const MN={mp:["📍","Mis puntos"],mt:["🧵","Mis tracks"],off:["📥","Mapas"]};
const cuenta=k=>k==="mp"?MISPUNTOS.get().length:k==="mt"?MISPUNTOS.tracks().length:(window.OFFLINE?OFFLINE.list().length:0);
let curM=store.get("ldc-mios","mp");if(!MN[curM])curM="mp";
const barM=document.getElementById("st-mios");
function pintaM(){barM.innerHTML=Object.keys(MN).map(k=>`<button role="tab" data-ms="${k}" aria-selected="${k===curM}"><span class="i">${MN[k][0]}</span><span>${MN[k][1]}</span><small>${cuenta(k)}</small></button>`).join("");
  for(const k in MS)if(MS[k])MS[k].hidden=k!==curM}
barM.addEventListener("click",e=>{const b=e.target.closest("[data-ms]");if(!b)return;curM=b.dataset.ms;store.set("ldc-mios",curM);pintaM();if(sec.scrollTop>barM.offsetTop)sec.scrollTop=barM.offsetTop});
const mo=new MutationObserver(()=>barM.querySelectorAll("[data-ms]").forEach(b=>{const s=b.querySelector("small");if(s)s.textContent=cuenta(b.dataset.ms)}));
for(const k in MS)if(MS[k])mo.observe(MS[k],{childList:true});
pintaM();

/* «Del grupo»: Rutas, Cumbres y Lugares del blog con su barra arriba */
const GN={rutas:["📘","Rutas"],cumbres:["⛰️","Cumbres"],lugares:["🏞️","Lugares"]};
let curG=store.get("ldc-grupo","rutas");if(!GN[curG])curG="rutas";
for(const g in GN){const v=document.querySelector("#v-"+g+" .inner");if(!v)continue;const b=document.createElement("div");b.className="subtabs";b.dataset.grp=g;b.style.gridTemplateColumns="repeat(3,1fr)";
  b.innerHTML=Object.keys(GN).map(k=>`<button role="tab" data-gs="${k}" aria-selected="${k===g}"><span class="i">${GN[k][0]}</span><span>${GN[k][1]}</span></button>`).join("");
  v.insertBefore(b,v.firstChild)}
document.addEventListener("click",e=>{const b=e.target.closest("[data-gs]");if(b)showView(b.dataset.gs)});

/* showView entiende las vistas nuevas; la pestaña «Del grupo» vuelve a la última que viste */
const VIEWS=["mapa","rutas","cumbres","lugares","mios"];
window.showView=showView=function(v){
  if(v==="grupo")v=curG;
  if(!VIEWS.includes(v))v="mapa";
  if(v!=="mapa"&&window.showTrack){showTrack(null);const tp=document.getElementById("trkpill");if(tp)tp.hidden=true}
  if(v==="mapa")setTimeout(()=>map.invalidateSize(),0);
  if(GN[v]){curG=v;store.set("ldc-grupo",v)}
  const top=GN[v]?"grupo":v;
  nav.querySelectorAll("[data-v]").forEach(x=>x.setAttribute("aria-selected",x.dataset.v===top));
  VIEWS.forEach(n=>{const el=document.getElementById("v-"+n);if(el)el.hidden=n!==v});
  store.set("ldc-tab",v)};
window.LUGTAB=k=>{showView("mios");if(MN[k]){curM=k;store.set("ldc-mios",k);pintaM()}};
const vis=VIEWS.find(n=>{const el=document.getElementById("v-"+n);return el&&!el.hidden})||"mapa";
showView(vis==="mios"?"mios":vis);
})();
