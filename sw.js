// Funciona sin cobertura: guarda la app, las fotos y las zonas del mapa que ya has visto.
const V="ldc-v12", SHELL=["./","index.html","manifest.webmanifest","vendor/leaflet.js","vendor/leaflet.css","icons/icon-192.png","icons/icon-512.png"];
const TILES="ldc-tiles2", MAXT=2500, OFF="ldc-offline";   // OFF: mapas descargados a propósito (no se recortan)
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==TILES&&k!==OFF&&k!=="ldc-share").map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function trimTiles(){const c=await caches.open(TILES);const ks=await c.keys();if(ks.length>MAXT)for(const k of ks.slice(0,ks.length-MAXT))await c.delete(k)}
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  // archivos compartidos con la app (Android: «Compartir › LdC Rutas»): se guardan y se abre la app para importarlos
  if(e.request.method==="POST"&&u.origin===location.origin&&u.pathname.endsWith("/recibir")){
    e.respondWith((async()=>{try{const fd=await e.request.formData();const out=[];
        for(const f of fd.getAll("f"))if(f&&typeof f.text==="function")out.push({n:f.name||"track.gpx",t:await f.text()});
        const txt=[fd.get("text"),fd.get("url")].filter(Boolean).join(" "),m=txt.match(/https?:\/\/\S*#t=\S+/);
        if(!out.length&&m)return Response.redirect(m[0],303);
        const c=await caches.open("ldc-share");await c.put("recibido",new Response(JSON.stringify(out),{headers:{"content-type":"application/json"}}))}catch(err){}
      return Response.redirect(new URL("./?recibido=1",self.registration.scope).href,303)})());return}
  if(e.request.method!=="GET")return;
  if(u.hostname.endsWith("opentopomap.org")||u.hostname.endsWith("ign.es")){
    e.respondWith(caches.open(TILES).then(async c=>{let hit=await (await caches.open(OFF)).match(e.request.url)||await c.match(e.request);if(hit&&hit.type==="opaque"&&e.request.mode==="cors")hit=null;
      const net=fetch(e.request).then(r=>{if(r.ok){c.put(e.request,r.clone());trimTiles()}return r}).catch(()=>hit||Response.error());
      return hit||net}));return}
  if(u.origin===location.origin){
    // versión publicada: siempre a la red (para avisar de que hay una nueva)
    if(u.pathname.endsWith("version.txt")){e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>new Response("")));return}
    if(e.request.mode==="navigate"||u.pathname.endsWith("index.html")){
      // la página: primero la red (así siempre llega la versión nueva); si no hay cobertura o tarda más de 8 s, la guardada
      let saved=Promise.resolve();
      const net=fetch(u.origin+u.pathname,{cache:"no-cache"}).then(r=>{if(r.ok){const cp=r.clone();saved=caches.open(V).then(c=>c.put("index.html",cp))}return r});
      e.waitUntil(net.then(()=>saved).catch(()=>{}));
      e.respondWith(caches.match("index.html").then(hit=>{
        if(!hit)return net;
        const slow=new Promise(res=>setTimeout(()=>res(hit),8000));
        return Promise.race([net.catch(()=>hit),slow])}));return}
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp))}return r})));
  }
});
