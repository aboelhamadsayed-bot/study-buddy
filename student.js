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
    for(const row of data){const article=document.createElement("article");article.className="community-post";const head=document.createElement("header"),name=document.createElement("strong"),time=document.createElement("time"),body=document.createElement("p"),actions=document.createElement("div"),explain=document.createElement("button");name.textContent=row.display_name;const date=new Date(row.created_at);time.dateTime=date.toISOString();time.textContent=new Intl.DateTimeFormat("ar-EG",{dateStyle:"medium"}).format(date);body.textContent=row.body;head.append(name,time);actions.className="community-post-actions";explain.type="button";explain.className="community-explain-button";explain.textContent="✦ اشرح السؤال بالأستاذ الذكي";explain.setAttribute("aria-label","اطلب شرح هذه المشاركة من الأستاذ الذكي");explain.addEventListener("click",()=>{try{sessionStorage.setItem("qimmaTutorDraft",JSON.stringify({question:String(row.body||"").slice(0,450),subject:"سؤال من مجتمع الطلاب",mode:"explain"}));window.location.href="tutor.html?from=community";}catch{say("community-status","تعذر تجهيز السؤال. انسخه وافتح الأستاذ الذكي يدويًا.",true);}});actions.append(explain);article.append(head,body,actions);feed.append(article);}
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
    if(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|https?:\/\/|www\.|(?:\+?\d[\s()-]*){8,}/i.test(body))return say("community-status","احذف البريد أو رقم الهاتف أو الرابط من المشاركة لحماية خصوصيتك.",true);
    button.disabled=true;
    const {error}=await db.from("student_posts").insert({author_id:user.id,age_group:profile.age_group,display_name:displayName.slice(0,40),body:body.slice(0,450)});
    button.disabled=false;if(error)return say("community-status","لم تُنشر المشاركة. لا تكتب بريدًا أو رقم هاتف أو رابطًا، ثم جرّب مرة أخرى.",true);
    $("community-post").value="";say("community-status","وصلت مشاركتك إلى مجموعتك الدراسية.");await loadCommunity();
  });
  const gradeData={prep:[["p1","أولى إعدادي"],["p2","تانية إعدادي"],["p3","تالتة إعدادي"]],secondary:[["s1","أولى ثانوي"],["s2","تانية ثانوي"],["s3","تالتة ثانوي"]]};
  const prepSubjects=["اللغة العربية","اللغة الإنجليزية","الرياضيات","العلوم","الدراسات الاجتماعية","تكنولوجيا المعلومات"];
  const generalSubjects=["اللغة العربية","اللغة الإنجليزية","الرياضيات","الفيزياء","الكيمياء","الأحياء","التاريخ","الجغرافيا","الفلسفة","اللغة الأجنبية الثانية","البرمجة والذكاء الاصطناعي"];
  const bacCommon=["اللغة العربية","اللغة الأجنبية الأولى","التاريخ المصري"];
  const bacTracks={medicine:["الرياضيات","الفيزياء"],engineering:["الكيمياء","البرمجة والذكاء الاصطناعي"],business:["المحاسبة","إدارة الأعمال"],arts:["علم النفس","اللغة الأجنبية الثانية"]};
  const stageSelect=$("video-stage"),gradeSelect=$("video-grade"),systemSelect=$("video-system"),pathSelect=$("video-path"),subjectSelect=$("video-subject");
  function setVideoOptions(select,values){select.replaceChildren(...values.map(([value,label])=>{const o=document.createElement("option");o.value=value;o.textContent=label;return o;}));}
  function refreshVideoFinder(){const stage=stageSelect.value,grade=gradeSelect.value,system=systemSelect.value,path=pathSelect.value,secondSecondary=stage==="secondary"&&grade==="s2",isBac2=secondSecondary&&system==="bac";$("video-system-wrap").classList.toggle("hidden",!secondSecondary);$("video-path-wrap").classList.toggle("hidden",!isBac2);const subjects=stage==="prep"?prepSubjects:(isBac2?[...bacCommon,...(bacTracks[path]||[])]:generalSubjects);setVideoOptions(subjectSelect,subjects.map(s=>[s,s]));}
  function refreshGrades(){setVideoOptions(gradeSelect,gradeData[stageSelect.value]);refreshVideoFinder();}
  stageSelect.addEventListener("change",refreshGrades);gradeSelect.addEventListener("change",refreshVideoFinder);systemSelect.addEventListener("change",refreshVideoFinder);pathSelect.addEventListener("change",refreshVideoFinder);refreshGrades();
  $("video-finder").addEventListener("submit",e=>{e.preventDefault();const stage=stageSelect.value,grade=gradeSelect.value,gradeLabel=gradeSelect.selectedOptions[0]?.textContent||"",system=systemSelect.value,path=pathSelect.selectedOptions[0]?.textContent||"",subject=subjectSelect.value,secondSecondary=stage==="secondary"&&grade==="s2",systemLabel=system==="bac"?"البكالوريا المصرية":"الثانوية العامة";const search=[subject,gradeLabel,secondSecondary?systemLabel:"",secondSecondary&&system==="bac"?path:"","شرح منهج مصر"].filter(Boolean).join(" ");$("video-results-title").textContent="فيديوهات "+subject+" · "+gradeLabel+(secondSecondary?" · "+systemLabel:"");$("video-youtube").href="https://www.youtube.com/results?search_query="+encodeURIComponent(search);$("video-bac-books").classList.toggle("hidden",!(secondSecondary&&system==="bac"));$("video-results").hidden=false;});
  const tutorGradeNames={primary1:"الصف الأول الابتدائي",primary2:"الصف الثاني الابتدائي",primary3:"الصف الثالث الابتدائي",primary4:"الصف الرابع الابتدائي",primary5:"الصف الخامس الابتدائي",primary6:"الصف السادس الابتدائي",prep1:"الصف الأول الإعدادي",prep2:"الصف الثاني الإعدادي",prep3:"الصف الثالث الإعدادي",secondary1:"الصف الأول الثانوي",secondary2:"الصف الثاني الثانوي",secondary3:"الصف الثالث الثانوي"};
  let tutorHistory=[];
  $("tutor-grade").addEventListener("change",refreshTutorTrack);
  $("tutor-system").addEventListener("change",refreshTutorTrack);
  function refreshTutorTrack(){const grade=$("tutor-grade").value,isSecond=grade==="secondary2";$("tutor-system-wrap").classList.toggle("hidden",!isSecond);$("tutor-track-wrap").classList.toggle("hidden",!isSecond||$("tutor-system").value!=="bac");}
  refreshTutorTrack();
  function addTutorMessage(role,text){const message=document.createElement("div");message.className="tutor-message "+role;const label=document.createElement("strong");label.textContent=role==="teacher"?"الأستاذ":"أنت";const content=document.createElement("span");content.textContent=text;message.append(label,content);$("tutor-answer").append(message);}
  async function askTutor(question,mode,button){
    if(!db||!user||!session)return say("tutor-status","سجّل الدخول بحسابك عشان تستخدم المساعد.",true);
    if(!profile?.age_group)return say("tutor-status","حدد تاريخ ميلادك أولًا عشان نضبط الشرح على مرحلتك.",true);
    const subject=$("tutor-subject").value.trim(),grade=$("tutor-grade").value,system=grade==="secondary2"?$("tutor-system").value:"",track=grade==="secondary2"&&system==="bac"?$("tutor-track").value:"";
    if(!subject||!question.trim())return say("tutor-status","اكتب المادة والسؤال أو المسألة.",true);
    const answer=$("tutor-answer");button.disabled=true;say("tutor-status","الأستاذ بيقرأ سؤالك وبيجهز الحل المناسب لصفك…");
    try{
      const response=await fetch(URL+"/functions/v1/qimma-tutor",{method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+session.access_token,"Content-Type":"application/json"},body:JSON.stringify({age_group:profile.age_group,grade,system,track,mode,subject,question:question.trim(),history:tutorHistory.slice(-6)})});
      const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"تعذر تشغيل المساعد حاليًا.");
      if(roleNeedsQuestionBubble(mode,answer)){addTutorMessage("student",question.trim());}
      addTutorMessage("teacher",data.answer||"لم يصل شرح. جرّب إعادة صياغة السؤال.");
      tutorHistory.push({role:"user",content:question.trim()},{role:"assistant",content:String(data.answer||"")});tutorHistory=tutorHistory.slice(-6);
      answer.hidden=false;$("tutor-followup").classList.remove("hidden");$("tutor-followup-question").value="";
      say("tutor-status","اتفضل يا بطل — لو حاجة مش واضحة، كمل سؤالك والأستاذ هيوضحها.");
      const link=$("tutor-video-search");link.href="https://www.youtube.com/results?search_query="+encodeURIComponent(subject+" "+question.slice(0,100)+" شرح عربي");link.hidden=false;
      answer.lastElementChild?.scrollIntoView({behavior:"smooth",block:"nearest"});
    }catch(error){const msg=error.message==="OPENAI_API_KEY is missing"?"المساعد جاهز، وباقي إضافة مفتاح OpenAI في إعدادات Supabase. لا تضع المفتاح في الموقع.":error.message;say("tutor-status",msg||"حصلت مشكلة اتصال. حاول مرة أخرى.",true);}
    finally{button.disabled=false;}
  }
  function roleNeedsQuestionBubble(_mode,_answer){return true;}
  $("tutor-form").addEventListener("submit",e=>{e.preventDefault();tutorHistory=[];$("tutor-answer").replaceChildren();$("tutor-answer").hidden=false;$("tutor-followup").classList.add("hidden");askTutor($("tutor-question").value,$("tutor-mode").value,$("tutor-submit"));});
  $("tutor-followup").addEventListener("submit",e=>{e.preventDefault();const q=$("tutor-followup-question").value;askTutor(q,"explain",e.submitter||$("tutor-followup").querySelector("button"));});
  db?.auth.onAuthStateChange((_event,next)=>{session=next;user=next?.user||null;setTimeout(()=>ensureProfile().catch(()=>say("community-status","تعذر تحميل بيانات حسابك الآن.",true)),0);});
  ensureProfile().catch(()=>say("community-status","تعذر تحميل الملف الدراسي الآن.",true));
  const moreMenu=$("more-menu"),moreButton=$("moreTab");
  function closeMoreMenu(){if(!moreMenu)return;if(typeof moreMenu.close==="function"&&moreMenu.open)moreMenu.close();else moreMenu.removeAttribute("open");}
  function openMoreMenu(){if(typeof moreMenu?.showModal==="function"){if(!moreMenu.open)moreMenu.showModal();}else moreMenu?.setAttribute("open","");}
  moreButton?.addEventListener("click",openMoreMenu);
  $("menuToggle")?.addEventListener("click",openMoreMenu);
  $("searchToggle")?.addEventListener("click",()=>{const section=$("learning-videos");section?.scrollIntoView({behavior:"smooth",block:"start"});setTimeout(()=>$("video-stage")?.focus({preventScroll:true}),450);});
  moreMenu?.querySelector("[data-close-more]")?.addEventListener("click",closeMoreMenu);
  moreMenu?.querySelectorAll("a").forEach(link=>link.addEventListener("click",closeMoreMenu));
  moreMenu?.addEventListener("click",event=>{if(event.target===moreMenu)closeMoreMenu();});
  const scrollTop=$("scrollTop");
  scrollTop?.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
  window.addEventListener("scroll",()=>{if(scrollTop)scrollTop.hidden=window.scrollY<420;},{passive:true});
  const mobileNavLinks=[...document.querySelectorAll(".mobile-tabbar [data-nav-section]")];
  if(mobileNavLinks.length&&"IntersectionObserver" in window){
    const navObserver=new IntersectionObserver(entries=>{
      const active=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!active)return;
      mobileNavLinks.forEach(link=>{if(link.dataset.navSection===active.target.id)link.setAttribute("aria-current","location");else link.removeAttribute("aria-current");});
    },{rootMargin:"-20% 0px -62% 0px",threshold:[0,.1,.25,.5]});
    mobileNavLinks.forEach(link=>{const section=$(link.dataset.navSection);if(section)navObserver.observe(section);});
  }
})();

