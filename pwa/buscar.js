/* ---------- 🔎 buscador del mapa: arriba, encima de Cantábrica · Pirineos · Alpes ----------
   Busca a la vez rutas, cumbres y lugares (del grupo y de los colaboradores) y pueblos.
   Al tocar un resultado se abre su ficha en el mapa; un pueblo lleva a «Rutas cerca de…».
   «Ver todo en Explorar ›» pasa lo escrito al buscador de Rutas (los de Explorar se quedan como están). */
(function(){
const vm=document.getElementById("v-mapa"),bar=document.getElementById("mapbar");if(!vm||!bar)return;
const nk=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9ñ ]+/g," ").replace(/\s+/g," ").trim();
document.head.insertAdjacentHTML("beforeend",`<style>
#msearch{position:absolute;top:8px;left:max(10px,env(safe-area-inset-left,0px));right:max(10px,env(safe-area-inset-right,0px));z-index:30}
#msearch .mb{display:flex;align-items:center;gap:8px;background:var(--card);color:var(--ink);border:1px solid var(--edge);border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.18);padding:0 6px 0 14px;height:42px}
#msearch input{flex:1;min-width:0;border:0;background:transparent;color:inherit;font:inherit;font-size:16px;outline:none;height:100%}
#msearch .mx{border:0;background:none;color:var(--muted);font-size:20px;width:34px;height:34px;border-radius:50%;cursor:pointer}
#msearch .mx[hidden]{display:none}#msearch input::-webkit-search-cancel-button{display:none;-webkit-appearance:none}
#mres{margin-top:6px;background:var(--card);color:var(--ink);border:1px solid var(--edge);border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.25);max-height:62vh;overflow:auto;padding:4px 0}
#mres[hidden]{display:none}
#mres h4{margin:8px 14px 2px;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
#mres button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;color:inherit;font:inherit;text-align:left;padding:9px 14px;cursor:pointer}
#mres button:hover,#mres button:focus{background:color-mix(in srgb,var(--mark) 10%,transparent)}
#mres button .e{flex:none;width:24px;text-align:center;font-size:18px}
#mres button span{flex:1;min-width:0}#mres button b{display:block;font-size:15.5px;line-height:1.25}#mres button small{display:block;color:var(--muted);font-size:13px}
#mres .todo{justify-content:center;font-weight:800;color:var(--mark);border-top:1px solid var(--edge);margin-top:4px}
#mres .nada{padding:12px 14px;color:var(--muted)}
.mapbar{top:58px!important}
#pendban{top:108px!important}.fol.min{top:108px!important}
/* ordenador y tableta: buscador de ancho normal y las zonas a su lado (no tapa los botones + / −) */
@media(min-width:700px){#msearch{right:auto;width:400px}.mapbar{top:10px!important;left:420px!important;right:80px!important}#pendban{top:64px!important}.fol.min{top:64px!important}}
#v-mapa.fol-on #msearch{display:none!important}#v-mapa.grb-on #msearch{visibility:hidden}
</style>`);
vm.insertAdjacentHTML("beforeend",`<div id="msearch"><div class="mb"><span aria-hidden="true">🔎</span><input id="mq" type="search" placeholder="Busca una ruta, cumbre o pueblo" autocomplete="off" enterkeyhint="search"><button class="mx" id="mqx" aria-label="Borrar" hidden>×</button></div><div id="mres" hidden></div></div>`);
const inp=document.getElementById("mq"),res=document.getElementById("mres"),bx=document.getElementById("mqx");
L.DomEvent.disableClickPropagation(document.getElementById("msearch"));L.DomEvent.disableScrollPropagation(document.getElementById("msearch"));
let RES=[];
// 0 = empieza por lo buscado, 1 = una palabra empieza por ello, 2 = va dentro; y antes cuanto más al principio aparezca
const tiene=(t,q)=>{const n=nk(t),i=n.indexOf(q);if(i<0)return 9;return(n.startsWith(q)?0:(" "+n).includes(" "+q)?1:2)+Math.min(i,90)/100};
function busca(q0){const q=nk(q0);RES=[];if(q.length<2){res.hidden=true;return}
  const out={r:[],c:[],l:[],p:[]};
  // rutas del grupo y de los colaboradores
  for(const r of R){if(!r.u)continue;const sc=Math.min(tiene(routeTitle(r),q),tiene((r.p||[]).map(i=>P[i].c).join(" "),q)+1);if(sc<9)out.r.push({sc,t:routeTitle(r),s:[r.r,r.km?(+r.km).toLocaleString("es-ES",{maximumFractionDigits:1})+" km":""].filter(Boolean).join(" · "),e:"📘",go:()=>{openRoute(r.id);flyTo(r.lat,r.lon,12)}})}
  const T=window.COLX&&COLX.todo?COLX.todo():[];
  for(const x of T){// sus títulos empiezan por la zona («Ubiña | …»): cuenta sobre todo lo de después
    const tt=x.c.includes("|")?x.c.split("|").pop():x.c,s1=tiene(tt,q),sc=s1<9?s1:tiene(x.c,q)+3;if(sc>=9)continue;
    if(x.rr!=null)out.r.push({sc:sc+.5,t:x.c,s:x.co.n+(x.r?" · "+x.r:""),e:"📗",go:()=>COLX.open(x.ci)});
    else (x.k==="cumbre"?out.c:out.l).push({sc:sc+.5,t:x.c,s:x.co.n+(x.r?" · "+x.r:""),e:x.k==="cumbre"?"⛰️":"📍",go:()=>COLX.open(x.ci)})}
  // cumbres y lugares del grupo (sin repetir nombre)
  const vis=new Set();P.forEach((p,i)=>{if(p.x)return;const k=nk(p.c);if(vis.has(k))return;const sc=tiene(p.c,q);if(sc>=9)return;vis.add(k);
    (p.t==="cumbre"?out.c:out.l).push({sc,t:p.c,s:[p.a?p.a.toLocaleString("es-ES")+" m":"",p.r].filter(Boolean).join(" · "),e:p.t==="cumbre"?"⛰️":"📍",go:()=>{pickRoute(i);flyTo(p.lat,p.lon,13)}})});
  // pueblos: rutas cerca
  try{for(const s of (window.findSites?findSites(q0):[]).filter(s=>!/^(lugar del mapa|cumbre|lugar|ruta)/i.test(s.k||"")).slice(0,4))out.p.push({sc:0,t:s.alt?s.alt.split(";")[0]:s.n,s:[s.k,s.reg].filter(Boolean).join(" · ")+" · ver rutas cerca",e:"🏘️",go:()=>{if(window.CERCA&&CERCA.en)CERCA.en(s.lat,s.lon,s.n);else flyTo(s.lat,s.lon,13)}})}catch(e){}
  const ord=a=>a.sort((x,y)=>x.sc-y.sc||x.t.localeCompare(y.t,"es"));
  // la misma cumbre o lugar puede estar en el grupo y en un colaborador: solo una vez
  const uno=a=>{const v=new Set();return a.filter(x=>{const k=nk(x.t.split("|").pop());if(v.has(k))return false;v.add(k);return true})};
  const sec=[["Rutas",ord(out.r).slice(0,5)],["Cumbres",uno(ord(out.c)).slice(0,5)],["Lugares",uno(ord(out.l)).slice(0,3)],["Pueblos",out.p]];
  let h="";for(const[n,l]of sec){if(!l.length)continue;h+=`<h4>${n}</h4>`+l.map(x=>{RES.push(x);return`<button data-mr="${RES.length-1}"><span class="e">${x.e}</span><span><b>${esc(x.t)}</b>${x.s?`<small>${esc(x.s)}</small>`:""}</span></button>`}).join("")}
  res.innerHTML=(h||`<p class="nada">No encuentro nada con «${esc(q0)}».</p>`)+`<button class="todo" data-mtodo>Ver todo en Explorar ›</button>`;res.hidden=false}
let tm=0;inp.addEventListener("input",()=>{bx.hidden=!inp.value;clearTimeout(tm);tm=setTimeout(()=>busca(inp.value),120)});
inp.addEventListener("focus",()=>{if(inp.value)busca(inp.value)});
inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&RES[0]){e.preventDefault();elige(0)}if(e.key==="Escape"){cierra();inp.blur()}});
bx.addEventListener("click",()=>{inp.value="";bx.hidden=true;cierra();inp.focus()});
function cierra(){res.hidden=true}
function elige(i){const x=RES[i];if(!x)return;cierra();inp.blur();try{x.go()}catch(e){console.warn(e)}}
res.addEventListener("click",e=>{const b=e.target.closest("[data-mr]");if(b){elige(+b.dataset.mr);return}
  if(e.target.closest("[data-mtodo]")){const v=inp.value;cierra();inp.blur();showView("rutas");const q=document.getElementById("q");if(q){q.value=v;q.dispatchEvent(new Event("input"))}}});
document.addEventListener("pointerdown",e=>{if(!res.hidden&&!e.target.closest("#msearch"))cierra()},true);
})();
