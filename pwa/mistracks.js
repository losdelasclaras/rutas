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
  return ts.map(t=>{const d=datos(t);return`<div class="mprow" data-mtopen="${esc(t.id)}"><span class="e">${t.src==="blog"?"📘":"〰️"}</span><span><b>${esc(t.n)}</b><small>${[kmTxt(d.km),d.up!=null?"+"+d.up.toLocaleString("es-ES")+" m":"",t.src==="blog"?"Del blog":"Cargado",t.c?"📁 "+esc(t.c):""].filter(Boolean).join(" · ")}</small>${estado(t)}</span><span class="rbs"><button class="rb" data-mtred="${esc(t.id)}" aria-label="Cambiar nombre"><svg class="trs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg></button><button class="rb dan" data-mtrdel="${esc(t.id)}" aria-label="Quitar"><svg class="trs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button></span></div>`}).join("")}
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
    borraFotos(rd.dataset.mtrdel);MPI.saveTracks(T().filter(x=>String(x.id)!==rd.dataset.mtrdel));toast("Quitado de Mis tracks");return}
  const o=e.target.closest("[data-mtopen]");if(o)open(o.dataset.mtopen,true)});

/* perfil a partir de los puntos (para los cargados) */
function perfil(t){const r=routeOf(t);if(r&&r.gx&&r.gx.pf&&r.gx.pf.length)return profSVG(r.gx);
  const p=t.pts;if(!p||p.length<2||p.some(x=>x[2]==null))return"";
  const dm=(a,b)=>{const R0=6371,k=Math.PI/180,dl=(b[0]-a[0])*k,dn=(b[1]-a[1])*k,h=Math.sin(dl/2)**2+Math.cos(a[0]*k)*Math.cos(b[0]*k)*Math.sin(dn/2)**2;return 2*R0*Math.asin(Math.sqrt(h))};
  let c=0;const all=[[0,p[0][2]]];for(let i=1;i<p.length;i++){c+=dm(p[i-1],p[i]);all.push([c,p[i][2]])}
  const f=t.km&&c?t.km/c:1,step=Math.max(1,Math.floor(all.length/120)),pf=[];for(let i=0;i<all.length;i+=step)pf.push([Math.round(all[i][0]*f*100)/100,all[i][1]]);pf.push([Math.round(c*f*100)/100,all[all.length-1][1]]);
  const g={pf,mn:t.mn!=null?t.mn:Math.min(...pf.map(x=>x[1])),mx:t.mx!=null?t.mx:Math.max(...pf.map(x=>x[1])),km:t.km};
  return conPuntos(profSVG(g),t,g)}
/* 8 nov 2026: los puntos de la grabación en el perfil, en su km y a su altura (mismas medidas que profSVG) */
function conPuntos(svg,t,g){if(!(t.w||[]).length||!MPI.kmW)return svg;const W=600,H=190,pl=70,pb=34,pt=12,pr=8,X=g.pf[g.pf.length-1][0]||1,lo=Math.floor((g.mn-30)/50)*50,hi=Math.ceil((g.mx+30)/50)*50;
  const em=k=>k==="cumbre"?"⛰️":MPI.ico(k)[1];
  const m=t.w.map(w=>{const q=MPI.kmW(t,w);if(!q||q.lejos||q.a==null)return"";const x=pl+(W-pl-pr)*Math.min(q.km,X)/X,y=pt+(H-pt-pb)*(1-(q.a-lo)/(hi-lo));
    return`<g class="wpp" data-wp="${esc(w.id)}" style="cursor:pointer"><line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${y.toFixed(1)}" y2="${H-pb}" stroke="#e8711a" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" fill="#fff" stroke="#e8711a" stroke-width="2.5"/><text x="${x.toFixed(1)}" y="${(y+5.5).toFixed(1)}" text-anchor="middle" font-size="15">${em(w.ic)}</text><title>${esc(w.n)}</title></g>`}).join("");
  return svg.replace(/<\/svg>$/,m+"</svg>")}
