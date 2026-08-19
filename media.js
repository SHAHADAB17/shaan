const CLOUDINARY_CLOUD_NAME = "xafyypjl";
const CLOUDINARY_UPLOAD_PRESET = "shaanchat_upload";
export const CLOUDINARY_MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

export function cloudinaryConfigured() {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET &&
    !/^YOUR_/i.test(CLOUDINARY_CLOUD_NAME) && !/^YOUR_/i.test(CLOUDINARY_UPLOAD_PRESET));
}
function resourceType(file) {
  const type=(file?.type||"").toLowerCase();
  if(type.startsWith("image/")) return "image";
  if(type.startsWith("video/") || type.startsWith("audio/")) return "video";
  return "raw";
}
function endpoint(type) {
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/${type}/upload`;
}

export async function compressImage(file, {maxWidth=1920,maxHeight=1920,quality=0.82,maxBytes=4*1024*1024}={}) {
  if(!file?.type?.startsWith("image/")) return file;
  if(file.size <= 450*1024) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1,maxWidth/bitmap.width,maxHeight/bitmap.height);
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext("2d",{alpha:false});
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  bitmap.close?.();
  let q=quality;
  let blob=await new Promise(r=>canvas.toBlob(r,"image/jpeg",q));
  while(blob && blob.size>maxBytes && q>0.55){
    q-=0.07;
    blob=await new Promise(r=>canvas.toBlob(r,"image/jpeg",q));
  }
  if(!blob) return file;
  return new File([blob],file.name.replace(/\.[^.]+$/,"")+".jpg",{type:"image/jpeg",lastModified:Date.now()});
}

export async function uploadToCloudinary(file,{folder="shaanchat"}={}) {
  if(!file) throw new Error("No file selected.");
  if(!cloudinaryConfigured()) throw new Error("Cloudinary is not configured.");
  if(file.size<=0) throw new Error("The selected file is empty.");
  if(file.size>CLOUDINARY_MAX_FILE_SIZE) throw new Error("File must be 20 MB or smaller.");

  const uploadFile=file.type.startsWith("image/") ? await compressImage(file,{}) : file;
  const type=resourceType(uploadFile);
  const form=new FormData();
  form.append("file",uploadFile,uploadFile.name||"upload");
  form.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);
  if(folder) form.append("asset_folder",folder);
  const response=await fetch(endpoint(type),{method:"POST",body:form});
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data?.error?.message||`Cloudinary upload failed (${response.status})`);
  return data;
}
export async function uploadMedia(file,folder="shaanchat/media"){ return uploadToCloudinary(file,{folder}); }
export async function imageToCloudinary(file,folder){
  if(!file) return null;
  if(!file.type.startsWith("image/")) throw new Error("Please select an image.");
  if(file.size>MAX_IMAGE_UPLOAD_BYTES) throw new Error("Image must be 10 MB or smaller.");
  return (await uploadToCloudinary(file,{folder})).secure_url;
}

export function cloudinaryAudioPlaybackUrl(url){
  if(!url) return url;
  try{
    const u=new URL(url);
    if(!u.hostname.includes("res.cloudinary.com")||!u.pathname.includes("/video/upload/")) return url;
    const marker="/video/upload/", idx=u.pathname.indexOf(marker);
    if(idx<0) return url;
    const rest=u.pathname.slice(idx+marker.length);
    u.pathname=u.pathname.slice(0,idx+marker.length)+"f_auto,q_auto/"+rest;
    return u.toString();
  }catch(_){return url;}
}

export function cloudinaryDownloadUrl(url,filename="download"){
  if(!url) return url;
  try{
    const u=new URL(url), marker="/upload/", i=u.pathname.indexOf(marker);
    if(i<0) return url;
    const safe=String(filename).replace(/[\\/:*?"<>|]+/g,"_").trim()||"download";
    u.pathname=u.pathname.slice(0,i+marker.length)+"fl_attachment:"+encodeURIComponent(safe)+"/"+u.pathname.slice(i+marker.length);
    return u.toString();
  }catch(_){return url;}
}

export async function downloadMedia(url,filename="download"){
  if(!url) throw new Error("Media URL not available.");
  const direct=cloudinaryDownloadUrl(url,filename);
  const a=document.createElement("a");
  a.href=direct;a.download=filename;a.target="_blank";a.rel="noopener noreferrer";
  document.body.appendChild(a);a.click();a.remove();
}

export async function drawWaveformPreview(canvas,url){
  if(!canvas||!url) return;
  const ctx=canvas.getContext("2d");
  const drawPlaceholder=()=>{
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const bars=48,w=canvas.width/bars;
    for(let i=0;i<bars;i++){
      const h=8+Math.abs(Math.sin(i*1.7))*36;
      ctx.fillStyle="rgba(0,234,255,.55)";
      ctx.fillRect(i*w+1,(canvas.height-h)/2,Math.max(2,w-2),h);
    }
  };
  try{
    drawPlaceholder();
    const res=await fetch(url,{mode:"cors"});
    if(!res.ok) return;
    const buffer=await res.arrayBuffer();
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return;
    const audioCtx=new AC();
    const audio=await audioCtx.decodeAudioData(buffer.slice(0));
    const data=audio.getChannelData(0);
    const bars=64,step=Math.max(1,Math.floor(data.length/bars));
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="rgba(0,234,255,.72)";
    for(let i=0;i<bars;i++){
      let sum=0,count=0;
      for(let j=0;j<step && i*step+j<data.length;j++){sum+=Math.abs(data[i*step+j]);count++;}
      const amp=Math.min(1,(sum/(count||1))*3.2);
      const h=Math.max(5,amp*58),x=i*(canvas.width/bars);
      ctx.fillRect(x+1,(canvas.height-h)/2,Math.max(2,canvas.width/bars-2),h);
    }
    await audioCtx.close();
  }catch(_){drawPlaceholder();}
}
