/* ---------- 🆕 Novedades: rutas del blog nuevas desde la última vez que abriste la app ----------
   Se guarda qué rutas has visto (en este aparato). La primera vez no hay novedades. */
(function(){
const K="ldc-vistas";let vistas=null;try{vistas=JSON.parse(localStorage.getItem(K)||"null")}catch(e){}
const todas=R.map(r=>r.u).filter(Boolean);
if(!Array.isArray(vistas)){try{localStorage.setItem(K,JSON.stringify(todas))}catch(e){}return}
const vs=new Set(vistas),NUEVAS=R.filter(r=>r.u&&!vs.has(r.u)).sort((a,b)=>(b.d||"").localeCompare(a.d||""));
if(!NUEVAS.length)return;
document.head.insertAdjacentHTML("beforeend",`<style>
nav.tabs .nbadge{position:absolute;top:4px;left:calc(50% + 6px);min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#c3262e;color:#fff;font:800 11.5px/18px system-ui;letter-spacing:0;box-shadow:0 0 0 2px var(--paper)}
nav.tabs button{position:relative}
.novbox{border:2px solid #c3262e;border-radius:14px;padding:10px 12px 4px;margin:0 0 14px;background:var(--card)}
.novbox h2{margin:0 0 4px;font-size:17px;display:flex;align-items:center;gap:8px}.novbox h2 button{margin-left:auto;border:0;background:none;color:var(--muted);font-size:14px;cursor:pointer;text-decoration:underline}
.row .t .tagnew,.tagnew{display:inline-block;font-style:normal;background:#c3262e;color:#fff;border-radius:6px;padding:0 6px;font-size:11px;font-weight:800;margin-right:6px;vertical-align:1px}
</style>`);
// globo con el número en la pestaña «Del grupo»
const tab=document.querySelector('nav.tabs [data-v="grupo"]');let badge=null;
if(tab){badge=document.createElement("span");badge.className="nbadge";badge.textContent=NUEVAS.length;tab.appendChild(badge)}
// recuadro arriba de la lista de rutas
const inner=document.querySelector("#v-rutas .inner"),h1=inner&&inner.querySelector("h1");
const box=document.createElement("div");box.className="novbox";
box.innerHTML=`<h2>🆕 ${NUEVAS.length===1?"Ruta nueva":NUEVAS.length+" rutas nuevas"} en el blog<button data-novx>Ya las he visto</button></h2>
  <div class="rows">${NUEVAS.slice(0,10).map(r=>rowHTML(r,"",false).replace('<b>','<b><i class="tagnew">NUEVA</i>')).join("")}</div>`;
if(h1)h1.after(box);
box.addEventListener("click",e=>{if(e.target.closest("[data-novx]")){box.remove();return}const row=e.target.closest("[data-r]");if(row)ovShow({t:"route",id:+row.dataset.r})});
// al ver la lista de rutas se dan por vistas (el recuadro sigue hasta cerrar la app o pulsar «Ya las he visto»)
function vistasYa(){try{localStorage.setItem(K,JSON.stringify(todas))}catch(e){}if(badge){badge.remove();badge=null}}
const vr=document.getElementById("v-rutas");
const mo=new MutationObserver(()=>{if(!vr.hidden){vistasYa();mo.disconnect()}});mo.observe(vr,{attributes:true,attributeFilter:["hidden"]});
if(!vr.hidden)vistasYa();
// aviso al abrir la app
setTimeout(()=>{if(badge&&typeof toast==="function")toast(`🆕 ${NUEVAS.length===1?"Hay una ruta nueva":"Hay "+NUEVAS.length+" rutas nuevas"} en el blog · míralas en Del grupo › Rutas`)},2500);
window.NOVEDADES=NUEVAS;
})();
