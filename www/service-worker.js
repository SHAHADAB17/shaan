importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey:"AIzaSyAsJnrF8MehSSvMuNHvBG31OFfKWdXf9mU",
  authDomain:"shaan1731.firebaseapp.com",
  projectId:"shaan1731",
  storageBucket:"shaan1731.firebasestorage.app",
  messagingSenderId:"605552600836",
  appId:"1:605552600836:web:b9ac71747648a6c2f6d251"
});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
  const title=payload.notification?.title||"ShaanChat";
  const body=payload.notification?.body||"You have a new message.";
  self.registration.showNotification(title,{body,icon:"/icon-192.svg",badge:"/icon-192.svg",
    data:payload.data||{},tag:payload.data?.chatId||"shaanchat-message",renotify:true});
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const c of list)if("focus" in c){c.focus();return}
    return clients.openWindow("/");
  }));
});