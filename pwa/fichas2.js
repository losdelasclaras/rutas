/* ---------- ficha única de cumbre y de lugar (nov 2026) ----------
   · El título es lo que has tocado («Peña Ubiña · 2411 m»), no una ruta.
   · Una sola fila de marcas (✓ ★). Si la cumbre la tienen también colaboradores, la marca vale para todos.
   · «Rutas que suben aquí» (o «… que pasan por aquí»), agrupadas por quién las hizo:
     primero el que más rutas tenga; si empatan, Los de las Claras si su ruta es reciente (últimos 2 años); si no, el de la ruta más reciente.
   · Botones: 📤 Compartir · 📍 Google Maps y «··· Más opciones» (Wikiloc por aquí, ☁ el tiempo).
   Para quitarlo: borrar 'fichas2' de la lista del build (vuelven las fichas de antes). */
(function(){
if(typeof pickRoute!=="function")return;
document.head.insertAdjacentHTML("beforeend",`<style>
.fpt-src{margin:14px 0 4px;font-size:14px;font-weight:800;display:flex;align-items:center;gap:8px}
.fpt-src i{display:inline-block;width:12px;height:12px;border-radius:50%;flex:none}
.fpt-alias{margin:-2px 0 8px;color:var(--muted);font-size:14px}
.fpt-none{color:var(--muted)}
</style>`);
const GRP={n:"Los de las Claras",c:"#c3262e"};
const RECIENTE=new Date().getFullYear()-1;
const meteo=(la,lo,a)=>`https://www.meteoblue.com/es/tiempo/semana/${la.toFixed(3)}N${lo.toFixed(3)}E${a?Math.round(a):""}_Europe%2FMadrid`;
const nk=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
const mkCo=(k,cum)=>{const s=MARKS[k]||"",L=cum?["Subida","Quiero subir"]:["He estado","Quiero ir"];
  return `<span class="mk" data-key="${esc(k)}"><button data-mk="hecha" aria-pressed="${s==="hecha"}" title="${L[0]}">✓ ${L[0]}</button><button data-mk="quiero" aria-pressed="${s==="quiero"}" title="${L[1]}">★ ${L[1]}</button></span>`};

function pinta(o){
  // o: {n, a, lat, lon, cum, mk (html), keys:[claves extra], alias:[], src:[{n,c,rows:[html],cnt,y,grp}], foto, gi, solo}
  for(const b of o.blogs||[])if(!o.src.some(x=>x.n===b.n&&x.cnt))o.src.push({n:b.n,c:b.c,cnt:0,y:0,rows:[],chip:1});
  const chips=o.src.filter(x=>x.cnt||x.chip);
  const ord=o.src.filter(x=>x.cnt).sort((A,B)=>B.cnt-A.cnt||((B.grp&&B.y>=RECIENTE)?1:0)-((A.grp&&A.y>=RECIENTE)?1:0)||(B.y||0)-(A.y||0));
  const tot=ord.reduce((t,x)=>t+x.cnt,0);
  const tit=o.cum?"Rutas que suben aquí":"Rutas que pasan por aquí";
  const ae=typeof aemetZone==="function"?aemetZone(o.lat,o.lon):null;
  sheet.classList.remove("full");sheet._cor=null;
  sheet.innerHTML=`<div class="grab"></div>${o.foto?`<div class="photo"><img src="${esc(o.foto)}" alt="" onerror="this.parentNode.remove()"></div>`:""}
  <div class="sheet-head"><h2>${esc(o.n)}</h2><button class="x" aria-label="Cerrar" data-close data-trcox>×</button></div>
  <div class="meta">${o.a?`<span class="tag alt">${fmtA(o.a)}</span>`:""}${chips.sort((A,B)=>(B.cnt||0)-(A.cnt||0)).map(x=>`<span class="tag" style="background:${x.c};color:#fff;border-color:${x.c}">${esc(x.n)}</span>`).join("")}</div>
  ${o.alias.length?`<p class="fpt-alias">También llamada ${o.alias.map(esc).join(", ")}</p>`:""}
  <div class="mkblock fpt" data-ll="${o.lat},${o.lon}"><span>${o.cum?"¿La has subido?":"¿Has estado?"}</span>${o.mk}</div>
  <div class="acts2 fpt">${(o.blogs||[]).length?`<div class="aprim">${o.blogs.map(b=>`<a class="btn ${o.src.some(x=>x.cnt)?"ghost blogb":"primary"}" href="${esc(b.u)}" target="_blank" rel="noopener">${/instagram\.com/i.test(b.u)?"📷 Ver en Instagram":"📖 Leer en "+esc(b.n)}</a>`).join("")}</div>`:""}<div class="ados"><button class="btn ghost" data-ptshare>📤 Compartir</button><a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query=${o.lat},${o.lon}" target="_blank" rel="noopener">📍 Google Maps</a></div>
   <details class="amas"><summary>··· Más opciones</summary><div class="agrid">
    <a class="btn ghost" href="${wkUrl(o.lat,o.lon)}" target="_blank" rel="noopener">🔎 Más rutas por aquí (Wikiloc)</a>
    <a class="btn ghost" href="${meteo(o.lat,o.lon,o.a)}" target="_blank" rel="noopener">☁ Ver el tiempo</a>
    ${ae?`<a class="btn ghost" href="https://www.aemet.es/es/eltiempo/prediccion/montana?w=&p=${ae[0]}" target="_blank" rel="noopener">☁ AEMET montaña · ${ae[1]}</a>`:""}
    <a class="btn ghost" href="https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lon}" target="_blank" rel="noopener">🚗 Cómo llegar</a>
   </div></details></div>
  <div class="sec"><h3>${tit}${tot>1?` (${tot})`:""}</h3>
   ${ord.length?ord.map(x=>`${ord.length>1||!x.grp?`<div class="fpt-src"><i style="background:${x.c}"></i>${esc(x.n)}${x.cnt>1?` · ${x.cnt}`:""}</div>`:""}<div class="rows">${x.rows.join("")}</div>`).join("")
     :`<p class="note fpt-none">${(o.blogs||[]).length?"Todavía no hay ruta con track enlazada; la tienes contada en el blog.":"Este punto todavía no tiene enlazada ninguna ruta."}</p>`}
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
  const src=[{n:GRP.n,c:GRP.c,grp:true,cnt:rs.length,y:Math.max(0,...rs.map(r=>r.y||0)),rows:rs.map(r=>rowHTML(r))}];
  const ms=cum&&window.COLX&&COLX.cumDe?COLX.cumDe(gi):[];
  return junta({n:p.c,a:p.a,lat:p.lat,lon:p.lon,cum,gi,mk:mkBtns(p)||"",main:mkKey(p),src,rs},ms)}
function junta(o,ms){const by={},alias=new Set(),keys=[];let foto=o.rs&&o.rs.find(r=>r.f!=null);foto=foto?`fotos/${foto.f}.jpg`:null;
  o.blogs=o.blogs||[];
  for(const{c,p}of ms){if(nk(p[0])!==nk(o.n))alias.add(p[0]);
    if(p[4]&&/^https?:/.test(p[4])&&!(p[9]||[]).length&&!o.blogs.some(b=>b.n===c.n))o.blogs.push({n:c.n,c:c.c,u:p[4]});
    if(!foto&&p[5]&&/^https?:|\.(jpe?g|png|webp)/i.test(p[5]))foto=p[5];if(o.cum&&COLX.coKey)keys.push(COLX.coKey(c,p[0]));
    const b=by[c.id]||(by[c.id]={n:c.n,c:c.c,cnt:0,y:0,rows:[],vis:new Set()});
    for(const i of (p[9]||[])){if(b.vis.has(i))continue;b.vis.add(i);const it=COLX.rutaItem(c,i);if(!it)continue;b.rows.push(COLX.rrow(it));b.cnt++;b.y=Math.max(b.y,it.y||0);
      if(!foto&&c.r&&c.r[i]&&c.r[i][9])foto=c.r[i][9]}}
  o.src=o.src.concat(Object.values(by));o.alias=[...alias];o.keys=keys.filter(k=>k!==o.main);o.foto=foto;
  const g=o.rs||[];o.solo=g.length===1&&o.src.every(x=>x.grp||!x.cnt)?g[0]:null;
  return o}

window.pickRoute=pickRoute=function(pi){pinta(deGrupo(pi))};
window.FICHAPT={
  co(c,p){const x=COLX.cumCo?COLX.cumCo(p):{gi:null,ms:[{c,p}]};
    if(x.gi!=null){pinta(deGrupo(x.gi));return true}
    // solo de este colaborador y sin rutas con track: su ficha de siempre (descripción, datos y enlace a su entrada)
    if(x.ms.length<=1&&!(p[9]||[]).length)return false;
    const k=COLX.coKey(c,p[0]);
    const o=junta({n:p[0],a:null,lat:p[1],lon:p[2],cum:true,gi:null,mk:mkCo(k,true),main:k,src:[],rs:[]},x.ms.length?x.ms:[{c,p}]);
    pinta(o);return true}};
// una sola marca para todos: cuando se guarda una marca desde esta ficha (con o sin pasar por «entrar con tu cuenta»),
// se copia a la misma cumbre de los colaboradores
{const orig=saveMarks;let dentro=false;
 window.saveMarks=saveMarks=function(){if(!dentro&&!sheet.hidden&&sheet._fptKeys&&sheet._fptKeys.length){const mk=sheet.querySelector(".mkblock.fpt .mk[data-key]");
   if(mk){const v=MARKS[mk.dataset.key]||"";dentro=true;for(const k of sheet._fptKeys){if(v)MARKS[k]=v;else delete MARKS[k]}dentro=false;setTimeout(()=>{if(window.refreshMarks)refreshMarks()},0)}}
   return orig.apply(this,arguments)}}
})();
