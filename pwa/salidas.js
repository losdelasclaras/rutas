/* ---------- 📅 Salidas de clubes (Explorar › Salidas) ----------
   · Los clubes de montaña (sin ánimo de lucro) anuncian sus próximas salidas: fecha, punto de encuentro, cómo apuntarse y el track (GPX).
   · Un club pide permiso una vez («Soy un club»); el administrador lo aprueba y desde entonces publica solo, sin revisión de cada salida.
   · El administrador puede crear clubes y publicar en nombre de cualquiera (p. ej. si un club le manda la salida por WhatsApp).
   · Firestore: clubes/{id} (estado pend/ok), salidas/{id} (datos, sin el track) y salidasp/{id} (el track, solo al abrir la salida).
   · Las salidas ya pasadas no salen. */
(function(){
const ADM=["losdelasclaras@gmail.com","jcrespopazos@gmail.com"];
const MPI=window.MISPUNTOS;
const usr=()=>window.LDCFB&&LDCFB.user();
const esAdm=()=>{const u=usr();return!!(u&&u.email&&ADM.includes(u.email.toLowerCase()))};
const DIFS=["Fácil","Moderada","Difícil","Muy difícil"];
const DS=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"],MS=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const hoy=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const fFecha=f=>{const d=new Date(f);if(isNaN(d))return f;return `${DS[d.getDay()]} ${d.getDate()} de ${MS[d.getMonth()]}${f.length>10?" · "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+" h":""}`};
const kmF=v=>(+v||0).toLocaleString("es-ES",{maximumFractionDigits:1})+" km";
document.head.insertAdjacentHTML("beforeend",`<style>
.salbox{border:1px solid var(--edge);border-radius:14px;padding:12px;margin:0 0 12px;background:var(--card)}
.salbox.adm{border:2px solid #c3262e}.salbox h2{margin:0 0 8px;font-size:17px}
.salc{display:flex;gap:12px;align-items:stretch;border:1px solid var(--edge);border-radius:14px;padding:10px 12px;margin:0 0 10px;background:var(--card);cursor:pointer}
.salc .fd{flex:none;width:58px;border-radius:10px;background:#1e8e3e;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05;padding:6px 0}
.salc .fd b{font-size:24px}.salc .fd small{font-size:12px;font-weight:700;text-transform:uppercase}
.salc .t{flex:1;min-width:0}.salc .t b{display:block;font-size:16.5px;line-height:1.25}
.salc .t small{display:block;color:var(--muted);font-size:13.5px;line-height:1.35;margin-top:2px}
.salc .t .cl{color:#1e8e3e;font-weight:800}
.salform label{display:block;font-weight:700;margin:12px 0 4px}
.salform input,.salform textarea,.salform select{width:100%;box-sizing:border-box;border:1px solid var(--edge);border-radius:10px;padding:10px;font:inherit;font-size:16px;background:var(--paper);color:var(--ink)}
.salform textarea{min-height:80px;resize:vertical}.salform .two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.salbtns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.salbtns .btn{display:flex;width:100%;box-sizing:border-box;justify-content:center;align-items:center;text-align:center;margin:0;min-width:0}
.salchips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}
.salrow{display:flex;align-items:center;gap:8px;border-top:1px solid var(--edge);padding:8px 0}.salrow:first-of-type{border-top:0}.salrow span{flex:1;min-width:0}
.salaviso{font-size:13px;color:var(--muted);margin:8px 0 0}
/* 10 nov 2026 · lista compacta por semanas y filtros */
#v-salidas h1.salhd{font-size:19px;letter-spacing:0;text-transform:none;margin:2px 0 10px}
#v-salidas .inner>div:empty{display:none}#v-salidas .inner{row-gap:10px}
.salwk{display:flex;gap:6px;overflow-x:auto;margin:0 -2px 8px;padding:2px;scrollbar-width:none}.salwk::-webkit-scrollbar{display:none}
.salwk .chip{flex:none;white-space:nowrap}
.salfil{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 10px}
.salfil select{width:100%;box-sizing:border-box;border:1px solid var(--edge);border-radius:10px;padding:9px 8px;font:inherit;font-size:15px;background:var(--card);color:var(--ink)}
.salg{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:14px 2px 6px}
.salr{display:flex;gap:10px;align-items:center;border:1px solid var(--edge);border-radius:12px;padding:8px 10px;margin:0 0 6px;background:var(--card);cursor:pointer}
.salr .fd{flex:none;width:46px;border-radius:9px;background:#1e8e3e;color:#fff;text-align:center;line-height:1.05;padding:5px 0}
.salr .fd small{display:block;font-size:11px;font-weight:800;text-transform:uppercase}.salr .fd b{font-size:20px}
.salr .t{flex:1;min-width:0}.salr .t b{display:block;font-size:16px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.salr .t small{display:block;color:var(--muted);font-size:13.5px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.salr .t .cl{color:#1e8e3e;font-weight:800}
.salpie{font-size:13px;color:var(--muted);margin:18px 2px 8px;line-height:1.4}
</style>`);

/* --- la pestaña --- */
const main=document.querySelector("main");
const sec=document.createElement("section");sec.className="view pad";sec.id="v-salidas";sec.hidden=true;
sec.innerHTML=`<div class="inner"><h1 class="vt salhd">📅 Salidas de clubes de montaña</h1>
<div id="sal-adm"></div><div id="sal-yo"></div><div id="sal-form"></div><div id="sal-chips"></div><div id="sal-lista"><p class="note">Cargando…</p></div><div id="sal-pie"></div></div>`;
main.appendChild(sec);
const $=id=>document.getElementById(id);

let A=null,CLUBS=[],SALS=[],MIO=null,FIL="todos",CARGADO=0,FSEM="todas",FSD="",FDIF="";
// 10 nov 2026 · «Sale desde»: dónde quedan (para quien va en el autobús del club). El club lo elige de esta lista.
const SDS=["Gijón","Oviedo","Avilés","Langreo","Mieres","Siero","Oriente","Occidente","León","Otro sitio"];
const MAXS=2;   // salidas próximas que puede tener anunciadas cada club a la vez
// semana (lunes) de una fecha, y su etiqueta por el fin de semana
// (el lunes y martes cuentan con el fin de semana de antes: así un puente sale junto)
const lun=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()-2);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
function semEt(k){const l=new Date(+k),hoyL=lun(new Date(Date.now()+2*864e5)),s=new Date(l);s.setDate(l.getDate()+5);const dg=new Date(l);dg.setDate(l.getDate()+6);
  const sem=Math.round((l-hoyL)/6048e5);if(sem<=0)return"Este fin de semana";if(sem===1)return"El que viene · "+s.getDate()+"-"+dg.getDate()+" "+MS[dg.getMonth()].slice(0,3);
  return s.getMonth()===dg.getMonth()?`${s.getDate()}-${dg.getDate()} ${MS[dg.getMonth()].slice(0,3)}`:`${s.getDate()} ${MS[s.getMonth()].slice(0,3)} - ${dg.getDate()} ${MS[dg.getMonth()].slice(0,3)}`}
const fs=()=>A.fs,db=()=>A.db;
async function base(){if(A)return A;if(!window.LDCFB)throw new Error("sin cuenta");A=await LDCFB.load();return A}
async function carga(fuerza){if(!fuerza&&Date.now()-CARGADO<60000)return pinta();
  if(!navigator.onLine){$("sal-lista").innerHTML=`<p class="note">Sin conexión: las salidas se ven cuando haya cobertura.</p>`;return}
  try{await base();const F=fs();
    const [qc,qs]=await Promise.all([F.getDocs(F.query(F.collection(db(),"clubes"),F.where("estado","==","ok"))),
      F.getDocs(F.query(F.collection(db(),"salidas"),F.where("fecha",">=",hoy()),F.orderBy("fecha")))]);
    CLUBS=[];qc.forEach(d=>CLUBS.push(Object.assign({id:d.id},d.data())));
    SALS=[];qs.forEach(d=>SALS.push(Object.assign({id:d.id},d.data())));
    const u=usr();MIO=null;if(u){const d=await F.getDoc(F.doc(db(),"clubes",u.uid));if(d.exists())MIO=Object.assign({id:d.id},d.data())}
    if(esAdm()){const qp=await F.getDocs(F.query(F.collection(db(),"clubes"),F.where("estado","==","pend")));PEND=[];qp.forEach(d=>PEND.push(Object.assign({id:d.id},d.data())))}
    CARGADO=Date.now();pinta()}
  catch(e){console.warn("salidas",e);try{pinta()}catch(_){}$("sal-lista").innerHTML=`<p class="note">No se han podido cargar las salidas. ${/permission/i.test(String(e))?"(Faltan los permisos en la base de datos.)":"Prueba dentro de un rato."}</p>`}}
let PEND=[];

function pinta(){
  // administrador: solicitudes y clubes
  if(esAdm()){$("sal-adm").innerHTML=`<div class="salbox adm"><h2>🛡 Clubes (solo lo ves tú)</h2>
    ${PEND.length?`<p style="margin:0 0 4px"><b>Solicitudes pendientes</b></p>`+PEND.map(c=>`<div class="salrow"><span><b>${esc(c.n)}</b><br><small>${esc(c.web||"")} ${esc(c.contacto||"")}${c.msg?"<br>"+esc(c.msg):""}<br>${esc(c.email||"")}</small></span><button class="btn primary" data-scok="${c.id}">✓ Aprobar</button><button class="btn ghost" data-scno="${c.id}">✕</button></div>`).join(""):`<p class="note" style="margin:0 0 6px">No hay solicitudes pendientes.</p>`}
    <p style="margin:10px 0 4px"><b>Clubes aprobados (${CLUBS.length})</b></p>${CLUBS.map(c=>`<div class="salrow"><span>${esc(c.n)}${c.prueba?" <small>(prueba)</small>":""}</span><button class="btn ghost" data-sfijo="${c.id}" title="Enlace fijo">🔗</button><button class="btn ghost" data-scedit="${c.id}">✏️</button><button class="btn ghost" data-scdel="${c.id}">Quitar</button></div>`).join("")||`<p class="note">Ninguno todavía.</p>`}
    <p style="margin:10px 0 4px"><b>Enlace para dar de alta un club</b></p><p class="note" style="margin:0 0 6px">Mándaselo solo al club que te lo pida. Al abrirlo le sale «Dar de alta nuestro club»; luego lo apruebas aquí.</p><div class="salbtns" style="grid-template-columns:1fr;margin-top:0"><button class="btn ghost" data-scalta>📋 Copiar el enlace de alta</button></div>
    <div class="salbtns"><button class="btn ghost" data-scnew>＋ Crear un club</button><button class="btn primary" data-snew>＋ Nueva salida</button></div></div>`}
  else $("sal-adm").innerHTML="";
  // tú: club aprobado, pendiente, o pedir
  const u=usr();
  if(esAdm())$("sal-yo").innerHTML="";
  else if(MIO&&MIO.estado==="ok")$("sal-yo").innerHTML=`<div class="salbox"><h2>🏔 ${esc(MIO.n)}</h2><p class="note" style="margin:0 0 8px">Tu club está dado de alta: lo que publiques sale al momento.</p><div class="salbtns"><button class="btn ghost" data-scedit="${MIO.id}">✏️ Datos del club</button><button class="btn primary" data-snew>＋ Nueva salida</button></div></div>${fijo(MIO)}`;
  else if(MIO&&MIO.estado==="pend")$("sal-yo").innerHTML=`<div class="salbox"><h2>⏳ Solicitud enviada</h2><p class="note" style="margin:0">«${esc(MIO.n)}» está pendiente de que Los de las Claras lo apruebe. Cuando esté, aquí te saldrá «Nueva salida».</p></div>`;
  else if(altaOk())$("sal-yo").innerHTML=`<div class="salbtns" style="grid-template-columns:1fr;margin:0 0 12px"><button class="btn primary" data-sclub>🏔 Dar de alta nuestro club</button></div>`;
  else $("sal-yo").innerHTML="";
  $("sal-pie").innerHTML=esAdm()||MIO?"":`<p class="salpie">¿Eres de un club o grupo de montaña y queréis anunciar aquí vuestras salidas? Escribe a <a href="mailto:${CORREO}?subject=${encodeURIComponent("Salidas de nuestro club en la app")}">${CORREO}</a></p>`;
  // 10 nov 2026 · semanas (por su fin de semana), «Sale desde» y dificultad; lista compacta agrupada por semanas
  const fe=s=>new Date(s.fecha),wk=s=>{const d=fe(s);return isNaN(d)?0:+lun(d)};
  const ks=[...new Set(SALS.map(wk))].sort((a,b)=>a-b),pri=ks.slice(0,3),mas=ks.length>3;
  if(FSEM!=="todas"&&FSEM!=="mas"&&!pri.includes(+FSEM))FSEM="todas";
  const sds=[...new Set(SALS.map(s=>s.sd).filter(Boolean))].sort((a,b)=>SDS.indexOf(a)-SDS.indexOf(b)),dfs=DIFS.filter(d=>SALS.some(s=>s.dif===d));
  if(FSD&&!sds.includes(FSD))FSD="";if(FDIF&&!dfs.includes(FDIF))FDIF="";
  const ch=(v,l)=>`<button class="chip" data-ssem="${v}" aria-pressed="${String(FSEM)===String(v)}">${esc(l)}</button>`;
  $("sal-chips").innerHTML=SALS.length>1?`${ks.length>1?`<div class="salwk">${ch("todas","Todas")}${pri.map(k=>ch(k,semEt(k).replace(/^El que viene · /,""))).join("")}${mas?ch("mas","Más adelante"):""}</div>`:""}
    ${sds.length>1||dfs.length>1?`<div class="salfil"><select data-ssd aria-label="Sale desde"><option value="">📍 Desde: todos</option>${sds.map(x=>`<option${x===FSD?" selected":""}>${esc(x)}</option>`).join("")}</select>
    <select data-sdif aria-label="Dificultad"><option value="">⛰ Dificultad</option>${dfs.map(x=>`<option${x===FDIF?" selected":""}>${esc(x)}</option>`).join("")}</select></div>`:""}`:"";
  const L0=SALS.filter(s=>(FSEM==="todas"||(FSEM==="mas"?!pri.includes(wk(s)):wk(s)===+FSEM))&&(!FSD||s.sd===FSD)&&(!FDIF||s.dif===FDIF));
  const fila=s=>{const d=fe(s);return `<div class="salr" data-sopen="${s.id}"><div class="fd"><small>${isNaN(d)?"":DS[d.getDay()].slice(0,3)}</small><b>${isNaN(d)?"?":d.getDate()}</b><small>${isNaN(d)?"":MS[d.getMonth()].slice(0,3)}</small></div>
    <div class="t"><b>${esc(s.ti)}</b><small><span class="cl">${esc(s.cn)}</span>${s.sd?" · "+esc(s.sd):""}${s.prueba?" · prueba":""}</small><small>${[isNaN(d)?"":String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+" h",s.km?kmF(s.km):"",s.up?"+"+Math.round(s.up).toLocaleString("es-ES")+" m":"",s.dif||""].filter(Boolean).join(" · ")}</small></div></div>`};
  let H="",g=null;for(const s of L0){const k=wk(s);if(k!==g){g=k;H+=`<div class="salg">${esc(semEt(k))}</div>`}H+=fila(s)}
  $("sal-lista").innerHTML=L0.length?H:SALS.length?`<p class="note">No hay salidas con esos filtros.</p>`:`<p class="note">No hay salidas anunciadas todavía.</p>`;
  if(AVC&&Date.now()-AVC.t<120000)$("sal-lista").insertAdjacentHTML("afterbegin",AVC.h);else AVC=null}

let AVC=null;
/* 10 nov 2026 · el alta de clubes NO es pública: solo puede pedirla quien abre el enlace personal que manda Jonathan
   (https://losdelasclaras.github.io/rutas/#altaclub, queda recordado en ese móvil). El resto ve el correo de contacto. */
const CORREO="losdelasclaras@gmail.com",ALTA="https://losdelasclaras.github.io/rutas/#altaclub";
const altaOk=()=>{try{return localStorage.getItem("ldc-altaclub")==="1"}catch(e){return false}};
function deAlta(){if((location.hash||"")!=="#altaclub")return;try{localStorage.setItem("ldc-altaclub","1");localStorage.setItem("ldc-salinv","1")}catch(e){}
  try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}visTab();showView("salidas");carga(true)}
