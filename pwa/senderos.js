/* ---------- 🥾 Senderos marcados (9 nov 2026): GR, PR, SL… encima de cualquier mapa ----------
   Capa transparente de Waymarked Trails (datos © OpenStreetMap, CC BY-SA). Sus normas: se puede usar en otras webs con un uso
   moderado, guardando en caché lo que se ve y sin descargas masivas. Por eso: apagada de serie, solo con el mapa acercado
   (zoom 10 o más) y sin descarga para sin cobertura (lo ya visto lo guarda el service worker, como el resto del mapa). */
(function(){
if(typeof L==="undefined"||!window.map)return;
if(LAY.sendero===undefined)LAY.sendero=false;
map.createPane("senderos");map.getPane("senderos").style.zIndex=250;map.getPane("senderos").style.pointerEvents="none";
const CAPA=L.tileLayer("https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png",{pane:"senderos",minZoom:10,maxNativeZoom:18,maxZoom:20,opacity:.9,
  attribution:'Senderos © <a href="https://hiking.waymarkedtrails.org" target="_blank" rel="noopener">Waymarked Trails</a> (CC BY-SA)'});
function sync(){const on=!!LAY.sendero;if(on&&!map.hasLayer(CAPA))CAPA.addTo(map);else if(!on&&map.hasLayer(CAPA))CAPA.remove();
  const b=document.querySelector('[data-lay="sendero"]');if(b)b.setAttribute("aria-pressed",on);
  const n=document.querySelector(".sendnota");if(n)n.hidden=!(on&&map.getZoom()<10)}
// interruptor en Capas › Mapa (debajo de los mapas de fondo)
const grp=[...document.querySelectorAll(".laypanel button.laygh")].find(x=>/^mapa$/i.test((x.querySelector(".tt")||x).textContent.trim()));
const sitio=grp&&grp.nextElementSibling;
if(sitio){sitio.insertAdjacentHTML("beforeend",`<button class="lay" data-lay="sendero" aria-pressed="${!!LAY.sendero}"><span class="lico" style="background:#c62828;border-radius:3px;height:4px;align-self:center"></span>Senderos marcados (GR, PR, SL)</button><p class="note sendnota" hidden style="margin:2px 6px 6px;font-size:13px">Acerca el mapa para ver los senderos.</p>`)}
document.querySelector(".legend").addEventListener("click",e=>{if(e.target.closest('[data-lay="sendero"]'))setTimeout(()=>{sync();if(typeof saveLay==="function")saveLay()},0)});
map.on("zoomend",sync);
sync();
})();
