/* ---------- Mapas sin cobertura: descargar el mapa del IGN de una ruta, de un track o de una zona ----------
   Las teselas se guardan en el móvil (caché «ldc-offline») y el service worker las sirve cuando no hay red.
   Solo el mapa del IGN (libre, CC BY 4.0) y solo España: OpenTopoMap no permite descargas masivas. */
(function(){
const OK="ldc-offline",CN="ldc-offline",ZMAX=16,LIM=4000,KB=22;
const ESPB=L.latLngBounds([35.2,-9.6],[43.95,4.6]);
const IGNURL=BASES.ign[1]._url;
const tileUrl=(z,x,y)=>L.Util.template(IGNURL,{z,x,y});
const list=()=>store.get(OK,[]);const saveList=a=>store.set(OK,a);
// «mapas en tu cuenta»: los que has descargado en cualquier aparato (se sincroniza con Entrar con Google; sin las teselas)
const WK="ldc-mapas";const wanted=()=>store.get(WK,[]);
const saveWanted=(a,quiet)=>{store.set(WK,a);if(!quiet&&window.ldcSync)ldcSync("mapas")};
const metaOf=m=>{const o={id:m.id,ref:m.ref||null,n:m.n,k:m.k,f:m.f||new Date().toISOString(),b:m.b||0};if(m.zb){o.zb=m.zb;o.z0=m.z0;o.zmax=m.zmax}return o};
const fmtMB=b=>b>=1e9?(b/1e9).toLocaleString("es-ES",{maximumFractionDigits:1})+" GB":Math.max(1,Math.round(b/1e6))+" MB";
const fmtF=f=>{try{return new Date(f).toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"})}catch(e){return""}};
document.head.insertAdjacentHTML("beforeend",`<style>
.offbar{position:fixed;left:50%;transform:translateX(-50%);top:calc(64px + env(safe-area-inset-top,0px));z-index:3500;background:var(--card);color:var(--ink);border:1px solid var(--edge);border-radius:14px;box-shadow:0 6px 22px rgba(0,0,0,.28);padding:10px 12px;width:min(440px,calc(100% - 20px));box-sizing:border-box;font-size:14.5px}
.offbar .ob{height:7px;border-radius:4px;background:#e6e6e6;margin:8px 0;overflow:hidden}.offbar .ob i{display:block;height:100%;width:0;background:#2a7a3b;transition:width .2s}
.offbar .oa{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.offzone{position:absolute;inset:0;pointer-events:none;z-index:640;border:3px dashed #2a7a3b;box-shadow:inset 0 0 0 2000px rgba(42,122,59,.06)}
</style>`);

/* teselas: x/y a partir de coordenadas */
const tx=(lon,z)=>Math.floor((lon+180)/360*2**z);
const ty=(lat,z)=>{const r=lat*Math.PI/180;return Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*2**z)};
function tilesBox(b,z,set){const x0=tx(b.getWest(),z),x1=tx(b.getEast(),z),y0=ty(b.getNorth(),z),y1=ty(b.getSouth(),z);
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)set.add(z+"/"+x+"/"+y)}
// franja de ~1 km a cada lado del track
function tilesTrack(ln,zmax){const set=new Set(),B=1000;
  const pts=[];for(let i=0;i<ln.length;i++){const a=ln[i];pts.push(a);const b=ln[i+1];if(!b)break;
    const d=Math.hypot((b[0]-a[0])*111e3,(b[1]-a[1])*111e3*Math.cos(a[0]*Math.PI/180)),n=Math.floor(d/300);
    for(let k=1;k<n;k++)pts.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n])}
  const all=L.latLngBounds(pts.map(p=>[p[0],p[1]])).pad(0.15);
  for(let z=9;z<=12;z++)tilesBox(all,z,set);
  for(let z=13;z<=zmax;z++){for(const p of pts){const dl=B/111e3,dn=B/(111e3*Math.cos(p[0]*Math.PI/180));
    tilesBox(L.latLngBounds([p[0]-dl,p[1]-dn],[p[0]+dl,p[1]+dn]),z,set)}}
  return set}
