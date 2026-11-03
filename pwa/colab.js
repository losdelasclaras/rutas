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
// en Capas: un apartado por colaborador (apagados de entrada; cada uno enciende lo que quiera)
const pn=document.querySelector(".laypanel");
// cada colaborador, su propio apartado en Capas con «Cumbres» y «Lugares» (como «Ver» del grupo)
const KS=[["c","Cumbres","cumbre"],["l","Lugares","otros"]];
const KR=[["r","Rutas","senda"],["t","Tracks","senda"]];
const KC=c=>KS.concat(KR).filter(([k])=>c.k?c.k.includes(k):k==="c"||k==="l"?c.p.length:(c.r&&c.r.length));
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
const rKeyCo=(c,n)=>"r:"+norm(n)+"@"+c.id;
const icoR=r=>/raqueta|nieve|invern/i.test(r[2]+" "+r[0])?"invernal":"senda";
const coKey=(c,n,k)=>(k==="cumbre"?"c:":"l:")+norm(n)+"@"+c.id;
const altCo=(n,d)=>{let m=/\(?\s*(\d[\d.]{2,4})\s*m(?:ts|etros)?\s*\)?/i.exec(n||"");if(m){const v=+m[1].replace(/\./g,"");if(v>=300&&v<=4900)return v}
  for(const l of limpia(d).split("\n")){if(/desnivel|distancia|dificultad|km/i.test(l))continue;
    m=/\(\s*(\d[\d.]{2,4})\s*m(?:ts|etros)?\s*\)/i.exec(l)||/(?:altitud|altura|cota)\D{0,15}(\d[\d.]{2,4})\s*m/i.exec(l);
    if(m){const v=+m[1].replace(/\./g,"");if(v>=300&&v<=4900)return v}}return null};
const cap1=s=>s?s[0].toUpperCase()+s.slice(1).toLowerCase():s;
// como en las cumbres del grupo: si la cumbre está en una sola ruta, se abre directamente la ficha de esa ruta (con la marca de la cumbre)
function abrirCum(c,p,k){if(k==="cumbre"&&p[9]&&p[9].length===1&&c.r&&c.r[p[9][0]]){abrirR(c,p[9][0]);return}abrir(c,p,k)}
function abrir(c,p,k){const[n,la,lo,d,u,f]=p,[F,resto]=ficha(d);const deR=k==="cumbre"&&p[9]&&p[9].length;
  const a=altCo(n,d);
  const desc=resto.filter(l=>!/^\W*\w[\w ]{1,20}:\s/u.test(l)),otros=resto.filter(l=>/^\W*\w[\w ]{1,20}:\s/u.test(l));
  sheet.classList.remove("full");
  sheet.innerHTML=`<div class="grab"></div>`+(f?`<div class="photo"><img src="${esc(f)}" alt="" onerror="this.parentNode.remove()"></div>`:"")+
  `<div class="sheet-head"><h2>${esc(n)}</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
  <div class="meta"><span class="tag" style="background:${c.c};color:#fff;border-color:${c.c}">${esc(c.n)}</span>${deR?"":`<span class="tag">${esc(CATN[k]||"Lugar")}</span>`}${a&&k==="cumbre"?`<span class="tag alt">${a.toLocaleString("es-ES")} m</span>`:""}</div>
  ${(()=>{const key=coKey(c,n,k),st=MARKS[key]||"",L=k==="cumbre"?["Subida","Quiero subir"]:["He estado","Quiero ir"];return `<div class="mkblock"><span>${esc(n)}${a&&k==="cumbre"?" · "+a.toLocaleString("es-ES")+" m":""}</span><span class="mk" data-key="${esc(key)}"><button data-mk="hecha" aria-pressed="${st==="hecha"}" title="${L[0]}">✓ ${L[0]}</button><button data-mk="quiero" aria-pressed="${st==="quiero"}" title="${L[1]}">★ ${L[1]}</button></span></div>`})()}
  ${desc.length?`<p class="desc">${desc.map(esc).join("<br>")}</p>`:""}
  ${(F.km||F.de||F.tm||F.dif)?`<div class="ficha">${F.km?`<div><b>${esc(F.km)}</b><span>Distancia</span></div>`:""}${F.de?`<div><b>${esc(F.de)}</b><span>Desnivel</span></div>`:""}${F.tm?`<div><b>${esc(F.tm)}</b><span>Duración</span></div>`:""}${F.dif?`<div><b>${esc(cap1(F.dif))}</b><span>Dificultad</span></div>`:""}</div>`:""}
  ${F.sal?`<p class="salida">Salida: ${esc(F.sal)}</p>`:""}
  ${otros.length?`<p class="desc" style="font-size:.92em;opacity:.85">${otros.map(esc).join("<br>")}</p>`:""}
  <div class="actions">${u?`<a class="btn primary" href="${esc(u)}" target="_blank" rel="noopener">${/instagram\.com/i.test(u)?"Ver en Instagram":"Leer en "+esc(c.n)}</a>`:""}${deR?"":`<a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query=${la},${lo}" target="_blank" rel="noopener">Google Maps</a>`}</div><span data-ll="${la},${lo}" hidden></span>`;
  if(p[9]&&p[9].length&&window.COLX&&COLX.rutaItem)sheet.insertAdjacentHTML("beforeend",`<p class="note">${p[9].length===1?"Está en esta ruta:":"Está en "+p[9].length+" rutas. Elige cuál ver:"}</p><div class="rows">${p[9].map(i=>COLX.rrow(COLX.rutaItem(c,i))).join("")}</div>`);
  {const it=window.COLX&&COLX.byP(p);const rs=it&&it.par?(P[it.par.i].rs||[]).filter(ri=>R[ri].u):[];
   if(rs.length)sheet.insertAdjacentHTML("beforeend",`<div class="sec"><h3>También del grupo</h3><div class="rows">${rs.map(ri=>rowHTML(R[ri],"",true)).join("")}</div></div>`)}
  if(window.showTrack)showTrack(null);nodes.classed("sel",false);
  sheet.hidden=false;sheet.scrollTop=0;
  // como en las cumbres del grupo: al tocarla se dibuja el track de su ruta (o rutas) y se queda al cerrar la ficha
  if(TRCO){TRCO.remove();TRCO=null}
  if(p[9]&&p[9].length)lineas().then(J=>{const ls=p[9].map(i=>(J[c.id]||[])[i]).filter(ll=>ll&&ll.length>1);if(!ls.length){flyTo(la,lo);return}
    if(sheet.hidden||!sheet.querySelector("h2")||sheet.querySelector("h2").textContent!==p[0])return;
    pintaCo(c,ls,p[9].filter(i=>((J[c.id]||[])[i]||[]).length>1).map(i=>c.r[i][0]),[la,lo])});
  else flyTo(la,lo)}
