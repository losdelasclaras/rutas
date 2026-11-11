/* ---------- 🆕 Aviso de versión nueva (11 nov 2026) ----------
   Al abrir la app (a los pocos segundos) y cada vez que vuelves a ella, se mira build.txt (la huella de la versión publicada).
   Si no coincide con la de esta página, sale arriba una barra pequeña: «🆕 Hay una versión nueva · Actualizar».
   Al tocar «Actualizar» se baja la página nueva, se guarda en el almacén de la app (para que no vuelva a salir la vieja) y se recarga.
   No sale mientras sigues una ruta o grabas (recargar las cortaría); se puede cerrar con ×.
   Sigue además la actualización silenciosa de antes (si vuelves tras 30 min, o si al abrir ya estaba bajada).
   Para quitarlo: borrar 'actualiza' de _mods en pwa/build_pwa.py. */
(function(){
document.head.insertAdjacentHTML("beforeend",`<style>
.actbar{position:fixed;left:8px;right:8px;top:calc(env(safe-area-inset-top,0px) + 66px);z-index:2500;display:flex;align-items:center;gap:8px;
  padding:8px 8px 8px 14px;border-radius:14px;background:#1e8e3e;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.3);font-weight:700;font-size:15px}
.actbar span{flex:1;min-width:0}.actbar button{border:0;border-radius:10px;font:inherit;cursor:pointer}
.actbar .up{background:#fff;color:#1e8e3e;padding:9px 14px;font-weight:800}.actbar .x{background:transparent;color:#fff;font-size:22px;width:38px;height:38px}
@media (min-width:860px){.actbar{left:auto;right:16px;width:420px}}
</style>`);
let BAR=null,ult=0,cerrada=null;
const ocupado=()=>(window.SEGUIR&&SEGUIR.get&&SEGUIR.get())||(window.GRABAR&&GRABAR.get&&GRABAR.get());
function muestra(v){if(BAR||cerrada===v||ocupado())return;
  BAR=document.createElement("div");BAR.className="actbar";BAR.setAttribute("role","status");
  BAR.innerHTML=`<span>🆕 Hay una versión nueva de la app</span><button class="up">Actualizar</button><button class="x" aria-label="Ahora no">×</button>`;
  BAR.querySelector(".x").onclick=()=>{cerrada=v;BAR.remove();BAR=null};
  BAR.querySelector(".up").onclick=actualiza;document.body.appendChild(BAR);if(window.DIAG)DIAG.apunta("versión","nueva disponible "+v)}
async function actualiza(){const b=BAR&&BAR.querySelector(".up");if(b){b.textContent="Bajando…";b.disabled=true}
  try{const r=await fetch("index.html?v="+Date.now(),{cache:"no-store"});
    if(r.ok&&window.caches){const ks=(await caches.keys()).filter(k=>/^ldc-v\d/.test(k));for(const k of ks)await (await caches.open(k)).put("index.html",r.clone())}}catch(e){}
  if(window.DIAG)DIAG.apunta("versión","actualizar");location.reload()}
async function mira(){if(!window.LDC_BUILD||!navigator.onLine||Date.now()-ult<60000)return;ult=Date.now();
  try{const r=await fetch("build.txt?"+Date.now(),{cache:"no-store"});if(!r.ok)return;const v=(await r.text()).trim();if(v&&v!==LDC_BUILD)muestra(v)}catch(e){}}
setTimeout(mira,6000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(mira,1500)});
// si el almacén de la app avisa de que ya bajó la página nueva (y no se recargó sola), también se ofrece
if(navigator.serviceWorker)navigator.serviceWorker.addEventListener("message",e=>{if(e.data&&e.data.t==="ldc-nueva")setTimeout(()=>{ult=0;mira()},1500)});
window.ACTUALIZA={mira,muestra};
})();
