/* ShaanChat — Firebase Cloud Messaging background worker */
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
  const data = payload.data || {};
  const type = data.type || "message";
  const title = data.title || (type === "call" ? (data.callerName || "Incoming call") : (data.senderName || "New message"));
  const body = data.body || (type === "call"
    ? (data.callType === "video" ? "Incoming video call" : "Incoming voice call")
    : "New message");

  const scope = self.registration.scope;
  const url = type === "message"
    ? `${scope}?chat=${encodeURIComponent(data.senderId || data.chatId || "")}`
    : `${scope}?call=${encodeURIComponent(data.callId || "")}`;

  self.registration.showNotification(title, {
    body,
    icon: data.icon || `${scope}icons/icon-192.png`,
    badge: `${scope}icons/icon-192.png`,
    tag: data.tag || `${type}-${data.chatId || data.callId || Date.now()}`,
    renotify: true,
    data: { ...data, url }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || self.registration.scope;

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      try {
        const clientUrl = new URL(client.url);
        const target = new URL(targetUrl);
        if (clientUrl.origin === target.origin) {
          await client.focus();
          if ("navigate" in client) await client.navigate(target.href);
          return;
        }
      } catch (_) {}
    }
    await self.clients.openWindow(targetUrl);
  })());
});
