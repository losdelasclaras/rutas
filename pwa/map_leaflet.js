/* ---------- map (Leaflet, mapa topográfico) ---------- */
const ZONES={
 cant:{n:"Cantábrica",home:[-7.15,43.72,-4.35,42.5]},
 pir:{n:"Pirineos",home:[-0.85,43.0,1.12,42.55]},
 alp:{n:"Alpes y Dolomitas",s:"Alpes",home:[6.0,46.8,12.4,44.85]}};
const zoneOf=r=>r==="Pirineos"?"pir":(r==="Alpes"||r==="Dolomitas")?"alp":"cant";
const zoneAt=(lat,lon)=>lon>4?"alp":(lon>-1.6&&lat<43.25)?"pir":"cant";
let ZK=ZONES[store.get("ldc-zona","cant")]?store.get("ldc-zona","cant"):"cant";
const mapEl=document.getElementById("map");
const map=L.map(mapEl,{zoomControl:false,minZoom:5,maxZoom:18,zoomSnap:0.5,worldCopyJump:false});
const OTM=L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",{subdomains:"abc",maxNativeZoom:17,maxZoom:18,crossOrigin:true,
  attribution:'Mapa © <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a> (CC-BY-SA) · datos © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'});
map.attributionControl.setPrefix(false);
const MK={};
P.forEach((p,i)=>{
  const cls="pt "+(p.t==="cumbre"?"cumbre":"spot")+(p.x?" ini":"");
  const m=L.marker([p.lat,p.lon],{icon:L.divIcon({className:cls,html:`<svg viewBox="-12 -12 24 24"><use href="#ic-${p.cat}" x="-12" y="-12" width="24" height="24"/></svg>`,iconSize:[0,0]}),title:p.c+(p.a?" · "+fmtA(p.a):""),riseOnHover:true,zIndexOffset:p.t==="cumbre"?(p.a||0):0});
  m.bindTooltip(esc(p.c)+(p.t==="cumbre"&&p.a?` <span class="la">${p.a.toLocaleString("es-ES")} m</span>`:""),{permanent:true,direction:"right",offset:[10,0],className:"lbl "+(p.t==="cumbre"?"pk":p.x?"ini":"sp"),interactive:false});
  m.on("click",e=>{L.DomEvent.stopPropagation(e); if(nearMode){nearAt(p.lat,p.lon);return} pickRoute(i)});
  m.addTo(map); MK[i]=m;
});
// pequeñas ayudas con la misma forma que usaba el mapa anterior
const nodes={classed(c,f){for(const i in MK){const el=MK[i].getElement();if(el)el.classList.toggle(c,typeof f==="function"?!!f(+i):!!f)}return nodes}};
const tracks={classed(){return tracks}};
let probeC=null;
const probe={attr(a,v){if(a==="r"&&!v&&probeC){probeC.remove();probeC=null}return probe}};
let k=1, meDot=null;
function drawZone(zk){ZK=zk;store.set("ldc-zona",zk);renderMapbar();fitHome(true)}
function ensureZone(zk){if(zk!==ZK){ZK=zk;store.set("ldc-zona",zk);renderMapbar()}}
const FSV=[1,1.15,1.3,1.45];let FS=+store.get("ldc-fs",1.15);if(!FSV.includes(FS))FS=1.15;
document.documentElement.style.setProperty("--fs",FS);
document.getElementById("fsbtn").textContent=["Aa","Aa+","Aa++","Aa+++"][FSV.indexOf(FS)];
const LAY={peaks:true,spots:true,tracks:store.get("ldc-trk","0")==="1",mh:store.get("ldc-mh","1")==="1",mq:store.get("ldc-mq","1")==="1",solo:false};
function sizeMarks(){
  const z=map.getZoom(); k=2**(z-8);
  mapEl.style.setProperty("--ms",((z<7.5?11:z<8.5?14:z<10?19:z<12?24:28)*FS)+"px");
  mapEl.classList.toggle("lbl-peaks",LAY.peaks&&z>=12);
  mapEl.classList.toggle("lbl-spots",LAY.spots&&z>=13);
  mapEl.classList.toggle("hide-peaks",!LAY.peaks);
  mapEl.classList.toggle("hide-spots",!LAY.spots);
  setTimeout(syncAllTracks,0);setTimeout(refreshMarks,0);
}
/* capa con todos los tracks (botón «Tracks» de la leyenda) */
let ALLTRK=null;
function syncAllTracks(){store.set("ldc-trk",LAY.tracks?"1":"0");
  if(LAY.tracks&&!ALLTRK){ALLTRK=L.layerGroup();
    R.forEach(r=>{if(!r.gx||!r.gx.ln)return;const ll=r.gx.ln.map(p=>[p[0],p[1]]);
      ALLTRK.addLayer(L.polyline(ll,{color:"#fff",weight:5,opacity:.7,interactive:false}));
      ALLTRK.addLayer(L.polyline(ll,{color:"#c3262e",weight:3,opacity:.6}).bindTooltip(esc(routeTitle(r)),{sticky:true}).on("click",e=>{L.DomEvent.stopPropagation(e);openRoute(r.id)}))})}
  const on=LAY.tracks&&map.getZoom()>=10;
  if(ALLTRK){if(on&&!map.hasLayer(ALLTRK)){ALLTRK.addTo(map);if(TRK)TRK.eachLayer(l=>l.bringToFront&&l.bringToFront())}else if(!on&&map.hasLayer(ALLTRK))ALLTRK.remove()}}
