/* ---------- botones del mapa: una fila abajo (Capas · Grabar · Punto · Yo); sin «Todo» ni «Rutas» (eso está en Explorar);
   en el ordenador fuera lo que necesita GPS: SOS, Punto, Yo, Grabar y Seguir ---------- */
(function(){
const pc=matchMedia("(hover:hover) and (pointer:fine)").matches&&!/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
document.documentElement.classList.toggle("pc",pc);
document.head.insertAdjacentHTML("beforeend",`<style>
#b-home,#b-rutas,#b-wiz2,#b-near,#rmenu,.laypanel [data-lay="solo"]{display:none!important}
.fabs{flex-direction:row!important;align-items:flex-end!important;gap:8px!important}
html.pc .sosbtn,html.pc #b-pt,html.pc #b-me,html.pc #b-grab,html.pc [data-follow],html.pc [data-mtfol],html.pc [data-segfol],html.pc [data-tmpfol]{display:none!important}
</style>`);
// «Ver solo los míos» fuera de Capas (confundía: se quedaba puesto y parecía que faltaban puntos). Lo mismo, con aviso visible, en Mis listas › Ver en el mapa
if(typeof LAY!=="undefined"&&LAY.solo){const b=document.querySelector('.laypanel [data-lay="solo"]');if(b)b.click();else{LAY.solo=false;if(typeof sizeMarks==="function")sizeMarks()}}
})();
