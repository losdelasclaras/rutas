// Funciona sin cobertura: guarda la app, las fotos y las zonas del mapa que ya has visto.
const V="ldc-v5", SHELL=["./","index.html","manifest.webmanifest","vendor/leaflet.js","vendor/leaflet.css","icons/icon-192.png","icons/icon-512.png"];
const TILES="ldc-tiles", MAXT=2500;
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function trimTiles(){const c=await caches.open(TILES);const ks=await c.keys();if(ks.length>MAXT)for(const k of ks.slice(0,ks.length-MAXT))await c.delete(k)}
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET")return;
  if(u.hostname.endsWith("opentopomap.org")||u.hostname.endsWith("ign.es")){
    e.respondWith(caches.open(TILES).then(async c=>{const hit=await c.match(e.request);
      const net=fetch(e.request).then(r=>{if(r.ok){c.put(e.request,r.clone());trimTiles()}return r}).catch(()=>hit);
      return hit||net}));return}
  if(u.origin===location.origin){
    if(e.request.mode==="navigate"||u.pathname.endsWith("index.html")){
      // la página: se pregunta a la red si hay versión nueva (si no la hay, la respuesta es mínima);
      // si la red tarda más de 2,5 s o no hay cobertura, se abre la guardada y la nueva queda para la próxima vez
      const net=fetch(u.origin+u.pathname,{cache:"no-cache"}).then(r=>{if(r.ok){const cp=r.clone();caches.open(V).then(c=>c.put("index.html",cp))}return r});
      e.waitUntil(net.catch(()=>{}));
      e.respondWith(caches.match("index.html").then(hit=>{
        if(!hit)return net;
        const slow=new Promise(res=>setTimeout(()=>res(hit),2500));
        return Promise.race([net.catch(()=>hit),slow])}));return}
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp))}return r})));
  }
});
