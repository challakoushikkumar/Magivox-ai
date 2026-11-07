import { requestMAGIVOXAI, canConnect, conversationHistory as chatHistory, isAIQuotaError, AI_UNAVAILABLE_MESSAGE } from "./ai-core.js";
import { escapeHTML as e, downloadText, printNotes, speak } from "./studio-utils.js";
import { mountRecorder } from "./voice-recorder.js";
import { readResume } from "./resume-reader.js";
import { COURSES, getCourse } from "./course-catalog.js";
import { analyzeResumeDocument } from './resume-engine.js';

const LANGUAGES = ["English", "Telugu", "Telugu (English letters)", "Hindi"];
let activeController;
function shell({ container, user, profile }, title, content) {
  activeController?.abort();
  window.speechSynthesis?.cancel();
  activeController = new AbortController();
  const signal = activeController.signal;
  window.addEventListener("pagehide", () => activeController.abort(), { once: true });
  const preferred = LANGUAGES.includes(profile.preferredLanguage) ? profile.preferredLanguage : "English";
  container.innerHTML = `<section class="studio" aria-label="${e(title)}">
    <div class="studio-toolbar"><div><h2>${e(title)}</h2><p>One step at a time. Learn, practise and ask again.</p></div>
    <label>Response language<select id="studioLanguage" class="tool-select">${LANGUAGES.map(l => `<option ${preferred === l ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
    <div class="service-message" role="status">${!canConnect() ? "AI is not connected yet. You can record your voice and preview your resume here." : !user ? 'Log in to ask AI. <a href="login.html">Log in</a>' : "Live AI is ready when your backend access is enabled. Your first request checks the connection."}</div>
    ${content}</section>`;
  const language = () => container.querySelector("#studioLanguage").value;
  return { signal, language, el: selector => container.querySelector(selector) };
}
const consent = (id, action) => `<label class="consent-line"><input id="${id}" type="checkbox"> ${action} to Google through Firebase AI Logic for AI processing. MAGIVOX does not save this text to my profile.</label>`;
const feedbackList = values => `<ul>${values.map(v => `<li>${e(v)}</li>`).join("")}</ul>`;
function message(element, value, isError = false) { element.textContent = value; element.classList.toggle("error", isError); }
function safePrint(title, content, status) { try { printNotes(title, content); } catch (error) { message(status, error.message, true); } }
function localResumeFeedback(review) {
  return `<section class="tool-panel feedback-panel"><p class="eyebrow">LOCAL RESUME CHECK</p><div class="score-header"><div><h3>${e(review.status)}</h3><p>This review uses MAGIVOX's local resume checks while Advanced AI is unavailable.</p></div><strong class="practice-score">${review.atsScore}<small>/100 ATS</small></strong></div><div class="resume-metrics"><article><span>Resume readiness</span><strong>${review.readiness}/100</strong></article>${Object.entries(review.metrics).map(([key,value])=>`<article><span>${e(key.replace(/([A-Z])/g,' $1'))}</span><strong>${value}/100</strong></article>`).join('')}</div><h4>Detected content</h4><p><strong>Skills:</strong> ${e(review.skillsDetected.join(', ')||'No catalogue skills confidently detected')}</p><p><strong>Projects:</strong> ${review.projectsDetected?'Detected':'Not detected'} · <strong>Experience:</strong> ${review.experienceDetected?'Detected':'Not detected'} · <strong>Education:</strong> ${review.educationDetected?'Detected':'Not detected'}</p><h4>What to improve</h4>${feedbackList([...review.missingSections,...review.weakSections])}<h4>Formatting reminder</h4>${feedbackList(review.formattingIssues)}<p class="tool-muted">Your resume text remains editable above. Retry later for advanced rewriting, detailed grammar corrections and job-fit feedback.</p></section>`;
}

export { mountTeacher } from './teacher.js';

export { mountInterview } from './interview-studio.js';

export function mountResume(context) {
  const ui = shell(context, "Review your resume", `
    <form id="resumeReviewForm">
      <div class="studio-two-columns">
        <section class="tool-panel"><label for="resumeFile">Upload your resume</label><input id="resumeFile" class="tool-input file-input" type="file" accept=".pdf,.docx,.txt">
          <p class="tool-muted">PDF, DOCX or TXT · up to 3 MB. Text is extracted in your browser. Scanned PDFs need selectable text.</p><p id="fileStatus" class="inline-message" role="status"></p>
          <label for="resumeDraft">Check and edit the extracted text</label><textarea id="resumeDraft" class="tool-textarea resume-draft" minlength="80" maxlength="22000" required placeholder="Or paste your resume text here. Remove details you do not want to share."></textarea>
        </section>
        <section class="tool-panel"><label for="resumeJobDescription">Job description <small>(optional)</small></label><textarea id="resumeJobDescription" class="tool-textarea resume-draft" maxlength="10000" placeholder="Paste a job description for feedback on relevant skills and gaps."></textarea>
          <label for="resumeQuestion">Question for Resume AI <small>(optional)</small></label><textarea id="resumeQuestion" class="tool-textarea" maxlength="1200" rows="3" placeholder="Example: How can I describe my Power BI project more clearly?"></textarea>
          <p class="tool-muted">The review checks extracted wording and content. It cannot inspect layout or verify your qualifications.</p>
          ${consent("resumeConsent", "Send the text shown here and the job description")}
          <button id="reviewResume" class="tool-button">Review my resume</button><p id="resumeStatus" class="inline-message" role="status"></p>
        </section>
      </div>
    </form><div id="resumeFeedback"></div>`);
  const { el, signal, language } = ui;
  let busy = false, fileSequence = 0, resumeHistory = [];
  el("#resumeFile").onchange = async event => {
    const file = event.target.files[0]; if (!file) return;
    const sequence = ++fileSequence; el("#reviewResume").disabled = true; message(el("#fileStatus"), "Reading the file locally…");
    try {
      const extracted = await readResume(file);
      if (signal.aborted || sequence !== fileSequence) return;
      el("#resumeDraft").value = extracted; el("#resumeConsent").checked = false;
      message(el("#fileStatus"), `${file.name}: text ready. Check it below before requesting a review.`);
    } catch (error) { if (!signal.aborted && sequence === fileSequence) message(el("#fileStatus"), error.message || "Could not read this file. Paste your resume text instead.", true); }
    finally { if (!signal.aborted && sequence === fileSequence) el("#reviewResume").disabled = busy; }
  };
  el("#resumeReviewForm").onsubmit = async event => {
    event.preventDefault(); if (busy) return;
    const status = el("#resumeStatus");
    if (!el("#resumeConsent").checked) { message(status, "Tick the permission box before sending your resume text.", true); return; }
    busy = true; el("#reviewResume").disabled = true; message(status, "Reading your resume carefully…");
    try {
      const question=el('#resumeQuestion').value.trim();
      const result = await requestMAGIVOXAI('resumeReview', { resume:el('#resumeDraft').value, jobDescription:el('#resumeJobDescription').value, question, history:resumeHistory, language:language(), consent:true }, context.user, signal);
      if (signal.aborted) return;
      const localReview=analyzeResumeDocument(el('#resumeDraft').value,el('#resumeJobDescription').value);
      el("#resumeFeedback").innerHTML = `<section class="tool-panel feedback-panel"><p class="eyebrow">RESUME REVIEW</p><div class="score-header"><div><h3>${e(localReview.status)}</h3><p>${e(result.summary)}</p></div><strong class="practice-score">${localReview.atsScore}<small>/100 ATS</small></strong></div><div class="resume-metrics"><article><span>Resume readiness</span><strong>${localReview.readiness}/100</strong></article>${Object.entries(localReview.metrics).map(([key,value])=>`<article><span>${e(key.replace(/([A-Z])/g,' $1'))}</span><strong>${value}/100</strong></article>`).join('')}</div>
        <h4>Detected content</h4><p><strong>Skills:</strong> ${e(localReview.skillsDetected.join(', ')||'No catalogue skills confidently detected')}</p><p><strong>Projects:</strong> ${localReview.projectsDetected?'Detected':'Not detected'} · <strong>Experience:</strong> ${localReview.experienceDetected?'Detected':'Not detected'} · <strong>Education:</strong> ${localReview.educationDetected?'Detected':'Not detected'}</p><h4>Formatting limits</h4>${feedbackList(localReview.formattingIssues)}<h4>Weak or missing sections</h4>${feedbackList([...localReview.missingSections,...localReview.weakSections])}
        <h4>Strengths</h4>${feedbackList(result.strengths)}<h4>Suggested corrections</h4>
        ${result.issues.length ? result.issues.map(c => `<div class="correction"><p><strong>Original:</strong> ${e(c.original)}</p><p><strong>Suggestion:</strong> ${e(c.correction)}</p><p>${e(c.reason)}</p></div>`).join("") : "<p>No specific wording correction was returned.</p>"}
        <h4>Details to add if true</h4>${feedbackList(result.missingInformation)}
        <h4>Job fit</h4><p>${e(result.jobFit.summary)}</p><div class="studio-two-columns"><div><strong>Relevant skills</strong>${feedbackList(result.jobFit.matchedSkills)}</div><div><strong>Gaps to review</strong>${feedbackList(result.jobFit.gaps)}</div></div>
        <label for="revisedResume">Editable resume draft</label><textarea id="revisedResume" class="tool-textarea resume-draft">${e(result.revisedResume)}</textarea>
        <p class="tool-muted">Check every fact and replace placeholders. AI suggestions can be wrong. Your original file has not been changed.</p>
        <div class="tool-actions"><button id="downloadResume" class="tool-button">Download draft (.txt)</button><button id="printResume" class="tool-button-secondary">Print / save PDF</button></div><p id="exportStatus" role="status" class="inline-message"></p></section>`;
      el("#downloadResume").onclick = () => downloadText("reviewed-resume.txt", el("#revisedResume").value);
      el("#printResume").onclick = () => safePrint("Resume", el("#revisedResume").value, el("#exportStatus"));
      resumeHistory=chatHistory([...resumeHistory,{role:'user',content:question||'Review this resume.'},{role:'assistant',content:result.summary}],{maxMessages:8,maxCharacters:6000});
      message(status, "Review ready. Ask a follow-up or download the draft before leaving this page.");
    } catch (error) { if (!signal.aborted) { if (isAIQuotaError(error)) { const localReview=analyzeResumeDocument(el('#resumeDraft').value,el('#resumeJobDescription').value);el('#resumeFeedback').innerHTML=localResumeFeedback(localReview);message(status,AI_UNAVAILABLE_MESSAGE,true); } else message(status,error.message,true); } }
    finally { if (!signal.aborted) { busy = false; el("#reviewResume").disabled = false; } }
  };
}


