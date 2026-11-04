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
.agrc{display:flex;align-items:center;justify-content:center;border-radius:50%;background:#c3262e;color:#fff;font-weight:800;font-family:inherit;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.45);box-sizing:border-box;cursor:pointer}
.agrc.mx{background:#5a4a8a}
.laypanel .lay[data-agr]{margin-top:4px;border-top:1px solid var(--edge);padding-top:10px}
.laypanel .lay[data-agr][aria-pressed="true"]{font-weight:700}
</style>`);
const capa=L.layerGroup().addTo(map);
function esFijo(m){const el=m.getElement&&m.getElement();if(!el)return null;
  const c=el.classList;if(!(c.contains("pt")||c.contains("cpt")))return null;
  if(getComputedStyle(el).display==="none")return null;return el}
function pinta(){capa.clearLayers();
  const z=map.getZoom(),activo=ON&&z<HASTA;mapEl.classList.toggle("agr-on",activo);
  const todos=[];map.eachLayer(l=>{if(l instanceof L.Marker&&!capa.hasLayer(l)){const el=esFijo(l);if(el){el.classList.remove("agr-1");todos.push({l,el})}}});
  if(!activo)return;
  const b=map.getBounds().pad(.1),cel=new Map();
  for(const x of todos){const ll=x.l.getLatLng();if(!b.contains(ll))continue;const p=map.latLngToLayerPoint(ll),k=Math.floor(p.x/CELDA)+"_"+Math.floor(p.y/CELDA);
    let g=cel.get(k);if(!g){g={ms:[],la:0,lo:0,col:0};cel.set(k,g)}g.ms.push(x);g.la+=ll.lat;g.lo+=ll.lng;if(x.el.classList.contains("cpt"))g.col++}
  for(const g of cel.values()){
    if(g.ms.length===1){g.ms[0].el.classList.add("agr-1");continue}
    const n=g.ms.length,s=n<10?30:n<50?36:n<200?42:46,ll=[g.la/n,g.lo/n];
    const bb=L.latLngBounds(g.ms.map(x=>x.l.getLatLng()));
    L.marker(ll,{icon:L.divIcon({className:"",html:`<div class="agrc${g.col&&g.col<n?" mx":""}" style="width:${s}px;height:${s}px;font-size:${s<40?14:16}px">${n}</div>`,iconSize:[s,s],iconAnchor:[s/2,s/2]}),title:n+" puntos aquí: toca para acercar",zIndexOffset:500,keyboard:true})
      .on("click",e=>{L.DomEvent.stopPropagation(e);const zz=Math.min(map.getBoundsZoom(bb.pad(.2)),HASTA+1);if(zz<=z)map.setView(ll,Math.max(HASTA,z+2));else map.flyToBounds(bb.pad(.2),{maxZoom:HASTA+1,duration:.6})}).addTo(capa)}}
let t=0;const luego=()=>{clearTimeout(t);t=setTimeout(pinta,60)};
map.on("zoomend moveend layeradd layerremove",e=>{if(e.layer&&capa.hasLayer(e.layer))return;if(e.type==="layeradd"||e.type==="layerremove"){if(!(e.layer instanceof L.Marker))return}luego()});
document.addEventListener("click",e=>{if(e.target.closest(".laypanel [data-lay],.laypanel [data-base]"))luego()});
setTimeout(pinta,400);window.AGRUPAR={pinta,on:()=>ON};
})();
