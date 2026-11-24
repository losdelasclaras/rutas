/* ---------- 🏆 Retos (15 nov 2026) ----------
   Pestaña de abajo «Retos» (en el sitio de Seguidores, que se quita).
   · Retos fijos: «Techos de Asturias» (sale de Camudando'l camín, ver techos.js). Retos nuevos: los crea el administrador desde la app
     (Firestore › retos): permanentes o con fechas (p. ej. el anual de la Federación), con las cumbres o lugares que elija.
   · Tu progreso se ve siempre (sin cuenta, en este móvil). En los permanentes cuenta el ✓ de siempre; en los de fechas solo
     lo que marques mientras el reto está en marcha.
   · Medallas a las 5, 15, 25 y 50 cumbres y el megapremio al completarlo (en retos pequeños, a un tercio y dos tercios).
   · «Apuntarme»: con tu cuenta de Google y el nombre que elijas, sales en la lista del reto (Firestore › retosu/<reto>_<uid>)
     y los demás ven quién ha subido cada cumbre. ✔ = tiene un track guardado que pasa a menos de 150 m de la cumbre.
   · Una foto por cumbre y persona (Firestore › retosf/<reto>_<uid>_<cumbre>); la puede borrar su dueño o el administrador.
   · Enlaces: …/rutas/#retos y …/rutas/#reto=<id>.
   Para quitarlo: borrar 'retos' de _mods en pwa/build_pwa.py (y la pestaña en pestanas.js). */
(function(){
if(typeof PEAKS==="undefined"||typeof P==="undefined")return;
const main=document.querySelector("main");if(!main)return;
const ADM=["losdelasclaras@gmail.com","jcrespopazos@gmail.com"];
const usr=()=>window.LDCFB&&LDCFB.user&&LDCFB.user();
const esAdm=()=>{const u=usr();return!!(u&&u.email&&ADM.includes(u.email.toLowerCase()))};
const miEm=()=>{const u=usr();return u&&u.email?u.email.toLowerCase():""};
// 18 nov 2026: los colaboradores dados de alta como editores (Firestore › editores/<correo>, ver corregir.js) también crean retos; editan y borran solo los suyos (campo «por»)
let EDI={em:"",co:null};
async function miEditor(){const e=miEm();if(!e||ADM.includes(e)){EDI={em:e,co:null};return}if(EDI.em===e)return;EDI={em:e,co:null};
  try{const a=await fb(),d=await a.fs.getDoc(a.fs.doc(a.db,"editores",e));EDI.co=d.exists()?(d.data().co||null):null}catch(_){}
  if(!sec.hidden)pinta()}
const puedeCrear=()=>esAdm()||(!!EDI.co&&EDI.em===miEm());
const esMio=r=>!!r&&(esAdm()||(puedeCrear()&&r.por===miEm()));
const fb=()=>window.LDCFB?LDCFB.load():Promise.reject(new Error("sin Firebase"));
const URLAPP=typeof APPURL!=="undefined"?APPURL:location.origin+location.pathname;
const LK="ldc-retos",RC="ldc-retos-lista";
let LOC=store.get(LK,{});           // {_nom, <id>:{pub, sig, h:{cumbre:fecha}, med:[...]}}
const saveLoc=()=>store.set(LK,LOC);
const lo=id=>LOC[id]||(LOC[id]={});
let RETOS=store.get(RC,[]);          // los creados por el administrador (copia para verlos sin cobertura)
let CUR=null,SUB="cum",FIL="todas",PART={},CARGA=false;
const slug=s=>norm(String(s||"")).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||"x";
const hoyMs=()=>Date.now();
const fecha=s=>{if(!s)return"";const d=new Date(s+"T12:00:00");return isNaN(d)?s:d.toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})};
const dkm=(a,b,c,d)=>{const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,s=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(s))};

document.head.insertAdjacentHTML("beforeend",`<style>
#v-retos .inner{max-width:720px;margin:0 auto}
.rthead h2{margin:6px 0 4px;font-size:24px}.rthead p{margin:0 0 12px;color:var(--muted);font-size:15px;line-height:1.4}
.rtcard{display:flex;gap:12px;align-items:center;width:100%;box-sizing:border-box;margin:0 0 10px;padding:14px;border:1.5px solid var(--edge);border-radius:16px;background:var(--card);color:var(--ink);font:inherit;text-align:left;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.07)}
.rtcard .rte{font-size:34px;line-height:1;flex:none}.rtcard .rtt{flex:1;min-width:0}.rtcard b{display:block;font-size:18px}
.rtcard small{display:block;color:var(--muted);font-size:14px;margin:2px 0 8px}.rtcard .prog{display:block;margin:0}.rtcard .rtm{flex:none}
.rtcard.fin{opacity:.7}
.rtst{display:inline-block;font-size:12.5px;font-weight:800;border-radius:20px;padding:2px 9px;margin-right:4px;background:var(--land-dim,#eee);color:var(--ink)}
.rtst.on{background:#1e8e3e;color:#fff}.rtst.pr{background:#e8a317;color:#fff}.rtst.fi{background:#888;color:#fff}.rtst.pe{background:#c3262e;color:#fff}
.rtnew,.rtb{border:1.5px solid var(--edge);background:var(--card);color:var(--ink);border-radius:12px;padding:11px 14px;font:inherit;font-weight:800;font-size:15.5px;cursor:pointer;min-height:46px}
.rtb.pri{background:#c3262e;border-color:#c3262e;color:#fff}.rtb.sm{min-height:0;padding:7px 11px;font-size:14px}
.rtnew{width:100%;margin:0 0 12px;border-style:dashed}
.rtback{display:block;text-align:left;border:0;background:none;color:var(--ink);font:inherit;font-weight:800;font-size:16px;padding:8px 0;cursor:pointer}
.rtcab{text-align:center;margin:0 0 12px}.rtcab .rte{font-size:52px;line-height:1.1}.rtcab h2{margin:4px 0 6px;font-size:24px}
.rtcab p{margin:6px 0;color:var(--muted);font-size:15px;line-height:1.4}
.rtpr{padding:14px;border-radius:16px;background:color-mix(in srgb,#d4a017 10%,var(--card));border:1px solid color-mix(in srgb,#d4a017 40%,transparent);margin:0 0 12px}
.rtpr .tt{font-size:18px;font-weight:800;margin-bottom:6px}.rtpr .tt b{font-size:26px}.rtpr .prog{height:14px;border-radius:7px}.rtpr .prog i{background:#d4a017}
.rtmeds{display:flex;gap:6px;justify-content:space-around;flex-wrap:wrap;margin:10px 0 2px}
.rtmeds .md{display:flex;flex-direction:column;align-items:center;font-size:12px;font-weight:700;color:var(--muted);min-width:52px}
.rtpr .nx{margin:6px 0 0;font-size:14.5px;color:var(--ink);text-align:center}
.med.off{opacity:.55}
.rtjoin{padding:12px 14px;border-radius:14px;border:1px solid var(--edge);background:var(--card);margin:0 0 12px}
.rtjoin p{margin:0 0 8px;font-size:15px;line-height:1.4}.rtjoin .rw{display:flex;gap:8px;flex-wrap:wrap}
.rtfil{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 8px}
.rtfil button{border:1px solid var(--edge);background:var(--card);color:var(--ink);border-radius:20px;padding:6px 12px;font:inherit;font-weight:700;font-size:14px;cursor:pointer}
.rtfil button[aria-pressed=true]{background:var(--ink);color:var(--card);border-color:var(--ink)}
.rtit{display:flex;align-items:center;gap:10px;padding:8px 6px;border-bottom:1px solid var(--edge)}
.rtck{flex:none;width:44px;height:44px;border-radius:50%;border:2px solid var(--edge);background:var(--card);color:var(--muted);font-size:22px;font-weight:900;cursor:pointer}
.rtit.ok .rtck{background:#2e7d4f;border-color:#2e7d4f;color:#fff}
.rtck:disabled{opacity:.4;cursor:default}
.rtinfo{flex:1;min-width:0;border:0;background:none;text-align:left;font:inherit;color:var(--ink);cursor:pointer;padding:2px 0}
.rtinfo b{display:block;font-size:16px}.rtinfo small{color:var(--muted);font-size:13.5px}
.rtn{flex:none;font-size:13.5px;color:var(--muted);font-weight:700}
.rtpe{display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--edge);cursor:pointer}
.rtpe .pos{width:28px;text-align:center;font-weight:900;color:var(--muted)}.rtpe .nm{flex:1;min-width:0}.rtpe .nm b{display:block;font-size:16px}
.rtpe .nm small{color:var(--muted)}.rtpe .ls{flex-basis:100%;font-size:13.5px;color:var(--muted);padding:0 0 4px 38px}
.rtov{position:fixed;inset:0;z-index:2600;background:rgba(0,0,0,.4);display:flex;align-items:flex-end;justify-content:center}
.rtov[hidden]{display:none}
.rtdlg{background:var(--card);color:var(--ink);width:100%;max-width:560px;max-height:88%;overflow:auto;border-radius:18px 18px 0 0;padding:14px 16px calc(18px + env(safe-area-inset-bottom,0px));box-sizing:border-box}
.rtdlg h3{margin:0;font-size:21px;flex:1}.rtdlg .hd{display:flex;align-items:flex-start;gap:8px;margin-bottom:6px}
.rtdlg .x{border:0;background:none;font-size:30px;line-height:1;cursor:pointer;color:var(--ink)}
.rtdlg h4{margin:14px 0 6px;font-size:16px}
.rtdlg .who{display:flex;flex-wrap:wrap;gap:6px}.rtdlg .who span{background:var(--land-dim,#eee);border-radius:14px;padding:4px 10px;font-size:14px;font-weight:700}
.rtfotos{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}
.rtfotos figure{margin:0;position:relative}.rtfotos img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;display:block;cursor:pointer}
.rtfotos>p{grid-column:1/-1}.rtfotos figcaption{font-size:12.5px;color:var(--muted);text-align:center;margin-top:2px}
.rtdlg label{display:block;font-weight:700;margin:10px 0 4px}
.rtdlg input[type=text],.rtdlg input[type=date],.rtdlg textarea,.rtdlg select,.rtdlg input[type=search]{width:100%;box-sizing:border-box;border:1px solid var(--edge);border-radius:10px;padding:10px;font:inherit;font-size:16px;background:var(--paper,#fff);color:var(--ink)}
.rtsel{max-height:220px;overflow:auto;border:1px solid var(--edge);border-radius:10px;margin-top:6px}
.rtsel button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--edge);background:none;padding:9px 10px;font:inherit;color:var(--ink);cursor:pointer}
.rtsel button small{color:var(--muted)}
.rtcel{text-align:center;padding:10px 0 4px}.rtcel h3{font-size:24px;margin:8px 0}.rtcel p{font-size:16px;margin:0 0 14px}
.rtfull{position:fixed;inset:0;z-index:2700;background:rgba(0,0,0,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px}
.rtfull img{max-width:100%;max-height:80%;border-radius:8px}.rtfull p{color:#fff;margin:0}
.rtnv{margin:12px 0 0;padding:12px;border:2px dashed #d4a017;border-radius:14px}
.rtpick{position:fixed;left:10px;right:10px;top:calc(10px + env(safe-area-inset-top,0px));z-index:2650;background:var(--ink);color:var(--card);border-radius:14px;padding:12px 14px;display:flex;gap:10px;align-items:center;justify-content:space-between;font-size:16px;box-shadow:0 3px 12px rgba(0,0,0,.3)}
.rtpick[hidden]{display:none}.rtpick .rtb{flex:none}
#rtban{position:absolute;left:10px;right:10px;top:calc(68px + env(safe-area-inset-top,0px));z-index:1200;background:var(--card);color:var(--ink);border-radius:14px;padding:10px 12px;box-shadow:0 3px 12px rgba(0,0,0,.25);font-size:15px}
#rtban[hidden]{display:none}#rtban .t{font-weight:800;display:flex;justify-content:space-between;gap:8px;align-items:center}
#rtban .f{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}#rtban .f button,#rtban .t button{border:1px solid var(--edge);background:var(--card);color:var(--ink);border-radius:18px;padding:6px 11px;font:inherit;font-weight:700;font-size:14px;cursor:pointer}
#rtban .f button[aria-pressed=true]{background:var(--ink);color:var(--card)}#rtban .t button{background:#c3262e;border-color:#c3262e;color:#fff}
.rtmk{width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;box-sizing:border-box}
.rtmk.ok{background:#2e7d4f;color:#fff}.rtmk.pe{background:#fff;border-color:#c3262e;color:#c3262e;font-size:13px}
.rtlbl{font-weight:800;font-size:12.5px;padding:1px 6px;border-radius:8px}.rtlbl.ok{color:#2e7d4f}
.map-sinlbl .rtlbl{display:none}
.map-sinlbl .rtmk{width:22px;height:22px;margin:-11px 0 0 -11px;border-width:2px;font-size:12px}.map-sinlbl .rtmk.pe{font-size:10px}
.rttag{display:inline-block;white-space:nowrap;margin:2px 4px 0 0;border:1px solid #d4a017;background:color-mix(in srgb,#d4a017 14%,transparent);color:var(--ink);border-radius:12px;padding:0 7px;font:inherit;font-size:12px;line-height:1.6;font-weight:700;cursor:pointer;vertical-align:middle}
.rtvacio{color:var(--muted);text-align:center;padding:16px 4px}
</style>`);

