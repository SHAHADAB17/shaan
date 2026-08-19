export function safeSetHTML(target, html) {
  if(!target) return;
  if(window.DOMPurify) target.innerHTML=window.DOMPurify.sanitize(String(html??""),{
    USE_PROFILES:{html:true},
    FORBID_TAGS:["style","script","iframe","object","embed","form"],
    FORBID_ATTR:["onerror","onclick","onload"]
  });
  else {
    const tpl=document.createElement("template");
    tpl.innerHTML=String(html??"");
    tpl.content.querySelectorAll("script,style,iframe,object,embed,form").forEach(n=>n.remove());
    target.replaceChildren(tpl.content.cloneNode(true));
  }
}
export function safeExternalUrl(value) {
  try {
    const u=new URL(String(value||""),location.href);
    if(["https:","http:"].includes(u.protocol)) return u.toString();
  } catch(_){}
  return "#";
}
export function scrollToMessage(container,id) {
  const el=container?.querySelector(`[data-id="${CSS.escape(String(id))}"]`);
  if(!el) return false;
  el.scrollIntoView({behavior:"smooth",block:"center"});
  el.classList.remove("message-highlight");
  void el.offsetWidth;
  el.classList.add("message-highlight");
  setTimeout(()=>el.classList.remove("message-highlight"),1600);
  return true;
}
export function attachSwipeToReply(container,getMessages,onReply,{threshold=70}={}) {
  if(!container) return;
  let startX=0,startY=0,target=null;
  const point=e=>e.touches?.[0]||e.changedTouches?.[0];
  container.addEventListener("touchstart",e=>{
    const p=point(e); if(!p) return;
    target=e.target.closest(".message-wrap");
    startX=p.clientX;startY=p.clientY;
  },{passive:true});
  container.addEventListener("touchend",e=>{
    const p=point(e); if(!p||!target) return;
    const dx=p.clientX-startX,dy=p.clientY-startY;
    const d=getMessages()?.find(m=>m.id===target.dataset.id);
    if(d && Math.abs(dx)>threshold && Math.abs(dx)>Math.abs(dy)*1.25){
      onReply(d);
      target.classList.add("swipe-reply");
      setTimeout(()=>target?.classList.remove("swipe-reply"),250);
    }
    target=null;
  },{passive:true});
}
export function trapFocus(modal) {
  if(!modal || modal.dataset.focusTrapReady) return;
  modal.dataset.focusTrapReady="1";
  modal.addEventListener("keydown",e=>{
    if(e.key!=="Tab" || modal.classList.contains("hidden")) return;
    const items=[...modal.querySelectorAll('button,input,textarea,select,a[href],[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled);
    if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
}
export function initAccessibleModals() {
  document.querySelectorAll(".modal,.call-modal,.profile-image-modal,.media-viewer,.app-lock-screen").forEach(modal=>{
    trapFocus(modal);
    const observer=new MutationObserver(()=>{
      if(!modal.classList.contains("hidden")) {
        const first=modal.querySelector("button,input,textarea,select,a[href]");
        first?.focus({preventScroll:true});
      }
    });
    observer.observe(modal,{attributes:true,attributeFilter:["class"]});
  });
}
export function initSwipeReply(messages,getMessages) {
  attachSwipeToReply(messages,getMessages,d=>{
    window.dispatchEvent(new CustomEvent("shaanchat:reply",{detail:d}));
  });
  window.addEventListener("shaanchat:reply",e=>{
    // chat.js registers its actual handler separately.
    window.__shaanChatReplyHandler?.(e.detail);
  });
}
