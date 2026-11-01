/* ---------- capas de colaboradores: sus puntos (My Maps) y sus tracks (My Maps o Drive), cada uno con su color ---------- */
(function(){
// los datos van en un archivo aparte que se carga después de abrir la app (no alargan el arranque)
const CO0=__COLAB__;if(!CO0.f||typeof map==="undefined")return;
fetch(CO0.f).then(r=>r.json()).then(CO=>{if(!CO.length)return;
document.head.insertAdjacentHTML("beforeend",`<style>
#map .cpt svg{position:absolute;width:calc(var(--ms,24px)*.92);height:calc(var(--ms,24px)*.92);transform:translate(-50%,-50%);cursor:pointer;border-radius:50%;box-shadow:0 0 0 2.5px var(--cc),0 1px 4px rgba(0,0,0,.45)}
#map .cpt.cum svg{width:calc(var(--ms,24px)*1.02);height:calc(var(--ms,24px)*1.02)}
#map .leaflet-tooltip.lbl.co{font-weight:700;text-decoration:underline;text-decoration-color:var(--cc);text-decoration-thickness:2px;text-underline-offset:2px}
.cpop{max-width:250px;font-size:15px;line-height:1.35}.cpop b{font-size:16.5px;display:block}.cpop .q{font-size:13px;color:#666;margin:2px 0 4px}
.cpop .dd{white-space:pre-line;max-height:38vh;overflow:auto}
.cpop img{width:100%;max-height:170px;object-fit:cover;border-radius:8px;margin:6px 0 4px;display:block}
.cpop a.vm{display:inline-block;margin-top:6px;font-weight:700}
#map .cpt.mk-h::after,#map .cpt.mk-q::after{position:absolute;left:calc(var(--ms,24px)*.28);top:calc(var(--ms,24px)*-.78);width:15px;height:15px;border-radius:50%;font-size:10px;line-height:15px;text-align:center;font-weight:900;color:#fff;border:1.5px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.4);pointer-events:none;z-index:2}
#map .cpt.mk-h::after{content:"✓";background:#2e7d4f}#map .cpt.mk-q::after{content:"★";background:#d9a400}
#map .cpt.co-off{display:none}
.lico.co{width:16px;height:16px;border-radius:50%;border:3px solid;box-sizing:border-box;display:inline-block;background:#fff}
</style>`);
const SYM={aloja:["#b5532f",'<path d="M-7.5-5h2v4.2H6a1.8 1.8 0 0 1 1.8 1.8V5.5h-2V3.4H-5.5v2.1h-2Z" fill="#fff"/><circle cx="-2.7" cy="-2.6" r="1.8" fill="#fff"/><path d="M0.2-4.2H4.4a2 2 0 0 1 2 2v.6H0.2Z" fill="#fff"/>'],
  pueblo:["#a8663a",'<path d="M-8.2 5.5V-.6L-4.6-4-1-.6V5.5Z M-.2 5.5V-2.8L3.9-6.8 8 -2.8V5.5Z" fill="#fff"/><path d="M2.8 5.5V2.6H5V5.5Z M-5.6 5.5V3H-3.6V5.5Z" fill="#a8663a"/>'],
  activo:["#c2417e",'<path d="M-4.6-7.6h1.7V7.2h-1.7Z" fill="#fff"/><path d="M-2.9-7.6H6.6L3.9-4.1 6.6-.6H-2.9Z" fill="#fff"/>'],
  area:["#4b8a3a",'<path d="M-7.4-3.4H7.4V-1.6H-7.4Z M-5.4-1.4h2l-2.4 6.8h-2Z M3.4-1.4h2l2.4 6.8h-2Z M-6.6 1.6H6.6v1.6H-6.6Z" fill="#fff"/>']};
{const sv=document.querySelector("symbol#ic-cumbre");if(sv)sv.parentNode.insertAdjacentHTML("beforeend",Object.entries(SYM).map(([k,[c,d]])=>`<symbol id="ic-${k}" viewBox="-12 -12 24 24"><circle r="10.6" fill="${c}" stroke="#fff" stroke-width="1.8"/>${d}</symbol>`).join(""))}
// nombres en MAYÚSCULAS → como los del grupo («Braña de las Cadenas»)
const MIN=new Set(["de","del","la","las","el","los","y","a","al","por","en","e","o","u","con","sobre","desde"]);
const capi=n=>n&&n===n.toUpperCase()&&/[A-ZÁÉÍÓÚÑ]{3}/.test(n)?n.toLowerCase().replace(/[^\s(/-]+/g,(w,i)=>i&&MIN.has(w)?w:/^(pr|gr|sl)\b|^as-?\d/i.test(w)?w.toUpperCase():w[0].toUpperCase()+w.slice(1)).replace(/\b(PR|GR|SL)([-. ]?)As\b/g,"$1$2AS"):n;
for(const c of CO)for(const p of c.p)p[0]=capi(p[0]);
// el icono sale de la capa de su My Maps, del icono que puso y del nombre (como en los puntos del grupo)
function catCo(p){const n=p[0]||"",ic=p[6]||"",f=(p[7]||"").toUpperCase(),c=catOf(n);
  if(/MONTA/.test(f))return /^(ruta|senda|camino|circular)\b/i.test(n)?(c==="otros"?"senda":c):"cumbre";
  if(/SENDERISMO/.test(f))return c==="otros"?"senda":c;
  if(/CASCADA|LAGO/.test(f))return ["agua","cascada","cueva"].includes(c)?c:"cascada";
  if(/MIRADOR/.test(f))return "collado";
  if(/ALOJAMIENTO|REFUGIO/.test(f))return /refugio/i.test(n)?"refugio":"aloja";
  if(/TURISMO ACTIVO/.test(f))return "activo";
  if(/BOSQUE|CUEVA/.test(f))return /cueva|covona|covarones|\bcova\b/i.test(n)?"cueva":"bosque";
  if(/PLAYA|CABO|COSTA/.test(f))return "costa";
  if(/PUEBLO/.test(f))return "pueblo";
  if(/OTROS/.test(f)&&/rea recreativa|parque/i.test(n))return "area";
  if(ic==="1634")return "cumbre";
  return c}
// en Capas: un apartado «Colaboradores» con un botón por cada uno (encendidos la primera vez)
const pn=document.querySelector(".laypanel");
// cada colaborador, su propio apartado en Capas con «Cumbres» y «Lugares» (como «Ver» del grupo)
const KS=[["c","Cumbres","cumbre"],["l","Lugares","otros"]];
if(pn&&!pn.querySelector('[data-lay^="co_"]')){const ml=[...pn.querySelectorAll("p.laygh")].find(p=>/mis lugares/i.test(p.textContent));
  const h=CO.map(c=>`<p class="laygh">${esc(c.n)}</p>`+KS.map(([k,t,ic])=>`<button class="lay" data-lay="co_${c.id}_${k}" aria-pressed="true"><svg class="ico" viewBox="-12 -12 24 24" style="border-radius:50%;box-shadow:0 0 0 2.5px ${c.c}"><use href="#ic-${ic}" x="-12" y="-12" width="24" height="24"/></svg>${t}</button>`).join("")).join("");
  if(ml)ml.insertAdjacentHTML("beforebegin",h);else pn.insertAdjacentHTML("beforeend",h)}
const G={},LBL=[],MKG={};
// al tocar un punto suyo se abre la misma ficha grande que en las rutas del grupo
const CATN={cumbre:"Cumbre",aloja:"Alojamiento",pueblo:"Pueblo con encanto",activo:"Turismo activo",area:"Área recreativa",otros:"Lugar"};for(const[k,l]of CATS)CATN[k]=CATN[k]||l;
const limpia=t=>(t||"").normalize("NFKC").replace(/[\u0332\u0333]/g,"");
function ficha(d){const F={},resto=[];
  for(let l of limpia(d).split("\n")){l=l.trim();if(!l||/^[.·•_\-–—\s]+$/.test(l)||/^(m[aá]s (info|datos)|datos t[eé]cnicos)/i.test(l.replace(/^\W+/u,"")))continue;
    const m=/^\W*\s*(punto de (?:inicio|partida)|inicio|salida|distancia|desnivel|dificultad|duraci[oó]n|tiempo)\s*:\s*(.+)$/iu.exec(l);
    if(m){const k=m[1].toLowerCase();F[/inicio|partida|salida/.test(k)?"sal":/dist/.test(k)?"km":/desn/.test(k)?"de":/dific/.test(k)?"dif":"tm"]=m[2].trim()}else resto.push(l)}
  return [F,resto]}
const coKey=(c,n,k)=>(k==="cumbre"?"c:":"l:")+norm(n)+"@"+c.id;
const altCo=(n,d)=>{let m=/\(?\s*(\d[\d.]{2,4})\s*m(?:ts|etros)?\s*\)?/i.exec(n||"");if(m){const v=+m[1].replace(/\./g,"");if(v>=300&&v<=4900)return v}
  for(const l of limpia(d).split("\n")){if(/desnivel|distancia|dificultad|km/i.test(l))continue;
    m=/\(\s*(\d[\d.]{2,4})\s*m(?:ts|etros)?\s*\)/i.exec(l)||/(?:altitud|altura|cota)\D{0,15}(\d[\d.]{2,4})\s*m/i.exec(l);
    if(m){const v=+m[1].replace(/\./g,"");if(v>=300&&v<=4900)return v}}return null};
const cap1=s=>s?s[0].toUpperCase()+s.slice(1).toLowerCase():s;
function abrir(c,p,k){const[n,la,lo,d,u,f]=p,[F,resto]=ficha(d);
  const a=altCo(n,d);
  const desc=resto.filter(l=>!/^\W*\w[\w ]{1,20}:\s/u.test(l)),otros=resto.filter(l=>/^\W*\w[\w ]{1,20}:\s/u.test(l));
  sheet.classList.remove("full");
  sheet.innerHTML=`<div class="grab"></div>`+(f?`<div class="photo"><img src="${esc(f)}" alt="" onerror="this.parentNode.remove()"></div>`:"")+
  `<div class="sheet-head"><h2>${esc(n)}</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
  <div class="meta"><span class="tag" style="background:${c.c};color:#fff;border-color:${c.c}">${esc(c.n)}</span><span class="tag">${esc(CATN[k]||"Lugar")}</span>${a&&k==="cumbre"?`<span class="tag alt">${a.toLocaleString("es-ES")} m</span>`:""}</div>
  ${(()=>{const key=coKey(c,n,k),st=MARKS[key]||"",L=k==="cumbre"?["Subida","Quiero subir"]:["He estado","Quiero ir"];return `<div class="mkblock"><span>${esc(n)}</span><span class="mk" data-key="${esc(key)}"><button data-mk="hecha" aria-pressed="${st==="hecha"}" title="${L[0]}">✓ ${L[0]}</button><button data-mk="quiero" aria-pressed="${st==="quiero"}" title="${L[1]}">★ ${L[1]}</button></span></div>`})()}
  ${desc.length?`<p class="desc">${desc.map(esc).join("<br>")}</p>`:""}
  ${(F.km||F.de||F.tm||F.dif)?`<div class="ficha">${F.km?`<div><b>${esc(F.km)}</b><span>Distancia</span></div>`:""}${F.de?`<div><b>${esc(F.de)}</b><span>Desnivel</span></div>`:""}${F.tm?`<div><b>${esc(F.tm)}</b><span>Duración</span></div>`:""}${F.dif?`<div><b>${esc(cap1(F.dif))}</b><span>Dificultad</span></div>`:""}</div>`:""}
  ${F.sal?`<p class="salida">Salida: ${esc(F.sal)}</p>`:""}
  ${otros.length?`<p class="desc" style="font-size:.92em;opacity:.85">${otros.map(esc).join("<br>")}</p>`:""}
  <div class="actions">${u?`<a class="btn primary" href="${esc(u)}" target="_blank" rel="noopener">${/instagram\.com/i.test(u)?"Ver en Instagram":"Leer en "+esc(c.n)}</a>`:""}<a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query=${la},${lo}" target="_blank" rel="noopener">Google Maps</a></div>`;
  {const it=window.COLX&&COLX.byP(p);const rs=it&&it.par?(P[it.par.i].rs||[]).filter(ri=>R[ri].u):[];
   if(rs.length)sheet.insertAdjacentHTML("beforeend",`<div class="sec"><h3>También del grupo</h3><div class="rows">${rs.map(ri=>rowHTML(R[ri],"",true)).join("")}</div></div>`)}
  if(window.showTrack)showTrack(null);nodes.classed("sel",false);
  sheet.hidden=false;sheet.scrollTop=0;flyTo(la,lo)}
for(const c of CO){for(const[k]of KS)if(LAY[`co_${c.id}_${k}`]===undefined)LAY[`co_${c.id}_${k}`]=LAY["co_"+c.id]!==false;delete LAY["co_"+c.id];
  const g=L.layerGroup(),gc=L.layerGroup();
  for(const ln of c.l){const ll=ln[1];
    g.addLayer(L.polyline(ll,{color:"#fff",weight:6,opacity:.85,interactive:false,renderer:TRC}));
    g.addLayer(L.polyline(ll,{color:c.c,weight:3.5,opacity:.95,renderer:TRC}).bindTooltip(esc(ln[0])+" · "+esc(c.n),{sticky:true}))}
  for(const p of c.p){const k=catCo(p),cum=k==="cumbre";
    const m=L.marker([p[1],p[2]],{icon:L.divIcon({className:"cpt"+(cum?" cum":""),html:`<svg viewBox="-12 -12 24 24" style="--cc:${c.c}"><use href="#ic-${k}" x="-12" y="-12" width="24" height="24"/></svg>`,iconSize:[0,0]}),title:p[0]+" · "+c.n,riseOnHover:true,zIndexOffset:cum?-20:-50});
    m.on("click",e=>{L.DomEvent.stopPropagation(e);if(typeof nearMode!=="undefined"&&nearMode){nearAt(p[1],p[2]);return}abrir(c,p,k)});
    m.__n=p[0];m.__c=c.c;m.__k=coKey(c,p[0],k);m.on("add",()=>setTimeout(()=>coMarks(m),0));LBL.push(m);(MKG[c.id+(cum?"_c":"_l")] ||= []).push(m)}
  G[c.id+"_l"]=g;G[c.id+"_c"]=gc}
function coMarks(m){const el=m.getElement();if(!el)return;const v=MARKS[m.__k],on=(v==="hecha"&&LAY.mh)||(v==="quiero"&&LAY.mq);el.classList.toggle("mk-h",v==="hecha"&&LAY.mh);el.classList.toggle("mk-q",v==="quiero"&&LAY.mq);el.classList.toggle("co-off",!!LAY.solo&&!on);const tt=m.getTooltip();if(tt)tt.setOpacity(LAY.solo&&!on?0:1)}
{const orig=window.refreshMarks;if(orig)window.refreshMarks=function(){orig.apply(this,arguments);for(const m of LBL)coMarks(m)}}
// los nombres, como los del grupo: solo con el mapa cerca
function lbls(){const on=map.getZoom()>=12;for(const m of LBL){if(!m._map){if(m.getTooltip())m.unbindTooltip();continue}if(on&&!m.getTooltip())m.bindTooltip(esc(m.__n),{permanent:true,direction:"right",offset:[10,0],className:"lbl co",interactive:false});const te=on&&m.getTooltip()&&m.getTooltip().getElement();if(te)te.style.setProperty("--cc",m.__c);else if(!on&&m.getTooltip())m.unbindTooltip()}}
function sync(){for(const c of CO)for(const[k]of KS){const key=`co_${c.id}_${k}`,on=LAY[key]&&!window.FOLONLY,g=G[c.id+"_"+k];
    if(on&&!map.hasLayer(g))g.addTo(map);else if(!on&&map.hasLayer(g))g.remove();
    const b=document.querySelector(`[data-lay="${key}"]`);if(b)b.setAttribute("aria-pressed",!!LAY[key])}
  cull()}
// como los puntos del grupo: solo se dibujan los que caen en pantalla (y un margen); el mapa va igual de fluido con más colaboradores
function cull(){const b=map.getBounds().pad(.35);for(const gid in MKG){const g=G[gid];if(!map.hasLayer(g))continue;
  for(const m of MKG[gid]){const inb=b.contains(m.getLatLng());if(inb&&!g.hasLayer(m))g.addLayer(m);else if(!inb&&g.hasLayer(m))g.removeLayer(m)}}lbls()}
map.on("moveend",cull);
map.on("zoomend",lbls);
document.querySelector(".legend").addEventListener("click",()=>setTimeout(()=>{sync();for(const m of LBL)coMarks(m)},0));
setTimeout(sync,0);

/* ---------- también en las pestañas Cumbres y Lugares (y en sus buscadores) ---------- */
if(typeof PEAKS!=="undefined"&&typeof SPOTS!=="undefined"){
document.head.insertAdjacentHTML("beforeend",`<style>
.crow.src-g{background:rgba(195,38,46,.09);box-shadow:inset 5px 0 0 #c3262e}
.crow.src-co{background:color-mix(in srgb,var(--cc) 20%,transparent);box-shadow:inset 5px 0 0 var(--cc)}
.crow.both{background:rgba(123,94,167,.2)}
.crow .cosrc{font-style:normal;font-weight:800}
.crow .cosrc.dos{color:#7b5ea7}
.chip .dot{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:-1px}
</style>`);
const EXTRA=[["aloja","Alojamientos"],["pueblo","Pueblos con encanto"],["activo","Turismo activo"],["area","Áreas recreativas"]];
const ALL=[],PAR={};
const regAt=(la,lo)=>{let b=null,bd=1e9;for(const q of P){const d=(q.lat-la)**2+((q.lon-lo)*.73)**2;if(d<bd){bd=d;b=q}}return b&&bd<.04?String(b.r).split(" / ")[0]:"Asturias"};
const kmd=(a,b)=>Math.hypot(a.lat-b.lat,(a.lon-b.lon)*.73)*111;
const sig=n=>new Set(nk(n).split(" ").filter(w=>w.length>=4&&!/^(pico|pena|picu|ruta|senda|desde|circular|braña|brana|playa|mirador|cascada|bosque|cueva)$/.test(w)));
for(const c of CO)for(const p of c.p){const k=catCo(p),cum=k==="cumbre";
  const it={c:p[0],r:regAt(p[1],p[2]),a:cum?altCo(p[0],p[3]):null,lat:p[1],lon:p[2],co:c,ci:ALL.length,pp:p,k};
  if(!cum)it.cat=k;
  // ¿lo tenéis también en el grupo? mismo nombre, o muy cerca y con una palabra del nombre en común
  const lista=cum?PEAKS:SPOTS,sw=sig(it.c);
  for(const g of lista){if(g.co)continue;const d=kmd(g,it);
    if((nk(g.c)===nk(it.c)&&d<3)||(d<(cum?.35:.25)&&[...sig(g.c)].some(w=>sw.has(w)))){it.both="grupo";it.par=g;g.both=g.both||c.n;(PAR[g.i]=PAR[g.i]||[]).push(it);if(!it.a&&g.a)it.a=g.a;break}}
  ALL.push(it);lista.push(it)}
PEAKS.sort((a,b)=>(b.a||0)-(a.a||0));SPOTS.sort((a,b)=>a.c.localeCompare(b.c,"es"));
// los que coinciden, juntos: el del colaborador justo debajo del vuestro
for(const L of [PEAKS,SPOTS]){const pares=L.filter(x=>x.par);for(const x of pares)L.splice(L.indexOf(x),1);for(const x of pares){const j=L.indexOf(x.par);L.splice(j<0?L.length:j+1,0,x)}}
window.COLX={
  cats:()=>CATS.concat(EXTRA),
  ok(p,C){const o=C.o||"todas";return o==="todas"||(o==="grupo"&&!p.co)||(o==="dos"&&!!p.both)||(p.co&&o==="co_"+p.co.id)},
  chips(kind,C){const o=C.o||"todas";const ops=[["todas","Todos",""],["grupo","Del grupo","#c3262e"],...CO.map(c=>["co_"+c.id,c.n,c.c]),["dos","En los dos","#7b5ea7"]];
    return `<div class="chips" data-k="${kind}" data-grp="o">${ops.map(([v,l,col])=>`<button class="chip" data-v="${v}" aria-pressed="${o===v}">${col?`<span class="dot" style="background:${col}"></span>`:""}${esc(l)}</button>`).join("")}</div>`},
  cls:p=>(p.co?` src-co${p.both?" both":""}" style="--cc:${p.co.c}`:` src-g${p.both?" both":""}`),
  ico:(p,kind)=>`<svg class="ico2" viewBox="-12 -12 24 24" aria-hidden="true" style="border-radius:50%;box-shadow:0 0 0 2.5px ${p.co.c}"><use href="#ic-${p.k}" x="-12" y="-12" width="24" height="24"/></svg>`,
  src:p=>p.co?`<em class="cosrc" style="color:${p.co.c}">${esc(p.co.n)}</em>${p.both?` · <em class="cosrc dos">en los dos</em>`:""} · `:p.both?`<em class="cosrc dos">También en ${esc(p.both)}</em> · `:"",
  open(ci){const it=ALL[ci];if(!it)return;if(typeof ovCloseAll==="function")ovCloseAll();if(typeof showView==="function")showView("mapa");setTimeout(()=>abrir(it.co,it.pp,it.k),80)}};
/* ---------- también en la pestaña Rutas: sus puntos que son rutas (capas de rutas o con «Distancia:») ---------- */
document.head.insertAdjacentHTML("beforeend",`<style>
#list .row.src-co{background:color-mix(in srgb,var(--cc) 16%,transparent);box-shadow:inset 5px 0 0 var(--cc)}
#list .row .cosrc{font-style:normal;font-weight:800}
.rsrc{margin:4px 0 10px}
</style>`);
const RUT=[];
for(const it of ALL){const p=it.pp;if(!(/RUTA/i.test(p[7]||"")||/distancia\s*:/i.test(limpia(p[3]))))continue;
  const[F]=ficha(p[3]),dm=/\/(20\d\d)\/(\d\d)\//.exec(p[4]||"");
  RUT.push(Object.assign(Object.create(it),{cox:1,p:[],y:dm?+dm[1]:null,m:dm?+dm[2]:null,km:(/(\d+(?:[.,]\d+)?)\s*km/i.exec(F.km||"")||[])[1]?(/(\d+(?:[.,]\d+)?)\s*km/i.exec(F.km)[1].replace(".",",")+" km"):"",de:(/(\d[\d.]*)\s*m/i.exec(F.de||"")||[])[1]?"+"+(/(\d[\d.]*)\s*m/i.exec(F.de)[1])+" m":"",txt:norm(p[0]+" "+it.r+" "+limpia(p[3]))}))}
COLX.rsrc="todas";
COLX.isRuta=ci=>RUT.some(x=>x.ci===ci);
COLX.byP=p=>ALL.find(x=>x.pp===p);
// en la ficha de una ruta del grupo: «También en <colaborador>» con su tarjeta
COLX.also=r=>{const v=[];for(const i of r.p||[])for(const it of PAR[i]||[])if(!v.includes(it))v.push(it);if(!v.length)return "";
  const by={};for(const it of v)(by[it.co.n] ||= []).push(it);
  return Object.entries(by).map(([n,l])=>`<div class="sec"><h3>También en ${esc(n)}</h3><div class="rows">${l.map(it=>COLX.rrow(RUT.find(x=>Object.getPrototypeOf(x)===it)||Object.assign(Object.create(it),{y:null,km:"",de:""}))).join("")}</div></div>`).join("")};
COLX.rchips=()=>{const o=COLX.rsrc;const ops=[["todas","Todas",""],["grupo","Del grupo","#c3262e"],...CO.map(c=>["co_"+c.id,c.n,c.c])];
  return `<div class="chips rsrc">${ops.map(([v,l,col])=>`<button class="chip" data-rsrc="${v}" aria-pressed="${o===v}">${col?`<span class="dot" style="background:${col}"></span>`:""}${esc(l)}</button>`).join("")}</div>`};
COLX.routes=(q,limpio)=>{const o=COLX.rsrc;
  const c=(o==="grupo"||!limpio)?[]:RUT.filter(x=>(o==="todas"||o==="co_"+x.co.id)&&(!q||x.txt.includes(q))&&(!window.RFOK||RFOK(x)));
  return {c,hideG:o!=="todas"&&o!=="grupo"}};
COLX.near=(lat,lon)=>F.reg==="todas"&&!nExtra()&&!F.wz?RUT.filter(x=>!window.RFOK||RFOK(x)).map(x=>({r:x,d:km({lat,lon},x)})):[];
COLX.rrow=(x,extra)=>{const de=x.de?(/^\+/.test(x.de)?x.de:"+"+x.de):"",nums=[x.km,de].filter(Boolean).join(" · ");
  return `<button class="row src-co" style="--cc:${x.co.c}" data-cor="${x.ci}">${x.pp[5]?`<img class="thumb" src="${esc(x.pp[5])}" alt="" loading="lazy">`:`<span class="thumb none" aria-hidden="true"></span>`}<div class="t"><b>${esc(x.c)}</b><span><em class="cosrc" style="color:${x.co.c}">${esc(x.co.n)}</em> · ${x.y?(x.m?MESES[x.m]+" ":"")+x.y:"Sin fecha"} · ${esc(x.r)}${extra?" · "+esc(extra):""}</span></div><span class="alt">${esc(nums)}</span></button>`};
if(typeof renderList==="function")renderList();
renderCols()}
if(window.LISTAS)LISTAS.render();
}).catch(e=>console.error("colaboradores",e))})();