/* ---------- la vista ---------- */
const sec=document.createElement("section");sec.className="view pad";sec.id="v-retos";sec.hidden=true;
sec.innerHTML=`<div class="inner" id="rtbox"></div>`;main.appendChild(sec);
const box=sec.firstElementChild;
const ov=document.createElement("div");ov.className="rtov";ov.hidden=true;ov.innerHTML=`<div class="rtdlg" role="dialog"></div>`;document.body.appendChild(ov);
const dlg=ov.firstElementChild;
const abreDlg=h=>{dlg.innerHTML=h;ov.hidden=false;dlg.scrollTop=0};
const cierraDlg=()=>{ov.hidden=true;ITEM=null};
ov.addEventListener("click",e=>{if(e.target===ov||e.target.closest("[data-rtx]"))cierraDlg()});

/* ---------- medallas ---------- */
function hitos(tot){let v=[5,15,25,50].filter(x=>x<tot);if(tot<=12)v=[Math.ceil(tot/3),Math.ceil(tot*2/3)].filter((x,i,a)=>x>0&&x<tot&&a.indexOf(x)===i);return[...v,tot]}
const MCOL=["#b8733a","#8f9aa6","#d4a017","#2b7bd5"],MNOM=["bronce","plata","oro","platino"];
function medalla(n,i,last,on,sz){sz=sz||44;const col=last?"#7b2cbf":MCOL[Math.min(i,3)];
  return `<svg class="med ${on?"on":"off"}" viewBox="0 0 48 62" width="${sz}" height="${Math.round(sz*1.29)}" aria-hidden="true"><path d="M13 1h9l5 20h-9z" fill="${on?"#c3262e":"#bdbdbd"}"/><path d="M35 1h-9l-5 20h9z" fill="${on?"#1e6fd9":"#d0d0d0"}"/>
  <circle cx="24" cy="40" r="20" fill="${on?col:"#d6d6d6"}" stroke="#fff" stroke-width="3"/><circle cx="24" cy="40" r="15" fill="none" stroke="${on?"rgba(255,255,255,.6)":"#ececec"}" stroke-width="1.5"/>
  ${last?`<text x="24" y="47" text-anchor="middle" font-size="19">${on?"🏆":"🔒"}</text>`:`<text x="24" y="46.5" text-anchor="middle" font-size="${n>=100?13:17}" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">${n}</text>`}</svg>`}
function mejor(R,n){if(!R.tot)return"";const H=hitos(R.tot);let b=-1;H.forEach((x,i)=>{if(n>=x)b=i});return b<0?"":medalla(H[b],b,b===H.length-1,true,30)}

/* ---------- los retos y sus cumbres ---------- */
function deTecho(){if(!window.TECHOS||!TECHOS.L)return null;const L=TECHOS.L();if(!L)return null;const b=TECHOS.blog?TECHOS.blog():{n:"Camudando'l camín",u:""};
  const items=L.map(T=>({id:slug(T.it.c),n:T.g?T.g.c:T.it.c,sub:"Techo de "+T.lbl,peso:T.cs.length,lat:T.it.lat,lon:T.it.lon,a:(T.g&&T.g.a)||null,keys:T.K,pi:T.g?T.g.i:-1,ci:T.it.ci}));
  const tot=Math.max(78,items.reduce((s,x)=>s+x.peso,0));
  return{id:"techos",n:"Techos de Asturias",e:"🏔",tipo:"perm",fijo:true,u:"concejos",tot,items,
    d:`La cumbre más alta de cada uno de los 78 concejos de Asturias. Algunas son techo de dos concejos y cuentan por los dos.`,org:b.n,orgu:b.u}}
// 17 nov 2026: reto fijo «Montes Cimeros de Asturias» = la capa «Montes Cimeros» del mapa de Camudando'l camín (se pone al día sola con el robot).
//  En el orden de su mapa (es su lista numerada); nombres como los pone él. Marcar una aquí la marca en toda la app (y en Techos, si es la misma cumbre).
function deCimeros(){if(!window.COLX||!COLX.todo)return null;const L=COLX.todo().filter(it=>it.pp&&it.co&&it.co.id==="c3"&&it.pp[7]==="Montes Cimeros"&&it.rr==null);if(!L.length)return null;
  const items=L.map((it,i)=>{let g=it.par&&!it.par.co?it.par:null,ms=[];
    if(COLX.cumCo)try{const x=COLX.cumCo(it.pp);ms=x.ms||[];if(!g&&x.gi!=null)g=PEAKS.find(p=>!p.co&&p.i===x.gi)||null}catch(e){}
    const K=new Set(["c:"+norm(it.c)+"@c3"]);if(g)K.add("c:"+norm(g.c));for(const{c,p}of ms)if(COLX.coKey)K.add(COLX.coKey(c,p[0]));
    return{id:slug(it.c)+"-"+(i+1),n:it.c,sub:"Nº "+(i+1)+" de la lista",peso:1,lat:it.lat,lon:it.lon,a:(COLX.alt&&COLX.alt(it.pp))||(g&&g.a)||null,keys:[...K],pi:g?g.i:-1,ci:it.ci}});
  const c=L[0].co;
  return{id:"cimeros",n:"Montes Cimeros de Asturias",e:"⛰",tipo:"perm",fijo:true,u:"cumbres",tot:items.length,items,
    d:`Los ${items.length} montes cimeros de Asturias, según la lista de ${c.n}.`,org:c.n,orgu:c.bw||"https://camudandolcamin.blogspot.com"}}
function resolver(x){const it={id:x.id,n:x.n,sub:x.sub||"",peso:1,lat:x.lat,lon:x.lon,a:x.a||null,keys:[x.k],pi:-1,ci:-1,nv:!!x.nv};
  if(x.nv)return it;
  if(!x.co){it.pi=P.findIndex(p=>norm(p.c)===norm(x.n)&&Math.abs(p.lat-x.lat)<.02&&Math.abs(p.lon-x.lon)<.02);
    if(x.t==="c"&&it.pi>=0&&window.COLX&&COLX.cumDe)try{for(const m of COLX.cumDe(it.pi))it.keys.push(COLX.coKey(m.c,m.p[0]))}catch(e){}}
  return it}
function deFire(r){const items=(r.it||[]).map(resolver);
  return{id:r.id,n:r.n||"Reto",e:r.e||"🏆",d:r.d||"",org:r.org||"",tipo:r.ini||r.fin?"fechas":"perm",ini:r.ini||"",fin:r.fin||"",prem:r.prem||"",activo:r.activo!==false,
    u:(r.it||[]).some(x=>x.t==="l")?"sitios":"cumbres",tot:items.length,items,raw:r}}
function todos(){const v=[];const t=deTecho();if(t)v.push(t);const mc=deCimeros();if(mc)v.push(mc);for(const r of RETOS){if(r.activo===false&&!esMio(r))continue;v.push(deFire(r))}return v}
const reto=id=>todos().find(r=>r.id===id);
function estado(R){if(R.tipo!=="fechas")return{k:"pe",t:"Permanente",on:true};const h=new Date().toISOString().slice(0,10);
  if(R.ini&&h<R.ini)return{k:"pr",t:"Empieza el "+fecha(R.ini),on:false};
  if(R.fin&&h>R.fin)return{k:"fi",t:"Terminado el "+fecha(R.fin),on:false};
  if(R.fin){const q=Math.ceil((new Date(R.fin+"T23:59:59")-new Date())/864e5);return{k:"on",t:q<=45?`En marcha · quedan ${q} día${q===1?"":"s"}`:"En marcha · hasta el "+fecha(R.fin),on:true}}
  return{k:"on",t:"En marcha",on:true}}
const hechoMk=it=>it.keys.some(k=>MARKS[k]==="hecha");
function hecho(R,it){if(R.tipo!=="fechas")return hechoMk(it);const L=LOC[R.id];return!!(L&&L.h&&L.h[it.id])}
function prog(R){let n=0;for(const it of R.items)if(hecho(R,it))n+=it.peso;return Math.min(n,R.tot)}

/* ---------- los que se han apuntado (Firestore) ---------- */
async function cargaRetos(){if(CARGA)return;CARGA=true;
  try{const a=await fb(),fs=a.fs,s=await fs.getDocs(fs.collection(a.db,"retos"));const v=[];s.forEach(d=>v.push(Object.assign({id:d.id},d.data())));
    v.sort((x,y)=>(x.ord||0)-(y.ord||0)||String(x.n).localeCompare(String(y.n),"es"));
    if(JSON.stringify(v)!==JSON.stringify(RETOS)){RETOS=v;store.set(RC,v);pinta();TGI=null;try{renderCols()}catch(e){}}}
  catch(e){console.warn("retos",e)}finally{CARGA=false}}
async function cargaPart(id,forzar){const c=PART[id];if(c&&!forzar&&Date.now()-c.t<120000)return c.l;
  try{const a=await fb(),fs=a.fs,s=await fs.getDocs(fs.query(fs.collection(a.db,"retosu"),fs.where("r","==",id)));const l=[];s.forEach(d=>l.push(d.data()));
    PART[id]={t:Date.now(),l};if(CUR===id)pinta();return l}catch(e){console.warn("retosu",e);if(!c)PART[id]={t:Date.now()-90000,l:[],err:1};return(c||PART[id]).l}}

/* ✔ = tiene un track guardado que pasa a menos de 150 m */
function conTrack(it){const ts=window.MISPUNTOS&&MISPUNTOS.tracks?MISPUNTOS.tracks():[];
  for(const t of ts){const ps=t.pts||[];for(const q of ps){const la=Array.isArray(q)?q[0]:q&&q.lat,lo=Array.isArray(q)?q[1]:q&&q.lon;
    if(la==null||Math.abs(la-it.lat)>.0016||Math.abs(lo-it.lon)>.0022)continue;if(dkm(la,lo,it.lat,it.lon)<.15)return true}}return false}
const PUBT={},PUBJ={};
function payload(R){const u=usr(),L=lo(R.id),h={},v={};
  for(const it of R.items)if(hecho(R,it)){h[it.id]=(L.h&&L.h[it.id])||1;if(conTrack(it))v[it.id]=1}
  const n=prog(R);return{r:R.id,u:u.uid,nom:String(LOC._nom||"").slice(0,30),n,tot:R.tot,comp:n>=R.tot,h,v}}
// 24 nov 2026: «apuntado» es de una cuenta, no del móvil (antes, al entrar con otra cuenta en el mismo móvil, se apuntaba también esa:
// Jonathan salía 3 veces en Techos). L.pub guarda el uid de la cuenta apuntada; los antiguos (true) pasan a la cuenta que esté dentro.
function publica(R,ya){const L=LOC[R.id],u=usr();if(!L||!L.pub||!u)return;if(L.pub===true){L.pub=u.uid;saveLoc()}if(L.pub!==u.uid)return;clearTimeout(PUBT[R.id]);
  PUBT[R.id]=setTimeout(async()=>{try{const d=payload(R),j=JSON.stringify(d);if(PUBJ[R.id]===j)return;
    const a=await fb();await a.fs.setDoc(a.fs.doc(a.db,"retosu",R.id+"_"+d.u),Object.assign({t:Date.now()},d));PUBJ[R.id]=j;
    const c=PART[R.id];if(c){c.l=c.l.filter(x=>x.u!==d.u);c.l.push(d);if(CUR===R.id)pinta()}}catch(e){console.warn("publicar reto",e)}},ya?0:1500)}
function publicaTodos(){for(const R of todos())publica(R)}

/* ---------- celebrar medallas nuevas ---------- */
function revisa(R,celebrar){if(!R.items.length)return;const L=lo(R.id),n=prog(R),H=hitos(R.tot),g=H.filter(x=>n>=x);
  if(!L.med){L.med=g;saveLoc();return}
  const nuevas=g.filter(x=>!L.med.includes(x));L.med=g;saveLoc();
  if(nuevas.length&&celebrar!==false){const x=nuevas[nuevas.length-1],i=H.indexOf(x),last=i===H.length-1;
    abreDlg(`<div class="rtcel">${medalla(x,i,last,true,110)}<h3>${last?"¡Reto completado!":"¡Medalla de "+MNOM[Math.min(i,3)]+"!"}</h3>
      <p>${last?`Has completado <b>${esc(R.n)}</b>.${R.prem?" "+esc(R.prem):" Enhorabuena, ¡eso es mucho monte!"}`:`Llevas <b>${n}</b> ${esc(R.u)} en <b>${esc(R.n)}</b>.`}</p>
      ${L.pub?"":`<p style="font-size:14.5px;color:var(--muted)">Apúntate al reto para salir en la lista de participantes.</p>`}
      <button class="rtb pri" data-rtgo="${esc(R.id)}">Ver el reto</button> <button class="rtb" data-rtx>Cerrar</button></div>`)}}
let RVT=0;
function cambio(){clearTimeout(RVT);RVT=setTimeout(()=>{for(const R of todos()){revisa(R);publica(R)}if(!sec.hidden)pinta();if(RMAP)dibujaMapa()},400)}

/* en los retos con fechas, lo que marques ✓ en cualquier sitio mientras está en marcha también cuenta (si sigues el reto) */
let ANT=new Set(Object.keys(MARKS).filter(k=>MARKS[k]==="hecha"));
{const orig=saveMarks;window.saveMarks=saveMarks=function(){const r=orig.apply(this,arguments);
  try{const now=new Set(Object.keys(MARKS).filter(k=>MARKS[k]==="hecha")),nue=[...now].filter(k=>!ANT.has(k));ANT=now;
    if(nue.length)for(const R of todos()){if(R.tipo!=="fechas"||!estado(R).on)continue;const L=LOC[R.id];if(!L||!(L.sig||L.pub))continue;
      for(const it of R.items)if(!(L.h&&L.h[it.id])&&it.keys.some(k=>nue.includes(k))){(L.h||(L.h={}))[it.id]=Date.now()}}
    saveLoc()}catch(e){}
  cambio();return r}}

/* ---------- pintar ---------- */
function pinta(){if(CUR){const R=reto(CUR);if(R){pintaReto(R);return}CUR=null}pintaLista()}
function tarjeta(R){const n=prog(R),st=estado(R);
  return `<button class="rtcard${st.k==="fi"?" fin":""}" data-rt="${esc(R.id)}"><span class="rte">${esc(R.e)}</span><span class="rtt"><b>${esc(R.n)}</b>
    <small><span class="rtst ${st.k}">${esc(st.t)}</span>${R.activo===false?`<span class="rtst pr">📝 Borrador</span>`:""} Llevas ${n} de ${R.tot}</small><span class="prog"><i style="width:${(R.tot?n/R.tot*100:0).toFixed(1)}%"></i></span></span><span class="rtm">${mejor(R,n)}</span></button>`}
function pintaLista(){const v=todos();const ord=R=>{const k=estado(R).k;return R.fijo?0:k==="on"?1:k==="pe"?2:k==="pr"?3:4};v.sort((a,b)=>ord(a)-ord(b));
  const bor=v.filter(R=>R.activo===false),vivos=v.filter(R=>R.activo!==false&&estado(R).k!=="fi"),fin=v.filter(R=>R.activo!==false&&estado(R).k==="fi");
  box.innerHTML=`<div class="rthead"><h2>🏆 Retos</h2><p>Marca las cumbres que vas subiendo y gana medallas. Si te apuntas, verás quién más las ha subido y saldrás en la lista.</p></div>
  ${puedeCrear()?`<button class="rtnew" data-rtnew>＋ Crear un reto</button>`:""}
  ${bor.length?`<h3 style="margin:6px 0 8px;font-size:16px">📝 Borradores · ${esAdm()?"solo los veis los administradores":"solo los ves tú (y los administradores)"}</h3>${bor.map(tarjeta).join("")}<h3 style="margin:14px 0 8px;font-size:16px">Publicados</h3>`:""}
  ${vivos.map(tarjeta).join("")||`<p class="rtvacio">Cargando los retos…</p>`}
  ${fin.length?`<details><summary style="font-weight:800;margin:10px 0;cursor:pointer">Retos terminados (${fin.length})</summary>${fin.map(tarjeta).join("")}</details>`:""}`}
function pintaReto(R){const n=prog(R),st=estado(R),H=hitos(R.tot),L=lo(R.id),u=usr();
  const sig=H.find(x=>n<x),pc=c=>c&&c.l?c.l:[];const part=pc(PART[R.id]).slice().sort((a,b)=>(b.n||0)-(a.n||0)||(a.t||0)-(b.t||0));
  const cuenta={};for(const p of part)for(const k in (p.h||{}))cuenta[k]=(cuenta[k]||0)+1;
  const its=R.items.filter(it=>FIL==="todas"||(FIL==="hechas")===hecho(R,it));
  const fechas=R.tipo==="fechas";
  box.innerHTML=`<button class="rtback" data-rtback>‹ Retos</button>
  ${R.activo===false?`<div class="rtjoin" style="border:2px dashed #e8a317"><p>📝 <b>Borrador:</b> ${esAdm()?"solo lo veis los administradores":"solo lo ves tú (y los administradores)"}. Cuando esté listo, publícalo.</p><div class="rw"><button class="rtb pri sm" data-rtpub>✅ Publicar el reto</button><button class="rtb sm" data-rtedit>✏️ Seguir editando</button></div></div>`:""}
  <div class="rtcab"><div class="rte">${esc(R.e)}</div><h2>${esc(R.n)}</h2><p><span class="rtst ${st.k}">${esc(st.t)}</span>${fechas&&R.ini?` ${esc(fecha(R.ini))} – ${esc(fecha(R.fin))}`:""}</p>
    ${R.d?`<p>${esc(R.d)}</p>`:""}${R.org?`<p>Reto de ${R.orgu?`<a href="${esc(R.orgu)}" target="_blank" rel="noopener">${esc(R.org)}</a>`:esc(R.org)}</p>`:""}
    ${fechas?`<p style="font-size:14px">Solo cuenta lo que marques ✓ mientras el reto está en marcha.</p>`:""}</div>
  ${!R.items.length?`<p class="rtvacio">Todavía no tiene cumbres. Toca ✏️ Editar para añadirlas.</p>`:`<div class="rtpr"><div class="tt">Llevas <b>${n}</b> de ${R.tot} ${esc(R.u)}</div><div class="prog"><i style="width:${(R.tot?n/R.tot*100:0).toFixed(1)}%"></i></div>
    <div class="rtmeds">${H.map((x,i)=>`<span class="md">${medalla(x,i,i===H.length-1,n>=x,44)}${i===H.length-1?"Completo":["Bronce","Plata","Oro","Platino"][Math.min(i,3)]}</span>`).join("")}</div>
    <p class="nx">${sig==null?"🏆 ¡Reto completado!":sig===R.tot?`Te faltan <b>${R.tot-n}</b> para completarlo`:`Te faltan <b>${sig-n}</b> para la medalla de ${sig}`}</p></div>
  <button class="rtb pri" data-rtmapa style="width:100%;margin:0 0 12px">🗺 Ver el reto en el mapa</button>`}
  <div class="rtjoin">${L.pub&&u&&(L.pub===true||L.pub===u.uid)?`<p>✅ Estás apuntado como <b>${esc(LOC._nom||"")}</b>. Los demás ven tu progreso.</p><div class="rw"><button class="rtb sm" data-rtnom>✏️ Cambiar nombre</button><button class="rtb sm" data-rtsal>Dejar de salir en la lista</button></div>`
    :`<p>Apúntate para salir en la lista de participantes y poder subir una foto de cada cumbre.${u?"":" Hace falta entrar con Google."}</p><div class="rw"><button class="rtb pri" data-rtjoin>🙋 Apuntarme al reto</button></div>`}</div>
  <div class="subtabs" style="grid-template-columns:repeat(2,1fr)"><button role="tab" data-rtsub="cum" aria-selected="${SUB==="cum"}"><span class="i">⛰️</span><span>${R.u==="concejos"?"Cumbres":"Lista"}</span><small>${R.items.length}</small></button><button role="tab" data-rtsub="gente" aria-selected="${SUB==="gente"}"><span class="i">👥</span><span>Participantes</span><small>${PART[R.id]?part.length:"…"}</small></button></div>
  ${SUB==="cum"?`<div class="rtfil">${[["todas","Todas"],["hechas","✓ Hechas"],["pend","Me faltan"]].map(([k,t])=>`<button data-rtfil="${k}" aria-pressed="${FIL===k}">${t}</button>`).join("")}</div>
    ${its.map(it=>`<div class="rtit${hecho(R,it)?" ok":""}"><button class="rtck" data-rtck="${esc(it.id)}" aria-label="Hecha"${!st.on&&fechas?" disabled":""}>✓</button>
      <button class="rtinfo" data-rtit="${esc(it.id)}"><b>${esc(it.n)}</b><small>${[it.sub,it.a?it.a+" m":""].filter(Boolean).map(esc).join(" · ")}</small></button><span class="rtn">${cuenta[it.id]?"👥 "+cuenta[it.id]:""}</span></div>`).join("")||`<p class="rtvacio">Nada por aquí.</p>`}`
  :`${!PART[R.id]?`<p class="rtvacio">Cargando…</p>`:part.length?part.map((p,i)=>`<div class="rtpe" data-rtpe="${i}"><span class="pos">${i+1}</span>${mejor(R,p.n||0)||`<span style="width:30px"></span>`}<span class="nm"><b>${esc(p.nom||"Sin nombre")}${p.comp?" 🏆":""}</b><small>${p.n||0} de ${R.tot} ${esc(R.u)}${Object.keys(p.v||{}).length?` · ✔ ${Object.keys(p.v).length} con track`:""}</small></span>${esAdm()?`<button class="rtb sm" data-rtdel="${esc(p.u||"")}" title="Quitar de la lista (administrador)" style="margin-left:auto;flex:none">🗑</button>`:""}</div>`).join("")
    :`<p class="rtvacio">${PART[R.id].err?"Sin conexión: no se puede ver quién participa.":"Todavía no se ha apuntado nadie. ¡Sé el primero!"}</p>`}`}
  <p style="margin:16px 0 8px;display:flex;gap:8px;flex-wrap:wrap"><button class="rtb" data-rtshare>📤 Compartir el reto</button>${!R.fijo&&esMio(R.raw)?`<button class="rtb" data-rtedit>✏️ Editar el reto</button>`:""}</p>`}

/* ---------- ficha de una cumbre del reto ---------- */
let ITEM=null;
async function ficha(R,it){ITEM={R,it};const c=PART[R.id]?PART[R.id].l:[];const st=estado(R),ok=hecho(R,it),L=lo(R.id),u=usr();
  const quien=c.filter(p=>p.h&&p.h[it.id]);
  abreDlg(`<div class="hd"><h3>${esc(it.n)}</h3><button class="x" data-rtx aria-label="Cerrar">×</button></div>
    <p style="margin:0;color:var(--muted)">${[it.sub,it.a?it.a+" m":"",R.n].filter(Boolean).map(esc).join(" · ")}</p>
    <p style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0"><button class="rtb ${ok?"":"pri"}" data-rtck="${esc(it.id)}"${!st.on&&R.tipo==="fechas"?" disabled":""}>${ok?"✓ Hecha (tocar para quitar)":"✓ La he subido"}</button><button class="rtb" data-rtmap>🗺 Ver en el mapa</button></p>
    <h4>La han subido (${quien.length})</h4>${quien.length?`<div class="who">${quien.map(p=>`<span>${esc(p.nom||"?")}${p.v&&p.v[it.id]?" ✔":""}</span>`).join("")}</div><p style="font-size:13px;color:var(--muted);margin:6px 0 0">✔ = con un track guardado que pasa por la cumbre.</p>`:`<p style="color:var(--muted);margin:0">Nadie de los apuntados todavía.</p>`}
    <h4>Fotos</h4><div class="rtfotos" id="rtfotos"><p style="color:var(--muted);margin:0">Cargando…</p></div>
    ${ok&&L.pub&&u&&(L.pub===true||L.pub===u.uid)?`<p style="margin:12px 0 0"><label class="rtb" style="display:inline-block;margin:0">📷 Subir mi foto<input type="file" accept="image/*" data-rtfoto hidden></label></p>`:ok?`<p style="font-size:14px;color:var(--muted)">Apúntate al reto para subir tu foto de la cumbre.</p>`:""}`);
  try{const a=await fb(),fs=a.fs,s=await fs.getDocs(fs.query(fs.collection(a.db,"retosf"),fs.where("r","==",R.id),fs.where("i","==",it.id)));
    const v=[];s.forEach(d=>v.push(Object.assign({id:d.id},d.data())));v.sort((x,y)=>(y.t||0)-(x.t||0));
    if(!ITEM||ITEM.it!==it)return;FOTOS=v;const el=document.getElementById("rtfotos");if(!el)return;
    el.innerHTML=v.length?v.map((f,i)=>`<figure><img src="${esc(f.f)}" alt="" data-rtver="${i}" loading="lazy"><figcaption>${esc(f.nom||"")}</figcaption></figure>`).join(""):`<p style="color:var(--muted);margin:0">Todavía no hay fotos.</p>`}
  catch(e){const el=document.getElementById("rtfotos");if(el)el.innerHTML=`<p style="color:var(--muted);margin:0">${navigator.onLine?"No se han podido cargar las fotos.":"Sin conexión."}</p>`}}
let FOTOS=[];
function verFoto(i){const f=FOTOS[i];if(!f)return;const u=usr(),mia=u&&f.u===u.uid;
  const d=document.createElement("div");d.className="rtfull";d.innerHTML=`<img src="${esc(f.f)}" alt=""><p>${esc(f.nom||"")}</p><p style="display:flex;gap:8px">${mia||esAdm()?`<button class="rtb sm" data-rtdel>🗑 Borrar</button>`:""}<button class="rtb sm" data-rtcl>Cerrar</button></p>`;
  document.body.appendChild(d);
  d.addEventListener("click",async e=>{if(e.target.closest("[data-rtdel]")){if(!confirmar("¿Borrar esta foto?"))return;try{const a=await fb();await a.fs.deleteDoc(a.fs.doc(a.db,"retosf",f.id));d.remove();toast("Foto borrada");if(ITEM)ficha(ITEM.R,ITEM.it)}catch(er){toast("No se ha podido borrar")}return}
    if(e.target===d||e.target.closest("[data-rtcl]"))d.remove()})}
const confirmar=t=>{try{return window.confirm(t)}catch(e){return true}};
function reduce(file,max,q){return new Promise((ok,no)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);ok(c.toDataURL("image/jpeg",q))};img.onerror=()=>{URL.revokeObjectURL(url);no(new Error("imagen"))};img.src=url})}
async function subeFoto(file){if(!ITEM||!file)return;const{R,it}=ITEM,u=usr();if(!u){cuentaPanel&&cuentaPanel();return}
  toast("Subiendo la foto…");
  try{let j=await reduce(file,1200,.75);if(j.length>650000)j=await reduce(file,900,.65);
    const a=await fb();await a.fs.setDoc(a.fs.doc(a.db,"retosf",R.id+"_"+u.uid+"_"+it.id),{r:R.id,u:u.uid,i:it.id,nom:String(LOC._nom||"").slice(0,30),f:j,t:Date.now()});
    toast("✅ Foto subida");ficha(R,it)}catch(e){console.warn("foto reto",e);toast(navigator.onLine?"No se ha podido subir la foto":"Sin conexión: prueba cuando tengas datos")}}