addEventListener("hashchange",deAlta);setTimeout(deAlta,0);   // aviso «este club no tiene salidas próximas» (al entrar con su enlace fijo), se queda 2 minutos
sec.addEventListener("change",e=>{const el=e.target;if(el.matches("[data-ssd]")){FSD=el.value;pinta()}else if(el.matches("[data-sdif]")){FDIF=el.value;pinta()}});
/* --- 🔗 enlace fijo de un club (10 nov 2026): …/rutas/#club=<id> abre siempre su próxima salida publicada --- */
const URLF=id=>"https://losdelasclaras.github.io/rutas/#club="+encodeURIComponent(id);
const BOTON=id=>`<a href="${URLF(id)}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 18px;background:#1e8e3e;color:#fff;border-radius:10px;font-family:sans-serif;font-weight:bold;text-decoration:none">📅 Próxima salida · Ver en la app</a>`;
function fijo(c,adm){return `<div class="salbox salfijo" id="sf-${esc(c.id)}"><h2>🔗 Enlace fijo para vuestra web${adm?" · "+esc(c.n):""}</h2>
  <p class="note" style="margin:0 0 8px">Ponedlo una vez en vuestra página (por ejemplo en «Próximas salidas») y no hay que volver a tocarlo: siempre abre la próxima salida que tengáis publicada aquí, con el track para seguirla. Cuando pasa, lleva a la siguiente.</p>
  <input readonly value="${esc(URLF(c.id))}" onclick="this.select()" style="width:100%;box-sizing:border-box;border:1px solid var(--edge);border-radius:10px;padding:10px;font-size:14px;background:var(--paper);color:var(--ink)">
  <div class="salbtns"><button class="btn primary" data-scopia="${esc(c.id)}">📋 Copiar el enlace</button><button class="btn ghost" data-scopib="${esc(c.id)}">📋 Copiar un botón</button></div>
  <p class="salaviso">«Copiar un botón» es un trocito de código para pegar en la web (en modo HTML) y que salga un botón verde «📅 Próxima salida · Ver en la app».</p></div>`}
