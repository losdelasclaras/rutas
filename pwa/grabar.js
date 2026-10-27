/* ---------- ⏺ Grabar recorrido (a prueba) ----------
   Graba mientras la app está abierta y la pantalla encendida (se pide que no se apague).
   Si el móvil apaga la pantalla o cambias de app, la grabación se para y sigue al volver (ese tramo sale en línea recta).
   Lo grabado se guarda en el móvil a cada punto: si se cierra la app, al abrirla sigue grabando. */
(function(){
const K="ldc-grab",MPI=window.MISPUNTOS,vm=document.getElementById("v-mapa");
document.head.insertAdjacentHTML("beforeend",`<style>
.grb{position:absolute;left:8px;right:8px;top:8px;z-index:1250;background:#b3261e;color:#fff;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.3);padding:8px 10px 10px;max-width:460px}
@media(min-width:860px){.grb{left:12px;right:auto;width:420px}}
.grb .gh{display:flex;align-items:center;gap:8px;font-weight:800;font-size:15px}
.grb .gh i{width:12px;height:12px;border-radius:50%;background:#fff;animation:grbp 1s ease-in-out infinite alternate;flex:none}
.grb.pau .gh i{animation:none;opacity:.5}
@keyframes grbp{from{opacity:1}to{opacity:.25}}
.grb .gg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;text-align:center;margin:6px 0 8px}
.grb .gg b{display:block;font-size:22px;font-variant-numeric:tabular-nums}.grb .gg small{font-size:12px;opacity:.85;font-weight:600}
.grb .gn{font-size:12.5px;opacity:.9;margin:0 0 8px;line-height:1.3}
.grb .gb{display:flex;gap:6px}.grb .gb button{flex:1;border:0;border-radius:10px;padding:10px 6px;font-weight:800;font-size:15px;cursor:pointer;background:rgba(255,255,255,.18);color:#fff}
.grb .gb button.fin{background:#fff;color:#b3261e}
#v-mapa.grb-on .mapbar{visibility:hidden}
#v-mapa.grb-on #b-rec{display:none}
#b-rec svg circle{fill:#c3262e;stroke:none}
.grbme{width:18px;height:18px}.grbme i{position:absolute;inset:0;border-radius:50%;background:#c3262e;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25),0 2px 6px rgba(0,0,0,.35)}
</style>`);
let G=null;   // {t0, pts:[[lat,lon,alt|null,ms]], pau:ms acumulados, pz:inicio de pausa|null, sube}
let W=null,WL=null,EL=null,LINE=null,ME=null,TICK=null;
const toR=Math.PI/180,dm=(a,b)=>{const dl=(b[0]-a[0])*toR,dn=(b[1]-a[1])*toR;const h=Math.sin(dl/2)**2+Math.cos(a[0]*toR)*Math.cos(b[0]*toR)*Math.sin(dn/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(h)))};
const guarda=()=>{try{localStorage.setItem(K,JSON.stringify(G))}catch(e){}};
const km=()=>{let d=0;for(let i=1;i<G.pts.length;i++)d+=dm(G.pts[i-1],G.pts[i]);return d};
function sube(){let up=0,ref=null;for(const p of G.pts){if(p[2]==null)continue;if(ref==null){ref=p[2];continue}if(p[2]-ref>4){up+=p[2]-ref;ref=p[2]}else if(ref-p[2]>4)ref=p[2]}return Math.round(up)}
const dur=()=>{const now=G.pz||Date.now();return Math.max(0,now-G.t0-G.pau)};
const hms=ms=>{const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+":":"")+String(m).padStart(h?2:1,"0")+":"+String(x).padStart(2,"0")};

