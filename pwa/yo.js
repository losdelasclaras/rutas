/* ---------- «Yo»: ubicación en directo ----------
   1.er toque: el punto azul te sigue y el mapa se mueve contigo.
   Si mueves el mapa con el dedo deja de centrarte (el punto se sigue moviendo); otro toque vuelve a centrarte.
   Tocar con el mapa ya centrado en ti: se apaga. */
(function(){
const old=document.getElementById("b-me");if(!old)return;
const b=old.cloneNode(true);old.replaceWith(b);   // quita el comportamiento antiguo (una sola vez)
document.head.insertAdjacentHTML("beforeend",`<style>
#b-me.vivo{box-shadow:0 0 0 4px rgba(26,115,232,.35),0 2px 8px rgba(0,0,0,.25);animation:yov 1.6s ease-in-out infinite}
#b-me.vivo.suelto{animation:none;background:#fff!important;color:#1a73e8!important;border-color:#1a73e8!important}
@keyframes yov{0%,100%{box-shadow:0 0 0 3px rgba(26,115,232,.35)}50%{box-shadow:0 0 0 9px rgba(26,115,232,.12)}}
</style>`);
let W=null,SIGUE=true,PRIMERO=true;
function apaga(msg){if(W!=null){navigator.geolocation.clearWatch(W);W=null}b.classList.remove("vivo","suelto");if(msg)toast(msg)}
function fix(p){const la=p.coords.latitude,lo=p.coords.longitude;
  if(typeof showMe==="function")showMe(la,lo);
  if(PRIMERO){PRIMERO=false;try{ensureZone(zoneAt(la,lo))}catch(e){}map.flyTo([la,lo],Math.max(map.getZoom(),14),{duration:.8});return}
  if(SIGUE)map.panTo([la,lo],{animate:true,duration:.5})}
function err(e){if(e&&e.code===1)apaga("Sin permiso de ubicación: actívalo en los ajustes del móvil para el navegador");
  else if(PRIMERO)toast("Todavía no tengo tu ubicación… sigo buscando")}
b.addEventListener("click",()=>{
  if(!navigator.geolocation){toast("Este móvil no da la ubicación");return}
  if(W!=null){
    if(!SIGUE){SIGUE=true;b.classList.remove("suelto");const c=window.__meLL;toast("Te sigo otra vez");if(c)map.panTo(c);return}
    apaga("Ubicación en directo apagada");return}
  sheet.hidden=true;sheet.classList.remove("full");try{setNear(false)}catch(e){}
  toast("Buscando dónde estás… (el punto te seguirá)");PRIMERO=true;SIGUE=true;b.classList.add("vivo");b.classList.remove("suelto");
  W=navigator.geolocation.watchPosition(p=>{window.__meLL=[p.coords.latitude,p.coords.longitude];fix(p)},err,{enableHighAccuracy:true,maximumAge:3000,timeout:20000})});
map.on("dragstart",()=>{if(W!=null&&SIGUE){SIGUE=false;b.classList.add("suelto")}});
// al irte de la app el móvil corta el GPS; al volver, sigue solo
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&W!=null){navigator.geolocation.clearWatch(W);W=navigator.geolocation.watchPosition(p=>{window.__meLL=[p.coords.latitude,p.coords.longitude];fix(p)},err,{enableHighAccuracy:true,maximumAge:3000,timeout:20000})}});
window.YO={apaga,activo:()=>W!=null};
// botón «📍 Punto» en el mapa: guarda un punto donde estás
const fabs=document.querySelector(".fabs");
if(fabs)fabs.insertAdjacentHTML("afterbegin",`<button class="btn ghost" id="b-pt" data-short="Punto" title="Guardar un punto donde estoy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Guardar punto</button>`);
const bp=document.getElementById("b-pt");if(bp)bp.addEventListener("click",()=>{if(window.MISPUNTOS&&MISPUNTOS.gps)MISPUNTOS.gps()});
})();
