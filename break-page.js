(() => {
  "use strict";
  const $ = id => document.getElementById(id); let studying = true, running = false, remaining = 25 * 60, endAt = 0, interval = 0;
  const readStats = () => { try { const s = JSON.parse(localStorage.getItem("studyBuddyData") || "{}"); return { sessions: Number(s.sessions) || 0, points: Number(s.points) || 0, minutes: Number(s.minutes) || 0 }; } catch { return { sessions: 0, points: 0, minutes: 0 }; } };
  const duration = () => Math.min(studying ? 180 : 60, Math.max(1, Number(studying ? $("study-length").value : $("rest-length").value) || (studying ? 25 : 5))) * 60;
  function updateStats() { const s = readStats(); $("timer-sessions").textContent = new Intl.NumberFormat("ar-EG").format(s.sessions); $("timer-points").textContent = new Intl.NumberFormat("ar-EG").format(s.points); $("timer-minutes").textContent = new Intl.NumberFormat("ar-EG").format(s.minutes); }
  function paint() { const mins = Math.floor(remaining / 60), secs = remaining % 60, text = `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`; $("break-timer").textContent = text; document.title = `${text} | قِمّة`; const total = duration(); $("timer-progress").style.width = `${Math.min(100,Math.max(0,(total-remaining)/total*100))}%`; $("timer-mode").textContent = studying ? "🎯 وقت المذاكرة" : "☕ وقت الاستراحة"; $("timer-start").textContent = running ? "المؤقت شغّال" : studying ? "ابدأ المذاكرة" : "ابدأ الاستراحة"; }
  function stop() { clearInterval(interval); interval = 0; running = false; }
  function notify(title, body) { if ("Notification" in window && Notification.permission === "granted") new Notification(title,{body}); }
  function finishPhase() {
    stop();
    if (studying) { const s = readStats(); s.sessions++; s.points += 10; s.minutes += Math.min(180,Math.max(1,Number($("study-length").value)||25)); try { localStorage.setItem("studyBuddyData",JSON.stringify(s)); } catch {} updateStats(); $("timer-status").textContent = "عاش! خلصت جلسة وكسبت ١٠ نقاط. وقت راحة قصيرة."; notify("أحسنت! 🎉","خلصت جلسة مذاكرة. خد استراحتك."); studying = false; }
    else { $("timer-status").textContent = "خلصت الاستراحة — جاهز تبدأ جلسة جديدة؟"; notify("انتهت الراحة","ارجع لهدفك وابدأ جلسة جديدة."); studying = true; }
    remaining = duration(); paint();
  }
  $("timer-start").addEventListener("click", async () => { if (running) return; if ("Notification" in window && Notification.permission === "default") { try { await Notification.requestPermission(); } catch {} } running = true; endAt = Date.now() + remaining * 1000; $("timer-status").textContent = studying ? "ركّز في هدفك وأبعد المشتتات 💪" : "اشرب مية واتحرك شوية، وبعدها ارجع بنشاط."; paint(); interval = window.setInterval(() => { remaining = Math.max(0,Math.ceil((endAt-Date.now())/1000)); paint(); if (remaining <= 0) finishPhase(); },250); });
  $("timer-pause").addEventListener("click", () => { if (!running) return; remaining = Math.max(0,Math.ceil((endAt-Date.now())/1000)); stop(); paint(); $("timer-status").textContent = "المؤقت اتوقف مؤقتًا."; });
  $("timer-reset").addEventListener("click", () => { stop(); studying = true; remaining = duration(); paint(); $("timer-status").textContent = "المؤقت جاهز لجلسة جديدة."; });
  ["study-length","rest-length"].forEach(id => $(id).addEventListener("change",()=>{ const input=$(id),max=id==="study-length"?180:60; input.value=String(Math.min(max,Math.max(1,Number(input.value)|| (id==="study-length"?25:5)))); if(!running){remaining=duration();paint();} }));
  updateStats(); paint();
})();

