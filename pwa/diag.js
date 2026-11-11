/* ---------- Diagnóstico (8 nov 2026): registro interno para encontrar cuelgues al volver a la app ----------
   Apunta en el móvil (localStorage «ldc-diag», como mucho 250 líneas) cuándo arranca la página y cómo (nueva, recargada,
   restaurada por Android), cuándo se va a segundo plano y cuándo vuelve, qué había abierto, cuánto tarda en responder al
   volver, las tareas largas y los errores. Un «latido» cada 2 s guarda la última hora en que la página respondía: si se
   cuelga y hay que cerrarla, al abrirla otra vez se ve hasta cuándo respondió.
   Nada sale del móvil: en «Tu cuenta» hay un botón para copiar el informe y pegárselo a Claude.
   Además (arreglo preventivo): al irse a segundo plano se cierra el panel de Capas.
   Para quitarlo: borrar 'diag' de _mods en pwa/build_pwa.py. */
/* 9 nov 2026: saber si estamos dentro del APK sin depender solo de cómo se abrió la página. Antes solo se miraba el origen
   (android-app://…) del primer arranque; si la página arrancaba de otra forma, desaparecía el botón Grabar y Seguir usaba el GPS
   de la web. Ahora, una vez visto el APK en este móvil, se recuerda (localStorage) y vale en cualquier arranque en Android.
   Va aquí porque diag es el primer módulo: todos los demás miran sessionStorage «ldc-apk». */
try{const ref=document.referrer.startsWith("android-app://es.losdelasclaras.rutas"),and=/Android/i.test(navigator.userAgent);
  if(ref){sessionStorage.setItem("ldc-apk","1");localStorage.setItem("ldc-apk-visto","1")}
  else if(and&&localStorage.getItem("ldc-apk-visto")==="1")sessionStorage.setItem("ldc-apk","1")}catch(e){}
(function(){
const K="ldc-diag",HB="ldc-diag-hb",MAX=250,T0=Date.now();
const hh=t=>{const d=new Date(t);return d.toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit"})+" "+d.toLocaleTimeString("es-ES",{hour12:false})+"."+String(d.getMilliseconds()).padStart(3,"0")};
function lee(){try{return JSON.parse(localStorage.getItem(K)||"[]")}catch(e){return[]}}
function apunta(tipo,txt){try{const l=lee();l.push([Date.now(),tipo,String(txt||"").slice(0,400)]);while(l.length>MAX)l.shift();localStorage.setItem(K,JSON.stringify(l))}catch(e){}}
window.DIAG={apunta};
// qué hay abierto en este momento
function estado(){const q=s=>document.querySelector(s),sh=q("#sheet"),h2=sh&&!sh.hidden?(sh.querySelector("h2")||{}).textContent:"";
  const v=[...document.querySelectorAll(".view")].find(x=>!x.hidden&&x.offsetParent!==null);
  const a=[];a.push("pestaña "+((v&&v.id)||"?"));if(q(".legend.open"))a.push("CAPAS abierto");if(h2)a.push("ficha «"+h2.trim().slice(0,40)+"»");
  if(document.body.classList.contains("solover"))a.push("solo verlo");if(window.SEGUIR&&SEGUIR.get&&SEGUIR.get())a.push("siguiendo");if(window.YO&&YO.activo)a.push("Yo activo");
  try{if(window.map)a.push("zoom "+map.getZoom()+" · "+document.querySelectorAll(".leaflet-marker-icon").length+" iconos")}catch(e){}
  try{const m=performance.memory;if(m)a.push("memoria "+Math.round(m.usedJSHeapSize/1048576)+"/"+Math.round(m.jsHeapSizeLimit/1048576)+" MB")}catch(e){}
  return a.join(" · ")}
// arranque: ¿página nueva, recargada o devuelta por Android? ¿respondía antes?
{let tipo="?";try{tipo=(performance.getEntriesByType("navigation")[0]||{}).type||"?"}catch(e){}
  let hb=null;try{hb=JSON.parse(localStorage.getItem(HB)||"null")}catch(e){}
  const apk=/android-app:\/\/es\.losdelasclaras/.test(document.referrer)||sessionStorage.getItem("ldc-apk")==="1";
  apunta("ARRANQUE",`${tipo}${document.wasDiscarded?" · Android la había descartado":""} · ${apk?"APK":"navegador"} · ${navigator.userAgent.replace(/^.*Android/,"Android").slice(0,90)}`);
  if(hb)apunta("antes",`último latido ${hh(hb.t)} (${hb.v?"visible":"en segundo plano"}${hb.e?" · "+hb.e:""})`)}
// latido: la última hora en que la página respondía
let ultLat=0;function latido(){if(document.visibilityState!=="visible")return;try{localStorage.setItem(HB,JSON.stringify({t:Date.now(),v:1,e:estado().slice(0,160)}))}catch(e){}ultLat=Date.now()}
setInterval(latido,2000);latido();
// segundo plano y vuelta
let oc=0;document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="hidden"){oc=Date.now();apunta("se va",estado());try{localStorage.setItem(HB,JSON.stringify({t:Date.now(),v:0,e:estado().slice(0,160)}))}catch(e){}
    // preventivo: el panel de Capas abierto (con todas sus filas) no se queda en segundo plano
    const l=document.querySelector(".legend.open");if(l){l.classList.remove("open");const t=l.querySelector(".laytog");if(t)t.setAttribute("aria-expanded",false);apunta("arreglo","cierro Capas al irme")}
    return}
  const fuera=oc?Math.round((Date.now()-oc)/1000):0,t1=performance.now();apunta("vuelve",`tras ${fuera} s fuera · ${estado()}`);
  // ¿cuánto tarda en volver a pintar y en atender un toque?
  requestAnimationFrame(()=>{const a=Math.round(performance.now()-t1);setTimeout(()=>{const b=Math.round(performance.now()-t1);if(a>300||b>300)apunta("LENTO",`primer dibujo ${a} ms · responde a los ${b} ms`);else apunta("ok",`responde a los ${b} ms`);latido()},0)})});
