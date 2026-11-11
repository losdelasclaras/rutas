/* 11 nov 2026 · Contador anónimo de uso.
   Cada móvil o navegador apunta, como mucho una vez al día, que ha abierto la app y de qué forma (APK, instalada,
   navegador; iPhone aparte). No guarda nada de la persona: solo suma 1 en el día, la semana y el mes (colección «uso»).
   Para saber si es la primera vez del día/semana/mes, el móvil guarda las fechas en localStorage («ldc-uso»).
   Usa la API REST de Firestore (sin cargar Firebase al arrancar). Las cuentas de administrador no cuentan.
   El resumen lo ve solo el administrador, en «Tu cuenta» › «📊 Uso de la app». */
(()=>{
const ADM=["losdelasclaras@gmail.com","jcrespopazos@gmail.com"];
const K="ldc-uso",PID="losdelasclaras-rutas",KEY="AIzaSyBzYlxsZhJVPJpCk0_EgxaplD7zWMOOg1I";
const lee=()=>{try{return JSON.parse(localStorage.getItem(K)||"{}")}catch(e){return{}}};
const pon=o=>{try{localStorage.setItem(K,JSON.stringify(o))}catch(e){}};
// fecha de España (sin depender de la hora del móvil fuera de España)
const hoyES=()=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Madrid"}).format(new Date());
function semana(ds){const d=new Date(ds+"T12:00:00Z");const w=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-w);
  const y=d.getUTCFullYear();return y+"-S"+String(Math.ceil(((d-Date.UTC(y,0,1))/864e5+1)/7)).padStart(2,"0")}
function tipo(){let apk=false;try{apk=document.referrer.startsWith("android-app://es.losdelasclaras.rutas")||sessionStorage.getItem("ldc-apk")==="1"}catch(e){}
  if(apk)return"a";const inst=(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;return inst?"i":"w"}
const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);

function cuenta(){
  if(location.hostname!=="losdelasclaras.github.io")return;   // pruebas en otro sitio: no cuentan
  if(/HeadlessChrome|bot|crawl|spider|Lighthouse/i.test(navigator.userAgent))return;
  const o=lee();if(o.yo)return;   // el administrador
  const d=hoyES();if(o.d===d)return;
  const s=semana(d),m=d.slice(0,7),t=tipo();
  const docs=[["d-"+d,["n",t].concat(ios?["ip"]:[]).concat(o.d?[]:["nv"])]];
  if(o.s!==s)docs.push(["s-"+s,["n",t].concat(ios?["ip"]:[])]);
  if(o.m!==m)docs.push(["m-"+m,["n",t].concat(ios?["ip"]:[])]);
  const base=`projects/${PID}/databases/(default)/documents/uso/`;
  const writes=docs.map(([id,cs])=>({update:{name:base+id,fields:{}},updateMask:{fieldPaths:[]},
    updateTransforms:cs.map(c=>({fieldPath:c,increment:{integerValue:"1"}}))}));
  fetch(`https://firestore.googleapis.com/v1/projects/${PID}/databases/(default)/documents:commit?key=${KEY}`,
    {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({writes}),keepalive:true})
    .then(r=>{if(r.ok){o.d=d;o.s=s;o.m=m;pon(o)}else console.warn("uso",r.status)}).catch(()=>{});
}
setTimeout(cuenta,4000);

// --- administrador: no cuenta y ve el resumen
const esAdm=()=>{const u=window.LDCFB&&LDCFB.user&&LDCFB.user();return!!(u&&u.email&&ADM.includes(u.email.toLowerCase()))};
setInterval(()=>{if(esAdm()){const o=lee();if(!o.yo){o.yo=1;pon(o)}}},5000);

function engancha(){const sh=document.querySelector(".accdlg");if(!sh){setTimeout(engancha,1000);return}
  new MutationObserver(()=>{if(!esAdm()||sh.querySelector("[data-uso]")||!sh.querySelector(".sheet-head"))return;
    sh.insertAdjacentHTML("beforeend",`<p class="note" style="margin-top:14px"><button class="mpb" data-uso>📊 Uso de la app</button><br><small>Solo lo ves tú. Personas = móviles o navegadores distintos (aproximado).</small></p><div data-usoc></div>`)}).observe(sh,{childList:true,subtree:true})}
engancha();

const INI="2026-11-11";   // desde cuándo se cuenta
const NOM={a:"APK",i:"Instalada",w:"Navegador",ip:"iPhone"};
const MES=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
function fila(et,x,max){const n=x.n||0,w=max?Math.round(n/max*100):0;
  const det=["a","i","w","ip"].map(k=>x[k]?NOM[k]+" "+x[k]:"").filter(Boolean).concat(x.nv?["nuevas "+x.nv]:[]).join(" · ");
  return`<div style="padding:5px 0;border-bottom:1px solid var(--line,rgba(127,127,127,.2))"><div style="display:flex;align-items:center;gap:8px"><span style="width:86px;flex:none">${et}</span><span style="flex:1;min-width:0"><span style="display:block;background:#2e7d32;height:12px;border-radius:3px;width:${Math.max(w,n?3:0)}%"></span></span><b style="width:34px;text-align:right;flex:none">${n}</b></div>${det?`<div style="font-size:12px;opacity:.75;margin-left:94px">${det}</div>`:""}</div>`}
function tabla(tit,rows){const max=Math.max(1,...rows.map(r=>r[1].n||0));
  return`<h4 style="margin:14px 0 4px">${tit}</h4>${rows.map(r=>fila(r[0],r[1],max)).join("")||`<p class="note">Sin datos todavía</p>`}`}
async function resumen(box){box.innerHTML=`<p class="note">Cargando…</p>`;
  try{const A=await LDCFB.load(),F=A.fs;const q=await F.getDocs(F.collection(A.db,"uso"));const D={};
    q.forEach(d=>{D[d.id]=d.data()});
    const hoy=hoyES(),dias=[];for(let i=13;i>=0;i--){const t=new Date(hoy+"T12:00:00Z");t.setUTCDate(t.getUTCDate()-i);const k=t.toISOString().slice(0,10);if(k>=INI)dias.push(k)}
    const sem=[];for(let i=7;i>=0;i--){const t=new Date(hoy+"T12:00:00Z");t.setUTCDate(t.getUTCDate()-7*i);const k=semana(t.toISOString().slice(0,10));if(k>=semana(INI))sem.push(k)}
    const mes=Object.keys(D).filter(k=>k.startsWith("m-")).map(k=>k.slice(2)).sort().slice(-6);
    const tot=Object.keys(D).filter(k=>k.startsWith("d-")).reduce((a,k)=>a+(D[k].nv||0),0);
    const dd=s=>{const[y,m,d]=s.split("-");return`${+d} ${MES[m-1]}`};
    box.innerHTML=`<p style="margin:10px 0 0;font-size:15px">👥 <b>${tot}</b> móviles o navegadores distintos desde que se cuenta (11 nov 2026)</p>`+
      tabla("Últimos 14 días",dias.reverse().map(k=>[dd(k),D["d-"+k]||{}]))+
      tabla("Por semanas",sem.reverse().map((k,i)=>[i===0?"Esta semana":i===1?"La pasada":"Sem. "+k.split("-S")[1],D["s-"+k]||{}]))+
      tabla("Por meses",mes.reverse().map(k=>[MES[+k.slice(5)-1]+" "+k.slice(0,4),D["m-"+k]||{}]))+
      `<p class="note" style="font-size:12px;margin-top:10px">Cada persona cuenta una vez al día, una vez a la semana y una vez al mes, abra la app las veces que la abra. Tus cuentas de administrador no cuentan.</p>`}
  catch(e){box.innerHTML=`<p class="note">No se ha podido leer (${(e&&e.code)||e}). ¿Están puestas las reglas de «uso» en Firebase?</p>`}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-uso]");if(!b)return;const box=document.querySelector("[data-usoc]");if(!box)return;
  if(box.innerHTML){box.innerHTML="";return}resumen(box)});
})();