/* ficha de un punto de la grabación */
const kmF=v=>"km "+v.toLocaleString("es-ES",{minimumFractionDigits:1,maximumFractionDigits:1});
function puntosHTML(t){const ws=t.w||[];if(!ws.length)return"";
  return`<h3 style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 4px">📍 Puntos del recorrido (${ws.length})</h3><div class="wplist">${ws.map(w=>{const q=MPI.kmW&&MPI.kmW(t,w);
    return`<button class="wprow" data-wpopen="${esc(w.id)}" data-t="${esc(t.id)}">${w.fo?`<span class="wpf" data-wpfoto="${esc(w.id)}"></span>`:`<span class="wpe">${MPI.emo(w.ic)}</span>`}<span class="wpt"><b>${esc(w.n)}</b><small>${[q?kmF(q.km):"",q&&q.a!=null?Math.round(q.a).toLocaleString("es-ES")+" m":"",w.t?hora(w.t):""].filter(Boolean).join(" · ")}</small></span></button>`}).join("")}</div>`}
async function fotos(el){for(const s of el.querySelectorAll("[data-wpfoto]")){const j=await MPI.fotoGet(s.dataset.wpfoto);if(j&&s.isConnected)s.innerHTML=`<img src="${j}" alt="">`;else if(s.isConnected){s.className="wpe";s.textContent="📷"}}}
function punto(tid,pid){const t=T().find(x=>String(x.id)===String(tid)),w=t&&(t.w||[]).find(x=>x.id===pid);if(!t||!w)return;
  if(typeof showView==="function")showView("mapa");const q=MPI.kmW&&MPI.kmW(t,w);
  MPI.show(`${tipoHTML("punto","de «"+t.n+"»")}<div class="sheet-head"><h2>${MPI.emo(w.ic)} ${esc(w.n)}</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
  <div class="meta"><span class="tag">Punto de «${esc(t.n)}»</span>${q?`<span class="tag">${kmF(q.km)}</span>`:""}${q&&q.a!=null?`<span class="tag alt">${Math.round(q.a).toLocaleString("es-ES")} m</span>`:""}${w.t?`<span class="tag">${hora(w.t)}</span>`:""}</div>
  ${w.fo?`<div data-wpbig="${esc(w.id)}" style="min-height:40px"></div>`:""}
  ${w.nota?`<p class="desc" style="white-space:pre-wrap">${esc(w.nota)}</p>`:""}
  <div class="topacts"><button class="btn primary" data-mtback="${esc(t.id)}">← Ver el recorrido</button><a class="btn ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${w.lat},${w.lon}">🚗 Cómo llegar</a></div>
  <div class="mpacts"><button class="mpb" data-wpedit="${esc(w.id)}" data-t="${esc(t.id)}">✏️ Cambiar nombre o nota</button><button class="mpb dan" data-wpdel="${esc(w.id)}" data-t="${esc(t.id)}">Quitar este punto</button></div>
  <p class="note">${w.lat.toFixed(5)}, ${w.lon.toFixed(5)}</p>`);
  sheet._mt=t.id;sheet._wp=w.id;
  const b=sheet.querySelector("[data-wpbig]");if(b)MPI.fotoGet(w.id).then(j=>{if(j&&b.isConnected)b.innerHTML=`<img src="${j}" alt="" style="width:100%;max-height:320px;object-fit:cover;border-radius:12px;display:block;margin:4px 0 10px;cursor:zoom-in" data-fotobig>`;else b.remove()});
  map.flyTo([w.lat,w.lon],Math.max(map.getZoom(),15))}
const cambiaW=(tid,f)=>MPI.saveTracks(T().map(x=>{if(String(x.id)!==String(tid))return x;const y={...x,w:(x.w||[]).map(w=>({...w}))};f(y);return y}));

function encuadra(t){const p=MPI.ptsOf(t);if(!p){if(window.loadTracks)loadTracks().then(ok=>{if(ok&&MPI.ptsOf(t))encuadra(t)});return}
  const b=L.latLngBounds(p.map(x=>[x[0],x[1]]));const wide=innerWidth>=860;
  map.fitBounds(b,{paddingTopLeft:[30,90],paddingBottomRight:wide?[480,30]:[30,Math.round(innerHeight*0.5)],maxZoom:15})}
