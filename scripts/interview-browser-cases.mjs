import { resolve } from 'node:path';
export const interviewMock = `
function interviewMockResult(options,prompt) {
  if (options.systemInstruction?.includes('MAGIVOX Resume AI Assistant')) return JSON.stringify({answer:'This wording uses only the supplied resume facts.',improvedText:'Entry-level data analyst with practical experience using Excel, SQL, Power BI and Tableau in academic projects.',recommendations:['Add measurable outcomes only when you can verify them.']});
  if (options.systemInstruction?.includes('careful resume writing teacher')) return JSON.stringify({summary:'Your resume has relevant analytics skills and needs more specific project evidence.',strengths:['Relevant SQL and Power BI skills are present.'],issues:[{original:'made power bi sales dashboard',correction:'Built a Power BI sales dashboard using sample sales data.',reason:'Uses a clear action verb without inventing an outcome.'}],missingInformation:['Add a project date if true.'],jobFit:{matchedSkills:['SQL','Power BI'],gaps:['Python'],summary:'Some role keywords match; verify every missing skill before adding it.'},revisedResume:'Test Learner\\nlearner@example.com\\nSkills: Excel, SQL, Power BI\\nProject: Built a Power BI sales dashboard using sample sales data.'});
  if (options.systemInstruction?.includes("audio transcription engine")) {
    const hint=Array.isArray(prompt) ? prompt[1]?.text || '' : '';
    const text=hint.includes('Java Java JavaScript') ? "I'm from Java Java JavaScript. I'm recently graduated in Port CSS College." : 'My name is Test Learner. I recently graduated from college.';
    return JSON.stringify({text,audio:{assessed:true,fluency:75,confidence:70,pronunciation:80,evidence:'Audible phrases were understandable in this test sample.'}});
  }
  if (!options.systemInstruction?.includes("conversational English interviewer")) return '';
  if (options.generationConfig?.responseSchema?.properties?.metrics) {
    if(window.__reportFails) throw new Error('report unavailable');
    return JSON.stringify({metrics:{grammar:75,clarity:80,vocabulary:70,content:80,readiness:70},summary:'You explained your learning clearly.',mistakes:['Use specific examples.'],corrections:[],betterVocabulary:[],strongPoints:['A clear learning goal.'],weakPoints:['Give more project detail.'],improvedIntroduction:'I am learning SQL and building my skills. [Add your real project.]',improvementPlan:['Practise one introduction for two minutes tomorrow.']});
  }
  const n=window.__turnNumber=(window.__turnNumber||0)+1;
  return JSON.stringify({feedback:'Thank you. That helps me understand your experience.',question:'What did you learn from example number '+n+'?',audio:{assessed:Array.isArray(prompt),fluency:75,confidence:70,pronunciation:80,evidence:'Audible phrases were understandable in this test sample.'}});
}
`;

