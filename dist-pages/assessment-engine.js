import { COURSES, getCourse } from "./course-catalog.js";
import { requestMAGIVOXAI, canConnect, AI_UNAVAILABLE_MESSAGE, isAIQuotaError } from "./ai-core.js";
import { escapeHTML as e } from "./studio-utils.js";
import { COURSE_POLICY, topicLearningState } from './course-learning-engine.js';

function sampleDistractors(course, topicIndex, field, fallback) {
  const values = course.topics.filter((_, i) => i !== topicIndex).map(t => field === "keywords" ? t.keywords[0] : t[field]).filter(Boolean);
  while (values.length < 3) values.push(fallback[values.length % fallback.length]);
  return values.slice(0, 3);
}
function shuffle(values, seed = 0) {
  const a = [...values];
  let x = (seed + 1) * 2654435761 >>> 0;
  for (let i = a.length - 1; i > 0; i--) { x = (x * 1664525 + 1013904223) >>> 0; const j = x % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function mcq(course, topicIndex, prompt, correct, distractors, explanation, seed) {
  const options = shuffle([correct, ...distractors], seed);
  return { kind: "mcq", topicIndex, prompt, options, answer: options.indexOf(correct), explanation };
}
function short(topicIndex,prompt, expected, keywords) { return { kind: "short", topicIndex, prompt, expected, keywords }; }

export function topicQuestions(course, topicIndex) {
  const t = course.topics[topicIndex];
  const fallback = ["A different workflow", "An unrelated concept", "A result that does not match the task"];
  const siblingSummary = sampleDistractors(course, topicIndex, "summary", fallback);
  const siblingUse = sampleDistractors(course, topicIndex, "useCase", fallback);
  const siblingMistake = sampleDistractors(course, topicIndex, "mistake", fallback);
  const siblingCheck = sampleDistractors(course, topicIndex, "check", fallback);
  const siblingKeyword = sampleDistractors(course, topicIndex, "keywords", ["unrelated", "random", "other"]);
  const base = topicIndex * 17 + course.id.length;
  return [
    mcq(course, topicIndex, `Which statement best describes “${t.title}”?`, t.summary, siblingSummary, t.summary, base + 1),
    mcq(course, topicIndex, `Which keyword is most closely connected to “${t.title}”?`, t.keywords[0], siblingKeyword, `Key terms include ${t.keywords.join(", ")}.`, base + 2),
    mcq(course, topicIndex, `When is “${t.title}” most useful?`, t.useCase, siblingUse, t.useCase, base + 3),
    mcq(course, topicIndex, `Which is a common mistake for this topic?`, t.mistake, siblingMistake, t.mistake, base + 4),
    mcq(course, topicIndex, `What should you verify after applying this topic?`, t.check, siblingCheck, t.check, base + 5),
    short(topicIndex,`In your own words, define “${t.title}”.`, t.summary, t.keywords.slice(0, 4)),
    short(topicIndex,`Give one practical example of “${t.title}”.`, t.example, [...t.keywords.slice(0, 3), ...t.example.toLowerCase().split(/\W+/).filter(w => w.length > 5).slice(0, 2)]),
    short(topicIndex,`For “${t.title}”, explain one common mistake and how you would avoid it.`, `${t.mistake} Avoid it by following: ${t.workflow}`, [...t.mistake.toLowerCase().split(/\W+/).filter(w => w.length > 5).slice(0, 3), ...t.keywords.slice(0, 2)]),
    short(topicIndex,`Write the main workflow/steps you would follow for “${t.title}”.`, t.workflow, [...t.workflow.toLowerCase().split(/\W+/).filter(w => w.length > 5).slice(0, 5)]),
    short(topicIndex,`Answer this like an interview question: “What is ${t.title} and why does it matter?”`, `${t.summary} ${t.useCase} Example: ${t.example}`, [...t.keywords.slice(0, 4), "example"])
  ];
}

export function topicTestQuestions(course,topicIndex,seed=Date.now()){return shuffle(topicQuestions(course,topicIndex),seed).slice(0,5);}
export function finalQuestions(course,seed=Date.now()) {
  return shuffle(course.topics.flatMap((_, index) => topicQuestions(course, index)),seed);
}

function localShortScore(question, answer) {
  const text = answer.toLowerCase().replace(/[^a-z0-9+#. ]/g, " ");
  const keys = [...new Set(question.keywords.map(k => String(k).toLowerCase()).filter(Boolean))];
  const hits = keys.filter(k => text.includes(k.toLowerCase())).length;
  let score = keys.length ? (hits / Math.min(keys.length, 4)) * 8 : 5;
  if (answer.trim().length >= 50) score += 1;
  if (answer.trim().length >= 100) score += 1;
  return Math.max(0, Math.min(10, Math.round(score)));
}
function gradeLocally(questions, answers) {
  return questions.map((q, i) => q.kind === "mcq"
    ? { index: i, score10: Number(answers[i]) === q.answer ? 10 : 0, feedback: Number(answers[i]) === q.answer ? "Correct." : q.explanation }
    : { index: i, score10: localShortScore(q, String(answers[i] || "")), feedback: "Local keyword-based estimate. Use AI review when connected for richer feedback." });
}
function percentFromGrades(grades) { return Math.round(grades.reduce((sum, g) => sum + g.score10, 0) / grades.length * 10); }

export function mountAssessments(context) {
  const { container } = context;
  const history = context.getAssessments();
  const params = new URLSearchParams(location.search);
  const requestedCourse = getCourse(params.get("course")) ? params.get("course") : COURSES[0].id;
  const requestedTopic = Math.max(0, Math.min(4, Number(params.get("topic") || 0)));
  container.innerHTML = `<section class="assessment-center">
    <div class="tool-section-heading"><div><p class="eyebrow">TOPIC TESTS + FINAL EXAMS</p><h2>MAGIVOX Exam Center</h2></div><p>Every topic test has 5 topic-matched questions. Every full course exam has 50 mixed questions.</p></div>
    <section class="tool-panel exam-launcher">
      <div class="studio-two-columns"><label>Course<select id="examCourse" class="tool-select">${COURSES.map(c=>`<option value="${e(c.id)}" ${c.id===requestedCourse?"selected":""}>${e(c.title)}</option>`).join("")}</select></label><label>Topic / module<select id="examTopic" class="tool-select"></select></label></div>
      <div class="tool-actions"><button id="startTopicExam" class="tool-button">Start 5-question topic test</button><button id="startFinalExam" class="tool-button-secondary">Start 50-question final exam</button></div><p id="finalUnlockNote" class="tool-muted"></p>
      <p class="tool-muted">Written answers can be AI-reviewed when the live AI backend is connected. Otherwise MAGIVOX uses a transparent local keyword rubric so practice still works offline.</p>
    </section>
    <div id="examStage"></div>
    <section class="tool-panel"><p class="eyebrow">SCORE HISTORY</p><h3>Recent attempts</h3><div id="examHistory"></div></section>
  </section>`;
  const el=s=>container.querySelector(s);
  const courseEl=el("#examCourse"), topicEl=el("#examTopic"), stage=el("#examStage");
  function updateLocks(){const c=getCourse(courseEl.value),record=context.getCourseLearning(c.id),eligibility=context.getCourseEligibility(c.id),topicIndex=Number(topicEl.value),topicState=topicLearningState(c,record,topicIndex);el('#startTopicExam').disabled=!topicState.testReady||topicState.locked;el('#startFinalExam').disabled=!eligibility.finalUnlocked;el('#finalUnlockNote').textContent=topicState.locked?topicState.reason:!topicState.testReady?'Complete the selected lesson and submit one practice answer before its topic test.':eligibility.finalUnlocked?'All lessons, practices and topic tests are complete. The 50-question final is unlocked.':`Topic test ready. Final locked: ${eligibility.lessons}/${eligibility.required} lessons, ${eligibility.practices}/${eligibility.required} practices and ${eligibility.tests}/${eligibility.required} tests passed.`;}
  function drawTopics(){ const c=getCourse(courseEl.value),record=context.getCourseLearning(c.id); topicEl.innerHTML=c.topics.map((t,i)=>{const state=topicLearningState(c,record,i);return `<option value="${i}" ${i===requestedTopic?"selected":""} ${state.locked?'disabled':''}>${i+1}. ${e(t.title)}${state.passed?' ✓':state.locked?' (Locked)':''}</option>`;}).join("");if(topicEl.selectedIndex<0)topicEl.selectedIndex=0;updateLocks(); }
  function drawHistory(){ const rows=context.getAssessments().slice(-12).reverse(); el("#examHistory").innerHTML=rows.length?rows.map(r=>`<article class="score-history-row"><div><strong>${e(r.courseTitle)}</strong><small>${e(r.label)} · ${new Date(r.date).toLocaleDateString()}</small></div><span class="tool-chip ${r.score>=COURSE_POLICY.topicPass?"success":""}">${r.score}%</span></article>`).join(""):"<p>No exam attempts yet.</p>"; }
  drawTopics(); drawHistory(); courseEl.onchange=drawTopics;topicEl.onchange=updateLocks;
  el("#startTopicExam").onclick=()=>start(false);
  el("#startFinalExam").onclick=()=>start(true);

  function start(finalMode){
    const course=getCourse(courseEl.value); const topicIndex=Number(topicEl.value),record=context.getCourseLearning(course.id); if(finalMode&&!context.getCourseEligibility(course.id).finalUnlocked)return;if(!finalMode&&!topicLearningState(course,record,topicIndex).testReady)return; const seed=crypto.getRandomValues(new Uint32Array(1))[0]; const questions=finalMode?finalQuestions(course,seed):topicTestQuestions(course,topicIndex,seed);
    const label=finalMode?"Final course exam":`Topic ${topicIndex+1}: ${course.topics[topicIndex].title}`;
    stage.innerHTML=`<form id="activeExam" class="quiz-form"><section class="tool-panel exam-header"><div><p class="eyebrow">${finalMode?"50-QUESTION FINAL":"5-QUESTION TOPIC TEST"}</p><h3>${e(course.title)} - ${e(label)}</h3><p>${questions.filter(q=>q.kind==='mcq').length} MCQs + ${questions.filter(q=>q.kind==='short').length} written questions · pass ${COURSE_POLICY.finalPass}%</p></div><div class="exam-timer"><span>Time</span><strong id="examClock">00:00</strong></div></section>${questions.map((q,i)=>q.kind==='mcq'?`<article class="tool-panel quiz-question"><h3>${i+1}. ${e(q.prompt)}</h3><div class="quiz-options">${q.options.map((o,j)=>`<label class="quiz-option"><input type="radio" name="q-${i}" value="${j}"><span>${e(o)}</span></label>`).join("")}</div></article>`:`<article class="tool-panel quiz-question"><h3>${i+1}. ${e(q.prompt)}</h3><textarea class="tool-textarea exam-answer" name="q-${i}" rows="4" minlength="8" maxlength="1500" placeholder="Write your answer in your own words."></textarea></article>`).join("")}<section class="tool-panel"><label class="consent-line"><input id="examAIReview" type="checkbox" ${canConnect()&&context.user?"":"disabled"}> Use AI to review written answers (requires signed-in live AI access)</label><div class="tool-actions"><button class="tool-button" type="submit">Submit exam</button><button id="cancelExam" class="tool-button-secondary" type="button">Cancel</button></div><p id="examStatus" class="inline-message" role="status"></p></section></form>`;
    const form=el("#activeExam"), status=el("#examStatus"); let seconds=0; const timer=setInterval(()=>{seconds++; const m=String(Math.floor(seconds/60)).padStart(2,"0"), s=String(seconds%60).padStart(2,"0"); el("#examClock").textContent=`${m}:${s}`;},1000);
    el("#cancelExam").onclick=()=>{clearInterval(timer); stage.innerHTML="";};
    form.onsubmit=async ev=>{ ev.preventDefault(); const fd=new FormData(form); const answers=questions.map((q,i)=>fd.get(`q-${i}`)); if(answers.some((a,i)=>questions[i].kind==='mcq'?a===null:String(a||'').trim().length<8)){status.textContent="Answer every question before submitting."; return;} form.querySelector('button[type="submit"]').disabled=true; status.textContent="Scoring your exam…"; let grades=gradeLocally(questions,answers); let method="Local rubric";
      if(el("#examAIReview").checked && canConnect() && context.user){
        try { const written=questions.map((q,i)=>({q,i,a:answers[i]})).filter(x=>x.q.kind==='short').map(x=>({index:x.i,question:x.q.prompt,answer:String(x.a),expected:x.q.expected,keywords:x.q.keywords})); const ai=await requestMAGIVOXAI('examReview',{course:course.title,label,written,language:context.profile.preferredLanguage||'English',consent:true},context.user); for(const r of ai.results){const g=grades.find(x=>x.index===r.index); if(g){g.score10=r.score10; g.feedback=r.feedback;}} method="AI + MCQ answer key"; } catch(err){ status.textContent=isAIQuotaError(err)?AI_UNAVAILABLE_MESSAGE:`${err.message} The deterministic local rubric was used.`; }
      }
      clearInterval(timer); const score=percentFromGrades(grades),topicBreakdown=Object.fromEntries(course.topics.map((t,ti)=>{const rows=grades.filter((_,i)=>questions[i].topicIndex===ti);return[ti,rows.length?Math.round(rows.reduce((s,g)=>s+g.score10,0)/rows.length*10):null];})),wrongCount=grades.filter(g=>g.score10<7).length; const record={id:crypto.randomUUID(),courseId:course.id,courseTitle:course.title,type:finalMode?'final':'topic',topicIndex:finalMode?null:topicIndex,label,score,method,seconds,date:new Date().toISOString(),topicBreakdown,wrongCount}; try{await context.saveAssessment(record); drawTopics();}catch(err){status.textContent="Score ready, but saving failed.";}
      const mcqCorrect=grades.filter((g,i)=>questions[i].kind==='mcq'&&g.score10===10).length,mcqTotal=questions.filter(q=>q.kind==='mcq').length,weak=Object.entries(topicBreakdown).filter(([,value])=>value!==null&&value<COURSE_POLICY.finalPass).map(([index,value])=>`${course.topics[index].title} (${value}%)`); stage.innerHTML=`<section class="tool-panel quiz-result"><p class="eyebrow">EXAM COMPLETE</p><div class="score-header"><div><h2>${e(course.title)}</h2><p>${e(label)} · ${e(method)} · ${Math.floor(seconds/60)}m ${seconds%60}s</p></div><strong class="practice-score">${score}<small>/100</small></strong></div><h3>${score>=COURSE_POLICY.finalPass?'PASS - strong progress':'Keep practising - review weak answers'}</h3><p>MCQ: ${mcqCorrect}/${mcqTotal}. Written answers are shown with feedback below.</p>${finalMode?`<h4>Weak-topic analysis</h4><p>${weak.length?e(weak.join(' · ')):'No topic scored below the pass mark in this attempt.'}</p>`:''}<div class="answer-review">${questions.map((q,i)=>`<article class="exam-review-item ${grades[i].score10>=7?'good':''}"><strong>${i+1}. ${e(q.prompt)}</strong><span>${grades[i].score10}/10</span>${q.kind==='mcq'?`<p>${Number(answers[i])===q.answer?'Correct.':`Your answer: ${e(q.options[Number(answers[i])]||'No answer')} | Correct: ${e(q.options[q.answer])}. ${e(q.explanation)}`}</p>`:`<p><b>Your answer:</b> ${e(String(answers[i]))}</p><p><b>Feedback:</b> ${e(grades[i].feedback)}</p><details><summary>Reference answer</summary><p>${e(q.expected)}</p></details>`}</article>`).join("")}</div><div class="tool-actions"><button id="retakeExam" class="tool-button-secondary">Retake</button><a class="tool-button" href="workspace.html?tool=assistant&lesson=${encodeURIComponent(course.title+' '+label+' weak areas')}">Revise with AI Teacher</a></div></section>`;
      if(!finalMode&&score>=COURSE_POLICY.topicPass){const next=document.createElement('a');next.className='tool-button';next.href=`workspace.html?tool=skills&course=${encodeURIComponent(course.id)}&topic=${Math.min(course.topics.length-1,topicIndex+1)}`;next.textContent=topicIndex<course.topics.length-1?'Continue to Next Topic':'Return to Course';stage.querySelector('.quiz-result .tool-actions').prepend(next);}
      el("#retakeExam").onclick=()=>start(finalMode); drawHistory();
    };
    stage.scrollIntoView({behavior:"smooth",block:"start"});
  }
}
