/* ---------- compartir tracks y abrir GPX/KML con la app ----------
   · «📤 Compartir» en la ficha de un track: manda un enlace (WhatsApp, correo…). Quien lo abre ve el track en la app
     y puede guardarlo o seguirlo. Los tracks del blog comparten el enlace de su ruta.
   · Abrir con la app: en Android, «Compartir › LdC Rutas» desde la carpeta de descargas, WhatsApp, etc.
     (la app instalada aparece en el menú de compartir). En el ordenador, «Abrir con» si está instalada desde Chrome/Edge. */
(function(){
const MPI=window.MISPUNTOS;
/* polilínea comprimida (algoritmo de Google, 5 decimales) */
function enc(pts){let o="",pl=0,pn=0;const e=v=>{v=v<0?~(v<<1):v<<1;let s="";while(v>=0x20){s+=String.fromCharCode((0x20|(v&0x1f))+63);v>>=5}return s+String.fromCharCode(v+63)};
  for(const p of pts){const la=Math.round(p[0]*1e5),lo=Math.round(p[1]*1e5);o+=e(la-pl)+e(lo-pn);pl=la;pn=lo}return o}
function dec(s){const out=[];let i=0,la=0,lo=0;const d=()=>{let r=0,sh=0,b;do{b=s.charCodeAt(i++)-63;r|=(b&0x1f)<<sh;sh+=5}while(b>=0x20&&i<=s.length);return r&1?~(r>>1):r>>1};
  while(i<s.length){la+=d();lo+=d();out.push([la/1e5,lo/1e5])}return out}
// 8 nov 2026: polilínea con altura (lat, lon y metros), la que manda la APK al abrir un GPX desde WhatsApp
function dec3(s){const out=[];let i=0,la=0,lo=0,al=0;const d=()=>{let r=0,sh=0,b;do{b=s.charCodeAt(i++)-63;r|=(b&0x1f)<<sh;sh+=5}while(b>=0x20&&i<=s.length);return r&1?~(r>>1):r>>1};
  while(i<s.length){la+=d();lo+=d();al+=d();out.push([la/1e5,lo/1e5,al])}return out}
// simplificar (Douglas-Peucker, ~6 m) para que el enlace sea corto
function simple(p,tol){if(p.length<3)return p;const c=Math.cos(p[0][0]*Math.PI/180),X=q=>q[1]*111320*c,Y=q=>q[0]*110540;const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const st=[[0,p.length-1]];
  while(st.length){const[a,b]=st.pop();let mx=0,ix=-1;const ax=X(p[a]),ay=Y(p[a]),bx=X(p[b]),by=Y(p[b]),dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy)||1;
    for(let i=a+1;i<b;i++){const d=Math.abs(dy*X(p[i])-dx*Y(p[i])+bx*ay-by*ax)/l;if(d>mx){mx=d;ix=i}}if(mx>tol){keep[ix]=1;st.push([a,ix],[ix,b])}}
  return p.filter((_,i)=>keep[i])}
const base=()=>(typeof APPURL!=="undefined"?APPURL:location.origin+location.pathname);
/* enlace corto: el track se guarda en la nube (enlaces/{id}) y el enlace solo lleva el código: …/rutas/#c=Ab3kP9xq */
const EK="ldc-enlaces";
const r5=v=>Math.round(v*1e5)/1e5;
async function corto(t){const u=window.LDCFB&&LDCFB.user();if(!u||!navigator.onLine)return null;
  let mem={};try{mem=JSON.parse(localStorage.getItem(EK)||"{}")}catch(e){}
  const huella=t.n+"|"+t.pts.length+"|"+t.pts[0][0]+"|"+t.pts[t.pts.length-1][1];
  if(mem[t.id]&&mem[t.id].h===huella)return base()+"#c="+mem[t.id].c;
  try{const a=await LDCFB.load(),fs=a.fs;
    const st=Math.max(1,Math.ceil(t.pts.length/3000)),pts=t.pts.filter((_,i)=>i%st===0||i===t.pts.length-1).map(p=>p[2]!=null?[r5(p[0]),r5(p[1]),Math.round(p[2])]:[r5(p[0]),r5(p[1])]);
    const A="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";let c="";const rnd=crypto.getRandomValues(new Uint8Array(8));for(const b of rnd)c+=A[b%A.length];
    await Promise.race([fs.setDoc(fs.doc(a.db,"enlaces",c),{uid:u.uid,n:String(t.n).slice(0,100),km:t.km||null,up:t.up!=null?t.up:null,t:Date.now(),d:JSON.stringify(pts)}),new Promise((_,no)=>setTimeout(()=>no(new Error("tarda")),8000))]);
    mem[t.id]={c,h:huella};try{localStorage.setItem(EK,JSON.stringify(mem))}catch(e){}
    return base()+"#c="+c}catch(e){console.warn("enlace corto",e);return null}}
async function abrirCorto(c){if(typeof toast==="function")toast("Abriendo lo que te han compartido…");
  try{const a=await LDCFB.load(),fs=a.fs,d=await fs.getDoc(fs.doc(a.db,"enlaces",c));
    if(!d.exists()){toast("Ese enlace ya no existe");return}
    const x=d.data();if(x.tipo==="puntos"){MPI.verCompartidos({n:x.n,ps:JSON.parse(x.d)});return}
    const pts=JSON.parse(x.d);let km=x.km;if(!km){km=0;for(let i=1;i<pts.length;i++)km+=map.distance(pts[i-1],pts[i]);km=Math.round(km/100)/10}
    mostrar({n:x.n||"Track compartido",pts,km,up:x.up!=null?x.up:undefined},"enlace")}
  catch(e){toast(navigator.onLine?"No he podido abrir ese track":"Sin conexión: abre el enlace cuando tengas cobertura")}}
function cache(t){try{const m=JSON.parse(localStorage.getItem(EK)||"{}")[t.id],h=t.n+"|"+t.pts.length+"|"+t.pts[0][0]+"|"+t.pts[t.pts.length-1][1];return m&&m.h===h?base()+"#c="+m.c:null}catch(e){return null}}
/* 📤 Compartir un track: primero se elige cómo. Archivo GPX (lo que él prefiere: vale para WhatsApp, Wikiloc, OruxMaps…) o enlace a la app */
const enApk=()=>{try{return sessionStorage.getItem("ldc-apk")==="1"}catch(e){return false}};
const xe=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function gpxTxt(n,pts,wps){return`<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Los de las Claras" xmlns="http://www.topografix.com/GPX/1/1">\n<metadata><name>${xe(n)}</name></metadata>\n`+
  (wps||[]).map(w=>`<wpt lat="${w.lat}" lon="${w.lon}">${w.a!=null?`<ele>${Math.round(w.a)}</ele>`:""}${w.t?`<time>${new Date(w.t).toISOString()}</time>`:""}<name>${xe(w.n||"Punto")}</name>${w.nota?`<desc>${xe(w.nota)}</desc>`:""}</wpt>`).join("\n")+(wps&&wps.length?"\n":"")+
  `<trk><name>${xe(n)}</name><trkseg>\n`+pts.map(p=>`<trkpt lat="${(+p[0]).toFixed(6)}" lon="${(+p[1]).toFixed(6)}">${p[2]!=null?`<ele>${Math.round(p[2])}</ele>`:""}</trkpt>`).join("\n")+`\n</trkseg></trk>\n</gpx>\n`}
const nomArch=n=>(String(n).normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^\w\s-]/g,"").trim().replace(/\s+/g,"-").slice(0,60)||"track")+".gpx";
// enviar un GPX como archivo de verdad. En la app del APK lo manda Android (Chrome no deja mandar .gpx); en el navegador, si el móvil no deja, se descarga
async function enviaGpx(n,pts,wps){if(pts.length>3000)pts=simple(pts,3);const txt=gpxTxt(n,pts,wps),nm=nomArch(n);
  if(enApk()){location.href="intent://gpx#Intent;scheme=ldcgpx;package=es.losdelasclaras.rutas;S.n="+encodeURIComponent(nm)+";S.g="+encodeURIComponent(txt)+";end";return}
  try{const f=new File([txt],nm,{type:"application/gpx+xml"});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:n});return}}catch(e){if(e&&e.name==="AbortError")return}
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([txt],{type:"application/gpx+xml"}));a.download=nm;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);
  setTimeout(()=>toast("Guardado en Descargas. En WhatsApp: 📎 › Documento › Descargas"),1500)}
