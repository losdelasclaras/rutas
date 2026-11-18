/* ---------- ❓ Ayuda (18 nov 2026) ----------
   Botón «?» en la cabecera (entre SOS y Aa+). Abre «¿En qué te ayudo?»: preguntas que se despliegan, con 2-4 pasos,
   una nota y un botón «Llévame» que te deja en ese sitio de la app. Letra grande.
   Se cierra con ✕, tocando fuera o con «Atrás» (clase cdbg + data-close: lo recoge atras.js).
   Logo de Andariega arriba del panel (18 nov, webp 240 px en base64). Textos acordados con Jonathan (doc del proyecto «bienvenida-ayuda»).
   Para quitarlo: borrar 'ayuda' de _mods en build_pwa.py. */
(function(){
const hdr=document.querySelector("header.top");if(!hdr)return;
const H=document.documentElement,PC=()=>H.classList.contains("pc"),APK=()=>H.classList.contains("apk");
document.head.insertAdjacentHTML("beforeend",`<style>
.ayubtn{flex:none;width:36px;height:36px;border-radius:50%;border:2px solid #fff;background:#2a7a3b;color:#fff;font:900 20px/1 system-ui,sans-serif;cursor:pointer;margin-left:6px;box-shadow:0 1px 4px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;padding:0}
html.pc .ayubtn{margin-left:auto}
.sosbtn + .ayubtn{margin-left:6px}
.ayubtn + .fsbtn {margin-left:6px}
.ayubg{position:fixed;inset:0;z-index:5900;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}
.ayubg[hidden]{display:none}
.ayup{background:var(--card,#fff);color:var(--ink,#1d1d1d);width:100%;max-width:640px;max-height:92dvh;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;border-radius:20px 20px 0 0;padding:16px 16px 28px;box-sizing:border-box}
html.pc .ayubg{align-items:center}html.pc .ayup{border-radius:20px;max-height:88dvh}
.ayuh{display:flex;align-items:center;gap:10px;position:sticky;top:-16px;background:var(--card,#fff);margin:-16px -16px 6px;padding:16px 16px 10px;z-index:1}
.ayuh h2{flex:1;margin:0;font-size:24px}
.ayux{flex:none;width:46px;height:46px;border-radius:50%;border:0;background:#c62828;color:#fff;font-size:28px;line-height:1;cursor:pointer}
.ayulogo{text-align:center;margin:2px 0 12px}.ayulogo img{width:112px;height:112px;border-radius:22px;box-shadow:0 2px 8px rgba(0,0,0,.2)}
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
.ayuf a{color:inherit}.ayuf .lv{display:inline-flex;align-items:center;min-height:50px;padding:0 18px;border:0;border-radius:12px;background:#c62828;color:#fff;font:inherit;font-size:18px;font-weight:800;cursor:pointer}
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
  bienvenida(){if(window.BIENVENIDA)BIENVENIDA.abre()},
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
  "En la lista de apps, elige «Andariega».",
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
bg.innerHTML=`<div class="ayup" role="dialog" aria-modal="true" aria-label="Ayuda"><div class="ayuh"><h2>¿En qué te ayudo?</h2><button class="ayux" data-close aria-label="Cerrar">×</button></div><div class="ayulogo"><img alt="Andariega" src="data:image/webp;base64,UklGRtgnAABXRUJQVlA4IMwnAACQjQCdASrwAPAAPmEqkUWkIqGiqpN8SIAMCWgIcA2RwaQhwgPQmDdDGHv3XnK2X/If3n9X/lV8xvGvrzzxudv+B/efyf+W//P9VH6p/6XuCfrJ/vv7l63P7Ae9X93fUJ+v/7We8z/x/V9/ePUF/q390//PrK+yL6AH7j+mn+4Xwl/2j/p/t/8C37Uf+b2AP//6gH/o4qz/H+lLxw/Hflt/bvIr9d/hPzA/wH/S4AbM99uf0/+G/cL80vmzvN+XH+R6gX4t/Mv8B+Zn9g4moAH5n/QP9h/fPyM9Sf+u9DftL7AH9G/vH+9/NvmRfVfYB/ov+E/63+T/LD6Yv6r/0f5//Zfux7bvzz/If+//Q/AT/K/7F/zv8Z7Y///91H71+yv+8rP0SZQYPGIwgtnze9R3Rbenl1PRB/GzVznrkPOey3oWEF/19hBYuNkZ393///Z5wbznV++NpPLF5T2wnDBf/dSYa8kGjjyWbm1JSN3Npls4d//pwxxTztq2IDCI0XINNQwhSwwl93oLah//a2YXKRxfSLJzwqhe14ADM8v////3EILMdbDmRsbwgdGDcjMp3BlSmERxfuzN9JrrYN2K50wTA6+QD5f4VXoEX0gVv/DcZi0m2EFwSmRTRn5kua2An+p5aYXqwIyj6Z1y9+RVZRh2LbCEUnau/E2+ZpRvr/pv///fWVtFHamMT0UlN6A7F+2p20oyFehYDt97D1Vv9irEOEp/9DIrprNtn+otzCPIDsKBW/bG/KW+296xfFzuWfeIFb3AvB47GJTMgrEcLtIGsb92H+X6LFQ4pcYpDcIomVaFqBbZoVvHNntwRe7fN98Wm0VLLQvyC3hFTwKK56VWkwOvGo4MMiHH+cgH0sCUdhm6LNxo2JIcY8AcXiuzUfezUS/B+FF5s30F8iFshXpg1ASfc/ASo+3MOacuVKt1Mb/ujBzEDCAWqloRvyqyaXey6s2U///5NcEg4wOqqoMRGewpXpnmzZ9+cgbOBamJ8l7k/qzw0gLXREBD2yrIPHCg4IX8wY89n3krIzIl6KRTvc+Wexosmf/J5v7lIPd7R//Yr1tYnck+njkXuNJex2Ye634dk5bLbY2JxzxdGVcQIt9pwKqXf5z7XO8VS+FiLev+GTQBLRgyicq7waWxIBnt6CJOfDKcnAKe2uYNYds7Zyy8961epOzaJGfTKZfopFbXXietj1xms+f8GTs3lZzJz0pFz4f6BVzMauBHzs7x8uFJIymBwIJ+uxU8zNr9Rn9M7Hu3lCjaU0XtNBuWU0PNPtgiqZ+mmjUMH/t/9dM9iiqAhj7gBIl2kGgDVXZRjvazaxmsQbVGZMWC72e6w37exYb5Vvdrw4geWRj9NY7dvtDFHa4BZic5RiQORghREZbq5Q/TNOtQSkWfGrt3smXn2tFvAMa89RqkUid4rMEk0cvD6XiZ0cyEx6FRROX/gnwGq3l5GeGBTry9QS0sYn4VFK6ih+GbuO3MDVpgSUUVeEdVLbyEY8jaItrXgHwtxMoAAP7/X8l70m9BRlj2tVNMAkUsBUKCU51dIRQ7kwo3ssUU7Iq8HaK/J4ny2aPgd/xcmCt67g+9VYc3YgurzclnTgUV3fWisAqWzXI7RH/G57ttmBA0ZfgQXMs6ZQTupCHS/9tMELnMsgWss+Kqnqcxx+EfXf9MC5th0+Z1zbk9Ha9wgXAIcasND94O/xAOaU7ix2YZzwZPAjjXd02qH26Wnl3Z+z1b1Z5aM/c3wp88xgC5jcD+x78nt/6Ohs8YhmwPC7n4cVWJPgL1iwvDcreBIh+OLE0yh7Xn+6r0bSwve8QZe7YUzgGzMRJX704F5TLzs6trS0W1D80QWBRM/+WpCWvuxfeKEHfhu8cnomyWxIPz88F1vtzLlGUJxZFX0ohjq2wbrRtyKux/2CA+MOfshlmgtSs1QRaVxpzCJ/TS7BrbFtY1oKCoFMpW3SCQX/nipX6SN5dtb9+4Us7FwcMMVpY/1QMZMA0zaRE6aOH6hkCKcB/xT4P4dUF+DkvpnqpHwQxRZ1FzrJKUr7EjgU7DIyDc2qY/c3maQv/JhX7LJX8SpSRUrbU315Qi7g7XC27Z7Zy1thR88Q8LMjIrnxNadJXoM+eKufAtuD7CnMgm8UaXe86eWj+DYA8mRWyz2AG9nGl/MHQz/dZINGv0Ok8jVvEL+ahAZK8WT09UFuwHDeu5CnBjLjPe0Hx2+ff4IQYh3heE/+aMyANV+2NKgP96fWlxiTAPq2ve5bSjNjWM06GZb8EEuGJi8rVRz/e/PT0xf8R8Nfn+Bv7lgAdj46t0anliJ3KU/la6knfkkdLpwACb9j1yznMgQG0aF9d0uPt1YFnoWRE0ybOpi3niiJ0iNZDbIbFrXIpVTsHd64dNYdKjznlRfE/EzLu4QNcmn1rM9p4xgdIVBWEh0KWhew5l0A/P8bTiqezbeDJVFCK4LZ6ERvPhGX8YFCS5afYI5KQrha0H5WLkahms1d3J8kH47Q0/wIldJOdM92AtIkucAJgDdmKdWOg26oXZu+5/ZkrI44xveTdB3rSI5kFSb2QRQ0572TSZ07rO42AUz+Dv2bECsW6WGBJlVmRV0vWn9AxBWNDKJygX+/cFpeefuwvk02ICZ/NXQeKIxSGvdDDkOaBpDNF/KdfKy8Bw8t+Fn7fEQVtPiTPhrRA79pE0Uk7BGCNoop4NqhiHAKlWgnUagpz3CbVt5KYgDYJO4rbNisLmcAgcE/2cyK7vZ7mteoRoBJWYtR+1ob6Ylncf03DnrXfJdIUBcfC6m/KyIImjWqyfrnQj3uuFsb674m61wCv8US4NHyBvftu5nUnT5GCsuI0lY9HEkPEkk4vnevMHYzvEPisfIo5Ay4nYtPA8nhOT6yNYhFQkbzraigVWliTuxLLMPYfGuC4KH1eMyoK45LD83niSG6psLDmc1rWI1NifdlO86DSpq09FdvQT5Hn3GgDtZN8zY2vYlcGe2yd0l1lOSjeGsi6hkpYRlasl13FjgdqJHj0dzyeXxl0tRKsEexmuouII0Pp1HRVzaoDLmJgVHd+I8RMIHItLzHJayfOavRyzwUrpLDvNfbqe8DmqKJ0yHRqcDKSIOI6JkXHMck8piY/1PdBdXnXM17RM48qtJjOqFivxL+UUBoDWnNYg1h2RqwzWpDf4dNZ8fO4slXZzzAqQUT810RsrlCuap2l8L9WtPbSfSWwyDmTNmBDukedP7Qe9+HIF1BDM4OsICFJZxWctWowyb+TsipyTeIyNdT2jNxO5/zSmiTZxkGL/NINEv2/1nSfnOuaBT/Mx/rL/HBq5tNafaJLgUx+Uw+tcRj1h6x7pBQk4aIfpjTv1zsFVlLnvgvd2jGUl744HzriOpUTDSmbPnU2tdR6/wA5/vL1QPT8/bnivtYKnMy1Vpv4v3aA/FPN/+qZ8txBTGeSbtYPGcYsouOS1P0DhA6t9cenrDmM72dhgmsXR6X5fw015F02gBz2gUD8IgTRECWu399vs7BKznvUT/b46M8Wh6rHcxfl9p+6R+Mp/Nn65kVp7bsTjABy2ShqYDKazVB+7fNc5K+kJbbmyCy/HT6k06kP3mAq89VnSuKxHp6+fZaat1V8huWYo3pu607Fku/4l+ggEE705Py/ZO0pJWFlidaJPbRXPlSThUvbnlW2vm2ZkzuoZNKIFiX3JCOnb5g+TXSh1Bwlou4TlCFw1ejDy6JC/BOz1zMnNHcCFng9YsXqdJmmXXfq5JmIvR3zcAT8+GaBXHRBdrRFJltTFHDb2eqbjfBWfR1q9IG7iY+BHCPdWmwA9uX4EVenJXAvSvwdflDb9I/u8Tp0Zov3UlA5zjzoteurNgmh5/HJJgNfkYwxC5rVuparFXlNKTkbuWBesCAyLk4+UwLonJBExA43mSfCTyOdKNB1qDQtAqq92Z0KvMcyxX0nU6+eYuiMvtOnPkvS1HLdo5i0QQHPXCsTCnl4b3RpINNBxKtF8pOpRN+pn/+mIz2KnH4pw1q1xk1IDZO9f8/TIddlNrvmdN5XfXKJYxx8ll6uXuuGn2sOMm8i0DjD4ba8ZdgB8lVSYbWeHFxiVkCLuMLUr8PTBokEVByXP5pVtI0FA6E6igI1ozA8G2jjAnUbR4e94P0ZyVeNdJ/rpuulslpISIBVQ5ItlIR5VZXErrlleG1LIGlW42Q8jLVF1cIq4rFfsfpg8MTRNt/ycWX38GGZWZMGeADDgrjcNI4vdbtvGjAaV0su75VssJf4wIsCBjldhAdPGQXbssXzg6lNPG3mBTBQK81kPWqPiGc3hXfa3m5NYKcWlbyF/s1lji7mk351zht+F4OxM4PoZT9tZkcgjDJBEHik0f9HHFCSu4PTmsEB6wNKwtUzWyPzYVfd0aEZrVtucce4hPGFNmashjrVkjywtmS8owRVdFWXiQVxO1evtwqAt0MkKp6xxCczPC/GE6rzLYv4M58IujxnzJrhVS+ga1DW8nhBsxSZZ8c0IYZpOKJGS/PQJsAopx5w64Lni0wr7L3drmwTkV9phkSkHbde5hHwR5CYf3IZ7CVUryS9lGXwRAwf3WNhYD+Rg7RWDMJzeiCcagpQH7zMuke9DFJzX+BZpj2Qztwk8jhN+gHyfJPiOkB44zLk/PEz3/qI2vAm/3NPz3nzqK+zE/DyOyB2Q6jfLf904thV8EnhVdZ3/zkBDoLCUq7Swd7CYa3X/xtmZ/lVSbasfXW9wYkGfTv/GLvJZf0r5PIxkeBPNV82ZnvqCezUiIFwmrsnq271lrFhN193urh/R8HI9HAewjtvIMyhVoWP5QvYsD7TaonP1wRul/NBTCPJXE6rKfG1ZUH/yw8233ivS6CPld5oucUXDzj9VRSwF18dQDHj3WeS8BLVNwGKxSYGG/jvK98+O8DXaFyU6T/30EP9+ATfDWnpWyXEpcsOKko6N/I4a3bjqCnJ99UwGIIfokfi7rwXQ405e25EySvUd3N4j8Yp4Zdy4iffPUYnFR076Jw+v0qrVKt21muzFmvVRSX5pVq/xljGMKSEHVkbIN9cDKov+DnO2g5nkbwF7GaGWTSIXCYxwinSMCvj4DyNZS4QuOdbCZqx2ZuimhhSHISmWcP03NNPETTZx/AAXn9Y7mDNzP+q2aoGGLexPXVCymr0E8Mt37D0s7neIDnNljbHRwWz+B8bcP4rfb+N0OauyLUXY9PmE3W7W/J7/bHDSk0fP/C+pEqBEC3477AMfHfvUFnBbTl0UpfgNK/5MpJVX2lOVIxnBSw8jUOZKtglQrCxd+SIoWDHLB0NuYAmQtnp0U6yLJEar4AzLjxCjT15jX+eVQ0yoVkL5EnWeB6x4wNq5wlq1wp/ygHBJJ6DXYxrefJ2aA2XQH0dSiAH2I9sVu5Jw030UjN6RhOwaIciar3gfOhEowTS5PrdkRFEOxArpc1BJMMYK6yezYRPnr6FVzj6kmJmZ0EWVL/e/f1FbCO01VsE3pmV209CzhBoVJFoJoBmNTMzkFUS8W3sPW+uL9uBO6M1gv11DTP3As7shFw64Mtlbm2Yg2q+UKvTC9yrZINmwi2T/frlQR64//hT8ZT4IlPdkmJTbyUtS13sLGdaXOOc5R0izwxbnrYoSE24zbPma9ZtAyNGWwQWDGVYFXPOPLZ8oDRhzNqXuHCiPZRD0bPBSUdFR+I5Y0RAckUlkSJB4YJmdTGZBZqHRzTxlHd6AGxLL7dOdvi6B1pY53jYaJO4u+Z1VwBvCClRrNTyW4u72BAMbOP8fnlH+ADZz6qsaNov/rhv49hD2CTzhXf9aFqCXPaHhWs3UgWQfHrOjF1XFs26NpLTdo/LlWrA4tML2G2nw3XmGudTMdLkdlTnJc0tn1LP9ZoB6jBFu+4PnHeBzz4r3KknJnPapWIOeE77yn7A2nhcDt5dMYaqaM8vKJc36V2pYxHNmyW5TLgg/5lcmJ/pl9/1icyULm0ta5EYQZPLdREUP/yyyNr4uFn6Hmxi59Tf4X3rYJFGbf8PmaSlpqqnmLoJZBpmsjT9CA8s8iwfNhDK+2ojEHiEAsYL/XpyJ3W9K/nmopy776gylzR9RHVhmNW962/QYGTviBPrYf014GNpu92n8khmk+4u/SAVIlChV4ojRjhVCdwtmSs/xKKhKat4v2Vn86sWVj0YKraINUQUVYhIptY/El3hcfYB03ZxJwrzIMBFmmZZiMRkT0r2fXJ889teVLJkexGsDkhQxsK9rNEhtOqiC504lF04b7hpJXdfrk+tEd3hY36KfQ4Hv1vpQjNmIHoJSYWC7NCE2jDLedZ+BOfbpCRGFIPbXWTQd96X/ozyHvQN/pA4+tl+ncXmBJ4gZ/reVRmsK2Ee+qdHnLw1U8P5OMBuMpEX2WpXqYy5l8edJVz9vc89Mp7iXW43LlFE0WOP02NUK9uHQq8AJD8jH8tfXBzUSlxzh8ADJQzKQuWVFAMZBJmTV/o0w7xkWnixcxfeHBgARK8Ge3V+B46LzreoUHFvLiHoiNfMwYHDvwEyG/wzDUvAlRkZMBG7NxECMK2N17NcUIF7AjTFUTbiWWdtKK3ut0uKqdgj5JLfJc96N8Ctbr6gZRa9lUS+WoRaNPRo9r3+YSbRKiHBSCN/H/HGPgL0hoBSBmtKwm49ueU//OgE7XdGivjDRfArhzJFn11x1O/CJ0Xuf8afNfGKzhasgu4evXQ2Zka5Fa4dcHmezFJvfYSrvFuYBQEDBLR4AhtKoZu3iko2koCcqep5kMs7GpBAF0hkhMsdH0ULhUefyG9AWFuEGdiAnv+HimTiHk0Mz1WXc0Ey4mzwewz8LXuSK5UKJ7OqucUx8w3iLh9ZjHbCuryd8Q5e1vmIOXE81mIn/NvB9Co1Ceu3a7N5YG04DrD73cpX6O/n2mppErC0Jjqn5hUM7AuCaWaCTFlLzpfFwqvhr12e2kjMw7g+rjt11t4mzTbJBrxtmOA/T88CKMP/HPr/o1VoUTLbhmMYXLEg+Bh6uupwVa06CyVmGwPpK5HK4CueCBTCjkL3rxMuP6LtNEOlWyrHsN8GvSoX3FzlI3zGcHhrj1SsyCsVXg5n5mQewBm/49Si/h5NdnFxa136hQUac0/rp+eRvtIPEXvXPof3J4pvI+pM63BnF/rssxy++BEn+DtwgQr0nHDQsVB1/JW7QKlbwa+K3L3FiA1ibsJ3k24uHMaCRbck13eDMQBJ42TzZlp7of2EoR1q44A3STHV0x8Ag78f1MaNQ0X9NLz2UKtTdI0eFNudZiFWfbJ4XiksZqe8VgomBMwcUTF/jbyPUv9SxlHxQmnaB2UlB2XhH0QqL5HnHkX9nXYOuO+iLxsPDLx8/m2MDTJNp238gPjnKQwkAV59blobUKczg8dKxC04gGpq1/N8o94bhBejIh2PZNoL7HN1bsmljYFGHBsxS2fADGgj5meRgcBIu/o+w8V95185crb11CCtns6cwt7PcCZco0t60n7RHPahWAalBlr5x4YDA0GCslB/Xfkub7jJkcN/vUQ3tynskFh4eWMz+CbjuLBCq2Zd15A+/wfYbzsJMT24MW988Hru2EWJNl6tZmSkX9yvQXsqoJdp0jdzNP1nouiTWFvh0h6ks3B1c6O5OpMq6J3POJjwcYYLQtj23eNNjldKp1jH4BAXSjoHI0QhR0V+fndmbtngzGsMkFYPt4TB4Pcj5OXHuupPKb6W6/lYCRRAE1AaRnrRR7icwvdHS0B/SVkvbPS9Y/cU0B0i3PdEOFLToDldwrVPi3MdQmgpTo5nC+SbEhoBw3ED40zeg/3U+ZnAylGQYFho7BUnCYcPch8VLRBXhfPfpreu4j2ocAcD2nxyUlnGk7djMdrVYdkdMvzuGzNCf8U1vXL/25yr8gpaTnD3aMhoQDiuWVmw/UyM3sdFNK8dat6Gw7VM+/oenaButcxPSwxBHj7iuUFajRlufOc1yjSOKAKAQfy9rokgTIS8rsQ+uK5iYs3b9iXUI4aWzOsjUKboGsn/Fupnk6Gfd7R+RjB6dorz9R5zfZSbQ5mrMRdtRNUXf+z7L9YvHhs1V5DOBYedpjy4CwumTCTbkrQVB4Hmd/ap3Eh8DF0KM8AcYvQ4ACgxkR1KZmaLv8ep2NgaBRf0bmJq3vI+balkbNqSF+DjcDd9Jp6a/8kcb/pOusrvtJBA/Ag2Eee86wsZkRMWyuKB8M+he/2fHmU45z8F7ckKv3lHrfcZ+2ULVPOtJU32cN6vpsZfIGOx653l+mj9eogAU8LkoEuYKYftJaAbfSkL9to9YC0ohL8dmdPxn3bWDOt7PzgeSrS0GV9oe+tK1FKTsCx28Q9eBHcpQFAK9lOQpeXV4yfY3sp+yE0Wel5oTZdrPvKG6v7UGOudTf1sPUyyce58C31JPtSuawmBAt5orRZ+iSAj7AxFFqeJ29rzYm/Ph0W/RpEB+fyN2swpWkg1IuCnhDt0zJKzundGNad6/w7HEt9ftAEkzkn6RWJ480ArOHI7TFZ/9So0uh1MBNfEaeLQSbT2/kzLVXP6cS8RYN8RTj4q48ViCsfqECcN2mLcCmWoj3+IDn36Qj/AO/ysbG63PmzEc+eVd6oYDMVh6ktZPWyvjTsuJeWOuc5vV/DWyMpgKixxAzSF3+npSfSaSNmPoxdOiFPPUq30apbb2NrqnIet1I/WvloHXHzh5bqG3f0N0WYO72jzfSXLk48dDIyW/1tZDfXCgXLC28vUbDGe3ayoViQHkkuF97cHrWIvnOihcc0L2ZcMlfRLKjpeKg0DSTkB8SUezLK79N2S5Zq5qx/4nC5VgNid0GCazLsYBJGG2n9m5uCXWLvJVxldsQ2Hd76U3+2+ZN/8RVj/gRoN7u0uedawCIZ1FHMH2Wtbj5zUqaw8UgfudJMUcFI1NCkt4eYobF+w2uun8owxGeb8ucuyChSfO1PVoaHZPsyyT4cuGo3uWBmVRnZ++2dz0QCdJAsY+EDzmIoYQ3ynA8jazXaI0btcIae0ISENbw7pRtXIOml/Mb/8UhQvM8cz9EkMq759SlneSb/zNaBmWJ0/7LIobkIRi07VxhfmiLR4Af091v1x3jtY+wUozC8gtFv0uZ3n+e6fiP4nFgmHzavbmfLheCOoDX0ZY8TmX3HBZxU3Hk9UFxgNqo/NF1V6+QA+9cxbngCJMIAuqJatVugo+IVGzLALI6zBhslVn8fAuCLgVtN3KU/duBOyvygiDoaKnL8PZ/PiWbSGx9hAGqiJuzdTv/CbioHdr8Xd9DuOps16I4Qx1tC+zZLA4FvtmNxeLZz/wQXwLbpUPbGPE2MT7rfJny47EVJLPywPRP5goqvF7CEtuSivmUl3S1XBXqEKQytDNWowoNxGDJsAxxuiML30Eb17dq6S2EDDcbe3CNJcSjg+d5J2onVNFaTi07I7YIleJ8ie+RTzJTu+tmJ7vPy6ybqPu75NvVZMy9MnYpfCo5dPw/G2uHrkAsV5DkyjjNOd6/dn161XHU0XkYJW67Azva38NNAHJM3UXNTbtOx1+Ukdb3mK7YEduaehvxPCkGYuaRa8+pduvaNxFIg/VMyNOF3YF9jAnsmXcBwfeLmWzLxX/hzKiHHIS/fCZINh46PhcGoTVPnDJ4rDFlLJxAjRzPNlkbR3MwMygHZ6woRlgnllB+mhtykVTg7CpyoOoUmmwndFJ8AyKSiNZXAeOWDdgbN8KR0DvMi55PSotQg3lcCnOENN9CAQuEQRbciuRiLZUZwY0V5fAHGnL+bsLtzPST7PQ42Xn6Ow22qcnBeHRXkWuiDQYHFeU/fli0QnMlP8JdXSSccIL+/ZydGOL6zzp2Kli5A2C/9FUIv4uc/wCKjHhG+CpMYdnV0+XA7gWmiXYSZ6vIKSXMvDuqOEQ+KxbE+PH93dGnuly3B4Yhi1bGZehmkD/2p9uI6nJfHiSJcV5FlXHWMynKC/D5uLedVKKtnU5VPwgR9NdtuqsZ1oE8+2ifThJpQJ7nwP+18KHPBCzKqW5r85WwGU9PZyO4CARC3bPyLoclkwxK0gODwzTQ1c6Be8rt1BcPH7Eu9+7WwrC8q9iCyBHvc0pPBDLbmb8QGtg3K7G/AfTRh8vtnItyZ0U0bbgQ9Njr0m5utyQWQ3V+Rt5QSu+5sn7n0ahA3BLRThLyO6lLlk14FRqImmsIJl5z+Fvl/mouJpQorEbC4uUn6GE/C+wStIDgANOwSGWl8NI0GMZmkSTfhjmG4PyXg7h+Ty+51R5KTadRZ/AlDxhN5g55JnZ1+cmvj2IBkOaZJ6wPnriLHzMHtg6yUcUdw+tVDlnKKFpc/HfotXQ45QY1Vph9jNRTJVZ54Q8fikC5m7G9Ed0r7/1Id+cWu+bfurrM2zgJ5yE5wUsbzXljT8VfJOx8+lMbnEwkMlUrr5ZIRm0trJqp6AW1Zjm0Ps8Pn3XvqTnLz+TdN6qnUGTunaJhn4Q22PmMc1hHw+NyWMpO6Ef+P/wmoIfQei6jeoO7fPRVwv4/+G11jBs2Liq+707bgqFIJ/8PVm5u/OGrMXtx1jpR69sgepx75w35wMyuL7gojoGcCjFru81KX/MvidQVcCFp7bfDb3+pPErmEEClcJiARZ/3vSZ8jT7hskvXVhJb5wr3J39Dm1QO8FC1JvrB/juwKO7nRCjgwFTdkCMX1sElSISrpYGFiW9M4ZuQbyDDMRmVejFLA4axOcACKCvAUVUtdjfAsy6Wdf7t8cK9tzgAZvivm5mG5vEHJwxwtKTqSv/+KVbxfmu7xbWdPypzj/BlS151wfkNVJu+xyMJ3xJph8XTfU6LZnXvbzHxnGbsotQ35cWUyaFV/C33GZMPVMcd4ABWu0+bSMCv+4+8mNMUiXDv4NfTcFl0QZyz3YzG2A4Ip093fwi1awwqky0PuQYTnrfeZVotcILn47xlN8uqbdcIR4EZ2K0AHwukF/psmbGm/1A9q2WgLNo0VEcenyGz9i3Vbb1M6AuaRntLmxLpvz+RrD7iUjwrvYgZMt0OZy+JZou8jnZd1AmNb5lZ07Ls7+EH5BL33G5IfvoUKfJYQSQgKGdjXzO7tE6f8q8Qdi+L4I+uwQ4CAsj372Z+xUHU0TvUzI0Fcy24lGfg+fwwFWB4eDb7nfxFDDPXXDNh6zTiMpGtKXGBjML0h2Jt7VR/vl7We6vvzT2z8pRdOFCOVhMvZzOKwq/LcHtF8thhdqgKcEhRtB0tM2BfXpjQuacux4lBeuqFmX5UjZFkpICdBHzhw3c/vnHjvqp+cdnnmcB55ePxnETcubWDyvJ79IMeix75OPbpyufsgMxskMK/Xr9ZvpYJAenSPB8kjPnagLvaAGnBpR/0zlAfiEBfKkqXMQhcIHyTXyVXe7/JTAFAz0Lj5JPXVln7JgbP2fRNOK3I//IoTMuzvEgazoB0er/8AKSWHcjTCjtTB3W7YM1fn6NJKq89U/POZb2aKulIIiZWBez5VInMrSWe47kWQHMwTBCoQju3+kW4HhuCgHrLDXBrbbEjglKcsJ80bM3EqegmlQHhHGdVF20IYfOuWSYiXFeYQBdiuEDKaxZfcvP3afz4YQ6JNFMOCmGoSvOryRaNRqBOBltUp+9HnwSD2CsCBrg1aPTnwh89MD+StET4wpzb8b8Obmnv2OpQoFcYCbvFVk49FpHtZ1eS4UE3FrW1b9kMMQ5e8t47C43W9dvE5rnfQJOKIJuFB3cB/Sz45ZounSdtv3FaEtJ/BPdHEnD+p9fA4WK9+2R84J3TKDpKmeHEFvuSFaioBq2/UIoyoeSqvrHXLRPOo14OFmbEivQM5/gsba9puHFHn+Zaqc0rXE4ZOB1NAmi/5omEChM5QJtOPevy1MFD4AcZTCdjoCLLXIaD4H9brrr+GbkRQoSOkZxDXwT6J58f5N+ZlZqHJttdlttJKu7TaXs4yfcwaAvzkIjLWluwz4MgV9Ac9eIZCcPnWzc50JGgjeCup/hA0fx04oF/Fz5H5ICoYyqSekkwAWMSML7vpLJ6f9/Ajmf/XSO8KqhRNclMEl4cImnnjpcM/k/wmvjjnAtrJJgXLEKnENdD2zZ6CQ7FRmqTm/aiym4rJsSK9xD7owvF7r0HVrTRm7SXarixVl2VZexy0ITNosOF+OrsQX2ONrYmWHydodWHCCnVMneTO+shYgHDEKI8kqzAVJdZn/yIrOtOsfRdlZcEv5v4j7TbVFiK7/+OtgtjxG8mI3B8qMzCuR63Gy6l2WiUno6BaESOWrJmrCVgYbGeObJrFAiJjrjIonOdWo/qEN5tupOukZl+ynzUlZZvYAIxCLHTE1qVvyGXCfLH10U6DddbjXaWldZm755Pk+ZNiEotE2IqiWlmVnLi8xf1Dk6f6BIw7XMUJf7KorQhleeoNNYO3gub3DnmtJc8Qb0iFAL9LjbEUHnTGdzkjYvUZs72zQFtBEAfKSrhwx6pc4aEn+apk5fTNzT5XSMtcoyajke9J12ACQ01qOpGSzPNN0typ9FZnvA2lvhugKWVq/TqDeDYLoI46RjFbtr9f3+NmCblJmfT7sjaASpqi8J2ScM3y5iNC8A1sHudzfV/28ciJyvSIYobiJPzv70rgwSeF4/JPc/YWlERd0ljXcnTI21Qh1DO5Ljl+Z82pX9ZUDOUEgJ0baCRGkFQcX3dAZuv6X8u1NtwPVuqA3Yx5RT+UUo/fBT/THDY2kcYBvKfpLY0D6AZNjmolUY/hWHe71xjoJ+fLDprvghNZe/VkhNW9YvbdkzQcXEv1LV1yijbeyNt/x/vOph9ipGcmep29uJXojuVwHVVJDdi4zxC11AGMe3pg3Y/qfDVcBPOQQ18cGlxxBPs9rb67exFICRDDULooZ+5NuQrrqWf8UUsiBOa012wImJ1KraMqY50Fg7qoxQext48IeJEeLT13LFSruCkeZ7wBGPwcnVAacUBFiQg9a3GwIu9cyHWxpjejTENP7x2bOBq3DR4zrn+qUPDE9ffwNCUvH9wcjTJezxjHm/XJLgsUYYotKE6GFv8k7IamHWBQgFgv6VSxpwQDp16Ez528xbOB9cNpDBtqgaJKTek/b6YhDJNU7gOag0s+6+v1NnF/nf6jf0MKTLVmWJZleTJU+o8Q/iBHlvxZbfyB/wU1aINjldK8b3i3nQsmWhDxmuYMHegpkqQ6Ps/D+dfKEvg1+K9c3IImzeovbWtIHezuU2BHA8NHoAL4bnwSvLxPSahJDwfVs5b26DjDjzke2o2n1SwyLz2rpzsYNq8bXTk/OF+hZm3FJcHzio+yLd+7fXOYhDA/pCZrtzPSeplu8zfBdxT+qP5VzOERCsfKiYa3ur3MTwWJz0JoaRt66E7fC0u8G9bsD1yCbayx4k551E5CpyNLdpyynOBdKZzMPVPTwx/gWIdMXxAvOCDFpdm/chKxFs6oTU4IAOcG51fTkwcCl/dtAr0N4V/GIgSGjWQAAjZaggt1c/16FdJsAA9YnUu6y3Zw5DHgfCnMV5VdCbqWWronY80WL9kSCcecJSQiZjp4D0gd2Kb7R9y+YL87mAGP6RR+fwuwcElvhfrVm9ewFcnOdxAWGQM9ypOdH5ZAMMTMQpwKtyQS1Aw0VDAqNAAAA="></div><div class="ayul"></div>
<div class="ayuf"><button class="lv" data-ir="bienvenida" style="margin-bottom:14px">👋 Ver otra vez la bienvenida</button><br>¿No encuentras lo que buscas?<br><a href="mailto:losdelasclaras@gmail.com">Escríbenos</a></div></div>`;
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
