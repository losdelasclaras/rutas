/* ---------- Mis cosas › 📁 Guardado (nov 2026): tus puntos y tus tracks juntos, por carpetas ----------
   · Arriba: ＋ Añadir (un punto donde estoy, en el mapa, o abrir un GPX/KML) y ··· Más (exportar, crear carpeta).
   · Filtro: Todo · ★ Pendientes · ✓ Hechos (vale para tracks y puntos) y buscador.
   · Las carpetas enseñan sus puntos y tracks juntos; debajo, lo que está suelto.
   · En las fichas de punto y track: fuera «Proponer al grupo» (Seguidores está escondido), fuera los mapas sin cobertura
     (solo se usan en Grabar, en la APK) y el tiempo pasa a un botón. Los puntos se pueden marcar ✓ / ★.
   Para quitarlo: borrar 'guardado' de la lista del build y volver en pestanas.js a las pestañas de antes. */
(function(){
const MPI=window.MISPUNTOS;if(!MPI)return;
document.head.insertAdjacentHTML("beforeend",`<style>
#gdbox .gdtop{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:2px 0 10px}
#gdbox .gdtop button{min-height:48px;font-size:16px;font-weight:800;border-radius:12px;border:1px solid var(--edge);background:var(--card);color:var(--ink);cursor:pointer}
#gdbox .gdtop .pri{background:var(--mark,#c3262e);border-color:var(--mark,#c3262e);color:#fff}
#gdbox .gdfil{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 8px}
#gdbox .gdfil button{border:1px solid var(--edge);background:var(--card);color:var(--ink);border-radius:999px;padding:7px 12px;font-weight:700;font-size:14px;cursor:pointer}
#gdbox .gdfil button[aria-pressed=true]{background:var(--ink);color:var(--card);border-color:var(--ink)}#gdbox .gdfil small{opacity:.7}
#gdbox .gdq{width:100%;box-sizing:border-box;border:1px solid var(--edge);border-radius:10px;padding:10px 12px;font:inherit;font-size:16px;background:var(--card);color:var(--ink);margin:0 0 8px}
#gdbox .gdf{display:flex;align-items:center;gap:10px;width:100%;border:1px solid var(--edge);border-radius:12px;background:var(--card);color:var(--ink);padding:12px;margin:8px 0 0;font:inherit;text-align:left;cursor:pointer}
#gdbox .gdf .e{font-size:24px}#gdbox .gdf b{display:block;font-size:16px}#gdbox .gdf small{color:var(--muted)}#gdbox .gdf .chev{margin-left:auto;transition:transform .15s;color:var(--muted)}
#gdbox .gdf[aria-expanded=true]{border-radius:12px 12px 0 0;border-bottom-color:transparent}#gdbox .gdf[aria-expanded=true] .chev{transform:rotate(90deg)}
#gdbox .gdfin{border:1px solid var(--edge);border-top:0;border-radius:0 0 12px 12px;padding:4px 10px 10px}
#gdbox .gdfa{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:6px 0 4px}
#gdbox .gdfa button{min-height:42px;border:1px solid var(--edge);border-radius:10px;background:var(--card);color:var(--ink);font:inherit;font-weight:700;font-size:14px;cursor:pointer}
#gdbox .gdfa .pri{background:var(--ink);color:var(--card);border-color:var(--ink)}
#gdbox .gdmas{display:flex;gap:6px;flex-wrap:wrap;margin:2px 0 6px}#gdbox .gdmas button{border:0;background:none;color:var(--muted);font:inherit;font-size:14px;text-decoration:underline;cursor:pointer;padding:4px}
.gdl .gdsep{margin:16px 2px 4px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:800}
.gdl .gdr{display:flex;align-items:center;gap:10px;width:100%;border:0;border-bottom:1px solid var(--edge);background:none;color:var(--ink);padding:10px 2px;font:inherit;text-align:left;cursor:pointer}
.gdl .gdr:last-child{border-bottom:0}.gdl .gdr .e{font-size:22px;width:28px;text-align:center;flex:none}
.gdl .gdr b{display:block;font-size:15.5px;line-height:1.25}.gdl .gdr small{display:block;color:var(--muted);font-size:13px}
.gdl .gdr .st{margin-left:auto;font-weight:900;font-size:18px}.gdr .st.h{color:#2a7a3b}.gdr .st.p{color:#d4a000}
#gdbox .gdvacio{color:var(--muted);margin:10px 2px}
#mlbox .gdml{order:8}
.gdpmk{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px 0 4px;padding:8px 10px;border-radius:12px;background:var(--land-dim,#eef0ea)}
.gdpmk span{font-weight:700;margin-right:auto}.gdpmk button{border:1px solid var(--edge);background:var(--card);color:var(--ink);border-radius:10px;padding:8px 12px;font:inherit;font-weight:700;cursor:pointer}
.gdpmk button[aria-pressed=true]{background:var(--ink);color:var(--card);border-color:var(--ink)}
/* fuera de las fichas de punto y track: los mapas sin cobertura y «Proponer al grupo» (Seguidores escondido) */
#sheet [data-offt],#sheet .offhint,#sheet [data-offr],#ov [data-offr]{display:none!important}
body:not(.segvis) [data-segprop],body:not(.segvis) [data-mpfa="prop"]{display:none!important}
</style>`);
const box=document.createElement("div");box.className="mpbox gdl";box.id="gdbox";box.hidden=true;document.body.appendChild(box);
let FIL="todos",Q="";const OPEN=new Set();
const nk=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const fmtF=f=>{try{return new Date(f).toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"})}catch(e){return""}};
const estDe=x=>x.est==="hecho"?"h":x.est==="pend"?"p":"";
const kmT=k=>k?(k<10?String(Math.round(k*10)/10).replace(".",","):Math.round(k))+" km":"";
function items(){const ps=MPI.get().map(p=>({k:"p",o:p,n:p.n,c:p.c,f:p.f,e:estDe(p)})),ts=MPI.tracks().map(t=>({k:"t",o:t,n:t.n,c:t.c,f:t.f,e:estDe(t)}));
  return ps.concat(ts).sort((a,b)=>(b.f||"").localeCompare(a.f||""))}
function fila(x){const o=x.o;
  if(x.k==="t"){const sub=[kmT(o.km),o.up!=null?"+"+Math.round(o.up).toLocaleString("es-ES")+" m":"",o.src==="blog"?"Del blog":o.src==="grab"?"Grabado":"Cargado"].filter(Boolean).join(" · ");
    return`<button class="gdr" data-gdt="${esc(o.id)}"><span class="e">${o.src==="blog"?"📘":o.src==="grab"?"⏺️":"〰️"}</span><span><b>${esc(o.n)}</b><small>${esc(sub)}${!x.inF&&o.c&&FIL!=="todos"?" · 📁 "+esc(o.c):""}</small></span>${x.e?`<span class="st ${x.e}">${x.e==="h"?"✓":"★"}</span>`:""}</button>`}
  const ic=MPI.ico?MPI.ico(o.ic):null,tipo=ic?ic[2]:"Punto";
  return`<button class="gdr" data-gdp="${esc(o.id)}"><span class="e">${MPI.emo?MPI.emo(o.ic):"📍"}</span><span><b>${esc(o.n)}</b><small>${esc([tipo,o.a!=null?Math.round(o.a).toLocaleString("es-ES")+" m":"",o.f?fmtF(o.f):""].filter(Boolean).join(" · "))}${!x.inF&&o.c&&FIL!=="todos"?" · 📁 "+esc(o.c):""}</small></span>${x.e?`<span class="st ${x.e}">${x.e==="h"?"✓":"★"}</span>`:""}</button>`}
function render(){if(box.hidden)return;const all=items(),nh=all.filter(x=>x.e==="h").length,np=all.filter(x=>x.e==="p").length;
  const ok=x=>(FIL==="todos"||(FIL==="hecho"?x.e==="h":x.e==="p"))&&(!Q||nk(x.n).includes(Q)||nk(x.c).includes(Q));
  const L=all.filter(ok);let body="";
  if(!all.length)body=`<p class="gdvacio">Aquí se guardan tus <b>puntos</b> (una fuente, un aparcamiento…) y tus <b>tracks</b> (de Wikiloc, de un amigo, los que grabas o los de las rutas del blog con ☆ Guardar en mis tracks). Toca <b>＋ Añadir</b>.</p>`;
  else if(!L.length)body=`<p class="gdvacio">Nada con ese filtro o búsqueda.</p>`;
  else if(FIL!=="todos"||Q)body=L.map(x=>fila(x)).join("");
  else{const fs={};for(const x of L)if(x.c)(fs[x.c]=fs[x.c]||[]).push(x);const sueltos=L.filter(x=>!x.c);
    const names=Object.keys(fs).sort((a,b)=>(fs[b][0].f||"").localeCompare(fs[a][0].f||""));
    body=names.map(n=>{const xs=fs[n],nt=xs.filter(x=>x.k==="t").length,npt=xs.length-nt,op=OPEN.has(n);
      return`<button class="gdf" data-gdf="${esc(n)}" aria-expanded="${op}"><span class="e">📁</span><span><b>${esc(n)}</b><small>${[nt?nt+(nt===1?" track":" tracks"):"",npt?npt+(npt===1?" punto":" puntos"):""].filter(Boolean).join(" · ")}</small></span><svg class="chev" width="14" viewBox="0 0 10 10"><path d="M3 1.5 7 5 3 8.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>`+
        (op?`<div class="gdfin" data-fn="${esc(n)}"><div class="gdfa"><button class="pri" data-gda="ver">🗺 Ver en el mapa</button><button data-gda="share">📤 Compartir</button><button data-gda="gpx">⬇ GPX</button></div>
          <div class="gdmas"><button data-gda="ren">✏️ Cambiar nombre</button><button data-gda="undo">📂 Deshacer carpeta</button></div>${xs.map(x=>fila(Object.assign({inF:1},x))).join("")}</div>`:"")}).join("")+
      (sueltos.length?(names.length?`<p class="gdsep">Sin carpeta</p>`:"")+sueltos.map(x=>fila(x)).join(""):"")}
  box.innerHTML=`<div class="gdtop"><button class="pri" data-gdadd>＋ Añadir</button><button data-gdmas>··· Más</button></div>
  ${all.length?`<div class="gdfil">${[["todos","Todo",all.length],["pend","★ Pendientes",np],["hecho","✓ Hechos",nh]].map(([k,t,c])=>`<button data-gdfil="${k}" aria-pressed="${FIL===k}">${t} <small>${c}</small></button>`).join("")}</div>
  <input class="gdq" id="gdq" type="search" placeholder="Buscar en lo guardado…" autocomplete="off" value="${esc(Q)}">`:""}<div id="gdlist">${body}</div>`;
  const q=box.querySelector("#gdq");if(q)q.addEventListener("input",()=>{Q=nk(q.value.trim());const p=q.selectionStart;render();const q2=box.querySelector("#gdq");if(q2){q2.focus();try{q2.setSelectionRange(p,p)}catch(e){}}})}
function elige(tit,ops){const d=document.createElement("div");d.className="cdq";
  d.innerHTML=`<div role="dialog" aria-label="${esc(tit)}"><h3>${tit}</h3>${ops.map((o,i)=>`<button data-q="${i}"><span>${o[0]}</span>${o[1]}</button>`).join("")}<button class="x" data-q="no">Cancelar</button></div>`;
  d.addEventListener("click",e=>{const b=e.target.closest("[data-q]");if(!b&&e.target!==d)return;d.remove();if(!b||b.dataset.q==="no")return;ops[+b.dataset.q][2]()});document.body.appendChild(d)}
box.addEventListener("click",e=>{
  if(e.target.closest("[data-gdadd]")){elige("¿Qué quieres añadir?",[["🎯","Un punto donde estoy",()=>MPI.gps()],["✛","Un punto tocando en el mapa",()=>MPI.cruz()],["⬆️","Abrir un archivo GPX o KML",()=>MPI.importar()]]);return}
  if(e.target.closest("[data-gdmas]")){const hay=MPI.get().length;elige("Más opciones",[["📁","Crear una carpeta",()=>MPI.nueva()],...(hay?[["⬇️","Exportar mis puntos (GPX)",()=>MPI.exportar("gpx")],["⬇️","Exportar mis puntos (KML, Google Earth)",()=>MPI.exportar("kml")]]:[])]);return}
  const fb=e.target.closest("[data-gdfil]");if(fb){FIL=fb.dataset.gdfil;render();return}
  const f=e.target.closest("[data-gdf]");if(f){const n=f.dataset.gdf;if(OPEN.has(n))OPEN.delete(n);else OPEN.add(n);render();return}
  const a=e.target.closest("[data-gda]");if(a){MPI.accion(a.closest("[data-fn]").dataset.fn,a.dataset.gda);setTimeout(render,300);return}
});
document.addEventListener("click",e=>{const t=e.target.closest("[data-gdt]");if(t){showView("mapa");if(window.MISTRACKS)setTimeout(()=>MISTRACKS.open(t.dataset.gdt,true),60);return}
  const p=e.target.closest("[data-gdp]");if(p){MPI.ver(p.dataset.gdp)}});
// Marcadas: también tus tracks y puntos guardados que tengan ✓ o ★
const ml=document.getElementById("mlbox");
function enMarcadas(){if(!ml||ml.hidden||ml.querySelector(".gdml"))return;const md=ml.querySelector('[data-lmode][aria-pressed="true"]');if(!md)return;const e=md.dataset.lmode==="hecha"?"h":"p";
  const xs=items().filter(x=>x.e===e);if(!xs.length)return;
  const html=`<div class="gdml"><p class="gdsep" style="margin:16px 2px 4px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:800">📁 De lo que has guardado · ${xs.length}</p><div class="gdl">${xs.map(x=>fila(x)).join("")}</div></div>`;
  const vac=ml.querySelector("p.empty");if(vac&&!ml.querySelector(".mlgh"))vac.remove();
  ml.insertAdjacentHTML("beforeend",html)}
if(ml)new MutationObserver(()=>setTimeout(enMarcadas,0)).observe(ml,{childList:true});
// se pone al día cuando cambian los puntos o los tracks
for(const id of ["mpbox","mtbox"]){const el=document.getElementById(id);if(el)new MutationObserver(()=>setTimeout(render,0)).observe(el,{childList:true,subtree:true})}
new MutationObserver(()=>{if(!box.hidden)render()}).observe(box,{attributes:true,attributeFilter:["hidden"]});
window.GUARDADO={render,n:()=>MPI.get().length+MPI.tracks().length};

/* ---- fichas de punto y track ---- */
const sh=document.getElementById("sheet");
const meteo=(la,lo,a)=>`https://www.meteoblue.com/es/tiempo/semana/${(+la).toFixed(3)}N${(+lo).toFixed(3)}E${a?Math.round(+a):""}_Europe%2FMadrid`;
function arregla(){if(!sh||sh.hidden)return;
  // el tiempo: un botón en vez del recuadro (que ya no se carga)
  for(const w of sh.querySelectorAll(".wx:not([data-gd])")){w.dataset.gd=1;const h=w.previousElementSibling;
    const a=document.createElement("a");a.className="mpb";a.href=meteo(w.dataset.lat,w.dataset.lon,w.dataset.alt);a.target="_blank";a.rel="noopener";a.textContent="☁ Ver el tiempo";a.style.display="inline-flex";a.style.margin="8px 0";
    if(h&&/^h3$/i.test(h.tagName)&&/tiempo/i.test(h.textContent))h.remove();w.replaceWith(a)}
  // marcar un punto tuyo: ✓ He estado · ★ Quiero ir
  const ed=sh.querySelector("[data-mpedit]");if(ed&&!sh.querySelector(".gdpmk")){const p=MPI.get().find(x=>x.id===ed.dataset.mpedit);if(!p)return;
    const acts=ed.closest(".mpacts")||ed.parentNode;
    acts.insertAdjacentHTML("beforebegin",`<div class="gdpmk" data-gdpk="${esc(p.id)}"><span>Tu marca</span><button data-gdpe="hecho" aria-pressed="${p.est==="hecho"}">✓ He estado</button><button data-gdpe="pend" aria-pressed="${p.est==="pend"}">★ Quiero ir</button></div>`)}}
// la ficha de un punto tuyo con el mismo molde que las demás: 🚗 Cómo llegar grande · Compartir · Editar · ··· Más opciones
function moldePunto(){const ed=sh&&sh.querySelector("[data-mpedit]");if(!ed||sh.querySelector(".gdacts"))return;
  const q=s=>sh.querySelector(s),llegar=q('a[href*="google.com/maps/dir"]'),share=q("[data-mpshare]");
  const resto=[q("[data-mtcar]"),q("[data-mpnear]"),q("[data-mpmove]"),[...sh.querySelectorAll("a.mpb")].find(a=>/meteoblue/.test(a.href)),q("[data-segprop]"),q("[data-mpdel]")].filter(Boolean);
  const first=(llegar||ed).closest(".mpacts")||(llegar||ed).parentNode;
  first.insertAdjacentHTML("beforebegin",`<div class="acts2 gdacts"><div class="aprim"></div><div class="ados"></div><details class="amas"><summary>··· Más opciones</summary><div class="agrid"></div></details></div>`);
  const bx=sh.querySelector(".gdacts"),ap=bx.querySelector(".aprim"),ad=bx.querySelector(".ados"),ag=bx.querySelector(".agrid");
  const pon=(el,dst,cls)=>{if(!el)return;el.className="btn "+(cls||"ghost");dst.appendChild(el)};
  pon(llegar,ap,"primary");pon(share,ad);pon(ed,ad);for(const el of resto)pon(el,ag);
  const dl=ag.querySelector("[data-mpdel]");if(dl)dl.style.color="#b3261e";
  sh.querySelectorAll(".mpacts").forEach(x=>{if(!x.closest(".acts2")&&!x.querySelector("button,a"))x.remove()})}
if(sh){let t=0;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{arregla();try{moldePunto()}catch(e){console.error(e)}},40)}).observe(sh,{childList:true,subtree:true})}
document.addEventListener("click",e=>{const b=e.target.closest("[data-gdpe]");if(!b)return;const w=b.closest("[data-gdpk]"),p=MPI.get().find(x=>x.id===w.dataset.gdpk);if(!p)return;
  p.est=p.est===b.dataset.gdpe?undefined:b.dataset.gdpe;if(!p.est)delete p.est;MPI.guarda();
  w.querySelectorAll("[data-gdpe]").forEach(x=>x.setAttribute("aria-pressed",p.est===x.dataset.gdpe));toast(p.est?(p.est==="hecho"?"Marcado ✓":"Apuntado ★"):"Marca quitada")});
// al guardar una ruta en mis tracks ya no se ofrece bajar el mapa (eso va en Grabar, en la APK)
if(window.OFFLINE)OFFLINE.ofrecer=()=>{};
})();
