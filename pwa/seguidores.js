/* ---------- 👥 Seguidores: puntos y tracks que comparte la gente, revisados antes por Los de las Claras ----------
   · En la ficha de un punto o un track tuyo: «👥 Proponer al grupo» (con comentario y enlaces: blog, fotos, Wikiloc…).
   · La propuesta solo la ven quien la manda y el administrador. Al aceptarla se publica en la pestaña Seguidores.
   · Firestore: propuestas/{id} (pendientes) y seguidores/{id} (publicadas, las ve todo el mundo). */
(function(){
const ADM=["losdelasclaras@gmail.com","jcrespopazos@gmail.com"];
const MPI=window.MISPUNTOS,CK="ldc-seg";
const esAdm=()=>{const u=window.LDCFB&&LDCFB.user();return!!(u&&u.email&&ADM.includes(u.email.toLowerCase()))};
document.head.insertAdjacentHTML("beforeend",`<style>
@media(max-width:430px){nav.tabs button{font-size:11.5px;letter-spacing:0;padding:8px 1px 10px}}
.segbox{border:1px solid var(--edge);border-radius:14px;padding:10px 12px 6px;margin:0 0 14px;background:var(--card)}
.segbox.adm{border:2px solid #c3262e}
.segbox h2{margin:0 0 6px;font-size:17px}
.segrow{display:flex;gap:10px;align-items:flex-start;padding:10px 2px;border-top:1px solid var(--edge);cursor:pointer}
.segrow:first-of-type{border-top:0}
.segrow .e{font-size:24px;line-height:1.1;flex:none;width:30px;text-align:center}
.segrow .b{flex:1;min-width:0}.segrow .b b{display:block;font-size:16px}
.segrow .b small{display:block;color:var(--muted);font-size:13px;line-height:1.3}
.segrow .b .c{color:var(--ink);font-size:13.5px;margin-top:2px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.segacts{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.seglinks{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 4px}
.segform label{display:block;font-weight:700;margin:12px 0 4px}
.segform input,.segform textarea{width:100%;box-sizing:border-box;border:1px solid var(--edge);border-radius:10px;padding:10px;font:inherit;font-size:16px;background:var(--paper);color:var(--ink)}
.segform textarea{min-height:80px;resize:vertical}
.segok{background:#2a7a3b!important;border-color:#2a7a3b!important;color:#fff!important}
.segno{background:#fff!important;border-color:#c3262e!important;color:#c3262e!important}
#seg-adm:empty,#seg-mias:empty{display:none}
.segvacio{color:var(--muted);padding:6px 2px 10px}
</style>`);

/* --- la pestaña --- */
const main=document.querySelector("main");
const sec=document.createElement("section");sec.className="view pad";sec.id="v-seg";sec.hidden=true;
sec.innerHTML=`<div class="inner"><h1 class="vt">Seguidores</h1>
<p class="lead">Puntos y tracks que comparten los seguidores del blog: fuentes, variantes, rutas que han hecho… Lo revisa Los de las Claras antes de publicarlo.</p>
<p class="note" style="margin:-4px 0 14px">¿Quieres compartir algo tuyo? Ábrelo en <b>Mis cosas</b> y pulsa <b>«👥 Proponer al grupo»</b>.</p>
<div id="seg-adm"></div><div id="seg-mias"></div><div id="seg-pub"></div></div>`;
main.appendChild(sec);
const $=id=>document.getElementById(id);

const J=s=>{try{return JSON.parse(s)}catch(e){return null}};
const fecha=t=>t?new Date(t).toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"}):"";
const kmT=k=>k?(Math.round(k*10)/10).toLocaleString("es-ES")+" km":"";
function linkIco(u){const h=(u.match(/^https?:\/\/([^/]+)/i)||[,""])[1].toLowerCase();
  return /photos\.google|photos\.app|flickr|500px|imgur|icloud/.test(h)?["📷","Ver fotos"]:/wikiloc/.test(h)?["🧭","Wikiloc"]:/youtu|vimeo/.test(h)?["🎬","Ver vídeo"]:
    /instagram/.test(h)?["📸","Instagram"]:/facebook/.test(h)?["👍","Facebook"]:/blogspot|wordpress|blog/.test(h)?["📝","Leer la crónica"]:["🔗",h.replace(/^www\./,"")||"Enlace"]}
const emo=x=>x.tipo==="carpeta"?"📁":x.tipo==="track"?"🧵":(MPI.emo?MPI.emo((x.dd||{}).ic):"📍");
const cuentaC=d=>{const a=(d.ps||[]).length,b=(d.ts||[]).length;return" · "+[a?a+" punto"+(a===1?"":"s"):"",b?b+" track"+(b===1?"":"s"):""].filter(Boolean).join(" y ")};
function fila(x,modo){const d=x.dd||{};
  return`<div class="segrow" data-seg="${esc(x.id)}" data-modo="${modo}"><span class="e">${emo(x)}</span><span class="b"><b>${esc(x.n)}</b>
  <small>${x.tipo==="carpeta"?"Carpeta"+cuentaC(d):x.tipo==="track"?"Track":"Punto"}${d.km?" · "+kmT(d.km):""}${d.up?" · +"+d.up.toLocaleString("es-ES")+" m":""}${d.a?" · "+d.a.toLocaleString("es-ES")+" m":""} · ${esc(x.quien||"")} · ${fecha(x.tp||x.t)}</small>
  ${x.com?`<span class="c">${esc(x.com)}</span>`:""}
  ${modo==="rev"?`<span class="segacts"><button class="mpb segok" data-segok="${esc(x.id)}">✓ Publicar</button><button class="mpb segno" data-segno="${esc(x.id)}">✕ Rechazar</button></span>`:""}</span></div>`}

/* --- datos --- */
let PUB=(J(localStorage.getItem(CK)||"null")||[]).map(x=>({...x,dd:J(x.d)||{}})),REV=[],MIAS=[],A=null;
const GRP=L.layerGroup();let DIB="";if(!map.getPane("segp")){map.createPane("segp").style.zIndex=640}
if(LAY.seg===undefined)LAY.seg=true;
const conDatos=d=>{const x=d.data();return{...x,id:d.id,dd:J(x.d)||{}}};
async function fb(){if(A)return A;if(!window.LDCFB)throw new Error("sin Firebase");A=await LDCFB.load();return A}
async function cargarPub(){try{const a=await fb(),fs=a.fs;
    const s=await fs.getDocs(fs.query(fs.collection(a.db,"seguidores"),fs.orderBy("tp","desc"),fs.limit(300)));
    PUB=[];s.forEach(d=>PUB.push(conDatos(d)));
    try{localStorage.setItem(CK,JSON.stringify(PUB.map(({dd,...x})=>x)))}catch(e){}
  }catch(e){console.warn("seguidores",e)}pinta()}
async function cargarRev(){REV=[];MIAS=[];const u=window.LDCFB&&LDCFB.user();if(!u){pinta();badge();return}
  try{const a=await fb(),fs=a.fs,c=fs.collection(a.db,"propuestas");
    const s=await fs.getDocs(esAdm()?fs.query(c,fs.orderBy("t","desc")):fs.query(c,fs.where("uid","==",u.uid)));
    s.forEach(d=>(esAdm()?REV:MIAS).push(conDatos(d)));
  }catch(e){console.warn("propuestas",e)}pinta();badge()}
function pinta(){dibuja();
  $("seg-adm").innerHTML=esAdm()?`<div class="segbox adm"><h2>🛡️ Propuestas por revisar (${REV.length})</h2>${REV.length?REV.map(x=>fila(x,"rev")).join(""):`<p class="segvacio">No hay nada pendiente.</p>`}
    <p class="note">Esto solo lo ves tú. Toca una propuesta para verla en el mapa antes de decidir.</p></div>`:"";
  $("seg-mias").innerHTML=MIAS.length?`<div class="segbox"><h2>⏳ Tus propuestas pendientes de revisar</h2>${MIAS.map(x=>fila(x,"mia")).join("")}</div>`:"";
  $("seg-pub").innerHTML=`<div class="segbox"><h2>👥 Compartido por los seguidores</h2>${PUB.length?PUB.map(x=>fila(x,"pub")).join(""):`<p class="segvacio">${navigator.onLine?"Todavía no hay nada publicado. ¡Sé el primero en proponer algo!":"Sin conexión."}</p>`}</div>`}
let BADGE=null;
function badge(){const tab=document.querySelector('nav.tabs [data-v="seg"]');if(!tab)return;
  if(BADGE){BADGE.remove();BADGE=null}
  if(esAdm()&&REV.length){BADGE=document.createElement("span");BADGE.className="nbadge";BADGE.textContent=REV.length;tab.appendChild(BADGE)}}
if(!document.querySelector("style[data-nbadge]"))document.head.insertAdjacentHTML("beforeend",`<style data-nbadge>nav.tabs button{position:relative}nav.tabs .nbadge{position:absolute;top:4px;left:calc(50% + 6px);min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#c3262e;color:#fff;font:800 11.5px/18px system-ui;letter-spacing:0;box-shadow:0 0 0 2px var(--paper)}</style>`);
pinta();
// al entrar en la pestaña se actualiza; al entrar con la cuenta se miran las propuestas
new MutationObserver(()=>{if(!sec.hidden){cargarPub();cargarRev()}}).observe(sec,{attributes:true,attributeFilter:["hidden"]});
addEventListener("ldc-user",()=>setTimeout(cargarRev,500));

/* --- ver una en el mapa --- */
let TMP=null;
const quitaTmp=()=>{if(TMP){TMP.remove();TMP=null}};
function ver(x,modo){const d=x.dd||{};if(typeof showView==="function")showView("mapa");quitaTmp();
  const pad={paddingTopLeft:[30,90],paddingBottomRight:innerWidth>=860?[480,30]:[30,Math.round(innerHeight*.5)],maxZoom:15};
  let q=null;
  if(x.tipo==="track"&&d.pts&&d.pts.length>1){TMP=L.layerGroup([L.polyline(d.pts,{color:"#fff",weight:8,opacity:.9}),L.polyline(d.pts,{color:"#d9480f",weight:5,opacity:.95})]).addTo(map);
    map.fitBounds(L.latLngBounds(d.pts),pad);q=d.pts.reduce((b,p)=>p[2]!=null&&(b[2]==null||p[2]>b[2])?p:b,d.pts[0])}
  else if(x.tipo==="carpeta"){const ts=(d.ts||[]).filter(t=>t.pts&&t.pts.length>1),ps=d.ps||[];
    TMP=L.layerGroup([...ts.flatMap(t=>[L.polyline(t.pts,{color:"#fff",weight:8,opacity:.9}),L.polyline(t.pts,{color:"#d9480f",weight:5,opacity:.95})]),
      ...ps.map(p=>L.marker([p.lat,p.lon],{icon:L.divIcon({className:"",html:`<div class="segmk">${MPI.emo?MPI.emo(p.ic):"📍"}</div>`,iconSize:[30,30],iconAnchor:[15,15]}),pane:"segp"}).bindTooltip(esc(p.n)))]).addTo(map);
    const ll=[...ps.map(p=>[p.lat,p.lon]),...ts.flatMap(t=>t.pts.map(q=>[q[0],q[1]]))];if(ll.length===1)map.setView(ll[0],15);else if(ll.length)map.fitBounds(L.latLngBounds(ll),pad);
    const all=[...ps.map(p=>[p.lat,p.lon,p.a]),...ts.flatMap(t=>t.pts)];q=all.reduce((b,p)=>p[2]!=null&&(b[2]==null||p[2]>b[2])?p:b,all[0])}
  else if(d.lat!=null){TMP=L.layerGroup([L.circleMarker([d.lat,d.lon],{radius:11,color:"#fff",weight:3,fillColor:"#d9480f",fillOpacity:1})]).addTo(map);
    map.setView([d.lat,d.lon],Math.max(map.getZoom(),14));q=[d.lat,d.lon,d.a]}
  const links=(x.links||[]).filter(u=>/^https?:\/\//i.test(u));
  const yo=window.LDCFB&&LDCFB.user();
  MPI.show(`<div class="sheet-head"><h2>${emo(x)} ${esc(x.n)}</h2><button class="x" aria-label="Cerrar" data-close data-segx>×</button></div>
  ${modo==="rev"?`<div class="topacts"><button class="btn primary segok" data-segok="${esc(x.id)}">✓ Publicar</button><button class="btn ghost segno" data-segno="${esc(x.id)}">✕ Rechazar</button></div>`:
    x.tipo==="carpeta"?`<div class="topacts">${(d.ts||[]).length===1?`<button class="btn primary" data-segfol>▶ Seguir</button>`:""}<button class="btn ${(d.ts||[]).length===1?"ghost":"primary"}" data-segsave>☆ Guardar</button></div>`:
    x.tipo==="track"?`<div class="topacts"><button class="btn primary" data-segfol>▶ Seguir</button><button class="btn ghost" data-segsave>☆ Guardar</button></div>`:
    `<div class="topacts"><a class="btn primary" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lon}">🚗 Cómo llegar</a><button class="btn ghost" data-segsave>☆ Guardar</button></div>`}
  <div class="meta"><span class="tag">👥 ${esc(x.quien||"Seguidor")}</span>${d.km?`<span class="tag">${kmT(d.km)}</span>`:""}${d.up?`<span class="tag">+${d.up.toLocaleString("es-ES")} m</span>`:""}${d.a?`<span class="tag alt">${d.a.toLocaleString("es-ES")} m</span>`:""}<span class="tag">${modo==="rev"||modo==="mia"?"Enviado":"Publicado"} el ${fecha(x.tp||x.t)}</span></div>
  ${modo==="rev"&&x.email?`<p class="note">Lo manda ${esc(x.email)}</p>`:""}
  ${modo==="mia"?`<p class="note">⏳ Pendiente de revisar. Cuando se publique aparecerá en Seguidores.</p>`:""}
  ${x.com?`<p class="desc" style="white-space:pre-wrap">${esc(x.com)}</p>`:""}
  ${x.tipo==="carpeta"?`<div style="margin:8px 0">${(d.ts||[]).map(t=>`<div class="segrow" style="cursor:default"><span class="e">🧵</span><span class="b"><b>${esc(t.n)}</b><small>Track${t.km?" · "+kmT(t.km):""}${t.up?" · +"+t.up.toLocaleString("es-ES")+" m":""}</small></span></div>`).join("")}${(d.ps||[]).map(p=>`<div class="segrow" style="cursor:default"><span class="e">${MPI.emo?MPI.emo(p.ic):"📍"}</span><span class="b"><b>${esc(p.n)}</b><small>${p.a?p.a.toLocaleString("es-ES")+" m":""}${p.nota?" · "+esc(p.nota):""}</small></span></div>`).join("")}</div>`:""}
  ${links.length?`<div class="seglinks">${links.map(u=>{const[i,t]=linkIco(u);return`<a class="mpb" target="_blank" rel="noopener nofollow" href="${esc(u)}">${i} ${esc(t)}</a>`}).join("")}</div>`:""}
  ${(modo==="pub"&&(esAdm()||(yo&&yo.uid===x.uid)))||modo==="mia"?`<div class="mpacts"><button class="mpb dan" data-segdel="${esc(x.id)}" data-modo="${modo}">🗑 ${modo==="mia"?"Retirar mi propuesta":"Quitar de Seguidores"}</button></div>`:""}
  ${q?`<h3 style="font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 4px">El tiempo</h3><div class="wx" data-lat="${q[0]}" data-lon="${q[1]}" data-alt="${q[2]!=null?Math.round(q[2]):""}"></div>`:""}`);
  sheet._seg=x}
const busca=(id,modo)=>(modo==="rev"?REV:modo==="mia"?MIAS:PUB).find(x=>x.id===id);
sec.addEventListener("click",e=>{if(e.target.closest("button"))return;const r=e.target.closest("[data-seg]");if(!r)return;const x=busca(r.dataset.seg,r.dataset.modo);if(x)ver(x,r.dataset.modo)});

/* --- publicar, rechazar, quitar (el administrador) --- */
async function publicar(id){const x=REV.find(y=>y.id===id);if(!x)return;
  try{const a=await fb(),fs=a.fs;const{dd,email,id:_i,...o}=x;
    await fs.setDoc(fs.doc(a.db,"seguidores",id),{...o,tp:Date.now()});await fs.deleteDoc(fs.doc(a.db,"propuestas",id));
    toast("Publicado en Seguidores ✓");fin()}catch(e){toast("No se ha podido publicar: "+(e.code||e.message))}}
async function rechazar(id){if(!confirm("¿Rechazar esta propuesta? Se borrará."))return;
  try{const a=await fb();await a.fs.deleteDoc(a.fs.doc(a.db,"propuestas",id));toast("Propuesta rechazada");fin()}catch(e){toast("No se ha podido borrar: "+(e.code||e.message))}}
async function quitar(id,modo){if(!confirm(modo==="mia"?"¿Retirar tu propuesta?":"¿Quitarlo de Seguidores?"))return;
  try{const a=await fb();await a.fs.deleteDoc(a.fs.doc(a.db,modo==="mia"?"propuestas":"seguidores",id));toast("Quitado");fin()}catch(e){toast("No se ha podido quitar: "+(e.code||e.message))}}
function fin(){if(sheet._seg){sheet.hidden=true;sheet._seg=null;quitaTmp()}cargarPub();cargarRev()}
document.addEventListener("click",e=>{let b;
  if(b=e.target.closest("[data-segok]")){e.stopPropagation();publicar(b.dataset.segok);return}
  if(b=e.target.closest("[data-segno]")){e.stopPropagation();rechazar(b.dataset.segno);return}
  if(b=e.target.closest("[data-segdel]")){quitar(b.dataset.segdel,b.dataset.modo);return}});

/* --- en la ficha: seguir, guardar, cerrar --- */
sheet.addEventListener("click",e=>{const x=sheet._seg;
  if(e.target.closest("[data-segx]"))quitaTmp();
  if(!x)return;const d=x.dd||{};
  if(e.target.closest("[data-segfol]")){quitaTmp();const t=x.tipo==="carpeta"?(d.ts||[])[0]:d;if(t)SEGUIR.start({u:"tmp",ti:x.tipo==="carpeta"?t.n:x.n,gx:{ln:t.pts,km:t.km}},false);return}
  if(e.target.closest("[data-segsave]")){const go=()=>{const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6),nota=[x.com,"Compartido por "+(x.quien||"un seguidor"),...(x.links||[])].filter(Boolean).join("\n");
      if(x.tipo==="carpeta"){const k=MPI.guardarCarpeta(x.n,d.ps||[],d.ts||[],nota);toast(k?`Guardado en la carpeta «${x.n}» (Mis cosas › Puntos)`:"Ya tenías todo eso");quitaTmp();sheet.hidden=true;return}
      if(x.tipo==="track"){const o={id,n:x.n,km:d.km,pts:d.pts,src:"gpx",f:new Date().toISOString()};MPI.desn(o);MPI.saveTracks([...MPI.tracks(),o]);toast("Guardado en Mis cosas › Tracks")}
      else{MPI.addPoint({id,n:x.n,lat:d.lat,lon:d.lon,a:d.a,ic:d.ic||"otro",nota,f:new Date().toISOString()});toast("Guardado en Mis cosas › Puntos")}};
    if(window.cuentaOk&&!cuentaOk(go,x.tipo==="track"?"tracks":"puntos"))return;go()}});
addEventListener("keydown",e=>{if(e.key==="Escape")quitaTmp()});

/* --- «👥 Proponer al grupo» en la ficha de un punto o un track tuyo --- */
const r1=v=>Math.round(v*1e5)/1e5;
function deMio(){const pb=sheet.querySelector("[data-mpshare]");
  if(pb){const p=MPI.get().find(x=>String(x.id)===pb.dataset.mpshare);return p?{tipo:"punto",n:p.n,com:p.nota||"",dd:{lat:r1(p.lat),lon:r1(p.lon),a:p.a!=null?Math.round(p.a):null,ic:p.ic||"otro"}}:null}
  if(sheet.querySelector("[data-mtfol]")&&!sheet.querySelector("[data-mtroute]")&&sheet._mt!=null){const t=MPI.tracks().find(x=>String(x.id)===String(sheet._mt));
    if(!t||!t.pts||t.pts.length<2)return null;
    const st=Math.max(1,Math.ceil(t.pts.length/3000)),pts=t.pts.filter((_,i)=>i%st===0||i===t.pts.length-1).map(p=>p[2]!=null?[r1(p[0]),r1(p[1]),Math.round(p[2])]:[r1(p[0]),r1(p[1])]);
    return{tipo:"track",n:t.n,com:"",dd:{pts,km:t.km,up:t.up,dn:t.dn}}}
  return null}
new MutationObserver(()=>{if(sheet.hidden||sheet.querySelector("[data-segprop]")||sheet.querySelector(".segform"))return;
  const acts=sheet.querySelector(".mpacts");if(!acts||!deMio())return;
  acts.insertAdjacentHTML("afterbegin",`<button class="mpb" data-segprop style="border-color:#d9480f;color:#d9480f;font-weight:700">👥 Proponer al grupo</button>`)}).observe(sheet,{childList:true});
let PROP=null;
sheet.addEventListener("click",e=>{
  if(e.target.closest("[data-segprop]")){const it=deMio();if(!it)return;proponer(it);return}
  if(e.target.closest("[data-segsend]")&&PROP){enviar(e.target.closest("[data-segsend]"))}});
function proponer(it){
    const go=()=>{PROP=it;const u=LDCFB.user()||{};
      MPI.show(`<div class="sheet-head"><h2>👥 Proponer al grupo</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
      <p>${it.tipo==="carpeta"?"📁 Carpeta":it.tipo==="track"?"🧵 Track":"📍 Punto"} <b>${esc(it.n)}</b>${it.tipo==="carpeta"?cuentaC(it.dd):""}${it.dd.km?" · "+kmT(it.dd.km):""}</p>
      <p class="note">Lo revisa Los de las Claras y, si encaja, se publica en la pestaña <b>Seguidores</b> para todo el mundo. Tu correo no se publica.</p>
      <div class="segform"><label>Nombre con el que aparecerás</label><input data-segq maxlength="40" value="${esc((u.displayName||"").trim())}">
      <label>Cuéntanos algo</label><textarea data-segc maxlength="1500" placeholder="${it.tipo!=="punto"?"Cuándo la hiciste, estado del camino, por dónde va…":"Qué hay aquí: fuente, paso, mirador…"}">${esc(it.com)}</textarea>
      <label>Enlaces (opcional)</label><textarea data-segl style="min-height:60px" placeholder="Tu blog, álbum de fotos, Wikiloc, YouTube… uno por línea"></textarea></div>
      <div class="mpacts"><button class="mpb pri" data-segsend>📨 Enviar propuesta</button><button class="mpb" data-close>Cancelar</button></div>`)};
    if(window.cuentaOk&&!cuentaOk(go,"proponer"))return;go()}
function proponerCarpeta(n,ps,ts){const pts=q=>{const st=Math.max(1,Math.ceil(q.length/1500));return q.filter((_,i)=>i%st===0||i===q.length-1).map(p=>p[2]!=null?[r1(p[0]),r1(p[1]),Math.round(p[2])]:[r1(p[0]),r1(p[1])])};
  const dd={ps:ps.map(p=>({n:p.n,lat:r1(p.lat),lon:r1(p.lon),a:p.a!=null?Math.round(p.a):null,ic:p.ic||"otro",nota:p.nota||""})),
    ts:ts.map(t=>{const q=MPI.ptsOf(t)||[];return q.length>1?{n:t.n,km:t.km||null,up:t.up!=null?t.up:null,pts:pts(q)}:null}).filter(Boolean)};
  if(typeof showView==="function")showView("mapa");proponer({tipo:"carpeta",n,com:"",dd})}
async function enviar(b){const u=LDCFB.user();if(!u){toast("Entra con tu cuenta de Google");return}
  const quien=(sheet.querySelector("[data-segq]").value||"").trim().slice(0,40)||"Un seguidor",com=(sheet.querySelector("[data-segc]").value||"").trim().slice(0,1500);
  const links=(sheet.querySelector("[data-segl]").value||"").split(/\s+/).map(s=>s.trim()).filter(s=>/^https?:\/\/\S+\.\S+/i.test(s)).slice(0,5).map(s=>s.slice(0,300));
  const bad=(sheet.querySelector("[data-segl]").value||"").split(/\s+/).filter(s=>s&&!/^https?:\/\//i.test(s));
  if(bad.length&&!confirm("Algún enlace no empieza por http:// o https:// y no se enviará. ¿Seguir?"))return;
  b.disabled=true;b.textContent="Enviando…";
  try{const a=await fb(),fs=a.fs;
    await fs.addDoc(fs.collection(a.db,"propuestas"),{tipo:PROP.tipo,n:PROP.n.slice(0,100),com,links,quien,uid:u.uid,email:u.email||"",t:Date.now(),d:JSON.stringify(PROP.dd)});
    PROP=null;sheet.hidden=true;toast("¡Enviado! Cuando se revise aparecerá en Seguidores");cargarRev()}
  catch(e){b.disabled=false;b.textContent="📨 Enviar propuesta";toast("No se ha podido enviar: "+(e.code||e.message))}}
/* --- en el mapa: capa «Seguidores» (naranja), se enciende y apaga en Capas --- */
if(LAY.seg===undefined)LAY.seg=true;
document.head.insertAdjacentHTML("beforeend",`<style>.segmk{width:30px;height:30px;border-radius:50%;background:#fff;border:3px solid #d9480f;display:grid;place-items:center;font-size:15px;box-shadow:0 1px 4px rgba(0,0,0,.35)}.segmk svg{width:18px;height:18px}.lico.seg{background:#d9480f}</style>`);
function dibuja(){const on=LAY.seg&&!LAY.solo&&!window.FOLONLY&&PUB.length;
  if(!on){if(map.hasLayer(GRP))GRP.remove();return}
  const k=PUB.map(x=>x.id).join(",");
  if(k!==DIB){GRP.clearLayers();DIB=k;
    for(const x of PUB){const d=x.dd||{},abre=e=>{if(e&&e.originalEvent)L.DomEvent.stop(e);ver(x,"pub")};
      if(x.tipo==="track"&&d.pts&&d.pts.length>1){
        L.polyline(d.pts,{color:"#fff",weight:7,opacity:.85,interactive:false}).addTo(GRP);
        L.polyline(d.pts,{color:"#d9480f",weight:4,opacity:.95,dashArray:"8 6",interactive:false}).addTo(GRP);
        L.polyline(d.pts,{color:"#000",weight:18,opacity:0}).on("click",abre).bindTooltip("👥 "+x.n,{sticky:true}).addTo(GRP);
        L.marker(d.pts[0],{icon:L.divIcon({className:"",html:'<div class="segmk">🧵</div>',iconSize:[30,30],iconAnchor:[15,15]}),zIndexOffset:400,pane:"segp"}).on("click",abre).bindTooltip("👥 "+x.n).addTo(GRP)}
      else if(x.tipo==="carpeta"){for(const t of d.ts||[]){if(!t.pts||t.pts.length<2)continue;
          L.polyline(t.pts,{color:"#fff",weight:7,opacity:.85,interactive:false}).addTo(GRP);L.polyline(t.pts,{color:"#d9480f",weight:4,opacity:.95,dashArray:"8 6",interactive:false}).addTo(GRP);
          L.polyline(t.pts,{color:"#000",weight:18,opacity:0}).on("click",abre).bindTooltip("👥 "+x.n,{sticky:true}).addTo(GRP)}
        for(const p of d.ps||[])L.marker([p.lat,p.lon],{icon:L.divIcon({className:"",html:`<div class="segmk">${MPI.emo?MPI.emo(p.ic):"📍"}</div>`,iconSize:[30,30],iconAnchor:[15,15]}),zIndexOffset:400,pane:"segp"}).on("click",abre).bindTooltip("👥 "+esc(p.n)+" · "+esc(x.n)).addTo(GRP)}
      else if(d.lat!=null){L.marker([d.lat,d.lon],{icon:L.divIcon({className:"",html:`<div class="segmk">${emo(x)}</div>`,iconSize:[30,30],iconAnchor:[15,15]}),zIndexOffset:400,pane:"segp"}).on("click",abre).bindTooltip("👥 "+x.n).addTo(GRP)}}}
  if(!map.hasLayer(GRP))GRP.addTo(map)}
const lp=document.querySelector(".laypanel"),solo=lp&&lp.querySelector('[data-lay="solo"]');
if(solo)solo.insertAdjacentHTML("beforebegin",`<button class="lay" data-lay="seg" aria-pressed="${LAY.seg}"><span class="lico seg">👥</span>Seguidores</button>`);
document.querySelector(".legend").addEventListener("click",e=>{if(e.target.closest("[data-lay]"))setTimeout(dibuja,0)});
new MutationObserver(dibuja).observe(document.getElementById("map"),{attributes:true,attributeFilter:["class"]});
dibuja();
setTimeout(()=>{if(navigator.onLine)cargarPub()},4000);   // al abrir la app, lo último publicado
window.SEGUIDORES={proponerCarpeta,recargar:()=>{cargarPub();cargarRev()}};
})();
