/* ---------- 📖 Visita al blog antes del track (16 nov 2026, propuesta suya para los colaboradores) ----------
   La primera vez que alguien toca ▶ Seguir, 〰️ Guardar track o el GPX de una ruta (del grupo o de un colaborador),
   se abre la entrada de su blog DENTRO de la app (visor con «← Volver a la ruta»). Así el blog suma la visita y el
   usuario no sale de la app. Al volver (con el botón o con «Atrás»), se hace lo que había tocado y esa ruta queda
   desbloqueada para siempre en ese móvil. Rutas sin entrada de blog: nada cambia.
   «📖 Leer en el blog» también abre el visor (16 nov).
   Prueba del 16 nov: los cuatro blogs (LdC, Camudando, Rutinas Varias, Gata con Botas) se dejan abrir en un iframe. */
(function(){
const K="ldc-visto";
let V={};try{V=JSON.parse(localStorage.getItem(K)||"{}")}catch(e){}
const visto=u=>!!V[u],marca=u=>{V[u]=Date.now();try{localStorage.setItem(K,JSON.stringify(V))}catch(e){}};
const esBlog=u=>/^https?:\/\//.test(u||"")&&!/wikiloc\.com/.test(u);
// qué entrada corresponde al botón tocado
function entrada(b){
  if(b.matches("[data-follow]"))return(R[+b.dataset.follow]||{}).u;
  if(b.matches("[data-frgt]"))return(R[+b.dataset.frgt]||{}).u;
  if(b.matches("[data-gpx]"))return(R[+b.dataset.gpx]||{}).u;
  if(b.matches("[data-cofol],[data-cosave]")){const s=document.getElementById("sheet"),k=s&&s._cor;return k&&k.c&&k.c.r&&k.c.r[k.i]?k.c.r[k.i][7]:""}
  return""}
document.head.insertAdjacentHTML("beforeend",`<style>
.vbg{position:fixed;inset:0;z-index:5000;background:var(--card,#fff);display:flex;flex-direction:column}
.vbg[hidden]{display:none!important}
.vbar{display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 10px 8px;background:#c3262e;color:#fff}
.vbar button{flex:none;min-height:44px;border:0;border-radius:12px;background:#fff;color:#c3262e;font:800 16px system-ui,sans-serif;padding:0 14px;cursor:pointer}
.vbar .vt{flex:1;min-width:0;font:600 13px/1.25 system-ui,sans-serif}.vbar .vt b{display:block;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vbar a{flex:none;color:#fff;font:700 13px system-ui,sans-serif;text-decoration:underline;padding:6px}
.vbg iframe{flex:1;width:100%;border:0;background:#fff}</style>`);
const BG=document.createElement("div");BG.className="vbg cdbg";BG.hidden=true;
BG.innerHTML=`<div class="vbar"><button data-close>← Volver a la ruta</button><div class="vt"><b>La entrada del blog</b><span>Al volver, tu track queda listo</span></div><a target="_blank" rel="noopener">Abrir fuera ↗</a></div><iframe title="Entrada del blog" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
document.body.appendChild(BG);
let PEND=null;
function abre(u,b){marca(u);PEND=b;const f=BG.querySelector("iframe");f.src=u;BG.querySelector("a").href=u;
  try{BG.querySelector(".vt b").textContent=new URL(u).hostname.replace(/^www\./,"")}catch(e){}
  BG.hidden=false}
function vuelve(){if(BG.hidden)return;BG.hidden=true;BG.querySelector("iframe").src="about:blank";const b=PEND;PEND=null;
  if(b&&b.isConnected)setTimeout(()=>b.click(),60)}
BG.querySelector("[data-close]").addEventListener("click",vuelve);
// se escucha en la ventana, antes que los demás (que escuchan en el documento)
addEventListener("click",e=>{if(!BG.hidden)return;
  // «📖 Leer en el blog» de la ficha de ruta: también dentro de la app (y cuenta como visita: desbloquea el track)
  const lb=e.target.closest&&e.target.closest(".fracts a.btn[href]");
  if(lb&&esBlog(lb.href)){e.preventDefault();e.stopImmediatePropagation();abre(lb.href,null);BG.querySelector("[data-close]").textContent="← Volver a la ruta";return}const b=e.target.closest&&e.target.closest("[data-follow],[data-frgt],[data-gpx],[data-cofol],[data-cosave]");if(!b)return;
  const u=entrada(b);if(!esBlog(u)||visto(u))return;
  e.preventDefault();e.stopImmediatePropagation();abre(u,b)},true);
window.VISITA={visto,abre};
})();