/* ---------- marcar ---------- */
function marca(R,it){const st=estado(R);if(R.tipo==="fechas"&&!st.on){toast(st.t);return}
  const L=lo(R.id);L.sig=true;
  if(R.tipo==="fechas"){L.h=L.h||{};if(L.h[it.id]){delete L.h[it.id];saveLoc();cambio();return}
    L.h[it.id]=Date.now();saveLoc();if(!hechoMk(it)){for(const k of it.keys)MARKS[k]="hecha";saveMarks()}else cambio();toast("Marcado ✓");return}
  const v=hechoMk(it)?"":"hecha";for(const k of it.keys){if(v)MARKS[k]=v;else delete MARKS[k]}
  saveLoc();saveMarks();if(typeof renderCols==="function")try{renderCols()}catch(e){}if(window.refreshMarks)refreshMarks();toast(v?"Marcado ✓":"Quitada la marca")}
let RTMK=null;
function marcaNueva(it){try{if(RTMK)map.removeLayer(RTMK);RTMK=L.marker([it.lat,it.lon],{zIndexOffset:2000,icon:L.divIcon({className:"",iconSize:[34,34],iconAnchor:[17,17],html:`<div style="width:34px;height:34px;border-radius:50%;background:#d4a017;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:17px">🏆</div>`})}).addTo(map).bindPopup(`<b>${esc(it.n)}</b>${it.a?"<br>"+esc(it.a)+" m":""}<br><a href="https://www.google.com/maps/dir/?api=1&destination=${it.lat},${it.lon}" target="_blank" rel="noopener">🚗 Cómo llegar</a>`).openPopup()}catch(e){}}
function verMapa(it){cierraDlg();if(typeof showView==="function")showView("mapa");
  // 17 nov 2026: siempre se acerca a la cumbre (zoom 13) y la deja parpadeando (RESALTA), con la ficha abierta
  const zoom=()=>{setTimeout(()=>{try{flyTo(it.lat,it.lon,32);if(window.RESALTA)RESALTA.pon(it.lat,it.lon,it.n,true)}catch(e){}},450)};
  setTimeout(()=>{try{if(it.nv){flyTo(it.lat,it.lon,32);setTimeout(()=>marcaNueva(it),700);return}if(it.pi>=0){pickRoute(it.pi);zoom();return}
    let ci=it.ci;if((ci==null||ci<0)&&window.COLX&&COLX.findPt)ci=COLX.findPt(it.n,it.lat,it.lon);
    if(ci!=null&&ci>=0&&window.COLX){COLX.open(ci);zoom();return}zoom()}catch(e){zoom()}},200)}

