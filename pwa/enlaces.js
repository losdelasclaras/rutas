/* ---------- 📤 compartir cumbres y lugares  ·  🔗 abrir enlaces de otras apps ----------
   · En la ficha de una cumbre o un lugar (del grupo o de un colaborador) sale «📤 Compartir»: manda el nombre y un enlace
     #pt=lat,lon!nombre que abre ese mismo punto en la app.
   · «🔗 Pegar un enlace» (Mis cosas › Tracks) y lo que llega por «Compartir › LdC Rutas» con texto:
     - enlace de un punto (Google Maps, Organic Maps, coordenadas) → se ve en el mapa (y se puede guardar en Mis cosas)
     - enlace de una ruta de Wikiloc, Strava, Komoot, AllTrails, Ztrails… → esas webs no dejan llevarse el track,
       así que se explica cómo bajar el GPX en esa app y abrirlo aquí. */
(function(){
const MPI=window.MISPUNTOS;
const nrm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
const dkm=(a,b,c,d)=>Math.hypot((a-c)*111.2,(b-d)*111.2*Math.cos(a*Math.PI/180));
async function mandar(title,text,url){
  try{if(navigator.share){await navigator.share({title,text,url});return}}catch(e){if(e&&e.name==="AbortError")return}
  try{await navigator.clipboard.writeText(text+"\n"+url);toast("Enlace copiado. Pégalo en WhatsApp.")}catch(e){window.open("https://wa.me/?text="+encodeURIComponent(text+"\n"+url),"_blank","noopener")}}

/* ---- 1. botón en las fichas de cumbres y lugares ---- */
function datosFicha(c){
  const h2=c.querySelector(".sheet-head h2");if(!h2)return null;
  if(c.querySelector("[data-share],[data-coshare],[data-follow],[data-cofol],[data-mtfol],[data-mpedit],[data-tmpcs],[data-ptshare]"))return null;
  const mk=c.querySelector(".mkblock .mk[data-key]");if(!mk)return null;const key=mk.dataset.key;if(!/^[cl]:/.test(key))return null;
  // sitio: el enlace de Google Maps de la ficha o, si no, el punto del grupo con ese nombre
  const g=c.querySelector('a[href*="google.com/maps"]');let m=g&&/(?:query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/.exec(g.getAttribute("href"));
  let lat,lon,alt=null;
  if(m){lat=+m[1];lon=+m[2]}
  else if(typeof P!=="undefined"){const k=key.slice(2).split("@")[0];const ps=P.filter(p=>nrm(p.c)===k);if(!ps.length)return null;const ce=map.getCenter();
    const p=ps.sort((a,b)=>dkm(a.lat,a.lon,ce.lat,ce.lng)-dkm(b.lat,b.lon,ce.lat,ce.lng))[0];lat=p.lat;lon=p.lon;alt=p.a||null}
  else return null;
  const at=c.querySelector(".meta .tag.alt");if(!alt&&at)alt=at.textContent.trim();
  const co=c.querySelector(".meta .tag[style]");
  return{n:h2.textContent.trim(),lat,lon,alt,cum:key[0]==="c",co:co?co.textContent.trim():""}}
function pon(c){const d=datosFicha(c);if(!d)return;c._pt=d;
  // 🔎 más rutas por aquí en Wikiloc: su mapa centrado en este punto (unos 3 km alrededor). No se saca nada de Wikiloc: solo se enlaza
  const wk=`https://es.wikiloc.com/wikiloc/map.do?sw=${(d.lat-.03).toFixed(4)}%2C${(d.lon-.04).toFixed(4)}&ne=${(d.lat+.03).toFixed(4)}%2C${(d.lon+.04).toFixed(4)}&page=1`;
  const b=`<button class="btn ghost" data-ptshare>📤 Compartir</button><a class="btn ghost" href="${wk}" target="_blank" rel="noopener">🔎 Más rutas por aquí (Wikiloc)</a>`;
  const acts=c.querySelector(".actions");if(acts)acts.insertAdjacentHTML("beforeend",b);
  else c.querySelector(".mkblock").insertAdjacentHTML("afterend",`<div class="actions" style="margin-top:8px">${b}</div>`)}
for(const id of ["sheet","ov"]){const el=document.getElementById(id);if(!el)continue;
  let t=0;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{if(!el.hidden)pon(el)},60)}).observe(el,{childList:true,subtree:id==="ov"});
  el.addEventListener("click",e=>{if(!e.target.closest("[data-ptshare]")||!el._pt)return;const d=el._pt;
    const a=typeof d.alt==="number"?d.alt.toLocaleString("es-ES")+" m":(d.alt||"");
    const url=APPURL+"#pt="+d.lat.toFixed(5)+","+d.lon.toFixed(5)+"!"+encodeURIComponent(d.n);
    mandar(d.n,(d.cum?"⛰️ ":"📍 ")+d.n+(a?" · "+a:"")+(d.co?"\nDe "+d.co:"")+"\n🗺 Ábrelo en la app de Los de las Claras:",url)})}

