import { requestAI, canConnect, friendlyAIError, isAIQuotaError } from './ai-client.js';

export const AI_UNAVAILABLE_MESSAGE = 'MAGIVOX AI is temporarily unavailable. Your work has been saved. Please retry later.';

const OPERATIONS = Object.freeze({
  teacher: { path:'/chat', fields:['message','history','language','level','mode','course','topic','performance','targetRole','consent'] },
  help: { path:'/support', fields:['message','history','language','consent'] },
  interviewReview: { path:'/interview', fields:['question','answer','targetRole','language','consent'] },
  interviewTurn: { path:'/interview-turn', fields:['settings','turns','question','answer','skipped','audioAssessment','recording','consent'] },
  interviewReport: { path:'/interview-report', fields:['settings','turns','consent'] },
  resumeReview: { path:'/resume', fields:['resume','jobDescription','question','language','history','consent'] },
  resumeAssist: { path:'/resume-assist', fields:['action','question','resume','jobDescription','history','consent'] },
  careerJob: { path:'/career-job', fields:['action','question','job','evidence','history','language','consent'] },
  examReview: { path:'/exam', fields:['course','label','written','language','consent'] },
  transcription: { path:'/transcribe', fields:['base64','mime','language','recognitionLanguage','browserTranscript','context','consent'] }
});

const activeRequests = new Map();

export function conversationHistory(messages, { maxMessages = 16, maxCharacters = 18000 } = {}) {
  const kept = [];
  let characters = 0;
  for (const item of (Array.isArray(messages) ? messages : []).slice(-maxMessages).reverse()) {
    if (!['user','assistant'].includes(item?.role) || typeof item.content !== 'string') continue;
    const content = item.content.trim().slice(0, 8000);
    if (!content || characters + content.length > maxCharacters) continue;
    kept.unshift({ role:item.role, content });
    characters += content.length;
  }
  return kept;
}

function scopedPayload(operation, payload = {}) {
  const config = OPERATIONS[operation];
  if (!config) throw new Error('This MAGIVOX AI action is not available.');
  const scoped = {};
  for (const field of config.fields) if (payload[field] !== undefined) scoped[field] = payload[field];
  if ('history' in scoped) scoped.history = conversationHistory(scoped.history);
  return { path:config.path, payload:scoped };
}

function requestKey(operation, payload, user) {
  const compact = (value, depth = 0) => {
    if (depth > 4) return '[nested]';
    if (typeof value === 'string') return value.length > 500 ? `${value.slice(0,180)}:${value.length}:${value.slice(-80)}` : value;
    if (Array.isArray(value)) return value.slice(-12).map(item => compact(item, depth + 1));
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, compact(value[key], depth + 1)]));
    return value;
  };
  return `${user?.uid || 'guest'}:${operation}:${JSON.stringify(compact(payload))}`;
}

export async function requestMAGIVOXAI(operation, payload, user, signal, options = {}) {
  const scoped = scopedPayload(operation, payload);
  const key = requestKey(operation, scoped.payload, user);
  if (activeRequests.has(key)) {
    const error = new Error('This MAGIVOX AI request is already processing.');
    error.code = 'MAGIVOX_AI_DUPLICATE';
    throw error;
  }
  const transport = options.transport || requestAI;
  const work = transport(scoped.path, scoped.payload, user, signal);
  activeRequests.set(key, work);
  try {
    return await work;
  } catch (error) {
    const normalized = error?.name === 'AbortError' || String(error?.code || '').startsWith('MAGIVOX_AI_') ? error : friendlyAIError(error);
    if (isAIQuotaError(normalized)) {
      normalized.message = AI_UNAVAILABLE_MESSAGE;
      normalized.code = 'MAGIVOX_AI_QUOTA';
    }
    throw normalized;
  } finally {
    if (activeRequests.get(key) === work) activeRequests.delete(key);
  }
}

export { canConnect, isAIQuotaError };

export function aiOperationNames() { return Object.keys(OPERATIONS); }
