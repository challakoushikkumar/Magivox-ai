import test from 'node:test';
import assert from 'node:assert/strict';
import { INTERVIEW_MODES, COACH_TOPICS, createInterview, acceptTurn, skipTurn, retryLastAnswer, normalizeTurn, normalizeReport, compareAttempt, fillerFeedback, sessionTranscript, validPracticeReport } from '../interview-engine.js';
import { normalizeSpeechTranscript, assessSpeechReliability, SPEECH_LANGUAGE, MAGIVOX_VOCABULARY } from '../speech-normalizer.js';
const reply = n => ({ feedback: 'Thank you for the example.', question: `What did you learn from example ${n}?`, audio: null });
const report = () => ({ metrics: { grammar: 70, clarity: 80, vocabulary: 60, content: 80, readiness: 60 }, summary: 'A useful practice session.', mistakes: ['Review past tense.'], corrections: [{ original: 'I am learning SQL.', corrected: 'I am studying SQL.', reason: 'An alternative phrasing.' }, { original: 'I worked at a fictional company.', corrected: 'Fake', reason: 'Fake' }], betterVocabulary: [], strongPoints: ['Clear goal.'], weakPoints: ['Add detail.'], improvedIntroduction: 'I am learning SQL. [Add your real project.]', improvementPlan: ['Practise one two-minute introduction tomorrow.'] });
function session() { const s = createInterview({ kind: 'mock', mode: 'SQL', level: 'Beginner', role: 'Data Analyst' }, 'test'); acceptTurn(s, 'I am learning SQL.', reply(1)); acceptTurn(s, 'I practised joins on a sample table.', reply(2)); return s; }
test('all requested interview roles and coaching topics use the existing catalogue', () => {
  assert.deepEqual(INTERVIEW_MODES.map(item => item.label), ['HR', 'Data Analyst', 'SQL', 'Power BI', 'Tableau', 'Java', 'Python', 'GIS', 'Web Development']);
  assert.equal(COACH_TOPICS.length, 5);
});
test('speech normalization preserves the requested Koushik and MAGIVOX vocabulary phrases', () => {
  const settings = { profileName: 'koushik' };
  assert.equal(SPEECH_LANGUAGE, 'en-IN'); assert.equal(MAGIVOX_VOCABULARY.length, 12);
  assert.equal(normalizeSpeechTranscript('My name is Koushik.', settings).corrected, 'My name is Koushik.');
  assert.equal(normalizeSpeechTranscript('My name is Koushik and I completed SQL, Excel, Power BI and Tableau.', settings).corrected, 'My name is Koushik and I completed SQL, Excel, Power BI and Tableau.');
  assert.equal(normalizeSpeechTranscript('I am preparing for a Data Analyst role.', settings).corrected, 'I am preparing for a Data Analyst role.');
  assert.equal(normalizeSpeechTranscript('I am a fresher.', settings).corrected, 'I am a fresher.');
  assert.equal(normalizeSpeechTranscript('My name is Koushik and I recently graduated from college.', settings).corrected, 'My name is Koushik and I recently graduated from college.');
  assert.equal(normalizeSpeechTranscript('I am a fresher and I am preparing for a Data Analyst role.', settings).corrected, 'I am a fresher and I am preparing for a Data Analyst role.');
  assert.equal(normalizeSpeechTranscript('I know Excel, SQL, Power BI and Tableau.', settings).corrected, 'I know Excel, SQL, Power BI and Tableau.');
  assert.equal(normalizeSpeechTranscript('My name is Kaushik and I completed sequel, exel, power be eye and tablo.', settings).corrected, 'My name is Koushik and I completed SQL, Excel, Power BI and Tableau.');
  assert.equal(normalizeSpeechTranscript('I am preparing for a data analist role.', settings).corrected, 'I am preparing for a Data Analyst role.');
});
test('speech reliability blocks low confidence and conflicting profile-name recognition', () => {
  assert.equal(assessSpeechReliability({ raw: 'My name is Koushik.', corrected: 'My name is Koushik.', confidence: 0.91, profileName: 'Koushik' }).reliable, true);
  assert.equal(assessSpeechReliability({ raw: 'My name is Koushik.', corrected: 'My name is Koushik.', confidence: 0.2, profileName: 'Koushik' }).reason, 'low-confidence');
  assert.equal(assessSpeechReliability({ raw: 'My name is Music.', corrected: 'My name is Music.', confidence: 0.92, profileName: 'Koushik' }).reason, 'profile-name-mismatch');
  assert.equal(assessSpeechReliability({ raw: 'word word word word word', corrected: 'word word word word word', confidence: null }).reason, 'repeated-recognition');
  assert.equal(assessSpeechReliability({ raw: "I'm from Java Java JavaScript. I'm recently graduated in Port CSS College.", corrected: "I'm from Java Java JavaScript. I'm recently graduated in Port CSS College.", confidence: 0.91 }).reason, 'technical-hallucination');
});
test('speech normalization does not aggressively replace unrelated names or ordinary speech', () => {
  const result = normalizeSpeechTranscript('My name is Rahul and I like java plum fruit.', { profileName: 'Koushik' });
  assert.equal(result.corrected, 'My name is Rahul and I like java plum fruit.');
  assert.equal(result.changes.some(change => change.type === 'profile-name'), false);
});
test('multi-turn state retains the asked question and replaces retried answers', () => {
  const s = createInterview({ kind: 'introduction' }, '1'), first = s.question;
  acceptTurn(s, 'My name is Koushik.', reply(1), 'recorded', 'My name is Kaushik.', { language: 'en-IN', confidence: 0.91 }); assert.equal(s.turns[0].question, first); assert.equal(s.question, reply(1).question);
  assert.match(sessionTranscript(s), /YOU \(raw\): My name is Kaushik/); assert.match(sessionTranscript(s), /YOU \(corrected\): My name is Koushik/);
  assert.equal(retryLastAnswer(s), true); assert.equal(s.question, first); assert.equal(s.turns.length, 0);
  s.phase = 'paused'; assert.throws(() => acceptTurn(s, 'Another answer', reply(2)));
});
test('skips do not count as answered evidence and insufficient sessions cannot be scored', () => {
  const s = createInterview({}, '1'); skipTurn(s, reply(1)); acceptTurn(s, 'One answer', reply(2));
  assert.throws(() => normalizeReport(report(), s.turns), /at least two/);
  assert.match(sessionTranscript(s), /\[Skipped\]/);
});
test('interviewer rejects multiple/repeated questions and ignores invented audio ratings for typed answers', () => {
  assert.throws(() => normalizeTurn({ feedback: 'Thanks.', question: 'Why? How?' }));
  assert.throws(() => normalizeTurn(reply(1), false, [reply(1).question]));
  const raw = { ...reply(1), audio: { assessed: true, fluency: 80, confidence: 70, pronunciation: 90, evidence: 'Clear audible phrases.' } };
  assert.equal(normalizeTurn(raw, false).audio, null);
  assert.equal(normalizeTurn(raw, true).audio.pronunciation, 90);
  assert.throws(() => normalizeTurn({ ...raw, audio: { ...raw.audio, pronunciation: 500 } }, true));
});
test('report scores only evidence, filters unquoted corrections and counts transcript fillers', () => {
  const s = session(); const result = normalizeReport(report(), s.turns);
  assert.equal(result.score, 70); assert.equal(result.metrics.pronunciation, null); assert.equal(result.audioAnswers, 0);
  assert.equal(result.corrections.length, 1);
  s.turns[0].audio = { fluency: 80, confidence: 70, pronunciation: 90, evidence: 'Clear speech.' };
  const spoken = normalizeReport(report(), s.turns); assert.equal(spoken.metrics.fluency, 80); assert.equal(spoken.score, 74);
  assert.throws(() => normalizeReport({ ...report(), metrics: { grammar: '100' } }, s.turns));
  assert.equal(fillerFeedback([{ answer: 'Um, I mean, um, this works.' }]).total, 3);
});
test('comparisons exclude other modes, levels, roles, legacy rubrics and the same saved ID', () => {
  const current = { id: 'new', kind: 'mock', mode: 'SQL', level: 'Beginner', role: 'Analyst', report: { rubricVersion: 1, textScore: 80 } };
  const previous = { ...current, id: 'old', report: { rubricVersion: 1, textScore: 70 } };
  assert.equal(compareAttempt(current, [previous]).delta, 10);
  assert.equal(compareAttempt(previous, [previous, current]), null);
  for (const patch of [{ id: 'new' }, { level: 'Advanced' }, { mode: 'HR' }, { role: 'Developer' }, { report: { rubricVersion: 0, textScore: 99 } }]) assert.equal(compareAttempt(current, [{ ...previous, ...patch }]), null);
});
test('saved reports reject malformed metrics or injected values before rendering', () => {
  const result = normalizeReport(report(), session().turns);
  assert.equal(validPracticeReport(result), true);
  assert.equal(validPracticeReport({ ...result, score: '<img src=x>' }), false);
  assert.equal(validPracticeReport({ ...result, metrics: {} }), false);
  assert.equal(validPracticeReport({ ...result, fillerFeedback: {} }), false);
});