const nuevo2=store.get("ldc-capas2co","0")!=="1";store.set("ldc-capas2co","1");
for(const c of CO){for(const[k]of KC(c))if(LAY[`co_${c.id}_${k}`]===undefined||nuevo2)LAY[`co_${c.id}_${k}`]=false;delete LAY["co_"+c.id];
  const g=L.layerGroup(),gc=L.layerGroup();
  for(const ln of c.l){const ll=ln[1];
    g.addLayer(L.polyline(ll,{color:"#fff",weight:6,opacity:.85,interactive:false,renderer:TRC}));
    g.addLayer(L.polyline(ll,{color:c.c,weight:3.5,opacity:.95,renderer:TRC}).bindTooltip(esc(ln[0])+" · "+esc(c.n),{sticky:true}))}
  for(const p of c.p){const k=catCo(p),cum=k==="cumbre";
    const m=L.marker([p[1],p[2]],{icon:L.divIcon({className:"cpt"+(cum?" cum":""),html:`<svg viewBox="-12 -12 24 24" style="--cc:${c.c}"><use href="#ic-${k}" x="-12" y="-12" width="24" height="24"/></svg>`,iconSize:[0,0]}),title:p[0]+" · "+c.n,riseOnHover:true,zIndexOffset:cum?-20:-50});
    m.on("click",e=>{L.DomEvent.stopPropagation(e);if(typeof nearMode!=="undefined"&&nearMode){nearAt(p[1],p[2]);return}abrirCum(c,p,k)});
    m.__n=p[0];m.__c=c.c;m.__g=c.id+(cum?"_c":"_l");m.__k=coKey(c,p[0],k);m.on("add",()=>setTimeout(()=>coMarks(m),0));LBL.push(m);(MKG[c.id+(cum?"_c":"_l")] ||= []).push(m)}
  G[c.id+"_l"]=g;G[c.id+"_c"]=gc;
  if(c.r&&c.r.length){G[c.id+"_r"]=L.layerGroup();G[c.id+"_t"]=L.layerGroup();
    c.r.forEach((r,i)=>{const k=icoR(r);const m=L.marker(r[8],{icon:L.divIcon({className:"cpt",html:`<svg viewBox="-12 -12 24 24" style="--cc:${c.c}"><use href="#ic-${k}" x="-12" y="-12" width="24" height="24"/></svg>`,iconSize:[0,0]}),title:r[0]+" · "+c.n,riseOnHover:true,zIndexOffset:-60});
      m.on("click",e=>{L.DomEvent.stopPropagation(e);if(typeof nearMode!=="undefined"&&nearMode){nearAt(r[8][0],r[8][1]);return}abrirR(c,i)});
      m.__n=r[0];m.__c=c.c;m.__g=c.id+"_r";m.__k=rKeyCo(c,r[0]);m.on("add",()=>setTimeout(()=>coMarks(m),0));LBL.push(m);(MKG[c.id+"_r"] ||= []).push(m)})}}