function tilesZone(b){let zmax=ZMAX,set;const z0=Math.max(8,Math.floor(map.getZoom())-3);
  do{set=new Set();for(let z=z0;z<=zmax;z++)tilesBox(b,z,set);if(set.size<=LIM)break;zmax--}while(zmax>=14);
  return{set,zmax,z0}}

/* descarga con barra de progreso */
let RUN=null;
async function bajar(meta,set){if(RUN){toast("Ya hay una descarga en marcha");return}
  if(!navigator.onLine){toast("Sin conexión: hace falta internet para descargar el mapa");return}
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
  const keys=[...set],bar=document.createElement("div");bar.className="offbar";
  bar.innerHTML=`<b>📥 Descargando el mapa de «${esc(meta.n)}»</b><div class="ob"><i></i></div><div class="oa"><span data-otx style="margin-right:auto;color:var(--muted)">0 %</span><button class="mpb" data-ocan>Cancelar</button></div>`;
  document.body.appendChild(bar);const run=RUN={stop:false};bar.querySelector("[data-ocan]").onclick=()=>{run.stop=true};
  const c=await caches.open(CN);let done=0,bytes=0,fail=0,i=0;
  async function worker(){while(i<keys.length&&!run.stop){const k=keys[i++],[z,x,y]=k.split("/").map(Number),u=tileUrl(z,x,y);
      try{let r=await c.match(u);if(!r){r=await fetch(u,{mode:"cors"});if(r.ok){const bl=await r.clone().blob();bytes+=bl.size;await c.put(u,r)}else fail++}else{bytes+=+(r.headers.get("content-length")||KB*1000)}}
      catch(e){fail++;if(!navigator.onLine)run.stop=true}
      done++;if(done%5===0||done===keys.length){const pc=Math.round(done/keys.length*100);bar.querySelector("i").style.width=pc+"%";bar.querySelector("[data-otx]").textContent=`${pc} % · ${fmtMB(bytes)}`}}}
  await Promise.all(Array.from({length:6},worker));
  bar.remove();RUN=null;
  if(run.stop&&done<keys.length){toast(navigator.onLine?"Descarga cancelada":"Se ha cortado la conexión: vuelve a intentarlo");await limpiar([],keys.slice(0,done));return}
  if(fail>keys.length*0.2){toast("El servidor del IGN no ha respondido bien. Prueba más tarde.");await limpiar([],keys);return}
  const a=list().filter(m=>m.id!==meta.id);const nm={...meta,t:keys,b:bytes,f:meta.f||new Date().toISOString()};a.push(nm);saveList(a);
  saveWanted([...wanted().filter(m=>m.id!==meta.id),metaOf(nm)]);
  toast(`Mapa descargado (${fmtMB(bytes)}). Sin cobertura se verá el mapa del IGN.`);pintar()}
// borra las teselas que ya no usa ningún otro mapa
async function limpiar(rest,keys){const usados=new Set();for(const m of rest)for(const k of m.t)usados.add(k);
  const c=await caches.open(CN);for(const k of keys)if(!usados.has(k)){const[z,x,y]=k.split("/").map(Number);await c.delete(tileUrl(z,x,y))}}
async function borrar(id){const a=list(),m=a.find(x=>x.id===id);saveWanted(wanted().filter(x=>x.id!==id));if(!m){pintar();return}const rest=a.filter(x=>x.id!==id);saveList(rest);await limpiar(rest,m.t);toast("Mapa borrado");pintar()}
// rehacer en este aparato un mapa descargado en otro
function lnDe(m){if(m.k==="track"){const t=MISPUNTOS.tracks().find(x=>"mt:"+x.id===m.ref);return t&&t.pts}const r=R.find(x=>x.u===m.ref);return r&&r.gx&&r.gx.ln}
function bajarAqui(id){const m=wanted().find(x=>x.id===id);if(!m)return;
  if(m.k==="zona"){if(!m.zb)return;const b=L.latLngBounds([m.zb[0],m.zb[1]],[m.zb[2],m.zb[3]]),set=new Set();for(let z=m.z0||10;z<=(m.zmax||ZMAX);z++)tilesBox(b,z,set);bajar({...m},set);return}
  const ln=lnDe(m);if(!ln){if(m.k!=="track"&&window.loadTracks){toast("Preparando el track…");loadTracks().then(ok=>{if(ok&&lnDe(m))bajarAqui(id);else toast("No encuentro ese track")})}else toast("No encuentro ese track");return}
  bajar({...m},tilesTrack(ln,ZMAX))}

