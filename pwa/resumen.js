/* ---------- Mis cosas › Resumen: cumbres subidas, por zonas y alturas, techos de concejo, lugares, mis puntos y tracks ---------- */
(function(){
const box=document.createElement("div");box.className="mpbox";box.id="resbox";box.hidden=true;document.body.appendChild(box);
document.head.insertAdjacentHTML("beforeend",`<style>
#resbox .big{display:flex;align-items:baseline;gap:8px;margin:2px 0 4px}#resbox .big b{font-size:40px;line-height:1;font-family:var(--f-display)}#resbox .big span{color:var(--muted);font-weight:600}
#resbox .bar{height:9px;border-radius:5px;background:#e9ece6;overflow:hidden;margin:4px 0 2px}#resbox .bar i{display:block;height:100%;background:var(--moss,#2a7a3b)}
#resbox h3{font-size:15px;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
#resbox .rw{margin:8px 0}#resbox .rw .t{display:flex;justify-content:space-between;font-weight:600;font-size:14.5px}#resbox .rw .t small{color:var(--muted);font-weight:600}
#resbox .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px}#resbox .cards div{border:1px solid var(--edge);border-radius:12px;padding:10px 6px;text-align:center}
#resbox .cards b{display:block;font-size:22px}#resbox .cards small{color:var(--muted);font-weight:600;font-size:12.5px}
#resbox .chips2{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}#resbox .chips2 span{border:1px solid var(--edge);border-radius:999px;padding:4px 10px;font-size:13px;background:var(--card)}
</style>`);
const key=p=>"c:"+norm(p.c),lkey=p=>"l:"+norm(p.c);
const fila=(t,a,b)=>`<div class="rw"><div class="t"><span>${t}</span><small>${a} de ${b}</small></div><div class="bar"><i style="width:${b?(a/b*100).toFixed(1):0}%"></i></div></div>`;
function render(){if(box.hidden)return;
  const C=PEAKS,hechas=C.filter(p=>MARKS[key(p)]==="hecha"),quiero=C.filter(p=>MARKS[key(p)]==="quiero");
  const zona=p=>{const z=zoneOf(p.r);return z==="dol"?"alp":z};
  const Z=[["cant","Cordillera Cantábrica"],["pir","Pirineos"],["alp","Alpes y Dolomitas"]].map(([z,n])=>{const all=C.filter(p=>zona(p)===z);return[n,all.filter(p=>MARKS[key(p)]==="hecha").length,all.length]}).filter(x=>x[2]);
  const B=[["Más de 2.000 m",p=>p.a>=2000],["De 1.500 a 2.000 m",p=>p.a>=1500&&p.a<2000],["Menos de 1.500 m",p=>!(p.a>=1500)]].map(([n,f])=>{const all=C.filter(f);return[n,all.filter(p=>MARKS[key(p)]==="hecha").length,all.length]});
  const techos=C.filter(p=>p.techo),th=techos.filter(p=>MARKS[key(p)]==="hecha");
  const alta=hechas.slice().sort((a,b)=>(b.a||0)-(a.a||0))[0];
  const L=SPOTS,lv=L.filter(p=>MARKS[lkey(p)]==="hecha").length,lq=L.filter(p=>MARKS[lkey(p)]==="quiero").length;
  const MT=MISPUNTOS.tracks(),kmT=MT.reduce((s,t)=>s+(+t.km||0),0);
  box.innerHTML=`<h2>🏆 Resumen</h2>
  <p class="note" style="margin-top:0">Cuenta las cumbres y lugares que salen en las rutas del blog. Ve marcándolos en Del grupo › Cumbres y Lugares (o en el mapa).</p>
  <div class="big"><b>${hechas.length}</b><span>cumbres subidas de ${C.length}</span></div><div class="bar"><i style="width:${(hechas.length/C.length*100).toFixed(1)}%"></i></div>
  <p class="note">${quiero.length?`★ ${quiero.length} en tu lista de «quiero subir»`:"Aún no tienes cumbres en «quiero subir»"}${alta?` · La más alta: <b>${esc(alta.c)}</b> (${(alta.a||0).toLocaleString("es-ES")} m)`:""}</p>
  <h3>Por zonas</h3>${Z.map(z=>fila(...z)).join("")}
  <h3>Por altura</h3>${B.map(b=>fila(...b)).join("")}
  ${techos.length?`<h3>Techos de concejo</h3>${fila("Techos subidos",th.length,techos.length)}${th.length?`<div class="chips2">${th.map(p=>`<span>⛰️ ${esc(p.techo)}</span>`).join("")}</div>`:""}`:""}
  <h3>Lugares</h3>${fila("Lugares visitados",lv,L.length)}${lq?`<p class="note">★ ${lq} en «quiero ir»</p>`:""}
  <h3>Lo tuyo</h3><div class="cards"><div><b>${MISPUNTOS.get().length}</b><small>puntos</small></div><div><b>${MT.length}</b><small>tracks${kmT?` · ${Math.round(kmT).toLocaleString("es-ES")} km`:""}</small></div><div><b>${window.OFFLINE?OFFLINE.list().length:0}</b><small>mapas</small></div></div>`}
window.RESUMEN={box,render};
})();
