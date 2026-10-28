import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json; charset=utf-8"};
const groups=new Set(["6-8","9-11","12-14","15-17","18+"]);
const modes:Record<string,string>={solve:"حل السؤال مباشرة خطوة بخطوة، وضح المعطيات والقانون/الفكرة ثم اكتب النتيجة النهائية وتحقق منها.",explain:"اشرح الفكرة ببساطة مع مثال وسؤال مراجعة قصير.",summary:"اكتب ملخصًا منظمًا بالنقاط والمصطلحات الأساسية.",mindmap:"اكتب خريطة ذهنية نصية بعنوان رئيسي وفروع متداخلة باستخدام ├ و └.",quiz:"اسأل الطالب سؤالًا واحدًا مناسبًا للصف وانتظر إجابته قبل كشف الحل."};
const gradeNames:Record<string,string>={primary1:"الصف الأول الابتدائي",primary2:"الصف الثاني الابتدائي",primary3:"الصف الثالث الابتدائي",primary4:"الصف الرابع الابتدائي",primary5:"الصف الخامس الابتدائي",primary6:"الصف السادس الابتدائي",prep1:"الصف الأول الإعدادي",prep2:"الصف الثاني الإعدادي",prep3:"الصف الثالث الإعدادي",secondary1:"الصف الأول الثانوي",secondary2:"الصف الثاني الثانوي",secondary3:"الصف الثالث الثانوي"};
const tracks:Record<string,string>={medicine:"الطب وعلوم الحياة",engineering:"الهندسة وعلوم الحاسب",business:"الأعمال",arts:"الآداب والفنون"};
const age:Record<string,string>={"6-8":"طفل صغير: جمل قصيرة جدًا وكلمات مألوفة ومثال من الحياة اليومية.","9-11":"طالب ابتدائي: شرح واضح بخطوات قصيرة ومثال عملي.","12-14":"طالب إعدادي: عرّف المصطلحات ورتب خطوات الحل.","15-17":"طالب ثانوي: شرح دقيق ومنظم وأمثلة مناسبة للامتحانات.","18+":"طالب بالغ: شرح واضح ومتوازن ومصطلحات دقيقة."};
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
  const body=await req.json(),group=String(body.age_group||""),mode=String(body.mode||""),subject=String(body.subject||"").trim(),question=String(body.question||"").trim(),image=typeof body.image==="string"?body.image:"",grade=String(body.grade||""),system=String(body.system||""),track=String(body.track||""),history=body.history;
  const validHistory=Array.isArray(history)&&history.length<=6&&history.every((item:any)=>(item.role==="user"||item.role==="assistant")&&typeof item.content==="string"&&item.content.length<=2200);
  const validImage=!image||(image.length<=4_200_000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(image));
  if(!groups.has(group)||!modes[mode]||subject.length<1||subject.length>80||(question.length<3&&!image)||question.length>1800||!validHistory||!validImage)return reply(400,{error:"راجع السؤال أو الصورة أو ابدأ شرحًا جديدًا."});
  if(grade&&!gradeNames[grade])return reply(400,{error:"اختار صفًا دراسيًا صحيحًا."});
  if(grade==="secondary2"&&(system!=="general"&&system!=="bac"))return reply(400,{error:"اختار نظام تانية ثانوي."});
  if(grade==="secondary2"&&system==="bac"&&!tracks[track])return reply(400,{error:"اختار مسار البكالوريا."});
  if(grade!=="secondary2"&&(system||track))return reply(400,{error:"إعداد الصف غير صحيح."});
  if(grade==="secondary2"&&system==="general"&&track)return reply(400,{error:"المسار لا ينطبق على النظام المختار."});
  const usage=await fetch(url+"/rest/v1/rpc/consume_tutor_request",{method:"POST",headers:{apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"},body:JSON.stringify({p_user_id:userId,p_limit:20})});
  if(!usage.ok)return reply(503,{error:"تعذر التحقق من حد الاستخدام. حاول لاحقًا."});
  if(await usage.json()!==true)return reply(429,{error:"وصلت للحد اليومي للمساعد (20 سؤالًا). ارجع بكرة أو راجع ملخصك."});
  const path=grade==="secondary2"&&system==="bac"?" — البكالوريا المصرية، مسار "+tracks[track]:grade==="secondary2"?" — الثانوية العامة":"";
  const gradeContext=grade?gradeNames[grade]+path:"غير محدد؛ اعتمد على الفئة العمرية";
  const instructions="أنت أستاذ عربي خاص، صبور ومشجع. مستوى العمر: "+age[group]+". الصف: "+gradeContext+". المطلوب: "+modes[mode]+" إذا أرسل الطالب صورة، اقرأ النص والرموز والمعادلات والرسوم الظاهرة فيها، ثم أجب عن السؤال الموجود. لو الصورة غير واضحة أو ناقصة، اطلب صورة أوضح ولا تخمّن. ابدأ بالإجابة مباشرة ولا تطلب إعادة السؤال إذا كان مفهومًا. في المسائل اكتب المعطيات ثم خطوات الحل والنتيجة وتحققًا سريعًا. عرّف المصطلحات الصعبة حسب صف الطالب. في المتابعة اقرأ الحوار السابق وأجب عن آخر نقطة فقط مع مراجعة الصورة المرفقة، دون تكرار الشرح كله. استخدم العربية الواضحة ولا تخترع حقائق، وقل إذا نقص سياق السؤال. لا تطلب بيانات شخصية.";
  const userContent:any[]=[{type:"input_text",text:"المادة: "+subject+"\nسؤال الطالب أو الدرس:\n"+question}];
  if(image)userContent.push({type:"input_image",image_url:image});
  const input=[...history.map((item:any)=>({role:item.role,content:item.content})),{role:"user",content:userContent}];
  const result=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-6-luna",instructions,input,max_output_tokens:900})});
  const data=await result.json().catch(()=>({}));if(!result.ok)return reply(502,{error:"تعذر الحصول على شرح الآن. حاول بعد قليل."});
  const answer=String(data.output_text||((data.output||[]).flatMap((x:any)=>x.content||[]).find((x:any)=>x.type==="output_text")?.text)||"").slice(0,9000);
  return answer?reply(200,{answer}):reply(502,{error:"لم يصل شرح واضح. جرّب صياغة أخرى."});
 }catch(_){return reply(500,{error:"حدث خطأ غير متوقع. حاول مرة أخرى."});}
});

