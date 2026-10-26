/* ---------- mis puntos: guardar dónde estoy, marcar en el mapa, exportar e importar ---------- */
(function(){
const MPK="ldc-mispuntos", MTK="ldc-mistracks";
const ICOS=[["otro","📍","Punto"],["fuente","💧","Fuente"],["parking","🅿️","Aparcamiento"],["refugio","🏠","Refugio"],["cabana","🛖","Cabaña"],["cumbre","⛰️","Cumbre"],["collado","🥾","Collado / paso"],["vista","👀","Mirador"],["foto","📷","Foto"],["peligro","⚠️","Peligro"],["agua","🏊","Baño / poza"]];
const ICO=k=>(ICOS.find(x=>x[0]===k)||ICOS[0]);
const EMO=k=>k==="cumbre"?'<svg viewBox="-12 -12 24 24" style="width:1.15em;height:1.15em;vertical-align:-.2em"><use href="#ic-cumbre" x="-12" y="-12" width="24" height="24"/></svg>':ICO(k)[1];
let MP=store.get(MPK,[]), MT=store.get(MTK,[]);
if(LAY.mp===undefined)LAY.mp=true; if(LAY.mt===undefined)LAY.mt=true;
const saveMP=()=>{store.set(MPK,MP);if(window.ldcSync)ldcSync("puntos")}, saveMT=()=>{try{localStorage.setItem(MTK,JSON.stringify(MT));if(window.ldcSync)ldcSync("tracks");return true}catch(e){toast("No queda sitio en el móvil para más tracks");return false}};
const nid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fmtF=f=>{try{return new Date(f).toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"})}catch(e){return""}};
const c5=x=>Math.round(x*1e5)/1e5;
function alti(p){if(!navigator.onLine)return;fetch(`https://api.open-meteo.com/v1/elevation?latitude=${p.lat}&longitude=${p.lon}`).then(r=>r.json()).then(j=>{const a=j&&j.elevation&&j.elevation[0];if(a==null||!isFinite(a))return;const q=MP.find(x=>x.id===p.id);if(!q)return;q.a=Math.round(a);saveMP();drawMP();renderBox();if(MPSEL===q.id&&!sheet.hidden&&!sheet._mp)openMP(q.id)}).catch(()=>{})}

document.head.insertAdjacentHTML("beforeend",`<style>
.mpk{width:0;height:0}
.mpk span{position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:calc(var(--ms,24px)*1.15);height:calc(var(--ms,24px)*1.15);min-width:22px;min-height:22px;border-radius:50%;background:#fff;border:2.5px solid #7b2cbf;display:flex;align-items:center;justify-content:center;font-size:calc(var(--ms,24px)*.62);line-height:1;box-shadow:0 1px 3px rgba(0,0,0,.35);cursor:pointer}
.mpk.sel span{outline:3px solid #222;outline-offset:1px}
.mpcross{position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;pointer-events:none;z-index:650}
.mpcross:before,.mpcross:after{content:"";position:absolute;background:#7b2cbf;box-shadow:0 0 0 1.5px #fff}
.mpcross:before{left:21px;top:0;width:3px;height:44px}.mpcross:after{top:21px;left:0;height:3px;width:44px}
.mpbar{position:absolute;left:50%;transform:translateX(-50%);top:60px;width:max-content;z-index:700;background:var(--card);border:1px solid var(--edge);border-radius:14px;box-shadow:0 4px 16px rgba(0,0,0,.25);padding:10px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:calc(100% - 24px);font-size:14px}
.mpb{border:1px solid var(--edge);background:var(--card);color:var(--ink);border-radius:10px;padding:9px 12px;font-weight:600;font-size:14.5px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;text-decoration:none}
.mprow .rbs{margin-left:auto;display:flex;gap:6px;flex:none}
.rb{width:36px;height:36px;border:1px solid var(--edge);background:var(--card);color:var(--ink);border-radius:10px;display:grid;place-items:center;cursor:pointer;padding:0;font-size:18px;font-weight:700}
.rb.dan{color:#b3261e;border-color:#e3b4b0}.rb.sure{width:auto;padding:0 8px;font-size:13px;background:#b3261e;color:#fff;border-color:#b3261e}
.trs{width:1.05em;height:1.05em;vertical-align:-.17em;flex:none}
.mpb.pri{background:#7b2cbf;border-color:#7b2cbf;color:#fff}.mpb.dan{color:#b3261e;border-color:#e3b4b0}
.mpform label{display:block;font-weight:700;font-size:13.5px;margin:12px 0 5px}
.mpform input[type=text],.mpform textarea{width:100%;box-sizing:border-box;border:1px solid var(--edge);border-radius:10px;padding:10px;font:inherit;font-size:16px;background:var(--card);color:var(--ink)}
.mpicos{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:6px}
.mpicos button{border:1px solid var(--edge);background:var(--card);border-radius:10px;padding:7px 4px;font-size:12px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;color:var(--ink)}
.mpicos button span{font-size:22px}.mpicos button[aria-pressed=true]{border:2px solid #7b2cbf;background:#f3eafc}
.mpacts{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.mpbox{border:1px solid var(--edge);border-radius:14px;padding:12px 14px;margin:0 0 14px;background:var(--card)}
.mpbox h2{font-size:17px;margin:0 0 6px;display:flex;align-items:center;gap:8px}
.mprow{display:flex;align-items:center;gap:10px;padding:9px 2px;border-top:1px solid var(--edge);cursor:pointer}
.mprow .e{font-size:22px;width:30px;text-align:center}.mprow b{display:block}.mprow small{color:#666}
.mprow .del{margin-left:auto}
.laypanel .lay[hidden]{display:none}
#map:not(.lbl-mp) .leaflet-tooltip.mpl{display:none}
#map .leaflet-tooltip.lbl.mpl{color:#5a189a;font-weight:800}
.bkn{font-size:13.5px;margin:6px 0 0;color:#8a4b00}.bkn.ok{color:var(--muted)}
.lay .lico.mp{background:#fff;border:2px solid #7b2cbf;font-size:11px}
</style>`);

/* capa del mapa (los nombres salen a partir del zoom 12) */
const lblMP=()=>document.getElementById("map").classList.toggle("lbl-mp",map.getZoom()>=12);map.on("zoomend",lblMP);setTimeout(lblMP,0);
const MPL=L.layerGroup(), MTL=L.layerGroup();
let MPSEL=null;
function drawMP(){MPL.clearLayers();
  for(const p of MP){const m=L.marker([p.lat,p.lon],{icon:L.divIcon({className:"mpk",html:`<span>${EMO(p.ic)}</span>`,iconSize:[0,0]}),title:p.n,zIndexOffset:900,riseOnHover:true});
    m.on("click",e=>{L.DomEvent.stopPropagation(e);openMP(p.id)});
    m.bindTooltip(esc(p.n)+(p.a?` <span class="la">${p.a.toLocaleString("es-ES")} m</span>`:""),{permanent:true,direction:"right",offset:[12,0],className:"lbl mpl",interactive:false});
    m.on("add",()=>{const el=m.getElement();if(el)el.classList.toggle("sel",MPSEL===p.id)});
    MPL.addLayer(m)}
  syncMP()}
// los tracks del blog guardados no copian los puntos: se cogen de la ruta
const ptsOf=t=>t.pts&&t.pts.length?t.pts:(t.src==="blog"?(((R.find(r=>r.u===t.u)||{}).gx)||{}).ln||null:null);
let MTLOAD=false,MTTRY=false;
function drawMT(){MTL.clearLayers();let falta=false;
  for(const t of MT){const p=ptsOf(t);if(!p){falta=true;continue}const ll=p.map(x=>[x[0],x[1]]);
    MTL.addLayer(L.polyline(ll,{color:"#fff",weight:6,opacity:.8,interactive:false}));
    MTL.addLayer(L.polyline(ll,{color:"#e8711a",weight:3.5,opacity:.95}).bindTooltip(esc(t.n),{sticky:true}).on("click",e=>{L.DomEvent.stopPropagation(e);if(window.MISTRACKS)MISTRACKS.open(t.id)}))}
  if(falta&&!MTLOAD&&!MTTRY&&window.loadTracks){MTLOAD=true;MTTRY=true;loadTracks().then(ok=>{MTLOAD=false;if(ok)drawMT();else MTTRY=false})}   // solo un intento: si aun así falta alguno, no se repite en bucle
  syncMP()}
function syncMP(){const a=LAY.mp&&MP.length&&!window.FOLONLY,b=LAY.mt&&MT.length&&!window.FOLONLY;
  if(a&&!map.hasLayer(MPL))MPL.addTo(map);else if(!a&&map.hasLayer(MPL))MPL.remove();
  if(b&&!map.hasLayer(MTL))MTL.addTo(map);else if(!b&&map.hasLayer(MTL))MTL.remove();
  const bm=document.querySelector('[data-lay="mt"]');if(bm)bm.hidden=!MT.length}

/* ficha y formulario en el panel */
function show(html){sheet.classList.remove("full");sheet.innerHTML=`<div class="grab"></div>`+html;sheet.hidden=false;sheet.scrollTop=0}
function openMP(id){const p=MP.find(x=>x.id===id);if(!p)return;MPSEL=id;sheet._mp=null;drawMP();if(p.a==null)alti(p);
  const ll=`${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;
  show(`<div class="sheet-head"><h2>${EMO(p.ic)} ${esc(p.n)}</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
  <div class="meta"><span class="tag">Mi punto · ${esc(ICO(p.ic)[2])}</span>${p.a!=null?`<span class="tag alt">${p.a.toLocaleString("es-ES")} m</span>`:""}${p.f?`<span class="tag">${fmtF(p.f)}</span>`:""}</div>
  ${p.nota?`<p class="desc" style="white-space:pre-wrap">${esc(p.nota)}</p>`:""}
  <p class="note">${ll}${p.acc?` · precisión ±${Math.round(p.acc)} m`:""}</p>
  <div class="mpacts"><a class="mpb pri" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}">🚗 Cómo llegar</a>
  <button class="mpb" data-mpshare="${p.id}">📤 Compartir</button><button class="mpb" data-mpedit="${p.id}">✏️ Editar</button>
  <button class="mpb" data-mpnear="${p.id}">🔎 Rutas cerca</button><button class="mpb dan" data-mpdel="${p.id}"><svg class="trs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg> Borrar</button></div>`)}
function form(p,isNew){const ic=p.ic||"otro";
  show(`<div class="sheet-head"><h2>${isNew?"Nuevo punto":"Editar punto"}</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
  <div class="mpform"><p class="note">${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}${p.acc?` · precisión ±${Math.round(p.acc)} m`:""}</p>
  <label for="mpn">Nombre</label><input type="text" id="mpn" maxlength="80" value="${esc(p.n||"")}" placeholder="Por ejemplo: Fuente de la braña">
  <label>Icono</label><div class="mpicos">${ICOS.map(x=>`<button type="button" data-mpic="${x[0]}" aria-pressed="${x[0]===ic}"><span>${EMO(x[0])}</span>${x[2]}</button>`).join("")}</div>
  <label for="mpt">Nota (opcional)</label><textarea id="mpt" rows="3" maxlength="1000" placeholder="Agua todo el año, sitio para aparcar 5 coches…">${esc(p.nota||"")}</textarea>
  <div class="mpacts"><button class="mpb pri" data-mpsave>💾 Guardar</button>${isNew?"":`<button class="mpb" data-mpmove="${p.id}">✥ Mover de sitio</button>`}<button class="mpb" data-close>Cancelar</button></div></div>`);
  sheet._mp={...p,ic,isNew};setTimeout(()=>{const i=document.getElementById("mpn");if(i&&isNew)i.focus()},50)}
function newAt(lat,lon,acc){if(window.cuentaOk&&!cuentaOk(()=>newAt(lat,lon,acc),"puntos"))return;form({lat:c5(lat),lon:c5(lon),acc,n:"",ic:"otro"},true)}

sheet.addEventListener("click",e=>{
  const ic=e.target.closest("[data-mpic]");if(ic){sheet.querySelectorAll("[data-mpic]").forEach(b=>b.setAttribute("aria-pressed",b===ic));if(sheet._mp)sheet._mp.ic=ic.dataset.mpic;return}
  if(e.target.closest("[data-mpsave]")){const d=sheet._mp;if(!d)return;const n=(document.getElementById("mpn").value||"").trim()||ICO(d.ic)[2];const nota=(document.getElementById("mpt").value||"").trim();
    if(d.isNew){const p={id:nid(),n,ic:d.ic,nota,lat:d.lat,lon:d.lon,f:new Date().toISOString()};if(d.acc)p.acc=Math.round(d.acc);MP.push(p);saveMP();toast("Punto guardado");alti(p);if(!LAY.mp){LAY.mp=true;saveLay();const b=document.querySelector('[data-lay="mp"]');if(b)b.setAttribute("aria-pressed",true)}drawMP();renderBox();openMP(p.id)}
    else{const p=MP.find(x=>x.id===d.id);if(p){p.n=n;p.ic=d.ic;p.nota=nota;saveMP();drawMP();renderBox();openMP(p.id)}}
    return}
  const mv=e.target.closest("[data-mpmove]");if(mv){const p=MP.find(x=>x.id===mv.dataset.mpmove);if(p){map.setView([p.lat,p.lon],Math.max(map.getZoom(),16),{animate:false});cross(p.id)}return}
  const ed=e.target.closest("[data-mpedit]");if(ed){const p=MP.find(x=>x.id===ed.dataset.mpedit);if(p)form(p,false);return}
  const dl=e.target.closest("[data-mpdel]");if(dl){if(dl.dataset.sure!=="1"){dl.dataset.sure="1";dl.textContent="¿Seguro? Toca otra vez";return}
    MP=MP.filter(x=>x.id!==dl.dataset.mpdel);saveMP();MPSEL=null;drawMP();renderBox();sheet.hidden=true;toast("Punto borrado");return}
  const sh=e.target.closest("[data-mpshare]");if(sh){const p=MP.find(x=>x.id===sh.dataset.mpshare);if(p)shareMP(p);return}
  const nr=e.target.closest("[data-mpnear]");if(nr){const p=MP.find(x=>x.id===nr.dataset.mpnear);if(p&&window.nearAt)nearAt(p.lat,p.lon,p.n);return}
  if(e.target.closest("[data-close]")){MPSEL=null;drawMP()}
});
function shareMP(p){const url=`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`,txt=`${p.n}${p.nota?" – "+p.nota:""}\n${url}`;
  if(navigator.share)navigator.share({title:p.n,text:txt}).catch(()=>{});
  else window.open("https://wa.me/?text="+encodeURIComponent(txt),"_blank")}

/* marcar: dónde estoy, punto de mira, pulsación larga */
function gps(){if(window.cuentaOk&&!cuentaOk(gps,"puntos"))return;if(!navigator.geolocation){toast("Este aparato no da la ubicación");return}toast("Buscando dónde estás…");
  navigator.geolocation.getCurrentPosition(pos=>{const{latitude:la,longitude:lo,accuracy:ac}=pos.coords;if(window.showMe)showMe(la,lo);map.flyTo([la,lo],Math.max(map.getZoom(),15));newAt(la,lo,ac)},
    ()=>toast("No he podido saber dónde estás. Revisa el permiso de ubicación."),{enableHighAccuracy:true,timeout:15000,maximumAge:0})}
let crossOn=false;
function cross(moveId){if(!moveId&&window.cuentaOk&&!cuentaOk(()=>cross(),"puntos"))return;if(typeof showView==="function")showView("mapa");if(crossOn)return;crossOn=true;closeLegend();sheet.hidden=true;
  const v=document.getElementById("map"),c=document.createElement("div");c.className="mpcross";c.id="mpcross";v.appendChild(c);
  const b=document.createElement("div");b.className="mpbar";b.id="mpbar";b.innerHTML=`<span>${moveId?"Mueve el mapa hasta poner la cruz en el sitio correcto":"Mueve el mapa hasta poner la cruz encima del sitio"}</span><button class="mpb pri" data-mpok>${moveId?"Dejarlo aquí":"Guardar aquí"}</button><button class="mpb" data-mpcancel>Cancelar</button>`;v.appendChild(b);
  L.DomEvent.disableClickPropagation(b);
  b.addEventListener("click",e=>{if(e.target.closest("[data-mpok]")){const ce=map.getCenter();endCross();
    if(moveId){const p=MP.find(x=>x.id===moveId);if(p){p.lat=c5(ce.lat);p.lon=c5(ce.lng);delete p.acc;delete p.a;saveMP();drawMP();renderBox();openMP(p.id);toast("Punto movido")}}else newAt(ce.lat,ce.lng)}else if(e.target.closest("[data-mpcancel]"))endCross()})}
function endCross(){crossOn=false;["mpcross","mpbar"].forEach(i=>{const el=document.getElementById(i);if(el)el.remove()})}
function closeLegend(){const lg=document.querySelector(".legend.open");if(lg){lg.classList.remove("open");const t=lg.querySelector(".laytog");if(t)t.setAttribute("aria-expanded",false)}}
map.on("contextmenu",e=>{if(crossOn)return;closeLegend();newAt(e.latlng.lat,e.latlng.lng)});

/* capas: botones propios */
const lp=document.querySelector(".laypanel");
if(lp){const solo=lp.querySelector('[data-lay="solo"]');
  const add=`<button class="lay" data-lay="mp" aria-pressed="${LAY.mp}"><span class="lico mp">📍</span>Mis puntos</button><button class="lay" data-lay="mt" aria-pressed="${LAY.mt}" ${MT.length?"":"hidden"}><span class="lico" style="background:#e8711a"></span>Mis tracks</button>`;
  if(solo)solo.insertAdjacentHTML("beforebegin",add);
  lp.insertAdjacentHTML("beforeend",`<p class="laygh">Añadir</p><button class="lay" data-mpact="gps"><span class="lico">🎯</span>Guardar dónde estoy</button><button class="lay" data-mpact="cross"><span class="lico">✛</span>Marcar en el mapa</button><p class="note" style="font-size:12px;margin:2px 10px 4px;max-width:220px">También puedes mantener pulsado (o clic derecho) en cualquier sitio del mapa.</p>`)}
document.querySelector(".legend").addEventListener("click",e=>{const a=e.target.closest("[data-mpact]");if(a){closeLegend();if(a.dataset.mpact==="gps")gps();else cross();return}
  const b=e.target.closest('[data-lay="mp"],[data-lay="mt"]');if(b)syncMP()});

/* pestaña Lugares: lista, exportar e importar */
const box=document.createElement("div");box.className="mpbox";box.id="mpbox";
const anchor=document.getElementById("colh-lugares");anchor.parentNode.insertBefore(box,anchor);
const fin=document.createElement("input");fin.type="file";/* sin «accept»: en Android los .gpx suelen salir grises si se filtra por tipo */fin.hidden=true;document.body.appendChild(fin);
function renderBox(){const ps=MP.slice().sort((a,b)=>(b.f||"").localeCompare(a.f||""));
  box.innerHTML=`<h2>📍 Mis puntos <small style="font-weight:500;color:#666">(${MP.length})</small></h2>
  ${MP.length?"":`<p class="note">Guarda fuentes, aparcamientos, refugios o cualquier sitio. En el mapa: <b>Capas › Guardar dónde estoy</b> o <b>Marcar en el mapa</b>, o mantén pulsado sobre el mapa.</p>`}
  <div class="mpacts" style="margin:6px 0 8px"><button class="mpb" data-mpx="gps">🎯 Dónde estoy</button><button class="mpb" data-mpx="cross">✛ En el mapa</button>
  ${MP.length?`<button class="mpb" data-mpx="gpx">⬇️ GPX</button><button class="mpb" data-mpx="kml">⬇️ KML</button>`:""}<button class="mpb" data-mpx="imp">⬆️ Importar puntos (GPX/KML)</button></div>
  ${ps.map(p=>`<div class="mprow" data-mpgo="${p.id}"><span class="e">${EMO(p.ic)}</span><span><b>${esc(p.n)}</b><small>${esc(ICO(p.ic)[2])}${p.a!=null?" · "+p.a.toLocaleString("es-ES")+" m":""}${p.f?" · "+fmtF(p.f):""}</small></span><span class="rbs"><button class="rb" data-mpred="${p.id}" aria-label="Editar"><svg class="trs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg></button><button class="rb dan" data-mprdel="${p.id}" aria-label="Borrar"><svg class="trs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button></span></div>`).join("")}
`;if(window.MISTRACKS)MISTRACKS.render()}
box.addEventListener("click",e=>{
  const re=e.target.closest("[data-mpred]");if(re){const p=MP.find(x=>x.id===re.dataset.mpred);if(p){showView("mapa");map.setView([p.lat,p.lon],Math.max(map.getZoom(),15),{animate:false});MPSEL=p.id;drawMP();form(p,false)}return}
  const rd=e.target.closest("[data-mprdel]");if(rd){if(rd.dataset.sure!=="1"){rd.dataset.sure="1";rd.classList.add("sure");rd.innerHTML="¿Seguro?";setTimeout(()=>{if(rd.isConnected){rd.dataset.sure="";rd.classList.remove("sure");rd.innerHTML='<svg class="trs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>'}},4000);return}
    MP=MP.filter(x=>x.id!==rd.dataset.mprdel);saveMP();drawMP();renderBox();toast("Punto borrado");return}
  const x=e.target.closest("[data-mpx]");
  if(x){const k=x.dataset.mpx;if(k==="gps"){showView("mapa");gps()}else if(k==="cross")cross();else if(k==="gpx")dl("mis-puntos.gpx",toGPX(),"application/gpx+xml");else if(k==="kml")dl("mis-puntos.kml",toKML(),"application/vnd.google-earth.kml+xml");else if(k==="imp"){if(window.cuentaOk&&!cuentaOk(()=>toast("Ya has entrado. Pulsa otra vez «Importar» para elegir el archivo"),"puntos"))return;fin.value="";fin.click()}return}
  const g=e.target.closest("[data-mpgo]");if(g){const p=MP.find(x=>x.id===g.dataset.mpgo);if(!p)return;showView("mapa");if(!LAY.mp){LAY.mp=true;saveLay();syncMP()}map.flyTo([p.lat,p.lon],Math.max(map.getZoom(),15));openMP(p.id);return}
});
const xe=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
function toGPX(){return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Los de las Claras" xmlns="http://www.topografix.com/GPX/1/1">\n`+
  MP.map(p=>`<wpt lat="${p.lat}" lon="${p.lon}"><name>${xe(p.n)}</name>${p.nota?`<desc>${xe(p.nota)}</desc>`:""}<type>${xe(ICO(p.ic)[2])}</type>${p.f?`<time>${p.f}</time>`:""}</wpt>`).join("\n")+`\n</gpx>\n`}
function toKML(){return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Mis puntos · Los de las Claras</name>\n`+
  MP.map(p=>`<Placemark><name>${xe(p.n)}</name><description>${xe((ICO(p.ic)[2])+(p.nota?" – "+p.nota:""))}</description><Point><coordinates>${p.lon},${p.lat},0</coordinates></Point></Placemark>`).join("\n")+`\n</Document></kml>\n`}
function dl(name,txt,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([txt],{type}));a.download=name;document.body.appendChild(a);a.click();if(/\.(gpx|kml)$/i.test(name))toast("Descargado «"+name+"» en la carpeta Descargas del móvil");setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},60000)}
function dist(a,b){const R=6371000,t=Math.PI/180,dl=(b[0]-a[0])*t,dn=(b[1]-a[1])*t,x=Math.sin(dl/2)**2+Math.cos(a[0]*t)*Math.cos(b[0]*t)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function thin(pts){if(pts.length<3)return pts;const out=[pts[0]];let acc=0;for(let i=1;i<pts.length;i++){acc+=dist(pts[i-1],pts[i]);if(acc>=15||i===pts.length-1){out.push(pts[i]);acc=0}}return out.map(p=>p[2]!=null&&isFinite(p[2])?[c5(p[0]),c5(p[1]),Math.round(p[2])]:[c5(p[0]),c5(p[1])])}
fin.addEventListener("change",()=>{const f=fin.files&&fin.files[0];if(!f)return;if(/\.kmz$/i.test(f.name)){toast("Los .kmz no los leo: expórtalo como .kml");return}
  const rd=new FileReader();rd.onload=()=>{try{imp(String(rd.result),f.name)}catch(e){toast("No he podido leer ese archivo")}};rd.readAsText(f)});
function imp(txt,fname,prev){const doc=new DOMParser().parseFromString(txt,"application/xml");if(doc.getElementsByTagName("parsererror").length)throw 0;
  const tx=(el,tag)=>{const n=el.getElementsByTagName(tag)[0];return n?n.textContent.trim():""};
  const base=fname.replace(/\.[^.]+$/,"");let np=0,nt=0;const have=new Set(MP.map(p=>p.lat.toFixed(4)+","+p.lon.toFixed(4)+"|"+p.n));
  const addP=(lat,lon,n,nota)=>{if(!isFinite(lat)||!isFinite(lon))return;const k=lat.toFixed(4)+","+lon.toFixed(4)+"|"+n;if(have.has(k))return;have.add(k);MP.push({id:nid(),n:n||"Punto importado",ic:"otro",nota:nota||"",lat:c5(lat),lon:c5(lon),f:new Date().toISOString()});np++};
  const addT=(pts,n)=>{if(pts.length<2)return;const t=thin(pts);let km=0;for(let i=1;i<t.length;i++)km+=dist(t[i-1],t[i]);const o={id:nid(),n:n||base,km:Math.round(km/100)/10,pts:t,src:"gpx",f:new Date().toISOString()};desn(o);MT.push(o);nuevos.push(o);nt++};const nuevos=[];
  if(doc.getElementsByTagName("gpx").length){
    for(const w of doc.getElementsByTagName("wpt"))addP(+w.getAttribute("lat"),+w.getAttribute("lon"),tx(w,"name"),tx(w,"desc")||tx(w,"cmt"));
    for(const t of doc.getElementsByTagName("trk")){const pts=[...t.getElementsByTagName("trkpt")].map(p=>{const e=tx(p,"ele");return e!==""?[+p.getAttribute("lat"),+p.getAttribute("lon"),+e]:[+p.getAttribute("lat"),+p.getAttribute("lon")]});addT(pts,tx(t,"name"))}
    for(const r of doc.getElementsByTagName("rte")){const pts=[...r.getElementsByTagName("rtept")].map(p=>[+p.getAttribute("lat"),+p.getAttribute("lon")]);addT(pts,tx(r,"name"))}}
  else{for(const pm of doc.getElementsByTagName("Placemark")){const n=tx(pm,"name"),d=tx(pm,"description").replace(/<[^>]+>/g," ").trim();
      for(const pt of pm.getElementsByTagName("Point")){const c=tx(pt,"coordinates").split(",");addP(+c[1],+c[0],n,d)}
      for(const ls of pm.getElementsByTagName("LineString")){const pts=tx(ls,"coordinates").split(/\s+/).filter(Boolean).map(s=>{const c=s.split(",");return c[2]!=null&&+c[2]!==0?[+c[1],+c[0],+c[2]]:[+c[1],+c[0]]});addT(pts,n)}}}
  if(!np&&!nt){toast("No he encontrado puntos ni tracks en ese archivo");return}
  // archivo que llega desde «Compartir»: un solo track se enseña primero, con «Guardar en mis tracks»
  if(prev&&nt===1&&!np&&window.COMPARTIR&&COMPARTIR.preview){const t=nuevos[0];MT.splice(MT.indexOf(t),1);COMPARTIR.preview(t);return}
  if(window.cuentaOk&&store.get("ldc-sesion","0")!=="1"){nuevos.forEach(t=>{const i=MT.indexOf(t);if(i>=0)MT.splice(i,1)});MP=store.get(MPK,[]);cuentaOk(()=>imp(txt,fname),"tracks");return}
  saveMP();if(nt&&!saveMT()){MT=store.get(MTK,[])}
  LAY.mp=true;LAY.mt=true;saveLay();["mp","mt"].forEach(k=>{const b=document.querySelector(`[data-lay="${k}"]`);if(b)b.setAttribute("aria-pressed",true)});
  drawMP();drawMT();renderBox();toast([np?`${np} punto${np===1?"":"s"}`:"",nt?`${nt} track${nt===1?"":"s"}`:""].filter(Boolean).join(" y ")+(np+nt===1?" cargado":" cargados")+(nt?" · están en Mis cosas › Mis tracks":""));
  for(const o of nuevos)if(o.pts.some(p=>p[2]==null))demAlt(o.id);
  if(nt===1&&!np&&window.MISTRACKS)MISTRACKS.open(nuevos[0].id,true)}
// desnivel de un track (con margen de 4 m para que el ruido no sume)
function desn(o){const p=o.pts;if(!p.length||p.some(x=>x[2]==null)){delete o.up;delete o.dn;return}let U=0,D=0,ref=p[0][2],mx=-1e9,mn=1e9;
  for(const x of p){const d=x[2]-ref;if(d>=4){U+=d;ref=x[2]}else if(d<=-4){D-=d;ref=x[2]}if(x[2]>mx)mx=x[2];if(x[2]<mn)mn=x[2]}o.up=Math.round(U);o.dn=Math.round(D);o.mx=mx;o.mn=mn}
// si el GPX no trae alturas, se sacan del modelo de relieve (hace falta conexión)
async function demAlt(id){const o=MT.find(x=>x.id===id);if(!o||!navigator.onLine)return;const p=o.pts;
  const idx=[];const step=Math.max(1,Math.ceil(p.length/1000));for(let i=0;i<p.length;i+=step)idx.push(i);if(idx[idx.length-1]!==p.length-1)idx.push(p.length-1);
  const ele={};try{for(let k=0;k<idx.length;k+=100){const g=idx.slice(k,k+100);
    const j=await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${g.map(i=>p[i][0]).join(",")}&longitude=${g.map(i=>p[i][1]).join(",")}`).then(r=>r.json());
    g.forEach((i,n)=>{const v=j.elevation&&j.elevation[n];if(v!=null&&isFinite(v))ele[i]=v})}}catch(e){return}
  const known=idx.filter(i=>ele[i]!=null);if(known.length<2)return;
  const q=MT.find(x=>x.id===id);if(!q)return;let a=0;
  q.pts=q.pts.map((x,i)=>{while(a<known.length-2&&known[a+1]<i)a++;const i0=known[a],i1=known[a+1];const t=i1>i0?Math.min(1,Math.max(0,(i-i0)/(i1-i0))):0;return[x[0],x[1],Math.round(ele[i0]+(ele[i1]-ele[i0])*t)]});
  desn(q);saveMT();if(window.MISTRACKS)MISTRACKS.refresh(id)}


/* ---------- copia de seguridad en archivo: marcas, mis puntos y mis tracks ---------- */
const BKK="ldc-copia-fecha";
const hayDatos=()=>Object.keys(MARKS).length+MP.length+MT.length>0;
function bkpNote(){if(!hayDatos())return"";const f=store.get(BKK,null);const dias=f?(Date.now()-new Date(f))/864e5:1e9;
  return dias>30?`<p class="bkn">${f?"Hace más de un mes que no guardas copia":"Aún no has guardado ninguna copia"} de tus marcas y puntos. Si pierdes el móvil, se pierden. <button class="linkbtn" data-bkp>Guardar copia ahora</button></p>`:`<p class="bkn ok">Última copia: ${fmtF(f)}</p>`}
function bkpButtons(c){const k=c?"linkbtn":"mpb";return`<div class="sync"><button class="${k}" data-bkp>💾 Guardar copia</button><button class="${k}" data-rst>📂 Restaurar copia</button></div>${bkpNote()}`}
function refreshBkp(){renderBox();if(typeof renderCols==="function")renderCols()}
function bkpSave(){const d=new Date(),z=n=>String(n).padStart(2,"0");
  const o={app:"losdelasclaras",tipo:"copia",v:2,fecha:d.toISOString(),marcas:MARKS,puntos:MP,tracks:MT};
  const name=`copia-losdelasclaras-${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}.json`;
  const txt=JSON.stringify(o);const file=typeof File==="function"?new File([txt],name,{type:"application/json"}):null;
  const done=()=>{store.set(BKK,o.fecha);refreshBkp()};
  // en el móvil, mejor el menú de compartir (guardar en Drive, enviarse por WhatsApp o correo…); si no, descarga normal
  if(file&&matchMedia("(pointer:coarse)").matches&&navigator.canShare&&navigator.canShare({files:[file]})){
    navigator.share({files:[file],title:"Copia de Los de las Claras"}).then(()=>{done();toast("Copia guardada")},err=>{if(err&&err.name!=="AbortError"){dl(name,txt,"application/json");done();toast("Copia guardada en Descargas")}})}
  else{dl(name,txt,"application/json");done();toast("Copia guardada en Descargas")}}
const frs=document.createElement("input");frs.type="file";frs.accept=".json,application/json";frs.hidden=true;document.body.appendChild(frs);
frs.addEventListener("change",()=>{const f=frs.files[0];frs.value="";if(!f)return;f.text().then(t=>{let o=null;try{o=JSON.parse(t)}catch(e){}
  if(!o||o.app!=="losdelasclaras"){toast("Ese archivo no es una copia de esta app");return}
  // se suma a lo que ya hay: no se borra nada
  let nm=0,np=0,nt=0;const M=o.marcas||{};for(const k in M){if((M[k]==="hecha"||M[k]==="quiero")&&MARKS[k]!==M[k]&&MARKS[k]!=="hecha"){MARKS[k]=M[k];nm++}}
  if(nm)saveMarks();
  const same=(a,b)=>a.id===b.id||(a.n===b.n&&Math.abs(a.lat-b.lat)<1e-4&&Math.abs(a.lon-b.lon)<1e-4);
  for(const p of o.puntos||[]){if(p&&isFinite(p.lat)&&isFinite(p.lon)&&!MP.some(q=>same(p,q))){MP.push(p);np++}}if(np)saveMP();
  for(const tr of o.tracks||[]){if(tr&&tr.pts&&!MT.some(q=>q.id===tr.id)){MT.push(tr);nt++}}if(nt)saveMT();
  drawMP();drawMT();if(typeof refreshMarks==="function")refreshMarks();refreshBkp();
  toast(nm+np+nt?`Recuperado: ${nm} marca${nm===1?"":"s"}, ${np} punto${np===1?"":"s"}${nt?` y ${nt} track${nt===1?"":"s"}`:""}`:"Ya tenías todo lo de esa copia")})});
document.addEventListener("click",e=>{if(e.target.closest("[data-bkp]")){bkpSave();e.preventDefault()}else if(e.target.closest("[data-rst]")){frs.click();e.preventDefault()}});
window.ldcBkp=bkpButtons;if(typeof renderCols==="function")renderCols();
/* "ver solo los míos" también deja ver mis puntos (van en su propia capa) */
drawMP();drawMT();renderBox();
window.MISPUNTOS={get:()=>MP,tracks:()=>MT,show,sync:()=>syncMP(),ptsOf,desn,demAlt,dl,
  saveTracks(a){MT.length=0;MT.push(...a);saveMT();drawMT();if(window.MISTRACKS)MISTRACKS.render();const b=document.querySelector('[data-lay="mt"]');if(b)b.hidden=!MT.length},
  importText(txt,n,prev){try{imp(String(txt),n||"track.gpx",prev)}catch(e){toast("No he podido leer ese archivo (solo GPX o KML)")}},
  importar(){if(window.cuentaOk&&!cuentaOk(()=>toast("Ya has entrado. Pulsa otra vez «Cargar GPX/KML» para elegir el archivo"),"tracks"))return;fin.value="";fin.click()},
  // la sincronización cambia lo guardado sin volver a avisar a la nube
  set(mp,mt){if(mp){MP.length=0;MP.push(...mp);store.set(MPK,MP)}if(mt){MT.length=0;MT.push(...mt);try{localStorage.setItem(MTK,JSON.stringify(MT))}catch(e){}}
    drawMP();drawMT();renderBox();if(window.MISTRACKS)MISTRACKS.render();if(MPSEL&&!MP.some(p=>p.id===MPSEL)){MPSEL=null}}};
})();
