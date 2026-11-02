/* ---------- «Yo»: ubicación en directo ----------
   1.er toque: el punto azul te sigue y el mapa se mueve contigo.
   Si mueves el mapa con el dedo deja de centrarte (el punto se sigue moviendo); otro toque vuelve a centrarte.
   Tocar con el mapa ya centrado en ti: se apaga. */
(function(){
const old=document.getElementById("b-me");if(!old)return;
const b=old.cloneNode(true);old.replaceWith(b);   // quita el comportamiento antiguo (una sola vez)
document.head.insertAdjacentHTML("beforeend",`<style>
#b-me.vivo{box-shadow:0 0 0 4px rgba(26,115,232,.35),0 2px 8px rgba(0,0,0,.25);animation:yov 1.6s ease-in-out infinite}
#b-me.vivo.suelto{animation:none;background:#fff!important;color:#1a73e8!important;border-color:#1a73e8!important}
@keyframes yov{0%,100%{box-shadow:0 0 0 3px rgba(26,115,232,.35)}50%{box-shadow:0 0 0 9px rgba(26,115,232,.12)}}
</style>`);
let W=null,W2=null,SIGUE=true,PRIMERO=true,UFINO=0;
// dos fuentes a la vez: el GPS (preciso, pero dentro de casa puede no llegar) y la aproximada del móvil (wifi y datos, al momento, como Google Maps).
// La aproximada solo se usa mientras no haya GPS reciente; en cuanto llega el GPS, manda él.
const OPF={enableHighAccuracy:true,maximumAge:3000,timeout:20000},OPA={enableHighAccuracy:false,maximumAge:60000,timeout:20000};
function gpsOk(p){UFINO=Date.now();window.__meLL=[p.coords.latitude,p.coords.longitude];fix(p)}
function aprox(p){if(Date.now()-UFINO<30000)return;window.__meLL=[p.coords.latitude,p.coords.longitude];fix(p,true)}
function mirar(){W=navigator.geolocation.watchPosition(gpsOk,err,OPF);W2=navigator.geolocation.watchPosition(aprox,()=>{},OPA)}
function soltar(){if(W!=null)navigator.geolocation.clearWatch(W);if(W2!=null)navigator.geolocation.clearWatch(W2);W=W2=null}
function apaga(msg){soltar();b.classList.remove("vivo","suelto");if(msg)toast(msg)}
function fix(p,ap){const la=p.coords.latitude,lo=p.coords.longitude;
  if(typeof showMe==="function")showMe(la,lo,p.coords.accuracy);
  if(PRIMERO){PRIMERO=false;try{ensureZone(zoneAt(la,lo))}catch(e){}map.flyTo([la,lo],Math.max(map.getZoom(),15),{duration:.8});toast(ap?"Estás por aquí (aproximado, con wifi y datos); afinando con el GPS…":"Estás aquí (punto azul)");return}
  if(SIGUE)map.panTo([la,lo],{animate:true,duration:.5})}
function err(e){if(e&&e.code===1)apaga("Sin permiso de ubicación: actívalo en los ajustes del móvil para el navegador");
  else if(PRIMERO){let apk=false;try{apk=sessionStorage.getItem("ldc-apk")==="1"}catch(x){}
    toast(apk?"Todavía no te encuentro. Si sigue así, mira que la app tenga permiso: Ajustes › Aplicaciones › Los de las Claras › Permisos › Ubicación":"Todavía no tengo tu ubicación… sigo buscando")}}

b.addEventListener("click",()=>{
  if(!navigator.geolocation){toast("Este móvil no da la ubicación");return}
  if(W!=null){
    if(!SIGUE){SIGUE=true;b.classList.remove("suelto");const c=window.__meLL;toast("Te sigo otra vez");if(c)map.panTo(c);return}
    apaga("Ubicación en directo apagada");return}
  sheet.hidden=true;sheet.classList.remove("full");try{setNear(false)}catch(e){}
  toast("Buscando dónde estás… (el punto te seguirá)");PRIMERO=true;SIGUE=true;b.classList.add("vivo");b.classList.remove("suelto");
  UFINO=0;mirar()});
map.on("dragstart",()=>{if(W!=null&&SIGUE){SIGUE=false;b.classList.add("suelto")}});
// al irte de la app el móvil corta el GPS; al volver, sigue solo
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&W!=null){soltar();mirar()}});
window.YO={apaga,activo:()=>W!=null};
// botón «📍 Punto» en el mapa: guarda un punto donde estás
const fabs=document.querySelector(".fabs");
if(fabs)fabs.insertAdjacentHTML("afterbegin",`<button class="btn ghost" id="b-pt" data-short="Punto" title="Guardar un punto donde estoy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Guardar punto</button>`);
// dentro de la app Android (la del APK): botón «Grabar», que abre la grabadora nativa (graba con la pantalla apagada)
const enApp=(()=>{try{if(document.referrer.startsWith("android-app://es.losdelasclaras.rutas"))sessionStorage.setItem("ldc-apk","1");return sessionStorage.getItem("ldc-apk")==="1"}catch(e){return false}})();
// en el APK los mapas sin cobertura se guardan en la pantalla de grabar (que es donde se usan): fuera los de la web (Mis cosas › Mapas y sus botones)
if(enApp){document.documentElement.classList.add("apk");document.head.insertAdjacentHTML("beforeend",`<style>html.apk [data-offr],html.apk [data-offt],html.apk [data-offzone],html.apk .offhint{display:none!important}</style>`)}
if(enApp&&fabs){fabs.insertAdjacentHTML("afterbegin",`<button class="btn ghost" id="b-grab" data-short="Grabar" title="Grabar recorrido"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4" fill="#c3262e" stroke="none"/></svg>Grabar</button>`);
  document.getElementById("b-grab").addEventListener("click",()=>{location.href="intent://grabar?b="+buzon()+"#Intent;scheme=ldcgrabar;package=es.losdelasclaras.rutas;end"})}
