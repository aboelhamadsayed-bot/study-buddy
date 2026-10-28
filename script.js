/* =====================================
   Rafiq Study Buddy - complete JavaScript
   ===================================== */
const $ = id => document.getElementById(id);

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function shiftDay(key, amount) {
  const d = new Date(key + "T12:00:00");
  d.setDate(d.getDate() + amount);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

/* Theme */
if (load("studyBuddyDark", false)) document.body.classList.add("dark");
$("themeBtn").textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const dark = document.body.classList.contains("dark");
  $("themeBtn").textContent = dark ? "☀️" : "🌙";
  save("studyBuddyDark", dark);
});

/* Timer and stats */
const oldStats = load("studyBuddyData", {});
const stats = {
  sessions: Number(oldStats.sessions) || 0,
  points: Number(oldStats.points) || 0,
  minutes: Number(oldStats.minutes) || 0
};
let isStudy = true;
let isRunning = false;
let interval = null;
let remaining = 25 * 60;
let endTime = 0;

function duration() {
  const raw = Number(isStudy ? $("studyMinutes").value : $("breakMinutes").value);
  const max = isStudy ? 180 : 60;
  return Math.min(max, Math.max(1, Number.isFinite(raw) && raw ? raw : (isStudy ? 25 : 5))) * 60;
}
function displayTime() {
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  $("timer").textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  const total = duration();
  $("progressBar").style.width = `${Math.min(100, Math.max(0, (total - remaining) / total * 100))}%`;
  document.title = `${$("timer").textContent} | رفيق المذاكرة`;
}
function renderStats() {
  $("sessions").textContent = stats.sessions;
  $("points").textContent = stats.points;
  $("minutes").textContent = stats.minutes;
  const goal = Math.max(1, Math.min(30, Number($("dailyGoal").value) || 4));
  $("goalBar").style.width = `${Math.min(100, stats.sessions / goal * 100)}%`;
  $("goalText").textContent = stats.sessions >= goal
    ? "ما شاء الله! وصلت لهدف الجلسات المسجل. 🌟"
    : `أنجزت ${stats.sessions} من ${goal} جلسات إجمالًا. كمّل!`;
  renderRewards();
}
function stopTimer() {
  clearInterval(interval);
  interval = null;
  isRunning = false;
}
function startTimer() {
  if (isRunning) return;
  isRunning = true;
  endTime = Date.now() + remaining * 1000;
  $("message").textContent = isStudy
    ? "ركّز في هدفك وأبعد المشتتات. أنت قادر! 💪"
    : "استرح قليلًا واشرب ماءً، ثم عُد بنشاط.";
  interval = setInterval(() => {
    remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    displayTime();
    if (remaining <= 0) finishTimer();
  }, 250);
}
function finishTimer() {
  stopTimer();
  if (isStudy) {
    const mins = Math.min(180, Math.max(1, Number($("studyMinutes").value) || 25));
    stats.sessions++;
    stats.points += 10;
    stats.minutes += mins;
    save("studyBuddyData", stats);
    registerStudyDay();
    renderStats();
    $("message").textContent = "أحسنت! أنهيت جلسة مذاكرة وكسبت 10 نقاط 🏆";
    notify("أحسنت يا بطل! 🎉", "أكملت جلسة مذاكرة. خذ استراحتك.");
    isStudy = false;
    $("mode").textContent = "☕ وقت الراحة";
  } else {
    $("message").textContent = "انتهت الراحة! ارجع لهدفك وابدأ جلسة جديدة 💚";
    isStudy = true;
    $("mode").textContent = "🎯 وقت المذاكرة";
  }
  remaining = duration();
  displayTime();
}
$("startBtn").addEventListener("click", () => {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
  startTimer();
});
$("pauseBtn").addEventListener("click", () => {
  if (!isRunning) return;
  remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  stopTimer();
  displayTime();
  $("message").textContent = "تم الإيقاف المؤقت. واصل عندما تكون جاهزًا.";
});
$("resetBtn").addEventListener("click", () => {
  stopTimer();
  remaining = duration();
  $("message").textContent = "المؤقت جاهز لجلسة جديدة.";
  displayTime();
});
[$("studyMinutes"), $("breakMinutes")].forEach(input => input.addEventListener("change", () => {
  if (!isRunning) { remaining = duration(); displayTime(); }
}));
$("dailyGoal").addEventListener("change", renderStats);