/* qué hay descargado */
const has=ref=>list().some(m=>m.ref===ref);
const lnRoute=r=>r&&r.gx&&r.gx.ln;
function rutaOffline(r){if(!r||!r.gx)return;if(!lnRoute(r)){toast("Preparando el track…");loadTracks().then(ok=>{if(ok)rutaOffline(r);else toast("Sin conexión")});return}
  porTrack({id:"r:"+r.u,ref:r.u,n:routeTitle(r),k:"ruta"},r.gx.ln)}
function porTrack(meta,ln){if(!ln.some(p=>ESPB.contains([p[0],p[1]]))){toast("El mapa descargable (IGN) solo cubre España");return}
  if(has(meta.ref)){abrirLista();return}
  const set=tilesTrack(ln,ZMAX);confirmar(meta,set,`Se descargará el mapa del IGN de una franja de 1 km a cada lado del track (≈ ${fmtMB(set.size*KB*1000)}).`)}
function confirmar(meta,set,txt){MISPUNTOS.show(`<div class="sheet-head"><h2>📥 Mapa sin cobertura</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
  <p><b>${esc(meta.n)}</b></p><p>${txt}</p><p class="note">Hazlo con wifi. Después, aunque no tengas cobertura, verás el mapa en esa zona (ponlo en Capas › Mapa › IGN si no sale solo).</p>
  <div class="mpacts"><button class="mpb pri" data-ogo>📥 Descargar</button><button class="mpb" data-close>Cancelar</button></div>`);
  sheet._off={meta,set}}
sheet.addEventListener("click",e=>{if(e.target.closest("[data-ogo]")&&sheet._off){const{meta,set}=sheet._off;sheet._off=null;sheet.hidden=true;bajar(meta,set)}});

/* zona: se encuadra el mapa y se descarga lo que se ve */
let ZB=null;
function zona(){if(typeof showView==="function")showView("mapa");sheet.hidden=true;if(ZB)return;
  const lg=document.querySelector(".legend.open");if(lg){lg.classList.remove("open")}
  const m=document.getElementById("map"),fr=document.createElement("div");fr.className="offzone";m.appendChild(fr);
  const b=document.createElement("div");b.className="mpbar";b.style.top="60px";m.appendChild(b);L.DomEvent.disableClickPropagation(b);
  const upd=()=>{const bb=map.getBounds();if(!ESPB.intersects(bb)){b.querySelector("[data-oz]").disabled=true;b.querySelector("span").textContent="El mapa descargable (IGN) solo cubre España";return}
    const{set,zmax}=tilesZone(bb);const ok=zmax>=14;b.querySelector("[data-oz]").disabled=!ok;
    b.querySelector("span").textContent=ok?`Encuadra la zona: ≈ ${fmtMB(set.size*KB*1000)}${zmax<ZMAX?" (con menos detalle: es grande)":""}`:"Zona demasiado grande: acerca el mapa"};
  b.innerHTML=`<span></span><button class="mpb pri" data-oz>📥 Descargar esta zona</button><button class="mpb" data-ozc>Cancelar</button>`;
  const fin=()=>{map.off("moveend",upd);fr.remove();b.remove();ZB=null};ZB=fin;map.on("moveend",upd);upd();
  b.addEventListener("click",e=>{if(e.target.closest("[data-ozc]")){fin();return}
    if(e.target.closest("[data-oz]")){const bb=map.getBounds(),c=bb.getCenter();const{set,zmax,z0}=tilesZone(bb);fin();
      let best=null,bd=1e9;for(const p of PLACES){const d=(p[2]-c.lat)**2+((p[3]-c.lng)*Math.cos(c.lat*Math.PI/180))**2;if(d<bd){bd=d;best=p[0]}}
      bajar({id:"z:"+Date.now().toString(36),ref:null,n:"Zona de "+(best||"mapa"),k:"zona",zb:[bb.getSouth(),bb.getWest(),bb.getNorth(),bb.getEast()].map(v=>Math.round(v*1e5)/1e5),z0,zmax},set)}})}

