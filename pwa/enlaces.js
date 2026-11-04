/* ---------- 📤 compartir cumbres y lugares  ·  🔗 abrir enlaces de otras apps ----------
   · En la ficha de una cumbre o un lugar (del grupo o de un colaborador) sale «📤 Compartir»: manda el nombre y un enlace
     #pt=lat,lon!nombre que abre ese mismo punto en la app.
   · «🔗 Pegar un enlace» (Mis cosas › Tracks) y lo que llega por «Compartir › LdC Rutas» con texto:
     - enlace de un punto (Google Maps, Organic Maps, coordenadas) → se ve en el mapa (y se puede guardar en Mis cosas)
     - enlace de una ruta de Wikiloc, Strava, Komoot, AllTrails, Ztrails… → esas webs no dejan llevarse el track,
       así que se explica cómo bajar el GPX en esa app y abrirlo aquí. */
(function(){
const MPI=window.MISPUNTOS;
// el mapa de Wikiloc en una zona (km = mitad del lado del recuadro, unos 3 km por defecto)
const wkUrl=window.wkUrl=(la,lo,km)=>{const dy=(km||3.3)/111.2,dx=dy/Math.cos(la*Math.PI/180);
  return`https://es.wikiloc.com/wikiloc/map.do?sw=${(la-dy).toFixed(4)}%2C${(lo-dx).toFixed(4)}&ne=${(la+dy).toFixed(4)}%2C${(lo+dx).toFixed(4)}&page=1`};
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
  const g=c.querySelector('a[href*="google.com/maps"]'),dl=c.querySelector("[data-ll]");let m=dl?/(-?\d+\.\d+),(-?\d+\.\d+)/.exec(dl.dataset.ll):g&&/(?:query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/.exec(g.getAttribute("href"));
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
  const wk=wkUrl(d.lat,d.lon);
  const b=`<button class="btn ghost" data-ptshare>📤 Compartir</button><a class="btn ghost" href="${wk}" target="_blank" rel="noopener">🔎 Más rutas por aquí (Wikiloc)</a>`;
  const acts=c.querySelector(".actions");if(acts)acts.insertAdjacentHTML("beforeend",b);
  else c.querySelector(".mkblock").insertAdjacentHTML("afterend",`<div class="actions" style="margin-top:8px">${b}</div>`)}
for(const id of ["sheet","ov"]){const el=document.getElementById(id);if(!el)continue;
  let t=0;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{if(!el.hidden)pon(el)},60)}).observe(el,{childList:true,subtree:id==="ov"});
  el.addEventListener("click",e=>{if(!e.target.closest("[data-ptshare]")||!el._pt)return;const d=el._pt;
    const a=typeof d.alt==="number"?d.alt.toLocaleString("es-ES")+" m":(d.alt||"");
    const url=APPURL+"#pt="+d.lat.toFixed(5)+","+d.lon.toFixed(5)+"!"+encodeURIComponent(d.n);
    mandar(d.n,(d.cum?"⛰️ ":"📍 ")+d.n+(a?" · "+a:"")+(d.co?"\nDe "+d.co:"")+"\n🗺 Ábrelo en la app de Los de las Claras:",url)})}

/* ---- fichas de ruta ordenadas: ▶ Seguir arriba a lo ancho y el resto en una rejilla de dos columnas, sin botones cortados ni repetidos.
   Vale para las rutas del grupo (en el mapa y a pantalla completa), las de los colaboradores y Mis cosas › Tracks.
   Incluye ⌚ Enviar al reloj: el GPX al menú de compartir del móvil, para elegir la app del reloj (Suunto, COROS…) ---- */
