const CACHE = 'cc-v1';
const SHELL  = [
  './coolcontrol_dashboard.html',
  './manifest.json',
  './icon192.png',
  './icon512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js',
];

self.addEventListener('install',  e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(u => c.add(u).catch(()=>{}))))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.startsWith('ws://') || url.startsWith('wss://')) return;
  if (url.includes('fonts.gstatic.com') || url.includes('fonts.googleapis.com') || url.includes('cdnjs.cloudflare.com') || url.includes('gstatic.com/firebasejs')) {
    event.respondWith(cacheFirst(event.request)); return;
  }
  event.respondWith(networkFirst(event.request));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req).catch(()=>null);
  if (res?.ok) { const c=await caches.open(CACHE); c.put(req,res.clone()); }
  return res || new Response('',{status:503});
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req, {signal:AbortSignal.timeout(3000)});
    if (res?.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req) || await cache.match('./coolcontrol_dashboard.html');
    return cached || new Response('Hors ligne',{status:503});
  }
}
