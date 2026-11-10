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
/* 10 nov 2026: las rutas de la ficha de una cumbre o un lugar se ven como botones (antes no parecía que se pudieran tocar) */
.fpt-rutas .rows>.row{position:relative;border:1.5px solid var(--edge,#ccc)!important;border-radius:12px;background:var(--card);margin:0 0 8px;padding:10px 10px 40px 10px!important;box-shadow:0 1px 3px rgba(0,0,0,.08);transition:background .15s,transform .1s}
.fpt-rutas .rows>.row::before{content:"";position:absolute;left:0;right:0;bottom:0;height:34px;border-top:1px solid var(--edge,#ddd);border-radius:0 0 11px 11px;background:rgba(195,38,46,.05)}
.fpt-rutas .rows>.row::after{content:"Ver ruta ›";position:absolute;right:12px;bottom:10px;color:#c3262e;font-weight:800;font-size:15px;white-space:nowrap}
.fpt-rutas .rows>.row:active{background:rgba(195,38,46,.12);transform:scale(.99)}
.fpt-rutas .rows>.row .fpth{position:absolute;left:10px;bottom:11px;font-size:12.5px;font-weight:700;color:#c3262e;font-style:normal}
.fpt-rutas .fpttoca{margin:-2px 0 10px;font-size:14px;color:var(--muted)}
@media (prefers-color-scheme:dark){.fpt-rutas .rows>.row::after,.fpt-rutas .rows>.row .fpth{color:#ff7a7f}}
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

// 9 nov 2026: una entrada de blog sin track (p. ej. Camudando'l camín) es una ruta más: fila con su nombre y su ficha sencilla
const tituloBlog=b=>((b.co&&b.co.bt)||{})[b.u]||decodeURIComponent((/\/([^\/]+?)(?:\.html?)?\/?$/.exec(b.u)||[,""])[1]).replace(/[-_]+/g," ").replace(/^./,m=>m.toUpperCase())||b.n;
function rowBlog(b,i,y){const fo=b.p&&b.p[5];
  return `<button class="row src-co" style="--cc:${b.c}" data-fbl="${i}">${fo?`<img class="thumb" src="${esc(fo)}" alt="" loading="lazy">`:""}<div class="t"><b>${esc(tituloBlog(b))}</b><span><em class="cosrc" style="color:${b.c}">${esc(b.n)}</em>${y?" · "+y:""} · Sin track</span></div></button>`}
function fichaBlog(i){const F=sheet._fbl;if(!F)return;const b=F.bl[i],o=F.o;if(!b)return;const y=(/\/(20\d\d)\//.exec(b.u)||[])[1],fo=b.p&&b.p[5];
  // las cumbres de esta entrada: los puntos (de cualquier blog) que enlazan a ella
  const cums=[];if(window.COLX)for(const x of COLX.todo())if(x.pp&&x.pp[4]===b.u&&!cums.some(z=>z.pp===x.pp))cums.push(x);
  sheet.classList.remove("full");sheet._cor=null;sheet._fblBack=o;
  // 9 nov 2026: ficha de ruta unificada (ficharuta.js)
  if(window.FRUTA){const ym=/\/(20\d\d)\/(\d\d)\//.exec(b.u);
    sheet.innerHTML=FRUTA.pinta({grab:"",foto:fo,quien:b.n||"",y:y?+y:null,m:ym?+ym[2]:null,titulo:tituloBlog(b),blog:b.u,
      share:`data-frshu="${esc(b.u)}" data-frsht="${esc(tituloBlog(b))}"`,
      cumbres:cums.map(x=>({n:x.c,a:x.a||null,k:x.co&&COLX.coKey?COLX.coKey(x.co,x.c):null})),close:" data-trcox"});
    sheet.hidden=false;sheet.scrollTop=0;if(window.showTrack)showTrack(null);return}
  sheet.innerHTML=`<div class="grab"></div>${fo?`<div class="photo"><img src="${esc(fo)}" alt="" onerror="this.parentNode.remove()"></div>`:""}
  ${tipoHTML("ruta",b.n||"")}<div class="sheet-head"><h2>${esc(tituloBlog(b))}</h2><button class="x" aria-label="Cerrar" data-close data-trcox>×</button></div>
  ${y?`<div class="meta"><span class="tag">${y}</span></div>`:""}
  <div class="acts2 fbl"><div class="aprim"><a class="btn primary" href="${esc(b.u)}" target="_blank" rel="noopener">📖 Leer en ${esc(b.n)}</a></div></div>
  <p class="note">Esta ruta no tiene track en la app: está contada en el blog.</p>
  <div class="sec"><h3>${cums.length>1?"Cumbres de esta ruta":"Cumbre de esta ruta"}</h3><div class="rows">${(cums.length?cums:[null]).map((x,k)=>`<button class="row" data-fblc="${x?x.ci:""}"><div class="t"><b>${esc(x?x.c:o.n)}</b><span>${o.cum?"Cumbre":"Lugar"}</span></div></button>`).join("")}</div></div>`;
  sheet.hidden=false;sheet.scrollTop=0;if(window.showTrack)showTrack(null)}
sheet.addEventListener("click",e=>{if(e.target.closest(".fpt-rutas .rows>.row"))try{localStorage.setItem("ldc-fpttoca","1")}catch(er){}},true);
sheet.addEventListener("click",e=>{const f=e.target.closest(".fpt-rutas [data-fbl]");if(f){e.stopPropagation();fichaBlog(+f.dataset.fbl);return}
  const c=e.target.closest("[data-fblc]");if(c){e.stopPropagation();const ci=c.dataset.fblc;if(ci!==""&&window.COLX)COLX.open(+ci);else if(sheet._fblBack)pinta(sheet._fblBack)}});
function pinta(o){
  // 9 nov 2026: la ficha de cumbre o lugar es solo para elegir ruta: foto, nombre, altitud, ✓ ★ y las rutas de todos los blogs
  // (cada una abre su ficha, que es donde están Seguir, Compartir, Cómo llegar…). Sin «Más opciones», sin Google Maps ni el tiempo.
  // Si un blog tiene la cumbre pero sin ruta con track, sale el enlace a su entrada.
  // las entradas de blog sin track también son rutas: con su nombre, en el grupo de su blog
  o=Object.assign({},o,{src:o.src.map(x=>Object.assign({},x,{rows:x.rows.slice()}))});   // copia: se puede volver a pintar (← desde la ficha de una entrada)
  const bl=(o.blogs||[]).filter(b=>!/instagram\.com/i.test(b.u));
  for(const[i,b]of bl.entries()){let x=o.src.find(y=>y.n===b.n);if(!x)o.src.push(x={n:b.n,c:b.c,cnt:0,y:0,rows:[],its:[]});
    const y=(/\/(20\d\d)\//.exec(b.u)||[])[1];x.rows.push(rowBlog(b,i,y));x.cnt++;x.y=Math.max(x.y||0,+y||0)}
  const ord=o.src.filter(x=>x.cnt).sort((A,B)=>B.cnt-A.cnt||((B.grp&&B.y>=RECIENTE)?1:0)-((A.grp&&A.y>=RECIENTE)?1:0)||(B.y||0)-(A.y||0));
  const tot=ord.reduce((t,x)=>t+x.cnt,0);
  const tit=o.cum?"Rutas que suben aquí":"Rutas que pasan por aquí";
  sheet._fbl={o,bl};
  sheet.classList.remove("full");sheet._cor=null;
  sheet.innerHTML=`<div class="grab"></div>${o.foto?`<div class="photo"><img src="${esc(o.foto)}" alt="" onerror="this.parentNode.remove()"></div>`:""}
  ${tipoHTML(o.cum||o.a?"cumbre":"lugar","")}<div class="sheet-head"><h2>${esc(o.n)}</h2><button class="x" aria-label="Cerrar" data-close data-trcox>×</button></div>
  ${o.a?`<div class="meta"><span class="tag alt">${fmtA(o.a)}</span></div>`:""}
  ${o.alias.length?`<p class="fpt-alias">También llamada ${o.alias.map(esc).join(", ")}</p>`:""}
  <div class="mkblock fpt" data-ll="${o.lat},${o.lon}"><span>${o.cum?"¿La has subido?":"¿Has estado?"}</span>${o.mk}</div>
  <div class="sec fpt-rutas"><h3>${tit}${tot>1?` (${tot})`:""}</h3>
   ${ord.map(x=>`<div class="fpt-src"><i style="background:${x.c}"></i>${esc(x.n)}${x.cnt>1?` · ${x.cnt}`:""}</div><div class="rows">${x.rows.join("")}</div>`).join("")}
   ${!ord.length?`<p class="note fpt-none">Este punto todavía no tiene enlazada ninguna ruta.</p>`:""}
  </div>`;
  sheet._pt={n:o.n,lat:o.lat,lon:o.lon,alt:o.a||null,cum:o.cum,co:""};
  sheet._fptKeys=o.keys;
  // qué hay detrás de cada ruta (en letra pequeña) y, hasta que se toque una, cómo usar la lista
  sheet.querySelectorAll(".fpt-rutas .rows>.row").forEach(b=>{const t=b.querySelector(".t")||b;if(t.querySelector(".fpth"))return;
    let trk=!!b.dataset.cor;if(b.dataset.r!=null){const r=R[+b.dataset.r];trk=!!(r&&r.gx)}
    t.insertAdjacentHTML("beforeend",`<em class="fpth">${trk?"Track · Perfil · Seguir":"Entrada del blog"}</em>`)});
  {let vis=false;try{vis=localStorage.getItem("ldc-fpttoca")==="1"}catch(e){}
    const h=sheet.querySelector(".fpt-rutas>h3");if(h&&!vis&&sheet.querySelector(".fpt-rutas .rows>.row"))h.insertAdjacentHTML("afterend",`<p class="fpttoca">👆 Toca una ruta para ver su track, perfil y cómo seguirla.</p>`)}
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
    if(p[4]&&/^https?:/.test(p[4])&&!(p[9]||[]).length&&!o.blogs.some(b=>b.u===p[4]))o.blogs.push({n:c.n,c:c.c,u:p[4],co:c,p});
    if(!foto&&p[5]&&/^https?:|\.(jpe?g|png|webp)/i.test(p[5]))foto=p[5];if(o.cum&&COLX.coKey)keys.push(COLX.coKey(c,p[0]));
    const b=by[c.id]||(by[c.id]={n:c.n,c:c.c,cnt:0,y:0,rows:[],its:[],vis:new Set()});
    for(const i of (p[9]||[])){if(b.vis.has(i))continue;b.vis.add(i);const it=COLX.rutaItem(c,i);if(!it)continue;b.rows.push(COLX.rrow(it));b.its.push({c,i});b.cnt++;b.y=Math.max(b.y,it.y||0);
      if(!foto&&c.r&&c.r[i]&&c.r[i][9])foto=c.r[i][9]}}
  // 10 nov 2026: y las rutas de cualquier colaborador cuyo track pasa por la cumbre, aunque no tenga el punto en su mapa
  if(o.cum&&COLX.pasan){const ks=[];if(o.gi!=null)ks.push("g"+o.gi);for(const{c,p}of ms){const j=c.p.indexOf(p);if(j>=0)ks.push(c.id+":"+j)}
    for(const k of ks)for(const{c,i}of COLX.pasan(k)){const b=by[c.id]||(by[c.id]={n:c.n,c:c.c,cnt:0,y:0,rows:[],its:[],vis:new Set()});if(b.vis.has(i))continue;b.vis.add(i);
      const it=COLX.rutaItem(c,i);if(!it)continue;b.rows.push(COLX.rrow(it));b.its.push({c,i});b.cnt++;b.y=Math.max(b.y,it.y||0);if(!foto&&c.r&&c.r[i]&&c.r[i][9])foto=c.r[i][9]}}
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
