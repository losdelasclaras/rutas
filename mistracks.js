/* ---------- Mis tracks (pestaña Lugares): tracks cargados (GPX/KML) y tracks de rutas del blog guardados ----------
   Cada uno se puede seguir con el GPS, descargar en GPX, renombrar y quitar. Se sincronizan con «Entrar con Google». */
(function(){
const MPI=window.MISPUNTOS;
const T=()=>MPI.tracks();
const box=document.createElement("div");box.className="mpbox";box.id="mtbox";
document.getElementById("mpbox").after(box);
const routeOf=t=>t&&t.src==="blog"?R.find(r=>r.u===t.u):null;
const blogId=r=>"b-"+String(r.u).replace(/^https?:\/\/[^/]+\//,"").replace(/\.html$/,"").replace(/[^a-z0-9]+/gi,"-").slice(-90);
const savedOf=r=>T().find(t=>t.src==="blog"&&t.u===r.u);
const fmtF=f=>{try{return new Date(f).toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"})}catch(e){return""}};
function datos(t){const r=routeOf(t),g=r&&r.gx;return{km:t.km||(g&&g.km)||0,up:t.up!=null?t.up:g?g.up:null,dn:t.dn!=null?t.dn:g?g.dn:null}}
const kmTxt=v=>v?v.toLocaleString("es-ES",{maximumFractionDigits:1})+" km":"";

function render(){const ts=T().slice().sort((a,b)=>(b.f||"").localeCompare(a.f||""));
  box.innerHTML=`<h2>🧵 Mis tracks <small style="font-weight:500;color:#666">(${ts.length})</small></h2>
  ${ts.length?"":`<p class="note">Guarda aquí tracks de otras personas (GPX o KML: de Wikiloc, de un amigo…) y los de las rutas del blog que te interesen, con <b>☆ Guardar en mis tracks</b> en la ficha de la ruta. Desde aquí puedes seguirlos con el GPS.</p>`}
  <div class="mpacts" style="margin:6px 0 8px"><button class="mpb" data-mtx="imp">⬆️ Cargar GPX/KML</button></div>
  ${ts.map(t=>{const d=datos(t);return`<div class="mprow" data-mtopen="${esc(t.id)}"><span class="e">${t.src==="blog"?"📘":"〰️"}</span><span><b>${esc(t.n)}</b><small>${[kmTxt(d.km),d.up!=null?"+"+d.up.toLocaleString("es-ES")+" m":"",t.src==="blog"?"Del blog":"Cargado",t.f?fmtF(t.f):""].filter(Boolean).join(" · ")}</small></span></div>`}).join("")}`}
box.addEventListener("click",e=>{if(e.target.closest('[data-mtx="imp"]')){MPI.importar();return}
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
  <div class="topacts"><button class="btn primary" data-mtfol="${esc(t.id)}">▶ Seguir track</button><button class="btn ghost" data-mtgpx="${esc(t.id)}">⬇ GPX</button>${r?`<button class="btn ghost" data-mtroute="${esc(t.id)}">📘 Ver la ruta</button>`:""}</div>
  <div class="meta"><span class="tag">${r?"Ruta del blog":"Track cargado"}</span>${d.km?`<span class="tag">${kmTxt(d.km)}</span>`:""}${d.up!=null?`<span class="tag">+${d.up.toLocaleString("es-ES")} m</span>`:""}${t.f?`<span class="tag">Guardado el ${fmtF(t.f)}</span>`:""}</div>
  ${perfil(t)}
  ${!r&&t.pts&&t.pts.some(x=>x[2]==null)?`<p class="note">${navigator.onLine?"Calculando las alturas…":"Este track no trae alturas; se calcularán cuando haya conexión."}</p>`:""}
  <div class="mpacts">${p?`<a class="mpb" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${p[0][0]},${p[0][1]}">🚗 Cómo llegar al inicio</a>`:""}
  <button class="mpb" data-mtren="${esc(t.id)}">✏️ Cambiar nombre</button><button class="mpb dan" data-mtdel="${esc(t.id)}">🗑 Quitar de mis tracks</button></div>`);
  sheet._mt=t.id;
  if(fit)setTimeout(()=>encuadra(t),60);
  if(!r&&t.pts&&t.pts.some(x=>x[2]==null))MPI.demAlt(t.id)}
function refresh(id){render();if(!sheet.hidden&&String(sheet._mt)===String(id)&&sheet.querySelector("[data-mtfol]"))open(id,false)}

function gpxDe(t){const x=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  return`<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Los de las Claras" xmlns="http://www.topografix.com/GPX/1/1">\n<trk><name>${x(t.n)}</name><trkseg>\n`+
    t.pts.map(p=>`<trkpt lat="${p[0]}" lon="${p[1]}">${p[2]!=null?`<ele>${p[2]}</ele>`:""}</trkpt>`).join("\n")+`\n</trkseg></trk>\n</gpx>\n`}
const comoRuta=t=>({u:"mt:"+t.id,ti:t.n,gx:{ln:t.pts,km:t.km}});

sheet.addEventListener("click",e=>{
  const id=(s)=>{const b=e.target.closest(s);return b?b.getAttribute(s.slice(1,-1)):null};
  let k;
  if((k=id("[data-mtfol]"))!=null){const t=T().find(x=>String(x.id)===k);if(!t)return;const r=routeOf(t);if(r)SEGUIR.start(r,false);else SEGUIR.start(comoRuta(t),false);return}
  if((k=id("[data-mtgpx]"))!=null){const t=T().find(x=>String(x.id)===k);if(!t)return;const r=routeOf(t);if(r)dlGPX(r);else MPI.dl(t.n.replace(/[\\/:*?"<>|]+/g," ").trim()+".gpx",gpxDe(t),"application/gpx+xml");return}
  if((k=id("[data-mtroute]"))!=null){const t=T().find(x=>String(x.id)===k);const r=routeOf(t);if(r)openRoute(r.id);return}
  if((k=id("[data-mtren]"))!=null){const t=T().find(x=>String(x.id)===k);if(!t)return;
    MPI.show(`<div class="sheet-head"><h2>Cambiar nombre</h2><button class="x" aria-label="Cerrar" data-close>×</button></div><div class="mpform"><label for="mtn">Nombre del track</label><input type="text" id="mtn" maxlength="100" value="${esc(t.n)}">
    <div class="mpacts"><button class="mpb pri" data-mtrensave="${esc(t.id)}">💾 Guardar</button><button class="mpb" data-mtback="${esc(t.id)}">Cancelar</button></div></div>`);
    sheet._mt=t.id;setTimeout(()=>{const i=document.getElementById("mtn");if(i){i.focus();i.select()}},50);return}
  if((k=id("[data-mtrensave]"))!=null){const v=(document.getElementById("mtn").value||"").trim();if(!v)return;
    const ts=T().map(x=>String(x.id)===k?{...x,n:v}:x);MPI.saveTracks(ts);toast("Nombre cambiado");open(k,false);return}
  if((k=id("[data-mtback]"))!=null){open(k,false);return}
  if((k=id("[data-mtdel]"))!=null){const b=e.target.closest("[data-mtdel]");if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="¿Seguro? Toca otra vez";return}
    MPI.saveTracks(T().filter(x=>String(x.id)!==k));sheet.hidden=true;toast("Quitado de Mis tracks");return}});

/* en la ficha de una ruta del blog: «☆ Guardar en mis tracks» */
window.MTSAVED=r=>!!savedOf(r);
document.addEventListener("click",e=>{const b=e.target.closest("[data-mtsave]");if(!b)return;e.preventDefault();e.stopPropagation();
  const r=R[+b.dataset.mtsave];if(!r||!r.gx)return;const s=savedOf(r);
  if(s){MPI.saveTracks(T().filter(x=>x!==s));b.textContent="☆ Guardar en mis tracks";toast("Quitado de Mis tracks")}
  else{MPI.saveTracks([...T(),{id:blogId(r),src:"blog",u:r.u,n:routeTitle(r),km:r.gx.km,up:r.gx.up,dn:r.gx.dn,f:new Date().toISOString()}]);
    b.textContent="★ En mis tracks";toast("Guardado en Mis tracks (pestaña Lugares)")}},true);

window.MISTRACKS={render,open,refresh,route:id=>{const t=T().find(x=>String(x.id)===String(id));return t&&t.pts?comoRuta(t):null}};
render();
})();
