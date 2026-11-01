/* ---------- capas de colaboradores: sus puntos (My Maps) y sus tracks (My Maps o Drive), cada uno con su color ---------- */
(function(){
const CO=__COLAB__;if(!CO.length||typeof map==="undefined")return;
document.head.insertAdjacentHTML("beforeend",`<style>
#map .cpt svg{position:absolute;width:calc(var(--ms,24px)*.92);height:calc(var(--ms,24px)*.92);transform:translate(-50%,-50%);cursor:pointer;border-radius:50%;box-shadow:0 0 0 2.5px var(--cc),0 1px 4px rgba(0,0,0,.45)}
#map .cpt.cum svg{width:calc(var(--ms,24px)*1.02);height:calc(var(--ms,24px)*1.02)}
#map .leaflet-tooltip.lbl.co{font-weight:700;text-decoration:underline;text-decoration-color:var(--cc);text-decoration-thickness:2px;text-underline-offset:2px}
.cpop{max-width:250px;font-size:15px;line-height:1.35}.cpop b{font-size:16.5px;display:block}.cpop .q{font-size:13px;color:#666;margin:2px 0 4px}
.cpop .dd{white-space:pre-line;max-height:38vh;overflow:auto}
.cpop img{width:100%;max-height:170px;object-fit:cover;border-radius:8px;margin:6px 0 4px;display:block}
.cpop a.vm{display:inline-block;margin-top:6px;font-weight:700}
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
if(pn){const ml=[...pn.querySelectorAll("p.laygh")].find(p=>/mis lugares/i.test(p.textContent));
  const h=CO.map(c=>`<p class="laygh">${esc(c.n)}</p>`+KS.map(([k,t,ic])=>`<button class="lay" data-lay="co_${c.id}_${k}" aria-pressed="true"><svg class="ico" viewBox="-12 -12 24 24" style="border-radius:50%;box-shadow:0 0 0 2.5px ${c.c}"><use href="#ic-${ic}" x="-12" y="-12" width="24" height="24"/></svg>${t}</button>`).join("")).join("");
  if(ml)ml.insertAdjacentHTML("beforebegin",h);else pn.insertAdjacentHTML("beforeend",h)}
const G={},LBL=[];
// al tocar un punto suyo se abre la misma ficha grande que en las rutas del grupo
const CATN={cumbre:"Cumbre",aloja:"Alojamiento",pueblo:"Pueblo con encanto",activo:"Turismo activo",area:"Área recreativa",otros:"Lugar"};for(const[k,l]of CATS)CATN[k]=CATN[k]||l;
const limpia=t=>(t||"").normalize("NFKC").replace(/[\u0332\u0333]/g,"");
function ficha(d){const F={},resto=[];
  for(let l of limpia(d).split("\n")){l=l.trim();if(!l||/^[.·•_\-–—\s]+$/.test(l)||/^(m[aá]s (info|datos)|datos t[eé]cnicos)/i.test(l.replace(/^\W+/u,"")))continue;
    const m=/^\W*\s*(punto de (?:inicio|partida)|inicio|salida|distancia|desnivel|dificultad|duraci[oó]n|tiempo)\s*:\s*(.+)$/iu.exec(l);
    if(m){const k=m[1].toLowerCase();F[/inicio|partida|salida/.test(k)?"sal":/dist/.test(k)?"km":/desn/.test(k)?"de":/dific/.test(k)?"dif":"tm"]=m[2].trim()}else resto.push(l)}
  return [F,resto]}
const cap1=s=>s?s[0].toUpperCase()+s.slice(1).toLowerCase():s;
function abrir(c,p,k){const[n,la,lo,d,u,f]=p,[F,resto]=ficha(d);
  const a=(/(\d[\d.]{2,4})\s*m\b/i.exec(n+" "+limpia(d))||[])[1];
  const desc=resto.filter(l=>!/^\W*\w[\w ]{1,20}:\s/u.test(l)),otros=resto.filter(l=>/^\W*\w[\w ]{1,20}:\s/u.test(l));
  sheet.classList.remove("full");
  sheet.innerHTML=`<div class="grab"></div>`+(f?`<div class="photo"><img src="${esc(f)}" alt="" onerror="this.parentNode.remove()"></div>`:"")+
  `<div class="sheet-head"><h2>${esc(n)}</h2><button class="x" aria-label="Cerrar" data-close>×</button></div>
  <div class="meta"><span class="tag" style="background:${c.c};color:#fff;border-color:${c.c}">${esc(c.n)}</span><span class="tag">${esc(CATN[k]||"Lugar")}</span>${a&&k==="cumbre"?`<span class="tag alt">${(+a.replace(/\./g,"")).toLocaleString("es-ES")} m</span>`:""}</div>
  ${desc.length?`<p class="desc">${desc.map(esc).join("<br>")}</p>`:""}
  ${(F.km||F.de||F.tm||F.dif)?`<div class="ficha">${F.km?`<div><b>${esc(F.km)}</b><span>Distancia</span></div>`:""}${F.de?`<div><b>${esc(F.de)}</b><span>Desnivel</span></div>`:""}${F.tm?`<div><b>${esc(F.tm)}</b><span>Duración</span></div>`:""}${F.dif?`<div><b>${esc(cap1(F.dif))}</b><span>Dificultad</span></div>`:""}</div>`:""}
  ${F.sal?`<p class="salida">Salida: ${esc(F.sal)}</p>`:""}
  ${otros.length?`<p class="desc" style="font-size:.92em;opacity:.85">${otros.map(esc).join("<br>")}</p>`:""}
  <div class="actions">${u?`<a class="btn primary" href="${esc(u)}" target="_blank" rel="noopener">Leer en ${esc(c.n)}</a>`:""}<a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query=${la},${lo}" target="_blank" rel="noopener">Google Maps</a></div>`;
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
    m.__n=p[0];m.__c=c.c;LBL.push(m);(cum?gc:g).addLayer(m)}
  G[c.id+"_l"]=g;G[c.id+"_c"]=gc}
// los nombres, como los del grupo: solo con el mapa cerca
function lbls(){const on=map.getZoom()>=12;for(const m of LBL){if(on&&!m.getTooltip())m.bindTooltip(esc(m.__n),{permanent:true,direction:"right",offset:[10,0],className:"lbl co",interactive:false});const te=on&&m.getTooltip()&&m.getTooltip().getElement();if(te)te.style.setProperty("--cc",m.__c);else if(!on&&m.getTooltip())m.unbindTooltip()}}
function sync(){for(const c of CO)for(const[k]of KS){const key=`co_${c.id}_${k}`,on=LAY[key]&&!LAY.solo&&!window.FOLONLY,g=G[c.id+"_"+k];
    if(on&&!map.hasLayer(g))g.addTo(map);else if(!on&&map.hasLayer(g))g.remove();
    const b=document.querySelector(`[data-lay="${key}"]`);if(b)b.setAttribute("aria-pressed",!!LAY[key])}
  lbls()}
map.on("zoomend",lbls);
document.querySelector(".legend").addEventListener("click",()=>setTimeout(sync,0));
setTimeout(sync,0);
})();