async function copia(txt,ok){try{await navigator.clipboard.writeText(txt);toast(ok)}catch(e){toast("Mantén pulsado el enlace para copiarlo")}}

/* --- formularios --- */
let EDIT=null;
function formClub(adm,ed){EDIT=ed||null;$("sal-form").innerHTML=`<div class="salbox salform"><h2>${ed?"✏️ Datos del club":adm?"＋ Crear un club":"🏔 Soy un club"}</h2>
  ${adm||ed?"":`<p class="note" style="margin:0">Solo para clubes y grupos de montaña sin ánimo de lucro (no empresas de turismo activo ni guías de pago). Los de las Claras lo aprueba una vez y luego publicáis solos.</p>`}
  <label>Nombre del club</label><input id="sc-n" maxlength="80">
  <label>Web, Facebook o Instagram</label><input id="sc-w" maxlength="200" placeholder="https://…">
  <label>Contacto (lo que verá la gente)</label><input id="sc-c" maxlength="120" placeholder="Teléfono, correo o WhatsApp del club">
  ${ed?`<p class="note" style="margin:6px 0 0">Los cambios salen también en las salidas que ya tenéis publicadas.</p>`:adm?`<label><input type="checkbox" id="sc-p" style="width:auto"> Es un club de prueba</label>`:`<label>Algo más (opcional)</label><textarea id="sc-m" maxlength="400"></textarea>`}
  <div class="salbtns"><button class="btn ghost" data-sfx>Cancelar</button><button class="btn primary" data-scsave="${adm?1:0}">${ed?"Guardar cambios":adm?"Crear":"Enviar solicitud"}</button></div></div>`;
  if(ed){$("sc-n").value=ed.n||"";$("sc-w").value=ed.web||"";$("sc-c").value=ed.contacto||""}
  $("sal-form").scrollIntoView({block:"start",behavior:"smooth"})}