/* ---- ⌚ Enviar al reloj: el GPX de la ruta al menú de compartir del móvil, para elegir la app del reloj (Suunto, COROS…) ---- */
{const sh=document.getElementById("sheet");let t=0;
 const pon3=()=>{if(sh.hidden||sh.querySelector("[data-reloj]"))return;const ta=sh.querySelector(".topacts");if(!ta)return;
   const g=sh.querySelector("[data-share]"),c=sh.querySelector("[data-coshare]")&&sh._cor;if(!g&&!c)return;
   ta.insertAdjacentHTML("beforeend",`<button class="btn ghost" data-reloj>⌚ Enviar al reloj</button>`)};
 new MutationObserver(()=>{clearTimeout(t);t=setTimeout(pon3,60)}).observe(sh,{childList:true});
 sh.addEventListener("click",async e=>{if(!e.target.closest("[data-reloj]"))return;if(!window.enviaGpx){toast("No se ha podido preparar el GPX");return}
   const aviso=()=>setTimeout(()=>toast("Elige la app de tu reloj (Suunto, COROS…). Garmin y Polar: importa el GPX en su web (Garmin Connect › Cursos, Polar Flow › Rutas).",7000),900);
   const g=sh.querySelector("[data-share]");
   if(g){const r=R[+g.dataset.share];if(!r||!r.gx){toast("Esta ruta no tiene track");return}
     if(!r.gx.ln){toast("Preparando el track…");const ok=window.loadTracks?await loadTracks():false;if(!ok||!r.gx.ln){toast("Sin conexión: no puedo preparar el GPX ahora");return}}
     enviaGpx(routeTitle(r),r.gx.ln);aviso();return}
   const k=sh._cor;if(!k||!window.COLX||!COLX.ln)return;const ll=await COLX.ln(k.c,k.i);if(!ll||ll.length<2){toast("No tengo el track de esta ruta");return}
   enviaGpx(k.c.r[k.i][0],ll);aviso()})}

/* ---- abrir #pt=lat,lon!nombre ---- */
function abrirPunto(lat,lon,n,tries){
  const k=nrm(n);
  if(typeof P!=="undefined"){let bi=-1,bd=.4;P.forEach((p,i)=>{if(nrm(p.c)!==k)return;const d=dkm(p.lat,p.lon,lat,lon);if(d<bd){bd=d;bi=i}});
    if(bi>=0){if(typeof ovCloseAll==="function")ovCloseAll();showView("mapa");setTimeout(()=>{pickRoute(bi);flyTo(P[bi].lat,P[bi].lon,13)},250);return}}
  const ci=window.COLX&&COLX.findPt?COLX.findPt(n,lat,lon):-1;
  if(ci>=0){COLX.open(ci);return}
  if(!window.COLX&&(tries||0)<10){setTimeout(()=>abrirPunto(lat,lon,n,(tries||0)+1),500);return}   // los colaboradores cargan después
  verPunto(lat,lon,n)}
function verPunto(lat,lon,n,nota){if(!MPI||!MPI.verCompartidos){showView("mapa");flyTo(lat,lon,14);return}
  MPI.verCompartidos({n:n||"Punto",ps:[{n:n||"Punto",lat,lon,ic:"",a:null}],ts:[]});
  setTimeout(()=>{const s=document.getElementById("sheet");if(!s)return;const h=s.querySelector(".sheet-head h2");if(h)h.textContent=h.textContent.replace(/^📁/,"📍");
    s.querySelector(".note")?.insertAdjacentHTML("afterend",`${nota?`<p class="note">${nota}</p>`:""}<div class="actions"><a class="btn ghost" href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" rel="noopener">🚗 Cómo llegar</a>${window.CERCA&&CERCA.en?`<button class="btn ghost" data-ptcerca="${lat},${lon}">🎯 Rutas cerca de aquí</button>`:""}</div>`)},50)}
