/* ---------- Gesto «Atrás» dentro de la app (9 nov 2026) ----------
   En los Pixel con gestos, deslizar desde el borde izquierdo es «Atrás». Si la app no tiene nada a lo que volver, Android
   cierra la página (el informe lo mostraba: «pagehide · se descarta») y al volver desde recientes se quedaba colgada.
   Ahora «Atrás» va paso a paso: cierra la ficha o el cuadro abierto (como la ✕), sale de «Solo verlo», cierra Capas,
   vuelve a la pestaña Mapa; en el mapa no sale: ofrece «¿Salir de la app? [Salir]», que la manda al fondo (APK 45).
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
let cur=0,salir=0,ign=false;   // cur: en qué entrada nuestra estamos (null si en una de otros)
try{history.replaceState(Object.assign({},history.state||{},{ldc0:1,ldci:0}),"")}catch(e){cur=null}
function rellena(){if(salir||cur===null||cur>=N)return;try{for(let i=cur+1;i<=N;i++)history.pushState({ldcg:1,ldci:i},"");cur=N}catch(e){}}
// al LEVANTAR el dedo (9 nov 2026): con el dedo, Chrome solo cuenta el toque al soltar (pointerup/touchend/click); las guardias
// puestas al apoyar el dedo (pointerdown) no valían y el segundo «Atrás» seguido cerraba la app (informe 9:38:51 y 9:39:47)
for(const ev of ["pointerup","touchend","click"])addEventListener(ev,e=>{if(e.isTrusted)rellena()},{capture:true,passive:true});   // solo toques de verdad (no la ✕ que pulsa el propio gesto)
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
  // nada que cerrar: «Atrás» ya no cierra la app (al volver a abrirla después, Chrome se quedaba colgado: informe del 9 nov).
  // Se ofrece «Salir», que en la APK la manda al fondo como deslizar hacia arriba (ldcrutas://salir → SalirActivity).
  ap("atrás","ofrece salir"+(i?"":" (sin reserva)"));barra()});
const apk=(()=>{try{return sessionStorage.getItem("ldc-apk")==="1"}catch(e){return false}})();
document.head.insertAdjacentHTML("beforeend",`<style>.salbar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:3600;display:flex;align-items:center;gap:12px;width:min(460px,calc(100% - 20px));box-sizing:border-box;background:var(--ink);color:var(--card);border-radius:14px;padding:14px 14px 14px 20px;box-shadow:0 4px 16px rgba(0,0,0,.35);font-weight:800;font-size:21px}
.salbar span{flex:1}.salbar a,.salbar button{flex:none;min-height:58px;min-width:110px;display:grid;place-items:center;border:0;border-radius:12px;background:var(--card);color:var(--ink);font:inherit;font-weight:900;font-size:22px;padding:0 22px;text-decoration:none;cursor:pointer}</style>`);
let BAR=null,btm=null;
function barra(){if(BAR)BAR.remove();clearTimeout(btm);BAR=document.createElement("div");BAR.className="salbar";
  const fb=encodeURIComponent(location.href.split("#")[0]+"#");
  BAR.innerHTML=apk?`<span>¿Salir de la app?</span><a href="intent://salir#Intent;scheme=ldcrutas;package=es.losdelasclaras.rutas;S.browser_fallback_url=${fb};end">Salir</a>`
    :`<span>Para salir, desliza hacia arriba</span>`;
  document.body.appendChild(BAR);const a=BAR.querySelector("a");if(a)a.addEventListener("click",()=>{ap("atrás","Salir");setTimeout(()=>{if(BAR){BAR.remove();BAR=null}},300)});
  btm=setTimeout(()=>{if(BAR){BAR.remove();BAR=null}},8000)}   // 8 s (9 nov: 4 s era poco)
})();
