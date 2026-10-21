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
#map .pt svg{position:absolute;width:var(--ms,24px);height:var(--ms,24px);transform:translate(-50%,-50%);filter:drop-shadow(0 1px 1px rgba(0,0,0,.35));cursor:pointer}
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
i=t.rindex('</script>'); t=t[:i]+'</script>\n<script>if("serviceWorker" in navigator){const had=!!navigator.serviceWorker.controller;let rl=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(had&&!rl){rl=true;location.reload()}});addEventListener("load",()=>navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(reg=>{reg.update();document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")reg.update()})}).catch(()=>{}))}</script>\n</body></html>\n'
# leyenda: sin relieve ni pueblos (ya vienen en el mapa topográfico)
t=re.sub(r'\s*<button class="lay" data-lay="relief".*?</button>','',t,count=1,flags=re.S)
t=re.sub(r'\s*<button class="lay" data-lay="towns".*?</button>','',t,count=1,flags=re.S)
t=t.replace('<div class="legend"','<div class="legend"',1)
_i=t.index('<div class="legend"');_j=t.index('</div>',_i)
_i=t.index('<div class="legend"');_j=t.index('</div>',_i);_lg=t[_i:_j];_pk=_lg[_lg.index('<button class="lay" data-lay="peaks"'):];_tg=_lg[_lg.index('<button class="laytog"'):_lg.index('</button>',_lg.index('<button class="laytog"'))+9]
t=t[:_i]+'<div class="legend" role="group" aria-label="Capas del mapa">'+_tg+'<div class="laypanel"><p class="laygh">Mapa</p><button class="lay" data-base="topo" aria-pressed="true"><svg class="ico" viewBox="-5 -5 10 10"><rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="#cfe0b8" stroke="#6b8a4a" stroke-width=".8"/></svg>Topográfico</button><button class="lay" data-base="ign" aria-pressed="false"><svg class="ico" viewBox="-5 -5 10 10"><rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="#e8d9a8" stroke="#8a6d2b" stroke-width=".8"/></svg>IGN</button><button class="lay" data-base="orto" aria-pressed="false"><svg class="ico" viewBox="-5 -5 10 10"><rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="#5f7a4a" stroke="#2f4224" stroke-width=".8"/></svg>Ortofoto (IGN)</button><button class="lay" data-base="none" aria-pressed="false"><svg class="ico" viewBox="-5 -5 10 10"><rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="#f1f1ec" stroke="#999" stroke-width=".8"/></svg>Sin mapa</button><p class="laygh">Ver</p>'+_pk+'<button class="lay" data-lay="tracks" aria-pressed="false"><svg class="ico" viewBox="-5 -5 10 10"><path d="M-4 3C-2 -3 0 3 1 -1S3 -3 4 -4" fill="none" stroke="#c3262e" stroke-width="1.6" stroke-linecap="round"/></svg>Tracks</button></div>'+t[_j:]
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
# init
rep('''drawZone(ZONES[store.get("ldc-zona","cant")]?store.get("ldc-zona","cant"):"cant"); applyFilter(); renderCols();''','''applyFilter(); renderCols(); fitHome(false); sizeMarks();''')
rep('''requestAnimationFrame(()=>{fitHome(false);sizeMarks()});
addEventListener("resize",()=>{sizeMarks()});''','''addEventListener("resize",()=>{map.invalidateSize()});
document.getElementById("b-me").addEventListener("click",()=>{openNearPanel();useGeo()});
let deferredInstall=null;const ib=document.getElementById("instbtn");
addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;ib.hidden=false});
ib.addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice.catch(()=>{});deferredInstall=null;ib.hidden=true});
addEventListener("appinstalled",()=>{ib.hidden=true});''')
# marcas: copiar a otro móvil
rep('''   <p class="note"><b>${nd}</b> de ${ZI.length}''','''   <div class="sync"><button class="linkbtn" data-exp>Copiar mis marcas</button><button class="linkbtn" data-imp>Pegar marcas de otro móvil</button></div>
   <p class="note"><b>${nd}</b> de ${ZI.length}''')
rep('''  const m=e.target.closest("[data-m]");if(m){''','''  if(e.target.closest("[data-exp]")){const code="LDC1:"+btoa(unescape(encodeURIComponent(JSON.stringify(MARKS))));(navigator.clipboard?navigator.clipboard.writeText(code):Promise.reject()).then(()=>alert("Copiado. En el otro móvil, abre la app y pulsa «Pegar marcas de otro móvil»."),()=>prompt("Copia este código:",code));return}
  if(e.target.closest("[data-imp]")){const code=prompt("Pega aquí el código de tus marcas:");if(!code)return;try{const v=JSON.parse(decodeURIComponent(escape(atob(code.trim().replace(/^LDC1:/,"")))));Object.assign(MARKS,v);saveMarks();renderCols();alert("Marcas añadidas.")}catch(err){alert("Ese código no es válido.")}return}
  const m=e.target.closest("[data-m]");if(m){''')
d=json.load(open(A+'final_data.json'))
PL=[[p['n'].split(' / ')[0],p['t'],p['lat'],p['lon']] for p in json.load(open(A+'places.json'))]; o={'c':0,'t':1,'v':2}; PL.sort(key=lambda p:o[p[1]])
t=t.replace('__DATA__',json.dumps(d,ensure_ascii=False,separators=(',',':'))).replace('__GEO__',open(A+'geo.json').read()).replace('__TOWNS__',open(A+'towns.json').read()).replace('__PLACES__',json.dumps(PL,ensure_ascii=False,separators=(',',':')))
open(O+'index.html','w').write(t)
s=re.findall(r'<script>(.*?)</script>',t,re.S); open('/tmp/claude-0/app.js','w').write(s[0])
# ficheros
os.makedirs(O+'vendor',exist_ok=True); [shutil.copy('/home/claude/pwa/vendor/'+f,O+'vendor/') for f in ('leaflet.js','leaflet.css')]
os.makedirs(O+'fotos',exist_ok=True)
used={r['f'] for r in d['routes'] if r.get('f') is not None}
for f in used: shutil.copy(A+f'fotos/{f}.jpg',O+f'fotos/{f}.jpg')
print('fotos',len(used),'html',len(t)//1024,'KB')