document.head.insertAdjacentHTML("beforeend",`<style>
.acts2{margin:12px 0 8px}
.acts2 .aprim .btn{display:flex;width:100%;justify-content:center;font-size:17px;padding:13px;box-sizing:border-box;margin:0}
.acts2 .agrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.acts2 .ados{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.acts2 .ados>*{display:flex;align-items:center;justify-content:center;text-align:center;width:100%;min-height:50px;margin:0;padding:8px 6px;box-sizing:border-box;line-height:1.2;font-size:16px;font-weight:700}
.acts2 .ados .segb{border:2px solid var(--ink);color:var(--ink);background:var(--card)}
.acts2 .sintrack{border:1px dashed var(--edge,#ccc);border-radius:12px;color:var(--muted,#777);font-weight:600;background:transparent;cursor:default}
.acts2 .amas{margin-top:8px}
.acts2 .amas>summary{list-style:none;cursor:pointer;text-align:center;font-weight:700;padding:12px;border:1px solid var(--edge,#ddd);border-radius:12px;color:var(--ink)}
.acts2 .amas>summary::-webkit-details-marker{display:none}
.acts2 .amas[open]>summary{border-bottom-left-radius:0;border-bottom-right-radius:0}
.acts2 .agrid>*{display:flex;align-items:center;justify-content:center;text-align:center;width:100%;min-height:48px;margin:0;padding:8px 6px;box-sizing:border-box;white-space:normal;line-height:1.2;font-size:15px}
.acts2 .agrid>.blogb{border-color:var(--mark,#c3262e);color:var(--mark,#c3262e);font-weight:800}
</style>`);
const PRIM="[data-follow],[data-cofol],[data-mtfol]";
const FUERA=".rows,.plist,.mk,.sheet-head,.ovbar,.rest,.near,.mbw,.wx";
const href=(el,re)=>el.tagName==="A"&&re.test(el.getAttribute("href")||"");
const ORD=[
  ["blog",el=>el.tagName==="A"&&!href(el,/wikiloc|google/i)&&/blog|leer/i.test(el.textContent),"📖 Leer en el blog"],
  ["save",el=>el.matches("[data-mtsave],[data-cosave]"),"☆ Guardar en mis tracks"],
  ["share",el=>el.matches("[data-share],[data-coshare],[data-mtshare]"),"📤 Compartir"],
  ["reloj",el=>el.matches("[data-reloj]"),"⌚ Enviar al reloj"],
  ["gpx",el=>el.matches("[data-gpx],[data-cogpx]"),"⬇ Descargar GPX"],
  ["off",el=>el.matches("[data-offr]"),null],
  ["llegar",el=>href(el,/google\.[a-z.]+\/maps\/dir/),"🚗 Cómo llegar a la salida"],
  ["mapa",el=>el.matches("[data-ovmap]"),null],
  ["ruta",el=>el.matches("[data-mtroute]"),null],
  ["wl",el=>href(el,/wikiloc\./i)&&!el.matches("[data-wkz]"),"Ver en Wikiloc"],
  ["wkz",el=>el.matches("[data-wkz]"),null],
  ["gm",el=>href(el,/google\.[a-z.]+\/maps\/search/),"📍 Google Maps"]];
/* nov 2026 · molde único de ficha: 📖 Leer en el blog grande · ▶ Seguir (o «Sin track») + 📤 Compartir · «··· Más opciones» con el resto.
   Debajo del título solo: de qué blog es, ❄ Invernal y el año. El tiempo pasa a «Más opciones» (☁ Ver el tiempo). */
function limpia(c){
  if(c.querySelector(".fpt"))return;   // ficha de cumbre/lugar nueva: ya viene hecha
  const ruta=!!(c.querySelector(".grab[data-route]")||c.querySelector(".mkblock.rmk")||c.querySelector("[data-follow],[data-cofol]"));if(!ruta)return;
  // título de colaborador sin la zona delante («Picos de Europa | …»)
  const h2=c.querySelector(".sheet-head h2");if(h2&&/\|/.test(h2.textContent)&&!h2.dataset.lp){h2.dataset.lp=1;h2.textContent=h2.textContent.split("|").pop().trim()}
  // una sola fila de marcas: la de la ruta
  if(c.querySelector(".mkblock.rmk"))c.querySelectorAll(".mkblock:not(.rmk)").forEach(x=>{if(!x.closest(FUERA))x.remove()});
  // datos (km, desnivel, duración, dificultad) sin cuadros vacíos: 1–3 en una fila; 4 en dos filas de dos
  c.querySelectorAll(".ficha").forEach(f=>{const n=f.children.length;f.style.gridTemplateColumns=`repeat(${n===4?2:Math.min(n,3)||1},1fr)`});
  // etiquetas
  const me=[...c.querySelectorAll(".meta")].find(x=>!x.closest(FUERA));
  if(me&&!me.dataset.lp){me.dataset.lp=1;let ano=false,src=false;
    for(const t of [...me.querySelectorAll(".tag")]){const tx=t.textContent;
      if(t.classList.contains("iv"))continue;
      if(t.hasAttribute("style")){src=true;continue}
      const y=/\b(19|20)\d{2}\b/.exec(tx);if(y&&!ano){ano=true;t.textContent=y[0];continue}
      t.remove()}
    if(!src&&c.querySelector(".grab[data-route],[data-follow],[data-share]"))me.insertAdjacentHTML("afterbegin",`<span class="tag" style="background:#c3262e;color:#fff;border-color:#c3262e">Los de las Claras</span>`)}
  // el tiempo: fuera de la ficha; sus enlaces van a «Más opciones»
  for(const h of [...c.querySelectorAll(".sec>h3")])if(/^el tiempo$/i.test(h.textContent.trim())){const sec=h.parentNode;
    const mb=sec.querySelector('a[href*="meteoblue"]'),ae=sec.querySelector('a[href*="aemet"]');
    if(mb){mb.textContent="☁ Ver el tiempo";mb.dataset.wxl="1";sec.before(mb)}if(ae){ae.textContent="☁ "+ae.textContent.trim();ae.dataset.wxl="1";sec.before(ae)}sec.remove()}}
