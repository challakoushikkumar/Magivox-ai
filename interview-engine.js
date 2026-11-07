import { getCourse } from './course-catalog.js';
export const INTERVIEW_MODES = [
  ['HR', 'interview'], ['Data Analyst', 'excel'], ['SQL', 'sql'], ['Power BI', 'powerbi'], ['Tableau', 'tableau'], ['Java', 'java'], ['Python', 'python'], ['GIS', 'gis'], ['Web Development', 'html']
].filter(([, course]) => getCourse(course)).map(([label, course]) => ({ label, course }));
export const COACH_TOPICS = ['Grammar correction', 'Workplace English', 'Recruiter communication', 'Interview sentences', 'Speaking practice'];
export const METRICS = { fluency: 'English Fluency', grammar: 'Grammar', confidence: 'Confidence (delivery)', clarity: 'Clarity', pronunciation: 'Pronunciation', vocabulary: 'Vocabulary', content: 'Content Quality', readiness: 'Interview Readiness' };
export const TEXT_METRICS = ['grammar', 'clarity', 'vocabulary', 'content', 'readiness'];
export const AUDIO_METRICS = ['fluency', 'confidence', 'pronunciation'];
export const MAX_TURNS = 10;
export const RUBRIC_VERSION = 1;
const bad = () => { throw new Error('The interview response was incomplete. Please try again.'); };
function text(value, max = 1000, required = true) { if (typeof value !== 'string' || (required && !value.trim()) || value.length > max) bad(); return value.trim(); }
function points(value) { if (!Number.isInteger(value) || value < 0 || value > 100) bad(); return value; }
function list(value, max = 6) { if (!Array.isArray(value) || value.length > max) bad(); return value.map(item => text(item, 400)); }

