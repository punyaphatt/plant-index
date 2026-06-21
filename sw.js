/* Plant Index service worker — network-first (อัปเดตไฟล์ใหม่เสมอเมื่อออนไลน์) */
const CACHE = "plantindex-v3";
const CORE = [
  "./", "./index.html", "./manifest.webmanifest",
  "./assets/css/style.css",
  "./assets/js/species.js", "./assets/js/model.js", "./assets/js/app.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // same-origin → network-first: ออนไลน์ได้ของใหม่เสมอ, ออฟไลน์ fallback แคช
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("./index.html") : Response.error())))
    );
  } else if (/cdn\.jsdelivr\.net$/.test(url.host)) {
    // CDN libs (มีเวอร์ชันชัดเจน) → cache-first
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
