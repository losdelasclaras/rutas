/* ---------- perfil interactivo: al pasar el dedo (o el ratón) por el perfil se ve el km y la altitud, y un punto en el mapa ---------- */
(function(){
document.head.insertAdjacentHTML("beforeend",`<style>svg.prof{touch-action:pan-y;cursor:crosshair}svg.prof .pg text.pt{font-weight:800;fill:var(--ink)}</style>`);
const W=600,H=190,pl=70,pr=8,pt=12,pb=34;
let MK=null,HT=null;
function rutaDe(svg){const c=svg.closest("#sheet,#ov");if(!c)return null;
  const g=c.querySelector("[data-gpx]");if(g){const r=R[+g.dataset.gpx];return r&&r.gx&&r.gx.ln?{ln:r.gx.ln,km:r.gx.km}:null}
  const m=c.querySelector("[data-mtfol]");if(m&&window.MISPUNTOS){const t=MISPUNTOS.tracks().find(x=>String(x.id)===m.dataset.mtfol);const ln=t&&MISPUNTOS.ptsOf(t);return ln?{ln,km:t.km}:null}
  return null}
function puntoEn(rt,km){const ln=rt.ln;let tot=0;const cum=[0];for(let i=1;i<ln.length;i++){tot+=map.distance([ln[i-1][0],ln[i-1][1]],[ln[i][0],ln[i][1]]);cum.push(tot)}
  const d=Math.min(tot,km*1000*(tot/((rt.km||tot/1000)*1000)));let i=1;while(i<cum.length-1&&cum[i]<d)i++;const f=cum[i]>cum[i-1]?(d-cum[i-1])/(cum[i]-cum[i-1]):0;
  return[ln[i-1][0]+(ln[i][0]-ln[i-1][0])*f,ln[i-1][1]+(ln[i][1]-ln[i-1][1])*f]}
function mover(svg,cx){const pl0=svg.querySelector("polyline");if(!pl0)return;const r=svg.getBoundingClientRect();if(!r.width)return;
  const X=+svg.dataset.x||0,lo=+svg.dataset.lo,hi=+svg.dataset.hi;if(!X||!(hi>lo))return;
  const vx=Math.max(pl,Math.min(W-pr,(cx-r.left)/r.width*W));const km=(vx-pl)/(W-pl-pr)*X;
  const P=pl0.getAttribute("points").trim().split(/\s+/).map(s=>s.split(",").map(Number));let j=1;while(j<P.length-1&&P[j][0]<vx)j++;
  const a=P[j-1],b=P[j],f=b[0]>a[0]?(vx-a[0])/(b[0]-a[0]):0,vy=a[1]+(b[1]-a[1])*f,ele=lo+(hi-lo)*(1-(vy-pt)/(H-pt-pb));
  let g=svg.querySelector(".pg");if(!g){g=document.createElementNS("http://www.w3.org/2000/svg","g");g.setAttribute("class","pg");
    g.innerHTML=`<line y1="${pt}" y2="${H-pb}" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 3"/><circle r="6" fill="var(--mark)" stroke="#fff" stroke-width="2"/><rect rx="6" height="26" fill="var(--card)" stroke="var(--edge)"/><text class="pt" font-size="15"></text>`;svg.appendChild(g)}
  const tx=`${km.toLocaleString("es-ES",{minimumFractionDigits:1,maximumFractionDigits:1})} km · ${Math.round(ele).toLocaleString("es-ES")} m`;
  const line=g.querySelector("line"),c=g.querySelector("circle"),rc=g.querySelector("rect"),t=g.querySelector("text");
  line.setAttribute("x1",vx);line.setAttribute("x2",vx);c.setAttribute("cx",vx);c.setAttribute("cy",vy);t.textContent=tx;
  const w=tx.length*8.2+14,lx=Math.max(pl,Math.min(W-pr-w,vx-w/2));rc.setAttribute("x",lx);rc.setAttribute("y",0);rc.setAttribute("width",w);t.setAttribute("x",lx+7);t.setAttribute("y",18);
  g.style.display="";
  // punto en el mapa (si se ve el mapa)
  const rt=rutaDe(svg);if(rt&&!document.getElementById("v-mapa").hidden&&document.getElementById("ov").hidden){const ll=puntoEn(rt,km);
    if(!MK)MK=L.circleMarker(ll,{radius:9,color:"#fff",weight:3,fillColor:"#c3262e",fillOpacity:1,interactive:false});MK.setLatLng(ll);if(!map.hasLayer(MK))MK.addTo(map)}
  clearTimeout(HT);HT=setTimeout(()=>{g.style.display="none";if(MK)MK.remove()},4000)}
document.addEventListener("pointermove",e=>{const s=e.target.closest&&e.target.closest("svg.prof");if(s)mover(s,e.clientX)});
document.addEventListener("pointerdown",e=>{const s=e.target.closest&&e.target.closest("svg.prof");if(s)mover(s,e.clientX)});
})();