document.addEventListener("click",e=>{const b=e.target.closest("[data-ptcerca]");if(!b)return;const[a,o]=b.dataset.ptcerca.split(",").map(Number);CERCA.en(a,o,"este punto")});
function leeHash(){const h=location.hash||"";const m=/^#pt=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)!?(.*)$/.exec(h);if(!m)return;
  try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}
  abrirPunto(+m[1],+m[2],decodeURIComponent(m[3]||""))}
addEventListener("hashchange",leeHash);setTimeout(leeHash,700);

/* ---- 2. enlaces de otras apps ---- */
const APPS=[
  [/wikiloc\./i,"Wikiloc",["Abre la ruta en Wikiloc (mejor en la web, wikiloc.com).","Toca <b>Descargar</b> y elige <b>GPX</b>. Wikiloc pide entrar con tu cuenta (gratis)."]],
  [/strava\./i,"Strava",["Abre la ruta o la actividad en la web de Strava (strava.com), no en su app: la app no deja descargar.","Ruta: botón <b>Exportar GPX</b>. Actividad: menú <b>⋯ › Exportar GPX</b>. Solo con tus rutas o las públicas."]],
  [/komoot\./i,"Komoot",["Abre el tour en komoot.com y entra con tu cuenta.","Toca <b>⋯ › Descargar</b> (o «Exportar») y elige <b>GPX</b>."]],
  [/alltrails\./i,"AllTrails",["Abre la ruta en alltrails.com y entra con tu cuenta.","Toca <b>⋯ › Descargar ruta</b> y elige <b>GPX</b>. Con la cuenta gratuita a veces solo deja desde la web."]],
  [/ztrails\./i,"Ztrails",["Abre la ruta en Ztrails.","Busca <b>Descargar</b> o <b>Exportar</b> y elige <b>GPX</b>."]],
  [/outdooractive\./i,"Outdooractive",["Abre la ruta en outdooractive.com y entra con tu cuenta.","Toca <b>Descargar</b> y elige <b>GPX</b>."]],
  [/(ign\.es|iberpix)/i,"IGN",["Abre la ruta en la web del IGN.","Busca <b>Descargar</b> y elige <b>GPX</b>."]]];
function ge0(code){const A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",s=code.slice(1,10);if(s.length<4)return null;
  let la=0,lo=0,sh=27;for(const ch of s){const a=A.indexOf(ch);if(a<0)return null;
    la|=((((a>>5)&1)<<2)|(((a>>3)&1)<<1)|((a>>1)&1))<<sh;lo|=((((a>>4)&1)<<2)|(((a>>2)&1)<<1)|(a&1))<<sh;sh-=3}
  const mid=1<<(3*(10-s.length)-1),M=(1<<30)-1;la+=mid;lo+=mid;return[la/M*180-90,lo/(M+1)*360-180]}
function punto(t){let m;
  if((m=/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/.exec(t)))return[+m[1],+m[2]];
  if((m=/[?&](?:q|query|destination|ll|center|daddr)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i.exec(t)))return[+m[1],+m[2]];
  if((m=/@(-?\d+\.\d+),(-?\d+\.\d+)/.exec(t)))return[+m[1],+m[2]];
  if((m=/(?:omaps\.app|ge0\.me|ge0:\/)\/+([A-Za-z0-9_-]{5,10})/.exec(t))){const p=ge0(m[1]);if(p)return p}
  if((m=/(-?\d{1,2}\.\d+)\s*[,;]\s*(-?\d{1,3}\.\d+)/.exec(t)))return[+m[1],+m[2]];
  return null}
