/* ---------- ficha única de cumbre y de lugar (nov 2026) ----------
   · El título es lo que has tocado («Peña Ubiña · 2411 m»), no una ruta.
   · Una sola fila de marcas (✓ ★). Si la cumbre la tienen también colaboradores, la marca vale para todos.
   · «Rutas que suben aquí» (o «… que pasan por aquí»), agrupadas por quién las hizo:
     primero el que más rutas tenga; si empatan, Los de las Claras si su ruta es reciente (últimos 2 años); si no, el de la ruta más reciente.
   · 9 nov 2026: sin botones (ni Compartir, ni Google Maps, ni «Más opciones»): las opciones van en la ficha de cada ruta.
   Para quitarlo: borrar 'fichas2' de la lista del build (vuelven las fichas de antes). */
(function(){
if(typeof pickRoute!=="function")return;
document.head.insertAdjacentHTML("beforeend",`<style>
.fpt-src{margin:14px 0 4px;font-size:14px;font-weight:800;display:flex;align-items:center;gap:8px}
.fpt-src i{display:inline-block;width:12px;height:12px;border-radius:50%;flex:none}
.fpt-alias{margin:-2px 0 8px;color:var(--muted);font-size:14px}
.fpt-none{color:var(--muted)}
.fpt-blog{display:flex;align-items:center;text-decoration:none;color:var(--ink)}
.fpt-ruta{margin:12px 0 2px;padding:10px 12px;border:1px solid var(--edge);border-radius:12px;background:var(--card)}
.fpt-ruta small{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:700}
.fpt-ruta b{display:block;font-size:16px;line-height:1.25;margin:2px 0}.fpt-ruta span{font-size:13.5px;color:var(--muted)}
</style>`);
const GRP={n:"Los de las Claras",c:"#c3262e"};
const RECIENTE=new Date().getFullYear()-1;
const meteo=(la,lo,a)=>`https://www.meteoblue.com/es/tiempo/semana/${la.toFixed(3)}N${lo.toFixed(3)}E${a?Math.round(a):""}_Europe%2FMadrid`;
const nk=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
const mkCo=(k,cum)=>{const s=MARKS[k]||"",L=cum?["Subida","Quiero subir"]:["He estado","Quiero ir"];
  return `<span class="mk" data-key="${esc(k)}"><button data-mk="hecha" aria-pressed="${s==="hecha"}" title="${L[0]}">✓ ${L[0]}</button><button data-mk="quiero" aria-pressed="${s==="quiero"}" title="${L[1]}">★ ${L[1]}</button></span>`};

function pinta(o){
  // 9 nov 2026: la ficha de cumbre o lugar es solo para elegir ruta: foto, nombre, altitud, ✓ ★ y las rutas de todos los blogs
  // (cada una abre su ficha, que es donde están Seguir, Compartir, Cómo llegar…). Sin «Más opciones», sin Google Maps ni el tiempo.
  // Si un blog tiene la cumbre pero sin ruta con track, sale el enlace a su entrada.
  const ord=o.src.filter(x=>x.cnt).sort((A,B)=>B.cnt-A.cnt||((B.grp&&B.y>=RECIENTE)?1:0)-((A.grp&&A.y>=RECIENTE)?1:0)||(B.y||0)-(A.y||0));
  const tot=ord.reduce((t,x)=>t+x.cnt,0),bl=(o.blogs||[]).filter(b=>!ord.some(x=>x.n===b.n));
  const tit=o.cum?"Rutas que suben aquí":"Rutas que pasan por aquí";
  sheet.classList.remove("full");sheet._cor=null;
  sheet.innerHTML=`<div class="grab"></div>${o.foto?`<div class="photo"><img src="${esc(o.foto)}" alt="" onerror="this.parentNode.remove()"></div>`:""}
  <div class="sheet-head"><h2>${esc(o.n)}</h2><button class="x" aria-label="Cerrar" data-close data-trcox>×</button></div>
  ${o.a?`<div class="meta"><span class="tag alt">${fmtA(o.a)}</span></div>`:""}
  ${o.alias.length?`<p class="fpt-alias">También llamada ${o.alias.map(esc).join(", ")}</p>`:""}
  <div class="mkblock fpt" data-ll="${o.lat},${o.lon}"><span>${o.cum?"¿La has subido?":"¿Has estado?"}</span>${o.mk}</div>
  <div class="sec fpt-rutas"><h3>${tit}${tot>1?` (${tot})`:""}</h3>
   ${ord.map(x=>`<div class="fpt-src"><i style="background:${x.c}"></i>${esc(x.n)}${x.cnt>1?` · ${x.cnt}`:""}</div><div class="rows">${x.rows.join("")}</div>`).join("")}
   ${bl.map(b=>`<div class="fpt-src"><i style="background:${b.c}"></i>${esc(b.n)}</div><div class="rows"><a class="row fpt-blog" href="${esc(b.u)}" target="_blank" rel="noopener"><div class="t"><b>${/instagram\.com/i.test(b.u)?"📷 Ver en Instagram":"📖 Leer la entrada del blog"}</b><span>Sin track en la app</span></div></a></div>`).join("")}
   ${!ord.length&&!bl.length?`<p class="note fpt-none">Este punto todavía no tiene enlazada ninguna ruta.</p>`:""}
  </div>`;
  sheet._pt={n:o.n,lat:o.lat,lon:o.lon,alt:o.a||null,cum:o.cum,co:""};
  sheet._fptKeys=o.keys;
  if(o.gi!=null)nodes.classed("sel",i=>i===o.gi);else nodes.classed("sel",false);
  if(window.showTrack)showTrack(o.solo||null);{const tp=document.getElementById("trkpill");if(tp)tp.hidden=true}
  if(typeof ensureZone==="function")ensureZone(zoneAt(o.lat,o.lon));
  sheet.hidden=false;sheet.scrollTop=0}

// datos de una cumbre o lugar del grupo (y de los colaboradores que la tengan)
function deGrupo(gi){const p=P[gi];const cum=p.t==="cumbre";
  const rs=(p.rs||[]).filter(ri=>R[ri]&&R[ri].u).map(ri=>R[ri]).sort(byDate);
  const src=[{n:GRP.n,c:GRP.c,grp:true,cnt:rs.length,y:Math.max(0,...rs.map(r=>r.y||0)),rows:rs.map(r=>rowHTML(r)),its:rs.map(r=>({g:r}))}];
  const ms=cum&&window.COLX&&COLX.cumDe?COLX.cumDe(gi):[];
  return junta({n:p.c,a:p.a,lat:p.lat,lon:p.lon,cum,gi,mk:mkBtns(p)||"",main:mkKey(p),src,rs},ms)}
function junta(o,ms){const by={},alias=new Set(),keys=[];let foto=o.rs&&o.rs.find(r=>r.f!=null);foto=foto?`fotos/${foto.f}.jpg`:null;
  o.blogs=o.blogs||[];
  for(const{c,p}of ms){if(nk(p[0])!==nk(o.n))alias.add(p[0]);
    if(p[4]&&/^https?:/.test(p[4])&&!(p[9]||[]).length&&!o.blogs.some(b=>b.n===c.n))o.blogs.push({n:c.n,c:c.c,u:p[4]});
    if(!foto&&p[5]&&/^https?:|\.(jpe?g|png|webp)/i.test(p[5]))foto=p[5];if(o.cum&&COLX.coKey)keys.push(COLX.coKey(c,p[0]));
    const b=by[c.id]||(by[c.id]={n:c.n,c:c.c,cnt:0,y:0,rows:[],its:[],vis:new Set()});
    for(const i of (p[9]||[])){if(b.vis.has(i))continue;b.vis.add(i);const it=COLX.rutaItem(c,i);if(!it)continue;b.rows.push(COLX.rrow(it));b.its.push({c,i});b.cnt++;b.y=Math.max(b.y,it.y||0);
      if(!foto&&c.r&&c.r[i]&&c.r[i][9])foto=c.r[i][9]}}
  o.src=o.src.concat(Object.values(by));o.alias=[...alias];o.keys=keys.filter(k=>k!==o.main);o.foto=foto;
  const g=o.rs||[];o.solo=g.length===1&&o.src.every(x=>x.grp||!x.cnt)?g[0]:null;
  return o}

window.pickRoute=pickRoute=function(pi){pinta(deGrupo(pi))};
// las rutas de los colaboradores de la ficha se abren al tocarlas (como las del grupo)
sheet.addEventListener("click",e=>{const cr=e.target.closest(".fpt-rutas [data-cor]");if(cr&&window.COLX){e.stopPropagation();if(!(COLX.abrirRuta&&COLX.abrirRuta(+cr.dataset.cor)))COLX.open(+cr.dataset.cor)}});
window.FICHAPT={
  co(c,p,kd){const cum=!kd||kd==="cumbre";   // 9 nov 2026: también los lugares de los colaboradores
    const x=cum&&COLX.cumCo?COLX.cumCo(p):{gi:null,ms:[{c,p}]};
    if(x.gi!=null){pinta(deGrupo(x.gi));return true}
    const k=cum?COLX.coKey(c,p[0]):(COLX.coKeyK?COLX.coKeyK(c,p[0],kd):COLX.coKey(c,p[0]));
    const o=junta({n:p[0],a:cum&&COLX.alt?COLX.alt(p):null,lat:p[1],lon:p[2],cum,gi:null,mk:mkCo(k,cum),main:k,src:[],rs:[]},x.ms.length?x.ms:[{c,p}]);
    pinta(o);return true}};
// una sola marca para todos: cuando se guarda una marca desde esta ficha (con o sin pasar por «entrar con tu cuenta»),
// se copia a la misma cumbre de los colaboradores
{const orig=saveMarks;let dentro=false;
 window.saveMarks=saveMarks=function(){if(!dentro&&!sheet.hidden&&sheet._fptKeys&&sheet._fptKeys.length){const mk=sheet.querySelector(".mkblock.fpt .mk[data-key]");
   if(mk){const v=MARKS[mk.dataset.key]||"";dentro=true;for(const k of sheet._fptKeys){if(v)MARKS[k]=v;else delete MARKS[k]}dentro=false;setTimeout(()=>{if(window.refreshMarks)refreshMarks()},0)}}
   return orig.apply(this,arguments)}}
})();
