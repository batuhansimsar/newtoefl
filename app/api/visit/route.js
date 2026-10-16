import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
export const runtime = "nodejs";
export const maxDuration = 30;
const clean = v => typeof v === "string" ? v.replace(/[\r\n\x00-\x1f]/g," ").slice(0,120) : "";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function sign(value) { return createHmac("sha256",process.env.TELEGRAM_BOT_TOKEN).update(value).digest("hex"); }
function readVisitor(request) {
 const value=request.headers.get("cookie")?.match(/(?:^|;\s*)visit_id=([^;]+)/)?.[1];
 if(!value) return randomUUID();
 const [id,signature]=value.split(".");
 if(!uuid.test(id)||!signature||!/^[a-f0-9]{64}$/.test(signature))return randomUUID();
 return timingSafeEqual(Buffer.from(signature),Buffer.from(sign(id))) ? id : randomUUID();
}
async function redis(command) {
 const response=await fetch(process.env.UPSTASH_REDIS_REST_URL,{method:"POST",headers:{Authorization:`Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,"Content-Type":"application/json"},body:JSON.stringify(command),cache:"no-store",signal:AbortSignal.timeout(6000)});
 if(!response.ok)throw new Error("Storage unavailable");
 const body=await response.json();if(body.error)throw new Error("Storage command failed");return body.result;
}
// One atomic operation: rate limit, deduplicate, increment and read counts.
const script = `
local rate=redis.call('INCR',KEYS[1])
if rate==1 then redis.call('EXPIRE',KEYS[1],60) end
if rate>60 then return {-1,0,0,0} end
if not redis.call('SET',KEYS[2],'1','EX',86400,'NX') then return {0,0,0,0} end
local n=redis.call('INCR',KEYS[3])
if n==1 then redis.call('INCR',KEYS[5]) end
local total=redis.call('INCR',KEYS[4])
local unique=tonumber(redis.call('GET',KEYS[5]) or '0')
return {1,total,unique,n}
`;
export async function POST(request) {
 const headers={"Cache-Control":"no-store"};
 const origin=request.headers.get("origin");
 if(!origin||origin!==new URL(request.url).origin)return new Response(null,{status:403,headers});
 if(Number(request.headers.get("content-length")||0)>4096)return new Response(null,{status:413,headers});
 let data;try{const raw=await request.text();if(raw.length>4096)return new Response(null,{status:413,headers});data=JSON.parse(raw);}catch{return new Response(null,{status:400,headers});}
 if(!data||!uuid.test(data.id||""))return new Response(null,{status:400,headers});
 const ua=request.headers.get("user-agent")||"";
 if(/bot|crawler|spider|preview|headless/i.test(ua))return new Response(null,{status:204,headers});
 if(["TELEGRAM_BOT_TOKEN","TELEGRAM_CHAT_ID","UPSTASH_REDIS_REST_URL","UPSTASH_REDIS_REST_TOKEN"].some(key=>!process.env[key])){
  console.error("Missing analytics environment configuration");return new Response(null,{status:503,headers});
 }
 const visitor=readVisitor(request);
 const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"local";
 const rateKey=sign("rate:"+ip); // Raw IP is neither stored nor sent to Telegram.
 try {
  const [accepted,total,unique,n]=await redis(["EVAL",script,5,`cs:rate:${rateKey}`,`cs:event:${visitor}:${data.id}`,`cs:visitor:${visitor}`,"cs:total","cs:unique"]);
  headers["Set-Cookie"]=`visit_id=${visitor}.${sign(visitor)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol==="https:"?"; Secure":""}`;
  if(accepted===-1)return new Response(null,{status:429,headers});
  if(accepted===0)return new Response(null,{status:204,headers});
  let ref="Doğrudan / bilinmiyor";try{if(data.referrer)ref=new URL(data.referrer).hostname}catch{}
  let city=clean(request.headers.get("x-vercel-ip-city"));try{city=decodeURIComponent(city)}catch{}
  const country=clean(request.headers.get("x-vercel-ip-country"))||"Bilinmiyor";
  const device=/mobile|android|iphone/i.test(ua)?"Mobil":"Masaüstü / tablet";
  const browser=/Edg\//.test(ua)?"Edge":/Firefox\//.test(ua)?"Firefox":/Chrome\//.test(ua)?"Chrome":/Safari\//.test(ua)?"Safari":"Diğer";
  const text=["🌐 Yeni site ziyareti",`Toplam ziyaret: ${total}`,`Tekil tarayıcı: ${unique}`,`Ziyaretçi: ${n>1?"Tekrar gelen":"Yeni"} (${n}. ziyaret)`,`Kimlik: ${visitor.slice(0,8)}`,`Yaklaşık konum: ${clean(city)} ${country}`.trim(),`Kaynak: ${clean(ref)}`,`UTM kaynak: ${clean(data.source)||"—"}`,`UTM ortam: ${clean(data.medium)||"—"}`,`Kampanya: ${clean(data.campaign)||"—"}`,`Cihaz: ${device} / ${browser}`,`Dil: ${clean(data.language)}`,`Zaman: ${new Date().toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"})}`].join("\n");
  const response=await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,text}),signal:AbortSignal.timeout(8000)});
  const result=await response.json();
  if(!response.ok||!result.ok)console.error("Telegram notification failed",response.status);
  return new Response(null,{status:204,headers});
 } catch { console.error("Visit tracking service unavailable");return new Response(null,{status:503,headers}); }
}