/* ---------- rutas de colaboradores que solo traen el track (p. ej. Rutinas Varias, de Wikiloc) ---------- */
let LNP=null;const lineas=()=>LNP||(LNP=CO0.ln?fetch(CO0.ln).then(r=>r.json()).catch(()=>{LNP=null;return{}}):Promise.resolve({}));
function pintaTracks(c){const g=G[c.id+"_t"];if(!g||g.__ok)return;g.__ok=1;lineas().then(J=>{const ls=J[c.id]||[];
  ls.forEach((ll,i)=>{if(!ll||ll.length<2)return;g.addLayer(L.polyline(ll,{color:"#fff",weight:5.5,opacity:.8,interactive:false,renderer:TRC}));
    g.addLayer(L.polyline(ll,{color:c.c,weight:3,opacity:.9,renderer:TRC}).bindTooltip(esc(c.r[i][0]),{sticky:true}).on("click",e=>{L.DomEvent.stopPropagation(e);abrirR(c,i)}))})})}
let TRCO=null;
function pintaCo(c,ls,noms,extra,nofit){if(TRCO){TRCO.remove();TRCO=null}const L0=[];
  ls.forEach((ll,j)=>{L0.push(L.polyline(ll,{color:"#fff",weight:8,opacity:.95,interactive:false}),L.polyline(ll,{color:c.c,weight:5,opacity:1}).bindTooltip(esc(noms[j]||""),{sticky:true}),
    L.circleMarker(ll[0],{radius:7,color:"#fff",weight:2,fillColor:"#2a7a3b",fillOpacity:1,interactive:false}).bindTooltip("Salida",{direction:"top"}))});
  TRCO=L.layerGroup(L0).addTo(map);if(nofit)return;
  const b=L.latLngBounds(ls.flat().map(q=>[q[0],q[1]]));if(extra)b.extend(extra);
  const el=mapEl.getBoundingClientRect(),wide=el.width>=860,pb=!wide?Math.min(el.height*.62,sheet.offsetHeight)+16:24;
  map.fitBounds(b,{paddingTopLeft:[wide?60:24,110],paddingBottomRight:[wide?640:24,pb],maxZoom:15})}
// si se abre una ruta o cumbre del grupo, se quita el track del colaborador
{const st=window.showTrack;if(st)window.showTrack=function(r){if(TRCO&&!showTrack._co){TRCO.remove();TRCO=null;coPill(null)}return st.apply(this,arguments)}}
function abrirR(c,i,nofit){coPill(null);const keep=!!(nofit&&TRCO&&TRCO.__i===c.id+":"+i);const r=c.r[i],[n,z,act,km,de,dif,wl,blog,ini,fo]=r;
  const key=rKeyCo(c,n),st=MARKS[key]||"",deN=(/(\d[\d.]*)/.exec(de)||[])[1];
  sheet.classList.remove("full");
  sheet.innerHTML=`<div class="grab"></div>${fo?`<div class="photo"><img src="${esc(fo)}" alt="" onerror="this.parentNode.remove()"></div>`:""}<div class="sheet-head"><h2>${esc(n)}</h2><button class="x" aria-label="Cerrar" data-close data-trcox>×</button></div>
  <div class="meta"><span class="tag" style="background:${c.c};color:#fff;border-color:${c.c}">${esc(c.n)}</span>${act?`<span class="tag">${esc(act)}</span>`:""}<span class="tag">${esc(z)}</span>${(()=>{const fe=/^(\d{4})-(\d{2})/.exec(r[10]||"");return fe?`<span class="tag">📅 ${MESES[+fe[2]]?MESES[+fe[2]]+" ":""}${fe[1]}</span>`:""})()}</div>
  ${(c.p||[]).filter(q=>q[9]&&q[9].includes(i)&&catCo(q)==="cumbre").map(q=>{const kq=coKey(c,q[0],"cumbre"),sq=MARKS[kq]||"";return `<div class="mkblock"><span>${esc(q[0])}</span><span class="mk" data-key="${esc(kq)}"><button data-mk="hecha" aria-pressed="${sq==="hecha"}" title="Subida">✓ Subida</button><button data-mk="quiero" aria-pressed="${sq==="quiero"}" title="Quiero subir">★ Quiero subir</button></span></div>`}).join("")}
  <div class="mkblock rmk"><span>Esta ruta</span><span class="mk" data-key="${esc(key)}"><button data-mk="hecha" aria-pressed="${st==="hecha"}" title="Hecha">✓ Hecha</button><button data-mk="quiero" aria-pressed="${st==="quiero"}" title="Quiero hacerla">★ Quiero hacerla</button></span></div>
  ${(km||de||dif)?`<div class="ficha">${km?`<div><b>${esc(km)}</b><span>Distancia</span></div>`:""}${deN?`<div><b>+${esc(deN)} m</b><span>Desnivel</span></div>`:""}${dif?`<div><b>${esc(cap1(dif))}</b><span>Dificultad</span></div>`:""}</div>`:""}
  <div class="topacts"><button class="btn primary" data-cofol>▶ Seguir</button><button class="btn ghost" data-cosave>☆ Guardar en Mis tracks</button><button class="btn ghost" data-coshare>📤 Compartir</button></div>
  <div class="actions">${blog?`<a class="btn primary" href="${esc(blog)}" target="_blank" rel="noopener">Leer en el blog</a>`:""}${wl?`<a class="btn ${blog?"ghost":"primary"}" href="${esc(wl)}" target="_blank" rel="noopener">Ver en Wikiloc</a>`:""}<a class="btn ghost" href="https://www.google.com/maps/dir/?api=1&destination=${ini[0]},${ini[1]}" target="_blank" rel="noopener">Cómo llegar a la salida</a></div>`;
  sheet._cor={c,i};if(window.showTrack)showTrack(null);nodes.classed("sel",false);sheet.hidden=false;sheet.scrollTop=0;
  if(TRCO){TRCO.remove();TRCO=null}
  lineas().then(J=>{const ll=(J[c.id]||[])[i];if(!ll||ll.length<2){flyTo(ini[0],ini[1]);return}
    pintaCo(c,[ll],[n],null,keep);if(TRCO)TRCO.__i=c.id+":"+i;
    if(sheet._cor&&sheet._cor.c===c&&sheet._cor.i===i)extraR(c,i,ll)})}
