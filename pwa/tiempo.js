/* ---------- el tiempo en la ficha de la ruta: previsión de 5 días de meteoblue en el punto y a su altura ---------- */
(function(){
document.head.insertAdjacentHTML("beforeend",`<style>
.wx{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:6px 0 10px}
.wx .d{border:1px solid var(--edge);border-radius:12px;padding:8px 2px;text-align:center;background:var(--card)}
.wx .d b{display:block;font-size:13px;text-transform:capitalize}.wx .d .i{font-size:26px;line-height:1.2}
.wx .d .t{font-weight:800;font-size:14px}.wx .d .t span{color:var(--muted);font-weight:600}
.wx .d small{display:block;font-size:11.5px;color:var(--muted);line-height:1.25}.wx .d small.ll{color:#1a5fb4;font-weight:700}
.wx .d small.vi{color:#8a4b00;font-weight:700}
.wxn{font-size:12px;color:var(--muted);margin:2px 0 8px}.wxn a{color:inherit}
.mbw iframe{display:block;width:100%;height:250px;border:1px solid var(--edge);border-radius:12px;background:#fff}
</style>`);
const ICON=c=>c===0?["☀️","Despejado"]:c<=2?["🌤️","Algo nuboso"]:c===3?["☁️","Nublado"]:c<=48?["🌫️","Niebla"]:c<=57?["🌦️","Llovizna"]:c<=67?["🌧️","Lluvia"]:c<=77?["🌨️","Nieve"]:c<=82?["🌦️","Chubascos"]:c<=86?["🌨️","Chubascos de nieve"]:["⛈️","Tormenta"];
const CK="ldc-wx2";   // modelo europeo ECMWF (IFS) servido por Open-Meteo
async function datos(lat,lon,alt){const k=`${lat.toFixed(2)},${lon.toFixed(2)},${alt||""}`;let c={};try{c=JSON.parse(sessionStorage.getItem(CK)||"{}")}catch(e){}
  if(c[k]&&Date.now()-c[k].t<3600e3)return c[k].d;
  const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}${alt?`&elevation=${alt}`:""}&models=ecmwf_ifs025&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max&timezone=auto&forecast_days=5`;
  const d=(await (await fetch(u)).json()).daily;c[k]={t:Date.now(),d};try{sessionStorage.setItem(CK,JSON.stringify(c))}catch(e){}return d}
// Meteoblue (widget oficial gratuito, con su enlace de atribución): la previsión en el punto y a su altura
function pinta(el){el.dataset.ok="1";
  if(!navigator.onLine){el.outerHTML=`<p class="wxn">Sin conexión: la previsión se ve cuando haya cobertura.</p>`;return}
  const lat=(+el.dataset.lat).toFixed(3),lon=(+el.dataset.lon).toFixed(3),alt=el.dataset.alt?Math.round(+el.dataset.alt):"";
  const loc=`${lat}N${lon}E${alt}_Europe%2FMadrid`;
  const q="geoloc=fixed&days=5&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&precipunit=MILLIMETER&coloured=coloured&pictoicon=1&maxtemperature=1&mintemperature=1&windspeed=1&windgust=1&winddirection=0&uv=0&humidity=0&precipitation=1&precipitationprobability=1&spot=0&pressure=0&layout=light";
  el.outerHTML=`<div class="mbw"><iframe src="https://www.meteoblue.com/es/tiempo/widget/daily/${loc}?${q}" title="Previsión meteoblue" loading="lazy" scrolling="no" allowtransparency="true"></iframe>
  <div class="wxn"><a href="https://www.meteoblue.com/es/tiempo/semana/${loc}" target="_blank" rel="noopener">meteoblue</a> · previsión a ${alt?Number(alt).toLocaleString("es-ES")+" m":"la altura del punto"} · toca el recuadro para verla completa</div></div>`}
function busca(){document.querySelectorAll(".wx:not([data-ok])").forEach(pinta)}
const mo=new MutationObserver(busca);for(const id of ["sheet","ov"]){const el=document.getElementById(id);if(el)mo.observe(el,{childList:true,subtree:true})}busca();
})();
