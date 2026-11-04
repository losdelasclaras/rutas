/* ---------- menú de Capas más claro (nov 2026) ----------
   · interruptores en cada línea (verde = se ve, gris = no)
   · interruptor general en cada colaborador (enciende cumbres/lugares/rutas o lo apaga todo)
   · título «Qué ver en el mapa» con ✕; se cierra también al tocar el mapa
   · «Mis lugares» pasa a «Mis cosas», con nombres más claros y sin Seguidores
   · la pestaña Seguidores se esconde mientras está en pruebas (la ven el administrador y quien entre con …/rutas/#seguidores)
   Para quitarlo todo: borrar 'capas2' de la lista del build. */
(function(){
const pn=document.querySelector(".laypanel"),lg=document.querySelector(".legend");if(!pn||!lg)return;
document.head.insertAdjacentHTML("beforeend",`<style>
.laypanel .lay[data-lay]{display:flex;align-items:center;gap:8px;color:var(--ink)!important;opacity:1!important}
.laypanel .lay[data-lay][aria-pressed="false"] .ico,.laypanel .lay[data-lay][aria-pressed="false"] .lico{filter:grayscale(1);opacity:.55}
.laypanel .lay[data-lay]::after,.laypanel .mst{content:"";flex:none;margin-left:auto;width:40px;height:24px;border-radius:12px;background:#c9ccc4;position:relative;transition:background .15s;box-sizing:border-box}
.laypanel .lay[data-lay]::before{content:"";position:absolute;right:26px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.35);transition:right .15s;z-index:1}
.laypanel .lay[data-lay]{position:relative;padding-right:12px!important}
.laypanel .lay[data-lay][aria-pressed="true"]::after{background:#2a7a3b}
.laypanel .lay[data-lay][aria-pressed="true"]::before{right:12px}
.laypanel .lay[data-lay]::before{top:50%;transform:translateY(-50%)}
.laypanel .lay[data-lay="solo"],.laypanel .lay[data-lay="seg"],.laypanel .lay[data-agr],.laypanel .lay[hidden]{display:none!important}
.laypanel button.laygh .mst{display:inline-block;margin-left:8px;cursor:pointer}
.laypanel button.laygh .mst i{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.35);transition:left .15s}
.laypanel button.laygh .mst.on{background:#2a7a3b}.laypanel button.laygh .mst.on i{left:19px}
.laypanel button.laygh .mst.mid{background:#7fb08a}.laypanel button.laygh .mst.mid i{left:11px}
.laypanel button.laygh.conm .sum{max-width:90px}
.laypanel .laytit{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 4px 8px 8px;border-bottom:1px solid var(--edge);margin-bottom:2px}
.laypanel .laytit b{font-size:16px}
.laypanel .laytit button{border:0;background:var(--land-dim,#eee);color:var(--ink);width:34px;height:34px;border-radius:50%;font-size:18px;line-height:1;cursor:pointer}
</style>`);

// fuera de Capas: «solo los míos» y Seguidores (hidden también para que no salgan en el resumen)
for(const b of pn.querySelectorAll('[data-lay="seg"],[data-lay="solo"]'))b.hidden=true;
// título y ✕
pn.insertAdjacentHTML("afterbegin",`<div class="laytit"><b>Qué ver en el mapa</b><button type="button" data-laycerrar aria-label="Cerrar">✕</button></div>`);
function cerrar(){const l=document.querySelector(".legend.open");if(!l)return;l.classList.remove("open");const t=l.querySelector(".laytog");if(t)t.setAttribute("aria-expanded",false)}
pn.querySelector("[data-laycerrar]").addEventListener("click",e=>{e.stopPropagation();cerrar()});
if(typeof map!=="undefined")map.on("click",()=>cerrar());
document.addEventListener("pointerdown",e=>{if(document.querySelector(".legend.open")&&!e.target.closest(".legend")&&e.target.closest("#map"))cerrar()},true);

// «Mis lugares» → «Mis cosas», en este orden: mis puntos, mis tracks, las que hice, las que quiero hacer
const hdrs=()=>[...pn.querySelectorAll("button.laygh")];
const mio=hdrs().find(b=>/mis lugares/i.test(b.textContent));
if(mio){const tt=mio.querySelector(".tt");if(tt)tt.textContent="Mis cosas";
  const g=mio.nextElementSibling;
  const nom=(k,t)=>{const b=pn.querySelector(`[data-lay="${k}"]`);if(!b)return null;const n=[...b.childNodes].reverse().find(x=>x.nodeType===3&&x.textContent.trim());if(n)n.textContent=t;return b};
  const bs=[nom("mp","Mis puntos"),nom("mt","Mis tracks"),nom("mh","Señalar las que hice"),nom("mq","Señalar las que quiero hacer")].filter(Boolean);
  if(g&&g.classList.contains("laygrp"))for(const b of bs)g.appendChild(b)}

// interruptor general de cada colaborador
function grupos(){return hdrs().map(h=>({h,g:h.nextElementSibling})).filter(x=>x.g&&x.g.classList.contains("laygrp")&&x.g.querySelector('[data-lay^="co_"]'))}
function estado(){for(const{h,g}of grupos()){const bs=[...g.querySelectorAll('[data-lay^="co_"]:not([hidden])')];const on=bs.filter(b=>!/_t$/.test(b.dataset.lay)&&b.getAttribute("aria-pressed")==="true").length;
    let s=h.querySelector(".mst");if(!s){s=document.createElement("span");s.className="mst";s.setAttribute("role","switch");s.innerHTML="<i></i>";h.classList.add("conm");h.appendChild(s);
      s.addEventListener("click",e=>{e.stopPropagation();e.preventDefault();const bs=[...g.querySelectorAll('[data-lay^="co_"]:not([hidden])')];const alguno=bs.some(b=>b.getAttribute("aria-pressed")==="true");
        for(const b of bs){const es=b.getAttribute("aria-pressed")==="true",quiero=alguno?false:!/_t$/.test(b.dataset.lay);if(es!==quiero)b.click()}setTimeout(()=>{estado();if(window.capasSum)capasSum()},50)})}
    s.classList.toggle("on",on>0||bs.some(b=>b.getAttribute("aria-pressed")==="true"));s.setAttribute("aria-checked",on>0);s.title=on?"Ocultar todo":"Ver cumbres, lugares y rutas"}}
estado();lg.addEventListener("click",()=>setTimeout(estado,30));setTimeout(estado,800);

/* pestaña Seguidores: escondida mientras está en pruebas */
const ADM=["losdelasclaras@gmail.com","jcrespopazos@gmail.com"];
const adm=()=>{const u=window.LDCFB&&LDCFB.user&&LDCFB.user();return!!(u&&u.email&&ADM.includes(u.email.toLowerCase()))};
const inv=()=>{try{return localStorage.getItem("ldc-seginv")==="1"}catch(e){return false}};
function visSeg(){const t=document.querySelector('nav.tabs [data-v="seg"]');if(t)t.hidden=!(adm()||inv())}
function deInv(){if((location.hash||"")!=="#seguidores")return;try{localStorage.setItem("ldc-seginv","1")}catch(e){}
  try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}visSeg();if(typeof showView==="function")showView("seg")}
addEventListener("hashchange",deInv);setTimeout(()=>{deInv();visSeg()},0);addEventListener("ldc-user",visSeg);setTimeout(visSeg,1500);
})();
