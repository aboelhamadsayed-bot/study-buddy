(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const stage = $("video-stage"), grade = $("video-grade"), system = $("video-system"), path = $("video-path"), subject = $("video-subject");
  const HISTORY_KEY = "qimmaVideoSearchHistoryV1";
  function readHistory() { try { const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); return Array.isArray(value) ? value.filter(x => x && typeof x.terms === "string" && typeof x.label === "string").slice(0,8) : []; } catch { return []; } }
  function renderHistory() {
    const host = $("video-history"); if (!host) return;
    const items = readHistory(); host.replaceChildren();
    if (!items.length) { const p = document.createElement("p"); p.textContent = "عمليات البحث اللي تعملها هتظهر هنا عشان ترجع لها بسرعة."; host.append(p); return; }
    items.forEach(item => {
      const row = document.createElement("div"); row.className = "video-history-item";
      const label = document.createElement("span"); label.textContent = item.label;
      const link = document.createElement("a"); link.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(item.terms); link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "افتح البحث ↗";
      row.append(label, link); host.append(row);
    });
  }
  renderHistory();
  $("clear-video-history")?.addEventListener("click", () => { try { localStorage.removeItem(HISTORY_KEY); } catch {} renderHistory(); });
  const grades = { prep: [["p1", "أولى إعدادي"], ["p2", "تانية إعدادي"], ["p3", "تالتة إعدادي"]], secondary: [["s1", "أولى ثانوي"], ["s2", "تانية ثانوي"], ["s3", "تالتة ثانوي"]] };
  const prepSubjects = ["اللغة العربية", "اللغة الإنجليزية", "الرياضيات", "العلوم", "الدراسات الاجتماعية", "تكنولوجيا المعلومات"];
  const generalSubjects = ["اللغة العربية", "اللغة الإنجليزية", "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "التاريخ", "الجغرافيا", "الفلسفة", "اللغة الأجنبية الثانية", "البرمجة والذكاء الاصطناعي"];
  const bacCommon = ["اللغة العربية", "اللغة الأجنبية الأولى", "التاريخ المصري"];
  const bacTracks = { medicine: ["الرياضيات", "الفيزياء"], engineering: ["الكيمياء", "البرمجة والذكاء الاصطناعي"], business: ["المحاسبة", "إدارة الأعمال"], arts: ["علم النفس", "اللغة الأجنبية الثانية"] };
  const fill = (select, options) => select.replaceChildren(...options.map(([value, label]) => { const option = document.createElement("option"); option.value = value; option.textContent = label; return option; }));
  function refresh() {
    const second = stage.value === "secondary" && grade.value === "s2", isBac = second && system.value === "bac";
    $("video-system-wrap").classList.toggle("hidden", !second); $("video-path-wrap").classList.toggle("hidden", !isBac);
    const subjects = stage.value === "prep" ? prepSubjects : isBac ? [...bacCommon, ...(bacTracks[path.value] || [])] : generalSubjects;
    fill(subject, subjects.map(value => [value, value]));
  }
  function refreshGrades() { fill(grade, grades[stage.value]); refresh(); }
  stage.addEventListener("change", refreshGrades); grade.addEventListener("change", refresh); system.addEventListener("change", refresh); path.addEventListener("change", refresh); refreshGrades();
  $("video-finder").addEventListener("submit", event => {
    event.preventDefault(); const gradeLabel = grade.selectedOptions[0]?.textContent || "", second = stage.value === "secondary" && grade.value === "s2", isBac = second && system.value === "bac";
    const systemLabel = isBac ? "البكالوريا المصرية" : "الثانوية العامة";
    const terms = [subject.value, gradeLabel, second ? systemLabel : "", isBac ? path.selectedOptions[0]?.textContent : "", $("video-lesson").value.trim(), "شرح منهج مصر"].filter(Boolean).join(" ");
    $("video-results-title").textContent = `بحث: ${subject.value} · ${gradeLabel}${second ? ` · ${systemLabel}` : ""}`;
    $("video-youtube").href = `https://www.youtube.com/results?search_query=${encodeURIComponent(terms)}`;
    try {
      const history = readHistory();
      const lesson = $("video-lesson").value.trim();
      const entry = { terms, label: subject.value + " · " + gradeLabel + (lesson ? " · " + lesson : "") };
      localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...history.filter(item => item.terms !== terms)].slice(0,8)));
    } catch {}
    renderHistory();
    $("video-results").hidden = false; $("video-results").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  function extractVideoId(raw) {
    let url; try { url = new URL(raw); } catch { return ""; }
    const host = url.hostname.toLowerCase().replace(/^www\./, ""); let id = "";
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] || "";
    else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v") || "";
      else if (/^\/(embed|shorts)\//.test(url.pathname)) id = url.pathname.split("/")[2] || "";
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
  }
  $("video-player-form").addEventListener("submit", event => {
    event.preventDefault(); const id = extractVideoId($("video-url").value.trim());
    if (!id) { $("video-status").textContent = "الرابط مش واضح. انسخ رابط فيديو يوتيوب كامل وجرب تاني."; $("video-status").dataset.kind = "error"; return; }
    $("video-status").textContent = "الفيديو جاهز — شغّله هنا وكمل في قِمّة."; $("video-status").dataset.kind = "success";
    $("video-player").src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
    $("player-title").textContent = "فيديو الشرح من يوتيوب"; $("video-player-panel").hidden = false;
    $("video-player-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("close-player").addEventListener("click", () => { $("video-player").src = ""; $("video-player-panel").hidden = true; });
})();