/* desde las listas: al mapa con el track entero a la vista y una pastilla abajo para abrir la ficha (como «Ver en el mapa» de las del grupo) */
function coPill(c,i){let el=document.getElementById("copill");if(!c){if(el)el.hidden=true;return}
  if(!el){el=document.createElement("div");el.id="copill";el.className="trkpill";document.getElementById("v-mapa").appendChild(el);
    el.addEventListener("click",e=>{const k=el._k;if(!k)return;if(e.target.closest("[data-px]")){el.hidden=true;if(TRCO){TRCO.remove();TRCO=null}return}abrirR(k.c,k.i,true)})}
  const r=c.r[i],deN=(/(\d[\d.]*)/.exec(r[4])||[])[1];el._k={c,i};el.style.borderColor=c.c;
  el.innerHTML=`<button class="pn"><b>${esc(r[0])}</b><span style="color:${c.c}">${[r[3],deN?"+"+deN+" m":""].filter(Boolean).map(esc).join(" · ")}${r[3]||deN?" · ":""}ver la ficha</span></button><button class="x" data-px aria-label="Quitar el recorrido">×</button>`;el.hidden=false}
function verR(c,i){const r=c.r[i];sheet.hidden=true;sheet.classList.remove("full");sheet._cor=null;if(window.showTrack)showTrack(null);{const tp=document.getElementById("trkpill");if(tp)tp.hidden=true}
  if(TRCO){TRCO.remove();TRCO=null}coPill(c,i);map.invalidateSize();
  lineas().then(J=>{const ll=(J[c.id]||[])[i];if(!ll||ll.length<2){flyTo(r[8][0],r[8][1]);return}
    pintaCo(c,[ll],[r[0]],null,true);TRCO.__i=c.id+":"+i;
    map.fitBounds(L.latLngBounds(ll.map(q=>[q[0],q[1]])),{paddingTopLeft:[24,110],paddingBottomRight:[24,90],maxZoom:15,animate:false})})}
/* lo mismo que la ficha de una ruta del grupo: tiempo, perfil y GPX, sus cumbres y otras rutas por la zona */
function gxDe(ll){const cum=[0];for(let j=1;j<ll.length;j++)cum.push(cum[j-1]+map.distance([ll[j-1][0],ll[j-1][1]],[ll[j][0],ll[j][1]]));
  const E=ll.map(q=>q[2]),has=E.filter(e=>e!=null).length>=.8*E.length;const g={km:Math.round(cum[cum.length-1]/100)/10,up:0,pf:[],mx:null,mn:null,st:[ll[0][0],ll[0][1]],ln:ll};
  if(!has)return g;let last=E.find(e=>e!=null);for(let j=0;j<E.length;j++){if(E[j]==null)E[j]=last;else last=E[j]}
  const sm=E.map((e,j)=>{const w=E.slice(Math.max(0,j-2),j+3);return w.reduce((a,b)=>a+b,0)/w.length});let ref=sm[0],up=0;
  for(const e of sm){if(e-ref>=4){up+=e-ref;ref=e}else if(ref-e>=4)ref=e}
  g.up=Math.round(up/10)*10;g.mx=Math.round(Math.max(...E));g.mn=Math.round(Math.min(...E));
  const T=cum[cum.length-1];let j=0;for(let k=0;k<=100;k++){const t=T*k/100;while(j<cum.length-1&&Math.abs(cum[j+1]-t)<=Math.abs(cum[j]-t))j++;g.pf.push([Math.round(cum[j]/10)/100,Math.round(E[j])])}
  return g}
