/* ---------- el tiempo en la ficha de la ruta: previsión de 5 días en el punto (Open-Meteo, a la altura del punto) ---------- */
(function(){
document.head.insertAdjacentHTML("beforeend",`<style>
.wx{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:6px 0 10px}
.wx .d{border:1px solid var(--edge);border-radius:12px;padding:8px 2px;text-align:center;background:var(--card)}
.wx .d b{display:block;font-size:13px;text-transform:capitalize}.wx .d .i{font-size:26px;line-height:1.2}
.wx .d .t{font-weight:800;font-size:14px}.wx .d .t span{color:var(--muted);font-weight:600}
.wx .d small{display:block;font-size:11.5px;color:var(--muted);line-height:1.25}.wx .d small.ll{color:#1a5fb4;font-weight:700}
.wx .d small.vi{color:#8a4b00;font-weight:700}
.wxn{font-size:12px;color:var(--muted);margin:-4px 0 8px}
</style>`);
const ICON=c=>c===0?["☀️","Despejado"]:c<=2?["🌤️","Algo nuboso"]:c===3?["☁️","Nublado"]:c<=48?["🌫️","Niebla"]:c<=57?["🌦️","Llovizna"]:c<=67?["🌧️","Lluvia"]:c<=77?["🌨️","Nieve"]:c<=82?["🌦️","Chubascos"]:c<=86?["🌨️","Chubascos de nieve"]:["⛈️","Tormenta"];
const CK="ldc-wx2";   // modelo europeo ECMWF (IFS) servido por Open-Meteo
async function datos(lat,lon,alt){const k=`${lat.toFixed(2)},${lon.toFixed(2)},${alt||""}`;let c={};try{c=JSON.parse(sessionStorage.getItem(CK)||"{}")}catch(e){}
  if(c[k]&&Date.now()-c[k].t<3600e3)return c[k].d;
  const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}${alt?`&elevation=${alt}`:""}&models=ecmwf_ifs025&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max&timezone=auto&forecast_days=5`;
  const d=(await (await fetch(u)).json()).daily;c[k]={t:Date.now(),d};try{sessionStorage.setItem(CK,JSON.stringify(c))}catch(e){}return d}
async function pinta(el){el.dataset.ok="1";if(!navigator.onLine){el.outerHTML=`<p class="wxn">Sin conexión: la previsión se ve cuando haya cobertura.</p>`;return}
  try{const d=await datos(+el.dataset.lat,+el.dataset.lon,el.dataset.alt?+el.dataset.alt:0);if(!d||!d.time)throw 0;
    el.innerHTML=d.time.map((t,i)=>{const[ic,tx]=ICON(d.weather_code[i]);const dia=i===0?"hoy":i===1?"mañana":new Date(t+"T12:00").toLocaleDateString("es-ES",{weekday:"short"});
      const mm=d.precipitation_sum[i],vi=Math.round(d.wind_gusts_10m_max[i]||d.wind_speed_10m_max[i]||0);
      return`<div class="d" title="${tx}"><b>${dia}</b><div class="i">${ic}</div><div class="t">${Math.round(d.temperature_2m_max[i])}° <span>${Math.round(d.temperature_2m_min[i])}°</span></div><small class="${mm>=5?"ll":""}">💧 ${mm==null?"—":mm<0.5?"0 mm":(mm<10?mm.toLocaleString("es-ES",{maximumFractionDigits:1}):Math.round(mm))+" mm"}</small><small class="${vi>=60?"vi":""}">💨 ${vi} km/h</small></div>`}).join("");
    el.insertAdjacentHTML("afterend",`<p class="wxn">Previsión a ${el.dataset.alt?Number(el.dataset.alt).toLocaleString("es-ES")+" m":"la altura del punto"} · modelo europeo ECMWF (vía Open-Meteo). Lluvia en litros por m² y rachas máximas de viento.</p>`)}
  catch(e){el.outerHTML=`<p class="wxn">No he podido cargar la previsión ahora.</p>`}}
function busca(){document.querySelectorAll(".wx:not([data-ok])").forEach(pinta)}
const mo=new MutationObserver(busca);for(const id of ["sheet","ov"]){const el=document.getElementById(id);if(el)mo.observe(el,{childList:true,subtree:true})}busca();
})();
