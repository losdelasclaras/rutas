/* ---------- Seguir esta ruta: dónde estás sobre el track, lo que falta y aviso si te sales ----------
   Funciona con la app abierta y la pantalla encendida (se pide que no se apague). */
(function(){
const FK="ldc-siguiendo";
const vm=document.getElementById("v-mapa");
document.head.insertAdjacentHTML("beforeend",`<style>
#v-mapa.fol-on .fabs,#v-mapa.fol-on .legend,#v-mapa.fol-on .mapbar,#v-mapa.fol-on .rmenu{display:none!important}
.fol{position:absolute;left:8px;right:8px;bottom:8px;z-index:1200;background:var(--card);color:var(--ink);border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.28);padding:10px 12px 12px;max-width:460px}
@media(min-width:860px){.fol{left:12px;right:auto;width:420px;bottom:14px}}
.fol .fh{display:flex;align-items:center;gap:8px}.fol .fh b{flex:1;font-size:15.5px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.fol .fst{margin:6px 0 8px;font-weight:700;font-size:15px;border-radius:10px;padding:7px 10px;background:#eef6ef;color:#1f6b32}
.fol .fst.wait{background:#f1f1f1;color:#555}.fol .fst.far{background:#fff4e0;color:#8a4b00}.fol .fst.off{background:#c3262e;color:#fff;animation:folp 1s ease-in-out infinite alternate}.fol .fst.fin{background:#1f6b32;color:#fff}
@keyframes folp{from{opacity:1}to{opacity:.75}}
.fol .fst a{color:inherit}
.fol .fg{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;text-align:center}
.fol .fg small{display:block;font-size:11.5px;color:var(--muted);font-weight:600;line-height:1.15}.fol .fg b{font-size:19px;font-variant-numeric:tabular-nums}
.fol .fb{display:flex;gap:6px;margin-top:10px}.fol .fb button{flex:1;border:1px solid var(--edge);background:var(--card);color:var(--ink);border-radius:10px;padding:9px 6px;font-weight:700;font-size:14px;cursor:pointer}
.fol .fb button.on{background:#1a73e8;color:#fff;border-color:#1a73e8}.fol .fb button.end{color:#b3261e}
.fol .bar{height:6px;border-radius:3px;background:#e6e6e6;margin:8px 0 2px;overflow:hidden}.fol .bar i{display:block;height:100%;background:#c3262e}
.folme{width:20px;height:20px}
.folme i{position:absolute;inset:0;border-radius:50%;background:#1a73e8;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25),0 2px 6px rgba(0,0,0,.35)}
</style>`);
let F=null;
const toR=Math.PI/180,ER=6371000;
const dm=(a,b)=>{const dl=(b[0]-a[0])*toR,dn=(b[1]-a[1])*toR;const h=Math.sin(dl/2)**2+Math.cos(a[0]*toR)*Math.cos(b[0]*toR)*Math.sin(dn/2)**2;return 2*ER*Math.asin(Math.min(1,Math.sqrt(h)))};
const fk=m=>m<1000?Math.round(m/10)*10+" m":(m/1000).toLocaleString("es-ES",{minimumFractionDigits:1,maximumFractionDigits:1})+" km";
const fm=m=>Math.round(m).toLocaleString("es-ES")+" m";

// distancias acumuladas y desnivel acumulado (con un margen de 4 m para que el ruido del GPS no sume)
function prep(r,rev){let ln=r.gx.ln.map(p=>[p[0],p[1],p[2]]);if(rev)ln.reverse();
  const n=ln.length,cum=new Float64Array(n),up=new Float64Array(n),dn=new Float64Array(n);let U=0,D=0,ref=ln[0][2];
  for(let i=1;i<n;i++){cum[i]=cum[i-1]+dm(ln[i-1],ln[i]);const e=ln[i][2];
    if(e!=null&&ref!=null){const d=e-ref;if(d>=4){U+=d;ref=e}else if(d<=-4){D-=d;ref=e}}else if(ref==null)ref=e;
    up[i]=U;dn[i]=D}
  // el track del mapa está simplificado y mide algo menos: se ajusta a los km del GPX original
  const k=r.gx.km&&cum[n-1]?r.gx.km*1000/cum[n-1]:1;if(k>1&&k<1.3)for(let i=0;i<n;i++)cum[i]*=k;
  return{ln,cum,up,dn,tot:cum[n-1]}}
const at=(arr,i,t)=>arr[i]+(i+1<arr.length?(arr[i+1]-arr[i])*t:0);

// el punto del track más cercano; si el track pasa dos veces por el mismo sitio (ida y vuelta), el más cercano a donde ibas
function locate(lat,lon){const T=F.T,ln=T.ln,c=Math.cos(lat*toR),X=p=>(p[1]-lon)*toR*ER*c,Y=p=>(p[0]-lat)*toR*ER;
  const cand=[];let best=1e12;
  for(let i=0;i<ln.length-1;i++){const ax=X(ln[i]),ay=Y(ln[i]),bx=X(ln[i+1]),by=Y(ln[i+1]),vx=bx-ax,vy=by-ay,l2=vx*vx+vy*vy;
    let t=l2?-(ax*vx+ay*vy)/l2:0;t=t<0?0:t>1?1:t;const px=ax+vx*t,py=ay+vy*t,d=Math.hypot(px,py);cand.push([d,i,t]);if(d<best)best=d}
  let pick=null,pd=1e12;
  for(const k of cand){if(k[0]>best+20)continue;const s=at(T.cum,k[1],k[2]),dd=Math.abs(s-F.s)+(s<F.s-150?1e6:0);if(dd<pd){pd=dd;pick=k}}
  return{d:pick[0],i:pick[1],t:pick[2],s:at(T.cum,pick[1],pick[2])}}

function panelHTML(){const r=F.r;
  return`<div class="fh"><b>${esc(routeTitle(r))}</b></div>
  <div class="fst wait" data-fst>📡 Buscando tu posición…</div>
  <div class="bar"><i data-fbar style="width:0"></i></div>
  <div class="fg"><div><small>Hecho</small><b data-fdone>—</b></div><div><small>Falta</small><b data-fleft>${fk(F.T.tot)}</b></div>
   <div><small>Subida que falta</small><b data-fup>+${fm(F.T.up[F.T.up.length-1])}</b></div><div><small>Bajada que falta</small><b data-fdn>−${fm(F.T.dn[F.T.dn.length-1])}</b></div></div>
  <div class="fb"><button data-fc class="on">◎ Centrar</button><button data-fr title="Si haces la ruta desde el otro extremo">⇄ Al revés</button><button data-fx class="end">✕ Terminar</button></div>`}
const Q=s=>F&&F.el.querySelector(s);
function status(cls,html){const e=Q("[data-fst]");if(!e)return;e.className="fst "+cls;e.innerHTML=html}

function draw(){const T=F.T,ll=T.ln.map(p=>[p[0],p[1]]);
  if(F.lay)F.lay.remove();
  F.done=L.polyline([],{color:"#7a7a7a",weight:5,opacity:.9,interactive:false});
  F.lay=L.layerGroup([L.polyline(ll,{color:"#fff",weight:8,opacity:.9,interactive:false}),L.polyline(ll,{color:"#c3262e",weight:5,opacity:.95,interactive:false}),F.done,
    L.circleMarker(ll[0],{radius:7,color:"#fff",weight:2,fillColor:"#2a7a3b",fillOpacity:1,interactive:false}).bindTooltip("Inicio",{direction:"top"}),
    L.circleMarker(ll[ll.length-1],{radius:7,color:"#fff",weight:2,fillColor:"#222",fillOpacity:1,interactive:false}).bindTooltip("Final",{direction:"top"})]).addTo(map);
  F.me=L.marker(ll[0],{icon:L.divIcon({className:"folme",html:"<i></i>",iconSize:[20,20]}),interactive:false,zIndexOffset:2000});
  F.acc=L.circle(ll[0],{radius:10,color:"#1a73e8",weight:1,fillColor:"#1a73e8",fillOpacity:.12,interactive:false})}

function beep(){try{const A=new (window.AudioContext||window.webkitAudioContext)();[0,.35].forEach(d=>{const o=A.createOscillator(),g=A.createGain();o.frequency.value=880;o.connect(g);g.connect(A.destination);g.gain.setValueAtTime(.25,A.currentTime+d);g.gain.exponentialRampToValueAtTime(.001,A.currentTime+d+.28);o.start(A.currentTime+d);o.stop(A.currentTime+d+.3)});setTimeout(()=>A.close(),1200)}catch(e){}}
const vib=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};

function fix(pos){if(!F)return;const c=pos.coords,la=c.latitude,lo=c.longitude,acc=c.accuracy||30;F.fixes++;
  F.me.setLatLng([la,lo]);F.acc.setLatLng([la,lo]).setRadius(acc);if(!map.hasLayer(F.me)){F.acc.addTo(map);F.me.addTo(map)}
  if(F.follow)map.setView([la,lo],Math.max(map.getZoom(),15),{animate:true});
  const T=F.T,p=locate(la,lo),thr=Math.max(50,Math.min(150,acc*1.3));
  if(p.d<=thr){F.s=p.s;F.i=p.i;F.t=p.t}   // la posición en el track solo cambia si estás encima
  const s=F.s,left=Math.max(0,T.tot-s),i=F.i||0,t=F.t||0;
  Q("[data-fdone]").textContent=fk(s);Q("[data-fleft]").textContent=fk(left);
  Q("[data-fup]").textContent="+"+fm(T.up[T.up.length-1]-at(T.up,i,t));Q("[data-fdn]").textContent="−"+fm(T.dn[T.dn.length-1]-at(T.dn,i,t));
  Q("[data-fbar]").style.width=(T.tot?s/T.tot*100:0).toFixed(1)+"%";
  const dl=[];for(let k=0;k<=i;k++)dl.push([T.ln[k][0],T.ln[k][1]]);const lp=T.ln[i+1]?[T.ln[i][0]+(T.ln[i+1][0]-T.ln[i][0])*t,T.ln[i][1]+(T.ln[i+1][1]-T.ln[i][1])*t]:null;if(lp&&F.on)dl.push(lp);F.done.setLatLngs(F.on?dl:[]);
  const alt=c.altitude!=null&&acc<60?` · ${fm(c.altitude)}`:(T.ln[i][2]!=null?` · ${fm(T.ln[i][2])}`:"");
  if(p.d<=thr){
    if(!F.on){F.on=true;if(F.fixes>1)vib(120)}
    if(F.off){F.off=0;vib(120);toast("De nuevo en la ruta")}
    if(left<60&&s>T.tot*0.5){if(!F.fin){F.fin=true;vib([200,100,200,100,400])}status("fin","🏁 ¡Has llegado al final de la ruta!")}
    else status("ok",`✓ En la ruta${alt}`)}
  else if(!F.on){ // aún no has llegado al track
    const ds=dm([la,lo],T.ln[0]);
    status("far",ds<=p.d+30?`Estás a ${fk(ds)} del inicio · <a href="https://www.google.com/maps/dir/?api=1&destination=${T.ln[0][0]},${T.ln[0][1]}" target="_blank" rel="noopener">Cómo llegar</a>`:`Estás a ${fk(p.d)} del track`)}
  else{F.off++;
    if(F.off===2){vib([400,200,400]);beep()}
    if(F.off>=2)status("off",`⚠️ Te has salido de la ruta: el track está a ${fk(p.d)}`);else status("ok",`✓ En la ruta${alt}`)}
  save()}
function err(e){if(!F)return;status("wait",e&&e.code===1?"⛔ La app no tiene permiso para usar tu ubicación. Actívalo en los ajustes del navegador.":"📡 Sin señal de GPS todavía…")}

async function wake(){try{if(navigator.wakeLock&&document.visibilityState==="visible")F.wl=await navigator.wakeLock.request("screen")}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(F&&document.visibilityState==="visible")wake()});
const save=()=>{if(F)store.set(FK,{u:F.r.u,rev:F.rev,s:F.s,i:F.i,tt:F.t,on:F.on,t:Date.now()})};