let GXC=null;
function extraR(c,i,ll){const r=c.r[i],g=gxDe(ll);GXC={c,i,g};
  let hi=ll[0];if(g.mx!=null)for(const q of ll)if(q[2]!=null&&q[2]>(hi[2]??-1e9))hi=q;
  const az=typeof aemetZone==="function"?aemetZone(hi[0],hi[1]):null,alt=g.mx!=null?Math.round(hi[2]):"";
  const fmt=n=>Number(n).toLocaleString("es-ES");
  const cum=(c.p||[]).filter(p=>p[9]&&p[9].includes(i)).map(p=>COLX.byP(p)).filter(Boolean);
  const RU=COLX.rut?COLX.rut():[],me=COLX.rutaItem(c,i);
  const ng=(typeof nearestRoutes==="function"?nearestRoutes(r[8][0],r[8][1],3,-1):[]).filter(x=>x.d<25);
  const nc=RU.filter(x=>x!==me&&x.lat!=null).map(x=>({r:x,d:km({lat:r[8][0],lon:r[8][1]},x)})).filter(x=>x.d<25).sort((a,b)=>a.d-b.d).slice(0,3);
  sheet.insertAdjacentHTML("beforeend",`
  <div class="sec"><h3>El tiempo</h3><p class="note" style="margin-bottom:6px">Previsión para el punto más alto del track${alt?" ("+fmt(alt)+" m)":""}.</p>
  <div class="actions" style="margin-top:0"><a class="btn ghost" href="https://www.meteoblue.com/es/tiempo/semana/${hi[0].toFixed(3)}N${hi[1].toFixed(3)}E${alt}_Europe%2FMadrid" target="_blank" rel="noopener">☁ Previsión en el punto (Meteoblue)</a>${az?`<a class="btn ghost" href="https://www.aemet.es/es/eltiempo/prediccion/montana?w=&p=${az[0]}" target="_blank" rel="noopener">AEMET montaña · ${az[1]}</a>`:""}</div></div>
  <div class="sec"><h3>Perfil del recorrido</h3>${g.pf.length&&typeof profSVG==="function"?profSVG(g):""}<p class="note" style="margin:4px 0 8px">Según su track: ${fmtKm(g.km)}${g.pf.length?" · +"+fmt(g.up)+" m de subida · punto más alto "+fmt(g.mx)+" m":""}.</p>
  <div class="actions" style="margin-top:0"><button class="btn primary" data-cogpx>⬇ Descargar GPX</button><a class="btn ghost" href="https://www.google.com/maps/dir/?api=1&destination=${ll[0][0]},${ll[0][1]}" target="_blank" rel="noopener">🚗 Cómo llegar al inicio</a></div></div>
  ${cum.length?`<div class="sec"><h3>${cum.length===1?"Cumbre":"Cumbres"} de esta ruta</h3><div class="rows">${cum.map(x=>COLX.rrow(x)).join("")}</div></div>`:""}
  ${(ng.length||nc.length)?`<div class="near"><h3>Otras rutas por la zona</h3><div class="rows">${ng.map(x=>rowHTML(x.r,x.d.toFixed(0)+" km")).join("")}${nc.map(x=>COLX.rrow(x.r,x.d.toFixed(0)+" km")).join("")}</div></div>`:""}`)}
sheet.addEventListener("click",e=>{if(!e.target.closest("[data-cogpx]")||!GXC)return;const{c,i,g}=GXC,n=c.r[i][0],x=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
  const gpx=`<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="${x(c.n)}" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>${x(n)}</name></metadata><trk><name>${x(n)}</name><trkseg>\n${g.ln.map(p=>`<trkpt lat="${p[0]}" lon="${p[1]}">${p[2]!=null?`<ele>${p[2]}</ele>`:""}</trkpt>`).join("\n")}\n</trkseg></trk></gpx>`;
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([gpx],{type:"application/gpx+xml"}));a.download=norm(n).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)+".gpx";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)});
sheet.addEventListener("click",e=>{if(e.target.closest("[data-trcox]"))sheet._cor=null});   // el track se queda en el mapa hasta tocar otro punto, como en las del grupo
// ▶ Seguir y ☆ Guardar en Mis tracks, como con las rutas del grupo
sheet.addEventListener("click",e=>{const k=sheet._cor;if(!k)return;
  const fol=e.target.closest("[data-cofol]"),sav=e.target.closest("[data-cosave]");if(!fol&&!sav)return;
  const r=k.c.r[k.i],kmN=parseFloat(String(r[3]).replace(",","."))||null;
  lineas().then(J=>{const ll=(J[k.c.id]||[])[k.i];if(!ll||ll.length<2){toast("No tengo el track de esta ruta");return}
    if(fol){if(TRCO){TRCO.remove();TRCO=null}if(window.SEGUIR)SEGUIR.start({u:"tmp",ti:r[0],gx:{ln:ll,km:kmN}},false);return}
    const go=()=>{const M=window.MISPUNTOS;if(!M||!M.saveTracks){toast("No se ha podido guardar");return}
      if(M.tracks().some(t=>t.n===r[0])){toast("Ya la tenías en Mis tracks");return}
      const o={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),n:r[0],km:kmN,pts:ll.map(q=>q.slice()),src:"gpx",f:new Date().toISOString()};
      if(M.desn)M.desn(o);M.saveTracks([...M.tracks(),o]);toast("Guardada en Mis cosas › Tracks")};
    if(window.cuentaOk&&!cuentaOk(go,"tracks"))return;go()})});
