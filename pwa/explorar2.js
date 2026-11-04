/* ---------- Explorar más limpio (nov 2026) ----------
   · sin los títulos grandes («Las rutas», «Tus cumbres», «Tus lugares») ni las explicaciones de debajo
   · «Cerca de un lugar» y «Cerca de mí» juntos en un solo «📍 Cerca de…» (pregunta: ¿de ti o de un sitio?), con «⚙ Filtros» al lado
   Para quitarlo: borrar 'explorar2' de la lista del build. */
(function(){
document.head.insertAdjacentHTML("beforeend",`<style>
#v-rutas h1.vt,#v-cumbres h1.vt,#v-lugares h1.vt,#v-cumbres p.lead,#v-lugares p.lead{display:none!important}
#v-rutas #b-nearme,#v-cumbres [data-cme],#v-lugares [data-cme]{display:none!important}
#v-rutas .wizrow,#v-cumbres .wizrow.cerca,#v-lugares .wizrow.cerca{grid-template-columns:1fr 1fr!important}
#v-rutas .wizrow .wizbtn,#v-cumbres .wizrow.cerca .wizbtn,#v-lugares .wizrow.cerca .wizbtn{white-space:nowrap!important}
.cdq{position:fixed;inset:0;z-index:4000;background:rgba(0,0,0,.35);display:flex;align-items:flex-end;justify-content:center}
.cdq>div{background:var(--card,#fff);color:var(--ink,#222);width:100%;max-width:520px;border-radius:18px 18px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));box-shadow:0 -4px 20px rgba(0,0,0,.25)}
.cdq h3{margin:0 0 12px;font-size:19px}
.cdq button{display:flex;align-items:center;gap:12px;width:100%;border:1px solid var(--edge,#ddd);background:var(--card,#fff);color:inherit;font:inherit;font-size:17px;font-weight:700;text-align:left;padding:15px 16px;border-radius:14px;margin:0 0 10px;cursor:pointer}
.cdq button span{font-size:24px}.cdq button.x{justify-content:center;font-weight:600;color:var(--muted,#666);border:0}
</style>`);
// el botón «Cerca de un lugar» pasa a ser «📍 Cerca de…» (se le quita data-cnear para que no salte directo al buscador de sitios)
function arregla(root){for(const b of (root||document).querySelectorAll("#v-rutas [data-cnear],#v-cumbres [data-cnear],#v-lugares [data-cnear]")){b.removeAttribute("data-cnear");b.setAttribute("data-cerca2","");b.textContent="📍 Cerca de…"}}
// textos de los buscadores que no se corten
{const q=document.getElementById("q");if(q)q.placeholder="Busca ruta, cumbre o sitio…";const ql=document.getElementById("qs-lugares");if(ql)ql.placeholder="Busca un lugar…"}
arregla();new MutationObserver(()=>arregla()).observe(document.querySelector("main")||document.body,{childList:true,subtree:true});
function pregunta(){const d=document.createElement("div");d.className="cdq";
  d.innerHTML=`<div role="dialog" aria-label="Rutas cerca de"><h3>¿Cerca de dónde?</h3><button data-q="yo"><span>🎯</span>Cerca de mí</button><button data-q="sitio"><span>🏘️</span>Cerca de un pueblo o sitio</button><button class="x" data-q="no">Cancelar</button></div>`;
  d.addEventListener("click",e=>{const b=e.target.closest("[data-q]");if(!b&&e.target!==d)return;d.remove();if(!b)return;
    if(b.dataset.q==="yo")CERCA.yo();else if(b.dataset.q==="sitio")CERCA.buscar()});
  document.body.appendChild(d)}
document.addEventListener("click",e=>{const b=e.target.closest("[data-cerca2]");if(!b)return;e.preventDefault();e.stopPropagation();if(window.CERCA)pregunta()},true);
})();