window.enviaGpx=enviaGpx;
function compartir(t){const r=t.src==="blog"?R.find(x=>x.u===t.u):null;
  if(!t.pts||t.pts.length<2){if(r)shareRoute(r);return}
  MPI.show(`<div class="sheet-head"><h2>📤 Compartir «${esc(t.n)}»</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
    <div class="topacts" style="flex-direction:column"><button class="btn primary" data-shk="gpx">📄 Enviar el archivo GPX</button><button class="btn ghost" data-shk="url">🔗 Enviar un enlace a la app</button></div>
    <p class="note">El <b>archivo GPX</b> se abre con Wikiloc, OruxMaps, Google Earth o esta misma app. Con el <b>enlace</b>, quien lo toque ve el track en la app de Los de las Claras.</p>`);
  sheet._shk={t,r}}
sheet.addEventListener("click",e=>{const b=e.target.closest("[data-shk]"),d=sheet._shk;if(!b||!d)return;sheet._shk=null;
  if(b.dataset.shk==="gpx"){enviaGpx(d.t.n,d.t.pts,d.t.w);return}   // 8 nov 2026: con los puntos de la grabación dentro
  if(d.r){shareRoute(d.r);return}compartirEnlace(d.t)});
async function compartirEnlace(t){
  if(!t.pts||t.pts.length<2)return;
  let url=cache(t);
  if(!url&&window.LDCFB&&LDCFB.user()&&navigator.onLine){
    // crear el enlace corto tarda un momento: luego se pulsa «Enviar» (el móvil exige un toque para abrir WhatsApp)
    if(typeof toast==="function")toast("Preparando el enlace…");
    url=await corto(t);
    if(url){MPI.show(`<div class="sheet-head"><h2>📤 Enlace listo</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
      <p>Track <b>${esc(t.n)}</b>. Quien abra el enlace lo verá en la app, aunque no tenga cuenta.</p>
      <p class="note" style="word-break:break-all">${esc(url)}</p>
      <div class="topacts"><button class="btn primary" data-shgo>📤 Enviar</button><button class="btn ghost" data-shcp>📋 Copiar</button></div>`);
      sheet._sh={t,url};return}}
  enviar(t,url||base()+"#t="+encodeURIComponent(enc(simple(t.pts,6)))+"!"+encodeURIComponent(t.n.slice(0,80)))}
