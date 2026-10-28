import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json; charset=utf-8"};
const groups=new Set(["6-8","9-11","12-14","15-17","18+"]);
const modes:Record<string,string>={explain:"اشرح الفكرة ببساطة وبالتدريج، ثم أعط مثالًا وسؤال مراجعة.",summary:"اكتب ملخصًا بالنقاط والمصطلحات الأساسية وسؤال مراجعة.",mindmap:"اكتب خريطة ذهنية نصية بعنوان رئيسي وفروع متداخلة باستخدام ├ و └.",quiz:"أنشئ 3 أسئلة مناسبة للمستوى، سؤالًا واحدًا كل مرة ولا تكشف الحل قبل إجابة الطالب.",solve:"ساعد الطالب على الحل خطوة بخطوة واشرح السبب ثم تحقق من الإجابة."};
const age:Record<string,string>={"6-8":"طفل صغير: جمل قصيرة جدًا وكلمات مألوفة ومثال يومي وتشجيع هادئ.","9-11":"ابتدائي: شرح عربي بجمل قصيرة وخطوات صغيرة ومثال عملي.","12-14":"إعدادي: عرّف المصطلحات ببساطة ورتب الخطوات مع مثال.","15-17":"ثانوي: شرح منظم ودقيق وأمثلة امتحانية والأخطاء الشائعة.","18+":"طالب بالغ: شرح واضح ومتوازن ومصطلحات دقيقة وأمثلة تطبيقية."};
const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply(405,{error:"Method not allowed"});
 const apiKey=Deno.env.get("OPENAI_API_KEY"),url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!apiKey)return reply(503,{error:"OPENAI_API_KEY is missing"});
 const auth=req.headers.get("Authorization")||"",token=auth.startsWith("Bearer ")?auth.slice(7):"";
 if(!token||!url||!anon||!service)return reply(401,{error:"Authentication required"});
 try{
  const who=await fetch(url+"/auth/v1/user",{headers:{apikey:anon,Authorization:"Bearer "+token}});
  if(!who.ok)return reply(401,{error:"Authentication required"});
  const user=await who.json(),userId=String(user.id||"");if(!userId)return reply(401,{error:"Authentication required"});
  const body=await req.json(),group=String(body.age_group||""),mode=String(body.mode||""),subject=String(body.subject||"").trim(),question=String(body.question||"").trim();
  if(!groups.has(group)||!modes[mode]||subject.length<1||subject.length>80||question.length<3||question.length>1800)return reply(400,{error:"راجع المادة والسؤال واختار طريقة شرح صحيحة."});
  const used=await fetch(url+"/rest/v1/rpc/consume_tutor_request",{method:"POST",headers:{apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"},body:JSON.stringify({p_user_id:userId,p_limit:20})});
  if(!used.ok)return reply(503,{error:"تعذر التحقق من حد الاستخدام. حاول لاحقًا."});
  if(await used.json()!==true)return reply(429,{error:"وصلت للحد اليومي للمساعد (20 سؤالًا). ارجع بكرة أو راجع ملخصك."});
  const instructions="أنت معلم عربي صبور وداعم. مستوى الطالب: "+age[group]+" المهمة: "+modes[mode]+" استخدم العربية الواضحة، لا تخترع حقائق، وقل إذا نقص سياق السؤال. لا تطلب بيانات شخصية. إذا كان السؤال واجبًا اشرح الحل مع الخطوات كي يتعلم الطالب.";
  const result=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-6-luna",instructions,input:"المادة: "+subject+"\nسؤال الطالب أو الدرس:\n"+question,max_output_tokens:900})});
  const data=await result.json().catch(()=>({}));if(!result.ok)return reply(502,{error:"تعذر الحصول على شرح الآن. حاول بعد قليل."});
  const output=String(data.output_text||((data.output||[]).flatMap((x:any)=>x.content||[]).find((x:any)=>x.type==="output_text")?.text)||"").slice(0,9000);
  return output?reply(200,{answer:output}):reply(502,{error:"لم يصل شرح واضح. جرّب صياغة أخرى."});
 }catch(_){return reply(500,{error:"حدث خطأ غير متوقع. حاول مرة أخرى."});}
});