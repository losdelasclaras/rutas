/* ---------- ⚠️ Seguridad: condiciones de uso + aviso en rutas difíciles (18 nov 2026) ----------
   Pedido por Jonathan: «la gente es muy inconsciente y no va a leer el blog».
   1) CONDICIONES DE USO: salen una vez (después de la bienvenida) y hay que tocar «Acepto». Se recuerda en localStorage
      «ldc-cond» con la versión (VER): si se cambia el texto, sube VER y vuelven a salir. Siempre a mano en la ayuda
      («Seguridad y condiciones de uso») → CONDICIONES.abre().  BORRADOR: Jonathan lo comenta con los colaboradores y
      conviene que lo revise alguien que sepa de leyes (abogado o la FEMPA).
   2) RUTAS DIFÍCILES: en la ficha de una ruta Alta o Muy alta (tuya o de colaborador; también MIDE 4-5, «Difícil»,
      «Muy difícil») sale un recuadro rojo, y antes de ▶ Seguir, ⬇ Descargar GPX, ⌚ Enviar al reloj o 〰️ Guardar track,
      un cuadro que obliga a decir «Entiendo el riesgo» (una vez por ruta y sesión), con botón para leer el blog.
   Para quitarlo: borrar 'seguridad' de _mods en pwa/build_pwa.py. */
