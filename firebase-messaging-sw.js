importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAsJnrF8MeSSvMuNHvBG31OFfKWdXf9mU",
  authDomain: "shaan1731.firebaseapp.com",
  projectId: "shaan1731",
  storageBucket: "shaan1731.firebasestorage.app",
  messagingSenderId: "605552600836",
  appId: "1:605552600836:web:b9ac71747648a6c2f6d251"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "ShaanChat";
  const options = {
    body: payload.notification?.body || "You have a new message.",
    icon: "/favicon.ico",
    data: payload.data || {}
  };
  self.registration.showNotification(title, options);
});