function ordena(c){if(!c||c.hidden)return;
  try{limpia(c)}catch(e){console.error(e)}
  if(c.querySelector(".fpt"))return;
  const pr=[...c.querySelectorAll(PRIM)].find(x=>!x.closest(FUERA));
  const ruta=!!(pr||c.querySelector(".grab[data-route]")||c.querySelector(".mkblock.rmk"));if(!ruta)return;
  // ⌚ si no está
  if(pr&&!c.querySelector("[data-reloj]")&&(pr.matches("[data-follow],[data-mtfol]")||(pr.matches("[data-cofol]")&&c.id==="sheet")))pr.insertAdjacentHTML("afterend",`<button class="btn ghost" data-reloj></button>`);
  // 🔎 más rutas por esta zona en Wikiloc (en su mapa), desde la salida de la ruta
  if(pr&&!c.querySelector("[data-wkz]")){let ll=null;
    if(pr.matches("[data-follow]")){const r=R[+pr.dataset.follow];if(r)ll=[r.lat,r.lon]}
    else if(pr.matches("[data-cofol]")&&c.id==="sheet"&&sheet._cor){ll=sheet._cor.c.r[sheet._cor.i][8]}
    else if(pr.matches("[data-mtfol]")&&MPI){const t=MPI.tracks().find(x=>String(x.id)===pr.dataset.mtfol),q=t&&MPI.ptsOf(t);if(q&&q.length)ll=q[0]}
    if(ll)pr.insertAdjacentHTML("afterend",`<a class="btn ghost" data-wkz href="${wkUrl(ll[0],ll[1])}" target="_blank" rel="noopener">🔎 Más rutas por aquí (Wikiloc)</a>`)}
  let box=c.querySelector(".acts2");
  if(!box){const anc=pr||[...c.querySelectorAll(".actions,.topacts")].find(x=>!x.closest(FUERA));if(!anc)return;
    const ta=anc.closest(".topacts")||(anc.matches(".actions,.topacts")?anc:anc.parentNode);
    ta.insertAdjacentHTML("beforebegin",`<div class="acts2"><div class="aprim"></div><div class="ados"></div><details class="amas"><summary>··· Más opciones</summary><div class="agrid"></div></details></div>`);box=ta.previousElementSibling;
    // debajo de los datos de la ruta (km, desnivel, dificultad y salida), no encima de la descripción
    const base=box.parentNode,dat=[...base.children].filter(x=>x.matches(".ficha,.salida"));if(dat.length){const ul=dat[dat.length-1];if(ul.compareDocumentPosition(box)&Node.DOCUMENT_POSITION_PRECEDING)ul.after(box)}}
  const ap=box.querySelector(".aprim"),ad=box.querySelector(".ados"),ag=box.querySelector(".agrid");
  const els=[...c.querySelectorAll("button,a")].filter(x=>!x.closest(FUERA)&&!ap.contains(x)&&!ad.contains(x)&&x.tagName!=="SUMMARY"&&!x.closest("summary"));
  const vistos=new Set();let blog=null,share=null;const resto=[];
  for(const[k,f,lab]of ORD)for(const el of els){if(!f(el)||el===pr)continue;
    if(vistos.has(k)){el.remove();continue}   // repetido (p. ej. «Compartir esta ruta» al final)
    vistos.add(k);if(lab)el.textContent=lab;el.classList.remove("primary","blogb");el.classList.add("btn","ghost");
    if(k==="blog")blog=el;else if(k==="share")share=el;else resto.push(el)}
  for(const el of els)if(el.dataset&&el.dataset.wxl&&!resto.includes(el))resto.push(el);
  // 📖 grande (si no hay blog, ▶ Seguir grande)
  const grande=ap.firstElementChild?null:(blog||pr);
  if(grande){if(grande===blog){blog.classList.remove("ghost");blog.classList.add("primary")}ap.appendChild(grande)}
  if(pr){pr.textContent="▶ Seguir";if(!ap.contains(pr)){pr.classList.remove("primary");pr.classList.add("btn","ghost","segb");if(pr.parentNode!==ad)ad.appendChild(pr)}}
  else if(!ad.querySelector(".sintrack")&&!c.querySelector("[data-mtfol]"))ad.insertAdjacentHTML("afterbegin",`<span class="sintrack" title="Esta ruta no tiene track para seguirla">Sin track</span>`);
  if(share&&share.parentNode!==ad)ad.appendChild(share);
  {const sh=ad.querySelector("[data-share],[data-coshare],[data-mtshare]");const solo=[...ad.children].filter(x=>getComputedStyle(x).display!=="none").length===1;if(sh)sh.style.gridColumn=solo?"1 / -1":""}
  for(const el of resto)if(el.parentNode!==ag)ag.appendChild(el);
  box.querySelector(".amas").hidden=!ag.children.length;
  // contenedores que se han quedado vacíos
  c.querySelectorAll(".topacts,.actions").forEach(x=>{if(!x.closest(".acts2")&&!x.children.length)x.remove()})}