/* en la app del APK, Chrome no le da la ubicación a la web: se la pide a Android (intent://ubicar) y vuelve con #yo=lat,lon,precisión,hora,para.
   Al volver la página se recarga: la posición se guarda un par de minutos y se repite lo que se había tocado (Yo, Cerca de mí, Punto, Más cerca…). */
if(enApp&&navigator.geolocation){const G=navigator.geolocation,gcp=G.getCurrentPosition.bind(G),wp=G.watchPosition.bind(G),cw=G.clearWatch.bind(G);
  const KF="ldc-yo-fresca",fake=f=>({coords:{latitude:f.lat,longitude:f.lon,accuracy:f.acc,altitude:null,altitudeAccuracy:null,heading:null,speed:null},timestamp:f.t});
  const fresca=()=>{try{const f=JSON.parse(sessionStorage.getItem(KF)||"null");return f&&Date.now()-f.t<120000?f:null}catch(e){return null}};
  let PARA="yo",ULT=0;
  document.addEventListener("click",e=>{const t=e.target;PARA=t.closest("#b-pt")?"punto":t.closest("[data-cme],#b-cerca")?"cerca":t.closest("[data-ordgps],[data-ord]")?"orden":t.closest("[data-lnear]")?"listas":t.closest("#b-me")?"yo":PARA},true);
  const pide=()=>{if(Date.now()-ULT<10000)return;ULT=Date.now();location.href="intent://ubicar?p="+PARA+"#Intent;scheme=ldcubicar;package=es.losdelasclaras.rutas;end"};
  G.getCurrentPosition=(ok,err,o)=>{const f=fresca();if(f){setTimeout(()=>ok&&ok(fake(f)),0);return}let hecho=false;
    gcp(p=>{if(!hecho){hecho=true;ok&&ok(p)}},()=>{},o);setTimeout(()=>{if(!hecho)pide()},1500)};
  G.watchPosition=(ok,err,o)=>{const f=fresca();let hubo=false;if(f){hubo=true;setTimeout(()=>ok&&ok(fake(f)),0)}
    const w=wp(p=>{hubo=true;ok&&ok(p)},e=>{if(!hubo)pide();err&&err(e)},o);setTimeout(()=>{if(!hubo)pide()},1500);return w};
  G.clearWatch=k=>cw(k);
  const lee=()=>{const h=location.hash||"";let m=/^#yo=(-?[\d.]+),(-?[\d.]+),(\d+),(\d+),?([a-z]*)/.exec(h),nada=/^#yonada=/.test(h);if(!m&&!nada)return;
    try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}
    if(nada){toast("No he podido saber dónde estás. Mira que la ubicación del móvil esté encendida.");return}
    const f={lat:+m[1],lon:+m[2],acc:+m[3],t:Date.now()},para=m[5]||"yo";try{sessionStorage.setItem(KF,JSON.stringify(f))}catch(e){}
    store.set("ldc-ultpos",{lat:f.lat,lon:f.lon,t:f.t});
    setTimeout(()=>{if(para==="cerca"&&window.CERCA)CERCA.yo();
      else if(para==="punto"&&window.MISPUNTOS&&MISPUNTOS.gps)MISPUNTOS.gps();
      else if(para==="orden"){showView("rutas");renderList()}
      else if(para==="listas"){showView("mios");setTimeout(()=>{const b=document.querySelector("[data-lnear]");if(b)b.click()},300)}
      else{showView("mapa");if(typeof showMe==="function")showMe(f.lat,f.lon,f.acc);map.setView([f.lat,f.lon],Math.max(map.getZoom(),15));toast(f.acc>100?"Estás por aquí (aproximado)":"Estás aquí (punto azul)")}},900)};
  addEventListener("hashchange",lee);setTimeout(lee,600)}