function notify(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification(title, { body }); } catch {}
  }
}

/* Motivation */
const quotes = [
  "كل صفحة تذاكرها تقرّبك من هدفك.",
  "مش لازم تكون الأفضل من أول يوم؛ المهم تتحسن كل يوم.",
  "ابدأ ولو بخمس دقائق، فالبداية أهم من الكمال.",
  "تعب النهارده ممكن يكون سبب فخر بكرة.",
  "استعن بالله وخذ بالأسباب ولا تستسلم.",
  "اجعل نيتك طيبة، واجتهد في علم ينفعك وينفع غيرك.",
  "خطوة صغيرة كل يوم أفضل من انتظار الحماس."
];
$("quoteBtn").addEventListener("click", () => {
  const current = $("quote").textContent;
  const options = quotes.filter(q => q !== current);
  $("quote").textContent = options[Math.floor(Math.random() * options.length)] || quotes[0];
});

/* Tasks by subject and notes */
let tasks = load("studyBuddyTasks", []);
if (!Array.isArray(tasks)) tasks = [];
tasks = tasks.filter(t => t && typeof t.id === "string" && typeof t.text === "string" && typeof t.done === "boolean");

function renderTasks() {
  $("taskList").replaceChildren();
  const completed = tasks.filter(t => t.done).length;
  const remainingCount = tasks.length - completed;
  $("completedTasks").textContent = completed;
  $("remainingTasks").textContent = remainingCount;
  $("tasksProgress").style.width = `${tasks.length ? completed / tasks.length * 100 : 0}%`;
  $("tasksMessage").textContent = !tasks.length ? "أضف أول مهمة وابدأ 💚"
    : remainingCount === 0 ? "ما شاء الله! أنجزت كل مهامك 🏆"
    : `أنجزت ${completed} من ${tasks.length} مهام. كمّل!`;

  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.done ? " done" : "");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = task.done;
    check.setAttribute("aria-label", "تحديد المهمة كمكتملة");
    check.addEventListener("change", () => {
      task.done = check.checked;
      save("studyBuddyTasks", tasks);
      if (task.done) registerStudyDay();
      renderTasks();
    });
    const name = document.createElement("span");
    name.className = "task-name";
    name.textContent = task.text;
    const subject = document.createElement("span");
    subject.className = "task-subject";
    subject.textContent = task.subject || "عام";
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-task";
    del.textContent = "🗑️";
    del.setAttribute("aria-label", "حذف المهمة");
    del.addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id);
      save("studyBuddyTasks", tasks);
      renderTasks();
    });
    li.append(check, name, subject, del);
    if (task.notes) {
      const notes = document.createElement("div");
      notes.className = "task-notes";
      notes.textContent = "📝 " + task.notes;
      li.appendChild(notes);
    }
    $("taskList").appendChild(li);
  });
}
$("taskForm").addEventListener("submit", event => {
  event.preventDefault();
  const text = $("taskInput").value.trim();
  if (!text) return;
  if (tasks.length >= 100) {
    $("tasksMessage").textContent = "وصلت للحد الأقصى للمهام. احذف بعض المهام أولًا.";
    return;
  }
  tasks.push({
    id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    text,
    subject: $("taskSubject").value,
    notes: $("taskNotes").value.trim(),
    done: false
  });
  save("studyBuddyTasks", tasks);
  $("taskInput").value = "";
  $("taskNotes").value = "";
  renderTasks();
  $("taskInput").focus();
});
$("clearCompleted").addEventListener("click", () => {
  tasks = tasks.filter(t => !t.done);
  save("studyBuddyTasks", tasks);
  renderTasks();
});