/* ---------- apuntarse ---------- */
let QUIERE=null;
function apuntar(id){const u=usr();if(!u){QUIERE=id;toast("Entra con tu cuenta de Google para apuntarte");if(window.cuentaPanel)cuentaPanel();return}
  pideNombre(()=>{const L=lo(id);L.pub=u.uid;L.sig=true;saveLoc();const R=reto(id);if(R){revisa(R,false);publica(R,true)}toast("✅ Apuntado. ¡A por ello!");setTimeout(()=>cargaPart(id,true),1500);pinta()})}
function pideNombre(fn){const u=usr();const def=LOC._nom||((u&&u.displayName)||"").trim().split(/\s+/)[0]||"";
  abreDlg(`<div class="hd"><h3>¿Con qué nombre quieres salir?</h3><button class="x" data-rtx aria-label="Cerrar">×</button></div>
    <p style="margin:0 0 6px;color:var(--muted)">Es el nombre que verán los demás en la lista del reto y en tus fotos. Puede ser un apodo.</p>
    <input type="text" id="rtnom" maxlength="30" value="${esc(def)}" autocomplete="nickname"><p style="margin:12px 0 0"><button class="rtb pri" data-rtnomok>Guardar</button></p>
    <p style="font-size:13.5px;color:var(--muted)">Puedes dejar de salir cuando quieras. <a href="privacidad.html" target="_blank" rel="noopener">Privacidad</a></p>`);
  PIDE=fn;setTimeout(()=>{const i=document.getElementById("rtnom");if(i)i.focus()},100)}
