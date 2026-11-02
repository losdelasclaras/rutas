/* ---------- Explorar › Rutas: ordenar «📍 Más cerca» o «🗓 Más recientes» ----------
   «Más cerca» usa la última ubicación conocida (la de «Yo», «Cerca de mí», guardar punto…), sin pedir el GPS al abrir la app.
   Si todavía no hay ninguna, al elegir «Más cerca» se pide una vez la aproximada (wifi y datos, al momento).
   Se recuerda lo último que eligió cada uno. Con «Cerca de un lugar / de mí» puesto manda ese modo (con su radio). */
(function(){
const KO="ldc-orden-rutas",KP="ldc-ultpos";
let ORD=store.get(KO,"cerca");if(ORD!=="cerca"&&ORD!=="fecha")ORD="cerca";
let POS=store.get(KP,null);if(!POS||typeof POS.lat!=="number")POS=null;
// cualquier ubicación que reciba la app se apunta como «última conocida»
const G=navigator.geolocation;
if(G){const guarda=p=>{try{const c=p&&p.coords;if(!c)return;const n={lat:c.latitude,lon:c.longitude,t:Date.now()};
      const mover=!POS||Math.abs(POS.lat-n.lat)>.002||Math.abs(POS.lon-n.lon)>.002;POS=n;store.set(KP,n);
      if(mover&&ORD==="cerca"&&!window.NEAR){const v=document.getElementById("v-rutas");if(v&&!v.hidden)renderList()}}catch(e){}};
  const gcp=G.getCurrentPosition.bind(G),wp=G.watchPosition.bind(G);
  try{G.getCurrentPosition=(ok,err,o)=>gcp(p=>{guarda(p);ok&&ok(p)},err,o);G.watchPosition=(ok,err,o)=>wp(p=>{guarda(p);ok&&ok(p)},err,o)}catch(e){}}
document.head.insertAdjacentHTML("beforeend",`<style>
.ordrow{display:grid;grid-template-columns:1fr 1fr;gap:0;margin:2px 0 10px;border:2px solid #20302a;border-radius:14px;overflow:hidden}
.ordrow button{border:0;background:var(--card,#fff);color:var(--ink,#222);padding:11px 6px;font:inherit;font-weight:800;cursor:pointer;white-space:nowrap}
.ordrow button[aria-pressed=true]{background:#20302a;border-color:#20302a;color:#fff}
.ordnote{font-size:.85em;color:var(--muted,#666);margin:-4px 0 10px}
</style>`);
const hace=t=>{const m=Math.round((Date.now()-t)/60000);return m<2?"ahora mismo":m<60?`hace ${m} min`:m<1440?`hace ${Math.round(m/60)} h`:`hace ${Math.round(m/1440)} días`};
const barra=()=>`<div class="ordrow" role="group" aria-label="Ordenar"><button data-ord="cerca" aria-pressed="${ORD==="cerca"}">📍 Más cerca</button><button data-ord="fecha" aria-pressed="${ORD==="fecha"}">🗓 Más recientes</button></div>`
  +(ORD==="cerca"?`<p class="ordnote">${POS?`Desde tu última ubicación (${hace(POS.t)}). <button class="linkbtn" data-ordgps>Actualizar</button>`:`Todavía no sé dónde estás. <button class="linkbtn" data-ordgps>Usar mi ubicación</button>`}</p>`:"");
const RL=window.renderList;
window.renderList=renderList=function(){
  const r=RL.apply(this,arguments);
  if(window.NEAR||F.wz)return r;   // «Cerca de…» y propuestas tienen su propio orden
  const box=document.getElementById("list");
  if(ORD==="cerca"&&POS){
    const s=norm(document.getElementById("q").value.trim()),o=window.COLX?COLX.rsrc:"todas";
    const g=o!=="todas"&&o!=="grupo"?[]:R.filter(r=>r.u&&routeOk(r)&&(!s||norm((r.ti||"")+" "+r.p.map(i=>P[i].n).join(" ")+" "+r.r+" "+(r.sal||"")+" "+(r.zo||"")+" "+(r.co||[]).join(" ")).includes(s))).map(r=>({r,d:km(POS,r)}));
    const c=o==="grupo"||!window.COLX||!COLX.near?[]:COLX.near(POS.lat,POS.lon).filter(x=>(o==="todas"||o==="co_"+x.r.co.id)&&(!s||x.r.txt.includes(s)));
    const L=g.concat(c).sort((a,b)=>a.d-b.d);
    const row=x=>{const dd="📍 a "+(x.d<10?x.d.toFixed(1).replace(".",","):Math.round(x.d).toLocaleString("es-ES"))+" km";return x.r.cox?COLX.rrow(x.r,dd):rowHTML(x.r,dd)};
    const pre=box.querySelector(".rsrc");
    box.innerHTML=(pre?pre.outerHTML:"")+barra()+`<p class="count">${L.length} ${L.length===1?"ruta":"rutas"}, de la más cercana a la más lejana</p>`+(L.length?`<div class="rows">${L.map(row).join("")}</div>`:`<p class="empty">No hay rutas con esa búsqueda y esos filtros.</p>`);
  }else{const cnt=box.querySelector(".count");if(cnt)cnt.insertAdjacentHTML("beforebegin",barra());else box.insertAdjacentHTML("afterbegin",barra())}
  return r};
function pideGPS(){if(!G){toast("Este aparato no da la ubicación");return}toast("Buscando dónde estás…");
  G.getCurrentPosition(()=>{toast("Rutas ordenadas desde donde estás");renderList()},()=>toast("No he podido saber dónde estás. Prueba con «Cerca de un lugar»."),{enableHighAccuracy:false,timeout:15000,maximumAge:300000})}
document.getElementById("list").addEventListener("click",(e)=>{
  const b=e.target.closest("[data-ord]");if(b){ORD=b.dataset.ord;store.set(KO,ORD);if(ORD==="cerca"&&!POS){renderList();pideGPS();return}renderList();return}
  if(e.target.closest("[data-ordgps]"))pideGPS()});
})();
