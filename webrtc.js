export const DEFAULT_RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Add your own TURN server here for production NAT traversal:
    // { urls: "turn:turn.example.com:3478", username: "...", credential: "..." }
  ],
  iceCandidatePoolSize: 10
};

export function getRtcConfig() {
  return structuredClone(DEFAULT_RTC_CONFIG);
}

/**
 * Creates a peer connection with ICE-state monitoring.
 * The caller supplies onIceRestartNeeded to renegotiate when a path fails.
 */
export function createPeerConnection(config, {onIceRestartNeeded}={}) {
  const pc=new RTCPeerConnection(config);
  let restartTimer=null, restartRequested=false;
  pc.addEventListener("iceconnectionstatechange",()=>{
    const state=pc.iceConnectionState;
    if(state==="connected"||state==="completed"){
      restartRequested=false;
      if(restartTimer){clearTimeout(restartTimer);restartTimer=null;}
      return;
    }
    if((state==="disconnected"||state==="failed")&&!restartRequested){
      restartRequested=true;
      restartTimer=setTimeout(()=>{
        if(pc.iceConnectionState==="disconnected"||pc.iceConnectionState==="failed"){
          pc.restartIce?.();
          onIceRestartNeeded?.();
        }
      },2000);
    }
  });
  pc.addEventListener("connectionstatechange",()=>{
    if(pc.connectionState==="closed" && restartTimer) clearTimeout(restartTimer);
  });
  return pc;
}
