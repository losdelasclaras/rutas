// Funciona sin cobertura: guarda la app, las fotos y las zonas del mapa que ya has visto.
const V="ldc-v3", SHELL=["./","index.html","manifest.webmanifest","vendor/leaflet.js","vendor/leaflet.css","icons/icon-192.png","icons/icon-512.png"];
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
    // la página: primero la red (para tener siempre la última versión), y si no hay cobertura, la guardada
    if(e.request.mode==="navigate"||u.pathname.endsWith("index.html")){
      e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(V).then(c=>c.put("index.html",cp));return r}).catch(()=>caches.match("index.html")));return}
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp))}return r})));
  }
});
