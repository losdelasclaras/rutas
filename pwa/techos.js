/* ---------- 🏔 Techos de Asturias (9 nov 2026) ----------
   El reto de Camudando'l camín: la cumbre más alta de cada uno de los 78 concejos (73 cumbres: 5 son techo de dos concejos).
   La lista sale de su mapa (colaborador c3: la descripción de cada punto dice «Techu de …»), así que se actualiza sola con el robot.
   · Explorar › Cumbres: botón «🏔 Techos de Asturias · 5 de 78» que pone el filtro (Filtros › Altura › Techos de Asturias).
     Una fila por cumbre (la del grupo si la tenéis, si no la suya), ordenadas por concejo, con «Llevas N de 78 concejos».
   · Ficha de la cumbre: etiqueta «🏔 Techo de Lena».
   · Mis cosas › Marcadas: una línea «🏔 Techos de Asturias · N de 78» que lleva a la lista. También en el resumen.
   · Una sola marca: marcar una de estas cumbres (en la lista, en la ficha o en Marcadas) la marca en todos los blogs que la tienen.
   Para quitarlo: borrar 'techos' de _mods en pwa/build_pwa.py (el filtro vuelve a ser el de antes, con los techos del grupo). */
(function(){
if(typeof COL==="undefined"||typeof PEAKS==="undefined")return;
const CID="c3",TOTAL=78;
document.head.insertAdjacentHTML("beforeend",`<style>
.techbtn{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;margin:8px 0 6px;padding:12px 14px;border:1.5px solid var(--edge);border-radius:14px;background:var(--card,#fff);color:var(--ink);font:inherit;font-size:16px;font-weight:800;text-align:left;cursor:pointer}
.techbtn small{margin-left:auto;font-weight:700;color:var(--muted);font-size:14px;white-space:nowrap}
.techcab{margin:0 0 10px;padding:12px 14px;border-radius:14px;background:color-mix(in srgb,#1e8e3e 9%,transparent);border:1px solid color-mix(in srgb,#1e8e3e 35%,transparent)}
.techcab .tt{font-size:17px;font-weight:800;margin-bottom:6px}.techcab .tt b{font-size:22px}
.techcab .prog{margin:4px 0 8px}.techcab .prog i{background:#1e8e3e}
.techcab p{margin:0;font-size:14px;color:var(--muted);line-height:1.35}
.techtag{background:#1e8e3e!important;color:#fff!important;border-color:#1e8e3e!important}
#mlbox .techml{margin:8px 0 4px}
</style>`);

/* ----- la lista de techos (de los datos de Camudando'l camín) ----- */
let TL=null;
const conc=d=>{const m=/^\s*Techu\s+(?:del\s+|de\s+|d['’]\s*)(.+?)\s*$/i.exec(String(d||"").split("\n")[0]);if(!m)return null;
  return m[1].split(/\s+y\s+/).map(s=>s.trim()).filter(Boolean)};
function carga(){if(TL)return TL;if(!window.COLX||!COLX.todo)return null;
  const L=[];for(const it of COLX.todo()){if(!it.pp||!it.co||it.co.id!==CID||it.k!=="cumbre")continue;const cs=conc(it.pp[3]);if(!cs)continue;
    let g=it.par&&!it.par.co?it.par:null;
    let ms=[];if(COLX.cumCo){const x=COLX.cumCo(it.pp);ms=x.ms||[];if(!g&&x.gi!=null)g=PEAKS.find(p=>!p.co&&p.i===x.gi)||null}
    const K=new Set(["c:"+norm(it.c)+"@"+CID]);if(g)K.add("c:"+norm(g.c));for(const{c,p}of ms)if(COLX.coKey)K.add(COLX.coKey(c,p[0]));
    L.push({it,g,cs,lbl:cs.join(" y "),K:[...K]})}
  if(!L.length)return null;
  L.sort((a,b)=>a.lbl.localeCompare(b.lbl,"es"));TL=L;return TL}
const est=T=>{let q="";for(const k of T.K){if(MARKS[k]==="hecha")return "hecha";if(MARKS[k]==="quiero")q="quiero"}return q};
function cuenta(){const L=carga();if(!L)return null;let h=0,t=0;for(const T of L){t+=T.cs.length;if(est(T)==="hecha")h+=T.cs.length}return{h,t:Math.max(t,TOTAL)}}

/* ----- una sola marca: lo que tenga una, lo tienen todas ----- */
let pend=false;
function iguala(){const L=carga();if(!L)return;let cambia=false;
  for(const T of L){const v=est(T);for(const k of T.K)if((MARKS[k]||"")!==v){if(v)MARKS[k]=v;else delete MARKS[k];cambia=true}}
  if(cambia&&!pend){pend=true;setTimeout(()=>{pend=false;saveMarks();if(window.refreshMarks)refreshMarks()},0)}}
// al tocar ✓ o ★ de una de estas cumbres (en cualquier sitio), antes de que se guarde: el mismo valor para todas sus copias
document.addEventListener("click",e=>{const b=e.target.closest("[data-m],[data-mk]");if(!b||!b.parentElement)return;const k=b.parentElement.dataset.key;if(!k)return;
  const L=carga();if(!L)return;const T=L.find(x=>x.K.includes(k));if(!T)return;
  const v=b.dataset.m||b.dataset.mk,nv=MARKS[k]===v?"":v;
  for(const o of T.K)if(o!==k){if(nv)MARKS[o]=nv;else delete MARKS[o]}},true);

/* ----- Explorar › Cumbres ----- */
const blog=()=>{const L=carga();const c=L&&L[0]&&L[0].it.co;return{n:c?c.n:"Camudando'l camín",u:(c&&c.bw)||"https://camudandolcamin.blogspot.com"}};
window.TECHOS={
  ok:()=>!!carga(),
  cuenta,
  // la lista del filtro: una fila por cumbre (la del grupo si la tenéis; si no, la suya), por orden de concejo
  lista(items,C){const L=carga();if(!L)return null;iguala();const S=new Set(items),out=[];
    for(const T of L){const row=T.g&&S.has(T.g)?T.g:S.has(T.it)?T.it:null;if(!row)continue;const s=est(T);
      if(C.f==="hecha"&&s!=="hecha"||C.f==="quiero"&&s!=="quiero"||C.f==="nada"&&s)continue;
      out.push(Object.assign(Object.create(row),{techo:T.lbl}))}
    if(C.near)out.sort((a,b)=>a._d-b._d);
    return out},
  cab(){const n=cuenta();if(!n)return"";const b=blog();
    return `<div class="techcab"><div class="tt">🏔 Llevas <b>${n.h}</b> de ${n.t} concejos</div><div class="prog"><i style="width:${(n.h/n.t*100).toFixed(1)}%"></i></div>
    <p>La cumbre más alta de cada concejo, el reto de <a href="${esc(b.u)}" target="_blank" rel="noopener">${esc(b.n)}</a>. Algunas son techo de dos concejos y cuentan por los dos.</p></div>`},
  boton(C){if(C.g==="techo")return"";const n=cuenta();if(!n)return"";
    return `<button class="techbtn" data-techos>🏔 Techos de Asturias<small>${n.h} de ${n.t}</small></button>`},
  abrir(){const C=COL.cumbres;C.g="techo";C.z="cant";C._l_g="🏔 Techos de Asturias";
    if(typeof showView==="function")showView("cumbres");renderCol("cumbres");const v=document.getElementById("v-cumbres");if(v)v.scrollTop=0}};
document.getElementById("v-cumbres").addEventListener("click",e=>{if(!e.target.closest("[data-techos]"))return;e.stopPropagation();TECHOS.abrir()},true);

/* ----- ficha de la cumbre: «🏔 Techo de Lena» ----- */
function etiqueta(T){if(!T||sheet.hidden)return;const h=sheet.querySelector(".sheet-head");if(!h||sheet.querySelector(".techtag"))return;
  const tag=`<span class="tag techtag">🏔 Techo de ${esc(T.lbl)}</span>`;
  const m=h.nextElementSibling&&h.nextElementSibling.classList.contains("meta")?h.nextElementSibling:null;
  if(m)m.insertAdjacentHTML("afterbegin",tag);else h.insertAdjacentHTML("afterend",`<div class="meta">${tag}</div>`)}
{const o=window.pickRoute;if(typeof o==="function")window.pickRoute=pickRoute=function(pi){const r=o.apply(this,arguments);try{const L=carga();if(L)etiqueta(L.find(T=>T.g&&T.g.i===pi))}catch(e){}return r}}
if(window.FICHAPT&&FICHAPT.co){const o=FICHAPT.co;FICHAPT.co=function(c,p,kd){const r=o.apply(this,arguments);
  try{const L=carga();if(L&&(!kd||kd==="cumbre")){const ms=COLX.cumCo?COLX.cumCo(p).ms.map(x=>x.p):[p];etiqueta(L.find(T=>T.it.pp===p||ms.includes(T.it.pp)))}}catch(e){}return r}}

/* ----- Mis cosas › Marcadas: una línea con el reto ----- */
const ml=document.getElementById("mlbox");
function lineaMl(){if(!ml||ml.hidden||ml.querySelector(".techml"))return;const n=cuenta();if(!n)return;const bar=ml.querySelector(".mlbar");if(!bar)return;
  bar.insertAdjacentHTML("afterend",`<button class="techbtn techml" data-techml>🏔 Techos de Asturias<small>${n.h} de ${n.t} concejos ›</small></button>`)}
if(ml){new MutationObserver(lineaMl).observe(ml,{childList:true});
  ml.addEventListener("click",e=>{if(!e.target.closest("[data-techml]"))return;e.stopPropagation();TECHOS.abrir()},true)}

// cuando llegan los datos de los colaboradores (después de arrancar), se igualan las marcas y se repinta
{let n=0;const t=setInterval(()=>{if(carga()){clearInterval(t);iguala();renderCol("cumbres");lineaMl()}else if(++n>120)clearInterval(t)},500)}
})();
