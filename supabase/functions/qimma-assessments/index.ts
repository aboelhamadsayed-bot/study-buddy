import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};
const respond = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: cors });

type Question = { id: string; prompt: string; options: string[]; answer: number; explanation: string };
type QuizConfig = { subject: string; title: string; pointsPerCorrect: number; bank?: string };
const banks: Record<string, Question[]> = {
  math: [
    {id:"q1",prompt:"ما ناتج 7 × 8؟",options:["54","56","64","48"],answer:1,explanation:"7 × 8 = 56."},
    {id:"q2",prompt:"إذا كان 3س + 2 = 14، فما قيمة س؟",options:["3","5","4","6"],answer:2,explanation:"نطرح 2 ثم نقسم على 3، فتكون س = 4."},
    {id:"q3",prompt:"ما مساحة مستطيل طوله 8 سم وعرضه 3 سم؟",options:["11 سم²","22 سم²","24 سم²","16 سم²"],answer:2,explanation:"المساحة = الطول × العرض = 8 × 3 = 24 سم²."},
    {id:"q4",prompt:"ما ناتج 1/2 + 1/4؟",options:["2/6","3/4","1/4","1"],answer:1,explanation:"نحوّل النصف إلى 2/4، فيكون المجموع 3/4."},
    {id:"q5",prompt:"مجموع زوايا المثلث يساوي؟",options:["90°","180°","270°","360°"],answer:1,explanation:"مجموع الزوايا الداخلية لأي مثلث 180 درجة."}
  ],
  science: [
    {id:"q1",prompt:"ما الصيغة الكيميائية للماء؟",options:["CO₂","O₂","H₂O","NaCl"],answer:2,explanation:"يتكون جزيء الماء من ذرتي هيدروجين وذرة أكسجين."},
    {id:"q2",prompt:"ما وحدة قياس القوة في النظام الدولي؟",options:["الجول","النيوتن","الواط","الأمبير"],answer:1,explanation:"تقاس القوة بوحدة النيوتن."},
    {id:"q3",prompt:"أي جزء من الخلية يحتوي غالبًا على المادة الوراثية؟",options:["النواة","الغشاء","السيتوبلازم","الجدار الخلوي"],answer:0,explanation:"توجد معظم المادة الوراثية في نواة الخلية."},
    {id:"q4",prompt:"ما الغاز الذي تمتصه النباتات في البناء الضوئي؟",options:["الأكسجين","النيتروجين","ثاني أكسيد الكربون","الهيدروجين"],answer:2,explanation:"تمتص النباتات ثاني أكسيد الكربون وتستخدمه في البناء الضوئي."},
    {id:"q5",prompt:"أي حالة من حالات المادة لها حجم وشكل ثابتان؟",options:["الغازية","السائلة","البلازما","الصلبة"],answer:3,explanation:"المادة الصلبة لها شكل وحجم ثابتان."}
  ],
  physics: [
    {id:"q1",prompt:"إذا أثرت قوة محصلة مقدارها 10 نيوتن على جسم كتلته 2 كجم، فما عجلته؟",options:["2 م/ث²","5 م/ث²","10 م/ث²","20 م/ث²"],answer:1,explanation:"من قانون نيوتن الثاني: العجلة = القوة ÷ الكتلة = 10 ÷ 2 = 5 م/ث²."},
    {id:"q2",prompt:"ما وحدة قياس الشغل في النظام الدولي؟",options:["النيوتن","الجول","الواط","الأمبير"],answer:1,explanation:"يقاس الشغل والطاقة بوحدة الجول."},
    {id:"q3",prompt:"إذا قطع جسم 100 متر في 20 ثانية، فما سرعته المتوسطة؟",options:["2 م/ث","4 م/ث","5 م/ث","10 م/ث"],answer:2,explanation:"السرعة المتوسطة = المسافة ÷ الزمن = 100 ÷ 20 = 5 م/ث."},
    {id:"q4",prompt:"ما العلاقة الصحيحة لقانون أوم؟",options:["V = I × R","I = V × R","R = V × I","V = I ÷ R"],answer:0,explanation:"قانون أوم: فرق الجهد يساوي شدة التيار مضروبة في المقاومة."},
    {id:"q5",prompt:"ما نوع الطاقة التي يمتلكها جسم بسبب حركته؟",options:["طاقة وضع","طاقة حرارية فقط","طاقة حركية","طاقة كيميائية"],answer:2,explanation:"الطاقة الحركية هي الطاقة الناتجة عن حركة الجسم."}
  ],
  chemistry: [
    {id:"q1",prompt:"ما الرمز الكيميائي لعنصر الصوديوم؟",options:["S","So","Na","N"],answer:2,explanation:"الرمز الكيميائي للصوديوم هو Na."},
    {id:"q2",prompt:"ما العدد الذري لذرة الكربون؟",options:["4","6","8","12"],answer:1,explanation:"العدد الذري للكربون يساوي 6، أي يحتوي على 6 بروتونات."},
    {id:"q3",prompt:"أي قيمة pH تدل غالبًا على محلول حمضي؟",options:["2","7","9","12"],answer:0,explanation:"المحلول الحمضي تكون قيمة pH له أقل من 7."},
    {id:"q4",prompt:"ما الغاز الناتج غالبًا من تفاعل حمض مع كربونات؟",options:["الأكسجين","الهيدروجين","ثاني أكسيد الكربون","النيتروجين"],answer:2,explanation:"ينتج ثاني أكسيد الكربون عند تفاعل الحمض مع الكربونات."},
    {id:"q5",prompt:"أي نوع من الروابط ينتج عن مشاركة الذرات في أزواج من الإلكترونات؟",options:["أيونية","تساهمية","فلزية فقط","هيدروجينية"],answer:1,explanation:"الرابطة التساهمية تنشأ من مشاركة الذرات في إلكترونات التكافؤ."}
  ],
  arabic: [
    {id:"q1",prompt:"في جملة «قرأ الطالبُ الدرسَ»، ما إعراب كلمة «الدرسَ»؟",options:["فاعل","مفعول به","مبتدأ","خبر"],answer:1,explanation:"الدرسَ مفعول به منصوب؛ لأنه وقع عليه فعل القراءة."},
    {id:"q2",prompt:"أي الكلمات الآتية فعل ماضٍ؟",options:["يكتب","اكتب","كتب","كاتب"],answer:2,explanation:"«كتب» فعل ماضٍ يدل على حدث وقع وانتهى."},
    {id:"q3",prompt:"ما جمع كلمة «كتاب»؟",options:["كاتبون","كتابات فقط","كتب","مكتبة"],answer:2,explanation:"جمع كتاب هو كتب."},
    {id:"q4",prompt:"أي أداة من الآتية تُعد حرف جر؟",options:["لن","في","لم","هل"],answer:1,explanation:"«في» حرف جر، والاسم بعدها يكون مجرورًا."},
    {id:"q5",prompt:"ما نوع الأسلوب في «لا تهمل واجبك»؟",options:["استفهام","تعجب","نهي","نداء"],answer:2,explanation:"هذا أسلوب نهي باستخدام لا الناهية."}
  ],
  english: [
    {id:"q1",prompt:"Choose the correct past form of “go”.",options:["goed","went","gone","going"],answer:1,explanation:"The past simple of go is went."},
    {id:"q2",prompt:"Choose the correct sentence.",options:["She play tennis.","She plays tennis.","She playing tennis.","She played tennis every day now."],answer:1,explanation:"With he, she, or it in the present simple, add -s to the verb."},
    {id:"q3",prompt:"What is the plural of “child”?",options:["childs","childes","children","childrens"],answer:2,explanation:"The irregular plural of child is children."},
    {id:"q4",prompt:"Complete: I have lived here ___ 2020.",options:["for","since","at","during"],answer:1,explanation:"Use since with a starting point in time."},
    {id:"q5",prompt:"Choose the opposite of “difficult”.",options:["hard","easy","heavy","late"],answer:1,explanation:"Easy is the opposite of difficult."}
  ]
};
const quizzes: Record<string, QuizConfig> = {
  "exam-math":{subject:"math",title:"اختبار الرياضيات",pointsPerCorrect:10},
  "exam-science":{subject:"science",title:"اختبار العلوم",pointsPerCorrect:10},
  "exam-arabic":{subject:"arabic",title:"اختبار اللغة العربية",pointsPerCorrect:10},
  "exam-english":{subject:"english",title:"اختبار اللغة الإنجليزية",pointsPerCorrect:10},
  "challenge-math":{subject:"math",title:"تحدي الرياضيات",pointsPerCorrect:24},
  "challenge-physics":{subject:"science",bank:"physics",title:"تحدي الفيزياء",pointsPerCorrect:20},
  "challenge-english":{subject:"english",title:"تحدي اللغة الإنجليزية",pointsPerCorrect:30},
  "challenge-chemistry":{subject:"science",bank:"chemistry",title:"تحدي الكيمياء",pointsPerCorrect:22},
  "challenge-daily":{subject:"math",title:"تحدي المراجعة اليومية",pointsPerCorrect:16},
  "challenge-vocabulary":{subject:"english",title:"تحدي الكلمات الجديدة",pointsPerCorrect:18}
};
const validGrades = new Set(["primary1","primary2","primary3","primary4","primary5","primary6","prep1","prep2","prep3","secondary1","secondary2","secondary3","university"]);
function stageFor(grade:string) {
  if (grade.startsWith("primary")) return "primary";
  if (grade.startsWith("prep")) return "prep";
  if (grade.startsWith("secondary")) return "secondary";
  if (grade === "university") return "university";
  return "";
}
Deno.serve(async (req:Request) => {
  if (req.method === "OPTIONS") return new Response("ok",{headers:cors});
  if (req.method !== "POST") return respond(405,{error:"Method not allowed"});
  const url=Deno.env.get("SUPABASE_URL"), anon=Deno.env.get("SUPABASE_ANON_KEY"), service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const auth=req.headers.get("Authorization")||"", token=auth.startsWith("Bearer ")?auth.slice(7):"";
  if(!url||!anon||!service||!token) return respond(401,{error:"سجّل الدخول أولًا."});
  try {
    const who=await fetch(url+"/auth/v1/user",{headers:{apikey:anon,Authorization:"Bearer "+token}});
    if(!who.ok) return respond(401,{error:"انتهت جلسة الدخول. سجّل الدخول مرة أخرى."});
    const user=await who.json(), userId=String(user.id||"");
    if(!userId) return respond(401,{error:"تعذر التحقق من حساب الطالب."});
    const raw=await req.text();
    if(raw.length>12000) return respond(413,{error:"الطلب كبير جدًا."});
    const body=JSON.parse(raw), action=String(body.action||""), quizId=String(body.quiz_id||"");
    const quiz=quizzes[quizId];
    if(!quiz) return respond(400,{error:"الاختبار غير متاح."});
    if(action==="get_quiz") {
      return respond(200,{quiz_id:quizId,title:quiz.title,subject:quiz.subject,questions:banks[quiz.bank||quiz.subject].map(({id,prompt,options})=>({id,prompt,options}))});
    }
    if(action!=="submit_quiz") return respond(400,{error:"طلب غير معروف."});
    const questions=banks[quiz.bank||quiz.subject];
    const answers=body.answers;
    if(!Array.isArray(answers)||answers.length!==questions.length) return respond(400,{error:"أجب عن جميع أسئلة الاختبار قبل التسليم."});
    const answerMap=new Map<string,number>();
    for(const item of answers) {
      if(!item||typeof item.id!=="string"||!Number.isInteger(item.choice)||item.choice<0||item.choice>3||answerMap.has(item.id)) return respond(400,{error:"راجع إجاباتك وحاول مرة أخرى."});
      answerMap.set(item.id,item.choice);
    }
    if(questions.some(q=>!answerMap.has(q.id))||answerMap.size!==questions.length) return respond(400,{error:"إجابات الاختبار غير مكتملة."});
    const correct=questions.filter(q=>answerMap.get(q.id)===q.answer).length;
    const profileRes=await fetch(url+"/rest/v1/student_profiles?user_id=eq."+encodeURIComponent(userId)+"&select=school_grade",{headers:{apikey:service,Authorization:"Bearer "+service}});
    if(!profileRes.ok) return respond(503,{error:"تعذر تحميل الصف الدراسي لحفظ النتيجة."});
    const profiles=await profileRes.json(), grade=String(profiles?.[0]?.school_grade||user.user_metadata?.school_grade||"");
    if(!validGrades.has(grade)) return respond(400,{error:"حدّث صفك الدراسي من إعدادات الحساب قبل حفظ النتيجة."});
    const stage=stageFor(grade);
    const points=correct*quiz.pointsPerCorrect;
    const saved=await fetch(url+"/rest/v1/rpc/record_qimma_assessment",{method:"POST",headers:{apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"},body:JSON.stringify({p_user_id:userId,p_stage:stage,p_grade:grade,p_subject:quiz.subject,p_score:correct*10,p_correct_count:correct,p_question_count:questions.length,p_points:points})});
    const result=await saved.json().catch(()=>null);
    if(!saved.ok){if(String(result?.message||"").includes("Daily assessment limit"))return respond(429,{error:"وصلت للحد اليومي للاختبارات (20 محاولة). ارجع بكرة وكمّل تدريبك."});return respond(503,{error:"تعذر حفظ نتيجتك الآن. لم نحتسب نقاطًا؛ حاول مرة أخرى."});}
    return respond(200,{score:Math.round(correct*100/questions.length),correct_count:correct,question_count:questions.length,points_awarded:points,total_points:Number(result?.points||0),completed_count:Number(result?.completed_count||0),review:questions.map(q=>({id:q.id,correct_choice:q.answer,explanation:q.explanation}))});
  } catch (_) {
    return respond(500,{error:"حدث خطأ غير متوقع. حاول مرة أخرى."});
  }
});
