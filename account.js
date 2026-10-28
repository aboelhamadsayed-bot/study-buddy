// ضع رابط مشروع Supabase الأساسي والمفتاح العام (anon/publishable) هنا فقط.
    // لا تضع أبداً service_role أو أي مفتاح سري في صفحة المتصفح.
    const SUPABASE_URL = "https://asfmnztojcdotxyqfpzd.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_irqLABJB7q61DtwmEtdtcw_Ujcip94i";
    const REDIRECT_AFTER_AUTH = new URL("index.html", window.location.href).href;
    const AUTH_RETURN_URL = new URL("account.html?flow=confirm", window.location.href).href;
    const RECOVERY_RETURN_URL = new URL("account.html?flow=recovery", window.location.href).href;

    (() => {
      const $ = (id) => document.getElementById(id);
      const form = $("auth-form"), message = $("message"), submit = $("submit-button");
      const recoveryPanel = $("recovery-panel"), recoveryForm = $("recovery-form");
      const loginTab = $("login-tab"), signupTab = $("signup-tab");
      const nameField = $("name-field"), confirmField = $("confirm-field"), birthField = $("birth-field"), birthDate = $("birth-date");
      const password = $("password"), email = $("email");
      let mode = "login", client = null, busy = false;
      let selectedAgeGroup = "";
      const todayForDate = new Date(); todayForDate.setMinutes(todayForDate.getMinutes() - todayForDate.getTimezoneOffset());
      birthDate.max = todayForDate.toISOString().slice(0, 10);
      function ageFromBirthDate(value) {
        const date = new Date(value + "T00:00:00");
        if (!value || Number.isNaN(date.getTime()) || date > new Date()) return null;
        const now = new Date();
        let age = now.getFullYear() - date.getFullYear();
        if (now.getMonth() < date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate())) age--;
        return age >= 6 && age <= 120 ? age : null;
      }
      function ageGroupFor(age) { return age <= 8 ? "6-8" : age <= 11 ? "9-11" : age <= 14 ? "12-14" : age <= 17 ? "15-17" : "18+"; }
      birthDate.addEventListener("input", () => { const age = ageFromBirthDate(birthDate.value); $("guardian-consent-wrap").classList.toggle("hidden", age === null || age >= 13); if (age === null || age >= 13) $("guardian-consent").checked = false; });
      const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) &&
        SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.includes("YOUR_");
      if (configured && window.supabase?.createClient) client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
      });

      function notify(text, kind = "info") { message.textContent = text; message.dataset.kind = kind; }
      function clearMessage() { message.textContent = ""; message.removeAttribute("data-kind"); }
      function setMode(next) {
        mode = next; const isSignup = mode === "signup";
        loginTab.setAttribute("aria-selected", String(!isSignup)); signupTab.setAttribute("aria-selected", String(isSignup));
        nameField.classList.toggle("hidden", !isSignup); birthField.classList.toggle("hidden", !isSignup); confirmField.classList.toggle("hidden", !isSignup);
        $("password-hint").classList.toggle("hidden", !isSignup);
        $("form-title").textContent = isSignup ? "ابدأ رحلتك" : "أهلاً بعودتك";
        $("form-subtitle").textContent = isSignup ? "أنشئ حسابك وخلي كل خطوة تقرّبك من هدفك." : "سجّل دخولك لتكمل من حيث توقفت.";
        $("submit-button").textContent = isSignup ? "إنشاء حساب" : "تسجيل الدخول";
        $("forgot-button").classList.toggle("hidden", isSignup);
        password.autocomplete = isSignup ? "new-password" : "current-password";
        $("name").required = isSignup; $("birth-date").required = isSignup; $("confirm-password").required = isSignup;
        clearMessage();
      }
      loginTab.addEventListener("click", () => setMode("login"));
      signupTab.addEventListener("click", () => setMode("signup"));
      document.querySelectorAll("[data-toggle-password]").forEach(button => button.addEventListener("click", () => {
        const input = $(button.dataset.togglePassword), visible = input.type === "text";
        input.type = visible ? "password" : "text"; button.textContent = visible ? "إظهار" : "إخفاء";
        button.setAttribute("aria-label", visible ? "إظهار كلمة المرور" : "إخفاء كلمة المرور"); input.focus();
      }));
      email.addEventListener("input", () => email.removeAttribute("aria-invalid"));
      password.addEventListener("input", () => password.removeAttribute("aria-invalid"));
      $("forgot-button").addEventListener("click", async () => {
        clearMessage();
        if (!client) return notify("أضف رابط ومفتاح Supabase العامين داخل الملف لتفعيل الحسابات.", "error");
        if (!email.value.trim() || !email.checkValidity()) { email.setAttribute("aria-invalid", "true"); email.focus(); return notify("اكتب بريدك الإلكتروني الصحيح أولاً.", "error"); }
        try {
          busy = true; submit.disabled = true;
          const { error } = await client.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: RECOVERY_RETURN_URL });
          if (error) throw error;
          notify("إذا كان البريد مسجلاً، ستصلك رسالة لاستعادة كلمة المرور. راجع صندوق الوارد والرسائل غير المرغوب فيها.", "success");
        } catch (error) { notify(error.message || "تعذر إرسال رسالة الاستعادة. حاول مرة أخرى.", "error"); }
        finally { busy = false; submit.disabled = false; }
      });
      form.addEventListener("submit", async event => {
        event.preventDefault(); clearMessage(); if (busy) return;
        email.value = email.value.trim();
        if (!email.checkValidity()) { email.setAttribute("aria-invalid", "true"); email.focus(); return notify("تحقق من كتابة البريد الإلكتروني بشكل صحيح.", "error"); }
        if (password.value.length < 6) { password.setAttribute("aria-invalid", "true"); password.focus(); return notify("كلمة المرور يجب ألا تقل عن 6 أحرف.", "error"); }
        if (mode === "signup" && !$("name").value.trim()) { $("name").focus(); return notify("اكتب الاسم الذي تحب أن نناديك به.", "error"); }
        if (mode === "signup" && password.value.length < 8) { password.focus(); return notify("اختر كلمة مرور من 8 أحرف على الأقل لحماية حسابك.", "error"); }
        if (mode === "signup") { const age = ageFromBirthDate(birthDate.value); if (age === null) { birthDate.focus(); return notify("أدخل تاريخ ميلاد صحيحًا؛ يجب أن يكون العمر 6 سنوات أو أكثر.", "error"); } if (age < 13 && !$("guardian-consent").checked) { $("guardian-consent-wrap").classList.remove("hidden"); $("guardian-consent").focus(); return notify("لإكمال التسجيل لمن هم دون 13 سنة، يلزم تأكيد موافقة ولي الأمر.", "error"); } selectedAgeGroup = ageGroupFor(age); }
        if (mode === "signup" && password.value !== $("confirm-password").value) { $("confirm-password").focus(); return notify("كلمتا المرور غير متطابقتين.", "error"); }
        if (!client) return notify("الصفحة جاهزة، لكن يلزم وضع رابط مشروع Supabase ومفتاحه العام في الإعدادات أعلى الكود.", "error");
        busy = true; submit.disabled = true; submit.textContent = mode === "signup" ? "جارٍ إنشاء الحساب…" : "جارٍ تسجيل الدخول…";
        try {
          if (mode === "signup") {
            const { data, error } = await client.auth.signUp({ email: email.value, password: password.value,
              options: { data: { display_name: $("name").value.trim(), age_group: selectedAgeGroup }, emailRedirectTo: AUTH_RETURN_URL } });
            if (error) throw error;
            if (data.session) { notify("تم إنشاء حسابك بنجاح. جارٍ فتح مساحة الدراسة…", "success"); window.location.assign(REDIRECT_AFTER_AUTH); return; }
            notify("تم إنشاء الحساب. افحص بريدك الإلكتروني واضغط رابط التأكيد قبل تسجيل الدخول.", "success");
          } else {
            const { error } = await client.auth.signInWithPassword({ email: email.value, password: password.value });
            if (error) throw error;
            notify("تم تسجيل الدخول. جارٍ فتح مساحة الدراسة…", "success"); window.location.assign(REDIRECT_AFTER_AUTH); return;
          }
        } catch (error) {
          const text = error?.message || "حدث خطأ غير متوقع. حاول مرة أخرى.";
          notify(text.toLowerCase().includes("invalid login credentials") ? "البريد أو كلمة المرور غير صحيحة. تحقق منهما أو استخدم خيار الاستعادة." : text, "error");
        } finally { busy = false; submit.disabled = false; submit.textContent = mode === "signup" ? "إنشاء حساب" : "تسجيل الدخول"; }
      });
      recoveryForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const nextPassword = $("new-password").value;
        if (nextPassword.length < 8) return notify("اختر كلمة مرور من 8 أحرف على الأقل.", "error");
        if (nextPassword !== $("repeat-password").value) return notify("كلمتا المرور غير متطابقتين.", "error");
        if (!client) return notify("تعذر الاتصال بخدمة الحسابات. أعد تحميل الصفحة وحاول مرة أخرى.", "error");
        const saveButton = $("save-password"); saveButton.disabled = true;
        try {
          const { error } = await client.auth.updateUser({ password: nextPassword });
          if (error) throw error;
          recoveryPanel.classList.add("hidden"); form.classList.remove("hidden");
          document.querySelector(".tabs").classList.remove("hidden");
          history.replaceState(null, "", window.location.pathname);
          setMode("login"); notify("تم تحديث كلمة المرور. سجّل دخولك الآن.", "success");
        } catch (error) { notify(error.message || "تعذر تحديث كلمة المرور.", "error"); }
        finally { saveButton.disabled = false; }
      });
      if (client) {
        client.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY" || new URLSearchParams(window.location.search).get("flow") === "recovery") {
            form.classList.add("hidden"); document.querySelector(".tabs").classList.add("hidden");
            recoveryPanel.classList.remove("hidden");
            $("form-title").textContent = "تعيين كلمة مرور جديدة";
            $("form-subtitle").textContent = "أدخل كلمة مرور آمنة لحسابك.";
          } else if (event === "SIGNED_IN" && new URLSearchParams(window.location.search).get("flow") === "confirm") {
            window.location.replace(REDIRECT_AFTER_AUTH);
          }
        });
      }
      if (!client) notify("لم يتم إعداد اتصال Supabase.", "info");
    })();