/* Weekly schedule */
let schedule = load("studyBuddySchedule", []);
if (!Array.isArray(schedule)) schedule = [];
const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
$("scheduleForm").addEventListener("submit", event => {
  event.preventDefault();
  const subject = $("scheduleSubject").value.trim();
  const time = $("scheduleTime").value;
  const day = Number($("scheduleDay").value);
  if (!subject || !time || !Number.isInteger(day)) return;
  schedule.push({ id: `${Date.now()}-${Math.random()}`, day, subject, time });
  save("studyBuddySchedule", schedule);
  $("scheduleSubject").value = "";
  $("scheduleTime").value = "";
  renderSchedule();
});
function renderSchedule() {
  const list = $("scheduleList");
  list.replaceChildren();
  const today = new Date().getDay();
  $("todayScheduleTitle").textContent = "جدول يوم " + dayNames[today];
  const items = schedule.filter(item => item.day === today).sort((a,b) => a.time.localeCompare(b.time));
  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "لا توجد مهام مجدولة اليوم. أضف خطة جديدة!";
    list.appendChild(li);
  }
  items.forEach(item => {
    const li = document.createElement("li");
    li.className = "task-item";
    const text = document.createElement("span");
    text.className = "task-name";
    text.textContent = `${item.time} — ${item.subject}`;
    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-task";
    del.textContent = "حذف";
    del.addEventListener("click", () => {
      schedule = schedule.filter(s => s.id !== item.id);
      save("studyBuddySchedule", schedule);
      renderSchedule();
    });
    li.append(text, del);
    list.appendChild(li);
  });
}

/* Streak: active if user completes a study session or task that day */
let streak = load("studyBuddyStreak", { lastDay: "", count: 0 });
if (!streak || typeof streak !== "object") streak = { lastDay: "", count: 0 };
function registerStudyDay() {
  const today = todayKey();
  if (streak.lastDay === today) return;
  streak.count = streak.lastDay === shiftDay(today, -1) ? (Number(streak.count) || 0) + 1 : 1;
  streak.lastDay = today;
  save("studyBuddyStreak", streak);
  renderRewards();
}
function renderRewards() {
  const today = todayKey();
  $("streakCount").textContent =
    (streak.lastDay === today || streak.lastDay === shiftDay(today, -1)) ? streak.count : 0;
  $("rewardPoints").textContent = stats.points;
  let level = "مبتدئ", next = 50;
  if (stats.points >= 500) { level = "أسطورة"; next = 0; }
  else if (stats.points >= 200) { level = "محترف"; next = 500; }
  else if (stats.points >= 100) { level = "متقدم"; next = 200; }
  else if (stats.points >= 50) { level = "مجتهد"; next = 100; }
  $("levelName").textContent = level;
  $("rewardMessage").textContent = next
    ? `مستواك ${level}. تحتاج ${next - stats.points} نقطة للمستوى التالي.`
    : "وصلت إلى أعلى مستوى! استمر في الاجتهاد 🌟";
}

