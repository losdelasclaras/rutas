/* ---------- 🔵 agrupar iconos cuando el mapa está alejado (se puede apagar en Capas) ----------
   Con el mapa lejos, los iconos que se pisan se juntan en un círculo con el número.
   Al acercarse (zoom 10 o más) se ven todos como siempre. Tocar un círculo acerca a esa zona.
   Solo agrupa los puntos fijos (del grupo y de los colaboradores); tu posición, tus puntos y lo de seguidores no.
   Todo vive en este archivo: quitarlo de la lista del build lo deja como antes. */
(function(){
if(typeof map==="undefined")return;
const KEY="ldc-agrupar",HASTA=10,CELDA=58;
const ON=true; // nov 2026: agrupar es el formato fijo de la app (antes se podía apagar en Capas)
const mapEl=map.getContainer();
document.head.insertAdjacentHTML("beforeend",`<style>
.agr-on .leaflet-marker-icon.pt:not(.agr-1),.agr-on .leaflet-marker-icon.cpt:not(.agr-1){visibility:hidden!important;pointer-events:none!important}
.agr-on .leaflet-tooltip.lbl{visibility:hidden}
.agr-on .leaflet-marker-icon.agr-x{display:none!important}
.agrc{display:flex;align-items:center;justify-content:center;border-radius:50%;background:#c3262e;color:#fff;font-weight:800;font-family:inherit;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.45);box-sizing:border-box;cursor:pointer}
.agrc.mx{background:#5a4a8a}
.laypanel .lay[data-agr]{margin-top:4px;border-top:1px solid var(--edge);padding-top:10px}
.laypanel .lay[data-agr][aria-pressed="true"]{font-weight:700}
</style>`);
const capa=L.layerGroup().addTo(map);
// 24 nov 2026: los iconos que van dentro de un círculo se quitan del dibujo (display:none) en vez de solo ocultarse:
// con el mapa lejos eran ~2.000 iconos que el móvil seguía calculando y pintando. Si un icono se ve o no (capas, filtros) se mira
// por sus clases, con las mismas reglas del CSS (#map .cpt.co-off, hide-peaks, hide-spots, solo-mios, fol-only), sin pedir estilos al navegador.
// Si se añade otra regla que oculte iconos con display:none, añadirla también aquí.
function seVe(el){const c=el.classList,mc=mapEl.classList,mio=c.contains("mio");
  if(mc.contains("fol-only")&&!c.contains("folme"))return false;
  if(c.contains("cpt"))return !c.contains("co-off");
  if(mc.contains("solo-mios")&&!mio)return false;
  if(mc.contains("hide-peaks")&&c.contains("cumbre")&&!mio)return false;
  if(mc.contains("hide-spots")&&c.contains("spot")&&!c.contains("ini")&&!mio)return false;
  return true}
let ERA=false;
function pinta(){capa.clearLayers();
  const z=map.getZoom(),activo=ON&&z<HASTA;mapEl.classList.toggle("agr-on",activo);
  if(!activo){for(const el of mapEl.querySelectorAll(".leaflet-marker-icon.agr-x,.leaflet-marker-icon.agr-1"))el.classList.remove("agr-x","agr-1");
    if(ERA){ERA=false;if(typeof cullMarks==="function")cullMarks();if(window.COAGR)COAGR.cull()}return}
  ERA=true;
  // 24 nov 2026: los puntos del grupo y de los colaboradores se agrupan con sus datos (sin dibujarlos); solo se ponen en el mapa los que quedan sueltos.
  // Otros iconos con clase pt/cpt (mis listas, seguidores) se miran como antes, en el mapa.
  const b=map.getBounds().pad(.1),cel=new Map(),reg=new Set();
  const mete=(x,ll)=>{const p=map.latLngToLayerPoint(ll),k=Math.floor(p.x/CELDA)+"_"+Math.floor(p.y/CELDA);
    let g=cel.get(k);if(!g){g={ms:[],la:0,lo:0,col:0};cel.set(k,g)}g.ms.push(x);g.la+=ll.lat;g.lo+=ll.lng;if(x.col)g.col++};
  const regs=(window.MKAGR?MKAGR():[]).concat(window.COAGR?COAGR.agr():[]);
  for(const x of regs){reg.add(x.m);const ll=x.m.getLatLng();if(b.contains(ll)&&x.vis())mete(x,ll);else x.del()}
  map.eachLayer(l=>{if(!(l instanceof L.Marker)||capa.hasLayer(l)||reg.has(l))return;const el=l.getElement&&l.getElement();
    if(!el||!(el.classList.contains("pt")||el.classList.contains("cpt")))return;el.classList.remove("agr-1","agr-x");
    const ll=l.getLatLng();if(b.contains(ll)&&seVe(el))mete({m:l,el,col:el.classList.contains("cpt")?1:0,add(){},del(){el.classList.add("agr-x")}},ll)});
  for(const g of cel.values()){
    if(g.ms.length===1){const x=g.ms[0];x.add();const el=x.el||(x.m.getElement&&x.m.getElement());if(el){el.classList.add("agr-1");el.classList.remove("agr-x")}continue}
    for(const x of g.ms)x.del();
    const n=g.ms.length,s=n<10?30:n<50?36:n<200?42:46,ll=[g.la/n,g.lo/n];
    const bb=L.latLngBounds(g.ms.map(x=>x.m.getLatLng()));
    L.marker(ll,{icon:L.divIcon({className:"",html:`<div class="agrc${g.col&&g.col<n?" mx":""}" style="width:${s}px;height:${s}px;font-size:${s<40?14:16}px">${n}</div>`,iconSize:[s,s],iconAnchor:[s/2,s/2]}),title:n+" puntos aquí: toca para acercar",zIndexOffset:500,keyboard:true})
      .on("click",e=>{L.DomEvent.stopPropagation(e);const zz=Math.min(map.getBoundsZoom(bb.pad(.2)),HASTA+1);if(zz<=z)map.setView(ll,Math.max(HASTA,z+2));else map.flyToBounds(bb.pad(.2),{maxZoom:HASTA+1,duration:.6})}).addTo(capa)}}
let t=0;const luego=()=>{clearTimeout(t);t=setTimeout(pinta,60)};
map.on("zoomend moveend layeradd layerremove",e=>{if(e.layer&&capa.hasLayer(e.layer))return;if(e.type==="layeradd"||e.type==="layerremove"){if(!(e.layer instanceof L.Marker))return}luego()});
document.addEventListener("click",e=>{if(e.target.closest(".laypanel [data-lay],.laypanel [data-base],.legend"))luego()});
setTimeout(pinta,400);window.AGRUPAR={pinta,luego,on:()=>ON,activo:()=>ON&&map.getZoom()<HASTA};
})();
