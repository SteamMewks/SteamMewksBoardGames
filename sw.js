const VERSION='unified-ui-20261027-css-1';
const PREFIX='steammewks-table-'+encodeURIComponent(new URL(self.registration.scope).pathname)+'-';
const CACHE=PREFIX+VERSION;
const FILES=["css/table-ui.css", "css/style.css", "icons/apple-touch-icon.png", "icons/favicon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "index.html", "js/app.js", "js/core/ai.js", "js/core/persistence.js", "js/core/pwa.js", "js/core/registry.js", "js/core/state.js", "js/core/ui.js", "js/events.js", "js/games/arimaa.js", "js/games/breakthrough.js", "js/games/checkers.js", "js/games/chess-variant.js", "js/games/chess.js", "js/games/four-chess.js", "js/games/hnefatafl.js", "js/games/morris.js", "js/games/quoridor.js", "js/games/reversi.js", "manifest.webmanifest"];
const ROOT=new URL(self.registration.scope);
const URLS=FILES.map(p=>new URL(p,ROOT).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(URLS.map(url=>new Request(url,{cache:'reload'})));await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==ROOT.origin)return;
 const navigation=request.mode==='navigate'&&(url.pathname===ROOT.pathname||url.pathname===ROOT.pathname+'index.html');
 const canonical=navigation?new URL('index.html',ROOT).href:url.origin+url.pathname;
 if(!navigation&&!URLS.includes(canonical))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(canonical);if(cached)return cached;return fetch(request);})());
});