let PIDE=null;
async function salir(id){if(!confirmar("¿Dejar de salir en la lista de este reto? Tu progreso se queda en tu móvil."))return;const u=usr(),L=lo(id);L.pub=false;saveLoc();
  try{const a=await fb();await a.fs.deleteDoc(a.fs.doc(a.db,"retosu",id+"_"+u.uid));delete PUBJ[id];if(PART[id])PART[id].l=PART[id].l.filter(x=>x.u!==u.uid)}catch(e){toast("No se ha podido quitar ahora; prueba con cobertura")}pinta()}
addEventListener("ldc-user",()=>{setTimeout(miEditor,300);setTimeout(()=>{const u=usr();if(u&&QUIERE){const id=QUIERE;QUIERE=null;apuntar(id);return}if(u)publicaTodos();if(!sec.hidden)pinta()},800)});

/* ---------- crear y editar retos (administrador) ---------- */
let ED=null;
function fuentes(){const v=[];
  for(const p of PEAKS)if(!p.co)v.push({n:p.c,t:"c",lat:p.lat,lon:p.lon,a:p.a||null,k:"c:"+norm(p.c),co:"",s:"Cumbre · Los de las Claras"});
  if(typeof SPOTS!=="undefined")for(const p of SPOTS)if(!p.co)v.push({n:p.c,t:"l",lat:p.lat,lon:p.lon,a:null,k:"l:"+norm(p.c),co:"",s:"Lugar · Los de las Claras"});
  if(window.COLX&&COLX.todo)for(const x of COLX.todo()){if(!x.pp||(x.k!=="cumbre"&&x.k!=="lugar"))continue;
    if(v.some(y=>!y.co&&norm(y.n)===norm(x.c)&&Math.abs(y.lat-x.lat)<.005))continue;
    v.push({n:x.c,t:x.k==="cumbre"?"c":"l",lat:x.lat,lon:x.lon,a:null,k:COLX.coKeyK?COLX.coKeyK(x.co,x.c,x.k):COLX.coKey(x.co,x.c),co:x.co.id,s:(x.k==="cumbre"?"Cumbre · ":"Lugar · ")+x.co.n})}
  return v}