function start(r,rev,resume){if(!r||!r.gx)return;
  if(!r.gx.ln){toast("Preparando el track…");loadTracks().then(ok=>{if(ok&&r.gx.ln)start(r,rev,resume);else toast("Sin conexión: no puedo cargar el track ahora")});return}
  if(!navigator.geolocation){toast("Este aparato no da la ubicación");return}
  stop(true);
  if(typeof ovCloseAll==="function")ovCloseAll();if(typeof showView==="function")showView("mapa");if(window.showTrack)showTrack(null);sheet.hidden=true;sheet.classList.remove("full");
  F={r,rev:!!rev,T:prep(r,!!rev),s:0,i:0,t:0,on:false,off:0,fin:false,fixes:0,follow:true};
  if(resume&&resume.rev===F.rev){F.s=resume.s||0;F.on=!!resume.on;F.i=resume.i||0;F.t=resume.tt||0}
  F.el=document.createElement("div");F.el.className="fol";F.el.innerHTML=panelHTML();vm.appendChild(F.el);vm.classList.add("fol-on");
  L.DomEvent.disableClickPropagation(F.el);L.DomEvent.disableScrollPropagation(F.el);
  draw();map.fitBounds(L.polyline(F.T.ln.map(p=>[p[0],p[1]])).getBounds(),{padding:[30,30],paddingBottomRight:[30,F.el.offsetHeight+20]});
  F.watch=navigator.geolocation.watchPosition(fix,err,{enableHighAccuracy:true,maximumAge:2000,timeout:30000});
  wake();save()}
