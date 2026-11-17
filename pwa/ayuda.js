/* ---------- ❓ Ayuda (18 nov 2026) ----------
   Botón «?» en la cabecera (entre SOS y Aa+). Abre «¿En qué te ayudo?»: preguntas que se despliegan, con 2-4 pasos,
   una nota y un botón «Llévame» que te deja en ese sitio de la app. Letra grande.
   Se cierra con ✕, tocando fuera o con «Atrás» (clase cdbg + data-close: lo recoge atras.js).
   Textos acordados con Jonathan (doc del proyecto «bienvenida-ayuda»).
   Para quitarlo: borrar 'ayuda' de _mods en build_pwa.py. */
(function(){
const hdr=document.querySelector("header.top");if(!hdr)return;
const H=document.documentElement,PC=()=>H.classList.contains("pc"),APK=()=>H.classList.contains("apk");
document.head.insertAdjacentHTML("beforeend",`<style>
.ayubtn{flex:none;width:36px;height:36px;border-radius:50%;border:2px solid #fff;background:#2a7a3b;color:#fff;font:900 20px/1 system-ui,sans-serif;cursor:pointer;margin-left:6px;box-shadow:0 1px 4px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;padding:0}
html.pc .ayubtn{margin-left:auto}
.sosbtn + .ayubtn{margin-left:6px}
.ayubtn + .fsbtn{margin-left:6px}
.ayubg{position:fixed;inset:0;z-index:5900;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}
.ayubg[hidden]{display:none}
.ayup{background:var(--card,#fff);color:var(--ink,#1d1d1d);width:100%;max-width:640px;max-height:92dvh;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;border-radius:20px 20px 0 0;padding:16px 16px 28px;box-sizing:border-box}
html.pc .ayubg{align-items:center}html.pc .ayup{border-radius:20px;max-height:88dvh}
.ayuh{display:flex;align-items:center;gap:10px;position:sticky;top:-16px;background:var(--card,#fff);margin:-16px -16px 6px;padding:16px 16px 10px;z-index:1}
.ayuh h2{flex:1;margin:0;font-size:24px}
.ayux{flex:none;width:46px;height:46px;border-radius:50%;border:0;background:#c62828;color:#fff;font-size:28px;line-height:1;cursor:pointer}
.ayuq{border-top:1px solid var(--edge,#ddd)}
.ayuq>button{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:10px;width:100%;padding:15px 2px;font-size:19px;font-weight:700;line-height:1.3}
.ayuq>button .i{flex:none;width:30px;text-align:center;font-size:22px}
.ayuq>button .t{flex:1}
.ayuq>button .f{flex:none;font-size:18px;color:var(--muted,#777);transition:transform .15s}
.ayuq.on>button .f{transform:rotate(180deg)}
.ayua{display:none;padding:0 4px 16px 42px;font-size:17.5px;line-height:1.5}
.ayuq.on .ayua{display:block}
.ayua ol{margin:0 0 10px;padding-left:22px}.ayua li{margin-bottom:7px}
.ayua .nt{background:var(--land-dim,#f1efe9);border-radius:10px;padding:10px 12px;margin:4px 0 12px;font-size:16px;color:var(--ink,#333)}
.ayua .lv{display:inline-flex;align-items:center;min-height:50px;padding:0 18px;border:0;border-radius:12px;background:#c62828;color:#fff;font:inherit;font-size:18px;font-weight:800;cursor:pointer;text-decoration:none}
.ayuf{border-top:1px solid var(--edge,#ddd);padding-top:16px;text-align:center;font-size:16px;color:var(--muted,#666);line-height:1.6}
.ayuf a{color:inherit}
</style>`);

/* ---------- a dónde lleva cada «Llévame» ---------- */
const tab=v=>{const b=document.querySelector(`nav.tabs [data-v="${v}"]`);if(b)b.click()};
const sub=(sel)=>setTimeout(()=>{const b=document.querySelector(sel);if(b)b.click()},150);
const IR={
  buscar(){tab("mapa");setTimeout(()=>{const i=document.getElementById("mq");if(i){i.focus();i.scrollIntoView({block:"nearest"})}},450)},
  capas(){tab("mapa");setTimeout(()=>{const lg=document.querySelector(".legend");if(lg&&!lg.classList.contains("open")){const t=lg.querySelector(".laytog");if(t)t.click()}},250)},
  explorar(){tab("grupo");sub('#v-rutas [data-gs="rutas"]')},
  cumbres(){tab("grupo");sub('#v-rutas [data-gs="cumbres"], [data-gs="cumbres"]')},
  guardado(){tab("mios");sub('[data-ms="gd"]')},
  marcadas(){tab("mios");sub('[data-ms="ml"]')},
  mapa(){tab("mapa")},
  salidas(){tab("salidas")},
  retos(){tab("retos")},
  sos(){if(window.SOS&&SOS.abre)SOS.abre()},
  cuenta(){if(window.cuentaPanel)cuentaPanel()},
  dibujar(){tab("mapa");setTimeout(()=>{if(window.DIBUJAR&&DIBUJAR.abre)DIBUJAR.abre()},250)},
  android(){window.open("android.html","_blank","noopener")},
  privacidad(){window.open("privacidad.html","_blank","noopener")}
};

/* ---------- las preguntas: [icono, pregunta, pasos, nota, [botón, destino]] ---------- */
function preguntas(){
const pc=PC(),apk=APK();
return [
["🔎","Qué puedes buscar",[
  "Escribe arriba del mapa, en «Busca una ruta, cumbre o pueblo».",
  "Puedes buscar un pueblo, o cualquier cumbre, ruta o lugar que salga en los blogs.",
  "Toca un resultado para verlo en el mapa.",
  "Si es un pueblo, «🗺 Mapa» te lleva allí y «🥾 Rutas» te enseña las rutas de los blogs por esa zona."],
  "«Ver todo en Explorar ›» abre la lista completa, con filtros.",["Ir al buscador","buscar"]],
["🗂","Cómo funcionan las Capas del mapa",[
  "Toca «Capas», abajo a la izquierda. Se abre «Qué ver en el mapa». Cada línea tiene un interruptor: verde = se ve, gris = no se ve.",
  "Mapa: elige el mapa de fondo (topográfico, IGN u ortofoto, que es la foto aérea).",
  "Cada blog (Los de las Claras y los demás) tiene su apartado, con un interruptor que lo enciende o lo apaga entero. Ábrelo para elegir Cumbres, Lugares, Rutas o Tracks.",
  "Mis cosas: tus puntos, y señalar en el mapa lo que ya hiciste (✓) o quieres hacer (★)."],
  "Cada blog tiene su color, en un aro alrededor del icono. Una bola con número son varios puntos juntos: tócala para acercarte. Lo que cambias se queda guardado. Capas se cierra con ✕ o tocando el mapa.",["Abrir Capas","capas"]],
["〰️","Guarda o baja el track de una ruta",[
  "Abre la ruta, en el mapa o en Explorar.",
  "Toca «··· Otras opciones».",
  "«Guardar track»: queda una copia en Mis cosas › Guardado, para usarla sin cobertura.",
  "«📤 Compartir» › «📄 Enviar el archivo GPX»: para tenerlo como archivo o mandarlo a otra app."],
  "",["Ir a Explorar","explorar"]],
["📎","Abre un GPX que te mandan por WhatsApp",[
  "En WhatsApp, toca el archivo GPX. Si no se abre, mantenlo pulsado y toca «Compartir».",
  "En la lista de apps, elige «LdC Rutas».",
  "El track se abre en el mapa. Guárdalo y lo tendrás en Mis cosas › Guardado, también sin cobertura."],
  "Si no te sale la app en esa lista (iPhone o versión web), guarda el archivo en el móvil y en Mis cosas › Guardado toca «⬆️ Abrir GPX o KML». También vale para archivos KML.",["Ir a Guardado","guardado"]],
["▶️","Sigue una ruta en el monte",[
  "En la ficha de la ruta, toca «▶ Seguir».",
  "Verás la línea del track y tu posición (punto azul).",
  "En la app de Android se abre la pantalla de grabar: te dice lo que te falta, te avisa si te sales del track y puedes seguir dos tracks a la vez."],
  "En iPhone y en la versión web, la pantalla tiene que estar encendida.",["Ir a Explorar","explorar"]],
["📶","Usa el mapa sin cobertura",[
  "Lo que guardas en Mis cosas se ve sin cobertura: tus tracks («✈ Listo sin cobertura»), tus puntos y tus marcas.",
  "El mapa de fondo se guarda en la app de Android: en la pantalla de grabar, toca «🗺 Mapa».",
  "Elige el mapa (topográfico, IGN o ortofoto) y toca «⬇ Guardar la zona del track» o «⬇ Guardar lo que se ve». También puedes guardar los tres mapas a la vez.",
  "Al empezar a seguir un track, la app te pregunta si guardas el mapa de la zona."],
  "Mejor con wifi. El recuadro verde es la zona que se guarda.",apk?["Ir al mapa","mapa"]:["Cómo instalar la app de Android","android"]],
["✓","Marca una cumbre como hecha o pendiente",[
  "Abre la cumbre en el mapa o en Explorar › Cumbres.",
  "«✓ Subida» si ya la hiciste. «★ Quiero subir» si la tienes pendiente.",
  "En lugares: «✓ He estado» / «★ Quiero ir». En rutas: «✓ Hecha» / «★ Quiero hacerla»."],
  "Todo lo marcado está en Mis cosas › Marcadas.",["Ir a Marcadas","marcadas"]],
["🔴","Graba tu ruta",[
  "Solo en la app de Android: toca «⏺ Grabar», abajo en el mapa.",
  "Graba con la pantalla apagada y sin cobertura. Con «📍 Guardar un punto aquí» marcas sitios dentro del recorrido.",
  "Al acabar, «✓ Terminar y guardar». La tendrás en Mis cosas › Guardado, con sus puntos dentro."],
  "En iPhone y en la versión web no se puede grabar.",apk?["Ir al mapa","mapa"]:["Cómo instalar la app de Android","android"]],
["✏️","Dibuja un track en el ordenador",[
  "Solo en el ordenador: toca «✏️ Dibujar» en el mapa (o en Mis cosas › Guardado).",
  "Haz clic donde empieza y luego en cada punto del camino. «🥾 Por caminos» sigue las sendas; «📏 Línea recta» es para campo a través.",
  "Arrastra un punto para moverlo; clic derecho para quitarlo. Mientras dibujas ves los km, la subida y el perfil.",
  "Toca «Guardar»: queda en Mis cosas. Si entras con tu cuenta, lo tendrás también en el móvil para seguirlo."],
  "«Por caminos» sigue los caminos del mapa Topográfico. Con el IGN o la ortofoto puede haber sendas que no siga: ahí usa la línea recta.",pc?["Empezar a dibujar","dibujar"]:null],
["🆘","Para qué sirve el SOS",[
  "Toca el botón rojo «SOS» de arriba (en el móvil).",
  "Ves tu posición en varios formatos, por si te la pide el 112.",
  "Puedes llamar al 112 o mandar tu posición por SMS o WhatsApp."],
  "Para saber tu posición no hacen falta datos, solo GPS.",pc?null:["Abrir SOS","sos"]],
["👤","¿Necesito registrarme?",[
  "No. Lo que guardas se queda en tu móvil.",
  "Si entras con Google, no lo pierdes al cambiar de móvil y lo ves también en el ordenador.",
  "Para apuntarte a un reto y salir en su lista sí hace falta entrar."],
  "",["Entrar con Google","cuenta"]],
["👥","Apúntate a una salida de un grupo de montaña",[
  "Ve a la pestaña Salidas.",
  "Abre la salida: fecha, recorrido y track.",
  "En «✍️ Cómo apuntarse» tienes la forma de apuntarte con el club (enlace, teléfono o WhatsApp)."],
  "La salida la organiza el club, no la app.",["Ir a Salidas","salidas"]],
["🏆","Cómo funcionan los Retos",[
  "Ve a la pestaña Retos y abre uno (por ahora, Techos de Asturias).",
  "Marca las cumbres que has subido y, si quieres, sube una foto.",
  "Ganas medallas según avanzas y ves quién más las ha hecho. «🗺 Ver el reto en el mapa» te enseña las hechas y las que te faltan."],
  "Iremos añadiendo retos nuevos.",["Ir a Retos","retos"]],
["✉️","Contacto y privacidad",[
  "¿Algo no va o tienes una idea? Escríbenos a losdelasclaras@gmail.com.",
  "Sin cuenta, lo tuyo se guarda solo en tu móvil. En la privacidad tienes todo lo que guarda la app."],
  "",["Ver la privacidad","privacidad"]]
]}

/* ---------- el panel ---------- */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const bg=document.createElement("div");bg.className="cdbg ayubg";bg.hidden=true;
bg.innerHTML=`<div class="ayup" role="dialog" aria-modal="true" aria-label="Ayuda"><div class="ayuh"><h2>¿En qué te ayudo?</h2><button class="ayux" data-close aria-label="Cerrar">×</button></div><div class="ayul"></div>
<div class="ayuf">¿No encuentras lo que buscas?<br><a href="mailto:losdelasclaras@gmail.com">Escríbenos</a></div></div>`;
document.body.appendChild(bg);
const lista=bg.querySelector(".ayul");
function pinta(){lista.innerHTML=preguntas().map((q,i)=>`<div class="ayuq" data-i="${i}"><button aria-expanded="false"><span class="i">${q[0]}</span><span class="t">${esc(q[1])}</span><span class="f">▾</span></button>
<div class="ayua"><ol>${q[2].map(x=>`<li>${esc(x)}</li>`).join("")}</ol>${q[3]?`<div class="nt">${esc(q[3])}</div>`:""}${q[4]?`<button class="lv" data-ir="${q[4][1]}">${esc(q[4][0])} ›</button>`:""}</div></div>`).join("")}
function abre(i){pinta();bg.hidden=false;bg.querySelector(".ayup").scrollTop=0;
  if(typeof i==="number"){const q=lista.querySelector(`[data-i="${i}"]`);if(q){q.classList.add("on");q.querySelector("button").setAttribute("aria-expanded",true)}}}
function cierra(){bg.hidden=true}
bg.addEventListener("click",e=>{
  if(e.target===bg||e.target.closest("[data-close]")){cierra();return}
  const ir=e.target.closest("[data-ir]");if(ir){cierra();const f=IR[ir.dataset.ir];if(f)setTimeout(f,60);return}
  const qb=e.target.closest(".ayuq>button");if(qb){const q=qb.parentElement,on=q.classList.toggle("on");qb.setAttribute("aria-expanded",on);
    if(on)setTimeout(()=>q.scrollIntoView({block:"nearest",behavior:"smooth"}),50)}});
addEventListener("keydown",e=>{if(e.key==="Escape"&&!bg.hidden)cierra()});

/* ---------- el botón «?» de la cabecera ---------- */
const btn=document.createElement("button");btn.className="ayubtn";btn.textContent="?";btn.title="Ayuda";btn.setAttribute("aria-label","Ayuda");
const fs=document.getElementById("fsbtn");if(fs)hdr.insertBefore(btn,fs);else hdr.appendChild(btn);
btn.addEventListener("click",()=>abre());
window.AYUDA={abre,cierra};
})();