map.on("click",()=>{});
function coMarks(m){const el=m.getElement();if(!el)return;const v=MARKS[m.__k],on=(v==="hecha"&&LAY.mh)||(v==="quiero"&&LAY.mq);el.classList.toggle("mk-h",v==="hecha"&&LAY.mh);el.classList.toggle("mk-q",v==="quiero"&&LAY.mq);const off=(!!LAY.solo||!!LOFF[m.__g])&&!on;el.classList.toggle("co-off",off);const tt=m.getTooltip();if(tt)tt.setOpacity(off?0:1)}
// capa apagada: solo se ven sus puntos marcados (✓/★), como en las del grupo
const LOFF={};const marcados=gid=>(LAY.mh||LAY.mq)&&(MKG[gid]||[]).some(m=>{const v=MARKS[m.__k];return(v==="hecha"&&LAY.mh)||(v==="quiero"&&LAY.mq)});
const quiere=(c,k)=>{const key=`co_${c.id}_${k}`;LOFF[c.id+"_"+k]=!LAY[key]&&k!=="t";return!window.FOLONLY&&(!!LAY[key]||(k!=="t"&&marcados(c.id+"_"+k)))};
{const orig=window.refreshMarks;if(orig)window.refreshMarks=function(){orig.apply(this,arguments);if(CO.some(c=>KC(c).some(([k])=>{const g=G[c.id+"_"+k];return g&&quiere(c,k)!==map.hasLayer(g)})))sync();for(const m of LBL)coMarks(m)}}
// los nombres, como los del grupo: solo con el mapa cerca
function lbls(){const on=map.getZoom()>=12;for(const m of LBL){if(!m._map){if(m.getTooltip())m.unbindTooltip();continue}if(on&&!m.getTooltip())m.bindTooltip(esc(m.__n),{permanent:true,direction:"right",offset:[10,0],className:"lbl co",interactive:false});const te=on&&m.getTooltip()&&m.getTooltip().getElement();if(te)te.style.setProperty("--cc",m.__c);else if(!on&&m.getTooltip())m.unbindTooltip()}}
function sync(){for(const c of CO)for(const[k]of KC(c)){const key=`co_${c.id}_${k}`,on=quiere(c,k),g=G[c.id+"_"+k];
    if(on&&k==="t")pintaTracks(c);
    if(on&&!map.hasLayer(g))g.addTo(map);else if(!on&&map.hasLayer(g))g.remove();
    const b=document.querySelector(`[data-lay="${key}"]`);if(b)b.setAttribute("aria-pressed",!!LAY[key])}
  cull();if(window.capasSum)capasSum()}
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
for(const c of CO)(c.r||[]).forEach((r,i)=>{ALL.push({c:r[0],r:r[1],lat:r[8][0],lon:r[8][1],co:c,ci:ALL.length,rr:i,k:icoR(r),a:null})});
PEAKS.sort((a,b)=>(b.a||0)-(a.a||0));SPOTS.sort((a,b)=>a.c.localeCompare(b.c,"es"));
// los que coinciden, juntos: el del colaborador justo debajo del vuestro
for(const L of [PEAKS,SPOTS]){const pares=L.filter(x=>x.par);for(const x of pares)L.splice(L.indexOf(x),1);for(const x of pares){const j=L.indexOf(x.par);L.splice(j<0?L.length:j+1,0,x)}}
window.COLX={
  cats:()=>CATS.concat(EXTRA),
  ok(p,C){const o=C.o||"todas";return o==="todas"||(o==="grupo"&&!p.co)||(o==="dos"&&!!p.both)||(p.co&&o==="co_"+p.co.id)},
  chips(kind,C){const o=C.o||"todas";const ops=[["todas","Todos",""],["grupo","Los de las Claras","#c3262e"],...CO.map(c=>["co_"+c.id,c.n,c.c]),["dos","En los dos","#7b5ea7"]];
    return `<div class="chips" data-k="${kind}" data-grp="o">${ops.map(([v,l,col])=>`<button class="chip" data-v="${v}" aria-pressed="${o===v}">${col?`<span class="dot" style="background:${col}"></span>`:""}${esc(l)}</button>`).join("")}</div>`},
  cls:p=>(p.co?` src-co${p.both?" both":""}" style="--cc:${p.co.c}`:` src-g${p.both?" both":""}`),
  ico:(p,kind)=>`<svg class="ico2" viewBox="-12 -12 24 24" aria-hidden="true" style="border-radius:50%;box-shadow:0 0 0 2.5px ${p.co.c}"><use href="#ic-${p.k}" x="-12" y="-12" width="24" height="24"/></svg>`,
  src:p=>p.co?`<em class="cosrc" style="color:${p.co.c}">${esc(p.co.n)}</em>${p.both?` · <em class="cosrc dos">en los dos</em>`:""} · `:p.both?`<em class="cosrc dos">También en ${esc(p.both)}</em> · `:"",
  open(ci){const it=ALL[ci];if(!it)return;if(it.rr!=null){if(typeof ovCloseAll==="function")ovCloseAll();if(typeof showView==="function")showView("mapa");setTimeout(()=>verR(it.co,it.rr),80);return}if(typeof ovCloseAll==="function")ovCloseAll();if(typeof showView==="function")showView("mapa");setTimeout(()=>abrirCum(it.co,it.pp,it.k),80)}};
