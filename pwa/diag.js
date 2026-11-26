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
// 🐞 aviso de fallos (ver más abajo): adónde se mandan, qué no se manda (ruido del navegador o de la red) y cuántos van en esta sesión
const FURL=()=>{const c=window.LDCCFG;return c?`https://firestore.googleapis.com/v1/projects/${c.projectId}/databases/(default)/documents/fallos?key=${c.apiKey}`:""};   // LDCCFG lo pone sync.js
const YA=new Set();let NENV=0;
const RUIDO=/ResizeObserver loop|Script error\.?$|Failed to fetch|NetworkError|Load failed|network error|AbortError|The operation was aborted|QuotaExceeded|Importing a module script failed|ChunkLoadError|chrome-extension|moz-extension|Failed to update a ServiceWorker|error occurred when fetching the script/i;   // 27 nov: la comprobación de versión nueva falla si no hay red o mientras GitHub publica; se reintenta sola
function disp(){const u=navigator.userAgent;const so=/Android ([\d.]+)/.exec(u),ios=/OS (\d+)_/.exec(u);const nav=/SamsungBrowser/.test(u)?"Samsung":/; wv\)/.test(u)?"WebView":/CriOS|Chrome/.test(u)?"Chrome":/Firefox|FxiOS/.test(u)?"Firefox":/Safari/.test(u)?"Safari":"?";
  const apk=sessionStorage.getItem("ldc-apk")==="1";return(so?"Android "+so[1]:ios?"iOS "+ios[1]:/Windows/.test(u)?"Windows":/Mac OS/.test(u)?"Mac":/Linux/.test(u)?"Linux":"?")+" · "+(apk?"APK":nav)+(innerWidth>900?" · pantalla grande":"")}
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
addEventListener("error",e=>{if(!e.message)return;apunta("ERROR",`${e.message} · ${(e.filename||"").split("/").pop()}:${e.lineno||""}`);envia("error",e.message,`${(e.filename||"").split("/").pop()}:${e.lineno||""}:${e.colno||""}`,e.error&&e.error.stack)});   // solo errores de código (no imágenes o mapas que no cargan)
addEventListener("unhandledrejection",e=>{const r=e.reason,m=String((r&&(r.message||r))||"?");apunta("ERROR",`promesa: ${m}`);envia("promesa",m,"",r&&r.stack)});
try{new PerformanceObserver(l=>{for(const x of l.getEntries()){if(x.duration>500)apunta("ATASCO",`${Math.round(x.duration)} ms sin responder (${document.visibilityState}) · ${estado()}`);
  if(x.duration>4000&&document.visibilityState==="visible")envia("atasco",`${Math.round(x.duration/1000)} s sin responder`,"",estado())}}).observe({type:"longtask",buffered:true})}catch(e){}
setTimeout(()=>{for(const x of window.__ERRS||[]){apunta("MÓDULO",x);envia("módulo",String(x),"","")}},5000);   // módulos que fallaron al cargar
/* 24 nov 2026: 🐞 aviso de fallos. Los errores de código (y los atascos de más de 4 s y los módulos que no cargan) se mandan, sin datos personales,
   a Firestore › fallos: qué pasó, en qué parte del código, versión de la app, tipo de móvil/navegador y la pantalla abierta. Como mucho 5 por sesión,
   sin repetir el mismo. Sin conexión no se manda (queda en el informe local de siempre). Los lee solo el administrador, en «Tu cuenta».
   Reglas de Firestore: match /fallos/{id} (ver claude/cambios-24-nov.md del proyecto). */
function envia(tipo,m,f,st){try{m=String(m||"").slice(0,380);if(!m||RUIDO.test(m)||RUIDO.test(f||""))return;const k=tipo+"|"+m+"|"+f;if(YA.has(k)||NENV>=5||!navigator.onLine)return;YA.add(k);NENV++;
  if(/^(localhost|127\.)/.test(location.hostname)&&!window.__FALLOS_PRUEBA)return;   // pruebas en el ordenador
  const S=v=>({stringValue:String(v||"")});
  const body={fields:{m:S(tipo+": "+m),f:S(String(f||"").slice(0,180)),s:S(String(st||"").replace(/https?:\/\/[^\s)]+\//g,"").slice(0,1400)),v:S(String(window.LDC_VER||"?").slice(0,60)),d:S(disp().slice(0,80)),a:S(estado().slice(0,180)),t:{integerValue:String(Date.now())}}};
  const url=FURL();if(!url){YA.delete(k);NENV--;return}
  (window.__FALLOS_PRUEBA||fetch)(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),keepalive:true}).catch(()=>{})}catch(e){}}
window.DIAG.envia=envia;
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
  sh.insertAdjacentHTML("beforeend",`<div class="note" data-fallos style="margin-top:14px"><button class="mpb" data-fver>🐞 Fallos en otros móviles</button> <span data-fnum></span><div data-flista></div></div><p class="note" style="margin-top:14px"><button class="mpb" data-diag>📋 Copiar informe para Claude</button><br><small>Para encontrar fallos: lo que ha pasado en la app (sin datos personales).</small><br><small>Versión de la app: <b>${window.LDC_VER||"?"}</b></small> <button class="mpb" data-diagx style="font-size:12px">Vaciar</button></p>`)}).observe(sh,{childList:true})}
