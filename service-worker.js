'use strict';
const CACHE = 'daily-signals-shell-v13';
const SHELL = ['./','index.html','styles.css','event-model.js','storage.js','app.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('daily-signals-shell-') && key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', event => { if(event.request.method!=='GET' || new URL(event.request.url).origin!==self.location.origin || !new URL(event.request.url).pathname.startsWith(new URL(self.registration.scope).pathname)) return; event.respondWith(caches.match(event.request).then(cached=>cached || fetch(event.request))); });
