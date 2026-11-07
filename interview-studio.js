import { requestMAGIVOXAI, AI_UNAVAILABLE_MESSAGE, isAIQuotaError } from './ai-core.js';
import { mountRecorder } from './voice-recorder.js';
import { escapeHTML as e, speakAsync, cancelSpeech, downloadText, printNotes } from './studio-utils.js';
import { INTERVIEW_MODES, COACH_TOPICS, METRICS, MAX_TURNS, createInterview, acceptTurn, skipTurn, retryLastAnswer, compareAttempt, sessionTranscript, validPracticeReport } from './interview-engine.js';
import { normalizeSpeechTranscript, assessSpeechReliability, logSpeechRecognition, UNCERTAIN_RECOGNITION_CONFIDENCE } from './speech-normalizer.js';

export function mountInterview(context) {
  const { container, user, profile } = context;
  let session = null, request = null, speechRequest = null, sequence = 0, voiceSequence = 0, busy = false, saving = false, recording = null, recorderControls;
  let mic = { opening: false, recording: false, transcribing: false }, report = null, saved = false;
  let voiceState = 'ready', voiceFailed = false, validationTimer = 0;
  const life = new AbortController();
  const kind = new URLSearchParams(location.search).get('practice') === 'coach' ? 'coach' : 'introduction';
  container.innerHTML = `<section class="studio interview-studio"><header class="interview-welcome"><div><p class="eyebrow">SPEAK • REFLECT • IMPROVE</p><h2>Your next interview starts here.</h2><p>A real conversation, one question at a time.</p></div><span class="tool-chip" id="sessionPhase">Ready to practise</span></header>
    <section class="tool-panel interview-setup"><div class="interview-settings"><label>Practice<select id="interviewKind" class="tool-select"><option value="introduction">Self-Introduction English AI</option><option value="mock">Mock Interview</option><option value="coach">English Communication Coach</option></select></label><label>Mode / focus<select id="interviewMode" class="tool-select"></select></label><label>Level<select id="interviewLevel" class="tool-select"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Target role<input id="interviewRole" class="tool-input" maxlength="100" value="${e(profile.targetRole || 'Exploring careers')}"></label></div>
    <label class="consent-line"><input id="interviewConsent" type="checkbox"> Send my answers, session context and transcribed microphone recordings to Google through Firebase AI Logic for conversation and speech feedback.</label><label class="consent-line"><input id="interviewSave" type="checkbox" checked> Save the final feedback report, including corrected sentences and my improved introduction, to my interview history. Raw audio and full transcripts are not saved.</label><div class="tool-actions"><button type="button" id="startInterview" class="tool-button">Start interview</button><label class="consent-line voice-toggle"><input id="interviewMic" type="checkbox" checked> Mic on</label><label class="consent-line voice-toggle"><input id="interviewMuteVoice" type="checkbox"> Mute AI voice</label></div><p class="tool-muted">Voice mode is automatic: speak after the AI finishes, then pause briefly. Your answer is transcribed and sent without a Send click. Turn the mic off to use the typed fallback.</p></section>
    <div class="interview-layout"><section class="tool-panel interview-conversation"><header class="chat-header"><strong id="interviewQuestionHeading">Your conversation</strong><div class="voice-cycle"><span id="voiceCycleDot" aria-hidden="true"></span><strong id="voiceCycleState">Ready</strong></div><span id="turnCounter">0 answers</span></header><div id="interviewTranscript" class="interview-transcript" role="log" aria-live="polite"><p class="chat-empty">Choose your practice and press Start. Your interviewer will ask the first question in English.</p></div><form id="interviewAnswerForm"><label for="interviewAnswer">Typed fallback / captured transcript</label><textarea id="interviewAnswer" class="tool-textarea" maxlength="2000" rows="4" placeholder="Your spoken transcript appears here automatically…" disabled></textarea><p id="answerSource" class="tool-muted">Voice-first mode is ready.</p><div id="speechComparison" class="speech-comparison" hidden><p><strong>Raw transcript:</strong> <span data-raw-speech></span></p><p><strong>Final transcript:</strong> <span data-final-speech></span></p><p><strong>Validated transcript:</strong> <span data-corrected-speech></span></p></div><div class="tool-actions"><button id="sendInterviewAnswer" class="tool-button" disabled>Send typed answer</button></div></form><div class="tool-actions interview-controls"><button type="button" id="pauseInterview" class="tool-button-secondary" disabled>Pause</button><button type="button" id="retryInterviewAnswer" class="tool-button-secondary" disabled>Retry Answer</button><button type="button" id="skipInterview" class="tool-button-secondary" disabled>Skip question</button><button type="button" id="endInterview" class="tool-button-secondary" disabled>End Interview</button></div><p class="tool-muted">Retry Answer replaces the last submitted turn. End Interview reviews your completed answers; at least two are needed for a score. Sessions allow up to ${MAX_TURNS} questions.</p><p id="interviewStatus" class="inline-message" role="status"></p></section>
    <aside class="interview-side"><section class="tool-panel"><h3>Speak your answer</h3><div id="interviewRecorder"></div></section><section class="tool-panel"><h3>A useful practice rhythm</h3><p>Answer the question, give one true example, and leave room for a follow-up.</p><p>For English coaching, try the correction aloud in your next answer.</p><a href="workspace.html?tool=assistant">Review a topic with your Teacher →</a></section></aside></div>
    <section id="interviewReport" class="tool-panel" hidden></section><section class="tool-panel interview-history"><h3>Your practice history</h3><p class="tool-muted">Your latest 20 saved attempts. Comparisons use the same practice, mode, role, level and scoring version.</p><div id="interviewHistory"></div></section></section>`;
  const el = selector => container.querySelector(selector);
  const status = (text, error = false) => { el('#interviewStatus').textContent = text; el('#interviewStatus').classList.toggle('error', error); };
  const history = () => context.getInterviews?.() || [];
  const micBusy = () => mic.opening || mic.recording || mic.transcribing;
  const micOn = () => el('#interviewMic').checked;
  const voiceMuted = () => el('#interviewMuteVoice').checked;
  el('#interviewKind').value = kind;
  function drawModes() {
    const selected = el('#interviewKind').value;
    el('#interviewMode').innerHTML = (selected === 'coach' ? COACH_TOPICS : selected === 'introduction' ? ['HR'] : INTERVIEW_MODES.map(mode => mode.label)).map(label => `<option>${e(label)}</option>`).join('');
    el('#startInterview').textContent = selected === 'coach' ? 'Start coaching' : 'Start interview';
  }
  drawModes(); el('#interviewKind').onchange = drawModes;
  function update() {
    const active = session?.phase === 'active', ongoing = ['active', 'paused'].includes(session?.phase), full = (session?.turns.length || 0) >= MAX_TURNS;
    for (const id of ['interviewKind', 'interviewMode', 'interviewLevel', 'interviewRole', 'interviewConsent']) el(`#${id}`).disabled = ongoing || busy || saving;
    el('#startInterview').disabled = ongoing || busy || saving;
    el('#sendInterviewAnswer').disabled = !active || busy || micBusy() || full || !el('#interviewAnswer').value.trim();
    el('#interviewAnswer').disabled = !active || busy || micBusy() || full;
    el('#pauseInterview').disabled = !ongoing || saving;
    el('#pauseInterview').textContent = session?.phase === 'paused' ? 'Resume' : 'Pause';
    el('#retryInterviewAnswer').disabled = !ongoing || busy || mic.opening || mic.transcribing || !session.turns.length;
    el('#skipInterview').disabled = !active || busy || mic.opening || mic.transcribing || full;
    el('#endInterview').disabled = !ongoing || saving;
    const stateLabel = ({ listening: 'Listening...', thinking: 'Processing...', speaking: 'AI Speaking...', paused: 'Paused', ready: 'Ready' })[voiceState] || 'Ready';
    el('#voiceCycleState').textContent = stateLabel; el('#voiceCycleDot').dataset.state = voiceState;
    el('#sessionPhase').textContent = session?.phase === 'ended' ? 'Session ended' : stateLabel;
    const answered = session?.turns.filter(turn => !turn.skipped).length || 0;
    el('#turnCounter').textContent = `${answered} answered · ${session?.turns.length || 0}/${MAX_TURNS} questions`;
    recorderControls?.setEnabled(Boolean(active && !busy && !full && micOn() && voiceState !== 'speaking'));
  }
  function drawTranscript() {
    el('#interviewTranscript').replaceChildren();
    const add = (who, text, raw = '') => { const article = document.createElement('article'); article.className = `interview-bubble ${who === 'You' ? 'user' : 'assistant'}`; const label = document.createElement('strong'); label.textContent = who; const body = document.createElement('p'); body.textContent = text; article.append(label, body); if (raw && raw !== text) { const original = document.createElement('small'); original.className = 'speech-raw'; original.textContent = `Raw speech: ${raw}`; article.append(original); } el('#interviewTranscript').append(article); };
    for (const turn of session.turns) { add('MAGIVOX Interviewer', turn.question); add('You', turn.skipped ? '[Question skipped]' : turn.answer, turn.rawAnswer); add('MAGIVOX Interviewer', turn.feedback); }
    if (session.phase !== 'ended' && session.turns.length < MAX_TURNS) add('MAGIVOX Interviewer', session.question);
    if (session.turns.length >= MAX_TURNS && session.phase !== 'ended') add('MAGIVOX Interviewer', 'You have reached the session limit. End the interview to review your answers.');
    el('#interviewTranscript').scrollTop = el('#interviewTranscript').scrollHeight;
  }
  const invalidateSpeech = () => { voiceSequence++; clearTimeout(validationTimer); validationTimer = 0; speechRequest?.abort(); speechRequest = null; cancelSpeech(); recorderControls?.stop(); };
  const invalidate = () => { sequence++; request?.abort(); request = null; busy = false; invalidateSpeech(); };
  function clearAnswer() { el('#interviewAnswer').value = ''; recording = null; recorderControls?.reset(); el('#answerSource').textContent = micOn() ? 'Voice-first mode is ready.' : 'Mic is off. Type your answer below.'; el('#speechComparison').hidden = true; }
  async function beginListening() {
    if (session?.phase !== 'active' || busy || !micOn() || session.turns.length >= MAX_TURNS) { voiceState = session?.phase === 'paused' ? 'paused' : 'ready'; update(); return; }
    voiceState = 'listening'; update(); status(voiceFailed ? 'Listening... AI voice is unavailable, so follow the question in the transcript.' : 'Listening... speak your answer, then stop speaking.');
    const started = await recorderControls?.start();
    if (started === false && session?.phase === 'active') { voiceState = 'ready'; update(); status('The microphone could not start. Turn Mic off and use the typed answer box.', true); }
  }
  async function speakThenListen(text) {
    const token = ++voiceSequence;
    recorderControls?.stop();
    if (!voiceMuted()) {
      speechRequest = new AbortController(); voiceState = 'speaking'; update(); status('AI Speaking... the microphone is off until the AI finishes.');
      try { await speakAsync(text, 'English', { signal: speechRequest.signal }); voiceFailed = false; }
      catch (error) { if (error.name !== 'AbortError') { voiceFailed = true; status(`${error.message} The question is shown as text and the microphone will continue safely.`, true); } }
      finally { speechRequest = null; }
    }
    if (token !== voiceSequence || session?.phase !== 'active') return;
    await beginListening();
  }
  el('#startInterview').onclick = async () => {
    if (!user) { status('Log in to start an AI interview or coaching session.', true); return; }
    if (!el('#interviewConsent').checked) { status('Agree to AI processing before starting.', true); return; }
    if (session && !saved && session.turns.length && !confirm('Start a new session? Download or save your current report before continuing.')) return;
    invalidate(); report = null; saved = false;
    session = createInterview({ kind: el('#interviewKind').value, mode: el('#interviewMode').value, level: el('#interviewLevel').value, role: el('#interviewRole').value }, crypto.randomUUID());
    clearAnswer(); el('#interviewReport').hidden = true; drawTranscript(); update(); status('Starting your live voice conversation…');
    await speakThenListen(session.question);
  };
  async function submit(skipped = false, automaticAnswer = false) {
    if (session?.phase !== 'active' || busy || micBusy() || session.turns.length >= MAX_TURNS) return;
    const answer = el('#interviewAnswer').value.trim();
    if (!skipped && !answer) { status('Record and transcribe an answer, or type it before sending.', true); return; }
    if (skipped && answer && !confirm('Skip this question and discard the answer in the box?')) return;
    invalidateSpeech(); const token = ++sequence; request = new AbortController(); busy = true; voiceState = 'thinking'; update(); status(skipped ? 'Processing... finding another question.' : 'Processing... preparing one relevant follow-up.');
    let nextSpeech = '';
    try {
      const result = await requestMAGIVOXAI('interviewTurn', { settings: session.settings, turns: session.turns, question: session.question, answer: skipped ? '' : answer, skipped, ...(!skipped && recording?.assessment ? { audioAssessment: recording.assessment } : !skipped && recording?.base64 ? { recording } : {}), consent: true }, user, request.signal);
      if (life.signal.aborted || token !== sequence || session.phase !== 'active') return;
      if (skipped) skipTurn(session, result); else acceptTurn(session, answer, result, recording ? 'recorded' : 'typed', recording?.recognition?.rawTranscript || answer, recording?.recognition || null);
      clearAnswer(); drawTranscript();
      nextSpeech = `${result.feedback} ${session.turns.length < MAX_TURNS ? result.question : 'You have reached the session limit. End the interview when you are ready for your report.'}`;
    } catch (error) { if (!life.signal.aborted && token === sequence) status(isAIQuotaError(error) ? AI_UNAVAILABLE_MESSAGE : `${error.message} Your answer has been kept. ${automaticAnswer ? 'Use Finish answer or the typed fallback to retry.' : 'Press Send typed answer to retry.'}`, true); }
    finally { if (!life.signal.aborted && token === sequence) { busy = false; voiceState = 'ready'; update(); } }
    if (nextSpeech && !life.signal.aborted && token === sequence) await speakThenListen(nextSpeech);
  }
  el('#interviewAnswerForm').onsubmit = event => { event.preventDefault(); submit(); };
  el('#skipInterview').onclick = () => { recorderControls?.stop(); submit(true); };
  el('#pauseInterview').onclick = () => {
    if (!session || !['active', 'paused'].includes(session.phase)) return;
    if (session.phase === 'paused') { session.phase = 'active'; voiceState = 'ready'; update(); status('Resumed. The interviewer will repeat the current question.'); void speakThenListen(session.question); return; }
    else { invalidate(); session.phase = 'paused'; voiceState = 'paused'; status('Paused. Microphone and AI voice are off. Your submitted answers and draft are kept.'); }
    update();
  };
  el('#retryInterviewAnswer').onclick = () => {
    if (!session?.turns.length || busy || mic.opening || mic.transcribing) return;
    if (!confirm('Replace the last submitted turn? Its answer and feedback will be removed from this attempt.')) return;
    invalidate(); retryLastAnswer(session); clearAnswer(); drawTranscript(); voiceState = 'ready'; update(); status('Try the same question again. The replaced answer will not count toward the report.'); void speakThenListen(session.question);
  };
  el('#interviewMic').onchange = () => { if (!micOn()) { recorderControls?.reset(); if (voiceState !== 'speaking') voiceState = 'ready'; status('Mic is off. Type your answer and use Send typed answer.'); update(); } else if (session?.phase === 'active' && !busy && voiceState !== 'speaking') { clearAnswer(); void beginListening(); } };
  el('#interviewMuteVoice').onchange = () => { if (voiceMuted() && voiceState === 'speaking') { speechRequest?.abort(); } else if (!voiceMuted() && session?.phase === 'active' && !busy && voiceState !== 'speaking') { recorderControls?.stop(); void speakThenListen(session.question); } update(); };
  el('#interviewAnswer').addEventListener('input', update);

  const entry = () => ({ id: session.id, kind: session.settings.kind, mode: session.settings.mode, level: session.settings.level, role: session.settings.role, type: 'Conversational practice', date: session.endedAt, score: report?.score ?? null, answered: session.turns.filter(turn => !turn.skipped).length, total: session.turns.length, report });
  async function saveReport() {
    if (!report || saved || saving) return;
    saving = true; update(); el('#saveInterviewReport').disabled = true; el('#interviewSaveStatus').textContent = 'Saving feedback to interview history…';
    try {
      await context.saveInterview(entry()); saved = true; el('#interviewSaveStatus').textContent = 'Feedback saved to your account. Full transcript and raw audio were not stored.'; drawHistory();
    } catch { el('#interviewSaveStatus').textContent = 'The report is ready but could not be saved. Download it or retry Save report.'; }
    finally { saving = false; update(); el('#saveInterviewReport').disabled = saved; }
  }
  function reportText(value, item) {
    return `MAGIVOX ${item.kind} · ${item.mode} · ${item.level}\nOverall: ${value.score}/100\n${Object.entries(METRICS).map(([key, label]) => `${label}: ${value.metrics[key] ?? 'Not assessed'}`).join('\n')}\n\n${value.summary}\n\nMistakes\n${value.mistakes.join('\n')}\n\nCorrections\n${value.corrections.map(c => `${c.original} → ${c.corrected}\n${c.reason}`).join('\n')}\n\nBetter vocabulary\n${value.betterVocabulary.map(c => `${c.original} → ${c.suggested}: ${c.reason}`).join('\n')}\n\nFiller feedback\n${JSON.stringify(value.fillerFeedback)}\n\nStrong points\n${value.strongPoints.join('\n')}\n\nWeak points\n${value.weakPoints.join('\n')}\n\nImproved introduction\n${value.improvedIntroduction}\n\nImprovement plan\n${value.improvementPlan.join('\n')}\n\nPractice estimates, not hiring predictions. Speech ratings cover ${value.audioAnswers} recorded answers. Unassessed measures are excluded from the overall score.`;
  }
  function renderReport(value, item, current = false) {
    if (!validPracticeReport(value)) { el('#interviewReport').hidden = false; el('#interviewReport').textContent = 'This saved report is incomplete or uses an unsupported format. Your other history is available below.'; return; }
    const list = items => items.length ? `<ul>${items.map(text => `<li>${e(text)}</li>`).join('')}</ul>` : '<p>No specific evidence returned.</p>';
    const compared = compareAttempt(item, history());
    const comparison = compared ? `Text-based practice score ${value.textScore}/100: ${compared.delta > 0 ? '+' : ''}${compared.delta} points versus your previous matching attempt (${compared.previous.report.textScore}/100).` : 'No previous attempt with the same practice, mode, role, level and rubric yet.';
    el('#interviewReport').hidden = false;
    el('#interviewReport').innerHTML = `<header class="score-header"><div><p class="eyebrow">YOUR PRACTICE REVIEW</p><h3>${e(item.mode)} · ${e(item.level)}</h3><p>${e(value.summary)}</p></div><strong class="practice-score">${value.score}<small>/100 overall</small></strong></header><p class="interview-comparison">${e(comparison)}</p><div class="interview-metrics">${Object.entries(METRICS).map(([key, label]) => `<article><span>${e(label)}</span><strong>${value.metrics[key] === null ? 'Not assessed' : `${value.metrics[key]}/100`}</strong></article>`).join('')}</div><p class="tool-muted">Overall is the mean of assessed measures. Comparisons use the five text measures so adding audio does not distort improvement. Speech measures cover ${value.audioAnswers} of ${value.answered} answered turns and are AI estimates from recordings. Confidence describes audible delivery, not your inner confidence or personality. Pronunciation means intelligibility, not accent conformity. Missing speech evidence is excluded, never scored as zero.</p><div class="studio-two-columns"><div><h4>Strong points</h4>${list(value.strongPoints)}<h4>Weak points</h4>${list(value.weakPoints)}</div><div><h4>Mistakes</h4>${list(value.mistakes)}<h4>Filler-word feedback</h4><p>${Object.entries(value.fillerFeedback.counts).map(([word, count]) => `${e(word)}: ${count}`).join(' · ') || 'No tracked filler phrases in the submitted transcript.'}</p><p class="tool-muted">${e(value.fillerFeedback.note)}</p></div></div><h4>Corrected sentences</h4>${value.corrections.map(c => `<div class="correction"><p><strong>Your words:</strong> ${e(c.original)}</p><p><strong>Try:</strong> ${e(c.corrected)}</p><p>${e(c.reason)}</p></div>`).join('') || '<p>No evidence-backed sentence corrections returned.</p>'}<h4>Better vocabulary</h4>${list(value.betterVocabulary.map(c => `${c.original} → ${c.suggested}. ${c.reason}`))}<h4>Improved professional self-introduction</h4><p class="prose-text">${e(value.improvedIntroduction)}</p><p class="tool-muted">Check every fact and replace any placeholders with true details.</p><h4>Personalized improvement plan</h4>${list(value.improvementPlan)}<div class="tool-actions"><button class="tool-button-secondary" id="downloadInterviewReport">Download report</button><button class="tool-button-secondary" id="printInterviewReport">Print / Save PDF</button>${current ? '<button class="tool-button-secondary" id="downloadInterviewTranscript">Download transcript</button><button class="tool-button" id="saveInterviewReport">Save report to history</button>' : ''}</div><p id="interviewSaveStatus" role="status"></p>`;
    el('#downloadInterviewReport').onclick = () => downloadText('magivox-interview-report.txt', reportText(value, item));
    el('#printInterviewReport').onclick = () => { try { printNotes('MAGIVOX practice report', reportText(value, item)); } catch (error) { el('#interviewSaveStatus').textContent = error.message; } };
    if (current) { el('#downloadInterviewTranscript').onclick = () => downloadText('magivox-interview-transcript.txt', sessionTranscript(session)); el('#saveInterviewReport').onclick = saveReport; el('#saveInterviewReport').disabled = saved; }
  }
  async function finishReport() {
    if (busy || saving) return;
    const token = ++sequence; request = new AbortController(); busy = true; update(); status('Reviewing your complete conversation…');
    try {
      const result = await requestMAGIVOXAI('interviewReport', { settings:session.settings, turns:session.turns, consent:true }, user, request.signal);
      if (life.signal.aborted || token !== sequence) return;
      report = result; renderReport(report, entry(), true); status('Your report is ready. Review the feedback and improvement plan.');
      if (el('#interviewSave').checked) await saveReport();
    } catch (error) { if (!life.signal.aborted && token === sequence) { status(isAIQuotaError(error) ? AI_UNAVAILABLE_MESSAGE : `${error.message} Your transcript is still available.`, true); el('#interviewReport').hidden = false; el('#interviewReport').innerHTML = '<h3>Report not ready</h3><p>Your completed conversation is kept in this tab.</p><button id="retryInterviewReport" class="tool-button">Retry report</button><button id="downloadIncompleteTranscript" class="tool-button-secondary">Download transcript</button>'; el('#retryInterviewReport').onclick = finishReport; el('#downloadIncompleteTranscript').onclick = () => downloadText('magivox-interview-transcript.txt', sessionTranscript(session)); } }
    finally { if (!life.signal.aborted && token === sequence) { busy = false; update(); } }
  }
  el('#endInterview').onclick = () => {
    if (!session || !['active', 'paused'].includes(session.phase)) return;
    if ((el('#interviewAnswer').value.trim() || micBusy() || busy) && !confirm('End now? The current unsubmitted answer or recording will not be included.')) return;
    invalidate(); session.phase = 'ended'; session.endedAt = new Date().toISOString(); update(); clearAnswer(); drawTranscript();
    if (session.turns.filter(turn => !turn.skipped).length < 2) { status('Session ended. Answer at least two questions in your next attempt for a scored report. No score was saved.'); el('#interviewReport').hidden = false; el('#interviewReport').innerHTML = '<h3>Short practice completed</h3><p>There is not enough evidence for a multi-turn score.</p><button id="downloadShortTranscript" class="tool-button-secondary">Download transcript</button>'; el('#downloadShortTranscript').onclick = () => downloadText('magivox-practice-transcript.txt', sessionTranscript(session)); return; }
    finishReport();
  };
  function drawHistory() {
    const items = [...history()].reverse();
    el('#interviewHistory').innerHTML = items.length ? items.map((item, index) => `<article class="interview-history-row"><div><strong>${e(item.mode || item.role || 'Interview practice')}</strong><p>${e(item.kind || item.type || 'Earlier practice')} · ${e(item.level || '')} · ${e(new Date(item.date).toLocaleDateString())}</p></div><strong>${Number.isFinite(item.score) ? `${item.score}/100` : 'Unscored'}</strong>${item.report ? `<button type="button" class="tool-button-secondary" data-interview-history="${index}">View report</button>` : '<span class="tool-muted">Earlier score-only record</span>'}</article>`).join('') : '<p>No saved attempts yet. Finish a conversation to begin tracking your progress.</p>';
    container.querySelectorAll('[data-interview-history]').forEach(button => button.onclick = () => { if (busy || saving) return; if (session && session.phase !== 'ended') { status('End the current session before opening a previous report.'); return; } const item = items[Number(button.dataset.interviewHistory)]; renderReport(item.report, item); el('#interviewReport').scrollIntoView({ block: 'nearest' }); });
  }
  mountRecorder(el('#interviewRecorder'), { user, signal: life.signal, language: () => 'English', automatic: true, hasConsent: () => el('#interviewConsent').checked, recognitionPhrases: () => [profile.fullName, profile.fullName?.split(/\s+/)[0]], transcriptionContext: () => ({ profileName: profile.fullName || user.displayName || '', profileCity: profile.city || '', question: session?.question || '' }), shouldVerifyTranscript: (text, recognition) => { const normalized = normalizeSpeechTranscript(text, { profileName: profile.fullName || user.displayName || '' }); const reliability = assessSpeechReliability({ ...normalized, confidence: recognition.confidence, profileName: profile.fullName || user.displayName || '' }); return !reliability.reliable || (Number.isFinite(recognition.confidence) && recognition.confidence < UNCERTAIN_RECOGNITION_CONFIDENCE); }, onControls: controls => { recorderControls = controls; }, onRecordStart: () => { if (voiceState === 'speaking') invalidateSpeech(); }, onStateChange: state => { mic = state; if (state.recording) voiceState = 'listening'; else if (state.transcribing) voiceState = 'thinking'; else if (!busy && voiceState === 'thinking') voiceState = 'ready'; update(); }, onRecordingChange: () => { clearTimeout(validationTimer); validationTimer = 0; recording = null; }, onSpeechDraft: (text, final) => { if (session?.phase !== 'active' || busy) return; el('#interviewAnswer').value = text.slice(0, 2000); el('#answerSource').textContent = final ? 'Final speech transcript kept — automatic processing failed, so you can retry or send it manually.' : 'Listening... interim words are shown for confidence but only the final result will be submitted.'; update(); }, onTranscript: (text, audio) => {
    if (session?.phase !== 'active' || busy) return false;
    const recognition = audio.recognition || { rawTranscript: text, language: 'en-IN', confidence: null };
    const finalTranscript = recognition.finalTranscript || text;
    const normalized = normalizeSpeechTranscript(finalTranscript, { profileName: profile.fullName || user.displayName || '' });
    logSpeechRecognition({ ...normalized, final: finalTranscript, language: recognition.language, confidence: recognition.confidence });
    recording = { ...audio, recognition: { ...recognition, rawTranscript: recognition.rawTranscript || normalized.raw, finalTranscript, normalizedTranscript: normalized.corrected, correctedTranscript: normalized.corrected, corrections: normalized.changes } };
    el('#interviewAnswer').value = normalized.corrected.slice(0, 2000);
    el('[data-raw-speech]').textContent = recognition.rawTranscript || normalized.raw; el('[data-final-speech]').textContent = finalTranscript; el('[data-corrected-speech]').textContent = normalized.corrected; el('#speechComparison').hidden = false;
    const reliability = assessSpeechReliability({ ...normalized, confidence: recognition.confidence, profileName: profile.fullName || user.displayName || '' });
    if (!reliability.reliable) {
      el('#answerSource').textContent = 'I may not have heard that correctly. Please say that again. Your raw, final and validated transcripts are kept.';
      status('I may not have heard that correctly. Please say that again.', true); update(); return false;
    }
    el('#answerSource').textContent = normalized.changes.length ? `Final voice transcript corrected ${normalized.changes.length} high-confidence name/technical term${normalized.changes.length === 1 ? '' : 's'} — submitting automatically now.` : 'Final voice transcript — submitting automatically now.';
    console.info('Submitted transcript:', normalized.corrected);
    const uncertain = Number.isFinite(recognition.confidence) && recognition.confidence < UNCERTAIN_RECOGNITION_CONFIDENCE;
    status(uncertain ? 'Answer recognized. Review it briefly while MAGIVOX validates the final transcript…' : 'Processing... validated final transcript submitted automatically.'); update();
    validationTimer = setTimeout(() => { validationTimer = 0; submit(false, true); }, uncertain ? 1600 : 0); return true;
  } });
  window.addEventListener('pagehide', () => { life.abort(); invalidate(); }, { once: true });
  drawHistory(); update();
}
