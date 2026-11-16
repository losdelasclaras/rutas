/* ---------- ✏️ Dibujar un track (15 nov 2026). Solo en el ordenador (html.pc) ----------
   · Botón «✏️ Dibujar» en el mapa y «✏️ Dibujar un track» en Mis cosas › Guardado.
   · Clic en el mapa = un punto. Entre punto y punto la línea va por los caminos (BRouter, perfil hiking-mountain,
     datos de OpenStreetMap) o en línea recta (campo a través), según el interruptor. Si BRouter falla, ese tramo va recto.
   · Arrastrar un punto lo mueve; clic derecho lo quita. Deshacer quita el último. «Volver al inicio» cierra la vuelta.
   · Mientras se dibuja: km, subida, bajada y perfil. Alturas: las de BRouter por caminos; las de Open-Meteo en los tramos rectos.
   · Guardar: va a Mis cosas como track «✏️ Dibujado» (src:"dib"); con la cuenta pasa al móvil para Seguirlo o Grabar.
   Para quitarlo: borrar 'dibujar' de _mods en build_pwa.py. */
(function(){
const MPI=window.MISPUNTOS;if(!MPI||typeof map==="undefined"||typeof L==="undefined")return;
const H=document.documentElement;
document.head.insertAdjacentHTML("beforeend",`<style>
html:not(.pc) .dibonly{display:none!important}
.dibp{position:absolute;left:12px;top:64px;z-index:1200;width:330px;max-width:calc(100% - 24px);max-height:calc(100% - 140px);overflow:auto;box-sizing:border-box;background:var(--card,#fff);color:var(--ink,#222);border:1px solid var(--edge,#ccc);border-radius:14px;box-shadow:0 6px 22px rgba(0,0,0,.25);padding:12px 14px;font-size:15px}
.dibp h3{margin:-4px -6px 0;padding:4px 6px;font-size:18px;display:flex;align-items:center;gap:6px;cursor:grab;user-select:none;touch-action:none;border-radius:10px}.dibp h3:hover{background:var(--land-dim,#eef0ea)}.dibp.mueve h3{cursor:grabbing}
.dibp h3 .dibgr{color:var(--muted,#888);font-size:16px;letter-spacing:-2px}.dibp h3 span.t{flex:1}.dibp h3 button{border:0;background:none;font-size:22px;cursor:pointer;color:var(--muted,#666);padding:0 6px;line-height:1}
.dibp.plegado>*:not(h3){display:none!important}.dibp.plegado{width:auto}.dibp.plegado h3 .dibmini{font-size:14px;font-weight:700;color:var(--muted,#666)}
.dibp .dibh{margin:6px 0 10px;color:var(--muted,#666);font-size:14px;line-height:1.35}
.dibp .dibm{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 10px}
.dibp .dibm button,.dibp .dibr button{min-height:42px;border:1px solid var(--edge,#ccc);border-radius:10px;background:var(--card,#fff);color:var(--ink,#222);font:inherit;font-weight:700;font-size:14px;cursor:pointer}
.dibp .dibm button[aria-pressed=true]{background:var(--ink,#222);color:var(--card,#fff);border-color:var(--ink,#222)}
.dibp .dibs{font-size:20px;font-weight:800;margin:4px 0 2px}.dibp .dibs small{font-size:14px;font-weight:600;color:var(--muted,#666)}
.dibp .dibpf{display:block;width:100%;height:70px;margin:4px 0 8px;background:var(--land-dim,#eef0ea);border-radius:8px}
.dibp .dibr{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:0 0 8px}.dibp .dibr button:disabled{opacity:.4;cursor:default}
.dibp .dibg{display:block;width:100%;min-height:48px;border:0;border-radius:12px;background:var(--mark,#c3262e);color:#fff;font:inherit;font-size:16px;font-weight:800;cursor:pointer}
.dibp .dibg:disabled{opacity:.45;cursor:default}
.dibp .dibw{color:#8a4b00;font-size:13px;margin:6px 0 0}
#map.dibujando{cursor:crosshair}#map.dibujando .leaflet-grab{cursor:crosshair}
#map.dibujando .leaflet-marker-pane>*:not(.dibpt),#map.dibujando .leaflet-tooltip-pane,#map.dibujando .leaflet-overlay-pane path:not(.dibln){pointer-events:none!important}
.dibpt{width:14px!important;height:14px!important;margin:-7px 0 0 -7px!important;border-radius:50%;background:#fff;border:3px solid #7b1fa2;box-sizing:border-box;cursor:move!important;box-shadow:0 1px 3px rgba(0,0,0,.4)}
.dibpt.ini{background:#2e7d4f;border-color:#fff;width:18px!important;height:18px!important;margin:-9px 0 0 -9px!important}
.dibpt.fin{background:#c3262e;border-color:#fff;width:18px!important;height:18px!important;margin:-9px 0 0 -9px!important}
html.dibon #sheet{display:none!important}
</style>`);

const R0=6371000,rad=Math.PI/180;
const dist=(a,b)=>{const dl=(b[0]-a[0])*rad,dn=(b[1]-a[1])*rad,x=Math.sin(dl/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dn/2)**2;return 2*R0*Math.asin(Math.sqrt(x))};
const c5=x=>Math.round(x*1e5)/1e5;
const nid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const tst=m=>{if(typeof toast==="function")toast(m)};

let ON=false,MODO=(()=>{try{return localStorage.getItem("ldc-dibmodo")||"c"}catch(e){return"c"}})();   // c = por caminos, r = línea recta
const W=[],S=[];   // W: puntos que pones (marcadores); S[i]: tramo entre W[i] y W[i+1]
let LN=null,panel=null,dcz=true;

// ---- tramos ----
async function eleRecta(p){   // alturas del terreno (Open-Meteo) para los puntos de un tramo recto
  try{const idx=[],st=Math.max(1,Math.ceil(p.length/100));for(let i=0;i<p.length;i+=st)idx.push(i);if(idx[idx.length-1]!==p.length-1)idx.push(p.length-1);
    const j=await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${idx.map(i=>p[i][0].toFixed(5)).join(",")}&longitude=${idx.map(i=>p[i][1].toFixed(5)).join(",")}`).then(r=>r.json());
    const e=j&&j.elevation;if(!e||e.length!==idx.length)return null;
    // entre las consultadas, se reparte en línea recta
    const out=p.map(x=>[x[0],x[1]]);for(let k=0;k<idx.length;k++){out[idx[k]][2]=Math.round(e[k])}
    for(let k=0;k<idx.length-1;k++){const a=idx[k],b=idx[k+1];for(let i=a+1;i<b;i++)out[i][2]=Math.round(e[k]+(e[k+1]-e[k])*(i-a)/(b-a))}
    return out}catch(e){return null}}
function recta(a,b){const d=dist(a,b),n=Math.max(1,Math.ceil(d/40)),p=[];for(let i=0;i<=n;i++)p.push([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]);return p}
async function porCamino(a,b){
  const u=`https://brouter.de/brouter?lonlats=${a[1].toFixed(6)},${a[0].toFixed(6)}|${b[1].toFixed(6)},${b[0].toFixed(6)}&profile=hiking-mountain&alternativeidx=0&format=geojson`;
  const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),20000);
  try{const r=await fetch(u,{signal:ctl.signal});if(!r.ok)return null;const j=await r.json();
    const c=j&&j.features&&j.features[0]&&j.features[0].geometry&&j.features[0].geometry.coordinates;if(!c||c.length<2)return null;
    return c.map(x=>x[2]!=null&&isFinite(x[2])?[x[1],x[0],Math.round(x[2])]:[x[1],x[0]])}catch(e){return null}finally{clearTimeout(tm)}}
async function calcula(i){const s=S[i];if(!s)return;const v=++s.v;s.pend=true;pinta();
  const a=[W[i].ll.lat,W[i].ll.lng],b=[W[i+1].ll.lat,W[i+1].ll.lng];let p=null,falla=false;
  if(s.m==="c"){p=await porCamino(a,b);if(!p){falla=true}}
  if(!p){p=recta(a,b);const e=await eleRecta(p);if(e)p=e}
  if(S[i]!==s||s.v!==v)return;   // ya ha cambiado mientras tanto
  s.p=p;s.pend=false;s.rf=falla;if(falla)tst(navigator.onLine?"Ahí no encuentro camino: ese tramo va en línea recta":"Sin conexión: ese tramo va en línea recta");pinta()}

// ---- puntos ----
function icono(i){return L.divIcon({className:"dibpt"+(i===0?" ini":i===W.length-1&&W.length>1?" fin":""),iconSize:null})}
function marcador(ll){const m=L.marker(ll,{icon:L.divIcon({className:"dibpt",iconSize:null}),draggable:true,keyboard:false,zIndexOffset:2000,title:"Arrastra para moverlo · clic derecho para quitarlo"}).addTo(map);
  m.on("dragend",()=>{const i=W.findIndex(w=>w.m===m);if(i<0)return;W[i].ll=m.getLatLng();if(i>0)calcula(i-1);if(i<S.length)calcula(i)});
  m.on("contextmenu",e=>{if(e.originalEvent)e.originalEvent.preventDefault();quita(W.findIndex(w=>w.m===m))});
  m.on("click",e=>{L.DomEvent.stopPropagation(e);const i=W.findIndex(w=>w.m===m);if(i===0&&W.length>2)add(m.getLatLng())});   // clic en el inicio: cerrar la vuelta
  return m}
function add(ll){W.push({ll,m:marcador(ll)});if(W.length>1){S.push({m:MODO,p:null,v:0,pend:true});calcula(S.length-1)}iconos();pinta()}
function quita(i){if(i<0||i>=W.length)return;map.removeLayer(W[i].m);W.splice(i,1);
  if(!W.length){S.length=0}
  else if(i===0)S.splice(0,1);
  else if(i>=W.length)S.splice(i-1,1);
  else{const m=S[i-1].m;S.splice(i-1,2,{m,p:null,v:0,pend:true});calcula(i-1)}
  iconos();pinta()}
function iconos(){W.forEach((w,i)=>w.m.setIcon(icono(i)))}
function limpia(){for(const w of W)map.removeLayer(w.m);W.length=0;S.length=0;pinta()}

// ---- lo que se ve ----
function todo(){const out=[];for(const s of S){if(!s.p)continue;const q=out.length?s.p.slice(1):s.p;for(const x of q)out.push(x)}return out}
const fmtKm=m=>(m<10000?(Math.round(m/100)/10).toLocaleString("es-ES"):Math.round(m/1000).toLocaleString("es-ES"))+" km";
function pinta(){
  const lat=[];for(const s of S)lat.push(s.p?s.p.map(x=>[x[0],x[1]]):null);
  const lines=S.map((s,i)=>s.p?s.p.map(x=>[x[0],x[1]]):[[W[i].ll.lat,W[i].ll.lng],[W[i+1].ll.lat,W[i+1].ll.lng]]);
  if(LN){map.removeLayer(LN);LN=null}
  if(lines.length){LN=L.layerGroup(lines.map((l,i)=>L.polyline(l,{color:S[i].pend?"#9e9e9e":"#7b1fa2",weight:5,opacity:.9,dashArray:S[i].pend||S[i].m==="r"?"8 8":null,interactive:false,className:"dibln"}))).addTo(map)}
  if(!panel)return;
  const p=todo();let m=0;for(let i=1;i<p.length;i++)m+=dist(p[i-1],p[i]);
  const pend=S.some(s=>s.pend),conE=p.length>1&&p.every(x=>x[2]!=null);
  let ud="";if(conE&&MPI.suben){const[u,d]=MPI.suben(p);ud=` <small>· +${Math.round(u).toLocaleString("es-ES")} m · −${Math.round(d).toLocaleString("es-ES")} m</small>`}
  else if(p.length>1)ud=` <small>· ${pend?"calculando…":"desnivel sin datos"}</small>`;
  panel.querySelector(".dibs").innerHTML=W.length<2?`<small>${W.length?"Pon el siguiente punto":"Haz clic en el mapa donde empieza"}</small>`:fmtKm(m)+ud;
  // perfil
  const sv=panel.querySelector(".dibpf");
  if(conE){let acc=0;const xs=[0];for(let i=1;i<p.length;i++){acc+=dist(p[i-1],p[i]);xs.push(acc)}
    let mn=Infinity,mx=-Infinity;for(const x of p){if(x[2]<mn)mn=x[2];if(x[2]>mx)mx=x[2]}if(mx-mn<50){const c=(mx+mn)/2;mn=c-25;mx=c+25}
    const X=v=>(v/acc*300).toFixed(1),Y=v=>(64-(v-mn)/(mx-mn)*56).toFixed(1),st=Math.max(1,Math.floor(p.length/300));
    let d="M0,70";for(let i=0;i<p.length;i+=st)d+=`L${X(xs[i])},${Y(p[i][2])}`;d+=`L${X(xs[p.length-1])},${Y(p[p.length-1][2])}L300,70Z`;
    sv.innerHTML=`<path d="${d}" fill="#7b1fa2" fill-opacity=".25" stroke="#7b1fa2" stroke-width="1.5"/><text x="4" y="12" font-size="11" fill="currentColor">${Math.round(mx).toLocaleString("es-ES")} m</text><text x="4" y="66" font-size="11" fill="currentColor">${Math.round(mn).toLocaleString("es-ES")} m</text>`;sv.style.display="block"}
  else sv.style.display="none";
  panel.querySelector("[data-dib=undo]").disabled=!W.length;panel.querySelector("[data-dib=vuelta]").disabled=W.length<2;panel.querySelector("[data-dib=borra]").disabled=!W.length;
  const g=panel.querySelector("[data-dib=guarda]");g.disabled=W.length<2;g.textContent=pend&&W.length>1?"⏳ Calculando el tramo…":"💾 Guardar en Mis cosas";
  panel.querySelector(".dibw").hidden=!S.some(s=>s.rf);
  panel.querySelector(".dibmini").textContent=panel.classList.contains("plegado")&&W.length>1?"· "+fmtKm(m):""}

// ---- entrar y salir ----
function abre(){if(ON)return;ON=true;if(typeof showView==="function")showView("mapa");
  const sh=document.getElementById("sheet");if(sh){sh.hidden=true;sh.classList.remove("full")}
  H.classList.add("dibon");map.getContainer().classList.add("dibujando");dcz=map.doubleClickZoom.enabled();map.doubleClickZoom.disable();
  panel=document.createElement("div");panel.className="dibp";panel.innerHTML=`<h3 title="Arrastra para mover el panel"><span class="dibgr">⠿</span><span class="t">✏️ Dibujar un track <span class="dibmini"></span></span><button data-dib="plega" title="Plegar o desplegar el panel" aria-label="Plegar">▁</button><button data-dib="x" title="Salir" aria-label="Salir">✕</button></h3>
  <p class="dibh">Haz <b>clic en el mapa</b> para ir poniendo puntos. <b>Arrastra</b> un punto para moverlo y <b>clic derecho</b> para quitarlo.</p>
  <div class="dibm"><button data-dibm="c" aria-pressed="${MODO==="c"}" title="La línea sigue los caminos y sendas del mapa (OpenStreetMap)">🥾 Por caminos</button><button data-dibm="r" aria-pressed="${MODO==="r"}" title="Línea recta: para tramos campo a través">📏 Línea recta</button></div>
  <div class="dibs"></div><svg class="dibpf" viewBox="0 0 300 70" preserveAspectRatio="none"></svg>
  <div class="dibr"><button data-dib="undo" title="Quitar el último punto (Ctrl+Z)">↶ Deshacer</button><button data-dib="vuelta" title="Unir con el punto de salida">🔁 Volver al inicio</button><button data-dib="borra">🗑 Empezar de nuevo</button></div>
  <button class="dibg" data-dib="guarda">💾 Guardar en Mis cosas</button>
  <p class="dibw" hidden>⚠️ Algún tramo va en línea recta porque no encontré camino. Revísalo o pon más puntos.</p>`;
  map.getContainer().parentNode.appendChild(panel);
  try{const q=JSON.parse(localStorage.getItem("ldc-dibpos")||"null");if(q)coloca(q.x,q.y)}catch(x){}
  try{if(localStorage.getItem("ldc-dibpleg")==="1")plega(true)}catch(x){}
  arrastre(panel.querySelector("h3"));
  L.DomEvent.disableClickPropagation(panel);L.DomEvent.disableScrollPropagation(panel);
  panel.addEventListener("click",clicPanel);map.on("click",clicMapa);document.addEventListener("keydown",tecla);pinta()}
// ---- mover y plegar el panel (16 nov: tapaba Capas) ----
function coloca(x,y){const P=panel.parentNode.getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight;
  x=Math.max(4,Math.min(x,P.width-w-4));y=Math.max(4,Math.min(y,P.height-Math.min(h,60)-4));panel.style.left=x+"px";panel.style.top=y+"px";return[x,y]}
function arrastre(hd){let sx,sy,ox,oy,mv=false;
  hd.addEventListener("pointerdown",e=>{if(e.button!==0||e.target.closest("button"))return;e.preventDefault();sx=e.clientX;sy=e.clientY;ox=panel.offsetLeft;oy=panel.offsetTop;mv=false;hd.setPointerCapture(e.pointerId);panel.classList.add("mueve")});
  hd.addEventListener("pointermove",e=>{if(!panel.classList.contains("mueve"))return;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>3)mv=true;if(mv)coloca(ox+dx,oy+dy)});
  const fin=e=>{if(!panel||!panel.classList.contains("mueve"))return;panel.classList.remove("mueve");if(mv){try{localStorage.setItem("ldc-dibpos",JSON.stringify({x:panel.offsetLeft,y:panel.offsetTop}))}catch(x){}}};
  hd.addEventListener("pointerup",fin);hd.addEventListener("pointercancel",fin);
  hd.addEventListener("dblclick",e=>{if(!e.target.closest("button"))plega()})}