/* 8 nov 2026: «👁 Solo verlo»: se cierra la ficha y el mapa enseña el track entero, con una etiqueta para volver a la ficha */
const quitaPill=()=>{};
function soloVer(t){if(window.SOLOVER)SOLOVER.on({n:t.n,pts:MPI.ptsOf(t)||[],w:t.w},()=>open(t.id,false))}
/* 9 nov 2026: ficha del track más sencilla. Arriba solo distancia y desnivel; botones ▶ Seguir · 👁 Solo ver · 📊 Datos · ··· Más opciones.
   «Datos» enseña los números grandes como el panel de Grabar, y debajo el perfil, los puntos y el tiempo.
   «Más opciones»: compartir (GPX o enlace), cómo llegar al inicio y el resto (ruta del blog, carpeta, nombre, quitar). */
const H3=t=>`<h3 style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 4px">${t}</h3>`;
const trs=`<svg class="trs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>`;
function grande(t,d){const m=t.tm,tie=m&&m.b>m.a?hm(m.m||(m.b-m.a)/1000):d.km?"≈ "+hm((Math.max(d.km/4,(d.up||0)/400)+Math.min(d.km/4,(d.up||0)/400)/2)*3600):"—";
  return`<div class="tgr"><span><b>${tie}</b><small>${m&&m.b>m.a?"en movimiento":"tiempo estimado"}</small></span><span><b>${d.km?d.km.toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2}):"—"}</b><small>km</small></span><span><b>${d.up!=null?"+"+d.up.toLocaleString("es-ES"):"—"}</b><small>m de subida</small></span></div>`}
