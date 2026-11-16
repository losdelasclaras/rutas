/* ---------- Listas de Explorar solo cuando se ven (16 nov 2026) ----------
   Antes, las listas de Rutas, Cumbres y Lugares se pintaban enteras al arrancar (unos 20.000 elementos)
   y se volvían a pintar cada vez que llegaba algo (colaboradores, marcas, retos…), aunque no se estuvieran viendo.
   Ahora, si la pestaña está escondida, solo se apunta que hay que pintarla; se pinta al abrirla.
   Va el último de _mods para envolver las versiones finales de renderList y renderCol.
   Para quitarlo: borrar 'perezoso' de _mods en build_pwa.py. */
(function(){
const V={rutas:document.getElementById("v-rutas"),cumbres:document.getElementById("v-cumbres"),lugares:document.getElementById("v-lugares")};
if(!V.rutas||!V.cumbres||!V.lugares||typeof window.renderList!=="function"||typeof window.renderCol!=="function")return;
const sucio={rutas:false,cumbres:false,lugares:false};
const RL=window.renderList,RC=window.renderCol;
window.renderList=renderList=function(){if(V.rutas.hidden){sucio.rutas=true;return}sucio.rutas=false;return RL.apply(this,arguments)};
window.renderCol=renderCol=function(kind){const v=V[kind];if(v&&v.hidden){sucio[kind]=true;return}sucio[kind]=false;return RC.apply(this,arguments)};
// al abrir una pestaña con la lista pendiente, se pinta
const mira=k=>{if(!V[k].hidden&&sucio[k]){try{k==="rutas"?window.renderList():window.renderCol(k)}catch(e){console.warn("perezoso",k,e)}}};
for(const k in V)new MutationObserver(()=>mira(k)).observe(V[k],{attributes:true,attributeFilter:["hidden"]});
// lo que ya se pintó al arrancar en pestañas escondidas se quita (libera memoria y hace más ágil el mapa)
const vacia=(k,ids)=>{if(!V[k].hidden)return;for(const id of ids){const el=document.getElementById(id);if(el)el.innerHTML=""}sucio[k]=true};
vacia("rutas",["list"]);vacia("cumbres",["col-cumbres"]);vacia("lugares",["col-lugares"]);
})();
