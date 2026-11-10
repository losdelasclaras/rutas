// Funciona sin cobertura: guarda la app, las fotos y las zonas del mapa que ya has visto.
const V="ldc-v21", SHELL=["./","index.html","manifest.webmanifest","vendor/leaflet.js","vendor/leaflet.css","icons/icon-192.png","icons/icon-512.png"];
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
        if(!out.length&&txt.trim())out.push({x:txt.trim()});   // un enlace de otra app (Wikiloc, Google Maps…): la app explica qué hacer
        const c=await caches.open("ldc-share");await c.put("recibido",new Response(JSON.stringify(out),{headers:{"content-type":"application/json"}}))}catch(err){}
      return Response.redirect(new URL("./?recibido=1",self.registration.scope).href,303)})());return}
  if(e.request.method!=="GET")return;
  // 10 nov 2026: las letras (Google Fonts) se guardan en el móvil: sin ellas el arranque podía quedarse esperando con mala conexión
  if(u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(e.request);if(hit)return hit;
      try{const r=await fetch(e.request);if(r.ok||r.type==="opaque")c.put(e.request,r.clone());return r}catch(err){return new Response("",{status:200,headers:{"content-type":u.hostname==="fonts.googleapis.com"?"text/css":"font/woff2"}})}}));return}
  if(u.hostname.endsWith("opentopomap.org")||u.hostname.endsWith("ign.es")||u.hostname==="tile.waymarkedtrails.org"){
    e.respondWith(caches.open(TILES).then(async c=>{let hit=await (await caches.open(OFF)).match(e.request.url)||await c.match(e.request);if(hit&&hit.type==="opaque"&&e.request.mode==="cors")hit=null;
      const net=fetch(e.request).then(r=>{if(r.ok){c.put(e.request,r.clone());trimTiles()}return r}).catch(()=>hit||Response.error());
      return hit||net}));return}
  if(u.origin===location.origin){
    // versión publicada: siempre a la red (para avisar de que hay una nueva)
    if(/(version|build)\.txt$/.test(u.pathname)){e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>new Response("")));return}
    if(u.pathname.endsWith(".apk")||(e.request.mode==="navigate"&&!u.pathname.endsWith("/")&&!u.pathname.endsWith("index.html")))return;   // el APK y otras páginas (android.html) van directas a la red
    if(e.request.mode==="navigate"||u.pathname.endsWith("index.html")){
      // la página: la guardada al momento (arranca rápido aunque haya poca cobertura) y por detrás se baja la nueva;
      // cuando está bajada se avisa a la app, que se recarga sola si acabas de abrirla o al volver a ella
      const net=fetch(u.origin+u.pathname,{cache:"no-cache"}).then(async r=>{if(r.ok){const cp=r.clone(),c=await caches.open(V),old=await c.match("index.html");
          const nt=await cp.clone().text(),ot=old?await old.text():"";
          await c.put("index.html",cp);
          if(old&&nt!==ot){const cl=await self.clients.matchAll({type:"window"});cl.forEach(x=>x.postMessage({t:"ldc-nueva"}))}}return r});
      e.waitUntil(net.catch(()=>{}));
      // 10 nov 2026: la página se busca SOLO en el almacén de la app (antes en todos, también en los miles de teselas de mapa),
      // y si el almacén tarda más de 2,5 s se va a la red: al reabrir tras cerrar la app desde recientes podía quedarse en negro
      const deCaja=caches.open(V).then(c=>c.match("index.html"));
      const espera=new Promise(r=>setTimeout(()=>r(null),2500));
      e.respondWith(Promise.race([deCaja,espera]).then(hit=>hit||net.catch(()=>deCaja.then(h=>h||Response.error()))).catch(()=>net));return}
    e.respondWith(caches.open(V).then(c=>c.match(e.request)).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp))}return r})));   // solo en el almacén de la app (10 nov 2026)
  }
});
