/* ---------- 🥾 Ficha de ruta unificada (9 nov 2026, acordada con él y enseñada a los colaboradores) ----------
   La misma ficha para las rutas del grupo, las de los colaboradores y las entradas de blog sin track:
     foto · «🥾 RUTA · <de quién>» + fecha · título · ✓ Hecha / ★ Quiero hacerla · Desnivel · Distancia · Dificultad (solo los que haya)
     · aviso si la ruta tiene más de 5 años (amarillo) o de 10 (naranja) · 📖 Leer en el blog · ▶ Seguir (si hay track) · ··· Más opciones
     (☆ Guardar ruta · 〰️ Guardar track · 📤 Compartir · 🚗 Cómo llegar al inicio; los dos de track solo si lo hay)
     · Perfil (si hay track) · Cumbres de la ruta (✓ Subida / ★ Quiero subir) · Otras rutas por la zona.
   Fuera: descripción, Wikiloc, Google Maps, el tiempo, la línea «Salida», las etiquetas sueltas, GPX y reloj.
   · «Guardar ruta»: queda en Mis cosas como RUTA (con su recorrido dentro para verla sin datos) y al abrirla sale esta ficha.
   · «Guardar track»: una copia del recorrido como track tuyo (se puede renombrar, editar y exportar). */
