import { escapeHTML as e } from './studio-utils.js';
import { requestMAGIVOXAI, conversationHistory, AI_UNAVAILABLE_MESSAGE, isAIQuotaError } from './ai-core.js';
import { HELP_TOPICS, localHelp, supportSubmission } from './help-content.js';
import { submitSupport } from './learning-store.js';
import { APP_CONFIG } from './app-config.js';

export function mountSupport({ container, user, profile }) {
  const controller = new AbortController(); window.addEventListener('pagehide', () => controller.abort(), { once: true });
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(APP_CONFIG.supportEmail || '') ? APP_CONFIG.supportEmail : '';
  container.innerHTML = `<section class="studio support-workspace"><div class="studio-toolbar"><div><p class="eyebrow">HELP & SUPPORT</p><h2>Let’s find your next step.</h2><p>Guidance for the tools already in your MAGIVOX workspace.</p></div></div>
    <div class="support-grid"><section class="tool-panel"><h3>MAGIVOX Help Assistant</h3><div id="helpMessages" class="help-messages" role="log" aria-live="polite"><p>Hi! I'm the MAGIVOX Help Assistant. What do you need help with?</p></div>
    <div class="help-quick">${HELP_TOPICS.map((topic, i) => `<button class="tool-button-secondary" type="button" data-help="${i}">${e(topic.title)}</button>`).join('')}</div>
    <form id="helpForm"><label for="helpInput">What do you need help with?</label><textarea id="helpInput" class="tool-textarea" maxlength="2000" required rows="2"></textarea><label class="consent-line"><input id="helpAI" type="checkbox" ${!user ? 'disabled' : ''}> Use AI for this conversation and send my question and recent messages to Google through Firebase AI Logic.</label><p class="tool-muted">Without AI, answers come from the built-in MAGIVOX help guide. ${!user ? 'Log in to use AI.' : ''}</p><button class="tool-button" id="helpSend">Get help</button><p role="status" id="helpStatus"></p></form></section>
    <section class="tool-panel"><h3>Frequently asked questions</h3><div class="faq-list">${HELP_TOPICS.map(topic => `<details><summary>${e(topic.question)}</summary><p>${e(topic.answer)}</p><a href="workspace.html?tool=${topic.tool}">Open ${e(topic.title)}</a></details>`).join('')}</div><p><a href="privacy.html">Privacy & data</a></p></section></div>
    <section class="tool-panel support-request"><h3>Talk to the MAGIVOX team</h3><p>${email ? `Email <a href="mailto:${e(email)}">${e(email)}</a> or submit a request below.` : 'Use Contact Support below to send a request to the support ticket queue.'}</p><p class="tool-muted">Include steps to reproduce a problem. Do not include passwords, API keys or payment information. No response time is promised.</p>
    <form id="supportForm"><div class="studio-two-columns"><label>Request type<select class="tool-select" name="kind"><option value="problem">Report a Problem</option><option value="feature">Feature Request</option><option value="contact">Contact Support</option></select></label><label>Category<select class="tool-select" name="category"><option>Account</option><option>AI Teacher</option><option>Courses & PDFs</option><option>Voice</option><option>Other</option></select></label><label>Name<input class="tool-input" name="name" minlength="2" maxlength="100" value="${e(profile.fullName || user?.displayName || '')}" autocomplete="name" required></label><label>Email<input class="tool-input" name="email" type="email" maxlength="254" value="${e(user?.email || '')}" autocomplete="email" required></label></div><label>Title<input class="tool-input" name="title" minlength="3" maxlength="120" required></label><label>Description<textarea class="tool-textarea" name="description" minlength="20" maxlength="4000" rows="4" required></textarea></label><button class="tool-button" id="supportSubmit" ${!user ? 'disabled' : ''}>Submit request</button><p id="supportStatus" role="status">${!user ? 'Log in to send a support request.' : ''}</p>${!user ? '<a href="login.html">Log in</a>' : ''}</form></section></section>`;
  const el = s => container.querySelector(s); let messages = [], busy = false;
  function add(role, text) { const article = document.createElement('article'); article.className = `teacher-message ${role}`; const label = document.createElement('strong'); label.textContent = role === 'user' ? 'You' : 'MAGIVOX Help Assistant'; const body = document.createElement('p'); body.textContent = text; article.append(label, body); el('#helpMessages').append(article); article.scrollIntoView({ block: 'nearest' }); }
  container.querySelectorAll('[data-help]').forEach(button => button.onclick = () => { el('#helpInput').value = HELP_TOPICS[Number(button.dataset.help)].question; el('#helpForm').requestSubmit(); });
  el('#helpForm').onsubmit = async event => {
    event.preventDefault(); if (busy) return;
    const question = el('#helpInput').value.trim(); if (!question) return;
    busy = true; el('#helpSend').disabled = true; el('#helpStatus').textContent = 'Finding guidance…';
    let answer = localHelp(question), source = 'From the MAGIVOX help guide.';
    try {
      if (el('#helpAI').checked && user) {
        const result = await requestMAGIVOXAI('help', { message: question, history:conversationHistory(messages), language:'English', consent:true }, user, controller.signal);
        answer = result.answer; source = 'AI guidance based on MAGIVOX navigation. Check the linked FAQs if anything is unclear.';
      }
    } catch (error) {
      if (el('#helpAI').checked) { answer = ''; source = isAIQuotaError(error) ? AI_UNAVAILABLE_MESSAGE : error.message; }
      else source = 'From the built-in MAGIVOX help guide.';
    }
    finally { if (!controller.signal.aborted) {
      add('user', question); messages = conversationHistory([...messages, { role:'user', content:question }]);
      if (answer) { add('assistant', answer); messages = conversationHistory([...messages, { role:'assistant', content:answer }]); if (el('#helpInput').value.trim() === question) el('#helpInput').value = ''; }
      el('#helpStatus').textContent = source; busy = false; el('#helpSend').disabled = false;
    } }
  };
  let submitting = false, requestId = crypto.randomUUID();
  el('#supportForm').onsubmit = async event => {
    event.preventDefault(); if (submitting || !user) return;
    try {
      const value = supportSubmission(new FormData(event.currentTarget).get('kind'), Object.fromEntries(new FormData(event.currentTarget)));
      submitting = true; el('#supportForm').querySelectorAll('input,textarea,select,button').forEach(control => control.disabled = true); el('#supportStatus').textContent = 'Submitting… Waiting for the server to confirm. Keep this page open.';
      await submitSupport(user, value, requestId);
      el('#supportStatus').textContent = `Request saved. Your reference is ${requestId}.`; requestId = crypto.randomUUID(); el('[name="title"]').value = ''; el('[name="description"]').value = '';
    } catch (error) { el('#supportStatus').textContent = error.code ? 'Could not submit your request. Check your connection and try again. Your text is still here.' : error.message; }
    finally { submitting = false; el('#supportForm').querySelectorAll('input,textarea,select,button').forEach(control => control.disabled = false); }
  };
}