async function enviar(t,url){
  const title=t.n,text="🧵 Track «"+t.n+"»"+(t.km?" · "+t.km.toLocaleString("es-ES")+" km":"")+" · ábrelo en la app de Los de las Claras";
  try{if(navigator.share){await navigator.share({title,text,url});return}}catch(e){if(e&&e.name==="AbortError")return}
  try{await navigator.clipboard.writeText(text+"\n"+url);toast("Enlace copiado. Pégalo en WhatsApp.")}catch(e){window.open("https://wa.me/?text="+encodeURIComponent(text+"\n"+url),"_blank","noopener")}}
sheet.addEventListener("click",async e=>{const d=sheet._sh;if(!d)return;
  if(e.target.closest("[data-shgo]"))enviar(d.t,d.url);
  else if(e.target.closest("[data-shcp]")){try{await navigator.clipboard.writeText(d.url);toast("Enlace copiado")}catch(er){toast("No he podido copiarlo")}}});

/* abrir un enlace de track compartido */
let TMP=null;
function abrirCompartido(){const h=location.hash||"";
  if(/^#c=[A-Za-z0-9]{4,20}$/.test(h)){const c=h.slice(3);try{history.replaceState(null,"",location.pathname+location.search.replace(/^\?g=\d+$/,""))}catch(e){}if(window.LDCFB)abrirCorto(c);return true}
  if(h.startsWith("#f=")){try{history.replaceState(null,"",location.pathname+location.search.replace(/^\?g=\d+$/,""))}catch(e){}
    try{const o=JSON.parse(decodeURIComponent(h.slice(3)));MPI.verCompartidos({n:o.n,ps:{ps:(o.p||[]).map(x=>({n:x[0],lat:x[1],lon:x[2],ic:x[3],a:x[4]})),ts:(o.t||[]).map(x=>({n:x[0],pts:dec(x[1])}))}})}catch(e){toast("Ese enlace no es válido")}return true}
  // 8 nov 2026: «Abrir con» / WhatsApp desde la APK: track con alturas, puntos y horas (#t3=<polilínea>!<nombre>!<datos>)
  if(h.startsWith("#t3=")){const pr=h.slice(4).split("!");let pts=[],x={};try{pts=dec3(decodeURIComponent(pr[0]))}catch(e){}try{if(pr[2])x=JSON.parse(decodeURIComponent(pr[2]))}catch(e){}
    try{history.replaceState(null,"",location.pathname+location.search.replace(/^\?g=\d+$/,""))}catch(e){}
    if(pts.length<2){toast("Ese archivo no tiene un recorrido que pueda leer");return true}
    if(!x.a)pts=pts.map(q=>[q[0],q[1]]);
    const n=decodeURIComponent(pr[1]||"Track");let km=0;for(let i=1;i<pts.length;i++)km+=map.distance([pts[i-1][0],pts[i-1][1]],[pts[i][0],pts[i][1]]);km=x.km||Math.round(km/100)/10;
    const w=(x.w||[]).map((q,i)=>{const o={id:Date.now().toString(36)+"w"+i,n:q[0]||"Punto",ic:"otro",nota:q[4]||"",lat:q[1],lon:q[2]};if(q[3]!=null)o.a=q[3];if(q[5])o.t=q[5];return o});
    const t={n,pts,km};if(w.length)t.w=w;if(x.g)t.gr=1;if(x.tm){t.tm=x.tm;t.fh=new Date(x.tm.a).toISOString()}
    mostrar(t,"archivo");return true}
  if(!h.startsWith("#t="))return false;
  const raw=h.slice(3),cut=raw.lastIndexOf("!"),code=decodeURIComponent(cut>=0?raw.slice(0,cut):raw),nm=cut>=0?raw.slice(cut+1):"";let pts=[];try{pts=dec(code)}catch(e){}
  try{history.replaceState(null,"",location.pathname+location.search.replace(/^\?g=\d+$/,""))}catch(e){}
  if(pts.length<2){toast("Ese enlace de track no es válido");return true}
  const n=decodeURIComponent(nm||"Track compartido");let km=0;for(let i=1;i<pts.length;i++)km+=map.distance(pts[i-1],pts[i]);km=Math.round(km/100)/10;
  mostrar({n,pts,km},"enlace");return true}
// perfil del track compartido (si trae alturas), con el mismo dibujo que el resto
function perfilTmp(pts,km){if(typeof profSVG!=="function"||pts.length<2||pts.some(x=>x[2]==null))return"";let c=0;const all=[[0,pts[0][2]]];
  for(let i=1;i<pts.length;i++){c+=map.distance([pts[i-1][0],pts[i-1][1]],[pts[i][0],pts[i][1]]);all.push([c/1000,pts[i][2]])}
  const f=km&&c?km/(c/1000):1,st=Math.max(1,Math.floor(all.length/120)),pf=[];for(let i=0;i<all.length;i+=st)pf.push([Math.round(all[i][0]*f*100)/100,all[i][1]]);pf.push([Math.round(all[all.length-1][0]*f*100)/100,all[all.length-1][1]]);
  const el=pf.map(x=>x[1]);return profSVG({pf,mn:Math.min(...el),mx:Math.max(...el),km})}
// «Solo verlo»: se cierra la ficha y el track se queda en el mapa, con una etiqueta para volver a la ficha o quitarlo
document.head.insertAdjacentHTML("beforeend",`<style>.tmppill{position:absolute;left:50%;transform:translateX(-50%);bottom:84px;z-index:26;display:flex;align-items:center;gap:8px;width:min(400px,calc(100% - 24px));box-sizing:border-box;background:var(--card);border:2px solid #7b2cbf;border-radius:14px;padding:6px 6px 6px 12px;box-shadow:0 2px 10px rgba(0,0,0,.2);zoom:var(--fs)}
.tmppill .pn{flex:1;min-width:0;min-height:38px;background:none;border:0;padding:0;color:var(--ink);font:inherit;font-weight:800;text-align:left;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tmppill .qx{flex:none;min-height:38px;border:1px solid var(--edge);border-radius:10px;background:var(--card);color:var(--ink);font:inherit;font-weight:800;padding:0 10px;cursor:pointer}</style>`);
let PILL=null,ULT=null;
function quitaPill(){if(PILL){PILL.remove();PILL=null}}
function soloVer(){const d=sheet._tmp;if(!d)return;ULT={t:Object.assign({},d,d.x||{}),origen:sheet._tmpo||"enlace"};sheet.hidden=true;quitaPill();
  const vm=document.getElementById("v-mapa")||document.body;PILL=document.createElement("div");PILL.className="tmppill";
  PILL.innerHTML=`<button class="pn" type="button">🧵 ${esc(d.n)}</button><button class="qx" type="button">✕ Quitar</button>`;vm.appendChild(PILL);
  try{map.fitBounds(L.latLngBounds(d.pts.map(x=>[x[0],x[1]])),{paddingTopLeft:[30,130],paddingBottomRight:[30,150],maxZoom:15})}catch(e){}
  PILL.querySelector(".pn").onclick=()=>{const u=ULT;quitaPill();if(u)mostrar(u.t,u.origen)};
  PILL.querySelector(".qx").onclick=()=>{quitaPill();if(TMP){TMP.remove();TMP=null}sheet._tmp=null;ULT=null}}
// enseñar un track sin guardarlo: desde un enlace o desde un archivo compartido con la app
function mostrar(t,origen){const n=t.n,pts=t.pts,km=t.km;quitaPill();
  if(t.up==null&&pts.length>1&&pts.every(x=>x[2]!=null)&&MPI.suben){const u=(t.gr&&MPI.sube?MPI.sube:MPI.suben)(pts);t=Object.assign({},t,{up:u[0],dn:u[1]})}
  if(typeof showView==="function")showView("mapa");
  if(TMP)TMP.remove();TMP=L.layerGroup([L.polyline(pts.map(x=>[x[0],x[1]]),{color:"#fff",weight:8,opacity:.9}),L.polyline(pts.map(x=>[x[0],x[1]]),{color:"#7b2cbf",weight:5,opacity:.95,dashArray:"10 6"})]).addTo(map);
  for(const w of t.w||[])TMP.addLayer(L.marker([w.lat,w.lon],{icon:L.divIcon({className:"mpk wpk",html:`<span>${MPI.emo?MPI.emo(w.ic):"📍"}</span>`,iconSize:[0,0]}),title:w.n,zIndexOffset:950}).bindTooltip(esc(w.n),{permanent:true,direction:"right",offset:[12,0],className:"lbl mpl",interactive:false}));
  map.fitBounds(L.latLngBounds(pts),{paddingTopLeft:[30,90],paddingBottomRight:innerWidth>=860?[480,30]:[30,Math.round(innerHeight*.5)],maxZoom:15});
  const ya=MPI.tracks().find(t=>t.pts&&t.pts.length&&t.n===n&&Math.abs(t.pts[0][0]-pts[0][0])<1e-4);
  MPI.show(`<div class="sheet-head"><h2>${esc(n)}</h2><button class="x" aria-label="Cerrar" data-close data-tmpx>×</button></div>
    <div class="meta"><span class="tag">${origen==="archivo"?"Archivo GPX/KML":"Track compartido"}</span><span class="tag">${km.toLocaleString("es-ES")} km</span>${t.up!=null?`<span class="tag">+${t.up.toLocaleString("es-ES")} m</span>`:""}${(t.w||[]).length?`<span class="tag">📍 ${t.w.length} punto${t.w.length>1?"s":""}</span>`:""}</div>
    ${perfilTmp(pts,km)}
    <p class="note">${origen==="archivo"?"Aún no se ha guardado.":"Te lo han pasado por enlace."} Puedes solo verlo en el mapa, guardarlo en Mis cosas para tenerlo siempre, o seguirlo.</p>
    <div class="topacts"><button class="btn primary" data-tmpver>👁 Solo verlo</button><button class="btn ghost" data-tmpsave>${ya?"★ Ya guardado":"☆ Guardar"}</button><button class="btn ghost" data-tmpfol>▶ Seguir</button></div>${(()=>{const q=pts.reduce((b,x)=>x[2]!=null&&(b[2]==null||x[2]>b[2])?x:b,pts[0]);return`<div class="wx" data-lat="${q[0]}" data-lon="${q[1]}" data-alt="${q[2]!=null?Math.round(q[2]):""}"></div>`})()}`);
  sheet._tmp={n,pts,km,up:t.up,dn:t.dn,mx:t.mx,mn:t.mn,x:{w:t.w,gr:t.gr,ug:t.ug,tm:t.tm,fh:t.fh}};sheet._tmpo=origen}   // x: lo de un GPX de la grabadora (puntos dentro, horas)
sheet.addEventListener("click",e=>{const d=sheet._tmp;
  if(e.target.closest("[data-tmpver]")){soloVer();return}
  if(e.target.closest("[data-tmpx]")&&TMP){TMP.remove();TMP=null}
  if(!d)return;
  if(e.target.closest("[data-tmpfol]")){if(TMP){TMP.remove();TMP=null}SEGUIR.start({u:"tmp",ti:d.n,gx:{ln:d.pts,km:d.km}},false);return}
  if(e.target.closest("[data-tmpsave]")){const go=()=>{const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      const o={id,n:d.n,km:d.km,pts:d.pts,src:"gpx",f:new Date().toISOString()};for(const k in d.x||{})if(d.x[k]!=null)o[k]=d.x[k];MPI.desn(o);MPI.saveTracks([...MPI.tracks(),o]);if(d.pts.some(p=>p[2]==null))MPI.demAlt(id);if(TMP){TMP.remove();TMP=null}
      sheet._tmp=null;toast("Guardado en Mis cosas › Mis tracks");if(window.MISTRACKS)MISTRACKS.open(id,false)};
    if(window.cuentaOk&&!cuentaOk(go,"tracks"))return;go()}});
addEventListener("hashchange",abrirCompartido);setTimeout(abrirCompartido,600);

/* archivos que llegan desde «Compartir › LdC Rutas» (Android) o «Abrir con» (ordenador) */
async function recibidos(){if(!/[?&]recibido/.test(location.search))return;
  try{history.replaceState(null,"",location.pathname)}catch(e){}
  let L0=[];try{const c=await caches.open("ldc-share");const r=await c.match("recibido");if(r)L0=await r.json();await c.delete("recibido")}catch(e){}
  if(!L0.length){toast("Solo puedo abrir archivos GPX o KML");return}
  for(const f of L0){if(f.x!=null){if(window.ENLACES)ENLACES.abrirTexto(f.x);continue}MPI.importText(f.t,f.n||"track.gpx",true)}}
setTimeout(recibidos,700);
if("launchQueue" in window)launchQueue.setConsumer(async p=>{if(!p.files||!p.files.length)return;const fs=[];for(const h of p.files){try{const f=await h.getFile();fs.push({n:f.name,t:await f.text()})}catch(e){}}
  for(const f of fs)MPI.importText(f.t,f.n,true)});

window.COMPARTIR={track:compartir,enc,dec,simple,preview:t=>mostrar(t,"archivo")};
})();
