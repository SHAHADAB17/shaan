import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app-check.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAsJnrF8MehSSvMuNHvBG31OFfKWdXf9mU",
  authDomain: "shaan1731.firebaseapp.com",
  projectId: "shaan1731",
  storageBucket: "shaan1731.firebasestorage.app",
  messagingSenderId: "605552600836",
  appId: "1:605552600836:web:b9ac71747648a6c2f6d251"
};

export const APP_CHECK_SITE_KEY = "";
export const VAPID_KEY = "BNbo2H17TaooAcrCq5fLxB8dyrtOFIAaP3bPPlhwGm8OJ7CehCPy9llkD1aYOLwKFJsJkbfY-fCIAhTyoaRmOY8";
export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

if (APP_CHECK_SITE_KEY) {
  try {
    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    console.warn("App Check not initialized:", error);
  }
}

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const $ = id => document.getElementById(id);
