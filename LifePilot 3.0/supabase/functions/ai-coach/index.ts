const SUPABASE_URL="https://rhafdhwixhqxufylavag.supabase.co";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(d:any,s=200)=>new Response(JSON.stringify(d),{status:s,headers:cors});
async function user(req:Request){const t=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();const k=req.headers.get("apikey")||Deno.env.get("SUPABASE_ANON_KEY")||"";if(!t)return null;const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:k,Authorization:`Bearer ${t}`}});return r.ok?await r.json():null}
async function db(req:Request,path:string,opts:any={}){const k=req.headers.get("apikey")||Deno.env.get("SUPABASE_ANON_KEY")||"";return fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...opts,headers:{apikey:k,Authorization:req.headers.get("authorization")||"",Prefer:"return=representation",...(opts.headers||{})}})}
Deno.serve(async req=>{try{
 if(req.method==="OPTIONS")return new Response("ok",{status:200,headers:cors});
 const u=await user(req); if(!u?.id)return json({error:"Sessione non valida o scaduta."},401);
 const body=await req.json().catch(()=>({})); const title=String(body.goal_title||"").trim();
 const [goals,tasks,quizzes,profile]=await Promise.all([
  db(req,`goals?user_id=eq.${u.id}&select=id,title,progress,streak&order=created_at.desc&limit=10`),
  db(req,`goal_tasks?user_id=eq.${u.id}&select=task_date,title,completed,goal_id&order=task_date.desc&limit=50`),
  db(req,`quiz_attempts?user_id=eq.${u.id}&select=score,total,passed,skills,created_at&order=created_at.desc&limit=30`),
  db(req,`profiles?id=eq.${u.id}&select=nickname,xp,level,current_streak,best_streak,lifecoins,lifepoints&limit=1`)
 ]);
 const data=await Promise.all([goals.json(),tasks.json(),quizzes.json(),profile.json()]);
 const [g,t,q,p]=data; const gp=Array.isArray(g)?g:[], tp=Array.isArray(t)?t:[], qp=Array.isArray(q)?q:[], pp=p?.[0]||{};
 const missed=tp.filter((x:any)=>!x.completed && new Date(x.task_date+"T23:59:59")<new Date()).length;
 const passed=qp.filter((x:any)=>x.passed).length;
 const avg=qp.length?Math.round(qp.reduce((n:number,x:any)=>n+(x.total?x.score/x.total*100:0),0)/qp.length):0;
 const key=Deno.env.get("GEMINI_API_KEY");
 if(!key)return json({coach:{title:"Coach LifePilot",summary:"Analisi disponibile.",diagnosis:missed>2?"Stai accumulando missioni non completate. Riduci il carico del prossimo giorno.":"Il ritmo è stabile: mantieni il prossimo passo concreto.",action:missed>2?"Riduci la missione di domani a 15–20 minuti e completala prima di aggiungere altro.":"Mantieni una sessione Focus e un quiz collegato all obiettivo principale.",metrics:{missed_tasks:missed,quiz_average:avg,streak:pp.current_streak||0}}});
 const prompt=`Sei il Coach on-demand di LifePilot. Analizza dati reali e proponi UNA modifica concreta al piano. Non inventare dati. OBIETTIVO: ${title||gp[0]?.title||"non specificato"}. PROFILO: livello ${pp.level||1}, XP ${pp.xp||0}, streak ${pp.current_streak||0}, LifeCoins ${pp.lifecoins||0}. MISSIONI SCADUTE NON COMPLETATE: ${missed}. QUIZ: ${qp.length}, SUPERATI: ${passed}, MEDIA: ${avg}%. Restituisci JSON con title,summary,diagnosis,action,reason,plan_change (array di massimo 3 task concreti).`;
 const models=["gemini-3.6-flash","gemini-3.5-flash-lite","gemini-3.5-flash","gemini-3.7-flash","gemini-3-flash-preview"];
 for(const model of models){const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:"POST",headers:{"x-goog-api-key":key,"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",temperature:.4}})});if(!r.ok)continue;const j=await r.json();const text=j?.candidates?.[0]?.content?.parts?.map((x:any)=>x.text||"").join("").trim();if(!text)continue;try{return json({coach:JSON.parse(text),metrics:{missed_tasks:missed,quiz_average:avg,streak:pp.current_streak||0}})}catch(_){continue}}
 return json({error:"Il Coach non è riuscito a generare un suggerimento."},502);
}catch(e){return json({error:e instanceof Error?e.message:"Errore Coach."},500)}});