export function settingsFor(value) {
  const kind = ['introduction', 'mock', 'coach'].includes(value?.kind) ? value.kind : 'introduction';
  const mode = kind === 'coach' ? (COACH_TOPICS.includes(value?.mode) ? value.mode : COACH_TOPICS[0]) : (INTERVIEW_MODES.some(item => item.label === value?.mode) ? value.mode : 'HR');
  return { kind, mode, level: ['Beginner', 'Intermediate', 'Advanced'].includes(value?.level) ? value.level : 'Beginner', role: String(value?.role || 'Exploring careers').trim().slice(0, 100) };
}
export function openingQuestion(settings) {
  if (settings.kind === 'introduction') return 'Hello, welcome to MAGIVOX practice. Could you introduce yourself and tell me about your background?';
  if (settings.kind === 'coach') return ({ 'Grammar correction': 'Let’s practise English together. Could you describe what you did yesterday in two or three sentences?', 'Workplace English': 'Imagine I am your teammate. How would you update me on a task you are working on?', 'Recruiter communication': 'Imagine I am a recruiter inviting you to an interview. How would you reply to confirm your availability?', 'Interview sentences': 'Let’s build a clear interview answer. How would you describe one of your strengths?', 'Speaking practice': 'Let’s have a conversation in English. What is something you enjoy learning and why?' })[settings.mode];
  return settings.mode === 'HR' ? 'Hello, thank you for joining. Could you introduce yourself and explain what interests you about your target role?' : `Welcome to your ${settings.mode} interview. Could you describe your experience or learning so far in this area?`;
}
export function createInterview(settings, id) { const selected = settingsFor(settings); return { id, settings: selected, phase: 'active', turns: [], question: openingQuestion(selected) }; }
export function acceptTurn(session, answer, result, source = 'typed', rawAnswer = answer, recognition = null) {
  if (session.phase !== 'active' || session.turns.length >= MAX_TURNS) throw new Error('This session is not accepting answers.');
  session.turns.push({ question: session.question, answer: text(answer, 2000), rawAnswer: text(rawAnswer, 2000), recognition, feedback: result.feedback, nextQuestion: result.question, audio: result.audio, source, skipped: false }); session.question = result.question;
}
export function skipTurn(session, result) {
  if (session.phase !== 'active' || session.turns.length >= MAX_TURNS) throw new Error('This session is not accepting answers.');
  session.turns.push({ question: session.question, answer: '', feedback: result.feedback, nextQuestion: result.question, skipped: true, source: 'skipped', audio: null }); session.question = result.question;
}
export function retryLastAnswer(session) {
  if (!['active', 'paused'].includes(session.phase) || !session.turns.length) return false;
  const last = session.turns.pop(); session.question = last.question; return true;
}
export function normalizeTurn(raw, hasAudio = false, previousQuestions = []) {
  const question = text(raw?.question, 700), feedback = text(raw?.feedback, 900);
  if ((question.match(/\?/g) || []).length !== 1 || !question.endsWith('?') || feedback.includes('?') || previousQuestions.some(item => item.toLowerCase().trim() === question.toLowerCase())) bad();
  let audio = null;
  if (hasAudio && raw.audio && raw.audio.assessed === true) {
    audio = { evidence: text(raw.audio.evidence, 600) }; AUDIO_METRICS.forEach(key => audio[key] = points(raw.audio[key]));
  }
  return { feedback, question, audio };
}
export function normalizeReport(raw, turns) {
  const answered = turns.filter(turn => !turn.skipped);
  if (answered.length < 2) throw new Error('Answer at least two questions for a scored report.');
  const metrics = {}; TEXT_METRICS.forEach(key => metrics[key] = points(raw?.metrics?.[key]));
  const spoken = answered.filter(turn => turn.audio);
  AUDIO_METRICS.forEach(key => metrics[key] = spoken.length ? Math.round(spoken.reduce((sum, turn) => sum + turn.audio[key], 0) / spoken.length) : null);
  const source = answered.map(turn => turn.answer.toLowerCase()).join('\n');
  if (!Array.isArray(raw.corrections) || raw.corrections.length > 5 || !Array.isArray(raw.betterVocabulary) || raw.betterVocabulary.length > 5) bad();
  const corrections = raw.corrections.map(item => ({ original: text(item.original, 250), corrected: text(item.corrected, 350), reason: text(item.reason, 300) })).filter(item => source.includes(item.original.toLowerCase()));
  const betterVocabulary = raw.betterVocabulary.map(item => ({ original: text(item.original, 100), suggested: text(item.suggested, 150), reason: text(item.reason, 200) })).filter(item => source.includes(item.original.toLowerCase()));
  const assessed = Object.values(metrics).filter(value => value !== null);
  return { rubricVersion: RUBRIC_VERSION, metrics, score: Math.round(assessed.reduce((sum, n) => sum + n, 0) / assessed.length), textScore: Math.round(TEXT_METRICS.reduce((sum, key) => sum + metrics[key], 0) / TEXT_METRICS.length), audioAnswers: spoken.length, answered: answered.length, summary: text(raw.summary, 800), mistakes: list(raw.mistakes), corrections, betterVocabulary, strongPoints: list(raw.strongPoints), weakPoints: list(raw.weakPoints), improvedIntroduction: text(raw.improvedIntroduction, 1400), improvementPlan: list(raw.improvementPlan, 7), fillerFeedback: fillerFeedback(answered) };
}
export function fillerFeedback(turns) {
  const text = turns.map(turn => turn.answer).join(' ').toLowerCase();
  const counts = Object.fromEntries(['um', 'uh', 'erm', 'you know', 'i mean'].map(phrase => [phrase, (text.match(new RegExp(`\\b${phrase}\\b`, 'g')) || []).length]).filter(([, count]) => count > 0));
  return { counts, total: Object.values(counts).reduce((sum, n) => sum + n, 0), note: 'Counts come from the submitted transcript. Transcription may omit fillers; phrases can also be intentional. Practise a short pause instead of repeating a filler.' };
}
export function compareAttempt(current, history) {
  const index = history.findIndex(item => item.id === current.id);
  const earlier = index < 0 ? history : history.slice(0, index);
  const previous = [...earlier].reverse().find(item => item.id !== current.id && item.report?.rubricVersion === RUBRIC_VERSION && item.kind === current.kind && item.mode === current.mode && item.level === current.level && item.role === current.role && Number.isFinite(item.report.textScore));
  return previous ? { previous, delta: current.report.textScore - previous.report.textScore } : null;
}
export function validPracticeReport(value) {
  try {
    if (!value || value.rubricVersion !== RUBRIC_VERSION) return false;
    points(value.score); points(value.textScore);
    for (const key of Object.keys(METRICS)) { if (value.metrics[key] === null && AUDIO_METRICS.includes(key)) continue; points(value.metrics[key]); }
    for (const key of ['summary', 'improvedIntroduction']) text(value[key], 2000);
    for (const key of ['mistakes', 'strongPoints', 'weakPoints', 'improvementPlan']) list(value[key], 7);
    if (!Number.isInteger(value.audioAnswers) || value.audioAnswers < 0 || !Number.isInteger(value.answered) || value.answered < 2 || value.answered > MAX_TURNS || value.audioAnswers > value.answered) return false;
    if (!Array.isArray(value.corrections) || value.corrections.length > 5 || !Array.isArray(value.betterVocabulary) || value.betterVocabulary.length > 5) return false;
    value.corrections.forEach(item => { text(item.original, 250); text(item.corrected, 350); text(item.reason, 300); });
    value.betterVocabulary.forEach(item => { text(item.original, 100); text(item.suggested, 150); text(item.reason, 200); });
    text(value.fillerFeedback.note, 600);
    return value.fillerFeedback.counts && Object.entries(value.fillerFeedback.counts).every(([word, count]) => ['um', 'uh', 'erm', 'you know', 'i mean'].includes(word) && Number.isInteger(count) && count >= 0);
  } catch { return false; }
}
export function sessionTranscript(session) { return session.turns.map(turn => `AI: ${turn.question}\n${turn.skipped ? 'YOU: [Skipped]' : `YOU (raw): ${turn.rawAnswer || turn.answer}\nYOU (corrected): ${turn.answer}`}\nAI feedback: ${turn.feedback}`).join('\n\n'); }