/* ---------- también en la pestaña Rutas: sus puntos que son rutas (capas de rutas o con «Distancia:») ---------- */
document.head.insertAdjacentHTML("beforeend",`<style>
#list .row.src-co{background:color-mix(in srgb,var(--cc) 16%,transparent);box-shadow:inset 5px 0 0 var(--cc)}
#list .row .cosrc{font-style:normal;font-weight:800}
.rsrc{margin:4px 0 10px}
</style>`);
const RUT=[];
for(const it of ALL){if(it.rr!=null){const r=it.co.r[it.rr],dm=(/(\d[\d.]*)/.exec(r[4])||[])[1];const fe=/^(\d{4})-(\d{2})/.exec(r[10]||"");RUT.push(Object.assign(Object.create(it),{cox:1,p:[],y:fe?+fe[1]:null,m:fe?+fe[2]:null,gx:1,iv:/raqueta|nieve|invern/i.test(r[2]+" "+r[0])?1:0,km:r[3]?r[3].replace(/\s*km/i," km"):"",de:dm?"+"+dm+" m":"",txt:norm(r[0]+" "+r[1]+" "+r[2])}));continue}
  const p=it.pp;if(!(/RUTA/i.test(p[7]||"")||/distancia\s*:/i.test(limpia(p[3]))))continue;
  const[F]=ficha(p[3]),dm=/\/(20\d\d)\/(\d\d)\//.exec(p[4]||"");
  RUT.push(Object.assign(Object.create(it),{cox:1,p:[],y:dm?+dm[1]:null,m:dm?+dm[2]:null,km:(/(\d+(?:[.,]\d+)?)\s*km/i.exec(F.km||"")||[])[1]?(/(\d+(?:[.,]\d+)?)\s*km/i.exec(F.km)[1].replace(".",",")+" km"):"",de:(/(\d[\d.]*)\s*m/i.exec(F.de||"")||[])[1]?"+"+(/(\d[\d.]*)\s*m/i.exec(F.de)[1])+" m":"",txt:norm(p[0]+" "+it.r+" "+limpia(p[3]))}))}
COLX.rsrc="todas";
COLX.isRuta=ci=>RUT.some(x=>x.ci===ci);
COLX.rutasCo=()=>ALL.filter(x=>x.rr!=null);
/* 📤 Compartir una ruta de un colaborador: texto con nombre, km, desnivel y de quién es + enlace que la abre en la app */
sheet.addEventListener("click",async e=>{if(!e.target.closest("[data-coshare]")||!sheet._cor)return;const{c,i}=sheet._cor,r=c.r[i];
  const deN=(/(\d[\d.]*)/.exec(r[4])||[])[1],nums=[r[3],deN?"+"+deN+" m":""].filter(Boolean).join(" · ");
  const url=APPURL+"#co="+c.id+"!"+encodeURIComponent(norm(r[0]).slice(0,90)),title=r[0];
  const text="🏔️ "+r[0]+(nums?" · "+nums:"")+"\nRuta de "+c.n+(r[7]?"\n📖 "+r[7]:"")+"\n🗺 Ábrela en la app de Los de las Claras:";
  try{if(navigator.share){await navigator.share({title,text,url});return}}catch(er){if(er&&er.name==="AbortError")return}
  try{await navigator.clipboard.writeText(text+"\n"+url);toast("Enlace copiado. Pégalo en WhatsApp.")}catch(er){window.open("https://wa.me/?text="+encodeURIComponent(text+"\n"+url),"_blank","noopener")}});