let GPX=null;
let SED=null;   // la salida que se está editando
function formSalida(ed){const adm=esAdm(),cl=adm?CLUBS:[MIO];GPX=null;SED=ed||null;
  if(!cl.length){toast("Primero crea un club");return}
  $("sal-form").innerHTML=`<div class="salbox salform"><h2>${ed?"✏️ Editar salida":"＋ Nueva salida"}</h2>
  ${adm?`<label>Club</label><select id="ss-c">${cl.map(c=>`<option value="${c.id}">${esc(c.n)}</option>`).join("")}</select>`:`<p class="note" style="margin:0">Club: <b>${esc(MIO.n)}</b></p>`}
  <label>Título</label><input id="ss-t" maxlength="100" placeholder="Por ejemplo: Peña Ubiña desde Tuíza">
  <div class="two"><div><label>Día</label><input id="ss-d" type="date" min="${hoy()}"></div><div><label>Hora</label><input id="ss-h" type="time" value="08:00"></div></div>
  <label>Sale desde</label><select id="ss-sd"><option value="">— Elige —</option>${SDS.map(x=>`<option>${x}</option>`).join("")}</select>
  <label>Punto de encuentro</label><input id="ss-e" maxlength="120" placeholder="Por ejemplo: aparcamiento de Tuíza de Arriba">
  <label>Dificultad</label><select id="ss-f">${DIFS.map(d=>`<option>${d}</option>`).join("")}</select>
  <label>Enlace para apuntarse (opcional)</label><input id="ss-u" type="url" maxlength="400" placeholder="https://… (formulario de Google, web del club…)">
  <label>Teléfono o WhatsApp para apuntarse (opcional)</label><input id="ss-a" maxlength="60" placeholder="Por ejemplo: 600 123 456">
  <label>Otras indicaciones para apuntarse (opcional)</label><input id="ss-o" maxlength="200" placeholder="Plazas, precio del autobús, fecha límite…">
  <label>Descripción (opcional)</label><textarea id="ss-x" maxlength="1500"></textarea>
  <label>Hoja de ruta en PDF (opcional)</label><input id="ss-pdf" type="file" accept="application/pdf,.pdf"><p class="note" style="margin:4px 0 0">Hasta 4 MB. También vale un enlace:</p><input id="ss-pdfu" type="url" maxlength="400" placeholder="https://… (Google Drive, web del club…)" style="margin-top:6px">
  ${ed&&ed.pdf?`<label style="font-weight:600"><input type="checkbox" id="ss-pdfx" style="width:auto"> Quitar la hoja de ruta que hay (${esc(ed.pdf.nm||"PDF")})</label>`:""}
  <label>Track (GPX o KML) · opcional${ed?" — solo si quieres cambiarlo":""}</label><input id="ss-g" type="file" accept=".gpx,.kml,application/gpx+xml,application/vnd.google-earth.kml+xml">
  <p class="note" id="ss-gi" style="margin:4px 0 0">${ed?(ed.km?`Ahora: ${kmF(ed.km)} · +${Math.round(ed.up||0).toLocaleString("es-ES")} m. Si no subes otro, se queda ese.`:"Ahora no tiene track."):"Del track salen solos los km, el desnivel y el mapa."}</p>
  <div class="salbtns"><button class="btn ghost" data-sfx>Cancelar</button><button class="btn primary" data-sssave>${ed?"Guardar cambios":"Publicar"}</button></div></div>`;
  if(ed){const v=(i,x)=>{const el=$(i);if(el&&x!=null)el.value=x};
    v("ss-c",ed.club);v("ss-t",ed.ti);v("ss-d",(ed.fecha||"").slice(0,10));v("ss-h",(ed.fecha||"").slice(11,16)||"08:00");v("ss-e",ed.enc);v("ss-f",ed.dif);
    v("ss-u",ed.apu||(/^https?:\/\//i.test(ed.ap||"")?ed.ap:""));v("ss-a",/^https?:\/\//i.test(ed.ap||"")?"":ed.ap);v("ss-o",ed.apo);v("ss-x",ed.txt);v("ss-pdfu",ed.pdfu);v("ss-sd",ed.sd);
    if($("ss-c"))$("ss-c").disabled=true}
  if(!ed){const ult=()=>{const c=$("ss-c")?$("ss-c").value:MIO.id;const p=SALS.find(x=>x.club===c&&x.sd)||{};$("ss-sd").value=p.sd||(CLUBS.find(x=>x.id===c)||MIO||{}).sd||""};ult();if($("ss-c"))$("ss-c").addEventListener("change",ult)}
  $("ss-g").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;const t=await f.text();GPX=leeTrack(t);
    $("ss-gi").textContent=GPX?`✓ ${kmF(GPX.km)} · +${Math.round(GPX.up).toLocaleString("es-ES")} m`:"No he encontrado ningún recorrido en ese archivo";
    if(GPX&&!$("ss-t").value&&GPX.n)$("ss-t").value=GPX.n});
  $("sal-form").scrollIntoView({block:"start",behavior:"smooth"})}