function plega(si){const on=si===undefined?!panel.classList.contains("plegado"):si;panel.classList.toggle("plegado",on);
  const b=panel.querySelector("[data-dib=plega]");b.textContent=on?"▢":"▁";b.title=on?"Desplegar el panel":"Plegar el panel";
  try{localStorage.setItem("ldc-dibpleg",on?"1":"0")}catch(x){}coloca(panel.offsetLeft,panel.offsetTop);pinta()}
function cierra(forz){if(!ON)return;if(!forz&&W.length>1&&!confirm("¿Salir sin guardar el track que estás dibujando?"))return;
  ON=false;limpia();if(LN){map.removeLayer(LN);LN=null}map.off("click",clicMapa);document.removeEventListener("keydown",tecla);
  if(dcz)map.doubleClickZoom.enable();map.getContainer().classList.remove("dibujando");H.classList.remove("dibon");if(panel){panel.remove();panel=null}}
function clicMapa(e){if(!ON)return;add(e.latlng)}
function tecla(e){if(!ON)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();quita(W.length-1)}else if(e.key==="Escape"&&!document.querySelector(".cdq"))cierra()}
function clicPanel(e){const m=e.target.closest("[data-dibm]");if(m){MODO=m.dataset.dibm;try{localStorage.setItem("ldc-dibmodo",MODO)}catch(x){}panel.querySelectorAll("[data-dibm]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.dibm===MODO));
    tst(MODO==="c"?"Los próximos tramos irán por caminos":"Los próximos tramos irán en línea recta");return}
  const b=e.target.closest("[data-dib]");if(!b)return;const k=b.dataset.dib;
  if(k==="x")cierra();else if(k==="plega")plega();else if(k==="undo")quita(W.length-1);else if(k==="vuelta"){if(W.length>1)add(W[0].ll)}
  else if(k==="borra"){if(W.length<3||confirm("¿Borrar todo lo dibujado y empezar de nuevo?"))limpia()}
  else if(k==="guarda")guarda()}

// ---- guardar ----
function adelgaza(p){if(p.length<3)return p;const out=[p[0]];let acc=0;for(let i=1;i<p.length;i++){acc+=dist(p[i-1],p[i]);if(acc>=15||i===p.length-1){out.push(p[i]);acc=0}}return out}
function guarda(){if(W.length<2)return;if(S.some(s=>s.pend)){tst("Espera un momento: aún se está calculando un tramo");return}
  const hoy=new Date().toLocaleDateString("es-ES",{day:"numeric",month:"short"});
  const d=document.createElement("div");d.className="cdq";
  d.innerHTML=`<div role="dialog" aria-label="Guardar el track"><h3>💾 Guardar el track</h3><p class="gdcq">Ponle un nombre:</p>
  <div class="gdcnew"><input maxlength="80" value="Track dibujado ${esc(hoy)}"><button data-ok>Guardar</button></div><button class="x" data-no>Cancelar</button></div>`;
  document.body.appendChild(d);const inp=d.querySelector("input");setTimeout(()=>{inp.focus();inp.select()},30);
  const ok=()=>{const n=(inp.value||"").trim().slice(0,80)||"Track dibujado";d.remove();fin(n)};
  inp.addEventListener("keydown",e=>{if(e.key==="Enter")ok();if(e.key==="Escape")d.remove()});
  d.addEventListener("click",e=>{if(e.target===d||e.target.closest("[data-no]")){d.remove();return}if(e.target.closest("[data-ok]"))ok()})}
function fin(n){const p=adelgaza(todo());if(p.length<2){tst("El track está vacío");return}
  let m=0;for(let i=1;i<p.length;i++)m+=dist(p[i-1],p[i]);
  const conE=p.every(x=>x[2]!=null);
  const o={id:nid(),n,km:Math.round(m/100)/10,pts:p.map(x=>conE?[c5(x[0]),c5(x[1]),Math.round(x[2])]:[c5(x[0]),c5(x[1])]),src:"dib",f:new Date().toISOString()};
  if(MPI.desn)MPI.desn(o);
  const go=()=>{const ok=MPI.saveTracks([...MPI.tracks(),o]);
    if(ok===false){tst("No cabe en este navegador. Prueba a borrar algún track antiguo");return}
    if(!conE&&MPI.demAlt)MPI.demAlt(o.id);
    cierra(true);if(window.MISTRACKS)setTimeout(()=>MISTRACKS.open(o.id,true),60);
    if(window.LDCFB&&LDCFB.user&&LDCFB.user())tst("✅ Guardado en Mis cosas · lo tendrás también en el móvil");else tst("✅ Guardado en Mis cosas")};
  if(window.cuentaOk&&!cuentaOk(go,"tracks"))return;go()}

// ---- botones para empezar ----
{const f=document.querySelector(".fabs");if(f){f.insertAdjacentHTML("beforeend",`<button class="btn ghost dibonly" id="b-dib" data-short="Dibujar" title="Dibujar un track en el mapa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 21l3.5-1 11-11-2.5-2.5-11 11z"/><path d="M14 5.5l2.5 2.5"/></svg>Dibujar</button>`);
  document.getElementById("b-dib").addEventListener("click",()=>ON?cierra():abre())}}
const gd=document.getElementById("gdbox");
function enGuardado(){if(!gd||gd.hidden)return;const t=gd.querySelector(".gdtop");if(!t||t.querySelector("[data-dibuja]"))return;
  t.insertAdjacentHTML("beforeend",`<button class="dibonly" data-dibuja style="grid-column:1/-1">✏️ Dibujar un track en el mapa</button>`)}
if(gd){new MutationObserver(()=>enGuardado()).observe(gd,{childList:true,attributes:true,attributeFilter:["hidden"]});enGuardado()}
document.addEventListener("click",e=>{if(e.target.closest("[data-dibuja]"))abre()});
window.DIBUJAR={abre,cierra,on:()=>ON};
})();