/* abrir un enlace compartido #co=<colaborador>!<nombre de la ruta> */
function abrirEnlaceCo(){const h=location.hash||"";if(!h.startsWith("#co="))return;const raw=h.slice(4),k=raw.indexOf("!");if(k<0)return;
  const id=raw.slice(0,k),nm=decodeURIComponent(raw.slice(k+1));try{history.replaceState(null,"",location.pathname+location.search)}catch(er){}
  const c=CO.find(x=>x.id===id),i=c&&c.r?c.r.findIndex(r=>norm(r[0]).slice(0,90)===nm):-1;
  if(i<0){toast("No encuentro esa ruta en la app");return}
  if(typeof ovCloseAll==="function")ovCloseAll();if(typeof showView==="function")showView("mapa");setTimeout(()=>verR(c,i),300)}
addEventListener("hashchange",abrirEnlaceCo);setTimeout(abrirEnlaceCo,400);
COLX.rut=()=>RUT;
COLX.rutaItem=(c,i)=>RUT.find(x=>x.rr===i&&x.co===c);
COLX.rKey=x=>rKeyCo(x.co,x.c);
COLX.byP=p=>ALL.find(x=>x.pp===p);
COLX.ln=(c,i)=>lineas().then(J=>(J[c.id]||[])[i]);
COLX.findPt=(n,lat,lon)=>{const k=norm(n);let b=-1,bd=.4;for(const x of ALL){if(!x.pp||norm(x.c)!==k)continue;const d=km({lat,lon},x);if(d<bd){bd=d;b=x.ci}}return b};
COLX.trkOf=k=>GXC&&GXC.c===k.c&&GXC.i===k.i?{ln:GXC.g.ln,km:GXC.g.km}:null;
// en la ficha de una ruta del grupo: «También en <colaborador>» con su tarjeta
COLX.also=r=>{const v=[];for(const i of r.p||[])for(const it of PAR[i]||[])if(!v.includes(it))v.push(it);if(!v.length)return "";
  const by={};for(const it of v)(by[it.co.n] ||= []).push(it);
  return Object.entries(by).map(([n,l])=>`<div class="sec"><h3>También en ${esc(n)}</h3><div class="rows">${l.map(it=>COLX.rrow(RUT.find(x=>Object.getPrototypeOf(x)===it)||Object.assign(Object.create(it),{y:null,km:"",de:""}))).join("")}</div></div>`).join("")};
COLX.rchips=()=>{const o=COLX.rsrc;const ops=[["todas","Todas",""],["grupo","Los de las Claras","#c3262e"],...CO.map(c=>["co_"+c.id,c.n,c.c])];
  return `<div class="chips rsrc">${ops.map(([v,l,col])=>`<button class="chip" data-rsrc="${v}" aria-pressed="${o===v}">${col?`<span class="dot" style="background:${col}"></span>`:""}${esc(l)}</button>`).join("")}</div>`};
COLX.routes=(q,limpio)=>{const o=COLX.rsrc;
  const c=(o==="grupo"||!limpio)?[]:RUT.filter(x=>(o==="todas"||o==="co_"+x.co.id)&&(!q||x.txt.includes(q))&&(!window.RFOK||RFOK(x)));
  return {c,hideG:o!=="todas"&&o!=="grupo"}};
COLX.near=(lat,lon)=>F.reg==="todas"&&!nExtra()&&!F.wz?RUT.filter(x=>!window.RFOK||RFOK(x)).map(x=>({r:x,d:km({lat,lon},x)})):[];
COLX.rrow=(x,extra)=>{const de=x.de?(/^\+/.test(x.de)?x.de:"+"+x.de):"",nums=[x.km,de].filter(Boolean).join(" · ");
  const fo=x.pp?x.pp[5]:(x.rr!=null?x.co.r[x.rr][9]:"");
  return `<button class="row src-co" style="--cc:${x.co.c}" data-cor="${x.ci}">${fo?`<img class="thumb" src="${esc(fo)}" alt="" loading="lazy">`:`<span style="display:grid;place-items:center;width:56px;flex:none">${COLX.ico(x)}</span>`}<div class="t"><b>${esc(x.c)}</b><span><em class="cosrc" style="color:${x.co.c}">${esc(x.co.n)}</em> · ${x.y?(x.m?MESES[x.m]+" ":"")+x.y:"Sin fecha"} · ${esc(x.r)}${extra?" · "+esc(extra):""}</span></div><span class="alt">${esc(nums)}</span></button>`};
if(typeof renderList==="function")renderList();
renderCols()}
if(window.LISTAS)LISTAS.render();
}).catch(e=>console.error("colaboradores",e))})();
