(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const status = (message, error = false) => { const node = $("tutor-status"); node.textContent = message; node.dataset.kind = error ? "error" : "success"; };
  const client = window.supabase?.createClient
    ? window.supabase.createClient("https://asfmnztojcdotxyqfpzd.supabase.co", "sb_publishable_irqLABJB7q61DtwmEtdtcw_Ujcip94i")
    : null;
  const functionUrl = "https://asfmnztojcdotxyqfpzd.supabase.co/functions/v1/qimma-tutor";
  const validGroups = new Set(["6-8", "9-11", "12-14", "15-17", "18+"]);
  let session = null, profile = null, history = [], busy = false, photoUrl = "", photoData = "";

  $("tutor-image").addEventListener("change", () => {
    const file = $("tutor-image").files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { status("اختار صورة بصيغة JPG أو PNG أو صورة يقدر المتصفح يفتحها.", true); $("tutor-image").value = ""; return; }
    if (file.size > 12 * 1024 * 1024) { status("الصورة كبيرة. اختار صورة أصغر من 12 ميجابايت.", true); $("tutor-image").value = ""; return; }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(file); $("photo-preview-image").src = photoUrl;
    $("photo-name").textContent = file.name; $("photo-preview").hidden = false;
    status("الصورة جاهزة. اكتب سؤالك أو ابعتها كما هي.");
  });
  $("remove-photo").addEventListener("click", () => {
    $("tutor-image").value = ""; $("photo-preview-image").removeAttribute("src"); $("photo-preview").hidden = true; photoData = "";
    if (photoUrl) URL.revokeObjectURL(photoUrl); photoUrl = "";
  });

  async function compressPhoto(file) {
    let bitmap;
    try { bitmap = await createImageBitmap(file); } catch { throw new Error("مش قادر أقرأ الصورة دي. جرّب صورة JPG أو PNG واضحة."); }
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d"); if (!context) throw new Error("تعذر تجهيز الصورة على الجهاز.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close?.();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.78));
    if (!blob || blob.size > 3 * 1024 * 1024) throw new Error("حجم الصورة بعد تجهيزها كبير. جرّب صورة أوضح وأصغر.");
    return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("تعذر قراءة الصورة.")); reader.readAsDataURL(blob); });
  }

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

  async function ask(question, followup = false, image = "") {
    if (busy) return;
    if (!session || !validGroups.has(profile?.age_group)) { status("سجّل الدخول وحدد فئتك العمرية من حساب الطالب الأول.", true); return; }
    const grade = $("tutor-grade").value, subject = $("tutor-subject").value.trim();
    if (!grade || !subject || (!question.trim() && !image)) { status("اختار صفك والمادة، واكتب السؤال أو صوّره.", true); return; }
    const button = followup ? $("tutor-followup").querySelector("button") : $("tutor-submit");
    busy = true; button.disabled = true; status("الأستاذ بيجهز شرح مناسب لصفك…");
    try {
      const system = grade === "secondary2" ? $("tutor-system").value : "";
      const track = grade === "secondary2" && system === "bac" ? $("tutor-track").value : "";
      const prompt = question.trim() || "اقرأ السؤال الموجود في الصورة واشرح الحل خطوة بخطوة.";
      const response = await fetch(functionUrl, { method: "POST", headers: { apikey: "sb_publishable_irqLABJB7q61DtwmEtdtcw_Ujcip94i", Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ age_group: profile.age_group, grade, system, track, mode: followup ? "explain" : $("tutor-mode").value, subject, question: prompt, image, history: history.slice(-6) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "المساعد مشغول دلوقتي. جرّب بعد دقيقة.");
      addMessage("student", image ? (question.trim() || "📷 صورة سؤال") : question.trim()); addMessage("teacher", String(data.answer || "ملقيناش إجابة. جرّب توضح السؤال أكتر."));
      history.push({ role: "user", content: prompt }, { role: "assistant", content: String(data.answer || "") }); history = history.slice(-8);
      $("tutor-answer").hidden = false; $("tutor-followup").classList.remove("hidden"); $("tutor-followup-question").value = ""; $("tutor-video-link").hidden = false;
      status("لو خطوة مش واضحة، اسأل عنها لوحدها وهكمل معاك.");
      $("tutor-answer").lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      const message = error.message === "OPENAI_API_KEY is missing" ? "خدمة الشرح محتاجة إعداد مفتاح الذكاء الاصطناعي داخل إعدادات Supabase. ما تحطش المفتاح في الموقع." : error.message;
      status(message || "حصلت مشكلة اتصال. حاول تاني.", true);
    } finally { busy = false; button.disabled = false; }
  }

  $("tutor-form").addEventListener("submit", async event => { event.preventDefault(); const button = $("tutor-submit"); if (button.disabled) return; button.disabled = true; history = []; $("tutor-answer").replaceChildren(); $("tutor-answer").hidden = true; $("tutor-followup").classList.add("hidden"); $("tutor-video-link").hidden = true; try { const file = $("tutor-image").files?.[0]; photoData = file ? await compressPhoto(file) : ""; await ask($("tutor-question").value, false, photoData); } catch (error) { status(error.message || "تعذر تجهيز الصورة.", true); } finally { button.disabled = false; } });
  $("tutor-followup").addEventListener("submit", event => { event.preventDefault(); ask($("tutor-followup-question").value, true, photoData); });
  client?.auth.onAuthStateChange(() => { setTimeout(() => loadStudent().catch(() => status("تعذر تحميل حسابك. سجّل الدخول مرة تانية.", true)), 0); });
  loadStudent().catch(() => status("تعذر تحميل حسابك أو ملفك الدراسي. راجع إعدادات الحساب وحاول تاني.", true));
})();