/* recuadro en Lugares: lista de mapas descargados */
const box=document.createElement("div");box.className="mpbox";box.id="offbox";document.getElementById("mtbox").after(box);
function pintar(){const a=list().slice().sort((x,y)=>(y.f||"").localeCompare(x.f||""));const tot=a.reduce((s,m)=>s+(m.b||0),0);
  box.innerHTML=`<h2>📥 Mapas sin cobertura <small style="font-weight:500;color:#666">(${a.length}${a.length?" · "+fmtMB(tot):""})</small></h2>
  <p class="note">Descarga el mapa del IGN de una ruta (en su ficha), de uno de tus tracks o de una zona, y lo verás aunque no tengas cobertura. Solo España.</p>
  <div class="mpacts" style="margin:6px 0 8px"><button class="mpb" data-ozone>🗺️ Descargar una zona del mapa</button></div>
  ${(()=>{const aqui=new Set(a.map(m=>m.id)),fal=wanted().filter(m=>!aqui.has(m.id));if(!fal.length)return"";
    return`<p class="note" style="margin:10px 0 4px"><b>Descargados en otro aparato</b> (tu cuenta). Bájalos aquí con wifi:</p>${fal.length>1?`<div class="mpacts" style="margin:4px 0 6px"><button class="mpb pri" data-oall>📥 Descargar todos aquí (≈ ${fmtMB(fal.reduce((s,m)=>s+(m.b||0),0))})</button></div>`:""}`+
    fal.map(m=>`<div class="mprow"><span class="e" style="opacity:.55">${m.k==="zona"?"🗺️":m.k==="track"?"〰️":"📘"}</span><span><b>${esc(m.n)}</b><small>${m.b?"≈ "+fmtMB(m.b)+" · ":""}falta en este aparato</small></span><button class="mpb del" data-oget="${esc(m.id)}">📥</button></div>`).join("")+(a.length?`<p class="note" style="margin:12px 0 4px"><b>En este aparato</b></p>`:"")})()}
  ${a.map(m=>`<div class="mprow" data-ogoto="${esc(m.id)}"><span class="e">${m.k==="zona"?"🗺️":m.k==="track"?"〰️":"📘"}</span><span><b>${esc(m.n)}</b><small>${fmtMB(m.b||0)} · ${fmtF(m.f)}</small></span><button class="mpb dan del" data-odel="${esc(m.id)}">🗑</button></div>`).join("")}`;
  if(typeof window.OFFREFRESH==="function")window.OFFREFRESH()}
let COLA=[];
async function siguiente(){if(RUN||!COLA.length)return;bajarAqui(COLA.shift());const w=setInterval(()=>{if(!RUN){clearInterval(w);siguiente()}},800)}
box.addEventListener("click",e=>{if(e.target.closest("[data-ozone]")){zona();return}
  const g1=e.target.closest("[data-oget]");if(g1){bajarAqui(g1.dataset.oget);return}
  if(e.target.closest("[data-oall]")){const aqui=new Set(list().map(m=>m.id));COLA=wanted().filter(m=>!aqui.has(m.id)).map(m=>m.id);siguiente();return}
  const d=e.target.closest("[data-odel]");if(d){if(d.dataset.sure!=="1"){d.dataset.sure="1";d.textContent="¿Seguro?";return}borrar(d.dataset.odel);return}
  const g=e.target.closest("[data-ogoto]");if(g){const m=list().find(x=>x.id===g.dataset.ogoto);if(!m||!m.t.length)return;
    // encuadra la zona descargada (con las teselas de más detalle)
    const zz=Math.max(...m.t.map(k=>+k.split("/")[0])),ks=m.t.filter(k=>+k.split("/")[0]===zz).map(k=>k.split("/").map(Number));
    const lon=x=>x/2**zz*360-180,lat=y=>{const n=Math.PI-2*Math.PI*y/2**zz;return 180/Math.PI*Math.atan(.5*(Math.exp(n)-Math.exp(-n)))};
    const b=L.latLngBounds(ks.map(([,x,y])=>[lat(y),lon(x)]).concat(ks.map(([,x,y])=>[lat(y+1),lon(x+1)])));
    showView("mapa");if(BASE!=="ign")setBase("ign");map.fitBounds(b,{padding:[10,10]})}});
