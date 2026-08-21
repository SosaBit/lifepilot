const CACHE='lifepilot-shell-v3';
const SHELL=['/','/manifest.webmanifest'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith('lifepilot-shell-')&&key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;

  // Navigations always prefer the network, so a new Vercel deployment is
  // visible immediately. Cache is only the offline fallback.
  if(request.mode==='navigate'||request.destination==='document'){
    event.respondWith(
      fetch(request,{cache:'no-store'})
        .then(response=>response)
        .catch(()=>caches.match('/')
          .then(response=>response||new Response('Offline',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})))
    );
    return;
  }

  // Versioned JS/CSS/assets are safe to cache, while each new Vite build
  // gets new hashed filenames and therefore cannot reuse an old asset.
  event.respondWith(
    fetch(request)
      .then(response=>{
        if(response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
        }
        return response;
      })
      .catch(()=>caches.match(request))
  );
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING')self.skipWaiting();
});
