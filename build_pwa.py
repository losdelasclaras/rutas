import json,re,os,shutil
A='/home/claude/app/'; O='/home/claude/pwa/site/'
os.makedirs(O,exist_ok=True)
t=open(A+'template.html').read()
def rep(x,y,cnt=1):
    global t
    assert t.count(x)==cnt,(t.count(x),x[:80]); t=t.replace(x,y)
# cabecera: página completa con manifest y leaflet
rep('<title>Los de las Claras · Rutas</title>\n<meta name="claude:viewport-fit-sides" content="cover">','''<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Los de las Claras · Rutas</title>
<meta name="description" content="Rutas de montaña del blog Los de las Claras: Cordillera Cantábrica, Pirineos, Alpes y Dolomitas.">
<meta name="theme-color" content="#c3262e">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="LdC Rutas">
<link rel="stylesheet" href="vendor/leaflet.css">''')
rep('<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>','<script src="vendor/leaflet.js"></script>')
rep('</style>','''html,body{height:100%;margin:0}
#map{background:#e8e4da;isolation:isolate;z-index:0}
.sheet{z-index:20}.sheet.full{z-index:30}
#map path:focus,#map .leaflet-interactive:focus{outline:none}
#b-me{background:#1a73e8;border-color:#1a73e8;color:#fff}#b-me:hover{background:#1765cc}
#map .pt.mk-h::after,#map .pt.mk-q::after{position:absolute;left:calc(var(--ms,24px)*.28);top:calc(var(--ms,24px)*-.78);width:15px;height:15px;border-radius:50%;font-size:10px;line-height:15px;text-align:center;font-weight:900;color:#fff;border:1.5px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.4);pointer-events:none}
#map .pt.mk-h::after{content:"✓";background:#2e7d4f}#map .pt.mk-q::after{content:"★";background:#d9a400}
#map.solo-mios .pt:not(.mio){display:none}#map.solo-mios .leaflet-tooltip:not(.mio-t){}
.lico{display:inline-flex;width:18px;height:18px;border-radius:50%;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;background:#888}.lico.lh{background:#2e7d4f}.lico.lq{background:#d9a400}
#map .pt svg{position:absolute;width:var(--ms,24px);height:var(--ms,24px);transform:translate(-50%,-50%);cursor:pointer}
#map .pt use{filter:none}
#map .pt.cumbre svg{width:calc(var(--ms,24px)*1.12);height:calc(var(--ms,24px)*1.12)}
#map .pt.sel svg{outline:3px solid var(--ink);outline-offset:1px;border-radius:50%}
#map .pt.dim{opacity:.3;filter:grayscale(1);pointer-events:none}
#map.hide-peaks .pt.cumbre,#map.hide-spots .pt.spot:not(.ini){display:none}
#map .leaflet-tooltip.lbl{background:#fff;border:1px solid rgba(0,0,0,.18);border-radius:5px;box-shadow:0 1px 3px rgba(0,0,0,.3);padding:1px 6px;font-family:var(--f-body);font-weight:700;font-size:calc(13.5px*var(--fs));line-height:1.3;color:#a3141c;white-space:nowrap}
#map .leaflet-tooltip.lbl::before{display:none}
#map .leaflet-tooltip.lbl .la{color:#3a3a3a;font-weight:600;font-family:var(--f-num);font-size:.9em;margin-left:2px}
#map .leaflet-tooltip.lbl.sp,#map .leaflet-tooltip.lbl.ini{color:#000;font-weight:800;text-decoration:underline;text-decoration-color:#3d6b4f;text-decoration-thickness:2px;text-underline-offset:2px}
#map:not(.lbl-peaks) .leaflet-tooltip.pk,#map:not(.lbl-spots) .leaflet-tooltip.sp,#map:not(.lbl-spots) .leaflet-tooltip.ini,#map.hide-peaks .leaflet-tooltip.pk,#map.hide-spots .leaflet-tooltip.sp{display:none}
#map .probe{fill:var(--mark);fill-opacity:.05;stroke:var(--mark);stroke-dasharray:6 4;stroke-width:2}
.leaflet-control-attribution{font-size:10px}
.instbtn{border:1px solid var(--edge);background:var(--mark);color:#fff;border-radius:8px;padding:5px 10px;font-weight:700;font-size:14px;cursor:pointer;flex:none}
@media (min-width:860px){#v-mapa:has(.sheet:not([hidden])) .fabs{right:412px}}
.sync{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 0}
</style>
</head><body>''')
# cada módulo va protegido: si uno falla en un móvil concreto, los demás y la app siguen funcionando
_mods=['mispuntos','capas','sync','seguir','mistracks','offline','resumen','pestanas','instalar','compartir','perfil','tiempo']
_w=lambda n:'try{\n'+open(f'/home/claude/pwa/{n}.js').read()+'\n}catch(e){console.error("módulo '+n+'",e);(window.__ERRS=window.__ERRS||[]).push("'+n+': "+(e&&e.message))}'
i=t.rindex('</script>'); t=t[:i]+'\n'+'\n'.join(_w(n) for n in _mods)+'\n'+t[i:]
i=t.rindex('</script>'); t=t[:i]+'</script>\n<script>if("serviceWorker" in navigator){const had=!!navigator.serviceWorker.controller;let rl=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(had&&!rl){rl=true;location.reload()}});addEventListener("load",()=>navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(reg=>{reg.update();document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")reg.update()})}).catch(()=>{}))}</script>\n</body></html>\n'
# leyenda: sin relieve ni pueblos (ya vienen en el mapa topográfico)
t=re.sub(r'\s*<button class="lay" data-lay="relief".*?</button>','',t,count=1,flags=re.S)
t=re.sub(r'\s*<button class="lay" data-lay="towns".*?</button>','',t,count=1,flags=re.S)
t=t.replace('<div class="legend"','<div class="legend"',1)
_i=t.index('<div class="legend"');_j=t.index('</div>',_i)
_i=t.index('<div class="legend"');_j=t.index('</div>',_i);_lg=t[_i:_j];_pk=_lg[_lg.index('<button class="lay" data-lay="peaks"'):];_tg=_lg[_lg.index('<button class="laytog"'):_lg.index('</button>',_lg.index('<button class="laytog"'))+9]
t=t[:_i]+'<div class="legend" role="group" aria-label="Capas del mapa">'+_tg+'<div class="laypanel"><p class="laygh">Mapa</p><button class="lay" data-base="topo" aria-pressed="true"><svg class="ico" viewBox="-5 -5 10 10"><rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="#cfe0b8" stroke="#6b8a4a" stroke-width=".8"/></svg>Topográfico</button><button class="lay" data-base="ign" aria-pressed="false"><svg class="ico" viewBox="-5 -5 10 10"><rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="#e8d9a8" stroke="#8a6d2b" stroke-width=".8"/></svg>IGN</button><button class="lay" data-base="orto" aria-pressed="false"><svg class="ico" viewBox="-5 -5 10 10"><rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="#5f7a4a" stroke="#2f4224" stroke-width=".8"/></svg>Ortofoto (IGN)</button><button class="lay" data-base="none" aria-pressed="false"><svg class="ico" viewBox="-5 -5 10 10"><rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="#f1f1ec" stroke="#999" stroke-width=".8"/></svg>Sin mapa</button><p class="laygh">Ver</p>'+_pk+'<button class="lay" data-lay="tracks" aria-pressed="false"><svg class="ico" viewBox="-5 -5 10 10"><path d="M-4 3C-2 -3 0 3 1 -1S3 -3 4 -4" fill="none" stroke="#6a2bd1" stroke-width="1.6" stroke-linecap="round"/></svg>Tracks</button><p class="laygh">Mis lugares</p><button class="lay" data-lay="mh" aria-pressed="true"><span class="lico lh">✓</span>Visitados</button><button class="lay" data-lay="mq" aria-pressed="true"><span class="lico lq">★</span>Quiero ir</button><button class="lay" data-lay="solo" aria-pressed="false"><span class="lico">◎</span>Ver solo los míos</button></div>'+t[_j:]
rep('<div class="attrib">Relieve: Terrain Tiles (Mapzen/AWS) · Pueblos: © OpenStreetMap</div>','')
rep('<button class="btn primary" id="b-near" data-short="Cerca" title="Rutas cerca de…">','<button class="btn ghost" id="b-me" data-short="Yo" title="Dónde estoy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l7 19-7-4-7 4z"/></svg>Dónde estoy</button>\n        <button class="btn primary" id="b-near" data-short="Cerca" title="Rutas cerca de…">')
rep('<button class="fsbtn" id="fsbtn"','<button class="instbtn" id="instbtn" hidden>Instalar</button>\n    <button class="fsbtn" id="fsbtn"')
# bloque del mapa
a=t.index('/* ---------- map ---------- */'); b=t.index('/* ---------- sheet ---------- */')
t=t[:a]+open('/home/claude/pwa/map_leaflet.js').read()+'\n'+t[b:]
# círculo de 15 km
rep('const [x,y]=px(lon,lat); probe.attr("cx",x).attr("cy",y).attr("r",radAt(lat,lon)*1000/(156543.03*Math.cos(lat*Math.PI/180)/2048));','if(probeC)probeC.remove(); probeC=L.circle([lat,lon],{radius:radAt(lat,lon)*1000,className:"probe",interactive:false}).addTo(map);')
# leyenda
rep('''  base.attr("display",LAY.relief?null:"none");provfill.attr("display",LAY.relief?"none":null);sizeMarks()});''','''  sizeMarks()});''')
rep('#map svg{width:100%;height:100%;display:block}','')
# ubicación real
rep('''<p class="note" id="geomsg" style="margin-top:10px">¿Prefieres señalarlo tú? <button class="linkbtn" data-pickmap>Elegir un sitio en el mapa</button>. La búsqueda por tu ubicación llegará con la app instalable.</p>`;''','''<p class="note" id="geomsg" style="margin-top:10px"><button class="btn primary" data-geo style="margin-bottom:8px">Usar mi ubicación</button><br>¿Prefieres señalarlo tú? <button class="linkbtn" data-pickmap>Elegir un sitio en el mapa</button>.</p>`;''')
rep('''  const fail=()=>{if(msg)msg.textContent="Este navegador no deja usar tu ubicación en esta versión de prueba. En la app instalada sí funcionará. Mientras tanto, escribe tu pueblo o toca el mapa."};''','''  const fail=()=>{if(msg)msg.textContent="No he podido saber dónde estás. Revisa que el móvil tenga la ubicación activada y que hayas dado permiso a la app; mientras tanto, escribe tu pueblo o toca el mapa."};''')
rep('''navigator.geolocation.getCurrentPosition(p=>nearAt(p.coords.latitude,p.coords.longitude,"tu ubicación"),fail,{timeout:8000,maximumAge:600000})''','''navigator.geolocation.getCurrentPosition(p=>{showMe(p.coords.latitude,p.coords.longitude);nearAt(p.coords.latitude,p.coords.longitude,"tu ubicación")},fail,{enableHighAccuracy:true,timeout:12000,maximumAge:300000})''')
# el mapa necesita recalcular tamaño al volver a la pestaña
rep('''function showView(v){''','''function showView(v){if(v==="mapa")setTimeout(()=>map.invalidateSize(),0);''')
# panel de capas: que nunca se salga por arriba en pantallas bajas (se desplaza dentro)
rep('const o=lg.classList.toggle("open");tg.setAttribute("aria-expanded",o);return}','const o=lg.classList.toggle("open");tg.setAttribute("aria-expanded",o);if(o){const pn=lg.querySelector(".laypanel"),mr=document.getElementById("map").getBoundingClientRect();pn.style.maxHeight="none";let mh=Math.max(160,pn.getBoundingClientRect().bottom-mr.top-10);pn.style.maxHeight=mh+"px";const ov=mr.top+10-pn.getBoundingClientRect().top;if(ov>0)pn.style.maxHeight=Math.max(140,mh-ov)+"px"}return}')
t=t.replace('</style>','.laypanel{overflow-y:auto;overscroll-behavior:contain}\n</style>',1)
# init
rep('''drawZone(ZONES[store.get("ldc-zona","cant")]?store.get("ldc-zona","cant"):"cant"); applyFilter(); renderCols();''','''__mk("antes del filtro"); applyFilter(); __mk("filtro"); renderCols(); __mk("listas"); fitHome(false); sizeMarks(); __mk("mapa colocado");''')
# medidas de arranque (se ven con ?diag) y formateadores reutilizados (Firefox crea uno nuevo en cada llamada)
i=t.index('<script>\n'); t=t[:i]+'''<script>
const __M=[];const __mk=n=>__M.push([n,Math.round(performance.now())]);__mk("inicio del programa");
window.__ERRS=[];addEventListener("error",e=>{__ERRS.push((e.message||"error")+" @"+String(e.filename||"").split("/").pop()+":"+e.lineno)});addEventListener("unhandledrejection",e=>{__ERRS.push("promesa: "+(e.reason&&e.reason.message||e.reason))});
// ?reset: quita la app guardada (no tus datos ni los mapas descargados) y la vuelve a cargar limpia
if(/[?&]reset/.test(location.search)){try{window.stop()}catch(e){}document.documentElement.innerHTML="<body style='font:18px system-ui;padding:30px'>Limpiando la app guardada…";(async()=>{try{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())if(k!=="ldc-offline")await caches.delete(k)}catch(e){}location.replace(location.pathname+"?diag")})()}
// ?diag: si la app no termina de arrancar, el informe sale igual a los 8 s
if(/[?&]diag/.test(location.search))setTimeout(()=>{if(!document.getElementById("__diag")){const d=document.createElement("pre");d.id="__diag";d.style.cssText="position:fixed;z-index:999999;left:6px;top:6px;right:6px;max-height:90vh;overflow:auto;background:#fff;color:#000;border:2px solid #c00;padding:10px;font:12px/1.4 monospace;white-space:pre-wrap";
  let ls=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);ls.push(k+": "+(localStorage.getItem(k)||"").length)}}catch(e){ls.push("localStorage: "+e.message)}
  d.textContent="ARRANQUE (ms)\\n"+__M.map(x=>x[0]+": "+x[1]).join("\\n")+"\\n\\nERRORES\\n"+(__ERRS.join("\\n")||"ninguno")+"\\n\\nGUARDADO\\n"+ls.join("\\n")+"\\n\\nSW: "+(navigator.serviceWorker&&navigator.serviceWorker.controller?"sí":"no")+"\\n"+navigator.userAgent;
  (document.body||document.documentElement).appendChild(d)}},8000);
(function(){const C={},N={},lc=String.prototype.localeCompare;
String.prototype.localeCompare=function(b,loc,opt){if(opt)return lc.call(this,b,loc,opt);const k=loc||"";return (C[k]||(C[k]=new Intl.Collator(loc||undefined))).compare(String(this),String(b))};
Number.prototype.toLocaleString=function(loc,opt){const k=(loc||"")+"|"+JSON.stringify(opt||{});return (N[k]||(N[k]=new Intl.NumberFormat(loc||undefined,opt))).format(Number(this))}})();
</script>
'''+t[i:]
t=t.replace('</body>','''<script>
addEventListener("DOMContentLoaded",()=>__mk("página leída"));
function __extra(){const mk=document.querySelectorAll("#map .leaflet-marker-icon");const f=mk[0];let fi="ninguno";if(f){const cs=getComputedStyle(f),sv=f.querySelector("svg"),r=sv?sv.getBoundingClientRect():null,u=f.querySelector("use");fi="display "+cs.display+", opacidad "+cs.opacity+", visible "+cs.visibility+", svg "+(r?Math.round(r.width)+"x"+Math.round(r.height)+" en "+Math.round(r.left)+","+Math.round(r.top):"no")+", use "+(u?(u.getAttribute("href")+" existe "+!!document.getElementById((u.getAttribute("href")||"").slice(1))):"no")+", clases "+f.className}
 const tl=Object.entries(window.__TL||{}).map(([h,o])=>h+": "+o.ok+" bien, "+o.err+" con error").join("<br>")||"ninguna";
 let top="?";if(f){const sv=f.querySelector("svg"),r=sv.getBoundingClientRect();const el=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);top=el?(el.tagName+"."+(el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className)).slice(0,90):"nada"}
 const tp=document.querySelector(".leaflet-tile-pane"),mp=document.querySelector(".leaflet-marker-pane");const z=e=>e?getComputedStyle(e).zIndex+"/"+getComputedStyle(e).position:"-";
 const tiles=[...document.querySelectorAll(".leaflet-tile")];const tv=tiles.slice(0,1).map(t=>{const c=getComputedStyle(t);return t.src.split("/")[2]+" op "+c.opacity+" vis "+c.visibility+" disp "+c.display+" "+t.naturalWidth+"px"}).join("");
 const loadedOTM=tiles.filter(t=>/opentopomap/.test(t.src));const otmInfo=loadedOTM.length+" img, cargadas "+loadedOTM.filter(t=>t.complete&&t.naturalWidth).length+", clase capa "+(loadedOTM[0]?loadedOTM[0].parentNode.className+" op "+getComputedStyle(loadedOTM[0].parentNode).opacity:"-");
 const prueba='<div style="display:flex;gap:6px;align-items:center;margin:4px 0"><svg width="26" height="26" viewBox="-12 -12 24 24"><use href="#ic-cumbre" x="-12" y="-12" width="24" height="24"/></svg><svg width="26" height="26" viewBox="-12 -12 24 24"><use href="#ic-costa" x="-12" y="-12" width="24" height="24"/></svg><img width="48" height="48" crossorigin="anonymous" src="https://a.tile.opentopomap.org/9/247/187.png"><img width="48" height="48" src="https://b.tile.opentopomap.org/9/248/187.png"><img width="48" height="48" crossorigin="anonymous" src="https://www.ign.es/wmts/mapa-raster?service=WMTS&request=GetTile&version=1.0.0&Format=image/jpeg&layer=MTN&style=default&tilematrixset=GoogleMapsCompatible&TileMatrix=9&TileRow=187&TileCol=247"></div>';
 return "<br><b>Prueba (2 iconos, 2 mapa topo, 1 IGN)</b>"+prueba+"<b>Encima del primer punto</b>: "+top+"<br>capas z: teselas "+z(tp)+", puntos "+z(mp)+"<br>tesela: "+tv+"<br>topo: "+otmInfo+"<br><b>Puntos</b><br>en pantalla: "+mk.length+"<br>primero: "+fi+"<br>clases del mapa: "+document.getElementById("map").className+"<br>capas: "+localStorage.getItem("ldc-capas")+" · fondo "+localStorage.getItem("ldc-base")+"<br><b>Cuadritos del mapa</b><br>"+tl}
addEventListener("load",()=>{__mk("todo cargado");requestAnimationFrame(()=>requestAnimationFrame(()=>__mk("primer dibujo")));
 if(/[?&]diag/.test(location.search))setTimeout(()=>{const n=performance.getEntriesByType("navigation")[0]||{};const fp=(performance.getEntriesByType("paint").find(e=>e.name==="first-contentful-paint")||{}).startTime;
  const rows=[["respuesta del servidor",Math.round(n.responseStart||0)],["descarga terminada",Math.round(n.responseEnd||0)],...__M,["primer contenido",Math.round(fp||0)]];
  const d=document.createElement("div");d.style.cssText="position:fixed;z-index:99999;left:8px;top:8px;background:#fff;color:#000;padding:12px 14px;border:2px solid #c00;border-radius:10px;font:14px/1.45 system-ui;max-width:92vw;box-shadow:0 4px 18px rgba(0,0,0,.3)";
  const res=performance.getEntriesByType("resource");const H={};res.forEach(e=>{let h;try{h=new URL(e.name).hostname.replace(/^[abc]\\./,"")}catch(x){h="?"}const o=H[h]||(H[h]={n:0,fin:0,max:0});o.n++;o.fin=Math.max(o.fin,e.responseEnd);o.max=Math.max(o.max,e.duration)});
  const hs=Object.entries(H).sort((a,b)=>b[1].fin-a[1].fin).map(([h,o])=>h+": "+o.n+" archivos, el último a los <b>"+Math.round(o.fin)+"</b>, el más lento "+Math.round(o.max));
  const slow=res.slice().sort((a,b)=>b.duration-a.duration).slice(0,4).map(e=>e.name.split("?")[0].split("/").slice(-3).join("/").slice(-45)+" · "+Math.round(e.duration));
  d.innerHTML="<b>Tiempos de arranque (ms)</b><br>"+rows.map(r=>r[0]+": <b>"+r[1]+"</b>").join("<br>")+"<br><b>Por servidor</b><br>"+hs.join("<br>")+"<br><b>Lo más lento</b><br>"+slow.join("<br>")+"<br>Service worker: "+(navigator.serviceWorker&&navigator.serviceWorker.controller?"sí":"no")+__extra()+"<br><small>"+navigator.userAgent+"</small><br><button onclick='this.parentNode.remove()'>Cerrar</button>";d.style.maxHeight="88vh";d.style.overflow="auto";d.style.fontSize="13px";document.body.appendChild(d)},4000)});
</script>
</body>''')
rep('''requestAnimationFrame(()=>{fitHome(false);sizeMarks()});
addEventListener("resize",()=>{sizeMarks()});''','''addEventListener("resize",()=>{map.invalidateSize()});
document.getElementById("b-me").addEventListener("click",()=>{if(!navigator.geolocation){toast("Este móvil no da la ubicación");return}toast("Buscando dónde estás…");sheet.hidden=true;sheet.classList.remove("full");setNear(false);navigator.geolocation.getCurrentPosition(p=>{const la=p.coords.latitude,lo=p.coords.longitude;showMe(la,lo);ensureZone(zoneAt(la,lo));map.flyTo([la,lo],Math.max(map.getZoom(),14),{duration:reduce()?0:.8})},()=>toast("No he podido saber dónde estás. Revisa que la ubicación esté activada y con permiso."),{enableHighAccuracy:true,timeout:12000,maximumAge:60000})});
let deferredInstall=null;const ib=document.getElementById("instbtn");
addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;ib.hidden=false});
ib.addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice.catch(()=>{});deferredInstall=null;ib.hidden=true});
addEventListener("appinstalled",()=>{ib.hidden=true});''')
rep('function saveMarks(){store.set("ldc-marcas",MARKS);','function saveMarks(){store.set("ldc-marcas",MARKS);if(window.ldcSync)ldcSync("marcas");')
rep('<button class="fsbtn" id="fsbtn" aria-label="Cambiar tamaño del texto">Aa</button>','<button class="fsbtn" id="fsbtn" aria-label="Cambiar tamaño del texto">Aa</button>\n    <button class="userbtn" id="userbtn" aria-label="Tu cuenta" title="Tu cuenta"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>')
rep('<div class="actions">${r.u?`<a class="btn primary" href="${esc(r.u)}" target="_blank" rel="noopener">Leer la ruta en el blog</a><button class="btn ghost" data-share="${r.id}">↗ Compartir</button>`:""}','<div class="actions">')
# descargar GPX: nombre legible, la descarga no se corta (antes se anulaba al 1,5 s) y aviso de dónde queda
rep('a.download=slug(r).replace(/^r-/,"")+".gpx";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}','a.download=(nm.replace(/[\\\\/:*?"<>|]+/g," ").replace(/\\s+/g," ").trim().slice(0,80)||"track")+".gpx";document.body.appendChild(a);a.click();toast("Descargado «"+a.download+"» en la carpeta Descargas del móvil");setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},60000)}')
# en la ficha a pantalla completa (desde Rutas/Cumbres): «Ver en mapa» en lugar de «Compartir», que baja al final
rep('h=routeBody(r)+`<div class="actions"><button class="btn ghost" data-ovmap="${r.id}">🗺 Ver en el mapa</button></div>`','h=routeBody(r)+`<div class="actions"><button class="btn ghost" data-share="${r.id}">↗ Compartir esta ruta</button></div>`')
rep('.fsbtn{','.topacts .ovonly{display:none}#ov .topacts .ovonly{display:flex}#ov .topacts [data-share]{display:none}\n.fsbtn{')
# perfil interactivo: el svg lleva sus escalas
rep('<svg class="prof" viewBox="0 0 ${W} ${H}"','<svg class="prof" data-x="${X}" data-lo="${lo}" data-hi="${hi}" viewBox="0 0 ${W} ${H}"')
# el tiempo: previsión de 5 días dentro de la ficha
rep('<div class="sec"><h3>El tiempo</h3><p class="note" style="margin-bottom:6px">Previsión para ${esc(hi.c)}${hi.a?" ("+fmtA(hi.a)+")":""}.</p>','<div class="sec"><h3>El tiempo</h3><p class="note" style="margin-bottom:6px">Previsión para ${esc(hi.c)}${hi.a?" ("+fmtA(hi.a)+")":""}.</p><div class="wx" data-lat="${hi.lat}" data-lon="${hi.lon}" data-alt="${hi.a||""}"></div>')
# seguir esta ruta (botón en la ficha) y «rutas cerca» medido desde el inicio del track
rep('<button class="btn primary" data-gpx="${r.id}">⬇ Descargar GPX</button>','<button class="btn ghost" data-offr="${r.id}">${window.OFFLBL?OFFLBL(r.u):"📥 Mapa sin cobertura"}</button><button class="btn ghost" data-mtsave="${r.id}">${window.MTSAVED&&MTSAVED(r)?"★ En mis tracks":"☆ Guardar en mis tracks"}</button><button class="btn ghost" data-gpx="${r.id}">⬇ Descargar GPX</button>')
rep('<button class="x" aria-label="Cerrar" data-close>×</button></div>\n  <div class="meta">${r.iv?','<button class="x" aria-label="Cerrar" data-close>×</button></div>\n  <div class="topacts">${r.gx?`<button class="btn primary" data-follow="${r.id}">▶ Seguir track</button>`:""}${r.u?`<a class="btn ${r.gx?"ghost":"primary"}" href="${esc(r.u)}" target="_blank" rel="noopener">Leer en el blog</a><button class="btn ghost" data-share="${r.id}">↗ Compartir</button>`:""}<button class="btn ghost ovonly" data-ovmap="${r.id}">🗺 Ver en mapa</button></div>\n  <div class="meta">${r.iv?')
rep('.fsbtn{','.topacts{display:flex;gap:6px;margin:2px 0 10px}.topacts .btn{flex:1 1 0;min-width:0;justify-content:center;text-align:center;padding:11px 4px;font-size:14.5px;line-height:1.15;white-space:nowrap;gap:4px;overflow:hidden;text-overflow:ellipsis}@media(max-width:420px){.topacts .btn{font-size:13.5px}}\n.fsbtn{')
rep('.map(r=>({r,d:km({lat,lon},r)}))','.map(r=>({r,d:km({lat,lon},r.gx&&r.gx.st?{lat:r.gx.st[0],lon:r.gx.st[1]}:r)}))')
# marcas: copiar a otro móvil
rep('''   <p class="note"><b>${nd}</b> de ${ZI.length}''','''      <p class="note"><b>${nd}</b> de ${ZI.length}''')
rep('''  const m=e.target.closest("[data-m]");if(m){''','''  if(e.target.closest("[data-exp]")){const code="LDC1:"+btoa(unescape(encodeURIComponent(JSON.stringify(MARKS))));(navigator.clipboard?navigator.clipboard.writeText(code):Promise.reject()).then(()=>alert("Copiado. En el otro móvil, abre la app y pulsa «Pegar marcas de otro móvil»."),()=>prompt("Copia este código:",code));return}
  if(e.target.closest("[data-imp]")){const code=prompt("Pega aquí el código de tus marcas:");if(!code)return;try{const v=JSON.parse(decodeURIComponent(escape(atob(code.trim().replace(/^LDC1:/,"")))));Object.assign(MARKS,v);saveMarks();renderCols();alert("Marcas añadidas.")}catch(err){alert("Ese código no es válido.")}return}
  const m=e.target.closest("[data-m]");if(m){''')
