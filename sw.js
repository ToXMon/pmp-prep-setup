const cacheName = `pmp-prep-shell-v2:${self.registration.scope}`;
const files = ['./','./index.html','./style.css','./app.mjs','./drills.mjs','./course.mjs','./study.mjs','./manifest.webmanifest','./icon.svg'];
const shell = new Set(files.map(file => new URL(file,self.registration.scope).href));
self.addEventListener('install', event => event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(files))));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) {
    if (name !== cacheName && name.startsWith('pmp-prep-shell-') && name.endsWith(`:${self.registration.scope}`)) await caches.delete(name);
  }
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !shell.has(event.request.url)) return;
  event.respondWith(fetch(event.request).catch(() => caches.open(cacheName).then(c => c.match(event.request))));
});
