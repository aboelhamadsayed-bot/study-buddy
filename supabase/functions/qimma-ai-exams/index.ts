import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json; charset=utf-8"};
const reply=(status:number,body:Record<string,unknown>)=>new Response(JSON.stringify(body),{status,headers:cors});
const validGrades=new Set(["primary1","primary2","primary3","primary4","primary5","primary6","prep1","prep2","prep3","secondary1","secondary2","secondary3","university"]);
const subjects:Record<string,string>={math:"الرياضيات",science:"العلوم",arabic:"اللغة العربية",english:"اللغة الإنجليزية"};
const gradeNames:Record<string,string>={primary1:"الأول الابتدائي",primary2:"الثاني الابتدائي",primary3:"الثالث الابتدائي",primary4:"الرابع الابتدائي",primary5:"الخامس الابتدائي",primary6:"السادس الابتدائي",prep1:"الأول الإعدادي",prep2:"الثاني الإعدادي",prep3:"الثالث الإعدادي",secondary1:"الأول الثانوي",secondary2:"الثاني الثانوي",secondary3:"الثالث الثانوي",university:"جامعي"};
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return reply(405,{error:"Method not allowed"});
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),apiKey=Deno.env.get("GEMINI_API_KEY");
 const auth=req.headers.get("Authorization")||"",token=auth.startsWith("Bearer ")?auth.slice(7):"";
 if(!url||!anon||!service||!token)return reply(401,{error:"سجّل الدخول أولًا."});
 try{
  const who=await fetch(url+"/auth/v1/user",{headers:{apikey:anon,Authorization:"Bearer "+token}});
  if(!who.ok)return reply(401,{error:"انتهت جلسة الدخول. سجّل الدخول مرة أخرى."});
  const user=await who.json(),userId=String(user.id||"");if(!userId)return reply(401,{error:"تعذر التحقق من حساب الطالب."});
  const raw=await req.text();if(raw.length>16000)return reply(413,{error:"الطلب كبير جدًا."});
  const body=JSON.parse(raw),action=String(body.action||"");
  if(action==="submit"){
    const examId=String(body.exam_id||""),answers=body.answers;
    if(!/^[0-9a-f-]{36}$/i.test(examId)||!Array.isArray(answers)||answers.length>20)return reply(400,{error:"بيانات تسليم الامتحان غير صحيحة."});
    const saved=await fetch(url+"/rest/v1/rpc/submit_qimma_generated_exam",{method:"POST",headers:{apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"},body:JSON.stringify({p_exam_id:examId,p_user_id:userId,p_answers:answers})});
    const result=await saved.json().catch(()=>null);
    if(!saved.ok)return reply(400,{error:"تعذر تسليم الامتحان. تأكد أنه لم يُسلّم من قبل وأن جميع الإجابات مكتملة."});
    return reply(200,result||{});
  }
  if(action!=="generate")return reply(400,{error:"طلب غير معروف."});
  if(!apiKey)return reply(503,{error:"مفتاح Gemini غير مضبوط على الخادم."});
  const subject=String(body.subject||""),lesson=String(body.lesson||"").trim(),difficulty=String(body.difficulty||"medium"),count=Number(body.question_count||10);
  if(!subjects[subject]||lesson.length<2||lesson.length>160||!Number.isInteger(count)||count<5||count>20||!["easy","medium","hard"].includes(difficulty))return reply(400,{error:"اختار المادة والدرس وعدد الأسئلة ومستوى الصعوبة بشكل صحيح."});
  const profileRes=await fetch(url+"/rest/v1/student_profiles?user_id=eq."+encodeURIComponent(userId)+"&select=school_grade",{headers:{apikey:service,Authorization:"Bearer "+service}});
  if(!profileRes.ok)return reply(503,{error:"تعذر تحميل الصف الدراسي."});
  const profiles=await profileRes.json(),grade=String(profiles?.[0]?.school_grade||user.user_metadata?.school_grade||"");
  if(!validGrades.has(grade))return reply(400,{error:"حدّث صفك الدراسي من إعدادات الحساب أولًا."});
  const usage=await fetch(url+"/rest/v1/rpc/consume_tutor_request",{method:"POST",headers:{apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"},body:JSON.stringify({p_user_id:userId,p_limit:20})});
  if(!usage.ok)return reply(503,{error:"تعذر التحقق من حد الاستخدام."});
  if(await usage.json()!==true)return reply(429,{error:"وصلت للحد اليومي للذكاء الاصطناعي. حاول غدًا."});
  const prompt="أنشئ امتحان اختيار من متعدد باللغة العربية أو الإنجليزية حسب المادة. الصف: "+gradeNames[grade]+". المادة: "+subjects[subject]+". الدرس المحدد: "+lesson+". الصعوبة: "+difficulty+". عدد الأسئلة بالضبط: "+count+". لا تدّعِ مطابقة كتاب أو منهج محدد إن لم تكن متأكدًا؛ ركّز على المفاهيم الصحيحة للدرس. أنشئ أسئلة أصلية غير مكررة، لكل سؤال 4 اختيارات وإجابة صحيحة واحدة مع تفسير مختصر. تجنب الأسئلة الغامضة أو المعلومات خارج الدرس. أخرج JSON فقط بهذا الشكل: {\\"questions\\":[{\\"id\\":\\"q1\\",\\"prompt\\":\\"...\\",\\"options\\":[\\"...\\",\\"...\\",\\"...\\",\\"...\\"],\\"answer\\":0,\\"explanation\\":\\"...\\"}]}. answer رقم من 0 إلى 3.";
  const model=Deno.env.get("GEMINI_MODEL")||"gemini-3.5-flash-lite";
  const generated=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent?key="+encodeURIComponent(apiKey),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{responseMimeType:"application/json",temperature:0.35,maxOutputTokens:7000}})});
  const data=await generated.json().catch(()=>({}));
  if(!generated.ok){console.error("Gemini exam generation failed",generated.status);return reply(502,{error:"تعذر توليد الامتحان الآن. حاول بعد قليل."});}
  let text=String((data.candidates?.[0]?.content?.parts||[]).map((p:any)=>p.text||"").join("")).trim();
  text=text.replace(/^\`\`\`(?:json)?\s*/i,"").replace(/\`\`\`$/,"");
  let parsed:any;try{parsed=JSON.parse(text)}catch{return reply(502,{error:"وصلت صيغة امتحان غير صالحة. حاول مرة أخرى."});}
  const questions=parsed?.questions;
  if(!Array.isArray(questions)||questions.length!==count)return reply(502,{error:"لم يتم إنشاء العدد المطلوب من الأسئلة. حاول مرة أخرى."});
  const ids=new Set<string>();
  for(let i=0;i<questions.length;i++){
    const q=questions[i];
    if(!q||typeof q.prompt!=="string"||q.prompt.trim().length<5||!Array.isArray(q.options)||q.options.length!==4||q.options.some((o:any)=>typeof o!=="string"||!o.trim())||!Number.isInteger(q.answer)||q.answer<0||q.answer>3||typeof q.explanation!=="string"||q.explanation.trim().length<3)return reply(502,{error:"بعض أسئلة الامتحان غير مكتملة. أعد التوليد."});
    q.id="q"+(i+1);if(ids.has(q.id))return reply(502,{error:"تكررت معرفات الأسئلة."});ids.add(q.id);
  }
  const insert=await fetch(url+"/rest/v1/qimma_generated_exams",{method:"POST",headers:{apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({user_id:userId,grade,subject,lesson,difficulty,question_count:count,questions})});
  const rows=await insert.json().catch(()=>null);
  if(!insert.ok||!Array.isArray(rows)||!rows[0]?.id){console.error("Generated exam storage failed",insert.status);return reply(503,{error:"تم إنشاء الأسئلة لكن تعذر حفظ الامتحان بأمان. حاول مرة أخرى."});}
  const safeQuestions=questions.map((q:any)=>({id:q.id,prompt:q.prompt,options:q.options}));
  return reply(200,{exam_id:rows[0].id,title:"امتحان ذكاء اصطناعي — "+subjects[subject],subject,question_count:count,questions:safeQuestions});
 }catch(_){return reply(500,{error:"حدث خطأ غير متوقع. حاول مرة أخرى."});}
});
