(() => {
  "use strict";
  const deck = [
    { word: "careful", options: ["حذر", "سريع", "جائع", "متأخر"], answer: 0, example: "Be careful when you cross the street." },
    { word: "improve", options: ["ينسى", "يتحسن", "يختار", "يصل"], answer: 1, example: "Practice every day to improve your English." },
    { word: "borrow", options: ["يستعير", "يبيع", "يبني", "يصلح"], answer: 0, example: "Can I borrow your pen?" },
    { word: "quiet", options: ["صاخب", "هادئ", "مظلم", "بعيد"], answer: 1, example: "The library is a quiet place." },
    { word: "choose", options: ["يشرح", "يختار", "يبدأ", "يستمر"], answer: 1, example: "Choose the best answer." },
    { word: "enough", options: ["كافٍ", "مبكر", "فارغ", "ضعيف"], answer: 0, example: "We have enough time to finish." }
  ];
  let current = -1, locked = false;
  const $ = id => document.getElementById(id);
  function next() {
    current = (current + 1) % deck.length; locked = false; const item = deck[current]; $("word-card").hidden = false; $("word-text").textContent = item.word; $("word-feedback").textContent = "";
    const options = $("word-options"); options.replaceChildren(); item.options.forEach((value,index) => { const button=document.createElement("button"); button.type="button"; button.className="answer-option"; button.textContent=value; button.addEventListener("click",()=>{if(locked)return;locked=true;const right=index===item.answer;button.classList.add(right?"correct":"incorrect");[...options.children].forEach((node,i)=>{node.disabled=true;if(i===item.answer)node.classList.add("correct");});$("word-feedback").textContent=`${right?"مظبوط!":"الإجابة الصحيحة: "+item.options[item.answer]+"."} ${item.example}`;}); options.append(button); });
    $("word-next").textContent="كلمة تانية ↻";
  }
  $("word-next").addEventListener("click",next);
})();

