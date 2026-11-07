import { requestMAGIVOXAI, AI_UNAVAILABLE_MESSAGE, isAIQuotaError } from './ai-core.js';
import { escapeHTML as e, downloadText, printNotes, speak } from './studio-utils.js';
import { COURSES, getCourse } from './course-catalog.js';
import { mountRecorder } from './voice-recorder.js';
import { TEACHER_ACTIONS, localTeacherLanguageIntent, teacherHistory, answerHTML } from './teacher-conversation.js';
import { listLearningItems, saveLearningItem, deleteLearningItem } from './learning-store.js';

const LANGUAGES = ['English', 'Telugu', 'Telugu (English letters)', 'Hindi'];
export function mountTeacher(context) {
  const { container, user, profile } = context;
  const controller = new AbortController(), signal = controller.signal;
  let messages = [], busy = false, saving = false, chatId = null, chats = [], notes = [], dirty = false, failedRequest = null, retryInFlight = false;
  const params = new URLSearchParams(location.search);
  const initialCourse = getCourse(params.get('course')) || getCourse('excel');
  const language = LANGUAGES.includes(profile.preferredLanguage) ? profile.preferredLanguage : 'English';
  container.innerHTML = `<section class="studio teacher-workspace" aria-label="MAGIVOX AI Teacher">
    <header class="teacher-welcome"><div><p class="eyebrow">YOUR PERSONAL LEARNING SPACE</p><h2>A little curiosity. A new skill.</h2><p>Ask freely, practise together, and learn at your pace.</p></div><span class="teacher-brand-orb" aria-hidden="true">✦</span></header>
    <div class="teacher-controls"><label>Course<select id="teacherCourse" class="tool-select">${COURSES.map(course => `<option value="${course.id}" ${course.id === initialCourse.id ? 'selected' : ''}>${e(course.title)}</option>`).join('')}</select></label><label>Topic<select id="teacherTopic" class="tool-select"></select></label><label>Level<select id="teacherLevel" class="tool-select"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Language<select id="teacherLanguage" class="tool-select">${LANGUAGES.map(item => `<option ${language === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label><label>Mode<select id="teacherMode" class="tool-select"><option>Teach</option><option>Doubt</option><option>Practice</option><option>Revision</option></select></label></div>
    <div class="teacher-grid"><aside class="teacher-library tool-panel"><button type="button" class="tool-button" id="newChat">＋ New chat</button><h3>Recent saved chats</h3><div id="teacherChats"><p class="tool-muted">${user ? 'Loading…' : 'Log in to save conversations.'}</p></div><h3>Saved notes</h3><div id="teacherNotes"></div><button class="text-action" id="reloadLibrary" type="button">Refresh saved items</button><p id="libraryStatus" role="status" class="inline-message"></p><a class="teacher-library-link" href="workspace.html?tool=skills">Browse courses →</a><a class="teacher-library-link" href="workspace.html?tool=support">Help & Support →</a></aside>
    <section class="tool-panel chat-panel"><header class="chat-header"><div><strong>MAGIVOX AI Teacher</strong><small id="teacherContextBadge"></small></div><label class="teacher-voice-toggle"><input type="checkbox" id="autoRead"> Read replies aloud</label></header>
    <div id="teacherMessages" class="teacher-messages" role="log" aria-live="polite"></div>
    <div class="teacher-quick-actions" aria-label="Learning actions">${TEACHER_ACTIONS.map(([label], index) => `<button type="button" data-action="${index}">${label}</button>`).join('')}</div>
    <form id="teacherForm" class="teacher-composer"><label for="teacherInput">Ask anything about your learning</label><textarea id="teacherInput" class="tool-textarea" maxlength="4000" rows="3" required placeholder="Ask MAGIVOX AI"></textarea><label class="consent-line"><input type="checkbox" id="chatConsent"> Send my question, recent conversation and selected lesson context to Google through Firebase AI Logic.</label><div class="tool-actions"><button class="tool-button" id="askTeacher">Send message ↑</button><button class="tool-button-secondary" type="button" id="retryTeacher" hidden>Retry</button><button class="text-action" type="button" id="stopReading">Stop reading</button></div><p id="teacherStatus" class="inline-message" role="status">${user ? 'Choose a topic or ask your first question.' : 'Log in to ask AI learning questions.'}</p></form></section>
    <aside class="teacher-insights"><section class="tool-panel"><p class="eyebrow">YOUR LEARNING PATH</p><h3 id="currentTopic"></h3><label for="teacherProgress">Topics passed</label><progress id="teacherProgress" max="100" value="0"></progress><p id="teacherProgressText"></p><h4>Next step</h4><p id="teacherNext"></p><a class="tool-button-secondary" id="openTopicTest" href="workspace.html?tool=exams">Try topic test</a><h4>Topics to revisit</h4><p id="teacherWeak"></p></section>
    <section class="tool-panel"><h3>Keep what you learn</h3><p class="tool-muted">Chats stay in this tab until you explicitly save them. Saved chats keep recent messages; download the full conversation before leaving.</p><div class="teacher-save-actions"><button class="tool-button-secondary" id="saveChat" disabled>Save chat to account</button><button class="tool-button-secondary" id="saveNote" disabled>Save latest reply as note</button><button class="text-action" id="downloadLesson" disabled>Download conversation</button><button class="text-action" id="printLesson" disabled>Print / Save PDF</button></div></section>
    <details class="tool-panel" id="voiceInput"><summary>Voice input</summary><div id="teacherRecorder"></div></details></aside></div>
    <section id="notePreview" class="tool-panel" hidden><div class="tool-section-heading"><h3 id="noteTitle"></h3><button class="text-action" id="closeNote">Close note</button></div><div id="noteBody"></div><button class="tool-button-secondary" id="downloadNote">Download note</button></section></section>`;
  const el = selector => container.querySelector(selector);
  const status = (text, error = false) => { el('#teacherStatus').textContent = text; el('#teacherStatus').classList.toggle('error', error); };
  const currentLanguage = () => el('#teacherLanguage').value;
  const course = () => getCourse(el('#teacherCourse').value);
  const topicIndex = () => Number(el('#teacherTopic').value);
  const transcript = () => messages.map(item => `${item.role === 'user' ? 'YOU' : 'MAGIVOX AI'}\n${item.content}`).join('\n\n');
  function drawTopics(index = 0) {
    const selected = Number.isInteger(index) && index >= 0 && index < course().topics.length ? index : 0;
    el('#teacherTopic').innerHTML = course().topics.map((topic, i) => `<option value="${i}" ${i === selected ? 'selected' : ''}>${i + 1}. ${e(topic.title)}</option>`).join(''); updateContext();
  }
  function updateContext() {
    const current = course(), topic = current.topics[topicIndex()];
    el('#teacherContextBadge').textContent = `${current.title} · ${topic.title}`; el('#currentTopic').textContent = topic.title;
    const passed = [...new Set(context.getPassedTopics?.(current.id) || [])].filter(i => Number.isInteger(i) && i >= 0 && i < current.topics.length);
    el('#teacherProgress').value = Math.round(passed.length / current.topics.length * 100);
    el('#teacherProgressText').textContent = `${passed.length} of ${current.topics.length} topics passed`;
    const next = current.topics.find((_, i) => !passed.includes(i));
    el('#teacherNext').textContent = next ? `Practise ${next.title}, then try its topic test.` : 'All topic tests passed. Revisit a difficult concept or prepare for the final exam.';
    const latest = new Map(); for (const attempt of context.getAssessments?.() || []) { if (attempt.courseId === current.id && attempt.type === 'topic') latest.set(attempt.topicIndex, attempt); }
    const weak = [...latest.values()].filter(item => item.score < 60).map(item => current.topics[item.topicIndex]?.title).filter(Boolean);
    el('#teacherWeak').textContent = weak.length ? weak.join(', ') : 'No weak topics identified from saved topic tests yet.';
    el('#openTopicTest').href = `workspace.html?tool=exams&course=${encodeURIComponent(current.id)}&topic=${topicIndex()}`;
  }
  drawTopics(Number(params.get('topic') || 0));
  function controls() {
    for (const selector of ['#teacherCourse', '#teacherTopic', '#teacherLevel', '#teacherLanguage', '#teacherMode', '#newChat']) el(selector).disabled = busy || saving;
    el('#askTeacher').disabled = busy || saving || Boolean(failedRequest && el('#teacherInput').value.trim() === failedRequest.question);
    container.querySelectorAll('[data-action],[data-open-chat],[data-delete-chat],[data-delete-note]').forEach(button => button.disabled = busy || saving);
    el('#saveChat').disabled = !user || !messages.length || busy || saving;
    el('#saveNote').disabled = !user || !messages.some(item => item.role === 'assistant') || busy || saving;
    el('#downloadLesson').disabled = !messages.length; el('#printLesson').disabled = !messages.length;
  }
  function renderMessage(item) {
    const card = document.createElement('article'); card.className = `teacher-message ${item.role}`;
    const label = document.createElement('strong'); label.textContent = item.role === 'user' ? 'You' : 'MAGIVOX AI';
    const body = document.createElement('div'); body.innerHTML = answerHTML(item.content); card.append(label, body);
    if (item.role === 'assistant') {
      const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'text-action'; copy.textContent = 'Copy';
      copy.onclick = async () => { try { await navigator.clipboard.writeText(item.content); status('Reply copied.'); } catch { status('Copy is unavailable. Select the text to copy it.', true); } };
      const read = document.createElement('button'); read.type = 'button'; read.className = 'text-action'; read.textContent = 'Read aloud';
      read.onclick = () => { try { speak(item.content, item.language || currentLanguage()); } catch (error) { status(error.message, true); } }; card.append(copy, read);
    }
    el('#teacherMessages').append(card);
  }
  function drawMessages() {
    el('#teacherMessages').replaceChildren();
    if (!messages.length) el('#teacherMessages').innerHTML = '<div class="teacher-empty"><span aria-hidden="true">✦</span><h3>Your questions belong here.</h3><p>No doubt is too small. Say hello, ask for an example, or start a lesson from the beginning.</p></div>';
    messages.forEach(renderMessage); el('#teacherMessages').scrollTop = el('#teacherMessages').scrollHeight; controls();
  }
  function clearFailedRequest() { failedRequest = null; retryInFlight = false; el('#retryTeacher').hidden = true; }
  function newConversation() { messages = []; chatId = null; dirty = false; clearFailedRequest(); window.speechSynthesis?.cancel(); drawMessages(); }
  el('#newChat').onclick = () => { if (dirty && !confirm('Start a new chat? Unsaved messages will be cleared.')) return; newConversation(); el('#teacherInput').value = ''; status('New chat ready.'); };
  let previousCourse = course().id, previousTopic = topicIndex();
  el('#teacherCourse').onchange = () => {
    if (dirty && !confirm('Switch courses and start a new chat? Save or download this chat first if you want to keep it.')) { el('#teacherCourse').value = previousCourse; return; }
    previousCourse = course().id; previousTopic = 0; drawTopics(); newConversation(); status('New course selected. Start a fresh conversation.');
  };
  el('#teacherTopic').onchange = () => {
    if (dirty && !confirm('Switch topics and start a new chat? Unsaved messages will be cleared.')) { el('#teacherTopic').value = String(previousTopic); return; }
    previousTopic = topicIndex(); updateContext(); newConversation(); status('New topic selected.');
  };
  el('#stopReading').onclick = () => window.speechSynthesis?.cancel();
  container.querySelectorAll('[data-action]').forEach(button => button.onclick = () => {
    const [label, prompt] = TEACHER_ACTIONS[Number(button.dataset.action)];
    el('#teacherInput').value = messages.length ? prompt : `${prompt}\nCurrent topic: ${course().topics[topicIndex()].title}. We have not discussed it yet; begin here.`;
    if (label === 'Explain in Telugu') el('#teacherLanguage').value = 'Telugu';
    clearFailedRequest(); controls(); el('#teacherForm').requestSubmit();
  });
  el('#teacherInput').addEventListener('input', () => { if (failedRequest && el('#teacherInput').value.trim() !== failedRequest.question) { clearFailedRequest(); controls(); } });
  el('#teacherForm').onsubmit = async event => {
    event.preventDefault(); if (busy || saving) return;
    const question = el('#teacherInput').value.trim(); if (!question) return;
    const isRetry = retryInFlight; retryInFlight = false;
    if (!isRetry && failedRequest?.question === question) return;
    const requestedLanguage = localTeacherLanguageIntent(question); if (requestedLanguage) el('#teacherLanguage').value = requestedLanguage;
    const current = course(), topic = current.topics[topicIndex()];
    if (!user) { status('Log in to ask AI learning questions. Your question is still here.', true); return; }
    if (!el('#chatConsent').checked) { status('Agree to AI processing before sending this question.', true); return; }
    busy = true; controls(); el('#retryTeacher').hidden = true; el('#teacherMessages').setAttribute('aria-busy', 'true'); status('Thinking through your question…');
    try {
      const recent = (context.getAssessments?.() || []).filter(item => item.courseId === current.id).slice(-5);
      const result = await requestMAGIVOXAI('teacher', { message: question, history: teacherHistory(messages), language: currentLanguage(), level: el('#teacherLevel').value, mode: el('#teacherMode').value, course: current.title, topic: topic.title, performance: recent.map(item => `${item.label}: ${item.score}%`).join('; ') || 'No saved assessments.', targetRole: profile.targetRole || 'Exploring careers', consent: true }, user, signal);
      if (signal.aborted) return;
      if (typeof result.answer !== 'string' || !result.answer.trim()) throw new Error('No answer came back. Please retry.');
      messages.push({ role: 'user', content: question }, { role: 'assistant', content: result.answer, language: currentLanguage() }); dirty = true; drawMessages();
      if (el('#teacherInput').value.trim() === question) el('#teacherInput').value = '';
      clearFailedRequest(); status('Ask a follow-up, practise, or create notes. AI explanations can contain mistakes.');
      if (el('#autoRead').checked) { try { speak(result.answer, currentLanguage()); } catch (error) { status(`Reply ready. ${error.message}`); } }
    } catch (error) { if (!signal.aborted) { failedRequest = { question, used:isRetry }; status(isAIQuotaError(error) ? AI_UNAVAILABLE_MESSAGE : `${error.message} Your question is kept above.`, true); el('#retryTeacher').hidden=isRetry; } }
    finally { if (!signal.aborted) { busy = false; controls(); el('#teacherMessages').setAttribute('aria-busy', 'false'); } }
  };
  el('#retryTeacher').onclick = () => { if (!failedRequest || failedRequest.used || busy || saving || el('#teacherInput').value.trim() !== failedRequest.question) return; failedRequest.used=true; retryInFlight=true; el('#retryTeacher').hidden=true; controls(); el('#teacherForm').requestSubmit(); };
  el('#downloadLesson').onclick = () => downloadText('magivox-lesson.txt', transcript());
  el('#printLesson').onclick = () => { try { printNotes('MAGIVOX lesson notes', transcript()); } catch (error) { status(error.message, true); } };

  function drawLibrary() {
    el('#teacherChats').innerHTML = chats.length ? chats.map((item, i) => `<div class="teacher-library-item"><button class="text-action" data-open-chat="${i}">${e(item.title)}</button><button class="text-action" data-delete-chat="${i}" aria-label="Delete chat ${e(item.title)}">×</button></div>`).join('') : '<p class="tool-muted">No saved chats yet.</p>';
    el('#teacherNotes').innerHTML = notes.length ? notes.map((item, i) => `<div class="teacher-library-item"><button class="text-action" data-open-note="${i}">${e(item.title)}</button><button class="text-action" data-delete-note="${i}" aria-label="Delete note ${e(item.title)}">×</button></div>`).join('') : '<p class="tool-muted">Save a useful reply to revisit it.</p>';
    container.querySelectorAll('[data-open-chat]').forEach(button => button.onclick = () => {
      if (busy || saving || (dirty && !confirm('Open this saved chat? Unsaved messages will be cleared.'))) return;
      const item = chats[Number(button.dataset.openChat)]; if (!getCourse(item.courseId)) { status('This saved course is unavailable.', true); return; }
      el('#teacherCourse').value = item.courseId; drawTopics(item.topicIndex); previousCourse = course().id; previousTopic = topicIndex();
      el('#teacherLanguage').value = LANGUAGES.includes(item.language) ? item.language : 'English';
      el('#teacherLevel').value = ['Beginner', 'Intermediate', 'Advanced'].includes(item.level) ? item.level : 'Beginner';
      el('#teacherMode').value = ['Teach', 'Doubt', 'Practice', 'Revision'].includes(item.mode) ? item.mode : 'Teach';
      messages = teacherHistory(item.messages); chatId = item.id; dirty = false; el('#teacherInput').value = ''; clearFailedRequest(); window.speechSynthesis?.cancel(); drawMessages(); status('Saved conversation opened. Ask a follow-up.');
    });
    container.querySelectorAll('[data-open-note]').forEach(button => button.onclick = () => { const note = notes[Number(button.dataset.openNote)]; el('#noteTitle').textContent = note.title; el('#noteBody').innerHTML = answerHTML(note.content); el('#notePreview').hidden = false; el('#downloadNote').onclick = () => downloadText('magivox-note.txt', note.content); el('#notePreview').scrollIntoView({ block: 'nearest' }); });
    for (const [kind, items, attr] of [['teacherChats', chats, 'chat'], ['teacherNotes', notes, 'note']]) {
      container.querySelectorAll(`[data-delete-${attr}]`).forEach(button => button.onclick = async () => {
        if (busy || saving) return; const item = items[Number(button.getAttribute(`data-delete-${attr}`))]; if (!confirm(`Delete “${item.title}” from your account?`)) return;
        saving = true; controls();
        try { await deleteLearningItem(user, kind, item.id); if (kind === 'teacherChats' && chatId === item.id) { chatId = null; dirty = messages.length > 0; } el('#notePreview').hidden = true; await refreshLibrary(); status('Saved item deleted.'); }
        catch { status('Could not delete this item. Please try again.', true); }
        finally { saving = false; controls(); }
      });
    }
    controls();
  }
  let librarySequence = 0;
  async function refreshLibrary() {
    if (!user) { el('#teacherChats').innerHTML = '<p class="tool-muted">Log in to save conversations.</p>'; el('#reloadLibrary').disabled = true; return; }
    const sequence = ++librarySequence;
    el('#libraryStatus').textContent = 'Loading saved items…';
    try {
      const results = await Promise.all([listLearningItems(user, 'teacherChats'), listLearningItems(user, 'teacherNotes')]);
      if (signal.aborted || sequence !== librarySequence) return;
      [chats, notes] = results; drawLibrary(); el('#libraryStatus').textContent = 'Showing your 12 most recently updated chats and notes.';
    } catch { if (!signal.aborted && sequence === librarySequence) { el('#teacherChats').innerHTML = '<p class="tool-muted">Saved chats could not load.</p>'; el('#libraryStatus').textContent = 'Could not load saved items. Check your connection and try Refresh.'; } }
  }
  el('#reloadLibrary').onclick = refreshLibrary;
  el('#closeNote').onclick = () => el('#notePreview').hidden = true;
  el('#saveChat').onclick = async () => {
    if (!user || busy || saving || !messages.length) return; saving = true; controls(); status('Saving recent conversation to your account…');
    try {
      chatId = await saveLearningItem(user, 'teacherChats', { title: messages.find(item => item.role === 'user').content.slice(0, 100), courseId: course().id, topicIndex: topicIndex(), language: currentLanguage(), level: el('#teacherLevel').value, mode: el('#teacherMode').value, messages: teacherHistory(messages) }, chatId || crypto.randomUUID());
      dirty = false; status('Recent conversation saved to your account.'); await refreshLibrary();
    } catch { status('Could not save your chat. Keep this page open or download the conversation, then try again.', true); }
    finally { saving = false; controls(); }
  };
  el('#saveNote').onclick = async () => {
    if (!user || busy || saving) return; const last = messages.findLast(item => item.role === 'assistant'); if (!last) return;
    saving = true; controls(); status('Saving note…');
    try { await saveLearningItem(user, 'teacherNotes', { title: course().topics[topicIndex()].title.slice(0, 100), courseId: course().id, content: last.content.slice(0, 10000) }); status('Reply saved as a note.'); await refreshLibrary(); }
    catch { status('Could not save your note. Download the conversation and try again.', true); }
    finally { saving = false; controls(); }
  };
  mountRecorder(el('#teacherRecorder'), { user, signal, language: currentLanguage, onTranscript: text => { el('#teacherInput').value = text.slice(0, 4000); clearFailedRequest(); controls(); el('#teacherInput').focus(); status('Check your transcript, then send it to your teacher.'); } });
  window.addEventListener('pagehide', () => { controller.abort(); window.speechSynthesis?.cancel(); }, { once: true });
  const lesson = params.get('lesson'), requestedAction = params.get('action');
  const contextualPrompts = {
    ask: `I have a question about ${lesson || course().topics[topicIndex()].title}. Help me understand this topic.`,
    simple: `Explain ${lesson || course().topics[topicIndex()].title} simply, step by step, for a beginner.`,
    example: `Give me one clear worked example of ${lesson || course().topics[topicIndex()].title}.`,
    telugu: `Explain ${lesson || course().topics[topicIndex()].title} in Telugu and keep technical terms accurate.`,
    quiz: `Quiz me on ${lesson || course().topics[topicIndex()].title}, one question at a time, and wait for my answer.`,
    notes: `Create concise study notes for ${lesson || course().topics[topicIndex()].title}, including key points and one example.`
  };
  if (requestedAction && contextualPrompts[requestedAction]) {
    el('#teacherInput').value = contextualPrompts[requestedAction].slice(0, 4000);
    if (requestedAction === 'telugu') el('#teacherLanguage').value = 'Telugu';
    status('Course and topic context loaded. Agree to AI processing, then send this request.');
  } else if (lesson) el('#teacherInput').value = `Teach me ${lesson.slice(0, 180)} step by step with one example.`;
  drawMessages(); refreshLibrary();
}
