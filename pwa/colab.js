/* ---------- capas de colaboradores: sus puntos (My Maps) y sus tracks (My Maps o Drive), cada uno con su color ---------- */
(function(){
const CO=__COLAB__;if(!CO.length||typeof map==="undefined")return;
document.head.insertAdjacentHTML("beforeend",`<style>
#map .cpt i{position:absolute;left:0;top:0;transform:translate(-50%,-50%);width:max(13px,calc(var(--ms)*.72));height:max(13px,calc(var(--ms)*.72));border-radius:50%;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5);box-sizing:border-box;display:block}
#map .cpt.cum i{border-radius:3px;transform:translate(-50%,-50%) rotate(45deg)}
#map .leaflet-tooltip.lbl.co{font-weight:700}
.cpop{max-width:250px;font-size:15px;line-height:1.35}.cpop b{font-size:16.5px;display:block}.cpop .q{font-size:13px;color:#666;margin:2px 0 4px}
.cpop .dd{white-space:pre-line;max-height:38vh;overflow:auto}
.cpop img{width:100%;max-height:170px;object-fit:cover;border-radius:8px;margin:6px 0 4px;display:block}
.cpop a.vm{display:inline-block;margin-top:6px;font-weight:700}
.lico.co{width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);display:inline-block}
</style>`);
// en Capas: un apartado «Colaboradores» con un botón por cada uno (encendidos la primera vez)
const pn=document.querySelector(".laypanel");
if(pn){const ml=[...pn.querySelectorAll("p.laygh")].find(p=>/mis lugares/i.test(p.textContent));
  const h=`<p class="laygh">Colaboradores</p>`+CO.map(c=>`<button class="lay" data-lay="co_${c.id}" aria-pressed="true"><span class="lico co" style="background:${c.c}"></span>${esc(c.n)}</button>`).join("");
  if(ml)ml.insertAdjacentHTML("beforebegin",h);else pn.insertAdjacentHTML("beforeend",h)}
const G={},LBL=[];
const alt=n=>{const m=/(\d[\d.]{2,5})\s*m\b/.exec(n||"");return m?+m[1].replace(/\./g,""):0};
function pop(c,p){const[n,,,d,u,f]=p;
  return `<div class="cpop"><b>${esc(n)}</b><div class="q">${esc(c.n)}</div>`+(f?`<img src="${esc(f)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:"")+(d?`<div class="dd">${esc(d)}</div>`:"")+(u?`<a class="vm" href="${esc(u)}" target="_blank" rel="noopener">Ver más ›</a>`:"")+`</div>`}
for(const c of CO){if(LAY["co_"+c.id]===undefined)LAY["co_"+c.id]=true;
  const g=L.layerGroup();
  for(const ln of c.l){const ll=ln[1];
    g.addLayer(L.polyline(ll,{color:"#fff",weight:6,opacity:.85,interactive:false,renderer:TRC}));
    g.addLayer(L.polyline(ll,{color:c.c,weight:3.5,opacity:.95,renderer:TRC}).bindTooltip(esc(ln[0])+" · "+esc(c.n),{sticky:true}))}
  for(const p of c.p){const cum=alt(p[0])>0;
    const m=L.marker([p[1],p[2]],{icon:L.divIcon({className:"cpt"+(cum?" cum":""),html:`<i style="background:${c.c}"></i>`,iconSize:[0,0]}),title:p[0]+" · "+c.n,riseOnHover:true,zIndexOffset:-50});
    m.bindPopup(()=>pop(c,p),{maxWidth:270});
    m.on("click",e=>{if(typeof nearMode!=="undefined"&&nearMode){L.DomEvent.stopPropagation(e);m.closePopup();nearAt(p[1],p[2])}});
    m.__n=p[0];LBL.push(m);g.addLayer(m)}
  G[c.id]=g}
// los nombres, como los del grupo: solo con el mapa cerca
function lbls(){const on=map.getZoom()>=12;for(const m of LBL){if(on&&!m.getTooltip())m.bindTooltip(esc(m.__n),{permanent:true,direction:"right",offset:[10,0],className:"lbl co",interactive:false});else if(!on&&m.getTooltip())m.unbindTooltip()}}
function sync(){for(const c of CO){const on=LAY["co_"+c.id]&&!LAY.solo&&!window.FOLONLY,g=G[c.id];
    if(on&&!map.hasLayer(g))g.addTo(map);else if(!on&&map.hasLayer(g))g.remove();
    const b=document.querySelector(`[data-lay="co_${c.id}"]`);if(b)b.setAttribute("aria-pressed",!!LAY["co_"+c.id])}
  lbls()}
map.on("zoomend",lbls);
document.querySelector(".legend").addEventListener("click",()=>setTimeout(sync,0));
setTimeout(sync,0);
})();
