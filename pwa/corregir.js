/* ---------- ✏️ Corregir una ruta a mano (18 nov 2026) ----------
   En «··· Otras opciones» de la ficha de una ruta sale «✏️ Corregir esta ruta» SOLO para:
     · los administradores (todas las rutas) y
     · cada colaborador en las suyas (Firestore › editores/<correo> = {co:"c3"}; los da de alta un administrador desde este mismo cuadro).
   Se puede cambiar: la entrada del blog (buscador de su blog o pegar la dirección; o «no tiene entrada»), el track (subir otro GPX/KML
   o «sin track»), el enlace de Wikiloc, el nombre, la fecha y ocultar la ruta (solo colaboradores).
   Se guarda en Firestore › correcciones/<id> = {k, co, u, sb, n, f, di, wk, tr, oc, t}. El robot lo aplica esa noche y MANDA sobre
   lo que saca él solo (robot/actualizar.py › correcciones / aplicar_correcciones; app/assemble.py para las del grupo).
   k = "g|<entrada>" (rutas del grupo) o "<colaborador>|<id estable>" (c.r[i][11]).
   Para quitarlo: borrar 'corregir' de _mods en pwa/build_pwa.py. */
(function(){
const sh=document.getElementById("sheet");if(!sh)return;
const ADM=["losdelasclaras@gmail.com","jcrespopazos@gmail.com"];
const usr=()=>window.LDCFB&&LDCFB.user&&LDCFB.user();
const fb=()=>window.LDCFB?LDCFB.load():Promise.reject(new Error("sin Firebase"));
const em=()=>{const u=usr();return u&&u.email?u.email.toLowerCase():""};
const esAdm=()=>ADM.includes(em());
const BLOGG="https://losdelasclaras.blogspot.com";
let ED={em:"",co:null,ok:false};   // de qué colaborador es editor el usuario (null = de ninguno)
async function miPermiso(){const e=em();if(!e){ED={em:"",co:null,ok:true};return}if(ED.em===e&&ED.ok)return;
  ED={em:e,co:null,ok:false};
  try{const a=await fb(),d=await a.fs.getDoc(a.fs.doc(a.db,"editores",e));ED.co=d.exists()?(d.data().co||null):null}catch(_){}
  ED.ok=true}
const puede=co=>esAdm()||(!!co&&ED.co===co);
const hash=s=>{let h=5381;for(const ch of String(s))h=((h<<5)+h+ch.charCodeAt(0))>>>0;return h.toString(36)};
const idDe=k=>k.split("|")[0]+"_"+hash(k);
// 24 nov 2026: ⭐ destacar cumbres (pedido por Dani). En la ficha de una cumbre, solo para administradores y para el editor del blog que la tiene.
// Se guarda en correcciones/<id> = {k:"<blog>|dest:<nombre>", co, n, t}; quitarla = borrar el documento. El robot › app/destacadas.json (máx. 50 por blog).
window.EDITOR={destBtn:async(o,sh0)=>{if(!usr()||typeof destKey!=="function")return;await miPermiso();
  const own=o.own||[],x=esAdm()?(own.find(y=>y.co==="g")||own[0]):own.find(y=>y.co===ED.co);if(!x)return;
  if(sh.hidden||!sh._pt||sh._pt.n!==o.n||sh.querySelector(".dstbox"))return;
  const k=destKey(x.co,x.n);
  const pinta=()=>{const on=DESTK.has(k),b=sh.querySelector(".dstb");if(b)b.textContent=on?"✖ Quitar de destacadas":"⭐ Destacar cumbre"};
  const ref=sh.querySelector(".mkblock.fpt");if(!ref)return;
  ref.insertAdjacentHTML("afterend",`<div class="dstbox" style="margin:8px 0 4px"><button class="btn ghost dstb" style="width:100%"></button><p class="note" style="margin:4px 2px 0;font-size:13px">Lo ves porque eres editor${x.co==="g"?" de Los de las Claras":""}. Las destacadas salen más grandes y con estrella en el mapa (máximo 50 por blog).</p></div>`);pinta();
  sh.querySelector(".dstb").onclick=async ev=>{const b=ev.currentTarget,on=DESTK.has(k);
    if(!on&&[...DESTK].filter(q=>q.startsWith(x.co+"|dest:")).length>=50){toast("Ya hay 50 cumbres destacadas de este blog: quita alguna antes");return}
    b.disabled=true;
    try{const a=await fb(),ref=a.fs.doc(a.db,"correcciones",idDe(k));
      if(on)await a.fs.deleteDoc(ref);else await a.fs.setDoc(ref,{k,co:x.co,n:x.n,t:Date.now()});
      if(on)DESTK.delete(k);else DESTK.add(k);DESTL[k]=!on;try{localStorage.setItem("ldc-dest-loc",JSON.stringify(DESTL))}catch(e){}
      toast(on?"Quitada de destacadas · para todos, mañana":"⭐ Destacada · tú la verás al volver a abrir la app; los demás, mañana");pinta()}
    catch(err){toast(/permission|insufficient/i.test(String(err&&err.message))?"No tienes permiso para destacar esta cumbre":"No se ha podido guardar ahora; prueba con cobertura")}
    b.disabled=false}}};
const DIFS=[["baja","Baja"],["moderada","Moderada"],["alta","Alta"],["muy-alta","Muy alta"]];
const MES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

document.head.insertAdjacentHTML("beforeend",`<style>
.crvel{position:fixed;inset:0;background:rgba(20,26,23,.55);z-index:4000}
.crdlg{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94vw);max-height:90vh;overflow:auto;z-index:4001;background:var(--card,#fff);color:var(--ink);border-radius:18px;padding:16px 16px 20px;box-shadow:0 10px 40px rgba(0,0,0,.35);font-size:16px}
.crdlg h2{margin:0 0 2px;font-size:22px}.crdlg .crsub{margin:0 0 12px;color:var(--muted);font-size:15px}
.crdlg .crx{position:absolute;right:12px;top:12px;width:44px;height:44px;border-radius:999px;border:0;background:var(--mark,#c3262e);color:#fff;font-size:26px;cursor:pointer}
.crdlg fieldset{border:1.5px solid var(--edge,#ddd);border-radius:14px;margin:0 0 12px;padding:10px 12px}
.crdlg legend{font-weight:800;font-size:16px;padding:0 6px}
.crdlg label{display:flex;align-items:center;gap:8px;min-height:40px;font-size:16px;cursor:pointer}
.crdlg input[type=text],.crdlg input[type=url],.crdlg input[type=month],.crdlg input[type=email],.crdlg select{width:100%;box-sizing:border-box;min-height:46px;font-size:16px;padding:8px 10px;border:1.5px solid var(--edge,#ccc);border-radius:10px;background:var(--paper,#fff);color:var(--ink)}
.crdlg input[type=radio],.crdlg input[type=checkbox]{width:22px;height:22px;flex:none}
.crdlg .crnow{font-size:14px;color:var(--muted);margin:0 0 6px;word-break:break-word}
.crdlg .crres{display:flex;flex-direction:column;margin-top:6px;max-height:260px;overflow:auto;border-radius:10px}
.crdlg .crres button{display:block;width:100%;text-align:left;min-height:48px;padding:8px 10px;border:0;border-top:1px solid var(--edge,#e4e4e4);background:none;color:var(--ink);font:inherit;cursor:pointer}
.crdlg .crres button:first-child{border-top:0}.crdlg .crres button small{display:block;color:var(--muted);font-size:13px}
.crdlg .crres button.on{background:#e6f4ea;font-weight:700}
.crdlg .crbtns{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.crdlg .crbtns button{min-height:52px;font-size:17px;font-weight:800;border-radius:12px;border:0;cursor:pointer}
.crdlg .crok{background:#1e8e3e;color:#fff}.crdlg .crdel{background:var(--paper,#f1f1f1);color:#c3262e}.crdlg .crno{background:var(--paper,#f1f1f1);color:var(--ink)}
.crdlg .crnote{font-size:14px;color:var(--muted);margin:6px 0 0;line-height:1.35}
.crdlg .crest{background:#fff4c2;border:1px solid #e9cf5c;color:#5c4400;border-radius:12px;padding:8px 10px;margin:0 0 12px;font-size:15px}
.crdlg .credl div{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid var(--edge,#eee)}
.crdlg .credl div:first-child{border-top:0}.crdlg .credl button{min-height:40px;border-radius:10px;border:0;background:var(--paper,#f1f1f1);color:#c3262e;font-weight:700;padding:0 12px;cursor:pointer}
.crdlg .crfila{display:flex;gap:8px}.crdlg .crfila>*{flex:1}
.crmark{display:inline-block;margin:6px 0 0;font-size:14px;font-weight:700;color:#5c4400;background:#fff4c2;border:1px solid #e9cf5c;border-radius:20px;padding:3px 10px}
</style>`);

/* ---- qué ruta tiene abierta la ficha ---- */
function rutaAbierta(){
  if(!sh.querySelector(".fru"))return null;
  // 23 nov 2026: entrada de blog sin track de un colaborador (fichas2.js › fichaBlog): clave «<colaborador>|b:<entrada original>»
  const bg=sh._blg;if(bg&&bg.co&&sh.querySelector(".fru [data-frshu]"))
    return{co:bg.co.id,quien:bg.co.n,bw:bg.co.bw||"",k:bg.co.id+"|b:"+bg.ko,titulo:bg.t,u:bg.u,wk:"",fe:bg.fe,di:bg.dif,colab:true,blog:true};
  const k=sh._cor;
  if(k&&k.c&&k.c.r&&k.c.r[k.i]){const c=k.c,r=c.r[k.i];
    return{co:c.id,quien:c.n,bw:c.bw||"",k:c.id+"|"+(r[11]||r[6]||r[7]||r[0]),titulo:String(r[0]).split("|").pop().trim(),u:r[7]||"",wk:r[6]||"",fe:r[10]||"",di:r[5]||"",colab:true}}
  const s=sh.querySelector("[data-share]");if(!s||typeof R==="undefined")return null;
  const r=R[+s.getAttribute("data-share")];if(!r||!r.u)return null;
  return{co:"g",quien:"Los de las Claras",bw:BLOGG,k:"g|"+r.u,titulo:r.ti||r.t||"",u:r.u,wk:r.wk||"",fe:r.y?`${r.y}-${String(r.m||1).padStart(2,"0")}`:"",di:r.dl?(typeof DIFN!=="undefined"?DIFN[r.dl]:r.dl):(r.dif||""),colab:false,gx:!!r.gx}}

/* ---- el botón en «Otras opciones» ---- */
async function pon(){const x=rutaAbierta();if(!x)return;const m=sh.querySelector(".frmas");if(!m||m.querySelector("[data-crbtn]"))return;
  if(!usr())return;await miPermiso();if(!puede(x.co==="g"?null:x.co))return;if(m.querySelector("[data-crbtn]"))return;
  m.insertAdjacentHTML("beforeend",`<button class="btn ghost" data-crbtn>✏️ <span>Corregir esta ruta<small>Entrada del blog, track, Wikiloc, nombre, fecha o dificultad · solo lo ves tú</small></span></button>`);
  try{const a=await fb(),d=await a.fs.getDoc(a.fs.doc(a.db,"correcciones",idDe(x.k)));
    if(d.exists()&&!sh.querySelector(".crmark")){const h=sh.querySelector(".sheet-head");if(h)h.insertAdjacentHTML("afterend",`<span class="crmark">✏️ Corregida a mano${d.data().t>Date.now()-864e5?" · se verá mañana":""}</span>`)}}catch(_){}}
new MutationObserver(()=>{if(!sh.hidden&&sh.querySelector(".frmas")&&!sh.querySelector("[data-crbtn]"))pon()}).observe(sh,{childList:true,subtree:true});
sh.addEventListener("click",e=>{if(e.target.closest("[data-crbtn]")){e.preventDefault();e.stopPropagation();const x=rutaAbierta();if(x)abre(x)}},true);

/* ---- buscar entradas en su blog ---- */
function jsonp(url){return new Promise((ok,ko)=>{const cb="__cr"+Date.now()+Math.floor(Math.random()*1e4),s=document.createElement("script");
  const fin=()=>{delete window[cb];s.remove()};const t=setTimeout(()=>{fin();ko(new Error("tarda"))},12000);
  window[cb]=j=>{clearTimeout(t);fin();ok(j)};s.onerror=()=>{clearTimeout(t);fin();ko(new Error("red"))};s.src=url+(url.includes("?")?"&":"?")+"callback="+cb;document.head.appendChild(s)})}
async function buscaBlog(bw,q){bw=String(bw||"").replace(/\/+$/,"");if(!bw)return[];
  if(/blogspot\.|blogger\./.test(bw)){const j=await jsonp(`${bw}/feeds/posts/summary?alt=json-in-script&max-results=25&q=${encodeURIComponent(q)}`);
    return((j.feed&&j.feed.entry)||[]).map(e=>({u:((e.link||[]).find(l=>l.rel==="alternate")||{}).href,t:e.title.$t,f:(e.published&&e.published.$t||"").slice(0,7)})).filter(x=>x.u)}
  const r=await fetch(`${bw}/wp-json/wp/v2/posts?search=${encodeURIComponent(q)}&per_page=20&_fields=link,title,date`);const j=await r.json();
  return(j||[]).map(e=>({u:e.link,t:(e.title&&e.title.rendered||"").replace(/<[^>]+>/g,"").replace(/&#8211;/g,"–").replace(/&amp;/g,"&"),f:(e.date||"").slice(0,7)}))}

/* ---- leer un GPX/KML del móvil ---- */
function leeTrack(txt){const d=new DOMParser().parseFromString(txt,"text/xml");let ll=[];
  d.querySelectorAll("trkpt,rtept").forEach(p=>{const la=+p.getAttribute("lat"),lo=+p.getAttribute("lon");if(!isFinite(la)||!isFinite(lo))return;const e=p.querySelector("ele");ll.push(e&&e.textContent.trim()!==""?[la,lo,Math.round(+e.textContent)]:[la,lo])});
  if(ll.length<2)d.querySelectorAll("LineString coordinates, coordinates").forEach(c=>{if(ll.length>1)return;const v=c.textContent.trim().split(/\s+/).map(s=>s.split(",").map(Number)).filter(a=>a.length>=2&&isFinite(a[0]));if(v.length>1)ll=v.map(a=>a[2]!=null&&isFinite(a[2])?[a[1],a[0],Math.round(a[2])]:[a[1],a[0]])});
  if(ll.length>2500){const s=Math.ceil(ll.length/2500);ll=ll.filter((_,i)=>i%s===0||i===ll.length-1)}
  return ll.map(q=>[+q[0].toFixed(5),+q[1].toFixed(5)].concat(q.length>2?[q[2]]:[]))}
const kmDe=ll=>{let s=0;for(let i=1;i<ll.length;i++){const a=ll[i-1],b=ll[i];s+=Math.hypot((b[0]-a[0])*111.2,(b[1]-a[1])*111.2*Math.cos(a[0]*Math.PI/180))}return s};

/* ---- el cuadro ---- */
let X=null,DOC=null,TR=null,SEL=null;
function cierra(){document.querySelectorAll(".crvel,.crdlg").forEach(n=>n.remove());X=null}
async function abre(x){cierra();X=x;DOC=null;TR=null;SEL=null;
  document.body.insertAdjacentHTML("beforeend",`<div class="crvel"></div><div class="crdlg" role="dialog" aria-label="Corregir esta ruta"><button class="crx" aria-label="Cerrar">×</button>
    <h2>✏️ Corregir esta ruta</h2><p class="crsub">${esc(x.titulo)} · ${esc(x.quien)}</p><div class="crcuerpo"><p>Cargando…</p></div></div>`);
  try{const a=await fb(),d=await a.fs.getDoc(a.fs.doc(a.db,"correcciones",idDe(x.k)));if(d.exists())DOC=d.data()}catch(_){}
  if(X!==x)return;pinta()}
function pinta(){const x=X,d=DOC||{},q=document.querySelector(".crdlg .crcuerpo");if(!q)return;
  const sbOn=!!d.sb,trM=d.tr==="sin"?"sin":(d.tr?"sub":"igual");
  q.innerHTML=`${DOC?`<div class="crest">✏️ Esta ruta ya tiene una corrección a mano. Lo que cambies aquí la sustituye.</div>`:""}
  ${x.colab?`<fieldset><legend>📖 Entrada del blog</legend>
    <p class="crnow">Ahora: ${x.u?`<a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.u.replace(/^https?:\/\//,""))}</a>`:"sin entrada"}</p>
    <label><input type="radio" name="crb" value="igual" ${!d.u&&!sbOn?"checked":""}> Dejarla como está</label>
    <label><input type="radio" name="crb" value="otra" ${d.u?"checked":""}> Poner otra entrada</label>
    <div class="crotra" ${d.u?"":"hidden"}>
      <input type="text" class="crq" placeholder="Busca en ${esc(x.quien)}: un par de palabras (p. ej. «cabrones torre»)" autocomplete="off">
      <div class="crres"></div>
      <p class="crnote">…o pega aquí la dirección de la entrada:</p><input type="url" class="cru" placeholder="https://…" value="${esc(d.u||"")}">
    </div>
    <label><input type="radio" name="crb" value="sin" ${sbOn?"checked":""}> No tiene entrada en el blog</label>
  </fieldset>`:""}
  <fieldset><legend>🧵 Track</legend>
    <label><input type="radio" name="crt" value="igual" ${trM==="igual"?"checked":""}> ${x.blog?"Seguir sin track":"Dejar el que tiene"}</label>
    <label><input type="radio" name="crt" value="sub" ${trM==="sub"?"checked":""}> Poner otro (subir un GPX o KML)</label>
    <div class="crsubir" ${trM==="sub"?"":"hidden"}><input type="file" class="crf" accept=".gpx,.kml,application/gpx+xml,application/vnd.google-earth.kml+xml,text/xml,application/xml">
      <p class="crnote crfi">${d.tr&&d.tr!=="sin"?"Ya hay un track subido en la corrección. Elige otro archivo solo si quieres cambiarlo.":"Elige el archivo del track bueno."}</p></div>
    ${x.blog?`<p class="crnote">Ahora no tiene track: si subes uno, desde mañana se podrá seguir.</p>`:`<label><input type="radio" name="crt" value="sin" ${trM==="sin"?"checked":""}> Esta ruta no tiene track</label>`}
  </fieldset>
  ${x.blog?"":`<fieldset><legend>🔗 Wikiloc</legend>
    <p class="crnote" style="margin:0 0 6px">Ahora: ${x.wk?esc(x.wk.replace(/^https?:\/\//,"")):"sin enlace"}</p>
    <input type="url" class="crwk" placeholder="Dejar como está · o pega el enlace bueno" value="${esc(d.wk&&d.wk!=="-"?d.wk:"")}">
    <label><input type="checkbox" class="crwkq" ${d.wk==="-"?"checked":""}> Quitar el enlace de Wikiloc</label>
  </fieldset>`}
  <fieldset><legend>🏷 Nombre, fecha y dificultad</legend>
    <input type="text" class="crn" placeholder="Nombre: dejar el que tiene" value="${esc(d.n||"")}" maxlength="140">
    <p class="crnote">Fecha de la ruta (déjala vacía para no cambiarla)${x.fe?` · ahora: ${(()=>{const m=/^(\d{4})-(\d{2})/.exec(x.fe);return m?MES[+m[2]-1]+" de "+m[1]:x.fe})()}`:""}</p>
    <input type="month" class="crfe" value="${esc(d.f||"")}">
    <p class="crnote">Dificultad${x.di?` · ahora: ${esc(x.di)}`:" · ahora: sin poner"}</p>
    <select class="crdi"><option value="">Dejar la que tiene</option>${DIFS.map(([k,l])=>`<option value="${k}"${d.di===k?" selected":""}>${l}</option>`).join("")}</select>
  </fieldset>
  ${x.colab?`<fieldset><legend>🙈 Ocultar</legend><label><input type="checkbox" class="croc" ${d.oc?"checked":""}> No enseñar esta ruta en la app (repetida, mal…)</label></fieldset>`:""}
  <div class="crbtns"><button class="crok">💾 Guardar · se verá mañana</button>${DOC?`<button class="crdel">↩️ Quitar mi corrección (que la saque el robot)</button>`:""}<button class="crno">Cancelar</button></div>
  <p class="crnote">Los cambios los pone el robot esa noche y desde entonces mandan sobre lo que saca él solo, aunque se renombren archivos o se cambie el blog.</p>
  ${esAdm()?`<fieldset style="margin-top:14px"><legend>👥 Quién puede corregir</legend><p class="crnote" style="margin:0 0 8px">Los administradores, todas las rutas. Cada colaborador, solo las suyas, con la cuenta de Google que pongas aquí.</p><div class="credl"><p class="crnote">Cargando…</p></div>
    <div class="crfila" style="margin-top:8px"><input type="email" class="cremail" placeholder="correo@gmail.com"><select class="crco">${coOpts()}</select></div>
    <button class="crok" data-craded style="width:100%;margin-top:8px;min-height:48px;border-radius:12px;border:0;font-weight:800;font-size:16px">＋ Dar permiso</button></fieldset>`:""}`;
  if(esAdm())editores()}
function coOpts(){const L=(window.COLX&&COLX.cos?COLX.cos():[]);const seen=new Set(),o=[];
  for(const c of L){if(seen.has(c.id))continue;seen.add(c.id);o.push(`<option value="${esc(c.id)}">${esc(c.n)}</option>`)}
  return o.join("")||`<option value="c2">Rutinas Varias</option><option value="c3">Camudando'l camín</option><option value="c4">Gata con botas</option>`}
async function editores(){const b=document.querySelector(".crdlg .credl");if(!b)return;
  try{const a=await fb(),s=await a.fs.getDocs(a.fs.collection(a.db,"editores"));const v=[];s.forEach(d=>v.push([d.id,d.data().co]));
    const nom=id=>{const c=(window.COLX&&COLX.cos?COLX.cos():[]).find(c=>c.id===id);return c?c.n:id};
    b.innerHTML=v.length?v.map(([e,c])=>`<div><span><b>${esc(e)}</b><br><small>${esc(nom(c))}</small></span><button data-credel="${esc(e)}">Quitar</button></div>`).join(""):`<p class="crnote">Todavía nadie más.</p>`}
  catch(e){b.innerHTML=`<p class="crnote">No se ha podido leer la lista (¿están puestas las reglas nuevas de Firebase?).</p>`}}

document.addEventListener("click",async e=>{const dl=e.target.closest(".crdlg");
  if(e.target.closest(".crvel")||e.target.closest(".crdlg .crx")||e.target.closest(".crdlg .crno")){cierra();return}
  if(!dl)return;
  const pick=e.target.closest(".crres [data-cru]");if(pick){dl.querySelectorAll(".crres button").forEach(b=>b.classList.toggle("on",b===pick));dl.querySelector(".cru").value=pick.getAttribute("data-cru");SEL=pick.getAttribute("data-cru");return}
  if(e.target.closest("[data-craded]")){const m=(dl.querySelector(".cremail").value||"").trim().toLowerCase(),c=dl.querySelector(".crco").value;
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)){toast("Pon un correo válido");return}
    try{const a=await fb();await a.fs.setDoc(a.fs.doc(a.db,"editores",m),{co:c,t:Date.now(),por:em()});dl.querySelector(".cremail").value="";toast("✅ Permiso dado");editores()}catch(_){toast("No se ha podido guardar (¿reglas de Firebase?)")}return}
  const qd=e.target.closest("[data-credel]");if(qd){const m=qd.getAttribute("data-credel");if(!confirm(`¿Quitar el permiso a ${m}?`))return;
    try{const a=await fb();await a.fs.deleteDoc(a.fs.doc(a.db,"editores",m));toast("Permiso quitado");editores()}catch(_){toast("No se ha podido quitar")}return}
  if(e.target.closest(".crdel")){if(!confirm("¿Quitar la corrección? La ruta volverá a salir como la saca el robot (desde mañana)."))return;
    try{const a=await fb();await a.fs.deleteDoc(a.fs.doc(a.db,"correcciones",idDe(X.k)));toast("↩️ Corrección quitada · se verá mañana");cierra()}catch(_){toast("No se ha podido quitar ahora; prueba con cobertura")}return}
  if(e.target.closest(".crok"))guarda(dl)});
document.addEventListener("change",async e=>{const dl=e.target.closest(".crdlg");if(!dl)return;
  if(e.target.name==="crb")dl.querySelector(".crotra").hidden=e.target.value!=="otra";
  if(e.target.name==="crt"&&dl.querySelector(".crsubir"))dl.querySelector(".crsubir").hidden=e.target.value!=="sub";
  if(e.target.classList.contains("crf")){const f=e.target.files[0];if(!f)return;const p=dl.querySelector(".crfi");
    try{const ll=leeTrack(await f.text());if(ll.length<2)throw 0;TR=ll;p.textContent=`✅ ${f.name}: ${ll.length} puntos · ${kmDe(ll).toFixed(1).replace(".",",")} km`}
    catch(_){TR=null;p.textContent="⚠️ Ese archivo no tiene ningún recorrido. Prueba con otro GPX o KML."}}});
let TQ=null;
document.addEventListener("input",e=>{if(!e.target.classList.contains("crq"))return;const dl=e.target.closest(".crdlg"),v=e.target.value.trim(),box=dl.querySelector(".crres");
  clearTimeout(TQ);if(v.length<3){box.innerHTML="";return}
  TQ=setTimeout(async()=>{box.innerHTML=`<p class="crnote">Buscando…</p>`;
    try{const L=await buscaBlog(X.bw,v);if(e.target.value.trim()!==v)return;
      box.innerHTML=L.length?L.map(x=>`<button data-cru="${esc(x.u)}"${x.u===SEL?' class="on"':""}>${esc(x.t)}<small>${x.f?(()=>{const m=/^(\d{4})-(\d{2})/.exec(x.f);return m?MES[+m[2]-1]+" de "+m[1]+" · ":""})():""}${esc(x.u.replace(/^https?:\/\/[^/]+/,""))}</small></button>`).join(""):`<p class="crnote">No sale nada con esas palabras. Prueba con otras o pega la dirección.</p>`}
    catch(_){box.innerHTML=`<p class="crnote">No se puede buscar en este blog desde aquí: pega la dirección de la entrada debajo.</p>`}},450)});

async function guarda(dl){const x=X,d={k:x.k,co:x.co,t:Date.now()};   // sin el correo: esta colección se puede leer desde fuera (la lee el robot)
  if(x.colab){const b=(dl.querySelector("input[name=crb]:checked")||{}).value;
    if(b==="sin")d.sb=true;
    else if(b==="otra"){const u=(dl.querySelector(".cru").value||"").trim();if(!/^https?:\/\/\S+$/.test(u)){toast("Elige una entrada de la lista o pega su dirección");return}d.u=u}}
  const t=(dl.querySelector("input[name=crt]:checked")||{}).value;
  if(t==="sin")d.tr="sin";
  else if(t==="sub"){if(TR)d.tr=JSON.stringify(TR);else if(DOC&&DOC.tr&&DOC.tr!=="sin")d.tr=DOC.tr;else{toast("Elige el archivo del track");return}}
  const wq=!!(dl.querySelector(".crwkq")||{}).checked,wk=((dl.querySelector(".crwk")||{}).value||"").trim();
  if(wq)d.wk="-";else if(wk){if(!/^https?:\/\/\S*wikiloc\.\S+$/i.test(wk)){toast("Ese enlace no parece de Wikiloc");return}d.wk=wk}
  const n=(dl.querySelector(".crn").value||"").trim();if(n)d.n=n.slice(0,140);
  const f=(dl.querySelector(".crfe").value||"").trim();if(/^\d{4}-\d{2}$/.test(f))d.f=f;
  const di=dl.querySelector(".crdi").value;if(di)d.di=di;
  if(x.colab&&dl.querySelector(".croc").checked)d.oc=true;
  if(Object.keys(d).length<=3){toast("No has cambiado nada");return}
  if(d.tr&&d.tr.length>900000){toast("El track es demasiado grande");return}
  const ok=dl.querySelector(".crok");ok.disabled=true;ok.textContent="Guardando…";
  try{const a=await fb();await a.fs.setDoc(a.fs.doc(a.db,"correcciones",idDe(x.k)),d);toast("✅ Corrección guardada · se verá mañana");cierra();
    const h=sh.querySelector(".sheet-head");if(h&&!sh.querySelector(".crmark"))h.insertAdjacentHTML("afterend",`<span class="crmark">✏️ Corregida a mano · se verá mañana</span>`)}
  catch(err){ok.disabled=false;ok.textContent="💾 Guardar · se verá mañana";toast(/permission|insufficient/i.test(String(err&&err.message))?"No tienes permiso para corregir esta ruta":"No se ha podido guardar ahora; prueba con cobertura")}}
})();
