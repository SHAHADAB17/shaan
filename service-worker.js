const CACHE_NAME = "shaanchat-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];

/* ================================
   Firebase Cloud Messaging
================================ */

importScripts(
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAsJnrF8MehSSvMuNHvBG31OFkWKdXf9mU",
  authDomain: "shaan1731.firebaseapp.com",
  projectId: "shaan1731",
  storageBucket: "shaan1731.firebasestorage.app",
  messagingSenderId: "605552600836",
  appId: "1:605552600836:web:b9ac71747648a6c2f6d251"
});

const messaging = firebase.messaging();

/* Background notification */

messaging.onBackgroundMessage((payload) => {

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    "ShaanChat";

  const body =
    payload.notification?.body ||
    payload.data?.body ||
    "You have a new message.";

  const options = {
    body: body,

    icon: "./icons/icon-192.png",

    badge: "./icons/icon-192.png",

    tag: "shaanchat-message",

    renotify: true,

    data: {
      url: "./"
    }
  };

  self.registration.showNotification(title, options);
});


/* ================================
   PWA INSTALL / CACHE
================================ */

self.addEventListener("install", (event) => {

  event.waitUntil(

    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())

  );

});


self.addEventListener("activate", (event) => {

  event.waitUntil(

    caches.keys().then((keys) => {

      return Promise.all(

        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))

      );

    }).then(() => self.clients.claim())

  );

});


/* ================================
   Network + Offline Cache
================================ */

self.addEventListener("fetch", (event) => {

  if (event.request.method !== "GET") return;

  event.respondWith(

    fetch(event.request)

      .then((response) => {

        const copy = response.clone();

        caches.open(CACHE_NAME).then((cache) => {

          cache.put(event.request, copy);

        });

        return response;

      })

      .catch(() => {

        return caches.match(event.request);

      })

  );

});


/* ================================
   Notification Click
================================ */

self.addEventListener("notificationclick", (event) => {

  event.notification.close();

  const targetUrl =
    event.notification.data?.url || "./";

  event.waitUntil(

    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {

      for (const client of clientList) {

        if ("focus" in client) {

          client.navigate(targetUrl);

          return client.focus();

        }

      }

      if (clients.openWindow) {

        return clients.openWindow(targetUrl);

      }

    })

  );

});