/* Quran daily progress */
let quran = load("studyBuddyQuran", { date: todayKey(), target: 5, read: 0 });
if (!quran || typeof quran !== "object") quran = { date: todayKey(), target: 5, read: 0 };
if (quran.date !== todayKey()) quran = { date: todayKey(), target: Number(quran.target) || 5, read: 0 };
$("quranTarget").value = quran.target;
$("quranRead").value = quran.read;
function renderQuran() {
  const target = Math.max(1, Math.min(604, Number($("quranTarget").value) || 5));
  const read = Math.max(0, Math.min(604, Number($("quranRead").value) || 0));
  $("quranProgress").style.width = `${Math.min(100, read / target * 100)}%`;
  $("quranMessage").textContent = read >= target
    ? "ما شاء الله! حققت وردك اليومي. تقبّل الله منك 🌿"
    : `قرأت ${read} من ${target} صفحات. باقي ${Math.max(0, target-read)} صفحة.`;
}
$("saveQuran").addEventListener("click", () => {
  quran = {
    date: todayKey(),
    target: Math.max(1, Math.min(604, Number($("quranTarget").value) || 5)),
    read: Math.max(0, Math.min(604, Number($("quranRead").value) || 0))
  };
  save("studyBuddyQuran", quran);
  renderQuran();
});
$("quranTarget").addEventListener("change", renderQuran);
$("quranRead").addEventListener("change", renderQuran);

/* Skill progress */
let skill = load("studyBuddySkill", { date: todayKey(), name: "البرمجة", target: 30, done: 0 });
if (!skill || typeof skill !== "object") skill = { date: todayKey(), name: "البرمجة", target: 30, done: 0 };
if (skill.date !== todayKey()) skill = { date: todayKey(), name: skill.name || "البرمجة", target: Number(skill.target) || 30, done: 0 };
$("skillName").value = skill.name;
$("skillMinutes").value = skill.target;
$("skillDone").value = skill.done;
function renderSkill() {
  const target = Math.max(5, Math.min(300, Number($("skillMinutes").value) || 30));
  const done = Math.max(0, Math.min(300, Number($("skillDone").value) || 0));
  $("skillProgress").style.width = `${Math.min(100, done / target * 100)}%`;
  $("skillMessage").textContent = done >= target
    ? `أحسنت! حققت هدفك اليوم في ${$("skillName").value}.`
    : `أنجزت ${done} من ${target} دقيقة في ${$("skillName").value}.`;
}
$("saveSkill").addEventListener("click", () => {
  skill = {
    date: todayKey(),
    name: $("skillName").value,
    target: Math.max(5, Math.min(300, Number($("skillMinutes").value) || 30)),
    done: Math.max(0, Math.min(300, Number($("skillDone").value) || 0))
  };
  save("studyBuddySkill", skill);
  renderSkill();
});
["skillName", "skillMinutes", "skillDone"].forEach(id => $(id).addEventListener("change", renderSkill));

/* Prayer times for Giza, Egypt using AlAdhan API.
   API values are displayed as returned; calculation conventions can vary. */
const prayerNames = {
  Fajr: "الفجر", Sunrise: "الشروق", Dhuhr: "الظهر",
  Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء"
};
let prayerData = [];
let prayerAlertKey = load("studyBuddyPrayerAlertKey", "");
let prayerPoll = null;