function open(id,fit,vista){const t=T().find(x=>String(x.id)===String(id));if(!t)return;quitaPill();
  if(t.src!=="blog"&&t.pts&&t.pts.length>1&&!(t.dv>=2)&&t.pts.every(x=>x[2]!=null)){MPI.desn(t);MPI.saveTracks(T().slice())}
  if(typeof showView==="function")showView("mapa");
  if(!LAY.mt){LAY.mt=true;saveLay();const b=document.querySelector('[data-lay="mt"]');if(b)b.setAttribute("aria-pressed",true);MPI.sync()}
  const r=routeOf(t),d=datos(t),p=MPI.ptsOf(t)||(r&&r.gx&&r.gx.st?[r.gx.st]:null),ie=esc(t.id),off=window.OFFLINE&&OFFLINE.has(r?r.u:"mt:"+t.id);
  const cab=`${r?tipoHTML("ruta","Guardada · Los de las Claras"):tipoHTML("track",t.src==="grab"?"Tuyo · grabado":"Tuyo")}<div class="sheet-head"><h2>${esc(t.n)}</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>`,volver=`<button class="btn ghost tvol" data-mtback="${ie}">← Volver</button>`;
  let h;
  if(vista==="datos"){   // 9 nov 2026: solo la cuadrícula de datos, el perfil y los puntos (sin la franja grande ni el tiempo)
    h=cab+volver+`<div class="tdat">`+datosHTML(t,d)+perfil(t)+puntosHTML(t)+
      (!r&&t.pts&&t.pts.some(x=>x[2]==null)?`<p class="note">${navigator.onLine?"Calculando las alturas…":"Este track no trae alturas; se calcularán cuando haya conexión."}</p>`:"")+`</div>`}
  else if(vista==="mas"){
    h=cab+volver+`<div class="tmas"><button class="mpb pri" data-mtshare="${ie}">📤 Compartir (GPX o enlace de la app)</button>
      ${p?`<a class="mpb" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${p[0][0]},${p[0][1]}">🚗 Cómo llegar al inicio</a>`:""}
      ${r?`<button class="mpb" data-mtroute="${ie}">📘 Ver la ruta del blog</button>`:""}
      ${off?`<button class="mpb" data-offt="${ie}">✓ Mapa sin cobertura</button>`:""}
      <button class="mpb" data-mtren="${ie}">✏️ Cambiar nombre</button>
      <button class="mpb dan" data-mtdel="${ie}">${trs} Quitar de mis tracks</button></div>`}
  else h=cab+`<div class="meta">${d.km?`<span class="tag">${kmTxt(d.km)}</span>`:""}${d.up!=null?`<span class="tag">+${d.up.toLocaleString("es-ES")} m</span>`:""}</div>
    <div class="tbot"><button class="btn primary" data-mtfol="${ie}">▶ Seguir</button><button class="btn ghost" data-mtver="${ie}">👁 Solo ver</button><button class="btn ghost" data-mtdat="${ie}">📊 Datos</button><button class="btn ghost" data-mtmas="${ie}">··· Más opciones</button></div>
    <div class="estbox"><button class="mpb${t.est==="hecho"?" on":""}" data-mtest="hecho" data-id="${ie}">✓ ${t.est==="hecho"?"Hecho":"Lo he hecho"}</button><button class="mpb${t.est==="pend"?" on":""}" data-mtest="pend" data-id="${ie}">★ Pendiente</button>${t.est==="hecho"?`<label class="note" style="display:flex;align-items:center;gap:6px">el <input type="date" data-mtfh="${ie}" value="${(t.fh||"").slice(0,10)}" max="${new Date().toISOString().slice(0,10)}"></label>`:""}</div>`;
  MPI.show(h);
  sheet._mt=t.id;sheet._wp=null;sheet._mv=vista||"";fotos(sheet);
  if(fit)setTimeout(()=>encuadra(t),60);
  if(!r&&t.pts&&t.pts.some(x=>x[2]==null))MPI.demAlt(t.id)}
document.head.insertAdjacentHTML("beforeend",`<style>
.tbot{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.tbot .btn{min-height:52px;font-size:17px;justify-content:center}
.tgr{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;text-align:center;background:var(--ink);color:var(--card);border-radius:16px;padding:12px 6px;margin:10px 0}
.tgr b{display:block;font-size:24px;font-variant-numeric:tabular-nums}.tgr small{font-size:12.5px;opacity:.85;font-weight:600}
.tmas{display:grid;gap:8px;margin:10px 0}.tmas .mpb{min-height:52px;font-size:16px;justify-content:center;text-align:center;width:100%}
.tvol{margin:4px 0 0}</style>`);
/* 📊 Datos del track: distancia, desniveles, alturas y, si es grabado, horas, tiempo en movimiento y velocidad */
document.head.insertAdjacentHTML("beforeend",`<style>.dat{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:12px 0}.dat div{background:var(--paper,#f4f6f2);border:1px solid var(--edge);border-radius:12px;padding:8px 10px}.dat b{display:block;font-size:1.15em}.dat span{font-size:.8em;color:var(--muted);font-weight:700}.dat .w{grid-column:1/-1}</style>`);
const hm=s=>{s=Math.round(s/60);const h=Math.floor(s/60),m=s%60;return h?`${h} h ${String(m).padStart(2,"0")} min`:`${m} min`};
const hora=ms=>new Date(ms).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"});
function datosHTML(t,d){const c=[],x=(v,l,w)=>c.push(`<div${w?' class="w"':""}><b>${v}</b><span>${l}</span></div>`);
  if(d.km)x(kmTxt(d.km),"Distancia");
  const r=routeOf(t),g=r&&r.gx,mx=t.mx!=null?t.mx:g&&g.mx,mn=t.mn!=null?t.mn:g&&g.mn;
  if(d.up!=null)x("+"+d.up.toLocaleString("es-ES")+" m","Desnivel de subida");
  if(d.dn!=null)x("−"+d.dn.toLocaleString("es-ES")+" m","Desnivel de bajada");
  if(mx!=null)x(Math.round(mx).toLocaleString("es-ES")+" m","Altura máxima");
  if(mn!=null)x(Math.round(mn).toLocaleString("es-ES")+" m","Altura mínima");
  const m=t.tm;
  if(m&&m.b>m.a){const tot=(m.b-m.a)/1000;
    x(new Date(m.a).toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long",year:"numeric"})+` · de ${hora(m.a)} a ${hora(m.b)}`,"Cuándo",1);
    x(hm(tot),"Tiempo total");x(hm(m.m),"En movimiento");x(hm(Math.max(0,tot-m.m)),"Parado");
    if(d.km&&m.m>60){const v=d.km/(m.m/3600);x(v.toLocaleString("es-ES",{maximumFractionDigits:1})+" km/h","Velocidad en movimiento");
      if(d.up&&m.m>600)x(Math.round(d.up/(m.m/3600)).toLocaleString("es-ES")+" m/h","Subida por hora en movimiento")}}
  else if(d.km){const a=d.km/4,b=(d.up||0)/400,h=Math.max(a,b)+Math.min(a,b)/2;x("≈ "+hm(h*3600),"Tiempo estimado andando, sin paradas",1)}
  return c.length?`<h3 style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 0">📊 Datos</h3><div class="dat">${c.join("")}</div>`:""}
function refresh(id){render();if(!sheet.hidden&&String(sheet._mt)===String(id)&&sheet.querySelector("[data-mtfol],[data-mtdat],.tdat,.tmas"))open(id,false,sheet._mv)}

function gpxDe(t){const x=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  return`<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Los de las Claras" xmlns="http://www.topografix.com/GPX/1/1">\n<metadata><name>${x(t.n)}</name></metadata>\n`+
    (t.w||[]).map(w=>`<wpt lat="${w.lat}" lon="${w.lon}">${w.a!=null?`<ele>${Math.round(w.a)}</ele>`:""}${w.t?`<time>${new Date(w.t).toISOString()}</time>`:""}<name>${x(w.n)}</name>${w.nota?`<desc>${x(w.nota)}</desc>`:""}<type>${x(MPI.ico(w.ic)[2])}</type></wpt>\n`).join("")+
    `<trk><name>${x(t.n)}</name><trkseg>\n`+
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
  if((k=id("[data-mtver]"))!=null){const t=T().find(x=>String(x.id)===k);if(t)soloVer(t);return}
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
  if((k=id("[data-mtdat]"))!=null){open(k,true,"datos");return}
  if((k=id("[data-mtmas]"))!=null){open(k,false,"mas");return}
  if((k=id("[data-mtdel]"))!=null){const b=e.target.closest("[data-mtdel]");if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="¿Seguro? Toca otra vez";return}
    borraFotos(k);MPI.saveTracks(T().filter(x=>String(x.id)!==k));sheet.hidden=true;toast("Quitado de Mis tracks");return}
  const wo=e.target.closest("[data-wpopen]");if(wo){punto(wo.dataset.t,wo.dataset.wpopen);return}
  const wg=e.target.closest(".wpp");if(wg&&sheet._mt!=null){punto(sheet._mt,wg.dataset.wp);return}
  const we=e.target.closest("[data-wpedit]");if(we){const t=T().find(x=>String(x.id)===we.dataset.t),w=t&&(t.w||[]).find(x=>x.id===we.dataset.wpedit);if(!w)return;
    const n=prompt("Nombre del punto",w.n);if(n==null)return;const nt=prompt("Nota (puede quedar vacía)",w.nota||"");
    cambiaW(t.id,y=>{const z=y.w.find(x=>x.id===w.id);z.n=(n.trim()||z.n).slice(0,80);if(nt!=null)z.nota=nt.trim().slice(0,1000)});punto(t.id,w.id);return}
  const wd=e.target.closest("[data-wpdel]");if(wd){if(wd.dataset.sure!=="1"){wd.dataset.sure="1";wd.textContent="¿Seguro? Toca otra vez";return}
    const id=wd.dataset.wpdel,tid=wd.dataset.t;cambiaW(tid,y=>{const z=y.w.find(x=>x.id===id);if(z&&z.fo&&MPI.fotoDel)MPI.fotoDel(id);y.w=y.w.filter(x=>x.id!==id)});toast("Punto quitado");open(tid,false);return}});
function borraFotos(k){const t=T().find(x=>String(x.id)===String(k));for(const w of (t&&t.w)||[])if(w.fo&&MPI.fotoDel)MPI.fotoDel(w.id)}

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
    toast(n&&n.est?(n.est==="hecho"?"Marcada como hecha":"Apuntada como pendiente")+" · está en Mis cosas › Guardado":"Marca quitada");
    document.querySelectorAll(`.rest[data-r="${r.id}"]`).forEach(x=>x.outerHTML=RESTBTN(r));
    document.querySelectorAll(`[data-mtsave="${r.id}"]`).forEach(x=>x.textContent=savedOf(r)?"★ En mis tracks":"☆ Guardar en mis tracks")};
  if(window.cuentaOk&&!cuentaOk(go,"tracks"))return;go()},true);
document.addEventListener("click",e=>{const b=e.target.closest("[data-mtsave]");if(!b)return;e.preventDefault();e.stopPropagation();
  const r=R[+b.dataset.mtsave];if(!r||!r.gx)return;if(window.cuentaOk&&!cuentaOk(()=>{const bb=document.querySelector(`[data-mtsave="${r.id}"]`);if(bb&&!savedOf(r))bb.click();else if(!savedOf(r)){MPI.saveTracks([...T(),{id:blogId(r),src:"blog",u:r.u,n:routeTitle(r),km:r.gx.km,up:r.gx.up,dn:r.gx.dn,f:new Date().toISOString()}]);toast("Guardado en Mis cosas › Guardado")}},"tracks"))return;const s=savedOf(r);
  if(s){MPI.saveTracks(T().filter(x=>x!==s));b.textContent="☆ Guardar en mis tracks";toast("Quitado de Mis tracks")}
  else{MPI.saveTracks([...T(),{id:blogId(r),src:"blog",u:r.u,n:routeTitle(r),km:r.gx.km,up:r.gx.up,dn:r.gx.dn,f:new Date().toISOString()}]);
    b.textContent="★ En mis tracks";toast("Guardado en Mis cosas › Guardado");if(window.OFFLINE&&OFFLINE.ofrecer)setTimeout(()=>OFFLINE.ofrecer(r),700)}},true);

document.head.insertAdjacentHTML("beforeend",`<style>.wplist{display:grid;gap:6px;margin:4px 0 10px}.wprow{display:flex;gap:10px;align-items:center;text-align:left;width:100%;padding:6px;border:1px solid var(--edge);border-radius:12px;background:var(--card);color:var(--ink);font:inherit;cursor:pointer}
.wpf,.wpe{flex:0 0 52px;width:52px;height:52px;border-radius:9px;overflow:hidden;display:grid;place-items:center;background:var(--paper,#f4f6f2);font-size:24px}.wpf img{width:100%;height:100%;object-fit:cover;display:block}
.wpt{display:flex;flex-direction:column;min-width:0}.wpt b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wpt small{color:var(--muted);font-weight:700}</style>`);
window.MISTRACKS={render,open,refresh,punto,route:id=>{const t=T().find(x=>String(x.id)===String(id));return t&&t.pts?comoRuta(t):null}};
render();

/* 9 nov 2026: todo lo guardado en Mis cosas lleva su recorrido dentro, también las rutas del blog (antes solo una referencia
   a la ruta: si la app se actualizaba por detrás y se abría sin cobertura, salían sin línea). Las ya guardadas se completan solas. */
function completar(){if(!window.loadTracks||!T().some(t=>t.src==="blog"&&!(t.pts&&t.pts.length)))return;
  loadTracks().then(ok=>{if(!ok)return;let ch=false;
    const ts=T().map(t=>{if(t.src!=="blog"||(t.pts&&t.pts.length))return t;const r=R.find(x=>x.u===t.u),ln=r&&r.gx&&r.gx.ln;if(!ln||ln.length<2)return t;ch=true;return{...t,pts:ln.map(q=>q.slice())}});
    if(ch)MPI.saveTracks(ts)})}
{const o=MPI.saveTracks;MPI.saveTracks=function(){const x=o.apply(this,arguments);setTimeout(completar,300);return x}}
setTimeout(completar,4000);addEventListener("online",()=>setTimeout(completar,2000));
})();