function nombreDe(t){let m=/(?:omaps\.app|ge0\.me)\/[A-Za-z0-9_-]+\/([^\s?#]+)/.exec(t);if(m)return decodeURIComponent(m[1]).replace(/_/g," ");
  m=/\/place\/([^/@]+)/.exec(t);if(m)return decodeURIComponent(m[1]).replace(/\+/g," ");
  const l=t.split("\n").map(x=>x.trim()).find(x=>x&&!/https?:\/\//.test(x)&&!/^-?\d/.test(x));return l?l.slice(0,60):"Punto"}
function abrirTexto(t){t=String(t||"").trim();if(!t)return;
  const pt=/#pt=|#t=|#co=|#yo=/.exec(t);if(pt&&/losdelasclaras\.github\.io/.test(t)){location.hash=t.slice(t.indexOf("#"));return}
  const p=punto(t);
  if(p&&p[0]>=-90&&p[0]<=90&&p[1]>=-180&&p[1]<=180){if(p[0]<27||p[0]>56||p[1]<-19||p[1]>25){ayuda(null,t,"Ese enlace es de un sitio muy lejos de nuestras montañas. Comprueba que es el que querías.");return}
    verPunto(p[0],p[1],nombreDe(t));return}
  const ap=APPS.find(a=>a[0].test(t));
  if(/maps\.app\.goo\.gl|goo\.gl\/maps|omaps\.app|ge0\.me/i.test(t)){ayuda(null,t,"No puedo leer el sitio de ese enlace corto. En Google Maps, mantén pulsado el punto y copia las coordenadas que salen arriba (por ejemplo 43.1234, -5.6789); en Organic Maps, toca el punto y copia sus coordenadas. Pégalas aquí.");return}
  ayuda(ap,t)}
function ayuda(ap,t,nota){if(!MPI)return;
  MPI.show(`<div class="sheet-head"><h2>🔗 ${ap?"Ruta de "+ap[1]:"Enlace"}</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
  ${nota?`<p class="note">${nota}</p>`:ap?`<p class="note">${ap[1]} no deja que otra app se lleve sus tracks, así que hay que pasar por un archivo GPX. Son dos pasos:</p>
  <ol class="lpasos">${ap[2].map(x=>`<li>${x}</li>`).join("")}<li>Abre ese archivo con <b>LdC Rutas</b> (en el móvil: «Abrir con» o «Compartir › LdC Rutas»), o aquí en <b>Mis cosas › Tracks › ⬆️ Cargar GPX/KML</b>. Luego le das a <b>▶ Seguir</b> como en nuestras rutas.</li></ol>
  <div class="actions"><a class="btn primary" href="${esc((/https?:\/\/\S+/.exec(t)||[""])[0])}" target="_blank" rel="noopener">Abrir en ${ap[1]}</a><button class="btn ghost" data-ptgpx>⬆️ Ya tengo el GPX</button></div>`
  :`<p class="note">No reconozco ese enlace. Puedes pegar el enlace de un punto (Google Maps, Organic Maps o unas coordenadas) o el de una ruta de Wikiloc, Strava, Komoot, AllTrails o Ztrails.</p>`}`)}
document.head.insertAdjacentHTML("beforeend",`<style>.lpasos{margin:6px 0 10px 20px;padding:0}.lpasos li{margin:6px 0;line-height:1.4}
.lnk textarea{width:100%;min-height:84px;border:1px solid var(--edge);border-radius:12px;padding:10px;font:inherit;background:var(--card);color:inherit;box-sizing:border-box}</style>`);
function pegar(){if(!MPI)return;
  MPI.show(`<div class="sheet-head"><h2>🔗 Pegar un enlace</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
  <p class="note">De un punto (Google Maps, Organic Maps, unas coordenadas) o de una ruta de Wikiloc, Strava, Komoot, AllTrails o Ztrails.</p>
  <div class="lnk"><textarea id="lnktxt" placeholder="Pega aquí el enlace"></textarea></div>
  <div class="actions"><button class="btn primary" data-lnkok>Abrir</button></div>`);
  const ta=document.getElementById("lnktxt");setTimeout(()=>ta&&ta.focus(),100);
  if(navigator.clipboard&&navigator.clipboard.readText)navigator.clipboard.readText().then(x=>{if(x&&/https?:\/\/|\d+\.\d+\s*,/.test(x)&&ta&&!ta.value)ta.value=x.trim()}).catch(()=>{})}
document.addEventListener("click",e=>{
  if(e.target.closest("[data-lnkok]")){const ta=document.getElementById("lnktxt");abrirTexto(ta?ta.value:"");return}
  if(e.target.closest("[data-ptgpx]")&&MPI){MPI.importar();return}
  if(e.target.closest('[data-mtx="lnk"]')){pegar();return}});
// botón en Mis cosas › Tracks, junto a «Cargar GPX/KML»
// (3 nov) quitado el botón «🔗 Pegar un enlace» de Mis cosas: a él no le parecía útil. Lo que llega por «Compartir › LdC Rutas» se sigue abriendo.
window.ENLACES={abrirTexto,punto,ge0};
})();
