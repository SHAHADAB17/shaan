const CACHE_NAME = "shaanchat-pwa-v3";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./styles.css",
  "./firebase-config.js",
  "./auth.js",
  "./chat.js",
  "./media.js",
  "./ui-ux.js",
  "./webrtc.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAsJnrF8MehSSvMuNHvBG31OFfKWdXf9mU",
  authDomain: "shaan1731.firebaseapp.com",
  projectId: "shaan1731",
  storageBucket: "shaan1731.firebasestorage.app",
  messagingSenderId: "605552600836",
  appId: "1:605552600836:web:b9ac71747648a6c2f6d251"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "ShaanChat";
  const body = payload.notification?.body || payload.data?.body || "You have a new message.";
  self.registration.showNotification(title, {
    body,
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: payload.data?.chatId || "shaanchat-message",
    renotify: true,
    data: { url: payload.data?.url || "./", ...(payload.data || {}) }
  });
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("shaanchat-") && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        return (await caches.match("./index.html")) || Response.error();
      }
      return Response.error();
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "./";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