map.on("zoomend",sizeMarks);
map.on("moveend",()=>{const c=map.getCenter();const z=zoneAt(c.lat,c.lng);if(z!==ZK){ZK=z;store.set("ldc-zona",z);renderMapbar()}});
map.on("click",e=>{if(!nearMode)return;const la=e.latlng.lat,lo=e.latlng.lng;nearAt(la,lo,nearestTown(la,lo))});
function nearestTown(la,lo){let best=null,bd=1e9;for(const p of PLACES){const d=km({lat:la,lon:lo},{lat:p[2],lon:p[3]});if(d<bd){bd=d;best=p[0]}}return bd<4?best:null}
const reduce=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
function fitHome(anim){const h=ZONES[ZK].home;map.fitBounds([[h[3],h[0]],[h[1],h[2]]],{animate:!!anim&&!reduce(),padding:[8,8]})}
function flyTo(lat,lon,kk=10){const z=Math.max(map.getZoom(),Math.min(15,Math.round(8+Math.log2(kk))));
  const r=mapEl.getBoundingClientRect();const wide=r.width>=860;
  let pt=map.project([lat,lon],z); pt=pt.add(wide?[r.width*0.12,0]:[0,r.height*0.2]);
  const c=map.unproject(pt,z);
  if(reduce())map.setView(c,z);else map.flyTo(c,z,{duration:.6})}
function markNodes(){ // el mapa no usa los filtros: se ven siempre todos los puntos
  for(const i in MK){const el=MK[i].getElement(); if(el)el.classList.remove("dim");const tt=MK[i].getTooltip(); if(tt)tt.setOpacity(1)}
}
function applyFilter(){
  renderMapbar(); renderFilters(); const n=nExtra()+(F.reg!=="todas"?1:0); document.getElementById("fsum").textContent=n?`(${n} activo${n>1?"s":""})`:"";
  markNodes(); renderList();
}
function showMe(lat,lon){if(meDot)meDot.remove();meDot=L.circleMarker([lat,lon],{radius:8,color:"#fff",weight:3,fillColor:"#1a73e8",fillOpacity:1}).addTo(map)}
/* track del GPX: solo se dibuja con la ruta abierta */
let TRK=null;
window.showTrack=function(r){if(TRK){TRK.remove();TRK=null}
  if(!r||!r.gx||!r.gx.ln||!r.gx.ln.length)return;
  const ll=r.gx.ln.map(p=>[p[0],p[1]]);
  TRK=L.layerGroup([L.polyline(ll,{color:"#fff",weight:7,opacity:.9,interactive:false}),L.polyline(ll,{color:"#c3262e",weight:4,opacity:.95,interactive:false}),
    L.circleMarker(ll[0],{radius:7,color:"#fff",weight:2,fillColor:"#2a7a3b",fillOpacity:1,interactive:false}).bindTooltip("Inicio",{direction:"top"})]).addTo(map);
  setTimeout(()=>{const el=mapEl.getBoundingClientRect(),wide=el.width>=860,sh=document.getElementById("sheet");
    const pb=!wide&&sh&&!sh.hidden?Math.min(el.height*0.62,sh.offsetHeight)+16:24;
    map.fitBounds(L.latLngBounds(ll),{paddingTopLeft:[wide?60:24,120],paddingBottomRight:[wide?640:80,pb+20],maxZoom:15,animate:!reduce()})},450)};

