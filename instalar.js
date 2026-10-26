/* ---------- instalar la app con un toque: al abrir el enlace sale un cuadro grande «Instalar» ----------
   Android/Chrome: botón que lanza la instalación directamente. iPhone: cómo añadirla (Apple no deja instalar con un botón).
   Si el enlace se abrió dentro de WhatsApp, Instagram o Facebook: botón para abrirlo en Chrome (ahí no se puede instalar). */
(function(){
const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
if(standalone)return;
const ua=navigator.userAgent,android=/Android/i.test(ua),ios=/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
const inapp=/FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|; wv\)/i.test(ua);
if(!android&&!ios)return;                       // en el ordenador no se molesta
const K="ldc-instalar";let st={};try{st=JSON.parse(localStorage.getItem(K)||"{}")}catch(e){}
if(st.no&&Date.now()-st.no<5*864e5)return;      // «Ahora no»: no se vuelve a ofrecer en 5 días
document.head.insertAdjacentHTML("beforeend",`<style>
.instbg{position:fixed;inset:0;z-index:6000;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}
.instdlg{background:var(--card);color:var(--ink);width:100%;max-width:480px;border-radius:22px 22px 0 0;padding:20px 20px calc(22px + env(safe-area-inset-bottom,0px));box-shadow:0 -8px 30px rgba(0,0,0,.3);text-align:center}
.instdlg img{width:92px;height:92px;border-radius:20px;box-shadow:0 2px 10px rgba(0,0,0,.18)}
.instdlg h2{margin:12px 0 6px;font-size:22px}.instdlg p{margin:6px 0;font-size:16px;line-height:1.4}
.instdlg .big{display:block;width:100%;margin:16px 0 8px;border:0;border-radius:14px;padding:16px;font-size:19px;font-weight:800;background:#c3262e;color:#fff;cursor:pointer;text-decoration:none}
.instdlg .no{border:0;background:none;color:var(--muted);font-size:15px;padding:8px;cursor:pointer}
.instdlg ol{text-align:left;font-size:16px;line-height:1.5;margin:10px 0 6px;padding-left:22px}
.instdlg .ico{display:inline-block;border:1px solid var(--edge);border-radius:6px;padding:0 6px;font-weight:700}
</style>`);
let bg=null,ev=null;
function cerrar(no){if(bg){bg.remove();bg=null}if(no){st.no=Date.now();try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}}}
function cuadro(html){if(bg)bg.remove();bg=document.createElement("div");bg.className="instbg";
  bg.innerHTML=`<div class="instdlg"><img src="icons/icon-192.png" alt="">${html}<button class="no" data-ino>Ahora no</button></div>`;document.body.appendChild(bg);
  bg.addEventListener("click",e=>{if(e.target===bg||e.target.closest("[data-ino]"))cerrar(true)})}
const titulo=`<h2>Instala la app en tu móvil</h2><p>Rutas, cumbres y mapas del grupo, también <b>sin cobertura</b>.</p>`;

// 1) dentro de WhatsApp / Instagram / Facebook: abrir en Chrome (o en Safari)
if(inapp){setTimeout(()=>{
  const url=location.href.replace(/^https?:\/\//,"");
  if(android)cuadro(titulo+`<p>Para instalarla, ábrela en Chrome:</p><a class="big" href="intent://${url}#Intent;scheme=https;package=com.android.chrome;end">Abrir en Chrome</a>`);
  else cuadro(titulo+`<ol><li>Toca <span class="ico">···</span> o <span class="ico">⋯</span> arriba o abajo.</li><li>Elige <b>«Abrir en Safari»</b> (o «Abrir en el navegador»).</li></ol>`)},1500);return}
// 2) Android con Chrome: botón que instala directamente
if(android){
  addEventListener("beforeinstallprompt",e=>{ev=e;setTimeout(()=>{if(!bg)cuadro(titulo+`<button class="big" data-igo>📲 Instalar</button><p style="font-size:14px;color:var(--muted)">Gratis · sin tienda · ocupa muy poco</p>`)},2500)});
  document.addEventListener("click",async e=>{if(!e.target.closest("[data-igo]"))return;const p=ev||window.deferredInstall;cerrar(false);if(!p)return;
    try{p.prompt();const r=await p.userChoice;if(r&&r.outcome==="accepted")toast("Instalando… la tendrás en tu pantalla de inicio")}catch(err){}});
  addEventListener("appinstalled",()=>cerrar(false));return}
// 3) iPhone (Safari): Apple no permite un botón; se explica en dos pasos
if(ios)setTimeout(()=>cuadro(titulo+`<ol><li>Toca el botón <b>Compartir</b> <span class="ico">⬆︎</span> (abajo en Safari).</li><li>Baja y toca <b>«Añadir a pantalla de inicio»</b>.</li></ol>`),2500);
})();
