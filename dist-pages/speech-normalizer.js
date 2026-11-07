export const SPEECH_LANGUAGE = 'en-IN';
export const LOW_RECOGNITION_CONFIDENCE = 0.6;
export const UNCERTAIN_RECOGNITION_CONFIDENCE = 0.75;
export const MAGIVOX_VOCABULARY = ['SQL', 'Power BI', 'Tableau', 'Excel', 'Python', 'Java', 'Data Analyst', 'Data Analytics', 'GIS', 'HTML', 'CSS', 'JavaScript'];

const TERM_RULES = [
  [/\bpower\s+(?:b\s*i|be\s*eye|bee\s*eye|bi)\b/gi, 'Power BI'],
  [/\bdata\s+analytics\b/gi, 'Data Analytics'],
  [/\bdata\s+(?:analyst|analist)\b/gi, 'Data Analyst'],
  [/\bjava\s*script\b/gi, 'JavaScript'],
  [/\bh[ .-]*t[ .-]*m[ .-]*l\b/gi, 'HTML'],
  [/\bc[ .-]*s[ .-]*s\b/gi, 'CSS'],
  [/\bg[ .-]*i[ .-]*s\b/gi, 'GIS'],
  [/\b(?:s[ .-]*q[ .-]*l|sequel)\b/gi, 'SQL'],
  [/\b(?:tableau|tablo|tablow)\b/gi, 'Tableau'],
  [/\b(?:excel|exel|xcel)\b/gi, 'Excel'],
  [/\b(?:python|pyton|pithon)\b/gi, 'Python'],
  [/\bjava\b/gi, 'Java']
];
const SKILL_CONTEXT = /\b(?:know|learn(?:ed|ing)?|study(?:ing|ied)?|skill|technolog(?:y|ies)|tools?|experience|work(?:ed|ing)?\s+(?:with|in|on)|use[sd]?|completed|course|project|proficient|familiar|prepar(?:e|ing)\s+for|role|developer|engineer|analyst|programming|coding|database|dashboard|data|web)\b/i;
const PERSONAL_CONTEXT = /\b(?:my\s+name|i\s*(?:am|'m)\s+from|graduat(?:e|ed)|college|fresher|background)\b/i;
const TECH_TERM = /\b(?:java(?:script)?|css|html|python|sql|excel|power\s*bi|tableau|gis|data\s+anal(?:yst|ytics))\b/gi;

function compact(value) { return String(value || '').toLowerCase().replace(/[^a-z]/g, ''); }
function distance(left, right) {
  const a = compact(left), b = compact(right), row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j], cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + cost); diagonal = above;
    }
  }
  return row[b.length];
}

function similarKnownName(heard, known) {
  const a = compact(heard), b = compact(known);
  if (!a || !b || Math.abs(a.length - b.length) > 2) return false;
  const initialMatches = a[0] === b[0] || ('kcq'.includes(a[0]) && 'kcq'.includes(b[0]));
  return initialMatches && distance(a, b) <= Math.max(1, Math.floor(b.length * 0.3));
}

function profileFirstName(profileName) {
  const saved = String(profileName || '').trim().split(/\s+/)[0] || '';
  return /^[a-z]+$/i.test(saved) ? `${saved.charAt(0).toUpperCase()}${saved.slice(1).toLowerCase()}` : saved;
}

export function normalizeSpeechTranscript(rawTranscript, { profileName = '' } = {}) {
  const raw = String(rawTranscript || '').trim(); let corrected = raw; const changes = [];
  const knownFirstName = profileFirstName(profileName);
  if (knownFirstName) {
    corrected = corrected.replace(/\b(my\s+name\s+is\s+)([a-z][a-z'-]{1,30})\b/i, (match, prefix, heard) => {
      if (!similarKnownName(heard, knownFirstName)) return match;
      if (heard !== knownFirstName) changes.push({ type: 'profile-name', from: heard, to: knownFirstName });
      return `${prefix}${knownFirstName}`;
    });
  }
  if (SKILL_CONTEXT.test(corrected)) {
    for (const [pattern, canonical] of TERM_RULES) {
      corrected = corrected.replace(pattern, heard => {
        if (heard !== canonical) changes.push({ type: 'technical-term', from: heard, to: canonical });
        return canonical;
      });
    }
  }
  return { raw, corrected, changes };
}

export function assessSpeechReliability({ raw = '', corrected = '', confidence = null, profileName = '' } = {}) {
  if (Number.isFinite(confidence) && confidence < LOW_RECOGNITION_CONFIDENCE) return { reliable: false, reason: 'low-confidence' };
  const source = String(raw).trim(), words = source.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
  if (!source || words.length < 2) return { reliable: false, reason: 'too-little-speech' };
  const counts = words.reduce((result, word) => result.set(word, (result.get(word) || 0) + 1), new Map());
  if ([...counts.values()].some(count => count >= 4 && count / words.length >= 0.5)) return { reliable: false, reason: 'repeated-recognition' };
  const knownName = profileFirstName(profileName), heardName = source.match(/\bmy\s+name\s+is\s+([a-z][a-z'-]{1,30})\b/i)?.[1];
  if (knownName && heardName && !similarKnownName(heardName, knownName)) return { reliable: false, reason: 'profile-name-mismatch' };
  const technicalMentions = String(corrected).match(TECH_TERM) || [];
  if (technicalMentions.length >= 2 && PERSONAL_CONTEXT.test(source) && !SKILL_CONTEXT.test(source)) return { reliable: false, reason: 'technical-hallucination' };
  if (technicalMentions.length >= 3 && !SKILL_CONTEXT.test(source)) return { reliable: false, reason: 'technical-hallucination' };
  if (String(corrected).length > 0 && (String(corrected).match(/[\p{L}\p{N}]/gu) || []).length / String(corrected).length < 0.45) return { reliable: false, reason: 'garbled-recognition' };
  return { reliable: true, reason: '' };
}

export function logSpeechRecognition({ raw, final = raw, corrected, language = SPEECH_LANGUAGE, confidence = null }) {
  console.info('Raw transcript:', raw);
  console.info('Final transcript:', final);
  console.info('Corrected transcript:', corrected);
  console.info('Recognition language:', language);
  console.info('Confidence:', Number.isFinite(confidence) ? confidence.toFixed(3) : 'unavailable');
}