/* en la app del APK, «▶ Seguir» abre la pantalla de grabar del móvil con el track (allí el GPS es el de Android y siempre funciona; se puede grabar a la vez) */
if(enApp){
  window.SEGUIR_NATIVO=function(r,rev){
    if(!r.gx.ln){toast("Preparando el track…");loadTracks().then(ok=>{if(ok&&r.gx.ln)SEGUIR_NATIVO(r,rev);else toast("Sin conexión: no puedo cargar el track ahora")});return}
    let ln=r.gx.ln.map(q=>[+(+q[0]).toFixed(6),+(+q[1]).toFixed(6),q[2]!=null&&isFinite(q[2])?Math.round(q[2]):null]);if(rev)ln.reverse();
    if(ln.length>1500&&window.COMPARTIR&&COMPARTIR.simple){let t=2;while(ln.length>1500&&t<40){ln=COMPARTIR.simple(ln,t);t*=1.5}}
    const n=(typeof routeTitle==="function"&&r.p?routeTitle(r):r.ti||r.n)||"Track";
    location.href="intent://seguir?b="+buzon()+"#Intent;scheme=ldcgrabar;package=es.losdelasclaras.rutas;S.n="+encodeURIComponent(String(n).slice(0,90))+";S.t="+encodeURIComponent(JSON.stringify(ln))+";end"}}
/* buzón: la grabadora del APK deja ahí lo grabado (Firestore buzon/{código}) y aquí se recoge y se guarda en Mis tracks */
function buzon(){let b=null;try{b=localStorage.getItem("ldc-buzon")}catch(e){}
  if(!b||!/^[A-Za-z0-9]{20,40}$/.test(b)){const A="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";b="";for(const x of crypto.getRandomValues(new Uint8Array(24)))b+=A[x%A.length];try{localStorage.setItem("ldc-buzon",b)}catch(e){}}return b}
let RECOG=false;
async function recoger(){let b=null;try{b=localStorage.getItem("ldc-buzon")}catch(e){}if(!b||RECOG||!navigator.onLine||!window.LDCFB||!window.MISPUNTOS)return;RECOG=true;
  try{const a=await LDCFB.load(),fs=a.fs,ref=fs.doc(a.db,"buzon",b),d=await fs.getDoc(ref);
    if(d.exists()){const l=JSON.parse(d.data().j||"[]"),MPI=window.MISPUNTOS,ts=MPI.tracks().slice();let ult=null,n=0;
      let np=0;const MP0=MPI.get();
      for(const it of l){for(const w of it.w||[]){const[n,la,lo,al,t]=w;if(!isFinite(la)||!isFinite(lo))continue;if(MP0.some(q=>Math.abs(q.lat-la)<1e-5&&Math.abs(q.lon-lo)<1e-5&&q.n===n))continue;
          const p={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),n:n||"Punto",ic:"otro",nota:it.n&&it.p&&it.p.length?"En «"+it.n+"»":"",lat:Math.round(la*1e5)/1e5,lon:Math.round(lo*1e5)/1e5,f:new Date(t||Date.now()).toISOString()};if(al!=null&&isFinite(al))p.a=Math.round(al);MPI.addPoint(p);np++}
        const pts=(it.p||[]).map(q=>[q[0],q[1]]);if(pts.length<2)continue;
        if(ts.some(t=>t.src==="grab"&&t.f===new Date(it.t0).toISOString()))continue;   // ya estaba
        let km=0;for(let i=1;i<pts.length;i++)km+=map.distance(pts[i-1],pts[i]);
        const o={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),n:it.n||"Recorrido grabado",km:Math.round(km/100)/10,pts,src:"grab",f:new Date(it.t0).toISOString(),est:"hecho",fh:new Date(it.t0).toISOString()};
        ts.push(o);ult=o;n++}
      if(n){MPI.saveTracks(ts);for(const o of ts.slice(-n))MPI.demAlt(o.id)}
      await fs.deleteDoc(ref);
      if(np&&!ult)toast(np===1?"✅ Punto guardado en Mis cosas › Puntos":`✅ ${np} puntos guardados en Mis cosas › Puntos`);
      if(ult){toast((np?`📍 ${np} punto${np>1?"s":""} en Puntos · `:"")+(n===1?`✅ «${ult.n}» guardado en Mis cosas › Tracks`:`✅ ${n} grabaciones guardadas en Mis cosas › Tracks`));if(window.MISTRACKS)setTimeout(()=>MISTRACKS.open(ult.id,true),600)}}
  }catch(e){console.warn("buzón",e)}RECOG=false}
if(enApp){setTimeout(recoger,2500);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(recoger,800)})}
const bp=document.getElementById("b-pt");if(bp)bp.addEventListener("click",()=>{if(window.MISPUNTOS&&MISPUNTOS.gps)MISPUNTOS.gps()});
})();
