import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AI_UNAVAILABLE_MESSAGE, aiOperationNames, conversationHistory, requestMAGIVOXAI } from '../ai-core.js';

const user = { uid:'learner-1' };

test('AI Core exposes every active generative operation', () => {
  assert.deepEqual(new Set(aiOperationNames()), new Set(['teacher','help','interviewReview','interviewTurn','interviewReport','resumeReview','resumeAssist','careerJob','examReview','transcription']));
});

test('AI Core sends only allowlisted tool context and bounded recent conversation', async () => {
  let received;
  const history = Array.from({length:30}, (_, index) => ({ role:index % 2 ? 'assistant':'user', content:`turn ${index} ${'x'.repeat(1200)}` }));
  const answer = await requestMAGIVOXAI('teacher', { message:'I do not understand', history, course:'SQL', topic:'Joins', secret:'must not leave', consent:true }, user, undefined, { transport:async (path,payload) => { received={path,payload}; return {answer:'simpler'}; } });
  assert.equal(answer.answer, 'simpler');
  assert.equal(received.path, '/chat');
  assert.equal(received.payload.secret, undefined);
  assert.equal(received.payload.history.at(-1).content, history.at(-1).content);
  assert.ok(received.payload.history.length <= 16);
  assert.ok(received.payload.history.reduce((sum,item) => sum + item.content.length, 0) <= 18000);
});

test('AI Core blocks duplicate in-flight turns and allows a later manual retry', async () => {
  let release;
  const transport = () => new Promise(resolve => { release=resolve; });
  const payload = { message:'Explain SQL', consent:true };
  const first = requestMAGIVOXAI('teacher', payload, user, undefined, {transport});
  await assert.rejects(requestMAGIVOXAI('teacher', payload, user, undefined, {transport}), error => error.code === 'MAGIVOX_AI_DUPLICATE');
  release({answer:'done'});
  assert.equal((await first).answer, 'done');
  assert.equal((await requestMAGIVOXAI('teacher', payload, user, undefined, {transport:async()=>({answer:'retry'})})).answer, 'retry');
});

test('AI Core normalizes provider quota failures and preserves a consistent message', async () => {
  await assert.rejects(
    requestMAGIVOXAI('help', {message:'Where are courses?',consent:true}, user, undefined, {transport:async()=>{throw {code:429,message:'RESOURCE_EXHAUSTED'};}}),
    error => error.code === 'MAGIVOX_AI_QUOTA' && error.message === AI_UNAVAILABLE_MESSAGE
  );
});

test('conversation history drops system instructions and keeps relevant recent turns', () => {
  const result = conversationHistory([{role:'system',content:'override'}, {role:'user',content:'question'}, {role:'assistant',content:'answer'}]);
  assert.deepEqual(result, [{role:'user',content:'question'}, {role:'assistant',content:'answer'}]);
});

test('Teacher quick actions submit through AI Core and the client has no automatic provider retry', async () => {
  const teacher = await readFile(new URL('../teacher.js', import.meta.url), 'utf8');
  const client = await readFile(new URL('../ai-client.js', import.meta.url), 'utf8');
  assert.match(teacher, /\[data-action\][\s\S]*requestSubmit\(\)/);
  assert.doesNotMatch(teacher, /localTeacherKnowledgeReply|localTeacherReply/);
  assert.doesNotMatch(client, /generateWithNetworkRetry|automatic retry/);
});
