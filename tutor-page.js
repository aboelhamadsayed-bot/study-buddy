(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const status = (message, error = false) => { const node = $("tutor-status"); node.textContent = message; node.dataset.kind = error ? "error" : "success"; };
  const client = window.supabase?.createClient
    ? window.supabase.createClient("https://asfmnztojcdotxyqfpzd.supabase.co", "sb_publishable_irqLABJB7q61DtwmEtdtcw_Ujcip94i")
    : null;
  const functionUrl = "https://asfmnztojcdotxyqfpzd.supabase.co/functions/v1/qimma-tutor";
  const validGroups = new Set(["6-8", "9-11", "12-14", "15-17", "18+"]);
  let session = null, profile = null, history = [], busy = false;

  function refreshSystem() {
    const second = $("tutor-grade").value === "secondary2";
    $("tutor-system-wrap").classList.toggle("hidden", !second);
    $("tutor-track-wrap").classList.toggle("hidden", !second || $("tutor-system").value !== "bac");
  }
  $("tutor-grade").addEventListener("change", refreshSystem);
  $("tutor-system").addEventListener("change", refreshSystem);
  refreshSystem();

  function addMessage(kind, text) {
    const box = document.createElement("article"); box.className = `tutor-message ${kind}`;
    const title = document.createElement("strong"); title.textContent = kind === "teacher" ? "الأستاذ الذكي" : "سؤالك";
    const body = document.createElement("p"); body.textContent = text;
    box.append(title, body); $("tutor-answer").append(box);
  }
  async function loadStudent() {
    if (!client) { status("تعذر تحميل خدمة تسجيل الدخول. حدّث الصفحة وحاول تاني.", true); return; }
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    session = data.session;
    if (!session) { status("سجّل الدخول أولًا من حساب الطالب، وبعدها ارجع هنا."); return; }
    const { data: row, error: profileError } = await client.from("student_profiles").select("age_group").eq("user_id", session.user.id).maybeSingle();
    if (profileError) throw profileError;
    profile = row;
    if (!validGroups.has(profile?.age_group)) { status("كمّل تحديد فئتك العمرية من حساب الطالب عشان الأستاذ يضبط الشرح على مرحلتك.", true); return; }
    status("جاهز يا بطل — اسأل عن نقطة واحدة، ونمشي فيها خطوة خطوة.");
  }

  async function ask(question, followup = false) {
    if (busy) return;
    if (!session || !validGroups.has(profile?.age_group)) { status("سجّل الدخول وحدد فئتك العمرية من حساب الطالب الأول.", true); return; }
    const grade = $("tutor-grade").value, subject = $("tutor-subject").value.trim();
    if (!grade || !subject || !question.trim()) { status("اختار صفك واكتب المادة والسؤال.", true); return; }
    const button = followup ? $("tutor-followup").querySelector("button") : $("tutor-submit");
    busy = true; button.disabled = true; status("الأستاذ بيجهز شرح مناسب لصفك…");
    try {
      const system = grade === "secondary2" ? $("tutor-system").value : "";
      const track = grade === "secondary2" && system === "bac" ? $("tutor-track").value : "";
      const response = await fetch(functionUrl, { method: "POST", headers: { apikey: "sb_publishable_irqLABJB7q61DtwmEtdtcw_Ujcip94i", Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ age_group: profile.age_group, grade, system, track, mode: followup ? "explain" : $("tutor-mode").value, subject, question: question.trim(), history: history.slice(-6) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "المساعد مشغول دلوقتي. جرّب بعد دقيقة.");
      addMessage("student", question.trim()); addMessage("teacher", String(data.answer || "ملقيناش إجابة. جرّب توضح السؤال أكتر."));
      history.push({ role: "user", content: question.trim() }, { role: "assistant", content: String(data.answer || "") }); history = history.slice(-8);
      $("tutor-answer").hidden = false; $("tutor-followup").classList.remove("hidden"); $("tutor-followup-question").value = ""; $("tutor-video-link").hidden = false;
      status("لو خطوة مش واضحة، اسأل عنها لوحدها وهكمل معاك.");
      $("tutor-answer").lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      const message = error.message === "OPENAI_API_KEY is missing" ? "خدمة الشرح محتاجة إعداد مفتاح الذكاء الاصطناعي داخل إعدادات Supabase. ما تحطش المفتاح في الموقع." : error.message;
      status(message || "حصلت مشكلة اتصال. حاول تاني.", true);
    } finally { busy = false; button.disabled = false; }
  }

  $("tutor-form").addEventListener("submit", event => { event.preventDefault(); history = []; $("tutor-answer").replaceChildren(); $("tutor-answer").hidden = true; $("tutor-followup").classList.add("hidden"); $("tutor-video-link").hidden = true; ask($("tutor-question").value); });
  $("tutor-followup").addEventListener("submit", event => { event.preventDefault(); ask($("tutor-followup-question").value, true); });
  client?.auth.onAuthStateChange(() => { setTimeout(() => loadStudent().catch(() => status("تعذر تحميل حسابك. سجّل الدخول مرة تانية.", true)), 0); });
  loadStudent().catch(() => status("تعذر تحميل حسابك أو ملفك الدراسي. راجع إعدادات الحساب وحاول تاني.", true));
})();

