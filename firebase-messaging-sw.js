/* ShaanChat — Firebase Cloud Messaging service worker (Spark/free-compatible client setup) */
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAsJnrF8MehSSvMuNHvBG31OFfKWdXf9mU',
  authDomain: 'shaan1731.firebaseapp.com',
  projectId: 'shaan1731',
  storageBucket: 'shaan1731.firebasestorage.app',
  messagingSenderId: '605552600836',
  appId: '1:605552600836:web:b9ac71747648a6c2f6d251'
});

const messaging = firebase.messaging();
const DB='shaanchat-sw', STORE='state', KEY='blockedUsers';

function openDB(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB,1);
    r.onupgradeneeded=()=>r.result.createObjectStore(STORE);
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
  });
}
async function setBlockedUsers(list){
  try{const db=await openDB();const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(Array.isArray(list)?list:[],KEY);}catch(e){}
}
async function getBlockedUsers(){
  try{return await new Promise(async(resolve)=>{const db=await openDB();const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).get(KEY);r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>resolve([]);});}catch(e){return []}
}
self.addEventListener('message',e=>{if(e.data?.type==='SHAAN_BLOCKED_USERS')setBlockedUsers(e.data.blockedUsers||[])});

messaging.onBackgroundMessage(async payload=>{
  const n=payload.notification||{};
  const d=payload.data||{};
  const blocked=await getBlockedUsers();
  const senderId=d.senderId||d.senderUid||'';
  if(senderId && blocked.includes(senderId))return;

  const title=n.title||d.title||'ShaanChat';
  const body=n.body||d.body||'New notification';
  const icon=n.icon||d.icon||'./icon-192.png';
  const data={
    ...d,
    chatUserId:d.chatUserId||d.senderId||d.senderUid||'',
    callId:d.callId||'',
    url:d.url||'./'
  };
  await self.registration.showNotification(title,{
    body,
    icon,
    badge:n.badge||'./icon-192.png',
    tag:d.tag||d.messageId||('shaan-'+Date.now()),
    renotify:true,
    data
  });
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const data=event.notification.data||{};
  event.waitUntil((async()=>{
    const clientsList=await clients.matchAll({type:'window',includeUncontrolled:true});
    const target=clientsList.find(c=>new URL(c.url).origin===self.location.origin);
    if(target){
      target.focus();
      target.postMessage({type:'SHAAN_NOTIFICATION_CLICK',...data});
      return;
    }
    const url=data.url||'./';
    await clients.openWindow(url);
  })());
});