/* --- leer el GPX/KML: puntos, km, subida, altura máxima --- */
const dmt=(a,b)=>{const r=Math.PI/180,dl=(b[0]-a[0])*r,dn=(b[1]-a[1])*r,h=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dn/2)**2;return 12742000*Math.asin(Math.min(1,Math.sqrt(h)))};
function leeTrack(t){try{const x=new DOMParser().parseFromString(t,"application/xml");let P0=[];
    x.querySelectorAll("trkpt,rtept").forEach(p=>{const e=p.querySelector("ele");P0.push([+p.getAttribute("lat"),+p.getAttribute("lon"),e?+e.textContent:null])});
    if(P0.length<2)x.querySelectorAll("LineString coordinates, coordinates").forEach(c=>{for(const s of c.textContent.trim().split(/\s+/)){const v=s.split(",");if(v.length>=2)P0.push([+v[1],+v[0],v[2]!=null&&v[2]!==""?+v[2]:null])}});
    P0=P0.filter(p=>isFinite(p[0])&&isFinite(p[1]));if(P0.length<2)return null;
    let km=0;for(let i=1;i<P0.length;i++)km+=dmt(P0[i-1],P0[i]);
    let up=0,ref=P0[0][2],mx=null;for(const p of P0){if(p[2]==null)continue;if(mx==null||p[2]>mx)mx=p[2];if(ref==null){ref=p[2];continue}if(p[2]-ref>=4){up+=p[2]-ref;ref=p[2]}else if(ref-p[2]>=4)ref=p[2]}
    let pts=P0;if(pts.length>1200&&window.COMPARTIR&&COMPARTIR.simple)pts=COMPARTIR.simple(pts,4);if(pts.length>1500)pts=pts.filter((_,i)=>i%Math.ceil(pts.length/1500)===0||i===pts.length-1);
    pts=pts.map(p=>[+p[0].toFixed(5),+p[1].toFixed(5)].concat(p[2]!=null?[Math.round(p[2])]:[]));
    const n=(x.querySelector("trk>name,Document>name,Placemark>name,metadata>name")||{}).textContent||"";
    return{pts,km:Math.round(km/100)/10,up:Math.round(up/10)*10,mx:mx!=null?Math.round(mx):null,n:n.trim().slice(0,100)}}catch(e){return null}}

/* --- guardar --- */
async function guardaClub(adm){const n=$("sc-n").value.trim();if(n.length<3){toast("Pon el nombre del club");return}
  const d={n,web:$("sc-w").value.trim(),contacto:$("sc-c").value.trim(),t:Date.now()};
  try{await base();const F=fs(),u=usr();
    if(EDIT){await F.updateDoc(F.doc(db(),"clubes",EDIT.id),d);
      // sus salidas ya publicadas llevan el nombre, la web y el contacto del club: se ponen al día
      for(const x of SALS.filter(x=>x.club===EDIT.id))await F.updateDoc(F.doc(db(),"salidas",x.id),{cn:d.n,cc:d.contacto,cw:d.web}).catch(()=>{});
      toast("Datos del club guardados");EDIT=null}
    else if(adm){d.estado="ok";d.prueba=!!($("sc-p")&&$("sc-p").checked);d.por=u.uid;await F.addDoc(F.collection(db(),"clubes"),d);toast("Club creado")}
    else{d.estado="pend";d.msg=($("sc-m")||{}).value||"";d.email=u.email||"";await F.setDoc(F.doc(db(),"clubes",u.uid),d);toast("Solicitud enviada")}
    $("sal-form").innerHTML="";carga(true)}catch(e){console.warn(e);toast(/permission/i.test(String(e))?"Faltan los permisos en la base de datos":"No se ha podido guardar")}}