function stop(quiet){if(!F)return;try{navigator.geolocation.clearWatch(F.watch)}catch(e){}
  try{F.wl&&F.wl.release()}catch(e){}
  [F.lay,F.me,F.acc].forEach(l=>l&&l.remove());F.el.remove();vm.classList.remove("fol-on");F=null;store.set(FK,null);if(!quiet)toast("Has dejado de seguir la ruta")}

// si sigues el mapa con el dedo, deja de centrarse solo hasta que pulses «Centrar»
map.on("dragstart",()=>{if(F&&F.follow){F.follow=false;const b=Q("[data-fc]");if(b)b.classList.remove("on")}});
vm.addEventListener("click",e=>{if(!F||!F.el.contains(e.target))return;
  if(e.target.closest("[data-fx]")){stop();return}
  if(e.target.closest("[data-fc]")){F.follow=true;Q("[data-fc]").classList.add("on");const ll=F.me.getLatLng();if(map.hasLayer(F.me))map.setView(ll,Math.max(map.getZoom(),15));return}
  if(e.target.closest("[data-fr]")){const r=F.r,rv=!F.rev;start(r,rv);toast(rv?"Ruta al revés: empiezas por el final":"Ruta en el sentido normal");return}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-follow]");if(!b)return;e.preventDefault();e.stopPropagation();start(R[+b.dataset.follow],false)},true);

// si la app se cerró mientras seguías una ruta (hace menos de 12 h), se retoma sola
const prev=store.get(FK,null);
if(prev&&prev.u&&Date.now()-prev.t<12*3600e3){const r=R.find(x=>x.u===prev.u);if(r&&r.gx)setTimeout(()=>{start(r,prev.rev,prev);toast("Sigues con la ruta donde la dejaste")},900)}
window.SEGUIR={start,stop,get:()=>F};
})();