const nomCo=()=>{try{const x=EDI.co&&window.COLX&&COLX.todo?COLX.todo().find(y=>y.co&&y.co.id===EDI.co):null;return x?x.co.n:""}catch(_){return""}};
function editar(r){ED=r?JSON.parse(JSON.stringify(r)):{id:"",n:"",e:"🏆",d:"",org:esAdm()?"":nomCo(),ini:"",fin:"",prem:"",activo:false,it:[]};ED._fe=!!(ED.ini||ED.fin);pintaEd()}
function pintaEd(){const r=ED,fe=!!r._fe;
  abreDlg(`<div class="hd"><h3>${r.id?"Editar reto":"Reto nuevo"}</h3><button class="x" data-rtx aria-label="Cerrar">×</button></div>
  <label>Nombre</label><input type="text" data-ed="n" value="${esc(r.n)}" maxlength="60" placeholder="Reto de la Federación 2027">
  <label>Icono (un emoji)</label><input type="text" data-ed="e" value="${esc(r.e)}" maxlength="4" style="width:80px">
  <label>Descripción</label><textarea data-ed="d" rows="3" maxlength="600">${esc(r.d)}</textarea>
  <label>Organiza (opcional)</label><input type="text" data-ed="org" value="${esc(r.org)}" maxlength="60" placeholder="Federación de Deportes de Montaña…">
  <label>Premio al completarlo (texto opcional)</label><input type="text" data-ed="prem" value="${esc(r.prem)}" maxlength="140">
  <label>Tipo</label><select data-edtipo><option value="perm"${fe?"":" selected"}>Permanente</option><option value="fechas"${fe?" selected":""}>Con fechas (anual, temporal…)</option></select>
  ${fe?`<label>Empieza</label><input type="date" data-ed="ini" value="${esc(r.ini)}"><label>Termina</label><input type="date" data-ed="fin" value="${esc(r.fin)}">`:""}
  <label>Cumbres y lugares (${r.it.length})</label>
  <div>${r.it.map((x,i)=>`<div class="rtit"><span class="rtinfo"><b>${esc(x.n)}</b><small>${esc(x.s||"")}</small></span><button class="rtb sm" data-edq="${i}">✕</button></div>`).join("")||`<p style="color:var(--muted);margin:0">Busca abajo y toca para añadir.</p>`}</div>
  <input type="search" data-edbus placeholder="Buscar una cumbre o un lugar…" style="margin-top:8px"><div class="rtsel" data-edres hidden></div>
  ${r._nv?nuevaHtml(r._nv):`<p style="margin:10px 0 0"><button class="rtb" data-ednv>＋ Cumbre o lugar nuevo (que no está en la app)</button></p>`}
  ${r.activo===false?`<p style="margin:16px 0 0;font-size:14px;color:var(--muted)">📝 Puedes guardarlo como borrador y seguir otro día: ${esAdm()?"solo lo veis los administradores":"solo lo ves tú (y los administradores)"} hasta que lo publiques.</p>`:""}
  <p style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 0">${r.activo===false?`<button class="rtb" data-edok="b">💾 Guardar borrador</button><button class="rtb pri" data-edok="p">✅ Publicar el reto</button>`:`<button class="rtb pri" data-edok="g">💾 Guardar cambios</button><button class="rtb" data-edok="b">⏸ Pasar a borrador</button>`}${r.id?`<button class="rtb" data-edborra>🗑 Borrar el reto</button>`:""}</p>`)}
function nuevaHtml(v){return `<div class="rtnv"><b>Cumbre o lugar nuevo</b><small style="display:block;color:var(--muted)">Solo existe dentro de este reto.</small>
  <label>Nombre</label><input type="text" data-nv="n" value="${esc(v.n||"")}" maxlength="60" placeholder="Pico…">
  <label>Es</label><select data-nv="t"><option value="c"${v.t!=="l"?" selected":""}>Cumbre</option><option value="l"${v.t==="l"?" selected":""}>Lugar (lago, braña, refugio…)</option></select>
  <label>Altitud en metros (opcional)</label><input type="text" inputmode="numeric" data-nv="a" value="${esc(v.a||"")}" maxlength="5" style="width:120px">
  <label>Dónde está</label>
  ${v.lat!=null?`<p style="margin:0 0 6px;font-weight:700;color:#1e8e3e">✓ ${(+v.lat).toFixed(5)}, ${(+v.lon).toFixed(5)}</p>`:`<p style="margin:0 0 6px;color:var(--muted)">Todavía sin sitio.</p>`}
  <div class="rw" style="display:flex;gap:8px;flex-wrap:wrap"><button class="rtb sm" data-nvmapa>🗺 Tocar en el mapa</button><button class="rtb sm" data-nvgps>📍 Estoy aquí</button></div>
  <input type="text" data-nvpega placeholder="…o pega coordenadas o un enlace de Google Maps" style="margin-top:8px">
  <p style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 0"><button class="rtb pri sm" data-nvok>Añadir al reto</button><button class="rtb sm" data-nvno>Cancelar</button></p></div>`}
function leeNv(){const v=ED&&ED._nv;if(!v)return;dlg.querySelectorAll("[data-nv]").forEach(i=>{v[i.dataset.nv]=i.value.trim()})}
const enSitio=(la,lo)=>la>27&&la<56&&lo>-19&&lo<25;
let PICK=false;
const aviso=document.createElement("div");aviso.className="rtpick";aviso.hidden=true;document.body.appendChild(aviso);
function tocarMapa(){leeEd();leeNv();PICK=true;ov.hidden=true;if(typeof showView==="function")showView("mapa");
  aviso.innerHTML=`<span>Toca en el mapa dónde está <b>${esc(ED._nv.n||"la cumbre")}</b></span><button class="rtb sm" data-pkno>Cancelar</button>`;aviso.hidden=false;
  const fin=ll=>{aviso.hidden=true;map.off("click",clic);PICK=false;if(ll){ED._nv.lat=ll.lat;ED._nv.lon=ll.lng}if(typeof showView==="function")showView("retos");pintaEd();
    setTimeout(()=>{const f=dlg.querySelector(".rtnv");if(f)f.scrollIntoView({block:"center"})},80)};
  const clic=e=>fin(e.latlng);setTimeout(()=>map.on("click",clic),50);
  aviso.querySelector("[data-pkno]").onclick=()=>fin(null)}
let EDRES=[];
function buscaEd(q){const el=dlg.querySelector("[data-edres]");if(!el)return;q=norm(q.trim());if(q.length<2){el.hidden=true;return}
  EDRES=fuentes().filter(x=>norm(x.n).includes(q)&&!ED.it.some(y=>y.k===x.k)).slice(0,40);
  el.hidden=false;el.innerHTML=EDRES.map((x,i)=>`<button data-edadd="${i}"><b>${esc(x.n)}</b>${x.a?" · "+x.a+" m":""}<br><small>${esc(x.s)}</small></button>`).join("")||`<p style="padding:8px;margin:0;color:var(--muted)">No encuentro nada.</p>`;setTimeout(()=>el.scrollIntoView({block:"nearest"}),50)}
function leeEd(){dlg.querySelectorAll("[data-ed]").forEach(i=>{ED[i.dataset.ed]=i.value.trim()});}
async function guardaEd(modo){leeEd();const r=ED;if(!r.n){toast("Ponle un nombre");return}
  const pub=modo==="p"?true:modo==="b"?false:r.activo!==false;
  if(pub&&!r.it.length){toast("Añade al menos una cumbre para publicarlo");return}
  if(pub&&r._fe&&(!r.ini||!r.fin)){toast("Pon las dos fechas para publicarlo");return}
  r.activo=pub;if(r.ini&&r.fin&&r.fin<r.ini){toast("La fecha de fin es anterior a la de inicio");return}
  const id=r.id||(slug(r.n).slice(0,30)+"-"+Math.random().toString(36).slice(2,6));
  const d={por:r.por||miEm(),n:r.n,e:r.e||"🏆",d:r.d||"",org:r.org||"",prem:r.prem||"",ini:r._fe?r.ini:"",fin:r._fe?r.fin:"",activo:r.activo!==false,ord:r.ord||0,
    it:r.it.map(x=>({id:x.id||slug((x.t||"c")+"-"+x.n),n:x.n,t:x.t,lat:+(+x.lat).toFixed(6),lon:+(+x.lon).toFixed(6),a:x.a||null,k:x.k,co:x.co||"",s:x.s||"",nv:x.nv?1:0})),t:Date.now()};
  try{const a=await fb();await a.fs.setDoc(a.fs.doc(a.db,"retos",id),d);toast(modo==="p"?"✅ Reto publicado: ya lo ve todo el mundo":modo==="b"?"📝 Guardado como borrador":"✅ Reto guardado");cierraDlg();
    RETOS=RETOS.filter(x=>x.id!==id).concat([Object.assign({id},d)]);store.set(RC,RETOS);CUR=id;pinta()}
  catch(e){console.warn("guardar reto",e);toast("No se ha podido guardar (¿reglas de Firestore puestas?)")}}
