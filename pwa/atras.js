/* ---------- Gesto «Atrás» dentro de la app (9 nov 2026) ----------
   En los Pixel con gestos, deslizar desde el borde izquierdo es «Atrás». Si la app no tiene nada a lo que volver, Android
   cierra la página (el informe lo mostraba: «pagehide · se descarta») y al volver desde recientes se quedaba colgada.
   Ahora «Atrás» va paso a paso: cierra la ficha o el cuadro abierto (como la ✕), sale de «Solo verlo», cierra Capas,
   vuelve a la pestaña Mapa; en el mapa avisa «Desliza otra vez para salir» y solo sale si se repite en 2 s.
   Cómo: encima de la entrada de la página ({ldci:0}) hay hasta N=6 entradas «guardia» ({ldci:1..N}: los 5 pasos posibles y el aviso). Cada «Atrás» baja una
   y hace un paso. Chrome solo respeta las entradas puestas justo después de un toque, así que se rellenan (hasta N) en cada
   toque: así varios «Atrás» seguidos funcionan aunque no se toque la pantalla entre medias (antes solo había una y el
   segundo «Atrás» seguido cerraba la app).
   Las fichas que ya usan el historial (OVS de template.html, SOS) siguen igual: si «Atrás» viene de una de ellas, aquí no
   se hace nada. Solo en la app (APK o instalada), no en el navegador. */
(function(){
const enApp=(()=>{try{return sessionStorage.getItem("ldc-apk")==="1"||matchMedia("(display-mode: standalone)").matches||/android-app:\/\/es\.losdelasclaras/.test(document.referrer)}catch(e){return false}})();
if(!enApp)return;
const N=6,ap=(t,x)=>{if(window.DIAG)DIAG.apunta(t,x)};
let cur=0,salir=0,ign=false,tm=null;   // cur: en qué entrada nuestra estamos (null si en una de otros)
try{history.replaceState(Object.assign({},history.state||{},{ldc0:1,ldci:0}),"")}catch(e){cur=null}
function rellena(){if(salir||cur===null||cur>=N)return;try{for(let i=cur+1;i<=N;i++)history.pushState({ldcg:1,ldci:i},"");cur=N}catch(e){}}
addEventListener("pointerdown",rellena,{capture:true,passive:true});
addEventListener("keydown",rellena,{capture:true});
function unPaso(){
  // 1) cuadros: cuenta, instalar…
  for(const bg of document.querySelectorAll(".accbg,.instbg,.cdbg"))if(!bg.hidden){const x=bg.querySelector("[data-close]");if(x)x.click();else bg.hidden=true;return"cuadro"}
  // 2) la ficha de abajo, como la ✕
  const sh=document.getElementById("sheet");if(sh&&!sh.hidden){const x=sh.querySelector(".sheet-head [data-close],[data-close]");if(x)x.click();else sh.hidden=true;return"ficha"}
  // 3) «Solo verlo»
  if(document.body.classList.contains("solover")&&window.SOLOVER){SOLOVER.off();return"solo verlo"}
  // 4) Capas
  const lg=document.querySelector(".legend.open");if(lg){lg.classList.remove("open");const t=lg.querySelector(".laytog");if(t)t.setAttribute("aria-expanded",false);return"capas"}
  // 5) otra pestaña → Mapa
  const tb=document.querySelector('.tabs [data-v="mapa"]');if(tb&&tb.getAttribute("aria-selected")!=="true"){tb.click();return"a Mapa"}
  return null}
addEventListener("popstate",e=>{const s=e.state||{},i=typeof s.ldci==="number"?s.ldci:null;
  if(ign){ign=false;cur=i;return}
  const antes=cur;cur=i;
  if(i===null||antes===null||i!==antes-1)return;   // no viene de una guardia nuestra: lo lleva quien sea (fichas, SOS…)
  const h=unPaso();
  if(h){ap("atrás",h+(i?"":" (sin reserva)"));salir=0;return}
  // nada que cerrar: aviso; se baja a la entrada de la página para que el siguiente «Atrás» salga de verdad
  salir=Date.now();ap("atrás","aviso de salir");if(typeof toast==="function")toast("Desliza otra vez para salir");
  if(i>0){ign=true;try{history.go(-i)}catch(er){ign=false}}
  clearTimeout(tm);tm=setTimeout(()=>{salir=0},2000)});
})();
