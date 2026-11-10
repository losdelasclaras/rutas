// 10 nov 2026: al abrir una cumbre o un lugar (Explorar, buscador, mapa) se resalta su punto en el mapa
// aunque su capa esté apagada. Se quita al cerrar la ficha. No toca las capas.
(function(){
const css=document.createElement("style");css.textContent=`
.rsl{position:relative;width:22px;height:22px}
.rsl i{position:absolute;inset:0;border-radius:50%;background:#d7262e;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45)}
.rsl b{position:absolute;inset:-9px;border-radius:50%;border:3px solid #d7262e;animation:rslp 1.6s ease-out infinite;pointer-events:none}
.rsl span{position:absolute;left:28px;top:50%;transform:translateY(-50%);white-space:nowrap;background:#fff;color:#222;font:700 14px/1.2 system-ui,sans-serif;padding:4px 8px;border-radius:8px;box-shadow:0 1px 5px rgba(0,0,0,.35)}
@keyframes rslp{0%{transform:scale(.6);opacity:1}100%{transform:scale(1.7);opacity:0}}
@media (prefers-reduced-motion:reduce){.rsl b{animation:none;opacity:.5}}`;
document.head.appendChild(css);
let M=null;
const esc=s=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function quita(){if(M){try{M.remove()}catch(e){}M=null}}
function pon(lat,lon,n,cum){quita();if(typeof L==="undefined"||typeof map==="undefined"||!map)return;
  const ic=L.divIcon({className:"",html:`<div class="rsl"><b></b><i></i>${n?`<span>${cum?"⛰️ ":"📍 "}${esc(n)}</span>`:""}</div>`,iconSize:[22,22],iconAnchor:[11,11]});
  M=L.marker([lat,lon],{icon:ic,interactive:false,keyboard:false,zIndexOffset:2000}).addTo(map)}
// se quita cuando la ficha se cierra (minimizada sigue abierta: se queda)
new MutationObserver(()=>{if(M&&sheet.hidden)quita()}).observe(sheet,{attributes:true,attributeFilter:["hidden"]});
window.RESALTA={pon,quita};
})();