export async function checkInterviewFlows({ page, base, check, output }) {
  await page.evaluate(() => { localStorage.removeItem('magivoxMode'); localStorage.removeItem('__mockUserDocument'); });
  await page.addInitScript(() => {
    window.__spoken = []; window.__voiceCancels = 0; window.__voiceMicOverlap = false; window.__speechLogs = [];
    const nativeInfo = console.info.bind(console);
    console.info = (...values) => { window.__speechLogs.push(values.map(value => String(value)).join(' ')); nativeInfo(...values); };
    let currentUtterance = null;
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      getVoices: () => [],
      cancel: () => { window.__voiceCancels++; const current = currentUtterance; currentUtterance = null; window.__speaking = false; current?.onerror?.({ error: 'canceled' }); },
      speak: utterance => { currentUtterance = utterance; window.__speaking = true; window.__spoken.push({ text: utterance.text, language: utterance.lang, rate: utterance.rate, voice: utterance.voice?.name }); setTimeout(() => { if (currentUtterance === utterance) { currentUtterance = null; window.__speaking = false; utterance.onend?.(); } }, 25); }
    } });
    class FinalSpeechRecognition {
      constructor() { this.phrases = []; }
      start() { this.ended = false; window.__recognition = this; }
      stop() { if (!this.ended) { this.ended = true; queueMicrotask(() => this.onend?.()); } }
      abort() { this.stop(); }
      emitInterim(text) { if (this.ended) return; const result = [{ transcript: text }]; result.isFinal = false; this.onresult?.({ resultIndex: 0, results: [result] }); }
      emitFinal(text, confidence = 0.92) { if (this.ended) return; const result = [{ transcript: text, confidence }]; result.isFinal = true; this.onresult?.({ resultIndex: 0, results: [result] }); this.stop(); }
    }
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: FinalSpeechRecognition });
    Object.defineProperty(window, 'webkitSpeechRecognition', { configurable: true, value: FinalSpeechRecognition });
    Object.defineProperty(window, 'SpeechRecognitionPhrase', { configurable: true, value: class { constructor(phrase, boost) { this.phrase = phrase; this.boost = boost; } } });
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async options => {
      if (window.__denyMic) throw new DOMException('Permission denied', 'NotAllowedError');
      if (window.__speaking) window.__voiceMicOverlap = true;
      const stream = await original(options); (window.__streams ||= []).push(stream); return stream;
    };
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/workspace.html?tool=interview`); await page.waitForSelector('#startInterview');
  await page.locator('#startInterview').click(); check((await page.locator('#interviewStatus').innerText()).includes('Agree'), 'Interview requires AI consent');
  await page.evaluate(() => window.__denyMic = true); await page.locator('#interviewConsent').check(); await page.locator('#startInterview').click();
  check(await page.locator('.interview-bubble.assistant').count() === 1, 'Start asks the first English question');
  await page.waitForFunction(() => document.querySelector('[data-status]').textContent.includes('denied'));
  check(await page.evaluate(() => window.__spoken.length > 0 && window.__spoken.every(item => item.language.startsWith('en') && Math.abs(item.rate - 0.96) < 0.01)), 'Interview automatically uses dynamic English speech synthesis');
  check(await page.locator('#interviewAnswer').isEnabled(), 'Microphone denial safely leaves typed answers available');
  await page.evaluate(() => window.__denyMic = false); await page.locator('[data-record]').click();
  await page.waitForFunction(() => document.querySelector('#voiceCycleState').textContent.startsWith('Listening') && window.__recognition); await page.waitForTimeout(650);
  check(await page.evaluate(() => window.__recognition.lang === 'en-IN' && window.__recognition.maxAlternatives === 3 && window.__recognition.phrases.some(item => item.phrase === 'Test Learner') && !window.__recognition.phrases.some(item => ['SQL', 'Java', 'JavaScript', 'CSS', 'Python'].includes(item.phrase))), 'Speech recognition uses Indian English and profile-name bias without global technical-word contamination');
  const turnsBeforeSpeech = await page.evaluate(() => window.__calls.filter(call => call.action === 'ai' && call.system.includes('conversational English')).length);
  await page.evaluate(() => window.__recognition.emitInterim('This partial phrase must not submit')); await page.waitForTimeout(100);
  check(await page.evaluate(before => window.__calls.filter(call => call.action === 'ai' && call.system.includes('conversational English')).length === before, turnsBeforeSpeech), 'Interim speech-recognition text never submits an interview turn');
  await page.evaluate(() => window.__recognition.emitFinal('My final browser speech transcript describes a SQL practice project.'));
  await page.waitForFunction(() => document.querySelector('#turnCounter').textContent.startsWith('1 answered'));
  check(await page.evaluate(() => window.__streams[0].getTracks().every(track => track.readyState === 'ended')), 'Final speech result ends and releases the MediaRecorder microphone stream');
  await page.waitForFunction(() => document.querySelector('#voiceCycleState').textContent.startsWith('Listening') && (window.__streams?.length || 0) >= 2);
  check(await page.evaluate(() => !window.__voiceMicOverlap), 'Microphone never listens while the AI is speaking');
  check(await page.evaluate(() => !window.__calls.some(item => item.action === 'ai' && item.system.includes('audio transcription engine'))), 'Reliable final speech avoids a separate AI transcription request');
  check(await page.evaluate(() => { const turns = window.__calls.filter(call => call.action === 'ai' && call.system.includes('conversational English')); const turn = turns[0]; return turns.length === 1 && Array.isArray(turn.prompt) && turn.prompt[1].text.includes('final browser speech transcript'); }), 'Validated browser speech and audio reach the conversational interviewer in one request');
  check(await page.evaluate(() => window.__calls.find(call => call.system.includes('conversational English')).model === 'gemini-3.5-flash-lite'), 'Conversational turns use the supported high-volume Flash-Lite model');
  check(await page.evaluate(before => window.__calls.filter(call => call.action === 'ai' && call.system.includes('conversational English')).length === before + 1, turnsBeforeSpeech), 'Final speech produces exactly one interview submission');
  check(await page.locator('#interviewReport').isHidden(), 'A single answer produces a follow-up rather than a final score');
  check((await page.locator('.interview-bubble.assistant').last().innerText()).includes('What role are you currently preparing for?'), 'Unstated role triggers the exact clarification instead of an invented role');
  check(await page.evaluate(() => window.__spoken.some(item => item.text.includes('What role are you currently preparing for?'))), 'Role clarification is spoken automatically before listening resumes');
  check(await page.evaluate(() => ['Raw transcript:', 'Final transcript:', 'Corrected transcript:', 'Recognition language: en-IN', 'Confidence:', 'Submitted transcript:'].every(label => window.__speechLogs.some(line => line.includes(label)))), 'Development logs retain raw, final, normalized, language, confidence and submitted text');
  check(await page.evaluate(() => !document.querySelector('#interviewTranscript').textContent.includes('Frontend Developer')), 'Interviewer does not invent a Frontend Developer role from unclear speech');
  await page.waitForTimeout(650); await page.evaluate(() => window.__recognition.emitFinal('My name might be unclear', 0.2));
  await page.waitForFunction(() => document.querySelector('#answerSource').textContent.includes('I may not have heard that correctly. Please say that again.'));
  check((await page.locator('#turnCounter').innerText()).startsWith('1 answered') && await page.locator('[data-discard]').isEnabled(), 'Low-confidence final speech is kept for review and does not auto-submit');
  await page.locator('[data-discard]').click(); await page.waitForFunction(() => window.__recognition && !window.__recognition.ended); await page.waitForTimeout(650);
  const callsBeforeNonsense = await page.evaluate(() => window.__calls.filter(call => call.system?.includes('conversational English')).length);
  await page.evaluate(() => window.__recognition.emitFinal("I'm from Java Java JavaScript. I'm recently graduated in Port CSS College.", 0.91));
  await page.waitForFunction(() => document.querySelector('#answerSource').textContent.includes('Please say that again.'));
  check(await page.evaluate(() => window.__calls.some(item => item.action === 'ai' && item.system.includes('audio transcription engine'))), 'Suspicious speech uses AI audio verification only when needed');
  check(await page.evaluate(before => window.__calls.filter(call => call.system?.includes('conversational English')).length === before, callsBeforeNonsense), 'Technology-heavy nonsensical AI transcript is blocked before the interview AI');
  await page.locator('#interviewMic').uncheck();
  const beforeRetry = await page.evaluate(() => window.__calls.length); await page.evaluate(() => window.__failNextAI = 1);
  await page.locator('#interviewAnswer').fill('I practised joins on a small SQL table.'); await page.locator('#sendInterviewAnswer').click();
  await page.waitForFunction(() => document.querySelector('#turnCounter').textContent.startsWith('2 answered'));
  check(await page.evaluate(before => window.__calls.slice(before).filter(call => call.action === 'ai' && call.system.includes('conversational English')).length === 2, beforeRetry), 'A transient Firebase network failure retries the interview turn once');
  check(await page.evaluate(() => window.__calls.filter(call => call.action === 'ai').at(-1).prompt.includes('final browser speech transcript')), 'Second turn includes the first validated voice answer and question');
  page.once('dialog', dialog => dialog.accept()); await page.locator('#retryInterviewAnswer').click();
  check((await page.locator('#turnCounter').innerText()).startsWith('1 answered'), 'Retry Answer removes the previous turn from scoring');
  await page.locator('#interviewAnswer').fill('I improved my example by explaining both matching tables.');
  await page.evaluate(() => window.__aiFails = true); await page.locator('#sendInterviewAnswer').click();
  await page.waitForFunction(() => document.querySelector('#interviewStatus').textContent.includes('kept'));
  check((await page.locator('#interviewAnswer').inputValue()).includes('matching tables'), 'Failed interview turn preserves the answer');
  await page.evaluate(() => { window.__aiFails = false; window.__holdAI = true; }); await page.locator('#sendInterviewAnswer').click(); await page.waitForFunction(() => typeof window.__releaseAI === 'function'); await page.locator('#pauseInterview').click();
  await page.evaluate(() => { window.__holdAI = false; window.__releaseAI(); }); await page.waitForTimeout(100);
  check((await page.locator('#turnCounter').innerText()).startsWith('1 answered') && (await page.locator('#sessionPhase').innerText()) === 'Paused', 'Pause rejects late AI responses without appending duplicate turns');
  await page.evaluate(() => window.__aiDelay = 0); await page.locator('#pauseInterview').click(); await page.locator('#sendInterviewAnswer').click();
  await page.waitForFunction(() => document.querySelector('#turnCounter').textContent.startsWith('2 answered'));
  await page.locator('#skipInterview').click(); await page.waitForFunction(() => document.querySelector('#turnCounter').textContent.includes('3/10'));
  check((await page.locator('#turnCounter').innerText()).startsWith('2 answered'), 'Skipped question does not count as an answer');
  await page.locator('#interviewMic').check(); await page.waitForTimeout(550); await page.locator('#pauseInterview').click();
  await page.waitForFunction(() => window.__streams.every(stream => stream.getTracks().every(track => track.readyState === 'ended')));
  check(await page.locator('[data-record]').isDisabled(), 'Pause stops microphone and disables recording');
  await page.evaluate(() => window.__reportFails = true); await page.locator('#endInterview').click(); await page.waitForSelector('#retryInterviewReport');
  check(await page.evaluate(() => !window.__calls.some(call => call.action === 'save')), 'Failed final report does not save a fabricated score');
  await page.evaluate(() => { window.__reportFails = false; window.__saveFails = true; }); await page.locator('#retryInterviewReport').click();
  await page.waitForFunction(() => document.querySelector('#interviewSaveStatus')?.textContent.includes('could not be saved'));
  check(await page.locator('.interview-metrics article').count() === 8, 'Final report includes all eight requested measures');
  check((await page.locator('#interviewReport').innerText()).includes('Pronunciation') && !(await page.locator('.interview-metrics').innerText()).includes('Not assessed'), 'Recorded evidence supplies speech scores');
  await page.evaluate(() => window.__saveFails = false); await page.locator('#saveInterviewReport').click();
  await page.waitForFunction(() => document.querySelector('#interviewSaveStatus').textContent.includes('saved to your account'));
  check(await page.evaluate(() => { const data = window.__calls.filter(call => call.action === 'save').at(-1).data; const entry = data.appState.interviewSessions.at(-1); return entry.answered === 2 && entry.report && !JSON.stringify(entry).includes('base64') && !Object.hasOwn(entry, 'turns'); }), 'History saves the full feedback report without raw audio or full transcript');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: resolve(output, 'interview-desktop.png'), fullPage: true });
  await page.reload(); await page.waitForSelector('[data-interview-history]'); check(await page.locator('[data-interview-history]').count() === 1, 'Saved interview history reloads through existing user document');
  await page.locator('#interviewConsent').check(); await page.locator('#interviewMuteVoice').check(); await page.locator('#interviewMic').uncheck(); await page.locator('#startInterview').click();
  for (const [index, answer] of ['I am learning SQL and practising my introduction.', 'I built a practice project and learned to explain it.'].entries()) {
    await page.locator('#interviewAnswer').fill(answer); await page.locator('#sendInterviewAnswer').click(); await page.waitForFunction(expected => document.querySelector('#turnCounter').textContent.startsWith(`${expected} answered`), index + 1);
  }
  await page.locator('#endInterview').click(); await page.waitForFunction(() => document.querySelector('#interviewSaveStatus')?.textContent.includes('saved to your account'));
  check((await page.locator('.interview-comparison').innerText()).includes('previous matching attempt'), 'History compares matching sessions on stable text metrics');
  check((await page.locator('.interview-metrics').innerText()).includes('Not assessed'), 'Typed-only report leaves speech measures unassessed');
  await page.locator('#interviewKind').selectOption('mock'); check(await page.locator('#interviewMode option').count() === 9, 'Mock Interview exposes all nine catalogue-backed modes');
  await page.locator('#interviewMode').selectOption('SQL'); await page.locator('#startInterview').click(); check((await page.locator('#interviewTranscript').innerText()).includes('SQL interview'), 'Mock mode starts a relevant role interview');
  await page.locator('#endInterview').click(); check((await page.locator('#interviewStatus').innerText()).includes('No score was saved'), 'Empty sessions end without invented results');
  await page.locator('#interviewKind').selectOption('coach'); await page.locator('#interviewMode').selectOption('Recruiter communication'); await page.locator('#interviewLevel').selectOption('Advanced'); await page.locator('#startInterview').click();
  check((await page.locator('#interviewTranscript').innerText()).includes('recruiter'), 'English Coach begins the selected communication scenario');
  await page.locator('#interviewAnswer').fill('Thank you for inviting me. I am available on Monday.'); await page.locator('#sendInterviewAnswer').click();
  await page.waitForFunction(() => document.querySelector('#turnCounter').textContent.startsWith('1 answered'));
  check(await page.evaluate(() => window.__calls.filter(call => call.action === 'ai').at(-1).system.includes('Advanced')), 'Coach sends the chosen learning level to the existing AI client');
  await page.setViewportSize({ width: 390, height: 844 });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Interview and coach fit the mobile viewport');
  await page.screenshot({ path: resolve(output, 'interview-mobile.png'), fullPage: true });
  await page.locator('#endInterview').click(); check((await page.locator('#interviewStatus').innerText()).includes('at least two'), 'Single-answer practice ends without a premature overall score');
}