for(const id of ["sheet","ov"]){const el=document.getElementById(id);if(!el)continue;let t=0,ocupado=false;
  new MutationObserver(()=>{if(ocupado)return;clearTimeout(t);t=setTimeout(()=>{ocupado=true;try{ordena(el)}catch(e){console.error(e)}setTimeout(()=>ocupado=false,0)},50)}).observe(el,{childList:true,subtree:true})}
document.addEventListener("click",async e=>{if(!e.target.closest("[data-reloj]"))return;const c=e.target.closest("#sheet,#ov");if(!c)return;
  if(!window.enviaGpx){toast("No se ha podido preparar el GPX");return}
  const aviso=()=>setTimeout(()=>toast("Elige la app de tu reloj (Suunto, COROS…). Garmin y Polar: importa el GPX en su web (Garmin Connect › Cursos, Polar Flow › Rutas).",7000),900);
  const m=c.querySelector("[data-mtfol]");
  if(m&&MPI){const t=MPI.tracks().find(x=>String(x.id)===m.dataset.mtfol);if(!t)return;let ll=MPI.ptsOf(t);   // Mis cosas › Tracks
    if(!ll&&window.loadTracks){toast("Preparando el track…");await loadTracks();ll=MPI.ptsOf(t)}
    if(!ll||ll.length<2){toast("Sin conexión: no puedo preparar el GPX ahora");return}enviaGpx(t.n,ll);aviso();return}
  const g=c.querySelector("[data-follow]");
  if(g){const r=R[+g.dataset.follow];if(!r||!r.gx){toast("Esta ruta no tiene track");return}
    if(!r.gx.ln){toast("Preparando el track…");const ok=window.loadTracks?await loadTracks():false;if(!ok||!r.gx.ln){toast("Sin conexión: no puedo preparar el GPX ahora");return}}
    enviaGpx(routeTitle(r),r.gx.ln);aviso();return}
  const k=sheet._cor;if(!k||!window.COLX||!COLX.ln)return;const ll=await COLX.ln(k.c,k.i);if(!ll||ll.length<2){toast("No tengo el track de esta ruta");return}
  enviaGpx(k.c.r[k.i][0],ll);aviso()});

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
