/* 24 nov 2026 · 📊 Qué se usa de la app (anónimo, sin cookies). Complementa a uso.js (que cuenta personas distintas).
   Cuenta veces, sin saber quién: aperturas de la app, fichas abiertas (rutas, cumbres, lugares, y cuáles), visitas a los blogs
   («Leer en el blog» y demás enlaces a webs de fuera, por dominio), Seguir, Grabar, Guardar track, Compartir, guardar mapas sin cobertura,
   «Cómo llegar», búsquedas, SOS y pestañas. Se junta en el móvil y se manda como mucho cada minuto (y al salir de la app) a
   Firestore › usoe: documentos d-AAAA-MM-DD (día) y m-AAAA-MM (mes), con un contador por cosa (r_<ruta>, c_<cumbre>, l_<lugar>, b_<web>…).
   No cuenta en los móviles de administrador (marca «yo» de uso.js) ni fuera de losdelasclaras.github.io.
   El resumen está en «Tu cuenta › 📊 Uso de la app» (uso.js). Regla de Firestore: match /usoe/{id} (ver claude/cambios-24-nov.md).
   Para quitarlo: borrar 'usoev' de _mods en build_pwa.py. */
(()=>{
const lee=()=>{try{return JSON.parse(localStorage.getItem("ldc-uso")||"{}")}catch(e){return{}}};
const hoyES=()=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Madrid"}).format(new Date());
// nombre → clave de campo de Firestore (solo letras, números y _; como mucho 40)
const sl=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/ñ/g,"n").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,40);
window.USOEV={sl};
const C=new Map();
function suma(k){if(!k||/_$/.test(k))return;C.set(k,(C.get(k)||0)+1);if(C.size>=60)manda()}
function manda(){if(!C.size)return;
  const o=lee();if(o.yo){C.clear();return}
  const prueba=window.__USO_PRUEBA,cfg=window.LDCCFG;
  if(!prueba&&(location.hostname!=="losdelasclaras.github.io"||!cfg)){C.clear();return}
  const d=hoyES(),pid=cfg?cfg.projectId:"p",base=`projects/${pid}/databases/(default)/documents/usoe/`;
  const tr=[...C].map(([k,n])=>({fieldPath:k,increment:{integerValue:String(n)}}));C.clear();
  const writes=["d-"+d,"m-"+d.slice(0,7)].map(id=>({update:{name:base+id,fields:{}},updateMask:{fieldPaths:[]},updateTransforms:tr}));
  const url=cfg?`https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents:commit?key=${cfg.apiKey}`:"";
  try{(prueba||fetch)(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({writes}),keepalive:true}).catch(()=>{})}catch(e){}}
setInterval(manda,60000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")manda()});
if(/HeadlessChrome|bot|crawl|spider|Lighthouse/i.test(navigator.userAgent)&&!window.__USO_PRUEBA)return;
setTimeout(()=>suma("ab"),3000);   // una apertura

// fichas abiertas: qué tipo y cuál (se mira el título y el botón de marcar: «Hecha» = ruta, «Subida» = cumbre, «He estado» = lugar)
let ultF="",ultT=0;
function mira(){const s=document.getElementById("sheet");if(!s||s.hidden)return;const h=s.querySelector("h2");if(!h)return;
  const t=h.textContent.trim();if(!t||(t===ultF&&Date.now()-ultT<3000))return;
  const bt=[...s.querySelectorAll("button")].map(b=>b.textContent).join("|");
  const k=/✓\s*Hecha/.test(bt)?"r":/✓\s*Subida/.test(bt)?"c":/✓\s*He estado/.test(bt)?"l":"";if(!k)return;
  ultF=t;ultT=Date.now();suma("f"+k);suma(k+"_"+sl(t))}
function engancha(){const s=document.getElementById("sheet");if(!s){setTimeout(engancha,1000);return}
  let tm=0;new MutationObserver(()=>{clearTimeout(tm);tm=setTimeout(mira,400)}).observe(s,{attributes:true,attributeFilter:["hidden"],childList:true,subtree:true})}
engancha();

// toques: enlaces a webs de fuera (blogs) y botones que interesan
const FUERA=/google\.|goo\.gl|wa\.me|whatsapp|wikiloc|openstreetmap|ign\.es|meteoblue|apple\.com|github\.io$/i;
window.addEventListener("click",e=>{try{
  const a=e.target.closest("a[href]");
  if(a&&/^https?:/.test(a.href)){const h=new URL(a.href,location.href).hostname.replace(/^www\.|^m\./,"");
    if(h&&h!==location.hostname&&!FUERA.test(h))suma("b_"+sl(h));
    if(/google\.[a-z.]+\/maps|maps\.google|maps\.app/i.test(a.href)&&/llegar/i.test(a.textContent))suma("cl");return}
  const b=e.target.closest("button,[role=tab],a");if(!b)return;const t=(b.textContent||"").replace(/\s+/g," ").trim().slice(0,60);
  if(/^▶\s*Seguir/.test(t))suma("sg");
  else if(/Grabar$|^⏺/.test(t))suma("gr");
  else if(/Guardar track/.test(t))suma("gt");
  else if(/^📤\s*Compartir|Enviar el archivo GPX/.test(t))suma("sh");
  else if(/Guardar la zona|Guardar lo que se ve|mapa de la zona|Guardar el mapa/i.test(t))suma("md");
  else if(/Cómo llegar/.test(t))suma("cl");
  else if(/^SOS$/.test(t))suma("sos");
  const tab=b.closest("nav.tabs,.tabbar,.bnav");if(tab&&/^(Mapa|Explorar|Salidas|Mis cosas|Retos)$/.test(t))suma("t_"+sl(t));
}catch(er){}},true);

// búsquedas (una por búsqueda, al dejar de escribir)
let qt=0,ultQ="";
document.addEventListener("input",e=>{const i=e.target;if(!(i instanceof HTMLInputElement))return;if(!i.closest("#msearch,.msearch,[role=search]")&&!/busca/i.test(i.placeholder||""))return;
  clearTimeout(qt);qt=setTimeout(()=>{const v=i.value.trim();if(v.length>=3&&v!==ultQ){ultQ=v;suma("bs")}},2500)},true);
})();
