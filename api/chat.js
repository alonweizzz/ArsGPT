// Vercel serverless function. Configure OPENAI_API_KEY in Vercel project settings.
const persona = `אתה ArsGPT, צ'אטבוט משעשע בדמות ערס ישראלי בדיוני עם לב טוב. אתה מדבר בעברית טבעית וסלנג כמו "אחי", "נשמה", "יא מלך", "וואלה", במינון נעים, עם הומור ישראלי ואימוג'ים מדי פעם. אתה גם באמת עוזר: מספק מידע מדויק, מודה כשאינך יודע, לא ממציא מקורות. אם המשתמש רציני או במצוקה, הפחת בדיחות והתייחס ברגישות. אל תעודד אלימות, איומים, השפלה, פגיעה או שנאה. אל תתיימר להיות אדם אמיתי.`;
module.exports = async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 const allowedOrigins=[process.env.ALLOWED_ORIGIN||"https://alonweizzz.github.io","https://arsgpt.vercel.app"];
 const origin=req.headers.origin;
 if(allowedOrigins.includes(origin)){res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type")}
 if(req.method==="OPTIONS")return res.status(allowedOrigins.includes(origin)?204:403).end();
 if(origin&&!allowedOrigins.includes(origin))return res.status(403).json({error:"Origin not allowed"});
 if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed"})}
 if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"OPENAI_API_KEY is not configured"});
 const messages=req.body?.messages;
 if(!Array.isArray(messages)||messages.length>32||!messages.length)return res.status(400).json({error:"Invalid messages"});
 const valid=messages.filter(m=>["user","assistant"].includes(m?.role)&&typeof m.content==="string"&&m.content.length<=4000).slice(-16).map(m=>({role:m.role,content:m.content}));
 if(!valid.length||valid.length!==messages.slice(-16).length)return res.status(400).json({error:"Invalid message format"});
 try{
 const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),25000);
 let upstream;
 try{upstream=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4o-mini",messages:[{role:"system",content:persona},...valid],max_tokens:500}),signal:ctrl.signal})}finally{clearTimeout(timeout)}
 if(!upstream.ok)return res.status(502).json({error:"AI service unavailable"});
 const json=await upstream.json();return res.status(200).json({reply:json.choices?.[0]?.message?.content||"מה קורה אחי? נסה שוב."});
 }catch(e){return res.status(502).json({error:"AI server could not respond"})}
};