(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const STORE = "qimmaChallengePointsV1";
  const subjectNames = { math: "رياضيات", science: "علوم", arabic: "لغة عربية", english: "إنجليزي" };
  const bank = {
    prep: {
      math: [
        ["ما ناتج ٧ × ٨؟", ["٥٤", "٥٦", "٦٤", "٤٨"], 1, "٧ مجموعات، في كل مجموعة ٨؛ الناتج ٥٦."],
        ["إذا كان س + ٩ = ١٧، فما قيمة س؟", ["٦", "٧", "٨", "٩"], 2, "نطرح ٩ من الطرفين، فيكون س = ٨."],
        ["كم يساوي ٢٥٪ من ٨٠؟", ["١٠", "١٥", "٢٠", "٢٥"], 2, "٢٥٪ تعني الربع، وربع ٨٠ يساوي ٢٠."],
        ["محيط مربع طول ضلعه ٥ سم يساوي؟", ["١٠ سم", "١٥ سم", "٢٠ سم", "٢٥ سم"], 2, "محيط المربع = ٤ × طول الضلع = ٢٠ سم."],
        ["ما ناتج ٣² + ٤؟", ["١٠", "١٣", "١٧", "٢٥"], 1, "٣² = ٩، ثم ٩ + ٤ = ١٣."],
        ["كسر مكافئ لـ ١/٢ هو؟", ["٢/٣", "٢/٤", "٣/٥", "١/٤"], 1, "نضرب البسط والمقام في ٢، فنحصل على ٢/٤."]
      ],
      science: [
        ["ما الغاز الذي تمتصه النباتات في عملية البناء الضوئي؟", ["الأكسجين", "النيتروجين", "ثاني أكسيد الكربون", "الهيدروجين"], 2, "تمتص النباتات ثاني أكسيد الكربون وتستخدمه مع الماء والضوء لتكوين الغذاء."],
        ["ما وحدة قياس القوة؟", ["الجول", "النيوتن", "الواط", "المتر"], 1, "تقاس القوة بوحدة النيوتن."],
        ["أي جزء من الخلية يحتوي على المادة الوراثية؟", ["النواة", "الغشاء", "السيتوبلازم", "الجدار"], 0, "توجد المادة الوراثية في نواة الخلية."],
        ["الماء النقي يتجمد عند كم درجة مئوية؟", ["٠", "١٠", "٣٢", "١٠٠"], 0, "يتجمد الماء النقي عند صفر درجة مئوية في الظروف المعتادة."],
        ["أي الكواكب أقرب إلى الشمس؟", ["الأرض", "المريخ", "عطارد", "الزهرة"], 2, "عطارد هو أقرب كواكب المجموعة الشمسية إلى الشمس."],
        ["أي مما يلي مصدر طاقة متجدد؟", ["الفحم", "النفط", "الغاز الطبيعي", "الشمس"], 3, "الطاقة الشمسية مصدر متجدد يتجدد باستمرار."]
      ],
      arabic: [
        ["ما جمع كلمة «مدرسة»؟", ["مدارس", "مدرسون", "مدرسات فقط", "مدارسة"], 0, "جمع مدرسة هو مدارس، وهو جمع تكسير."],
        ["في جملة «الطالب مجتهد»، ما نوع كلمة «مجتهد»؟", ["فعل", "اسم", "حرف", "ضمير"], 1, "مجتهد اسم يصف الطالب، ويعرب خبرًا للمبتدأ."],
        ["أي الكلمات الآتية فعل ماضٍ؟", ["يكتب", "اكتب", "كتب", "كاتب"], 2, "كتب فعل ماضٍ يدل على حدث وقع في الزمن الماضي."],
        ["ما مضاد كلمة «واسع»؟", ["كبير", "ضيق", "طويل", "قريب"], 1, "ضد واسع هو ضيق."],
        ["ما علامة رفع المبتدأ المفرد؟", ["الفتحة", "الكسرة", "الضمة", "السكون"], 2, "الأصل في رفع المبتدأ المفرد أن تكون علامته الضمة."],
        ["أي الكلمات همزة قطع؟", ["استخرج", "ابن", "أحمد", "اسم"], 2, "أحمد تبدأ بهمزة قطع تُنطق في أول الكلام ووسطه."]
      ],
      english: [
        ["What is the plural of “child”?", ["childs", "children", "childes", "childrens"], 1, "The irregular plural of child is children."],
        ["Choose the past form of “go”.", ["goed", "goes", "went", "going"], 2, "Go is irregular; its simple past form is went."],
        ["What is the opposite of “early”?", ["soon", "late", "fast", "first"], 1, "The opposite of early is late."],
        ["Choose the correct article: ___ apple", ["a", "an", "thee", "no article"], 1, "Apple begins with a vowel sound, so we use an."],
        ["Which word is an adjective?", ["happily", "happiness", "happy", "happen"], 2, "Happy describes a noun, so it is an adjective."],
        ["Complete: She ___ to school every day.", ["go", "goes", "going", "gone"], 1, "With she in the present simple, the verb takes -s: goes."]
      ]
    },
    secondary: {
      math: [
        ["إذا كان ٢س − ٦ = ١٠، فما قيمة س؟", ["٢", "٦", "٨", "١٦"], 2, "نضيف ٦ للطرفين فنحصل على ٢س = ١٦، ثم نقسم على ٢: س = ٨."],
        ["ما ميل المستقيم ص = ٣س + ٢؟", ["٢", "٣", "٥", "−٣"], 1, "في الصورة ص = م س + ب، الميل هو معامل س، أي ٣."],
        ["إذا كان جا θ = ٣/٥ في مثلث قائم، فما جتا θ للزاوية الحادة المقابلة؟", ["٣/٥", "٤/٥", "٥/٤", "١"], 1, "باستخدام الثلاثية ٣-٤-٥، الضلع المجاور ٤ والوتر ٥؛ جتا θ = ٤/٥."],
        ["ما مشتقة الدالة ق(س)=س²؟", ["س", "٢س", "س²", "٢"], 1, "قاعدة القوة: مشتقة سⁿ هي ن سⁿ⁻¹، لذا مشتقة س² هي ٢س."],
        ["مجموع زوايا أي مثلث يساوي؟", ["٩٠°", "١٨٠°", "٢٧٠°", "٣٦٠°"], 1, "مجموع الزوايا الداخلية للمثلث يساوي ١٨٠ درجة."],
        ["حل المعادلة س² = ٤ هو؟", ["٢ فقط", "−٢ فقط", "±٢", "٤ فقط"], 2, "العددان ٢ و−٢ مربعهما يساوي ٤."]
      ],
      science: [
        ["ما وحدة قياس الشغل في النظام الدولي؟", ["نيوتن", "جول", "واط", "أمبير"], 1, "يقاس الشغل والطاقة بوحدة الجول."],
        ["العدد الذري للعنصر يساوي عدد…", ["النيوترونات", "مستويات الطاقة", "البروتونات", "الروابط"], 2, "العدد الذري هو عدد البروتونات في نواة الذرة."],
        ["في أي عضية يحدث معظم إنتاج الطاقة الخلوية؟", ["الريبوسوم", "الميتوكوندريا", "النواة", "جهاز جولجي"], 1, "الميتوكوندريا هي الموقع الرئيس للتنفس الخلوي وإنتاج ATP."],
        ["إذا تضاعفت كتلة جسم وثبتت سرعته، فإن كمية حركته…", ["تقل للنصف", "تتضاعف", "لا تتغير", "تصبح صفرًا"], 1, "كمية الحركة = الكتلة × السرعة؛ مضاعفة الكتلة تضاعفها."],
        ["ما نوع الرابطة بين أيون موجب وأيون سالب؟", ["تساهمية", "فلزية", "أيونية", "هيدروجينية"], 2, "تجاذب الأيون الموجب والسالب يكون رابطة أيونية."],
        ["أي موجات تحتاج إلى وسط مادي للانتقال؟", ["الضوء", "الراديو", "الصوت", "الأشعة السينية"], 2, "الصوت موجة ميكانيكية ولا ينتقل في الفراغ."]
      ],
      arabic: [
        ["ما نوع الصورة البيانية في «العلم نور»؟", ["تشبيه بليغ", "استعارة مكنية", "كناية", "مجاز مرسل"], 0, "شُبّه العلم بالنور وحُذف وجه الشبه وأداة التشبيه؛ فهو تشبيه بليغ."],
        ["في «إن الطالبين مجتهدان»، ما علامة نصب اسم إن؟", ["الفتحة", "الياء", "الكسرة", "الألف"], 1, "الطالبين مثنى، وعلامة نصبه الياء."],
        ["أي الأفعال مضارع منصوب؟", ["لن يهملَ", "لم يهملْ", "يهملُ", "يهملْ"], 0, "لن أداة نصب، والفعل بعدها يهملَ منصوب بالفتحة."],
        ["ما مصدر الفعل «استخرج»؟", ["خروج", "استخراج", "مخرج", "خارِج"], 1, "مصدر الفعل السداسي استخرج هو استخراج."],
        ["ما الغرض من الاستفهام في «أليس الصبح بقريب؟»؟", ["النفي", "التقرير", "التعجب", "الأمر"], 1, "الاستفهام هنا يطلب الإقرار والتأكيد، وهو استفهام تقريري."],
        ["ما علامة رفع جمع المذكر السالم؟", ["الواو", "الألف", "الياء", "الضمة فقط"], 0, "يرفع جمع المذكر السالم بالواو وينصب ويجر بالياء."]
      ],
      english: [
        ["Choose the correct form: If I ___ time, I will call you.", ["have", "had", "will have", "having"], 0, "In the first conditional, use present simple after if: If I have time…"],
        ["The passive form of “They built the bridge” is…", ["The bridge built them", "The bridge was built", "The bridge is build", "They were built"], 1, "Past simple passive = was/were + past participle: was built."],
        ["Choose the closest meaning of “rapid”.", ["slow", "quick", "careful", "quiet"], 1, "Rapid means fast or quick."],
        ["Complete: She has lived here ___ 2020.", ["for", "since", "during", "from"], 1, "Use since with a specific starting point in time."],
        ["Which sentence uses the present perfect?", ["I saw him yesterday", "I have finished my work", "I am finishing now", "I finish every day"], 1, "Present perfect = have/has + past participle."],
        ["Choose the correct reported speech: He said, “I am tired.”", ["He said he is tired", "He said he was tired", "He says he tired", "He said I was tired"], 1, "In reported speech, present am often shifts back to was."]
      ]
    }
  };
  let questions = [], index = 0, roundPoints = 0, answeredCount = 0, locked = false;
  const readPoints = () => { try { const n = Number(localStorage.getItem(STORE)); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; } catch { return 0; } };
  const showTotal = () => { $("total-points").textContent = new Intl.NumberFormat("ar-EG").format(readPoints()); };
  const fillGrades = () => {
    const secondary = $("challenge-stage").value === "secondary";
    const entries = secondary ? [["s1", "أولى ثانوي"], ["s2", "تانية ثانوي"], ["s3", "تالتة ثانوي"]] : [["p1", "أولى إعدادي"], ["p2", "تانية إعدادي"], ["p3", "تالتة إعدادي"]];
    const select = $("challenge-grade"), current = select.value;
    select.replaceChildren(...entries.map(([value, text]) => { const o = document.createElement("option"); o.value = value; o.textContent = text; return o; }));
    if (entries.some(([value]) => value === current)) select.value = current;
  };
  $("challenge-stage").addEventListener("change", fillGrades); fillGrades(); showTotal();
  function showQuestion() {
    if (index >= questions.length) return finish();
    const q = questions[index]; locked = false; $("question-count").textContent = `السؤال ${new Intl.NumberFormat("ar-EG").format(index + 1)} من ${new Intl.NumberFormat("ar-EG").format(questions.length)}`;
    $("round-score").textContent = `${new Intl.NumberFormat("ar-EG").format(roundPoints)} نقطة`; $("quiz-progress-bar").style.width = `${(index / questions.length) * 100}%`; $("question-text").textContent = q[0]; $("answer-feedback").hidden = true; $("answer-feedback").replaceChildren(); $("next-question").disabled = true;
    const options = $("answer-options"); options.replaceChildren();
    q[1].forEach((text, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "answer-option"; b.textContent = text; b.addEventListener("click", () => choose(i, b)); options.append(b); });
  }
  function choose(choice, button) {
    if (locked) return; locked = true; const q = questions[index], correct = choice === q[2];
    answeredCount++;
    [...$("answer-options").children].forEach((node, i) => { node.disabled = true; if (i === q[2]) node.classList.add("correct"); else if (i === choice) node.classList.add("incorrect"); });
    const feedback = $("answer-feedback"); feedback.hidden = false; const title = document.createElement("strong"), text = document.createElement("p");
    title.textContent = correct ? "إجابة مظبوطة! +١٠ نقاط" : "قريب! راجع الفكرة دي"; text.textContent = q[3]; feedback.classList.toggle("is-correct", correct); feedback.append(title, text);
    if (correct) { roundPoints += 10; try { localStorage.setItem(STORE, String(readPoints() + 10)); } catch {} showTotal(); }
    $("round-score").textContent = `${new Intl.NumberFormat("ar-EG").format(roundPoints)} نقطة`; $("next-question").disabled = false; $("next-question").textContent = index + 1 === questions.length ? "شوف نتيجتك ✦" : "السؤال التالي ←";
  }
  function finish() {
    $("quiz-area").hidden = true; $("challenge-summary").hidden = false; $("challenge-setup").hidden = true;
    const heading = document.createElement("h3"), score = document.createElement("strong"), detail = document.createElement("p"), restart = document.createElement("button");
    heading.textContent = roundPoints >= 40 ? "جامد جدًا، راجعت وفهمت!" : roundPoints >= 20 ? "شغل حلو — كمّل تدريبك" : "كل محاولة بتعلمك حاجة جديدة"; score.textContent = `+${new Intl.NumberFormat("ar-EG").format(roundPoints)} نقطة`; detail.textContent = `جاوبت ${new Intl.NumberFormat("ar-EG").format(answeredCount)} من ${new Intl.NumberFormat("ar-EG").format(questions.length)} أسئلة في ${subjectNames[$("challenge-subject").value]}. راجع الأسئلة اللي وقفت معاك وجرب جولة تانية.`; restart.type = "button"; restart.className = "primary"; restart.textContent = "ابدأ جولة جديدة"; restart.addEventListener("click", reset); $("challenge-summary").replaceChildren(heading, score, detail, restart); $("challenge-title").textContent = "نتيجة الجولة"; $("challenge-status").textContent = "النقاط اتضافت لرصيدك المحفوظ على الجهاز.";
  }
  function reset() { $("challenge-summary").hidden = true; $("challenge-setup").hidden = false; $("challenge-title").textContent = "جهّز جولتك"; $("challenge-status").textContent = "كل إجابة صحيحة = ١٠ نقاط. النقاط محفوظة في متصفحك."; }
  $("start-challenge").addEventListener("click", () => {
    const stage = $("challenge-stage").value, subject = $("challenge-subject").value, source = bank[stage][subject];
    questions = [...source].sort(() => Math.random() - 0.5).slice(0, 5); index = 0; roundPoints = 0; answeredCount = 0;
    $("challenge-setup").hidden = true; $("challenge-summary").hidden = true; $("quiz-area").hidden = false; $("challenge-title").textContent = `${subjectNames[subject]} · ${$("challenge-grade").selectedOptions[0].textContent}`; showQuestion();
  });
  $("next-question").addEventListener("click", () => { if (!locked) return; index++; showQuestion(); });
  $("end-challenge").addEventListener("click", () => { if (roundPoints || locked) finish(); else reset(); });
})();

