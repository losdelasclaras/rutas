/* ---------- 🔎 buscador del mapa: arriba, encima de Cantábrica · Pirineos · Alpes ----------
   Busca a la vez rutas, cumbres y lugares (del grupo y de los colaboradores) y pueblos.
   Al tocar un resultado se abre su ficha en el mapa. Un pueblo (18 nov): tocarlo o «🥾 Rutas» lleva a «Rutas cerca de…» (ordenadas por cercanía); «🗺 Mapa» acerca el mapa (zoom 14, marca 1 min).
   «Ver todo en Explorar ›» pasa lo escrito al buscador de Rutas (los de Explorar se quedan como están). */
(function(){
const vm=document.getElementById("v-mapa"),bar=document.getElementById("mapbar");if(!vm||!bar)return;
const nk=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9ñ ]+/g," ").replace(/\s+/g," ").trim();
document.head.insertAdjacentHTML("beforeend",`<style>
#msearch{position:absolute;top:8px;left:max(10px,env(safe-area-inset-left,0px));right:max(10px,env(safe-area-inset-right,0px));z-index:30}
#msearch .mb{display:flex;align-items:center;gap:8px;background:var(--card);color:var(--ink);border:1px solid var(--edge);border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.18);padding:0 6px 0 14px;height:42px}
#msearch input{flex:1;min-width:0;border:0;background:transparent;color:inherit;font:inherit;font-size:16px;outline:none;height:100%}
#msearch .mx{border:0;background:none;color:var(--muted);font-size:20px;width:34px;height:34px;border-radius:50%;cursor:pointer}
#msearch .mx[hidden]{display:none}#msearch input::-webkit-search-cancel-button{display:none;-webkit-appearance:none}
#mres{margin-top:6px;background:var(--card);color:var(--ink);border:1px solid var(--edge);border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.25);max-height:62vh;overflow:auto;padding:4px 0}
#mres[hidden]{display:none}
#mres h4{margin:8px 14px 2px;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
#mres button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;color:inherit;font:inherit;text-align:left;padding:9px 14px;cursor:pointer}
#mres button:hover,#mres button:focus{background:color-mix(in srgb,var(--mark) 10%,transparent)}
#mres button .e{flex:none;width:24px;text-align:center;font-size:18px}
#mres button span{flex:1;min-width:0}#mres button b{display:block;font-size:15.5px;line-height:1.25}#mres button small{display:block;color:var(--muted);font-size:13px}
#mres .todo{justify-content:center;font-weight:800;color:var(--mark);border-top:1px solid var(--edge);margin-top:4px}
#mres .nada{padding:12px 14px;color:var(--muted)}
#mres .rtq{color:#8a5a00;font-weight:700}:root[data-theme=dark] #mres .rtq{color:#f0c040}@media (prefers-color-scheme:dark){:root:not([data-theme=light]) #mres .rtq{color:#f0c040}}#mres .mpu{display:flex;align-items:center}#mres .mpu>button{flex:1;min-width:0}
#mres .mpub{display:flex;gap:6px;padding-right:10px;flex:none}#mres .mpub button{width:auto;padding:7px 10px;border:1px solid var(--edge);border-radius:999px;font-size:13.5px;font-weight:700;white-space:nowrap}
.mpupin{pointer-events:none!important}.mpupin i{position:absolute;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;background:#1565c0;border:3px solid #fff;box-shadow:0 0 0 6px rgba(21,101,192,.25),0 1px 4px rgba(0,0,0,.4)}
.mpupin b{position:absolute;left:14px;top:-12px;white-space:nowrap;background:rgba(255,255,255,.92);color:#0d47a1;font:800 14px/1.2 system-ui,sans-serif;padding:3px 7px;border-radius:7px;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.mapbar{top:58px!important}
#pendban{top:108px!important}.fol.min{top:108px!important}
/* ordenador y tableta: buscador de ancho normal y las zonas a su lado (no tapa los botones + / −) */
@media(min-width:700px){#msearch{right:auto;width:400px}.mapbar{top:10px!important;left:420px!important;right:80px!important}#pendban{top:64px!important}.fol.min{top:64px!important}}
#v-mapa.fol-on #msearch{display:none!important}#v-mapa.grb-on #msearch{visibility:hidden}
</style>`);
vm.insertAdjacentHTML("beforeend",`<div id="msearch"><div class="mb"><span aria-hidden="true">🔎</span><input id="mq" type="search" placeholder="Busca una ruta, cumbre o pueblo" autocomplete="off" enterkeyhint="search"><button class="mx" id="mqx" aria-label="Borrar" hidden>×</button></div><div id="mres" hidden></div></div>`);
const inp=document.getElementById("mq"),res=document.getElementById("mres"),bx=document.getElementById("mqx");
L.DomEvent.disableClickPropagation(document.getElementById("msearch"));L.DomEvent.disableScrollPropagation(document.getElementById("msearch"));
let RES=[];
// 0 = empieza por lo buscado, 1 = una palabra empieza por ello, 2 = va dentro; y antes cuanto más al principio aparezca
const tiene=(t,q)=>{const n=nk(t),i=n.indexOf(q);if(i<0)return 9;return(n.startsWith(q)?0:(" "+n).includes(" "+q)?1:2)+Math.min(i,90)/100};
// 18 nov 2026: la dificultad a la vista en las rutas que salen al buscar
const DIFT={b:"🟢 Baja",m:"🟡 Moderada",a:"🔴 Alta",x:"⚫ Muy alta"};
const nivG=r=>({baja:"b",moderada:"m",alta:"a","muy-alta":"x"})[String(r.dl||"").toLowerCase()]||"";
function nivC(s){s=String(s||"");const m=/MIDE\s*\d\s*-\s*\d\s*-\s*\d\s*-\s*(\d)/i.exec(s);if(m){const e=+m[1];return e<=2?"b":e===3?"m":e===4?"a":"x"}
  const n=nk(s);return/muy dificil|muy alta/.test(n)?"x":/dificil|^alta/.test(n)?"a":/moderad/.test(n)?"m":/facil|^baja/.test(n)?"b":""}
