import { auth, db, $ } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  collection, query, where, getDocs, doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

function normalizeUsername(value){return (value||"").trim().toLowerCase().replace(/^@+/,"");}
function validateUsername(username){
  if(!username) throw new Error("Enter a username.");
  if(username.length<3||username.length>20) throw new Error("Username must be 3-20 characters.");
  if(!/^[a-z0-9._]+$/.test(username)) throw new Error("Username can use only letters, numbers, dot and underscore.");
}

export function initAuthModule({onUser}={}) {
  const registerFields=$("registerFields"),registerName=$("registerName"),registerUsername=$("registerUsername");
  const email=$("email"),password=$("password"),authBtn=$("authBtn"),switchText=$("switchText"),authError=$("authError");
  let isRegister=false;
  switchText.onclick=()=>{
    isRegister=!isRegister;
    registerFields.classList.toggle("hidden",!isRegister);
    authBtn.textContent=isRegister?"Create Account":"Login";
    switchText.textContent=isRegister?"Already have an account? Login":"Create a new account";
    authError.textContent="";
  };
  authBtn.onclick=async()=>{
    authError.textContent="";
    try{
      if(isRegister){
        const name=registerName.value.trim(), username=normalizeUsername(registerUsername.value);
        if(!name) throw new Error("Enter your name.");
        validateUsername(username);
        const usernameSnap=await getDocs(query(collection(db,"users"),where("usernameLower","==",username)));
        if(!usernameSnap.empty) throw new Error("Username already taken. Choose another.");
        const credential=await createUserWithEmailAndPassword(auth,email.value.trim(),password.value);
        await setDoc(doc(db,"users",credential.user.uid),{
          uid:credential.user.uid,name,username,usernameLower:username,email:email.value.trim(),
          online:true,lastSeen:serverTimestamp(),createdAt:serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth,email.value.trim(),password.value);
      }
    }catch(e){console.error(e);authError.textContent=e?.message||"Authentication failed.";}
  };
  return onAuthStateChanged(auth,user=>Promise.resolve(onUser?.(user)));
}