async function borraEd(){if(!ED.id||!confirmar("¿Borrar este reto? Los apuntados dejarán de verlo."))return;
  try{const a=await fb();await a.fs.deleteDoc(a.fs.doc(a.db,"retos",ED.id));RETOS=RETOS.filter(x=>x.id!==ED.id);store.set(RC,RETOS);CUR=null;cierraDlg();toast("Reto borrado");pinta()}
  catch(e){toast("No se ha podido borrar")}}

/* ---------- toques ---------- */
box.addEventListener("click",e=>{const t=e.target;let b;
  if(b=t.closest("[data-rt]")){CUR=b.dataset.rt;SUB="cum";FIL="todas";pinta();sec.scrollTop=0;cargaPart(CUR);return}
  if(t.closest("[data-rtback]")){CUR=null;pinta();sec.scrollTop=0;return}
  if(t.closest("[data-rtnew]")){editar(null);return}
  const R=CUR&&reto(CUR);if(!R)return;
  if(b=t.closest("[data-rtsub]")){SUB=b.dataset.rtsub;if(SUB==="gente")cargaPart(R.id);pinta();return}
  if(b=t.closest("[data-rtfil]")){FIL=b.dataset.rtfil;pinta();return}
  if(b=t.closest("[data-rtck]")){const it=R.items.find(x=>x.id===b.dataset.rtck);if(it)marca(R,it);return}
  if(b=t.closest("[data-rtit]")){const it=R.items.find(x=>x.id===b.dataset.rtit);if(it)ficha(R,it);return}
  // 24 nov 2026: el administrador puede quitar a alguien de la lista (p. ej. apuntados repetidos); su progreso sigue en su móvil
  if(b=t.closest("[data-rtdel]")){const uid=b.dataset.rtdel,p=(PART[R.id].l||[]).find(x=>x.u===uid);if(!uid||!confirmar(`¿Quitar a «${(p&&p.nom)||"?"}» (${(p&&p.n)||0} de ${R.tot}) de la lista de este reto?`))return;
    fb().then(a=>a.fs.deleteDoc(a.fs.doc(a.db,"retosu",R.id+"_"+uid))).then(()=>{PART[R.id].l=PART[R.id].l.filter(x=>x.u!==uid);const u=usr();if(u&&u.uid===uid){const L=lo(R.id);L.pub=false;saveLoc();delete PUBJ[R.id]}toast("Quitado de la lista");pinta()},e=>toast("No se ha podido quitar: "+((e&&e.message)||e)));return}
  if(b=t.closest("[data-rtpe]")){const ls=b.querySelector(".ls");if(ls){ls.remove();return}const p=(PART[R.id].l.slice().sort((a,c)=>(c.n||0)-(a.n||0)||(a.t||0)-(c.t||0)))[+b.dataset.rtpe];if(!p)return;
    const nm=R.items.filter(x=>p.h&&p.h[x.id]).map(x=>x.n+(p.v&&p.v[x.id]?" ✔":""));b.insertAdjacentHTML("beforeend",`<div class="ls">${nm.length?esc(nm.join(" · ")):"Todavía nada."}</div>`);b.style.flexWrap="wrap";return}
  if(t.closest("[data-rtmapa]")){mapaReto(R.id);return}
  if(t.closest("[data-rtjoin]")){apuntar(R.id);return}
  if(t.closest("[data-rtsal]")){salir(R.id);return}
  if(t.closest("[data-rtnom]")){pideNombre(()=>{publicaTodos();pinta()});return}
  if(t.closest("[data-rtedit]")){editar(R.raw);return}
  if(t.closest("[data-rtpub]")){editar(R.raw);guardaEd("p");return}
  if(t.closest("[data-rtshare]")){const url=URLAPP+"#reto="+encodeURIComponent(R.id),text=`${R.e} ${R.n}\n¿Te apuntas al reto? Marca las cumbres que subas y gana medallas:`;
    (async()=>{try{if(navigator.share){await navigator.share({title:R.n,text,url});return}}catch(er){if(er&&er.name==="AbortError")return}
      try{await navigator.clipboard.writeText(text+"\n"+url);toast("Enlace copiado. Pégalo en WhatsApp.")}catch(er){window.open("https://wa.me/?text="+encodeURIComponent(text+"\n"+url),"_blank","noopener")}})();return}});
dlg.addEventListener("click",e=>{const t=e.target;let b;
  if(b=t.closest("[data-rtgo]")){cierraDlg();abrir(b.dataset.rtgo);return}
  if(t.closest("[data-rtnomok]")){const i=document.getElementById("rtnom"),v=(i&&i.value||"").trim().slice(0,30);if(v.length<2){toast("Pon un nombre (2 letras o más)");return}
    LOC._nom=v;saveLoc();for(const k in PUBJ)delete PUBJ[k];cierraDlg();const f=PIDE;PIDE=null;if(f)f();return}
  if(ITEM){const{R,it}=ITEM;
    if(t.closest("[data-rtck]")){marca(R,it);ficha(R,it);return}
    if(t.closest("[data-rtmap]")){verMapa(it);return}
    if(b=t.closest("[data-rtver]")){verFoto(+b.dataset.rtver);return}}
  if(ED){
    if(b=t.closest("[data-edadd]")){leeEd();const x=EDRES[+b.dataset.edadd];if(x){ED.it.push(Object.assign({id:slug(x.t+"-"+x.n)},x));pintaEd();const s=dlg.querySelector("[data-edbus]");if(s)s.focus()}return}
    if(b=t.closest("[data-edq]")){leeEd();ED.it.splice(+b.dataset.edq,1);pintaEd();return}
    if(t.closest("[data-ednv]")){leeEd();ED._nv={t:"c"};pintaEd();setTimeout(()=>{const f=dlg.querySelector(".rtnv input");if(f){f.scrollIntoView({block:"center"});f.focus()}},80);return}
    if(t.closest("[data-nvno]")){leeEd();delete ED._nv;pintaEd();return}
    if(t.closest("[data-nvmapa]")){tocarMapa();return}
    if(t.closest("[data-nvgps]")){leeEd();leeNv();if(!navigator.geolocation){toast("Este aparato no tiene GPS");return}toast("Buscando tu posición…");
      navigator.geolocation.getCurrentPosition(p=>{if(!ED||!ED._nv)return;ED._nv.lat=p.coords.latitude;ED._nv.lon=p.coords.longitude;pintaEd();toast("✓ Sitio puesto ("+Math.round(p.coords.accuracy)+" m de precisión)")},
        ()=>toast("No se ha podido saber dónde estás"),{enableHighAccuracy:true,timeout:30000,maximumAge:0});return}
    if(t.closest("[data-nvok]")){leeEd();leeNv();const v=ED._nv,n=(v.n||"").trim();if(n.length<2){toast("Ponle un nombre");return}if(v.lat==null){toast("Falta dónde está: tócalo en el mapa o pega las coordenadas");return}
      const a=parseInt(String(v.a||"").replace(/\D/g,""),10),t2=v.t==="l"?"l":"c",id="n-"+slug(t2+"-"+n);
      if(ED.it.some(x=>x.id===id)){toast("Ya hay una con ese nombre en el reto");return}
      ED.it.push({id,n,t:t2,lat:+v.lat,lon:+v.lon,a:a>0&&a<9000?a:null,k:t2+":"+norm(n)+"@r",co:"",s:(t2==="c"?"Cumbre nueva":"Lugar nuevo")+" · solo en este reto",nv:1});
      delete ED._nv;pintaEd();toast("✓ Añadida al reto (no olvides 💾 Guardar)");return}
    if(b=t.closest("[data-edok]")){guardaEd(b.dataset.edok);return}
    if(t.closest("[data-edborra]")){borraEd();return}}});
dlg.addEventListener("input",e=>{if(e.target.matches("[data-edbus]"))buscaEd(e.target.value)});
dlg.addEventListener("change",e=>{if(!e.target.matches("[data-nvpega]")||!ED||!ED._nv)return;const tx=e.target.value.trim();if(!tx)return;
  const p=window.ENLACES&&ENLACES.punto?ENLACES.punto(tx):(m=>m?[+m[1],+m[2]]:null)(/(-?\d{1,2}\.\d+)\s*[,;]\s*(-?\d{1,3}\.\d+)/.exec(tx));
  if(!p||!enSitio(p[0],p[1])){toast(/goo\.gl|omaps\.app|ge0\.me/.test(tx)?"No puedo leer ese enlace corto. En Google Maps, mantén pulsado el punto y copia las coordenadas (43.1234, -5.6789).":"No entiendo esas coordenadas. Ejemplo: 43.1234, -5.6789");return}
  leeEd();leeNv();ED._nv.lat=p[0];ED._nv.lon=p[1];pintaEd();toast("✓ Sitio puesto")});