addEventListener("freeze",()=>apunta("congelada","Android la deja en pausa"));
addEventListener("resume",()=>apunta("despierta",""));
addEventListener("pageshow",e=>{if(e.persisted)apunta("restaurada","desde la memoria del navegador")});
addEventListener("pagehide",e=>apunta("pagehide",e.persisted?"se queda en memoria":"se descarta"));
// errores y tareas largas (más de medio segundo sin responder)
addEventListener("error",e=>{if(!e.message)return;apunta("ERROR",`${e.message} · ${(e.filename||"").split("/").pop()}:${e.lineno||""}`)});   // solo errores de código (no imágenes o mapas que no cargan)
addEventListener("unhandledrejection",e=>apunta("ERROR",`promesa: ${(e.reason&&(e.reason.message||e.reason))||"?"}`));
try{new PerformanceObserver(l=>{for(const x of l.getEntries())if(x.duration>500)apunta("ATASCO",`${Math.round(x.duration)} ms sin responder (${document.visibilityState}) · ${estado()}`)}).observe({type:"longtask",buffered:true})}catch(e){}
setTimeout(()=>{for(const x of window.__ERRS||[])apunta("MÓDULO",x)},5000);   // módulos que fallaron al cargar
// informe para copiar, en «Tu cuenta»
function informe(){return["Informe LdC Rutas · "+hh(Date.now())+" · versión "+(window.LDC_VER||"?"),...lee().map(([t,k,x])=>`${hh(t)} ${k}${x?" · "+x:""}`)].join("\n")}
async function copiar(b){const txt=informe();let ok=false;try{await navigator.clipboard.writeText(txt);ok=true}catch(e){}
  if(!ok){const ta=document.createElement("textarea");ta.value=txt;ta.style.cssText="position:fixed;top:0;left:0;opacity:0";document.body.appendChild(ta);ta.select();try{ok=document.execCommand("copy")}catch(e){}ta.remove()}
  if(ok){b.textContent="✓ Copiado: pégalo en el chat con Claude";if(typeof toast==="function")toast("Informe copiado")}
  else{b.insertAdjacentHTML("afterend",`<textarea readonly style="width:100%;height:160px;font-size:11px;margin-top:6px">${txt.replace(/</g,"&lt;")}</textarea>`);b.textContent="Mantén pulsado el texto y cópialo"}}
// el panel de la cuenta (sync.js) es un cuadro aparte (.accdlg) que se crea al arrancar: se espera a que exista
function engancha(){const sh=document.querySelector(".accdlg");if(!sh){setTimeout(engancha,1000);return}
// 11 nov 2026: solo lo ven las cuentas de administrador (el registro se sigue guardando en todos los móviles)
const ADMD=["losdelasclaras@gmail.com","jcrespopazos@gmail.com"];
const admD=()=>{const u=window.LDCFB&&LDCFB.user&&LDCFB.user();return!!(u&&u.email&&ADMD.includes(u.email.toLowerCase()))};
new MutationObserver(()=>{const ya=sh.querySelector("[data-diag]");if(ya&&!admD()){const p=ya.closest("p");if(p)p.remove();return}
  if(ya||!admD()||!sh.querySelector(".sheet-head"))return;
  sh.insertAdjacentHTML("beforeend",`<p class="note" style="margin-top:14px"><button class="mpb" data-diag>📋 Copiar informe para Claude</button><br><small>Para encontrar fallos: lo que ha pasado en la app (sin datos personales).</small><br><small>Versión de la app: <b>${window.LDC_VER||"?"}</b></small> <button class="mpb" data-diagx style="font-size:12px">Vaciar</button></p>`)}).observe(sh,{childList:true})}
engancha();
document.addEventListener("click",e=>{const b=e.target.closest("[data-diag]");if(b){copiar(b);return}
  const x=e.target.closest("[data-diagx]");if(x){try{localStorage.removeItem(K)}catch(er){}apunta("vaciado","");x.textContent="✓ Vaciado"}});
})();