function panel(){if(!EL){EL=document.createElement("div");EL.className="grb";vm.appendChild(EL);vm.classList.add("grb-on")}
  const d=km();EL.classList.toggle("pau",!!G.pz);
  EL.innerHTML=`<div class="gh"><i></i>${G.pz?"En pausa":"Grabando recorrido"}</div>
  <div class="gg"><span><b>${hms(dur())}</b><small>tiempo</small></span><span><b>${(d/1000).toLocaleString("es-ES",{minimumFractionDigits:2,maximumFractionDigits:2})}</b><small>km</small></span><span><b>+${sube().toLocaleString("es-ES")}</b><small>m de subida</small></span></div>
  <p class="gn">${G.pts.length?"":"Esperando la señal del GPS… "}No apagues la pantalla ni cambies de app: si lo haces, la grabación se para y sigue al volver.</p>
  <div class="gb"><button data-grp>${G.pz?"▶ Seguir":"⏸ Pausa"}</button><button class="fin" data-grf>■ Terminar</button></div>`}
function dibuja(){const ll=G.pts.map(p=>[p[0],p[1]]);
  if(!LINE)LINE=L.layerGroup([L.polyline([],{color:"#fff",weight:8,opacity:.9,interactive:false}),L.polyline([],{color:"#c3262e",weight:5,opacity:.95,interactive:false})]).addTo(map);
  LINE.eachLayer(l=>l.setLatLngs(ll));
  const last=G.pts[G.pts.length-1];if(!last)return;
  if(!ME)ME=L.marker([last[0],last[1]],{icon:L.divIcon({className:"grbme",html:"<i></i>",iconSize:[18,18]}),interactive:false,zIndexOffset:1000}).addTo(map);else ME.setLatLng([last[0],last[1]])}
function fix(pos){if(!G||G.pz)return;const c=pos.coords;if(c.accuracy>50)return;
  const p=[Math.round(c.latitude*1e6)/1e6,Math.round(c.longitude*1e6)/1e6,c.altitude!=null?Math.round(c.altitude):null,Date.now()],q=G.pts[G.pts.length-1];
  if(q){const d=dm(q,p),s=(p[3]-q[3])/1000;if(d<6)return;if(s>0&&d/s>60)return}   // menos de 6 m: ruido; más de 60 m/s: salto raro
  const primero=!G.pts.length;G.pts.push(p);guarda();dibuja();panel();
  if(primero)map.setView([p[0],p[1]],Math.max(map.getZoom(),15))}
function err(e){if(e&&e.code===1){toast("Para grabar hay que dejar que la app use tu ubicación");para()}}
async function wake(){try{if(navigator.wakeLock&&document.visibilityState==="visible"&&!WL){WL=await navigator.wakeLock.request("screen");WL.addEventListener("release",()=>{WL=null})}}catch(e){}}
function mira(){if(W==null&&navigator.geolocation)W=navigator.geolocation.watchPosition(fix,err,{enableHighAccuracy:true,maximumAge:0,timeout:60000})}
function arranca(){if(typeof showView==="function")showView("mapa");panel();dibuja();mira();wake();clearInterval(TICK);TICK=setInterval(()=>{if(G&&!G.pz&&EL&&document.visibilityState==="visible"){const b=EL.querySelector(".gg b");if(b)b.textContent=hms(dur())}},1000)}
function empieza(){if(G){arranca();return}
  if(!navigator.geolocation){toast("Este móvil no deja usar el GPS desde la app");return}
  G={t0:Date.now(),pts:[],pau:0,pz:null};guarda();arranca();toast("⏺ Grabando. Deja la app abierta y la pantalla encendida")}
function para(){if(W!=null){navigator.geolocation.clearWatch(W);W=null}try{WL&&WL.release()}catch(e){}WL=null;clearInterval(TICK);
  if(EL){EL.remove();EL=null}vm.classList.remove("grb-on");if(LINE){LINE.remove();LINE=null}if(ME){ME.remove();ME=null}}
