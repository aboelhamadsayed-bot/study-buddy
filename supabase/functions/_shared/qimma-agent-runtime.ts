import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json; charset=utf-8"};
const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:cors});
const grades=new Set(["primary1","primary2","primary3","primary4","primary5","primary6","prep1","prep2","prep3","secondary1","secondary2","secondary3","university"]);
const roles:Record<string,{name:string;instructions:string}>={
 "smart-teacher":{name:"المعلم الذكي",instructions:"اشرح الدرس للطالب خطوة بخطوة حسب صفه. ابدأ بالفكرة ببساطة، ثم المفاهيم، مثال محلول، وأخطاء شائعة، واختتم بسؤال تحقق واحد. لا تختصر الشرح إلى إجابة فقط."},
 "lesson-summarizer":{name:"ملخص الدروس",instructions:"حوّل الدرس الذي يرسله الطالب إلى ملخص منظم: الفكرة الأساسية، نقاط رئيسية، مصطلحات وتعريفات، وقائمة مراجعة قصيرة. لا تضف معلومات غير موجودة في النص إذا كان يلخص مادة مرفقة."},
 "exam-builder":{name:"منشئ الامتحانات",instructions:"ساعد في إعداد أسئلة تدريبية أصلية من الدرس، متنوعة بين فهم وتطبيق. إذا طلب الطالب امتحانًا محفوظًا بدرجة ونقاط، وجّهه لاستخدام منشئ الامتحان المخصص في صفحة الامتحانات؛ لا تدّعِ أنك حفظت امتحانًا أو نتيجة."},
 "study-planner":{name:"مخطط المذاكرة",instructions:"أنشئ خطة مذاكرة عملية حسب المواد والوقت والمواعيد التي يذكرها الطالب. قسّم المهام إلى جلسات قصيرة مع استراحات ومراجعة واسترجاع نشط. لا تفترض مواعيد أو وقتًا متاحًا لم يذكره."},
 "problem-solver":{name:"حلّال المسائل",instructions:"حل المسائل بدقة: اكتب المعطيات، المطلوب، القانون أو الفكرة، خطوات الحل، النتيجة بوحداتها، ثم تحققًا سريعًا. إذا نقصت بيانات أو صورة غير واضحة، اطلب التوضيح بدل التخمين."},
 "language-coach":{name:"مدرب اللغات",instructions:"درّب الطالب في العربية أو الإنجليزية حسب طلبه ومستواه. صحح الأخطاء بلطف، اشرح السبب، قدم مثالًا صحيحًا، ثم تمرينًا قصيرًا. لا ترفع مستوى اللغة فوق مستوى الطالب دون شرح."},
 "learning-researcher":{name:"باحث المصادر التعليمية",instructions:"ساعد الطالب في تحديد ما يحتاجه من مصادر تعليمية، وميّز بين ما تعرفه وما يحتاج تحققًا حديثًا. لا تخترع روابط أو أسماء مدرسين أو مراجع. اقترح كلمات بحث دقيقة وخطة للتحقق من المصدر."},
 "academic-mentor":{name:"المرشد الأكاديمي",instructions:"ساعد الطالب على تحليل تقدمه وأهدافه من البيانات التي يذكرها فقط. حدد نقاط القوة والفجوات وخطوة عملية تالية، وشجّع الاستمرارية دون لوم أو وعود بنتائج مضمونة."}
};
export async function handleAgent(req:Request,agentId:string){
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply(405,{error:"Method not allowed"});
 const role=roles[agentId];if(!role)return reply(404,{error:"المساعد غير متاح."});
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),apiKey=Deno.env.get("GEMINI_API_KEY");
 const auth=req.headers.get("Authorization")||"",token=auth.startsWith("Bearer ")?auth.slice(7):"";
 if(!url||!anon||!service||!token)return reply(401,{error:"سجّل الدخول أولًا."});
 if(!apiKey)return reply(503,{error:"مفتاح Gemini غير مضبوط على الخادم."});
 try{
  const who=await fetch(url+"/auth/v1/user",{headers:{apikey:anon,Authorization:"Bearer "+token}});
  if(!who.ok)return reply(401,{error:"انتهت جلسة الدخول. سجّل الدخول مرة أخرى."});
  const user=await who.json(),userId=String(user.id||"");if(!userId)return reply(401,{error:"تعذر التحقق من حساب الطالب."});
  const raw=await req.text();if(raw.length>18000)return reply(413,{error:"الطلب كبير جدًا."});
  const body=JSON.parse(raw),question=String(body.question||"").trim(),subject=String(body.subject||"عام").trim(),history=body.history;
  if(question.length<2||question.length>1800||subject.length>80)return reply(400,{error:"اكتب سؤالًا واضحًا ومادة صحيحة."});
  const validHistory=Array.isArray(history)&&history.length<=6&&history.every((item:any)=>(item.role==="user"||item.role==="assistant")&&typeof item.content==="string"&&item.content.length<=2200);
  if(history!==undefined&&!validHistory)return reply(400,{error:"سجل المحادثة غير صالح. ابدأ محادثة جديدة."});
  const profileRes=await fetch(url+"/rest/v1/student_profiles?user_id=eq."+encodeURIComponent(userId)+"&select=school_grade",{headers:{apikey:service,Authorization:"Bearer "+service}});
  const profiles=profileRes.ok?await profileRes.json():[],grade=String(profiles?.[0]?.school_grade||user.user_metadata?.school_grade||"");
  const gradeContext=grades.has(grade)?grade:"غير محدد";
  const usage=await fetch(url+"/rest/v1/rpc/consume_tutor_request",{method:"POST",headers:{apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"},body:JSON.stringify({p_user_id:userId,p_limit:20})});
  if(!usage.ok)return reply(503,{error:"تعذر التحقق من حد الاستخدام."});
  if(await usage.json()!==true)return reply(429,{error:"وصلت للحد اليومي للمساعدين الذكيين. حاول غدًا."});
  const system="أنت "+role.name+" ضمن منصة قِمّة التعليمية المصرية. الدور المتخصص: "+role.instructions+" صف الطالب: "+gradeContext+". المادة: "+subject+". استخدم العربية الواضحة ما لم يطلب الطالب لغة أخرى. كن دقيقًا، لا تخترع معلومات أو مصادر، وصرّح عند نقص السياق. لا تطلب بيانات شخصية أو كلمات مرور.";
  const contents=[...(validHistory?history:[]).map((item:any)=>({role:item.role==="assistant"?"model":"user",parts:[{text:String(item.content||"")}]})),{role:"user",parts:[{text:question}]}];
  const model=Deno.env.get("GEMINI_MODEL")||"gemini-3.5-flash-lite";
  const result=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent?key="+encodeURIComponent(apiKey),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents,generationConfig:{temperature:0.25,maxOutputTokens:2200}})});
  const data=await result.json().catch(()=>({}));
  if(!result.ok){console.error("Qimma agent provider error",agentId,result.status);return reply(502,{error:"المساعد مشغول حاليًا. حاول بعد قليل."});}
  const answer=String((data.candidates?.[0]?.content?.parts||[]).filter((p:any)=>typeof p.text==="string").map((p:any)=>p.text).join("\n")||"").slice(0,10000);
  return answer?reply(200,{answer,agent:agentId}):reply(502,{error:"لم يصل رد واضح من المساعد."});
 }catch(_){return reply(500,{error:"حدث خطأ غير متوقع. حاول مرة أخرى."});}
}
