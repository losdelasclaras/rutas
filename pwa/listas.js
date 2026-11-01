/* ---------- Mis cosas › ★ Mis listas: todo lo marcado (cumbres, lugares y rutas, del grupo y de los colaboradores) + resumen ---------- */
(function(){
const box=document.createElement("div");box.className="mpbox";box.id="mlbox";box.hidden=true;document.body.appendChild(box);
document.head.insertAdjacentHTML("beforeend",`<style>
#mlbox .mlbig{display:flex;align-items:baseline;gap:8px;margin:4px 0 2px}#mlbox .mlbig b{font-size:38px;line-height:1;font-family:var(--f-display)}#mlbox .mlbig span{color:var(--muted);font-weight:600}
#mlbox .mlbar{height:9px;border-radius:5px;background:#e9ece6;overflow:hidden;margin:4px 0 8px}#mlbox .mlbar i{display:block;height:100%;background:var(--moss,#2a7a3b)}
#mlbox h3{font-size:15px;margin:18px 0 6px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
#mlbox .mlacts{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 4px}
#mlbox details.mlres{margin:6px 0 4px;border:1px solid var(--edge);border-radius:12px;padding:6px 12px}#mlbox details.mlres summary{font-weight:700;cursor:pointer;padding:6px 0}
#mlbox details.mlres #resbox{border:0;padding:0;margin:0;box-shadow:none;background:none}#mlbox details.mlres #resbox>h2{display:none}
#mlbox .crow .dkm{color:var(--ink)}
#mlbox .crow .thumb{width:34px!important;height:34px!important;min-width:34px;border-radius:8px;object-fit:cover;position:static!important;display:block}
.rmk{margin:10px 0 4px}
</style>`);
let MODE="quiero",POS=null;
const ckey=p=>(p.co?"@"+p.co.id:"");
window.rKey=r=>"r:"+(slug(r)||("id"+r.id));
// botones ✓/★ en la ficha de cada ruta del grupo
window.rMk=r=>{if(!r.u)return"";const k=rKey(r),s=MARKS[k]||"";
  return `<div class="mkblock rmk"><span>Esta ruta</span><span class="mk" data-key="${esc(k)}"><button data-mk="hecha" aria-pressed="${s==="hecha"}" title="Hecha">✓ Hecha</button><button data-mk="quiero" aria-pressed="${s==="quiero"}" title="Quiero hacerla">★ Quiero hacerla</button></span></div>`};
function items(){const out={cumbre:[],lugar:[],ruta:[]};
  const isR=p=>p.co&&window.COLX&&COLX.isRuta&&COLX.isRuta(p.ci);
  for(const p of (typeof PEAKS!=="undefined"?PEAKS:[])){const k="c:"+norm(p.c)+ckey(p);if(MARKS[k])out.cumbre.push({p,k,m:MARKS[k],t:"cumbre"})}
  for(const p of (typeof SPOTS!=="undefined"?SPOTS:[])){const k="l:"+norm(p.c)+ckey(p);if(MARKS[k])(isR(p)?out.ruta:out.lugar).push({p,k,m:MARKS[k],t:isR(p)?"cruta":"lugar"})}
  for(const r of R){if(!r.u)continue;const k=rKey(r);if(MARKS[k])out.ruta.push({r,k,m:MARKS[k],t:"ruta",lat:r.lat,lon:r.lon})}
  return out}
const pend=()=>{const o=items();return o.cumbre.concat(o.lugar,o.ruta).filter(x=>x.m==="quiero").length};
function fila(x,i){const p=x.p,r=x.r,s=x.m,lat=p?p.lat:r.lat,lon=p?p.lon:r.lon,d=POS?km(POS,{lat,lon}):null;
  const dd=d!=null?`<b class="dkm">${d<10?d.toFixed(1).replace(".",","):d.toFixed(0)} km</b> · `:"";
  const L=x.t==="cumbre"?["Subida","Quiero subir"]:x.t==="ruta"?["Hecha","Quiero hacerla"]:["He estado","Quiero ir"];
  const ico=p?(p.co?COLX.ico(p):ICO(x.t==="cumbre"?"cumbre":p.cat)):thumbHTML(r);
  const tit=p?p.c:routeTitle(r),sub=p?(window.COLX?COLX.src(p):"")+esc(x.t==="cumbre"&&p.a?fmtA(p.a)+" · "+p.r:p.r):esc((r.y?(r.m?MESES[r.m]+" ":"")+r.y+" · ":"")+r.r);
  return `<div class="row crow${s?" is-"+s:""}${p&&window.COLX?COLX.cls(p):r?" src-g":""}">${ico}<div class="t"><b>${esc(tit)}</b><span>${dd}${sub}</span></div>
   <span class="mk" data-key="${esc(x.k)}"><button data-mk="hecha" aria-pressed="${s==="hecha"}" title="${L[0]}">✓</button><button data-mk="quiero" aria-pressed="${s==="quiero"}" title="${L[1]}">★</button><button data-lopen="${i}" title="Ver">Ver</button></span></div>`}
let LAST=[];
function render(){if(box.hidden)return;const o=items(),all=o.cumbre.concat(o.lugar,o.ruta);
  const nC=(typeof PEAKS!=="undefined"?PEAKS:[]).length,hc=o.cumbre.filter(x=>x.m==="hecha").length;
  const sel=l=>{let v=l.filter(x=>x.m===MODE);if(POS)v=v.slice().sort((a,b)=>km(POS,a.p||a.r)-km(POS,b.p||b.r));return v};
  LAST=[];const sec=(t,l)=>{const v=sel(l);if(!v.length)return"";return `<h3>${t} · ${v.length}</h3><div class="rows">${v.map(x=>{LAST.push(x);return fila(x,LAST.length-1)}).join("")}</div>`};
  const body=sec("⛰️ Cumbres",o.cumbre)+sec("🏞️ Lugares",o.lugar)+sec("🥾 Rutas",o.ruta);
  const nq=all.filter(x=>x.m==="quiero").length,nh=all.filter(x=>x.m==="hecha").length;
  box.innerHTML=`<h2>★ Mis listas</h2>
  <div class="mlbig"><b>${hc}</b><span>cumbres subidas de ${nC}</span></div><div class="mlbar"><i style="width:${nC?(hc/nC*100).toFixed(1):0}%"></i></div>
  <details class="mlres"${box._res?" open":""}><summary>🏆 Ver el resumen completo</summary><div id="mlresin"></div></details>
  <div class="chips" style="margin:12px 0 4px"><button class="chip" data-lmode="quiero" aria-pressed="${MODE==="quiero"}">★ Pendientes · ${nq}</button><button class="chip" data-lmode="hecha" aria-pressed="${MODE==="hecha"}">✓ Hechas · ${nh}</button></div>
  <div class="mlacts"><button class="btn ghost" data-lnear>${POS?"🎯 Ordenado por cercanía":"🎯 Ordenar por cercanía"}</button>${MODE==="quiero"&&nq?`<button class="btn primary" data-lmap>🗺 Ver pendientes en el mapa</button>`:""}</div>
  ${body||`<p class="empty">${MODE==="quiero"?"Aún no tienes nada en «quiero ir». Márcalo con ★ en el mapa, en Cumbres, en Lugares o en la ficha de una ruta.":"Aún no has marcado nada como hecho. Usa ✓ en el mapa, en Cumbres, en Lugares o en la ficha de una ruta."}</p>`}`;
  if(window.RESUMEN&&box._res){const rb=RESUMEN.box;document.getElementById("mlresin").appendChild(rb);rb.hidden=false;RESUMEN.render()}}
box.addEventListener("toggle",e=>{if(!e.target.matches("details.mlres"))return;box._res=e.target.open;if(box._res&&window.RESUMEN){const rb=RESUMEN.box;document.getElementById("mlresin").appendChild(rb);rb.hidden=false;RESUMEN.render()}},true);
box.addEventListener("click",e=>{
  const m=e.target.closest("[data-lmode]");if(m){MODE=m.dataset.lmode;render();return}
  if(e.target.closest("[data-lnear]")){if(POS){POS=null;render();return}if(!navigator.geolocation){toast("Este móvil no da la ubicación");return}toast("Buscando dónde estás…");
    navigator.geolocation.getCurrentPosition(p=>{POS={lat:p.coords.latitude,lon:p.coords.longitude};render()},()=>toast("No he podido saber dónde estás."),{enableHighAccuracy:true,timeout:12000,maximumAge:300000});return}
  if(e.target.closest("[data-lmap]")){const v=LAST.filter(x=>x.m==="quiero");if(!v.length)return;showView("mapa");LAY.mq=true;
    const b=L.latLngBounds(v.map(x=>[(x.p||x.r).lat,(x.p||x.r).lon]));setTimeout(()=>{map.fitBounds(b.pad(.15),{maxZoom:13});if(window.refreshMarks)refreshMarks()},120);return}
  const o=e.target.closest("[data-lopen]");if(o){const x=LAST[+o.dataset.lopen];if(!x)return;
    if(x.r){ovShow({t:"route",id:x.r.id});return}
    const p=x.p;if(p.co){COLX.open(p.ci);return}
    const rs=(P[p.i].rs||[]).filter(i=>R[i].u);if(rs.length)ovShow(rs.length>1?{t:"pt",i:p.i}:{t:"route",id:rs[0]});else{showView("mapa");setTimeout(()=>flyTo(p.lat,p.lon,10),100)}}});
// al marcar o desmarcar en cualquier sitio, la lista se pone al día
document.addEventListener("click",e=>{if(e.target.closest("[data-mk]"))setTimeout(()=>{render();if(window.LISTAS_CNT)LISTAS_CNT()},0)});
// también al cambiar las marcas desde la cuenta (otro móvil) y al entrar en Mis cosas
for(const f of ["renderCols","showView"]){const o=window[f];if(typeof o==="function")window[f]=function(){const r=o.apply(this,arguments);try{render();if(window.LISTAS_CNT)LISTAS_CNT()}catch(e){}return r}}
window.LISTAS={box,render,pend};
})();
