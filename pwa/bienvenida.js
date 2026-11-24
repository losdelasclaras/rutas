/* ---------- 👋 Bienvenida (18 nov 2026) ----------
   7 pantallas que salen UNA vez a cada persona (también a quien ya usaba la app: lo pidió Jonathan para probarla).
   Se recuerda en localStorage «ldc-bienv». «Saltar» en todas, «Siguiente» / «Empezar», puntos, deslizar con el dedo
   y flechas del teclado. «Atrás» del móvil = saltar (clase cdbg + data-close, lo recoge atras.js).
   Mientras está abierta se esconde el cuadro de «Instalar» (.instbg); al cerrarla vuelve a verse.
   El logo lo coge del panel de ayuda (.ayulogo img): este módulo va DESPUÉS de 'ayuda' en _mods.
   Desde la ayuda: «Ver otra vez la bienvenida» → BIENVENIDA.abre().
   Textos acordados con Jonathan (doc del proyecto «bienvenida-ayuda»).
   Para quitarlo: borrar 'bienvenida' de _mods en build_pwa.py. */
(function(){
const KEY="ldc-bienv";
const visto=()=>{try{return !!localStorage.getItem(KEY)}catch(e){return true}};
const marca=()=>{try{localStorage.setItem(KEY,new Date().toISOString())}catch(e){}};
const logo=()=>{const i=document.querySelector(".ayulogo img");return i?i.src:""};

const P=[
 {logo:1,t:"Varios blogs de montaña en un solo mapa",s:"Gente que sale al monte y lo cuenta.",
  ch:["Al filo de lo improbable","Caleyando con Cienfuegos","Camudando'l camín","Gata con Botas","Los de las Claras","Rutinas Varias"],
  l:[["🥾","Más de 2.000 rutas, 1.000 cumbres y 500 lugares"],["🔄","Siempre al día: lo nuevo de los 6 blogs llega solo, cada noche"]]},
 {i:"📖",t:"Antes de salir, lee la ruta",s:"Un track es solo una línea. El reportaje del blog te cuenta el monte.",
  l:[["📷","Fotos y por dónde va el camino"],["⚠️","Dificultad, pasos delicados, terreno"],["📈","Km, desnivel y perfil"],["⬇️","Y el track, gratis"]]},
 {i:"🔎",t:"Busca por donde quieras",
  l:[["🏘️","Escribe un pueblo y mira qué rutas hay cerca"],["📍","O las que tienes cerca de ti"],["🏔️","Cumbres, lugares, lagos, escuelas de escalada…"],["⭐","Las cumbres que destaca cada blog, con estrella en el mapa"],["⚙️","Filtra por zona, dificultad, invierno o con track"]]},
 {i:"⏺️",t:"Graba y sigue tus rutas",
  l:[["📱","Graba con la pantalla apagada y sin cobertura (app Android)"],["▶️","Sigue un track, o dos a la vez"],["🆘","SOS con tu posición para el 112"]]},
 {i:"🎒",t:"Llévalo todo sin cobertura",s:"Lo que guardas en Mis cosas funciona sin datos y sin cobertura.",
  l:[["🧵","Tracks de la app o tuyos (GPX o KML)"],["📍","Tus puntos y tus cumbres marcadas"],["🗺️","Descarga el mapa de la zona de tu ruta"],["🧭","Elige mapa: topográfico, IGN o foto aérea"]]},
 {i:"🏆",t:"Retos",s:"Marca las cumbres que subes y mira quién más las ha hecho.",
  l:[["🚩","Empieza con los Techos de Asturias: el pico más alto de cada uno de los 78 concejos"],["🏅","Medallas a medida que avanzas"],["✨","Iremos añadiendo retos nuevos"]]},
 {i:"👥",t:"Sal con un grupo de montaña",s:"Grupos de montaña de Asturias publican aquí sus próximas salidas.",
  l:[["🥾","Fecha, recorrido y track"],["🙋","Cómo apuntarte"],["🔄","Siempre al día: lo que publica cada club aparece aquí solo"],["💚","Todo gratis y sin registrarte"]],nt:"Dudas: botón ? de arriba"}
];
const N=P.length;

document.head.insertAdjacentHTML("beforeend",`<style>
html.bienvon .instbg{display:none!important}
.bvbg{position:fixed;inset:0;z-index:7000;background:#efe9e2;display:flex;align-items:center;justify-content:center}
.bvbg[hidden]{display:none}
.bvp{position:relative;background:#fff;color:#1d1d1d;width:100%;height:100%;max-width:520px;max-height:900px;display:flex;flex-direction:column;overflow:hidden;box-sizing:border-box}
@media(min-width:560px) and (min-height:700px){.bvp{height:92dvh;border-radius:28px;box-shadow:0 8px 30px rgba(0,0,0,.25)}}
.bvtop{flex:none;display:flex;justify-content:space-between;align-items:center;padding:14px 18px 4px;font-size:18px;color:#777}
.bvsk{all:unset;cursor:pointer;font-size:19px;font-weight:700;color:#555;padding:8px 6px}
.bvwin{flex:1;min-height:0;overflow:hidden;touch-action:pan-y}
.bvtr{display:flex;height:100%;transition:transform .3s ease}
.bvsl{flex:0 0 100%;height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 24px 10px;box-sizing:border-box;display:flex;flex-direction:column}
.bvsl>.in{margin:auto 0;padding:6px 0}
.bvic{width:96px;height:96px;border-radius:50%;background:#fbe4e4;display:flex;align-items:center;justify-content:center;margin:4px auto 16px;font-size:50px}
.bvlogo{display:block;width:128px;height:128px;border-radius:26px;margin:0 auto 14px;box-shadow:0 2px 10px rgba(0,0,0,.2)}
@media(max-height:820px){.bvlogo{width:84px;height:84px;border-radius:18px;margin-bottom:8px}.bvch{margin-bottom:12px;gap:6px}.bvch span{font-size:15px;padding:5px 9px}.bvt{margin-bottom:8px}}
.bvt{font-size:27px;font-weight:800;text-align:center;line-height:1.25;margin:0 0 12px}
.bvs{font-size:19px;text-align:center;color:#555;line-height:1.45;margin:0 0 16px}
.bvch{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin:0 0 16px}
.bvch span{font-size:16.5px;padding:7px 11px;border-radius:10px;background:#f4f1ec;border:1px solid #ddd}
.bvl{font-size:20px;line-height:1.4;margin:0 0 13px;display:flex;gap:12px}
.bvl b{font-weight:normal;font-size:24px;flex:none;width:32px;text-align:center}
.bvbot{flex:none;padding:8px 22px calc(18px + env(safe-area-inset-bottom))}
.bvdt{display:flex;justify-content:center;gap:9px;margin:0 0 14px}
.bvdt span{width:12px;height:12px;border-radius:50%;background:#d6d0c8;cursor:pointer}
.bvdt span.on{background:#a32d2d}
.bvgo{display:block;width:100%;border:0;border-radius:16px;background:#a32d2d;color:#fff;font:inherit;font-size:24px;font-weight:800;padding:17px;cursor:pointer}
.bvnt{font-size:16px;color:#777;text-align:center;margin-top:10px;min-height:1.2em}
</style>`);

const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const bg=document.createElement("div");bg.className="cdbg bvbg";bg.hidden=true;
bg.innerHTML=`<div class="bvp" role="dialog" aria-modal="true" aria-label="Bienvenida">
<div class="bvtop"><span class="bvn"></span><button class="bvsk" data-close>Saltar</button></div>
<div class="bvwin"><div class="bvtr"></div></div>
<div class="bvbot"><div class="bvdt">${P.map((_,i)=>`<span data-p="${i}"></span>`).join("")}</div><button class="bvgo"></button><div class="bvnt"></div></div></div>`;
document.body.appendChild(bg);
const tr=bg.querySelector(".bvtr"),go=bg.querySelector(".bvgo"),nn=bg.querySelector(".bvn"),nt=bg.querySelector(".bvnt");
let cur=0;
function pinta(){const lg=logo();
 tr.innerHTML=P.map(p=>`<div class="bvsl"><div class="in">${p.logo&&lg?`<img class="bvlogo" alt="Andariega" src="${lg}">`:`<div class="bvic">${p.i||"⛰️"}</div>`}
<div class="bvt">${esc(p.t)}</div>${p.s?`<div class="bvs">${esc(p.s)}</div>`:""}${p.ch?`<div class="bvch">${p.ch.map(c=>`<span>${esc(c)}</span>`).join("")}</div>`:""}
${p.l.map(x=>`<div class="bvl"><b>${x[0]}</b><span>${esc(x[1])}</span></div>`).join("")}</div></div>`).join("")}
function ve(i){cur=Math.max(0,Math.min(N-1,i));tr.style.transform=`translateX(${-100*cur}%)`;
 nn.textContent=`${cur+1} de ${N}`;go.textContent=cur===N-1?"Empezar":"Siguiente";nt.textContent=P[cur].nt||"";
 bg.querySelectorAll(".bvdt span").forEach((d,k)=>d.classList.toggle("on",k===cur))}
function abre(){pinta();bg.hidden=false;document.documentElement.classList.add("bienvon");tr.style.transition="none";ve(0);
 requestAnimationFrame(()=>{tr.style.transition=""})}
function cierra(){if(bg.hidden)return;bg.hidden=true;document.documentElement.classList.remove("bienvon");marca()}
go.addEventListener("click",()=>{if(cur<N-1)ve(cur+1);else cierra()});
bg.addEventListener("click",e=>{if(e.target.closest("[data-close]")){cierra();return}const d=e.target.closest("[data-p]");if(d)ve(+d.dataset.p)});
addEventListener("keydown",e=>{if(bg.hidden)return;if(e.key==="ArrowRight")ve(cur+1);else if(e.key==="ArrowLeft")ve(cur-1);else if(e.key==="Escape")cierra()});
/* deslizar con el dedo */
let x0=null,y0=0;const win=bg.querySelector(".bvwin");
win.addEventListener("touchstart",e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
win.addEventListener("touchend",e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;
 if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3)ve(cur+(dx<0?1:-1))},{passive:true});
/* atras.js cierra con data-close: si la cierra por fuera (hidden sin pasar por cierra), apuntarla igual */
new MutationObserver(()=>{if(bg.hidden&&document.documentElement.classList.contains("bienvon")){document.documentElement.classList.remove("bienvon");marca()}}).observe(bg,{attributes:true,attributeFilter:["hidden"]});

window.BIENVENIDA={abre,cierra};
/* no salir encima de un enlace compartido (#pt=, #c=, #sal=…) ni de un archivo abierto con la app: entonces, la próxima vez */
const conEnlace=/^#(pt|c|sal|r|t|g)=/.test(location.hash)||/[?&](gpx|kml|share|text|url|title)=/.test(location.search);
if(!visto()&&!conEnlace)setTimeout(abre,400);
})();
