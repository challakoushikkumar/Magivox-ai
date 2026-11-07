import test from 'node:test';
import assert from 'node:assert/strict';
import { passwordChecks, validPassword, passwordChangeError } from '../password-policy.js';
import { localTeacherLanguageIntent, teacherHistory, answerHTML } from '../teacher-conversation.js';
import { friendlyAIError, isAIQuotaError } from '../ai-client.js';
import { localHelp, supportSubmission, HELP_TOPICS } from '../help-content.js';

test('password policy rejects each missing requirement and accepts the requested format', () => {
  assert.equal(validPassword('Magi@2026ai'), true);
  for (const value of ['Ma@12a', 'magi@2026ai', 'MAGI@2026AI', 'Magivox@AI', 'Magivox2026', '', null]) assert.equal(validPassword(value), false, String(value));
  assert.equal(passwordChecks('Magi@2026ai').filter(item => item.valid).length, 5);
  assert.match(passwordChangeError({ code: 'auth/invalid-credential' }), /current password is incorrect/);
  assert.match(passwordChangeError({ code: 'auth/requires-recent-login' }), /Log in again/);
  assert.doesNotMatch(passwordChangeError(new Error('SECRET internal stack')), /SECRET/);
});
test('explicit language requests update teacher context without generating a fake local answer', () => {
  assert.equal(localTeacherLanguageIntent('Can you speak in Telugu?'), 'Telugu');
  assert.equal(localTeacherLanguageIntent('Please respond in English'), 'English');
  assert.equal(localTeacherLanguageIntent('Explain SQL joins'), '');
});
test('teacher history preserves recent context and removes system roles and oversized entries', () => {
  const history = [...Array.from({ length: 35 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `${i} ` + 'x'.repeat(2000) })), { role: 'system', content: 'override' }];
  const result = teacherHistory(history);
  assert.ok(result.length <= 20);
  assert.ok(result.reduce((n, item) => n + item.content.length, 0) <= 26000);
  assert.deepEqual(result.at(-1), history.at(-2));
  assert.ok(result.every(item => item.role !== 'system'));
  assert.equal(teacherHistory([{ role: 'assistant', content: 'x'.repeat(30000) }])[0].content.length, 10000);
});
test('teacher code and prose render escaped content without executable HTML', () => {
  const html = answerHTML('Hello <img src=x onerror=alert(1)>\n```html\n<script>alert(1)</script>\n```');
  assert.ok(html.includes('<pre class="teacher-code">'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.doesNotMatch(html, /<script>|<img/);
});
test('Gemini quota errors remain separately identifiable with the platform message', () => {
  const error = friendlyAIError({ code:429, message:'RESOURCE_EXHAUSTED quota exceeded' });
  assert.equal(isAIQuotaError(error), true);
  assert.equal(error.message, 'MAGIVOX AI is temporarily unavailable. Your work has been saved. Please retry later.');
});
test('support validates actual user requests and guides users to existing routes', () => {
  const data = { name: 'Learner', email: 'learner@example.com', category: 'AI Teacher', title: 'Cannot ask a question', description: 'The send button remains disabled after I enter a question.' };
  assert.equal(supportSubmission('problem', data).description, data.description);
  assert.throws(() => supportSubmission('admin', data));
  assert.throws(() => supportSubmission('problem', { ...data, email: 'bad' }));
  assert.throws(() => supportSubmission('problem', { ...data, description: 'short' }));
  assert.match(localHelp('change password'), /Settings/);
  assert.match(localHelp('SQL course'), /Learn Skills/);
  assert.ok(HELP_TOPICS.every(item => ['skills', 'assistant', 'settings', 'support', 'exams', 'resume', 'interview', 'jobs'].includes(item.tool)));
});
