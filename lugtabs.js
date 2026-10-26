/* ---------- pestaña Lugares en apartados: Lugares del blog · Mis puntos · Mis tracks · Mapas descargados ----------
   Solo se ve uno cada vez, así una lista larga de puntos no deja los tracks muy abajo. */
(function(){
const v=document.querySelector("#v-lugares .inner");if(!v)return;
const KEY="ldc-lugtab";
document.head.insertAdjacentHTML("beforeend",`<style>
.lugtabs{position:sticky;top:0;z-index:5;background:var(--paper);display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px 0 10px;margin:0 0 6px}
.lugtabs button{border:1px solid var(--edge);background:var(--card);color:var(--ink);border-radius:12px;padding:7px 2px 6px;font-weight:700;font-size:12.5px;line-height:1.15;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0;white-space:nowrap;letter-spacing:-.01em}
.lugtabs button .i{font-size:20px;line-height:1}
.lugtabs button small{font-weight:700;font-size:11.5px;color:var(--muted)}
.lugtabs button[aria-selected=true]{background:var(--ink);color:var(--card);border-color:var(--ink)}
.lugtabs button[aria-selected=true] small{color:inherit;opacity:.8}
@media(min-width:700px){.lugtabs button{flex-direction:row;justify-content:center;gap:6px;font-size:14.5px;padding:9px 6px}}
#v-lugares .mpbox>h2:first-child{display:none}
#v-lugares [data-lsec][hidden]{display:none!important}
</style>`);
const lead=v.querySelector(".lead"),bar=document.createElement("div");bar.className="lugtabs";bar.setAttribute("role","tablist");
(lead||v.firstElementChild).before(bar);
// qué va en cada apartado
const S={lug:[lead,document.getElementById("colh-lugares"),document.getElementById("qs-lugares"),document.getElementById("col-lugares")],
  mp:[document.getElementById("mpbox")],mt:[document.getElementById("mtbox")],off:[document.getElementById("offbox")]};
for(const k in S)for(const el of S[k])if(el)el.dataset.lsec=k;
const N={lug:["🏞️","Lugares"],mp:["📍","Mis puntos"],mt:["🧵","Mis tracks"],off:["📥","Mapas"]};
const cuenta=k=>k==="mp"?MISPUNTOS.get().length:k==="mt"?MISPUNTOS.tracks().length:k==="off"?(window.OFFLINE?OFFLINE.list().length:0):null;
let cur=store.get(KEY,"lug");if(!S[cur])cur="lug";
function pinta(){bar.innerHTML=Object.keys(N).map(k=>{const n=cuenta(k);return`<button role="tab" data-lt="${k}" aria-selected="${k===cur}"><span class="i">${N[k][0]}</span><span>${N[k][1]}</span>${n!=null?`<small>${n}</small>`:"<small>&nbsp;</small>"}</button>`}).join("");
  for(const k in S)for(const el of S[k])if(el)el.hidden=k!==cur}
function ir(k){if(!S[k])return;cur=k;store.set(KEY,k);pinta();  const sc=document.getElementById("v-lugares");if(sc&&sc.scrollTop>bar.offsetTop)sc.scrollTop=bar.offsetTop}
bar.addEventListener("click",e=>{const b=e.target.closest("[data-lt]");if(b)ir(b.dataset.lt)});
// los números se actualizan cuando cambian las listas
const mo=new MutationObserver(()=>{const sel=cur;bar.querySelectorAll("[data-lt]").forEach(b=>{const n=cuenta(b.dataset.lt);const s=b.querySelector("small");if(s&&n!=null)s.textContent=n});if(sel!==cur)pinta()});
for(const k of ["mp","mt","off"])for(const el of S[k])if(el)mo.observe(el,{childList:true});
window.LUGTAB=k=>{if(typeof showView==="function")showView("lugares");ir(k)};
pinta();
})();
