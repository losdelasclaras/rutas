/* ---------- pantalla de inicio (nov 2026) ----------
   · sin botón «Alpes» (sus rutas siguen en el buscador y en Explorar)
   · si ya dio permiso de ubicación y está en el Norte o en el Pirineo, abre centrado en la persona (zoom 10)
   · los nombres del mapa no se pisan: si chocan, se ve el de más prioridad (cumbre más alta > nuestros > colaboradores)
   Para quitarlo todo: borrar 'inicio' de la lista del build. */
(function(){
if(typeof map==="undefined")return;
document.head.insertAdjacentHTML("beforeend",`<style>
#mapbar [data-zone="alp"]{display:none!important}
#map .leaflet-tooltip.lbl.lbl-tapa{visibility:hidden!important}
</style>`);
// quien tenía guardada la zona Alpes vuelve al Norte
if(typeof ZK!=="undefined"&&ZK==="alp"){ZK="cant";try{store.set("ldc-zona","cant")}catch(e){}fitHome(false);renderMapbar()}

/* --- abrir donde está la persona --- */
const DENTRO=(la,lo)=>(lo>-9.4&&lo<-3.0&&la>41.8&&la<43.95)||(lo>-2.0&&lo<3.4&&la>42.0&&la<43.35);
const ini=map.getCenter(),iniZ=map.getZoom();let tocado=false;
map.on("dragstart zoomstart",e=>{if(e&&e.hard!==false&&Date.now()-T0>1500)tocado=true});const T0=Date.now();
function quieto(){const c=map.getCenter();return!tocado&&Math.abs(c.lat-ini.lat)<.02&&Math.abs(c.lng-ini.lng)<.02&&map.getZoom()===iniZ}
function libre(){const h=location.hash||"";if(h&&h!=="#"&&h!=="#mapa")return false;
  const sh=document.getElementById("sheet");if(sh&&!sh.hidden)return false;
  const vm=document.getElementById("v-mapa");if(vm&&(vm.hidden||vm.classList.contains("fol-on")||vm.classList.contains("grb-on")))return false;return true}
async function alAbrir(){try{
  if(!navigator.geolocation||!navigator.permissions||!navigator.permissions.query)return;
  const st=await navigator.permissions.query({name:"geolocation"});if(st.state!=="granted")return; // no se pide permiso al abrir
  navigator.geolocation.getCurrentPosition(pos=>{const la=pos.coords.latitude,lo=pos.coords.longitude;
    if(!DENTRO(la,lo)||!libre()||!quieto())return;
    if(typeof showMe==="function")try{showMe(la,lo,pos.coords.accuracy)}catch(e){}
    map.setView([la,lo],10,{animate:false});
    if(typeof ensureZone==="function")ensureZone(zoneAt(la,lo))},()=>{},{enableHighAccuracy:false,maximumAge:10*60*1000,timeout:8000})
}catch(e){}}
// desactivado 4 nov: la app entraba en bucle al arrancar (pendiente de revisar)
// setTimeout(alAbrir,300);

/* --- nombres sin pisarse --- */
function prio(el){const c=el.classList,la=el.querySelector(".la");const alt=la?parseInt(la.textContent.replace(/\D/g,""))||0:0;
  return c.contains("pk")?3e4+alt:c.contains("co")?(c.contains("cum")?1e4:0):2e4}
function rotulos(){const els=[...mapEl.querySelectorAll(".leaflet-tooltip.lbl")];if(!els.length)return;
  const it=[];for(const el of els){el.classList.remove("lbl-tapa");if(getComputedStyle(el).display==="none")continue;const r=el.getBoundingClientRect();if(!r.width)continue;it.push({el,r,p:prio(el)})}
  it.sort((a,b)=>b.p-a.p);const ok=[];const M=2;
  for(const x of it){const r=x.r;if(ok.some(o=>r.left<o.right+M&&r.right>o.left-M&&r.top<o.bottom+M&&r.bottom>o.top-M))x.el.classList.add("lbl-tapa");else ok.push(r)}}
let t=0;const luego=()=>{clearTimeout(t);t=setTimeout(rotulos,120)};
map.on("zoomend moveend",luego);map.on("tooltipopen layeradd",luego);
window.ROTULOS=rotulos;
})();