setTimeout(()=>{const b=document.querySelector('[data-lay="tracks"]');if(b)b.setAttribute("aria-pressed",LAY.tracks)},0);

/* mapa de fondo: topográfico (OpenTopoMap), IGN, ortofoto PNOA o ninguno. Los del IGN solo cubren España: debajo queda el topográfico */
const ESP=L.latLngBounds([35.2,-9.6],[43.95,4.6]),IGNATT='© <a href="https://www.ign.es" target="_blank" rel="noopener">IGN</a> (CC BY 4.0 scne.es)';
const wmts=(svc,layer,fmt)=>`https://www.ign.es/wmts/${svc}?service=WMTS&request=GetTile&version=1.0.0&Format=image/${fmt}&layer=${layer}&style=default&tilematrixset=GoogleMapsCompatible&TileMatrix={z}&TileRow={y}&TileCol={x}`;
const BASES={topo:[OTM],
  ign:[OTM,L.tileLayer(wmts("mapa-raster","MTN","jpeg"),{minZoom:4,maxNativeZoom:17,maxZoom:18,bounds:ESP,crossOrigin:true,attribution:"Mapa ráster "+IGNATT})],
  orto:[OTM,L.tileLayer(wmts("pnoa-ma","OI.OrthoimageCoverage","jpeg"),{minZoom:4,maxNativeZoom:19,maxZoom:18,bounds:ESP,crossOrigin:true,attribution:"Ortofoto PNOA "+IGNATT})],
  none:[]};
let BASE=store.get("ldc-base",store.get("ldc-ign","0")==="1"?"ign":"topo");if(!BASES[BASE])BASE="topo";
function setBase(b){BASE=b;store.set("ldc-base",b);const want=new Set(BASES[b]);
  for(const k in BASES)for(const l of BASES[k])if(!want.has(l)&&map.hasLayer(l))l.remove();
  for(const l of BASES[b])if(!map.hasLayer(l))l.addTo(map);
  mapEl.classList.toggle("nobase",b==="none");
  document.querySelectorAll("[data-base]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.base===b))}
setBase(BASE);
document.querySelector(".legend").addEventListener("click",e=>{const b=e.target.closest("[data-base]");if(b)setBase(b.dataset.base)});
map.on("click",()=>{const lg=document.querySelector(".legend.open");if(lg){lg.classList.remove("open");lg.querySelector(".laytog").setAttribute("aria-expanded",false)}});

/* mis lugares: insignia ✓ (visitados) o ★ (quiero ir) en los puntos marcados; «solo los míos» oculta el resto */
function refreshMarks(){store.set("ldc-mh",LAY.mh?"1":"0");store.set("ldc-mq",LAY.mq?"1":"0");
  mapEl.classList.toggle("solo-mios",LAY.solo);
  for(const i in MK){const el=MK[i].getElement();if(!el)continue;const k=mkKey(P[i]),m=k?MARKS[k]:"";
    el.classList.toggle("mk-h",LAY.mh&&m==="hecha");el.classList.toggle("mk-q",LAY.mq&&m==="quiero");const on=(m==="hecha"&&LAY.mh)||(m==="quiero"&&LAY.mq);el.classList.toggle("mio",on);const tt=MK[i].getTooltip();if(tt)tt.setOpacity(LAY.solo&&!on?0:1)}}
map.on("layeradd",e=>{if(e.layer instanceof L.Marker)setTimeout(refreshMarks,0)});
setTimeout(()=>{for(const k of ["mh","mq","solo"]){const b=document.querySelector(`[data-lay="${k}"]`);if(b)b.setAttribute("aria-pressed",LAY[k])}refreshMarks()},0);
