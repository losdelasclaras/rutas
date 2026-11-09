/* ---------- Gesto «Atrás» dentro de la app (9 nov 2026) ----------
   En los Pixel con gestos, deslizar desde el borde izquierdo es «Atrás». Si la app no tiene nada a lo que volver, Android
   cierra la página (el informe lo mostraba: «pagehide · se descarta») y al volver desde recientes se quedaba colgada.
   Ahora «Atrás» va paso a paso: cierra el cuadro o la ficha abierta, sale de «Solo verlo», cierra Capas, vuelve a la
   pestaña Mapa; en el mapa avisa «Desliza otra vez para salir» y solo sale si se repite en 2 s.
   Cómo: una entrada «guardia» en el historial encima de la de la página ({ldc0}); al volver a {ldc0} se hace un paso y se
   pone otra guardia. Las fichas que ya usan el historial (OVS de template.html, SOS) siguen funcionando igual.
   Solo en la app (APK o instalada), no en el navegador. */
(function(){
const enApp=(()=>{try{return sessionStorage.getItem("ldc-apk")==="1"||matchMedia("(display-mode: standalone)").matches||/android-app:\/\/es\.losdelasclaras/.test(document.referrer)}catch(e){return false}})();
if(!enApp)return;
const ap=(t,x)=>{if(window.DIAG)DIAG.apunta(t,x)};
try{history.replaceState(Object.assign({},history.state||{},{ldc0:1}),"")}catch(e){}
let armada=false,salir=0,tm=null;
function arma(){if(armada)return;try{history.pushState({ldcg:1},"");armada=true}catch(e){}}
// la primera guardia, al primer toque (Chrome no tiene en cuenta las entradas que pone una página sin que la hayan tocado)
addEventListener("pointerdown",()=>{if(!armada&&!salir)arma()},{capture:true,passive:true});
const vis=el=>el&&!el.hidden&&el.offsetParent!==null;
function unPaso(){
  // 1) cuadros: cuenta, instalar…
  for(const bg of document.querySelectorAll(".accbg,.instbg,.cdbg"))if(!bg.hidden){const x=bg.querySelector("[data-close]");if(x)x.click();else bg.hidden=true;return"cuadro"}
  // 2) la ficha de abajo
  const sh=document.getElementById("sheet");if(sh&&!sh.hidden){const x=sh.querySelector(".sheet-head [data-close],[data-close]");if(x)x.click();else sh.hidden=true;return"ficha"}
  // 3) «Solo verlo»
  if(document.body.classList.contains("solover")&&window.SOLOVER){SOLOVER.off();return"solo verlo"}
  // 4) Capas
  const lg=document.querySelector(".legend.open");if(lg){lg.classList.remove("open");const t=lg.querySelector(".laytog");if(t)t.setAttribute("aria-expanded",false);return"capas"}
  // 5) otra pestaña → Mapa
  const tb=document.querySelector('.tabs [data-v="mapa"]');if(tb&&tb.getAttribute("aria-selected")!=="true"){tb.click();return"a Mapa"}
  return null}
addEventListener("popstate",e=>{const s=e.state||{};if(!s.ldc0)return;   // solo cuando se vuelve a la entrada de la página
  armada=false;const h=unPaso();
  if(h){ap("atrás",h);salir=0;arma();return}
  if(salir&&Date.now()-salir<2000)return;   // segunda vez: no se pone guardia; el gesto ya ha llegado al principio
  salir=Date.now();ap("atrás","aviso de salir");if(typeof toast==="function")toast("Desliza otra vez para salir");
  // si en 2 s no se repite, vuelve la guardia (sin pedir otro toque: la página ya se ha tocado)
  clearTimeout(tm);tm=setTimeout(()=>{salir=0;arma()},2000)});
})();