dlg.addEventListener("change",e=>{if(e.target.matches("[data-rtfoto]")){subeFoto(e.target.files&&e.target.files[0]);return}
  if(e.target.matches("[data-edtipo]")){leeEd();ED._fe=e.target.value==="fechas";if(!ED._fe){ED.ini="";ED.fin=""}pintaEd()}});
// el editor deja de contar como abierto al cerrar
new MutationObserver(()=>{if(ov.hidden&&!PICK)ED=null}).observe(ov,{attributes:true,attributeFilter:["hidden"]});

/* ---------- abrir ---------- */
function abrir(id){if(typeof showView==="function")showView("retos");if(id){CUR=id;SUB="cum";FIL="todas";cargaPart(id)}pinta();cargaRetos();sec.scrollTop=0}
/* ---------- 🗺 el reto en el mapa: solo sus cumbres (✓ hechas en verde, pendientes en blanco y rojo); las demás capas se apagan y vuelven al salir ---------- */
let RMAP=null,RMSAV=null,RMLAY=null,RMFIL="todas";
const setLay=(k,v)=>{const b=document.querySelector(`.laypanel [data-lay="${k}"]`);if(b&&(b.getAttribute("aria-pressed")==="true")!==v)b.click()};
const NOTOCAR=["relief","towns","off","sendero"];
function mapaReto(id){const R=reto(id);if(!R||typeof map==="undefined")return;
  if(!RMSAV){RMSAV={};document.querySelectorAll(".laypanel [data-lay]").forEach(b=>{RMSAV[b.dataset.lay]=b.getAttribute("aria-pressed")==="true"})}
  RMAP=id;RMFIL="todas";showView("mapa");
  for(const k in RMSAV)if(!NOTOCAR.includes(k))setLay(k,false);
  dibujaMapa(true)}
function dibujaMapa(encuadra){const R=reto(RMAP);if(!R){mapaOff();return}
  if(RMLAY)RMLAY.remove();const ok=R.items.filter(it=>hecho(R,it)),pe=R.items.filter(it=>!hecho(R,it));
  const vis=RMFIL==="hechas"?ok:RMFIL==="pend"?pe:R.items;
  RMLAY=L.layerGroup(vis.map(it=>{const h=hecho(R,it);
    return L.marker([it.lat,it.lon],{zIndexOffset:h?1100:1000,icon:L.divIcon({className:"",iconSize:[0,0],html:`<div class="rtmk ${h?"ok":"pe"}">${h?"✓":"▲"}</div>`})})
      .bindTooltip(esc(it.n),{permanent:true,direction:"bottom",offset:[0,14],className:"rtlbl"+(h?" ok":"")})
      .on("click",ev=>{L.DomEvent.stopPropagation(ev);ficha(R,it)})})).addTo(map);
  let ban=document.getElementById("rtban");if(!ban){ban=document.createElement("div");ban.id="rtban";document.getElementById("map").parentElement.appendChild(ban);
    ban.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.rmoff!=null){const id=RMAP;mapaOff();abrir(id);return}if(b.dataset.rmf){RMFIL=b.dataset.rmf;dibujaMapa()}})}
  const n=prog(R);
  ban.innerHTML=`<div class="t"><span>${esc(R.e)} ${esc(R.n)} · ${n} de ${R.tot}</span><button data-rmoff>✕ Salir</button></div>
    <div class="f">${[["todas","Todas · "+R.items.length],["hechas","✓ Hechas · "+ok.length],["pend","▲ Me faltan · "+pe.length]].map(([k,t])=>`<button data-rmf="${k}" aria-pressed="${RMFIL===k}">${t}</button>`).join("")}</div>`;ban.hidden=false;
  etiquetas();
  if(encuadra&&vis.length)setTimeout(()=>{map.invalidateSize();map.fitBounds(L.latLngBounds(vis.map(it=>[it.lat,it.lon])),{paddingTopLeft:[20,190],paddingBottomRight:[20,90],maxZoom:13})},150)}
function etiquetas(){const c=document.getElementById("map");if(c)c.classList.toggle("map-sinlbl",map.getZoom()<11)}
if(typeof map!=="undefined")map.on("zoomend",()=>{if(RMAP)etiquetas()});
function mapaOff(){if(RMLAY){RMLAY.remove();RMLAY=null}if(RMSAV){for(const k in RMSAV)if(!NOTOCAR.includes(k))setLay(k,RMSAV[k]);RMSAV=null}RMAP=null;
  const ban=document.getElementById("rtban");if(ban)ban.hidden=true;const c=document.getElementById("map");if(c)c.classList.remove("map-sinlbl");if(window.refreshMarks)refreshMarks()}
// al irse del mapa (otra pestaña), las capas vuelven a como estaban
setTimeout(()=>{const sv=window.showView;if(typeof sv==="function")window.showView=showView=function(v){if(v!=="mapa"&&RMAP)mapaOff();return sv.apply(this,arguments)}},0);
/* ---------- en Explorar › Cumbres y Lugares: etiqueta «🏆 Techos de Asturias» en las que están en algún reto (al tocar, abre el reto) ---------- */
let TGI=null,TGS="",TGT=0;
// 24 nov 2026: Explorar › Cumbres llamaba a esto una vez por fila (más de 600) y cada vez rehacía todos los retos (Montes Cimeros: ~8 ms) → 5 s parado.
// Ahora el índice vale 5 s: lo que se pinta de golpe usa el mismo.
function indice(){if(TGI&&performance.now()-TGT<5000)return TGI;TGT=performance.now();const v=todos(),sig=v.map(R=>R.id+":"+R.items.length).join("|")+"|"+(window.COLX&&COLX.todo?COLX.todo().length:0);if(TGI&&sig===TGS)return TGI;
  TGS=sig;TGI=new Map();for(const R of v){if(estado(R).k==="fi"||R.activo===false||!R.items.length)continue;for(const it of R.items)for(const k of it.keys){const a=TGI.get(k)||[];if(!a.includes(R))a.push(R);TGI.set(k,a)}}return TGI}
window.RETOTAG=function(p,kind){try{const k=(kind==="cumbres"?"c:":"l:")+norm(p.c)+(p.co?"@"+p.co.id:""),a=indice().get(k);if(!a||!a.length)return"";
  return a.map(R=>`<button class="rttag" data-rtag="${esc(R.id)}">🏆 ${esc(R.n)}</button>`).join("")}catch(e){return""}};
// 24 nov 2026: retos en los que está, con id y si ya estás apuntado (ficha de la cumbre), y botón «🙋 Apuntarme» de la ficha
window.RETOSDE2=function(p,kind){try{const k=(kind==="cumbres"?"c:":"l:")+norm(p.c)+(p.co?"@"+p.co.id:""),a=indice().get(k),u=usr();
  return a?a.map(R=>{const L=LOC[R.id];return{id:R.id,n:R.n,ap:!!(u&&L&&L.pub&&(L.pub===true||L.pub===u.uid))}}):[]}catch(e){return[]}};
document.addEventListener("click",e=>{const b=e.target.closest("[data-rtap]");if(!b)return;e.stopPropagation();e.preventDefault();apuntar(b.dataset.rtap)},true);
// 24 nov 2026: los nombres de los retos en los que está (para el buscador del mapa)
window.RETOSDE=function(p,kind){try{const k=(kind==="cumbres"?"c:":"l:")+norm(p.c)+(p.co?"@"+p.co.id:""),a=indice().get(k);return a?a.map(R=>R.n):[]}catch(e){return[]}};
document.addEventListener("click",e=>{const b=e.target.closest("[data-rtag]");if(!b)return;e.stopPropagation();e.preventDefault();abrir(b.dataset.rtag)},true);
window.RETOS={abrir,pinta};
// cada vez que se enseña la pestaña, se repinta y se miran retos nuevos
new MutationObserver(()=>{if(!sec.hidden){miEditor();pinta();cargaRetos();if(CUR)cargaPart(CUR)}}).observe(sec,{attributes:true,attributeFilter:["hidden"]});
function deEnlace(){const h=location.hash||"";if(h==="#retos"||h.startsWith("#reto=")){const id=h.startsWith("#reto=")?decodeURIComponent(h.slice(6)):null;
  try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}setTimeout(()=>abrir(id),300)}}
addEventListener("hashchange",deEnlace);setTimeout(deEnlace,500);
// al arrancar: las medallas que ya tenías no se celebran; cuando llegan los datos de los colaboradores (techos), se revisa
{let n=0;const t=setInterval(()=>{const T=deTecho();if(T||++n>120){clearInterval(t);for(const R of todos())revisa(R,false);if(usr())publicaTodos();if(!sec.hidden)pinta()}},500)}
if(store.get("ldc-sesion","0")==="1")setTimeout(cargaRetos,4000);
pinta();
})();