function abrirLista(){if(window.LUGTAB)LUGTAB("off");else showView("lugares")}

/* botones en las fichas (ruta del blog y mis tracks) y en Capas › Mapa */
window.OFFLBL=ref=>has(ref)?"✓ Mapa sin cobertura":"📥 Mapa sin cobertura";
document.addEventListener("click",e=>{const b=e.target.closest("[data-offr],[data-offt]");if(!b)return;e.preventDefault();e.stopPropagation();
  if(b.dataset.offr!=null){const r=R[+b.dataset.offr];if(has(r.u)){abrirLista();return}rutaOffline(r);return}
  const t=MISPUNTOS.tracks().find(x=>String(x.id)===b.dataset.offt);if(!t)return;
  if(t.src==="blog"){const r=R.find(x=>x.u===t.u);if(r){if(has(r.u)){abrirLista();return}rutaOffline(r)}return}
  const ref="mt:"+t.id;if(has(ref)){abrirLista();return}porTrack({id:"t:"+t.id,ref,n:t.n,k:"track"},t.pts)},true);
const grp=[...document.querySelectorAll(".laypanel button.laygh")].find(x=>/^mapa$/i.test(x.textContent.trim()));
if(grp&&grp.nextElementSibling)grp.nextElementSibling.insertAdjacentHTML("beforeend",`<button class="lay" data-offzone><span class="lico">📥</span>Descargar esta zona</button>`);
document.querySelector(".legend").addEventListener("click",e=>{if(e.target.closest("[data-offzone]"))zona()});

// sin cobertura y con mapas descargados: se pone el mapa del IGN
function sinRed(){if(!navigator.onLine&&list().length&&BASE!=="ign"){store.set("ldc-base-antes",BASE);setBase("ign");toast("Sin cobertura: te pongo el mapa del IGN descargado")}}
addEventListener("offline",sinRed);setTimeout(sinRed,1500);
// los descargados antes de existir «mapas en tu cuenta» se apuntan también
(function(){const w=wanted(),ids=new Set(w.map(m=>m.id));let ch=false;
  for(const m of list())if(!ids.has(m.id)){const o=metaOf(m);if(m.k==="zona"&&m.t&&m.t.length){const zs=m.t.map(k=>+k.split("/")[0]),zz=Math.max(...zs);
      const ks=m.t.filter(k=>+k.split("/")[0]===zz).map(k=>k.split("/").map(Number)),lon=x=>x/2**zz*360-180,lat=y=>{const n=Math.PI-2*Math.PI*y/2**zz;return 180/Math.PI*Math.atan(.5*(Math.exp(n)-Math.exp(-n)))};
      o.zb=[Math.min(...ks.map(k=>lat(k[2]+1))),Math.min(...ks.map(k=>lon(k[1]))),Math.max(...ks.map(k=>lat(k[2]))),Math.max(...ks.map(k=>lon(k[1]+1)))];o.z0=Math.min(...zs);o.zmax=zz}
    w.push(o);ch=true}
  if(ch)saveWanted(w)})();
window.OFFLINE={has,list,zona,rutaOffline,wanted,setWanted:a=>{saveWanted(a,true);pintar()}};
pintar();
})();
