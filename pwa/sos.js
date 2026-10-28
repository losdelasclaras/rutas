/* ---------- 🆘 Emergencia: tu posición en grande para dictarla, llamar al 112 y mandarla por SMS o WhatsApp ----------
   Funciona sin datos (el GPS no necesita cobertura). Coordenadas en grados decimales, grados-minutos-segundos y UTM (ETRS89). */
(function(){
document.head.insertAdjacentHTML("beforeend",`<style>
.sosbtn{margin-left:auto;flex:none;border:0;background:#d01f1f;color:#fff;font-weight:900;font-size:14px;letter-spacing:.04em;border-radius:999px;padding:7px 11px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.25)}
.sosbtn + .fsbtn {margin-left:6px}
.sosv{position:fixed;inset:0;z-index:6000;background:#fff;color:#111;overflow:auto;-webkit-overflow-scrolling:touch}
.sosv .in{max-width:520px;margin:0 auto;padding:16px 16px 40px}
.sosv h1{margin:4px 0 2px;font-size:28px;color:#c3131a;display:flex;align-items:center;gap:10px}
.sosv h1 button{margin-left:auto;border:0;background:#eee;border-radius:50%;width:44px;height:44px;font-size:24px;cursor:pointer}
.sosv .call{display:block;text-align:center;background:#c3131a;color:#fff;text-decoration:none;font-weight:900;font-size:26px;border-radius:16px;padding:18px 10px;margin:14px 0 8px}
.sosv .co{border:2px solid #111;border-radius:14px;padding:12px 14px;margin:12px 0}
.sosv .co small{display:block;font-size:13px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.sosv .co b{display:block;font-size:26px;line-height:1.25;font-variant-numeric:tabular-nums;word-break:break-word}
.sosv .co b.m{font-size:22px}
.sosv .st{font-size:16px;font-weight:700;margin:8px 0;padding:8px 10px;border-radius:10px;background:#f2f2f2}
.sosv .st.ok{background:#e7f5ea;color:#1f6b32}.sosv .st.mal{background:#fff1e0;color:#8a4b00}
.sosv .bs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
.sosv .bs a,.sosv .bs button{display:block;text-align:center;border:2px solid #111;background:#fff;color:#111;font-weight:800;font-size:17px;border-radius:12px;padding:13px 6px;text-decoration:none;cursor:pointer}
.sosv .nt{font-size:15px;color:#333;line-height:1.45}
.sosv .nt li{margin:4px 0}
</style>`);
const hdr=document.querySelector("header.top"),fs=document.getElementById("fsbtn");
const btn=document.createElement("button");btn.className="sosbtn";btn.textContent="SOS";btn.setAttribute("aria-label","Emergencia: tu ubicación y llamar al 112");
if(fs)fs.before(btn);else if(hdr)hdr.appendChild(btn);

/* UTM (ETRS89 ≈ WGS84) */
function utm(lat,lon){const a=6378137,f=1/298.257222101,k0=.9996,e2=f*(2-f),ep2=e2/(1-e2);
  const z=Math.floor((lon+180)/6)+1,l0=((z-1)*6-180+3)*Math.PI/180,p=lat*Math.PI/180,l=lon*Math.PI/180;
  const N=a/Math.sqrt(1-e2*Math.sin(p)**2),T=Math.tan(p)**2,C=ep2*Math.cos(p)**2,A=Math.cos(p)*(l-l0);
  const M=a*((1-e2/4-3*e2*e2/64-5*e2**3/256)*p-(3*e2/8+3*e2*e2/32+45*e2**3/1024)*Math.sin(2*p)+(15*e2*e2/256+45*e2**3/1024)*Math.sin(4*p)-(35*e2**3/3072)*Math.sin(6*p));
  const x=k0*N*(A+(1-T+C)*A**3/6+(5-18*T+T*T+72*C-58*ep2)*A**5/120)+500000;
  let y=k0*(M+N*Math.tan(p)*(A*A/2+(5-T+9*C+4*C*C)*A**4/24+(61-58*T+T*T+600*C-330*ep2)*A**6/720));if(lat<0)y+=10000000;
  const band="CDEFGHJKLMNPQRSTUVWXX"[Math.floor((lat+80)/8)]||"";
  return{z:z+band,x:Math.round(x),y:Math.round(y)}}
function gms(v,pos,neg){const s=v<0?neg:pos;v=Math.abs(v);const g=Math.floor(v),m=Math.floor((v-g)*60),x=Math.round(((v-g)*60-m)*60);return`${g}° ${m}' ${x}" ${s}`}
const n=v=>v.toLocaleString("es-ES");

let W=null,EL=null,LAST=null;
function pinta(){if(!EL)return;const q=LAST,body=EL.querySelector("[data-sosd]");
  if(!q){body.innerHTML=`<div class="st">📡 Buscando tu posición con el GPS… Si tarda, sal a un sitio despejado. No hace falta tener datos.</div>`;return}
  const u=utm(q.lat,q.lon),age=Math.round((Date.now()-q.t)/1000);
  const st=q.acc<=30?`<div class="st ok">✓ Posición buena · precisión ±${Math.round(q.acc)} m${age>20?` · hace ${age} s`:""}</div>`:`<div class="st mal">⚠️ Precisión ±${Math.round(q.acc)} m: espera un poco, irá mejorando${age>20?` · hace ${age} s`:""}</div>`;
  const ll=`${q.lat.toFixed(5)}, ${q.lon.toFixed(5)}`,maps=`https://maps.google.com/?q=${q.lat.toFixed(5)},${q.lon.toFixed(5)}`;
  const txt=`🆘 Necesito ayuda. Estoy en ${ll} (${gms(q.lat,"N","S")}, ${gms(q.lon,"E","O")}; UTM ${u.z} ${u.x} ${u.y})${q.alt!=null?`, a unos ${n(Math.round(q.alt))} m`:""}. ${maps}`;
  body.innerHTML=`${st}
  <div class="co"><small>Coordenadas (grados)</small><b>${q.lat.toFixed(5)}</b><b>${q.lon.toFixed(5)}</b></div>
  <div class="co"><small>Grados, minutos, segundos</small><b class="m">${gms(q.lat,"N","S")}</b><b class="m">${gms(q.lon,"E","O")}</b></div>
  <div class="co"><small>UTM · huso ${u.z} (ETRS89)</small><b class="m">X ${n(u.x)}</b><b class="m">Y ${n(u.y)}</b></div>
  ${q.alt!=null?`<div class="co"><small>Altura aproximada (GPS)</small><b class="m">${n(Math.round(q.alt))} m</b></div>`:""}
  <div class="bs"><a href="sms:?body=${encodeURIComponent(txt)}">💬 SMS a alguien</a><button data-sossh>📤 Mandar a alguien</button></div>`;
  EL._txt=txt}
function fix(p){const c=p.coords;LAST={lat:c.latitude,lon:c.longitude,acc:c.accuracy,alt:c.altitude!=null?c.altitude-(/iPhone|iPad|Macintosh/.test(navigator.userAgent)?0:50):null,t:Date.now()};pinta()}
function abre(){if(EL)return;EL=document.createElement("div");EL.className="sosv";EL.setAttribute("role","dialog");EL.setAttribute("aria-label","Emergencia");
  EL.innerHTML=`<div class="in"><h1>🆘 Emergencia<button data-sosx aria-label="Cerrar">×</button></h1>
  <a class="call" href="tel:112">📞 Llamar al 112</a>
  <p class="nt" style="margin:0 0 4px">Cuando te pregunten dónde estás, léeles estos números:</p>
  <div data-sosd></div>
  <ul class="nt">
  <li>Al 112 se puede llamar aunque tu compañía no tenga cobertura, si hay otra red cerca.</li>
  <li>Si la llamada no entra, manda tu ubicación por <b>SMS</b> a alguien de confianza para que avise: un SMS a veces sale con muy poca cobertura.</li>
  <li>Si puedes, no te muevas del sitio, abrígate y ahorra batería: baja el brillo y cierra otras apps.</li>
  </ul></div>`;
  document.body.appendChild(EL);LAST=null;pinta();
  if(navigator.geolocation)W=navigator.geolocation.watchPosition(fix,e=>{if(e&&e.code===1&&EL)EL.querySelector("[data-sosd]").innerHTML=`<div class="st mal">⛔ La app no tiene permiso para usar tu ubicación. Llama al 112 y diles dónde estás.</div>`},{enableHighAccuracy:true,maximumAge:0,timeout:60000});
  history.pushState({sos:1},"")}
function cierra(back){if(!EL)return;if(W!=null){navigator.geolocation.clearWatch(W);W=null}EL.remove();EL=null;if(back!==false&&history.state&&history.state.sos)history.back()}
btn.addEventListener("click",abre);
addEventListener("popstate",()=>{if(EL)cierra(false)});
document.addEventListener("click",async e=>{if(!EL||!EL.contains(e.target))return;
  if(e.target.closest("[data-sosx]")){cierra();return}
  if(e.target.closest("[data-sossh]")&&EL._txt){try{if(navigator.share){await navigator.share({text:EL._txt});return}}catch(er){if(er&&er.name==="AbortError")return}
    location.href="https://wa.me/?text="+encodeURIComponent(EL._txt)}});
window.SOS={abre,cierra};
})();
