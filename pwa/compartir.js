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
async function abrirCorto(c){if(typeof toast==="function")toast("Abriendo el track compartido…");
  try{const a=await LDCFB.load(),fs=a.fs,d=await fs.getDoc(fs.doc(a.db,"enlaces",c));
    if(!d.exists()){toast("Ese enlace de track ya no existe");return}
    const x=d.data(),pts=JSON.parse(x.d);let km=x.km;if(!km){km=0;for(let i=1;i<pts.length;i++)km+=map.distance(pts[i-1],pts[i]);km=Math.round(km/100)/10}
    mostrar({n:x.n||"Track compartido",pts,km,up:x.up!=null?x.up:undefined},"enlace")}
  catch(e){toast(navigator.onLine?"No he podido abrir ese track":"Sin conexión: abre el enlace cuando tengas cobertura")}}
function cache(t){try{const m=JSON.parse(localStorage.getItem(EK)||"{}")[t.id],h=t.n+"|"+t.pts.length+"|"+t.pts[0][0]+"|"+t.pts[t.pts.length-1][1];return m&&m.h===h?base()+"#c="+m.c:null}catch(e){return null}}
async function compartir(t){const r=t.src==="blog"?R.find(x=>x.u===t.u):null;if(r){shareRoute(r);return}
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
  if(/^#c=[A-Za-z0-9]{4,20}$/.test(h)){const c=h.slice(3);try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}if(window.LDCFB)abrirCorto(c);return true}
  if(!h.startsWith("#t="))return false;
  const raw=h.slice(3),cut=raw.lastIndexOf("!"),code=decodeURIComponent(cut>=0?raw.slice(0,cut):raw),nm=cut>=0?raw.slice(cut+1):"";let pts=[];try{pts=dec(code)}catch(e){}
  try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}
  if(pts.length<2){toast("Ese enlace de track no es válido");return true}
  const n=decodeURIComponent(nm||"Track compartido");let km=0;for(let i=1;i<pts.length;i++)km+=map.distance(pts[i-1],pts[i]);km=Math.round(km/100)/10;
  mostrar({n,pts,km},"enlace");return true}
// enseñar un track sin guardarlo: desde un enlace o desde un archivo compartido con la app
function mostrar(t,origen){const n=t.n,pts=t.pts,km=t.km;
  if(typeof showView==="function")showView("mapa");
  if(TMP)TMP.remove();TMP=L.layerGroup([L.polyline(pts,{color:"#fff",weight:8,opacity:.9}),L.polyline(pts,{color:"#7b2cbf",weight:5,opacity:.95,dashArray:"10 6"})]).addTo(map);
  map.fitBounds(L.latLngBounds(pts),{paddingTopLeft:[30,90],paddingBottomRight:innerWidth>=860?[480,30]:[30,Math.round(innerHeight*.5)],maxZoom:15});
  const ya=MPI.tracks().find(t=>t.pts&&t.pts.length&&t.n===n&&Math.abs(t.pts[0][0]-pts[0][0])<1e-4);
  MPI.show(`<div class="sheet-head"><h2>${esc(n)}</h2><button class="x" aria-label="Cerrar" data-close data-tmpx>×</button></div>
    <div class="meta"><span class="tag">${origen==="archivo"?"Archivo GPX/KML":"Track compartido"}</span><span class="tag">${km.toLocaleString("es-ES")} km</span>${t.up!=null?`<span class="tag">+${t.up.toLocaleString("es-ES")} m</span>`:""}</div>
    <p class="note">${origen==="archivo"?"Solo lo estás viendo: no se ha guardado.":"Te lo han pasado por enlace."} Guárdalo en Mis tracks si quieres tenerlo siempre, seguirlo otro día o descargar su mapa.</p>
    <div class="topacts"><button class="btn primary" data-tmpsave>${ya?"★ Ya guardado":"☆ Guardar en Mis tracks"}</button><button class="btn ghost" data-tmpfol>▶ Seguir</button></div>${(()=>{const q=pts.reduce((b,x)=>x[2]!=null&&(b[2]==null||x[2]>b[2])?x:b,pts[0]);return`<div class="wx" data-lat="${q[0]}" data-lon="${q[1]}" data-alt="${q[2]!=null?Math.round(q[2]):""}"></div>`})()}`);
  sheet._tmp={n,pts,km,up:t.up,dn:t.dn,mx:t.mx,mn:t.mn}}
sheet.addEventListener("click",e=>{const d=sheet._tmp;
  if(e.target.closest("[data-tmpx]")&&TMP){TMP.remove();TMP=null}
  if(!d)return;
  if(e.target.closest("[data-tmpfol]")){if(TMP){TMP.remove();TMP=null}SEGUIR.start({u:"tmp",ti:d.n,gx:{ln:d.pts,km:d.km}},false);return}
  if(e.target.closest("[data-tmpsave]")){const go=()=>{const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      const o={id,n:d.n,km:d.km,pts:d.pts,src:"gpx",f:new Date().toISOString()};MPI.desn(o);MPI.saveTracks([...MPI.tracks(),o]);if(d.pts.some(p=>p[2]==null))MPI.demAlt(id);if(TMP){TMP.remove();TMP=null}
      sheet._tmp=null;toast("Guardado en Mis cosas › Mis tracks");if(window.MISTRACKS)MISTRACKS.open(id,false)};
    if(window.cuentaOk&&!cuentaOk(go,"tracks"))return;go()}});
addEventListener("hashchange",abrirCompartido);setTimeout(abrirCompartido,600);

/* archivos que llegan desde «Compartir › LdC Rutas» (Android) o «Abrir con» (ordenador) */
async function recibidos(){if(!/[?&]recibido/.test(location.search))return;
  try{history.replaceState(null,"",location.pathname)}catch(e){}
  let L0=[];try{const c=await caches.open("ldc-share");const r=await c.match("recibido");if(r)L0=await r.json();await c.delete("recibido")}catch(e){}
  if(!L0.length){toast("Solo puedo abrir archivos GPX o KML");return}
  for(const f of L0)MPI.importText(f.t,f.n||"track.gpx",true)}
setTimeout(recibidos,700);
if("launchQueue" in window)launchQueue.setConsumer(async p=>{if(!p.files||!p.files.length)return;const fs=[];for(const h of p.files){try{const f=await h.getFile();fs.push({n:f.name,t:await f.text()})}catch(e){}}
  for(const f of fs)MPI.importText(f.t,f.n,true)});

window.COMPARTIR={track:compartir,enc,dec,preview:t=>mostrar(t,"archivo")};
})();