const PH=new Map();let PHT=0;
const TIPOP={city:"Ciudad",town:"Villa",village:"Pueblo",hamlet:"Aldea",locality:"Lugar",isolated_dwelling:"Lugar",suburb:"Barrio",neighbourhood:"Barrio",quarter:"Barrio"};
function photon(q0){clearTimeout(PHT);PHT=setTimeout(async()=>{const k=nk(q0);if(PH.has(k))return;
  try{const r=await fetch("https://photon.komoot.io/api/?limit=8&osm_tag=place&bbox=-9.6,41.0,3.4,43.95&q="+encodeURIComponent(q0));if(!r.ok)return;const j=await r.json();
    PH.set(k,(j.features||[]).filter(f=>TIPOP[f.properties.osm_value]).map(f=>{const p=f.properties;return{n:p.name,lat:f.geometry.coordinates[1],lon:f.geometry.coordinates[0],k:TIPOP[p.osm_value],reg:[p.county&&p.county!==p.name?p.county:"",p.state||""].filter(Boolean).join(", ")}}));
    if(nk(inp.value)===k&&!res.hidden)busca(inp.value)}catch(e){}},350)}
function busca(q0){const q=nk(q0);RES=[];if(q.length<2){res.hidden=true;return}
  const out={r:[],c:[],l:[],p:[]};
  // rutas del grupo y de los colaboradores
  for(const r of R){if(!r.u)continue;const sc=Math.min(tiene(routeTitle(r),q),tiene((r.p||[]).map(i=>P[i].c).join(" "),q)+1);if(sc<9)out.r.push({sc,t:routeTitle(r),s:[DIFT[nivG(r)],"Los de las Claras",r.y,r.r,r.km?(+r.km).toLocaleString("es-ES",{maximumFractionDigits:1})+" km":""].filter(Boolean).join(" · "),e:"📗",go:()=>{openRoute(r.id);flyTo(r.lat,r.lon,12)}})}
  const T=window.COLX&&COLX.todo?COLX.todo():[];
  // 24 nov 2026: 🏆 si la cumbre o el lugar está en algún reto (como en Explorar)
  const retosDe=(p,cum)=>{try{return window.RETOSDE?RETOSDE(p,cum?"cumbres":"lugares"):[]}catch(e){return[]}};
  for(const x of T){// sus títulos empiezan por la zona («Ubiña | …»): cuenta sobre todo lo de después
    const tt=x.c.includes("|")?x.c.split("|").pop():x.c,s1=tiene(tt,q),sc=s1<9?s1:tiene(x.c,q)+3;if(sc>=9)continue;
    if(x.rr==null&&COLX.oculto&&COLX.oculto(x))continue;   // 18 nov: la misma cumbre o lugar ya sale en la fila de otro blog
    if(x.rr!=null){const rr=x.co.r[x.rr]||[];out.r.push({sc:sc+.5,t:x.c,s:[DIFT[nivC(rr[5])],x.co.n,x.r,rr[3]].filter(Boolean).join(" · "),e:"📗",go:()=>COLX.open(x.ci)})}
    else (x.k==="cumbre"?out.c:out.l).push({sc:sc+.5,t:x.c,s:[x.a?x.a.toLocaleString("es-ES")+" m":"",(COLX.de?COLX.de(x):[x.co.n]).join(" · "),x.r].filter(Boolean).join(" · "),e:x.k==="cumbre"?"⛰️":"📍",rt:retosDe(x,x.k==="cumbre"),go:()=>COLX.open(x.ci)})}
  // cumbres y lugares del grupo (sin repetir nombre)
  const vis=new Set();P.forEach((p,i)=>{if(p.x)return;const k=nk(p.c);if(vis.has(k))return;const sc=tiene(p.c,q);if(sc>=9)return;vis.add(k);
    (p.t==="cumbre"?out.c:out.l).push({sc,t:p.c,s:[p.a?p.a.toLocaleString("es-ES")+" m":"",(COLX.deG?COLX.deG(i):["Los de las Claras"]).join(" · "),p.r].filter(Boolean).join(" · "),e:p.t==="cumbre"?"⛰️":"📍",rt:retosDe(p,p.t==="cumbre"),go:()=>{pickRoute(i);flyTo(p.lat,p.lon,64)}})});
  // pueblos: rutas cerca
  try{for(const s of (window.findSites?findSites(q0):[]).filter(s=>!/^(lugar del mapa|cumbre|lugar|ruta)/i.test(s.k||"")).slice(0,6))out.p.push({sc:0,pu:1,la:s.lat,lo:s.lon,t:s.alt?s.alt.split(";")[0]:s.n,s:[s.k,s.reg].filter(Boolean).join(" · "),e:"🏘️",go:()=>{quitaPin();if(window.CERCA&&CERCA.en)CERCA.en(s.lat,s.lon,s.n);else flyTo(s.lat,s.lon,13)},mapa:()=>verPueblo(s)})}catch(e){}
  // 22 nov 2026: la lista de pueblos de la app solo cubre Asturias y alrededores. Para el resto (Galicia, País Vasco, Navarra,
  // Pirineos…) se pregunta además a Photon (OpenStreetMap, gratis y sin clave) si hay conexión; se añaden sin repetir.
  {const k=nk(q0),ph=PH.get(k);
   if(ph){for(const s of ph){if(!nk(s.n).includes(q))continue;if(out.p.some(x=>nk(x.t)===nk(s.n)&&Math.abs((x.la||0)-s.lat)<.05&&Math.abs((x.lo||0)-s.lon)<.05))continue;
     out.p.push({sc:1,pu:1,t:s.n,la:s.lat,lo:s.lon,s:[s.k,s.reg].filter(Boolean).join(" · "),e:"🏘️",go:()=>{quitaPin();if(window.CERCA&&CERCA.en)CERCA.en(s.lat,s.lon,s.n);else flyTo(s.lat,s.lon,13)},mapa:()=>verPueblo(s)})}}
   else if(q.length>=3&&navigator.onLine)photon(q0)
   // orden: igual que lo escrito > empieza así > el resto; y dentro, ciudad > villa > pueblo > aldea
   const rk=x=>{const t=nk(x.t);return(t===q?0:t.startsWith(q)?10:20)+({ciudad:0,villa:1,pueblo:2,parroquia:2,concejo:2}[nk((x.s||"").split(" · ")[0])]??3)};
   out.p=out.p.map((x,i)=>[rk(x),i,x]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(a=>a[2]).slice(0,6)}
  const ord=a=>a.sort((x,y)=>x.sc-y.sc||x.t.localeCompare(y.t,"es"));
  // la misma cumbre o lugar puede estar en el grupo y en un colaborador: solo una vez
  const uno=a=>{const v=new Map();return a.filter(x=>{const k=nk(x.t.split("|").pop()),y=v.get(k);if(y){if(x.rt&&x.rt.length)y.rt=[...new Set((y.rt||[]).concat(x.rt))];return false}v.set(k,x);return true})};
  const sec=[["Rutas",ord(out.r).slice(0,5)],["Cumbres",uno(ord(out.c)).slice(0,5)],["Lugares",uno(ord(out.l)).slice(0,3)],["Pueblos",out.p]];
  let h="";for(const[n,l]of sec){if(!l.length)continue;h+=`<h4>${n}</h4>`+l.map(x=>{RES.push(x);const i=RES.length-1,b=`<button data-mr="${i}"><span class="e">${x.e}</span><span><b>${esc(x.t)}</b>${x.s?`<small>${esc(x.s)}</small>`:""}${x.rt&&x.rt.length?`<small class="rtq">🏆 ${esc(x.rt.join(" · "))}</small>`:""}</span></button>`;
    return x.pu?`<div class="mpu">${b}<span class="mpub"><button data-mr="${i}" title="Rutas cerca de ${esc(x.t)}">🥾 Rutas</button><button data-mrr="${i}" title="Acercar el mapa a ${esc(x.t)}">🗺 Mapa</button></span></div>`:b}).join("")}
  res.innerHTML=(h||`<p class="nada">No encuentro nada con «${esc(q0)}».</p>`)+`<button class="todo" data-mtodo>Ver todo en Explorar ›</button>`;res.hidden=false}
let tm=0;inp.addEventListener("input",()=>{bx.hidden=!inp.value;clearTimeout(tm);tm=setTimeout(()=>busca(inp.value),120)});
inp.addEventListener("focus",()=>{if(inp.value)busca(inp.value)});
inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&RES[0]){e.preventDefault();elige(0)}if(e.key==="Escape"){cierra();inp.blur()}});
bx.addEventListener("click",()=>{inp.value="";bx.hidden=true;cierra();quitaPin();inp.focus()});
function cierra(){res.hidden=true}
// 16 nov: un pueblo se puede ver en el mapa (acercando) o ver sus rutas cerca. Marca temporal con el nombre (no se puede tocar: deja dibujar encima)
let PIN=null,pinT=0;
function quitaPin(){clearTimeout(pinT);if(PIN&&window.map){map.removeLayer(PIN)}PIN=null}
function verPueblo(s){quitaPin();if(typeof map==="undefined"||!window.L){flyTo(s.lat,s.lon,64);return}
  if(document.getElementById("v-mapa").hidden&&typeof showView==="function")showView("mapa");
  map.flyTo([s.lat,s.lon],Math.max(map.getZoom(),14),{duration:.8});
  PIN=L.marker([s.lat,s.lon],{interactive:false,keyboard:false,zIndexOffset:1500,icon:L.divIcon({className:"mpupin",iconSize:null,html:`<i></i><b>${esc(s.alt?s.alt.split(";")[0]:s.n)}</b>`})}).addTo(map);
  pinT=setTimeout(quitaPin,60000)}
function elige(i){const x=RES[i];if(!x)return;cierra();inp.blur();try{x.go()}catch(e){console.warn(e)}}
res.addEventListener("click",e=>{const rr=e.target.closest("[data-mrr]");if(rr){const x=RES[+rr.dataset.mrr];cierra();inp.blur();if(x&&x.mapa)x.mapa();return}
  const b=e.target.closest("[data-mr]");if(b){elige(+b.dataset.mr);return}
  if(e.target.closest("[data-mtodo]")){const v=inp.value;cierra();inp.blur();showView("rutas");const q=document.getElementById("q");if(q){q.value=v;q.dispatchEvent(new Event("input"))}}});
document.addEventListener("pointerdown",e=>{if(!res.hidden&&!e.target.closest("#msearch"))cierra()},true);
})();
