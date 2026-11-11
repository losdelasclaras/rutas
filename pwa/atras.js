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
  // 0) venías de una lista de Explorar con «Ver en el mapa»: vuelve a esa lista (10 nov 2026)
  if(window.FRVOLVER&&FRVOLVER())return"a la lista"
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
  /* 9 nov: siempre el botón; la app no siempre sabe que viene del APK (al arrancar de nuevo) y salía «desliza hacia arriba» */
  BAR.innerHTML=true?`<span>¿Salir de la app?</span><a href="intent://salir#Intent;scheme=ldcrutas;package=es.losdelasclaras.rutas;S.browser_fallback_url=${fb};end">Salir</a>`
    :`<span>Para salir, desliza hacia arriba</span>`;
  document.body.appendChild(BAR);const a=BAR.querySelector("a");if(a)a.addEventListener("click",()=>{ap("atrás","Salir");setTimeout(()=>{if(BAR){BAR.remove();BAR=null}},300)});
  btm=setTimeout(()=>{if(BAR){BAR.remove();BAR=null}},5000)}   // 5 s (9 nov: 4 s era poco; 10 nov: 8 s, mucho)
})();

/* 10 nov 2026: fichas que se mueven con el dedo, como en Instagram o Google Maps (idea de Dani, Rutinas Varias):
   · la rayita de arriba es más visible y se queda fija arriba aunque bajes leyendo; arrastrándola, la ficha baja en cualquier momento;
     desde el resto de la ficha, solo cuando está arriba del todo (si no, el dedo sirve para subir por ella);
   · si la sueltas a media bajada, se queda MINIMIZADA: una barra abajo con su título y se ve el mapa entero (con su track);
     tocando la barra o subiéndola, vuelve; bajándola otra vez o con su ×, se cierra;
   · si la bajas casi del todo (o rápido desde minimizada), se cierra. La × de arriba y el «atrás» del móvil siguen igual.
   Va fuera del bloque de arriba: vale también en el navegador del móvil, no solo en la app. */
{const sh=document.getElementById("sheet");if(sh){
  document.head.insertAdjacentHTML("beforeend",`<style>
  #sheet>.grab{position:sticky;top:-6px;z-index:5;width:auto;height:26px;margin:-6px 0 0;background:transparent;display:flex;align-items:center;justify-content:center;cursor:grab;touch-action:none}
  #sheet>.grab::before{content:"";width:56px;height:6px;border-radius:9px;background:#9aa39c;box-shadow:0 0 0 2px rgba(255,255,255,.65)}
  @media (prefers-color-scheme:dark){#sheet>.grab::before{background:#d6dbd5;box-shadow:0 0 0 2px rgba(0,0,0,.45)}}
  #sheet.fmin{transform:translateY(110%)!important;pointer-events:none}
  #sheet{overscroll-behavior-y:contain}
  .fminbar{position:absolute;left:8px;right:8px;bottom:8px;z-index:30;display:flex;align-items:center;gap:8px;min-height:58px;padding:4px 6px 4px 14px;border-radius:16px;background:var(--card);color:var(--ink);border:1px solid var(--edge);box-shadow:0 -4px 18px rgba(0,0,0,.25);touch-action:none}
  .fminbar .t{flex:1;min-width:0;font-weight:800;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
  .fminbar .t small{display:block;font-weight:600;font-size:12.5px;color:var(--muted)}
  .fminbar button{flex:none;width:46px;height:46px;border-radius:12px;border:0;background:transparent;color:var(--ink);font-size:22px;cursor:pointer}
  .fminbar .fx{background:var(--mark,#c3262e);color:#fff;font-size:24px}
  </style>`);
  let BAR=null;
  const quitaBar=()=>{if(BAR){BAR.remove();BAR=null}};
  const cierra=()=>{if(sh.classList.contains("fmin"))sh.classList.remove("fmin");quitaBar();const x=sh.querySelector(".sheet-head [data-close],[data-close]");if(x)x.click();else sh.hidden=true;sh.style.transition="none";sh.style.transform=""};
  const restaura=()=>{quitaBar();sh.style.transition="transform .22s ease";if(sh.classList.contains("fmin"))sh.classList.remove("fmin");sh.style.transform="";setTimeout(()=>{sh.style.transition=""},240)};
  function minimiza(){sh.style.transition="transform .2s ease";sh.style.transform="";sh.classList.add("fmin");quitaBar();
    const h=(sh.querySelector("h2")||{}).textContent||"Ficha";BAR=document.createElement("div");BAR.className="fminbar";
    BAR.innerHTML=`<button aria-label="Volver a abrir la ficha" data-fmup>▲</button><div class="t" data-fmup>${h.replace(/</g,"&lt;")}<small>Toca o desliza hacia arriba para verla</small></div><button class="fx" aria-label="Cerrar" data-fmx>×</button>`;
    sh.parentNode.appendChild(BAR);if(window.DIAG)DIAG.apunta("ficha","minimizada")
    // la barra: tocar = abrir; subirla = abrir; bajarla = cerrar
    let by=null;BAR.addEventListener("touchstart",e=>{by=e.touches[0].clientY},{passive:true});
    BAR.addEventListener("touchend",e=>{if(by==null)return;const d=e.changedTouches[0].clientY-by;by=null;if(d<-25)restaura();else if(d>25)cierra()},{passive:true});
    BAR.addEventListener("click",e=>{if(e.target.closest("[data-fmx]")){cierra();return}if(e.target.closest("[data-fmup]"))restaura()})}
  window.FICHAMIN={min:minimiza,abre:restaura};
  // si la ficha cambia o se cierra estando minimizada, fuera la barra
  new MutationObserver(()=>{if(sh.hidden){if(sh.classList.contains("fmin"))sh.classList.remove("fmin");quitaBar()}else if(BAR&&!sh.classList.contains("fmin"))quitaBar()}).observe(sh,{attributes:true,attributeFilter:["hidden","class"]});   // ojo: classList.remove sin comprobar vuelve a avisar al observador (bucle)
  new MutationObserver(()=>{if(sh.classList.contains("fmin")){sh.classList.remove("fmin");quitaBar()}}).observe(sh,{childList:true});
  let y0=null,x0=0,t0=0,dy=0,tira=false,asa=false,canc=0;
  const fuera=e=>e.target.closest("input,textarea,select,.frmas,.frvel,.leaflet-container,svg,.perf,.pf,[data-noswipe]");
  sh.addEventListener("touchstart",e=>{if(e.touches.length!==1){y0=null;return}asa=!!e.target.closest("#sheet>.grab");
    if(!asa&&(sh.scrollTop>2||fuera(e))){y0=null;return}
    y0=e.touches[0].clientY;x0=e.touches[0].clientX;t0=Date.now();dy=0;tira=false;canc=0},{passive:true});
  sh.addEventListener("touchmove",e=>{if(y0==null)return;const t=e.touches[0],d=t.clientY-y0,dx=Math.abs(t.clientX-x0);
    if(!tira){if(d>0&&d<8&&Math.abs(t.clientX-x0)<d&&e.cancelable&&(asa||sh.scrollTop<=0))e.preventDefault();if(d<8)return;if(dx>d||(!asa&&sh.scrollTop>2)){y0=null;return}tira=true;sh.style.transition="none"}
    dy=Math.max(0,d);sh.style.transform=`translateY(${dy}px)`;if(e.cancelable)e.preventDefault();else canc++},{passive:false});
  const suelta=ev=>{if(y0==null)return;y0=null;if(window.DIAG&&(tira||ev&&ev.type==="touchcancel"))DIAG.apunta("deslizar",`${ev&&ev.type} bajó ${Math.round(dy)} px${asa?" (rayita)":""}${canc?" · "+canc+" no frenables":""}`);if(!tira)return;tira=false;const v=dy/Math.max(1,Date.now()-t0),H=sh.getBoundingClientRect().height+dy;
    if(dy>H*.7||(dy>H*.4&&v>1.2)){sh.style.transition="transform .18s ease";sh.style.transform="translateY(100%)";setTimeout(cierra,170)}
    else if(dy>90||(dy>30&&v>.6))minimiza();
    else{sh.style.transition="transform .2s ease";sh.style.transform="";setTimeout(()=>{sh.style.transition=""},220)}};
  sh.addEventListener("touchend",suelta,{passive:true});sh.addEventListener("touchcancel",suelta,{passive:true})}}
