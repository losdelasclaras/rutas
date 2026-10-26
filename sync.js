/* ---------- Entrar con Google: marcas, mis puntos y mis tracks guardados en tu cuenta (Firebase) ----------
   Sin entrar, la app funciona igual (todo se queda en este móvil). Al entrar, lo de aquí y lo de la nube se juntan
   y a partir de ahí cualquier cambio se copia solo a los demás aparatos donde hayas entrado.
   La librería de Firebase solo se descarga si has entrado alguna vez o al pulsar «Entrar con Google». */
(function(){
const CFG={apiKey:"AIzaSyBzYlxsZhJVPJpCk0_EgxaplD7zWMOOg1I",authDomain:"losdelasclaras-rutas.firebaseapp.com",projectId:"losdelasclaras-rutas",
  storageBucket:"losdelasclaras-rutas.firebasestorage.app",messagingSenderId:"115151504481",appId:"1:115151504481:web:9338dae56b04b4d2989620"};
const G="https://www.gstatic.com/firebasejs/10.14.1/";
const SK="ldc-sesion",PK="ldc-sync-pend",UK="ldc-sync-uid",TK="ldc-sync-hora";
const MPI=window.MISPUNTOS;
let FB=null,A=null,USER=null,READY=false,BUSY=false,ERR="",unsub=[];
const T={};                       // esperas para no escribir en cada toque
let CLOUDT=new Set();             // tracks que hay en la nube
const pend=()=>store.get(PK,{}),setPend=(k,v)=>{const p=pend();if(v)p[k]=1;else delete p[k];store.set(PK,p)};

/* --- botón de la cabecera --- */
const btn=document.getElementById("userbtn");
document.head.insertAdjacentHTML("beforeend",`<style>
.userbtn{position:relative;border:1px solid var(--edge);background:var(--card);border-radius:50%;width:36px;height:36px;padding:0;display:grid;place-items:center;cursor:pointer;color:var(--ink);flex:none;margin-left:6px;overflow:visible}
.userbtn img{width:100%;height:100%;border-radius:50%;object-fit:cover}
.userbtn .ini{font-weight:800;font-size:16px}
.userbtn.on::after{content:"";position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border-radius:50%;background:#2a9d48;border:2px solid var(--card)}
.userbtn.pend::after{background:#e8a317}
.acc{display:flex;gap:12px;align-items:center;margin:4px 0 10px}.acc img,.acc .ini{width:48px;height:48px;border-radius:50%;flex:none}
.acc .ini{display:grid;place-items:center;background:var(--mark);color:#fff;font-weight:800;font-size:20px}
.acc b{display:block;font-size:17px}.acc small{color:var(--muted)}
.gbtn{display:inline-flex;align-items:center;gap:10px;border:1px solid #c9ccd1;background:#fff;color:#1f1f1f;border-radius:24px;padding:10px 18px;font-weight:700;font-size:16px;cursor:pointer}
.gbtn svg{width:20px;height:20px}
.accbg{position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.35);display:flex;align-items:flex-start;justify-content:center;padding:70px 12px 12px}
.accbg[hidden]{display:none}
.accdlg{background:var(--card);color:var(--ink);border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.3);width:100%;max-width:420px;max-height:calc(100% - 20px);overflow:auto;padding:14px 18px 18px}
.syncst{margin:6px 0 12px;font-weight:600}.syncst.ok{color:#2a7a3b}.syncst.pe{color:#8a4b00}.syncst.er{color:#b3261e}
</style>`);
const GLOGO=`<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;
const ICON=btn.innerHTML;
const bg=document.createElement("div");bg.className="accbg";bg.hidden=true;bg.innerHTML=`<div class="accdlg" role="dialog" aria-label="Tu cuenta"></div>`;document.body.appendChild(bg);
const dlg=bg.firstChild;
function show(html){dlg.innerHTML=html;bg.hidden=false}
const cerrar=()=>{bg.hidden=true;OPEN=false};
bg.addEventListener("click",e=>{if(e.target===bg||e.target.closest("[data-close]"))cerrar()});
addEventListener("keydown",e=>{if(e.key==="Escape"&&!bg.hidden)cerrar()});
const ini=u=>esc(((u.displayName||u.email||"?").trim()[0]||"?").toUpperCase());
const face=u=>u.photoURL?`<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`:`<span class="ini">${ini(u)}</span>`;
function paintBtn(){
  if(USER){btn.innerHTML=face(USER);btn.classList.add("on");btn.classList.toggle("pend",!READY||Object.keys(pend()).length>0)}
  else{btn.innerHTML=ICON;btn.classList.remove("on","pend")}}
const hora=()=>{const h=store.get(TK,null);if(!h)return"";const d=new Date(h),hoy=new Date().toDateString()===d.toDateString();
  return(hoy?"hoy":d.toLocaleDateString("es-ES",{day:"numeric",month:"short"}))+" a las "+d.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})};
const cuenta=()=>{const nm=Object.keys(MARKS).length,np=MPI.get().length,nt=MPI.tracks().length;
  return`${nm} marca${nm===1?"":"s"} de cumbres y lugares · ${np} punto${np===1?"":"s"}${nt?` · ${nt} track${nt===1?"":"s"}`:""}`};
let OPEN=false;
function panel(){OPEN=true;
  if(!USER){load().catch(()=>{});
    show(`<div class="sheet-head"><h2>Tu cuenta</h2><button class="x" data-close aria-label="Cerrar">×</button></div>
    <p>Entra con tu cuenta de Google y tus <b>marcas de cumbres y lugares, tus puntos y tus tracks</b> se guardan en tu cuenta: los tendrás iguales en el móvil y en el ordenador, y no se pierden si cambias de móvil.</p>
    <p class="note">No hace falta para usar la app. Solo se guarda lo tuyo y nadie más puede verlo.</p>
    ${ERR?`<p class="syncst er">${esc(ERR)}</p>`:""}
    <p style="margin:14px 0 6px"><button class="gbtn" data-gin>${GLOGO}Entrar con Google</button></p>`);return}
  const np=Object.keys(pend()).length;
  const st=BUSY?`<p class="syncst pe">Sincronizando…</p>`:!READY||np?`<p class="syncst pe">⏳ Hay cambios sin subir todavía${navigator.onLine?"":" (sin cobertura)"}. Se suben solos cuando haya conexión.</p>`
    :`<p class="syncst ok">✓ Todo guardado en tu cuenta${hora()?` · ${hora()}`:""}</p>`;
  show(`<div class="sheet-head"><h2>Tu cuenta</h2><button class="x" data-close aria-label="Cerrar">×</button></div>
    <div class="acc">${USER.photoURL?`<img src="${esc(USER.photoURL)}" alt="" referrerpolicy="no-referrer">`:`<span class="ini">${ini(USER)}</span>`}<span><b>${esc(USER.displayName||"")}</b><small>${esc(USER.email||"")}</small></span></div>
    ${st}<p class="note">${cuenta()}</p>
    <p class="note">Lo que marques o guardes aquí aparece solo en los demás aparatos donde hayas entrado con esta cuenta.</p>
    <div class="mpacts"><button class="mpb" data-gout>Salir</button></div>
    <p class="note">Al salir, lo tuyo se queda en este aparato y en tu cuenta.</p>`)}
const repaint=()=>{paintBtn();if(OPEN&&!bg.hidden)panel()};
btn.addEventListener("click",panel);
document.addEventListener("click",e=>{
  if(e.target.closest("[data-gin]")){entrar();return}
  if(e.target.closest("[data-gout]")){salir();return}});

/* --- Firebase --- */
function load(){if(FB)return FB;
  FB=Promise.all([import(G+"firebase-app.js"),import(G+"firebase-auth.js"),import(G+"firebase-firestore.js")]).then(([ap,au,fs])=>{
    const app=ap.initializeApp(CFG);const auth=au.getAuth(app);auth.languageCode="es";
    A={au,fs,auth,db:fs.getFirestore(app)};
    au.onAuthStateChanged(auth,u=>{onUser(u).catch(e=>{console.warn("sync",e);BUSY=false;repaint()})});
    return A}).catch(e=>{FB=null;throw e});
  return FB}
async function entrar(){ERR="";
  try{const a=await load();const pr=new a.au.GoogleAuthProvider();pr.setCustomParameters({prompt:"select_account"});
    try{await a.au.signInWithPopup(a.auth,pr)}
    catch(e){if(e&&(e.code==="auth/popup-blocked"||e.code==="auth/operation-not-supported-in-this-environment")){store.set(SK,"1");await a.au.signInWithRedirect(a.auth,pr);return}
      if(e&&(e.code==="auth/popup-closed-by-user"||e.code==="auth/cancelled-popup-request"))return;throw e}}
  catch(e){console.warn("entrar",e);ERR=navigator.onLine?"No se ha podido entrar. Prueba otra vez dentro de un rato.":"Sin conexión: hace falta internet para entrar.";repaint()}}
async function salir(){if(!A)return;for(const f of unsub)f();unsub=[];store.set(SK,"0");store.set(PK,{});await A.au.signOut(A.auth).catch(()=>{});cerrar();toast("Has salido de tu cuenta. Lo tuyo sigue en este aparato.")}

const ref=k=>A.fs.doc(A.db,"usuarios",USER.uid,"datos",k);
const tref=id=>A.fs.doc(A.db,"usuarios",USER.uid,"tracks",String(id));
const tcol=()=>A.fs.collection(A.db,"usuarios",USER.uid,"tracks");
const J=s=>{try{return JSON.parse(s)}catch(e){return null}};
const tOut=t=>({n:t.n||"",km:t.km||0,j:JSON.stringify(t.pts||[])});   // la nube no admite listas dentro de listas: los puntos van como texto
const tIn=(id,d)=>({id:isNaN(+id)?id:+id,n:d.n,km:d.km,pts:J(d.j)||[]});

// juntar: una cumbre «subida» manda sobre «quiero»; puntos y tracks se suman (sin repetir)
function joinMarks(a,b){const r=Object.assign({},b);for(const k in a){if(a[k]==="hecha"||!r[k])r[k]=a[k]}return r}
const sameP=(a,b)=>a.id===b.id||(a.n===b.n&&Math.abs(a.lat-b.lat)<1e-4&&Math.abs(a.lon-b.lon)<1e-4);
function joinList(loc,cl,same){const r=cl.slice();for(const p of loc)if(!r.some(q=>same(p,q)))r.push(p);return r}

function applyMarks(m){MARKS=m;store.set("ldc-marcas",MARKS);renderCols();if(typeof refreshMarks==="function")refreshMarks()}
async function onUser(u){
  for(const f of unsub)f();unsub=[];READY=false;
  if(!u){USER=null;store.set(SK,"0");repaint();return}
  USER=u;store.set(SK,"1");BUSY=true;repaint();
  const fs=A.fs,first=store.get(UK,null)!==u.uid,p=pend();
  const [dm,dp,dt]=await Promise.all([fs.getDoc(ref("marcas")),fs.getDoc(ref("puntos")),fs.getDocs(tcol())]);
  const cm=dm.exists()?J(dm.data().j):null,cp=dp.exists()?J(dp.data().j):null;
  const ct=[];dt.forEach(d=>ct.push(tIn(d.id,d.data())));CLOUDT=new Set(ct.map(t=>String(t.id)));
  // la primera vez en este aparato, o si quedaron cambios sin subir, se junta todo; si no, manda lo de la nube
  const m=cm==null?MARKS:(first||p.marcas)?joinMarks(MARKS,cm):cm;
  const pts=cp==null?MPI.get():(first||p.puntos)?joinList(MPI.get(),cp,sameP):cp;
  const trs=!dt.size?MPI.tracks():(first||p.tracks)?joinList(MPI.tracks(),ct,(a,b)=>String(a.id)===String(b.id)):ct;
  const nm=Object.keys(m).length-Object.keys(MARKS).length,np=pts.length-MPI.get().length,nt=trs.length-MPI.tracks().length;
  applyMarks(m);MPI.set(pts,trs);
  const w=[];
  if(cm==null||JSON.stringify(m)!==JSON.stringify(cm))w.push(fs.setDoc(ref("marcas"),{j:JSON.stringify(m),t:Date.now()}));
  if(cp==null||JSON.stringify(pts)!==JSON.stringify(cp))w.push(fs.setDoc(ref("puntos"),{j:JSON.stringify(pts),t:Date.now()}));
  w.push(pushTracks());
  await Promise.all(w);
  store.set(UK,u.uid);store.set(PK,{});store.set(TK,new Date().toISOString());READY=true;BUSY=false;
  if(OPEN)cerrar();
  if(first){const tot=Object.keys(m).length+pts.length+trs.length;toast(tot?`Conectado: ${cuenta()} guardados en tu cuenta`:"Conectado con tu cuenta")}
  else if(nm>0||np>0||nt>0)toast("Recibidos los cambios de tu cuenta");
  // a partir de aquí, lo que cambie en otro aparato llega solo
  unsub.push(fs.onSnapshot(ref("marcas"),s=>{if(s.metadata.hasPendingWrites||!s.exists())return;const v=J(s.data().j);if(v&&JSON.stringify(v)!==JSON.stringify(MARKS)){applyMarks(v);done()}}));
  unsub.push(fs.onSnapshot(ref("puntos"),s=>{if(s.metadata.hasPendingWrites||!s.exists())return;const v=J(s.data().j);if(v&&JSON.stringify(v)!==JSON.stringify(MPI.get())){MPI.set(v,null);done()}}));
  unsub.push(fs.onSnapshot(tcol(),s=>{if(s.metadata.hasPendingWrites)return;const v=[];s.forEach(d=>v.push(tIn(d.id,d.data())));CLOUDT=new Set(v.map(t=>String(t.id)));
    const loc=MPI.tracks();if(v.length!==loc.length||v.some(t=>!loc.some(q=>String(q.id)===String(t.id)))){MPI.set(null,v);done()}}));
  repaint()}
function done(){store.set(TK,new Date().toISOString());repaint()}
async function pushTracks(){const fs=A.fs,loc=MPI.tracks(),ids=new Set(loc.map(t=>String(t.id))),w=[];
  for(const t of loc)if(!CLOUDT.has(String(t.id)))w.push(fs.setDoc(tref(t.id),tOut(t)));
  for(const id of CLOUDT)if(!ids.has(id))w.push(fs.deleteDoc(tref(id)));
  CLOUDT=ids;await Promise.all(w)}
async function push(k){if(!USER||!READY){return}
  try{if(k==="marcas")await A.fs.setDoc(ref("marcas"),{j:JSON.stringify(MARKS),t:Date.now()});
    else if(k==="puntos")await A.fs.setDoc(ref("puntos"),{j:JSON.stringify(MPI.get()),t:Date.now()});
    else await pushTracks();
    setPend(k,0);done()}catch(e){console.warn("sync",k,e);repaint()}}
// lo llaman saveMarks, saveMP y saveMT cada vez que cambias algo
window.ldcSync=k=>{if(store.get(SK,"0")!=="1")return;setPend(k,1);paintBtn();clearTimeout(T[k]);T[k]=setTimeout(()=>push(k),800)};

// si ya habías entrado, se conecta solo (un poco después de abrir, para no frenar la carga)
if(store.get(SK,"0")==="1"){btn.classList.add("on","pend");setTimeout(()=>load().catch(()=>{}),1200)}
addEventListener("online",()=>{if(store.get(SK,"0")==="1"&&!FB)load().catch(()=>{})});
})();
