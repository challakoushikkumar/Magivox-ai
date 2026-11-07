import { escapeHTML as e } from './studio-utils.js';
export const TEACHER_ACTIONS = [
  ['Explain Simply', 'Explain the previous concept more simply, step by step.'],
  ['Give Example', 'Give me one worked example of the concept we just discussed.'],
  ['Explain Again', 'I did not understand. Explain the previous concept differently.'],
  ['Practice Question', 'Give me one practice question on the current concept and wait for my answer.'],
  ['Hint', 'Give me a small hint for the current practice question without revealing the answer.'],
  ['Quiz Me', 'Quiz me on our current topic, one question at a time. Wait for my answer and explain your feedback.'],
  ['Create Notes', 'Create concise study notes from the concepts discussed in this conversation, with key points and an example.'],
  ['Interview Questions', 'Ask me an interview question about our current topic and wait for my answer.'],
  ['Continue Lesson', 'Continue from where we left off with the next small step.'],
  ['Explain in Telugu', 'Explain the previous concept in Telugu, keeping technical terms accurate.']
];
export const CONVERSATION_GUIDANCE = `Be a natural conversational tutor. A greeting such as "hi mawa" means hello; greet warmly and ask what the learner wants to learn without forcing a lecture. "naku ardham kaledhu", "simple ga cheppu", "explain again" and "explain differently" refer to the previous concept: re-explain it using a different approach. "example ivu" asks for an example of that concept. "next" and "continue" mean continue the lesson. Resolve short follow-ups using recent conversation, not only the selected topic. If no previous concept exists, ask a brief clarifying question. Match Telugu or Roman Telugu when requested. Teach one manageable step at a time. Quiz and practice requests should give one question and wait for the learner to answer; then correct mistakes and explain why. Create notes only from content actually discussed; do not claim they have been saved. Use fenced code blocks for code and SQL and readable paragraphs and lists. Never claim to run code or inspect a screen.`;
export function localTeacherLanguageIntent(question) {
  const text = String(question || '').toLowerCase().trim().replace(/[!?.]+$/g, '').trim();
  if (/^(?:can|could|will|would)\s+you\s+(?:speak|reply|respond|explain)\s+in\s+telugu$|^(?:please\s+)?(?:speak|reply|respond|explain)\s+in\s+telugu(?:\s+please)?$|^telugu(?:\s+please)?$/.test(text)) return 'Telugu';
  if (/^(?:can|could|will|would)\s+you\s+(?:speak|reply|respond|explain)\s+in\s+english$|^(?:please\s+)?(?:speak|reply|respond|explain)\s+in\s+english(?:\s+please)?$|^english(?:\s+please)?$/.test(text)) return 'English';
  return '';
}
export function teacherHistory(messages) {
  const result = []; let length = 0;
  for (const item of (Array.isArray(messages) ? messages : []).slice(-20).reverse()) {
    if (!['user', 'assistant'].includes(item?.role) || typeof item.content !== 'string') continue;
    const content = item.content.slice(0, 10000);
    if (length + content.length > 26000) break;
    result.unshift({ role: item.role, content }); length += content.length;
  }
  return result;
}
// Escape first; generated text never becomes active HTML or executable links.
export function answerHTML(text) {
  return String(text).split(/(```[\s\S]*?```)/g).map(part => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).replace(/^[\w+-]*\n/, '');
      return `<pre class="teacher-code"><code>${e(code)}</code></pre>`;
    }
    return `<div class="prose-text">${e(part)}</div>`;
  }).join('');
}