function pausa(){if(!G)return;if(G.pz){G.pau+=Date.now()-G.pz;G.pz=null}else G.pz=Date.now();guarda();panel()}
function termina(){if(!G)return;if(!G.pz){G.pz=Date.now();guarda()}panel();
  const d=km(),f=new Date(G.t0);
  const nom="Recorrido del "+f.toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"});
  MPI.show(`<div class="sheet-head"><h2>■ Terminar la grabación</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
  <p><b>${hms(dur())}</b> · <b>${(d/1000).toLocaleString("es-ES",{maximumFractionDigits:2})} km</b> · <b>+${sube()} m</b> · ${G.pts.length} puntos</p>
  ${G.pts.length<2?`<p class="note">No ha dado tiempo a grabar nada (el GPS no ha dado señal todavía).</p>`:`<label style="display:block;font-weight:700;margin:10px 0 4px">Nombre</label><input data-grn value="${esc(nom)}" maxlength="80" style="width:100%;box-sizing:border-box;border:1px solid var(--edge);border-radius:10px;padding:10px;font:inherit;font-size:16px;background:var(--paper);color:var(--ink)">`}
  <div class="topacts" style="margin-top:14px">${G.pts.length>=2?`<button class="btn primary" data-grs>💾 Guardar</button>`:""}<button class="btn ghost" data-grc>▶ Seguir grabando</button></div>
  <div class="mpacts"><button class="mpb dan" data-grx>🗑 Tirar la grabación</button></div>`);sheet._grb=1}
function guardar(){const inp=sheet.querySelector("[data-grn]"),n=(inp&&inp.value.trim())||"Recorrido grabado";
  const go=()=>{const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6),pts=G.pts.map(p=>[p[0],p[1]]);
    const o={id,n,km:Math.round(km()/100)/10,pts,src:"grab",f:new Date(G.t0).toISOString(),est:"hecho",fh:new Date(G.t0).toISOString()};
    MPI.desn(o);MPI.saveTracks([...MPI.tracks(),o]);MPI.demAlt(id);
    para();G=null;try{localStorage.removeItem(K)}catch(e){}sheet._grb=0;
    toast("Guardado en Mis cosas › Tracks");if(window.MISTRACKS)setTimeout(()=>MISTRACKS.open(id,true),300)};
  if(window.cuentaOk&&!cuentaOk(go,"tracks"))return;go()}
document.addEventListener("click",e=>{
  if(e.target.closest("[data-grp]")){pausa();return}
  if(e.target.closest("[data-grf]")){termina();return}
  if(e.target.closest("[data-rec]")){if(typeof closeLegend==="function")try{closeLegend()}catch(er){}empieza();return}});
sheet.addEventListener("click",e=>{if(!sheet._grb)return;
  if(e.target.closest("[data-grs]")){guardar();return}
  if(e.target.closest("[data-grc]")){sheet.hidden=true;sheet._grb=0;if(G&&G.pz)pausa();return}
  if(e.target.closest("[data-grx]")){if(!confirm("¿Tirar lo grabado? No se puede recuperar."))return;para();G=null;try{localStorage.removeItem(K)}catch(er){}sheet.hidden=true;sheet._grb=0;toast("Grabación tirada");return}});
// al volver a la app: la pantalla se puede volver a mantener encendida
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&G){wake();mira();panel()}});

/* botones para empezar: en el mapa, en Capas › Añadir y en Mis cosas › Tracks */
const fabs=document.querySelector(".fabs");
const REC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7"/></svg>';
if(fabs)fabs.insertAdjacentHTML("afterbegin",`<button class="btn ghost" id="b-rec" data-rec data-short="Grabar" title="Grabar recorrido">${REC}Grabar</button>`);
const ah=[...document.querySelectorAll(".laypanel button.laygh")].find(b=>/añadir/i.test(b.textContent));
if(ah&&ah.nextElementSibling)ah.nextElementSibling.insertAdjacentHTML("afterbegin",`<button class="lay" data-rec><span class="lico" style="background:#c3262e">⏺</span>Grabar recorrido</button>`);
const imp=document.querySelector('[data-mtx="imp"]');
if(imp)imp.insertAdjacentHTML("afterend",`<button class="mpb" data-rec style="border-color:#c3262e;color:#c3262e;font-weight:700">⏺ Grabar recorrido</button>`);

// si la app se cerró grabando, sigue
try{G=JSON.parse(localStorage.getItem(K)||"null")}catch(e){G=null}
if(G&&G.t0){setTimeout(()=>{arranca();toast(G.pz?"Tienes una grabación en pausa":"Seguías grabando: continúo")},900)}else G=null;
window.GRABAR={empieza,termina,get:()=>G};
})();