(function(){
const MPI=window.MISPUNTOS;
document.head.insertAdjacentHTML("beforeend",`<style>
.fru .frtop{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:4px}
.fru .frtop .tipo{margin:0}
.fru .frfe{font-weight:700;color:var(--muted);font-size:15px;white-space:nowrap}
.fru .rmk{margin:8px 0 4px;background:none!important;border:0!important;padding:0!important}.fru .rmk>span:first-child{display:none}
.fru .rmk .mk{display:flex;gap:8px;width:100%}.fru .rmk .mk button{flex:1;min-height:46px;font-size:16px}
.fru .ficha{margin:10px 0 6px}
.frav{border-radius:12px;margin:8px 0;line-height:1.3}
.frav summary{list-style:none;cursor:pointer;padding:10px 12px;font-weight:700;font-size:15px}.frav summary::-webkit-details-marker{display:none}
.frav p{margin:0;padding:0 12px 10px;font-size:14px}
.frav.y{background:#fff4c2;color:#5c4400;border:1px solid #e9cf5c}
.frav.o{background:#ffe1c7;color:#6b2c00;border:1px solid #f0a35e}
.fracts{display:flex;gap:8px;margin:12px 0 8px}
.fracts>*{flex:1 1 0;min-width:0;min-height:52px;display:flex;align-items:center;justify-content:center;margin:0;padding:8px 6px;box-sizing:border-box;font-size:16px;font-weight:800;text-align:center;line-height:1.15}
.fracts .frmasb{flex:0 0 58px;font-size:24px;letter-spacing:1px}
.fracts .frseg{border:0;color:#fff;background:var(--ink)}
.fracts .frmasb{border:1.5px solid var(--edge,#bbb);background:var(--card);color:var(--ink)}
/* «··· Más opciones»: hoja que sube desde abajo, como en el tablero */
.frvel{position:fixed;inset:0;background:rgba(20,26,23,.5);z-index:3000}
.frmas{position:fixed;left:0;right:0;bottom:0;z-index:3001;background:var(--card,#fff);border-radius:18px 18px 0 0;padding:10px 16px calc(22px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:6px;box-shadow:0 -6px 24px rgba(0,0,0,.25);max-width:640px;margin:0 auto}
.frmas[hidden],.frvel[hidden]{display:none!important}
.frmas .ag{width:44px;height:5px;border-radius:9px;background:var(--edge,#bbb);align-self:center;margin-bottom:6px}
.frmas h3{margin:0 0 4px;font-size:20px}
.frmas>.btn{display:flex;align-items:center;justify-content:flex-start;gap:12px;width:100%;min-height:56px;margin:0;padding:8px 14px;box-sizing:border-box;font-size:17px;font-weight:700;text-align:left;border:0;background:var(--paper,#f4f6f2);border-radius:12px;color:var(--ink)}
.frmas>.btn small{display:block;font-weight:400;color:var(--muted);font-size:13px}
.frmas>.btn span{display:flex;flex-direction:column}
/* otras rutas: filas sencillas (nombre · de quién · km · desnivel) */
.frol{display:flex;flex-direction:column;border:1px solid var(--edge,#ddd);border-radius:12px;background:var(--card);overflow:hidden}
.frol button{display:flex;align-items:center;gap:10px;width:100%;min-height:56px;padding:10px 12px;border:0;border-top:1px solid var(--edge,#e4e4e4);background:none;color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.frol button:first-child{border-top:0}
.frol b{display:block;font-size:16px;line-height:1.2}.frol small{display:block;color:var(--muted);font-size:13.5px;margin-top:2px}
.frol .ch{margin-left:auto;color:var(--muted);font-size:20px}
.frcum .frc{border:1px solid var(--edge,#ddd);border-radius:12px;padding:10px 12px;margin:0 0 8px;background:var(--card)}
.frcum .frc .n{display:flex;justify-content:space-between;gap:8px;font-weight:700;font-size:16px}
.frcum .frc .n em{font-style:normal;font-weight:600;color:var(--muted);white-space:nowrap}
.frcum .frc .mk{display:flex;gap:8px;margin-top:8px}.frcum .frc .mk button{flex:1;min-height:44px;font-size:15px}
.fru .frtrk[hidden]{display:none!important}
html.pc .fru .frseg{display:none!important}
</style>`);
const gRL=on=>on?"★ <span>Ruta guardada<small>En Mis cosas · toca para quitarla</small></span>":"☆ <span>Guardar ruta<small>En Mis cosas, para encontrarla luego</small></span>";
const MES=typeof MESES!=="undefined"?MESES:[];
const cap=s=>s?s[0].toUpperCase()+s.slice(1):"";
const mk2=(k,L)=>{const s=MARKS[k]||"";return`<span class="mk" data-key="${esc(k)}"><button data-mk="hecha" aria-pressed="${s==="hecha"}" title="${L[0]}">✓ ${L[0]}</button><button data-mk="quiero" aria-pressed="${s==="quiero"}" title="${L[1]}">★ ${L[1]}</button></span>`};
// años desde la ruta (con el mes si se sabe)
function anos(y,m){if(!y)return 0;const n=new Date();return (n.getFullYear()+n.getMonth()/12)-(y+((m||6)-1)/12)}
function aviso(y,m){const a=anos(y,m);if(a<=5)return"";const o=a>10;
  return`<details class="frav ${o?"o":"y"}"><summary>${o?`⛔ Ruta de ${y}: información antigua, comprueba el estado antes de ir.`:`⚠️ Ruta de ${y}: el camino puede haber cambiado.`}</summary><p>No garantizamos el estado actual de caminos, pasos y señales: pueden haber cambiado desde que se hizo la ruta (argayos, cierres, vegetación…). Infórmate antes de ir.</p></details>`}
/* d = {grab, foto, quien, y, m, titulo, mk, de, km, dif, blog, seguir, trk, gRuta, gRutaOn, gTrack, share, llegar, perfil, cumbres:[{n,a,k}], otras, close} */
function pinta(d){
  const dat=[["Desnivel",d.de],["Distancia",d.km],["Dificultad",d.dif]].filter(x=>x[1]);
  const t=d.trk?"":" hidden";   // lo que depende del track (colaboradores: se enseña al llegar su track)
  return`${d.grab!=null?`<div class="grab"${d.grab}></div>`:""}${d.foto?`<div class="photo"><img src="${esc(d.foto)}" alt="" onerror="this.parentNode.remove()"></div>`:""}
  <div class="fru">
  <div class="frtop">${tipoHTML("ruta",d.quien||"")}</div>
  <div class="sheet-head"><h2>${esc(d.titulo)}</h2><button class="x" aria-label="Cerrar" data-close${d.close||""}>×</button></div>
  ${d.mk||""}
  ${dat.length?`<div class="ficha" style="grid-template-columns:repeat(${dat.length},1fr)">${dat.map(([l,v])=>`<div><b>${esc(v)}</b><span>${l}</span></div>`).join("")}</div>`:""}
  ${aviso(d.y,d.m)}
  <div class="fracts">${d.blog?`<a class="btn primary" href="${esc(d.blog)}" target="_blank" rel="noopener">📖 Leer en el blog</a>`:""}${d.seguir?`<button class="btn ghost frseg frtrk" ${d.seguir}${t}>▶ Seguir</button>`:""}<button class="btn ghost frmasb" data-frmas aria-expanded="false" aria-label="Más opciones" title="Más opciones">···</button></div>
  <div class="frvel" data-frx hidden></div><div class="frmas" hidden><div class="ag"></div><h3>Más opciones</h3>
    ${d.gRuta?`<button class="btn ghost" ${d.gRuta}>${gRL(d.gRutaOn)}</button>`:""}
    ${d.gTrack?`<button class="btn ghost frtrk" ${d.gTrack}${t}>〰️ <span>Guardar track<small>Copia en Mis cosas, para usar sin cobertura</small></span></button>`:""}
    ${d.share?`<button class="btn ghost" ${d.share}>📤 Compartir</button>`:""}
    <a class="btn ghost frtrk frlleg"${d.llegar?` href="https://www.google.com/maps/dir/?api=1&destination=${d.llegar[0]},${d.llegar[1]}"`:""} target="_blank" rel="noopener"${d.llegar?"":" hidden"}>🚗 Cómo llegar al inicio</a>
  </div>
  <div class="frperf">${d.perfil||""}</div>
  ${d.cumbres&&d.cumbres.length?`<div class="sec frcum"><h3>${d.cumbres.length>1?"Cumbres de la ruta":"Cumbre de la ruta"}</h3>${d.cumbres.map(c=>`<div class="frc"><div class="n"><span>${esc(c.n)}</span>${c.a?`<em>${Number(c.a).toLocaleString("es-ES")} m</em>`:""}</div>${c.k?mk2(c.k,["Subida","Quiero subir"]):""}</div>`).join("")}</div>`:""}
  <div class="frotr">${d.otras?`<div class="sec"><h3>Otras rutas por la zona</h3>${d.otras}</div>`:""}</div>
  </div>`}
const perfilHTML=(g,suyo)=>g&&g.pf&&g.pf.length?`<div class="sec"><h3>Perfil</h3>${profSVG(g)}<p class="note" style="margin:4px 0 8px">Según ${suyo?"su":"el"} track: ${fmtKm(g.km)} · +${Number(g.up).toLocaleString("es-ES")} m de subida${g.mx?" · punto más alto "+Number(g.mx).toLocaleString("es-ES")+" m":""}.</p></div>`:"";
// otras rutas por la zona: del grupo y de los colaboradores, a menos de 25 km de la salida
function otras(lat,lon,sinR,sinCo){const dk=(a,b,c,e)=>Math.hypot((a-c)*111.2,(b-e)*111.2*Math.cos(a*Math.PI/180));
  const ng=(typeof nearestRoutes==="function"?sortNear(nearestRoutes(lat,lon,3,sinR==null?-1:sinR)):[]).filter(x=>x.d<25);
  const RU=window.COLX&&COLX.rut?COLX.rut():[];
  const nc=RU.filter(x=>x!==sinCo&&x.lat!=null).map(x=>({r:x,d:dk(lat,lon,x.lat,x.lon)})).filter(x=>x.d<25).sort((a,b)=>a.d-b.d).slice(0,3);
  const sz=t=>String(t||"").split("|").pop().trim(),vis=new Set(),fila=(at,t,q,km,de,c)=>{const k=nrm(sz(t));if(vis.has(k))return"";vis.add(k);
    return`<button ${at}><span><b>${esc(sz(t))}</b><small><span style="color:${c};font-weight:700">${esc(q)}</span>${[km,de].filter(Boolean).map(x=>" · "+esc(x)).join("")}</small></span><span class="ch" aria-hidden="true">›</span></button>`};
  if(otras.yo)vis.add(nrm(sz(otras.yo)));otras.yo=null;
  const h=ng.map(x=>fila(`data-r="${x.r.id}"`,routeTitle(x.r),"Los de las Claras",x.r.km?fmtKm(x.r.km):"",x.r.de?"+"+x.r.de.toLocaleString("es-ES")+" m":"","#c3262e")).join("")
    +nc.map(x=>fila(`data-frco="${x.r.ci}"`,x.r.c,x.r.co.n,x.r.km||"",x.r.de?(/^\+/.test(x.r.de)?x.r.de:"+"+x.r.de):"",x.r.co.c)).join("");
  return h?`<div class="frol">${h}</div>`:""}
const nrm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();

/* ---- rutas del grupo: routeBody (lo usa openRoute y la vista a pantalla completa) ---- */
routeBody=function(r){
  const pts=r.p.map(i=>P[i]);const st=r.gx&&r.gx.st?r.gx.st:[r.lat,r.lon];
  return pinta({foto:r.f!=null?`fotos/${r.f}.jpg`:"",quien:"Los de las Claras",y:r.y,m:r.m,titulo:routeTitle(r),
    mk:window.rMk?rMk(r):"",de:r.de?"+"+r.de.toLocaleString("es-ES")+" m":"",km:r.km?fmtKm(r.km):"",dif:r.dl?DIFN[r.dl]:(r.dif||""),
    blog:r.u||"",seguir:r.gx?`data-follow="${r.id}"`:"",trk:!!r.gx,
    gRuta:r.u?`data-frgr="${r.id}"`:"",gRutaOn:!!(window.MTRUTA&&MTRUTA.es(r)),gTrack:r.gx?`data-frgt="${r.id}"`:"",share:r.u?`data-share="${r.id}"`:"",
    llegar:r.gx&&r.gx.st?r.gx.st:null,perfil:r.gx?perfilHTML(r.gx):"",
    cumbres:pts.filter(p=>p.a&&!p.x).sort((a,b)=>b.a-a.a).map(p=>({n:p.c,a:p.a,k:mkKey(p)})),
    otras:(otras.yo=routeTitle(r),otras(st[0],st[1],r.id,null))})};

/* ---- rutas de colaboradores (colab.js llama aquí) ---- */
window.FRUTA={pinta,perfilHTML,otras,coGuardada:(c,n)=>!!(MPI&&MPI.tracks().some(t=>t.src==="co"&&t.co===c.id&&t.n===n)),
  // cuando llega el track de un colaborador: Seguir, Guardar track, Cómo llegar, perfil y las otras rutas medidas desde su salida
  track(c,i,ll,g){const s=document.getElementById("sheet");if(!s||!s._cor||s._cor.c!==c||s._cor.i!==i||!s.querySelector(".fru"))return;
    s.querySelectorAll(".frtrk").forEach(x=>x.hidden=false);
    const a=s.querySelector(".frlleg");if(a&&ll&&ll.length)a.href=`https://www.google.com/maps/dir/?api=1&destination=${ll[0][0]},${ll[0][1]}`;
    const pf=s.querySelector(".frperf");if(pf&&!pf.children.length)pf.innerHTML=perfilHTML(g,true);
    const o=s.querySelector(".frotr");if(o&&ll&&ll.length){otras.yo=c.r[i][0];const h=otras(ll[0][0],ll[0][1],null,window.COLX&&COLX.rutaItem?COLX.rutaItem(c,i):null);o.innerHTML=h?`<div class="sec"><h3>Otras rutas por la zona</h3>${h}</div>`:""}}};

// el menú se lleva al final de la página mientras está abierto (la ficha se mueve y recorta lo que tiene dentro)
let MENU=null;
function menu(f,abre){
  if(abre){if(!f)return;menu(null,false);const b=f.querySelector(".frmas"),v=f.querySelector(".frvel"),t=f.querySelector("[data-frmas]");if(!b||!v)return;
    document.body.append(v,b);v.hidden=false;b.hidden=false;if(t)t.setAttribute("aria-expanded",true);MENU={f,b,v,t};return}
  if(!MENU)return;const{f:F,b,v,t}=MENU;MENU=null;b.hidden=true;v.hidden=true;if(t)t.setAttribute("aria-expanded",false);
  if(F&&F.isConnected){const a=F.querySelector(".fracts");if(a)a.after(v,b)}else{b.remove();v.remove()}}
/* ---- botones ---- */
document.addEventListener("click",e=>{
  const m=e.target.closest("[data-frmas]");if(m){menu(m.closest(".fru"),true);return}
  if(e.target.closest("[data-frx]")){menu(null,false);return}
  // al elegir una opción, el menú se cierra
  if(e.target.closest(".frmas>.btn"))setTimeout(()=>menu(null,false),250);
  const oc=e.target.closest(".fru [data-frco]");if(oc&&window.COLX){e.stopPropagation();COLX.abrirRuta(+oc.dataset.frco);return}
  // ☆ Guardar ruta (grupo)
  const gr=e.target.closest("[data-frgr]");if(gr){e.preventDefault();const r=R[+gr.dataset.frgr];if(!r||!window.MTRUTA)return;
    const go=()=>{const on=MTRUTA.alterna(r);gr.innerHTML=gRL(on);toast(on?"Ruta guardada en Mis cosas":"Quitada de Mis cosas")};
    if(window.cuentaOk&&!cuentaOk(go,"tracks"))return;go();return}
  // 〰️ Guardar track (grupo): copia como track tuyo
  const gt=e.target.closest("[data-frgt]");if(gt){e.preventDefault();const r=R[+gt.dataset.frgt];if(!r||!MPI)return;
    const go=()=>(window.loadTracks?loadTracks():Promise.resolve(true)).then(()=>{const ln=r.gx&&r.gx.ln;if(!ln||ln.length<2){toast("No tengo el track de esta ruta");return}
      const n=routeTitle(r);if(MPI.tracks().some(t=>t.n===n&&t.src==="gpx")){toast("Ese track ya lo tenías en Mis cosas");return}
      const o={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),n,km:r.gx.km,up:r.gx.up,dn:r.gx.dn,pts:ln.map(q=>q.slice()),src:"gpx",f:new Date().toISOString()};
      MPI.saveTracks([...MPI.tracks(),o]);toast("Track guardado en Mis cosas")});
    if(window.cuentaOk&&!cuentaOk(go,"tracks"))return;go();return}
  // ☆ Guardar ruta (colaborador): en Mis cosas como RUTA, con su recorrido dentro
  const gc=e.target.closest("[data-frgrc]");if(gc){e.preventDefault();const s=document.getElementById("sheet"),k=s&&s._cor;if(!k||!MPI||!window.COLX)return;
    const c=k.c,i=k.i,q=c.r[i],n=q[0];
    const go=()=>{const ya=MPI.tracks().find(t=>t.src==="co"&&t.co===c.id&&t.n===n);
      if(ya){MPI.saveTracks(MPI.tracks().filter(t=>t!==ya));gc.innerHTML=gRL(false);toast("Quitada de Mis cosas");return}
      COLX.ln(c,i).then(ll=>{const o={id:"co-"+Date.now().toString(36),src:"co",co:c.id,n,km:parseFloat(String(q[3]||"").replace(",","."))||null,u:q[7]||"",f:new Date().toISOString()};
        if(ll&&ll.length>1){o.pts=ll.map(p=>p.slice());if(MPI.desn)MPI.desn(o)}
        MPI.saveTracks([...MPI.tracks(),o]);gc.innerHTML=gRL(true);toast("Ruta guardada en Mis cosas")})};
    if(window.cuentaOk&&!cuentaOk(go,"tracks"))return;go();return}
  // 📤 Compartir una entrada de blog sin track
  const sh=e.target.closest("[data-frshu]");if(sh){e.preventDefault();const u=sh.dataset.frshu,t=sh.dataset.frsht||"";
    (async()=>{try{if(navigator.share){await navigator.share({title:t,text:"🥾 "+t,url:u});return}}catch(er){if(er&&er.name==="AbortError")return}
      try{await navigator.clipboard.writeText(t+"\n"+u);toast("Enlace copiado")}catch(er){window.open("https://wa.me/?text="+encodeURIComponent(t+"\n"+u),"_blank","noopener")}})();return}
},true);
// al abrir una ruta desde una cumbre, openRoute mete las marcas de la cumbre bajo el título: en esta ficha no van
{const s=document.getElementById("sheet");if(s)new MutationObserver(()=>{if(!s.querySelector(".fru"))return;s.querySelectorAll(":scope>.mkblock,.fru>.mkblock:not(.rmk)").forEach(x=>x.remove())}).observe(s,{childList:true,subtree:true});
  new MutationObserver(()=>{if(MENU&&(s.hidden||!MENU.f.isConnected))menu(null,false)}).observe(s,{attributes:true,attributeFilter:["hidden"],childList:true})}
})();
