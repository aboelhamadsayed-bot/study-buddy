(() => {
  "use strict";
  const $ = id => document.getElementById(id), names = { Fajr: "الفجر", Sunrise: "الشروق", Dhuhr: "الظهر", Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء" };
  let prayers = [], alertKey = "";
  try { alertKey = localStorage.getItem("studyBuddyPrayerAlertKey") || ""; } catch {}
  function clock(value) { const [hour, minute] = String(value || "").split(":").map(Number); if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "--:--"; const date = new Date(); date.setHours(hour, minute, 0, 0); return new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit", hour12: true }).format(date); }
  async function load() {
    $("prayer-times").textContent = "جارٍ جلب مواقيت الصلاة…"; $("prayer-status").textContent = "";
    try {
      const now = new Date(), date = `${String(now.getDate()).padStart(2,"0")}-${String(now.getMonth()+1).padStart(2,"0")}-${now.getFullYear()}`;
      const response = await fetch(`https://api.aladhan.com/v1/timingsByCity/${date}?city=Giza&country=Egypt&method=5`);
      if (!response.ok) throw new Error("network"); const data = await response.json(); if (data.code !== 200 || !data.data?.timings) throw new Error("data");
      prayers = Object.keys(names).map(key => ({ key, name: names[key], time: String(data.data.timings[key] || "").split(" ")[0] }));
      $("prayer-date").textContent = data.data.date?.readable || new Intl.DateTimeFormat("ar-EG", { dateStyle: "full" }).format(now); render();
    } catch { $("prayer-times").textContent = "تعذر تحميل المواقيت. تحقق من الإنترنت وحاول مرة أخرى."; $("next-prayer").textContent = "مواقيت الصلاة غير متاحة الآن."; }
  }
  function render() {
    const now = new Date(), mins = now.getHours() * 60 + now.getMinutes();
    const rows = prayers.map(p => { const [h,m] = p.time.split(":").map(Number); return { ...p, mins: h * 60 + m }; });
    let next = rows.find(p => p.key !== "Sunrise" && p.mins > mins), tomorrow = false;
    if (!next) { next = rows.find(p => p.key === "Fajr") || rows[0]; tomorrow = true; }
    const grid = $("prayer-times"); grid.replaceChildren();
    for (const p of rows) { const card = document.createElement("article"); card.className = `prayer-time-card${p.key === next?.key ? " is-next" : ""}`; const label = document.createElement("span"), time = document.createElement("strong"); label.textContent = p.name; time.textContent = clock(p.time); card.append(label, time); if (p.key === next?.key) { const tag = document.createElement("small"); tag.textContent = "القادمة"; card.append(tag); } grid.append(card); }
    if (next) { let left = (next.mins - mins) * 60000 - now.getSeconds() * 1000; if (tomorrow) left += 24 * 60 * 60 * 1000; const h = Math.floor(left / 3600000), m = Math.floor(left % 3600000 / 60000); $("next-prayer").textContent = `الصلاة القادمة: ${next.name} · بعد ${new Intl.NumberFormat("ar-EG").format(h)} ساعة و${new Intl.NumberFormat("ar-EG").format(m)} دقيقة`; }
    const currentKey = `${now.toISOString().slice(0,10)}-${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const matched = rows.find(p => { const [h,m] = p.time.split(":").map(Number); return p.key !== "Sunrise" && h === now.getHours() && m === now.getMinutes(); });
    if (matched && alertKey !== currentKey && "Notification" in window && Notification.permission === "granted") { new Notification(`حان وقت صلاة ${matched.name}`, { body: "تقبّل الله منك. خذ استراحة للصلاة." }); alertKey = currentKey; try { localStorage.setItem("studyBuddyPrayerAlertKey", alertKey); } catch {} }
  }
  $("prayer-notify").addEventListener("click", async () => {
    if (!("Notification" in window)) { $("prayer-status").textContent = "المتصفح لا يدعم تنبيهات الصلاة."; return; }
    try { const permission = await Notification.requestPermission(); $("prayer-status").textContent = permission === "granted" ? "تم تفعيل التنبيه. اترك الصفحة مفتوحة وقت الصلاة." : "لم يتم السماح بالتنبيه؛ تابع المواقيت هنا."; } catch { $("prayer-status").textContent = "تعذر تفعيل الإشعارات في هذا المتصفح."; }
  });
  $("refresh-prayer").addEventListener("click", load); load(); setInterval(render, 30000);
})();

