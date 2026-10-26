/* ---------- Mis tracks (pestaña Lugares): tracks cargados (GPX/KML) y tracks de rutas del blog guardados ----------
   Cada uno se puede seguir con el GPS, descargar en GPX, renombrar y quitar. Se sincronizan con «Entrar con Google». */
(function(){
const MPI=window.MISPUNTOS;
const T=()=>MPI.tracks();
document.head.insertAdjacentHTML("beforeend",`<style>
.mtfil,.mpfil{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 8px}.mtfil button{border:1px solid var(--edge);background:var(--card);color:var(--ink);border-radius:999px;padding:7px 12px;font-weight:700;font-size:14px;cursor:pointer}
.mtfil button[aria-pressed=true]{background:var(--ink);color:var(--card);border-color:var(--ink)}.mtfil small{opacity:.7}
.mpq{width:100%;box-sizing:border-box;border:1px solid var(--edge);border-radius:10px;padding:10px 12px;font:inherit;font-size:16px;background:var(--card);color:var(--ink);margin:2px 0 4px}
.est{display:inline-block;margin-top:3px;font-size:12px;font-weight:700;border-radius:999px;padding:2px 8px}.est.h{background:#e3f1e6;color:#1f6b32}.est.p{background:#fdf0d8;color:#8a4b00}
.estbox{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:4px 0 10px}.rest{display:flex;gap:6px;flex-wrap:wrap;width:100%}.rest .btn.on{background:var(--ink);color:var(--card);border-color:var(--ink)}
.estbox .mpb.on{background:var(--ink);color:var(--card);border-color:var(--ink)}
.estbox input[type=date]{border:1px solid var(--edge);border-radius:8px;padding:6px;font:inherit;background:var(--card);color:var(--ink)}
</style>`);
const box=document.createElement("div");box.className="mpbox";box.id="mtbox";
document.getElementById("mpbox").after(box);
const routeOf=t=>t&&t.src==="blog"?R.find(r=>r.u===t.u):null;
const blogId=r=>"b-"+String(r.u).replace(/^https?:\/\/[^/]+\//,"").replace(/\.html$/,"").replace(/[^a-z0-9]+/gi,"-").slice(-90);
const savedOf=r=>T().find(t=>t.src==="blog"&&t.u===r.u);
const fmtF=f=>{try{return new Date(f).toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"})}catch(e){return""}};
function datos(t){const r=routeOf(t),g=r&&r.gx;return{km:t.km||(g&&g.km)||0,up:t.up!=null?t.up:g?g.up:null,dn:t.dn!=null?t.dn:g?g.dn:null}}
const kmTxt=v=>v?v.toLocaleString("es-ES",{maximumFractionDigits:1})+" km":"";

// filtro (todos / pendientes / hechos) y búsqueda: la lista se repinta sin tocar el buscador
let FIL=store.get("ldc-mtfil","todos"),QT="";
const nk2=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const estado=t=>t.est==="hecho"?`<span class="est h">✓ Hecho${t.fh?" "+fmtF(t.fh):""}</span>`:t.est==="pend"?`<span class="est p">★ Pendiente</span>`:"";
function filas(){const all=T().slice().sort((a,b)=>(b.f||"").localeCompare(a.f||""));
  const ts=all.filter(t=>(FIL==="todos"||(FIL==="hecho"?t.est==="hecho":t.est==="pend"))&&(!QT||nk2(t.n).includes(QT)));
  if(!ts.length)return`<p class="note" style="margin:10px 2px">${all.length?"Ningún track con ese filtro o búsqueda.":""}</p>`;
  return ts.map(t=>{const d=datos(t);return`<div class="mprow" data-mtopen="${esc(t.id)}"><span class="e">${t.src==="blog"?"📘":"〰️"}</span><span><b>${esc(t.n)}</b><small>${[kmTxt(d.km),d.up!=null?"+"+d.up.toLocaleString("es-ES")+" m":"",t.src==="blog"?"Del blog":"Cargado"].filter(Boolean).join(" · ")}</small>${estado(t)}</span><span class="rbs"><button class="rb" data-mtred="${esc(t.id)}" aria-label="Cambiar nombre"><svg class="trs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg></button><button class="rb dan" data-mtrdel="${esc(t.id)}" aria-label="Quitar"><svg class="trs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button></span></div>`}).join("")}
function render(){const all=T(),nh=all.filter(t=>t.est==="hecho").length,np=all.filter(t=>t.est==="pend").length;
  if(!box.querySelector("#mtlist")||box.dataset.n!==String(all.length>0)){
    box.dataset.n=String(all.length>0);
    box.innerHTML=`<h2>🧵 Mis tracks</h2>
    ${all.length?"":`<p class="note">Guarda aquí tracks de otras personas (GPX o KML: de Wikiloc, de un amigo…) y los de las rutas del blog que te interesen, con <b>☆ Guardar en mis tracks</b> en la ficha de la ruta. Desde aquí puedes seguirlos con el GPS.</p>`}
    <div class="mpacts" style="margin:6px 0 8px"><button class="mpb" data-mtx="imp">⬆️ Cargar GPX/KML</button></div>
    ${all.length?`<div class="mtfil" id="mtfil"></div><input class="mpq" id="mtq" type="search" placeholder="Buscar en mis tracks…" autocomplete="off">`:""}
    <div id="mtlist"></div>`;
    const q=box.querySelector("#mtq");if(q){q.value=QT;q.addEventListener("input",()=>{QT=nk2(q.value.trim());box.querySelector("#mtlist").innerHTML=filas()})}}
  const f=box.querySelector("#mtfil");if(f)f.innerHTML=[["todos","Todos",all.length],["pend","★ Pendientes",np],["hecho","✓ Hechos",nh]].map(([k,n,c])=>`<button data-mtf="${k}" aria-pressed="${FIL===k}">${n} <small>${c}</small></button>`).join("");
  box.querySelector("#mtlist").innerHTML=filas()}
box.addEventListener("click",e=>{if(e.target.closest('[data-mtx="imp"]')){MPI.importar();return}
  const fb=e.target.closest("[data-mtf]");if(fb){FIL=fb.dataset.mtf;store.set("ldc-mtfil",FIL);render();return}
  const re=e.target.closest("[data-mtred]");if(re){renombrar(re.dataset.mtred);return}
  const rd=e.target.closest("[data-mtrdel]");if(rd){if(rd.dataset.sure!=="1"){rd.dataset.sure="1";rd.classList.add("sure");rd.innerHTML="¿Seguro?";setTimeout(()=>{if(rd.isConnected){rd.dataset.sure="";rd.classList.remove("sure");rd.innerHTML='<svg class="trs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>'}},4000);return}
    MPI.saveTracks(T().filter(x=>String(x.id)!==rd.dataset.mtrdel));toast("Quitado de Mis tracks");return}
  const o=e.target.closest("[data-mtopen]");if(o)open(o.dataset.mtopen,true)});

/* perfil a partir de los puntos (para los cargados) */
function perfil(t){const r=routeOf(t);if(r&&r.gx&&r.gx.pf&&r.gx.pf.length)return profSVG(r.gx);
  const p=t.pts;if(!p||p.length<2||p.some(x=>x[2]==null))return"";
  const dm=(a,b)=>{const R0=6371,k=Math.PI/180,dl=(b[0]-a[0])*k,dn=(b[1]-a[1])*k,h=Math.sin(dl/2)**2+Math.cos(a[0]*k)*Math.cos(b[0]*k)*Math.sin(dn/2)**2;return 2*R0*Math.asin(Math.sqrt(h))};
  let c=0;const all=[[0,p[0][2]]];for(let i=1;i<p.length;i++){c+=dm(p[i-1],p[i]);all.push([c,p[i][2]])}
  const f=t.km&&c?t.km/c:1,step=Math.max(1,Math.floor(all.length/120)),pf=[];for(let i=0;i<all.length;i+=step)pf.push([Math.round(all[i][0]*f*100)/100,all[i][1]]);pf.push([Math.round(c*f*100)/100,all[all.length-1][1]]);
  return profSVG({pf,mn:t.mn!=null?t.mn:Math.min(...pf.map(x=>x[1])),mx:t.mx!=null?t.mx:Math.max(...pf.map(x=>x[1])),km:t.km})}

function encuadra(t){const p=MPI.ptsOf(t);if(!p){if(window.loadTracks)loadTracks().then(ok=>{if(ok&&MPI.ptsOf(t))encuadra(t)});return}
  const b=L.latLngBounds(p.map(x=>[x[0],x[1]]));const wide=innerWidth>=860;
  map.fitBounds(b,{paddingTopLeft:[30,90],paddingBottomRight:wide?[480,30]:[30,Math.round(innerHeight*0.5)],maxZoom:15})}
function open(id,fit){const t=T().find(x=>String(x.id)===String(id));if(!t)return;
  if(typeof showView==="function")showView("mapa");
  if(!LAY.mt){LAY.mt=true;saveLay();const b=document.querySelector('[data-lay="mt"]');if(b)b.setAttribute("aria-pressed",true);MPI.sync()}
  const r=routeOf(t),d=datos(t),p=MPI.ptsOf(t)||(r&&r.gx&&r.gx.st?[r.gx.st]:null);
  MPI.show(`<div class="sheet-head"><h2>${esc(t.n)}</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
  <div class="topacts"><button class="btn primary" data-mtfol="${esc(t.id)}">▶ Seguir track</button><button class="btn ghost" data-mtshare="${esc(t.id)}">📤 Compartir</button>${r?`<button class="btn ghost" data-mtroute="${esc(t.id)}">📘 Ver la ruta</button>`:""}</div>
  <div class="meta"><span class="tag">${r?"Ruta del blog":"Track cargado"}</span>${d.km?`<span class="tag">${kmTxt(d.km)}</span>`:""}${d.up!=null?`<span class="tag">+${d.up.toLocaleString("es-ES")} m</span>`:""}${t.f?`<span class="tag">Guardado el ${fmtF(t.f)}</span>`:""}</div>
  <div class="estbox"><button class="mpb${t.est==="hecho"?" on":""}" data-mtest="hecho" data-id="${esc(t.id)}">✓ ${t.est==="hecho"?"Hecho":"Lo he hecho"}</button><button class="mpb${t.est==="pend"?" on":""}" data-mtest="pend" data-id="${esc(t.id)}">★ Pendiente</button>${t.est==="hecho"?`<label class="note" style="display:flex;align-items:center;gap:6px">el <input type="date" data-mtfh="${esc(t.id)}" value="${(t.fh||"").slice(0,10)}" max="${new Date().toISOString().slice(0,10)}"></label>`:""}</div>
  ${perfil(t)}
  ${(()=>{const q=p&&p.length?p.reduce((b,x)=>x[2]!=null&&(b[2]==null||x[2]>b[2])?x:b,p[0]):null;return q?`<h3 style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 4px">El tiempo${q[2]!=null?" en el punto más alto":""}</h3><div class="wx" data-lat="${q[0]}" data-lon="${q[1]}" data-alt="${q[2]!=null?Math.round(q[2]):""}"></div>`:""})()}
  ${!r&&t.pts&&t.pts.some(x=>x[2]==null)?`<p class="note">${navigator.onLine?"Calculando las alturas…":"Este track no trae alturas; se calcularán cuando haya conexión."}</p>`:""}
  ${window.OFFLINE&&!OFFLINE.has(r?r.u:"mt:"+t.id)&&p&&p[0][0]<44&&p[0][0]>35&&p[0][1]>-10&&p[0][1]<4.7?`<div class="offhint" style="margin:12px 0 4px;padding:10px 12px;border-radius:12px;background:#eef6ef;color:#1f4d2a;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:180px">📥 <b>¿Vas a ir?</b> Descarga el mapa para verlo aunque no tengas cobertura.</span><button class="mpb pri" style="background:#2a7a3b;border-color:#2a7a3b" data-offt="${esc(t.id)}">Descargar mapa</button></div>`:""}
  <div class="mpacts">${p?`<a class="mpb" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${p[0][0]},${p[0][1]}">🚗 Cómo llegar al inicio</a>`:""}
  ${window.OFFLINE&&OFFLINE.has(r?r.u:"mt:"+t.id)?`<button class="mpb" data-offt="${esc(t.id)}">✓ Mapa sin cobertura</button>`:""}<button class="mpb" data-mtgpx="${esc(t.id)}">⬇ Descargar GPX</button><button class="mpb" data-mtren="${esc(t.id)}">✏️ Cambiar nombre</button><button class="mpb dan" data-mtdel="${esc(t.id)}"><svg class="trs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg> Quitar de mis tracks</button></div>`);
  sheet._mt=t.id;
  if(fit)setTimeout(()=>encuadra(t),60);
  if(!r&&t.pts&&t.pts.some(x=>x[2]==null))MPI.demAlt(t.id)}
function refresh(id){render();if(!sheet.hidden&&String(sheet._mt)===String(id)&&sheet.querySelector("[data-mtfol]"))open(id,false)}

function gpxDe(t){const x=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  return`<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Los de las Claras" xmlns="http://www.topografix.com/GPX/1/1">\n<trk><name>${x(t.n)}</name><trkseg>\n`+
    t.pts.map(p=>`<trkpt lat="${p[0]}" lon="${p[1]}">${p[2]!=null?`<ele>${p[2]}</ele>`:""}</trkpt>`).join("\n")+`\n</trkseg></trk>\n</gpx>\n`}
function renombrar(k){const t=T().find(x=>String(x.id)===String(k));if(!t)return;if(typeof showView==="function")showView("mapa");
  MPI.show(`<div class="sheet-head"><h2>Cambiar nombre</h2><button class="x" aria-label="Cerrar" data-close>×</button></div><div class="mpform"><label for="mtn">Nombre del track</label><input type="text" id="mtn" maxlength="100" value="${esc(t.n)}">
  <div class="mpacts"><button class="mpb pri" data-mtrensave="${esc(t.id)}">💾 Guardar</button><button class="mpb" data-mtback="${esc(t.id)}">Cancelar</button></div></div>`);
  sheet._mt=t.id;setTimeout(()=>{const i=document.getElementById("mtn");if(i){i.focus();i.select()}},50)}
const comoRuta=t=>({u:"mt:"+t.id,ti:t.n,gx:{ln:t.pts,km:t.km}});

sheet.addEventListener("change",e=>{const d=e.target.closest("[data-mtfh]");if(!d||!d.value)return;const k2=d.dataset.mtfh;
  MPI.saveTracks(T().map(x=>String(x.id)===k2?{...x,fh:d.value}:x));toast("Fecha guardada")});
sheet.addEventListener("click",e=>{
  const id=(s)=>{const b=e.target.closest(s);return b?b.getAttribute(s.slice(1,-1)):null};
  let k;
  if((k=id("[data-mtfol]"))!=null){const t=T().find(x=>String(x.id)===k);if(!t)return;const r=routeOf(t);if(r)SEGUIR.start(r,false);else SEGUIR.start(comoRuta(t),false);return}
  if((k=id("[data-mtgpx]"))!=null){const t=T().find(x=>String(x.id)===k);if(!t)return;const r=routeOf(t);if(r)dlGPX(r);else MPI.dl(t.n.replace(/[\\/:*?"<>|]+/g," ").trim()+".gpx",gpxDe(t),"application/gpx+xml");return}
  const es=e.target.closest("[data-mtest]");if(es){const k2=es.dataset.id,v=es.dataset.mtest;
    MPI.saveTracks(T().map(x=>{if(String(x.id)!==k2)return x;const y={...x};if(y.est===v){delete y.est;delete y.fh}else{y.est=v;if(v==="hecho")y.fh=new Date().toISOString().slice(0,10);else delete y.fh}return y}));
    toast(v==="hecho"?"Marcado como hecho":"Apuntado como pendiente");open(k2,false);return}
  if((k=id("[data-mtshare]"))!=null){const t=T().find(x=>String(x.id)===k);if(t&&window.COMPARTIR)COMPARTIR.track(t);return}
  if((k=id("[data-mtroute]"))!=null){const t=T().find(x=>String(x.id)===k);const r=routeOf(t);if(r)openRoute(r.id);return}
  if((k=id("[data-mtren]"))!=null){renombrar(k);return}
  if((k=id("[data-mtrensave]"))!=null){const v=(document.getElementById("mtn").value||"").trim();if(!v)return;
    const ts=T().map(x=>String(x.id)===k?{...x,n:v}:x);MPI.saveTracks(ts);toast("Nombre cambiado");open(k,false);return}
  if((k=id("[data-mtback]"))!=null){open(k,false);return}
  if((k=id("[data-mtdel]"))!=null){const b=e.target.closest("[data-mtdel]");if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="¿Seguro? Toca otra vez";return}
    MPI.saveTracks(T().filter(x=>String(x.id)!==k));sheet.hidden=true;toast("Quitado de Mis tracks");return}});

/* en la ficha de una ruta del blog: «☆ Guardar en mis tracks» */
window.MTSAVED=r=>!!savedOf(r);
/* en la ficha de una ruta del blog: «✓ La he hecho» / «★ Pendiente» (se guarda en Mis tracks con esa marca) */
window.RESTBTN=r=>{const s=savedOf(r),e=s&&s.est;return`<span class="rest" data-r="${r.id}"><button class="btn ghost${e==="hecho"?" on":""}" data-rest="hecho">✓ ${e==="hecho"?"Hecha"+(s.fh?" ("+fmtF(s.fh)+")":""):"La he hecho"}</button><button class="btn ghost${e==="pend"?" on":""}" data-rest="pend">★ ${e==="pend"?"Pendiente":"La quiero hacer"}</button></span>`};
document.addEventListener("click",e=>{const b=e.target.closest("[data-rest]");if(!b)return;e.preventDefault();e.stopPropagation();
  const box2=b.closest(".rest"),r=R[+box2.dataset.r],v=b.dataset.rest;if(!r||!r.gx)return;
  const go=()=>{const s=savedOf(r);let ts;
    if(!s)ts=[...T(),{id:blogId(r),src:"blog",u:r.u,n:routeTitle(r),km:r.gx.km,up:r.gx.up,dn:r.gx.dn,f:new Date().toISOString(),est:v,...(v==="hecho"?{fh:new Date().toISOString().slice(0,10)}:{})}];
    else ts=T().map(x=>{if(x!==s)return x;const y={...x};if(y.est===v){delete y.est;delete y.fh}else{y.est=v;if(v==="hecho")y.fh=new Date().toISOString().slice(0,10);else delete y.fh}return y});
    MPI.saveTracks(ts);const n=savedOf(r);
    toast(n&&n.est?(n.est==="hecho"?"Marcada como hecha":"Apuntada como pendiente")+" · está en Mis cosas › Mis tracks":"Marca quitada");
    document.querySelectorAll(`.rest[data-r="${r.id}"]`).forEach(x=>x.outerHTML=RESTBTN(r));
    document.querySelectorAll(`[data-mtsave="${r.id}"]`).forEach(x=>x.textContent=savedOf(r)?"★ En mis tracks":"☆ Guardar en mis tracks")};
  if(window.cuentaOk&&!cuentaOk(go,"tracks"))return;go()},true);
document.addEventListener("click",e=>{const b=e.target.closest("[data-mtsave]");if(!b)return;e.preventDefault();e.stopPropagation();
  const r=R[+b.dataset.mtsave];if(!r||!r.gx)return;if(window.cuentaOk&&!cuentaOk(()=>{const bb=document.querySelector(`[data-mtsave="${r.id}"]`);if(bb&&!savedOf(r))bb.click();else if(!savedOf(r)){MPI.saveTracks([...T(),{id:blogId(r),src:"blog",u:r.u,n:routeTitle(r),km:r.gx.km,up:r.gx.up,dn:r.gx.dn,f:new Date().toISOString()}]);toast("Guardado en Mis cosas › Mis tracks")}},"tracks"))return;const s=savedOf(r);
  if(s){MPI.saveTracks(T().filter(x=>x!==s));b.textContent="☆ Guardar en mis tracks";toast("Quitado de Mis tracks")}
  else{MPI.saveTracks([...T(),{id:blogId(r),src:"blog",u:r.u,n:routeTitle(r),km:r.gx.km,up:r.gx.up,dn:r.gx.dn,f:new Date().toISOString()}]);
    b.textContent="★ En mis tracks";toast("Guardado en Mis cosas › Mis tracks");if(window.OFFLINE&&OFFLINE.ofrecer)setTimeout(()=>OFFLINE.ofrecer(r),700)}},true);

window.MISTRACKS={render,open,refresh,route:id=>{const t=T().find(x=>String(x.id)===String(id));return t&&t.pts?comoRuta(t):null}};
render();
})();