async function guardaSalida(){const adm=esAdm(),cid=adm?$("ss-c").value:MIO.id,club=(adm?CLUBS.find(c=>c.id===cid):MIO);
  const ti=$("ss-t").value.trim(),dia=$("ss-d").value,h=$("ss-h").value||"08:00";
  if(ti.length<4){toast("Pon un título");return}if(!dia){toast("Pon el día");return}if(dia<hoy()){toast("El día ya ha pasado");return}
  const sd=$("ss-sd").value;if(!sd){toast("Elige desde dónde sale");return}
  if(!SED&&SALS.filter(x=>x.club===cid).length>=MAXS){toast(`Ya tenéis ${MAXS} salidas anunciadas: podréis publicar la siguiente cuando pase la primera`);return}
  const s={sd,club:cid,cn:club.n,cc:club.contacto||"",cw:club.web||"",ti,fecha:dia+"T"+h,enc:$("ss-e").value.trim(),dif:$("ss-f").value,ap:$("ss-a").value.trim(),apu:$("ss-u").value.trim(),apo:$("ss-o").value.trim(),pdfu:$("ss-pdfu").value.trim(),txt:$("ss-x").value.trim(),t:Date.now()};
  if(GPX)Object.assign(s,{km:GPX.km,up:GPX.up,mx:GPX.mx,lat:GPX.pts[0][0],lon:GPX.pts[0][1]});
  if(!SED)s.uid=usr().uid;
  if(club.prueba)s.prueba=true;
  if(s.apu&&!/^https?:\/\//i.test(s.apu)){toast("El enlace para apuntarse tiene que empezar por https://");return}
  if(s.pdfu&&!/^https?:\/\//i.test(s.pdfu)){toast("El enlace de la hoja de ruta tiene que empezar por https://");return}
  // la hoja de ruta (PDF) se guarda en trozos en la base de datos (sin servicio de archivos aparte: así sigue siendo gratis)
  const pf=$("ss-pdf").files[0];let trozos=null;
  if(pf){if(pf.size>4*1024*1024){toast("El PDF ocupa más de 4 MB: pon mejor un enlace");return}
    const b64=await new Promise((ok,ko)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(",")[1]);r.onerror=ko;r.readAsDataURL(pf)});
    trozos=[];for(let i=0;i<b64.length;i+=700000)trozos.push(b64.slice(i,i+700000));
    s.pdf={n:trozos.length,nm:pf.name.slice(0,80)}}
  try{await base();const F=fs();let id;
    if(SED){id=SED.id;
      // la hoja de ruta anterior: se borra si se sube otra o se marca «quitar»
      const quita=trozos||($("ss-pdfx")&&$("ss-pdfx").checked);
      if(quita&&SED.pdf)for(let i=0;i<SED.pdf.n;i++)await F.deleteDoc(F.doc(db(),"salidasf",id+"_"+i)).catch(()=>{});
      if(!trozos&&!quita&&SED.pdf)s.pdf=SED.pdf;if(!trozos&&quita)s.pdf=null;
      await F.updateDoc(F.doc(db(),"salidas",id),s)}
    else{const r=await F.addDoc(F.collection(db(),"salidas"),s);id=r.id}
    if(GPX)await F.setDoc(F.doc(db(),"salidasp",id),{club:cid,p:JSON.stringify(GPX.pts)});
    if(trozos){toast("Subiendo la hoja de ruta…");for(let i=0;i<trozos.length;i++)await F.setDoc(F.doc(db(),"salidasf",id+"_"+i),{club:cid,d:trozos[i]})}
    toast(SED?"Salida actualizada":"Salida publicada");$("sal-form").innerHTML="";GPX=null;SED=null;carga(true)}catch(e){console.warn(e);toast(/permission/i.test(String(e))?"Faltan los permisos en la base de datos":"No se ha podido publicar")}}

