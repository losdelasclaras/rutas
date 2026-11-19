/* ---------- 📲 Aviso de APK nuevo (18 nov 2026) ----------
   Solo dentro de la app Android (APK). El APK nuevo abre la web con «?apk=N» (su número de versión); los APK antiguos
   (hasta el 53) no lo mandan, así que cuentan como versión 0. La versión publicada está en apk-version.txt
   (lo escribe la compilación del APK al subirlo a la web).
   Si hay uno más nuevo sale una barra que NO se va sola (lo pidió Jonathan): «Descargar» lleva a android.html.
   La × la esconde hasta la próxima vez que se abra la app; desaparece del todo al instalar el APK nuevo.
   No sale mientras está abierta la bienvenida (.bvbg): espera a que se cierre.
   Para quitarlo: borrar 'apkaviso' de _mods en build_pwa.py. */
(function(){
let enApk=false,mia=0;
try{
  if(document.referrer.startsWith("android-app://es.losdelasclaras.rutas"))sessionStorage.setItem("ldc-apk","1");
  enApk=sessionStorage.getItem("ldc-apk")==="1";
  const q=new URLSearchParams(location.search).get("apk");
  if(q)sessionStorage.setItem("ldc-apkv",q);
  mia=parseInt(sessionStorage.getItem("ldc-apkv")||"0",10)||0;
}catch(e){}
if(!enApk)return;
try{if(sessionStorage.getItem("ldc-apkx"))return}catch(e){}
document.head.insertAdjacentHTML("beforeend",`<style>
.apkbar{position:fixed;left:8px;right:8px;top:calc(env(safe-area-inset-top,0px) + 66px);z-index:2450;display:flex;align-items:center;gap:8px;
  padding:10px 8px 10px 14px;border-radius:14px;background:#1a4bb0;color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.3);font-weight:700;font-size:17px;line-height:1.3}
.apkbar span{flex:1;min-width:0}
.apkbar button{border:0;border-radius:10px;font:inherit;cursor:pointer}
.apkbar .apkdl{background:#fff;color:#1a4bb0;padding:10px 14px;font-weight:800}
.apkbar .apkx{background:none;color:#fff;font-size:24px;padding:4px 8px;line-height:1}
</style>`);
function pinta(){
  if(document.querySelector(".apkbar"))return;
  if(document.querySelector(".bvbg")){setTimeout(pinta,1500);return}       // primero que termine la bienvenida
  const b=document.createElement("div");b.className="apkbar";
  b.innerHTML=`<span>🆕 Hay una versión nueva de la app para Android</span><button class="apkdl">Descargar</button><button class="apkx" aria-label="Cerrar">×</button>`;
  if(document.querySelector(".actbar"))b.style.top="calc(env(safe-area-inset-top,0px) + 124px)";
  b.querySelector(".apkdl").onclick=()=>window.open("android.html","_blank","noopener");
  b.querySelector(".apkx").onclick=()=>{b.remove();try{sessionStorage.setItem("ldc-apkx","1")}catch(e){}};
  document.body.appendChild(b);
}
// 19 nov 2026: también al volver a la app (como mucho cada 5 min): antes solo se miraba al abrirla de cero y, si estaba abierta
// en segundo plano, el aviso no salía hasta cerrarla del todo
let ULT=0;function mira(){if(Date.now()-ULT<300000)return;ULT=Date.now();
  fetch("apk-version.txt?t="+Date.now(),{cache:"no-store"}).then(r=>r.ok?r.text():"").then(t=>{
  const ult=parseInt((t||"").trim(),10)||0;
  if(ult>mia)pinta();
}).catch(()=>{})}
setTimeout(mira,2500);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(mira,1500)});
})();
