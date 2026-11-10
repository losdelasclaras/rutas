/* ---------- 🆕 Novedades: rutas nuevas (del blog y de los colaboradores) desde la última vez que abriste la app ----------
   Se guarda qué rutas has visto (en este aparato). La primera vez no hay novedades. */
(function(){
const K="ldc-vistas";let vistas=null;try{vistas=JSON.parse(localStorage.getItem(K)||"null")}catch(e){}
const todas=R.map(r=>r.u).filter(Boolean);
if(!Array.isArray(vistas)){try{localStorage.setItem(K,JSON.stringify(todas))}catch(e){}return}
const vs=new Set(vistas),NUEVAS=R.filter(r=>r.u&&!vs.has(r.u)).sort((a,b)=>(b.d||"").localeCompare(a.d||""));
// 10 nov 2026: también las rutas nuevas de los colaboradores (sus datos llegan un poco después de arrancar)
const KC="ldc-vistas-co";let CN=[],todasCo=null;
function colabListo(fin){let n=0;const t=setInterval(()=>{n++;const ok=window.COLX&&COLX.rut&&COLX.rut().length;if(ok||n>40){clearInterval(t);fin(!!ok)}},250)}
colabListo(ok=>{
  if(ok){const RU=COLX.rut();todasCo=RU.map(x=>COLX.rKey(x));let vc=null;try{vc=JSON.parse(localStorage.getItem(KC)||"null")}catch(e){}
    if(!Array.isArray(vc)){try{localStorage.setItem(KC,JSON.stringify(todasCo))}catch(e){}}   // primera vez: lo que hay ya no es novedad
    else{const s=new Set(vc);CN=RU.filter(x=>!s.has(COLX.rKey(x))).sort((a,b)=>((b.y||0)*100+(b.m||0))-((a.y||0)*100+(a.m||0)))}}
  pinta()});
function pinta(){const tot=NUEVAS.length+CN.length;if(!tot)return;
document.head.insertAdjacentHTML("beforeend",`<style>
  nav.tabs .nbadge{position:absolute;top:4px;left:calc(50% + 6px);min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#c3262e;color:#fff;font:800 11.5px/18px system-ui;letter-spacing:0;box-shadow:0 0 0 2px var(--paper)}
  nav.tabs button{position:relative}
  .novbox{border:2px solid #c3262e;border-radius:14px;padding:10px 12px 4px;margin:0 0 14px;background:var(--card)}
  .novbox h2{margin:0 0 4px;font-size:17px;display:flex;align-items:center;gap:8px}.novbox h2 button{margin-left:auto;border:0;background:none;color:var(--muted);font-size:14px;cursor:pointer;text-decoration:underline}
  .row .t .tagnew,.tagnew{display:inline-block;font-style:normal;background:#c3262e;color:#fff;border-radius:6px;padding:0 6px;font-size:11px;font-weight:800;margin-right:6px;vertical-align:1px}
  </style>`);
  // globo con el número en la pestaña «Del grupo»
  const tab=document.querySelector('nav.tabs [data-v="grupo"]');let badge=null;
  if(tab){badge=document.createElement("span");badge.className="nbadge";badge.textContent=tot;tab.appendChild(badge)}
  // recuadro arriba de la lista de rutas: primero las del blog, luego las de los colaboradores (con su nombre)
  const inner=document.querySelector("#v-rutas .inner"),h1=inner&&inner.querySelector("h1");
  const box=document.createElement("div");box.className="novbox";
  const tit=!CN.length?(tot===1?"Ruta nueva en el blog":tot+" rutas nuevas en el blog"):(tot===1?"Ruta nueva":tot+" rutas nuevas");
  box.innerHTML=`<h2>🆕 ${tit}<button data-novx>Ya las he visto</button></h2>
    <div class="rows">${NUEVAS.slice(0,10).map(r=>rowHTML(r,"",false).replace('<b>','<b><i class="tagnew">NUEVA</i>')).join("")}${CN.slice(0,10).map(x=>COLX.rrow(x).replace('<b>','<b><i class="tagnew">NUEVA</i>')).join("")}</div>`;
  if(h1)h1.after(box);
  box.addEventListener("click",e=>{if(e.target.closest("[data-novx]")){box.remove();return}
    const row=e.target.closest("[data-r]");if(row){ovShow({t:"route",id:+row.dataset.r});return}
    const co=e.target.closest("[data-cor]");if(co){e.stopPropagation();const ci=+co.dataset.cor;if(typeof showView==="function")showView("mapa");if(!(COLX.abrirRuta&&COLX.abrirRuta(ci)))COLX.open(ci)}});
  // al ver la lista de rutas se dan por vistas (el recuadro sigue hasta cerrar la app o pulsar «Ya las he visto»)
  function vistasYa(){try{localStorage.setItem(K,JSON.stringify(todas));if(todasCo)localStorage.setItem(KC,JSON.stringify(todasCo))}catch(e){}if(badge){badge.remove();badge=null}}
  const vr=document.getElementById("v-rutas");
  const mo=new MutationObserver(()=>{if(!vr.hidden){vistasYa();mo.disconnect()}});mo.observe(vr,{attributes:true,attributeFilter:["hidden"]});
  if(!vr.hidden)vistasYa();
  // aviso al abrir la app
  setTimeout(()=>{if(badge&&typeof toast==="function")toast(`🆕 ${tot===1?"Hay una ruta nueva":"Hay "+tot+" rutas nuevas"} · míralas en Explorar › Rutas`)},1500);
  window.NOVEDADES=NUEVAS.concat(CN)}

})();