/* --- la ficha de una salida (en el mapa, con su track) --- */
let LAY=null;
async function abre(id){const s=SALS.find(x=>x.id===id);if(!s)return;
  showView("mapa");if(window.showTrack)showTrack(null);
  let pts=null;try{await base();const d=await fs().getDoc(fs().doc(db(),"salidasp",id));if(d.exists())pts=JSON.parse(d.data().p)}catch(e){}
  if(LAY){LAY.remove();LAY=null}
  if(pts&&pts.length>1){LAY=L.layerGroup([L.polyline(pts.map(p=>[p[0],p[1]]),{color:"#fff",weight:8,opacity:.95,interactive:false}),L.polyline(pts.map(p=>[p[0],p[1]]),{color:"#1e8e3e",weight:5,interactive:false}),
    L.circleMarker([pts[0][0],pts[0][1]],{radius:7,color:"#fff",weight:2,fillColor:"#2a7a3b",fillOpacity:1,interactive:false}).bindTooltip("Salida",{direction:"top"})]).addTo(map);
    const el=document.getElementById("map").getBoundingClientRect(),wide=el.width>=860;map.fitBounds(L.latLngBounds(pts.map(p=>[p[0],p[1]])),{paddingTopLeft:[wide?60:24,110],paddingBottomRight:[wide?640:24,wide?24:el.height*.55],maxZoom:15})}
  // cómo apuntarse: el enlace (formulario…) es el botón grande; el teléfono, para llamar o escribir por WhatsApp
  const ap=s.ap||"",apu=s.apu||(/^https?:\/\//i.test(ap)?ap:""),tel=apu===ap?"":ap,num=tel.replace(/[^\d+]/g,"");
  const telH=num.length>=9?"tel:"+num:"",waH=num.length>=9?"https://wa.me/"+(num.startsWith("+")?num.slice(1):num.length===9?"34"+num:num):"";
  const apH=apu||telH;
  const puede=esAdm()||(MIO&&MIO.estado==="ok"&&MIO.id===s.club);
  sheet.classList.remove("full");
  sheet.innerHTML=`<div class="grab"></div>${tipoHTML("salida",s.cn||"")}<div class="sheet-head"><h2>${esc(s.ti)}</h2><button class="x" aria-label="Cerrar" data-close data-salx>×</button></div>
  <div class="meta"><span class="tag" style="background:#1e8e3e;color:#fff;border-color:#1e8e3e">📅 ${esc(fFecha(s.fecha))}</span><span class="tag">${esc(s.cn)}</span>${s.prueba?`<span class="tag">Prueba</span>`:""}</div>
  <div class="ficha">${s.km?`<div><b>${kmF(s.km)}</b><span>Distancia</span></div>`:""}${s.up?`<div><b>+${Math.round(s.up).toLocaleString("es-ES")} m</b><span>Desnivel</span></div>`:""}${s.dif?`<div><b>${esc(s.dif)}</b><span>Dificultad</span></div>`:""}</div>
  ${s.enc?`<p class="salida">📍 Punto de encuentro: <b>${esc(s.enc)}</b></p>`:""}
  ${s.txt?`<p class="desc">${esc(s.txt).replace(/\n/g,"<br>")}</p>`:""}
  ${apu||tel||s.apo?`<div class="salbox" style="margin-top:10px"><b>✍️ Cómo apuntarse</b>${tel?`<p style="margin:6px 0 0">📞 ${esc(tel)}</p>`:""}${s.apo?`<p style="margin:6px 0 0">${esc(s.apo)}</p>`:""}
   <div class="salbtns">${apu?`<a class="btn primary" href="${esc(apu)}" target="_blank" rel="noopener" style="grid-column:1/-1">✍️ Apuntarse</a>`:""}${telH?`<a class="btn ghost" href="${esc(telH)}">📞 Llamar</a><a class="btn ghost" href="${esc(waH)}" target="_blank" rel="noopener">💬 WhatsApp</a>`:""}</div></div>`:""}
  ${s.pdf||s.pdfu?`<div class="salbtns" style="grid-template-columns:1fr">${s.pdf?`<button class="btn ghost" data-salpdf>📄 Hoja de ruta (PDF)</button>`:`<a class="btn ghost" href="${esc(s.pdfu)}" target="_blank" rel="noopener">📄 Hoja de ruta (PDF)</a>`}</div>`:""}
  <div class="acts2"><div class="agrid">
   ${pts&&pts.length>1?`<button class="btn ghost" data-salfol>▶ Seguir</button><button class="btn ghost" data-salgpx>⬇ Descargar GPX</button>`:""}
   <button class="btn ghost" data-salshare>📤 Compartir</button>
   ${s.cw?`<a class="btn ghost" href="${esc(s.cw)}" target="_blank" rel="noopener">🏔 Web del club</a>`:""}
   ${puede?`<button class="btn ghost" data-saledit>✏️ Editar salida</button><button class="btn ghost" style="color:#b3261e" data-saldel>🗑 Borrar salida</button>`:""}</div></div>
  <p class="salaviso">Organiza <b>${esc(s.cn)}</b>${s.cc?" ("+esc(s.cc)+")":""}. La inscripción, el seguro y las condiciones son cosa del club: Los de las Claras solo la anuncia.</p>`;
  sheet._sal={s,pts};sheet.hidden=false;sheet.scrollTop=0}
sheet.addEventListener("click",async e=>{const k=sheet._sal;if(!k)return;
  if(e.target.closest("[data-salx]")){return}   // el track se queda en el mapa hasta abrir otra cosa
  const {s,pts}=k;const sinT=()=>{if(!pts||pts.length<2){toast("Esta salida no tiene track");return true}return false};
  if(e.target.closest("[data-salfol]")){if(sinT())return;if(LAY){LAY.remove();LAY=null}if(window.SEGUIR)SEGUIR.start({u:"tmp",ti:s.ti,gx:{ln:pts,km:s.km}},false);return}
  if(e.target.closest("[data-salgpx]")||e.target.closest("[data-salreloj]")){if(sinT())return;if(window.enviaGpx)enviaGpx(s.ti,pts);
    if(e.target.closest("[data-salreloj]"))setTimeout(()=>toast("Elige la app de tu reloj (Suunto, COROS…). Garmin y Polar: importa el GPX en su web.",7000),900);return}
  if(e.target.closest("[data-salshare]")){const url=APPURL+"#sal="+s.id,text=`📅 ${s.ti}\n${fFecha(s.fecha)} · ${s.cn}${s.enc?"\n📍 "+s.enc:""}\nMira la salida en la app de Los de las Claras:`;
    try{if(navigator.share){await navigator.share({title:s.ti,text,url});return}}catch(er){if(er&&er.name==="AbortError")return}
    try{await navigator.clipboard.writeText(text+"\n"+url);toast("Enlace copiado")}catch(er){window.open("https://wa.me/?text="+encodeURIComponent(text+"\n"+url),"_blank","noopener")}return}
  if(e.target.closest("[data-saledit]")){sheet.hidden=true;showView("salidas");setTimeout(()=>formSalida(s),150);return}
  if(e.target.closest("[data-salpdf]")){if(!s.pdf)return;toast("Bajando la hoja de ruta…");
    try{await base();const F=fs();let b="";for(let i=0;i<s.pdf.n;i++){const d=await F.getDoc(F.doc(db(),"salidasf",s.id+"_"+i));if(!d.exists())throw 0;b+=d.data().d}
      const bin=atob(b),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
      const f=new File([u8],s.pdf.nm||"hoja-de-ruta.pdf",{type:"application/pdf"});
      try{if(navigator.canShare&&navigator.canShare({files:[f]})&&matchMedia("(pointer:coarse)").matches){await navigator.share({files:[f],title:s.ti});return}}catch(er){if(er&&er.name==="AbortError")return}
      const a=document.createElement("a");a.href=URL.createObjectURL(f);a.download=f.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
    catch(er){toast("No se ha podido bajar la hoja de ruta")}return}
  if(e.target.closest("[data-saldel]")){if(!confirm("¿Borrar esta salida?"))return;try{await base();const F=fs();if(s.pdf)for(let i=0;i<s.pdf.n;i++)await F.deleteDoc(F.doc(db(),"salidasf",s.id+"_"+i)).catch(()=>{});await F.deleteDoc(F.doc(db(),"salidasp",s.id)).catch(()=>{});await F.deleteDoc(F.doc(db(),"salidas",s.id));
    sheet.hidden=true;if(LAY){LAY.remove();LAY=null}toast("Salida borrada");carga(true)}catch(er){toast("No se ha podido borrar")}}});
// al abrir otra cosa en el mapa, se quita el track de la salida
{const st=window.showTrack;if(st)window.showTrack=function(){if(LAY&&!(sheet._sal&&!sheet.hidden)){LAY.remove();LAY=null}return st.apply(this,arguments)}}
new MutationObserver(()=>{if(sheet._sal&&!sheet.querySelector("[data-salx]"))sheet._sal=null}).observe(sheet,{childList:true});

/* --- clics en la pestaña --- */
sec.addEventListener("click",async e=>{const t=e.target;
  const o=t.closest("[data-sopen]");if(o){abre(o.dataset.sopen);return}
  const fl=t.closest("[data-sfil]");if(fl){FIL=fl.dataset.sfil;pinta();return}
  const sm=t.closest("[data-ssem]");if(sm){FSEM=sm.dataset.ssem;pinta();return}
  if(t.closest("[data-sfx]")){$("sal-form").innerHTML="";SED=null;return}
  if(t.closest("[data-sclub]")&&!altaOk()&&!esAdm()){toast("Escribe a "+CORREO+" para dar de alta tu club");return}
  if(t.closest("[data-sclub]")){if(window.cuentaOk&&!cuentaOk(()=>{showView("salidas");carga(true).then(()=>formClub(false))},"club"))return;formClub(false);return}
  if(t.closest("[data-scnew]")){formClub(true);return}
  const ce=t.closest("[data-scedit]");if(ce){const c=CLUBS.find(x=>x.id===ce.dataset.scedit)||(MIO&&MIO.id===ce.dataset.scedit?MIO:null);if(c)formClub(esAdm(),c);return}
  const sv=t.closest("[data-scsave]");if(sv){guardaClub(sv.dataset.scsave==="1");return}
  if(t.closest("[data-snew]")){if(!esAdm()&&MIO&&SALS.filter(x=>x.club===MIO.id).length>=MAXS){toast(`Ya tenéis ${MAXS} salidas anunciadas: podréis publicar la siguiente cuando pase la primera`);return}formSalida();return}
  const fj=t.closest("[data-sfijo]");if(fj){const c=CLUBS.find(x=>x.id===fj.dataset.sfijo);if(!c)return;const v=$("sf-"+c.id);if(v){v.remove();return}fj.closest(".salrow").insertAdjacentHTML("afterend",fijo(c,true));return}
  if(t.closest("[data-scalta]")){copia(ALTA,"Enlace de alta copiado: mándaselo al club");return}
  const cp=t.closest("[data-scopia]");if(cp){copia(URLF(cp.dataset.scopia),"Enlace copiado");return}
  const cb=t.closest("[data-scopib]");if(cb){copia(BOTON(cb.dataset.scopib),"Botón copiado: pégalo en tu web en modo HTML");return}
  if(t.closest("[data-sssave]")){guardaSalida();return}
  const ok=t.closest("[data-scok]"),no=t.closest("[data-scno]"),dl=t.closest("[data-scdel]");
  if(ok||no||dl){try{await base();const F=fs(),id=(ok||no||dl).dataset[ok?"scok":no?"scno":"scdel"];
    if(ok)await F.updateDoc(F.doc(db(),"clubes",id),{estado:"ok"});
    else{if(dl&&!confirm("¿Quitar este club? Sus salidas dejarán de verse cuando pasen o si las borras."))return;await F.deleteDoc(F.doc(db(),"clubes",id))}
    toast(ok?"Club aprobado":"Hecho");carga(true)}catch(er){console.warn(er);toast("No se ha podido")}}});
/* EN PRUEBAS (3 nov): la pestaña Salidas solo la ven los administradores hasta que él decida abrirla a todos.
   Para abrirla a todos: PUBLICO=true. */
const PUBLICO=false;
// mientras está en pruebas, los clubes invitados la ven entrando una vez con el enlace …/rutas/#salidas (se queda recordado en ese móvil)
const invitado=()=>{try{return localStorage.getItem("ldc-salinv")==="1"}catch(e){return false}};
const visTab=()=>{const t=document.querySelector('nav.tabs [data-v="salidas"]');if(t)t.hidden=!(PUBLICO||esAdm()||invitado())};
function deInvitacion(){if((location.hash||"")!=="#salidas")return;try{localStorage.setItem("ldc-salinv","1")}catch(e){}
  try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}visTab();showView("salidas")}
addEventListener("hashchange",deInvitacion);setTimeout(()=>{deInvitacion();visTab()},0);
addEventListener("ldc-user",()=>{visTab();if(!sec.hidden)carga(true);else CARGADO=0});
// cargar al entrar en la pestaña
new MutationObserver(()=>{if(!sec.hidden)carga(false)}).observe(sec,{attributes:true,attributeFilter:["hidden"]});
// enlace compartido: #sal=<id>
async function deHash(){const m=/^#sal=([\w-]+)/.exec(location.hash||"");if(!m)return;try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}
  await carga(true);if(SALS.find(s=>s.id===m[1]))abre(m[1]);else toast("Esa salida ya no está (puede que haya pasado)")}
addEventListener("hashchange",deHash);setTimeout(deHash,900);
async function deClub(){const m=/^#club=([\w-]+)/.exec(location.hash||"");if(!m)return;const id=m[1];try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}
  await carga(true);const ahora=new Date();
  const s=SALS.filter(x=>x.club===id).find(x=>{const d=new Date(x.fecha.length>10?x.fecha:x.fecha+"T23:59");return isNaN(d)||d>=new Date(ahora-6*3600e3)});
  if(s){abre(s.id);return}
  const c=CLUBS.find(x=>x.id===id);showView("salidas");
  AVC={t:Date.now(),h:`<div class="salbox"><h2>📅 ${c?esc(c.n):"Este club"}</h2><p class="note" style="margin:0">No tiene ninguna salida próxima publicada todavía.${c&&c.web?` Mira su web: <a href="${esc(c.web)}" target="_blank" rel="noopener">${esc(c.web)}</a>`:""}</p></div>`};pinta()}
addEventListener("hashchange",deClub);setTimeout(deClub,900);
window.SALIDAS={carga,leeTrack};
})();
