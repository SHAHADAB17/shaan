import express from "express";
import cors from "cors";
import admin from "firebase-admin";

const app=express();
const PORT=Number(process.env.PORT||8787);
const MODEL=process.env.OPENAI_MODEL||"gpt-5.6-luna";
const KEY=process.env.OPENAI_API_KEY;

admin.initializeApp({credential:admin.credential.applicationDefault()});

app.use(cors({origin:process.env.CLIENT_ORIGIN||true,credentials:true}));
app.use(express.json({limit:"256kb"}));

const buckets=new Map();
function allowed(uid){
  const now=Date.now(), item=buckets.get(uid);
  if(!item||now-item.t>=60000){buckets.set(uid,{t:now,n:1});return true}
  item.n++;return item.n<=20;
}
async function auth(req,res,next){
  try{
    const h=req.headers.authorization||"";
    if(!h.startsWith("Bearer "))return res.status(401).json({error:"Authentication required."});
    req.user=await admin.auth().verifyIdToken(h.slice(7));next();
  }catch{res.status(401).json({error:"Invalid or expired login session."})}
}
const clean=(x,n)=>String(x??"").replace(/\u0000/g,"").slice(0,n);

app.get("/api/health",(req,res)=>res.json({ok:true}));
app.post("/api/ai",auth,async(req,res)=>{
  if(!KEY)return res.status(503).json({error:"AI backend is not configured."});
  if(!allowed(req.user.uid))return res.status(429).json({error:"Too many AI requests. Try again in a minute."});

  const instruction=clean(req.body?.instruction,4000).trim();
  if(!instruction)return res.status(400).json({error:"Instruction is required."});

  const conversation=Array.isArray(req.body?.messages)
    ? req.body.messages.slice(-60).map(x=>clean(x,1000)).join("\n"):"";
  const prompt=[
    "You are Shaan AI inside ShaanChat.",
    `Conversation partner: ${clean(req.body?.name,100)} ${clean(req.body?.username,100)}`,
    "Recent conversation:",conversation||"(none)",
    "Current draft:",clean(req.body?.draft,2000)||"(none)",
    "Task:",instruction,
    "Never invent facts not contained in the context."
  ].join("\n\n");

  try{
    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${KEY}`},
      body:JSON.stringify({model:MODEL,input:prompt,max_output_tokens:800})
    });
    const data=await r.json().catch(()=>null);
    if(!r.ok)return res.status(r.status>=500?502:r.status).json({error:data?.error?.message||"AI provider error."});
    const text=data?.output_text||(data?.output||[]).flatMap(x=>x?.content||[]).map(x=>x?.text||"").filter(Boolean).join("\n");
    if(!text)return res.status(502).json({error:"AI returned an empty response."});
    res.json({text});
  }catch(e){console.error(e);res.status(502).json({error:"AI service unavailable."})}
});
app.listen(PORT,()=>console.log(`ShaanChat AI backend :${PORT}`));