engancha();
/* 🐞 panel del administrador: fallos de los últimos 14 días, juntados por mensaje */
const FV="ldc-fallos-visto";let FL=null;
async function leeFallos(){const a=await LDCFB.load(),fs=a.fs,q=fs.query(fs.collection(a.db,"fallos"),fs.where("t",">",Date.now()-14*864e5));
  const s=await fs.getDocs(q);const v=[];s.forEach(d=>v.push(Object.assign({id:d.id},d.data())));return v}
const fh=t=>{const d=new Date(t);return d.toLocaleDateString("es-ES",{day:"numeric",month:"short"})+" "+d.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})};
const es=x=>String(x||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function junta(FL){const g=new Map();for(const x of FL){const k=x.m+"|"+x.f;let o=g.get(k);if(!o)g.set(k,o={m:x.m,f:x.f,n:0,d:new Set(),v:new Set(),t:0,s:x.s,a:x.a});o.n++;o.d.add(x.d);o.v.add(x.v);if(x.t>o.t){o.t=x.t;o.s=x.s;o.a=x.a}}
  return[...g.values()].sort((a,b)=>b.t-a.t)}
async function verFallos(box){const L=box.querySelector("[data-flista]");L.innerHTML="<small>Cargando…</small>";
  try{FL=await leeFallos()}catch(e){L.innerHTML=`<small>No se han podido leer (${es(e.message||e)}). ¿Están puestas las reglas de «fallos» en Firestore?</small>`;return}
  try{localStorage.setItem(FV,String(Date.now()))}catch(e){}const n=box.querySelector("[data-fnum]");if(n)n.textContent="";
  if(!FL.length){L.innerHTML="<small>✓ Ningún fallo en los últimos 14 días.</small>";return}
  const G=junta(FL);L._G=G;
  L.innerHTML=`<br><small>${FL.length} avisos · ${G.length} fallos distintos (últimos 14 días). Para arreglarlos, cópialos y pégaselos a Claude.</small><br>
   <button class="mpb" data-fcopia style="font-size:13px;margin:6px 0">📋 Copiar para Claude</button> <button class="mpb" data-fborra style="font-size:13px">🗑 Borrar todos</button>`+
   G.map(o=>`<details style="margin:6px 0;border-top:1px solid var(--edge);padding-top:6px"><summary><b>${o.n}×</b> ${es(o.m.slice(0,120))}<br><small>${fh(o.t)} · ${o.d.size} tipo${o.d.size>1?"s":""} de móvil</small></summary>
     <small>Dónde: ${es(o.f)}<br>Móviles: ${es([...o.d].join(" | "))}<br>Versiones: ${es([...o.v].join(" | "))}<br>Pantalla: ${es(o.a)}</small><pre style="white-space:pre-wrap;font-size:10px;max-height:160px;overflow:auto">${es(o.s)}</pre></details>`).join("")}
function textoFallos(G){return["Fallos de la app (Andariega) · últimos 14 días",...G.map(o=>`\n${o.n}× ${o.m}\n  dónde: ${o.f}\n  móviles: ${[...o.d].join(" | ")}\n  versiones: ${[...o.v].join(" | ")}\n  última: ${fh(o.t)} · pantalla: ${o.a}\n  ${String(o.s||"").slice(0,700).replace(/\n/g,"\n  ")}`)].join("\n")}
// al abrir la app con la cuenta de administrador: si hay fallos nuevos desde la última vez que se miraron, un aviso
async function avisoFallos(){try{   // Firestore solo deja leer a los administradores: a los demás les falla la lectura y no pasa nadaconst v=await leeFallos(),vis=+(localStorage.getItem(FV)||0),n=v.filter(x=>x.t>vis).length;
    if(n&&typeof toast==="function")toast(`🐞 ${n} fallo${n>1?"s":""} nuevo${n>1?"s":""} en otros móviles · míralos en «Tu cuenta»`);
    const s=document.querySelector("[data-fnum]");if(s)s.textContent=n?`(${n} nuevos)`:""}catch(e){}}
setTimeout(function mira(){if(window.LDCFB&&LDCFB.user&&LDCFB.user())avisoFallos();else if(performance.now()<120000)setTimeout(mira,5000)},8000);
document.addEventListener("click",e=>{const fv=e.target.closest("[data-fver]");if(fv){verFallos(fv.closest("[data-fallos]"));return}
  const fc=e.target.closest("[data-fcopia]");if(fc){const L=fc.closest("[data-flista]");const txt=textoFallos(L._G||[]);(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>{fc.textContent="✓ Copiado"},()=>{fc.insertAdjacentHTML("afterend",`<textarea readonly style="width:100%;height:140px;font-size:11px">${es(txt)}</textarea>`)});return}
  const fb2=e.target.closest("[data-fborra]");if(fb2){if(!FL||!confirm("¿Borrar todos los avisos de fallos?"))return;fb2.disabled=true;
    LDCFB.load().then(a=>Promise.all(FL.map(x=>a.fs.deleteDoc(a.fs.doc(a.db,"fallos",x.id))))).then(()=>{fb2.closest("[data-flista]").innerHTML="<small>✓ Borrados.</small>";FL=[]},er=>{fb2.disabled=false;alert("No se han podido borrar: "+(er.message||er))});return}
  const b=e.target.closest("[data-diag]");if(b){copiar(b);return}
  const x=e.target.closest("[data-diagx]");if(x){try{localStorage.removeItem(K)}catch(er){}apunta("vaciado","");x.textContent="✓ Vaciado"}});
})();