d=json.load(open(A+'final_data.json'))
# los recorridos de los tracks van en un archivo aparte que se carga después (la app abre antes)
import hashlib,glob as _g
TL={r['u']:r['gx'].pop('ln') for r in d['routes'] if r.get('gx') and r['gx'].get('ln')}
_tj=json.dumps(TL,separators=(',',':'));_th=hashlib.md5(_tj.encode()).hexdigest()[:8]
for _old in _g.glob(O+'tracks-*.json'):os.remove(_old)
open(O+f'tracks-{_th}.json','w').write(_tj)
t=t.replace('__TRACKS__',f'tracks-{_th}.json')
PL=[[p['n'].split(' / ')[0],p['t'],p['lat'],p['lon']] for p in json.load(open(A+'places.json'))]; o={'c':0,'t':1,'v':2}; PL.sort(key=lambda p:o[p[1]])
t=t.replace('__DATA__',json.dumps(d,ensure_ascii=False,separators=(',',':'))).replace('__GEO__',open(A+'geo.json').read()).replace('__TOWNS__',open(A+'towns.json').read()).replace('__PLACES__',json.dumps(PL,ensure_ascii=False,separators=(',',':')))
# aviso de versión nueva: QUITADO a petición suya (26 oct). version.txt se deja vacío para que las copias antiguas de la app dejen de avisar
open(O+'version.txt','w').write("")
open(O+'index.html','w').write(t)
s=re.findall(r'<script>(.*?)</script>',t,re.S); open('/tmp/claude-0/app.js','w').write(s[0])
# ficheros
os.makedirs(O+'vendor',exist_ok=True); [shutil.copy('/home/claude/pwa/vendor/'+f,O+'vendor/') for f in ('leaflet.js','leaflet.css')]
os.makedirs(O+'fotos',exist_ok=True)
used={r['f'] for r in d['routes'] if r.get('f') is not None}
for f in used: shutil.copy(A+f'fotos/{f}.jpg',O+f'fotos/{f}.jpg')
print('fotos',len(used),'html',len(t)//1024,'KB')