(function(){
const VER="1",KEY="ldc-cond";
const sh=document.getElementById("sheet");
const es=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nn=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();

document.head.insertAdjacentHTML("beforeend",`<style>
.sgbg{position:fixed;inset:0;background:rgba(20,26,23,.6);z-index:4100;display:flex;align-items:center;justify-content:center;padding:12px}
.sgbg[hidden]{display:none}
.sgdl{width:min(560px,100%);max-height:92vh;overflow:auto;background:var(--card,#fff);color:var(--ink);border-radius:18px;padding:18px 18px 16px;box-shadow:0 10px 40px rgba(0,0,0,.35);font-size:16.5px;line-height:1.45}
.sgdl h2{margin:0 0 10px;font-size:23px;line-height:1.2}
.sgdl ul{margin:6px 0 10px;padding-left:20px}.sgdl li{margin:5px 0}
.sgdl details{margin:6px 0 12px;border:1.5px solid var(--edge,#ddd);border-radius:12px;padding:8px 12px}
.sgdl details summary{cursor:pointer;font-weight:800;min-height:36px;display:flex;align-items:center}
.sgdl details h3{font-size:16px;margin:12px 0 4px}.sgdl details p{margin:4px 0;font-size:15px}
.sgdl .sgb{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.sgdl .sgb button,.sgdl .sgb a{display:flex;align-items:center;justify-content:center;min-height:54px;font-size:17px;font-weight:800;border-radius:12px;border:0;cursor:pointer;text-decoration:none;text-align:center;padding:0 12px}
.sgdl .sgok{background:#1e8e3e;color:#fff}.sgdl .sgrisk{background:#c3262e;color:#fff}.sgdl .sgblog{background:#1f6fd1;color:#fff}.sgdl .sgno{background:var(--paper,#f1f1f1);color:var(--ink)}
.sgdl .sg112{font-weight:800}
.sgdl .sgnivel{display:table;width:auto;height:auto;font-size:15px;line-height:1.3;font-weight:800;border-radius:20px;padding:3px 12px;margin:0 0 10px;color:#fff;background:#c3262e}.sgdl .sgnivel.x{background:#222}
.frdifav{border-radius:14px;padding:10px 12px;margin:10px 0 4px;font-size:15.5px;line-height:1.4;border:2px solid #c3262e;background:#fdecec;color:#6d1016}
.frdifav.x{border-color:#222;background:#2b2b2b;color:#fff}
.frdifav b{display:block;font-size:16.5px;margin-bottom:3px}
</style>`);

/* ---------- nivel de dificultad a partir del texto de la ficha ---------- */
// "a" = alta, "x" = muy alta, "" = no es difícil (o no se sabe)
function nivel(s){s=String(s||"");const m=/MIDE\s*\d\s*-\s*\d\s*-\s*\d\s*-\s*(\d)/i.exec(s);if(m){const e=+m[1];return e>=5?"x":e===4?"a":""}
  const n=nn(s);if(/muy (alta|dificil)|extrem/.test(n))return"x";if(/^alta|dificil|^d\b|exigente/.test(n))return"a";return""}
const TXT={
  a:{t:"🔴 Dificultad alta",p:"Ruta exigente: hace falta buena forma física y experiencia en montaña, y puede tener pasos delicados. Lee el reportaje completo del blog antes de ir."},
  x:{t:"⚫ Dificultad muy alta",p:"Solo para montañeros con experiencia: puede tener trepadas, pasos expuestos o aéreos y orientación difícil. No es una ruta para empezar. Lee el reportaje completo del blog y valora tu preparación, el equipo y la meteo."}};
window.SEGURIDAD={nivel,TXT};

/* ---------- 2a) recuadro en la ficha ---------- */
function ponRecuadro(){if(!sh||sh.hidden)return;const f=sh.querySelector(".fru");if(!f||f.querySelector(".frdifav"))return;
  let dif="";f.querySelectorAll(".ficha > div").forEach(d=>{const sp=d.querySelector("span");if(sp&&/dificultad/i.test(sp.textContent))dif=(d.querySelector("b")||{}).textContent||""});
  const n=nivel(dif);f.dataset.sgniv=n;if(!n)return;
  const ref=f.querySelector(".frav")||f.querySelector(".frdib")||f.querySelector(".ficha");if(!ref)return;
  ref.insertAdjacentHTML("afterend",`<div class="frdifav ${n}" role="note"><b>${TXT[n].t}</b>${TXT[n].p}</div>`)}
if(sh)new MutationObserver(()=>{if(sh.querySelector(".fru")&&!sh.querySelector(".frdifav"))ponRecuadro()}).observe(sh,{childList:true,subtree:true});

/* ---------- 2b) cuadro antes de seguir / descargar ---------- */
const OK=new Set();   // rutas ya avisadas en esta sesión (por título)
const SEL="[data-follow],[data-cofol],[data-reloj],[data-gpx],[data-cogpx],[data-frgt],[data-cogt],.frseg";
let bg=null;
function dlg(html){if(!bg){bg=document.createElement("div");bg.className="sgbg";bg.hidden=true;document.body.appendChild(bg);
    bg.addEventListener("click",e=>{if(bg.querySelector("[data-sgacepto]"))return;if(e.target===bg||e.target.closest("[data-sgno]"))cierra()})}
  bg.innerHTML=`<div class="sgdl" role="dialog" aria-modal="true">${html}</div>`;bg.hidden=false;document.documentElement.classList.add("sgon")}
function cierra(){if(bg)bg.hidden=true;document.documentElement.classList.remove("sgon")}
// en la ventana y en captura: así va antes que Seguir (que escucha en el documento); el visor del blog (visita.js) va antes que esto
addEventListener("click",e=>{const b=e.target.closest&&e.target.closest(SEL);if(!b||!sh||!sh.contains(b))return;
  const f=sh.querySelector(".fru");if(!f)return;if(f.dataset.sgniv==null)ponRecuadro();const n=f.dataset.sgniv;if(!n)return;
  const tit=(f.querySelector(".sheet-head h2")||{}).textContent||"";if(OK.has(tit))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const blog=f.querySelector(".fracts a.btn.primary");
  dlg(`<div class="sgnivel ${n}">${TXT[n].t}</div><h2>⚠️ Antes de ir a esta ruta</h2><p>${TXT[n].p}</p>
    <ul><li>Un track es solo una línea: <b>no te dice si hay pasos peligrosos</b>, nieve o el camino cortado.</li>
    <li>Mira la meteo, dile a alguien adónde vas y lleva el móvil cargado.</li>
    <li>Si no lo ves claro, <b>date la vuelta</b>. El monte sigue ahí otro día.</li></ul>
    <div class="sgb">${blog?`<a class="sgblog" href="${es(blog.href)}" target="_blank" rel="noopener">📖 Leer antes el reportaje del blog</a>`:""}
    <button class="sgrisk" data-sgsi>Entiendo el riesgo, seguir</button><button class="sgno" data-sgno>Cancelar</button></div>`);
  bg.querySelector("[data-sgsi]").onclick=()=>{OK.add(tit);cierra();setTimeout(()=>b.click(),50)}},true);

/* ---------- 1) condiciones de uso ---------- */
const CUERPO=`
<h3>Qué es esta app</h3>
<p>Una forma de encontrar las rutas que cuentan varios blogs de montaña hechos por aficionados (Los de las Claras y los blogs colaboradores). No es una guía profesional ni un servicio de guías.</p>
<h3>La información es orientativa</h3>
<p>Cada ruta cuenta cómo estaba el monte el día que se hizo. Desde entonces pueden haber cambiado los caminos, las señales, los pasos o los permisos (argayos, nieve, vegetación, cierres…). Los tracks y los datos (distancia, desnivel, dificultad, horarios) pueden tener errores. La dificultad es la valoración de quien hizo la ruta y no tiene por qué coincidir con la tuya.</p>
<h3>Tú decides y tú eres responsable</h3>
<p>Antes de salir, lee el reportaje completo del blog, infórmate del estado actual de la ruta y de la meteo, y valora con sinceridad tu forma física, tu experiencia y tu equipo. La montaña tiene riesgos que no desaparecen por llevar un track en el móvil. Cada persona es responsable de sus decisiones y de su seguridad, y de la de quienes van a su cargo.</p>
<h3>Sin garantías</h3>
<p>La app y los blogs se ofrecen gratis y tal cual, sin garantía de que la información sea exacta, completa o actual, ni de que la app funcione siempre (cobertura, batería, GPS, errores). No dependas solo de ella: lleva mapa, sabe orientarte y ten un plan para volver.</p>
<h3>Responsabilidad</h3>
<p>Quienes hacen esta app y los blogs colaboradores no se hacen responsables de los accidentes, daños, pérdidas o problemas que puedan sufrirse al hacer las rutas o al usar la información de la app, en la medida en que lo permita la ley.</p>
<h3>Salidas de grupos de montaña</h3>
<p>Las salidas las organiza cada club, que es quien responde de ellas. La app solo las anuncia.</p>
<h3>Emergencias</h3>
<p class="sg112">En caso de emergencia, llama al 112.</p>
<h3>Privacidad</h3>
<p>Qué datos guarda la app lo tienes en la <a href="privacidad.html" target="_blank" rel="noopener">página de privacidad</a>.</p>`;
const visto=()=>{try{return localStorage.getItem(KEY)===VER}catch(_){return true}};
function abre(obligado){
  dlg(`<h2>⛰️ Antes de empezar</h2>
    <p>Esta app junta rutas de varios blogs de montaña <b>hechos por aficionados</b>. Úsala con cabeza:</p>
    <ul><li><b>La información es orientativa</b>: el monte cambia y los tracks pueden tener errores.</li>
    <li><b>Lee el blog</b> antes de ir: un track no te avisa de los pasos peligrosos.</li>
    <li><b>Tú decides y tú eres responsable</b> de tu seguridad: forma física, experiencia, equipo y meteo.</li>
    <li>Ni la app ni los blogs se hacen responsables de lo que pase en la montaña.</li>
    <li class="sg112">En una emergencia, llama al 112 (o usa el botón SOS).</li></ul>
    <details><summary>📜 Leer las condiciones de uso completas</summary>${CUERPO}</details>
    <div class="sgb">${obligado?`<button class="sgok" data-sgacepto>Acepto</button>`:`<button class="sgno" data-sgno>Cerrar</button>`}</div>`);
  const a=bg.querySelector("[data-sgacepto]");if(a)a.onclick=()=>{try{localStorage.setItem(KEY,VER)}catch(_){}cierra()};
}
window.CONDICIONES={abre:()=>abre(false)};
// la primera vez: cuando no esté la bienvenida delante
function intenta(n){if(visto())return;const h=document.documentElement;
  if(h.classList.contains("bienvon")||document.querySelector(".cdbg:not([hidden])")||(bg&&!bg.hidden)){if(n<400)setTimeout(()=>intenta(n+1),1500);return}
  abre(true)}   // no se cierra tocando fuera: solo con «Acepto»
setTimeout(()=>intenta(0),2500);
})();
