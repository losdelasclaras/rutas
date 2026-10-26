/* ---------- panel de Capas por apartados desplegables (solo uno abierto a la vez) ---------- */
(function(){
const pn=document.querySelector(".laypanel");if(!pn)return;
document.head.insertAdjacentHTML("beforeend",`<style>
.laypanel{gap:0}
.laypanel .laygrp{display:flex;flex-direction:column;gap:1px;padding:0 0 4px}
.laypanel .laygrp[hidden]{display:none}
.laypanel button.laygh{display:flex;align-items:center;gap:6px;width:100%;border:0;background:none;cursor:pointer;margin:0;padding:9px 8px;border-top:1px solid var(--edge);text-align:left;font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink);font-weight:800}
.laypanel button.laygh:first-child{border-top:0}
.laypanel button.laygh .sum{margin-left:auto;text-transform:none;letter-spacing:0;font-weight:600;color:var(--muted);font-size:12.5px;max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.laypanel button.laygh .chev{width:14px;flex:none;transition:transform .15s;color:var(--muted)}
.laypanel button.laygh[aria-expanded=true] .chev{transform:rotate(90deg)}
</style>`);
// agrupa: cada título y lo que va debajo hasta el siguiente título
const kids=[...pn.children];const groups=[];let cur=null;
for(const el of kids){if(el.matches("p.laygh")){const b=document.createElement("button");b.type="button";b.className="laygh";b.innerHTML=`<svg class="chev" viewBox="0 0 10 10"><path d="M3 1.5 7 5 3 8.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span class="tt">${el.textContent}</span><span class="sum"></span>`;
    const g=document.createElement("div");g.className="laygrp";el.replaceWith(b);b.after(g);cur={b,g,name:el.textContent.trim()};groups.push(cur)}
  else if(cur)cur.g.appendChild(el)}
const KEY="ldc-capas-abierta";let open;try{open=localStorage.getItem(KEY)}catch(e){}
if(!groups.some(x=>x.name===open))open=(groups.find(x=>/^ver$/i.test(x.name))||groups[0]).name;
function sum(){for(const x of groups){let s="";
    if(/^mapa$/i.test(x.name)){const b=x.g.querySelector('[data-base][aria-pressed="true"]');s=b?b.textContent.trim():""}
    else{const on=[...x.g.querySelectorAll('[data-lay][aria-pressed="true"]:not([hidden])')].filter(b=>b.dataset.lay!=="solo").map(b=>b.textContent.trim());if(x.g.querySelector('[data-lay]'))s=on.length?on.join(", "):"nada"}
    x.b.querySelector(".sum").textContent=s}}
function show(){for(const x of groups){const o=x.name===open;x.g.hidden=!o;x.b.setAttribute("aria-expanded",o)}sum()}
pn.addEventListener("click",e=>{const h=e.target.closest("button.laygh");if(h){const x=groups.find(g=>g.b===h);open=(open===x.name)?"":x.name;try{localStorage.setItem(KEY,open)}catch(e){}show();e.stopPropagation();return}
  setTimeout(sum,0)});
show();
})();