function formatPrayerTime(value) {
  if (!value) return "--:--";
  const clean = String(value).split(" ")[0];
  const parts = clean.split(":");
  if (parts.length < 2) return clean;
  const hour = Number(parts[0]), minute = Number(parts[1]);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function prayerDateString() {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  }).format(new Date());
}
async function loadPrayerTimes() {
  $("prayerDate").textContent = prayerDateString();
  $("prayerTimes").replaceChildren();
  $("prayerTimes").textContent = "جارٍ تحميل المواقيت...";
  try {
    const now = new Date();
    const date = `${String(now.getDate()).padStart(2,"0")}-${String(now.getMonth()+1).padStart(2,"0")}-${now.getFullYear()}`;
    const url = `https://api.aladhan.com/v1/timingsByCity/${date}?city=Giza&country=Egypt&method=5`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Prayer API unavailable");
    const data = await response.json();
    if (data.code !== 200 || !data.data?.timings) throw new Error("No timings");
    prayerData = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"].map(key => ({
      key, name: prayerNames[key], time: String(data.data.timings[key]).split(" ")[0]
    }));
    $("prayerDate").textContent = data.data.date?.readable || prayerDateString();
    renderPrayerTimes();
  } catch {
    $("prayerTimes").textContent = "تعذر تحميل المواقيت. تحقق من اتصال الإنترنت ثم أعد فتح الصفحة.";
    $("nextPrayer").textContent = "المواقيت تحتاج إلى اتصال بالإنترنت.";
  }
}
function renderPrayerTimes() {
  const wrap = $("prayerTimes");
  wrap.replaceChildren();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const prayerMinutes = prayerData.map(p => {
    const [h,m] = p.time.split(":").map(Number);
    return { ...p, mins: h * 60 + m };
  });
  let next = prayerMinutes.find(p => p.key !== "Sunrise" && p.mins > currentMinutes);
  let nextDay = false;
  if (!next) {
    next = prayerMinutes.find(p => p.key === "Fajr") || prayerMinutes[0];
    nextDay = true;
  }
  prayerMinutes.forEach(p => {
    const item = document.createElement("div");
    item.className = "prayer-item" + (p.key === next.key ? " next" : "");
    const name = document.createElement("span");
    name.textContent = p.name;
    const time = document.createElement("strong");
    time.textContent = formatPrayerTime(p.time);
    item.append(name, time);
    wrap.appendChild(item);
  });
  const nextDate = new Date();
  const [nh,nm] = next.time.split(":").map(Number);
  nextDate.setHours(nh,nm,0,0);
  if (nextDay) nextDate.setDate(nextDate.getDate()+1);
  const diff = Math.max(0, nextDate.getTime() - now.getTime());
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  $("nextPrayer").textContent = `الصلاة القادمة: ${next.name} — بعد ${hrs} ساعة و${mins} دقيقة`;
}
function checkPrayerAlert() {
  if (!prayerData.length || !("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date();
  const current = `${todayKey()}-${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const match = prayerData.find(p => {
    const [h,m] = p.time.split(":").map(Number);
    return h === now.getHours() && m === now.getMinutes() && p.key !== "Sunrise";
  });
  if (match && prayerAlertKey !== current) {
    notify(`حان وقت صلاة ${match.name}`, "تقبّل الله منك. خذ استراحة للصلاة.");
    prayerAlertKey = current;
    save("studyBuddyPrayerAlertKey", prayerAlertKey);
  }
}
$("prayerNotify").addEventListener("click", async () => {
  if (!("Notification" in window)) {
    $("prayerMessage").textContent = "المتصفح لا يدعم الإشعارات. يمكنك متابعة المواقيت داخل الموقع.";
    return;
  }
  try {
    const permission = await Notification.requestPermission();
    $("prayerMessage").textContent = permission === "granted"
      ? "تم السماح بالإشعارات. اترك الموقع مفتوحًا للحصول على التنبيه."
      : "لم يتم السماح بالإشعارات. يمكنك تفعيلها من إعدادات المتصفح.";
  } catch {
    $("prayerMessage").textContent = "تعذر طلب إذن الإشعارات من هذا المتصفح.";
  }
});
loadPrayerTimes();
prayerPoll = setInterval(() => {
  renderPrayerTimes();
  checkPrayerAlert();
}, 30000);

/* Initial render */
function refreshDailyData() {
  if (quran.date !== todayKey()) {
    quran = { date: todayKey(), target: Number(quran.target) || 5, read: 0 };
    save("studyBuddyQuran", quran);
    $("quranTarget").value = quran.target;
    $("quranRead").value = 0;
  }
  if (skill.date !== todayKey()) {
    skill = { date: todayKey(), name: skill.name || "البرمجة", target: Number(skill.target) || 30, done: 0 };
    save("studyBuddySkill", skill);
    $("skillName").value = skill.name;
    $("skillMinutes").value = skill.target;
    $("skillDone").value = 0;
  }
  renderQuran();
  renderSkill();
}
renderTasks();
renderSchedule();
renderQuran();
renderSkill();
renderStats();
renderRewards();
displayTime();
setInterval(refreshDailyData, 60000);
