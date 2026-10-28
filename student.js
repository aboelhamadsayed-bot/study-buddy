(() => {
  "use strict";
  const URL = "https://asfmnztojcdotxyqfpzd.supabase.co";
  const KEY = "sb_publishable_irqLABJB7q61DtwmEtdtcw_Ujcip94i";
  const $ = id => document.getElementById(id);
  const db = window.supabase?.createClient ? window.supabase.createClient(URL, KEY) : null;
  const groups = {"6-8":"6–8 سنوات","9-11":"9–11 سنة","12-14":"12–14 سنة","15-17":"15–17 سنة","18+":"18 سنة فأكثر"};
  let user=null,profile=null,session=null;
  const say=(id,text,error=false)=>{const e=$(id);if(e){e.textContent=text;e.dataset.kind=error?"error":"success";}};
  const currentGroup=()=>profile?.age_group||localStorage.getItem("qimma-age-group")||"";
  function calcGroup(v){if(!v)return"";const b=new Date(v+"T00:00:00"),n=new Date();if(Number.isNaN(b.getTime())||b>n)return"";let a=n.getFullYear()-b.getFullYear();if(n.getMonth()<b.getMonth()||(n.getMonth()===b.getMonth()&&n.getDate()<b.getDate()))a--;return a<6||a>120?"":a<=8?"6-8":a<=11?"9-11":a<=14?"12-14":a<=17?"15-17":"18+";}
  function renderGroup(){const g=currentGroup();$("student-age-label").textContent=g?"شرح مناسب لـ "+groups[g]:"حدد فئتك العمرية";$("community-group-label").textContent=g?"مجموعة "+groups[g]:"سجّل الدخول";}
  async function loadCommunity(){
    const feed=$("community-feed");
    if(!user||!profile?.age_group){feed.textContent="سجّل الدخول عشان تنضم لمجموعة الطلاب.";return;}
    const {data,error}=await db.from("student_posts").select("id,display_name,body,created_at").order("created_at",{ascending:false}).limit(24);
    if(error){feed.textContent="تعذر تحميل المجموعة الآن. حاول بعد قليل.";return;}
    feed.replaceChildren();
    if(!data?.length){const p=document.createElement("p");p.className="muted";p.textContent="المجموعة لسه جديدة — شارك أول سؤال دراسي مفيد 🌱";feed.append(p);return;}
    for(const row of data){const article=document.createElement("article");article.className="community-post";const head=document.createElement("header"),name=document.createElement("strong"),time=document.createElement("time"),body=document.createElement("p");name.textContent=row.display_name;const date=new Date(row.created_at);time.dateTime=date.toISOString();time.textContent=new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium"}).format(date);body.textContent=row.body;head.append(name,time);article.append(head,body);feed.append(article);}
  }
  async function ensureProfile(){
    if(!db)return;
    const {data:{session:s}}=await db.auth.getSession();session=s;user=s?.user||null;
    if(!user){renderGroup();$("community-feed").textContent="سجّل الدخول عشان تنضم لمجموعة الطلاب.";return;}
    const {data,error}=await db.from("student_profiles").select("user_id,display_name,age_group").eq("user_id",user.id).maybeSingle();
    if(error)throw error;profile=data;
    if(!profile?.age_group){
      const g=user.user_metadata?.age_group;
      if(["6-8","9-11","12-14","15-17","18+"].includes(g)){
        profile={user_id:user.id,display_name:String(user.user_metadata?.display_name||"طالب").slice(0,40),age_group:g};
        const {error:saveError}=await db.from("student_profiles").insert(profile);if(saveError)throw saveError;
      }else{
        const d=$("profile-dob"),n=new Date();n.setMinutes(n.getMinutes()-n.getTimezoneOffset());d.max=n.toISOString().slice(0,10);
        if(!$("age-onboarding").open)$("age-onboarding").showModal();
      }
    }
    renderGroup();if(profile?.age_group)await loadCommunity();
  }
  $("age-form").addEventListener("submit",async e=>{
    e.preventDefault();const g=calcGroup($("profile-dob").value);
    if(!g)return say("age-status","أدخل تاريخ ميلاد صحيحًا؛ العمر يجب أن يكون 6 سنوات على الأقل.",true);
    if(!user){localStorage.setItem("qimma-age-group",g);$("age-onboarding").close();renderGroup();return;}
    const row={user_id:user.id,display_name:String(user.user_metadata?.display_name||"طالب").slice(0,40),age_group:g};
    const {error}=await db.from("student_profiles").insert(row);
    if(error)return say("age-status","تعذر حفظ فئتك الآن. حاول مرة أخرى.",true);
    profile=row;$("age-onboarding").close();renderGroup();await loadCommunity();say("community-status","اتحدد محتوى مرحلتك بنجاح.");
  });
  $("community-form").addEventListener("submit",async e=>{
    e.preventDefault();if(!user||!profile?.age_group)return say("community-status","سجّل الدخول وأكمل تحديد فئتك العمرية أولًا.",true);
    const button=$("community-submit"),body=$("community-post").value.trim(),displayName=$("community-name").value.trim();
    if(body.length<3||displayName.length<1)return say("community-status","اكتب اسمًا ظاهرًا ومشاركة قصيرة.",true);
    if(/[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}|https?:\\/\\/|www\\.|(?:\\+?\\d[\\s()-]*){8,}/i.test(body))return say("community-status","احذف البريد أو رقم الهاتف أو الرابط من المشاركة لحماية خصوصيتك.",true);
    button.disabled=true;
    const {error}=await db.from("student_posts").insert({author_id:user.id,age_group:profile.age_group,display_name:displayName.slice(0,40),body:body.slice(0,450)});
    button.disabled=false;if(error)return say("community-status","لم تُنشر المشاركة. لا تكتب بريدًا أو رقم هاتف أو رابطًا، ثم جرّب مرة أخرى.",true);
    $("community-post").value="";say("community-status","وصلت مشاركتك إلى مجموعتك الدراسية.");await loadCommunity();
  });
  $("tutor-form").addEventListener("submit",async e=>{
    e.preventDefault();if(!db||!user||!session)return say("tutor-status","سجّل الدخول بحسابك عشان تستخدم المساعد.",true);
    if(!profile?.age_group)return say("tutor-status","حدد تاريخ ميلادك أولًا عشان نضبط الشرح على مرحلتك.",true);
    const question=$("tutor-question").value.trim(),subject=$("tutor-subject").value.trim(),mode=$("tutor-mode").value;
    if(!question||!subject)return say("tutor-status","اكتب المادة والسؤال أو اسم الدرس.",true);
    const button=$("tutor-submit"),answer=$("tutor-answer");button.disabled=true;answer.hidden=true;say("tutor-status","المساعد بيرتب الشرح المناسب لمرحلتك…");
    try{
      const response=await fetch(URL+"/functions/v1/qimma-tutor",{method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},body:JSON.stringify({age_group:profile.age_group,mode,subject,question})});
      const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"تعذر تشغيل المساعد حاليًا.");
      answer.textContent=data.answer||"لم يصل شرح. جرّب إعادة صياغة السؤال.";answer.hidden=false;say("tutor-status","اتفضل شرحك — اسأل تاني لو محتاج تبسيط نقطة.");
      const link=$("tutor-video-search");link.href="https://www.youtube.com/results?search_query="+encodeURIComponent(subject+" "+question.slice(0,100)+" شرح عربي");link.hidden=false;
    }catch(error){const msg=error.message==="OPENAI_API_KEY is missing"?"المساعد جاهز، وباقي إضافة مفتاح OpenAI في إعدادات Supabase. لا تضع المفتاح في الموقع.":error.message;say("tutor-status",msg||"حصلت مشكلة اتصال. حاول مرة أخرى.",true);}
    finally{button.disabled=false;}
  });
  db?.auth.onAuthStateChange((_event,next)=>{session=next;user=next?.user||null;setTimeout(()=>ensureProfile().catch(()=>say("community-status","تعذر تحميل بيانات حسابك الآن.",true)),0);});
  ensureProfile().catch(()=>say("community-status","تعذر تحميل الملف الدراسي الآن.",true));
})();